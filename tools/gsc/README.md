# Search Console from the CLI

`gsc.py` reads Google Search Console for any SnowForge property with a service account, so a
Claude Code session (or you) can pull clicks, impressions, queries and pages without a browser.

## One-time setup (Alex, about 10 minutes)

1. **Google Cloud project.** https://console.cloud.google.com → pick or create a project (any; the
   existing one on billing account 9255-3440-4870 is fine). Search Console API has no cost.
2. **Enable the API.** APIs & Services → Library → "Google Search Console API" → Enable.
3. **Service account.** IAM & Admin → Service Accounts → Create → name `snowforge-gsc`, no roles
   needed → Done. Open it → Keys → Add key → JSON. Save the file as
   `C:\Users\alexi\.config\gsc\service-account.json` (gitignored; never commit it).
4. **Give it Search Console access.** In https://search.google.com/search-console, for each property
   (`sc-domain:snowforge.dev` covers every subdomain; add `waitthisiscool.com` too): Settings →
   Users and permissions → Add user → the service account's email (`snowforge-gsc@<project>.iam.gserviceaccount.com`) → permission **Restricted** (read-only) → Add.
5. `pip install google-auth requests`, then `python tools/gsc/gsc.py sites` should list the properties.

## Use

```
python tools/gsc/gsc.py sites
python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 28 --by page
python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 90 --by query --filter "page contains fort." --limit 100
python tools/gsc/gsc.py query sc-domain:snowforge.dev --days 180 --by date
python tools/gsc/gsc.py query sc-domain:snowforge.dev --by page,query --json > out.json
```

Search Console data lags about two days; the tool ends every range at today minus two.
