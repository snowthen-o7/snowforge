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
        loops.append(Loop(name=cfg.get("LOOP_NAME") or checkout.name, path=checkout,
                          log_dir=checkout / cfg.get("LOG_DIR", "logs"), branch=branch, warnings=warnings))
    loops.sort(key=lambda l: l.name.lower())
    seen: dict[str, int] = {}
    for loop in loops:
        n = seen.get(loop.name, 0) + 1
        seen[loop.name] = n
        if n > 1:
            loop.warnings.append(f"another loop is also named {loop.name}; shown as {loop.name}-{n}")
            loop.name = f"{loop.name}-{n}"
    return loops
