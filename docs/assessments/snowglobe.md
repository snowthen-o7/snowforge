# SnowGlobe - Launch Readiness Assessment

**Date:** 2026-03-22
**Launch Readiness Score:** 85/100 (technical), 0/100 (business)
**Verdict:** POWERFUL INTERNAL TOOL - Not designed as a standalone product

---

## Executive Summary

SnowGlobe is a feature-complete lead generation and outreach automation platform. It's technically impressive with AI-powered analysis, multi-channel outreach, and marketing automation. However, it was designed as an internal tool to drive client acquisition for other SnowForge products, and lacks any billing infrastructure.

---

## Build Status: PASSES

- 35 routes built successfully
- Zero errors, ESLint passes
- Prisma schema generates cleanly

---

## Billing/Stripe: DOES NOT EXIST (0%)

No Stripe, no pricing, no subscription logic, no feature gating.

---

## Authentication: FULLY IMPLEMENTED

- Clerk with ClerkProvider wrapping app
- Custom middleware protecting all dashboard routes
- Public routes: sign-in, sign-up, cron endpoints, events, metrics, sites

---

## Feature Completeness: 95% for Internal Use

### Lead Generation Pipeline
- **Sources:** Reddit, Hacker News, RSS feeds
- **4 Classifier Profiles:** SnowPipe (e-commerce), SnowGen (AI content), SnowScrape (web scraping), Problem Finder (broad)
- **100+ pain-signal patterns** per profile
- **Deduplication:** Content fingerprinting (MD5) + SimHash

### AI-Powered Analysis
- Claude integration for lead scoring (1-10 priority)
- Evaluates: urgency, fit, reachability, signal quality
- Auto-generated tags (urgent, budget_mentioned, decision_maker, etc.)
- Recommendations for outreach approach

### Lead Management
- Inbox-style workflow with keyboard navigation
- Labels, read/unread tracking
- Pipeline funnel visualization (New -> Contacted -> Converted)

### Multi-Channel Outreach
- Campaign management with message templates
- Reddit, Twitter, LinkedIn, Email support
- OAuth integrations for each channel
- Template performance metrics

### Marketing Automation
- Scheduled post publishing with status tracking
- Channel-specific handlers
- Engagement tracking (impressions, clicks, likes, comments, shares)
- Retry logic with error tracking

### Scheduler & Observatory
- Cron job management with health checks
- Site/tool health monitoring
- Health check history

### Analytics
- Historical data, trend snapshots
- Daily metrics aggregation
- Dashboard with KPIs and profile breakdowns

---

## Database: COMPREHENSIVE (30+ Models)

Neon PostgreSQL with Prisma, 571 lines of schema covering: Source, Post, Lead, Label, MessageTemplate, OutreachCampaign, CampaignLead, OutreachMessage, MarketingPost, ChannelPost, ChannelCredential, PipelineRun, ScheduledJob, RegisteredSite, HealthCheck, DailyMetric, TrendSnapshot, TrendAlert, AnalyticsEvent, UserSettings, and more.

---

## API: 28 Endpoints

Auth (6), Cron (6), Events (1), Metrics (1), Pipeline (2), Sites (3), Notifications (1), plus internal routes.

---

## Testing: ZERO

No test files, no test framework configured. This is the biggest technical risk.

---

## Strategic Assessment

SnowGlobe is the **most valuable internal asset** in the SnowForge suite. It should be used immediately to:
1. Find leads for SnowPipe on Reddit/HN (people asking about e-commerce data sync, product feed management)
2. Automate outreach to those leads
3. Track conversion from lead to SnowPipe signup

It should NOT be launched as a standalone product right now because:
- No billing means no revenue
- The real value is as a force multiplier for other products
- Lead gen tools are a competitive market with established players
- Internal use gives you unfair advantage without the support burden

---

## Recommended Use

Deploy to production. Use it yourself daily to find and engage SnowPipe prospects. Evaluate standalone product viability after SnowPipe has paying customers and you have data on SnowGlobe's effectiveness.
