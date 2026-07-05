# Backend setup (Supabase + Netlify)

All the code is written and committed. What's left is account creation and
configuration that only you can do (I have no credentials for your Supabase
or Netlify accounts). Follow these steps in order.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project (free tier is fine).
2. Once it's ready, go to **Project Settings â†’ API**. You'll need three values from this page:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon public** key (safe to expose in the browser) 
   - **service_role** key (**secret** â€” never put this in any `.html`/`.js` file, only in Netlify's environment variables in step 4)

## 2. Run the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy the whole file, paste it into the SQL Editor, and click **Run**.
3. This creates all the tables, security rules, and the `record_progress` function. It's safe to re-run if you ever need to.
4. **Then run [`supabase/tasks-schema.sql`](supabase/tasks-schema.sql) the same way** (it must run *after* `schema.sql`). This adds the Tasks feature: teacher-created question tasks with drafts, deadlines, attempt limits, per-student accommodations (deadline overrides / extra time), autosaved answers with per-question timing, automatic marking of MCQ / True-False / fill-in-the-blanks, a manual marking queue for written answers, notifications, analytics, and an anonymised leaderboard. Also safe to re-run.
5. **Then run [`supabase/tasks-groups-migration.sql`](supabase/tasks-groups-migration.sql)** (after `tasks-schema.sql`). This adds `assignment_group_id` to `tasks`, used when a teacher sends one task to several classes at once. Also safe to re-run.
6. **Then run [`supabase/tasks-analytics-functions.sql`](supabase/tasks-analytics-functions.sql)**. Adds `get_class_topic_performance()` and `get_my_topic_performance()`, which power the "Weak topics" views for teachers and students. Also safe to re-run.
7. **Then run [`supabase/tasks-retry-schema.sql`](supabase/tasks-retry-schema.sql)**. Adds `source_kind`/`parent_task_id` to `tasks` and the `create_retry_task()` function, which lets a student generate a small follow-up task from just the questions they got wrong. Also safe to re-run.
8. **Then run [`supabase/gamification-functions.sql`](supabase/gamification-functions.sql)**. Adds `get_my_streak()`, which powers the day-streak flame students see on their pages. Also safe to re-run.
9. **Then run [`supabase/class-gamification.sql`](supabase/class-gamification.sql)**. Adds `get_class_streaks()`, which powers the per-student Level / 🔥 Streak / 🏅 Badges columns teachers see in Class Progress (levels/XP/badges themselves are derived client-side; only streaks need this). Also safe to re-run.
10. **Then run [`supabase/topic-access-schema.sql`](supabase/topic-access-schema.sql)**. Adds per-class topic locking (open / manual / sequential), student "please open this topic" requests, and per-student unlock grants — managed from the Teacher Dashboard's **🔒 Topic Access** tab. Also safe to re-run.
11. **Then run [`supabase/class-flow-settings.sql`](supabase/class-flow-settings.sql)** (after `topic-access-schema.sql`). Adds the per-class learning-flow settings behind the same **🔒 Topic Access** tab: whether activities inside a topic unlock in order or freely, whether students see one question/card at a time, and the reading-time / after-answer timers (defaults: free order, one-at-a-time, 10s + 10s). Also safe to re-run.

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
and replace with your actual Project URL and anon key from step 1. (Find-and-replace across the repo works fine â€” the placeholder text is identical everywhere.)

## 5. Enable Netlify Functions + set the service-role key

1. In your Netlify site's dashboard: **Site configuration â†’ Environment variables**, add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (the secret one â€” this is what lets the teacher-dashboard create/delete/reset student logins)
2. Commit and push these code changes, or trigger a redeploy. Netlify will detect `netlify.toml` and `package.json`, install `@supabase/supabase-js`, and deploy the functions in `netlify/functions/` automatically.
3. Confirm it worked: **Site â†’ Functions** in the Netlify dashboard should list `teacher-signup`, `generate-students`, `delete-student`, `reset-student-password`, and `weekly-retry-tasks`.
4. `weekly-retry-tasks` is a **scheduled function** (see the `schedule = "@weekly"` entry in `netlify.toml`) â€” it runs on its own every week with no one visiting the site, building/topping-up each student's "questions to review" task from their recent wrong answers. It needs `tasks-retry-schema.sql` (step 2.7 above) to already be run, and uses the same `SUPABASE_SERVICE_ROLE_KEY` as the other functions. Before trusting the weekly schedule, trigger it once manually from **Site â†’ Functions â†’ weekly-retry-tasks â†’ Trigger function** in the Netlify dashboard and check the response/logs.

## 6. Create your own teacher account

1. Visit `https://your-site.netlify.app/teacher-signup.html`.
2. Enter your email, a password, and the invite code from step 3.
3. You'll be logged straight into the Teacher Dashboard.

## 7. Test the full flow

1. In the Teacher Dashboard, create a class (e.g. "Year 10 Business").
2. Click into it, generate a couple of students (e.g. 2), and note the username/password pairs shown (or download the CSV).
3. Open a private/incognito browser window, go to `login.html`, and log in as one of the generated students.
4. Answer a few questions on any topic page.
5. Back in the Teacher Dashboard, click "View" next to that student â€” you should see their per-topic completion and a timestamped log of the answers you just gave.
6. Try "Reset Password" and "Remove" on a test student to confirm those work too.

## 8. Try the Tasks feature

1. In the Teacher Dashboard, open a class and click the **ðŸ“‹ Tasks** tab, then **+ New Task** (this opens `teacher-tasks.html`, the Task Manager).
2. Fill in the settings (due date, late policy, attempts, which attempt counts, optional time limit and timer-on-leave behaviour). AI marking shows as "Coming soon" â€” everything is already structured for it (mark schemes are stored with every question), so it can be switched on later without rework.
3. In step 2 pick topics and question types â€” exam practice, MCQs, True/False, Key-Learning reading checks, misconception checks, exam-tip checks, fill-in-the-blanks and key-term matching â€” either **Random** (give a number) or **Manual** (tick exact questions). The **preview pane on the right** shows every question; âš  "Used before" flags questions a selected student has already had, and â­¯ Replace swaps one out.
4. Assign students (with optional per-student deadline override / extra time), then **Save draft** (invisible to students) or **Publish**.
5. Students see the task, notifications and results on their dashboard (`dashboard.html`) and sit it at `task.html`. You mark written answers in the task's **Marking queue** tab; **Analytics** has per-student and per-question breakdowns plus CSV export.

### Regenerating the question bank

The task builder draws from `question-bank.js`, generated from the question arrays embedded in the topic pages. After editing questions in any topic page, rebuild it with:

```
python tools/build_question_bank.py
```

Existing tasks are unaffected by rebuilds (each task snapshots its questions in the database when saved).

## Notes

- **Google/Microsoft login**: not built yet, by design (you asked for username/password first). When you're ready, enable the providers under **Authentication â†’ Providers** in Supabase and add sign-in buttons to `login.html` â€” no schema or backend changes needed.
- **Local testing**: `netlify dev` (via the Netlify CLI) will run the functions locally against your real Supabase project if you set the same environment variables in a local `.env` file â€” useful before deploying changes to the functions.
- **Correctness tracking**: the answer log records *which question* a student answered and *when*, always. Whether it was *correct* is only captured today for the "quick check" quizzes embedded in the Key Learning cards (they already carry a `correct` flag); MCQ/True-False/Fill-in-the-blank answers are logged but `is_correct` is left blank for now. Extending that is a small, contained follow-up if you want it.
