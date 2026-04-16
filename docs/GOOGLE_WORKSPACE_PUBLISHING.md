# Google Workspace Marketplace Publishing Plan

**Goal:** Publish the Feed Audit Tool as SnowForge LLC's first Google Workspace Marketplace add-on, with infrastructure reusable for future add-ons.

**Cost:** Free (no listing fee)
**Timeline:** 5-13 weeks (OAuth review is the bottleneck: 3-6 weeks)
**Type:** Editor Add-on (Sheets), Public

---

## Strategy: Ship on Gumroad Now, Marketplace in Parallel

Gumroad version (paste-the-code) can start selling immediately. Marketplace version eliminates the scary auth warning and gives free distribution. Both can coexist — Gumroad buyers get the code directly, Marketplace users get one-click install.

---

## Phase 1: Google Cloud Setup (Day 1-2)

### 1A: Create SnowForge Google Cloud Organization
- [ ] Go to console.cloud.google.com
- [ ] Create organization under SnowForge LLC (if not already done)
- [ ] This org will house ALL future add-on projects

### 1B: Create Standard GCP Project
- [ ] Create project: `snowforge-feed-audit-tool`
- [ ] **CRITICAL:** Cannot use the default Apps Script project. Must be a standard GCP project.
- [ ] Project structure for future:
  ```
  SnowForge LLC (Organization)
  ├── snowforge-feed-audit-tool
  ├── snowforge-[next-addon]
  └── snowforge-[future-addon]
  ```

### 1C: Verify Domain
- [ ] Verify `snowforge.dev` ownership in Google Search Console
- [ ] This domain will be the authorized domain for OAuth

---

## Phase 2: Web Pages Needed (Day 2-3)

These URLs must be live and working before submission. They will be checked during review.

### Required Pages on snowforge.dev
- [ ] **Privacy Policy** — already exists at snowforge.dev/privacy
  - Update to specifically mention: what data the add-on reads (spreadsheet content), that data is processed locally (not sent to external servers), user rights
- [ ] **Terms of Service** — already exists at snowforge.dev/terms
  - Review for add-on applicability
- [ ] **Support Page** — CREATE at snowforge.dev/support (or snowforge.dev/tools/feed-audit/help)
  - FAQ section
  - Contact email (support@snowforge.dev or alexitofrancis@gmail.com)
  - Common troubleshooting steps
  - Link to documentation

---

## Phase 3: Apps Script Project Setup (Day 3-5)

### 3A: Create Standalone Apps Script Project
- [ ] Go to script.google.com > New Project
- [ ] Name it "SnowForge Feed Audit Tool"
- [ ] Paste Code.gs
- [ ] Set runtime to **V8** (required for Editor add-ons)

### 3B: Link to GCP Project
- [ ] In Apps Script editor: Project Settings > Google Cloud Platform (GCP) Project
- [ ] Enter your project number from `snowforge-feed-audit-tool`
- [ ] This disconnects it from the default project (irreversible)

### 3C: Create Deployment
- [ ] Deploy > New Deployment > Type: "Add-on"
- [ ] Set version description
- [ ] Note the **Deployment ID** — needed for Marketplace SDK

### 3D: Test as Add-on
- [ ] Install the add-on in a test spreadsheet
- [ ] Test all menu items
- [ ] Test with real feed data
- [ ] Test authorization flow
- [ ] **GOTCHA:** Log out of all Google accounts, test with single account only (reviewers test this way)

---

## Phase 4: OAuth Consent Screen (Day 5-7)

### Configure in GCP Console > APIs & Services > OAuth consent screen

- [ ] **User Type:** External (required for public add-on)
- [ ] **App Name:** "SnowForge Feed Audit Tool" (max 50 chars)
- [ ] **User Support Email:** alexitofrancis@gmail.com (or support@snowforge.dev)
- [ ] **Authorized Domain:** snowforge.dev
- [ ] **Homepage:** https://snowforge.dev
- [ ] **Privacy Policy:** https://snowforge.dev/privacy
- [ ] **Terms of Service:** https://snowforge.dev/terms

### OAuth Scopes (Minimize These)
The Feed Audit Tool needs:
- [ ] `https://www.googleapis.com/auth/spreadsheets` — read/write spreadsheet data (for analyzing feed and writing results)

That should be the ONLY scope needed. The tool reads from "Feed Data" sheet and writes to audit results tabs. No Drive access, no external API calls.

**Note:** `spreadsheets` is a sensitive scope, so Google may request a demo video. Have one ready.

### Granular Consent (Required post-Dec 2025)
- [ ] Ensure the script handles scope denial gracefully
- [ ] If spreadsheets scope is denied → show clear error message, don't crash

---

## Phase 5: Marketplace SDK & Store Listing (Day 7-10)

### 5A: Enable Marketplace SDK
- [ ] In GCP Console > APIs & Services > Enable "Google Workspace Marketplace SDK"
- [ ] Configure visibility: **Public**
- [ ] Installation: **All Users Can Install** (not admin-only)
- [ ] Editor: Google Sheets

### 5B: Graphic Assets to Create

| Asset | Size | Notes |
|-------|------|-------|
| App icon (large) | 128x128 px | SnowForge logo |
| App icon (small) | 32x32 px | SnowForge logo (simplified) |
| Marketplace banner | 220x140 px | Branded card thumbnail |
| Screenshots | 1280x800 px | 1-5 screenshots of real UI (required) |

**Screenshot suggestions:**
1. Feed Data sheet with sample product data loaded
2. The "Feed Audit" menu dropdown showing options
3. Audit results tab with color-coded PASS/FAIL checks
4. A FAIL result with clickable example links highlighted
5. The summary section showing health score

**Pro tip:** Animated GIFs are supported and effective for showing the workflow.

### 5C: Store Listing Copy

**App Name:** SnowForge Feed Audit Tool

**Short Description (max 200 chars):**
Audit your product feed directly in Google Sheets. 35+ automated checks for Google Merchant, Meta Catalog, and Shopify exports. Get a graded report in seconds.

**Detailed Description (max 16,000 chars):**
Use the README.md content from the Gumroad listing as the starting point. Adapt for Marketplace format.

**Category:** Productivity (or Business Tools)

### 5D: Links
- [ ] Privacy Policy: https://snowforge.dev/privacy
- [ ] Terms of Service: https://snowforge.dev/terms
- [ ] Support: https://snowforge.dev/support

---

## Phase 6: Submit for Review (Day 10)

### Pre-Submission Checklist
- [ ] All links working (privacy, terms, support, homepage)
- [ ] All graphics uploaded and high quality
- [ ] Descriptions complete and accurate
- [ ] App tested with single Google account (logged out of others)
- [ ] V8 runtime confirmed
- [ ] OAuth scopes minimized
- [ ] Deployment ID entered correctly

### Submit
- [ ] Move OAuth consent screen from "Testing" to "In Production"
- [ ] This triggers the OAuth verification process automatically
- [ ] Publish the Marketplace listing

### Prepare for Review Questions
- [ ] Have demo video ready (screen recording showing: paste data → run audit → see results)
- [ ] 2-3 minutes is sufficient
- [ ] Show: what data is accessed, why, and user benefit
- [ ] Can use Loom or similar

---

## Phase 7: Wait for Review (3-6 weeks)

**Expected timeline:** 1-6 weeks depending on scope review

**During this time:**
- [ ] Sell on Gumroad (the code-paste version works now)
- [ ] Monitor email for Google review feedback
- [ ] If Google asks questions, respond promptly and resubmit
- [ ] You can resubmit unlimited times with no penalty

**Common feedback from Google:**
- "Please justify why you need the spreadsheets scope" → Explain: reads product feed data, writes audit results
- "Please provide a demo video" → Send the screen recording
- "Your privacy policy doesn't mention X" → Update and resubmit

---

## Phase 8: Post-Publication

- [ ] Add Marketplace install link to alexdiaz.me/tools
- [ ] Add Marketplace install link to Gumroad listing (as an alternative)
- [ ] Update SnowForge landing page with the add-on
- [ ] Monitor for user support requests
- [ ] Plan next add-on (Feed Diff Checker? Multi-Channel Validator?)

---

## Reusable Infrastructure for Future Add-ons

Once this first add-on is published, future add-ons are much faster because:

| One-Time Setup (Done) | Per Add-on (Faster) |
|----------------------|-------------------|
| GCP Organization | New GCP project |
| Domain verification | New Apps Script project |
| Publisher account | New store listing |
| Privacy/Terms pages | Link to existing pages |
| OAuth consent patterns | Copy and adjust scopes |
| Graphic templates | Resize for new product |

Estimated time for second add-on: 2-4 weeks (vs 5-13 for first).

---

## Important Rules to Avoid Rejection

1. **Never use default GCP project** — must be standard project
2. **Never use "Google" in app name** — say "for Google Sheets" not "Google Feed Auditor"
3. **All links must be live** — 404 = instant rejection
4. **Screenshots must be 1280x800** — exact dimensions, high quality
5. **Test with single account** — log out of all others before testing
6. **V8 runtime required** — for Editor add-ons
7. **Minimize OAuth scopes** — only request what you actually use
8. **Privacy policy must match reality** — if you don't send data externally, say so clearly
9. **Don't overstate capabilities** — "35+ checks" is fine, "catches all feed errors" is not
10. **Handle permission denial gracefully** — granular consent requirement

---

*Plan created: 2026-03-24*
*Based on current Google Workspace Marketplace requirements*

Sources:
- https://developers.google.com/workspace/add-ons/how-tos/publish-add-on-overview
- https://developers.google.com/workspace/marketplace/how-to-publish
- https://developers.google.com/workspace/marketplace/about-app-review
- https://developers.google.com/workspace/add-ons/how-tos/building-editor-addons
