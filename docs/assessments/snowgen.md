# SnowGen - Launch Readiness Assessment

**Date:** 2026-03-22
**Launch Readiness Score:** 40-50/100
**Verdict:** NOT READY - 4-6 weeks to MVP launch

---

## Executive Summary

SnowGen is an ambitious AI content generation platform with sophisticated features but critical blockers: the build is broken, there's zero payment processing, and key user-facing features are incomplete.

---

## Build Status: BROKEN

**Error:** `useAuth()` hook from Clerk called in SSR context (MarketingLayout.tsx)
- `app/page.tsx` (server component) imports `<MarketingLayout>`
- `MarketingLayout.tsx` calls `useAuth()` which fails at SSR time
- **Fix:** Move `useAuth()` to a separate client component (2-4 hours)

Secondary: React key prop warnings during build

---

## Billing/Stripe: DOES NOT EXIST (0%)

- Zero references to Stripe in codebase
- No payment processing, subscription tiers, or usage quotas
- No pricing page implementation (nav link exists, page doesn't)
- Cost tracking exists (transparent API costs) but no monetization

---

## Authentication: WIRED BUT BLOCKED

- Clerk configured globally
- Protected routes via middleware
- OAuth for 6 social platforms (YouTube, TikTok, Instagram, Facebook, LinkedIn, X)
- Token refresh implemented
- **Blocked by build error**

---

## Feature Completeness: ~70% Core Generation

### What Works
- **Brand Management:** Create/edit brands, team members, RBAC (Owner, Editor)
- **AI Content Pipeline:** Script gen (GPT-4o/Claude/Gemini), voiceover (ElevenLabs), thumbnails (DALL-E 3/Stability/Ideogram), video (Runway/Pika/Luma/Kling), music (Suno/Stable Audio), subtitles (Whisper)
- **Multi-provider orchestration** with dependency ordering and fallback
- **Cost tracking** with pre-generation estimates
- **Team workflow:** 9 states (pending -> generating -> ready -> editing -> submitted -> review -> approved -> published/rejected), 27 granular permissions
- **Universe/worldbuilding:** Story bibles, character relationships, entity management
- **Brand assistant:** AI-powered brand creation via conversation

### What's Missing/Incomplete
- **No video preview** before publishing (persona audit gap)
- **No provider auto-recommendation** (users must understand AI models)
- **No quick-start onboarding** (identified friction point)
- **No email notifications** for status changes
- **No published content analytics** (can publish, can't track performance)
- **No A/B testing** for content
- **LinkedIn/X publishing** unclear status
- **26 TODO comments** in codebase

---

## Database: SOLID (30+ Tables)

- Drizzle ORM with PostgreSQL (Neon Serverless)
- ~1360 lines of schema, 30+ enums
- Models: users, brands, series, episodes, assets, scenes, socialConnections, universes, entities, etc.
- 9 numbered migrations
- Well-indexed, foreign key constraints, cascade deletes

---

## API: 50+ Route Handlers

- Brand CRUD, social OAuth, episode generation/publishing, asset management
- Series, universes, assistant chat, music, voice clones, calendar, templates
- All protected via Clerk middleware
- Rate limiting at proxy level
- **Gap:** Limited input validation (no Zod schemas visible)

---

## Testing: INSUFFICIENT

- 10 test files found (~60% coverage per docs)
- Unit tests for: cost calculator, music providers, queue, scene generation/planning, subtitle animations, video composition
- **No E2E tests** for critical flows
- **No auth flow tests**
- **No publishing integration tests**

---

## Environment: HIGH COMPLEXITY (30+ vars)

- 25-30 external API keys required
- AI: Anthropic, OpenAI, Google, Stability, Ideogram, Runway, Pika, Luma, Kling, ElevenLabs
- Storage: AWS S3, Upstash Redis, Pusher
- Social: YouTube, TikTok, Instagram, Facebook, LinkedIn, X OAuth credentials
- Single missing required var crashes app

---

## Blockers to Launch (Ordered)

1. **Fix build error** (2-4 hours)
2. **Implement Stripe billing** (2-3 weeks) - subscriptions, tiers, quota enforcement
3. **Add E2E tests** (1-2 weeks) - signup -> generation -> publishing
4. **Implement notifications** (1-2 weeks) - email for status changes
5. **Add content analytics** (1-2 weeks) - track published video performance

**Realistic timeline to MVP: 4-6 weeks full-time**
