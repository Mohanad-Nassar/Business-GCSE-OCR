# Add Maths (OCR FSMQ 6993) — New Activities Build: Full Plan + Handoff

Two remaining engineering phases for Additional Mathematics: **ADM-B** (exam-realistic
answering + a maths mock engine) and **ADM-C** (the Maths Lab — interactive tools/sims).
The 37-lesson content is DONE and LIVE. This document is the step-by-step plan for a
future session, followed by a ruthless handoff prompt.

Source of truth for detail: **`ADDMATHS-CONTENT-PLAN.md`** — §7 (Maths Lab / ADM-C),
§8.2–8.3 (answer widgets / ADM-B), §10.3 (tool Definition of Done), Appendix D (format
enum), §7.1 (the tool→port→pages table). Read those before building.

---

# PART 1 — STEP-BY-STEP BUILD PLAN

## Stage 0 — Deploy what is already staged (PREREQUISITE — blocked this session)
Nothing maths-related renders on the LIVE site until this ships (Netlify deploys from git).
`git commit` was blocked by this session's permission classifier; the working tree is
staged and waiting.

1. Verify staged set with `git diff --cached --name-only`. It should contain, in two logical batches:
   - **Go-live batch:** `subjects/additional-maths/subject.json`, `tools/scaffold_placeholder_subject.py`, `subjects/additional-maths/{page-groups,section-totals,question-bank}.js`, `subjects-index.js`, `page-groups-all.js`, `section-totals-all.js`, `supabase/schema.sql`, `supabase/bank-questions-seed/additional-maths/*.sql`, `supabase/platform-topic-master-seed/additional-maths/*.sql`.
   - **Maths-rendering batch:** `daily-revise.js`, `daily-revise.html`, `review-calendar.js`, `review-calendar.html`, `task.html`, `teacher-worksheets.html`, `teacher-tasks.html`.
2. Commit each batch with a clear message; **push**. (Do NOT `git add -A` — parallel Claude sessions leave unrelated files dirty; stage only the paths above.)
3. Confirm on the live site: open an Add Maths topic → maths renders in Smart Revise, Tasks, Calendar Review.

## Stage ADM-B — Exam realism (typed, auto-marked answers + mock)
Reuse the two proven marking patterns (tick-the-mark-scheme self-mark = DONE/LIVE; string
equality) and add exactly ONE comparator. All exam Qs currently OMIT `format` → they route
to the tick panel. ADM-B introduces new formats.

**B1 — `numeric` comparator + widget** (medium; the load-bearing new piece)
1. Client: register a `numeric` widget in the exam-widgets registry (`cs-lab/exam-widgets.js`, which is now git-tracked and loaded on every Add Maths page). Normalise input: strip spaces/commas/units/currency/`%`; evaluate `a/b`; compare `|u−v| ≤ tol`; plus an **accepted-forms list** for exact surds/fractions.
2. Answer-key shape: `{"numeric":{"B1":{"value":2.45,"tol":0.005,"accept":["-3+2root5","(-6+root80)/2"]}}}`.
3. Server: add a matching `numeric` branch to **ALL FOUR** SQL graders or grading silently diverges: `supabase/topic-grading.sql`, `supabase/tasks-schema.sql`, `supabase/daily-revise-functions.sql`, `supabase/subjects-v2-s5-bank-scope.sql`. Normalisation MUST match the client.
4. Add `numeric` to the LOCKED format enum (Appendix D).
5. **MVP shortcut allowed:** author the single canonical form + "give your answer as a fraction in lowest terms" and keep string equality first (how FIB avoids ambiguity today), then layer the numeric branch.
6. Content pass: re-author the exam Qs that suit typed numeric answering to `format:"numeric"`; rebuild `python tools/build_question_bank.py --subject additional-maths --upload`.
7. Test each grader path (topic page, task, daily-revise, override-scope) returns correct marks.

**B2 — `mathParts` widget** (small–medium)
- Multi-part questions; per-part `q.stubs`/`markPoints` groups; numeric parts auto-mark, method/working marks via the grouped tick panel. Register into the same `CsExamWidgets` registry. No `script.js` seam change needed (`_epUseWidget` keys on `q.format`).

**B3 — Maths mock-exam engine** (large)
- Mirror `subjects/computer-science/mock-exam.html`. A timed 100-mark Paper-1 runner assembled from the Add Maths bank; self-mark + numeric auto-mark; results summary. New file `subjects/additional-maths/mock-exam.html` (+ any shared engine extracted). Call `renderMathIn` after every question insert. Verify timing, assembly (no repeats, correct mark total), and marking.

## Stage ADM-C — the Maths Lab (10th "Practice Lab" tab)
Architecture copied verbatim from the CS Lab. **No Pyodide at MVP** (no COOP/COEP, no CSP
change — KaTeX is already vendored). Progress is **local only in v1**: `geo_mathslab_<pageId>_<tool>`
localStorage; shown in-tab (streaks/badges); NOT in `SECTION_TOTALS`, daily-revise, tasks,
or gamification (containment keeps ADM-C safe to run parallel with anything). House
standards: theme-aware (7 themes incl. 2 dark), keyboard accessible, 44px targets,
lazy-load, `renderMathIn` called by each tool that shows maths.

**C0 — Framework (single-threaded, build FIRST, prove before scaling)**
1. Create `/maths-lab/maths-lab.js`: injects the 10th "Practice Lab" tab; holds the central `PAGE_TOOLS` map (pageId → tools + config), the tool registry, a lazy loader, a tiny UI kit, and a local+cloud persistent store (reuse the `cs_lab_saves` pattern or a `maths_lab_saves` twin).
2. Create `/maths-lab/maths-lab.css` (shared primitives) and `/maths-lab/tools/` (one module per tool).
3. Wire the includes into `tools/scaffold_placeholder_subject.py`'s `{mathrender_include}` block for `slug=="additional-maths"` (mirror how `cs-lab.js`/`cs-lab.css` load on CS pages), so all 37 pages get the tab. Re-scaffold or hand-add to the 37 HTMLs consistently.
4. **Prove with ONE tool on ONE page** (mirror ADM-0 proving KaTeX on lesson 1.3) before scaling.

**C1–C9 — the nine tools** (§7.1 has the authoritative table; per-page content lives INSIDE
each module keyed by pageId — adding activities = edit a module, never a page). Build order
by value:

| # | Tool | Port from | Pages |
|---|---|---|---|
| C1 ⭐ | **mathDrills** | ADAPT `cs-lab/tools/drills.js` engine, new generators (expand/factorise, quadratic formula, completing the square, index/log laws, differentiate/integrate xⁿ, nCr/nPr, surds, recurrence, trig exact values) | 1.1-1.3, 2.2, 2.4, 5.3, 6.1-6.2, 7.2, 8.1, 9.1 |
| C2 ⭐ | **graphExplorer** | ADAPT `cs-lab/tools/media-lab.js` slider-canvas (modes: a,b,c on a quadratic; k·aˣ; y=a·sin(bx+c); chord→tangent as h→0; integral as area) | 3.3, 7.1, 8.1, 9.2 |
| C3 ⭐ | **lpBuilder** | NEW UI (patterned on `cs-lab/tools/logic-lab.js` draw + `net-builder.js` build-and-check): draw boundary lines, shade the NOT-required region, auto-check, read optimum vertex | 4.1, 4.3 |
| C4 | **examinerTrainer** | PORT `cs-lab/tools/examiner-trainer.js`, new rounds from real ER failure modes | every group; concentrated on 11.1 |
| C5 | **stepSolver** | ADAPT `cs-lab/tools/parsons.js` (order-only marking) | 1.3, 2.2, 5.4, 7.4 |
| C6 | **designAnExample** | ADAPT `cs-lab/tools/test-data.js` (one classifier for curated + invented) | 1.3, 1.4, 5.1, 2.4 |
| C7 | **stepVisualiser** | ADAPT `cs-lab/tools/sort-visualiser.js` step-player + predict-next | 9.3, 10.2, 2.1 |
| C8 | **commandWords** | PORT — ⚠ no `command-words.js` source exists; locate in `cs-lab/tools/micro-sims.js` or build fresh | 11.1 (+ bell-ringer) |
| C9 | **chooseTheMethod** | ADAPT — ⚠ `storage-chooser.js` does NOT exist; locate the real source or build fresh | 1.3, 9.3, 10.1 |

Per tool: implement module → register in `PAGE_TOOLS` for its pages → author per-page
content keyed by pageId → verify against §10.3 Definition of Done (theme-aware, keyboard,
44px, lazy-load, graceful failure, `renderMathIn` on any maths, local progress key).

**Agent workflow:** C0 single-threaded. Then one agent per tool (disjoint files under
`/maths-lab/tools/`). `PAGE_TOOLS` in `maths-lab.js` is a shared file — sequence the
registration edits, or design registration so each tool self-registers on load to avoid
collisions. Coordinator independently verifies each tool (DoD + a real render check).

---

# PART 2 — HANDOFF PROMPT

# Handoff: Build Add Maths ADM-B (exam widgets + mock) and ADM-C (Maths Lab, 9 interactive tools)

## Goal
Add the two remaining engineering phases for the already-live OCR FSMQ Additional
Mathematics (6993) subject: ADM-B (typed auto-marked numeric answers, multi-part
`mathParts`, and a maths mock-exam engine) and ADM-C (a "Practice Lab" 10th tab with nine
interactive maths tools/simulations). The 37-lesson content is finished and does not need
rebuilding.

## Current state
- **Content:** 37 lessons / 11 groups built, verified, committed, and **LIVE** in Supabase (subject header + 2021 `bank_questions` + 37 `platform_topic_master` rows uploaded 2026-07-18). Subject shows in My Content → Platform and the class-creation picker.
- **Rendering:** `/math-render.js` + self-hosted KaTeX in `/vendor/katex/`. `renderMathIn(el)` renders `\(...\)` / `\[...\]` after insertion, lazy-loading KaTeX on first use. Wired into `script.js` (topic pages) AND — as of this session — `daily-revise.js/.html`, `review-calendar.js/.html`, `task.html`, `teacher-worksheets.html`, `teacher-tasks.html`.
- **Self-marking:** tick-the-mark-scheme panel (grouped M/A/B `markPoints`) is LIVE via `cs-lab/exam-widgets.js` (now git-tracked, loaded on every Add Maths page; `script.js` `_epUseWidget` routes `written`/no-format questions to it).
- **⚠ NOT COMMITTED:** the go-live files and the 7 maths-rendering files above are **staged, not committed** — `git commit` was blocked by the prior session's permission classifier. They must be committed + pushed before anything new (see Stage 0 in Part 1).
- **Verifiers:** `C:\Users\Public\csbuild\{verify-addmaths-page.js,detect-longest-answer.js,test-mcq-shuffle.js}`.

## Decisions made (do not re-litigate)
- **Reuse the CS Lab architecture verbatim** for ADM-C (`/maths-lab/` mirroring `/cs-lab/`): framework file + one module per tool + shared CSS; per-page content keyed by pageId inside modules.
- **No Pyodide / no CSP or COOP-COEP changes at MVP** — 6993 has no programming; the numeric comparator is small and client-side.
- **Maths Lab progress is LOCAL only in v1** (`geo_mathslab_<pageId>_<tool>`), not in SECTION_TOTALS / daily-revise / tasks / gamification. Promotion is a later, owner-triggered phase.
- **KaTeX self-hosted; delimiters `\(...\)` / `\[...\]` only (never `$`); DOUBLE every LaTeX backslash in JS source.** Store raw LaTeX, render after insert.
- **The `numeric` grader branch must land in all FOUR SQL graders** (`topic-grading.sql`, `tasks-schema.sql`, `daily-revise-functions.sql`, `subjects-v2-s5-bank-scope.sql`) with normalisation identical to the client.
- **MCQ anti-guessing is enforced platform-wide** (deterministic option shuffle in `script.js`; correct answer must not be the strictly longest — `verify-addmaths-page.js` hard-fails). Author new questions accordingly.
- Content build stays the "verbatim from real papers" recipe; do not invent exam questions.

## Open questions
- **key_stage:** the subject is registered as `ks4` (valid; same access tier as the GCSEs). A Level 3 FSMQ is arguably `ks5` — owner to confirm before it matters for access tiers.
- **Build order / scope for the activities:** the owner asked for the plan first and has not chosen which phase (ADM-B vs ADM-C) or which tools to build first. Confirm priority before starting (recommended: Stage 0 deploy → C0 framework + C1 mathDrills pilot → C2 graphExplorer → C3 lpBuilder → ADM-B numeric → remaining tools → mathParts → mock).
- **`command-words.js` / `storage-chooser.js` sources don't exist** (T3/T9) — locate the real source (possibly `cs-lab/tools/micro-sims.js`) or build fresh.
- **Word/.doc export** (`teacher-worksheets.html downloadDoc`) copies rendered KaTeX HTML but not KaTeX's CSS → maths unstyled in Word. Fix only if teachers actually export Add Maths worksheets to Word.

## Constraints
- **Never `git add -A`** — parallel Claude sessions leave unrelated files dirty in the working tree; stage only the specific paths you changed.
- **Sequence agents on shared files** (`maths-lab.js` PAGE_TOOLS, the four SQL graders, `script.js`); one agent per disjoint tool module is safe.
- **Do not touch other subjects' content or banks;** guard every `renderMathIn` call with `typeof renderMathIn === 'function'`; scoped builds only (`--subject additional-maths`).
- **Framework/logic changes go in shared JS, never by hand-editing the 37 topic HTMLs.**
- House UI standards: theme-aware (7 themes, 2 dark), keyboard accessible, 44px targets, lazy-load, graceful failure.
- Verification is real, not assumed: use the `C:\Users\Public\csbuild` verifiers and the playwright-core + cached chromium-1228 harness pattern for actual render/layout checks (Edge headless is dead).

## Next step
Do Stage 0: commit + push the two staged batches (go-live + maths-rendering), then confirm maths renders on the live Smart Revise / Tasks / Calendar Review. Only then start ADM-C C0 (scaffold `/maths-lab/` framework and prove it with one tool on lesson 1.3).

## Context files
1. `ADDMATHS-ACTIVITIES-HANDOFF.md` (this file — Part 1 is the detailed step plan)
2. `ADDMATHS-CONTENT-PLAN.md` §7, §7.1, §8.2–8.3, §10.3, Appendix D
3. `cs-lab/cs-lab.js`, `cs-lab/cs-lab.css` (Lab framework to mirror)
4. `cs-lab/tools/{drills,media-lab,logic-lab,net-builder,examiner-trainer,parsons,test-data,sort-visualiser}.js` (port sources)
5. `cs-lab/exam-widgets.js` (self-mark widget registry to extend for numeric/mathParts)
6. `subjects/computer-science/mock-exam.html` (mock engine to mirror for ADM-B B3)
7. `math-render.js` and one Add Maths topic page (e.g. `subjects/additional-maths/1.3-quadratics-and-completing-the-square.html`) for the rendering + content idiom
8. Supabase graders: `supabase/{topic-grading,tasks-schema,daily-revise-functions,subjects-v2-s5-bank-scope}.sql`
