# DATAD — Authenticated Runtime Audit

**This supersedes the earlier browser audit**, which was invalid — every
protected route was captured while logged out and silently redirected to
`/login`, so nothing about the actual authenticated app was ever verified.
This pass fixes that.

**Method, stated precisely because it matters:** I do not type account
passwords into login forms — that's a hard boundary, not a preference. You
logged into both accounts yourself, in the Browser pane. I then read the
resulting session token directly out of `localStorage` from your real,
already-authenticated session (confirmed by decoding it and checking the
email/role/tier matched each account) and handed that token to a headless
Playwright browser via `context.addInitScript()`, so it's present in
`localStorage` before any app code runs on every page — functionally
identical to what a real login leaves behind, because it *is* what a real
login left behind. No password was entered anywhere by me at any point, and
no session was minted or forged — both tokens are the genuine output of your
own logins.

**Tooling:** Playwright, installed isolated in a scratchpad project — not
added to either `client/package.json` or `server/package.json`. No
application file was modified to produce this audit.

**Accounts used:**
| Role | Email | Tier | Used for |
|---|---|---|---|
| member | digitaldondhatchinamoorthi@gmail.com | free | 44 general protected routes |
| admin | digitaldoncodes@gmail.com | max | 13 `/admin/*` routes |

**Run timestamp:** 2026-07-17T20:45:42.972Z

---

## Headline result

**57 of 57 routes loaded successfully. Zero redirects to `/login`.**
Authentication held on every single page, for the full duration of the audit,
under both accounts. The previous audit's premise — that the app was broken
or routes were misconfigured — does not hold once the session is real.

| Metric | Count |
|---|---|
| Routes audited | 57 (44 user + 13 admin) |
| Redirected to `/login` unexpectedly | **0** |
| Navigation errors (timeout / failed load) | **0** |
| Screenshot capture failures | **0** |
| Routes with console errors/warnings | 4 |
| Routes with uncaught JS exceptions (`pageerror`) | 0 |
| Routes with failed network requests | 1 |
| Routes with 4xx/5xx responses | 1 |

Zero `pageerror` events is notable on its own: nothing threw an uncaught
exception at the top level. Every problem found below was caught by the
app's `ErrorBoundary` and rendered as a fallback UI, not a blank crash — the
error-boundary strategy is doing its job. That doesn't make the underlying
bugs acceptable, but it's the difference between "this page is unusable" and
"this page shows a broken section, in place, with a working retry button."

---

## Real defects found (verified with screenshots, not just log lines)

### 1 & 2. `/me/planner` and `/study/work` — same crash, confirmed single root cause

**Error:** `Error: Objects are not valid as a React child (found: object with
keys {label, onClick}). If you meant to render a collection of children, use
an array instead.`

Caught by `ErrorBoundary` on both pages — full page content blanked, only the
boundary's fallback renders (`screenshots/me_planner__user.png`,
`screenshots/study_work__user.png`). The two console stack traces both name
`EmptyState` in their `componentStack`, which pinpointed the exact,
confirmed cause rather than leaving it as a guess:

`components/common/EmptyState.jsx:36` renders its `action` prop **directly
as a JSX child** — `{action}` — expecting a rendered element. But every
caller below passes a plain **object descriptor** instead of an element:

| Call site | What it passes |
|---|---|
| `pages/PlannerPage.jsx:146` | `action={{ label: 'Create task', onClick: openCreate }}` |
| `pages/study/AssignmentsPage.jsx:126` | `action={{ label: 'New assignment', onClick: () => setShowModal(true) }}` |
| `pages/study/ProjectsPage.jsx:159` | `action={{ label: 'New Project', onClick: () => setShowAdd(true), icon: Plus }}` |

`WorkPage.jsx` itself has no `EmptyState` usage — it composites
`AssignmentsPage` and `ProjectsPage` via `useViewSwitch`, and the default
view (Assignments) is what crashed. **This is one bug with (at least) three
call sites**, not three separate bugs — fixing `EmptyState.jsx` to render
`action.label`/`action.onClick` as an actual `<Button>` (matching how every
other `EmptyState` caller in the app presumably expects it to work) fixes
`/me/planner`, `/study/work` (Assignments view), and pre-empts the same
crash on the Projects view before a user ever hits it. Not fixed here —
this is an audit; flagging exact locations for whoever picks it up next.

### 3. `/career/resume` — different crash, react-hook-form API misuse
**Error:** `TypeError: control._getFieldValue is not a function` at
`ResumePage.jsx:499`.

Caught by `ErrorBoundary` (`screenshots/career_resume__user.png`) — the
entire Resume Builder is unusable for this account. `_getFieldValue` is not
part of react-hook-form's public `Control` API in the installed version
(it's a private/internal method that may have existed in an older version or
been renamed) — this reads like code written against a different
react-hook-form version than what's actually installed, or a typo for a
real method (`getValues` is the public equivalent). This is a **complete
block** on resume building for any user who hits this code path, not a
degraded-but-usable state.

### 4. `/career/questions` — 403s, but this one is not a bug
**Observed:** two `403 Forbidden` responses from
`/api/companies/questions/bank`, logged as console errors.

Screenshot (`screenshots/career_questions__user.png`) shows this is
**working as designed** — the free-tier test account correctly sees a
"Unlock with DATAD Pro" paywall card instead of the gated content. The 403
is the server correctly enforcing the tier gate; the UI correctly renders
the upsell instead of crashing. Flagging this here so it's not mistaken for
a defect by anyone skimming `NETWORK_ERRORS.md` in isolation — the raw log
line looks alarming, the actual behavior is correct. The one thing worth a
second look: two identical 403s for what should be one gated resource fetch
suggests a possible double-fetch (e.g. a retry, or the component mounting
twice) — low priority, not a correctness bug.

### 5. `/briefing` — one aborted request, appears benign
**Observed:** `GET /briefing -> net::ERR_ABORTED` on the initial navigation
request.

The page still rendered completely and correctly (a long, fully-populated
briefing feed — see `SCREENSHOT_INDEX.md`), stayed on `/briefing` (no
redirect), and produced zero console errors. This pattern (an aborted
initial request that doesn't affect the final render) is consistent with
Vite's dev-server client-side routing taking over from an initial document
request — not evidence of a real defect. Recorded for completeness, not
flagged as a bug.

---

## Not audited

| Route pattern | Reason |
|---|---|
| `/study/notes/:id`, `/study/notes/:id/edit` | The `Note` collection has zero documents in this database (confirmed via `countDocuments()`, not assumed) — no real id exists to visit. |
| `/admin/studio/:id` | Depends on a specific content-item id; not enumerated for this pass. |

Two dynamic routes **were** successfully audited using real IDs found via
read-only queries: `/career/companies/tcs` and
`/community/archive/cartoons/shin-chan` — both loaded cleanly.

---

## Full per-route results

See `SCREENSHOT_INDEX.md` for every route with its screenshot and status,
`CONSOLE_ERRORS.md` for the four routes with console output, and
`NETWORK_ERRORS.md` for the two routes with request-level issues. All 57
routes not mentioned in those files loaded with zero console output, zero
failed requests, and zero bad responses.

---

*No application files were modified in the production of this audit.*
