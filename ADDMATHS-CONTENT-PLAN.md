# ADDMATHS-CONTENT-PLAN.md — OCR Level 3 FSMQ Additional Mathematics (6993) course build

Written 2026-07-17. Owner: Mohanad. Companion to `CS-CONTENT-PLAN.md` (the house
template this plan is modelled on), `PLATFORM-V2-MASTER-PLAN.md` (features) and
`CONTENT-REWRITE-PLAN.md` (copyright programme). This file is the single source of
truth for building the **Additional Maths** subject. It is written so smaller LLM
agents (Opus/Sonnet builders) can execute any step from this file alone, without
re-deriving context.

All primary research lives in `resources/addmaths/research/` (gitignored). Read the
dossier named in each section before building against it — this plan compresses them,
it does not replace them.

**Qualification:** OCR Level 3 FSMQ: Additional Mathematics, entry code **6993**,
component **01**. One written paper, **2 hours, 100 marks, 100% of the grade**,
**calculator permitted throughout**, grades **A–E** (no NEA). First assessment of the
current spec was June 2019; next sitting **Monday 15 June 2026 PM**. Formulae sheet is
printed in the exam booklet (see Appendix A). Full facts: `research/spec-breakdown.md`.

**Why this subject is different from CS/Business/Economics and what that forces:**
1. **Everything is notation.** 100% of content contains fractions, indices, surds,
   trig, calculus symbols the current plain-HTML pipeline cannot render. **KaTeX
   (self-hosted) is a hard prerequisite for the first live page** (§8, ADM-0).
2. **Answers are values and expressions, not prose or MCQ letters.** The platform
   grades by exact string equality today; maths needs numeric-tolerance and
   exact-form marking (§8).
3. **The paper is won or lost on technique** — command words ("exact", "show that",
   "detailed reasoning" = no calculator shortcut), working discipline, notation. Even
   this self-selected top-set cohort sees **~11% U and grade A at only 67–75/100**
   (`research/teaching-structure.md`). Misconceptions and exam-technique activities are
   not garnish here; they are the product.

---

## 0. How to use this file (agents read this first)

- Every work item has an ID (`ADM-0`, `ADM-A-W2`, `T3`, …). Status lives in the tables
  in §9 and §14 (⬜ → 🔄 → ✅). ONLY the coordinator updates this file, from builder
  reports — builders never edit ADDMATHS-CONTENT-PLAN.md.
- A **content builder** agent builds exactly ONE lesson page per run and touches ONLY
  that page file. It follows the recipe in §5, the exam mapping in §6, and the maths
  authoring rules in §8.4. Prompt template: Appendix E1.
- An **engine builder** agent (ADM-R math rendering, ADM-C lab, ADM-B widgets) touches
  shared JS/CSS and must read §7/§8 plus Appendix D. Never run a content builder and an
  engine builder over the same wave if both would edit
  `subjects/additional-maths/subject.json` or the same shared JS.
- The **coordinator** (owner's main session) is the only party that edits the
  scaffolder `SUBJECTS` tree / `subject.json`, `netlify.toml`, shared JS/CSS, deletes
  files, runs `python tools/build_question_bank.py`, and commits. Builders never run
  the pipeline.
- Decisions marked **LOCKED** were made by the owner. Decisions marked **PROPOSED** are
  this plan's recommendation awaiting owner sign-off (§13). Flag new evidence; never
  silently reverse a LOCKED decision.

---

## 1. Decisions

### 1.1 Locked by owner (2026-07-17)

| # | Decision | Detail |
|---|---|---|
| D1 | **Legacy papers quarantined** | Only **current-spec** material (June 2019, 2022, 2023, 2024 + specimen SAM + formulae sheet) is used for exam questions and taxonomy. The 2003–2018 legacy papers are downloaded (`resources/addmaths/papers/legacy-*`) but used for NOTHING in content — the 2018 rewrite added logarithms, numerical methods, nPr/nCr, recurrence and removed the remainder theorem, so legacy questions are off-spec. |
| D2 | **Owner-preferred videos** | The two owner-supplied playlists are the default video sources: **BareauMaths** (48-lesson full course) primary, **CaptainGoodspeed "New Spec"** (31 lessons) secondary. Link by **direct video ID**, never the third-party collection-playlist URL (`research/owner-playlists.md`, `research/video-map.md`). |
| D3 | **Reuse the CS machinery** | The Add Maths build adopts the CS platform's proven contract wholesale: 9 activity tabs, the self-mark tick-the-mark-scheme model, the Practice Lab framework, the mock-exam engine, the `{mark,max,state}` widget contract. It invests new engineering in exactly TWO capabilities: maths rendering and a maths answer comparator (§8). |

### 1.2 Proposed (awaiting owner sign-off — §13)

| # | Proposal | Rationale |
|---|---|---|
| P1 | **Course grain = 11 groups / 37 lesson pages** (§3) | Matches the ~30 teachable-hour one-year twilight delivery model and the Hodder/MEI teaching order; comparable grain to CS (29 pages / 11 groups). |
| P2 | **KaTeX self-hosted under `/vendor/katex/`** as ADM-0/ADM-R, before any page goes live | Current CSP blocks CDN CSS/fonts; self-host needs zero CSP change and survives the content gate (`research/math-rendering-plan.md` §1). |
| P3 | **Marking tiers**: Tier 1 (self-mark + numeric tolerance + exact-form accept-lists) ships the whole course; Tier 2 (MathLive expression entry) and Tier 3 (compute-engine / numeric-sampling equivalence) are opt-in later, lazy-loaded, never on the boot path. | Keeps the shared bundle at zero cost on non-maths pages; ~70/100 marks are markable at Tier 1 (`research/question-taxonomy.md` §5). |
| P4 | **Two new exam formats** (`numeric`, `mathParts`) + a `sketch`/self-check pattern; everything else reuses CS `lines`/`banded`/`tableFill` (§6). | The taxonomy maps 17 OCR forms onto mostly-existing widgets; only value entry and multi-part-with-working are genuinely new. |
| P5 | **Maths Lab** = adapt 7 CS tools (drills, examiner-trainer, command-words, parsons, test-data, step-visualiser, slider-explorer) + 2 new (graph-explorer, LP draw-and-shade). No Pyodide requirement at MVP (§7). | The drills engine and examiner-trainer port as content-authoring exercises; the slider/step patterns are the strongest maths UIs already in the codebase. |

---

## 2. Sources and what each may be used for

All under `resources/addmaths/` (gitignored, local-only — exam-board & third-party
copyright NEVER commits or deploys, same policy as `CS resources/` and `eco resources/`).

| Source | Role | Copy policy |
|---|---|---|
| `spec/OCR-FSMQ-AdditionalMaths-6993-specification-from-2018.pdf` + `research/spec-breakdown.md` | Authoritative scope: the 62 learning outcomes (AL/EN/CG/PT/CA/NM/EL). Appendix B is the per-lesson coverage checklist. | Statement codes & topic titles fine; NEVER copy spec prose — paraphrase from understanding. |
| `papers/2019|2022|2023|2024-QP/MS/ER.pdf`, `papers/specimen-2018spec-QP.pdf`, `papers/formulae-sheet-current.pdf` | The exam-practice source. QP = questions, MS = mark schemes, ER = examiner reports. | VERBATIM allowed, but ONLY inside `examQuestions` fields (`question`/`caseStudy`/`markScheme`/`modelAnswer`) per §6. Examiner-report phrasing NEVER in Learn/MCQ/tips prose. |
| `research/question-taxonomy.md` | The 17-type question catalogue, mark-scheme convention glossary, examiner-report misconception seed list, and per-type online/self-mark mapping. **The exam-authoring contract.** | Internal analysis — use freely. |
| `research/owner-playlists.md`, `research/video-map.md` | Per-lesson video links (BareauMaths primary, CGS secondary) + past-paper walkthroughs. | Standard YouTube embeds/links by video ID. |
| `research/teaching-structure.md` | Delivery models, teaching order, textbook (Hodder 2nd ed.), why students fail, the recommended course map. | IDEAS/structure only. |
| `research/codebase-subject-anatomy.md`, `research/cs-lab-and-mock-inventory.md`, `research/math-rendering-plan.md` | How a subject is born on this platform; the CS Lab/mock/widget inventory with maths-reuse verdicts; the KaTeX + comparator integration plan. | Internal — the engineering contract. |
| Hodder textbook, MEI Integral, OCR delivery/Check-In guides (referenced in teaching-structure) | Activity formats, sequencing, section-check-in framing. | IDEAS ONLY — no prose, no worked examples, no images. |

**Writing rule for ALL teaching content** (Learn cards, MCQs, TF, FIB, match,
misconceptions, tips, flashcards): write from mathematical understanding in our own
words, matching the house voice of the economics exemplar
`subjects/economics/1.2_The_basic_economic_problem.html`. The ONLY verbatim material
anywhere is OCR past-paper material inside `examQuestions` fields.

---

## 3. The page map — 11 groups, 37 pages (P1, awaiting sign-off)

Groups appear on the subject index in this order. Every group is a coherent
server-graded quiz unit. Filenames follow the CS dotted convention
(`<group>.<lesson>-<slug>.html`); page `id` = slugify of `"<group>.<lesson> <title>"`.
Spec codes per lesson are the coverage checklist (full detail: Appendix B). Every page
follows the **GCSE-recap → extend → exam-technique** shape inside it.

Teaching-order constraints (from `research/teaching-structure.md`): Groups 1–2 MUST be
first (algebraic fluency is the #1 predictor of success); Groups 8–10 (calculus) MUST
follow Groups 1–3; Groups 4 and 6 are the re-sequencable "float" units.

| Group (header) | Page file | Spec refs | Notes |
|---|---|---|---|
| **1 · Algebra Toolkit** | `1.1-notation-functions-and-indices.html` | AL1 | index laws recap; f(x) notation |
| | `1.2-surds-and-algebraic-fractions.html` | AL2 | rationalising denominators |
| | `1.3-quadratics-and-completing-the-square.html` | AL5 (+ quadratic formula) | a≠1 completing the square |
| | `1.4-linear-and-quadratic-inequalities.html` | AL7, AL8 | double inequalities; quadratic inequalities |
| **2 · Polynomials & Equations** | `2.1-polynomial-arithmetic-and-division.html` | AL3 | ⚠ new content: algebraic long division |
| | `2.2-the-factor-theorem-and-cubics.html` | AL4, AL6(cubics) | factor theorem; solving cubics |
| | `2.3-setting-up-and-solving-equations.html` | AL6 | linear/quadratic/simultaneous in context |
| | `2.4-sequences-and-recurrence-relationships.html` | AL10, AL11 | recurrence notation + modelling |
| **3 · Coordinate Geometry** | `3.1-straight-lines.html` | CG1, CG2, CG5(part) | distance, midpoint, gradient, parallel/perp |
| | `3.2-circles-tangents-and-normals.html` | CG3, CG5 | general circle eqn; normal (new) |
| | `3.3-sketching-and-plotting-graphs.html` | CG4 | polynomial/trig/exponential families |
| **4 · Linear Programming** | `4.1-inequalities-in-two-variables.html` | AL9, CG6 | regions & shading |
| | `4.2-constraints-and-objective-functions.html` | CG6, CG8 | formulate; objective function |
| | `4.3-solving-lp-problems-graphically.html` | CG7 | ⚠ signature question; shade-the-NOT-region |
| **5 · Trigonometry** | `5.1-trig-ratios-for-any-angle.html` | PT1 | graphs of sin/cos/tan, any angle (degrees only) |
| | `5.2-sine-and-cosine-rules.html` | PT2 | rules + area; **ambiguous case** (new) |
| | `5.3-trigonometric-identities.html` | PT3, PT4 | tanθ≡sinθ/cosθ; sin²+cos²≡1 |
| | `5.4-trigonometric-equations.html` | PT5 | in-interval solving incl. multiple angles (tan 2x) |
| | `5.5-pythagoras-and-trig-in-2d-and-3d.html` | PT6 | ⚠ 3D diagrams — render QP figures when authoring exam Qs |
| **6 · Enumeration & Probability** | `6.1-counting-permutations-and-combinations.html` | EN3, EN4, EN5 | product rule, n!, nPr, nCr |
| | `6.2-the-binomial-expansion.html` | EN1 | (a+b)ⁿ, positive integer n |
| | `6.3-the-binomial-distribution.html` | EN2, EN6 | B(n,p); "at least" complements |
| | `6.4-tree-two-way-and-venn-diagrams.html` | EN2 | draw-then-deduce (Venn every recent year) |
| **7 · Exponentials & Logarithms** | `7.1-exponential-functions.html` | EL1 | k·aˣ and its graph |
| | `7.2-logarithms-and-the-log-laws.html` | EL2, EL3 | definition + 3 laws (must memorise) |
| | `7.3-solving-exponential-equations.html` | EL6, EL7 | aˣ=b; growth & decay |
| | `7.4-reduction-to-linear-form.html` | EL4, EL5 | ⚠ log-log plots; annual 10–11-marker |
| **8 · Differentiation** | `8.1-the-gradient-function.html` | CA1–CA3, NM4, NM5 | differentiate polynomials; chord-gradient lead-in |
| | `8.2-tangents-and-normals.html` | CA4 | |
| | `8.3-stationary-points-and-curve-sketching.html` | CA5–CA7 | nature of; sketch with SPs |
| **9 · Integration** | `9.1-indefinite-integration.html` | CA8–CA10 | reverse of differentiation; +c |
| | `9.2-definite-integrals-and-areas.html` | CA11–CA13 | under a curve; between two curves |
| | `9.3-numerical-areas-and-the-trapezium-rule.html` | NM6–NM8 | rectangles; trapezium rule (provided); over/under-estimate |
| **10 · Kinematics & Numerical Methods** | `10.1-kinematics.html` | CA14, CA15, NM9 | variable acceleration (calculus) + when suvat applies |
| | `10.2-solving-equations-numerically.html` | NM1–NM3 | change of sign, iteration, when methods fail |
| **11 · Exam Preparation** | `11.1-command-words-and-detailed-reasoning.html` | (technique, synoptic) | "exact", show-that, DR, calculator conduct, working standards |
| | `11.2-synoptic-and-unstructured-problems.html` | (technique, synoptic) | mixed-topic, past-paper-based problem solving |

**Coverage check:** all 62 outcomes (AL1–11, EN1–6, CG1–8, PT1–6, CA1–15, NM1–9,
EL1–7) are assigned exactly once. Appendix B is the authoritative statement→page map;
a builder whose lesson cannot fit its Appendix B scope inside the §5.1 size caps STOPS
and proposes a split (D7-style protocol, §11 R3).

**Exam-question routing (coordinator work, before builders run a wave):** unlike CS
(one ExamBuilder PDF per page), the 6993 papers are whole papers. The coordinator
splits each current-spec paper's questions **by spec code** across the lessons using
`research/question-taxonomy.md` (which already cites every question by year+number and
type). A lesson's `examQuestions` is drawn from the pooled 2019/2022/2023/2024 +
specimen questions that match its spec codes. Keep each real question on exactly ONE
lesson (synoptic questions go to the page of their *dominant* skill, with a comment
noting the secondary skills — same "no duplicate rows" rule as CS §6.2).

---

## 4. Platform facts every agent must know (verified 2026-07-17 from `research/codebase-subject-anatomy.md`)

1. **A lesson page is self-contained HTML** with inline `<script>` data arrays; the
   shared engine `/script.js` renders 9 tabs from them: `learn` (`topics`), `mcq`
   (`mcqData`), `matching` (`matchData`), `fib` (`fibData` + `fibWords`),
   `misconceptions` (`miscData`), `examtips` (`examTips`), `flashcards` (`flashcards`),
   `truefalse` (`tfData`), `exampractice` (`examQuestions`). Copy the tab markup +
   array shapes from the exemplar `subjects/economics/1.2_The_basic_economic_problem.html`.
2. **Exact array shapes** (field names matter — the pipeline parses them):
   - `topics[]`: `{ title, tag, content: <HTML template string>, readCheck: { q, opts[4], ans, explain } }`
   - `mcqData[]`: `{ q, opts[4], ans, explain }`
   - `matchData[]`: `{ term, def }` (≥4 pairs to generate bank questions)
   - `fibData[]`: `{ display: "… _____ …", blanks: { B1: "word" } }` + `fibWords[]`
   - `tfData[]`: `{ statement, answer: true|false, explanation }`
   - `miscData[]`: `{ wrong, correct, readCheck }`
   - `examTips[]`: `{ type: "explain"|"tip"|"evaluate", title, pills[], content, readCheck }` — **`pills` is REQUIRED (renderer crashes without it).**
   - `flashcards[]`: `{ term, def }`
   - `examQuestions[]`: `{ num, marks, type: "written"|"mcq", caseStudy|caseId, question, hint, starter, markScheme, modelAnswer }` (+ `options[]`/`answer` for mcq; + widget data + `format` for structured — §6). Shared stimulus: page-level `const EXAM_CASE_STUDIES = { "<id>": "<html>" }` + `caseId`.
3. **Pipeline:** when a page is ready the coordinator removes its `"noQuestions": true`
   from `subjects/additional-maths/subject.json` and runs
   `python tools/build_question_bank.py --subject additional-maths --upload`. **Always
   scope with `--subject additional-maths`** — an unscoped run rebuilds business and
   economics too (their FIB `blankOptions` shuffle with an unseeded RNG → file churn).
4. **Scaffolder — subject.json is OUTPUT, not input.** Source of truth is the
   `SUBJECTS` dict in `tools/scaffold_placeholder_subject.py`. Edit the
   `SUBJECTS["additional-maths"]` tree (§3 map; explicit `(title, file)` tuples for the
   dotted filenames), then `python tools/scaffold_placeholder_subject.py --subject
   additional-maths`. ⚠ **SCAFFOLDER RESET TRAP** (fired 3× on CS): every re-run resets
   EVERY page to `"noQuestions": true`; after ANY scaffolder re-run, diff `subject.json`
   and re-remove `noQuestions` for all live pages BEFORE any pipeline run, or `--upload`
   DELETES their Supabase rows.
5. **Subject registration:** the scaffolder also writes `subjects/additional-maths/
   index.html` from the template; **subject-conditional includes** (`slug ==` checks in
   the scaffolder template) must be extended so Add Maths pages get the maths-render +
   lab + widget `<script>` tags and the index gets a mock-exam link (coordinator-owned,
   ADM-0). The pipeline regenerates the root registries (`subjects-index.js`,
   `page-groups-all.js`, `section-totals-all.js`).
6. **Shared-JS architecture rule:** features/fixes go in shared JS, never into the 35
   page HTMLs; pages hold ONLY their data arrays + the standard scaffold. Auth guards
   redirect to `/index.html`.
7. **`taskRichText` whitelist** (tasks-shared.js) un-escapes only bare tags (no
   attributes). **This is why maths is stored as raw LaTeX, never pre-rendered KaTeX
   HTML** (§8). `pre|code` were added for CS — inherited.
8. **CSP** (netlify.toml): `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`;
   `style-src 'self' 'unsafe-inline' fonts.googleapis.com`; `font-src fonts.gstatic.com
   'self'`. **KaTeX CSS/fonts from a CDN would be BLOCKED** → self-host under `/vendor/`
   (all `'self'`, zero CSP change). Add Maths does NOT need the CS COOP/COEP headers
   (no SharedArrayBuffer).
9. **Content gating:** the WP-A3 edge function gates `/subjects/*`; new pages inherit it
   and robots.txt no-index. Server bank grading fails CLOSED.
10. **Paste-guard:** paste is blocked in `.ep-answer-area` exam boxes; keep it on
    free-working maths answers, OFF on lab tool inputs (students paste starter working).

---

## 5. The per-page content recipe (content builders follow this exactly)

### 5.1 Inputs, size caps, volume targets

**Inputs per page:** (a) the Appendix B spec coverage for the page (the ONLY statement
of scope); (b) the economics exemplar for shapes/voice; (c) the pooled current-spec
exam questions the coordinator routed to this lesson (verbatim material for
`examQuestions` only) + `research/question-taxonomy.md` for how to shape them; (d) §5.3
tab guidance; (e) §8.4 maths authoring rules; (f) the owner-preferred video IDs for
this lesson (`research/owner-playlists.md`). Builders do NOT read the Hodder/MEI
resources — their structural lessons are baked into this plan (clean-room hygiene).

**Size caps:** max 7 Learn cards or ~2,500 words of Learn content. If Appendix B scope
cannot fit, STOP and report a proposed split (e.g. "5.2a sine/cosine rules + 5.2b the
ambiguous case").

**Volume targets** (match economics/CS density):

| Array | Target | Notes |
|---|---|---|
| `topics` | 4-7 cards | every card ends with a `readCheck`; worked example on every calculable skill |
| `mcqData` | 10-12 | at least 3 applied/exam-style stems; distractors = real student errors (5.3) |
| `tfData` | 8 | explanations teach, not just confirm |
| `fibData` | 6-8 | + `fibWords`; definitions, formula completion, keyword recall |
| `matchData` | 10-14 | see 5.3 for the maths pairings that beat term-definition |
| `miscData` | 4-6 | the topic's real examiner-report misconceptions (5.3) |
| `examTips` | 2-4 | command-word/working ladders (5.3) |
| `flashcards` | 12-18 | every spec keyword + every MEMORISE formula relevant to the page |
| `examQuestions` | all routed current-spec questions | verbatim per 6, mapped to engine types |

### 5.2 Build steps (in order)

1. Read the exemplar page once. Read Appendix B + 8.4 for your page.
2. Write `topics` (Learn cards) per 5.3, with maths in `\\(...\\)` / `\\[...\\]` and
   **every backslash doubled** (8.4 - the #1 failure mode).
3. Write practice arrays: `mcqData`, `tfData`, `fibData`+`fibWords`, `matchData`,
   `flashcards`.
4. Write `miscData` (from the ER themes for this topic in `research/question-taxonomy.md`
   4, in our own words) and `examTips` ladders.
5. Process the routed exam questions: transcribe each verbatim + its mark scheme +
   examiner comments; map each to an engine type per 6; author grouped `markPoints`
   (M1/A1/B1) that sum to the tariff; add the `format` hint; write `examQuestions`.
6. Self-verify (all of): the inline script parses (`node --check` on the extracted
   script body); every `ans`/`answer` index correct; every `readCheck` has exactly 4
   opts; blank keys match the `_____`/`___B1___` count; **every LaTeX control word has a
   doubled backslash and no content string contains a bare dollar-brace or an unescaped
   backtick**; no run of 3+ raw underscores inside any `\\(...\\)`; exam `marks` sum
   matches the routed questions; markPoints group maxes sum to `q.marks`; no third-party
   prose outside `examQuestions`.
7. Report done with counts per array + the exam marks total + any flags (split
   proposal, routing doubt). Do NOT edit subject.json or run the pipeline.

### 5.3 Tab-by-tab maths guidance

**Learn cards (`topics`)** - question-led `<h4>` headings phrased as exam-style
questions ("How do you find the equation of a normal to a curve?", "When does the
ambiguous case of the sine rule arise?"). Per card: 3-8 bullets, bold key terms on
first use, one concrete worked example per skill.
- **Worked examples for EVERY calculable skill** (the qualification is procedural):
  numbered steps in a small HTML table, exactly one full worked example + one "now
  check you can" `readCheck`. Show the method the mark scheme rewards, not a calculator
  shortcut (the ER's #1 complaint).
- **Maths renders as maths** - use `\\(...\\)` inline, `\\[...\\]` display, backslashes
  DOUBLED (8.4). Casual symbols (times, div, squared, root, <=, deg) may stay Unicode in
  prose; reserve KaTeX for real structure (fractions, indices, surds, trig, calculus).
- **Diagrams:** hand-authored inline SVG only (axes, a sketched curve with labelled
  turning point/intercepts, a triangle for the sine rule, a shaded LP region). Simple,
  theme-safe (`currentColor`/CSS vars, no fixed white fills). **NEVER extract images
  from a source PDF.** For 3D-trig and structured-context exam questions whose figures
  are in the PDF, the coordinator renders the QP page to PNG at routing time and the
  builder re-authors the figure as SVG or references the supplied asset.
- **Formulae discipline card:** every page whose skills use a formula states clearly
  which are **MEMORISE** (quadratic formula, log laws, sine/cosine rules, both trig
  identities, differentiation/integration of x^n) vs **PROVIDED** on the exam sheet
  (binomial series + nCr, binomial distribution, trapezium rule, kinematics relations)
  - Appendix A. This is a real exam skill and a flashcard theme.
- Tag values - use exactly one of: `Key concept`, `Exam skill`, `Worked example`,
  `Method`, `Common error`, `Real world`.

**MCQs** - cover every spec bullet at least once across mcq+tf; include "evaluate/
predict" stems (compute f(3), state the gradient, give the discriminant's sign);
distractors = **real errors from the examiner reports** (sign not flipped on divide by a
negative, `(x+6)^2` from halving 12 wrong in completing the square, log(ka^n) ->
n*log(ka), integer LP optimum where the true one is non-integer, second angle of the
ambiguous case omitted). Never joke options.

**Matching** - use the pairing the topic needs, not just term-definition:
function-derivative (8.1), curve-its sketch features (3.3), command word-what it demands
(11.1), scenario-which technique (factorise / formula / complete-the-square), identity
-simplified form (5.3), model-its linearised log form (7.4), stationary point-nature
(8.3), value-classification (discriminant -> two/one/no roots).

**FIB** - definitions, **formula completion** (`x = \\(\\frac{-b \\pm \\sqrt{b^2 -
___B1___}}{2a}\\)` -> "4ac"), the log laws, the suvat set, method-step recall. Answer
VALUES stay plain text/number (never LaTeX) so server string-equality still works (8.4
Rule 3). Prefer named `___B1___` blanks for new maths content (immune to phantom-blank
shifting from stray underscores).

**Misconceptions (`miscData`)** - the topic's real ER traps, written as a graded
contrast (weak -> strong) in our own words. Seed list per topic is in
`research/question-taxonomy.md` 4, e.g.: "exact" answered as a decimal (0 marks);
"show that" without the concluding sentence; iteration answers not given to 4 s.f.
before the 3 s.f. conclusion; trapezium rule with h=5 not h=1; coordinates given as an
x-value without its y; a tangent's equation confused with dy/dx; area-between-curves
with wrong limits; LP integer assumption; decimal search claimed without testing the
interval midpoint.

**Exam tips (`examTips`)** - 2-4 ladders per page showing the same answer at 0 -> partial
-> full marks, our own words (no ER quotes outside `examQuestions`). Every page gets a
**command-word ladder** for its dominant form. Calculation pages get a **show-your-
working ladder** (method visible + exact form + units + answer to demanded precision).
Pages carrying a "detailed reasoning" or "show that" form get the **DR ladder** (every
analytical step written; calculator-solve scores 0). Group 11 pages carry the
synoptic/unstructured ladder.

**Flashcards** - every bold Learn term + every spec keyword + every MEMORISE formula for
the page; definitions <= 20 words, self-contained.

**Video** - the page header links the owner-preferred BareauMaths lesson (by direct
video ID) as the default "watch this first", with the CaptainGoodspeed lesson as a
concise recap where one exists (`research/owner-playlists.md` mapping). Exam-practice
pages may embed the per-question 2023 walkthroughs where available (`research/video-map.md`).

---

## 6. Exam questions: adapting OCR's 17 question forms

The full taxonomy - every form cited to a real question, with mark-scheme conventions
and per-type online mapping - is `research/question-taxonomy.md`. **Rule: every form
maps to an existing or one of two NEW engine types - no form is left unmarkable.**
`written` (the `lines` widget) + grouped self-mark handles ~70/100 marks today; the two
new formats and the sketch pattern close most of the rest.

### 6.1 Mapping table

| OCR form (taxonomy section) | tariff | Engine mapping | format hint |
|---|---|---|---|
| Routine solve/evaluate (2.1) | 2-3 | `written` working + final-answer box; auto-mark answer + tick M marks | `numeric` (NEW) or `lines` |
| Show-that / AG (2.2) | 1-4 | `written`, NO answer box; **the concluding sentence is its own compulsory tick point** | `lines` |
| Detailed reasoning (2.3) | 4-8 | `written` + DR banner; tick list enumerates the required visible steps; feedback: calculator-only = 0 | `lines` |
| Exact-value (2.4) | 2-6 | `written` + final-answer box with an **accepted-forms list** (surd/fraction variants); "decimal only = 0" feedback | `numeric` |
| Plot-on-grid (2.5) | 1-4 | **sketch/overlay self-check**: static grid + student plots (on paper or future click-to-plot), reveal correct-graph overlay, tick a half-square feature checklist | `sketch` (NEW pattern) |
| Sketch-a-graph (2.6) | 1-2 | overlay + feature checklist (shape, asymptote, intercept in range, turning point) | `sketch` |
| Linear programming (2.7) | 6-12 | split: (a) inequality entry auto-checked (symbol required); (b) draw+shade -> LP lab widget or paper+overlay; (c) optimisation `numeric` + non-integer note | `mathParts` + `sketch` |
| Set-up-a-model (2.8) | 6-12 | `written` with per-step stubs; AG steps as show-that; **units-in-answer its own tick point** | `mathParts` |
| Multi-part structured a-b-c (2.9) | 7-13 | existing multi-part + shared `caseId`; "Hence" banner; ft guidance text on dependent parts | `mathParts` |
| Unstructured problem-solving (2.10) | 5-8 | single large `lines`; grouped markPoints incl. full alternative-method groups with a shared cap; hints OFF in exam mode | `lines` |
| Enumeration/probability (2.11) | 2-6 | numeric with exact-fraction acceptance; two-way table -> `tableFill`; Venn/tree -> draw + overlay checklist | `numeric` / `tableFill` / `sketch` |
| Calculus routine (2.12) | 4-6 | `written` + coordinate-pair answer entry; "coordinates as PAIRS" its own tick point | `numeric` / `mathParts` |
| Log-linearisation pipeline (2.13) | 10-11 | multi-part: short numeric + show-that + `tableFill` (log values, tolerance) + plot overlay + wide-band `numeric` for anti-logged constants | `mathParts` + `sketch` |
| Trig equations (2.14) | 2-5 | **multi-answer numeric entry** (all solutions in range, 1 dp tolerance) - fully auto, ideal drill; exact parts as 2.4 | `numeric` |
| Numerical methods (2.15) | 2-4 | iteration = numeric sequence (each iterate to 4 s.f.); trapezium = numeric + "formula seen" tick; "which difference" / "how to improve" -> MCQ | `numeric` / `mcq` |
| Coordinate geometry (2.16) | 2-5 | `written` + final-equation entry (accept `oe` forms via accept-list; Tier 3 equivalence later) | `mathParts` |
| 1-mark interpret/explain (2.17) | 1 | MCQ or one-line text vs accept-list | `mcq` / `lines` |

### 6.2 Authoring rules for `examQuestions`

- Transcribe question text, mark-scheme bullets, "How the marks are given" rules, and
  Examiner's Comments into the same three-section `markScheme` HTML as the exemplar
  (`marks-section` divs: Mark Scheme - N marks (AOx) / How the marks are given /
  Examiner's Comments). Maths in the markScheme renders raw (not through taskRichText),
  so `\\(...\\)` is fine there and in Learn cards.
- **`markPoints` is REQUIRED and grouped to model M/A/B marks** (contract:
  `docs/SELF-MARK-POINTS-AUTHORING.md`). One group per scheme row; put the mark label
  in the point text ("M1 - you differentiated: every power dropped by 1", "A1 - answer
  given as a coordinate pair (x, y)"). Group maxes sum to `q.marks`. Alternative methods
  = alternative groups sharing a cap. **UX rule to honour (8.2): an A-tick stays disabled
  until its M-tick is ticked - "M0 A1 cannot ever be awarded".**
- `modelAnswer`: a clean full-marks answer in our own words, structured, exactly
  answering the command word, exact form where required.
- `hint`: one sentence pointing at the trap or required structure. `starter`: the
  expected answer format ("give x as an exact surd", "coordinates as (x, y)", "state all
  solutions in 0 to 360 degrees").
- **`format` hint** - use exactly one of the enum in Appendix D; omit `format` for plain
  written items (defaults to `lines`). The pipeline drops unknown fields from bank rows,
  so `format` and widget data live only in the page arrays (which is where the widgets
  read them) - same as CS.
- **No duplicates across pages.** Synoptic questions live on the page of their dominant
  skill; record skipped/relocated questions in a comment above `EXAM_CASE_STUDIES`.
- **Answer-box sizing is automatic** (`linesForBox`, ~1 line/mark); override an uneven
  split with `q.stubLines`. Do not hand-set heights (the CS retro: `.ep-answer-area`
  `min-height` beats inline `height` - any maths widget using that class must reset
  `min-height:0`).
- **Formulae sheet:** every Add Maths exam surface (topic exam tab + mock) carries a
  persistent "Formulae" toggle showing Appendix A, and prints it as page 2 of blank
  mock papers.

---

## 7. Interactive activities - the Maths Lab (phase ADM-C)

Add Maths pages get a 10th tab, **Practice Lab**, holding the interactive tools the
subject needs. Architecture is copied verbatim from the CS Lab
(`research/cs-lab-and-mock-inventory.md`): a `/maths-lab/` folder with `maths-lab.js`
(framework: injects the tab, holds the central `PAGE_TOOLS` map pageId->tools+config,
the tool registry, lazy loader, tiny UI kit, and a local+cloud persistent store -
reuse the `cs_lab_saves` pattern or a `maths_lab_saves` twin), one module per tool under
`/maths-lab/tools/`, and `maths-lab.css` (shared primitives). Per-page task content
lives INSIDE each module keyed by pageId - adding activities = edit a module, never a
page. House standards: theme-aware (7 themes incl. 2 dark), keyboard accessible,
44px targets, lazy-load, graceful failure, `renderMathIn` called by each tool that
shows maths.

**No Pyodide at MVP.** 6993 has no programming; the maths comparator (8) is small and
client-side. (The Pyodide worker pattern stays available as a Tier-3 option for
sympy-based algebraic equivalence later - not on the MVP path, so Add Maths pages skip
the CS COOP/COEP headers.)

### 7.1 Tool specifications (verdicts from the CS-lab inventory)

| ID | Tool | Port | What it does | Pages |
|---|---|---|---|---|
| T1 | **mathDrills** | ADAPT `drills.js` engine AS-IS, new generators | Infinite procedurally-generated rounds (10 Qs), instant marking, "show working" reveal, streak/best. Generators: expand/factorise, quadratic formula, completing the square, index laws, surd simplification, log laws, differentiate/integrate x^n, nCr/nPr, binomial coefficients, recurrence terms, trig exact values. The `digitgrid` field kind supports a column-working/fraction input. **The single highest-value engine for maths.** | 1.1-1.3, 2.2, 2.4, 5.3, 6.1-6.2, 7.2, 8.1, 9.1 |
| T2 | **examinerTrainer** | PORT `examiner-trainer.js` AS-IS, new rounds | Student plays examiner: reads a flawed worked solution, ticks which M/A/B points to award, compares to the senior-examiner verdict with per-point commentary. Rounds authored from real ER failure modes (M earned, A lost to a sign slip; show-that assuming the result; missing working). **Directly trains the self-marking skill the whole exam depends on.** | every group; concentrated on 11.1 |
| T3 | **commandWords** | PORT AS-IS, new lexicon | Quick-fire: match OCR command word to what it demands; given a stem, how many distinct things the answer needs. Lexicon: exact, show that, hence, determine, prove, sketch vs plot, "detailed reasoning". | 11.1 (+ bell-ringer on every page) |
| T4 | **stepSolver** | ADAPT `parsons.js` | Drag the shuffled steps of a worked solution/proof into order, with plausible wrong steps as distractors. Content: complete-the-square chain, solve a trig equation, factor-theorem cubic solve, reduction-to-linear-form pipeline. Order-only marking. | 1.3, 2.2, 5.4, 7.4 |
| T5 | **designAnExample** | ADAPT `test-data.js` "design your own" | Student invents a value/object of a required class, checked programmatically: "give a quadratic with two/one/no real roots" (discriminant classifier), "an angle where sin is negative", "a sequence that converges". Curated + student-invented examples share one classifier so they can't drift. | 1.3, 1.4, 5.1, 2.4 |
| T6 | **stepVisualiser** | ADAPT `sort-visualiser.js` step-player | Animated step-through with a "predict the next step" quiz: interval bisection / decimal search root-finding, iteration converging to a fixed point, trapezium-rule strips accumulating, polynomial long division. | 9.3, 10.2, 2.1 |
| T7 | **graphExplorer** | ADAPT `media-lab.js` slider-canvas + live-linked pattern (NEW content) | Drag sliders / coefficients; graph + equation update live. Modes: effect of a,b,c on a quadratic; k*a^x growth/decay; y=a*sin(bx+c); chord->tangent as h->0 (numerical gradient); the definite integral as area filling under a curve. The single best maths UI already in the codebase. | 3.3, 7.1, 8.1, 9.2 |
| T8 | **lpBuilder** (NEW UI) | NEW (patterned on `logic-lab` draw + `net-builder` build-and-check) | On a unit grid: draw boundary lines and click half-planes to shade the NOT-required region (house exam convention), auto-check against the constraints, then read the optimum vertex. LP appears EVERY year (4+ marks) - the strongest case on the whole paper for a bespoke widget. | 4.1, 4.3 |
| T9 | **chooseTheMethod** | ADAPT `storage-chooser.js` | Scenario -> pick the right technique (factorise vs formula vs complete-the-square; trapezium vs exact integration; suvat vs calculus) -> tick the 2 justifying reasons. The `alt` credited-alternative field mirrors real mark schemes. | 1.3, 9.3, 10.1 |

**Standing owner instruction (inherited from CS):** when building any theory page, ask
"is there an activity that would teach this better?" and propose additions to
`PAGE_TOOLS`/tool content rather than skipping them.

**Local progress only in v1** (as CS): Lab completion under `geo_mathslab_<pageId>_<tool>`
localStorage keys; shown in-tab (streaks/badges), NOT counted in `SECTION_TOTALS`,
daily-revise, tasks or gamification. Containment keeps ADM-C safe to run parallel with
content waves. Promotion to bank/gamification is a later, owner-triggered phase.

### 7.2 CSP / vendor changes (one-time)

Only KaTeX/MathLive vendoring (8) - no `wasm-unsafe-eval`, no jsDelivr `connect-src`,
no COOP/COEP (no Pyodide/sql.js at MVP). If Tier-3 sympy equivalence is ever built,
it reuses the CS Pyodide pattern and its own scoped headers then.

---

## 8. Maths rendering & answer marking - the two new capabilities

Full engineering contract: `research/math-rendering-plan.md`. This is the load-bearing
new work; everything else is content authoring against proven machinery.

### 8.1 Rendering stack (ADM-R, part of ADM-0)

- **KaTeX 0.17.0, self-hosted under `/vendor/katex/`** (271 KB JS + 24 KB CSS + 20
  woff2 fonts ~= 260 KB; ship woff2 only). MIT. Self-host = zero CSP change and survives
  the content gate. `contrib/auto-render.min.js` wrapped in ONE shared helper
  `renderMathIn(container)` in a new `/math-render.js`.
- **Delimiters: `\\(...\\)` inline, `\\[...\\]` display - NEVER dollar signs** (currency
  clashes; dollar-brace is template-literal interpolation that the build parser
  hard-errors on).
- **Render AFTER sanitised insertion; never store pre-rendered KaTeX HTML.** Store raw
  LaTeX; `renderMathIn` walks text nodes after each insert. Delimiters survive
  `taskRichText`/sanitisers as plain text; KaTeX's attributed spans would be stripped by
  them - so render-after-insert is mandatory, not optional.
- **Integration points** (call `renderMathIn` after each insert) - the checklist is
  `research/math-rendering-plan.md` 5: the 9 activity builders + `rebuildAllActivities`
  + async server MCQ/TF renders + exam-practice + self-mark panel in script.js; and
  `task.html`, `daily-revise.js`, `review-calendar.js`, `teacher-worksheets.html` (incl.
  print + standalone export must `<link>` the vendored CSS), `teacher-tasks/analytics`,
  and the future maths mock runner. Shared surfaces **lazy-load** KaTeX the first time a
  container's text contains `\\(`/`\\[` (a 5-line sniff inside `renderMathIn`), so
  non-maths pages carry zero new bundle.
- Theme/print/copy-protect all "just work": KaTeX inherits `currentColor` (dark themes
  follow `--ink`), prints crisply, and its spans inside protected containers inherit the
  copy blocking. `throwOnError:false` -> bad LaTeX shows red source, never a blank page.

### 8.2 Answer marking (Tier 1 ships the course)

Reuse the two proven patterns before inventing anything: **self-mark tick-the-mark-
scheme** (grouped markPoints = M/A/B) and **exact string equality**.

**DONE in ADM-0 (2026-07-17):** the tick-the-mark-scheme self-mark panel is LIVE on Add
Maths. `cs-lab/exam-widgets.js` is loaded on every Add Maths page (scaffolder include, in
the `{mathrender_include}` block, before `/script.js`). It is self-contained (no CsLab
framework dependency) and registers the `lines`/`banded` widgets; `script.js`'s
`_epUseWidget` seam routes every `written` question (format absent → `lines`) to it, so a
student reveals the scheme and ticks each M1/A1/B1 point they earned, capped at the
tariff — identical to CS. Maths renders in the panel via a guarded
`renderMathIn(panel)` added to `buildSelfMarkPanel` (no-op on CS/Business/Economics,
which don't load math-render.js). ⚠ `exam-widgets.js` is an **uncommitted CS-B file** —
Add Maths + CS-B commit together. Add exactly one new comparator on top of this:
- **`numeric` widget + comparator** - plain input, client normalise (strip spaces/
  commas/units/currency/percent; accept `a/b` and evaluate; compare `|u-v| <= tol`) with
  an **accepted-forms list** for exact surd/fraction answers. Answer key shape
  `{"numeric":{"B1":{"value":2.45,"tol":0.005,"accept":["-3+2root5","(-6+root80)/2"]}}}`.
  Server: a `numeric` branch must land in **all four duplicated SQL graders**
  (`topic-grading.sql`, `tasks-schema.sql`, `daily-revise-functions.sql`,
  `subjects-v2-s5-bank-scope.sql`) or grading silently diverges. MVP shortcut: author
  the single canonical form + "give your answer as a fraction in lowest terms" and keep
  string equality (exactly how FIB avoids ambiguity today) - then add the numeric branch.
- **`mathParts` widget** - registered into the existing `CsExamWidgets` registry (rename
  cosmetic or extract to a shared name; the `script.js` seam `_epUseWidget` keys on
  `q.format` and needs no change). Per-part `q.stubs`/`markPoints` groups: numeric parts
  auto-mark, working/method marks via the grouped tick panel; ft via guidance text.

### 8.3 Tiers 2-3 (opt-in, later, lazy-loaded, never on boot)

- **Tier 2 - MathLive `<math-field>`** (844 KB, MIT) for real expression entry
  (expand/factorise/differentiate) with a virtual keyboard for surds/fractions/powers,
  loaded only on expression-entry pages.
- **Tier 3 - equivalence checking**: `@cortex-js/compute-engine` (~1.8 MB) OR cheaper
  **numeric sampling** (evaluate student vs key at 5-8 random domain points, equal
  within 1e-9 => equivalent). Client-side + self-mark fallback; never a new server
  grader. Handles the `oe` coordinate-geometry equation problem.

### 8.4 Maths authoring rules (content builders MUST follow - verified in `research/math-rendering-plan.md` 3)

1. **Delimiters `\\(...\\)` / `\\[...\\]`, never dollar signs.**
2. **DOUBLE every LaTeX backslash in JS source**: write `\\frac{1}{2}`, `\\sqrt`,
   `\\pm`, `\\(`, `\\)`. A single backslash is silently eaten twice (browser + build), no
   error - the #1 failure mode. (Live proof of the trap: `1.2.3-units.html:275`'s
   `<\strong>` renders as `<strong>`.)
3. **FIB blanks vs LaTeX**: single underscore for subscripts (`x_1`, `a_n`) is safe
   (blank regex needs >=3 underscores). NEVER put a run of 3+ raw underscores inside
   `\\(...\\)`. FIB answer VALUES stay plain text/number, never LaTeX (must survive
   `lower(btrim())`). Prefer named `___B1___` blanks for maths.
3b. **A FIB blank marker must sit in PLAIN TEXT, never between `\\(` and `\\)` (or
   `\\[`/`\\]`).** A blank becomes a `<select>`/`<input>`; if it is inside a math
   region it splits the LaTeX text run, so KaTeX can't match the delimiters and renders
   the whole region as raw source (the "confusing dropdowns inside broken LaTeX" bug,
   fixed on 1.3 2026-07-17). Keep every `\\(...\\)` a complete, self-contained
   expression and phrase the sentence so the answer is a plain-text token beside it —
   e.g. NOT `\\( x = \\frac{-b \\pm \\sqrt{b^2 - ___B1___}}{2a} \\)` but
   "In `\\( x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)` the denominator is ___B1___".
   The verifier `verify-addmaths-page.js` fails any page that breaks this.
4. **Never author a bare dollar-brace or an unescaped backtick in any content string**
   (both break the template literal / build parser). Maths never needs them.
5. `\\text{...}` allowed; keep its body free of unescaped percent, ampersand, hash,
   dollar, backticks.
6. Casual Unicode symbols (times, div, squared, root, <=, deg) fine in prose; KaTeX for
   real structure.

### 8.5 Rendering/marking acceptance tests (ADM-0 exit gate)

From `research/math-rendering-plan.md` 10: vendor assets serve 200 with zero CSP
violations; a build round-trip fixture keeps `\frac` intact through pipeline->SQL; FIB
safety (no phantom blanks from subscripts); `taskRichText` passthrough + render-after-
insert; a playwright screenshot of all 9 tabs on a logged-in fixture page showing
`.katex` nodes and no raw `\\(` left, repeated after RESET and in server-grade mode;
theme matrix (midnight/obsidian) colour + fraction-bar visibility; copy-protect
interplay; worksheet print; numeric normaliser unit tests; task/daily-revise render +
correct-answer grading still returns full marks.

---

## 9. Phases, waves and status

**Dependency spine:** ADM-0 (skeleton + KaTeX + one proof page) -> ADM-A content waves
(parallelisable, teaching order) with ADM-C lab tools built just-in-time -> ADM-B
(numeric/mathParts widgets + maths mock) -> later bank/gamification promotion.

Unlike CS, **the rendering engine (ADM-0/ADM-R) blocks the first live page** - no maths
page is legible without KaTeX. So ADM-0 is heavier than CS-0 and must land first.

| ID | Scope | Prereqs | Status |
|---|---|---|---|
| **ADM-0** Walking skeleton | (1) `SUBJECTS["additional-maths"]` in the scaffolder = the §3 tree (11 groups, explicit dotted filename tuples). (2) Run scaffolder (writes subject.json + index.html + 37 pages). (3) Vendor KaTeX under `/vendor/katex/` + write `/math-render.js` (`renderMathIn`, lazy sniff). (4) Wire `renderMathIn` into all §8 integration points in script.js + shared surfaces. (5) Extend the scaffolder subject-conditional includes so Add Maths pages emit the math-render (+ later lab/widget) script tags. (6) Build **1.3 quadratics & completing the square** fully as the proof page (all 9 tabs incl. routed exam Qs). (7) Run the §8.5 acceptance tests + ui-reviewer on 1.3. (8) Owner review -> recipe LOCKED or tuned. | KaTeX decision (P2) | 🔄 steps 1–7 DONE 2026-07-17 (KaTeX 0.18.0 vendored; math-render.js; 6 renderMathIn wires in script.js; scaffolder + 37 pages; 1.3 built = 5 topics·12 mcq·8 tf·8 fib·12 match·5 misc·3 tips·14 cards·2 exam/5 marks; verifier + playwright render test + build round-trip all PASS; bank generated NOT uploaded). **Wiring into shared surfaces (task.html/daily-revise/worksheets/mock) = ADM-B, deferred.** Deferred within step 4: only script.js wired so far. AWAITING step 8 owner review + `--upload` go-live decision |
| **ADM-A-W1** | Group 1 (1.1-1.4) - Algebra Toolkit | ADM-0 | 🔄 all 4 pages BUILT + verified 2026-07-17 (3 parallel builders; coordinator re-verified each + recomputed exam maths; bank rebuilt = 229 Qs / 4 pages, NOT uploaded). AWAITING owner review + go-live |
| **ADM-A-W2** | Group 2 (2.1-2.4) - Polynomials & Equations | W1 conventions | 🔄 all 4 pages BUILT + verified 2026-07-17 (4 parallel builders; coordinator re-verified each + recomputed every cubic/division/recurrence vs real papers; bank rebuilt = 429 Qs / 8 pages, NOT uploaded). AWAITING owner review + go-live |
| **ADM-A-W3** | Group 3 (3.1-3.3) - Coordinate Geometry | ADM-0 | 🔄 3 pages BUILT+verified 2026-07-17 (coordinator recomputed 2023 Q9/Q12, 2019 Q10, 2024 Q6 vs papers; builder caught a wrong root hint from coordinator — recomputed to 0.5; bank=596 Qs/11 pages, NOT uploaded) |
| **ADM-A-W4** | Group 4 (4.1-4.3) - Linear Programming | ADM-0 | 🔄 3 pages BUILT+verified 2026-07-17 (coordinator recomputed 2023 Q10, 2024 Q16 non-integer optimum 2.5, 2019 Q11 profit £412 vs papers). NOT uploaded |
| **ADM-A-W4** | Group 5 (5.1-5.5) - Trigonometry | ADM-0 | ⬜ |
| **ADM-A-W5** | Group 6 (6.1-6.4) + Group 7 (7.1-7.4) - Enumeration + Exp/Logs | ADM-0 | ⬜ |
| **ADM-A-W6** | Group 8 (8.1-8.3) + Group 9 (9.1-9.3) - Calculus | W1-W2 (algebra secure) | ⬜ |
| **ADM-A-W7** | Group 10 (10.1-10.2) + Group 11 (11.1-11.2) - Kinematics/NM + Exam Prep | W4, W6 | ⬜ |
| **ADM-C-1** | Maths Lab framework `/maths-lab/maths-lab.js` + `.css` (tab, PAGE_TOOLS, lazy loader, local+cloud store), include on all 37 pages + scaffolder template, `supabase/maths-lab-saves.sql` | ADM-0 | ⬜ |
| **ADM-C-2** | Tool modules T1-T9 (drills/examiner-trainer/command-words port; parsons/test-data/sort-visualiser/slider/storage-chooser adapt; lpBuilder new), per-page content inside modules, node unit tests per tool | ADM-C-1 | ⬜ |
| **ADM-B** | `numeric` + `mathParts` exam widgets + numeric SQL grader branch (all 4 files) + maths mock-exam engine (clone of `mock-exam.*`, formulae-sheet panel, KaTeX in print) + `mock-papers/` from the current-spec papers | ADM-0 (+ ideally W1-W3 data) | ⬜ |
| **ADM-D** | Bank/gamification promotion of Lab activity (owner-triggered, deferred) | ADM-A done + ADM-B proven | ⬜ |

**Wave ordering rationale:** algebra first (fluency is the #1 predictor); calculus waves
(W6) after algebra is secure; exam-prep (W7) last so it can reference finished content.
Groups 4 and 6 are re-sequencable floats. The owner can reorder to match the class's
teaching timetable at any time - waves are independent after ADM-0.

---

## 10. Agent workflow

### 10.1 Parallelisation rules (hard rules)

- One content builder per page; a wave runs <=3 builders concurrently, each owning
  exactly one file under `subjects/additional-maths/`.
- `subject.json`, shared JS/CSS, `netlify.toml`, `/vendor/`, `/math-render.js`,
  `/maths-lab/`, and pipeline runs belong to the coordinator ONLY, serialized.
- Engine work (ADM-R/ADM-B/ADM-C) never runs concurrently with another engine agent on
  the same files; it MAY run alongside content builders (disjoint files).
- Before any session: `git status` + `git log --oneline -5` - parallel sessions land
  commits mid-stream (the owner runs several Claude sessions; Opus builders drop mid-run
  and resume via SendMessage, so design pages so a resumed agent can Edit-append the
  missing `const` arrays).
- **Exam-question routing is coordinator work done BEFORE a wave** - the coordinator
  pools the current-spec questions by spec code (per the taxonomy) and hands each
  builder the exact list for its lesson, plus any PNG-rendered figures. Builders never
  guess which questions are theirs.

### 10.2 Definition of done - content page

Split honestly (topic pages sit behind `topic-guard.js` - an unauthenticated builder
CANNOT click through the live page; do not claim you did):

**Builder verifies:** (1) all 10 data consts present (9 arrays + `fibWords`; +
`EXAM_CASE_STUDIES` if used), §5.1 targets met or a documented flag; (2) the inline
script parses (`node --check` on the extracted script); (3) structural assertions -
every `ans`/`answer` in range and correct, every readCheck exactly 4 opts, `blanks`
keys match each display's blank count, **every LaTeX control word double-backslashed, no
bare dollar-brace/backtick, no 3+ raw underscores inside `\\(...\\)`**, exam `marks` sum
matches the routed questions, markPoints group maxes sum to `q.marks`; (4) no third-party
prose outside `examQuestions`, no spec sentences; (5) **recompute every numeric answer
and re-derive every worked example** (the maths equivalent of CS running its code).

**Coordinator verifies (before commit):** removes `noQuestions`, runs the scoped
pipeline, checks `section-totals.js` counts, then - logged in - loads the page via the
subject index, opens every tab, confirms **KaTeX renders on every tab with no raw `\\(`
and no console errors**, and spot-checks 3 MCQs, 1 FIB, 1 matching round, 2 exam
questions end-to-end. Commits the slice.

### 10.3 Definition of done - Lab tool / widget

Tool exercised on its first real page: loads lazily, marks correct/incorrect on 5 manual
attempts incl. edge inputs, renders maths, works in a dark theme + phone width, survives
reload (progress persists), fails gracefully. numeric comparator has node unit tests
(tolerance, exact-form accept-list, fraction eval). ui-reviewer on the first page each
tool ships; code-review before merge; security-auditor on ADM-B (new SQL grader branch).

### 10.4 Builder prompts

Templates in Appendix E. Every delegation includes the goal, the ONE file owned, what
NOT to touch, the routed exam-question list, the DoD, and where to report. Vague
delegation produces confidently wrong maths.

---

## 11. QA gates

1. **Self-check** (builder, §5.2 step 6 + numeric re-derivation).
2. **Checker agent** per wave (fresh context): every fact against Appendix B scope;
   **every answer key recomputed** (redo every calculation/derivation - a maths checker
   must actually do the maths, not eyeball it); mark schemes match the source PDF;
   markPoint group maxes sum to the tariff; `format` values only from the Appendix D
   enum; **maths-authoring lint** - no single-backslash control words, no phantom FIB
   blanks, no bare dollar-brace; leakage scan (no Hodder/MEI prose, no spec sentences,
   ER language only inside examQuestions). Leakage calibration: flag lifted SENTENCES,
   not shared terminology (standard maths notation/method names always match).
3. **Rendering acceptance tests** (§8.5) once at ADM-0 and re-run on the first page of
   each wave (KaTeX in a new activity shape can regress).
4. **ui-reviewer** on ADM-0's 1.3 page and each new Lab tool/widget's first page.
5. **security-auditor** on ADM-B (numeric SQL grader branch in all 4 files, any new
   answer path) before deploy.
6. **Owner (teacher) sign-off** per wave - the human gate. The owner is a maths teacher;
   a wrong worked example or mis-tariffed mark scheme is the failure that matters most.
7. **Pipeline integrity** every run: scoped runs (`--subject additional-maths`) leave
   business/economics/CS per-subject files untouched (`git status`); on any full rebuild
   check COUNTS not bytes (unseeded FIB shuffle). Add Maths counts = sum of builder
   reports.

---

## 12. Risks & unknowns (resolve riskiest first)

| # | Risk | Mitigation / resolution step |
|---|---|---|
| R1 | **KaTeX rendering regression** - a surface that inserts bank text without `renderMathIn` shows raw `\(x^2\)` | The §8 integration list is the checklist; the lazy-load sniff makes late additions cheap; §8.5 acceptance tests run at ADM-0 and per wave. Degraded, never broken (`throwOnError:false`). |
| R2 | **Backslash discipline** - one un-doubled `\` silently corrupts (browser + build both eat it, no error) | The #1 failure mode. Build lint flags single `\`+letter inside maths-subject strings; page-load dev console warning; checker lint (QA gate 2). |
| R3 | **Fat lessons** (2.1 poly division, 4.3 LP, 5.5 3D trig, 7.4 reduction to linear form, 8.3 stationary points) | D7-style protocol - builder stops and proposes a split; budget +2-4 pages if several split. |
| R4 | **Numeric/exact-form marking brittleness** - accept-lists miss a valid form; `oe` equations hard to auto-mark | Tier 1 = author the canonical form + instruct the required form (as FIB does) with self-mark fallback; the tick-scheme always backs auto-marking; Tier 3 equivalence deferred. |
| R5 | **Four duplicated SQL graders** - a numeric branch in only some files makes task/daily-revise/topic grading diverge | Land the branch in ALL FOUR (`topic-grading.sql`, `tasks-schema.sql`, `daily-revise-functions.sql`, `subjects-v2-s5-bank-scope.sql`) in one ADM-B change; security-auditor confirms. |
| R6 | **Figures/grids vanish in PDF text extraction** (3D trig, LP grids, structured contexts) | Coordinator renders QP pages to PNG (pymupdf `get_pixmap`) at routing time; builder re-authors as SVG or uses the asset. Same trap as CS (fired 3x there). |
| R7 | **Scaffolder reset trap** - re-run re-flags live pages `noQuestions`, next `--upload` deletes their rows | Standing rule (§4.4): diff subject.json after any scaffolder re-run, re-remove `noQuestions` before any pipeline run. |
| R8 | **OneDrive/long-path tooling failures** (parentheses + length break some Python) | Helper scripts in `C:\Users\Public\csbuild\`; never inline Python one-liners over the repo path; pipeline runs from repo root. |
| R9 | **2025 paper still embargoed** (releases ~mid-2026) | Re-check the OCR assessment page before finalising the bank/mocks; a 5th current-spec paper may shift tariff percentages slightly. |
| R10 | **Small single-teacher video channels** (BareauMaths 4K subs, CGS 1.4K) could pull videos | Store video IDs + titles in the manifest; periodic link-check; BareauMaths is the ONLY source for 5 sub-topics (reduction to linear form, ambiguous sine, chord-gradient, nCr, 3D trig). |
| R11 | **Scope creep** into AS Maths beyond the 62 statements (radians, e/ln, chain rule, trig calculus) | Guardrails in every calculus/trig page: degrees only, polynomial-only calculus, 2D coordinate geometry only. Appendix B is the ceiling. |

---

## 13. Open items for the owner (sign-off needed)

1. **Approve the course grain** (P1: 11 groups / 37 pages) or adjust to the class
   timetable.
2. **Approve KaTeX self-hosted** (P2) and the marking-tier plan (P3) - this is the only
   real engineering investment; everything else reuses CS machinery.
3. **Confirm the two new formats** (P4: `numeric`, `mathParts`) and that a paper-companion
   `sketch` self-check is acceptable for plot/draw/Venn questions at MVP (a click-to-plot
   / LP-shade widget is the ADM-C stretch).
4. **Maths Lab tool list** (P5) - any tools to add/drop for how you teach.
5. **Run `supabase/maths-lab-saves.sql`** once ADM-C-1 lands (cloud save of lab work).
6. **ADM-D trigger** - when should Lab activity count toward XP/streaks and Daily Revise?
   (Deferred, as CS.)
7. **Exam-question routing review** - the coordinator's split of real questions across
   lessons is a judgement call on synoptic questions; a quick owner glance per wave.

---

## 14. Page status board

| # | Page | Built | Checked | Exam Qs in | Live |
|---|---|---|---|---|---|
| 1.1 | Notation, functions & indices | ✅ 2026-07-17 (7·12·8·8·14·6·3·17) | ✅ coord | — none standalone (AL1) | 🔄 bank built, NOT uploaded |
| 1.2 | Surds & algebraic fractions | ✅ 2026-07-17 (7·12·8·8·12·5·3·16) | ✅ coord | ✅ 2023 Q4 (a)+(b), 5 marks | 🔄 bank built, NOT uploaded |
| 1.3 | Quadratics & completing the square (ADM-0 proof page) | ✅ 2026-07-17 (5·12·8·8·12·5·3·14) | ⬜ owner | ✅ 2024 Q3 (a)+(b), 5 marks | 🔄 bank built, NOT uploaded |
| 1.4 | Linear & quadratic inequalities | ✅ 2026-07-17 (7·12·8·8·12·5·3·15) | ✅ coord | ✅ 2024 Q1 + 2019 Q2 + 2022 Q1, 10 marks | 🔄 bank built, NOT uploaded |
| 2.1 | Polynomial arithmetic & division | ✅ 2026-07-17 (6·11·8·7·12·5·3·15) | ✅ coord | ✅ 2023 Q3, 3 marks | 🔄 bank built, NOT uploaded |
| 2.2 | The factor theorem & cubics | ✅ 2026-07-17 (6·11·8·7·12·5·3·14) | ✅ coord | ✅ 2024 Q8 + 2019 Q7, 10 marks | 🔄 bank built, NOT uploaded |
| 2.3 | Setting up & solving equations | ✅ 2026-07-17 (6·11·8·7·11·5·3·14) | ✅ coord | ✅ 2023 Q16 (a-d), 10 marks | 🔄 bank built, NOT uploaded |
| 2.4 | Sequences & recurrence relationships | ✅ 2026-07-17 (6·11·8·8·12·5·3·15) | ✅ coord | ✅ 2024 Q5, 3 marks | 🔄 bank built, NOT uploaded |
| 3.1 | Straight lines | ✅ 2026-07-17 (6·12·8·8·14·5·3·14) | ✅ coord | ✅ 2023 Q9, 5 marks | 🔄 bank built, NOT uploaded |
| 3.2 | Circles, tangents & normals | ✅ 2026-07-17 (7·12·8·8·12·5·3·16) | ✅ coord | ✅ 2023 Q12 + 2019 Q10, 12 marks | 🔄 bank built, NOT uploaded |
| 3.3 | Sketching & plotting graphs | ✅ 2026-07-17 (7·12·8·7·14·5·3·16) | ✅ coord | ✅ 2024 Q6, 5 marks (sketch/overlay pattern) | 🔄 bank built, NOT uploaded |
| 4.1 | Inequalities in two variables | ✅ 2026-07-17 (6·12·8·8·14·5·3·16) | ✅ coord | ✅ 2023 Q10, 6 marks | 🔄 bank built, NOT uploaded |
| 4.2 | Constraints & objective functions | ✅ 2026-07-17 (6·12·8·8·14·5·3·16) | ✅ coord | — none standalone (on 4.3) | 🔄 bank built, NOT uploaded |
| 4.3 | Solving LP problems graphically | ✅ 2026-07-17 (6·12·8·8·14·5·3·15) | ✅ coord | ✅ 2024 Q16 + 2019 Q11, 23 marks | 🔄 bank built, NOT uploaded |
| 5.1 | Trig ratios for any angle | ⬜ | ⬜ | ⬜ | ⬜ |
| 5.2 | Sine & cosine rules | ⬜ | ⬜ | ⬜ | ⬜ |
| 5.3 | Trigonometric identities | ⬜ | ⬜ | ⬜ | ⬜ |
| 5.4 | Trigonometric equations | ⬜ | ⬜ | ⬜ | ⬜ |
| 5.5 | Pythagoras & trig in 2D and 3D | ⬜ | ⬜ | ⬜ | ⬜ |
| 6.1 | Counting, permutations & combinations | ⬜ | ⬜ | ⬜ | ⬜ |
| 6.2 | The binomial expansion | ⬜ | ⬜ | ⬜ | ⬜ |
| 6.3 | The binomial distribution | ⬜ | ⬜ | ⬜ | ⬜ |
| 6.4 | Tree, two-way & Venn diagrams | ⬜ | ⬜ | ⬜ | ⬜ |
| 7.1 | Exponential functions | ⬜ | ⬜ | ⬜ | ⬜ |
| 7.2 | Logarithms & the log laws | ⬜ | ⬜ | ⬜ | ⬜ |
| 7.3 | Solving exponential equations | ⬜ | ⬜ | ⬜ | ⬜ |
| 7.4 | Reduction to linear form | ⬜ | ⬜ | ⬜ | ⬜ |
| 8.1 | The gradient function | ⬜ | ⬜ | ⬜ | ⬜ |
| 8.2 | Tangents & normals | ⬜ | ⬜ | ⬜ | ⬜ |
| 8.3 | Stationary points & curve sketching | ⬜ | ⬜ | ⬜ | ⬜ |
| 9.1 | Indefinite integration | ⬜ | ⬜ | ⬜ | ⬜ |
| 9.2 | Definite integrals & areas | ⬜ | ⬜ | ⬜ | ⬜ |
| 9.3 | Numerical areas & the trapezium rule | ⬜ | ⬜ | ⬜ | ⬜ |
| 10.1 | Kinematics | ⬜ | ⬜ | ⬜ | ⬜ |
| 10.2 | Solving equations numerically | ⬜ | ⬜ | ⬜ | ⬜ |
| 11.1 | Command words & detailed reasoning | ⬜ | ⬜ | ⬜ | ⬜ |
| 11.2 | Synoptic & unstructured problems | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Appendix A - 6993 assessment intelligence (for tip/exam-question authors)

- **One paper**, 2 h, 100 marks, calculator throughout, all questions compulsory,
  difficulty gradient, integrated answer booklet (ruled boxes + printed grids + a spare
  copy of every grid + extra-space pages).
- **AO weighting:** AO1 54-58% (routine technique), AO2 20-24% (reason/communicate),
  AO3 20-24% (problem-solving/modelling). A realistic mock mirrors this.
- **Guaranteed each paper:** some synoptic (unguided combination of >=2 statements),
  some extended response (the 10-13-mark closers), **at least one unstructured
  problem-solving question**, and 3-4 "detailed reasoning" questions.
- **Command words (verbatim contract, spec §2b):** *Exact* (surd/fraction/pi form -
  decimal-only = 0), *Show that* (result given; every step + concluding sentence),
  *Determine* (justification required), *Give/State/Write down* (no working needed),
  *"In this question you must show detailed reasoning"* (full analytical method;
  calculator-solve scores 0 even if the answer is right), *Hence* (use the previous
  result), *Plot* (accurate on the grid), *Sketch* (main features, not to scale), *Draw*
  (reasonable accuracy).
- **MEMORISE (not provided):** quadratic formula; index laws; **log laws**; sine &
  cosine rules; area = 1/2 ab sin C; tan = sin/cos and sin^2 + cos^2 = 1; mensuration
  (circle, Pythagoras, trapezium area, prism volume); d/dx(x^n) = n x^(n-1); integral of
  x^n = x^(n+1)/(n+1) + c; area = integral of y dx.
- **PROVIDED on the exam formulae sheet (do NOT make students memorise):** binomial
  series + nCr = n!/(r!(n-r)!); binomial distribution P(X=x) = nCx p^x (1-p)^(n-x);
  trapezium rule (1/2)h{(y0+yn) + 2(y1+...+y(n-1))}, h=(b-a)/n; kinematics -
  variable-acceleration relations (v=ds/dt, a=dv/dt=d^2s/dt^2, s=integral v dt,
  v=integral a dt) AND the constant-acceleration suvat set (v=u+at, s=ut+1/2at^2,
  s=1/2(u+v)t, v^2=u^2+2as, s=vt-1/2at^2).
- **Guardrails (never exceed):** degrees only (no radians); calculus is polynomials only
  (n a non-negative integer) - no trig/exp/log calculus, no chain/product/quotient rule;
  coordinate geometry is 2D only; logs to any base (log10 typical), no e or ln.
- **Calculator conduct printed in the spec:** write down any expression evaluated on the
  calculator; use correct maths notation not calculator notation.

## Appendix B - Per-lesson spec coverage (the builder's scope statement)

Compressed from `research/spec-breakdown.md` §3 (the 62 statements). Each lesson lists
its statement codes and the content it MUST teach. "[new]" = beyond GCSE (AS-level);
recap the GCSE antecedent then extend.

**1.1 Notation, functions & indices** - AL1: algebraic vocabulary/notation (constant,
coefficient, expression, equation, identity, index, variable, unknown, f(x)); index-law
recap (a^x a^y = a^(x+y) etc.).
**1.2 Surds & algebraic fractions** - AL2: simplify algebraic fractions (e.g.
1/(x-1) - 2/(x+1)) and surds (root12 + root27), rationalise denominators (1/(2+root3)).
**1.3 Quadratics & completing the square** - AL5: complete the square ax^2+bx+c =
a(x+p)^2+q incl. a!=1; the quadratic formula (memorise); exact roots.
**1.4 Linear & quadratic inequalities** - AL7 manipulate inequalities; AL8 solve linear
& quadratic inequalities algebraically and graphically incl. double inequalities
(1/3 < (2x-1)/5 < 1).
**2.1 Polynomial arithmetic & division** - AL3 [new]: add/subtract/multiply/divide
polynomials incl. algebraic long division ((x^3-3x^2-x-3)/(x-3)).
**2.2 The factor theorem & cubics** - AL4 [new] factor theorem to find linear factors
(NOT the remainder theorem - removed in 2018); AL6(cubics) solve cubics via factor
theorem.
**2.3 Setting up & solving equations** - AL6: set up & solve linear, quadratic and cubic
equations, and simultaneous equations in two unknowns, in maths & real contexts.
**2.4 Sequences & recurrence relationships** - AL10 [new] recurrence notation
(x(n+1)=x(n)+a, x(n+1)=a x(n), x(n+2)=x(n+1)+x(n)) to describe/determine sequences; AL11
recurrence in modelling (compound interest).
**3.1 Straight lines** - CG1 distance root((x2-x1)^2+(y2-y1)^2); CG2 midpoint;
CG5(part) gradient, intercept, parallel/perpendicular.
**3.2 Circles, tangents & normals** - CG3 [new] general circle (x-a)^2+(y-b)^2=r^2;
CG5 tangent and **normal** [new] at points defined by equations/inequalities.
**3.3 Sketching & plotting graphs** - CG4 sketch & plot linear, polynomial,
trigonometric and exponential functions (from factorised form / stationary-point info).
**4.1 Inequalities in two variables** - AL9 illustrate linear inequalities in two
variables (shading, e.g. 24x+28y<=400); CG6 express real situations as linear
inequalities.
**4.2 Constraints & objective functions** - CG6 formulate constraints; CG8 [beyond
GCSE] definition of the objective function and find it in 2D cases.
**4.3 Solving LP problems graphically** - CG7 [beyond GCSE] use graphs of linear
inequalities to solve 2D maximisation/minimisation; shade-the-NOT-region convention;
non-integer optima are valid.
**5.1 Trig ratios for any angle** - PT1 definitions & graphs of sin/cos/tan for any
angle (degrees only).
**5.2 Sine & cosine rules** - PT2 sine & cosine rules incl. the **ambiguous case** for
sine [new]; area = 1/2 ab sin C.
**5.3 Trigonometric identities** - PT3 [new] tan = sin/cos; PT4 [new] sin^2 + cos^2 = 1.
**5.4 Trigonometric equations** - PT5 [new] solve simple trig equations in a given
interval incl. multiple angles (tan 2x = 0.5 for 0<=x<=360).
**5.5 Pythagoras & trig in 2D and 3D** - PT6 apply Pythagoras & trig to 2D and 3D
problems (angle of greatest slope). [Figures are printed - render QP pages.]
**6.1 Counting, permutations & combinations** - EN3 product rule for counting (6^n
outcomes, n! arrangements); EN4 [new] permutations nPr; EN5 [new] combinations nCr.
**6.2 The binomial expansion** - EN1 [new] binomial expansion of (a+b)^n for positive
integer n (expand (2+3x)^5); nCr provided.
**6.3 The binomial distribution** - EN2 binomial distribution B(n,p) [new]; EN6 [new]
probability problems incl. "at least" complements (P of >=2 sixes in 5 dice).
**6.4 Tree, two-way & Venn diagrams** - EN2: construct & use tree diagrams, two-way
tables, Venn diagrams to enumerate outcomes.
**7.1 Exponential functions** - EL1 know & use k*a^x and its graph (a>0), growth/decay.
**7.2 Logarithms & the log laws** - EL2 [new] log_a x as inverse of a^x; EL3 [new] the
three log laws (memorise).
**7.3 Solving exponential equations** - EL6 [new] solve a^x=b via logs; EL7 [new]
exponential growth & decay problems.
**7.4 Reduction to linear form** - EL4 [new] convert y=k a^x and y=k x^n to linear form
using logs; EL5 [new] estimate k and a (or k and n) from the linearised graph's
gradient/intercept.
**8.1 The gradient function** - CA1-CA3 [new] differentiate k x^n (n a non-negative
integer) and sums; gradient function = gradient of curve = rate of change = gradient of
tangent; NM4 chord estimate of a tangent's gradient; NM5 improving the estimate.
**8.2 Tangents & normals** - CA4 [new] find the equation of a tangent and normal at a
point (normal to y=x^3-2x+3 at (1,2)).
**8.3 Stationary points & curve sketching** - CA5 [new] stationary points; CA6 [new]
determine their nature; CA7 [new] sketch a curve with known stationary points.
**9.1 Indefinite integration** - CA8 [new] integrate k x^n and sums; CA9 integration is
the reverse of differentiation, +c (curve from gradient function + a point); CA10
indefinite vs definite integral.
**9.2 Definite integrals & areas** - CA11 [new] evaluate definite integrals; CA12 area
between a curve, two ordinates and the x-axis; CA13 area between two curves.
**9.3 Numerical areas & the trapezium rule** - NM6 rectangular strips to estimate area;
NM7 [new] the trapezium rule (provided on the sheet); NM8 over/under-estimate and how to
improve.
**10.1 Kinematics** - CA14 [new] differentiate/integrate w.r.t. time for variable
acceleration (s,v,a); CA15 recognise when the constant-acceleration suvat formulae apply;
NM9 numerical methods in context (velocity from a displacement-time curve).
**10.2 Solving equations numerically** - NM1 [new] change-of-sign root location; NM2
simple iterative method (calculator ANS key); NM3 [new] recognise when numerical methods
fail. (Uses AL10 recurrence notation.)
**11.1 Command words & detailed reasoning** - exam technique: the command-word contract
(Appendix A), calculator conduct, "detailed reasoning"/"exact"/"show that" discipline,
working & notation standards. No new content statements - a technique consolidation page.
**11.2 Synoptic & unstructured problems** - mixed-topic, past-paper-based problem-solving
practice; recognising which combination of techniques a question needs. No new content.

## Appendix C - Notation & authoring quick reference (the ONLY LaTeX rules builders need)

```
Delimiters:  \\(  inline  \\)        \\[  display  \\]      (NEVER dollar signs)
ALWAYS double the backslash in JS source:  \\frac{a}{b}  \\sqrt{x}  \\pm  \\times
Fractions   \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
Indices     x^2   x^{n+1}   a^{-1}          Subscripts  x_1   a_n   x_{n+1}
Surds       \\sqrt{12}   2\\sqrt{5}          Roots list ok: single _ is safe in FIB
Trig        \\sin\\theta  \\cos^2\\theta  \\tan 2x   (degrees only, e.g. 0^\\circ)
Calculus    \\frac{dy}{dx}   \\frac{d^2y}{dx^2}   f'(x)   \\int_a^b y\\,dx   \\dot{x}
Logs        \\log_a x        Binomial  {}^nC_r   \\binom{n}{r}
Inequality  \\le  \\ge  \\ne          Multi-line  \\begin{aligned} ... \\\\ ... \\end{aligned}
```
FIB answer VALUES are ALWAYS plain text/number ("6", "x=2", "minimum"), NEVER LaTeX
(they must survive lower(btrim()) server equality). Prefer named ___B1___ blanks.
NEVER: a bare dollar-brace, an unescaped backtick, or 3+ raw underscores inside \\(...\\).
Casual prose symbols may stay Unicode (times, div, root, squared, <=, degrees).

## Appendix D - format enum (LOCKED strings; any other value is a defect)

Add `format` to every non-plain exam item. Omit it for plain
solve/show-that/detailed-reasoning written items (defaults to `lines`).

| OCR form | format |
|---|---|
| Numeric / exact-value / trig-equation answer entry | `numeric` (NEW) |
| Multi-part with working (a/b/c, models, log-linearisation) | `mathParts` (NEW) |
| Plot / sketch / Venn / tree (paper + overlay self-check) | `sketch` (NEW) |
| Complete a table (log values, function values) | `tableFill` (reuse CS) |
| 6/8-mark banded extended response | `banded` (reuse CS) |
| Tick-one / MCQ | `type:"mcq"` |
| (plain written: solve, show-that, DR, unstructured) | omit -> `lines` |

## Appendix E - Delegation prompt templates

### E1. Content builder (one page)

> Build the lesson page `subjects/additional-maths/<FILE>` for the OCR FSMQ Additional
> Maths (6993) course. You own ONLY this file. Do not touch subject.json, shared JS/CSS,
> /vendor, /math-render.js, /maths-lab, other pages, this plan, or any build tool. Read
> first: ADDMATHS-CONTENT-PLAN.md §4, §5, §6, §8.4, Appendix A/B (YOUR lesson's entry)/C/D;
> the exemplar `subjects/economics/1.2_The_basic_economic_problem.html` (shapes + voice);
> and `resources/addmaths/research/question-taxonomy.md` for how to shape exam questions.
> The scaffolded page exists - replace ONLY the data consts (`topics`, `mcqData`,
> `matchData`, `fibData`, `fibWords`, `tfData`, `miscData`, `examTips`, `flashcards`,
> `examQuestions`, + `EXAM_CASE_STUDIES` if used); change the header note to remove
> "coming soon"; do NOT modify `pageMeta` (its id feeds bank ids). Content scope =
> Appendix B for your lesson ONLY; write all teaching content from mathematical
> understanding in your own words; RECOMPUTE every worked example and answer key.
> Maths uses `\\(...\\)`/`\\[...\\]` with EVERY backslash doubled (Appendix C - the #1
> failure mode). Exam questions: the coordinator has given you the exact list of routed
> current-spec questions (year Qn) + any rendered figures - transcribe each verbatim
> with its mark scheme + examiner comments into `examQuestions`, map per §6.1, add the
> `format` hint, author grouped `markPoints` (M1/A1/B1) whose group maxes sum to
> `q.marks`. **If no questions were routed to you: set `examQuestions = []`, report
> "exam Qs pending", and NEVER invent past-paper material.** Size caps per §5.1 - if
> scope won't fit, STOP and propose a split. Verify per §10.2 BUILDER portion (parse
> check + structural + maths-authoring lint + recomputed answers; the live page is behind
> an auth guard - do not claim browser checks). Report: counts per array, exam marks
> total, flags. "Done except verification" is not done.

### E2. Checker (one wave)

> You are the checker for wave <W> pages <LIST> of the Add Maths (6993) build. Read
> ADDMATHS-CONTENT-PLAN.md §2, §5, §6, §8.4, §11 and Appendix A/B/C/D. For each page:
> verify every fact against the Appendix B scope; **recompute every answer key and
> redo every worked example** (actually do the maths); check mark schemes match the
> source PDF and markPoint group maxes sum to the tariff; run the maths-authoring lint
> (no single-backslash control words, no bare dollar-brace/backtick, no 3+ raw
> underscores inside `\\(...\\)`, FIB answer values are plain not LaTeX); `format` values
> only from the Appendix D enum; NO prose from Hodder/MEI/the spec (flag lifted
> SENTENCES, not shared notation); examiner-report language only inside examQuestions.
> Produce a numbered defect list with file:line refs and severity. Do not edit files.

---

*Retro log (append one line per delivered wave: what would have made it faster/safer?)*

- (none yet - build not started; ADM-0 is the first gate.)
