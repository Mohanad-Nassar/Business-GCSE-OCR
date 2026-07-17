# Supabase migration run order (READ BEFORE running any .sql)

These files use `create or replace` / `drop policy … create policy`, so **later
files override earlier ones**. That means order matters, and re-running an
*earlier* file silently reverts the *later* ones. Two rules keep you safe:

> **GOLDEN RULE 1** — `security-hardening-2026-07.sql` is **ALWAYS the last file
> you run.**
>
> **GOLDEN RULE 2** — if you run (or re-run) **any** file in the "base" group
> below, you must then re-run the **whole override tail** underneath it, in
> order. When in doubt, just run the override tail again — every file is safe to
> re-run.

---

## Base group (run once, in this order)

1. `schema.sql`
2. `schools.sql`
3. `entitlements.sql`
4. `class-teachers.sql`
5. `school-admin.sql`
6. `bank-questions-schema.sql`
7. `daily-revise-functions.sql`
8. `teacher-subjects.sql`  ← **base for the Subjects-V2 stack.** Running this
   file re-creates the plain `subjects` read policy, the strict
   `_class_subject_guard`, and re-grants `sync_teacher_subject_bank` to
   clients — so it MUST be followed by the whole override tail below.

(Other feature files — leaderboard, spaced-repetition, integrity-events,
section-reset, tasks-*, topic-access, etc. — are independent of this chain; run
them per their own headers.)

## Override tail (ALWAYS run after the base group, IN THIS ORDER)

9.  `subjects-v2.sql`                      ← share access, shared-subjects-in-classes, custom_topics policies
10. `topic-grading.sql`                    ← needs can_view_subject (from subjects-v2)
11. `subjects-v2-s2-requests.sql`          ← request-to-edit
12. `subjects-v2-s3-external.sql`          ← external share invites + tokens
13. `subjects-v2-s4-fork-grants.sql`       ← platform-edit grants; re-overrides request/resolve for platform_fork
14. `subjects-v2-bank-sync-hardening.sql`  ← revokes the raw sync RPC (XSS storage boundary)
15. `subjects-v2-s5-overrides.sql`         ← S5 override-fork: subject_overrides table + RLS + _student_school_for_subject (needs s4's can_edit_platform_subject)
15a. `subjects-v2-s5-bank-scope.sql`       ← S5 step 2: bank_questions.school_id + _overridden_page_ids + REDEFINES get_daily_revise_queue / get_topic_questions / grade_topic_answer with the school-scope filter. **Re-run whenever daily-revise-functions.sql OR topic-grading.sql is re-run** (they revert these three functions to the unscoped versions).
15b. `subjects-v2-s5-override-sync.sql`    ← S5 step 3: sync_school_override_bank_srv (service-role-only forked bank sync; school-pinned upsert + delete). Needs 15a (school_id) + s4 grant tables.
15c. `subjects-v2-s5-edge.sql`             ← S5 step 4: subject_overrides.file_slug + REDEFINES edge_gate_check to also return override_slugs (the edge 302s a school's published overrides to topic.html). Needs 15 (subject_overrides + _student_school_for_subject). **Re-run whenever entitlements.sql is re-run** — entitlements.sql reverts edge_gate_check to the plain (no override_slugs) body.
16. `security-hardening-2026-07.sql`       ← **LAST.** is_school_admin/has_subject_access/draft-policy/self-approval/atomic-consume

---

## Why each tail file must come after the base

| If you re-run… | …it reverts | …so re-run |
|---|---|---|
| `teacher-subjects.sql` | subjects read policy, `_class_subject_guard`, `sync_teacher_subject_bank` grant | 9, 14, 15 (at minimum) |
| `subjects-v2.sql` | the draft-leak policy (back to `can_view_subject`) | 15 |
| `subjects-v2-s2-requests.sql` | platform_fork request/resolve | 13, 15 |
| `subjects-v2-s3-external.sql` | `resolve_external_share` self-approval guard + atomic consume | 15 |
| `daily-revise-functions.sql` | `get_daily_revise_queue` school-scope filter (back to unscoped → school X's overrides leak into Y's queue) | 15a |
| `topic-grading.sql` | `get_topic_questions` + `grade_topic_answer` school-scope filter/count (back to unscoped) | 15a |
| `entitlements.sql` | `edge_gate_check` override_slugs key (back to allow_content/allow_bank only → edge stops redirecting overrides) | 15c |

**Simplest safe habit:** whenever you touch anything in the base group or the
tail, re-run files 9 → 15 in order. It takes a minute and guarantees correctness.
