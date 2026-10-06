"""Find the loops: every checkout under the root with .loop/config.sh.

Nothing in config.sh is executed; LOOP_NAME and LOG_DIR are read by a regex over lines of the
form NAME="value", with the kit's defaults (the folder name, "logs") when absent.
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

_ASSIGN = re.compile(r'^\s*(LOOP_NAME|LOG_DIR)="([^"]*)"\s*(#.*)?$')


def parse_config(text: str) -> dict:
    found: dict = {}
    for line in text.splitlines():
        match = _ASSIGN.match(line)
        if match:
            found[match.group(1)] = match.group(2)
    return found


def branch_of(path: Path) -> str:
    try:
        out = subprocess.run(["git", "-C", str(path), "rev-parse", "--abbrev-ref", "HEAD"],
                             capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return "?"
    return out.stdout.strip() if out.returncode == 0 and out.stdout.strip() else "?"


@dataclass
class Loop:
    name: str
    path: Path
    log_dir: Path
    branch: str
    warnings: list[str] = field(default_factory=list)
    launched: bool = False  # the kit has run here: a kit snapshot or an events file exists in log_dir


def discover(root: Path) -> list[Loop]:
    loops: list[Loop] = []
    for config in sorted(root.glob("*/.loop/config.sh")):
        checkout = config.parent.parent
        cfg = parse_config(config.read_text(encoding="utf-8", errors="replace"))
        warnings: list[str] = []
        branch = branch_of(checkout)
        if branch == "?":
            warnings.append("git: not a repository or git failed; branch unknown")
        if not (checkout / "TASKS.md").is_file():
            warnings.append("TASKS.md missing")
        log_dir = checkout / cfg.get("LOG_DIR", "logs")
        launched = (log_dir / ".loop-kit").is_dir() or (log_dir / "events.jsonl").is_file()
        loops.append(Loop(name=cfg.get("LOOP_NAME") or checkout.name, path=checkout,
                          log_dir=log_dir, branch=branch, warnings=warnings, launched=launched))
    loops.sort(key=lambda l: l.name.lower())
    counts: dict[str, int] = {}
    for loop in loops:
        counts[loop.name] = counts.get(loop.name, 0) + 1
    for loop in loops:
        if counts[loop.name] > 1:
            loop.warnings.append(f"another loop is also named {loop.name}; shown with its folder")
            loop.name = f"{loop.name} ({loop.path.name})"
    loops.sort(key=lambda l: l.name.lower())
    return loops
