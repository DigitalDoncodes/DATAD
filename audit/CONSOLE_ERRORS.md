# Console Errors Report

**Source:** Authenticated Playwright audit
**Total console.error calls:** 383 across 76 routes
**Routes with errors:** 16

---

## Error Classification

| Error Type | Count | Severity | Root Cause |
|------------|-------|----------|------------|
| 429 Too Many Requests | 371 | ⚠ Medium | Rate limit hit during admin page render |
| React invalid child object | 3 | 🔴 High | `{label, onClick}` object rendered as React child |
| TypeError: _getFieldValue | 2 | 🔴 High | react-hook-form control API mismatch |
| 403 Forbidden | 2 | ⚠ Medium | Interview questions API auth |

---

## 🔴 Critical: React Invalid Child Object

**Error message:**
```
Error: Objects are not valid as a React child (found: object with keys {label, onClick}).
If you meant to render a collection of children, use an array instead.
```

**Affected routes (3 occurrences):**
| Route | Page Component |
|-------|---------------|
| `/planner` (legacy → `/me/planner`) | PlannerPage |
| `/me/planner` | PlannerPage |
| `/study/work` | WorkPage |

**Root cause analysis:**
An object with shape `{label, onClick}` is being directly rendered as a child in JSX, rather than being used as a prop for a button/menu component. This pattern typically appears in dropdown menus, tab bars, or action lists where an array of option objects is accidentally placed inside `{}` in JSX instead of being mapped to components.

**Impact:** The ErrorBoundary catches the crash. The page shows an error state instead of the planner/content.

**Fix recommendation:** Locate where `{label, onClick}` objects are iterated in `PlannerPage.jsx` and `WorkPage.jsx`. Replace direct object rendering with a proper component loop (e.g., `options.map(opt => <button onClick={opt.onClick}>{opt.label}</button>)`).

---

## 🔴 Critical: TypeError — control._getFieldValue

**Error message:**
```
TypeError: control._getFieldValue is not a function
    at ResumePage (ResumePage.jsx:499)
```

**Affected routes (2 occurrences):**
| Route | Page Component |
|-------|---------------|
| `/resume` (legacy → `/career/resume`) | ResumePage |
| `/career/resume` | ResumePage |

**Root cause analysis:**
The `control` object from `react-hook-form`'s `useForm`/`useFieldArray` does not have a `_getFieldValue` method. This is either:
1. A version mismatch — `_getFieldValue` existed in an older RHF version but was removed/renamed in the installed version
2. A typo — the correct method might be `getValues()` or the field value should be accessed differently

**Impact:** The ErrorBoundary catches the crash. The resume page renders an error state instead of the resume builder. This blocks the core resume feature.

**Fix recommendation:** At `ResumePage.jsx:499`, replace `control._getFieldValue(...)` with the correct RHF API. Most likely `getValues()` from `useForm` return value, or `fields[index]` from `useFieldArray`.

---

## ⚠ Medium: 429 Too Many Requests

**Error message:**
```
Failed to load resource: the server responded with a status of 429 (Too Many Requests)
```

**Affected routes (371 occurrences):**

| Route | Occurrences | Detail |
|-------|-------------|--------|
| `/admin/logs` | 9 | 9 API calls hit rate limit before AdminRoute redirect |
| `/admin/referrals` | 44 | 44 API calls |
| `/admin/archive` | 44 | 44 API calls |
| `/admin/companies` | 44 | 44 API calls |
| `/admin/cases` | 44 | 44 API calls |
| `/admin/automation` | 44 | 44 API calls |
| `/admin/ai-center` | 44 | 44 API calls |
| `/admin/ai-runtime` | 44 | 44 API calls |
| `/admin/subscriptions` | 44 | 44 API calls |
| `/nonexistent-route-test-xyz` | 10 | 10 API calls from 404 page |

**Root cause analysis:**
Admin page components fire multiple API requests on mount (often in parallel `Promise.all` blocks). Before the `AdminRoute` `Navigate` component redirects to `/`, the component renders and triggers all its API calls. These hit the server's rate limiter (429), likely because the Playwright crawl makes many rapid requests.

However, 44 errors per admin page suggests each page makes ~44 individual API calls before the redirect. This is excessive even for a brief render window. Some of these may be from child components or data fetchers that fire independently.

**Impact:** Console noise only — the redirect happens quickly and the user never sees these errors. However, the sheer volume (44 calls per page) indicates a performance concern with admin page data loading.

**Fix recommendation:** 
1. Short-term: Accept as non-blocking (redirect happens before user sees errors)
2. Medium-term: Wrap admin page API calls in a check for admin role, or use a lazy query pattern that respects the redirect
3. Investigate why each admin page makes 44 API calls

---

## ⚠ Medium: 403 Forbidden — Interview Questions API

**Error message:**
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

**Affected routes (2 occurrences):**
| Route | Occurrences |
|-------|-------------|
| `/career/questions` | 2 |

**Root cause analysis:**
The interview questions API returns 403 Forbidden. This is likely a backend authorization check — the user may need to subscribe to a premium tier, or the API has specific access controls.

**Impact:** The interview questions page may show empty state or error state instead of questions. Without inspecting the component, it's unclear if the error is gracefully handled.

**Fix recommendation:**
1. Verify backend authorization logic for `/api/questions` or similar endpoint
2. Ensure the frontend gracefully handles 403 (shows upgrade prompt or empty state instead of broken UI)
3. Confirm whether this user's subscription tier includes interview questions

---

## Routes With Zero Console Errors (60 routes)

All community, finance, wellbeing, study hub, me hub, and settings pages had **0 console errors**.

---

## Summary

| Priority | Error | Routes | Action Required Before Beta? |
|----------|-------|--------|------------------------------|
| **P1** | React invalid child `{label, onClick}` | Planner, Work | **Yes** — page crashes |
| **P1** | `control._getFieldValue` TypeError | Resume | **Yes** — page crashes |
| **P2** | 403 Forbidden on questions API | Career Questions | **Yes** — feature broken |
| **P3** | 429 rate limiting on admin pages | Admin routes | No — user never sees it |
