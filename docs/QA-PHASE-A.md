# Phase A QA gate (WP-A9)

Run 2026-07-11 against the working tree at commit `7485072` (WP-A8), using
`netlify dev` locally + the live Supabase project. Phase B stays PARKED.

## ⛔ Blocker for sign-off — run the WP-A7 SQL

The live-database security smoke (`tools/security-smoke/a9_smoke.mjs`) proved
that **the self-escalation → question-bank-leak exploit is currently live**: a
throwaway student account successfully ran `update profiles set is_owner = true`
and its `edge_gate_check.allow_bank` flipped to `true`. The fix exists in the
repo (`supabase/schema.sql` privilege-change trigger) but has **not been applied
to the database yet** — the SQL the operator ran earlier predates WP-A7.

**Before Phase A is signed off (and ideally before the next deploy), re-run in
the Supabase SQL editor (all re-run-safe, any order):**

1. `supabase/schema.sql` — `_profiles_block_privilege_change` trigger (the HIGH fix)
2. `supabase/entitlements.sql` — `daily_answer_cap` seed + anon/public `revoke`s
3. `supabase/daily-revise-functions.sql` — per-student daily answer cap
4. `supabase/tasks-schema.sql` — `task_effective_due` revoke
5. `supabase/join-codes.sql` — anon/public `revoke`s

Then re-run `node tools/security-smoke/a9_smoke.mjs` — it self-diagnoses this
exact condition and should go green (21/21).

Also set the Netlify env var **`CRON_SECRET`** (WP-A7) before/at deploy.

## Automated results

| Suite | How | Result |
|---|---|---|
| Root JS syntax | `node --check` on every non-generated root `.js` | ✅ all pass |
| Inline scripts | `new Function()` parse of every `<script>` in all 110 tracked HTML files | ✅ 117/117 blocks parse |
| Logic unit tests | `python tools/logic_test.py` | 88/90 — 2 **pre-existing** failures unrelated to Phase A (see below) |
| Content gate (HTTP) | `curl` via `netlify dev` | ✅ logged-out topic page → 302 login (with `?redirect`); topic asset → 401; `question-bank.js` → 401 |
| Routing / pages | `curl` all public + app pages | ✅ 24/24 → 200 (landing, hub, login, signup, join, auth-callback, dashboards, daily-revise, calendar, task, badges, teacher pages, landing.css, content-protect.js) |
| Security headers | `curl -D -` on `/` | ✅ CSP + X-Frame-Options DENY + X-Content-Type-Options nosniff present (served by netlify.toml) |
| Live security smoke | `node tools/security-smoke/a9_smoke.mjs` (throwaway student account) | 13/21 — the 8 fails are ALL the stale-SQL blocker above; the code-side checks (profile provisioning, empty entitlements, gate=false, `has_subject_access`/`answer_key` unreachable, integrity logging, flags) pass |

### Pre-existing logic-test failures (NOT Phase A regressions)
- **`home HUD badges 1/20`** — the test hard-codes a 20-badge total; the badge set is now 32. Stale expectation, owned by the gamification work, not this session (my only `gamification.js` edits were nav-href changes).
- **`flow defaults: open nav, focus on, 10s/10s`** — class-flow settings default; `supabase/class-flow-settings.sql` was untouched this session.
Both should be refreshed by their owners; neither affects auth, gating, calendars, landing, or content protection.

## Manual click-through matrix (do after deploy — needs a real browser + login)

The automated suite can't drive a logged-in browser session. After pushing and
running the SQL, walk these once. Roles: **G** = generated class-login student,
**S** = self-signup (email/Google) student, **T** = teacher.

| # | Role | Steps | Expected |
|---|------|-------|----------|
| 1 | — | Open `/` logged out (incognito) | Landing page; scroll reveals fire; nav "scrolled" state; reduced-motion off = no animation |
| 2 | — | DevTools → emulate `prefers-reduced-motion: reduce`, reload `/` | No motion, content all visible |
| 3 | S | `/signup.html` with a new email → confirm link → land | Lands on `/join.html` (no class yet) |
| 4 | S | Google button on `/login.html` | Round-trips, lands hub or join |
| 5 | T | Create a class, generate a join code, copy it | Code shows on the class card |
| 6 | S | Redeem that code on `/join.html` | Joins; success CTA → that subject's dashboard; hub now shows the subject |
| 7 | S | Redeem a 2nd subject's code | Both subjects on hub; each card has 4 action pills |
| 8 | S | Redeem a same-subject 2nd code | Friendly "already in <class> for that subject" |
| 9 | S | Type 11 wrong codes | Throttled after 10 (`too_many_attempts`) |
| 10 | G/S | Bare `/daily-revise.html` (no `?subject=`) | Serves the student's last/enrolled subject, not always Business |
| 11 | G/S | Review Calendar | Reviews (outline chips) + teacher task deadlines (solid chips); subject × Reviews/Tasks filters; `?subject=all` = combined view |
| 12 | S | Try to select/copy/right-click lesson text; try to print a topic page | Blocked; watermark shows YOUR username; print shows the notice |
| 13 | S | Type + paste INTO an answer box | Works (answer boxes exempt) |
| 14 | T | Print a worksheet from `teacher-worksheets.html` | Prints normally (unaffected) |
| 15 | T | Teacher dashboard → integrity panel | Shows copy/devtools/paste flags per student with friendly labels |
| 16 | — (incognito) | Any `/subjects/<other-subject>/…` URL while logged into one subject | Redirected to `/join.html?subject=…` |
| 17 | S | Screen reader (Narrator/NVDA) on a topic page | Reads content normally; watermark silent |

## Artefacts
- `tools/security-smoke/a9_smoke.mjs` — re-runnable live security proof (creates + deletes its own throwaway account).
- `docs/SECURITY-AUDIT-{sql,netlify,xss}.md` — WP-A7 findings.
