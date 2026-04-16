# SnowForge Brand Assets Guide

Complete asset inventory with upload/usage recommendations for every public context.

**Last updated:** 2026-04-15

---

## File Inventory

### Source logos (GPT-generated, cropped to individual quadrants)

`gpt-logo/` directory. These are the master PNGs with their original solid backgrounds.

| File | Size | Use |
|---|---|---|
| `light-icon.png` | 768x512 | Icon on light bg (cream) |
| `light-horizontal-lockup.png` | 768x512 | Icon + wordmark, light bg |
| `light-stacked-lockup.png` | 768x512 | Icon above wordmark + gradient bar, light bg |
| `light-app-tile.png` | 768x512 | Icon + dark rounded-square app tile, light bg |
| `dark-icon.png` | 768x512 | Icon on dark bg (navy) |
| `dark-horizontal-lockup.png` | 768x512 | Icon + wordmark, dark bg |
| `dark-stacked-lockup.png` | 768x512 | Icon above wordmark + gradient bar, dark bg |
| `dark-app-tile.png` | 768x512 | Icon + rounded-square app tile, dark bg |

### Transparent versions (PNG with alpha)

`gpt-logo/transparent/` directory. Background flood-filled to alpha=0, stars preserved, edges clean. Use wherever the logo needs to sit on any background color.

| File | Size | Use |
|---|---|---|
| `icon.png` | 768x512 | Transparent icon alone |
| `horizontal-lockup.png` | 768x512 | Transparent icon + wordmark horizontal |
| `stacked-lockup.png` | 768x512 | Transparent icon above wordmark |

### Favicon set

`favicon/` directory. Auto-cropped to content bounding box, centered in square canvas with 10% margin.

| File | Use |
|---|---|
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Browser tab favicons (web) |
| `favicon-64.png`, `favicon-128.png`, `favicon-256.png`, `favicon-512.png` | PWA and other web manifest sizes |
| `apple-touch-icon.png` (180x180) | iOS home screen icon |
| `favicon-192.png` | Android home screen icon |
| `favicon.ico` (16/32/48 embedded) | Legacy browsers that expect `/favicon.ico` |
| `icon-1024.png` | Master square icon (archival + large display) |

### Banner

| File | Size | Use |
|---|---|---|
| `banner-1500x500.png` | 1500x500 | X header, website hero backdrop, anywhere needing a wide brand header |

---

## Per-Platform Upload Guide

### X (Twitter)

| Field | File to upload |
|---|---|
| Profile picture | `favicon/icon-1024.png` (X resizes to 400x400; 1024 source ensures crispness) |
| Header image | `banner-1500x500.png` |
| Bio | Use the text you already wrote, optionally add the emoji 🛠️ or a snow emoji for personality |

### Gumroad

| Context | File to upload |
|---|---|
| Profile avatar | `favicon/icon-1024.png` |
| Profile cover image | `banner-1500x500.png` (or crop to Gumroad's preferred ratio, commonly 1280x720) |
| Product cover images (per listing) | Use screenshots of the actual product (audit report, etc.), not the logo |
| Your seller name / display | "SnowForge" or "Alex Diaz" depending on your preference |

### Website (snowforge.dev)

| Context | File to use |
|---|---|
| Favicon in `<head>` | `favicon/favicon.ico` (legacy) + `favicon/favicon-32.png` via `<link rel="icon">` |
| Apple touch icon | `favicon/apple-touch-icon.png` via `<link rel="apple-touch-icon">` |
| PWA / web manifest icons | `favicon/favicon-192.png`, `favicon/favicon-512.png` |
| Header logo | `gpt-logo/transparent/horizontal-lockup.png` (scale to desired size in CSS) |
| Footer logo (smaller) | Same file, scaled down |
| Open Graph share image | `banner-1500x500.png` (or a custom 1200x630 variant if needed) |

Recommended HTML `<head>` snippet:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

### Email signature

Use `gpt-logo/transparent/horizontal-lockup.png` at display width 180-240px. Most email clients render PNGs natively.

### LinkedIn Company Page (if/when you create one)

| Field | File |
|---|---|
| Profile icon | `favicon/icon-1024.png` |
| Cover image (1128x191 recommended) | `banner-1500x500.png` scaled to fit (or commission a wider variant) |

### GitHub Organization (if you make the SnowForge repos public later)

| Field | File |
|---|---|
| Org avatar | `favicon/icon-1024.png` |
| Org README header image (optional) | `banner-1500x500.png` |

---

## Color Palette (for reference)

The logo uses this palette, consistent with snowforge.dev:

| Role | Color | Hex |
|---|---|---|
| Background (light mode) | Cream / slate-50 | `#f8fafc` |
| Background (dark mode) | Slate-900 | `#0f172a` |
| Primary text | Slate-900 | `#0f172a` |
| Icon blue (secondary) | Blue range | `#1d4ed8` to `#2563eb` |
| Icon orange (primary accent) | Orange | `#f97316` to `#ea580c` |
| Icon white highlights (stars) | Cream | `#f8fafc` |
| Tagline warm italic | Orange gradient | `#f97316 → #ea580c` |

Typography:
- Wordmark: Inter 800 (bold)
- Tagline italic accent: Fraunces 700 italic

---

## Notes

- The transparent versions were generated with corner flood-fill; they handle most backgrounds cleanly but can look slightly pixelated at very small sizes. For the smallest favicons (16-32px), the non-transparent versions may render more crisply because they avoid edge anti-aliasing artifacts. Test both on the target surface if in doubt.
- Old experimental assets from earlier design iterations were removed. Everything in this guide is the current source of truth.
- The original source PSD/AI files (if any exist from GPT's generation process) are not here. If you need a vector version for very large-scale printing or billboard-style use, consider a quick Figma or Illustrator trace of `favicon/icon-1024.png`.
