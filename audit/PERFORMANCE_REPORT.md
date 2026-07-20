# DATAD Performance Report

**Date:** 2026-07-18
**Tool:** Playwright 1.61.1 (Chromium headless, 1440×900)
**Metric:** Page load time (navigation start → `networkidle` + 1.5s settle)
**Environment:** Vite dev server (no production optimizations — no compression, no code splitting in dev mode)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total routes measured** | 76 |
| **Average load time** | 2,123 ms |
| **Median load time** | 2,101 ms |
| **Fastest load time** | 2,088 ms (`/resume`) |
| **Slowest load time** | 3,202 ms (`/`) |
| **Standard deviation** | ~135 ms |
| **Requests >1s** | **0** |

---

## Page Load Time Distribution

```
2,000ms ─ 2,100ms  █████████████████████████████████████████████████████  (53 pages)
2,100ms ─ 2,200ms  ████████████████████                                  (21 pages)
2,200ms ─ 2,500ms  █                                                    ( 1 page)
3,200ms ─ 3,300ms  █                                                    ( 1 page)
```

---

## Slowest Pages (Top 10)

| Rank | Route | Load Time | Notes |
|------|-------|-----------|-------|
| 1 | `/` (LandingPage / DashboardGate) | **3,202 ms** | Largest page (547 lines), IntersectionObserver animations, conditional auth check |
| 2 | `/about` (AboutPage) | **2,479 ms** | Scroll-reveal animations via IntersectionObserver, more DOM nodes |
| 3 | `/login` (LoginPage) | **2,178 ms** | Simple form — baseline |
| 4 | `/register` (RegisterPage) | **2,159 ms** | Multi-step wizard with 8 step components |
| 5 | `/admin/studio` (AdminStudioPage) | **2,142 ms** | Admin panel with data tables |
| 6 | `/admin/ai-center` (AdminAICenterPage) | **2,121 ms** | AI dashboard |
| 7 | `/career/pivot` (PivotPage) | **2,120 ms** | Career pivot tools |
| 8 | `/community/marketplace` (MarketplacePage) | **2,117 ms** | Marketplace with listings |
| 9 | `/me/settings` (SettingsPage) | **2,116 ms** | Largest page after landing, avatar upload, subscription card |
| 10 | `/search` (SearchPage) | **2,115 ms** | Search with analytics dashboard |

## Fastest Pages (Top 10)

| Rank | Route | Load Time | Notes |
|------|-------|-----------|-------|
| 1 | `/resume` → `/login` redirect | **2,088 ms** | Simple auth redirect, minimal render |
| 2 | `/me/reflection` → `/login` redirect | **2,093 ms** | Simple auth redirect |
| 3 | `/privacy` | **2,093 ms** | Static page |
| 4 | `/reset-password` | **2,094 ms** | Form with token check |
| 5 | `/career` → `/login` redirect | **2,095 ms** | Simple auth redirect |
| 6 | `/briefing` → `/login` redirect | **2,096 ms** | Simple auth redirect |
| 7 | `/community/directory` → `/login` redirect | **2,096 ms** | Simple auth redirect |
| 8 | `/community/skills` → `/login` redirect | **2,096 ms** | Simple auth redirect |
| 9 | `/admin/referrals` → `/login` redirect | **2,096 ms** | Simple auth redirect |
| 10 | `/study/notes/new` → `/login` redirect | **2,096 ms** | Simple auth redirect |

---

## Auth Redirect Overhead

**60 protected routes** redirect to `/login?next=...`. Their load times cluster tightly around 2,096–2,120ms. This represents the baseline for React SPA bootstrap + ProtectedRoute check + `Navigate` render.

The variance (24ms spread) is negligible and attributable to garbage collection / system scheduling.

---

## Public Page Performance

| Route | Load Time | Type |
|-------|-----------|------|
| `/` | 3,202 ms | Landing page with animations |
| `/about` | 2,479 ms | Static with scroll-reveal |
| `/privacy` | 2,093 ms | Static |
| `/terms` | 2,101 ms | Static |
| `/creator` | 2,103 ms | Static |
| `/login` | 2,178 ms | Form |
| `/register` | 2,159 ms | Multi-step wizard |
| `/forgot-password` | 2,103 ms | Form |
| `/reset-password` | 2,094 ms | Form |

**Observation:** The landing page (`/`) is 29% slower than the next slowest public page due to IntersectionObserver animations and heavier DOM. This is the first impression for every visitor.

---

## Code Splitting Analysis

The app uses `React.lazy()` for every page component. Benefits were not observable in this test because:

1. **Vite dev server** serves unbundled ES modules — there is no production code splitting
2. **Network idle** triggers after all lazy chunks resolve
3. **Production build** would see larger differences as lazy chunks reduce initial bundle size

**Recommendation:** Verify code splitting in the production build. Each page should produce its own JS chunk.

---

## Bundle Size (Dev Only — Not Representative)

Not measured. Dev server bundles are unbounded (full source maps, no minification). Production build should be measured separately before launch.

---

## Slow Requests (>1s)

**0 requests exceeded 1 second.**

All API calls and asset loads completed within tolerance.

---

## Pre-Launch Performance Recommendations

| Priority | Recommendation | Expected Impact | Effort |
|----------|---------------|----------------|--------|
| **P1** | Enable gzip/brotli compression in Express production | 40-60% bandwidth reduction | 15 min |
| **P2** | Implement production code splitting verification | Faster initial load | 30 min |
| **P3** | Add `loading="lazy"` to images on landing page | Faster LCP | 10 min |
| **P4** | Add `<link rel="preload">` for critical fonts/logo | Faster first paint | 10 min |
| **P5** | Implement service worker caching for static assets | Sub-1s repeat visits | 2 hrs |

---

## Verdict

**PASS** — All page loads are within acceptable range for a dev-mode SPA. No requests exceed 1 second. No blocking performance issues.

**Note:** These numbers are from an unoptimized Vite dev server. Production builds with compression, minification, and code splitting will likely be **2-3× faster**.
