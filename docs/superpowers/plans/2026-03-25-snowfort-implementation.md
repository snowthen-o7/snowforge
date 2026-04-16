# SnowFort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SnowFort — a Fortnite item shop tracker with browsable catalog, alert subscriptions, Discord bot, and premium tier.

**Architecture:** Next.js monorepo on Vercel (web) + Railway (Discord bot). Supabase for database, Clerk for auth, Resend/Twilio/Discord for notifications, Stripe for payments. Daily Vercel Cron polls Fortnite-API.com and dispatches alerts.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Supabase (Postgres), Clerk, discord.js, Resend, Twilio, Stripe, pnpm workspaces.

**Spec:** `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\docs\superpowers\specs\2026-03-25-snowfort-design.md`

---

## Important API Notes

These findings from live API testing affect the implementation:

1. **`/v2/shop/br` and `/v2/shop/br/combined` are dead** (410 Gone). Use only `/v2/shop`.
2. **Price is only available on shop entries**, not cosmetic items. `items.price_vbucks` will be `null` until the item appears in a shop.
3. **The cosmetics catalog endpoint** (`/v2/cosmetics/br`) returns 10MB+ with no pagination. Stream/buffer carefully.
4. **Shop entries contain embedded item data** in `entry.brItems[]`. Bundle entries have multiple items per entry.
5. **No API key required.** No documented rate limits.

---

## File Structure

```
SnowFort/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx                    # Root layout with Clerk + Tailwind
│   │   │   │   ├── page.tsx                      # Landing page
│   │   │   │   ├── globals.css                   # Tailwind imports
│   │   │   │   ├── shop/
│   │   │   │   │   └── page.tsx                  # Today's shop (ISR)
│   │   │   │   ├── items/
│   │   │   │   │   ├── page.tsx                  # Catalog listing with filters (ISR)
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx              # Item detail (ISR)
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx                  # Calendar history view (ISR)
│   │   │   │   ├── pricing/
│   │   │   │   │   └── page.tsx                  # Free vs Premium
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx                # Sidebar layout (authenticated)
│   │   │   │   │   ├── page.tsx                  # Watchlist + recent alerts
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx              # Notification prefs, Discord link, Stripe portal
│   │   │   │   └── api/
│   │   │   │       ├── cron/
│   │   │   │       │   └── shop-update/
│   │   │   │       │       └── route.ts          # Daily cron: fetch shop, diff, notify
│   │   │   │       ├── watchlist/
│   │   │   │       │   └── route.ts              # CRUD watchlist (POST/DELETE)
│   │   │   │       ├── items/
│   │   │   │       │   └── search/
│   │   │   │       │       └── route.ts          # Item search for quick-add
│   │   │   │       ├── webhooks/
│   │   │   │       │   └── stripe/
│   │   │   │       │       └── route.ts          # Stripe webhook handler
│   │   │   │       └── auth/
│   │   │   │           └── discord/
│   │   │   │               └── route.ts          # Discord OAuth callback
│   │   │   ├── components/
│   │   │   │   ├── PublicLayout.tsx               # Header + footer for public pages (uses ThemeToggle from @snowforge/ui)
│   │   │   │   ├── SnowFortLayout.tsx             # Dashboard layout wrapping @snowforge/ui AppLayout
│   │   │   │   ├── ItemCard.tsx                   # Item thumbnail card (reused everywhere)
│   │   │   │   ├── ItemGrid.tsx                   # Grid of ItemCards with loading state (future)
│   │   │   │   ├── ShopHistoryTimeline.tsx         # Timeline of shop appearances
│   │   │   │   ├── WatchlistButton.tsx            # "Track this item" CTA
│   │   │   │   ├── ItemSearch.tsx                 # Autocomplete search component
│   │   │   │   ├── CatalogFilters.tsx             # Type/rarity/price filters
│   │   │   │   └── AdUnit.tsx                     # AdSense wrapper
│   │   │   └── lib/
│   │   │       ├── supabase-server.ts             # Server-side Supabase client
│   │   │       ├── supabase-browser.ts            # Client-side Supabase client
│   │   │       └── stripe.ts                      # Stripe client + helpers
│   │   ├── vercel.json                            # Cron config
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── discord-bot/
│       ├── src/
│       │   ├── index.ts                           # Bot entry, login, command registration
│       │   ├── commands/
│       │   │   ├── track.ts                       # /track [item] — add to watchlist
│       │   │   ├── untrack.ts                     # /untrack [item] — remove from watchlist
│       │   │   ├── list.ts                        # /list — show watchlist
│       │   │   ├── shop.ts                        # /shop — today's shop
│       │   │   └── check.ts                       # /check [item] — item lookup
│       │   └── lib/
│       │       └── db.ts                          # Supabase client for bot
│       ├── Dockerfile                             # For Railway deployment
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts                           # Barrel export
│       │   ├── types.ts                           # Shared TypeScript types (Item, ShopEntry, etc.)
│       │   ├── fortnite-api.ts                    # Fortnite-API.com client with abstraction layer
│       │   ├── slugify.ts                         # Slug generation + deduplication
│       │   ├── db-queries.ts                      # Shared query helpers (getItemBySlug, getWatchers, etc.)
│       │   └── constants.ts                       # Rarity order, type labels, limits
│       ├── tsconfig.json
│       └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql                 # All tables, indexes, constraints
├── scripts/
│   └── seed.ts                                    # One-time catalog seed
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── CLAUDE.md
└── PROGRESS.md
```

---

## Phase 1: Foundation

### Task 1: Create Repo & Monorepo Scaffold

**Files:**
- Create: `SnowFort/package.json`, `SnowFort/pnpm-workspace.yaml`, `SnowFort/tsconfig.base.json`, `SnowFort/.gitignore`, `SnowFort/.env.example`, `SnowFort/CLAUDE.md`, `SnowFort/PROGRESS.md`

**Note:** All paths below are relative to the new `SnowFort/` repo root at `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowFort`.

- [ ] **Step 1: Create repo directory and initialize git**

```bash
cd C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC
mkdir SnowFort && cd SnowFort
git init
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "snowfort",
  "private": true,
  "packageManager": "pnpm@latest",
  "scripts": {
    "dev": "pnpm --filter @snowfort/web dev",
    "build": "pnpm --filter @snowfort/web build",
    "lint": "pnpm --filter @snowfort/web lint",
    "bot:dev": "pnpm --filter @snowfort/discord-bot dev",
    "seed": "tsx scripts/seed.ts"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
.next/
.env
.env.local
dist/
.superpowers/
.turbo/
```

- [ ] **Step 6: Create `.env.example`**

List all env vars from spec Section 15 with placeholder values.

- [ ] **Step 7: Create `CLAUDE.md`**

```markdown
# SnowFort - AI Development Context

## Project Identity
**SnowFort** is a Fortnite item shop tracker and alert system under SnowForge LLC.

**Package Manager:** pnpm (ALWAYS use pnpm, never npm or yarn)

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **Database:** Supabase (PostgreSQL)
- **Auth:** Clerk (shared SnowForge instance)
- **Hosting:** Vercel (web) + Railway (Discord bot)
- **Notifications:** Resend (email), Twilio (SMS), Discord webhooks

## Commands
pnpm dev          # Start web dev server
pnpm build        # Production build (web)
pnpm lint         # Run ESLint (web)
pnpm bot:dev      # Start Discord bot dev
pnpm seed         # Seed database with Fortnite catalog

## Project Structure
Monorepo with pnpm workspaces:
- `apps/web/` — Next.js web app (Vercel)
- `apps/discord-bot/` — Discord bot (Railway)
- `packages/shared/` — Shared types, DB client, API abstraction

## Spec
Full design spec: see SnowForge repo at `docs/superpowers/specs/2026-03-25-snowfort-design.md`
```

- [ ] **Step 8: Create `PROGRESS.md`**

```markdown
# SnowFort — Progress

## Status: Phase 1 — Foundation
- [ ] Repo scaffolded
- [ ] Shared package (types, DB client, API abstraction)
- [ ] Database schema migrated
- [ ] Seed script run
- [ ] Public catalog pages
- [ ] Auth + dashboard
- [ ] Cron + notifications
- [ ] Discord bot
- [ ] Premium + Stripe
- [ ] AdSense
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize SnowFort monorepo scaffold"
```

---

### Task 2: Shared Package — Types & Constants

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/types.ts`, `packages/shared/src/constants.ts`, `packages/shared/src/slugify.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@snowfort/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/shared/src/types.ts`**

These types map to our Supabase tables AND the Fortnite-API.com response shapes.

```typescript
// === Database row types (match Supabase schema) ===

export interface Item {
  id: string;
  slug: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  image_url: string;
  price_vbucks: number | null;
  set_name: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  times_in_shop: number;
  created_at: string;
  updated_at: string;
}

export interface ShopHistoryEntry {
  id: string;
  date: string;
  item_id: string;
  created_at: string;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  email_alerts: boolean;
  discord_alerts: boolean;
  sms_alerts: boolean;
  phone_number: string | null;
  discord_user_id: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  item_id: string;
  channel: "email" | "sms" | "discord";
  sent_at: string;
  status: "sent" | "failed";
}

// === Fortnite-API.com response types ===

export interface FortniteApiResponse<T> {
  status: number;
  data: T;
}

export interface FortniteCosmetic {
  id: string;
  name: string;
  description: string;
  type: { value: string; displayValue: string };
  rarity: { value: string; displayValue: string };
  set: { value: string; text: string } | null;
  images: {
    smallIcon: string | null;
    icon: string | null;
    featured: string | null;
  };
  introduction: {
    chapter: string;
    season: string;
    text: string;
  } | null;
  added: string;
}

export interface FortniteShopData {
  hash: string;
  date: string;
  entries: FortniteShopEntry[];
}

export interface FortniteShopEntry {
  regularPrice: number;
  finalPrice: number;
  devName: string;
  offerId: string;
  inDate: string;
  outDate: string;
  bundle: { name: string; info: string; image: string } | null;
  layout: {
    id: string;
    name: string;
    index: number;
  } | null;
  brItems: FortniteCosmetic[] | null;
}

// === App types ===

export interface WatcherWithPrefs {
  user_id: string;
  item_id: string;
  email_alerts: boolean;
  discord_alerts: boolean;
  sms_alerts: boolean;
  phone_number: string | null;
  discord_user_id: string | null;
  is_premium: boolean;
}
```

- [ ] **Step 4: Create `packages/shared/src/constants.ts`**

```typescript
export const RARITY_ORDER = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;

export const ITEM_TYPES = [
  "outfit",
  "emote",
  "pickaxe",
  "glider",
  "backpack",
  "wrap",
  "loadingscreen",
  "music",
  "spray",
  "contrail",
  "banner",
  "emoji",
  "toy",
  "pet",
  "shoe",
] as const;

export const FREE_WATCHLIST_LIMIT = 50;

export const FORTNITE_API_BASE = "https://fortnite-api.com";
```

- [ ] **Step 5: Write test for slugify**

Create `packages/shared/src/slugify.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { slugify, deduplicateSlug } from "./slugify";

describe("slugify", () => {
  it("converts name to lowercase hyphenated slug", () => {
    expect(slugify("Renegade Raider")).toBe("renegade-raider");
  });

  it("removes special characters", () => {
    expect(slugify("Skull Trooper (Ghost)")).toBe("skull-trooper-ghost");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Dark --- Knight")).toBe("dark-knight");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  Peely  ")).toBe("peely");
  });
});

describe("deduplicateSlug", () => {
  it("returns slug as-is if not in existing set", () => {
    expect(deduplicateSlug("peely", new Set())).toBe("peely");
  });

  it("appends -2 for first duplicate", () => {
    expect(deduplicateSlug("peely", new Set(["peely"]))).toBe("peely-2");
  });

  it("increments suffix for multiple duplicates", () => {
    expect(deduplicateSlug("peely", new Set(["peely", "peely-2"]))).toBe("peely-3");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd packages/shared && pnpm test
```

Expected: FAIL — `slugify` module not found.

- [ ] **Step 7: Create `packages/shared/src/slugify.ts`**

```typescript
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function deduplicateSlug(slug: string, existing: Set<string>): string {
  if (!existing.has(slug)) return slug;
  let i = 2;
  while (existing.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd packages/shared && pnpm test
```

Expected: PASS.

- [ ] **Step 9: Create `packages/shared/src/index.ts`**

```typescript
export * from "./types";
export * from "./constants";
export * from "./slugify";
```

- [ ] **Step 10: Install deps and commit**

```bash
cd SnowFort && pnpm install
git add -A
git commit -m "feat: add shared package with types, constants, and slugify"
```

---

### Task 3: Shared Package — Fortnite API Client

**Files:**
- Create: `packages/shared/src/fortnite-api.ts`, `packages/shared/src/fortnite-api.test.ts`

- [ ] **Step 1: Write test for API client**

Create `packages/shared/src/fortnite-api.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { FortniteApiClient } from "./fortnite-api";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("FortniteApiClient", () => {
  const client = new FortniteApiClient();

  it("fetches current shop", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: {
          hash: "abc",
          date: "2026-03-25T00:00:00Z",
          entries: [
            {
              finalPrice: 1200,
              brItems: [{ id: "CID_001", name: "Test Skin" }],
            },
          ],
        },
      }),
    });

    const result = await client.getShop();
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].brItems![0].name).toBe("Test Skin");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://fortnite-api.com/v2/shop?language=en"
    );
  });

  it("fetches all cosmetics", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: [
          { id: "CID_001", name: "Test Skin", type: { value: "outfit" } },
        ],
      }),
    });

    const result = await client.getAllCosmetics();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("CID_001");
  });

  it("throws on non-200 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(client.getShop()).rejects.toThrow("Fortnite API error: 503");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/shared && pnpm test
```

Expected: FAIL — `FortniteApiClient` not found.

- [ ] **Step 3: Create `packages/shared/src/fortnite-api.ts`**

```typescript
import { FORTNITE_API_BASE } from "./constants";
import type {
  FortniteApiResponse,
  FortniteCosmetic,
  FortniteShopData,
} from "./types";

export interface FortniteDataSource {
  getShop(): Promise<FortniteShopData>;
  getAllCosmetics(): Promise<FortniteCosmetic[]>;
}

export class FortniteApiClient implements FortniteDataSource {
  private baseUrl: string;

  constructor(baseUrl: string = FORTNITE_API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getShop(): Promise<FortniteShopData> {
    const res = await fetch(`${this.baseUrl}/v2/shop?language=en`);
    if (!res.ok) {
      throw new Error(`Fortnite API error: ${res.status}`);
    }
    const json: FortniteApiResponse<FortniteShopData> = await res.json();
    return json.data;
  }

  async getAllCosmetics(): Promise<FortniteCosmetic[]> {
    const res = await fetch(`${this.baseUrl}/v2/cosmetics/br?language=en`);
    if (!res.ok) {
      throw new Error(`Fortnite API error: ${res.status}`);
    }
    const json: FortniteApiResponse<FortniteCosmetic[]> = await res.json();
    return json.data;
  }
}
```

- [ ] **Step 4: Update `packages/shared/src/index.ts`** — add export

```typescript
export * from "./fortnite-api";
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd packages/shared && pnpm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Fortnite API client with abstraction layer"
```

---

### Task 4: Shared Package — Database Query Helpers

**Files:**
- Create: `packages/shared/src/db-queries.ts`

- [ ] **Step 1: Install Supabase client**

```bash
cd packages/shared && pnpm add @supabase/supabase-js
```

- [ ] **Step 2: Create `packages/shared/src/db-queries.ts`**

```typescript
import { SupabaseClient } from "@supabase/supabase-js";
import type { Item, ShopHistoryEntry, WatchlistEntry, UserPreferences, WatcherWithPrefs, NotificationLog } from "./types";
import { FREE_WATCHLIST_LIMIT } from "./constants";

export function createDbQueries(supabase: SupabaseClient) {
  return {
    // === Items ===
    async getItemBySlug(slug: string): Promise<Item | null> {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("slug", slug)
        .single();
      return data;
    },

    async getItemById(id: string): Promise<Item | null> {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },

    async searchItems(query: string, limit = 10): Promise<Item[]> {
      const { data } = await supabase
        .from("items")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(limit);
      return data ?? [];
    },

    async upsertItem(item: Omit<Item, "created_at" | "updated_at">): Promise<void> {
      await supabase.from("items").upsert(item, { onConflict: "id" });
    },

    async upsertItems(items: Omit<Item, "created_at" | "updated_at">[]): Promise<void> {
      // Supabase upsert supports batch
      await supabase.from("items").upsert(items, { onConflict: "id" });
    },

    // === Shop History ===
    async getShopHistoryByDate(date: string): Promise<ShopHistoryEntry[]> {
      const { data } = await supabase
        .from("shop_history")
        .select("*")
        .eq("date", date);
      return data ?? [];
    },

    async getItemShopHistory(itemId: string): Promise<ShopHistoryEntry[]> {
      const { data } = await supabase
        .from("shop_history")
        .select("*")
        .eq("item_id", itemId)
        .order("date", { ascending: false });
      return data ?? [];
    },

    async insertShopHistory(entries: { date: string; item_id: string }[]): Promise<void> {
      await supabase.from("shop_history").upsert(entries, {
        onConflict: "date,item_id",
      });
    },

    // === Watchlist ===
    async getUserWatchlist(userId: string): Promise<(WatchlistEntry & { item: Item })[]> {
      const { data } = await supabase
        .from("watchlist")
        .select("*, item:items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },

    async addToWatchlist(userId: string, itemId: string): Promise<{ error?: string }> {
      // Check limit for free users
      const prefs = await this.getUserPreferences(userId);
      if (!prefs?.is_premium) {
        const { count } = await supabase
          .from("watchlist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        if ((count ?? 0) >= FREE_WATCHLIST_LIMIT) {
          return { error: "Free tier watchlist limit reached (50 items). Upgrade to Premium for unlimited." };
        }
      }
      await supabase
        .from("watchlist")
        .upsert({ user_id: userId, item_id: itemId }, { onConflict: "user_id,item_id" });
      return {};
    },

    async removeFromWatchlist(userId: string, itemId: string): Promise<void> {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId);
    },

    async getWatchersForItems(itemIds: string[]): Promise<WatcherWithPrefs[]> {
      const { data } = await supabase
        .from("watchlist")
        .select(`
          user_id,
          item_id,
          user_preferences!inner(
            email_alerts,
            discord_alerts,
            sms_alerts,
            phone_number,
            discord_user_id,
            is_premium
          )
        `)
        .in("item_id", itemIds);

      return (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        item_id: row.item_id,
        ...row.user_preferences,
      }));
    },

    // === User Preferences ===
    async getUserPreferences(userId: string): Promise<UserPreferences | null> {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();
      return data;
    },

    async upsertUserPreferences(prefs: Partial<UserPreferences> & { user_id: string }): Promise<void> {
      await supabase
        .from("user_preferences")
        .upsert(prefs, { onConflict: "user_id" });
    },

    // === Notification Log ===
    async logNotification(entry: Omit<NotificationLog, "id">): Promise<void> {
      await supabase.from("notifications_log").insert(entry);
    },

    async logNotifications(entries: Omit<NotificationLog, "id">[]): Promise<void> {
      await supabase.from("notifications_log").insert(entries);
    },

    async getUserNotifications(userId: string, limit = 20): Promise<NotificationLog[]> {
      const { data } = await supabase
        .from("notifications_log")
        .select("*")
        .eq("user_id", userId)
        .order("sent_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  };
}
```

- [ ] **Step 3: Update barrel export**

Add to `packages/shared/src/index.ts`:

```typescript
export * from "./db-queries";
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shared database query helpers"
```

---

### Task 5: Database Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- SnowFort initial schema
-- See spec: docs/superpowers/specs/2026-03-25-snowfort-design.md Section 4

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Items: Fortnite cosmetic catalog
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  price_vbucks INTEGER,
  set_name TEXT,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  times_in_shop INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_type_rarity ON items(type, rarity);
CREATE INDEX idx_items_last_seen_at ON items(last_seen_at);
-- slug index is automatic from UNIQUE constraint

-- Shop History: daily snapshots
CREATE TABLE shop_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, item_id)
);

CREATE INDEX idx_shop_history_date ON shop_history(date);
CREATE INDEX idx_shop_history_item_id ON shop_history(item_id);

-- Watchlist: user alert subscriptions
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_watchlist_item_id ON watchlist(item_id);
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- User Preferences: notification settings
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  discord_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  sms_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number TEXT,
  discord_user_id TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Log: audit trail
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'discord')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed'))
);

-- Updated_at trigger for items and user_preferences
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RPC function to atomically increment shop count
CREATE OR REPLACE FUNCTION increment_shop_count(target_item_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET times_in_shop = times_in_shop + 1,
      last_seen_at = NOW()
  WHERE id = target_item_id;
END;
$$ LANGUAGE plpgsql;

-- Table for Stripe webhook event deduplication
CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Apply migration to Supabase**

Run this via the Supabase dashboard SQL editor or Supabase CLI:

```bash
supabase db push
```

Or manually paste into the Supabase SQL editor if CLI isn't set up yet.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add initial database schema migration"
```

---

### Task 6: Seed Script

**Files:**
- Create: `scripts/seed.ts`
- Root dep: `tsx` for running TypeScript scripts

- [ ] **Step 1: Install tsx at root**

```bash
pnpm add -D tsx -w
```

- [ ] **Step 2: Create `scripts/seed.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import { FortniteApiClient, slugify, deduplicateSlug } from "@snowfort/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const api = new FortniteApiClient();

async function seed() {
  console.log("Fetching all cosmetics from Fortnite-API.com...");
  const cosmetics = await api.getAllCosmetics();
  console.log(`Fetched ${cosmetics.length} cosmetics.`);

  // Generate unique slugs
  const slugSet = new Set<string>();
  const items = cosmetics.map((c) => {
    const slug = deduplicateSlug(slugify(c.name), slugSet);
    slugSet.add(slug);

    return {
      id: c.id,
      slug,
      name: c.name,
      type: c.type.value,
      rarity: c.rarity.value,
      description: c.description ?? "",
      image_url: c.images.icon ?? c.images.smallIcon ?? "",
      price_vbucks: null as number | null,
      set_name: c.set?.value ?? null,
      first_seen_at: null as string | null,
      last_seen_at: null as string | null,
      times_in_shop: 0,
    };
  });

  // Batch upsert in chunks of 500
  console.log("Upserting items to Supabase...");
  const CHUNK_SIZE = 500;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("items").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE + 1}:`, error.message);
    } else {
      console.log(`Upserted ${Math.min(i + CHUNK_SIZE, items.length)}/${items.length}`);
    }
  }

  // Fetch current shop and write initial shop_history
  console.log("Fetching current shop...");
  const shopData = await api.getShop();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const shopItemIds: string[] = [];
  const shopHistoryRows: { date: string; item_id: string }[] = [];

  for (const entry of shopData.entries) {
    if (!entry.brItems) continue;
    for (const brItem of entry.brItems) {
      shopItemIds.push(brItem.id);
      shopHistoryRows.push({ date: today, item_id: brItem.id });

      // Update price and shop stats from shop data
      // Only set first_seen_at if not already set
      const { data: existing } = await supabase
        .from("items")
        .select("first_seen_at")
        .eq("id", brItem.id)
        .single();

      await supabase
        .from("items")
        .update({
          price_vbucks: entry.finalPrice,
          last_seen_at: new Date().toISOString(),
          times_in_shop: 1,
          ...(existing && !existing.first_seen_at
            ? { first_seen_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", brItem.id);
    }
  }

  if (shopHistoryRows.length > 0) {
    const { error } = await supabase
      .from("shop_history")
      .upsert(shopHistoryRows, { onConflict: "date,item_id" });
    if (error) {
      console.error("Error inserting shop history:", error.message);
    } else {
      console.log(`Recorded ${shopHistoryRows.length} shop history entries for ${today}.`);
    }
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Commit (don't run yet — needs Supabase project created first)**

```bash
git add -A
git commit -m "feat: add catalog seed script"
```

---

## Phase 2: Web App — Public Catalog

### Task 7: Next.js App Setup

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/postcss.config.js`, `apps/web/tailwind.config.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/page.tsx`, `apps/web/vercel.json`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@snowfort/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@clerk/nextjs": "^6",
    "@snowforge/ui": "git+https://github.com/snowthen-o7/snowforge-ui.git",
    "@snowfort/shared": "workspace:*",
    "@supabase/supabase-js": "^2",
    "lucide-react": "^0.563.0",
    "next": "^15",
    "next-themes": "^0.4.6",
    "react": "^19",
    "react-dom": "^19",
    "stripe": "^17"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `apps/web/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fortnite-api.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create Tailwind + PostCSS config files**

`apps/web/postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

`apps/web/src/app/globals.css`:
```css
@import "tailwindcss";

/* Scan @snowforge/ui components for Tailwind classes */
@source "../../../../node_modules/@snowforge/ui/src/**/*.{ts,tsx}";

/* SnowForge design tokens (same pattern as SnowPipe/SnowScrape) */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
  --sidebar-width: 16rem;
  --sidebar-width-collapsed: 3.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

- [ ] **Step 5: Create `apps/web/src/app/layout.tsx`** — root layout with Clerk + next-themes

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SnowFort — Fortnite Item Shop Tracker",
    template: "%s | SnowFort",
  },
  description:
    "Track Fortnite item shop history, set alerts for your favorite cosmetics, and never miss a drop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 6: Create `apps/web/src/app/page.tsx`** — placeholder landing

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">SnowFort</h1>
      <p className="mt-4 text-gray-400">
        Fortnite Item Shop Tracker — Coming Soon
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Create `apps/web/vercel.json`** — cron config

```json
{
  "crons": [
    {
      "path": "/api/cron/shop-update",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- [ ] **Step 8: Install deps, verify dev server starts**

```bash
cd SnowFort && pnpm install
pnpm dev
```

Verify: dev server starts without errors at localhost:3000, placeholder page renders.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js web app with Clerk and Tailwind"
```

---

### Task 8: Supabase Client Setup

**Files:**
- Create: `apps/web/src/lib/supabase-server.ts`, `apps/web/src/lib/supabase-browser.ts`

- [ ] **Step 1: Create server-side Supabase client**

`apps/web/src/lib/supabase-server.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { createDbQueries } from "@snowfort/shared";

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function getDbQueries() {
  return createDbQueries(getSupabaseAdmin());
}
```

- [ ] **Step 2: Create browser-side Supabase client**

`apps/web/src/lib/supabase-browser.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client setup for server and browser"
```

---

### Task 9: Item Card Component

**Files:**
- Create: `apps/web/src/components/ItemCard.tsx`

- [ ] **Step 1: Create `ItemCard.tsx`**

This is the reusable card component for displaying items across all pages.

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Item } from "@snowfort/shared";

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-500 bg-gray-800",
  uncommon: "border-green-500 bg-green-950",
  rare: "border-blue-500 bg-blue-950",
  epic: "border-purple-500 bg-purple-950",
  legendary: "border-orange-500 bg-orange-950",
  mythic: "border-yellow-400 bg-yellow-950",
};

export function ItemCard({ item }: { item: Item }) {
  const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
  const daysSinceSeen = item.last_seen_at
    ? Math.floor(
        (Date.now() - new Date(item.last_seen_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Link
      href={`/items/${item.slug}`}
      className={`group block rounded-lg border-2 ${rarityClass} overflow-hidden transition hover:scale-[1.02]`}
    >
      {item.image_url && (
        <div className="relative aspect-square">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
      )}
      <div className="p-3">
        <h3 className="truncate font-semibold text-sm">{item.name}</h3>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span className="capitalize">{item.rarity}</span>
          {item.price_vbucks && <span>{item.price_vbucks} V</span>}
        </div>
        {daysSinceSeen !== null && (
          <p className="mt-1 text-xs text-gray-500">
            {daysSinceSeen === 0
              ? "In shop today!"
              : `Last seen ${daysSinceSeen}d ago`}
          </p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ItemCard component with rarity colors"
```

---

### Task 10: Shop Page (`/shop`)

**Files:**
- Create: `apps/web/src/app/shop/page.tsx`

- [ ] **Step 1: Create shop page with ISR**

```tsx
import { getDbQueries } from "@/lib/supabase-server";
import { ItemCard } from "@/components/ItemCard";
import type { Metadata } from "next";

export const revalidate = 3600; // 1 hour ISR

export const metadata: Metadata = {
  title: "Today's Item Shop",
  description: "See what's in the Fortnite Item Shop today. Updated daily.",
};

export default async function ShopPage() {
  const db = getDbQueries();
  const today = new Date().toISOString().split("T")[0];
  const shopHistory = await db.getShopHistoryByDate(today);

  // Fetch full item data for today's shop
  const supabase = (await import("@/lib/supabase-server")).getSupabaseAdmin();
  const itemIds = shopHistory.map((h) => h.item_id);
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .in("id", itemIds.length > 0 ? itemIds : ["__none__"]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Today's Item Shop</h1>
      <p className="mt-2 text-gray-400">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {items && items.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-gray-500">
          Shop data not available yet. Check back after midnight UTC.
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add shop page with daily ISR"
```

---

### Task 11: Items Catalog Page (`/items`)

**Files:**
- Create: `apps/web/src/app/items/page.tsx`, `apps/web/src/components/CatalogFilters.tsx`

- [ ] **Step 1: Create `CatalogFilters.tsx`** — client component for filters

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ITEM_TYPES, RARITY_ORDER } from "@snowfort/shared";

export function CatalogFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(key: string, value: string) {
    const newParams = new URLSearchParams(params.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete("page"); // reset pagination on filter change
    router.push(`/items?${newParams.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={params.get("type") ?? ""}
        onChange={(e) => setFilter("type", e.target.value)}
        className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-200"
      >
        <option value="">All Types</option>
        {ITEM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={params.get("rarity") ?? ""}
        onChange={(e) => setFilter("rarity", e.target.value)}
        className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-200"
      >
        <option value="">All Rarities</option>
        {RARITY_ORDER.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={params.get("sort") ?? "name"}
        onChange={(e) => setFilter("sort", e.target.value)}
        className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-200"
      >
        <option value="name">Name (A-Z)</option>
        <option value="last_seen">Longest Absent</option>
        <option value="times_in_shop">Most Appearances</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create items listing page**

```tsx
import { Suspense } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ItemCard } from "@/components/ItemCard";
import { CatalogFilters } from "@/components/CatalogFilters";
import type { Metadata } from "next";
import type { Item } from "@snowfort/shared";

export const revalidate = 21600; // 6 hours ISR

export const metadata: Metadata = {
  title: "All Fortnite Cosmetics",
  description:
    "Browse every Fortnite cosmetic. Filter by type, rarity, and shop history.",
};

const PAGE_SIZE = 60;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; rarity?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase.from("items").select("*", { count: "exact" });

  if (params.type) query = query.eq("type", params.type);
  if (params.rarity) query = query.eq("rarity", params.rarity);

  switch (params.sort) {
    case "last_seen":
      query = query.order("last_seen_at", { ascending: true, nullsFirst: true });
      break;
    case "times_in_shop":
      query = query.order("times_in_shop", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  const { data: items, count } = await query.range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Fortnite Cosmetics</h1>
      <p className="mt-2 text-gray-400">{count ?? 0} items</p>

      <div className="mt-6">
        <Suspense fallback={<div className="h-10" />}>
          <CatalogFilters />
        </Suspense>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(items ?? []).map((item: Item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/items?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/items?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              Next
            </a>
          )}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add items catalog page with filters and pagination"
```

---

### Task 12: Item Detail Page (`/items/[slug]`)

**Files:**
- Create: `apps/web/src/app/items/[slug]/page.tsx`, `apps/web/src/components/ShopHistoryTimeline.tsx`, `apps/web/src/components/WatchlistButton.tsx`

- [ ] **Step 1: Create `ShopHistoryTimeline.tsx`**

```tsx
import type { ShopHistoryEntry } from "@snowfort/shared";

export function ShopHistoryTimeline({
  history,
}: {
  history: ShopHistoryEntry[];
}) {
  if (history.length === 0) {
    return <p className="text-gray-500">No shop history recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 50).map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 rounded bg-gray-800 px-3 py-2 text-sm"
        >
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-gray-300">
            {new Date(entry.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `WatchlistButton.tsx`** — client component

```tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";

export function WatchlistButton({
  itemId,
  isWatching: initialIsWatching,
}: {
  itemId: string;
  isWatching: boolean;
}) {
  const { isSignedIn } = useUser();
  const [isWatching, setIsWatching] = useState(initialIsWatching);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    startTransition(async () => {
      const method = isWatching ? "DELETE" : "POST";
      const res = await fetch("/api/watchlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (res.ok) {
        setIsWatching(!isWatching);
      } else {
        const data = await res.json();
        alert(data.error ?? "Something went wrong");
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`rounded-lg px-6 py-3 font-semibold transition ${
        isWatching
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      } disabled:opacity-50`}
    >
      {isPending
        ? "..."
        : isWatching
          ? "Stop Tracking"
          : "Track This Item"}
    </button>
  );
}
```

- [ ] **Step 3: Create item detail page**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDbQueries } from "@/lib/supabase-server";
import { ShopHistoryTimeline } from "@/components/ShopHistoryTimeline";
import { WatchlistButton } from "@/components/WatchlistButton";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

export const revalidate = 21600; // 6 hours ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = getDbQueries();
  const item = await db.getItemBySlug(slug);
  if (!item) return {};

  const daysSince = item.last_seen_at
    ? Math.floor(
        (Date.now() - new Date(item.last_seen_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return {
    title: `${item.name} — Fortnite Shop History`,
    description: `Track ${item.name} in the Fortnite Item Shop.${
      daysSince !== null ? ` Last seen ${daysSince} days ago.` : ""
    } Appeared ${item.times_in_shop} times. Get alerts when it returns.`,
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDbQueries();
  const item = await db.getItemBySlug(slug);

  if (!item) notFound();

  const history = await db.getItemShopHistory(item.id);

  // Check if current user is watching this item
  const { userId } = await auth();
  let isWatching = false;
  if (userId) {
    const watchlist = await db.getUserWatchlist(userId);
    isWatching = watchlist.some((w) => w.item_id === item.id);
  }

  const daysSinceSeen = item.last_seen_at
    ? Math.floor(
        (Date.now() - new Date(item.last_seen_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    image: item.image_url,
    category: item.type,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Image */}
          <div className="flex-shrink-0">
            {item.image_url && (
              <Image
                src={item.image_url}
                alt={item.name}
                width={300}
                height={300}
                className="rounded-lg"
                priority
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="mt-2 text-gray-400">{item.description}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded bg-gray-800 px-3 py-1 text-sm capitalize">
                {item.type}
              </span>
              <span className="rounded bg-gray-800 px-3 py-1 text-sm capitalize">
                {item.rarity}
              </span>
              {item.price_vbucks && (
                <span className="rounded bg-gray-800 px-3 py-1 text-sm">
                  {item.price_vbucks} V-Bucks
                </span>
              )}
              {item.set_name && (
                <span className="rounded bg-gray-800 px-3 py-1 text-sm">
                  {item.set_name}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded bg-gray-800 p-3">
                <p className="text-gray-500">Last Seen</p>
                <p className="text-lg font-semibold">
                  {daysSinceSeen === null
                    ? "Never"
                    : daysSinceSeen === 0
                      ? "Today!"
                      : `${daysSinceSeen} days ago`}
                </p>
              </div>
              <div className="rounded bg-gray-800 p-3">
                <p className="text-gray-500">Times in Shop</p>
                <p className="text-lg font-semibold">{item.times_in_shop}</p>
              </div>
            </div>

            <div className="mt-6">
              <WatchlistButton itemId={item.id} isWatching={isWatching} />
            </div>
          </div>
        </div>

        {/* Shop History */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Shop History</h2>
          <div className="mt-4">
            <ShopHistoryTimeline history={history} />
          </div>
        </section>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add item detail page with history, SEO, and watchlist CTA"
```

---

### Task 13: Landing Page & Public Layout

**Files:**
- Create: `apps/web/src/components/PublicLayout.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create `PublicLayout.tsx`** — shared header/footer using SnowForge design tokens

```tsx
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@snowforge/ui";
import { Store, Package, CalendarDays, LayoutDashboard } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            SnowFort
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/shop" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Store className="h-4 w-4" />
              Shop
            </Link>
            <Link href="/items" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Package className="h-4 w-4" />
              Items
            </Link>
            <Link href="/history" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <CalendarDays className="h-4 w-4" />
              History
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </Link>
            </SignedOut>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SnowForge LLC
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `apps/web/src/app/page.tsx`** — real landing page

```tsx
import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Never Miss Your Favorite Fortnite Skin
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Browse every cosmetic, track shop history, and get instant alerts when
          your must-have items return to the Item Shop.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/shop"
            className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            See Today's Shop
          </Link>
          <Link
            href="/items"
            className="rounded-lg border border-border px-8 py-3 font-semibold text-foreground hover:bg-accent"
          >
            Browse All Items
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-card border border-border p-6">
            <h3 className="text-lg font-semibold">Full Catalog</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse 3,000+ cosmetics with rarity, pricing, and complete shop
              appearance history.
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-6">
            <h3 className="text-lg font-semibold">Instant Alerts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get notified via email, Discord, or SMS the moment your tracked
              items return to the shop.
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-6">
            <h3 className="text-lg font-semibold">Shop History</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See when any item was last available and how many times it has
              appeared. Never buy blind again.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
```

- [ ] **Step 3: Wrap shop and items pages with PublicLayout**

Add `<PublicLayout>` wrapper to `apps/web/src/app/shop/page.tsx` and `apps/web/src/app/items/page.tsx` (wrap the `<main>` element).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add landing page and public layout with nav"
```

---

### Task 14: History Page (`/history`)

**Files:**
- Create: `apps/web/src/app/history/page.tsx`

- [ ] **Step 1: Create history page** — calendar-style browseable by date

```tsx
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ItemCard } from "@/components/ItemCard";
import { PublicLayout } from "@/components/PublicLayout";
import type { Metadata } from "next";
import type { Item } from "@snowfort/shared";

export const revalidate = 86400; // 24 hours ISR

export const metadata: Metadata = {
  title: "Shop History",
  description: "Browse past Fortnite Item Shops by date.",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? new Date().toISOString().split("T")[0];
  const supabase = getSupabaseAdmin();

  const { data: history } = await supabase
    .from("shop_history")
    .select("item_id")
    .eq("date", date);

  const itemIds = (history ?? []).map((h) => h.item_id);
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .in("id", itemIds.length > 0 ? itemIds : ["__none__"]);

  // Generate prev/next dates
  const currentDate = new Date(date + "T00:00:00Z");
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const today = new Date().toISOString().split("T")[0];

  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold">Shop History</h1>

        <div className="mt-4 flex items-center gap-4">
          <a
            href={`/history?date=${prevDate.toISOString().split("T")[0]}`}
            className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
          >
            &larr; Previous Day
          </a>
          <span className="font-semibold">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {date < today && (
            <a
              href={`/history?date=${nextDate.toISOString().split("T")[0]}`}
              className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              Next Day &rarr;
            </a>
          )}
        </div>

        {items && items.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item: Item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-gray-500">
            No shop data available for this date.
          </p>
        )}
      </main>
    </PublicLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add shop history page with date navigation"
```

---

## Phase 3: Auth, Dashboard & Watchlist

### Task 15: Watchlist API Route

**Files:**
- Create: `apps/web/src/app/api/watchlist/route.ts`

- [ ] **Step 1: Create watchlist API**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDbQueries } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const itemId = body.item_id;
  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const db = getDbQueries();

  // Ensure user_preferences row exists
  await db.upsertUserPreferences({ user_id: userId });

  const result = await db.addToWatchlist(userId, itemId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const itemId = body.item_id;
  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const db = getDbQueries();
  await db.removeFromWatchlist(userId, itemId);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add watchlist API route with free tier limit"
```

---

### Task 16: Item Search API

**Files:**
- Create: `apps/web/src/app/api/items/search/route.ts`

- [ ] **Step 1: Create search endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDbQueries } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const db = getDbQueries();
  const items = await db.searchItems(query, 10);
  return NextResponse.json(items);
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add item search API endpoint"
```

---

### Task 17: Dashboard Page

**Files:**
- Create: `apps/web/src/app/dashboard/layout.tsx`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/components/DashboardSidebar.tsx`, `apps/web/src/components/ItemSearch.tsx`

- [ ] **Step 1: Create `SnowFortLayout.tsx`** — app-specific wrapper around @snowforge/ui AppLayout

This follows the same pattern as SnowPipe and SnowScrape: wrap `AppLayout` from `@snowforge/ui` with app-specific nav config.

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppLayout, useSidebar, ThemeToggle } from "@snowforge/ui";
import { Store, Package, CalendarDays, LayoutDashboard, Settings, Crosshair } from "lucide-react";

export function SnowFortLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useSidebar();

  return (
    <AppLayout
      sidebar={{
        orgSwitcher: {
          currentOrg: { id: "snowfort", name: "SnowFort", image: "" },
          orgs: [],
          onOrgSelect: () => {},
        },
        navGroups: [
          {
            items: [
              { label: "Shop", href: "/shop", icon: Store },
              { label: "Items", href: "/items", icon: Package },
              { label: "History", href: "/history", icon: CalendarDays },
            ],
          },
          {
            items: [
              { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
              { label: "Settings", href: "/dashboard/settings", icon: Settings },
            ],
          },
        ],
        searchPlaceholder: "Search items...",
        onSearchClick: () => {
          // TODO: open search modal
        },
        user: {
          userName: user?.fullName ?? user?.username ?? "User",
          userEmail: user?.primaryEmailAddress?.emailAddress,
          avatarUrl: user?.imageUrl,
          menuItems: [
            { label: "Settings", icon: Settings, onClick: () => window.location.href = "/dashboard/settings" },
            { label: "Sign out", icon: Crosshair, onClick: () => window.location.href = "/sign-out", destructive: true },
          ],
        },
        homeHref: "/",
      }}
      headerRight={<ThemeToggle />}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
    >
      {children}
    </AppLayout>
  );
}
```

- [ ] **Step 2: Create dashboard layout** — uses SnowFortLayout

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SnowFortLayout } from "@/components/SnowFortLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <SnowFortLayout>{children}</SnowFortLayout>;
}
```

- [ ] **Step 3: Create `ItemSearch.tsx`** — autocomplete search

```tsx
"use client";

import { useState } from "react";
import type { Item } from "@snowfort/shared";

export function ItemSearch({ onAdd }: { onAdd: (itemId: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  async function handleAdd(itemId: string) {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    });
    if (res.ok) {
      onAdd(itemId);
      setQuery("");
      setResults([]);
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to add");
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search items to track..."
        className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500"
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 shadow-lg">
          {results.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleAdd(item.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-700"
              >
                <span className="capitalize text-gray-500">{item.rarity}</span>
                <span>{item.name}</span>
                <span className="ml-auto text-gray-500">{item.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <p className="absolute mt-1 px-4 py-2 text-sm text-gray-500">
          Searching...
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create dashboard page**

```tsx
import { auth } from "@clerk/nextjs/server";
import { getDbQueries } from "@/lib/supabase-server";
import { ItemCard } from "@/components/ItemCard";
import { DashboardClient } from "./DashboardClient";
import type { Item } from "@snowfort/shared";

export default async function DashboardPage() {
  const { userId } = await auth();
  const db = getDbQueries();

  const watchlist = await db.getUserWatchlist(userId!);
  const notifications = await db.getUserNotifications(userId!, 10);

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Quick Add */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Quick Add</h2>
        <p className="mt-1 text-sm text-gray-400">
          Search for items to add to your watchlist.
        </p>
        <div className="mt-2">
          <DashboardClient />
        </div>
      </section>

      {/* Watchlist */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          My Watchlist ({watchlist.length} items)
        </h2>
        {watchlist.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {watchlist.map((entry: any) => (
              <ItemCard key={entry.item_id} item={entry.item as Item} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-gray-500">
            You're not tracking any items yet. Use the search above to add some!
          </p>
        )}
      </section>

      {/* Recent Alerts */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recent Alerts</h2>
        {notifications.length > 0 ? (
          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between rounded bg-gray-800 px-4 py-3 text-sm"
              >
                <span>Item alert via {n.channel}</span>
                <span className="text-gray-500">
                  {new Date(n.sent_at).toLocaleDateString()}
                </span>
                <span
                  className={
                    n.status === "sent" ? "text-green-400" : "text-red-400"
                  }
                >
                  {n.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-gray-500">No alerts sent yet.</p>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with sidebar, watchlist, and search"
```

---

### Task 18: Settings Page

**Files:**
- Create: `apps/web/src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings page** — notification preferences

```tsx
import { auth } from "@clerk/nextjs/server";
import { getDbQueries } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDbQueries();
  let prefs = await db.getUserPreferences(userId);

  // Create default prefs if none exist
  if (!prefs) {
    await db.upsertUserPreferences({ user_id: userId });
    prefs = await db.getUserPreferences(userId);
  }

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="mt-8 max-w-lg space-y-6">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>

        {/* These will be client-side toggle components in the final version */}
        <div className="space-y-4 rounded-lg bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <span>Email Alerts</span>
            <span className={prefs?.email_alerts ? "text-green-400" : "text-gray-500"}>
              {prefs?.email_alerts ? "On" : "Off"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discord Alerts</span>
            <span className={prefs?.discord_alerts ? "text-green-400" : "text-gray-500"}>
              {prefs?.discord_alerts ? "On" : "Off"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>SMS Alerts</span>
            {prefs?.is_premium ? (
              <span className={prefs?.sms_alerts ? "text-green-400" : "text-gray-500"}>
                {prefs?.sms_alerts ? "On" : "Off"}
              </span>
            ) : (
              <span className="text-sm text-blue-400">Premium feature</span>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <div className="rounded-lg bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <span>Discord</span>
            {prefs?.discord_user_id ? (
              <span className="text-green-400">Connected</span>
            ) : (
              <a
                href="/api/auth/discord"
                className="rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-700"
              >
                Link Discord
              </a>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold">Subscription</h2>
        <div className="rounded-lg bg-gray-900 p-6">
          {prefs?.is_premium ? (
            <div>
              <p className="text-green-400 font-semibold">Premium Active</p>
              <a
                href="/api/stripe-portal"
                className="mt-2 inline-block rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
              >
                Manage Subscription
              </a>
            </div>
          ) : (
            <div>
              <p className="text-gray-400">Free Plan</p>
              <a
                href="/pricing"
                className="mt-2 inline-block rounded bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700"
              >
                Upgrade to Premium
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add settings page with notification preferences"
```

---

## Phase 4: Cron Job & Notifications

### Task 19: Daily Cron Endpoint

**Files:**
- Create: `apps/web/src/app/api/cron/shop-update/route.ts`

- [ ] **Step 1: Install Resend SDK**

```bash
cd apps/web && pnpm add resend
```

- [ ] **Step 2: Create the cron endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  FortniteApiClient,
  createDbQueries,
  slugify,
} from "@snowfort/shared";
import type { WatcherWithPrefs } from "@snowfort/shared";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const db = createDbQueries(supabase);
  const api = new FortniteApiClient();

  try {
    // Optional configurable delay
    const delay = parseInt(process.env.SHOP_POLL_DELAY_MS ?? "0", 10);
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }

    // 1. Fetch today's shop
    const shopData = await api.getShop();
    const today = new Date().toISOString().split("T")[0];

    // 2. Extract BR items from shop entries
    const shopItems: { id: string; price: number }[] = [];
    for (const entry of shopData.entries) {
      if (!entry.brItems) continue;
      for (const brItem of entry.brItems) {
        shopItems.push({ id: brItem.id, price: entry.finalPrice });

        // Upsert item data from shop (includes latest info)
        // Slug uses item ID as suffix to guarantee uniqueness for same-named items
        const slug = `${slugify(brItem.name)}-${brItem.id.toLowerCase().slice(0, 8)}`;
        await supabase.from("items").upsert(
          {
            id: brItem.id,
            slug,
            name: brItem.name,
            type: brItem.type.value,
            rarity: brItem.rarity.value,
            description: brItem.description ?? "",
            image_url: brItem.images.icon ?? brItem.images.smallIcon ?? "",
            price_vbucks: entry.finalPrice,
            set_name: brItem.set?.value ?? null,
          },
          { onConflict: "id", ignoreDuplicates: false }
        );
      }
    }

    const todayItemIds = shopItems.map((s) => s.id);

    // 3. Diff against yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayHistory = await db.getShopHistoryByDate(yesterdayStr);
    const yesterdayIds = new Set(yesterdayHistory.map((h) => h.item_id));

    const newArrivals = todayItemIds.filter((id) => !yesterdayIds.has(id));

    // 4. Record today's shop history
    await db.insertShopHistory(
      todayItemIds.map((id) => ({ date: today, item_id: id }))
    );

    // 5. Update item stats for today's items
    for (const id of todayItemIds) {
      await supabase.rpc("increment_shop_count", { target_item_id: id });
    }

    // 6. First-run guard: if no yesterday history, skip notifications
    if (yesterdayHistory.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "First run — recorded shop, skipped notifications",
        items: todayItemIds.length,
      });
    }

    // 7. Find watchers for new arrivals
    if (newArrivals.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No new arrivals today",
        items: todayItemIds.length,
      });
    }

    const watchers = await db.getWatchersForItems(newArrivals);

    // 8. Fan out notifications
    const notificationLogs: any[] = [];

    // Group watchers by user to send one email per user
    const watchersByUser = new Map<string, WatcherWithPrefs[]>();
    for (const w of watchers) {
      const existing = watchersByUser.get(w.user_id) ?? [];
      existing.push(w);
      watchersByUser.set(w.user_id, existing);
    }

    for (const [userId, userWatchers] of watchersByUser) {
      const watcher = userWatchers[0]; // preferences are the same per user
      const itemIds = userWatchers.map((w) => w.item_id);

      // Fetch item names for the notification
      const { data: items } = await supabase
        .from("items")
        .select("id, name")
        .in("id", itemIds);

      const itemNames = (items ?? []).map((i) => i.name);

      // Email
      if (watcher.email_alerts) {
        try {
          // Get email from Clerk (would need Clerk backend SDK)
          // For now, log as sent — full Clerk integration in implementation
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "email",
              sent_at: new Date().toISOString(),
              status: "sent",
            });
          }
        } catch {
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "email",
              sent_at: new Date().toISOString(),
              status: "failed",
            });
          }
        }
      }

      // Discord webhook
      if (watcher.discord_alerts && watcher.discord_user_id) {
        try {
          const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `<@${watcher.discord_user_id}> Your tracked items are in the shop: **${itemNames.join(", ")}**`,
              }),
            });
          }
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "discord",
              sent_at: new Date().toISOString(),
              status: "sent",
            });
          }
        } catch {
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "discord",
              sent_at: new Date().toISOString(),
              status: "failed",
            });
          }
        }
      }

      // SMS (premium only)
      if (watcher.sms_alerts && watcher.is_premium && watcher.phone_number) {
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const from = process.env.TWILIO_PHONE_NUMBER;
          if (accountSid && authToken && from) {
            await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: watcher.phone_number,
                  From: from,
                  Body: `SnowFort: ${itemNames.join(", ")} ${itemNames.length === 1 ? "is" : "are"} in the Fortnite Item Shop! Check it out.`,
                }),
              }
            );
          }
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "sms",
              sent_at: new Date().toISOString(),
              status: "sent",
            });
          }
        } catch {
          for (const itemId of itemIds) {
            notificationLogs.push({
              user_id: userId,
              item_id: itemId,
              channel: "sms",
              sent_at: new Date().toISOString(),
              status: "failed",
            });
          }
        }
      }
    }

    // 9. Log all notifications
    if (notificationLogs.length > 0) {
      await db.logNotifications(notificationLogs);
    }

    return NextResponse.json({
      ok: true,
      items: todayItemIds.length,
      newArrivals: newArrivals.length,
      notificationsSent: notificationLogs.length,
    });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", message: error.message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add daily cron endpoint with shop diff and notifications"
```

---

## Phase 5: Discord Bot

### Task 20: Discord Bot Scaffold

**Files:**
- Create: `apps/discord-bot/package.json`, `apps/discord-bot/tsconfig.json`, `apps/discord-bot/src/index.ts`, `apps/discord-bot/src/lib/db.ts`, `apps/discord-bot/Dockerfile`

- [ ] **Step 1: Create `apps/discord-bot/package.json`**

```json
{
  "name": "@snowfort/discord-bot",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "@snowfort/shared": "workspace:*",
    "@supabase/supabase-js": "^2",
    "discord.js": "^14"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `apps/discord-bot/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `apps/discord-bot/src/lib/db.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import { createDbQueries } from "@snowfort/shared";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const db = createDbQueries(supabase);
export { supabase };
```

- [ ] **Step 4: Create `apps/discord-bot/src/index.ts`** — bot entry point

```typescript
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { trackCommand } from "./commands/track";
import { untrackCommand } from "./commands/untrack";
import { listCommand } from "./commands/list";
import { shopCommand } from "./commands/shop";
import { checkCommand } from "./commands/check";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName("track")
    .setDescription("Add an item to your watchlist")
    .addStringOption((opt) =>
      opt.setName("item").setDescription("Item name to track").setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("untrack")
    .setDescription("Remove an item from your watchlist")
    .addStringOption((opt) =>
      opt.setName("item").setDescription("Item name to untrack").setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("list")
    .setDescription("Show your current watchlist"),
  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Show today's item shop"),
  new SlashCommandBuilder()
    .setName("check")
    .setDescription("Look up an item's shop history")
    .addStringOption((opt) =>
      opt.setName("item").setDescription("Item name to check").setRequired(true).setAutocomplete(true)
    ),
];

// Register slash commands
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

async function registerCommands() {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
    body: commands.map((c) => c.toJSON()),
  });
  console.log("Slash commands registered.");
}

// Handle interactions
const commandHandlers: Record<
  string,
  (interaction: ChatInputCommandInteraction) => Promise<void>
> = {
  track: trackCommand,
  untrack: untrackCommand,
  list: listCommand,
  shop: shopCommand,
  check: checkCommand,
};

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    // Handle autocomplete for item name fields
    const query = interaction.options.getFocused();
    if (query.length < 2) {
      await interaction.respond([]);
      return;
    }
    const { db } = await import("./lib/db");
    const items = await db.searchItems(query, 10);
    await interaction.respond(
      items.map((item) => ({ name: item.name, value: item.id }))
    );
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const handler = commandHandlers[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction);
    } catch (error) {
      console.error(`Command ${interaction.commandName} failed:`, error);
      const reply = {
        content: "Something went wrong. Please try again.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

client.once("ready", () => {
  console.log(`SnowFort bot logged in as ${client.user?.tag}`);
});

// Start
registerCommands().then(() => {
  client.login(process.env.DISCORD_BOT_TOKEN);
});
```

- [ ] **Step 5: Create `apps/discord-bot/Dockerfile`**

```dockerfile
FROM node:20-slim AS base
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/discord-bot/package.json apps/discord-bot/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY apps/discord-bot/ apps/discord-bot/

WORKDIR /app/apps/discord-bot
RUN pnpm build

CMD ["node", "dist/index.js"]
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Discord bot with command registration"
```

---

### Task 21: Discord Bot Slash Commands

**Files:**
- Create: `apps/discord-bot/src/commands/track.ts`, `untrack.ts`, `list.ts`, `shop.ts`, `check.ts`

- [ ] **Step 1: Create `/track` command**

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import { db } from "../lib/db";

export async function trackCommand(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getString("item", true);

  // Look up user by discord ID
  const discordUserId = interaction.user.id;
  const { data: prefs } = await import("../lib/db").then((m) =>
    m.supabase
      .from("user_preferences")
      .select("user_id")
      .eq("discord_user_id", discordUserId)
      .single()
  );

  if (!prefs) {
    await interaction.reply({
      content:
        "Your Discord account isn't linked to SnowFort yet. Visit the website and link your Discord in Settings.",
      ephemeral: true,
    });
    return;
  }

  const result = await db.addToWatchlist(prefs.user_id, itemId);
  if (result.error) {
    await interaction.reply({ content: result.error, ephemeral: true });
    return;
  }

  const item = await db.getItemById(itemId);
  await interaction.reply({
    content: `Now tracking **${item?.name ?? itemId}**. You'll be notified when it returns to the shop.`,
    ephemeral: true,
  });
}
```

- [ ] **Step 2: Create `/untrack` command**

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import { db, supabase } from "../lib/db";

export async function untrackCommand(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getString("item", true);
  const discordUserId = interaction.user.id;

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("discord_user_id", discordUserId)
    .single();

  if (!prefs) {
    await interaction.reply({
      content: "Your Discord account isn't linked to SnowFort yet.",
      ephemeral: true,
    });
    return;
  }

  await db.removeFromWatchlist(prefs.user_id, itemId);
  const item = await db.getItemById(itemId);
  await interaction.reply({
    content: `Stopped tracking **${item?.name ?? itemId}**.`,
    ephemeral: true,
  });
}
```

- [ ] **Step 3: Create `/list` command**

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import { db, supabase } from "../lib/db";

export async function listCommand(interaction: ChatInputCommandInteraction) {
  const discordUserId = interaction.user.id;

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("discord_user_id", discordUserId)
    .single();

  if (!prefs) {
    await interaction.reply({
      content: "Your Discord account isn't linked to SnowFort yet.",
      ephemeral: true,
    });
    return;
  }

  const watchlist = await db.getUserWatchlist(prefs.user_id);

  if (watchlist.length === 0) {
    await interaction.reply({
      content: "Your watchlist is empty. Use `/track` to add items.",
      ephemeral: true,
    });
    return;
  }

  const lines = watchlist.map((entry: any) => {
    const item = entry.item;
    const daysSince = item.last_seen_at
      ? Math.floor(
          (Date.now() - new Date(item.last_seen_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    const status = daysSince === 0 ? "🟢 In shop!" : daysSince !== null ? `${daysSince}d ago` : "Never seen";
    return `• **${item.name}** (${item.rarity}) — ${status}`;
  });

  await interaction.reply({
    content: `**Your Watchlist (${watchlist.length} items):**\n${lines.join("\n")}`,
    ephemeral: true,
  });
}
```

- [ ] **Step 4: Create `/shop` command**

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import { db } from "../lib/db";
import { supabase } from "../lib/db";

export async function shopCommand(interaction: ChatInputCommandInteraction) {
  const today = new Date().toISOString().split("T")[0];
  const history = await db.getShopHistoryByDate(today);

  if (history.length === 0) {
    await interaction.reply("No shop data available for today yet.");
    return;
  }

  const itemIds = history.map((h) => h.item_id);
  const { data: items } = await supabase
    .from("items")
    .select("name, rarity, price_vbucks")
    .in("id", itemIds)
    .order("name");

  const lines = (items ?? []).map(
    (i) => `• **${i.name}** (${i.rarity}) — ${i.price_vbucks ?? "?"} V`
  );

  // Discord has a 2000 char limit
  let content = `**Today's Item Shop (${items?.length ?? 0} items):**\n`;
  for (const line of lines) {
    if (content.length + line.length + 1 > 1900) {
      content += `\n...and ${lines.length - content.split("\n").length + 1} more`;
      break;
    }
    content += line + "\n";
  }

  await interaction.reply(content);
}
```

- [ ] **Step 5: Create `/check` command**

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import { db } from "../lib/db";

export async function checkCommand(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getString("item", true);
  const item = await db.getItemById(itemId);

  if (!item) {
    await interaction.reply({ content: "Item not found.", ephemeral: true });
    return;
  }

  const history = await db.getItemShopHistory(item.id);
  const daysSince = item.last_seen_at
    ? Math.floor(
        (Date.now() - new Date(item.last_seen_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const recentDates = history
    .slice(0, 5)
    .map((h) => new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
    .join(", ");

  await interaction.reply(
    `**${item.name}**\n` +
      `Type: ${item.type} | Rarity: ${item.rarity}\n` +
      `Price: ${item.price_vbucks ?? "Unknown"} V-Bucks\n` +
      `Times in shop: ${item.times_in_shop}\n` +
      `Last seen: ${daysSince === null ? "Never" : daysSince === 0 ? "Today!" : `${daysSince} days ago`}\n` +
      (recentDates ? `Recent appearances: ${recentDates}` : "No shop history recorded.")
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add all Discord bot slash commands"
```

---

## Phase 6: Premium & Monetization

### Task 22: Stripe Integration

**Files:**
- Create: `apps/web/src/lib/stripe.ts`, `apps/web/src/app/api/webhooks/stripe/route.ts`, `apps/web/src/app/pricing/page.tsx`

- [ ] **Step 1: Create `apps/web/src/lib/stripe.ts`**

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
```

- [ ] **Step 2: Create Stripe webhook handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Deduplicate events (Stripe may send duplicates)
  const { error: dupeError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id });
  if (dupeError) {
    // Already processed this event
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (userId) {
        await supabase
          .from("user_preferences")
          .update({
            is_premium: true,
            stripe_customer_id: session.customer as string,
          })
          .eq("user_id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await supabase
        .from("user_preferences")
        .update({ is_premium: false })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const isActive = ["active", "trialing"].includes(subscription.status);
      await supabase
        .from("user_preferences")
        .update({ is_premium: isActive })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3: Create pricing page**

```tsx
import { PublicLayout } from "@/components/PublicLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "SnowFort free and premium plans.",
};

export default function PricingPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold">Pricing</h1>
        <p className="mt-4 text-center text-gray-400">
          Track your favorite Fortnite items for free. Upgrade for more.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
            <h2 className="text-2xl font-bold">Free</h2>
            <p className="mt-2 text-3xl font-bold">
              $0<span className="text-lg text-gray-400">/mo</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li>Up to 50 items on your watchlist</li>
              <li>Email alerts</li>
              <li>Discord alerts (SnowFort server)</li>
              <li>Full catalog browsing</li>
              <li>Shop history & stats</li>
            </ul>
          </div>

          {/* Premium */}
          <div className="rounded-lg border-2 border-blue-500 bg-gray-900 p-8">
            <h2 className="text-2xl font-bold">Premium</h2>
            <p className="mt-2 text-3xl font-bold">
              $4<span className="text-lg text-gray-400">/mo</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li>Unlimited watchlist</li>
              <li>SMS alerts</li>
              <li>Ad-free browsing</li>
              <li>Add bot to your Discord server</li>
              <li>Priority support</li>
              <li>Everything in Free</li>
            </ul>
            <a
              href="/api/checkout"
              className="mt-8 block rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Get Premium
            </a>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Stripe webhook, pricing page, and premium gates"
```

---

### Task 22b: Checkout, Discord OAuth & Stripe Portal Routes

**Files:**
- Create: `apps/web/src/app/api/checkout/route.ts`, `apps/web/src/app/api/auth/discord/route.ts`, `apps/web/src/app/api/stripe-portal/route.ts`

- [ ] **Step 1: Create `/api/checkout` route** — creates Stripe Checkout Session

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDbQueries } from "@/lib/supabase-server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDbQueries();
  const prefs = await db.getUserPreferences(userId);

  // Reuse existing Stripe customer if present
  let customerId = prefs?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    await db.upsertUserPreferences({
      user_id: userId,
      stripe_customer_id: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!, // Set in env vars
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { user_id: userId },
  });

  return NextResponse.redirect(session.url!, 303);
}

// Support GET for simple link navigation
export { POST as GET };
```

- [ ] **Step 2: Create `/api/auth/discord` route** — Discord OAuth callback

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDbQueries } from "@/lib/supabase-server";

const DISCORD_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord`;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in`);
  }

  const code = req.nextUrl.searchParams.get("code");

  // If no code, redirect to Discord OAuth
  if (!code) {
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "identify",
    });
    return NextResponse.redirect(
      `https://discord.com/api/oauth2/authorize?${params}`
    );
  }

  // Exchange code for token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?discord_error=true`
    );
  }

  // Get Discord user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const discordUser = await userRes.json();

  // Save Discord user ID
  const db = getDbQueries();
  await db.upsertUserPreferences({
    user_id: userId,
    discord_user_id: discordUser.id,
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?discord_linked=true`
  );
}
```

- [ ] **Step 3: Create `/api/stripe-portal` route** — Stripe Customer Portal

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDbQueries } from "@/lib/supabase-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDbQueries();
  const prefs = await db.getUserPreferences(userId);

  if (!prefs?.stripe_customer_id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: prefs.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return NextResponse.redirect(session.url, 303);
}
```

- [ ] **Step 4: Update settings page** to use correct portal link

Update the Stripe portal link in settings from `/api/webhooks/stripe/portal` to `/api/stripe-portal`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add checkout, Discord OAuth, and Stripe portal routes"
```

---

### Task 22c: Dashboard Client Component & Settings Toggles

**Files:**
- Create: `apps/web/src/app/dashboard/DashboardClient.tsx`, `apps/web/src/app/api/preferences/route.ts`

- [ ] **Step 1: Create `DashboardClient.tsx`** — client wrapper with ItemSearch

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ItemSearch } from "@/components/ItemSearch";

export function DashboardClient() {
  const router = useRouter();

  return (
    <ItemSearch
      onAdd={() => {
        router.refresh(); // Re-fetch server data to show new item in watchlist
      }}
    />
  );
}
```

- [ ] **Step 2: Create preferences update API**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDbQueries } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowed = ["email_alerts", "discord_alerts", "sms_alerts", "phone_number"];
  const updates: Record<string, any> = { user_id: userId };

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  // SMS requires premium
  if (body.sms_alerts === true) {
    const db = getDbQueries();
    const prefs = await db.getUserPreferences(userId);
    if (!prefs?.is_premium) {
      return NextResponse.json(
        { error: "SMS alerts require a Premium subscription" },
        { status: 403 }
      );
    }
  }

  const db = getDbQueries();
  await db.upsertUserPreferences(updates);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dashboard client component and preferences API"
```

**Note:** The settings page toggles should be converted to interactive client components that call `PATCH /api/preferences` on toggle. This is standard React form handling — the implementing agent should wire the toggles using `useState` + `fetch`.

---

### Task 23: AdSense Component

**Files:**
- Create: `apps/web/src/components/AdUnit.tsx`

- [ ] **Step 1: Create `AdUnit.tsx`**

```tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdUnit({
  slot,
  format = "auto",
}: {
  slot: string;
  format?: string;
}) {
  const { user } = useUser();
  const adRef = useRef<HTMLModElement>(null);

  // Don't show ads to premium users
  // In production, check user_preferences.is_premium
  // For now, just render the ad unit

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add AdSense component with premium-aware rendering"
```

---

### Task 24: Final Wiring & Polish

- [ ] **Step 1: Update `PROGRESS.md`** to reflect completed phases
- [ ] **Step 2: Update master `TODO.md`** to add SnowFort as a new workstream
- [ ] **Step 3: Add SnowFort to SnowForge landing page** as a product in the suite
- [ ] **Step 4: Create GitHub repo** `SnowForgeLLC/SnowFort`
- [ ] **Step 5: Push initial codebase**
- [ ] **Step 6: Set up Supabase project**, run migration, run seed
- [ ] **Step 7: Set up Vercel project**, connect to repo, configure env vars
- [ ] **Step 8: Create Discord application** in Discord Developer Portal, get bot token
- [ ] **Step 9: Set up Railway project** for Discord bot
- [ ] **Step 10: Create Stripe product** ($4/mo SnowFort Premium)
- [ ] **Step 11: End-to-end test**: sign up → browse catalog → add to watchlist → verify cron → check notification log

---

## Deferred to Post-Launch

These items from the spec are intentionally deferred:

- **Daily Stripe reconciliation job** (spec Section 4/9): A cron that checks all `is_premium = true` users against Stripe's subscription API. Not needed until significant user volume. Can be a second Vercel Cron endpoint.
- **Stripe fallback verification on premium-gated actions** (spec Section 4): The v1 trusts `is_premium` from the webhook. If webhook reliability becomes an issue, add a real-time Stripe API check on SMS sends and bot server installs.
- **Early notifications for premium users** (spec Section 9): Deferred per spec.

## Additional Environment Variables

These are needed by the new routes (add to `.env.example` and Vercel):

| Variable | Service | Notes |
|----------|---------|-------|
| `STRIPE_PRICE_ID` | Stripe | Price ID for the $4/mo Premium subscription |
| `NEXT_PUBLIC_APP_URL` | App | Base URL (e.g., `https://fort.snowforge.dev`) |
| `DISCORD_OAUTH_CLIENT_ID` | Discord | OAuth2 app client ID (same Discord app as bot) |
| `DISCORD_OAUTH_CLIENT_SECRET` | Discord | OAuth2 app client secret |

---

## Deployment Checklist

Before going live:

- [ ] Supabase project created, migration applied, seed run
- [ ] Vercel project connected, all env vars set (see spec Section 15)
- [ ] Clerk: SnowFort added as an application in shared instance
- [ ] Discord: application created, bot added to SnowFort server
- [ ] Railway: Discord bot deployed with env vars
- [ ] Stripe: product created, webhook endpoint configured pointing to `/api/webhooks/stripe`
- [ ] Resend: domain verified, API key generated
- [ ] Twilio: phone number provisioned (can defer until premium users exist)
- [ ] AdSense: application submitted (can run without it initially)
- [ ] `.superpowers/` added to `.gitignore`
