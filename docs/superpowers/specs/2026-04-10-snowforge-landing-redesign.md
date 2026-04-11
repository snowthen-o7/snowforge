# SnowForge Landing Page Redesign

**Date:** 2026-04-10
**Status:** Approved, ready for implementation plan
**Owner:** Alex Diaz
**Repo:** `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge`
**Target file:** `src/app/page.tsx` (plus supporting component, asset, and token changes)

---

## Context

The current SnowForge landing page (`src/app/page.tsx`) feels bare bones. Its visual direction drifts from the look of the individual apps in the SnowForge suite. It also reads as generic. The page is two sections: a thin hero and a tool grid. Nothing beyond that. There is no story, no introduction of Alex, no trust-building, no FAQ, and no featured app.

Cold traffic arriving from blog posts, social, search, or SEO should come away understanding three things:

1. SnowForge is a real indie studio building real tools.
2. A single human is behind it, and that human is reachable.
3. The suite includes seven apps today, all accessible through one account.

## Goals

- Replace the current page with a multi-section landing designed for cold top-of-funnel traffic.
- Funnel visitors toward any app in the suite, with SnowPipe featured because it has paid plans live today.
- Establish warmth and humanity as the core brand feel, positioning SnowForge as an indie studio run by Alex Diaz.
- Introduce a cohesive visual identity that does not copy any one sister app but feels related to all of them.
- Keep the page performant and SEO friendly.

## Non-Goals

- Real logo design for all seven apps. The landing page ships with monogram marks for now. Real logos are a future project.
- Unified design system refactor across sister apps. This spec changes only the SnowForge marketing site.
- Blog, newsletter, or CMS. Static page only.
- i18n. English only for this iteration.
- Dark mode toggle changes. See theme section for current stance.

## Positioning and Voice

SnowForge is an indie software studio run by Alex Diaz. The landing page voice is honest, warm, and operator-driven. It avoids VC-speak and generic SaaS marketing copy.

Writing rules (apply everywhere, especially the copy below):

- No em dashes anywhere. Use periods, commas, colons, parentheses, or rewrite the sentence.
- Avoid the rhetorical pattern "X, not Y" and close variants. State the positive directly.
- Plain language. No jargon unless the visitor is certain to recognize it.
- First person when Alex is speaking. Third person when describing SnowForge as a studio.

## Visual Direction

**Direction chosen:** Warm Indie with a subtle snow treatment. Two complete modes: light (fresh snowfall morning) and dark (deep winter night). The warmth gradient carries across both modes and keeps the brand warmth consistent regardless of theme.

Core palette:

| Token | Light value | Dark value | Purpose |
|-------|-------------|------------|---------|
| `--bg` | `#f8fafc` (slate-50) | `#0b1120` (deep slate) | Page background |
| `--bg-2` | `#eef2f7` | `#0f172a` (slate-900) | Gradient stop for hero background |
| `--surface` | `#ffffff` | `#111827` (gray-900) | Card and section surfaces |
| `--surface-alt` | `#fafafa` | `#0f172a` | Alternating section band |
| `--border` | `#e2e8f0` (slate-200) | `#1e293b` (slate-800) | Card and section borders |
| `--border-hover` | `#cbd5e1` (slate-300) | `#334155` (slate-700) | Hover border state |
| `--ink` | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | Primary text |
| `--ink-muted` | `#475569` (slate-600) | `#cbd5e1` (slate-300) | Secondary text |
| `--ink-dim` | `#64748b` (slate-500) | `#94a3b8` (slate-400) | Tertiary text, captions |
| `--warmth-start` | `#fb923c` (orange-400) | `#fb923c` (orange-400) | Warmth gradient start (same both modes) |
| `--warmth-end` | `#f43f5e` (rose-500) | `#f43f5e` (rose-500) | Warmth gradient end (same both modes) |
| `--warmth-soft` | `#fff7ed` (orange-50) | `rgba(251,146,60,0.08)` | Soft warmth background tint |
| `--warmth-border` | `#fed7aa` (orange-200) | `rgba(251,146,60,0.25)` | Border for Featured card |
| `--ice` | `#7dd3fc` (sky-300) | `#7dd3fc` (sky-300) | Cool accent for tiny details |
| `--snow-dot` | `rgba(148,163,184,0.3)` | `rgba(148,163,184,0.18)` | Background snow pattern dots |
| `--glow` | `rgba(251,146,60,0.14)` | `rgba(251,146,60,0.10)` | Hero warm glow radial |

Typography:

- Body: Inter (already in Next.js default stack or add via `next/font/google`).
- Display headlines: Fraunces, weight 500, slight negative letter spacing. Used for hero headline, section titles, Meet Alex name, and the letter inside monogram marks. Load via `next/font/google`.
- Monospace: Geist Mono or the existing default for the small uppercase `label-tag` style.

Motifs:

- Hero background carries a subtle pattern of small gray dots that evoke falling snow without animation.
- A single static snowflake glyph sits in the top right of the hero at low opacity. One flake only.
- Hero has a warm radial glow in the bottom left using the warmth gradient at low alpha. This offsets the cool background tone.
- Footer signs off with a tiny snowflake glyph next to the attribution line.

Animation:

- Tool cards lift slightly on hover (2px translate, border color shift).
- No autoplay animations, no parallax, no snowfall particles. The page is quiet.

Both modes ship together. The existing theme toggle stays functional. All landing sections must render cleanly in both light and dark using the tokens above.

Dark mode design notes:

- The hero gradient flows from `--bg` at the top to `--bg-2` at the bottom. In dark mode that reads as a night sky gradient without any animation.
- The warm glow in the bottom left of the hero becomes slightly softer in dark mode using `--glow` at its lower alpha.
- The snow dot pattern uses `--snow-dot` which is dimmer in dark mode so the dots read as distant stars or far off snow, never as noise.
- The Meet Alex avatar (real photo) gets a 2px border in `--warmth-start` in both modes so it pops against either background.
- Card borders in dark mode use `--border` which is slate-800. The hover state shifts to `--border-hover` slate-700.
- Tool card accent top bars stay the same vibrant app colors in both modes. The monograms stay the same.
- The Featured SnowPipe card background in dark mode uses `--warmth-soft` at alpha 0.08 so the warmth still reads without blowing out the contrast.
- Section headings stay in Fraunces. The italicized *big care* gradient phrase works against both backgrounds.

## Information Architecture

Sections in order, top to bottom:

1. Hero
2. Meet Alex
3. Why SnowForge
4. Featured SnowPipe
5. The full toolkit (app grid)
6. Honest questions (FAQ)
7. Footer

Each section below gets its own subsection with approved copy and layout notes.

---

### 1. Hero

**Layout:** Centered column, max width ~640px for the headline, left aligned text inside the column. Subtle snow dot background pattern, warm glow bottom left, snowflake glyph top right.

**Badge:** Pill with small orange-to-rose gradient avatar dot on the left.
> Hi, I'm Alex. Solo founder, indie studio.

**Headline** (Fraunces, ~56px on desktop, 38px on mobile, line height 1.05):
> Small tools,
> made with *big care*.

The phrase *big care* is italicized and rendered with the warmth gradient.

**Lead paragraph:**
> An indie studio forging the software I wished existed for e-commerce, content, automation, and the games I love. One account, every app.

**CTAs:**
- Primary: "Explore the tools ↓" (scrolls to the app grid)
- Secondary: "Meet Alex" (scrolls to Meet Alex section)

---

### 2. Meet Alex

**Layout:** Two columns on desktop, stacked on mobile. Left column is a 120px avatar. Right column holds the intro copy.

**Avatar:** Real photo of Alex. Source file is `C:\Users\alexi\Pictures\alexdiaz_pfp.jpg`. Copy into the repo at `public/alex-diaz.jpg` during implementation. Render via `next/image` as a 120px circular crop with a 2px border in `--warmth-start`. Provide a descriptive `alt` such as "Alex Diaz, founder of SnowForge".

**Label tag:** `MEET THE BUILDER`

**Heading:** "Hi, I'm Alex Diaz."

**Paragraph 1:**
> I'm an e-commerce and product feed specialist who got tired of duct taping other people's tools together. So I started building my own. SnowForge is the home for those tools, every one of them shipped solo on nights and weekends, for operators who want software that actually works.

**Paragraph 2:**
> If you need help, you'll be emailing me directly. Same person, same inbox, for every app under SnowForge.

**Links (inline, with warm underline treatment):**
- alexdiaz.me
- Email Alex (mailto:support@snowforge.dev)
- GitHub

---

### 3. Why SnowForge

**Layout:** Section heading centered, three cards in a row on desktop, stacked on mobile. Alternating section background uses the subtle snow dot treatment.

**Heading:** "Why SnowForge?"
**Subheading:** "What makes this different from the 47 other SaaS tabs in your browser."

**Card 1:**
- Icon: key glyph
- Title: "One account, every app"
- Body: "Sign in once. It already works today across every app in the suite. SnowPipe, SnowScrape, SnowGen, SnowGlobe, SnowFort, and TrueIce share the same login."

**Card 2:**
- Icon: hammer or anvil glyph
- Title: "Built by an operator"
- Body: "Every tool started as a problem I hit in my own work. Real pain, real fix, shipped when it was ready. Features exist because I use them."

**Card 3:**
- Icon: envelope glyph
- Title: "A human at the other end"
- Body: "Bugs, feature requests, weird edge cases: they all land in my inbox. Real replies, usually within a day."

---

### 4. Featured SnowPipe

**Layout:** Single wide callout card. Warm background using `--warmth-soft` with a soft border in `orange-200`. Two columns inside: left holds copy and CTA, right holds a 140px monogram tile.

**Label tag:** `◆ FEATURED`

**Heading:** "SnowPipe"

**Body:**
> The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today.

**CTA:** "Try SnowPipe →" (links to `https://pipe.snowforge.dev`)

**Monogram tile:** 140px rounded square, warmth gradient background, Fraunces capital "S" in white.

---

### 5. The full toolkit

**Layout:** Centered heading, three-column grid on desktop, two on tablet, one on mobile.

**Heading:** "The full toolkit"
**Subheading:** "Seven tools. One login. All of them shipped by hand."

**Card treatment:**
- White surface with `--border` outline.
- 2px top accent bar in the app color.
- Monogram mark (48px rounded square, first letter of app name in Fraunces, app color background).
- App name in bold 15px.
- Description in 12px `--ink-dim`.
- "Launch →" link in the bottom.
- Hover: 2px vertical lift, border color shifts to `--ink-dim`.

**Apps and accent colors:**

| App | Color | URL | Description |
|-----|-------|-----|-------------|
| SnowPipe | `#f59e0b` amber-500 | https://pipe.snowforge.dev | Product feed orchestration for Shopify, Meta, and Google. |
| SnowScrape | `#3b82f6` blue-500 | https://scrape.snowforge.dev | Serverless web scraping with scheduled jobs and cloud storage. |
| SnowGen | `#8b5cf6` violet-500 | https://gen.snowforge.dev | AI powered content generation and multi-platform publishing. |
| SnowGlobe | `#10b981` emerald-500 | https://globe.snowforge.dev | Lead gen intelligence across Reddit, HN, and RSS. |
| SnowFort | `#f43f5e` rose-500 | https://fort.snowforge.dev | Fortnite item shop tracker with alerts and 17,000+ cosmetics. |
| TrueIce | `#06b6d4` cyan-500 | https://trueice.snowforge.dev | Advanced League of Legends match history and analytics. |
| SnowSports | `#0ea5e9` sky-500 | https://sports.snowforge.dev | Sports analytics and data visualization for stats driven fans. **Coming soon.** |

SnowSports renders at reduced opacity (0.6) with a "SOON" pill and no launch link.

---

### 6. Honest questions (FAQ)

**Layout:** Centered heading, centered column of question cards (max width ~640px).

**Heading:** "Honest questions"
**Subheading:** "The stuff real people actually ask."

**Q1. Is this one company or seven?**
> One. SnowForge LLC is a solo shop, and every app is part of the same studio. Same account, same credit card on file, same person answering the phone.

**Q2. Who runs this?**
> Me. Alex Diaz. A decade in e-commerce, mostly around product feeds and catalogs. I build these on nights and weekends alongside a day job, and ship them when they're ready.

**Q3. How do I get support?**
> Email me at support@snowforge.dev. You'll get a reply from me directly, usually the same day.

The email address in Q3 renders as a clickable `mailto:support@snowforge.dev` link. A small copy icon sits next to it. Clicking the icon copies the address to the clipboard and briefly swaps the icon to a check mark for ~1.5 seconds to confirm. The link text itself also triggers copy on right-click via the standard browser context menu, so the common "click to email, copy to paste" dual behavior is covered with no extra affordance confusion.

**Q4. Is my data safe?**
> Yes. SnowForge runs on secure infrastructure with industry standard authentication and encrypted secret management. Your data is never sold. The full policy lives at the privacy link below.

**Q5. What's on the roadmap?**
> More tools in the same spirit. MCP servers, an operator friendly Shopify workbench, a feed audit template, and whatever else I wish existed. Follow the blog to see what's shipping.

---

### 7. Footer

**Layout:** Full width, white background, single border top in `--border`. Two groups: attribution on the left, links on the right.

**Attribution:** `© 2026 SnowForge LLC · Forged by Alex Diaz ❋`

**Links:**
- alexdiaz.me (https://alexdiaz.me)
- Privacy (/privacy)
- Terms (/terms)
- GitHub (https://github.com/snowthen-o7)

---

## Components

Propose the following components under `src/components/landing/`:

- `Hero.tsx`
- `MeetAlex.tsx`
- `WhySnowForge.tsx` plus a local `ValueCard` subcomponent
- `FeaturedApp.tsx` (reusable for future featured swaps)
- `AppGrid.tsx` plus a local `AppCard` subcomponent
- `Faq.tsx` plus a local `FaqItem` subcomponent
- `LandingFooter.tsx`
- `Monogram.tsx` reusable monogram mark (props: letter, color, size)
- `SnowDotBackground.tsx` reusable background pattern (for hero and why section)

`src/app/page.tsx` becomes thin: imports and composes the above in order.

Shared data for the app grid lives in `src/components/landing/apps.ts` as a typed constant so future additions are a one line change.

## Theme and Token Changes

`src/app/globals.css` gets the warm-snow tokens applied globally, replacing the current `:root` and `.dark` token sets. Privacy and Terms pages adopt the same tokens, so they render in the new warm-snow palette without extra work.

During implementation, verify both `/privacy` and `/terms` still read cleanly under the new tokens and fix any spots where the old token names were used directly (for example `bg-surface` or `text-muted-foreground`). Any existing Tailwind class names that reference token CSS variables by `bg-background`, `text-foreground`, etc. should be audited to confirm they still map to the new values.

Fraunces needs to be loaded via `next/font/google`. Example:

```ts
import { Fraunces } from 'next/font/google'
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-fraunces' })
```

## Assets

- **Avatar:** Placeholder monogram for v1. Real photo can replace later. No asset required at ship time.
- **App monograms:** Rendered via the `Monogram` component. No image files needed.
- **Favicon and OG image:** Out of scope for this spec. Can follow as a separate task.
- **No stock imagery.** The page uses color, type, and layout. No photos.

## Data

The page is fully static. No API calls, no client state beyond scroll behavior for the hero CTAs. All copy and app metadata live in source.

## Accessibility

- All interactive elements reachable by keyboard.
- Hero CTAs are `<a>` elements with `href` anchors to section IDs.
- Tool grid cards are `<a>` elements. The SnowSports card is a `<div>` with `aria-disabled`.
- Color contrast meets WCAG AA. Slate-600 on slate-50 is borderline for small text and should be verified.
- Fraunces is loaded with `display: swap` to avoid layout shift.
- Respect `prefers-reduced-motion`: disable the hover lift transform when it is set.

## SEO

- `<title>` content: `SnowForge · Small tools, made with big care.`
- `<meta name="description">`: "An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account. Built by Alex Diaz."
- Open Graph tags with the same title and description.
- Add JSON-LD `Organization` schema pointing to alexdiaz.me and the seven apps.

## Out of Scope

- Real logos for the seven apps. Landing ships with letter monograms.
- Analytics instrumentation beyond whatever the repo already has.
- Newsletter signup, email capture, Stripe, auth.
- Copy translations or localized routes.
- Redesign of `/privacy` and `/terms` content. Those pages inherit the new tokens and must continue to render, but their structure and copy stay the same.

## Resolved Decisions

1. **Theme toggle stays visible and functional.** Both light and dark modes ship. Palette table above includes dark values for every token.
2. **Privacy and Terms adopt the new palette** via global token replacement in `globals.css`. Verify they still render cleanly after the swap.
3. **Real avatar photo at launch.** Source: `C:\Users\alexi\Pictures\alexdiaz_pfp.jpg`. Target: `public/alex-diaz.jpg`. Rendered via `next/image` in the Meet Alex section.
4. **FAQ email is clickable and copyable.** Renders as a `mailto:` link with an adjacent copy icon that copies to clipboard on click and confirms via a check mark swap.

## Acceptance Criteria

- `src/app/page.tsx` renders all seven sections in the order listed.
- No em dashes and no "X, not Y" constructions anywhere in the copy.
- All seven apps show up in the grid with correct accent colors and URLs.
- SnowSports appears dimmed with a "SOON" pill and no link.
- Featured SnowPipe card renders above the grid with working link.
- FAQ contains exactly the five Q&A pairs in this spec.
- Footer attribution line matches exactly.
- Fraunces loads without layout shift.
- Mobile breakpoint (≤640px) stacks grids to single column cleanly.
- Lighthouse performance on mobile scores ≥90.
- No new hard-coded secrets or environment variables required.
