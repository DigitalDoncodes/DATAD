# Network Errors Report

**Source:** Authenticated Playwright audit
**Total requests tracked:** ~3,000+
**Failed requests (4xx/5xx):** 373
**Slow requests (>1s):** 15

---

## Failed Requests

### 429 Too Many Requests — 371 occurrences

All on admin routes and the 404 page. These occur because admin page components fire API requests before the `AdminRoute` redirect fires.

| Route | 429 Count | Likely Endpoint Pattern |
|-------|-----------|------------------------|
| `/admin/logs` | 9 | Admin logs API |
| `/admin/referrals` | 44 | Referral system APIs |
| `/admin/archive` | 44 | Archive APIs |
| `/admin/companies` | 44 | Company management APIs |
| `/admin/cases` | 44 | Case management APIs |
| `/admin/automation` | 44 | Automation APIs |
| `/admin/ai-center` | 44 | AI center APIs |
| `/admin/ai-runtime` | 44 | AI runtime APIs |
| `/admin/subscriptions` | 44 | Subscription management APIs |
| `/nonexistent-route-test-xyz` | 10 | Various (likely from error logging/telemetry) |

**Impact:** None visible to users — redirect to `/` happens before errors surface.

### 403 Forbidden — 2 occurrences

| Route | 403 Count | Endpoint |
|-------|-----------|----------|
| `/career/questions` | 2 | Interview questions API |

**Impact:** The interview questions feature is broken for this user. Depending on error handling, the page may show empty state or error state.

---

## Slow Requests (>1 second)

**15 requests exceeded 1 second.** All are on the `/career` route.

| Endpoint | Duration | Status | Route |
|----------|----------|--------|-------|
| `/api/readiness` | 1,258 ms | 200 | `/career` |
| `/api/subscription/me` | 1,424 ms | 200 | `/career` |
| `/api/companies/news/feed?name=TCS...` | 1,205 ms | 200 | `/career` |
| `/api/readiness` | 1,484 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Zoho` | 1,274 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Zoho` | 1,289 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Deloitte` | 1,729 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Deloitte` | 1,762 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Ashok+Leyland` | 2,133 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Ashok+Leyland` | 2,163 ms | 200 | `/career` |
| `/api/companies/news/feed?name=HDFC+Bank` | 2,572 ms | 200 | `/career` |
| `/api/companies/news/feed?name=HDFC+Bank` | 2,601 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Cognizant+(CTS)` | 3,069 ms | 200 | `/career` |
| `/api/companies/news/feed?name=Cognizant+(CTS)` | 3,097 ms | 200 | `/career` |
| `/api/subscription/me` | 1,006 ms | 200 | `/admin/announcements` |

### Slow Endpoints Grouped

| Endpoint | Slow Count | Max Duration |
|----------|-----------|-------------|
| `/api/companies/news/feed?...` (8 companies) | 14 | 3,097 ms |
| `/api/readiness` | 2 | 1,484 ms |
| `/api/subscription/me` | 2 | 1,424 ms |

### Root Cause Analysis

The `/career` page (CareerHubPage) loads news feeds for **8 tracked companies** in parallel via `Promise.all`. Each company's news feed API call takes 1.2–3.1 seconds. This means the career page has a total data-loading time bounded by the **slowest** company's feed (Cognizant at ~3.1s), plus readiness and subscription calls.

The total page load time for `/career` was **6,785 ms** — the slowest of all routes — because it waits for all these API calls before reaching network idle.

### Impact

- Page load on `/career` takes ~6.8 seconds
- The news feed section blocks the page from completing
- Users see loading spinners/skeletons during this time

### Fix Recommendations

| # | Recommendation | Expected Improvement | Effort |
|---|---------------|---------------------|--------|
| 1 | **Server-side caching** for news feed responses (TTL: 5-15 min) | 2-3s → 50ms | 1-2 hrs |
| 2 | **Lazy load** news feeds after initial render (defer to after page interactive) | Perceived load: 6.8s → 2s | 30 min |
| 3 | **Batch** news feed requests into a single aggregated endpoint | 8 requests → 1 request | 2 hrs |
| 4 | **Optimize** news feed API backend (cache external news source calls) | 3s → 200ms | 2-4 hrs |

---

## Network Failure Summary

| Status Code | Count | Source |
|-------------|-------|--------|
| 200 (success) | ~2,700+ | All routes |
| 429 (rate limited) | 371 | Admin pages + 404 page |
| 403 (forbidden) | 2 | Career questions |
| 4xx/5xx total | **373** | All on admin routes |

**Zero network failures** — no requests dropped due to connection errors, DNS failures, or timeouts.

---

## Pre-Beta Network Fix Recommendations

| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| **P1** | News feed APIs are 1.2–3.1s slow | Add server-side caching + batch endpoint | 2 hrs |
| **P2** | Career page blocks on 8 parallel slow calls | Lazy-load news feeds after render | 30 min |
| **P3** | 403 on interview questions API | Fix backend authorization or frontend error handling | 1 hr |
| **P4** | Admin pages fire 44 requests before redirect | Wrap API calls in admin role check | 15 min |
