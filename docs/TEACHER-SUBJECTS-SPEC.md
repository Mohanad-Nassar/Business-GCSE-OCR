# Teacher-authored subjects — v2 contract (2026-07-12)

Teachers create their OWN subjects (PE, History, …) that behave like the
platform subjects: a real row in `subjects`, classes bind to them, students
join by class code / generated logins exactly as normal, and every topic
follows the standard 9-activity structure with per-activity opt-outs.

**v1 note:** the first cut (own `custom_subjects`/`custom_subject_classes`
tables + one rich-text blob per topic) was never deployed; v2 replaces it.
`supabase/teacher-subjects.sql` drops the v1 tables if they exist.

## Architecture

- `subjects.created_by uuid` — null = platform subject (Business/CS/Eco),
  set = teacher-created. Teacher subjects are created ONLY via the
  `create_teacher_subject()` RPC (it generates a unique slug and forces
  `created_by = auth.uid()`).
- `classes.subject_id` → a teacher picks their own subject in the existing
  class-creation picker (teacher-classes.html). Enrollment = class
  membership, same as platform subjects; `get_my_subjects()` needs no change.
- `custom_topics` — one row per topic page. `page_id` for progress is
  `subjects.slug || ':' || custom_topics.slug` (same shape as platform
  pages), recorded via the existing `record_progress()` RPC, so
  progress_events / progress_summary / teacher visibility work untouched.
- Topic content = `custom_topics.sections` jsonb (schema below). All HTML
  inside it is hostile at render time → `RichText.sanitize()` on save,
  import AND render; plain-text fields are escaped at render.
- Students see **published** topics of subjects **their class is enrolled
  in** (RLS). Teachers see/edit only their own.

## Pages

- `teacher-subjects.html` — "My Content" manager + 4-step wizard
  (1 Basics → 2 Structure → 3 Content → 4 Publish & classes).
  Deep links: `?subject=<subjects.id>&step=N&topic=<custom_topics.id>`.
- `topic.html?s=<subject-slug>&t=<topic-slug>` — **the lesson page**: a
  1:1 clone of the static platform topic pages driven by the SAME engine
  (/script.js + progress-shared + gamification + topic-guard + …). Its
  loader fetches the topic, converts `sections` jsonb into the exact
  globals a static page inlines (`pageMeta, topics, mcqData, matchData,
  fibData, fibWords, tfData, miscData, examTips, flashcards,
  examQuestions, SUBJECT, PAGE_GROUPS, SECTION_TOTALS`), removes tab
  BUTTONS for opted-out activities (panels stay in the DOM hidden —
  several builders touch mounts unguarded), then loads the script chain
  and re-dispatches DOMContentLoaded (script.js's main boot listener
  registered after the real one fired). `injectExampleReadChecks` is
  no-op'd so placeholder questions never leak into teacher content.
  Tabs, XP, streaks, focus mode and server progress are therefore
  IDENTICAL to Business/Economics lessons.
- `subject-view.html?id=<subjects.id>` — the subject's topic list
  (index); topics link out to topic.html. Owner gets builder links.
- Hub: `get_my_subjects()` rows with `created_by` set link to
  `subject-view.html?id=…`.

## Full package (Daily Revise / Tasks / Worksheets)

- `custom-bank.js` (`window.CustomBank`) converts sections jsonb into the
  SAME question structures the build pipeline generates: gradable
  questions only (mcq, tf, fib, learn/misc check questions, matching from
  key-term pairs; written exam excluded — platform rule). Distractors are
  deterministic (seeded by question id) so re-syncs don't churn rows.
- `sync_teacher_subject_bank(subject_id, rows)` RPC upserts the rows into
  `bank_questions` under the subject's slug and deletes missing keys
  (mastery survives for unchanged ids). Only the owner, only PUBLISHED
  topics' page_ids, validated shapes, ≤4000 rows. The wizard calls it
  after every publish change / published-topic save / import. From then
  on Daily Revise, mastery, spaced repetition and DR analytics work
  untouched — they only filter on `bank_questions.subject_slug`.
- Task/worksheet pickers: `loadSubjectBank()` (tasks-shared.js) detects a
  non-platform slug and builds `window.QUESTION_BANK` at runtime from
  `custom_topics` via `loadCustomSubjectBank()` (drafts included —
  tasks snapshot questions at publish).
- Root pages (daily-revise, dashboard): `subject-loader.js` registers a
  provisional entry for unknown slugs (instead of falling back to
  business); after auth those pages call `loadCustomSubjectBank()` to
  hydrate name/colour/topic tree. `gcse_last_subject` is only persisted
  once the subject is confirmed real.

## `custom_topics.sections` jsonb (storage format — normalised)

Every block optional; a missing block or `"enabled": false` = opted out.
`html` fields are sanitised rich HTML; everything else plain text.

```json
{
  "reading": { "enabled": true, "html": "<p>…</p>",
      "check": { "question": "…", "options": ["…"], "answer": 0, "explain": "…" } },
      // reading.check is an OPTIONAL quick MCQ on the notes (template field
      // "notesCheck"). It emits as a 'learn'-source question in the bank, and
      // on topic.html the notes card carries it as its readCheck — so the
      // notes card works in "one question at a time" mode.
  "learn":   { "enabled": true, "items": [
      { "title": "…", "html": "<p>…</p>",
        "check": { "question": "…", "options": ["…","…","…","…"], "answer": 0, "explain": "…" } } ] },
  "terms":   { "enabled": true, "pairs": [ { "term": "…", "definition": "…" } ] },
  "mcq":     { "enabled": true, "questions": [
      { "question": "…", "options": ["…","…","…","…"], "answer": 2, "explain": "…" } ] },
  "fib":     { "enabled": true, "questions": [ { "text": "The [answer] goes in brackets." } ] },
  "tf":      { "enabled": true, "questions": [ { "statement": "…", "answer": true, "explain": "…" } ] },
  "misc":    { "enabled": true, "items": [ { "myth": "…", "truth": "…", "check": null } ] },
  "tips":    { "enabled": true, "items": [ { "title": "…", "html": "<p>…</p>" } ] },
  "exam":    { "enabled": true, "questions": [
      { "question": "…", "marks": 4, "hint": "", "markScheme": "<p>…</p>" } ] }
}
```

Notes:
- `learn.check` optional per item (but the guide encourages one per point).
- `terms.pairs` drives BOTH the flashcards deck and the matching quiz
  (matching = "which definition matches <term>?" with distractor
  definitions sampled from the other pairs — same as the platform build).
- `fib`: answers inline in square brackets, 1–3 per sentence; the player
  builds each blank's word-bank from the other blanks/questions' answers.
- `answer` is a 0-based index in storage (template accepts "A"–"D" too).

## Progress section keys (record_progress)

`learn, flashcards, mcq, match, fib, misc, tips, tf, exam` — identical to
platform pages (SECTION_TOTALS_ALL keys). `terms` maps to `flashcards` +
`match`. done/total per section; question ids `<block>:<index>`.

## Template file (download → fill by hand or by AI → upload)

`subject-template.js` (global `window.SubjectTemplate`) owns the format:

- `SubjectTemplate.build(subject, topics)` → the JSON object to download
  (pre-filled with existing content; new subjects get one worked example
  topic). File name `<slug>-content.json`.
- `SubjectTemplate.aiPrompt(subject)` → copy-paste prompt for ChatGPT/etc.
  ("Fill this JSON template… keep the structure, one topic per object…").
- `SubjectTemplate.parse(jsonText)` → `{ ok, errors: ["Topic 2 → MCQ 3:
  answer must be A–D", …], topics: [normalised sections per topic] }`.
  Friendly errors, letter/index answer normalisation, plain text → `<p>`,
  HTML sanitised via `RichText.sanitize`, unknown keys ignored.

Template topic shape (author-facing names):
`unit, title, publish, notes, keyLearning[{title,text,check}], keyTerms[{term,definition}], mcq[], fillInTheBlanks[{sentence}], trueFalse[{statement,answer,explain}], misconceptions[{misconception,reality,check?}], examTips[{title,tip}], examPractice[{question,marks,hint?,markScheme}]`.

## Teacher-side surfaces (all read PAGE_GROUPS / SECTION_TOTALS)

Every teacher view that renders a topic grid needs the custom subject's
tree hydrated (the generated page-groups-all.js / section-totals-all.js
don't know it). The pattern: resolve the class's subject, and if it's not
in the static registry call `loadCustomSubjectBank(slug)` (registers
PAGE_GROUPS_ALL[slug] + SECTION_TOTALS_ALL, sets window.SUBJECT/PAGE_GROUPS;
SECTION_TOTALS is aliased to SECTION_TOTALS_ALL by section-totals-all.js so
the added keys are visible). Wired in:
- teacher-dashboard.html `setActiveSubjectForClass()` (async) — whole-class
  completion + per-topic/per-activity grids + the student sub-view grid.
- teacher-analytics.html `resolveClassSubject()` — Daily Revise topic
  filter grid + question performance (subjectLoaderInit runs before the
  class is known, so this re-resolves from the class's real subject).
- teacher-tasks.html / teacher-worksheets.html pickers via loadSubjectBank.

## Question sourcing for Tasks / Worksheets / Daily Revise

`custom-bank.js` yields two sets:
- `buildBankRows()` (→ bank_questions / Daily Revise): auto-gradable only —
  mcq, tf, fib, learn/misc check questions, matching from key terms. A
  misconception WITHOUT a check becomes a True/False (myth = the false
  statement, correction = explanation) so every misconception is gradable.
  Written exam questions are excluded (no auto-grade signal).
- `buildBankEntries()` (→ Task/Worksheet pickers): everything above PLUS
  written exam-practice questions (source 'exam', qtype 'written',
  manually marked) — so the picker shows all nine activities, matching the
  platform subjects.

## Theme-safe colours (teacher-chosen text colours vs the 7 site themes)

Handled automatically. Uncoloured text uses `var(--ink)`, so it adapts to
every theme (light + the 2 dark ones) exactly like the platform lessons —
never a conflict. The editor's preset text-colour palette is a curated set
of saturated MID-TONES that read on both cream and navy backgrounds (no
near-black/near-white, which would vanish on one theme); the first swatch
("Auto") is `color:inherit`, resetting to the theme default. Highlights use
light backgrounds and pin their text to dark ink (`<mark>` CSS + the
highlight toolbar action), so highlighted text stays readable even in dark
themes. A teacher can still pick any custom colour, but the presets are the
safe path. Authored HTML renders inside `.rt-content`, which carries the
shared table/callout/highlight styling on the real lesson page.

## Working lesson-by-lesson / unit-by-unit (template scope)

`SubjectTemplate.build/aiPrompt/fileName` take a `scope`:
`{type:'subject'}` (all), `{type:'unit', unit:'<section>'}`,
`{type:'lesson', topicId}`, `{type:'blank', unit?}`. The wizard's template
toolbar has a scope selector so a teacher downloads / AI-fills / imports one
unit or one lesson at a time. Import always merges by title regardless of
scope, so partial files are safe to re-import.

## Known limitations

- Netlify content gate does not cover topic.html (root page) — access is
  client auth guard + RLS on every fetch instead, same trust model as
  task.html.
- subjects.exam_date is null for teacher subjects → Daily Revise pacing
  uses its default horizon (schema.sql documents this fallback).
- Exam tips and misconceptions each carry an OPTIONAL check MCQ
  (`tips.items[].check`, `misc.items[].check`) — like the platform's `tips`
  readChecks. When present they emit as `tips`/`misc` bank questions and
  render as the card's readCheck on the lesson page. The AI prompt asks for
  them on every tip/misconception; a misconception with no check still
  auto-becomes a True/False so it stays gradable.
- Re-syncing the bank happens on publish changes (publish toggle,
  publish-all, import, saving an already-published topic). After a
  custom-bank rule change, teachers must trigger one of those once for the
  new questions to reach bank_questions.
