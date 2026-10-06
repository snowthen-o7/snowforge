"""Read a loop's events.jsonl and derive what the dashboard shows: iterations, the current one,
the run, the state, and cost totals. Pure functions over lists of event dicts; the server owns
file offsets and timing."""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

UTC = dt.timezone.utc


def read_events(path: Path, offset: int = 0) -> tuple[list[dict], int, int]:
    if not path.is_file():
        return [], 0, 0
    with path.open("rb") as handle:
        handle.seek(offset)
        chunk = handle.read()
    end = chunk.rfind(b"\n")
    if end < 0:
        return [], offset, 0
    records: list[dict] = []
    bad = 0
    for raw in chunk[: end + 1].split(b"\n"):
        if not raw.strip():
            continue
        try:
            obj = json.loads(raw.strip().decode("utf-8", errors="replace"))
        except ValueError:
            bad += 1
            continue
        if isinstance(obj, dict) and "event" in obj:
            records.append(obj)
        else:
            bad += 1
    return records, offset + end + 1, bad


def parse_ts(ts: str) -> dt.datetime:
    text = ts.replace("Z", "+00:00")
    return dt.datetime.fromisoformat(text).astimezone(UTC)


def _batched(events: list[dict]):
    """Yield (batch, event): the batch ordinal within the event's run. loop.sh restarts `i` at 1 in
    every batch of one overnight run, so (run, i) alone is ambiguous. Events before the first batch
    start are batch 0."""
    batches: dict[str, int] = {}
    for e in events:
        run = e.get("run", "")
        if e.get("event") == "loop_started" and e.get("scope") == "batch":
            batches[run] = batches.get(run, 0) + 1
        yield batches.get(run, 0), e


def join_iterations(events: list[dict]) -> list[dict]:
    its: dict[tuple, dict] = {}
    order: list[tuple] = []
    for batch, e in _batched(events):
        kind = e.get("event")
        if kind not in {"iteration_started", "session_finished", "gate_finished", "iteration_finished"}:
            continue
        k = (e.get("run", ""), batch, e.get("i"))
        if k not in its:
            its[k] = {"run": e.get("run", ""), "batch": batch, "i": e.get("i"), "task_id": None, "task": None, "model": None,
                      "tier": None, "started": None, "stream": None, "cost_usd": None, "opus_cost_usd": None, "turns": None,
                      "duration_ms": None, "is_error": False, "usage_limit": False, "gates": [], "ok": None,
                      "minutes": None, "commit": None, "finished": None}
            order.append(k)
        it = its[k]
        if kind == "iteration_started":
            it.update(task_id=e.get("task_id"), task=e.get("task"), model=e.get("model"), tier=e.get("tier"),
                      started=e.get("ts"), stream=e.get("stream"))
        elif kind == "session_finished":
            if e.get("attempt") == "opus":
                it["opus_cost_usd"] = e.get("cost_usd")
            else:
                it.update(cost_usd=e.get("cost_usd"), turns=e.get("turns"), duration_ms=e.get("duration_ms"),
                          is_error=bool(e.get("is_error")), usage_limit=bool(e.get("usage_limit")))
        elif kind == "gate_finished":
            it["gates"].append({"attempt": e.get("attempt"), "ok": bool(e.get("ok")), "log": e.get("log")})
        elif kind == "iteration_finished":
            it.update(ok=bool(e.get("ok")), minutes=e.get("minutes"), commit=e.get("commit"), finished=e.get("ts"))
    out = []
    for k in reversed(order):
        it = its[k]
        it["cost"] = float(it["cost_usd"] or 0.0) + float(it["opus_cost_usd"] or 0.0)
        out.append(it)
    return out


def current_iteration(events: list[dict]) -> dict | None:
    last = None
    last_key = None
    ordinal = 0
    counts: dict[str, int] = {}
    tagged = list(_batched(events))
    for batch, e in tagged:
        if e.get("event") == "iteration_started":
            run = e.get("run", "")
            counts[run] = counts.get(run, 0) + 1
            last, last_key, ordinal = e, (run, batch, e.get("i")), counts[run]
    if last is None:
        return None
    phase = "session"
    for batch, e in tagged:
        if (e.get("run", ""), batch, e.get("i")) != last_key:
            continue
        kind = e.get("event")
        if kind == "iteration_finished":
            return None
        if kind == "session_finished":
            phase = "gate opus" if e.get("attempt") == "opus" else "gate 1"
        elif kind == "gate_finished" and not e.get("ok"):
            phase = "gate retry" if e.get("attempt") == 1 else ("opus session" if e.get("attempt") == "retry" else phase)
    return {"run": last.get("run", ""), "batch": last_key[1], "i": last.get("i"), "ordinal": ordinal,
            "task_id": last.get("task_id"), "task": last.get("task"),
            "model": last.get("model"), "tier": last.get("tier"), "started": last.get("ts"),
            "stream": last.get("stream"), "phase": phase}


def run_summary(events: list[dict]) -> dict | None:
    starts = [e for e in events if e.get("event") == "loop_started"]
    if not starts:
        return None
    run = starts[-1].get("run", "")
    same = [e for e in starts if e.get("run", "") == run]
    best = next((e for e in same if e.get("scope") == "run"), same[0])
    return {"run": run, "mode": best.get("mode"), "max_iter": best.get("max_iter"), "max_usd": best.get("max_usd"),
            "started": best.get("ts"), "branch": best.get("branch"), "kit_version": best.get("kit_version")}


_STATE_EVENTS = {"loop_stopped", "usage_limit_sleep", "loop_started", "iteration_started", "session_finished",
                 "gate_finished", "iteration_finished"}


def derive_state(events: list[dict], now: dt.datetime, last_activity: dt.datetime | None,
                 stale_after_s: int = 600) -> dict:
    if not events:
        return {"state": "empty", "reason": "no events yet: starts at this loop's next launch", "until": None}
    last = next((e for e in reversed(events) if e.get("event") in _STATE_EVENTS), None)
    if last is None:  # only notices or unknown kinds so far
        last = events[-1]
    kind = last.get("event")
    if kind == "loop_stopped":
        return {"state": "stopped", "reason": str(last.get("reason") or f"exit {last.get('code')}"), "until": None}
    if kind == "usage_limit_sleep":
        until = last.get("until")
        try:
            if until and parse_ts(until) > now:
                return {"state": "sleeping", "reason": str(last.get("message") or "usage limit"), "until": until}
        except ValueError:
            pass
    if last_activity is not None and (now - last_activity).total_seconds() <= stale_after_s:
        return {"state": "running", "reason": None, "until": None}
    return {"state": "stale", "reason": f"no file activity for {stale_after_s // 60} min", "until": None}


def _bucket() -> dict:
    return {"cost": 0.0, "count": 0, "by_tier": {}}


def _add(bucket: dict, it: dict) -> None:
    bucket["cost"] += it["cost"]
    bucket["count"] += 1
    tier = it.get("tier") or "?"
    t = bucket["by_tier"].setdefault(tier, {"cost": 0.0, "count": 0})
    t["cost"] += it["cost"]
    t["count"] += 1


def totals(iterations: list[dict], now: dt.datetime, run: str | None) -> dict:
    out = {"run": _bucket(), "today": _bucket(), "week": _bucket()}
    local_day = now.astimezone().date()
    for it in iterations:
        if not it.get("started"):
            continue
        started = parse_ts(it["started"])
        if run and it["run"] == run:
            _add(out["run"], it)
        if started.astimezone().date() == local_day:
            _add(out["today"], it)
        if (now - started).total_seconds() <= 7 * 86400 and started <= now:
            _add(out["week"], it)
    return out
