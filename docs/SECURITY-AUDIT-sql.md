# WP-A7 Security Audit — SQL / Supabase layer

Audit of every canonical `supabase/*.sql` file (the project runs these directly
in the Supabase SQL editor; there are no migration files). All fixes were applied
in-place and are re-run-safe (`create or replace`, `drop … if exists`,
`add column if not exists`, `insert … on conflict do nothing`).

Date: 2026-07-11 · Scope: SQL half of WP-A7 (RLS, `security definer` RPCs,
answer-key exposure, rate-limiting). No `.js` / `.html` / `.toml` files touched;
no git, no build pipeline, no `--upload` run.

## Findings by severity

| Severity | Count | Status |
|----------|-------|--------|
| High     | 1     | Fixed  |
| Medium   | 1     | Fixed  |
| Low      | 1     | Fixed  |
| Low (informational, no change) | 1 | Documented for owner |
| OK / verified-safe | many | No change needed |

No findings were left BLOCKED — every issue found was safely fixable in the
canonical SQL files.

## Files changed

- `supabase/schema.sql` — added the `_profiles_block_privilege_change` BEFORE
  UPDATE trigger on `profiles` (HIGH fix).
- `supabase/entitlements.sql` — seeded `platform_settings` key `daily_answer_cap`
  = 1000 (supports the Medium fix).
- `supabase/daily-revise-functions.sql` — added the per-student daily answer cap
  to `record_mastery_answer()` (Medium fix; `record_review_answer()` inherits it).
- `supabase/tasks-schema.sql` — revoked `task_effective_due(uuid,uuid)` from all
  client roles (Low fix).

---

## Item 1 — RLS coverage

Every one of the 27 tables across the schema has `enable row level security`
(verified 27 `create table` ↔ 27 `enable row level security`, 1:1). Policies were
reviewed for student-own-rows / teacher-own-classes scoping.

**HIGH — privilege escalation via `profiles_update_own` — FIXED.**
`schema.sql:219-221` defines:

```sql
create policy "profiles_update_own" on profiles
    for update using (id = auth.uid());
```

Postgres RLS is row-level, not column-level, and no `WITH CHECK` constrains the
*new* row. Supabase grants `authenticated` UPDATE on all columns, so any student
could run `update profiles set role='teacher'` (or `is_owner=true`,
`account_type='owner'`) on their own row and self-escalate. That is severe:
`entitlements.sql`'s `has_subject_access()` / `edge_gate_check()` treat
`role='teacher' or is_owner` as "may load `question-bank.js`", and that file
**embeds every correct answer inline** — so the escalation also defeats the
`bank_questions` answer-key split (Item 2). Confirmed no client code updates
`profiles` today (only a SELECT of `role, username, account_type` in
`auth-shared.js`; all writes are service-role Netlify Functions), so the fix has
zero functional impact.

Fix (`schema.sql:487-507`): a BEFORE UPDATE trigger
`_profiles_block_privilege_change` that raises if `role` / `account_type` /
`is_owner` change **when `auth.uid()` is non-null** (a real JWT user). Service
role / SQL-editor / signup-trigger contexts have a null `auth.uid()` and are
deliberately allowed, so provisioning and the in-file backfills still work. The
`profiles_update_own` policy is intentionally left in place so a future
"change my username" self-edit keeps working — only the privilege columns are
pinned.

**OK — RLS-enabled-but-no-policies tables (intentional deny-all-to-clients):**
- `bank_questions` (`bank-questions-schema.sql:59-61`) — the crown jewel; RPC-only.
- `teacher_invite_codes` (`schema.sql:275-281`) — service-role signup only.
- `join_code_attempts` (`join-codes.sql:47`) — RPC-only throttle log.
None use `FORCE ROW LEVEL SECURITY`, so the owning role that runs the
`security definer` RPCs still reads them; direct client `SELECT` is denied. Correct.

**OK — every other table** carries a self-scoped student policy
(`student_id = auth.uid()` / equivalent) and, where teachers need read access, a
`teaches_student(...)` / `is_class_owner(...)` policy. Spot-checked:
`progress_events`, `progress_summary`, `question_mastery`, `topic_reviews`,
`daily_revise_stats`, `flight_path_snapshots`, `integrity_events`, all `task_*`
tables, `task_answer_suggestions` (teacher-only, keeps AI suggestions hidden from
students until released), `class_join_codes`, the three `topic-access` tables and
`class_topic_filter_active` (teacher-write, student reads via RPC).

**OK — `subjects_read_all` / `platform_settings_read_authed`** expose only a
non-sensitive catalogue and feature flags; no personal data. Acceptable.

## Item 2 — `bank_questions` snapshot / answer_key split (crown jewel)

**OK — students can never SELECT `answer_key`.** `bank_questions` has RLS on with
zero policies, so no direct read. Every student-facing RPC's *declared return
columns* omit `answer_key`:
- `get_daily_revise_queue(...)` → returns `snapshot`, not `answer_key`
  (`daily-revise-functions.sql:112-121`).
- `get_topic_review_questions(...)` → `snapshot` only (`spaced-repetition.sql:176-183`).
- `get_my_task_questions(...)` → no `answer_key` (`tasks-schema.sql:278-286`).

Answer content only ever reaches a student **after they submit an answer** —
`record_mastery_answer()` / `record_review_answer()` return `answer_key` in the
grade result, and `get_task_answer_keys()` releases keys only once the student can
no longer submit for marks (attempts exhausted, or hard-lock deadline passed —
`tasks-schema.sql:468-500`). That is correct quiz behaviour, not a leak.
Teacher-only `answer_key` exposure (`get_class_dr_questions`,
`daily-revise-analytics.sql`) is guarded by `is_class_owner()`.

`get_task_fib_word_bank()` (`tasks-fib-wordbank.sql`) returns a *shuffled,
unlabelled multiset* of fill-in-the-blank words to an assigned student — a word
bank with no mapping back to question/blank. Reviewed: intentional design, gated
by `is_assigned_task()`, not an answer-key leak. OK.

The only path that *would* have exposed the whole bank was the `profiles`
escalation (Item 1, `allow_bank` flip) — now closed.

## Item 3 — `security definer` function hygiene

**(a) `set search_path` — OK, no misses.** All 54 real `security definer`
functions declare `set search_path = public`. (A grep shows 57 vs 54, but the 3
extra `security definer` mentions are inside code comments in
`daily-revise-stats-schema.sql`, `entitlements.sql` and `tasks-schema.sql`, not
functions.) Nothing to fix.

**(b) Acting user derived from `auth.uid()` — OK.** Every write/authz RPC reads
`v_uid := auth.uid()` and never trusts a passed-in student/teacher id for the
identity of the caller: `record_progress`, `record_mastery_answer`,
`record_review_answer`, `record_integrity_event`, `record_flight_path_snapshot`,
`reset_my_*`, `save_task_answer`, `submit_task_attempt`, `start_task_attempt`,
`create_retry_task`, `redeem_join_code`, `request_topic_access`.

**(c) Ownership of passed ids validated before mutating — OK.**
- `mark_task_answer` → `owns_task(att.task_id)` (`tasks-schema.sql:559-562`).
- `resolve_topic_access_request` → `is_class_owner(v_req.class_id)` after loading
  the row (`topic-access-schema.sql:206-208`).
- `generate_join_code` / `revoke_join_code` → `is_class_owner(p_class_id)`.
- `create_retry_task` → source attempt must be the caller's own submitted attempt.
- `get_class_*` analytics (`daily-revise-analytics.sql`, `class-gamification.sql`,
  `tasks-analytics-functions.sql`) → `is_class_owner()` / `teacher_id = auth.uid()`.
- `save_task_answer` / `submit_task_attempt` → attempt row filtered by
  `student_id = v_uid`, plus per-question "belongs to this task" checks.
- `record_review_answer` → verifies the question belongs to the topic and the
  review row belongs to the caller (`spaced-repetition.sql:231-248`).

## Item 4 — EXECUTE grants (functions answering for an arbitrary id)

**LOW — `task_effective_due(uuid, uuid)` was granted to `authenticated` — FIXED.**
Unlike the `auth.uid()`-scoped helpers, this takes an arbitrary `p_student_id` and
returns that student's effective deadline, including their per-student
`due_override` (an SEN / extra-time signal). It is only ever called *internally*
by the `security definer` task functions (which invoke it as the function owner
and so don't need the grant), and no client calls it (verified: no
`rpc('task_effective_due')` in the JS). Following the `has_subject_access()`
pattern, it is now revoked from `public` / `anon` / `authenticated`
(`tasks-schema.sql:171-173`). Internal callers are unaffected.

**OK — `has_subject_access(uuid, text)`** remains revoked from all client roles
(`entitlements.sql:60-62`); only the `auth.uid()`-scoped wrappers
(`my_subject_access`, `edge_gate_check`, `get_my_entitlements`) are granted.

**OK — caller-scoped helpers** that take an id but answer only about the *caller's
own* relationship (`teaches_student`, `is_class_owner`, `is_member_of_class`) stay
granted to `authenticated` — they leak nothing about the passed id's private data.

## Item 5 — Rate-limiting / abuse caps

**MEDIUM — `record_mastery_answer` / `record_review_answer` had no daily cap —
FIXED.** Added a per-student, per-UTC-day sanity cap to `record_mastery_answer()`
(`daily-revise-functions.sql:258-285`): it counts today's `section='daily-revise'`
`progress_events` rows (each graded answer logs exactly one) and rejects once the
cap is reached with a clear error (`errcode = check_violation`). The cap reads
`platform_settings` key `daily_answer_cap` (seeded = 1000 in
`entitlements.sql:23-29`); if `platform_settings` does not exist it falls back to a
hard-coded 1000 via an `undefined_table` handler, so the grade never fails just
because that table is absent. `record_review_answer()` delegates its grade to
`record_mastery_answer()`, so it **inherits the same cap** — a capped student
cannot advance reviews either (the delegated exception rolls back the whole
review transaction). Re-run-safe. 1000/day sits far above any genuine student's
volume, so real users are unaffected.

**LOW (informational, no change) — `create_retry_task` is uncapped.** A student
can call it repeatedly to spawn retry `tasks` rows (assigned only to themselves in
their own class). This is table/UI clutter, not a data leak, and is outside the
audit's explicit cap scope (which named only the two mastery graders). Flagged for
the owner to consider a dedup/cap; left unchanged to avoid altering feature
behaviour without a product decision.

## Item 6 — write RPCs force `student_id = auth.uid()`

**OK — not weakened.** `record_integrity_event()` (`integrity-events.sql:42-61`)
sets `student_id = auth.uid()` (via `v_uid`) on insert; `integrity_events` has no
client write policy. Same enforcement verified for `record_progress`
(both the `schema.sql` and the live `topic-access-schema.sql` override),
`record_mastery_answer`, `record_review_answer`, `record_flight_path_snapshot`,
and the `task_*` write RPCs — none accept a caller-supplied owner id for writes.

---

## Balanced-`$$` sanity check (edited files)

| File | `$$` tokens | Even? |
|------|-------------|-------|
| `supabase/schema.sql` | 20 | ✅ |
| `supabase/entitlements.sql` | 8 | ✅ |
| `supabase/daily-revise-functions.sql` | 6 | ✅ |
| `supabase/tasks-schema.sql` | 24 | ✅ |

All even — no unterminated dollar-quoted bodies introduced.
