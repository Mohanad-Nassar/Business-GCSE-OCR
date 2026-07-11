# Security audit — Netlify functions & edge (WP-A7) + scrape throttle (WP-A8)

**Date:** 2026-07-11
**Scope (this audit only):** `netlify/functions/*.js`, `netlify/functions/_lib/*.js`,
`netlify/edge-functions/content-gate.ts`, and `netlify.toml`.
Everything else (front-end `.js`/`.html`, `supabase/*`) is out of lane and untouched.

**Auditor note on the authorization posture:** every interactive Netlify function
that uses the Supabase **service-role** key already verifies the caller *before*
doing privileged work, using the shared `_lib/adminClient.js` helpers
(`requireTeacher` → JWT + role, `requireOwnedClass` / `requireOwnedStudent` /
per-row owner check → ownership). `create-class.js` is the reference pattern and
the others match it. The two real gaps were (a) the **scheduled** function's
public HTTP endpoint being unauthenticated, and (b) missing platform hardening
(security headers, scrape throttle). Those are fixed below.

---

## Findings by severity

| # | Severity | File | Status |
|---|----------|------|--------|
| 1 | HIGH | `netlify/functions/weekly-retry-tasks.js` | **FIXED** — added HTTP `cronGuard` (403 unless genuine cron or `x-cron-secret`) |
| 2 | MEDIUM | `netlify.toml` | **FIXED** — added `[[headers]]` security headers (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy) |
| 3 | MEDIUM | `netlify/edge-functions/content-gate.ts` | **FIXED** — added per-token in-isolate scrape throttle (429 over ~40 req / 5 min) |
| 4 | LOW | `netlify/functions/env-check.js` | **VERIFIED (no code change)** — reports presence/length/var-names only, never secret values; recommend deletion post-setup |
| 5 | LOW / INFO | `netlify/functions/teacher-signup.js` | **BY DESIGN** — public signup gated by invite code; noted residual risks (reusable code, no rate-limit, verbose temp logging) |
| — | PASS | `create-class.js`, `delete-student.js`, `reset-student-password.js`, `generate-students.js`, `suggest-marks.js` | **VERIFIED** — caller JWT + role + target ownership all checked before any service-role write |

---

## 1. HIGH — Scheduled function reachable over unauthenticated HTTP (FIXED)

**File:** `netlify/functions/weekly-retry-tasks.js`
**Before:** `exports.handler = async () => { … }` — the function runs entirely with
the service-role client (bypasses RLS) and creates/edits `tasks`,
`task_questions`, `task_assignments` rows. It is registered as an `@weekly`
scheduled function (`netlify.toml`), but Netlify still exposes the function over
public HTTP at `/.netlify/functions/weekly-retry-tasks`. There was **no caller
check**, so any anonymous POST could trigger a full site-wide retry-task
generation run at will (resource abuse / unwanted writes).

**Fix (lines 32–65):** added `isScheduledInvocation(event)` + `cronGuard(event)`
and call the guard as the first statement of the handler:

- A **genuine cron run** is detected by Netlify's scheduled payload — a JSON body
  containing `next_run` (documented contract), plus a secondary
  `x-nf-event: schedule` header signal — and is always allowed. The happy path is
  preserved.
- Any **other (externally-reachable) HTTP call** must send
  `x-cron-secret: <process.env.CRON_SECRET>`; otherwise it is rejected **403
  Forbidden** before `getAdminClient()` is even constructed.
- Fail-closed detail: the check is `expected && provided === expected`, so when
  `CRON_SECRET` is unset an empty `x-cron-secret: ''` header cannot satisfy
  `'' === ''` and slip through. A genuine cron run still works with `CRON_SECRET`
  unset because it is allowed by `isScheduledInvocation`, not by the secret.

**Verified behaviourally** (6 scenarios): external/no-secret, external/wrong-secret,
external/empty-secret → `403`; operator/correct-secret, cron-via-`next_run`,
cron-via-header → passed the guard (fell through to the expected env 500). Also
verified fail-closed with `CRON_SECRET` deleted from env.

**Residual risk (documented, accepted):** `next_run` in the body is technically
forgeable, so this is defense-in-depth rather than an unforgeable gate — Netlify
cannot inject a custom secret header into its own internal cron invocation, so
detect-and-allow is the only option that keeps cron working. Netlify's
platform-level restriction on external invocation of scheduled functions is the
complementary control. Impact of a forged trigger is bounded (idempotent-ish,
capped `MAX_QUESTIONS_PER_TASK`, re-derives all ids from source data).

**OPERATOR ACTION REQUIRED:** set **`CRON_SECRET`** to a long random value in the
Netlify site environment variables (Site settings → Environment variables). No
secret value is stored in code. The `@weekly` run does **not** need it.

---

## 2. MEDIUM — Missing HTTP security headers (FIXED)

**File:** `netlify.toml` — added a `[[headers]]` block for `/*`.

Added headers (validated by parsing the file with `@iarna/toml`, Netlify's own
parser — parses clean, `edge_functions`/`redirects`/cron blocks all intact):

- **Content-Security-Policy** — deliberately **not** tightened below what the live
  pages use, or the site breaks:
  `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`;
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`;
  `font-src https://fonts.gstatic.com 'self'`; `img-src 'self' data:`;
  `connect-src 'self' https://eaohjlyiotyqhvsizcpw.supabase.co`;
  `frame-ancestors 'none'`.
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Permissions-Policy:** `camera=(), microphone=(), geolocation=()`

**Deferred (NOT this work package):** the pages currently depend on inline
scripts/styles and the jsDelivr CDN (Supabase JS client) + Google Fonts, which is
why `'unsafe-inline'` and those hosts must stay in the CSP. Vendoring the CDN and
removing inline handlers so `'unsafe-inline'`/`jsdelivr` can be dropped is a
separate future task.

---

## 3. MEDIUM — No scrape rate-limiting on gated content (FIXED, WP-A8)

**File:** `netlify/edge-functions/content-gate.ts` (throttle infra lines 38–88;
call site lines 190–196).

Added a per-token in-isolate fixed-window counter (`RATE` Map, keyed by a
SHA-256 hash of the session token so raw tokens are never used as keys):

- More than **`SCRAPE_LIMIT = 40`** gated requests from one token within
  **`SCRAPE_WINDOW_MS = 5 min`** → **429**. Body is HTML for navigations
  (`Accept: text/html`) and JSON for assets, both with `Retry-After: 60`; each hit
  is logged (`content-gate: scrape throttle 429 <path>`).
- **Fail-open by design:** the Map is in-isolate memory and resets on isolate
  recycle; each isolate counts independently — this is a deterrent, not a hard
  quota. Map size is bounded (`SCRAPE_MAX_KEYS = 5000`, prunes expired then hard-
  resets) so it can't grow unbounded.
- **Additive only:** placed *after* the `CONTENT_GATE_DISABLED` kill switch and the
  non-`/subjects/` and no-token early returns, and *before* `checkAccess`. The
  existing auth/gating logic is unchanged; when the kill switch is on the throttle
  never runs.

**Tuning note:** *every* gated request under `/subjects/*` counts — page
navigations **and** their sub-assets (images, `question-bank.js`, etc.). If a
legitimate page fans out into many gated requests and trips the limit, raise
`SCRAPE_LIMIT` rather than lowering it.

**Manual review** (edge is Deno TS, so no `node --check`): function-declaration
hoisting of `tokenCacheKey` is valid; TS control-flow narrows the `bucket` local
correctly; `RATE` is a distinct Map from the verdict `CACHE` (no key collision);
syntax is consistent with the rest of the file.

---

## 4. LOW — `env-check.js` unauthenticated diagnostic (VERIFIED — no value leak)

**File:** `netlify/functions/env-check.js`

**Confirmed:** the endpoint reports **presence booleans, string lengths, and env-var
names** for `SUPABASE_*` / `GEMINI_*` — it **never returns any secret VALUE or key
material**. It therefore satisfies the "presence/absence only" requirement and no
code change is required for the stated criterion.

**Residual (LOW):** it is unauthenticated and leaks minor metadata (that the keys
exist, their lengths, and exact env-var names). Key lengths are not sensitive (a
Supabase service-role JWT and a Gemini key are fixed-format), but the endpoint is
marked `TEMPORARY` in its own header comment. **Recommendation:** delete this
function once environment setup is confirmed (left in place here to avoid
disrupting the operator's active setup diagnostics; behaviour intentionally
unchanged).

---

## 5. LOW / INFO — `teacher-signup.js` (acceptable by design)

**File:** `netlify/functions/teacher-signup.js`

This is a **public** endpoint by necessity (it creates the first teacher account,
so it cannot require a teacher JWT). Its authorization gate is the **invite code**
checked against `teacher_invite_codes` before the service-role
`createUser` + `profiles` insert. That is the intended model — **not** a missing
`requireTeacher` bug. No change made.

**Residual risks noted (owner: app + `supabase/`, out of this lane):**
- Invite code is looked up with `.eq('code', …).maybeSingle()` and is **reusable /
  not consumed / no expiry check** here — anyone holding a valid code can create
  unlimited teacher accounts. Recommend single-use or expiring codes.
- **No rate-limiting** on the endpoint → invite codes could be brute-forced if
  low-entropy. Recommend signup throttling + high-entropy codes.
- Verbose `console.error(JSON.stringify(err, …))` blocks are marked `TEMPORARY`
  for diagnosing "Invalid path"; they log to the function log (not the client).
  Recommend removing once the root cause is confirmed.

---

## PASS — service-role functions with correct authorization (verified, no change)

All verify the caller's JWT + role + target ownership **before** any privileged
write, matching the `create-class.js` reference:

- **`create-class.js`** — `requireTeacher` (l.67) + subject validated against
  `subjects` before insert with `teacher_id = teacher.id`.
- **`delete-student.js`** — `requireTeacher` (l.16) + `requireOwnedStudent` (l.22)
  before `auth.admin.deleteUser`.
- **`reset-student-password.js`** — `requireTeacher` (l.17) + `requireOwnedStudent`
  (l.23) before `auth.admin.updateUserById`.
- **`generate-students.js`** — `requireTeacher` (l.120) + `requireOwnedClass`
  (l.128) before bulk user creation; batch capped at 60.
- **`suggest-marks.js`** — `requireTeacher` (l.137) + task-ownership check
  `task.teacher_id !== teacher.id → 403` (l.146–150) before any AI marking write.
- **`_lib/adminClient.js`** — `requireTeacher` verifies the Bearer token via
  `admin.auth.getUser` then checks `profiles.role === 'teacher'`; ownership helpers
  are RLS-independent and compare `teacher_id` directly.

---

## Operator actions (environment variables)

| Env var | Where | Required? | Purpose |
|---------|-------|-----------|---------|
| **`CRON_SECRET`** | Netlify site env vars | **NEW — set this** | Authorizes manual/operator HTTP triggers of `weekly-retry-tasks`; genuine `@weekly` cron does not need it. Never commit it. |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify site env vars | existing | Service-role key; must stay server-only, never in committed files / front-end. |
| `GEMINI_API_KEY` | Netlify site env vars | existing | Used by `suggest-marks.js`. |
| `CONTENT_GATE_DISABLED` | Netlify site env vars | existing (optional) | Kill switch for the content gate; unchanged by this work. |

---

## Verification performed

- `node --check netlify/functions/weekly-retry-tasks.js` → OK.
- Behavioural test of `cronGuard` across 6 scenarios + fail-closed with
  `CRON_SECRET` unset → all correct (see finding 1).
- `netlify.toml` parsed with `@iarna/toml` → parses clean; `[[headers]]` values,
  `edge_functions`, 41 `redirects`, and the `weekly-retry-tasks` cron schedule all
  intact.
- `content-gate.ts` reviewed manually (Deno TS) — see finding 3.

## Blocked / out of lane

- None blocked. Items assigned to `supabase/` or front-end owners (single-use
  invite codes, signup rate-limiting, CDN vendoring to tighten CSP, deleting the
  temporary `env-check`/verbose signup logging) are noted above as recommendations
  for the owning work packages, not actioned here.
