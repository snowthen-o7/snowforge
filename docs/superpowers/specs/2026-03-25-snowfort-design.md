# SnowFort — Design Spec

> Fortnite Item Shop Tracker & Alert System
> SnowForge LLC Product Suite
> Date: 2026-03-25

---

## 1. Problem & Opportunity

Fortnite's item shop rotates daily at 00:00 UTC. Players who want a specific cosmetic have no reliable way to know when it returns — they either check manually every day or miss it entirely. This creates real FOMO, especially for rare items that may not appear for months.

**Opportunity:** Build a browsable item catalog with shop history data (SEO traffic magnet) and let users subscribe to alerts when their desired items return (retention hook). Monetize via ads on the high-volume catalog pages and an optional premium tier.

---

## 2. System Overview

**SnowFort** is a Fortnite item shop tracker with three pillars:

1. **Public catalog** — browsable database of ~3,000 cosmetics with shop history, rarity data, and "days since last seen" metrics. SEO-optimized for long-tail search traffic.
2. **Alert subscriptions** — users build a watchlist and get notified via email, Discord, or SMS when items return to the shop.
3. **Discord community** — central SnowFort Discord server with daily shop updates and a bot for slash-command item tracking.

---

## 3. Architecture

**Hybrid approach:** Next.js on Vercel handles the website and daily cron job. A lightweight Discord bot runs separately.

### Components

| Component | Technology | Hosting |
|-----------|-----------|---------|
| Web app (catalog, dashboard, auth) | Next.js (App Router), TypeScript, Tailwind CSS | Vercel |
| Authentication | Clerk (shared SnowForge instance) | Clerk cloud |
| Database | PostgreSQL | Supabase (free tier) |
| Daily cron job | Vercel Cron → Next.js API route | Vercel |
| Discord bot | discord.js, slash commands | Railway Hobby ($5/mo) |
| Email notifications | Resend | Resend cloud |
| SMS notifications (premium) | Twilio | Twilio cloud |
| Discord notifications | Discord webhooks | Discord API |
| Payments | Stripe (single product, monthly billing) | Stripe cloud |
| Ads | Google AdSense (→ Mediavine at traffic thresholds) | Third-party |

### Discord Bot ↔ Database Communication

The Discord bot connects directly to Supabase via its PostgreSQL connection string (pooled via Supavisor). The `packages/shared` package provides the Supabase client, TypeScript types, and query helpers used by both the web app and the bot. This avoids the bot depending on the web app being up and keeps latency low for slash command responses.

### Data Source

- **Primary:** Fortnite-API.com (`/v2/cosmetics` for catalog, `/v2/shop` for daily shop)
- **Architecture:** Abstraction layer over the API client so the source can be swapped to FortniteAPI.io or another provider without changing business logic.

---

## 4. Data Model

All tables in Supabase (PostgreSQL).

### `items` — Cosmetic catalog

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | Fortnite item ID from API |
| `slug` | text (unique) | URL-friendly name, derived from `name` (e.g., "renegade-raider"). Generated on upsert. |
| `name` | text | |
| `type` | text | skin, emote, pickaxe, glider, wrap, etc. |
| `rarity` | text | common, uncommon, rare, epic, legendary, mythic |
| `description` | text | |
| `image_url` | text | URL from API |
| `price_vbucks` | integer | |
| `set_name` | text (nullable) | Bundle/set membership |
| `first_seen_at` | timestamptz | |
| `last_seen_at` | timestamptz | |
| `times_in_shop` | integer | Counter, incremented daily |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `shop_history` — Daily shop snapshots

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `date` | date | UTC date |
| `item_id` | text (FK → items) | |
| `created_at` | timestamptz | |

Unique constraint on `(date, item_id)`. One row per item per day it appears.

### `watchlist` — User alert subscriptions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | text | Clerk user ID |
| `item_id` | text (FK → items) | |
| `created_at` | timestamptz | |

Unique constraint on `(user_id, item_id)`.

**Free tier limit:** 50 items per user. Premium: unlimited. Enforced at the application layer on insert.

### `user_preferences` — Notification settings

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | text (PK) | Clerk user ID |
| `email_alerts` | boolean | Default true |
| `discord_alerts` | boolean | Default false |
| `sms_alerts` | boolean | Premium only |
| `phone_number` | text (nullable) | Supabase disk-level encryption at rest (default). No app-level encryption — Twilio needs the raw number. |
| `discord_user_id` | text (nullable) | From Discord OAuth |
| `is_premium` | boolean | Default false |
| `stripe_customer_id` | text (nullable) | For reconciliation |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Premium status:** `is_premium` is updated by Stripe webhooks (idempotent, using Stripe event IDs to deduplicate). On any premium-gated action (SMS send, bot server install), the app verifies the Stripe subscription is active via `stripe_customer_id` as a fallback if `is_premium` seems stale. A daily reconciliation query checks all `is_premium = true` users against Stripe's API to catch missed webhooks.

### `notifications_log` — Audit trail

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | text | |
| `item_id` | text (FK → items) | |
| `channel` | text | email, sms, discord |
| `sent_at` | timestamptz | |
| `status` | text | sent, failed |

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `items` | `(type, rarity)` | Catalog filtering |
| `items` | `(last_seen_at)` | "Longest absent" sorting |
| `items` | `(slug)` | Unique, URL lookups |
| `shop_history` | `(date)` | Daily diff queries |
| `shop_history` | `(item_id)` | Item history timeline |
| `watchlist` | `(item_id)` | "Who's watching this item?" (cron fan-out) |
| `watchlist` | `(user_id)` | "Show my watchlist" |

---

## 5. Daily Cron Job Flow

Vercel Cron triggers `POST /api/cron/shop-update` daily at `0 0 * * *` (00:00 UTC).

### Cron Endpoint Security

The endpoint validates the `CRON_SECRET` header sent automatically by Vercel Cron. Requests without a valid secret are rejected with 401. This prevents unauthorized invocation.

### Timing

Vercel Cron supports minute-level granularity, not seconds. To fire at ~00:00:30 UTC, the function can begin with a configurable sleep (`SHOP_POLL_DELAY_MS` env var, default: 0 on Hobby, set to 30000 on Pro). Since the entire cron job is lightweight (the shop is ~25-30 items, one API fetch, a handful of DB writes, and a few notification API calls), a 30-second sleep still leaves ample room within the Vercel execution time limit.

### Execution Time Budget

On Vercel Hobby, functions have a 10-second execution limit. With the 30-second sleep, this will exceed the limit. **Options:**

- **v1 (recommended):** Skip the sleep, fire at 00:00 UTC sharp. The Fortnite API typically updates within seconds of midnight. If the shop hasn't updated yet, the diff will show no changes and no notifications fire — the next day catches up naturally. This keeps us on Hobby ($0).
- **v2 (if needed):** Upgrade to Vercel Pro ($20/mo) for 60-second limit, enabling the sleep. Only do this once revenue justifies it.

### Flow

1. **Validate `CRON_SECRET`** header
2. **Fetch today's shop** from Fortnite-API.com `/v2/shop`
3. **Upsert items** — new cosmetics added to `items`, existing ones get `updated_at` refreshed
4. **Diff against yesterday** — compare today's shop item IDs vs yesterday's `shop_history` rows
5. **Record shop history** — insert today's rows into `shop_history`
6. **Update item stats** — bump `times_in_shop`, set `last_seen_at = today` for items that appeared
7. **Find watchers** — query `watchlist` for any `item_id` in today's new arrivals, join with `user_preferences`
8. **Fan out notifications** by channel:
   - **Email** → Resend batch API (single API call, Resend handles fan-out)
   - **Discord** → webhook to `#shop-alerts` channel, mentioning relevant users
   - **SMS** → Twilio API (premium users only, verified via Stripe)
9. **Log results** → write to `notifications_log`

### Error Handling

- **Fortnite API failure:** Log the error, do not send notifications. The cron fires again the next day; no retry within the same day to avoid false positives.
- **Individual notification failure:** If Resend/Twilio/Discord webhook fails for a specific user, log the failure to `notifications_log` with `status = 'failed'` and continue processing remaining users. No automatic retry for individual failures in v1 — failed sends are visible in the user's dashboard under "Recent Alerts" so they can check the shop manually. A retry mechanism can be added later if failure rates warrant it.

**First-run guard:** After the initial seed, skip notifications if no previous day's `shop_history` exists (avoids spamming every watcher on day one).

---

## 6. Initial Data Seed

A one-time seed script runs on first deploy:

1. Fetch full catalog from Fortnite-API.com `/v2/cosmetics` (~3,000 items)
2. Generate `slug` for each item from its name (lowercase, hyphenated, deduplicated with suffix if needed)
3. Populate `items` table with all known cosmetics and whatever history data the API provides
4. Fetch current shop and write initial `shop_history` rows
5. Set a seed-complete flag so the daily cron knows it can start diffing

This ensures users can browse and set alerts for any item from day one, including rare items that haven't been in the shop for years.

---

## 7. Pages & SEO Strategy

### Public Pages (ISR)

| Route | Description | Revalidation |
|-------|-------------|-------------|
| `/` | Landing page — hero, value prop, CTA to browse/sign up | 24 hours |
| `/shop` | Today's item shop | 1 hour |
| `/items` | Browsable catalog with filters (type, rarity, price, last seen) | 6 hours |
| `/items/[slug]` | Individual item page — image, stats, history timeline, "alert me" CTA | 6 hours |
| `/history` | Calendar view of past shops, browse by date | 24 hours |
| `/pricing` | Free vs premium comparison | Static |

`[slug]` is the human-readable URL slug from the `items.slug` column (e.g., `/items/renegade-raider`).

### Authenticated Pages (Dynamic)

| Route | Description |
|-------|-------------|
| `/dashboard` | Watchlist, recent alerts, quick-add search |
| `/dashboard/settings` | Notification preferences, Discord link, phone number, Stripe portal |

### SEO

- ~3,000 item pages = ~3,000 indexable URLs
- Long-tail targets: "[item name] Fortnite shop history", "when is [item] coming back"
- JSON-LD structured data on each item page
- Auto-generated meta descriptions: "Track [Item Name] in the Fortnite Item Shop. Last seen X days ago. Appeared Y times. Get alerts when it returns."

### Ad Placement

- Banner ad on `/shop` (highest daily repeat traffic)
- Sidebar/in-feed ads on `/items` listing
- Ad unit on each `/items/[slug]` page (highest volume from long-tail search)

---

## 8. User Dashboard & Alert Management

### Dashboard (`/dashboard`)

- **My Watchlist** — items being tracked, with status badges ("In Shop Today!", "Last seen 42 days ago")
- **Recent Alerts** — notification history with timestamps and delivery status (including failures)
- **Quick Add** — search bar to find and add items without navigating away

### Settings (`/dashboard/settings`)

- Toggle email/Discord alerts on/off
- Link Discord account via OAuth
- Phone number field for SMS (gated behind premium — shows upgrade CTA for free users)
- Manage premium subscription via Stripe customer portal

---

## 9. Premium Tier

### Free

- Watchlist up to 50 items
- Email alerts
- Discord alerts (via SnowFort server)
- Full catalog browsing (with ads)

### Premium ($3–5/mo via Stripe)

- Unlimited watchlist
- SMS alerts (Twilio)
- Ad-free browsing
- Add Discord bot to your own server
- Priority support

**Note:** "Early notifications" (premium users alerted before free users) is deferred to post-launch. The v1 cron sends all notifications in a single pass. If demand warrants it, a two-pass approach (premium first, free second with a short delay) can be added later.

**Implementation:** Single Stripe product with monthly billing. Stripe webhook updates `user_preferences.is_premium` (idempotent, deduplicated by Stripe event ID). Fallback verification via `stripe_customer_id` on premium-gated actions. Daily reconciliation job to catch missed webhooks.

---

## 10. Discord Bot

### Hosting

discord.js process on Railway Hobby plan (~$5/mo with $5 credit). Runs 24/7. Connects directly to Supabase via the shared `packages/shared` database client.

### Slash Commands

| Command | Description |
|---------|-------------|
| `/track [item name]` | Add item to watchlist (fuzzy search, suggests matches) |
| `/untrack [item name]` | Remove from watchlist |
| `/list` | Show current watchlist |
| `/shop` | Show today's shop items |
| `/check [item name]` | Quick lookup: last seen, times in shop, rarity |

### Alert Delivery

- **SnowFort server:** Daily cron posts to `#shop-alerts` via Discord webhook, mentioning users by their linked Discord ID.
- **Premium — bot in user's server:** Bot posts to a configured channel. Setup via `/setup #channel` slash command.

### Account Linking

User signs into SnowFort web → clicks "Link Discord" → Discord OAuth → stores `discord_user_id` in `user_preferences`. Slash commands use the same ID to look up the user's watchlist.

---

## 11. Notification Services

| Channel | Provider | Free/Premium | Notes |
|---------|----------|-------------|-------|
| Email | Resend | Free | Batch API handles fan-out |
| Discord (SnowFort server) | Discord webhooks | Free | Webhook from cron API route |
| Discord (own server) | Discord bot | Premium | Bot must be in the server |
| SMS | Twilio | Premium | Per-message cost justifies premium gate |

---

## 12. Cost Estimate (Launch)

| Service | Expected Cost |
|---------|--------------|
| Vercel (Hobby) | $0 |
| Supabase (Free tier) | $0 |
| Railway (Hobby, Discord bot) | ~$0–5/mo (has $5 credit) |
| Clerk (shared instance) | $0 |
| Resend (free tier, 3k emails/mo) | $0 |
| Domain (fort.snowforge.dev or snowfort.gg) | $0–15/yr |
| **Total at launch** | **~$0–5/mo** |

Costs that scale with users:
- Resend: $20/mo after 3k emails
- Twilio SMS: ~$0.0079/message (covered by premium subscriptions)
- Supabase: $25/mo if exceeding free tier (500MB DB, 50k MAU)
- Vercel Pro: $20/mo if execution time limit becomes a constraint
- AdSense: revenue starts with traffic (typically $1-5 RPM)

---

## 13. Repo Structure

New repo: `SnowForgeLLC/SnowFort`

```
SnowFort/
├── apps/
│   ├── web/                    # Next.js app (Vercel)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # DB client, API abstraction, utils
│   │   │   └── types/          # Shared TypeScript types
│   │   └── package.json
│   └── discord-bot/            # discord.js bot (Railway)
│       ├── src/
│       │   ├── commands/       # Slash command handlers
│       │   └── index.ts        # Bot entry point
│       └── package.json
├── packages/
│   └── shared/                 # Shared types, constants, Supabase client, API abstraction
│       └── package.json
├── supabase/
│   └── migrations/             # SQL migrations
├── scripts/
│   └── seed.ts                 # Initial catalog seed script
├── pnpm-workspace.yaml
├── package.json
├── CLAUDE.md
└── PROGRESS.md
```

Monorepo with pnpm workspaces. Shared types and Supabase client between web and bot via the `packages/shared` package.

---

## 14. SnowForge UI Unification

Per the SnowForge CLAUDE.md, SnowFort should adopt the SnowScrape sidebar pattern:

- Collapsible sidebar with SnowFort logo
- Quick action button ("Track an Item")
- Icon-based navigation: Shop, Items, History, Dashboard, Settings
- Mobile-responsive with overlay
- Consistent Tailwind design tokens shared across SnowForge apps

The public catalog pages (`/shop`, `/items`, `/history`) use a simpler layout (no sidebar) optimized for SEO and ad placement. The sidebar appears once authenticated in `/dashboard`.

---

## 15. Environment Variables

### Vercel (Web App)

| Variable | Service | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Shared SnowForge instance |
| `CLERK_SECRET_KEY` | Clerk | |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Client-side (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-side only (cron job, admin) |
| `DATABASE_URL` | Supabase | Pooled Postgres connection string |
| `CRON_SECRET` | Vercel | Auto-set by Vercel for cron auth |
| `STRIPE_SECRET_KEY` | Stripe | |
| `STRIPE_WEBHOOK_SECRET` | Stripe | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | |
| `RESEND_API_KEY` | Resend | |
| `TWILIO_ACCOUNT_SID` | Twilio | |
| `TWILIO_AUTH_TOKEN` | Twilio | |
| `TWILIO_PHONE_NUMBER` | Twilio | |
| `DISCORD_WEBHOOK_URL` | Discord | For #shop-alerts channel |
| `SHOP_POLL_DELAY_MS` | App config | Default: 0 (v1), configurable |

### Railway (Discord Bot)

| Variable | Service | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Supabase | Pooled Postgres connection string |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | For direct DB access |
| `DISCORD_BOT_TOKEN` | Discord | Bot authentication |
| `DISCORD_CLIENT_ID` | Discord | For slash command registration |
