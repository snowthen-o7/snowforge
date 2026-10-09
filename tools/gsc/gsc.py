#!/usr/bin/env python
"""Google Search Console from the command line, for SnowForge's properties.

Auth is a service account (no browser, no expiring token): the JSON key at $GSC_KEY_FILE or
~/.config/gsc/service-account.json, and that account's email added as a user on each property
in Search Console (Settings > Users and permissions). See README.md next to this file.

  python tools/gsc/gsc.py sites
  python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 28 --by page
  python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 90 --by query --filter "page contains fort."
  python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 90 --by date

Needs: pip install google-auth requests
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
API = "https://searchconsole.googleapis.com/webmasters/v3"
DEFAULT_KEY = Path.home() / ".config" / "gsc" / "service-account.json"


def session() -> requests.Session:
    key = Path(os.environ.get("GSC_KEY_FILE", DEFAULT_KEY))
    if not key.is_file():
        sys.exit(f"no service-account key at {key}; see tools/gsc/README.md")
    creds = service_account.Credentials.from_service_account_file(str(key), scopes=[SCOPE])
    creds.refresh(Request())
    s = requests.Session()
    s.headers["Authorization"] = f"Bearer {creds.token}"
    return s


def sites(s: requests.Session) -> None:
    r = s.get(f"{API}/sites", timeout=30)
    r.raise_for_status()
    for e in r.json().get("siteEntry", []):
        print(f"{e['permissionLevel']:22} {e['siteUrl']}")


def parse_filter(text: str) -> dict:
    # "page contains fort." / "query equals snowforge" / "country equals usa"
    dim, op, expr = text.split(" ", 2)
    return {"dimension": dim, "operator": op, "expression": expr}


def query(s: requests.Session, site: str, days: int, by: list[str], filters: list[str], limit: int, as_json: bool) -> None:
    end = dt.date.today() - dt.timedelta(days=2)  # Search Console lags about two days
    start = end - dt.timedelta(days=days - 1)
    body: dict = {"startDate": start.isoformat(), "endDate": end.isoformat(), "dimensions": by, "rowLimit": limit}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": [parse_filter(f) for f in filters]}]
    r = s.post(f"{API}/sites/{requests.utils.quote(site, safe='')}/searchAnalytics/query", json=body, timeout=60)
    r.raise_for_status()
    rows = r.json().get("rows", [])
    if as_json:
        json.dump(rows, sys.stdout, indent=1)
        return
    print(f"{site}  {start} to {end}  by {','.join(by)}  ({len(rows)} rows)")
    print(f"{'clicks':>7} {'impr':>8} {'ctr':>6} {'pos':>5}  keys")
    tc = ti = 0
    for row in rows:
        tc += row["clicks"]; ti += row["impressions"]
        print(f"{row['clicks']:7.0f} {row['impressions']:8.0f} {row['ctr']*100:5.1f}% {row['position']:5.1f}  {' | '.join(row['keys'])}")
    print(f"{tc:7.0f} {ti:8.0f}  total")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("sites", help="list the properties this service account can read")
    q = sub.add_parser("query", help="search analytics for one property")
    q.add_argument("site", help="sc-domain:snowforge.dev or https://fort.snowforge.dev/")
    q.add_argument("--days", type=int, default=28)
    q.add_argument("--by", default="page", help="comma list: date,page,query,country,device,searchAppearance")
    q.add_argument("--filter", action="append", default=[], help='e.g. "page contains fort." (dimension operator expression)')
    q.add_argument("--limit", type=int, default=50)
    q.add_argument("--json", action="store_true")
    a = p.parse_args()
    s = session()
    if a.cmd == "sites":
        sites(s)
    else:
        query(s, a.site, a.days, a.by.split(","), a.filter, a.limit, a.json)


if __name__ == "__main__":
    main()
