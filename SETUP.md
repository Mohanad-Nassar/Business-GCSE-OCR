# Backend setup (Supabase + Netlify)

All the code is written and committed. What's left is account creation and
configuration that only you can do (I have no credentials for your Supabase
or Netlify accounts). Follow these steps in order.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project (free tier is fine).
2. Once it's ready, go to **Project Settings → API**. You'll need three values from this page:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon public** key (safe to expose in the browser) 
   - **service_role** key (**secret** — never put this in any `.html`/`.js` file, only in Netlify's environment variables in step 4)

## 2. Run the database schema (fresh project — run in this exact order)

The SQL files are the canonical schema (there are no migration files — the site
is pre-launch, so multi-subject support was folded straight into them). On a
**fresh or reset project**, paste each file below into the **SQL Editor** and
click **Run**, one file at a time, **in this order**. Every file is safe to
re-run, but the *order* matters on first run (later files reference tables and
functions created by earlier ones).

1. [`supabase/schema.sql`](supabase/schema.sql) — core tables (**`subjects`** — seeded with the three launch subjects — `profiles`, `classes` with its `subject_id` FK, `class_students`, progress tables), all RLS policies, the RLS helper functions (`is_class_owner`, `my_class_for_subject`, …), `record_progress()` and `get_my_subjects()`.
2. [`supabase/tasks-schema.sql`](supabase/tasks-schema.sql) — the Tasks feature: teacher-created question tasks with drafts, deadlines, attempt limits, per-student accommodations, autosaved answers, auto-marking of MCQ / True-False / fill-in-the-blanks, the manual marking queue, notifications, analytics and the anonymised leaderboard.
3. [`supabase/tasks-groups-migration.sql`](supabase/tasks-groups-migration.sql) — `assignment_group_id` on `tasks`, for sending one task to several classes at once.
4. [`supabase/tasks-analytics-functions.sql`](supabase/tasks-analytics-functions.sql) — `get_class_topic_performance()` / `get_my_topic_performance()`, the "Weak topics" views.
5. [`supabase/tasks-retry-schema.sql`](supabase/tasks-retry-schema.sql) — `source_kind`/`parent_task_id` on `tasks` and `create_retry_task()` (student follow-up tasks from wrong answers).
6. [`supabase/gamification-functions.sql`](supabase/gamification-functions.sql) — `get_my_streak()`, the day-streak flame (deliberately **cross-subject**: one streak across the whole platform). **Already run this before?** Re-run it anyway — it now also defines `get_my_activity_days()`, the practice-calendar heatmap on the student dashboard and badges page (also cross-subject; safe to re-run, and the widget simply doesn't appear until this has been run). **Run it again even if you just did** — `get_my_activity_days()` has since gained a `p_subject` parameter (subject-scoped on `dashboard.html`/`review-calendar.html`; still cross-subject on `badges.html`), still safe and idempotent to re-run.
7. [`supabase/class-gamification.sql`](supabase/class-gamification.sql) — `get_class_streaks()` for the teacher's Class Progress columns, and now also `get_class_activity_days(p_class_id, p_subject, p_days)`, the practice-calendar heatmap teachers see for an individual student in `teacher-dashboard.html`'s per-student **View** panel. **Already run this before?** Re-run it anyway — same as `get_my_activity_days()` above, the widget simply doesn't appear in the student panel until this has been run.
8. [`supabase/topic-access-schema.sql`](supabase/topic-access-schema.sql) — per-class topic locking (open / manual / sequential), "please open this topic" requests, per-student grants, and the live `record_progress()` override.
9. [`supabase/class-flow-settings.sql`](supabase/class-flow-settings.sql) — per-class learning-flow settings (activity order, focus mode, timers). **Must run after `topic-access-schema.sql`, every time — LAST of that pair.**

   ⚠️ **Steps 8 and 9 both define `get_my_topic_settings(p_subject)` — step 9's copy fully replaces step 8's, not merges with it.** Whenever you re-run step 8 for any reason, you must **immediately re-run step 9 straight after it**, or the Teacher Dashboard's "Inside a topic" / timer settings silently stop reaching students.
10. [`supabase/ai-marking.sql`](supabase/ai-marking.sql) — `task_answer_suggestions`, the teacher-only table for Gemini mark suggestions (see step 9 of this document).
11. [`supabase/student-account.sql`](supabase/student-account.sql) — `get_my_classes()` for the Manage Account page.
12. [`supabase/flight-path-schema.sql`](supabase/flight-path-schema.sql) — `flight_path_snapshots` (now keyed per student **per subject** per day) and `record_flight_path_snapshot()`.
13. [`supabase/bank-questions-schema.sql`](supabase/bank-questions-schema.sql) — `bank_questions` (per-subject question bank, student-visible `snapshot` split from hidden `answer_key`) and `question_mastery`, for "🎯 Daily Revise".
14. [`supabase/daily-revise-class-settings.sql`](supabase/daily-revise-class-settings.sql) — per-class Daily Revise controls (topic-filter mode, workload cap, pacing) plus `class_topic_filter_active`.
15. [`supabase/daily-revise-stats-schema.sql`](supabase/daily-revise-stats-schema.sql) — `daily_revise_stats`, the lifetime XP counters (now one row per student **per subject**).
16. [`supabase/daily-revise-functions.sql`](supabase/daily-revise-functions.sql) — `get_daily_revise_settings()`, `get_daily_revise_queue()` and `record_mastery_answer()` (must run after steps 13–15).
17. [`supabase/daily-revise-analytics.sql`](supabase/daily-revise-analytics.sql) — the four teacher-only analytics functions (`get_class_dr_usage/overview/questions/matrix`) behind `teacher-analytics.html`, each scoped to the class's own subject.
18. [`supabase/spaced-repetition.sql`](supabase/spaced-repetition.sql) — the Review Calendar: `topic_reviews` plus `get_review_schedule()`, `get_topic_review_questions()` and `record_review_answer()`. **Must run after the daily-revise files (steps 13 and 16)** — it reads `bank_questions` / `question_mastery` and delegates grading to `record_mastery_answer()`.
19. **Seed the question bank** — run:
    ```
    python tools/build_question_bank.py --upload
    ```
    (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`, see `.env.example`). This is the one command that populates `bank_questions` (Daily Revise's source) for every subject — see "Keeping content in sync" below, because it's also how you push any *future* content edit, not just this first-time seed.

    *No Python / no service-role key on this machine?* Fall back to running the generated files in [`supabase/bank-questions-seed/business/`](supabase/bank-questions-seed/business/) (`001.sql`, `002.sql`, … **in order**, one per SQL-editor run — they're deliberately small because the editor rejects one giant pasted query). This fallback only *adds/updates* rows — it can't remove ones a `--upload` run would delete, so prefer `--upload` whenever you can. See that folder's `README.md`; the old un-prefixed seed files that used to sit directly in `bank-questions-seed/` are legacy and gone — don't run them if one resurfaces from a backup.

## Keeping content in sync after this

Once the project is set up, **`python tools/build_question_bank.py --upload` is the
only command you need after editing any topic page's questions** (Key Learning,
MCQ, Matching, Fill-the-Blanks, Misconceptions, Exam Tips, True/False, Exam
Practice) — add one, remove one, or reword one enough that its content-hash id
changes. One run does all of the following, for every subject at once:

- Regenerates each subject's local `question-bank.js` / `page-groups.js` /
  `section-totals.js` — read directly (no server round-trip) by the teacher
  task builder, the worksheet builder, and the student index/dashboard, so
  those are always current the moment you rebuild.
- Upserts new/changed questions into the live `bank_questions` table
  (Daily Revise's source) — and **deletes any row for a question this build
  no longer produces**, so a removed question actually disappears from
  Daily Revise instead of lingering forever. (Its `question_mastery`
  progress rows go with it, via `on delete cascade`.)

The one thing that deliberately does **not** change: **already-published
tasks and previously-printed worksheets are frozen.** `task_questions`
stores a full snapshot of each question at the moment a teacher publishes
the task (`tasks-schema.sql`), specifically so a student's live homework
never changes under them mid-assignment. Only *new* tasks/worksheets pick up
the latest bank content — which they always do, since they read the
freshly-regenerated `question-bank.js` directly.

Running with no flags (`python tools/build_question_bank.py`) is safe at any
time too — it only rewrites the local files and never touches the network;
add `--upload` whenever you're ready to push that sync live.

### What changed for multi-subject

The platform now supports multiple subjects (Business, Computer Science and
Economics are seeded — CS and Economics as placeholders until their content
ships). If you knew the old single-subject schema:

- **New `subjects` table** (seeded in `schema.sql`, updated by the build
  pipeline) — slug, name, key stage, exam board/spec, **`exam_date`** (drives
  Daily Revise pacing and the Flight Path band; the old hardcoded date is
  gone), per-subject colour/icon. Read-all RLS.
- **`classes.subject_id`** — every class belongs to exactly one subject. A
  class created without one (the current teacher UI) defaults to Business
  server-side. A student's subject list is derived from their classes via the
  new `get_my_subjects()` RPC — there is no separate enrollments table.
- **Page ids are subject-prefixed** (`business:1-1-role-of-business-enterprise`),
  so progress rows, topic grants/visibility and bank question ids are
  subject-safe; SQL derives the subject with `split_part(page_id, ':', 1)`.
- **RPC signature changes** (old zero-/short-arg versions are dropped by the
  files themselves): `get_my_topic_settings(p_subject text default null)`,
  `get_daily_revise_settings(p_subject text default null)`,
  `get_daily_revise_queue(…, p_subject text default null)` (6 params),
  `record_flight_path_snapshot(p_pct numeric, p_subject text default 'business')`.
  Defaults preserve the old behaviour for not-yet-updated clients.
- **`bank_questions.subject_slug`**, **`daily_revise_stats` PK
  (student_id, subject_slug)** and **`flight_path_snapshots` unique key
  (student_id, subject_slug, snapshot_date)** make those per-subject.
  `get_my_streak()` and XP stay cross-subject.
- After the reset, verify with `python tools/smoke_test_supabase.py` (reads
  `.env`; read-only REST checks: subjects seeded, new RPC signatures callable,
  and the answer-key invariant — no student/anon can select `bank_questions`
  directly).

## 3. Add your teacher invite code

Still in the SQL Editor, run (replace the code with something only you and colleagues know):

```sql
insert into teacher_invite_codes (code, note) values ('Testing#1Business', 'staff signup');
```

You can insert more rows here later for other invite codes if you want to revoke/rotate one.

## 4. Fill in the Project URL and anon key

Six files currently have placeholders (`YOUR-PROJECT-REF` / `YOUR-ANON-KEY`) that need your real values:

- `script.js` 
- `index.html`
- `dashboard.html`
- `login.html`
- `teacher-signup.html`
- `teacher-dashboard.html`

In each one, find:
```js
const SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
```
and replace with your actual Project URL and anon key from step 1. (Find-and-replace across the repo works fine — the placeholder text is identical everywhere.)

## 5. Enable Netlify Functions + set the service-role key

1. In your Netlify site's dashboard: **Site configuration → Environment variables**, add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (the secret one — this is what lets the teacher-dashboard create/delete/reset student logins)
2. Commit and push these code changes, or trigger a redeploy. Netlify will detect `netlify.toml` and `package.json`, install `@supabase/supabase-js`, and deploy the functions in `netlify/functions/` automatically.
3. Confirm it worked: **Site → Functions** in the Netlify dashboard should list `teacher-signup`, `generate-students`, `delete-student`, `reset-student-password`, `weekly-retry-tasks`, and `suggest-marks`.
4. `weekly-retry-tasks` is a **scheduled function** (see the `schedule = "@weekly"` entry in `netlify.toml`) — it runs on its own every week with no one visiting the site, building/topping-up each student's "questions to review" task from their recent wrong answers. It needs `tasks-retry-schema.sql` (step 2.7 above) to already be run, and uses the same `SUPABASE_SERVICE_ROLE_KEY` as the other functions. Before trusting the weekly schedule, trigger it once manually from **Site → Functions → weekly-retry-tasks → Trigger function** in the Netlify dashboard and check the response/logs.

## 6. Create your own teacher account

1. Visit `https://your-site.netlify.app/teacher-signup.html`.
2. Enter your email, a password, and the invite code from step 3.
3. You'll be logged straight into the Teacher Dashboard.

## 7. Test the full flow

1. In the Teacher Dashboard, create a class (e.g. "Year 10 Business").
2. Click into it, generate a couple of students (e.g. 2), and note the username/password pairs shown (or download the CSV).
3. Open a private/incognito browser window, go to `login.html`, and log in as one of the generated students.
4. Answer a few questions on any topic page.
5. Back in the Teacher Dashboard, click "View" next to that student — you should see their per-topic completion and a timestamped log of the answers you just gave.
6. Try "Reset Password" and "Remove" on a test student to confirm those work too.

## 8. Try the Tasks feature

1. In the Teacher Dashboard, open a class and click the **📋 Tasks** tab, then **+ New Task** (this opens `teacher-tasks.html`, the Task Manager).
2. Fill in the settings (due date, late policy, attempts, which attempt counts, optional time limit and timer-on-leave behaviour). The "AI suggestions" radio is informational only — Gemini-powered mark suggestions for written answers are available in every task's Marking queue regardless of which one is picked (see step 9 below); marking itself always stays manual until you click **Save mark**.
3. In step 2 pick topics and question types — exam practice, MCQs, True/False, Key-Learning reading checks, misconception checks, exam-tip checks, fill-in-the-blanks and key-term matching — either **Random** (give a number) or **Manual** (tick exact questions). The **preview pane on the right** shows every question; ⚠ "Used before" flags questions a selected student has already had, and ⭯ Replace swaps one out.
4. Assign students (with optional per-student deadline override / extra time), then **Save draft** (invisible to students) or **Publish**.
5. Students see the task, notifications and results on their dashboard (`dashboard.html`) and sit it at `task.html`. You mark written answers in the task's **Marking queue** tab; **Analytics** has per-student and per-question breakdowns plus CSV export.

### Regenerating the question bank

The task builder draws from `question-bank.js`, generated from the question arrays embedded in the topic pages. After editing questions in any topic page, rebuild it with:

```
python tools/build_question_bank.py
```

Existing tasks are unaffected by rebuilds (each task snapshots its questions in the database when saved).

## 9. Turn on AI marking suggestions (optional)

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it in two places (never in any `.html`/`.js` file that ships to the browser — only the
   Netlify function reads it, via `process.env`):
   - **Netlify (production):** Site configuration → Environment variables → add `GEMINI_API_KEY` =
     your key (same screen as `SUPABASE_SERVICE_ROLE_KEY` in step 5). Redeploy after adding.
   - **Local dev:** put `GEMINI_API_KEY=...` in a `.env` file at the repo root (already gitignored,
     see `.env.example`) — `netlify dev` picks it up automatically.
3. Run `supabase/ai-marking.sql` (step 2.12 above) if you haven't already.
4. That's it — no further code changes needed. In a task's **✏️ Marking queue** tab, click
   **✨ Suggest marks** to have Gemini pre-mark unmarked written answers (a mark, student-facing
   feedback, teacher-facing reasoning and a confidence score per answer). Nothing is saved as a real
   mark until you click **Use this** on a suggestion (copies it into the mark/feedback boxes) and
   then **Save mark** — exactly like marking manually.
5. Cost note: each suggested answer is one Gemini API call; at current pricing that's a small
   fraction of a penny per answer. Nothing runs automatically or on a schedule — you control spend
   entirely by choosing when to click the button, and a single click processes at most 20 answers
   (click again to top up a longer queue).
6. If the Marking queue shows "Add GEMINI_API_KEY in Netlify", the key isn't set in Netlify's
   environment variables yet — see step 2 above.

## 10. Notifications bell, onboarding tour & Manage Account

1. Run `supabase/student-account.sql` (step 2.13 above) if you haven't already — needed for the
   "My Classes" list on the new Manage Account page.
2. No other setup — these three pieces are pure front-end + the RPC above:
   - **Notification bell** (`notifications-shared.js`): a 🔔 in the site nav / account bar (fixed
     bottom-right on `task.html`) on every student-facing page. Shows the same "task assigned /
     due soon / overdue / marked" notices that used to only appear on `dashboard.html`'s "My Tasks"
     list (that list still works too — both read the same `task_notification_reads` table, so
     dismissing one dismisses it everywhere).
   - **Onboarding tour** (`onboarding-tour.js`, `index.html` only): a 5-step guided walkthrough shown
     automatically the first time a student account loads the home page on a given browser
     (`localStorage` flag `gcse_onboarding_tour_seen_v1`). A "❓ Take the tour" link next to
     "My Progress" replays it any time.
   - **Manage Account** (`manage-account.html`): account details (username, member-since, classes +
     teacher) and a password-change form (calls Supabase's own `auth.updateUser()` directly — no new
     Netlify function). Linked from the account bar/site nav on every student page.
3. Test as a student: confirm the bell shows a badge after a teacher assigns/marks a task, the tour
   appears once on a fresh browser profile then not again, and a password change round-trips (log
   out, log back in with the new password).

## Notes

- **Google/Microsoft login**: not built yet, by design (you asked for username/password first). When you're ready, enable the providers under **Authentication → Providers** in Supabase and add sign-in buttons to `login.html` — no schema or backend changes needed.
- **Local testing**: `netlify dev` (via the Netlify CLI) will run the functions locally against your real Supabase project if you set the same environment variables in a local `.env` file — useful before deploying changes to the functions.
- **Correctness tracking**: the answer log records *which question* a student answered and *when*, always. Whether it was *correct* is only captured today for the "quick check" quizzes embedded in the Key Learning cards (they already carry a `correct` flag); MCQ/True-False/Fill-in-the-blank answers are logged but `is_correct` is left blank for now. Extending that is a small, contained follow-up if you want it.
