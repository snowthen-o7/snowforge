"""The loop dashboard: a local page over the loops' events (tools/loop/dashboard/README section).

    python tools/loop/dashboard/server.py [--port 8787] [--root <folder with the loop checkouts>]

Binds to 127.0.0.1 only. Reads files; its one write is appending a task line (queue.py).
A Monitor thread polls every loop's events.jsonl and the current session's stream once a
second, keeps a snapshot per loop, and pushes changes to /api/events subscribers (SSE).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import queue as queue_mod
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
if __name__ == "__main__":  # `python tools/loop/dashboard/server.py`: make the `tools` package importable
    sys.path.insert(0, str(HERE.parents[2]))


from tools.loop.dashboard import events as ev
from tools.loop.dashboard import loops as discovery
from tools.loop.dashboard import taskqueue as tasks
from tools.loop.dashboard import tail as tailing

TAIL_LIMIT = 300
MAX_BODY = 1 << 20
_ROUTE = re.compile(r"^/api/loops/([^/]+)/(session|iterations|queue|tasks)$")


class Watch:
    def __init__(self, loop: discovery.Loop):
        self.loop = loop
        self.events: list[dict] = []
        self.offset = 0
        self.parse_errors = 0
        self.stream: Path | None = None
        self.stream_offset = 0
        self.tail: list[dict] = []
        self.snapshot: dict | None = None
        self.snapshot_json = ""

    def events_path(self) -> Path:
        return self.loop.log_dir / "events.jsonl"

    def last_activity(self) -> dt.datetime | None:
        candidates = [self.events_path(), self.stream]
        gates = sorted(self.loop.log_dir.glob("gate-*.log*"), key=lambda p: p.stat().st_mtime if p.exists() else 0)
        if gates:
            candidates.append(gates[-1])
        times = [p.stat().st_mtime for p in candidates if p is not None and p.exists()]
        return dt.datetime.fromtimestamp(max(times), ev.UTC) if times else None


class Monitor(threading.Thread):
    def __init__(self, root: Path, poll_s: float = 1.0, rescan_s: float = 30.0):
        super().__init__(daemon=True)
        self.root = root
        self.poll_s = poll_s
        self.rescan_s = rescan_s
        self.watches: dict[str, Watch] = {}
        self.lock = threading.Lock()
        self.subscribers: list[queue_mod.Queue] = []
        self._halt = threading.Event()  # not `_stop`: that name belongs to threading.Thread
        self._last_scan = 0.0
        self.rescan()

    # --- discovery ---------------------------------------------------------------------------
    def rescan(self) -> None:
        found = {l.name: l for l in discovery.discover(self.root)}
        with self.lock:
            for name in list(self.watches):
                if name not in found:
                    del self.watches[name]
                    self.publish("discovery", {"removed": name})
            for name, loop in found.items():
                if name in self.watches:
                    self.watches[name].loop = loop  # refreshed branch and warnings
                else:
                    self.watches[name] = Watch(loop)
                    self.publish("discovery", {"added": name})
        self._last_scan = time.monotonic()

    # --- polling -----------------------------------------------------------------------------
    def poll_once(self) -> None:
        if time.monotonic() - self._last_scan >= self.rescan_s:
            try:
                self.rescan()
            except Exception as error:  # keep the monitor alive; no single loop owns this
                self._last_scan = time.monotonic()
                print(f"loop dashboard: rescan error: {type(error).__name__}: {error}", file=sys.stderr)
        with self.lock:
            watches = list(self.watches.values())
        for w in watches:
            try:
                self._poll_watch(w)
                if any(x.startswith(("read error", "poll error")) for x in w.loop.warnings):
                    w.loop.warnings = [x for x in w.loop.warnings if not x.startswith(("read error", "poll error"))]
                    w.snapshot_json = ""  # recovered: republish with the warning gone
                    self._poll_watch(w)
            except OSError as error:
                self._warn(w, f"read error: {error}")
            except Exception as error:  # bad data must not kill the monitor thread
                self._warn(w, f"poll error: {type(error).__name__}: {error}")

    @staticmethod
    def _warn(w: Watch, message: str) -> None:
        w.loop.warnings = [x for x in w.loop.warnings if not x.startswith(("read error", "poll error"))] + [message]
        if w.snapshot is not None:  # the last good snapshot keeps being served; show why it is stale
            w.snapshot = dict(w.snapshot, warnings=list(w.loop.warnings))
            w.snapshot_json = ""  # republish once the data parses again

    def _poll_watch(self, w: Watch) -> None:
        path = w.events_path()
        size = path.stat().st_size if path.exists() else 0
        if size < w.offset:  # truncated or rotated
            w.events, w.offset, w.parse_errors = [], 0, 0
        new, w.offset, bad = ev.read_events(path, w.offset)
        w.events.extend(new)
        w.parse_errors += bad
        current = ev.current_iteration(w.events)
        wanted = self._stream_for(w, current)
        if wanted != w.stream:
            w.stream, w.stream_offset = wanted, 0
            w.tail = []
            if wanted and wanted.is_file():
                lines, used = tailing.split_complete(wanted.read_bytes())
                w.stream_offset = used
                rendered = [e for line in lines for e in tailing.render_line(line, w.loop.path, "")]
                w.tail = rendered[-TAIL_LIMIT:]
            self.publish("session", {"name": w.loop.name, "reset": True, "entries": w.tail})
        elif w.stream and w.stream.exists():
            with w.stream.open("rb") as handle:
                handle.seek(w.stream_offset)
                chunk = handle.read()
            lines, used = tailing.split_complete(chunk)
            if used:
                w.stream_offset += used
                stamp = dt.datetime.now().strftime("%H:%M")
                entries = [e for line in lines for e in tailing.render_line(line, w.loop.path, stamp)]
                if entries:
                    w.tail = (w.tail + entries)[-TAIL_LIMIT:]
                    self.publish("session", {"name": w.loop.name, "reset": False, "entries": entries})
        snap = self._snapshot(w, current)
        text = json.dumps(snap, sort_keys=True, default=str)
        if text != w.snapshot_json:
            w.snapshot, w.snapshot_json = snap, text
            self.publish("loop", snap)

    def _stream_for(self, w: Watch, current: dict | None) -> Path | None:
        if not current or not current.get("stream"):
            return None
        base = w.loop.path / current["stream"]
        opus = base.with_name(base.stem + "-opus.jsonl")
        if opus.exists() and (not base.exists() or opus.stat().st_mtime >= base.stat().st_mtime):
            return opus
        return base

    def _snapshot(self, w: Watch, current: dict | None) -> dict:
        now = dt.datetime.now(ev.UTC)
        its = ev.join_iterations(w.events)
        run = ev.run_summary(w.events)
        activity = w.last_activity()
        tasks_path = w.loop.path / "TASKS.md"
        q = tasks.parse_queue(tasks_path.read_text(encoding="utf-8", errors="replace")) if tasks_path.is_file() else []
        if current:
            try:
                elapsed = int((now - ev.parse_ts(current["started"])).total_seconds())
            except (ValueError, TypeError, KeyError):
                elapsed = None
            current = dict(current, elapsed_s=elapsed,
                           turns=sum(1 for e in w.tail if e["kind"] == "said"))
        return {"name": w.loop.name, "path": str(w.loop.path), "branch": w.loop.branch, "warnings": w.loop.warnings,
                "parse_errors": w.parse_errors, "state": ev.derive_state(w.events, now, activity), "run": run,
                "current": current, "totals": ev.totals(its, now, run["run"] if run else None), "queue": q,
                "last_activity": activity.isoformat() if activity else None, "iterations_count": len(its),
                "recent": its[:8]}

    def run(self) -> None:
        while not self._halt.is_set():
            self.poll_once()
            self._halt.wait(self.poll_s)

    def stop(self) -> None:
        self._halt.set()

    # --- reads used by the handler -----------------------------------------------------------
    def _watch(self, name: str) -> Watch | None:
        with self.lock:
            return self.watches.get(name)

    def snapshots(self) -> list[dict]:
        with self.lock:
            return [w.snapshot or self._snapshot(w, ev.current_iteration(w.events)) for w in self.watches.values()]

    def snapshot(self, name: str) -> dict | None:
        w = self._watch(name)
        return None if w is None else (w.snapshot or self._snapshot(w, ev.current_iteration(w.events)))

    def session(self, name: str) -> list[dict] | None:
        w = self._watch(name)
        return None if w is None else list(w.tail)

    def iterations(self, name: str) -> list[dict] | None:
        w = self._watch(name)
        return None if w is None else ev.join_iterations(w.events)

    def queue_info(self, name: str) -> dict | None:
        w = self._watch(name)
        if w is None:
            return None
        path = w.loop.path / "TASKS.md"
        text = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
        archive = w.loop.path / "TASKS-archive.md"
        archive_text = archive.read_text(encoding="utf-8", errors="replace") if archive.is_file() else ""
        return {"queue": tasks.parse_queue(text), "suggested_id": tasks.suggest_id(text, archive_text),
                "sha": tasks.file_sha(path), "path": str(path), "exists": path.is_file()}

    def add_task(self, name: str, body: dict) -> tuple[int, dict]:
        w = self._watch(name)
        if w is None:
            return 404, {"code": "unknown", "message": "no such loop"}
        try:
            out = tasks.append_task(w.loop.path, body, str(body.get("sha", "")))
        except tasks.QueueError as error:
            status = {"invalid": 400, "missing": 404}.get(error.code, 409)
            return status, {"code": error.code, "message": error.message}
        return 201, out

    # --- SSE ---------------------------------------------------------------------------------
    def subscribe(self) -> queue_mod.Queue:
        q: queue_mod.Queue = queue_mod.Queue(maxsize=1000)
        with self.lock:
            self.subscribers.append(q)
        return q

    def unsubscribe(self, q: queue_mod.Queue) -> None:
        with self.lock:
            if q in self.subscribers:
                self.subscribers.remove(q)

    def publish(self, kind: str, data: dict) -> None:
        payload = json.dumps(data, default=str)
        for q in list(self.subscribers):
            try:
                q.put_nowait((kind, payload))
            except queue_mod.Full:
                pass


class Handler(BaseHTTPRequestHandler):
    monitor: Monitor  # set by make_server
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # quiet
        pass

    def _send(self, status: int, body: bytes, ctype: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, obj) -> None:
        self._send(status, json.dumps(obj, default=str).encode("utf-8"))

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/":
            self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/loops":
            self._json(200, {"loops": self.monitor.snapshots(), "root": str(self.monitor.root)})
        elif path == "/api/events":
            self._sse()
        elif (m := _ROUTE.match(path)) and m.group(2) != "tasks":
            name, what = m.group(1), m.group(2)
            data = {"session": lambda: self.monitor.session(name), "iterations": lambda: self.monitor.iterations(name),
                    "queue": lambda: self.monitor.queue_info(name)}[what]()
            if data is None:
                self._json(404, {"code": "unknown", "message": "no such loop"})
            else:
                key = {"session": "entries", "iterations": "iterations", "queue": None}[what]
                self._json(200, data if key is None else {key: data})
        else:
            self._json(404, {"code": "not_found", "message": "no such route"})

    def do_POST(self) -> None:
        m = _ROUTE.match(self.path.split("?", 1)[0])
        if not m or m.group(2) != "tasks":
            self._json(404, {"code": "not_found", "message": "no such route"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = -1
        if length < 0:
            self._json(400, {"code": "invalid", "message": "bad Content-Length"})
            return
        if length > MAX_BODY:
            self._json(413, {"code": "too_large", "message": "body too large"})
            self.close_connection = True
            return
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            self._json(400, {"code": "invalid", "message": "body must be JSON"})
            return
        status, out = self.monitor.add_task(m.group(1), body if isinstance(body, dict) else {})
        self._json(status, out)

    def _sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        q = self.monitor.subscribe()
        try:
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()
            while True:
                try:
                    kind, payload = q.get(timeout=15)
                except queue_mod.Empty:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
                    continue
                self.wfile.write(f"event: {kind}\ndata: {payload}\n\n".encode("utf-8"))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            self.monitor.unsubscribe(q)


def make_server(root: Path, port: int, monitor: Monitor | None = None) -> ThreadingHTTPServer:
    mon = monitor or Monitor(root)
    handler = type("BoundHandler", (Handler,), {"monitor": mon})
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    httpd.daemon_threads = True
    httpd.monitor = mon  # type: ignore[attr-defined]
    return httpd


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SnowForge loop dashboard (local)")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--root", type=Path, default=HERE.parents[3], help="folder holding the loop checkouts (default: the parent of this SnowForge checkout)")
    args = parser.parse_args(argv)
    monitor = Monitor(args.root)
    monitor.start()
    httpd = make_server(args.root, args.port, monitor)
    names = ", ".join(sorted(monitor.watches)) or "none yet"
    print(f"loop dashboard: http://127.0.0.1:{httpd.server_address[1]}  root={args.root}  loops: {names}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        monitor.stop()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
