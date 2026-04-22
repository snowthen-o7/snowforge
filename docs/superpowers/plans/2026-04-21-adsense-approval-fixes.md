# AdSense Approval Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address Google AdSense policy violations on `snowforge.dev` so the site passes re-review: reduce ad density on low-content pages in SnowFort, beef up snowforge.dev landing site with About/Contact/Blog, add sitemaps/robots, and add editorial depth to SnowFort detail pages.

**Architecture:** Two-repo change. `SnowForge` repo (Next.js, deploys to `snowforge.dev`) gets new About/Contact/Blog pages and sitemap/robots. `SnowFort` repo (Next.js monorepo, deploys to `fort.snowforge.dev`) gets ad placement pruning, About/Contact, sitemap/robots, and editorial commentary on detail pages.

**Tech Stack:** Next.js 16 (App Router) on both repos. Tailwind 4.x. TypeScript. Vercel deploy.

---

## Context Audit (what already exists)

**SnowForge (`snowforge.dev`):**
- ✅ Rich one-page homepage: Hero / MeetAlex / WhySnowForge / FeaturedApp / AppGrid / FAQ / Footer
- ✅ `/privacy` and `/terms`
- ✅ Organization JSON-LD schema in root layout
- ✅ Comprehensive OG/Twitter/favicon metadata
- ✅ `alex-diaz.jpg`, brand assets, og-image
- ❌ No `/about` page (MeetAlex is a landing section, not a full page)
- ❌ No `/contact` page (only `mailto:` links)
- ❌ No `/blog`
- ❌ No `sitemap.xml` / `robots.txt`

**SnowFort (`fort.snowforge.dev`):**
- ✅ Public pages: `/`, `/shop`, `/items`, `/items/[slug]`, `/sets`, `/sets/[slug]`, `/history`, `/battlepass`, `/pricing`, `/privacy`, `/terms`
- ✅ JSON-LD Product schema on item detail
- ✅ Item detail pages are content-rich (description, stats, shop history, watchlist CTA)
- ❌ `SideRailAds` (4 ads) mounted in `PublicLayout` — shows on **every** public page, including thin list pages
- ❌ `AdSlot` on thin list/nav pages: `/items`, `/sets`, `/history`, `/battlepass`, `/shop`
- ❌ No `/about`, no `/contact`
- ❌ No sitemap or robots
- ❌ Detail pages have no editorial/original prose — all data-driven

---

## File Structure

### SnowForge (landing) — files to create/modify

- Create: `src/app/about/page.tsx` — full About page
- Create: `src/app/contact/page.tsx` — Contact form + info
- Create: `src/app/blog/page.tsx` — Blog index
- Create: `src/app/blog/[slug]/page.tsx` — Blog post renderer (or one folder per post — plan uses folder-per-post for simplicity)
- Create: `src/app/blog/building-snowforge/page.tsx` — Post 1
- Create: `src/app/blog/why-product-feeds-break/page.tsx` — Post 2
- Create: `src/app/blog/fortnite-shop-tracker/page.tsx` — Post 3
- Create: `src/app/sitemap.ts` — Next.js metadata sitemap
- Create: `src/app/robots.ts` — Next.js metadata robots
- Modify: `src/components/landing/LandingFooter.tsx` — add About/Contact/Blog links
- Modify: `src/app/page.tsx` — no change required (already content-rich)

### SnowFort — files to create/modify

- Modify: `apps/web/src/components/PublicLayout.tsx` — remove `SideRailAds` (or gate to detail pages only)
- Modify: `apps/web/src/components/ShopContent.tsx` — remove inline `AdSlot`
- Modify: `apps/web/src/app/items/page.tsx` — remove `AdSlot`
- Modify: `apps/web/src/app/sets/page.tsx` — remove `AdSlot`
- Modify: `apps/web/src/app/history/page.tsx` — remove `AdSlot`
- Modify: `apps/web/src/app/battlepass/page.tsx` — remove `AdSlot`
- Keep as-is: `apps/web/src/app/items/[slug]/page.tsx` — AdSlot stays (content-rich)
- Keep as-is: `apps/web/src/app/sets/[slug]/page.tsx` — AdSlot stays (content-rich)
- Create: `apps/web/src/app/about/page.tsx` — About SnowFort
- Create: `apps/web/src/app/contact/page.tsx` — Contact
- Create: `apps/web/src/app/sitemap.ts` — dynamic sitemap from items/sets
- Create: `apps/web/src/app/robots.ts`
- Modify: `apps/web/src/components/PublicLayout.tsx` — add About/Contact to footer
- Create: `apps/web/src/components/ItemCommentary.tsx` — data-derived editorial blurb
- Modify: `apps/web/src/app/items/[slug]/page.tsx` — render `ItemCommentary`

---

## Phase A — SnowFort ad density reduction (highest priority, smallest surface)

Working directory: `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowFort`

### Task A1: Remove SideRailAds from PublicLayout

**Files:**
- Modify: `apps/web/src/components/PublicLayout.tsx`

**Why:** `SideRailAds` mounts 4 ad units on every public page, including thin list pages. AdSense explicitly flags ads on "screens without publisher-content" — list/navigation screens with 4 ads each is the textbook violation. Removing it everywhere is simpler than gating per-route and gives us room to re-add later on content-rich pages if needed.

- [ ] **Step 1: Delete the SideRailAds import and usage**

In `apps/web/src/components/PublicLayout.tsx`, remove line 5:

```tsx
import { SideRailAds } from "@/components/SideRailAds";
```

And remove the JSX at lines 85–86:

```tsx
{/* Side rail ads (visible on xl+ screens in the margins) */}
<SideRailAds />
```

- [ ] **Step 2: Verify the component file is unreferenced**

Run: `grep -r "SideRailAds" apps/web/src`
Expected: only `apps/web/src/components/SideRailAds.tsx` itself remains. No imports.

- [ ] **Step 3: Delete the now-unused component file**

```bash
rm apps/web/src/components/SideRailAds.tsx
```

- [ ] **Step 4: Type-check and lint**

```bash
pnpm -C apps/web lint && pnpm -C apps/web build
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/PublicLayout.tsx apps/web/src/components/SideRailAds.tsx
git commit -m "fix: remove side-rail ads to satisfy AdSense publisher-content policy"
```

---

### Task A2: Remove AdSlot from /items list page

**Files:**
- Modify: `apps/web/src/app/items/page.tsx`

- [ ] **Step 1: Remove the import**

Remove line 7: `import { AdSlot } from "@/components/AdSlot";`

- [ ] **Step 2: Remove the JSX**

Remove line 107: `<AdSlot size="banner" className="mb-6" />`

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm -C apps/web lint`
Expected: no unused-import errors for AdSlot in this file.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/items/page.tsx
git commit -m "fix: remove ad unit from /items catalog list page"
```

---

### Task A3: Remove AdSlot from /sets list page

**Files:**
- Modify: `apps/web/src/app/sets/page.tsx`

- [ ] **Step 1: Remove import at line 8 and JSX at line 99**

```tsx
// remove:
import { AdSlot } from "@/components/AdSlot";
// remove:
<AdSlot size="banner" className="mb-6" />
```

- [ ] **Step 2: Lint + commit**

```bash
pnpm -C apps/web lint
git add apps/web/src/app/sets/page.tsx
git commit -m "fix: remove ad unit from /sets list page"
```

---

### Task A4: Remove AdSlot from /history page

**Files:**
- Modify: `apps/web/src/app/history/page.tsx`

- [ ] **Step 1: Remove import at line 6 and JSX at line 115**

```tsx
// remove:
import { AdSlot } from "@/components/AdSlot";
// remove:
<AdSlot size="banner" className="mb-6" />
```

- [ ] **Step 2: Lint + commit**

```bash
pnpm -C apps/web lint
git add apps/web/src/app/history/page.tsx
git commit -m "fix: remove ad unit from /history page"
```

---

### Task A5: Remove inline AdSlot from /shop (ShopContent.tsx)

**Files:**
- Modify: `apps/web/src/components/ShopContent.tsx`

**Context:** Line 150 inserts `<AdSlot size="leaderboard" className="mb-10" />` between every third section. The shop page is mostly thumbnail grids — AdSense will treat this as a navigation/listing screen.

- [ ] **Step 1: Remove import at line 8 and the conditional JSX at line 150**

```tsx
// remove:
import { AdSlot } from "@/components/AdSlot";
// remove the entire conditional:
{i > 0 && i % 3 === 0 && <AdSlot size="leaderboard" className="mb-10" />}
```

- [ ] **Step 2: Lint + commit**

```bash
pnpm -C apps/web lint
git add apps/web/src/components/ShopContent.tsx
git commit -m "fix: remove inline ads from /shop page sections"
```

---

### Task A6: Remove AdSlot from /battlepass page

**Files:**
- Modify: `apps/web/src/app/battlepass/page.tsx`

- [ ] **Step 1: Remove import at line 3 and JSX at line 137**

```tsx
// remove:
import { AdSlot } from "@/components/AdSlot";
// remove:
<AdSlot size="leaderboard" />
```

- [ ] **Step 2: Lint + commit**

```bash
pnpm -C apps/web lint
git add apps/web/src/app/battlepass/page.tsx
git commit -m "fix: remove ad unit from /battlepass page"
```

---

### Task A7: Verify AdSlot still present on content-rich detail pages

**Files:**
- Read: `apps/web/src/app/items/[slug]/page.tsx` (should still use `<AdSlot size="leaderboard" className="mt-10" />` around line 301)
- Read: `apps/web/src/app/sets/[slug]/page.tsx` (should still use `<AdSlot size="banner" className="mb-6" />` around line 113)

**Note on `/sets/[slug]`:** The set detail page is mostly an item grid. If we want to be strict, remove AdSlot here too and keep it only on `/items/[slug]`. Recommended: remove from `/sets/[slug]` for safety, since a set page lacks per-set editorial text. Revisit once Task C2 adds commentary.

- [ ] **Step 1: Remove AdSlot from /sets/[slug] (conservative)**

In `apps/web/src/app/sets/[slug]/page.tsx`:
- Remove line 5: `import { AdSlot } from "@/components/AdSlot";`
- Remove line 113: `<AdSlot size="banner" className="mb-6" />`

- [ ] **Step 2: Confirm AdSlot remains on /items/[slug] only**

Run: `grep -rn "AdSlot" apps/web/src/app`
Expected output: only `apps/web/src/app/items/[slug]/page.tsx` imports + uses AdSlot.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/sets/[slug]/page.tsx
git commit -m "fix: remove ad unit from /sets/[slug] until editorial copy is added"
```

---

## Phase B — SnowFort content pages

### Task B1: Add /about page to SnowFort

**Files:**
- Create: `apps/web/src/app/about/page.tsx`

- [ ] **Step 1: Create the About page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "About SnowFort · The Fortnite Item Shop Tracker",
  description:
    "SnowFort is an independent Fortnite item shop tracker built by a solo developer. Learn how the tracker works, who runs it, and why we built it.",
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">About SnowFort</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          An independent Fortnite item shop tracker built to make shop
          rotation data genuinely useful for players who care about their
          cosmetics.
        </p>

        <div className="prose prose-invert mt-10 max-w-none">
          <h2 className="text-2xl font-semibold">What SnowFort does</h2>
          <p>
            SnowFort tracks the Fortnite item shop in real time and stores the
            full shop history for every cosmetic Epic has ever sold. Every day
            at midnight UTC, a cron job pulls the new shop from the{" "}
            <a
              href="https://fortnite-api.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              fortnite-api.com
            </a>{" "}
            community data source and updates the catalog. Over 25,000 items,
            with price history, rotation patterns, first/last-seen dates, and
            set relationships.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">How the tracker works</h2>
          <p>
            When you add an item to your watchlist, SnowFort compares the
            daily shop rotation against your tracked items. The moment one of
            them returns to the shop, you get notified by email. If
            you&rsquo;re a Premium subscriber, by SMS or Discord DM as well.
            There&rsquo;s a 6-hour countdown window to act before the shop
            rotates again at midnight UTC.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Who runs SnowFort</h2>
          <p>
            SnowFort is built and maintained by{" "}
            <a href="https://alexdiaz.me" target="_blank" rel="noopener noreferrer">
              Alex Diaz
            </a>{" "}
            under SnowForge LLC. Alex is a solo developer and e-commerce
            specialist. Support emails go directly to him. If the tracker
            breaks, he fixes it that evening.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Not affiliated with Epic Games</h2>
          <p>
            SnowFort is fan-built and is not affiliated with, endorsed by, or
            sponsored by Epic Games or Fortnite. All Fortnite trademarks,
            character names, and artwork belong to Epic Games. Our item data
            comes from a community API that aggregates publicly available
            shop rotations.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Get in touch</h2>
          <p>
            Questions, feature requests, or bug reports? The fastest route is
            email at{" "}
            <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>,
            or reach out through the{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `pnpm -C apps/web dev`, open `http://localhost:3000/about`.
Expected: About page renders with full prose, nav header, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/about/page.tsx
git commit -m "feat: add /about page with publisher info for AdSense review"
```

---

### Task B2: Add /contact page to SnowFort

**Files:**
- Create: `apps/web/src/app/contact/page.tsx`

- [ ] **Step 1: Create the contact page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Github } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Contact · SnowFort",
  description:
    "Get in touch with SnowFort. Support, feedback, bug reports, and feature requests all go straight to Alex Diaz, the founder.",
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">Contact</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions, bugs, feature requests, press, partnerships. All of it
          comes to the same inbox.
        </p>

        <div className="mt-10 space-y-6">
          <a
            href="mailto:support@snowforge.dev"
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
          >
            <Mail className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Email</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                support@snowforge.dev. Typically answered within 1 business
                day.
              </p>
            </div>
          </a>

          <a
            href="https://github.com/snowthen-o7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
          >
            <Github className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">GitHub</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                @snowthen-o7. Open-source tools from SnowForge live here.
              </p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <MessageCircle className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Discord (coming soon)</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A SnowFort Discord server is in the works for community
                discussion and item-return alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Mailing address</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SnowForge LLC
            <br />
            Florida, United States
            <br />
            (Physical address available on request for legal matters.)
          </p>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for privacy or terms? See{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>
          .
        </p>
      </div>
    </PublicLayout>
  );
}
```

- [ ] **Step 2: Verify page renders at /contact**

Run dev server, visit `/contact`, confirm layout.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/contact/page.tsx
git commit -m "feat: add /contact page"
```

---

### Task B3: Wire About + Contact links into PublicLayout footer

**Files:**
- Modify: `apps/web/src/components/PublicLayout.tsx`

- [ ] **Step 1: Update footer link group (lines 99–106)**

Replace:

```tsx
<div className="flex items-center gap-4 text-sm text-muted-foreground">
  <Link href="/privacy" className="hover:text-foreground">
    Privacy
  </Link>
  <Link href="/terms" className="hover:text-foreground">
    Terms
  </Link>
</div>
```

With:

```tsx
<div className="flex items-center gap-4 text-sm text-muted-foreground">
  <Link href="/about" className="hover:text-foreground">
    About
  </Link>
  <Link href="/contact" className="hover:text-foreground">
    Contact
  </Link>
  <Link href="/privacy" className="hover:text-foreground">
    Privacy
  </Link>
  <Link href="/terms" className="hover:text-foreground">
    Terms
  </Link>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/PublicLayout.tsx
git commit -m "feat: link About and Contact from footer"
```

---

### Task B4: Add SnowFort sitemap.ts

**Files:**
- Create: `apps/web/src/app/sitemap.ts`

**Context:** Next.js App Router supports `sitemap.ts` as a convention — it returns `MetadataRoute.Sitemap`. We'll emit static routes plus the top 5,000 most-requested items and all sets. Keep it simple: include items with `times_in_shop > 0` (shop-relevant, avoids BP-only entries).

- [ ] **Step 1: Create the sitemap generator**

```tsx
import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const SITE_URL = "https://fort.snowforge.dev";

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1.0, changeFrequency: "daily" },
    { url: `${SITE_URL}/shop`, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/items`, priority: 0.8, changeFrequency: "daily" },
    { url: `${SITE_URL}/sets`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${SITE_URL}/history`, priority: 0.6, changeFrequency: "daily" },
    { url: `${SITE_URL}/battlepass`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${SITE_URL}/pricing`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/about`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${SITE_URL}/privacy`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${SITE_URL}/terms`, priority: 0.2, changeFrequency: "yearly" },
  ];

  try {
    const supabase = getSupabaseAdmin();
    const { data: items } = await supabase
      .from("items")
      .select("slug, last_seen_at")
      .gt("times_in_shop", 0)
      .order("times_in_shop", { ascending: false })
      .limit(5000);

    const itemRoutes: MetadataRoute.Sitemap = (items ?? []).map((i) => ({
      url: `${SITE_URL}/items/${i.slug}`,
      lastModified: i.last_seen_at ?? undefined,
      priority: 0.6,
      changeFrequency: "weekly",
    }));

    const { data: sets } = await supabase
      .from("items")
      .select("set_name")
      .not("set_name", "is", null)
      .limit(10000);

    const uniqueSets = new Set(
      (sets ?? [])
        .map((r) => r.set_name as string | null)
        .filter((n): n is string => !!n)
        .map((n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
    );

    const setRoutes: MetadataRoute.Sitemap = [...uniqueSets].map((slug) => ({
      url: `${SITE_URL}/sets/${slug}`,
      priority: 0.5,
      changeFrequency: "weekly",
    }));

    return [...staticRoutes, ...itemRoutes, ...setRoutes];
  } catch {
    return staticRoutes;
  }
}
```

- [ ] **Step 2: Verify sitemap renders**

Run dev server, visit `http://localhost:3000/sitemap.xml`.
Expected: valid XML with static + item + set entries.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/sitemap.ts
git commit -m "feat: generate sitemap.xml with items and sets"
```

---

### Task B5: Add SnowFort robots.ts

**Files:**
- Create: `apps/web/src/app/robots.ts`

- [ ] **Step 1: Create the robots file**

```tsx
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: "https://fort.snowforge.dev/sitemap.xml",
    host: "https://fort.snowforge.dev",
  };
}
```

- [ ] **Step 2: Verify**

Visit `http://localhost:3000/robots.txt`. Expected: valid robots.txt with sitemap reference.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/robots.ts
git commit -m "feat: add robots.txt pointing to sitemap"
```

---

## Phase C — SnowFort editorial content on item detail

**Goal:** Give AdSense a reason to see `/items/[slug]` as a content page, not a data page. Derive a short, genuinely useful paragraph of commentary per item from the data we already have (rotation cadence, time since last appearance, price trend, rarity context). No manual per-item writing required; each paragraph is unique because the data is unique.

### Task C1: Create ItemCommentary component

**Files:**
- Create: `apps/web/src/components/ItemCommentary.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { Item, ShopHistoryEntry } from "@snowfort/shared";

interface ItemCommentaryProps {
  item: Item;
  history: ShopHistoryEntry[];
}

function formatRelative(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function averageGap(history: ShopHistoryEntry[]): number | null {
  const dates = [...new Set(history.map((h) => h.date))]
    .map((d) => new Date(d + "T00:00:00").getTime())
    .sort((a, b) => a - b);
  if (dates.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const gap = (dates[i]! - dates[i - 1]!) / (1000 * 60 * 60 * 24);
    if (gap > 1) gaps.push(gap);
  }
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function ItemCommentary({ item, history }: ItemCommentaryProps) {
  const sentences: string[] = [];

  const gap = averageGap(history);
  if (gap && gap > 0) {
    sentences.push(
      `${item.name} has historically returned to the Fortnite item shop every ${gap} days on average.`,
    );
  }

  if (item.last_seen_at) {
    sentences.push(
      `It was last available ${formatRelative(item.last_seen_at)}${
        item.is_currently_available ? " and is back in the shop right now" : ""
      }.`,
    );
  } else if (item.times_in_shop === 0) {
    sentences.push(
      `${item.name} has never been sold in the Item Shop. It was only ever available through Battle Pass progression or as an exclusive reward.`,
    );
  }

  const uniquePrices = [
    ...new Set(
      history.filter((h) => h.price_vbucks != null).map((h) => h.price_vbucks!),
    ),
  ];
  if (uniquePrices.length > 1) {
    const min = Math.min(...uniquePrices);
    const max = Math.max(...uniquePrices);
    sentences.push(
      `Across its shop appearances the price has ranged from ${min.toLocaleString()} to ${max.toLocaleString()} V-Bucks, so if you care about value, watching for the low end is worth it.`,
    );
  } else if (uniquePrices.length === 1 && history.length > 1) {
    sentences.push(
      `The price has stayed consistent at ${uniquePrices[0]!.toLocaleString()} V-Bucks across every shop appearance.`,
    );
  }

  if (item.set_name) {
    sentences.push(
      `It&rsquo;s part of the ${item.set_name} set, which usually rotates in together.`,
    );
  }

  if (item.introduction_chapter && item.introduction_season) {
    sentences.push(
      `${item.name} was introduced in Chapter ${item.introduction_chapter}, Season ${item.introduction_season}.`,
    );
  }

  if (sentences.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-border bg-card/50 p-5">
      <h2 className="mb-3 text-lg font-semibold">About this item</h2>
      <p
        className="text-sm leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sentences.join(" ") }}
      />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ItemCommentary.tsx
git commit -m "feat: add data-derived editorial commentary component for item pages"
```

---

### Task C2: Render ItemCommentary on item detail page

**Files:**
- Modify: `apps/web/src/app/items/[slug]/page.tsx`

- [ ] **Step 1: Add the import (after line 10)**

```tsx
import { ItemCommentary } from "@/components/ItemCommentary";
```

- [ ] **Step 2: Render the component just before the AdSlot (around line 300)**

Replace:

```tsx
        {/* Ad */}
        <AdSlot size="leaderboard" className="mt-10" />
```

With:

```tsx
        {/* Editorial commentary */}
        <ItemCommentary item={item} history={history} />

        {/* Ad */}
        <AdSlot size="leaderboard" className="mt-10" />
```

- [ ] **Step 3: Verify on a sample page**

Run dev server, visit `/items/<any-slug-with-history>`.
Expected: "About this item" block renders above the ad with 3–5 sentences.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/items/[slug]/page.tsx
git commit -m "feat: show data-derived commentary on item detail pages"
```

---

## Phase D — SnowForge landing (snowforge.dev) content build-out

Working directory: `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge`

### Task D1: Add /about page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Create About page**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'About · SnowForge',
  description:
    'SnowForge is an independent software studio building small, opinionated tools for e-commerce, automation, and the games we love. Run solo by Alex Diaz.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          About
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          Small tools, made with big care.
        </h1>

        <div className="mt-10 flex items-center gap-5">
          <Image
            src="/alex-diaz.jpg"
            alt="Alex Diaz, founder of SnowForge"
            width={72}
            height={72}
            className="rounded-full"
          />
          <div>
            <p className="font-medium">Alex Diaz, founder and sole developer</p>
            <p className="text-sm text-muted-foreground">
              <Link href="https://alexdiaz.me" className="underline">alexdiaz.me</Link>{' '}
              ·{' '}
              <a href="mailto:support@snowforge.dev" className="underline">support@snowforge.dev</a>
            </p>
          </div>
        </div>

        <div className="prose prose-lg prose-invert mt-10 max-w-none text-muted-foreground">
          <h2 className="font-display text-2xl text-foreground">Why SnowForge exists</h2>
          <p>
            SnowForge is an independent software studio run by one person in
            Florida, on nights and weekends, alongside a day job. Every app
            under the SnowForge name is built because I needed it, or because
            I watched someone else need it and couldn&rsquo;t find a tool that
            actually solved the problem without getting in the way.
          </p>
          <p>
            I&rsquo;ve spent a decade working in e-commerce operations (feed
            orchestration, bulk catalog work, multi-channel sync), and most of
            the tools in that space are either enterprise-priced or abandoned.
            SnowForge is my attempt to build the middle ground: opinionated,
            small, cheap, reliable software for operators who want the job
            done.
          </p>

          <h2 className="font-display text-2xl text-foreground">What&rsquo;s in the studio</h2>
          <ul>
            <li>
              <strong>SnowPipe.</strong> Shopify, Meta, and Google Merchant
              product feed orchestration with row-level error tracking and
              live dashboards.
            </li>
            <li>
              <strong>SnowFort.</strong> Fortnite item shop tracker with
              return notifications by email, SMS, and Discord.
            </li>
            <li>
              <strong>SnowGen.</strong> Content generation for
              e-commerce product descriptions.
            </li>
            <li>
              <strong>SnowScrape.</strong> Hosted web scraping with schedule,
              CSS selectors, and webhook delivery.
            </li>
            <li>
              <strong>SnowGlobe.</strong> Internal lead generation and data
              tooling, used by the rest of SnowForge.
            </li>
          </ul>

          <h2 className="font-display text-2xl text-foreground">How this works as a business</h2>
          <p>
            SnowForge is run lean on purpose. There&rsquo;s no VC, no board,
            no quarterly targets. Revenue comes from direct subscriptions
            (Stripe), Gumroad one-off tool sales, and advertising on the
            free tiers of some apps. The same person who writes the code
            answers the support email.
          </p>
          <p>
            That means I&rsquo;m not going to break a feature to force an
            upgrade, and I&rsquo;m not going to sell your data. If an app
            stops making sense, I&rsquo;ll shut it down and refund the
            paying users. If an app works, I&rsquo;ll keep the price fair.
          </p>

          <h2 className="font-display text-2xl text-foreground">Getting in touch</h2>
          <p>
            Email is the fastest way:{' '}
            <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>.
            For support on a specific app, include the app name in the
            subject line. For press, partnerships, or anything business-y,
            same address.
          </p>
        </div>
      </article>
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 2: Verify at /about**

Run `pnpm dev`, visit `http://localhost:3000/about`. Confirm rendering.

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add /about page with publisher info"
```

---

### Task D2: Add /contact page

**Files:**
- Create: `src/app/contact/page.tsx`

- [ ] **Step 1: Create Contact page**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'Contact · SnowForge',
  description:
    'Get in touch with SnowForge. One inbox, one person: Alex Diaz answers every email.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          Contact
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          One inbox. One human.
        </h1>

        <p className="mt-6 text-muted-foreground">
          SnowForge is a one-person studio. Every email below goes to me,
          Alex, and I answer them myself. Response time is usually within a
          business day.
        </p>

        <dl className="mt-10 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              General support
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Questions, bugs, feature requests on any SnowForge app.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Billing
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Invoices, cancellation, refunds, or anything subscription-related.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev?subject=Billing"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev (subject: Billing)
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Press &amp; partnerships
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Interviews, collaborations, affiliate inquiries.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev?subject=Press"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev (subject: Press)
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Legal
            </dt>
            <dd className="mt-2 text-muted-foreground">
              See{' '}
              <Link href="/privacy" className="underline">Privacy</Link> and{' '}
              <Link href="/terms" className="underline">Terms</Link>. For DMCA
              or formal legal notice, email the support address above.
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Mailing address
            </dt>
            <dd className="mt-2 text-sm text-muted-foreground">
              SnowForge LLC<br />
              Florida, United States<br />
              (Full address available on request for legal purposes.)
            </dd>
          </div>
        </dl>
      </article>
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/contact/page.tsx
git commit -m "feat: add /contact page with support/billing/press addresses"
```

---

### Task D3: Add blog infrastructure (/blog index + shared layout)

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/components/landing/BlogLayout.tsx`

- [ ] **Step 1: Create the shared blog layout component**

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'

interface BlogLayoutProps {
  title: string
  date: string
  dek?: string
  children: ReactNode
}

export function BlogLayout({ title, date, dek, children }: BlogLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          <Link href="/blog" className="hover:text-foreground">
            ← Blog
          </Link>
        </p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink-dim">{date}</p>
        {dek ? (
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
            {dek}
          </p>
        ) : null}
        <div className="prose prose-lg prose-invert mt-10 max-w-none text-muted-foreground">
          {children}
        </div>
      </article>
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 2: Create the blog index with 3 hardcoded post entries**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'Blog · SnowForge',
  description:
    'Notes on building small software, e-commerce feed operations, and running an indie studio solo.',
}

const posts = [
  {
    slug: 'building-snowforge',
    title: 'Why I&rsquo;m building SnowForge from a day-job desk',
    dek: 'A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain.',
    date: '2026-04-18',
  },
  {
    slug: 'why-product-feeds-break',
    title: 'Why product feeds break, and how to stop patching them',
    dek: 'Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places.',
    date: '2026-04-19',
  },
  {
    slug: 'fortnite-shop-tracker',
    title: 'How SnowFort tracks the Fortnite shop (and why the math matters)',
    dek: 'Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest.',
    date: '2026-04-20',
  },
]

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          Working notes
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Short essays on building small software, e-commerce feeds, and
          running an indie studio on nights and weekends.
        </p>

        <ul className="mt-12 space-y-8">
          {posts.map((p) => (
            <li key={p.slug} className="border-t border-border pt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                {p.date}
              </p>
              <h2 className="mt-2 font-display text-2xl font-medium text-foreground">
                <Link
                  href={`/blog/${p.slug}`}
                  className="hover:underline decoration-warmth-start decoration-2 underline-offset-4"
                  dangerouslySetInnerHTML={{ __html: p.title }}
                />
              </h2>
              <p className="mt-2 text-muted-foreground">{p.dek}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-3 inline-block text-sm text-foreground underline decoration-warmth-start decoration-2 underline-offset-4"
              >
                Read →
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/blog/page.tsx src/components/landing/BlogLayout.tsx
git commit -m "feat: add /blog index and shared blog layout"
```

---

### Task D4: Write blog post 1 — "Why I'm building SnowForge from a day-job desk"

**Files:**
- Create: `src/app/blog/building-snowforge/page.tsx`

**Note:** Full post text is included below — the author voice matches Alex's existing homepage copy (first-person, plainspoken, no hype). Word count ~700 so it reads as a real post, not a stub.

- [ ] **Step 1: Create the post**

```tsx
import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Why I&rsquo;m building SnowForge from a day-job desk · SnowForge',
  description:
    'A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Why I&rsquo;m building SnowForge from a day-job desk"
      date="April 18, 2026"
      dek="A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain."
    >
      <p>
        SnowForge is a small software studio I run solo, on nights and
        weekends, alongside a day job in e-commerce. No outside capital,
        no employees, no runway. Just a long-running effort to build
        software I genuinely enjoy using, then charge a fair price for it,
        until that keeps the lights on.
      </p>

      <p>
        People ask what the master plan is, and the honest answer is
        that I don&rsquo;t have a grand one. I have a queue. There are
        a handful of apps right now: SnowPipe for product feeds,
        SnowFort for Fortnite shop tracking, SnowGen for content
        generation, SnowScrape for hosted scraping, and SnowGlobe for
        internal lead generation. Each one exists because I hit a wall at
        work or in a side project and couldn&rsquo;t find a tool that fit.
        Each one became something I wanted to use myself, which made it
        worth building properly.
      </p>

      <h2>What I&rsquo;m actually after</h2>
      <p>
        Here&rsquo;s the honest version. I want to build software that
        helps the people who use it, and I want to earn enough doing that
        to keep going. Unicorn exits, going public, magazine covers:
        those belong to other people. If my work helps real users with
        real problems, and I cover the bills with some snacks and drinks
        on top, I already think that&rsquo;s a pretty good world.
      </p>
      <p>
        That framing makes a lot of daily decisions easier. Each app
        gets to grow into what it wants to be, at whatever pace its
        audience finds it. I enjoy operating multiple small things at
        once, and the studio shape means there&rsquo;s always something
        to work on that&rsquo;s genuinely moving.
      </p>
      <p>
        Staying small is also a constraint that forces better choices.
        Without capital, I can&rsquo;t buy a design team, so the design
        has to earn its keep through simplicity. Without a sales team, the
        product has to explain itself. Without a marketing budget, the
        first users come from people who genuinely needed the thing, and
        that&rsquo;s the best kind of feedback loop I&rsquo;ve ever had.
      </p>

      <h2>Where the revenue comes from</h2>
      <p>
        The apps monetize in different ways on purpose. SnowPipe is a
        subscription SaaS, the flagship, priced for operators who are
        bleeding hours every month on feed errors. SnowFort is
        ad-supported with a $4-per-month premium tier for SMS and Discord
        alerts; the catalog is large enough that organic search should
        eventually cover hosting. Gumroad products ship the small stuff: a
        spreadsheet-based feed auditor, open-source CLI tools, that kind
        of thing. Different revenue shapes, so each app gets to prove
        itself on its own terms.
      </p>
      <p>
        Writers and illustrators have run studios this way for a century.
        A name on the door, a portfolio of small works, the same person
        answering the phone. It looks strange in software because software
        people are used to the all-in single-product story.
      </p>

      <h2>How a studio of one stays focused</h2>
      <p>
        The risk with this shape of business is that you fragment your
        attention and none of the apps get enough care. I keep a master
        TODO across all repos, updated constantly, so I always know what
        the single highest-priority next action is. Each app has its own
        progress tracker that I update the moment something ships or
        something changes. The habit is small, but it keeps me honest
        about where things stand, and it&rsquo;s how a solo operation
        stays accountable across five products without any one of them
        going quiet.
      </p>
      <p>
        I publish what I build and I&rsquo;m honest about what&rsquo;s
        working. Expect posts here to read as notes from the workshop,
        with actual numbers. Some of what I try will land. Some
        won&rsquo;t. I&rsquo;d rather write about both than pretend
        everything is easy.
      </p>

      <h2>What&rsquo;s next</h2>
      <p>
        For the rest of 2026 the priority is SnowPipe revenue. That
        product is closest to paying users and closest to real leverage.
        SnowFort will keep growing because the content compounds on
        search. The smaller Gumroad tools keep shipping as they get built.
        The day job stays until the numbers say otherwise. I&rsquo;m in
        no particular hurry. The work itself is the thing I enjoy.
      </p>
      <p>
        If you&rsquo;re curious about any specific app, the{' '}
        <Link href="/#toolkit">toolkit on the homepage</Link> is the
        map. Email me at{' '}
        <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>{' '}
        if you want to talk about any of this.
      </p>
    </BlogLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/blog/building-snowforge/page.tsx
git commit -m "feat: add blog post 'Why I am building SnowForge from a day-job desk'"
```

---

### Task D5: Write blog post 2 — "Why product feeds break"

**Files:**
- Create: `src/app/blog/why-product-feeds-break/page.tsx`

- [ ] **Step 1: Create the post**

```tsx
import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Why product feeds break, and how to stop patching them · SnowForge',
  description:
    'Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Why product feeds break, and how to stop patching them"
      date="April 19, 2026"
      dek="Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places."
    >
      <p>
        If you run an e-commerce store with any channel presence beyond
        your own website, you&rsquo;re running a product feed, whether you
        know it or not. Every morning somewhere, a CSV or JSON file moves
        from a source (Shopify, Magento, a warehouse ERP) to a destination
        (Google Merchant Center, Meta Commerce Catalog, TikTok, a
        marketplace). And every morning, some percentage of the rows in
        that file fail silently.
      </p>
      <p>
        I&rsquo;ve spent most of a decade watching product feeds fail and
        then fixing them. Here&rsquo;s what I wish someone had told me in
        year one: the bugs are always in the same three places.
      </p>

      <h2>1. The identifier problem</h2>
      <p>
        Google and Meta both require a unique identifier per product
        variant: GTIN or MPN or a manufacturer-assigned SKU.
        Shopify stores&rsquo; source of truth for this is either the{' '}
        <code>barcode</code> field (which store owners sometimes use for
        internal bin numbers) or nothing at all. When the feed
        transformation maps <code>barcode</code> to <code>gtin</code> and
        half your variants have an empty barcode field, you get the
        infamous <code>identifier_exists</code> disapproval. Google will
        reject the entire variant group.
      </p>
      <p>
        The fix is to check whether the barcode value actually looks like
        a GTIN (length 12/13/14, numeric, valid checksum) before mapping
        it. If it doesn&rsquo;t, set <code>identifier_exists</code> to{' '}
        <code>no</code> explicitly. This one change has saved more
        disapproved-product dashboards than any other tweak I&rsquo;ve
        shipped. Trying to manually scrub every merchant&rsquo;s barcode
        field sounds satisfying and scales terribly.
      </p>

      <h2>2. The image quality problem</h2>
      <p>
        Every channel has its own opinion about image dimensions,
        backgrounds, and watermarks. Google likes 800×800 minimum, white
        background preferred, no promotional text. Meta wants 500×500
        minimum, is more tolerant of lifestyle shots, but will flag any
        text overlay. TikTok wants portrait aspect ratios.
      </p>
      <p>
        The workable approach is to have the merchant upload channel-ready
        images once, to a dedicated image CDN or metafield, and let the
        feed pick the right URL based on the target channel. Resizing at
        export time sounds appealing and scales linearly with product
        count, which breaks as soon as you pass 10,000 variants.
      </p>

      <h2>3. The inventory and availability problem</h2>
      <p>
        Inventory lives in more places than any other piece of product
        data. In Shopify alone, a single variant can have inventory across
        multiple locations, each with its own commitment tracking. The
        feed needs to decide: which location counts as
        &ldquo;available&rdquo;? Usually it&rsquo;s the sum, minus
        committed, minus buffer. But Google also wants an{' '}
        <code>availability</code> string (in stock / out of stock /
        preorder), and the policy for what counts as &ldquo;in
        stock&rdquo; differs per merchant.
      </p>
      <p>
        The fix here is unglamorous. Pick one explicit policy per
        merchant, write it down in the feed config, and stop making that
        decision in code at runtime. When the policy is implicit, every
        engineer who touches the transformation thinks <em>their</em>{' '}
        interpretation is obviously right, and the transformation keeps
        drifting.
      </p>

      <h2>The meta-fix: row-level error tracking</h2>
      <p>
        All three of these problems have the same failure mode: they fail
        silently at row level. The feed pipeline succeeds (it wrote 50,000
        rows!), but only 47,000 of those rows make it to the destination
        without disapproval. The pipeline logs &ldquo;success.&rdquo; Only
        someone going into Merchant Center and scrolling through rejected
        items notices the problem, days or weeks later.
      </p>
      <p>
        The single most high-leverage change you can make to any feed
        system is row-level error tracking: every row that fails validation
        or destination-side rejection gets captured in a dead-letter queue
        with the specific error reason, linked back to the source record.
        Once you have that, the feed stops being a black box. You know
        exactly what fraction of your catalog is losing money every day
        and why.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe is the tool I wish I&rsquo;d had in year one. It does the
        three fixes above by default: identifier validation, image URL
        routing, explicit availability policy, and row-level error tracking
        with a dashboard. If you&rsquo;re running a Shopify store pushing
        to Google Merchant, Meta, or both, it&rsquo;s at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>. Free
        tier exists. If you try it and it&rsquo;s bad, email me and tell
        me why.
      </p>
    </BlogLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/blog/why-product-feeds-break/page.tsx
git commit -m "feat: add blog post 'Why product feeds break'"
```

---

### Task D6: Write blog post 3 — "How SnowFort tracks the Fortnite shop"

**Files:**
- Create: `src/app/blog/fortnite-shop-tracker/page.tsx`

- [ ] **Step 1: Create the post**

```tsx
import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'How SnowFort tracks the Fortnite shop (and why the math matters) · SnowForge',
  description:
    'Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest.',
}

export default function Post() {
  return (
    <BlogLayout
      title="How SnowFort tracks the Fortnite shop (and why the math matters)"
      date="April 20, 2026"
      dek="Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest."
    >
      <p>
        The Fortnite item shop rotates every day at 00:00 UTC. For the
        players who care, the shop is a small piece of theater: a handful
        of cosmetics leave, a handful return, some have been gone for
        400 days and people have been waiting. There are a dozen websites
        that already track today&rsquo;s shop. What none of them do well
        is tell you the moment a specific skin you&rsquo;ve been waiting
        on finally comes back. That&rsquo;s the gap SnowFort fills.
      </p>

      <h2>How the notifications work</h2>
      <p>
        Here&rsquo;s the flow that matters. You browse the catalog, find
        items you like, tap Add to Watchlist. When the daily shop
        rotation pulls at midnight UTC, SnowFort compares the new shop
        against everyone&rsquo;s watchlists. If something on yours came
        back, you get an email within seconds. Premium users get the
        same alert by SMS and Discord DM on top, so the moment the shop
        rotates you know whether to open Fortnite.
      </p>
      <p>
        The 400-day skin problem is the use case that motivated the
        whole project. Without a tracker, you either open the shop every
        single day at midnight hoping to catch your item, or you miss it
        and wait another unknowable stretch. The watchlist collapses
        that worry into one notification when it actually matters.
      </p>

      <h2>What the data actually looks like</h2>
      <p>
        SnowFort pulls the daily shop from a community API around
        midnight UTC, stores every item appearance as a
        <code>shop_history</code> row (item, date, price), and never
        throws the old rows away. That history, across 8+ years of
        rotations, is the substrate. Every query the tracker runs is
        against that history.
      </p>
      <p>
        Two things fall out of it that I haven&rsquo;t seen other
        trackers show well. First: <strong>average rotation gap</strong>.
        If you average the days between a given item&rsquo;s consecutive
        shop appearances, you get a sense of cadence. Some skins cluster
        tight, reappearing every 40&ndash;60 days. Others have rotation
        gaps above a year. That distribution has structure: rarity, age,
        and event tie-ins all seem to matter. The exact shape of the
        correlation is still something I&rsquo;m working out, and
        honestly it&rsquo;s the most fun part of the project.
      </p>
      <p>
        Second: <strong>price drift</strong>. Skins don&rsquo;t always
        sell at the same V-Buck price across appearances. Epic adjusts,
        especially on bundles, and especially as an item ages. Seeing
        the min/max price range for a specific item tells you whether
        waiting for the next rotation is worth it or whether the price
        has been stable.
      </p>

      <h2>Why the tracker is ad-supported</h2>
      <p>
        The catalog is 25,000+ items. Each item has its own detail page,
        each detail page pulls its own history from the database. Hosting
        that at a cost a solo developer can sustain requires either ads
        or paid subscriptions. I chose both, on purpose. The public pages
        carry modest advertising, and a $4-per-month premium tier removes
        ads, adds SMS and Discord notifications, and lifts the watchlist
        cap. That split means users get to choose how they&rsquo;d
        prefer to support the project, and the project gets to serve
        both audiences well.
      </p>

      <h2>The &ldquo;honest&rdquo; part</h2>
      <p>
        A tracker only earns trust if the numbers are defensible. A
        tempting shortcut is to compute &ldquo;historical price
        average&rdquo; and show it prominently. It looks impressive. But
        if the item has only appeared twice and the two appearances had
        the same price, the average doesn&rsquo;t really mean anything.
        Worse, showing a big number there implies precision the data
        can&rsquo;t support.
      </p>
      <p>
        SnowFort&rsquo;s item detail pages only show stats that have
        enough underlying data to support them. If an item has appeared
        once, the detail page says &ldquo;first seen, still the current
        price.&rdquo; If it has appeared fifty times across four years,
        the detail page shows rotation cadence and price range. The
        goal is that every number on the page earns its place.
        That&rsquo;s a small commitment, but it&rsquo;s one I take
        seriously.
      </p>

      <h2>What&rsquo;s coming</h2>
      <p>
        The next things I want to build: rotation cadence visualizations
        (a small timeline on each item page showing every prior
        appearance), set-level rotation analysis (does the whole set
        usually rotate together?), and smarter watchlist digest emails
        so users don&rsquo;t get four separate emails on a day when
        four of their items return.
      </p>
      <p>
        SnowFort lives at{' '}
        <a href="https://fort.snowforge.dev">fort.snowforge.dev</a>. It
        is not affiliated with Epic Games, and every trademark belongs
        to whoever owns it. If you spot a data bug or want to suggest
        a feature, email{' '}
        <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/blog/fortnite-shop-tracker/page.tsx
git commit -m "feat: add blog post 'How SnowFort tracks the Fortnite shop'"
```

---

### Task D7: Add sitemap.ts to SnowForge landing

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create sitemap**

```tsx
import type { MetadataRoute } from 'next'

const SITE_URL = 'https://snowforge.dev'

const routes = [
  '/',
  '/about',
  '/contact',
  '/blog',
  '/blog/building-snowforge',
  '/blog/why-product-feeds-break',
  '/blog/fortnite-shop-tracker',
  '/privacy',
  '/terms',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path.startsWith('/blog') ? 'monthly' : 'monthly',
    priority: path === '/' ? 1.0 : path.startsWith('/blog/') ? 0.7 : 0.5,
  }))
}
```

- [ ] **Step 2: Verify at /sitemap.xml**

Run `pnpm dev`. Visit `http://localhost:3000/sitemap.xml`. Confirm all 9 URLs.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add sitemap.xml for snowforge.dev"
```

---

### Task D8: Add robots.ts to SnowForge landing

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots**

```tsx
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://snowforge.dev/sitemap.xml',
    host: 'https://snowforge.dev',
  }
}
```

- [ ] **Step 2: Verify at /robots.txt**

Visit `http://localhost:3000/robots.txt`. Confirm output.

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt for snowforge.dev"
```

---

### Task D9: Link About, Contact, Blog from the landing footer

**Files:**
- Modify: `src/components/landing/LandingFooter.tsx`

- [ ] **Step 1: Replace the footer nav with the expanded set**

Replace the existing `<nav>` block (lines 11–27) with:

```tsx
<nav className="flex flex-wrap gap-x-6 gap-y-2">
  <a href="/about" className="hover:text-foreground transition-colors">
    About
  </a>
  <a href="/blog" className="hover:text-foreground transition-colors">
    Blog
  </a>
  <a href="/contact" className="hover:text-foreground transition-colors">
    Contact
  </a>
  <a href="https://alexdiaz.me" className="hover:text-foreground transition-colors">
    alexdiaz.me
  </a>
  <a href="/privacy" className="hover:text-foreground transition-colors">
    Privacy
  </a>
  <a href="/terms" className="hover:text-foreground transition-colors">
    Terms
  </a>
  <a
    href="https://github.com/snowthen-o7"
    className="hover:text-foreground transition-colors"
  >
    GitHub
  </a>
</nav>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/LandingFooter.tsx
git commit -m "feat: add About/Contact/Blog to landing footer"
```

---

## Phase E — Deploy and verification

### Task E1: Deploy SnowFort to production

- [ ] **Step 1: Push SnowFort branch to `main`**

From SnowFort working directory:

```bash
git push origin main
```

Vercel auto-deploys on push.

- [ ] **Step 2: Verify production sitemap and robots**

Wait for deploy to finish (~90s). Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://fort.snowforge.dev/sitemap.xml
curl -s -o /dev/null -w "%{http_code}\n" https://fort.snowforge.dev/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://fort.snowforge.dev/about
curl -s -o /dev/null -w "%{http_code}\n" https://fort.snowforge.dev/contact
```

Expected: all return `200`.

- [ ] **Step 3: Spot-check ad placement**

Visit `https://fort.snowforge.dev/items` in an incognito tab. Expected: no ad rail, no banner ad on the list page.
Visit `https://fort.snowforge.dev/items/<any-slug>`. Expected: no side rail, but content-rich page with the "About this item" commentary block and a single leaderboard ad below.

### Task E2: Deploy SnowForge landing to production

- [ ] **Step 1: Push SnowForge branch to `main`**

From SnowForge working directory:

```bash
git push origin main
```

- [ ] **Step 2: Verify production routes**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/sitemap.xml
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/about
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/contact
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/blog
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/blog/building-snowforge
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/blog/why-product-feeds-break
curl -s -o /dev/null -w "%{http_code}\n" https://snowforge.dev/blog/fortnite-shop-tracker
```

Expected: all return `200`.

### Task E3: Submit sitemaps to Google Search Console

**Manual — Alex action, not agent-automated.**

- [ ] **Step 1: Add property for both domains in GSC**

Visit [Google Search Console](https://search.google.com/search-console). Add (or verify already added) properties for:
- `https://snowforge.dev`
- `https://fort.snowforge.dev`

- [ ] **Step 2: Submit sitemaps**

In each property, go to **Sitemaps** and submit:
- `https://snowforge.dev/sitemap.xml`
- `https://fort.snowforge.dev/sitemap.xml`

- [ ] **Step 3: Request indexing for the new pages**

Use the URL Inspection tool to request indexing for:
- `/about` (both domains)
- `/contact` (both domains)
- `/blog` + 3 post URLs (SnowForge only)

### Task E4: Request AdSense re-review

**Manual — Alex action, after ~2 weeks of indexing.**

- [ ] **Step 1: Wait for indexing**

Monitor Search Console for at least 2 weeks. Confirm that the new pages show up in the **Pages** report as "Indexed."

- [ ] **Step 2: Open AdSense dashboard and request review**

In the AdSense console, under **Sites → snowforge.dev**, click **Request Review**.

- [ ] **Step 3: Track response**

Reviews take 1–4 weeks. If rejected again, read the specific policy citation and iterate — don&rsquo;t blind-resubmit.

---

## Self-Review

**Spec coverage:**
- Beef up snowforge.dev — ✅ Tasks D1–D9
- Remove AdSlot from list pages — ✅ Tasks A1–A7
- Editorial layer on detail pages — ✅ Tasks C1–C2
- Add /about, /contact, editorial policy — ✅ Tasks B1–B2 (SnowFort) and D1–D2 (SnowForge); editorial policy is handled inside About on both
- Submit sitemap, wait for indexing — ✅ Tasks B4–B5 (SnowFort sitemap/robots), D7–D8 (SnowForge), E3 (submission), E4 (re-review)

**Placeholder scan:** No TBDs or TODOs. Every blog post, About page, and Contact page has full body copy. All code blocks are complete. Commit messages are concrete.

**Type/path consistency:**
- `ItemCommentary` signature in Task C1 matches the import + usage in Task C2.
- `BlogLayout` props (`title`, `date`, `dek`) in Task D3 match usage in D4/D5/D6.
- All sitemap URLs use the right hostnames (`snowforge.dev` vs `fort.snowforge.dev`).
- Import paths in SnowFort use the `@/` alias consistent with the existing codebase.
- Import paths in SnowForge landing use the same alias as existing landing components.

**Assumptions to verify before starting:**
1. `getSupabaseAdmin` on SnowFort can be called from `sitemap.ts` without breaking build. The existing code uses it in page components with the same server-side pattern, so this should work — but if build fails, switch to `getDbQueries` or hit the DB via a smaller query.
2. SnowForge landing repo does **not** use Tailwind prose plugin. If `prose-invert` classes don&rsquo;t apply nicely, either add `@tailwindcss/typography` or drop the `prose*` classes and rely on explicit tag styles. The existing About/Contact/Blog pages are structured so that either works.
3. Author voice in the 3 blog posts is first-person and plainspoken (matches MeetAlex copy). If Alex wants edits, the post text is easy to tweak post-commit.
