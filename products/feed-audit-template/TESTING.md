# Feed Audit Tool — Testing & Validation Plan

## Product Overview
Automated Google Sheets Apps Script tool at $29. Users paste their product feed data, run the script, and get a full audit with PASS/FAIL/WARNING/SKIP results, clickable hyperlinks to problem rows, and a health score.

## Product Files
- `Code.gs` — Apps Script source code
- `guide.md` — PDF guide content (convert with Google Docs or Pandoc)
- `README.md` — Gumroad listing copy
- `setup-instructions.md` — Installation steps for buyers

---

## Test 1: Script Installation
**Goal:** Confirm the Apps Script installs and initializes correctly in a fresh Google Sheet

- [ ] Create a new Google Sheet
- [ ] Rename Sheet1 to "Feed Data"
- [ ] Paste product feed CSV data into the sheet
- [ ] Go to Extensions > Apps Script, rename project to "Feed Audit Tool"
- [ ] Paste Code.gs contents, save
- [ ] Refresh the Google Sheet
- [ ] Verify "Feed Audit" menu appears in the menu bar

**Verdict:** [ ] PASS / [ ] NEEDS FIXES

**Notes:**


---

## Test 2: Run Against Real Feed Data
**Goal:** Validate the audit runs correctly and produces useful results

- [ ] Click "Feed Audit > Run Audit (Google Merchant)" (or appropriate platform)
- [ ] Verify a separate tab is created (e.g., "Audit — Google Merchant")
- [ ] Verify all checks produce PASS/FAIL/WARNING/SKIP results
- [ ] Verify "Example 1-5" columns have clickable hyperlinks
- [ ] Click a hyperlink — does it jump to the correct cell in "Feed Data"?
- [ ] Verify summary section at bottom has health score
- [ ] Spot-check 10 results — are they accurate for the data?

**Verdict:** [ ] PASS / [ ] NEEDS FIXES

**Notes:**


---

## Test 3: Multiple Platforms
**Goal:** Confirm each platform audit creates its own tab and Full Scan works

- [ ] Run Google Merchant audit — verify tab created
- [ ] Run Meta Catalog audit — verify separate tab created (not overwriting Google Merchant)
- [ ] Run "Full Scan" — verify it runs all platform checks
- [ ] Verify each tab has its own results and health score

**Verdict:** [ ] PASS / [ ] NEEDS FIXES

**Notes:**


---

## Test 4: Review the Guide
**Goal:** Confirm the PDF guide is accurate for the automated tool (not the old manual template)

- [ ] Read guide.md Section 1 — does it describe the automated tool, not a manual template?
- [ ] Are setup instructions accurate for Apps Script installation?
- [ ] Are case study numbers plausible / replaced with real examples?
- [ ] Read remaining sections — still accurate for 2026?
- [ ] Convert to PDF — does it look professional?

**Verdict:** [ ] PASS / [ ] NEEDS FIXES

**Notes:**


---

## Test 5: Gumroad Listing
**Goal:** End-to-end buyer experience

- [ ] Upload to Gumroad (draft/unlisted)
- [ ] Use README.md copy for listing description
- [ ] Add screenshots of the audit results (audit tab, hyperlinks, health score)
- [ ] Set price to $29
- [ ] Test purchase flow
- [ ] Verify download includes Code.gs + setup-instructions.md + guide.pdf
- [ ] Would I feel good receiving this for $29?

**Verdict:** [ ] PASS / [ ] NEEDS FIXES

---

## Final Checklist Before Listing

- [ ] All 5 tests pass
- [ ] Guide describes automated tool (not manual template)
- [ ] Code.gs installs cleanly in a fresh Google Sheet
- [ ] Audit results are accurate against real feed data
- [ ] PDF guide is exported and looks professional
- [ ] Gumroad listing copy is finalized
- [ ] Screenshots created showing audit results
- [ ] Price set to $29
- [ ] Product set to public on Gumroad
- [ ] Link added to alexdiaz.me/tools page
