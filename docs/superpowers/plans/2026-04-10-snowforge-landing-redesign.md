# SnowForge Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current minimal SnowForge landing page with a seven-section warm-indie design that works in both light and dark modes, centered on the "indie studio run by Alex Diaz" voice, featuring all seven apps with SnowPipe spotlighted.

**Architecture:** Break `src/app/page.tsx` into composed section components under `src/components/landing/`. Centralize palette in CSS variables on `globals.css` (light under `:root`, dark under `.dark`). Expose new Tailwind color names via `tailwind.config.js`. Load Fraunces display font via `next/font/google`. Data for the app grid lives in a typed constant in `src/components/landing/apps.ts`.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS 4, `next/font/google`, `next/image`. Package manager: pnpm.

**Testing approach:** This project has no test framework installed. Verification is manual via `pnpm dev` (visual) and `pnpm build` plus `pnpm lint` (static). Each task ends with an explicit verification step that lists what to look at and what to expect.

**Spec reference:** `docs/superpowers/specs/2026-04-10-snowforge-landing-redesign.md`

---

## File Map

### New files

| Path | Purpose |
|------|---------|
| `public/alex-diaz.jpg` | Real avatar photo of Alex for the Meet Alex section |
| `src/components/landing/apps.ts` | Typed array of the seven apps (name, color, url, description, comingSoon) |
| `src/components/landing/Monogram.tsx` | Reusable letter monogram in a rounded tile with configurable color and size |
| `src/components/landing/SnowDotBackground.tsx` | Reusable absolutely-positioned snow-dot CSS background element |
| `src/components/landing/Hero.tsx` | Hero section (server component) |
| `src/components/landing/MeetAlex.tsx` | Meet Alex section with real photo (server component) |
| `src/components/landing/WhySnowForge.tsx` | Why SnowForge 3-card section (server component) |
| `src/components/landing/FeaturedApp.tsx` | Featured SnowPipe callout card (server component) |
| `src/components/landing/AppGrid.tsx` | Seven-app grid (server component) |
| `src/components/landing/Faq.tsx` | Honest Questions section (server component) |
| `src/components/landing/CopyEmailButton.tsx` | Client component that renders the FAQ email link plus copy button |
| `src/components/landing/LandingFooter.tsx` | Landing page footer |

### Modified files

| Path | Change |
|------|--------|
| `src/app/globals.css` | Replace light and dark token values with warm-snow palette. Add new tokens. Register Fraunces var. |
| `src/app/layout.tsx` | Load Fraunces via `next/font/google`. Update metadata title, description, and OG. Add JSON-LD `Organization` schema. Apply Fraunces variable to `<html>`. |
| `src/app/page.tsx` | Rewrite as thin composition of the landing components. |
| `tailwind.config.js` | Add new color names (`warmth-start`, `warmth-end`, `warmth-soft`, `warmth-border`, `ice`, `ink-dim`, `snow-dot`, `glow`) mapped to CSS variables. |

### Untouched but verified

- `src/app/privacy/page.tsx` verify it still renders cleanly after token changes.
- `src/app/terms/page.tsx` verify it still renders cleanly after token changes.
- `src/components/ThemeToggle.tsx` unchanged, must continue to work.

---

## Pre-flight

- [ ] **Step 0.1: Confirm working directory**

```bash
pwd
```

Expected: `/c/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowForge`

- [ ] **Step 0.2: Confirm current git branch is clean enough to work from**

```bash
git status --short
```

Expected: some unrelated modified and untracked files (globals.css, page.tsx, privacy/page.tsx, terms/page.tsx, ThemeToggle.tsx, .claude/, .superpowers/, docs/, products/, vercel.json). The plan touches several of those already-modified files. Do not stash or reset. Work on top of the existing state.

- [ ] **Step 0.3: Confirm pnpm is available**

```bash
pnpm --version
```

Expected: a version number. If it errors, install pnpm before proceeding.

- [ ] **Step 0.4: Install dependencies if needed**

```bash
pnpm install
```

Expected: dependencies install without errors. Next time this runs it becomes a no-op.

---

## Task 1: Update CSS tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

The spec calls for a warm-snow palette with new tokens. To avoid breaking `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` (which reference Tailwind utilities like `bg-surface`, `text-foreground`, `text-muted-foreground`, `bg-border`, `text-accent`), keep the existing CSS variable names and update their values. Add brand new variables for the warm-snow-specific tokens.

- [ ] **Step 1.1: Replace globals.css content**

Write the following to `src/app/globals.css` (full replacement):

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: rgb(var(--background));
  --color-foreground: rgb(var(--foreground));
  --color-surface: rgb(var(--surface));
  --color-surface-elevated: rgb(var(--surface-elevated));
  --color-border: rgb(var(--border));
  --color-border-hover: rgb(var(--border-hover));
  --color-muted: rgb(var(--muted));
  --color-muted-foreground: rgb(var(--muted-foreground));
  --color-ink-dim: rgb(var(--ink-dim));
  --color-accent: rgb(var(--accent));
  --color-accent-foreground: rgb(var(--accent-foreground));
  --color-warmth-start: rgb(var(--warmth-start));
  --color-warmth-end: rgb(var(--warmth-end));
  --color-warmth-border: rgb(var(--warmth-border));
  --color-ice: rgb(var(--ice));
}

@layer base {
  :root {
    /* Light mode: fresh snowfall morning */
    --background: 248 250 252;          /* slate-50 */
    --foreground: 15 23 42;             /* slate-900 */
    --surface: 255 255 255;             /* white */
    --surface-elevated: 250 250 250;    /* slightly off-white for alt bands */
    --border: 226 232 240;              /* slate-200 */
    --border-hover: 203 213 225;        /* slate-300 */
    --muted: 238 242 247;               /* cool slate tint (hero gradient stop) */
    --muted-foreground: 71 85 105;      /* slate-600 */
    --ink-dim: 100 116 139;             /* slate-500 */
    --accent: 249 115 22;               /* orange-500 */
    --accent-foreground: 255 255 255;

    /* Warmth gradient (identical in both modes) */
    --warmth-start: 251 146 60;         /* orange-400 */
    --warmth-end: 244 63 94;            /* rose-500 */

    /* Soft warmth used as tint/background */
    --warmth-soft: 255 247 237;         /* orange-50 solid equivalent */
    --warmth-soft-alpha: rgba(255, 247, 237, 1);
    --warmth-border: 254 215 170;       /* orange-200 */

    /* Ice highlight (identical both modes) */
    --ice: 125 211 252;                 /* sky-300 */

    /* Non-rgb helpers (used directly via var()) */
    --snow-dot-color: rgba(148, 163, 184, 0.30);
    --glow-color: rgba(251, 146, 60, 0.14);
  }

  .dark {
    /* Dark mode: deep winter night */
    --background: 11 17 32;             /* deep slate */
    --foreground: 248 250 252;          /* slate-50 */
    --surface: 17 24 39;                /* gray-900 */
    --surface-elevated: 15 23 42;       /* slate-900 */
    --border: 30 41 59;                 /* slate-800 */
    --border-hover: 51 65 85;           /* slate-700 */
    --muted: 15 23 42;                  /* slate-900 */
    --muted-foreground: 203 213 225;    /* slate-300 */
    --ink-dim: 148 163 184;             /* slate-400 */
    --accent: 251 146 60;               /* orange-400 */
    --accent-foreground: 15 23 42;

    /* Warmth gradient identical */
    --warmth-start: 251 146 60;
    --warmth-end: 244 63 94;

    /* Warmth soft is a low-alpha overlay in dark mode */
    --warmth-soft-alpha: rgba(251, 146, 60, 0.08);
    --warmth-border: 251 146 60;        /* rendered with alpha by consumers */

    --ice: 125 211 252;

    --snow-dot-color: rgba(148, 163, 184, 0.18);
    --glow-color: rgba(251, 146, 60, 0.10);
  }

  body {
    background-color: rgb(var(--background));
    color: rgb(var(--foreground));
  }
}
```

- [ ] **Step 1.2: Run the dev server and verify the existing page still renders without crash**

```bash
pnpm dev
```

Open http://localhost:3000 in a browser.
Expected: page loads without errors in the terminal or the browser console. Existing hero and tool grid still render. Colors look different (warmer, more cool-white). Toggle theme to confirm dark mode also renders.
Stop the dev server with Ctrl+C.

- [ ] **Step 1.3: Run the linter**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 1.4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(landing): swap globals tokens to warm-snow palette"
```

---

## Task 2: Update tailwind.config.js with new color names

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 2.1: Replace tailwind.config.js**

Write the following to `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-hover': 'rgb(var(--border-hover) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        'ink-dim': 'rgb(var(--ink-dim) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        'warmth-start': 'rgb(var(--warmth-start) / <alpha-value>)',
        'warmth-end': 'rgb(var(--warmth-end) / <alpha-value>)',
        'warmth-border': 'rgb(var(--warmth-border) / <alpha-value>)',
        ice: 'rgb(var(--ice) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2.2: Run the linter**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(landing): expose warmth and ice colors in tailwind config"
```

---

## Task 3: Load Fraunces and Inter fonts in layout, update metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 3.1: Replace layout.tsx content**

Write the following to `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SnowForge · Small tools, made with big care.',
  description:
    'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account. Built by Alex Diaz.',
  keywords: [
    'indie software',
    'developer tools',
    'Shopify',
    'product feeds',
    'web scraping',
    'AI content generation',
    'gaming analytics',
    'Alex Diaz',
  ],
  authors: [{ name: 'Alex Diaz', url: 'https://alexdiaz.me' }],
  openGraph: {
    title: 'SnowForge · Small tools, made with big care.',
    description:
      'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account. Built by Alex Diaz.',
    type: 'website',
    url: 'https://snowforge.dev',
    siteName: 'SnowForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnowForge · Small tools, made with big care.',
    description:
      'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account.',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SnowForge LLC',
  url: 'https://snowforge.dev',
  founder: {
    '@type': 'Person',
    name: 'Alex Diaz',
    url: 'https://alexdiaz.me',
  },
  email: 'support@snowforge.dev',
  sameAs: [
    'https://alexdiaz.me',
    'https://github.com/snowthen-o7',
    'https://pipe.snowforge.dev',
    'https://scrape.snowforge.dev',
    'https://gen.snowforge.dev',
    'https://globe.snowforge.dev',
    'https://fort.snowforge.dev',
    'https://trueice.snowforge.dev',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') return;
                if (theme === 'dark' || !window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3.2: Verify fonts load**

```bash
pnpm dev
```

Open http://localhost:3000. Open browser devtools Network tab and reload.
Expected: requests for `fraunces-*.woff2` and `inter-*.woff2` resolve with 200. Page renders without console errors. Existing hero headline still shows (it will still use the old inline classes until Task 6).
Stop the dev server.

- [ ] **Step 3.3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(landing): load Fraunces and Inter fonts, update metadata and JSON-LD"
```

---

## Task 4: Copy the Alex Diaz photo into public

**Files:**
- Create: `public/alex-diaz.jpg`

- [ ] **Step 4.1: Create public directory if missing**

```bash
mkdir -p public
```

- [ ] **Step 4.2: Copy the source image into public/**

```bash
cp "/c/Users/alexi/Pictures/alexdiaz_pfp.jpg" public/alex-diaz.jpg
```

- [ ] **Step 4.3: Verify the file exists**

```bash
ls -la public/alex-diaz.jpg
```

Expected: file listed with size around 42 KB.

- [ ] **Step 4.4: Commit**

```bash
git add public/alex-diaz.jpg
git commit -m "feat(landing): add Alex Diaz avatar photo"
```

---

## Task 5: Create the apps.ts data module

**Files:**
- Create: `src/components/landing/apps.ts`

- [ ] **Step 5.1: Create directory and write the data file**

```bash
mkdir -p src/components/landing
```

Write the following to `src/components/landing/apps.ts`:

```ts
export type AppEntry = {
  name: string
  shortDescription: string
  url: string
  /** Hex color used for the monogram background and top accent bar. */
  color: string
  /** Optional flag: renders the card as non-interactive with a "SOON" pill. */
  comingSoon?: boolean
}

export const APPS: AppEntry[] = [
  {
    name: 'SnowPipe',
    shortDescription: 'Product feed orchestration for Shopify, Meta, and Google.',
    url: 'https://pipe.snowforge.dev',
    color: '#f59e0b',
  },
  {
    name: 'SnowScrape',
    shortDescription: 'Serverless web scraping with scheduled jobs and cloud storage.',
    url: 'https://scrape.snowforge.dev',
    color: '#3b82f6',
  },
  {
    name: 'SnowGen',
    shortDescription: 'AI powered content generation and multi-platform publishing.',
    url: 'https://gen.snowforge.dev',
    color: '#8b5cf6',
  },
  {
    name: 'SnowGlobe',
    shortDescription: 'Lead gen intelligence across Reddit, HN, and RSS.',
    url: 'https://globe.snowforge.dev',
    color: '#10b981',
  },
  {
    name: 'SnowFort',
    shortDescription: 'Fortnite item shop tracker with alerts and 17,000+ cosmetics.',
    url: 'https://fort.snowforge.dev',
    color: '#f43f5e',
  },
  {
    name: 'TrueIce',
    shortDescription: 'Advanced League of Legends match history and analytics.',
    url: 'https://trueice.snowforge.dev',
    color: '#06b6d4',
  },
  {
    name: 'SnowSports',
    shortDescription: 'Sports analytics and data visualization for stats driven fans.',
    url: 'https://sports.snowforge.dev',
    color: '#0ea5e9',
    comingSoon: true,
  },
]
```

- [ ] **Step 5.2: Run type check**

```bash
pnpm build
```

Expected: build succeeds. (This also catches any Tailwind issues from prior tasks.)

- [ ] **Step 5.3: Commit**

```bash
git add src/components/landing/apps.ts
git commit -m "feat(landing): add typed app data module"
```

---

## Task 6: Create the Monogram component

**Files:**
- Create: `src/components/landing/Monogram.tsx`

- [ ] **Step 6.1: Write Monogram.tsx**

Write the following to `src/components/landing/Monogram.tsx`:

```tsx
type MonogramProps = {
  letter: string
  color: string
  size?: number
  /** Use the warmth gradient instead of a flat color background. */
  warmthGradient?: boolean
  className?: string
}

export function Monogram({
  letter,
  color,
  size = 48,
  warmthGradient = false,
  className = '',
}: MonogramProps) {
  const background = warmthGradient
    ? 'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))'
    : color

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-xl text-white font-display font-medium leading-none select-none ${className}`}
      style={{
        background,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
      }}
    >
      {letter}
    </div>
  )
}
```

- [ ] **Step 6.2: Run type check**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 6.3: Commit**

```bash
git add src/components/landing/Monogram.tsx
git commit -m "feat(landing): add Monogram component"
```

---

## Task 7: Create the SnowDotBackground component

**Files:**
- Create: `src/components/landing/SnowDotBackground.tsx`

- [ ] **Step 7.1: Write SnowDotBackground.tsx**

Write the following to `src/components/landing/SnowDotBackground.tsx`:

```tsx
type SnowDotBackgroundProps = {
  className?: string
}

/**
 * Absolutely-positioned layer that renders scattered snow-colored dots.
 * Uses CSS var --snow-dot-color which adapts to light/dark mode automatically.
 * Parent must be position: relative and overflow hidden if clipping is desired.
 */
export function SnowDotBackground({ className = '' }: SnowDotBackgroundProps) {
  const dotStops = [
    '12% 18%',
    '78% 28%',
    '34% 52%',
    '88% 68%',
    '22% 82%',
    '62% 88%',
    '50% 12%',
    '8% 60%',
    '92% 44%',
    '44% 32%',
  ]

  const backgroundImage = dotStops
    .map(
      (pos) =>
        `radial-gradient(circle at ${pos}, var(--snow-dot-color) 1px, transparent 1.5px)`
    )
    .join(', ')

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage }}
    />
  )
}
```

- [ ] **Step 7.2: Build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 7.3: Commit**

```bash
git add src/components/landing/SnowDotBackground.tsx
git commit -m "feat(landing): add SnowDotBackground pattern component"
```

---

## Task 8: Create the Hero component

**Files:**
- Create: `src/components/landing/Hero.tsx`

- [ ] **Step 8.1: Write Hero.tsx**

Write the following to `src/components/landing/Hero.tsx`:

```tsx
import { SnowDotBackground } from './SnowDotBackground'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden px-6 pt-28 pb-24 sm:pt-40 sm:pb-32"
    >
      <SnowDotBackground />

      {/* Warm glow bottom-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, var(--glow-color), transparent 60%)',
        }}
      />

      {/* Single snowflake glyph top-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-10 text-3xl text-ink-dim opacity-40 select-none"
      >
        ❋
      </span>

      <div className="relative mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border border-white"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          />
          Hi, I&apos;m Alex. Solo founder, indie studio.
        </div>

        <h1 className="mt-6 font-display font-medium tracking-tight text-foreground text-5xl sm:text-7xl leading-[1.05] max-w-3xl">
          Small tools,
          <br />
          made with{' '}
          <span
            className="italic bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          >
            big care
          </span>
          .
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          An indie studio forging the software I wished existed for e-commerce,
          content, automation, and the games I love. One account, every app.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#toolkit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Explore the tools ↓
          </a>
          <a
            href="#meet-alex"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-hover bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground"
          >
            Meet Alex
          </a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8.2: Wire into page.tsx temporarily to verify visually**

Replace the contents of `src/app/page.tsx` with the following temporary scaffold so the Hero can be visually verified in isolation:

```tsx
import { Hero } from '@/components/landing/Hero'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
    </main>
  )
}
```

- [ ] **Step 8.3: Visually verify**

```bash
pnpm dev
```

Open http://localhost:3000.
Expected:
- Badge pill reads "Hi, I'm Alex. Solo founder, indie studio."
- Headline in Fraunces reads "Small tools, made with big care." with "big care" italicized and rendered in the orange-to-rose gradient.
- Lead paragraph reads correctly.
- Two CTAs visible: "Explore the tools ↓" and "Meet Alex".
- Subtle snow dots visible in the background.
- Warm glow visible in the bottom-left corner.
- Snowflake glyph ❋ visible in the top-right, low opacity.
- Theme toggle works. In dark mode, background becomes deep slate, headline stays legible, warmth gradient stays identical.
Stop the dev server.

- [ ] **Step 8.4: Commit**

```bash
git add src/components/landing/Hero.tsx src/app/page.tsx
git commit -m "feat(landing): add Hero section"
```

---

## Task 9: Create the MeetAlex component

**Files:**
- Create: `src/components/landing/MeetAlex.tsx`

- [ ] **Step 9.1: Write MeetAlex.tsx**

Write the following to `src/components/landing/MeetAlex.tsx`:

```tsx
import Image from 'next/image'

export function MeetAlex() {
  return (
    <section
      id="meet-alex"
      className="border-y border-border bg-surface px-6 py-20"
    >
      <div className="mx-auto max-w-3xl grid gap-10 sm:grid-cols-[140px_1fr] sm:gap-12 items-start">
        <div className="flex justify-center sm:block">
          <div
            className="rounded-full p-[2px]"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          >
            <Image
              src="/alex-diaz.jpg"
              alt="Alex Diaz, founder of SnowForge"
              width={140}
              height={140}
              priority
              className="h-[140px] w-[140px] rounded-full object-cover"
            />
          </div>
        </div>

        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim mb-3">
            Meet the builder
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Hi, I&apos;m Alex Diaz.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            I&apos;m an e-commerce and product feed specialist who got tired of
            duct taping other people&apos;s tools together. So I started
            building my own. SnowForge is the home for those tools, every one
            of them shipped solo on nights and weekends, for operators who want
            software that actually works.
          </p>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">
              If you need help, you&apos;ll be emailing me directly.
            </strong>{' '}
            Same person, same inbox, for every app under SnowForge.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <a
              href="https://alexdiaz.me"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              alexdiaz.me →
            </a>
            <a
              href="mailto:support@snowforge.dev"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              Email Alex →
            </a>
            <a
              href="https://github.com/snowthen-o7"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              GitHub →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 9.2: Wire into page.tsx temporarily**

Update `src/app/page.tsx` to:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
    </main>
  )
}
```

- [ ] **Step 9.3: Visually verify**

```bash
pnpm dev
```

Open http://localhost:3000 and scroll to the Meet Alex section.
Expected:
- Real photo of Alex renders as a 140px circle with a warm gradient ring around it.
- Label tag "MEET THE BUILDER" visible in mono small caps.
- Heading "Hi, I'm Alex Diaz." in Fraunces.
- Two paragraphs with the second line's first sentence in bold.
- Three inline links with warm underline treatment.
- Section background is the surface color and has border top/bottom.
- Mobile layout stacks the photo above the text.
- Dark mode renders cleanly.
Stop the dev server.

- [ ] **Step 9.4: Commit**

```bash
git add src/components/landing/MeetAlex.tsx src/app/page.tsx
git commit -m "feat(landing): add Meet Alex section with real photo"
```

---

## Task 10: Create the WhySnowForge component

**Files:**
- Create: `src/components/landing/WhySnowForge.tsx`

- [ ] **Step 10.1: Write WhySnowForge.tsx**

Write the following to `src/components/landing/WhySnowForge.tsx`:

```tsx
import { SnowDotBackground } from './SnowDotBackground'

type Value = {
  icon: string
  title: string
  body: string
}

const VALUES: Value[] = [
  {
    icon: '🔑',
    title: 'One account, every app',
    body:
      'Sign in once. It already works today across every app in the suite. SnowPipe, SnowScrape, SnowGen, SnowGlobe, SnowFort, and TrueIce share the same login.',
  },
  {
    icon: '⚒',
    title: 'Built by an operator',
    body:
      'Every tool started as a problem I hit in my own work. Real pain, real fix, shipped when it was ready. Features exist because I use them.',
  },
  {
    icon: '✉',
    title: 'A human at the other end',
    body:
      'Bugs, feature requests, weird edge cases: they all land in my inbox. Real replies, usually within a day.',
  },
]

export function WhySnowForge() {
  return (
    <section id="why" className="relative overflow-hidden px-6 py-24">
      <SnowDotBackground />
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Why SnowForge?
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            What makes this different from the 47 other SaaS tabs in your browser.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {VALUES.map((value) => (
            <ValueCard key={value.title} {...value} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueCard({ icon, title, body }: Value) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div
        aria-hidden="true"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border text-lg"
        style={{
          backgroundColor: 'var(--warmth-soft-alpha)',
          borderColor: 'rgba(251, 146, 60, 0.3)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-ink-dim">{body}</p>
    </div>
  )
}
```

- [ ] **Step 10.2: Wire into page.tsx**

Update `src/app/page.tsx`:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
    </main>
  )
}
```

- [ ] **Step 10.3: Visually verify**

```bash
pnpm dev
```

Expected:
- Heading "Why SnowForge?" centered in Fraunces.
- Subtitle reads the "47 other SaaS tabs" line.
- Three cards in a row on desktop, stacked on mobile.
- Each card has an icon in a warm-tinted rounded tile, title, body.
- Snow dot pattern visible in section background.
- Dark mode renders cleanly.
Stop the dev server.

- [ ] **Step 10.4: Commit**

```bash
git add src/components/landing/WhySnowForge.tsx src/app/page.tsx
git commit -m "feat(landing): add Why SnowForge section"
```

---

## Task 11: Create the FeaturedApp component

**Files:**
- Create: `src/components/landing/FeaturedApp.tsx`

- [ ] **Step 11.1: Write FeaturedApp.tsx**

Write the following to `src/components/landing/FeaturedApp.tsx`:

```tsx
import { Monogram } from './Monogram'

type FeaturedAppProps = {
  label?: string
  name: string
  body: string
  href: string
  ctaText: string
  monogramLetter: string
}

export function FeaturedApp({
  label = '◆ FEATURED',
  name,
  body,
  href,
  ctaText,
  monogramLetter,
}: FeaturedAppProps) {
  return (
    <section id="featured" className="px-6 py-20">
      <div
        className="mx-auto max-w-5xl rounded-2xl border p-8 sm:p-10 grid gap-8 sm:grid-cols-[1fr_auto] items-center"
        style={{
          background: 'var(--warmth-soft-alpha)',
          borderColor: 'rgba(251, 146, 60, 0.35)',
        }}
      >
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
            {label}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            {name}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            {body}
          </p>
          <a
            href={href}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {ctaText}
          </a>
        </div>
        <div className="justify-self-center sm:justify-self-end">
          <Monogram letter={monogramLetter} color="" size={140} warmthGradient />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 11.2: Wire into page.tsx**

Update `src/app/page.tsx`:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        monogramLetter="S"
      />
    </main>
  )
}
```

- [ ] **Step 11.3: Visually verify**

```bash
pnpm dev
```

Expected:
- Featured card renders with warm soft background tint and warm border.
- "◆ FEATURED" label in orange mono caps.
- "SnowPipe" headline in Fraunces.
- Body copy matches the spec.
- "Try SnowPipe →" CTA button renders and links to pipe.snowforge.dev.
- 140px monogram tile on the right shows an "S" on the warm gradient.
- Dark mode: the soft warmth reads as a subtle glow rather than a solid block.
Stop the dev server.

- [ ] **Step 11.4: Commit**

```bash
git add src/components/landing/FeaturedApp.tsx src/app/page.tsx
git commit -m "feat(landing): add Featured SnowPipe section"
```

---

## Task 12: Create the AppGrid component

**Files:**
- Create: `src/components/landing/AppGrid.tsx`

- [ ] **Step 12.1: Write AppGrid.tsx**

Write the following to `src/components/landing/AppGrid.tsx`:

```tsx
import { APPS, type AppEntry } from './apps'
import { Monogram } from './Monogram'
import { SnowDotBackground } from './SnowDotBackground'

export function AppGrid() {
  return (
    <section id="toolkit" className="relative overflow-hidden px-6 py-24">
      <SnowDotBackground />
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            The full toolkit
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            Seven tools. One login. All of them shipped by hand.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function AppCard({ app }: { app: AppEntry }) {
  const content = (
    <>
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: app.color }}
      />
      <div className="flex items-start gap-3">
        <Monogram letter={app.name.charAt(0)} color={app.color} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{app.name}</h3>
            {app.comingSoon && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-muted text-ink-dim">
                Soon
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-dim leading-relaxed">
            {app.shortDescription}
          </p>
        </div>
      </div>
      {!app.comingSoon && (
        <div className="mt-4 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Launch →
        </div>
      )}
    </>
  )

  const baseClass =
    'group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all'

  if (app.comingSoon) {
    return (
      <li className="list-none">
        <div
          className={`${baseClass} opacity-60`}
          aria-disabled="true"
        >
          {content}
        </div>
      </li>
    )
  }

  return (
    <li className="list-none">
      <a
        href={app.url}
        className={`${baseClass} hover:-translate-y-0.5 hover:border-border-hover motion-reduce:hover:translate-y-0`}
      >
        {content}
      </a>
    </li>
  )
}
```

- [ ] **Step 12.2: Wire into page.tsx**

Update `src/app/page.tsx`:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'
import { AppGrid } from '@/components/landing/AppGrid'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        monogramLetter="S"
      />
      <AppGrid />
    </main>
  )
}
```

- [ ] **Step 12.3: Visually verify**

```bash
pnpm dev
```

Expected:
- "The full toolkit" heading in Fraunces, centered.
- 7 cards render: SnowPipe, SnowScrape, SnowGen, SnowGlobe, SnowFort, TrueIce, SnowSports.
- Each card has a colored top bar, a monogram with the first letter of the app name in the app color, the app name in bold, short description, "Launch →" link.
- SnowSports is dimmed, has a "SOON" pill, and has no Launch link.
- Hovering a live card lifts it 2px and shifts the border color.
- Clicking "SnowPipe" card goes to https://pipe.snowforge.dev.
- Mobile stacks to single column.
Stop the dev server.

- [ ] **Step 12.4: Commit**

```bash
git add src/components/landing/AppGrid.tsx src/app/page.tsx
git commit -m "feat(landing): add full toolkit app grid"
```

---

## Task 13: Create the CopyEmailButton client component

**Files:**
- Create: `src/components/landing/CopyEmailButton.tsx`

- [ ] **Step 13.1: Write CopyEmailButton.tsx**

Write the following to `src/components/landing/CopyEmailButton.tsx`:

```tsx
'use client'

import { useState } from 'react'

type CopyEmailButtonProps = {
  email: string
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`mailto:${email}`}
        className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied to clipboard' : `Copy ${email} to clipboard`}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-ink-dim hover:text-foreground transition-colors"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </span>
  )
}
```

- [ ] **Step 13.2: Build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 13.3: Commit**

```bash
git add src/components/landing/CopyEmailButton.tsx
git commit -m "feat(landing): add CopyEmailButton client component"
```

---

## Task 14: Create the Faq component

**Files:**
- Create: `src/components/landing/Faq.tsx`

- [ ] **Step 14.1: Write Faq.tsx**

Write the following to `src/components/landing/Faq.tsx`:

```tsx
import { ReactNode } from 'react'
import { CopyEmailButton } from './CopyEmailButton'

type FaqEntry = {
  question: string
  answer: ReactNode
}

const FAQS: FaqEntry[] = [
  {
    question: 'Is this one company or seven?',
    answer:
      'One. SnowForge LLC is a solo shop, and every app is part of the same studio. Same account, same credit card on file, same person answering the phone.',
  },
  {
    question: 'Who runs this?',
    answer:
      "Me. Alex Diaz. A decade in e-commerce, mostly around product feeds and catalogs. I build these on nights and weekends alongside a day job, and ship them when they're ready.",
  },
  {
    question: 'How do I get support?',
    answer: (
      <>
        Email me at <CopyEmailButton email="support@snowforge.dev" />. You&apos;ll
        get a reply from me directly, usually the same day.
      </>
    ),
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. SnowForge runs on secure infrastructure with industry standard authentication and encrypted secret management. Your data is never sold. The full policy lives at the privacy link below.',
  },
  {
    question: "What's on the roadmap?",
    answer:
      "More tools in the same spirit. MCP servers, an operator friendly Shopify workbench, a feed audit template, and whatever else I wish existed. Follow the blog to see what's shipping.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      className="border-y border-border bg-surface px-6 py-24"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Honest questions
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            The stuff real people actually ask.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question}>
              {faq.answer}
            </FaqItem>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({
  question,
  children,
}: {
  question: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h3 className="text-sm font-semibold text-foreground">{question}</h3>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 14.2: Wire into page.tsx**

Update `src/app/page.tsx`:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'
import { AppGrid } from '@/components/landing/AppGrid'
import { Faq } from '@/components/landing/Faq'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        monogramLetter="S"
      />
      <AppGrid />
      <Faq />
    </main>
  )
}
```

- [ ] **Step 14.3: Visually verify the FAQ**

```bash
pnpm dev
```

Expected:
- FAQ section renders with heading "Honest questions" in Fraunces.
- Five question cards appear in order: one company or seven, who runs this, support, data safe, roadmap.
- The support answer contains `support@snowforge.dev` rendered as an underlined mailto link with a small copy icon next to it.
- Clicking the email link opens the mail client (or browser handler).
- Clicking the copy icon puts `support@snowforge.dev` in the clipboard and the icon changes to a checkmark for ~1.5 seconds.
- Dark mode renders cleanly.
Stop the dev server.

- [ ] **Step 14.4: Commit**

```bash
git add src/components/landing/Faq.tsx src/app/page.tsx
git commit -m "feat(landing): add Honest questions FAQ section"
```

---

## Task 15: Create the LandingFooter component

**Files:**
- Create: `src/components/landing/LandingFooter.tsx`

- [ ] **Step 15.1: Write LandingFooter.tsx**

Write the following to `src/components/landing/LandingFooter.tsx`:

```tsx
export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-4 text-sm text-ink-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} SnowForge LLC · Forged by Alex Diaz{' '}
          <span aria-hidden="true">❋</span>
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
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
      </div>
    </footer>
  )
}
```

- [ ] **Step 15.2: Wire into page.tsx (final composition)**

Replace `src/app/page.tsx` contents with:

```tsx
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'
import { AppGrid } from '@/components/landing/AppGrid'
import { Faq } from '@/components/landing/Faq'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        monogramLetter="S"
      />
      <AppGrid />
      <Faq />
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 15.3: Visually verify the full page end-to-end**

```bash
pnpm dev
```

Walk through every section from top to bottom:
1. Hero: badge, headline with italic gradient, sub, two CTAs, snow dots, warm glow, snowflake.
2. Meet Alex: real photo with warm ring, intro, email promise, three inline links.
3. Why SnowForge: three value cards.
4. Featured SnowPipe: warm callout with CTA and monogram tile.
5. The full toolkit: seven cards, SnowSports dimmed with SOON pill.
6. Honest questions: five Q&A, email copy button works.
7. Footer: attribution line and four links.

Toggle theme and confirm all seven sections render cleanly in dark mode.

Expected: no console errors, no layout jumps, no broken links. Every section matches the spec.
Stop the dev server.

- [ ] **Step 15.4: Commit**

```bash
git add src/components/landing/LandingFooter.tsx src/app/page.tsx
git commit -m "feat(landing): add LandingFooter and compose full page"
```

---

## Task 16: Verify /privacy and /terms still render after token changes

**Files:**
- Read only: `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`

- [ ] **Step 16.1: Visual check**

```bash
pnpm dev
```

Open http://localhost:3000/privacy.
Expected: page renders without console errors. Headings, body text, list items, and the contact card (`bg-surface`) all legible in both light and dark modes. The `text-accent` hover links render as the new orange-500 accent.

Open http://localhost:3000/terms.
Expected: same. Page renders cleanly in both modes.

Stop the dev server. If either page looks broken, inspect which Tailwind class is failing and fix either the token value or the class usage. Do not restructure the page content.

- [ ] **Step 16.2: If no fixes needed, skip commit. If fixes were needed, commit them**

```bash
git status
```

If changes exist:

```bash
git add src/app/privacy/page.tsx src/app/terms/page.tsx
git commit -m "fix(landing): patch privacy and terms after token swap"
```

---

## Task 17: Final build, lint, and Lighthouse sanity check

- [ ] **Step 17.1: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 17.2: Run production build**

```bash
pnpm build
```

Expected: build succeeds. Bundle size for the home route prints and is reasonable (under a few hundred KB for JS).

- [ ] **Step 17.3: Start production server and run Lighthouse**

```bash
pnpm start
```

In a separate terminal or in Chrome DevTools, run Lighthouse on http://localhost:3000 with the Mobile preset.
Expected: Performance ≥ 90. If the score is below 90, inspect the report for obvious fixes (image sizing, font loading, layout shift) and patch. Most likely culprits if any: the avatar photo size and `display: swap` on Fraunces.

Stop the production server.

- [ ] **Step 17.4: Copy scan for em dashes and X-not-Y patterns in the new components**

```bash
grep -r "—" src/components/landing src/app/page.tsx src/app/layout.tsx
```

Expected: no matches.

```bash
grep -rn ", not \|isn't \|n't a " src/components/landing src/app/page.tsx
```

Expected: no matches in user-facing copy. Hits on rule definitions or comments are acceptable.

- [ ] **Step 17.5: Final acceptance walk-through**

Re-read the Acceptance Criteria section of the spec (`docs/superpowers/specs/2026-04-10-snowforge-landing-redesign.md`) and confirm every bullet is satisfied. If a bullet is not satisfied, fix it now with a targeted commit.

- [ ] **Step 17.6: Final commit of any stragglers**

```bash
git status
```

If changes exist:

```bash
git add <specific files>
git commit -m "chore(landing): final polish and acceptance sweep"
```

---

## Post-implementation

- Update `C:\Users\alexi\.claude\TODO.md` to reflect that the SnowForge landing page redesign is complete.
- Consider creating or updating `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\PROGRESS.md` if Alex wants parity with sister-app progress tracking.
- Real logos for the seven apps remain a future task. Swap `Monogram` usage for image assets once logos exist.
