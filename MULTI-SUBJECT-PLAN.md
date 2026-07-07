# Vidya — Multi-Subject Platform: Phase-1 Architecture Plan

Approved 2026-07-07. This is the working reference for converting the single-subject
Business GCSE site into **Vidya**, a multi-subject platform (launch: GCSE Business
OCR J204 · Computer Science OCR J277 · Economics OCR — architecture supports KS3–KS5).
Site is pre-launch: schema resets are acceptable; no live data to migrate.

## Locked product decisions

- **Brand:** Vidya (Sanskrit "knowledge"). Marigold accent `#c77f1f`; paper-and-ink
  "polished evolution" design language; per-subject colours (Business `#7a5c9e`,
  CS `#1a6b6b`, Economics `#2d7a4f`). Gamification mechanics unchanged, restyled.
- Students see only subjects they're enrolled in (hub hides the rest).
- `Extra/` and `exam_prep/` move under `subjects/business/`.
- CS gets extra activity types at launch (see "CS activities" below).
- Internal `geo_`/`gcse_` storage prefixes are renamed to `vidya_` during the rebrand.

## The two load-bearing decisions

1. **Subject-prefixed page ids** — every `page_id` becomes `<subject_slug>:<topic-slug>`
   (e.g. `business:1-1-role-of-business-enterprise`), applied centrally:
   - runtime: `getPageId()` in script.js prepends `window.SUBJECT.slug`
   - build: `tools/build_question_bank.py` prefixes ids in every output
   Content files are never hand-edited for this. It makes localStorage progress keys,
   `progress_summary`/`progress_events`, topic grants/visibility and question-bank ids
   subject-safe with almost no new columns (subject derivable via
   `split_part(page_id, ':', 1)`).
2. **Class membership = subject enrollment.** A class belongs to one subject
   (`classes.subject_id`); a student's subject list is derived from their classes
   (`get_my_subjects()` RPC). No separate enrollments table. Convention (UI-enforced):
   one class per student per subject.

## Supabase changes

- New `subjects` table: `slug, name, key_stage (ks3|ks4|ks5), level, exam_board,
  spec_code, exam_date, colour, icon, sort_order, active` — RLS read-all; seeded by the
  pipeline from each subject manifest. `exam_date` replaces the hardcoded date in
  `get_daily_revise_queue`.
- `classes` + `subject_id` FK (the master scoping). `bank_questions` + `subject_slug`
  column + `(subject_slug, page_id)` index. `daily_revise_stats` PK becomes
  `(student_id, subject_slug)`. `flight_path_snapshots` keyed per subject.
  Everything else (tasks chain, topic-access tables, progress tables, profiles) is
  unchanged — reached via class or the page-id prefix.
- RPC fixes (all the `order by cs.joined_at limit 1` one-class assumptions):
  `record_progress` (topic-access override — the live copy), `get_my_topic_settings(p_subject)`
  (⚠ also re-declared in class-flow-settings.sql — update + re-run BOTH, that file last),
  `request_topic_access` (derive from prefix), `get_daily_revise_settings/queue(p_subject)`.
  `get_my_streak()` stays global (one cross-subject streak). Fold changes into the
  canonical SQL files (no migration files) and rebuild the Supabase project once.
- Netlify: `generate-students.js` passes `subject_id` on class creation; others unchanged.

## File/URL structure

```
/index.html                      ← subjects hub ("My subjects")
/subjects-index.js               ← GENERATED registry (window.SUBJECTS)
/page-groups-all.js              ← GENERATED all topic trees (small)
/section-totals-all.js           ← GENERATED merged totals
/subjects/business/
    subject.json                 ← manifest: source of truth (replaces PAGES + PAGE_GROUPS)
    index.html                   ← subject landing, rendered from PAGE_GROUPS (subject-home.js)
    1_1_...html × 38             ← moved from root; shared assets referenced root-absolutely
    page-groups.js               ← GENERATED (window.SUBJECT + window.PAGE_GROUPS)
    section-totals.js            ← GENERATED
    question-bank.js             ← GENERATED per subject (~4.3MB each — never combined)
    extra/, exam_prep/           ← moved from root
/subjects/computer-science/ ...  /subjects/economics/ ...
```

- Topic pages get one relative include `<script src="page-groups.js">` (that's how a page
  knows its subject); shared assets become root-absolute (`/script.js`) — local preview
  therefore needs `python -m http.server`, not file://.
- `dashboard.html?subject=…` and `daily-revise.html?subject=…` load their subject's
  generated files via a small synchronous `subject-loader.js`; `task.html` derives the
  subject from the task's class. `badges.html`/profile stays cross-subject (merged files).
- `progress-shared.js` drops the PAGE_GROUPS literal (keeps SECTIONS, flatPages,
  renderTopicFilterGrid, rings…). Old root URLs get netlify.toml redirects.
- Teacher pages: class list shows subject chips; class creation picks a subject;
  teacher-tasks/worksheets dynamically load `/subjects/<slug>/question-bank.js` for the
  selected class's subject.

## Pipeline (tools/build_question_bank.py)

`python tools/build_question_bank.py [--subject slug] [--legacy]` — discovers
`subjects/*/subject.json`, keeps the existing parser/hashing/snapshot-answer_key split,
emits per-subject `question-bank.js`, `page-groups.js`, `section-totals.js` + merged root
`-all` files + `subjects-index.js`, seeds `bank_questions` with `subject_slug`, and
upserts the `subjects` row from the manifest header. `--legacy` reproduces today's
root outputs (unprefixed) for byte-diff verification. A one-time helper generates
`subjects/business/subject.json` from the current PAGE_GROUPS/PAGES literals
(no hand transcription), including the `2_4_marketing_mix` no-questions special case.

## Rollout steps (each leaves the site working)

1. Manifest extraction (no behaviour change) + Python assert manifest ≡ PAGES ≡ PAGE_GROUPS.
2. Pipeline v2 in compat mode; byte-diff legacy output vs committed files; diff new output
   modulo `business:` prefix.
3. Schema rebuild: fold subjects/subject_id/RPC changes into SQL files; reset project; run
   files in order (schema → tasks → topic-access → class-flow-settings LAST → bank/daily-revise);
   reseed via pipeline. Smoke-test RPCs incl. student-token answer-key invariant.
4. The big flip (one commit): move 38 pages + extra/exam_prep, rewrite asset refs
   root-absolute, insert page-groups include, getPageId prefixing, PAGE_GROUPS out of
   progress-shared, subject-loader + ?subject params, topic-guard/tasks-shared RPC updates,
   netlify redirects. Verify with a served-site link checker + full student/teacher E2E.
5. Subjects hub + subject landing shell + teacher subject-awareness (chips, picker,
   dynamic bank loading).
6. Prove subject #2 end-to-end with 2–3 real CS topic pages before bulk-generating CS +
   Economics content.

Steps 1–2 are non-destructive (new files only). Steps 3–4 are the restructure —
do not start them without explicit go-ahead.

## CS activities (CONFIRMED 2026-07-07)

Same 9 base types as Business, plus for Computer Science (all three approved):
- **Code tracing** — short Python/pseudocode, student predicts output (auto-marked).
- **Algorithm ordering** — arrange shuffled lines/steps into working order (Parsons-style).
- **Data-representation drills** — binary ↔ denary ↔ hex conversions, generated fresh
  each attempt (infinite practice, auto-marked).

Economics uses the standard 9 types.

## Economics topic tree (CONFIRMED 2026-07-07 — provided by user, OCR GCSE Economics J205)

Unit 1. Introduction to Economics
  1.1 Main Economic Groups and Factors of Production · 1.2 The Basic Economic Problem
Unit 2. The Role of Markets and Money
  2.1 The Role of Markets · 2.2 Demand · 2.3 Supply · 2.4 Price · 2.5 Competition ·
  2.6 Production · 2.7 The Labour Market · 2.8 The Role of Money and Financial Markets
Unit 3. Economic Objectives and the Role of Government
  3.1 Economic Growth · 3.2 Low Unemployment · 3.3 Fair Distribution of Income ·
  3.4 Price Stability · 3.5 Fiscal Policy · 3.6 Monetary Policy ·
  3.7 Supply-Side Policies · 3.8 Limitations of Markets
Unit 4. International Trade and the Global Economy
  4.1 Importance of International Trade · 4.2 Balance of Payments · 4.3 Exchange Rates ·
  4.4 Globalisation

(22 topics / 4 units. Filenames follow the user's naming, e.g.
`1.1_Main_economic_groups_and_factors_of_production.html` — note dots not underscores in
the numeric prefix, unlike Business's `1_1_...` pattern; the manifest's per-page `file`
field absorbs this difference, no renaming required.)

## Content sources (CONFIRMED 2026-07-07; amended same day; scaffolding DONE 2026-07-07)

- **⚠ AMENDMENT: do NOT generate CS/Economics content yet.** Both subjects ship as
  PLACEHOLDERS: real `subject.json` manifests with their confirmed topic trees, and a
  real topic HTML page per entry (same tab-bar/9-activity-panel shell as Business, same
  shared-JS includes) — but every page is marked `"noQuestions": true` and its data
  arrays are empty except one "🚧 coming soon" Key Learning card. `noQuestions` pages are
  filtered out of `question_pages()` (build_question_bank.py:377) BEFORE any file is
  opened, so they're fully inert to the pipeline — zero parsing, zero risk of placeholder
  content ever reaching Daily Revise/tasks/worksheets.
- **Built by `tools/scaffold_placeholder_subject.py`** (re-runnable; only fills in missing
  pages by default, `--force-pages` to regenerate all): `python tools/scaffold_placeholder_subject.py --subject computer-science --subject economics`.
  Generated 11 CS pages (2 units) + 22 Economics pages (4 units, using the user's own
  exact filenames verbatim — sentence-case, e.g. `1.1_Main_economic_groups_and_factors_of_production.html`,
  not title-case). Verified: business unchanged (3074 questions/37 pages, byte-identical),
  CS/Econ produce 0 questions from 0 pages (fully skipped as designed), all 33 pages'
  inline scripts parse in V8, `page-groups.js` per subject has the right page count, and
  the whole thing serves correctly over HTTP.
- **Sync mechanism proven live**, not just asserted: built a disposable `_scratch_sync_test`
  subject with 2 real MCQs + 1 TF + 1 learn-readCheck (no noQuestions), ran the pipeline
  scoped to it, confirmed correct subject-prefixed ids/counts/seed SQL, then deleted it
  and rebuilt clean (registries back to exactly business/computer-science/economics,
  business numbers unchanged). **The real workflow when content is ready for a page:**
  remove that page's `"noQuestions": true` from `subjects/<slug>/subject.json`, fill in
  its `topics`/`mcqData`/`tfData`/`fibData`/`matchData`/`miscData`/`examTips`/`flashcards`/
  `examQuestions` arrays (shape = any `subjects/business/*.html`), run
  `python tools/build_question_bank.py --upload`. No code changes needed — same one-command
  sync as Business (SETUP.md "Keeping content in sync").
- **Consciously deferred, not forgotten:** CS's 3 extra activity types (code tracing,
  algorithm ordering, data-representation drills) are NOT built into these placeholder
  pages — they're a separate, substantial feature (new data schema + rendering + auto-marking
  + a new pipeline SOURCE type each) belonging to a future phase, not this scaffolding pass.
  CS placeholder pages currently offer the same 9 standard tabs as every other subject.
- **Economics (when green-lit later):** all 22 topic pages + question banks AI-generated
  from the OCR J205 spec, reviewed by the user before publish.
- **Computer Science (when green-lit later):** generate from the OCR J277 spec. Proposed
  tree (standard J277, pending passive confirmation):
  - Unit 1 Computer systems: 1.1 Systems Architecture · 1.2 Memory and Storage ·
    1.3 Computer Networks, Connections and Protocols · 1.4 Network Security ·
    1.5 Systems Software · 1.6 Ethical, Legal, Cultural and Environmental Impacts
  - Unit 2 Computational thinking, algorithms and programming: 2.1 Algorithms ·
    2.2 Programming Fundamentals · 2.3 Producing Robust Programs ·
    2.4 Boolean Logic · 2.5 Programming Languages and IDEs
- **Exam dates:** placeholders — CS 2027-05-17, Economics 2027-05-19 (both provisional;
  correct in `subjects.exam_date` when the real timetable lands. Business stays 2027-05-12).

## Verification toolchain

No Node. Python esprima + py_mini_racer (V8) for JS syntax/logic; `python -m http.server`
+ browser for E2E; scripted PostgREST smoke tests for RPCs/RLS.
