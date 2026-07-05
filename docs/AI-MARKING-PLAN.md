# AI Marking — implementation plan (Gemini)

Handoff document for the next working session. Written 2026-07-05, after the
brainstorm session. The chosen design: **AI suggests, teacher releases** —
Gemini pre-marks written answers into the existing ✍️ Marking queue as
suggestions; nothing becomes a real mark until the teacher accepts it.

## Where the API key lives (NEVER in any .html/.js that ships to browsers)

1. **Netlify (production):** Site configuration → Environment variables →
   add `GEMINI_API_KEY` = the key. Same screen as `SUPABASE_SERVICE_ROLE_KEY`
   (SETUP.md step 5). Redeploy after adding.
2. **Local dev:** put `GEMINI_API_KEY=...` in a `.env` file at the repo root
   (already gitignored). `netlify dev` picks it up automatically.
3. `.env.example`: add an empty `GEMINI_API_KEY=` line so the placeholder is
   documented.

The key is only ever read by the Netlify function via `process.env` —
frontend code calls the function, never Google.

## Design decisions already made

- **Engine:** Gemini (user has a key). Use a current cheap/fast text model —
  verify the current recommended model id in Google's docs at build time
  (e.g. a "flash"-class model); don't trust memory. Call the REST
  `generateContent` endpoint with `response_mime_type: "application/json"`
  and a response schema so output is guaranteed parseable JSON.
- **Trigger:** on-demand button in the Task Manager's Marking queue
  ("✨ Suggest marks for unmarked answers"). Nightly batch = later phase.
- **Human in the loop:** suggestions pre-fill the existing marking queue UI
  (marks + feedback + short reasoning + confidence). Teacher clicks accept
  (which submits through the EXISTING manual-marking path) or edits first.
  Never write to the real `awarded`/`marking_complete` fields directly.
- **Privacy:** the prompt contains ONLY: question text, mark scheme, model
  answer, max marks, and the student's answer text. No usernames/ids.
  Update docs/DPIA.md with a short section (automated assistance, human
  makes final decision, no identifiers sent).
- **Marks clamped** to the question's max server-side; suggestion includes
  `confidence` (0-1) so a later phase can auto-accept high-confidence
  low-mark answers.

## Step-by-step for the implementing session

1. **Schema** — new `supabase/ai-marking.sql` (safe to re-run, add to
   SETUP.md as the next numbered step): add nullable columns to
   `task_answers`: `ai_marks int`, `ai_feedback text`, `ai_reasoning text`,
   `ai_confidence real`, `ai_model text`, `ai_suggested_at timestamptz`.
   No RLS change needed for teachers (they already read task_answers for
   their classes); confirm students can't see ai_* columns before marks are
   released — if task_answers is student-readable, move suggestions to a
   separate teacher-only table instead.
2. **Netlify function** — `netlify/functions/suggest-marks.js`, modelled on
   the existing functions in that folder (same auth pattern: verify the
   caller's Supabase JWT, check they own the task's class via service-role
   client). Input: `{ task_id }`. It:
   - loads the task's written questions (`qtype = 'written'`) + submitted,
     unmarked, un-suggested answers;
   - for each answer calls Gemini (JSON schema: `marks`, `feedback` —
     student-facing, 2-3 sentences, `reasoning` — teacher-facing, per
     mark-scheme point, `confidence`);
   - clamps marks to the question max, writes the ai_* columns;
   - returns counts + failures. Process sequentially or in small batches;
     handle rate limits with a short retry; cap ~50 answers per call.
3. **Marking queue UI** (teacher-tasks.html, Marking queue tab): add the
   "✨ Suggest marks" button (disabled state → "Suggesting… n/m"); on each
   queue item show a suggestion card (marks, feedback, reasoning,
   confidence) with **Use this** (copies into the existing mark+feedback
   inputs) — teacher still presses the existing save. Friendly empty/error
   states; if the function returns a missing-key error, show "Add
   GEMINI_API_KEY in Netlify (see SETUP.md)".
4. **SETUP.md** — new step for the SQL file + a short "AI marking" section:
   where the key goes (the 3 locations above), what the feature does, cost
   note. Flip the task-builder's "AI marking — Coming soon" radio
   (teacher-tasks.html step 1) to enabled=ON meaning "suggestions
   available"; simplest: relabel to "🤖 AI suggestions in the marking queue"
   and keep `marking_mode` as `manual` in the DB (suggestions work
   regardless of the radio — least schema churn).
5. **Verify** — `python tools/logic_test.py` must stay green (60+ tests);
   V8-parse teacher-tasks.html inline script + the new function file
   (see docs in memory: mini-racer `new Function(...)` trick); check every
   `$()`/getElementById target exists; update docs/QA-CHECKLIST.md with a
   marking-suggestions check. No secrets in any committed file.
6. **Commit** in two parts if practical: schema+function, then UI. End
   commit messages with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Repo conventions the session must follow (also in auto-memory)

- OneDrive can change files mid-session — re-read before editing on
  "file modified" errors, and reconcile (a parallel session may have built
  the same thing; check before duplicating).
- No Node on this machine: verify JS with Python `esprima` (syntax) and
  `mini-racer` (V8 runtime) — the regression suite is `tools/logic_test.py`.
- Teacher UI style: guided steps (`.step-panel`/`.step-num`), friendly
  empty states, everything saves with visible feedback.

## The prompt to paste into the new session

> Read docs/AI-MARKING-PLAN.md and implement it exactly. It adds
> Gemini-powered AI marking suggestions to the teacher Marking queue:
> supabase/ai-marking.sql (ai_* suggestion columns on task_answers),
> netlify/functions/suggest-marks.js (teacher-authed, reads
> GEMINI_API_KEY from env, JSON-schema output, clamps marks), a
> "✨ Suggest marks" button + suggestion cards with "Use this" in
> teacher-tasks.html's marking queue, SETUP.md + DPIA updates. Suggestions
> only — the teacher accepts through the existing manual save. Verify with
> python tools/logic_test.py and V8-parse the edited files, then commit.
> I've already added GEMINI_API_KEY to Netlify env vars and my local .env.
