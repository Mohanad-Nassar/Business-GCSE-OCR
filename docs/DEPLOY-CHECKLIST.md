# Deploy checklist — Phase A + Phase C batch

One authoritative list for shipping the unpushed work (currently **11 commits
ahead of origin**: WP-A1 auth → A9 QA gate, plus C5/C6/demo-class). Everything
here is deploy-time; the code is committed. Work top to bottom.

> Free-for-school year: Phase B (billing) stays PARKED. Nothing below charges money.

---

## 0. Before you push — merge coordination ⚠

A **second session is doing a site-wide dark-mode/theme pass** and has
uncommitted edits to many shared files (script.js, style.css,
business-style.css, content-protect.js, footer-legal.js, teacher-nav.js,
theme.js, _dark_shell.html, and most page HTML incl. some this batch created).
Those edits are NOT in these commits.

- **Commit the theming session's work first** (or stash it), then push this
  batch, then reconcile — don't let the two interleave uncommitted.
- After both are in, re-run the parse sweep (§5) — the theme pass touched
  files this batch also changed (dashboard.html, review-calendar.js,
  question-report.js, teacher-classes.html, index.html…), so confirm the
  merged result still parses.
- The economics content session's generated files + `bank-questions-seed/`
  are also dirty — those are file-disjoint from this batch; just `git pull`
  before any pipeline reseed.

---

## 1. Run the SQL (Supabase SQL editor)

All re-run-safe (idempotent). Run in this order — later files depend on
earlier tables. If unsure whether one was already applied, re-running is
harmless.

1. `supabase/schema.sql` — **contains the WP-A7 HIGH fix**
   (`_profiles_block_privilege_change` trigger) + the AUTH-V2 columns/trigger.
2. `supabase/entitlements.sql` — `platform_settings`, `has_subject_access`,
   `edge_gate_check`, `get_my_entitlements`, `daily_answer_cap`, anon revokes.
3. `supabase/daily-revise-functions.sql` — per-student daily answer cap.
4. `supabase/tasks-schema.sql` — `task_effective_due` client revoke.
5. `supabase/join-codes.sql` — **the WP-A9 throttle fix** (return-based, not
   raise) + anon revokes. Re-run even if you ran it before.
6. `supabase/question-reports.sql` — WP-C5 report-a-question (new).

**Prove it worked:** `node tools/security-smoke/a9_smoke.mjs` → expect
**21/21**. It creates + deletes its own throwaway student account and
self-diagnoses if any WP-A7/A9 SQL is missing.

---

## 2. Netlify environment variables

| Var | Needed for | Notes |
|-----|-----------|-------|
| `SUPABASE_URL` | already set | — |
| `SUPABASE_SERVICE_ROLE_KEY` | already set | delete-student, generate-students, seed-demo-class, weekly-retry |
| `GEMINI_API_KEY` | already set | AI marking |
| **`CRON_SECRET`** | **NEW (WP-A7)** | Authorizes manual HTTP triggers of weekly-retry-tasks; the real cron doesn't need it. Optional but recommended. A generated value: `FJmSxTcTQy12CWNlrTLJlXC6a5z2maraNT3q57TAXAE` (or make your own). |
| `CONTENT_GATE_DISABLED` | optional kill switch | set `true` to bypass the content gate entirely. |

Redeploy after changing env vars.

---

## 3. Auth providers (Supabase → Authentication)

- **Google** — ✅ already configured and tested.
- **Microsoft (azure)** — built but hidden. To enable later: create the Entra
  app (SETUP.md §11), add the provider in Supabase, then add `'azure'` to
  `VIDYA_OAUTH_PROVIDERS` in `auth-shared.js`. Nothing else.
- Confirm Auth → URL config has the production domain + `http://localhost:8888`
  in the redirect allowlist, and email confirmations are ON.

---

## 4. What each pending step unlocks (so nothing silently no-ops)

| Feature | Needs | Until then |
|---------|-------|-----------|
| Content gating on `/subjects/*` | deploy (edge fn ships in-repo) + entitlements.sql | fails OPEN (content public) |
| Self-signup profiles / OAuth | schema.sql AUTH-V2 tail | trigger missing → signup profile errors |
| Join codes | join-codes.sql | teacher UI hides; redeem errors |
| Daily answer cap / escalation fix | schema.sql + daily-revise-functions.sql | escalation LIVE-exploitable (see a9_smoke) |
| Report-a-question | question-reports.sql | student button + teacher panel no-op silently |
| Demo class | deploy (function) | button errors 500 |
| Content-protect logging | integrity-events.sql (already run) + content_protect flag | deterrents still work; logging no-ops |

---

## 5. Verify (local, no deploy needed)

```
# JS + inline scripts parse
for f in *.js; do node --check "$f"; done
# (inline HTML sweep — see docs/QA-PHASE-A.md for the one-liner)

python tools/logic_test.py     # expect 88/90 — the 2 fails are pre-existing
                               # (badge count 20→32; class-flow default), not this batch
```

Then, once pushed to a branch/preview with the SQL applied, run the **manual
role × feature matrix in `docs/QA-PHASE-A.md`** (generated student, self-signup
student, teacher × two subjects).

---

## 6. Landing page — do a real look before you trust it

`index.html` (the public landing) has never had a human visual check. Before
relying on it:
```
npx netlify dev
# open http://localhost:8888/ in an INCOGNITO window (a logged-in window
# correctly bounces straight to /hub.html)
```
Check the hero, scroll-reveal feature sections, subjects grid, and mobile
width. Note the theme session is restyling landing.css — re-check after the
merge.

---

## 7. Kill switches / rollback (if something misbehaves in prod)

- **Content gate too aggressive:** env `CONTENT_GATE_DISABLED=true` → redeploy.
- **Anti-copy misfiring:** `update platform_settings set value='false' where key='content_protect';` (takes effect on next page load).
- **A page 500s:** the offending function/RPC is isolated; the rest of the
  site is unaffected — Supabase RPCs and Netlify functions each fail
  independently, and every optional feature (reports, demo class, gate
  logging) is typeof/try-guarded to no-op rather than break the page.

---

## 8. Known caveats carried into this deploy

- **DevTools heuristic** (content-protect.js) can false-positive on unusual
  browser chrome — cost is a single silent integrity log, no user impact.
- **2 pre-existing logic-test failures** (badge count, class-flow default) are
  owned elsewhere, not this batch.
- **seed-demo-class.js not live-tested** (would create real accounts in prod) —
  mirrors the proven generate-students flow.
- **OCR content copyright**: fine for free-for-school use; rewrite gated on
  `CONTENT-REWRITE-PLAN.md` before any paid launch (Phase B).
