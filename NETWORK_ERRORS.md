# Network Errors

2 of 57 audited routes produced a failed request or a 4xx/5xx response. Every other route completed with zero failed requests and zero error-status responses.

## `/briefing` (user account — Dashboard / Daily Briefing)

**Failed requests:**

| Method | URL | Failure |
|---|---|---|
| GET | http://localhost:5173/briefing | net::ERR_ABORTED |

## `/career/questions` (user account — Interview Questions)

**4xx/5xx responses:**

| Status | URL |
|---|---|
| 403 | http://localhost:5173/api/companies/questions/bank |
| 403 | http://localhost:5173/api/companies/questions/bank |

---

_Routes not listed above produced zero failed requests and zero error-status responses. See RUNTIME_AUDIT.md for analysis of which of these are real defects vs. expected behavior (e.g. tier-gating 403s)._
