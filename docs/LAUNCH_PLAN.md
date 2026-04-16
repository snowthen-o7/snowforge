# SnowForge LLC - Launch Plan

**Created:** 2026-03-22
**Objective:** Generate revenue as fast as possible, single-operator, path to quitting day job

---

## Strategy: Three Parallel Revenue Tracks

The mistake would be treating this as "launch SnowPipe and wait." You have skills and existing code that can generate revenue **this week** through simpler channels while SnowPipe ramps up.

| Track | Time to First Dollar | Effort | Ceiling |
|-------|---------------------|--------|---------|
| **Productized Scripts (Gumroad)** | Days | Low | $500-2K/mo |
| **MCP Servers (MCPize)** | 1-2 weeks | Medium | Unknown (early market) |
| **SnowPipe SaaS** | 2-4 weeks | High | $10K+/mo |

All three tracks share the same funnel: **your expertise in Shopify/feeds/catalogs drives discovery for everything.**

---

## Track 1: Productized Scripts on Gumroad (FASTEST MONEY)

You already have the code. Package it. Sell it. This week.

### Products to List

| Tool | Price | Source | Status |
|------|-------|--------|--------|
| Shopify JSONL Bulk Processor | $29-49 | Existing code + Feedonomics experience | Package this week |
| Feed Diff / Regression Checker | $29-49 | Diaz Diff Checker (already built) | Repackage for Gumroad |
| Meta Catalog Validator | $49-79 | Existing knowledge, build standalone | 1-2 weeks |
| Data Feed Audit Template | $19-29 | Structured checklist + Sheets template | 2-3 days |

### This Week's Action Items
- [ ] Package Shopify JSONL Bulk Processor as downloadable tool
  - Clean README with problem statement, quickstart, demo screenshot
  - Upload to Gumroad with $29-49 price
- [ ] Package Diaz Diff Checker as paid tool
  - Add commercial-grade README
  - Upload to Gumroad
- [ ] Create Data Feed Audit Template
  - Google Sheets template with structured checklist
  - PDF guide explaining each check
  - $19-29 on Gumroad (lowest friction, fastest to ship)
- [ ] Write one blog post on alexdiaz.me with CTA linking to Gumroad product
  - Best candidate: "Why your Shopify bulk operation keeps timing out on large catalogs"
  - CTA at bottom: link to Shopify JSONL Bulk Processor

### Why This Works First
- No infrastructure needed (Gumroad handles payments)
- You already have the code
- Each product validates whether people will pay for your expertise
- Even $29 from a stranger is proof of market

---

## Track 2: MCP Servers on MCPize (EARLY MOVER ADVANTAGE)

The MCP marketplace is early. Being one of the first e-commerce-focused MCP servers gives you disproportionate visibility.

### Servers to Build & List

| Server | Target User | Distribution |
|--------|------------|-------------|
| Meta Commerce Catalog MCP | Merchants running Meta catalog ads | MCPize |
| Multi-Channel Feed Validator MCP | Feed managers, e-commerce devs | MCPize + Gumroad standalone |
| Shopify Bulk Catalog MCP | Devs building on Shopify at scale | MCPize |

### Action Items (Weeks 1-3)
- [ ] Ship Meta Commerce Catalog MCP first (connects to your existing Meta expertise)
  - README follows the marketing-quality template (problem, quickstart, demo GIF, pricing)
  - List on MCPize
  - Cross-post to alexdiaz.me/tools
- [ ] Ship Shopify Bulk Catalog MCP second
  - Include timeout handling, presentment price optimization (your unique knowledge)
  - List on MCPize + Apify
- [ ] Ship Multi-Channel Feed Validator MCP third
  - Validates against Google, Meta, TikTok specs
  - This one has the broadest market appeal

### Key Insight
These MCP servers are designed to be **dogfooded through SnowPipe**. Build them, use them in SnowPipe, and sell them standalone. One effort, two revenue streams.

---

## Track 3: SnowPipe SaaS (HIGHEST CEILING)

### Why SnowPipe Is Ready

SnowPipe is the only SnowForge product with:
- Working Stripe integration (checkout, portal, usage metering)
- Defined pricing tiers (Free / $29 Starter / $99 Growth / Custom Business)
- 1731 passing tests (5 minor failures from test drift)
- Security audit completed (20+ fixes)
- Complete user journey (signup -> pipeline -> billing)
- Production monitoring (Sentry, Vercel Analytics)
- 60+ pages, 30 tRPC routers, 150+ procedures

### Target Customer

**E-commerce sellers syncing products across platforms:**
- Shopify store owners with 100-10,000 SKUs
- E-commerce agencies managing multiple client stores
- DTC brands expanding to new sales channels
- WooCommerce stores wanting Google Shopping presence

**Pain points:**
- Manually updating product feeds across platforms
- Products going out of sync (wrong prices, missing inventory)
- Google Merchant disapprovals from stale data
- Hours spent on CSV exports/imports

### Phase 3A: Pre-Launch Verification (Days 1-3)

**Day 1: Production Verification**
- [ ] Verify Stripe production keys in Doppler (not test keys)
- [ ] Test full signup flow: Clerk -> dashboard -> create pipeline -> Stripe checkout
- [ ] Verify Shopify OAuth works with a real store
- [ ] Verify Google Merchant OAuth works
- [ ] Check Sentry is capturing errors in production
- [ ] Verify webhook endpoints respond (Stripe, Shopify, WooCommerce, Clerk)
- [ ] Run one complete sync: Shopify -> Google Merchant (real data)

**Day 2: Production Polish**
- [ ] Review landing page copy - does it clearly explain what SnowPipe does?
- [ ] Ensure pricing page matches Stripe configuration exactly
- [ ] Test "Get Started Free" -> sign up -> dashboard flow on mobile
- [ ] Verify email delivery works (alerts, help/feedback via Resend)
- [ ] Check free tier limits are enforced (50K rows, 1 pipeline, 3 connections)
- [ ] Ensure cancellation flow works in Stripe portal

**Day 3: Operational Readiness**
- [ ] Set up monitoring alerts (Sentry notifications)
- [ ] Simple support process (email to start)
- [ ] Prepare 3-5 social media posts for launch
- [ ] Conversion tracking (Vercel Analytics)

### Phase 3B: Soft Launch - First 10 Users (Days 4-14)

**Go where e-commerce sellers hang out:**

Reddit:
- r/shopify (450K+ members) - Help with product feed questions
- r/ecommerce (250K+) - Answer multi-platform sync questions
- r/WooCommerce - Multi-platform selling
- r/GoogleAds - Merchant Center feed struggles

Shopify Community Forums, X/Twitter (#buildinpublic), Facebook Groups (Shopify Entrepreneurs, Google Shopping groups)

**Use SnowGlobe** (your internal lead gen tool):
- Deploy to production this week
- SnowPipe profile already configured with e-commerce keywords
- Monitor Reddit/HN daily, use outreach automation to respond helpfully

**Goal: 10 users in 14 days.** Personally onboard every one.

### Phase 3C: First Revenue (Days 14-30)

- [ ] Email free users who've run successful syncs with upgrade prompt
- [ ] Add in-app upgrade prompts at free tier limits
- [ ] Post results on Reddit: "Synced X products for Y stores this week"

**Target: 2-5 paying users ($58-$495 MRR)**

### Phase 3D: Growth Levers (Days 30-60)

**SEO Blog Posts (on pipe.snowforge.dev blog):**
- "How to sync Shopify products to Google Merchant Center"
- "Shopify to Google Shopping feed automation"
- "WooCommerce product feed management"
- "Google Merchant Center feed errors and how to fix them"

**Shopify App Store (Biggest Growth Lever):**
- [ ] Research Shopify App Store listing requirements
- [ ] SnowPipe already has Shopify OAuth - natural fit
- [ ] App Store listing = free distribution to Shopify's merchant base

---

## alexdiaz.me - Your Distribution Hub

Your personal site is the connective tissue between all three tracks. It needs work:

### Immediate Fixes (This Week)
- [ ] Rewrite homepage headline from "E-commerce & API Integration Specialist" to problem-first copy
- [ ] Surface $500 Data Feed Audit as prominent CTA on homepage (currently buried in /services)
- [ ] Add "Coming Soon" cards for MCP servers on /tools page
- [ ] Reorder portfolio: Diaz Diff Checker + Postman collection first, LoL project last
- [ ] Add SnowPipe to portfolio

### Blog Strategy (Ongoing)
Write posts targeting specific, searchable problems. Each post ends with a tool CTA:

1. "Why your Shopify bulk operation keeps timing out on large catalogs"
   -> CTA: Shopify JSONL Bulk Processor (Gumroad)
2. "How to validate a Meta product catalog before it breaks your ads"
   -> CTA: Meta Catalog Validator / Feed Validator MCP
3. "Building a feed diff tool: catching regressions before they hit production"
   -> CTA: Diaz Diff Checker (Gumroad)

**Format:** Problem title -> "here's why it's annoying" -> how to fix it (technical, real) -> "I built a tool for this" + link

This is not self-promotion. It's documentation that happens to have your name on it.

---

## Unified Revenue Timeline

### Week 1 (March 22-28)
- [ ] Package + list 2 Gumroad products (Shopify JSONL Processor + Data Feed Audit Template)
- [ ] SnowPipe: Verify production readiness (Stripe, OAuth, full user journey)
- [ ] Deploy SnowGlobe for internal use
- [ ] alexdiaz.me: Rewrite homepage, surface audit CTA
- [ ] Write + publish first blog post

### Week 2 (March 29 - April 4)
- [ ] SnowPipe soft launch: first Reddit/community posts
- [ ] Ship first MCP server (Meta Commerce Catalog) to MCPize
- [ ] Package Diaz Diff Checker for Gumroad
- [ ] Start daily SnowGlobe lead monitoring routine
- [ ] Write second blog post

### Week 3-4 (April 5-18)
- [ ] SnowPipe: Personally onboard first users, iterate on feedback
- [ ] Ship second MCP server (Shopify Bulk Catalog)
- [ ] Build + list Meta Catalog Validator on Gumroad ($49-79)
- [ ] alexdiaz.me: Add live MCP server links to /tools
- [ ] Third blog post

### Month 2 (April 19 - May 22)
- [ ] SnowPipe: Convert free users to paid, target 2-5 paying customers
- [ ] Ship third MCP server (Multi-Channel Feed Validator)
- [ ] SEO blog posts on pipe.snowforge.dev
- [ ] Research Shopify App Store listing
- [ ] Evaluate: which track is generating the most revenue/interest?

### Month 3+ (May 23+)
- [ ] Double down on whatever's working
- [ ] If SnowPipe has 20+ paying users: consider SnowScrape billing work
- [ ] If Gumroad products are selling: expand the catalog
- [ ] If MCP servers are gaining traction: build more

---

## Revenue Milestones

| Milestone | Target | What It Means |
|-----------|--------|---------------|
| First Gumroad sale | Week 1-2 | Someone paid for your expertise. Validation. |
| First SnowPipe signup | Week 2-3 | SaaS funnel works. |
| $100 total revenue | Week 2-4 | Multiple buyers across tracks. Not a fluke. |
| First SnowPipe paying user | Week 4-6 | SaaS monetization works. |
| $500 MRR (all tracks) | Month 2-3 | Real business. Pick what to scale. |
| $1,000 MRR | Month 3-4 | Sustainable side income. |
| $5,000 MRR | Month 6-12 | Evaluate quitting timeline. |
| $10,000 MRR | Month 12-18 | Replacement income territory. |

---

## SnowGlobe's Role

SnowGlobe is your **internal lead generation machine**, not a product to sell. Use it daily:

1. Deploy to production this week
2. SnowPipe profile keywords (already configured): "product feed", "sync products", "google merchant", "multi-channel", "shopping feed"
3. Run pipeline daily - 10 minutes/morning reviewing leads
4. Respond helpfully on Reddit/HN (not spammy)
5. Track: SnowGlobe lead -> blog visit -> Gumroad purchase or SnowPipe signup

---

## Second-Wave Products (SnowScrape & SnowGen)

### SnowScrape (Next after SnowPipe stabilizes)
- Build passes, core scraping works end-to-end
- Needs: Stripe integration (~3 weeks), plan enforcement (~1 week)
- Target: developers, SEO professionals, data analysts
- Launch on: Product Hunt, HN, dev communities

### SnowGen (Third)
- Build currently broken (Clerk hook SSR error, 2-4 hour fix)
- Needs: Stripe, notifications, content analytics (4-6 weeks)
- Target: content creators, social media managers
- Launch on: YouTube creator communities, TikTok creator groups

**Trigger:** Only start these when SnowPipe has 20+ paying users AND stable operations.

---

## What NOT to Do

1. **Don't keep building features.** Your problem is distribution, not code.
2. **Don't try to launch everything simultaneously.** Three revenue tracks is already ambitious.
3. **Don't wait for perfection.** Ship the Gumroad products this week, even if imperfect.
4. **Don't spend money on ads before organic validation.**
5. **Don't redesign anything.** Content > design right now.
6. **Don't overthink self-promotion.** You're publishing what you know. That's it.

---

## Daily Routine (During Launch)

**Morning (30 min before work):**
- Check SnowGlobe leads inbox
- Respond to 2-3 high-priority leads on Reddit/HN
- Check Sentry/Gumroad/Stripe dashboards

**Evening (1 hour after work):**
- Check new signups, email each one personally
- Fix any bugs reported
- Write one piece of content (blog post, Reddit answer, tweet)
- Review analytics (signups, sales, conversions)

**Weekend (2-4 hours):**
- Package next Gumroad product or MCP server
- Write blog posts for SEO
- Plan next week's outreach

---

## Decision Points

### After First Gumroad Sale
- Which product sold? Double down on that category.
- Where did the buyer find you? (Blog, Reddit, direct?) Go there more.

### After 10 SnowPipe Users
- Which source->destination path is most popular?
- Where do people drop off in onboarding?
- Are free tier limits right?

### At $500 MRR (All Tracks Combined)
- Which track contributes most? Shift time toward it.
- Is SnowPipe ready for Shopify App Store?
- Time to start SnowScrape billing work?

### At $5,000 MRR
- Time to quit day job?
- Hire first contractor? (support? content? development?)
- Which product gets full-time investment?

---

*This plan assumes a single operator working evenings/weekends while maintaining a day job. Three tracks in parallel is aggressive but feasible because Tracks 1 and 2 are packaging existing work, not building from scratch.*
