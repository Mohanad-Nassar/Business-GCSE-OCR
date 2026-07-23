# CS-CONTENT-PLAN.md — OCR GCSE Computer Science (J277) course build

Written 2026-07-12. Owner: Mohanad. Companion to `PLATFORM-V2-MASTER-PLAN.md`
(features) and `CONTENT-REWRITE-PLAN.md` (copyright programme). This file is the
single source of truth for building the Computer Science subject. It is written
so that smaller LLM agents (Opus/Sonnet builders) can execute any step from this
file alone, without re-deriving context.

**Exam:** first sitting 2027-05-17 (already in `subjects/computer-science/subject.json`).
**Papers:** J277/01 "Computer systems" (1h30, 80 marks, 50%, AO1+AO2, one 8-mark
extended response, non-calculator) and J277/02 "Computational thinking, algorithms
and programming" (1h30, 80 marks, 50%, AO1+AO2+AO3; Section A 50 marks concepts,
Section B 30 marks practical programming: Design → Write → Test → Refine; all
stimulus code in OCR Exam Reference Language "ERL"; students answer Write
questions in ERL **or** a high-level language; minor syntax errors not penalised).

---

## 0. How to use this file (agents read this first)

- Every work item has an ID (`CS-0`, `CS-A-W2`, `T6`, …). Status lives in the
  tables in §8 and §13 (⬜ → 🔄 → ✅). ONLY the coordinator updates this file,
  from builder reports — builders never edit CS-CONTENT-PLAN.md.
- A **content builder** agent builds exactly ONE topic page per run and touches
  ONLY that page file. It follows the recipe in §5 and the exam mapping in §6.
  The builder prompt template is Appendix E.
- An **engine builder** agent (CS-B / CS-C / CS-D) touches shared JS/CSS and
  must read §7 plus the file checklist in Appendix D. Never run a content
  builder and an engine builder over the same wave simultaneously if both would
  edit `subjects/computer-science/subject.json` or shared JS.
- The **coordinator** (the owner's main session) is the only party that edits
  the scaffolder's `SUBJECTS` tree / `subject.json`, deletes files, runs
  `python tools/build_question_bank.py`, and commits. Builders never run the
  pipeline.
- Decisions marked **LOCKED** were made by the owner on 2026-07-12 and stay
  locked until the owner unlocks them. Flag new evidence; never silently reverse.

---

## 1. Locked decisions (owner, 2026-07-12)

| # | Decision | Detail |
|---|---|---|
| D1 | **Sub-topic pages only** | Each 1.1.x / 2.x.x is a full topic page. Sections (1.1 … 2.5) are group headers in `subject.json` — no section-level HTML pages. The 11 existing placeholder pages are deleted in CS-0. |
| D2 | **Pyodide for Python** | Real CPython-in-WASM, lazy-loaded from jsDelivr only on pages that declare it, cached after first load. No mini-interpreter, no external embeds. |
| D3 | **Python + ERL together** | Teaching content shows Python and ERL side by side; exam-style questions present code in ERL exactly as OCR does. |
| D4 | **1.2 = 8 pages, no overview page** | Duplicate entry dropped; "how data is stored" intro becomes the opening card of the numbers page. Filenames renumbered sequentially (see §3 spec-ref column for the OCR mapping). |
| D5 | **Free-year content policy = Option A** (`CONTENT-REWRITE-PLAN.md` §3) | Real OCR exam questions/mark schemes/examiner comments go verbatim into `examQuestions` fields only, behind the WP-A3 auth gate. This adds known Phase R rewrite debt — accepted. |
| D6 | **Third-party resources are ideas/structure only** | SaveMyExams, Paul Long, Craig'n'Dave, Paper 2 Masterclass, KS4 unit tests: never copy prose, images, or their worked examples. Structure, sequencing, activity FORMATS and pedagogy are free to borrow (§2). |
| D7 | **Topic-splitting protocol** | Default is the §3 page map. If during build a page would exceed the §5.1 size caps, the builder STOPS and reports a proposed split to the owner. Owner decides. Pre-flagged fat topics: 1.3.1, 1.3.2, 1.6.1, 2.1.2, 2.2.3. |
| D8 | **Phasing** | Content first with the existing 9 tabs (CS-A), interactive Practice Lab as parallel engine work (CS-C), exam-widget upgrades (CS-B) and bank-level new question sources (CS-D) later. No content wave is blocked on engine work. |

Also done 2026-07-12: `CS resources/` added to `.gitignore` (same policy as
`eco resources/` — exam-board and third-party copyright material never gets
committed or deployed).

---

## 2. Sources and what each may be used for

| Source (all under `CS resources/`, gitignored, local-only) | Role | Copy policy |
|---|---|---|
| `558027-specification-gcse-computer-science-j277 (2).pdf` | Authoritative scope: what every page must cover (compressed per-page in Appendix B) | Topic titles fine; NEVER copy spec bullet prose wholesale — paraphrase from understanding |
| `ExamquestionsNew/<page>.pdf` (OCR ExamBuilder compilations with mark schemes + examiner comments) | The exam-practice source per page | VERBATIM allowed, but ONLY inside `examQuestions` fields (`question`/`caseStudy`/`markScheme`/`modelAnswer`) per D5. Never into Learn cards, MCQs, tips prose |
| `2026 SaveMyExams/` (revision notes, guidance, answers) | Structure & depth reference; question-led heading style; Easy/Medium/Hard banding idea | IDEAS ONLY — no prose, no images |
| `Paul Long Resources/` (textbook, activities, Python exam-style `.py`, `OCR Mapping to Specification.xlsx`) | Activity formats; teach→model→practise→assess micro-spiral; SQL/code task shapes | IDEAS ONLY |
| `Craige N Dave/Unit 1/` (workbooks, tests, games) | Objectives + self-assessment framing; drill banks; security board-game concept | IDEAS ONLY |
| `Paper 2 Masterclass 19 May 2025.pdf` | Paper 2 question-type intelligence: trace tables, error-spotting, ERL framework, topic-frequency table | IDEAS ONLY |
| `1. KS4 CS Unit Assessments/` | Question form + tariff conventions (these are largely Craig'n'Dave tests) | IDEAS ONLY |

**Writing rule for all teaching content** (Learn cards, MCQs, TF, FIB, match,
misconceptions, tips, flashcards): write from understanding in our own words,
matching the house voice of `subjects/economics/1.2_The_basic_economic_problem.html`
(the canonical exemplar page). The ONLY verbatim material anywhere in CS content
is OCR past-paper material inside `examQuestions` fields.

---

## 3. The page map — 29 pages, 11 groups (LOCKED, D1/D4)

Groups appear on the subject index in this order. Group `sub` labels:
Unit 1 groups → `"Paper 1 · Computer systems"`, Unit 2 groups →
`"Paper 2 · Computational thinking"`. Page `id` is the manifest's `id` field —
the scaffolder computes it as slugify("1.1.1 <Title>"), which equals the
filename slug with dots→dashes (e.g. `1-1-1-architecture-of-the-cpu`); nothing
derives ids from filenames at runtime. Bank ids become
`computer-science:<page-id>:<source>:<hash>` automatically.

| Group (header) | Page file | OCR spec ref | Notes |
|---|---|---|---|
| **1.1 Systems architecture** | `1.1.1-architecture-of-the-cpu.html` | 1.1.1 | exam PDF ✅ exists |
| | `1.1.2-cpu-performance.html` | 1.1.2 | exam PDF ✅ exists |
| | `1.1.3-embedded-systems.html` | 1.1.3 | exam PDF ✅ exists |
| **1.2 Memory and storage** | `1.2.1-primary-storage-memory.html` | 1.2.1 | |
| | `1.2.2-secondary-storage.html` | 1.2.2 | |
| | `1.2.3-units.html` | 1.2.3 | the 3 file-size formulas live here |
| | `1.2.4-data-storage-numbers.html` | 1.2.4 (Numbers) | binary/hex/addition/shifts |
| | `1.2.5-data-storage-characters.html` | 1.2.4 (Characters) | ASCII/Unicode |
| | `1.2.6-data-storage-images.html` | 1.2.4 (Images) | pixels, colour depth, metadata |
| | `1.2.7-data-storage-sound.html` | 1.2.4 (Sound) | sampling |
| | `1.2.8-compression.html` | 1.2.5 | lossy/lossless |
| **1.3 Networks, connections and protocols** | `1.3.1-networks-and-topologies.html` | 1.3.1 | ⚠ split candidate (D7) |
| | `1.3.2-wired-and-wireless-networks-protocols-and-layers.html` | 1.3.2 | ⚠ split candidate |
| **1.4 Network security** | `1.4.1-threats-to-computer-systems-and-networks.html` | 1.4.1 | |
| | `1.4.2-identifying-and-preventing-vulnerabilities.html` | 1.4.2 | |
| **1.5 Systems software** | `1.5.1-operating-systems.html` | 1.5.1 | |
| | `1.5.2-utility-software.html` | 1.5.2 | |
| **1.6 Impacts of digital technology** | `1.6.1-ethical-legal-cultural-and-environmental-impact.html` | 1.6.1 | ⚠ split candidate (impacts vs legislation); home of the 8-mark discuss drill |
| **2.1 Algorithms** | `2.1.1-computational-thinking.html` | 2.1.1 | |
| | `2.1.2-designing-creating-and-refining-algorithms.html` | 2.1.2 | ⚠ split candidate; trace tables + errors + flowcharts |
| | `2.1.3-searching-and-sorting-algorithms.html` | 2.1.3 | |
| **2.2 Programming fundamentals** | `2.2.1-programming-fundamentals.html` | 2.2.1 | |
| | `2.2.2-data-types.html` | 2.2.2 | |
| | `2.2.3-additional-programming-techniques.html` | 2.2.3 | ⚠ split candidate (strings/files/arrays/subprograms/SQL/random) |
| **2.3 Producing robust programs** | `2.3.1-defensive-design.html` | 2.3.1 | |
| | `2.3.2-testing.html` | 2.3.2 | |
| **2.4 Boolean logic** | `2.4.1-boolean-logic.html` | 2.4.1 | |
| **2.5 Languages and IDEs** | `2.5.1-languages.html` | 2.5.1 | |
| | `2.5.2-the-integrated-development-environment-ide.html` | 2.5.2 | |

**Exam-PDF naming convention (owner):** drop future OCR ExamBuilder PDFs into
`CS resources/ExamquestionsNew/` named exactly after the page file they feed,
e.g. `1.2.2-secondary-storage.pdf`. If one PDF covers OCR 1.2.4 as a whole, the
coordinator splits its questions across the four data-storage pages by content
(numbers/characters/images/sound) before builders run.

---

## 4. Platform facts every agent must know (verified 2026-07-12)

1. **A topic page is self-contained HTML** with inline `<script>` data arrays;
   the shared engine (`/script.js`, 4.7k lines) renders 9 tabs from them:
   `learn` (from `topics`), `mcq` (`mcqData`), `matching` (`matchData`),
   `fib` (`fibData` + `fibWords`), `misconceptions` (`miscData`),
   `examtips` (`examTips`), `flashcards` (`flashcards`), `truefalse` (`tfData`),
   `exampractice` (`examQuestions`). Copy the tab markup + array shapes from the
   canonical exemplar `subjects/economics/1.2_The_basic_economic_problem.html`.
2. **Exact array shapes** (field names matter — the pipeline parses them):
   - `topics[]`: `{ title, tag, content: <HTML template string>, readCheck: { q, opts[4], ans, explain } }`
   - `mcqData[]`: `{ q, opts[4], ans, explain }`
   - `matchData[]`: `{ term, def }`
   - `fibData[]`: `{ display: "… _____ …", blanks: { B1: "word", B2: "word" } }` + `fibWords[]` word bank
   - `tfData[]`: `{ statement, answer: true|false, explanation }`
   - `miscData[]`: `{ wrong, correct, readCheck }` (misconception cards)
   - `examTips[]`: `{ type: "explain"|"tip"|"evaluate", title, pills[], content: <HTML>, readCheck }`
   - `flashcards[]`: `{ term, def }`
   - `examQuestions[]`: `{ num, marks, type: "written"|"mcq", caseStudy: <HTML|"">, question, hint, starter, markScheme: <HTML>, modelAnswer }`; mcq items add `options[]` + `answer` index. Multi-question shared extracts: define once in a page-level `const EXAM_CASE_STUDIES = { "<case-id>": "<html>" }` and give each question `caseId: "<case-id>"` instead of repeating `caseStudy` — the engine then renders the extract once-per-run when scrolling and per-question in focus mode, and the pipeline snapshots the text into every bank row. `examTips[].pills` is REQUIRED (the renderer crashes without it). FIB blanks are exactly five underscores `_____`. `matchData` needs ≥ 4 pairs to generate bank questions.
3. **Pipeline:** when a page's content is ready, the coordinator removes that
   page's `"noQuestions": true` from `subjects/computer-science/subject.json`
   and runs `python tools/build_question_bank.py --subject computer-science --upload`
   (creds in `.env`). This regenerates CS's `question-bank.js`, `page-groups.js`,
   `section-totals.js`, refreshes the `-all` registries for every subject, and
   uploads/deletes ONLY CS Supabase rows. No code changes needed. **Always scope
   with `--subject computer-science`** — an unscoped run rebuilds business and
   economics too, and their FIB `blankOptions` shuffle with an unseeded RNG, so
   their files churn; after a deliberate full rebuild the integrity check is
   COUNTS (business 3074 questions / 37 pages), not bytes.
4. **Scaffolding — subject.json is OUTPUT, not input:** the source of truth is
   the hardcoded `SUBJECTS` dict inside `tools/scaffold_placeholder_subject.py`
   (currently still the old 11-page CS tree). Every run REWRITES
   `subjects/<slug>/subject.json` and `index.html` from that dict and resets
   every page to `"noQuestions": true`. So: to restructure, edit the
   `SUBJECTS["computer-science"]` tree (11 units keyed "1.1"…"2.5"; pages as
   explicit `(title, file)` tuples — the default filename derivation produces
   underscores, and only explicit tuples give the dotted §3 filenames), then run
   `python tools/scaffold_placeholder_subject.py --subject computer-science`
   (creates only missing page files by default; `--force-pages` overwrites).
   ⚠ After any page has gone live, a scaffolder re-run silently re-adds its
   `noQuestions` flag — and the next `--upload` would DELETE its Supabase rows.
   Rule: after any scaffolder re-run, diff `subject.json` and re-remove
   `noQuestions` for all live pages BEFORE any pipeline run.
5. **Shared-JS architecture rule:** features/fixes go in shared JS files, never
   into the 29 page HTMLs; page HTMLs hold ONLY their data arrays and the
   standard scaffold. Auth guards redirect to `/index.html` (not login.html).
6. **Bank question text renders via `taskRichText`** on task/worksheet/daily-
   revise surfaces, and its tag whitelist (tasks-shared.js:407) currently has
   **no `pre`/`code`** — code-stem questions would render as escaped literals
   there today. This is scheduled engine work in CS-0 (extend the whitelist
   with `pre|code` + mono styling, then verify on task.html, teacher-worksheets
   picker AND print, daily-revise). Authoring rule: bank-visible fields
   (`question`/`caseStudy`/`hint`/`starter`/`modelAnswer`) use BARE `<pre>` (no
   attributes — attributed tags stay escaped); `<pre class="code-block">` is
   fine in Learn cards and `markScheme`, which render raw.
7. **Type/source switch surface** (why new bank types are a separate phase):
   `script.js`, `daily-revise.js`, `review-calendar.js`, `task.html`,
   `tasks-shared.js`, `gamification.js`, `progress-shared.js`,
   `teacher-tasks.html`, `teacher-analytics.html`, `teacher-dashboard.html`,
   `teacher-worksheets.html` (duplicates the tasks picker — sync both ways),
   `section-totals-all.js` (regenerated, not hand-edited),
   `netlify/functions/weekly-retry-tasks.js`, `build_question_bank.py`
   (`SOURCES` list, line 435). Full checklist: Appendix D.
8. **CSP** (netlify.toml): `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
   `connect-src 'self' <supabase>`. Pyodide/sql.js need `'wasm-unsafe-eval'` in
   `script-src` and `https://cdn.jsdelivr.net` in `connect-src` (§7.3).
9. **Content gating already covers CS:** the WP-A3 edge function gates
   `/subjects/*`; robots.txt blocks indexing. New pages inherit both.
10. **Paste-guard:** paste is blocked in exam answer boxes; this stays true for
    code answers (typing code is deliberate practice).

---

## 5. The per-page content recipe (content builders follow this exactly)

### 5.1 Inputs, size caps, volume targets

**Inputs per page:** (a) Appendix B spec coverage for the page (the ONLY
statement of scope); (b) the exemplar economics page for shapes/voice; (c) §6
(exam-question forms + the original-authoring rule — per §6.2, builders do
NOT open the exam PDFs); (d) §5.3 tab guidance; (e) Appendix A (assessment
intelligence, so exam tips and misconceptions are accurate, not invented).
Builders do NOT read SaveMyExams/Paul Long/Craig'n'Dave — their structural
lessons are already baked into this plan (clean-room hygiene).

**Size caps (D7):** max 7 Learn cards or ~2,500 words of Learn content.
Prefer more, narrower cards over fewer dense ones — split a card the moment
it covers two distinct sub-ideas or creeps past ~8 bullets, so each card is
one question-led idea a student can digest in one sitting. If the full
Appendix B scope still doesn't fit after that, STOP, report a proposed split
(e.g. "1.3.2a connections + 1.3.2b protocols and layers") and wait for the
owner — do not cut spec content to make it fit. A topic that comfortably fits
in one page stays one page.

**Volume targets** (match economics density):

| Array | Target | Notes |
|---|---|---|
| `topics` | 4–7 cards | every card ends with a `readCheck` |
| `mcqData` | 10–12 | at least 3 applied/scenario stems |
| `tfData` | 8 | explanations teach, not just confirm |
| `fibData` | 6–8 | + `fibWords` bank of all blank words |
| `matchData` | 10–14 | terms↔definitions; see §5.3 for CS variants |
| `miscData` | 4–6 | real misconceptions for THIS topic (§5.3) |
| `examTips` | 2–4 | graded ladders (§5.3) |
| `flashcards` | 12–18 | every spec keyword gets a card |
| `examQuestions` | all questions in the page's exam PDF | verbatim per D5, mapped per §6 |

### 5.2 Build steps (in order)

1. Read the exemplar page top-to-bottom once. Read Appendix B for your page.
2. Write `topics` (Learn cards) per §5.3. Big pages: use Write for the file
   skeleton then Edit-append per array (established practice for large pages).
3. Write practice arrays: `mcqData`, `tfData`, `fibData`+`fibWords`,
   `matchData`, `flashcards`.
4. Write `miscData` and `examTips` ladders.
5. Process the exam PDF: extract every question + its mark scheme + examiner
   comments; map each to an engine type per the §6 table; write `examQuestions`.
6. Self-verify (all of): the page's inline script parses (esprima/mini-racer
   harness or `node --check` on the extracted script body); every `ans`/`answer`
   index is correct; every `readCheck` has exactly 4 opts; blank keys B1/B2/…
   match the `_____` count; totals match §5.1 targets; no third-party prose
   anywhere outside `examQuestions`.
7. Report done with counts per array + any flags (split proposal, missing PDF,
   scope doubts). Do NOT edit subject.json or run the pipeline.

### 5.3 Tab-by-tab CS guidance

> 🚩 **Tables (owner fix 2026-07-17).** Author teaching tables (character-code
> tables, unit ladders, worked-example steps, comparison grids) as a PLAIN
> `<table>` with a `<th>` header row and NO class. style.css now styles every
> plain table outside the exam tab with a thin bordered grid
> (`.tab-panel:not(#tab-exampractice) table:not([class])`) — so a bare `<table>`
> renders correctly with borders/padding/header shading on all pages
> automatically. Do NOT add inline `border`/`style` or a custom class to
> teaching tables (a class opts OUT of the shared styling). The exam tab keeps
> its own table CSS (`.ep-question table`, `.ep-case table`, widget
> `.csew-grids-table`). Early CS pages (1.2.4/1.2.5) shipped borderless tables
> before this rule existed — the global CSS retro-fixes them.

**Learn cards (`topics`)** — question-led structure: `<h4>` headings phrased as
exam-style questions ("What happens at each stage of the fetch–execute cycle?",
"How do you convert denary to binary?"). Per card: 3–8 bullets per heading,
bold key terms on first use, one concrete everyday example per concept.
CS-specific elements:
- **Dual code blocks (D3):** whenever code illustrates a concept, show ERL and
  Python together using EXACTLY this canonical markup (the `.code-block` CSS is
  created in CS-0 — mono font, themed background, `overflow-x:auto`):

  ```
  <div class="code-compare">
    <div><p class="code-label">ERL (exam reference language)</p>
    <pre class="code-block">for i=0 to 4
      print(names[i])
    next i</pre></div>
    <div><p class="code-label">Python</p>
    <pre class="code-block">for i in range(5):
        print(names[i])</pre></div>
  </div>
  ```

  ERL keywords per Appendix C (`MOD`, `DIV`, `AND` uppercase); Python must be
  runnable as written under CPython 3. Keep snippets ≤ 12 lines. **Never use a
  backtick or `${` inside any snippet or content string** — all page content
  lives in JS template literals and one stray backtick breaks the whole page
  (ERL and Python never need them).
- **Worked examples for every calculable skill** (conversions, binary addition,
  shifts, file-size formulas): numbered steps in a small HTML table, exactly one
  full worked example + one "now check you can" readCheck. File-size formulas
  are load-bearing on 1.2.3: sound = sample rate × duration × bit depth;
  image = colour depth × width × height; text = bits per character × number of
  characters (state answers in bits then convert).
- **Diagrams:** hand-authored inline SVG only (von Neumann block diagram, star/
  mesh topologies, gate symbols, flowchart symbols). Simple, theme-safe (use
  `currentColor`/CSS variables, no fixed white fills). NEVER extract images
  from any source PDF.
- Tag values — use exactly one of: `Key concept`, `Exam skill`, `Calculation`,
  `Worked example`, `Comparison`, `Real world`. No other tags.

**MCQs** — cover every spec bullet at least once across mcq+tf; include
"predict the output" stems on programming pages (code in the stem as a
`<pre>` block); distractors = real student errors (off-by-one, MSB/LSB swaps,
RAM/ROM swaps), never joke options.
🚩 **The correct option must NOT be the longest** (applies to `mcqData` AND
every `readCheck`). Students learn "the longest, most detailed answer is
usually right" and guess instead of thinking — so at least one distractor
must be as long as or longer than the correct answer, and none should be
trivially short. Do NOT pad with filler ("...definitely", "...always and in
all cases") — that is its own tell and reads badly; instead write distractors
that are genuinely substantive, plausible and *comparable in length*, each a
real misconception stated in full. `verify-page.js` fails a page whose
authored MCQ/readCheck has a uniquely-longest correct option. Verbatim exam/
mock MCQs are EXEMPT (fidelity beats this — never reword a real paper).

**Matching** — beyond term↔definition, use the pairing the topic actually
needs: threat↔how it works (1.4.1), prevention↔threat it counters (1.4.2),
device↔best-fit scenario (1.2.2), register↔purpose (1.1.1), gate↔output rule
(2.4.1), protocol↔job (1.3.2), test-data type↔example (2.3.2).

**FIB** — definitions, unit chains (bit→nibble→byte→KB→MB→GB→TB→PB), ERL
keyword completion (`for i=0 ___ 9` → `to`).

**Misconceptions (`miscData`)** — the known J277 traps for the topic, e.g.:
clock speed alone decides performance; RAM is storage; more pixels = better
image regardless of file size; `=` vs `==`; a WHILE loop always runs at least
once (it's DO-UNTIL that does); binary search works on unsorted lists;
compiler vs interpreter "which is better" absolutism; validation stops all
wrong data (it only stops *invalid* data). Write the `correct` field as a
graded contrast (weak answer → strong answer) in our own words.

**Exam tips (`examTips`)** — 2–4 ladders per page showing the same answer at
0 marks → partial → full, in our own words (no examiner-report quotes outside
`examQuestions`). Every page gets a command-word ladder for its dominant tariff
(2-mark "state" vs 3-mark "explain how" with the *…which means…* development).
Calculation pages get a show-your-working ladder (working + units, own-figure
rule). 1.6.1 and 1.1.2 get the 8-mark "discuss" ladder: define terms → point
with X→Y→Z chain (factor→effect→consequence) → counterpoint → second issue →
separate conclusion; ~10–12 minutes; band descriptors summarised in our words.
Paper 2 pages (2.1–2.5) get a "reading ERL calmly" ladder: underline keywords →
restate the problem → identify inputs/outputs/constructs → check the logic as a
Boolean statement before answering.

**Flashcards** — every bold term from Learn + every spec keyword; definitions
≤ 20 words, self-contained.

---

## 6. Exam questions: adapting OCR's question forms

The three existing exam PDFs (1.1.1/1.1.2/1.1.3: 53 + 54 + 20 marks) revealed a
16-form taxonomy; Paper 2 topics add ~6 more forms. **CS-A rule: every form maps
to the two existing engine types (`mcq`, `written`) using the table below — no
engine changes are needed to ship content.** CS-B later upgrades the marked
forms to interactive widgets without touching page data (widgets key off a
`format` hint field, see below).

### 6.1 Mapping table (CS-A)

| OCR form (tariff) | CS-A mapping | CS-B upgrade |
|---|---|---|
| Tick-one-box / MCQ (1) | `type:"mcq"` | — |
| Tick-grid, one-or-more per row (≤4) | `written`; grid re-authored as an HTML table in `question`; answer format "Row 1: A, C …"; markScheme carries the per-row rule (extra ticks void the row) | `tickGrid` |
| Draw-a-line matching (4) | `written`; two lettered/numbered lists in `question`; answer "1→C, 2→A…" | `matchLine` |
| Complete-a-table (2–4) | `written`; table shown with labelled gaps (A), (B); answer "A: …" | `tableFill` |
| Two-column structured (difference/example+explain/choice+justify) (3–4) | `written` with the table in `question`; markScheme notes pair-marking | `tableFill` |
| Free cloze / complete sentences (≤5) | `written`; numbered blanks ⑴⑵… in `question` | `inlineCloze` |
| Word-bank cloze with distractors (4) | `written`; word bank rendered as a bordered list in `question`; note "not all words used" | `bankCloze` |
| Identify/Give/List N (1–4) | `written`, numbered answer lines in `starter` | — |
| State / Define (1–2) | `written` | — |
| Describe (2–4) | `written` | — |
| Explain why/how (2–3) | `written`; markScheme shows point + development marks | — |
| Justify a choice (2–3) | `written` | — |
| Interpret a figure (1) | `written`; figure re-authored as HTML table (the PDFs' "Fig." boxes are text, not images) | — |
| 6-mark levelled QWC (6) | `written`; markScheme = 3-band ladder + indicative content | banded self-mark aid |
| 8-mark Discuss (8) | `written`; bullet prompts kept in `question`; banded markScheme | banded self-mark aid |
| Calculate / Convert (1–4) | `written`; markScheme = working steps; hint reminds units | drill widgets in Lab |
| Complete/write ERL code (2–8) | `written`; stem code in `<pre>`; answer typed; modelAnswer = ERL; hint links the Practice Lab | `codeWrite` (+ run) |
| Complete a truth table / trace table (3–6) | `written` with the table in `question` | `traceTable`/`tableFill` |
| Order/sequence steps (2–4) | `written` ("write the letters in order") | `parsons` |

### 6.2 Authoring rules for `examQuestions`

> 🚩 **COMPLETENESS via ORIGINAL clean-room questions — owner + copyright
> decision 2026-07-17.** The topic pages must give COMPREHENSIVE exam-practice
> coverage of every sub-topic — but do this by **authoring ORIGINAL,
> OCR-J277-style questions from the spec scope**, NOT by bulk-transcribing the
> `CS resources/ExamquestionsNew/*.pdf` compilations. Reproducing whole OCR
> papers verbatim into the codebase is wholesale copying of a commercial exam
> board's IP; the "© OCR — you may photocopy this page" notice is a limited
> classroom-photocopy permission, not a digital-republication licence we can
> assume. So: **builders must NOT open/extract/paraphrase the OCR PDFs in
> `CS resources/` or the verbatim text in `mock-papers/*.js`.** Work only from
> the spec bullets (Appendix B scope + each page's §-scope) and invent fresh
> scenarios. Cover every spec point per page with a spread of tariffs/command
> words (see §5.3 mix). Use clean `num` ids ("P1", "P2", …), original mark
> schemes, and self-marking `markPoints`; the MCQ not-longest rule APPLIES
> (these are original, not verbatim). *(Note: the already-built pages
> 1.1.x/1.2.x still contain owner-supplied verbatim OCR content behind the auth
> gate — that is the owner's licensed material and is left as-is; new coverage
> is added as original questions.)*
>
> 🚩 **No year badge.** Owner dropped the `q.year` idea 2026-07-17 (the source
> series isn't reliably knowable and years aren't needed). The renderer still
> supports an optional `q.year` pill (`.ep-year`) but leave it unset. If a year
> is ever wanted, it goes in `q.year`, NEVER prefixed to `num`/question text.
>
> 🚩 **Mocks → original too (later).** The `mock-papers/*.js` files currently
> hold owner-supplied verbatim papers; the plan is to move mocks to ORIGINAL
> full-length practice papers when revisited. Don't generate more verbatim
> paper reproductions. `node C:\Users\Public\csbuild\consistency.js` remains a
> useful QA gate for any question that legitimately appears in two places.
>
> 🚩 **Answer-box sizing is automatic — don't hand-set it.** A box opens at one
> line per mark (`linesForBox`): "give three characteristics [3]" with
> `stubs:['1','2','3']` gives three one-line boxes. Override only when a stub's
> share is uneven, via `q.stubLines: [1, 3]` (e.g. Choice = 1 line,
> Justification = 3). Boxes grow as the student types and scroll past 5 lines.
>
> 🚩 **BEFORE writing any written-answer question, read
> `docs/SELF-MARK-POINTS-AUTHORING.md`.** Students self-mark by ticking the
> scheme's points, so the tick list MUST be able to award exactly `q.marks`
> for a correct answer. The default (one scheme bullet = 1 mark) is WRONG for
> compound schemes — "1 for naming each register, 1 for each matching purpose"
> means each register the student gives is worth 2 marks, so it needs an
> authored `q.markPoints` with one group per thing the student produced.
> This applies to Business/Economics too if they adopt tick self-marking.

- Verbatim question text, mark scheme bullets, "How the marks are given" rules,
  and Examiner's Comments go into the same three-section `markScheme` HTML
  pattern as the exemplar (`marks-section` divs: Mark Scheme — N marks (AOx) /
  How the marks are given / Examiner's Comments). Include misconception notes
  where the PDF has them.
- `modelAnswer`: write a clean full-marks answer (our own words is fine and
  preferred; short, structured, exactly answers the command word).
- `markPoints`: REQUIRED whenever the scheme is not plainly 1-mark-per-bullet
  (see `docs/SELF-MARK-POINTS-AUTHORING.md`). Group by what the STUDENT
  produced ("Your first register"), cap each group, and make the group maxes
  sum to `q.marks`. Omit it only for genuine "1 mark per bullet to max N"
  schemes, where the fallback is already correct.
- `hint`: one sentence pointing at the trap or the required structure.
  `starter`: opening words or answer scaffold ("A: … B: …").
- **`format` hint — LOCKED enum.** Add `format` to every non-plain item, using
  EXACTLY one of these strings (they are the CS-B widget dispatch keys; any
  other string is a defect). Omit `format` entirely for plain
  state/define/describe/explain/justify/calculate written items.

  | OCR form | `format` value |
  |---|---|
  | Tick-grid (one-or-more per row) | `tickGrid` |
  | Draw-a-line matching | `matchLine` |
  | Complete-a-table / two-column structured | `tableFill` |
  | Free cloze / complete sentences | `inlineCloze` |
  | Word-bank cloze with distractors | `bankCloze` |
  | 6-mark QWC / 8-mark discuss (banded) | `banded` |
  | Complete/write code | `codeWrite` |
  | Complete a trace table | `traceTable` |
  | Complete a truth table | `truthTable` |
  | Binary column addition (digit grid) | `binaryColumn` |
  | Fill gaps inside printed code (incl. SQL) | `codeGaps` |
  | Complete a function between fixed header/footer | `codeFunction` |
  | Order/sequence steps | `parsons` (not yet implemented as a widget) |

  ('lines' is the implicit default for format-less written questions on CS
  pages — ruled answer lines + examiner point-tick self-marking.)

  Note: the pipeline currently drops unknown fields from bank rows, so `format`
  lives only in the page arrays (which is where CS-B reads it). If CS-D ever
  needs `format` in the bank, that's a one-line pipeline change — note it there.
- **Answer-format rule (universal):** every re-authored form states its
  expected answer format in `starter` — grids: "Row 1: A, C …"; cloze:
  "(1) …, (2) …"; tables: "A: …, B: …"; matching: "1→C, 2→A …". This is what
  makes the CS-A plain-written interim self-markable.
- Questions sharing stimulus: use `caseId` + a page-level `EXAM_CASE_STUDIES`
  object (§4.2) — do NOT paste the same `caseStudy` text onto multiple
  questions, and do not use the exemplar's older pattern of a full extract on
  Q1 and `""` on follow-ups (that leaves follow-ups with no stimulus in focus
  mode and in the bank).
- Banded items: keep the full band descriptors + indicative content list in
  `markScheme`; they power the CS-B self-mark aid.

---

## 7. Interactive activities — the Practice Lab (phase CS-C)

CS pages get a 10th tab, **🧪 Practice Lab**, holding the interactive tools the
subject needs (this delivers, and supersedes in detail, the MULTI-SUBJECT-PLAN
"CS activities" item confirmed 2026-07-07). Design principles:

- **AS BUILT (2026-07-12) — architecture changed from the original draft, for
  parallel-agent safety:** the Lab lives in `/cs-lab/`:
  - `/cs-lab/cs-lab.js` — framework: injects the tab, holds the central
    **`PAGE_TOOLS` map (pageId → tools+config)** — pages do NOT declare
    `csLab` consts (decision: a single registry beats editing 29 HTMLs; pages
    stay data-only per the shared-JS architecture rule). Also holds the tool
    registry (`CsLab.registerTool`), the lazy module loader, the tiny UI kit,
    and the persistent store. Contract documented in the file header.
  - `/cs-lab/tools/<tool>.js` — one module per tool (a module may register
    several tool ids). **Per-page task content lives INSIDE the module keyed
    by pageId** — adding/altering activities for a page = edit that module's
    content tables or the `PAGE_TOOLS` map, never the page.
  - `/cs-lab/cs-lab.css` — shared primitives (cards, buttons, code/output
    boxes), injected by the framework; tool-specific CSS is injected by each
    module, class-prefixed `.cslab-<tool>`.
  - **Saving (owner decision 2026-07-12): local + cloud.** Every tool
    persists via `ctx.store` → localStorage instantly, and syncs (debounced,
    newer-wins) to Supabase table `cs_lab_saves` when a session exists —
    work follows students across devices. ⚠ **Owner must run
    `supabase/cs-lab-saves.sql` once** (RLS: owner-only rows, 256KB/key cap).
    No session → silently local-only.
  - `switchTab`/tab-progress/sequential-locking ignore the extra tab (no
    progress ring; never locked in sequential classes — accepted v1).
  - **Loading:** every CS page carries `<script src="/cs-lab/cs-lab.js"
    defer></script>` (all 29 patched + scaffolder template emits it for CS
    only). Framework self-noops on pages with no `PAGE_TOOLS` entry.
  - **Paste rules:** Lab editors must NOT use `ep-answer-area`/`answer-box`
    classes — students must be able to paste starter code. The CS-B
    `codeWrite` exam textarea MUST keep `ep-answer-area` (paste-guard).
  - **Standing owner instruction (2026-07-12):** when building any theory
    page, always ask "is there an activity that would teach this topic
    better?" — propose additions to `PAGE_TOOLS`/tool content tables rather
    than silently skipping them.
- **Local progress only in v1:** Lab completion stored under
  `geo_cslab_<pageId>_<tool>` localStorage keys; shown inside the tab
  (streaks/badges), NOT counted in `SECTION_TOTALS`, daily-revise, tasks or
  gamification yet. That containment is what makes CS-C safe to run in parallel
  with content waves — it touches none of the Appendix D surface. Promotion to
  bank/gamification is CS-D.
- **Lazy everything:** heavy runtimes (Pyodide ~7MB, sql.js ~1.5MB) load only
  after the student presses "Start" inside the relevant tool, with a visible
  loading state and a graceful failure message (R-1).
- **House standards:** theme-aware via CSS variables (7 themes incl. 2 dark),
  keyboard accessible, touch-friendly, no console errors, ≤ 44px tap targets.

### 7.1 Tool specifications

| ID | Tool | What it does (acceptance criteria) | Pages |
|---|---|---|---|
| T1 | **pyRunner** | Pyodide in a same-origin classic worker (`/cs-lab-worker.js` importScripts from jsDelivr). Editor (`<textarea>` + mono font), Run button, stdout panel, `input()` supported via prompt queue, 10s wall-clock timeout kills the worker, errors shown verbatim. Preloaded starter code per task from `csLab` config. | 2.1.2, 2.1.3, 2.2.1–2.2.3, 2.3.1, 2.3.2, 2.5.2 |
| T2 | **dataRepDrills** | Generated drills, 10-question rounds, instant marking, streak counter: denary↔binary (8-bit), binary↔hex, denary↔hex, binary addition (with overflow flag), left/right shifts (asks the ×2/÷2 meaning too), unit conversions, file-size calculations (all three formulas; answers accepted in stated unit). Place-value scaffold toggle (128…1 row). Infinite practice — items generated fresh each round. | 1.2.3, 1.2.4 (numbers), 1.2.6/1.2.7 (size calcs) |
| T3 | **traceTable** | Given an ERL snippet (line-numbered) and a pre-sized table (columns = variables + output), student fills cells; per-cell check on submit with first-wrong-cell highlighting. Instances authored in page config (WHILE counter, nested FOR, array build, linear search with exit — the classic set). | 2.1.2, 2.2.1, 2.3.2 |
| T4 | **parsons** | Shuffled algorithm lines (ERL), drag/tap to reorder; optional 1–2 distractor lines; order-only marking (no indent marking in v1). | 2.1.2, 2.1.3, 2.2.1 |
| T5 | **codePredict** | Short ERL or Python snippet, student types the exact output; whitespace-lenient auto-mark; "explain" reveal after answer. | 2.1.2, 2.2.1–2.2.3 |
| T6 | **logicLab** | v1 = complete-the-truth-table mode (2–3 inputs, ≥2 gates, SVG circuit shown, cells auto-checked; accepts 1/0 and T/F). The free-form wire-the-gates circuit builder is a STRETCH goal — build only if v1 lands cheaply (it's the hardest UI in the plan serving one page). | 2.4.1 |
| T7 | **sqlLab** | sql.js (WASM) with a seeded fictional table (e.g. `Books` / `Students`); task list restricted to SELECT/FROM/WHERE (spec scope); result-set compared to expected; constraint variants ("without using OR"). | 2.2.3 |
| T8 | **mediaLab** ⚠ CUT CANDIDATE | Three mini-tools: bitmap pixel grid (click pixels ⇄ live binary string, colour-depth switch, file-size readout); sound sampler (sliders → quality + size readout); compression demo. Serves few exam marks beyond what T2's calculators already drill — build LAST, only if waves are ahead of schedule (owner call). | 1.2.6, 1.2.7, 1.2.8 |
| T9 | **sortVisualiser** | Step-through animations for bubble/insertion/merge sort and linear/binary search on user-editable lists; pass counters, swap highlighting; **predict-next-step quiz mode** (auto-marked). | 2.1.3 |
| T10 | **microSims** | Small per-topic sims: fetch–decode–execute animation (PC→MAR→MDR→ACC data flow, step button) for 1.1.1; storage-device chooser (scenario → choose device → justified feedback across capacity/speed/portability/durability/reliability/cost) for 1.2.2; threat↔defence quick-fire game for 1.4.1/1.4.2. | 1.1.1, 1.2.2, 1.4.x |

**Wave-1 scope change (owner, 2026-07-12): ALL tools pulled into one build**,
including T8 (un-cut) and four new tools beyond the original table:

| ID | Tool | What it does | Pages |
|---|---|---|---|
| T11 | **net-builder** | Wire star and mesh topologies (click-click cabling), topology auto-check, cable-cut failure sim comparing resilience, mesh-cables n(n−1)/2 quiz | 1.3.1 |
| T12 | **bug-hunt** | Two-stage exam-style debugging: click the faulty line, then type the fix; syntax vs logic labelled; per-set variants incl. test-data-exposes-the-bug | 2.1.2, 2.2.3, 2.3.1, 2.3.2 |
| T13 | **test-data** | Classify values as normal/boundary/invalid/erroneous against a validation rule; then design one of each | 2.3.2 |
| T14 | **flow-label** | Label the six OCR flowchart symbols + assemble a simple flowchart | 2.1.2 |

T1 (Python Lab) **v2 as-built (2026-07-13, owner-driven)**:
- **LIVE console input** — student code that calls `input()` pauses and lets
  the student type into the console at that moment (no more pre-supplying all
  answers up front). Python's `input()` is synchronous, so the Pyodide worker
  blocks on `Atomics.wait` against a `SharedArrayBuffer`; the main thread shows
  an inline console input, and on Enter writes the UTF-8 line into the SAB and
  `Atomics.notify`s the worker awake. Requires **cross-origin isolation**
  (COOP `same-origin` + COEP `credentialless`), added in netlify.toml scoped to
  `/subjects/computer-science/*` + `/cs-lab/*` only. Non-isolated browsers fall
  back to a pre-supplied inputs box (old behaviour). The 15s run-timeout is
  PAUSED while awaiting input (don't count human thinking time).
- Streaming console (stdout via Pyodide `write`, not line-batched, so `input()`
  prompts appear inline before the input box), "RUN AT hh:mm:ss" separators,
  verbatim Python tracebacks (the 2.5.2 lesson), Stop, Clear.
- **PRIMM structure** (Predict → Run → Investigate → Modify → Make) — read-and-
  predict before writing, per Sentance's PRIMM. One full PRIMM activity per
  Python page + former tasks kept as "Challenge" (Make-only) activities + a
  **Story Sandbox** (interactive-input playground — the story-with-inputs use
  the owner called out). A phase stepper drives it; `ctx.complete` fires when
  the final check-bearing phase passes.
- Real code editor (CodeMirror via `ui.mountCodeEditor`), all code/files/
  predictions autosaved per (activity, phase) via the cloud store.
- **IDE workspace (v2.1, 2026-07-13, owner-driven):** file **tabs** above the
  editor (`main.py` + any opened file; text files edit in place, images show a
  preview tab); a **left file-explorer sidebar** with sub-folders (paths like
  `data/names.txt`), new file/folder, **uploads incl. images** (≤400KB each;
  binary stored base64 — note the whole files payload shares one 256KB cloud-
  sync key, so big uploads may stay device-local), rename/download/delete on
  rows, selected folder = target for new/upload; **console docks bottom OR
  right** of the editor (student preference persisted). Worker FS round-trip
  upgraded to `{path: {t:'text'|'b64', c}}` + `folders` list (recursive walk,
  empty dirs survive; code-written binary files come back as base64).

**Standing owner instruction (2026-07-13): apply PRIMM to ALL lab tools.** The
other tools are already Investigate/Modify/Make-shaped; they need the
Predict+Run framing wrapped around them. ROLLOUT (staged, not yet done): add a
shared `CsLab.primm(...)` wrapper to cs-lab.js (predict prompt → reveal → the
tool's own interaction), then adopt it tool by tool starting with the code-
reading tools (trace-table, parsons, code-predict, bug-hunt, sort-visualiser)
where Predict is most natural. Track per-tool in a new board when begun.
Each tool ships only when exercised end-to-end on a real page (§10).

### 7.2 CSP + vendor changes (one-time, with T1)

In `netlify.toml`: add `'wasm-unsafe-eval'` to `script-src`; add
`https://cdn.jsdelivr.net` to `connect-src` (Pyodide fetches its stdlib/wheels;
sql.js fetches its .wasm). Verified sufficient: no `worker-src`/`child-src`
exists, so `new Worker('/cs-lab-worker.js')` falls back to `script-src 'self'`
(allowed), and `importScripts` from jsDelivr is already covered by `script-src`.
The engine agent PREPARES this diff + the staging test plan; the coordinator
applies and deploys (netlify.toml is coordinator-owned, §9.1). Test on the
staging deploy AND on the school network early (R-1) — if the school filter
blocks jsDelivr, fall back to vendoring pyodide-core under `/vendor/`
(self-hosted, ~35MB deploy weight — owner decision if triggered).

### 7.3 Phase CS-B — exam-practice widgets ✅ BUILT 2026-07-17

**As built:** seam in script.js (`_epUseWidget`/`_epSaveWidgetResult` — inert
without `format` + the registry, so Business/Economics unchanged); registry +
'lines'/'banded' widgets in `/cs-lab/exam-widgets.js`; 8 grid formats in
`exam-widgets-grids.js` (note: `q.answers` lives at the question TOP level;
`q.table.openChoice: true` → self-mark fallback; cloze uses `___N___` tokens in
a `q.cloze` HTML string); codeWrite/codeGaps/codeFunction in
`exam-widgets-code.js` (Python "Test my code" runs the answer through pyworker
batch mode). Every format falls back to 'lines' + examiner point-tick
self-marking when its data field is absent. Auto-marked formats apply the real
paper rules (extra ticks void the row, etc.). Known simplification: traceTable
marks position-for-position — no wrong-order/follow-through credit
(conservative under-crediting, documented in the widget).
**Mock Exams:** `subjects/computer-science/mock-exam.html` + `mock-exam.js`
(timed paper-faithful runner, schemes suppressed until marking phase,
print-blank-paper for handwritten mocks, per-section/per-format results,
state survives leaving the page) + `mock-papers/2024-paper1.js`/`-paper2.js`
(verbatim June 2024, 80/80 marks each, widget-keyed, hand-checked against the
mark schemes). 2022+2023 papers/MS/**examiner reports** fetched into the
gitignored `CS resources/Full exam papers/` (2025 not yet public). Lab
additions: examiner-trainer + command-words tools (wired into PAGE_TOOLS on
1.1.1/1.1.2/1.2.1/1.4.1/1.6.1), logic-lab "Draw the circuit" mode, drills
digit-grid binary addition. Index hero gained a 📝 Mock Exams link (template
`$mock_link`, CS only). ⚠ The pipeline's JS parser REJECTS numeric object
keys in page data — always quote them (`"0": 1`).

### (original CS-B sketch, superseded by the as-built notes above)

Upgrades `exampractice` rendering in `script.js` keyed off `format` (§6.2):
`bankCloze` (dropdown-per-blank with distractors), `inlineCloze`, `tickGrid`
(checkbox matrix, per-row scoring incl. the void rule), `tableFill` (typed
cells, keyword-gated marking), `matchLine` (reuse matching interaction),
banded self-mark aid for 6/8-markers (student self-assigns a band against the
descriptors after writing — feeds the existing self-mark flow), `codeWrite`
(mono textarea + optional "Run in Practice Lab" handoff). All auto-marked types
still record through the existing exam scoring path; `written` remains the
fallback whenever `format` is absent — **CS-A pages never break.**

### 7.4 Phase CS-D — bank-level promotion (deferred, owner-triggered)

Promote `trace`, `parsons` and (curated, fixed-seed) `drill` items to real bank
SOURCES so they appear in Daily Revise, tasks, worksheets and teacher analytics.
This is the full Appendix D checklist + new parse blocks in
`build_question_bank.py` + seed SQL. Do not start until CS-A is complete and
CS-B widgets have survived a half-term of classroom use.

---

## 8. Phases, waves and status

**Dependency spine:** CS-0 → CS-A waves (content, parallelisable) with CS-C
tools built just-in-time alongside → CS-B → CS-D.
The critical external dependency is **exam PDFs from the owner** (only 1.1.x
exist today). Pages build all 8 other tabs without their PDF; `examQuestions`
integrates when the PDF lands; a page only goes live (noQuestions removed) once
its exam section is in — partial go-live is the owner's call per page.

| ID | Scope | Prereqs | Status |
|---|---|---|---|
| **CS-0** Walking skeleton | (1) Edit `SUBJECTS["computer-science"]` in `tools/scaffold_placeholder_subject.py` to the §3 tree — 11 units keyed "1.1"…"2.5", explicit `(title, file)` tuples for the dotted filenames, group `sub` labels per §3. (2) Run the scaffolder (rewrites subject.json + index.html, creates the 29 pages). (3) Delete the 11 old placeholder pages. (4) Scoped pipeline run; business/economics files untouched (scoped run) — spot-check counts. (5) Create `.code-block`/`.code-label`/`.code-compare` CSS in `style.css` (all 7 themes incl. both darks). (6) Extend `taskRichText` whitelist with `pre|code` + mono styling; verify a temporary code-stem test item renders on task.html, teacher-worksheets (picker AND print) and daily-revise, then remove it. (7) Build **1.1.1** fully (all 9 tabs incl. 53 marks of exam Qs). (8) ui-reviewer on 1.1.1; owner reviews → recipe LOCKED or tuned | — | 🔄 steps 1–7 done 2026-07-12 (72 bank Qs, 53 rows uploaded; taskRichText+CSS landed; ui-reviewer deferred — no new UI surface on 1.1.1, run it with the first code-block page or Lab tool). AWAITING step 8 owner review |
| **CS-A-W1** | 1.1.2 ✅ · 1.1.3 ✅ — both live 2026-07-17 | CS-0 | ✅ (E2 checker pass still due) |
| **CS-A-W2** | 1.2.1, 1.2.2, 1.2.3 | CS-0; exam PDFs | ⬜ |
| **CS-A-W3** | 1.2.4–1.2.8 | W2 conventions | ⬜ |
| **CS-A-W4** | 1.3.1, 1.3.2, 1.4.1, 1.4.2 | CS-0 | ⬜ |
| **CS-A-W5** | 1.5.1, 1.5.2, 1.6.1 | CS-0 | ⬜ |
| **CS-A-W6** | 2.1.1, 2.1.2, 2.1.3 | CS-0 | ⬜ |
| **CS-A-W7** | 2.2.1, 2.2.2, 2.2.3 | W6 conventions | ⬜ |
| **CS-A-W8** | 2.3.1, 2.3.2, 2.4.1, 2.5.1, 2.5.2 | CS-0 | ⬜ |
| **CS-C-1** | Framework `/cs-lab/cs-lab.js` + `cs-lab.css` (tab injection, PAGE_TOOLS registry, lazy loader, local+cloud store), include on all 29 pages + scaffolder template, CSP applied ('wasm-unsafe-eval' + jsDelivr connect-src), `supabase/cs-lab-saves.sql` written | CS-0 | ✅ 2026-07-12 (⚠ owner: run cs-lab-saves.sql; Pyodide school-network spike still pending) |
| **CS-C-2** | ALL tool modules T1–T14 built by 6 parallel agents (14 modules + pyworker.js, 18 tool ids, ~6,800 lines), per-page content inside modules; every agent ran node unit tests (36+133+38+4000-question sweep+80+65 assertions all passing) | CS-C-1 | ✅ 2026-07-13 |
| **CS-C-3** | Integration: contract lint green, all files parse, PAGE_TOOLS↔manifest verified, assets serve 200 over HTTP; `unmount()` lifecycle hook added to framework (py-runner worker cleanup). REMAINING (owner): run `supabase/cs-lab-saves.sql`; logged-in browser click-through of each tool; Pyodide+sql.js test ON THE SCHOOL NETWORK (R-1); ui-reviewer pass. Known items: py-runner `dice-random` task has no auto-check (unverifiable RNG sequence — deliberate); net-builder mesh failure-sim anchors reachability on PC1 (only misreports if all 4 of PC1's cables are cut) | CS-C-2 | 🔄 code done; owner verification pending |
| **CS-B** | Exam widgets (§7.3) | CS-0 (+ ideally W1–W3 data in place) | ⬜ |
| **CS-D** | Bank promotion (§7.4) | CS-A done + CS-B proven | ⬜ |

**Paper-1-first rationale:** exam PDFs exist for 1.1 only; Paper 1 topics need
no engine work; Paper 2 waves (W6–W8) land after their supporting Lab tools.
The owner can reorder waves to match teaching order at any time — waves are
independent after CS-0.

---

## 9. Agent workflow

### 9.1 Parallelisation rules (hard rules)

- One content builder per page; a wave runs ≤ 3 builders concurrently, each
  owning exactly one file under `subjects/computer-science/`.
- `subject.json`, shared JS/CSS, `netlify.toml`, and pipeline runs belong to
  the coordinator ONLY, serialized.
- Engine work (CS-B/CS-C) never runs concurrently with another engine agent on
  the same files; it MAY run alongside content builders (disjoint files).
- Before any session starts: `git status` + `git log --oneline -5` — parallel
  sessions land commits mid-stream; rebase your mental model.
- Long-running builders can drop mid-run; resume via SendMessage rather than
  restarting, and design pages so a resumed agent can Edit-append the missing
  arrays (check which `const` arrays already exist in the file).

### 9.2 Definition of done — content page

Split honestly between builder and coordinator (topic pages sit behind
`topic-guard.js` — an unauthenticated builder CANNOT click through the live
page; do not claim you did):

**Builder verifies:** (1) all 10 data consts present (9 arrays + `fibWords`;
plus `EXAM_CASE_STUDIES` if used), §5.1 targets met or a documented flag;
(2) the inline script body parses (extract it and check with the established
esprima/mini-racer harness, or `node --check` on the extracted script);
(3) structural assertions — every `ans`/`answer` index in range and correct,
every readCheck has exactly 4 opts, `blanks` keys match each display's `_____`
count, no backticks/`${` inside content strings, exam questions are original
per §6.2 (not transcribed from the PDF) with a tariff spread proportionate to
the topic's weight in the spec; (4) no third-party prose outside
`examQuestions`, no spec sentences.

**Coordinator verifies (before commit):** removes `noQuestions`, runs the
scoped pipeline, checks `section-totals.js` counts match the builder's report,
then — logged in — loads the page via the subject index, opens every tab, and
spot-checks 3 MCQs, 1 FIB, 1 matching round, 2 exam questions end-to-end with
zero console errors. Commits the slice.

### 9.3 Definition of done — Lab tool

Tool exercised on its first real page (not a harness): loads lazily, marks
correct/incorrect properly on 5 manual attempts incl. edge inputs, works in a
dark theme + on a phone-width viewport, survives a page reload (progress
persists), fails gracefully offline. ui-reviewer pass on the first page that
ships each tool; code-review before merge.

### 9.4 Builder prompts

Templates in Appendix E. Every delegation includes: the goal, the ONE file
owned, what NOT to touch, the DoD above, and where to report status. Vague
delegation produces confidently wrong pages.

---

## 10. QA gates

1. **Self-check** (builder, §5.2 step 6).
2. **Checker agent** per wave (different agent, fresh context): factual
   accuracy against Appendix B scope; mark-scheme fidelity vs the PDF; answer
   keys actually correct (recompute every calculation/conversion; run every
   Python snippet); leakage scan — no SaveMyExams/Paul Long/Craig'n'Dave
   phrasing, no spec-bullet prose, examiner quotes only inside `examQuestions`.
   Leakage calibration: flag lifted SENTENCES, not shared terminology —
   keyword lists (protocol names, register names, test-data types) will always
   match the spec's words; Appendix B phrasing is the scope baseline, not
   leakage.
3. **ui-reviewer** on CS-0's 1.1.1 page and on each new Lab tool's first page.
4. **security-auditor** once on CS-C (new CSP directives, worker, WASM, any
   localStorage handling) before deploy.
5. **Owner (teacher) sign-off** per wave — the human gate before students see it.
6. **Pipeline integrity** every run: scoped runs (`--subject computer-science`)
   must leave business/economics per-subject files untouched (`git status`);
   on any deliberate FULL rebuild, check counts (business = 3074 questions /
   37 pages, economics counts unchanged) — not bytes, because FIB option order
   shuffles with an unseeded RNG. CS counts equal the sum of builder reports.

---

## 11. Risks & unknowns (resolve riskiest first)

| # | Risk | Mitigation / resolution step |
|---|---|---|
| R-1 | **Pyodide blocked** (CSP, school filter, WASM policy) | CS-C-1 spike deploys a one-page Pyodide hello-world behind the gate and tests ON the school network before any T1-dependent content promises; fallback = vendor pyodide-core (owner decision) |
| R-2 | **Exam PDFs missing for 26 pages** | Owner supplies per §3 naming; waves W2+ flagged ⏳ if absent; pages build 8/9 tabs regardless |
| R-3 | **Fat topics** (1.3.1, 1.3.2, 1.6.1, 2.1.2, 2.2.3) | D7 protocol — builder stops and proposes; budget +3–5 extra pages if all split |
| R-4 | **ERL fidelity drift** (our snippets subtly non-ERL) | Appendix C is the only ERL reference builders use; checker validates every ERL snippet against it |
| R-5 | **OneDrive path length/parentheses** breaks tooling (the session scratchpad path is ALSO too long for some Python tooling — known env failure) | Helper scripts go in a short-path dir, e.g. `C:\Users\Public\csbuild\` (create, use, clean up); never inline one-liners over repo paths; pipeline runs from repo root |
| R-6 | **`<pre>`/`<code>` unsupported by taskRichText today** — code-stem bank questions would render as escaped literals on task/worksheet/daily-revise surfaces | Scheduled work, not a "verify": CS-0 step 6 extends the whitelist + styling and proves it on all three surfaces with a temporary test item. MUST land before any code-stem question ships (W6+) |
| R-7 | **Tick-grid/cloze fidelity loss in written mapping** | Accepted for CS-A (mark schemes preserve scoring rules verbatim); CS-B restores interactivity; monitor student confusion in W1 feedback |
| R-8 | **Parallel-session file collisions** | §9.1 hard rules; coordinator owns all shared files |
| R-9 | **Scope creep into KS3/KS5 CS** | Out of scope for this plan; J277 only (Won't-this-time) |

---

## 12. Open items for the owner

1. **Supply exam PDFs** for W2 onwards (naming per §3). The 1.2.4-family split
   is coordinator work — just drop whatever ExamBuilder gives you.
2. **Approve/deny splits** when D7 flags fire (expect 1.3.2 and 2.2.3 to fire).
3. **CS-D trigger** — when should Lab activity start counting toward XP/streaks
   and appear in Daily Revise/tasks? (Deliberately deferred.)
4. On R-1 fallback: OK to add ~35MB vendored Pyodide to the deploy if jsDelivr
   is blocked at school? (Only if the spike fails.)

## 13. Page status board

| Page | Built | Checked | Exam Qs in | Live (pipeline) |
|---|---|---|---|---|
| 1.1.1 CPU architecture | ✅ 2026-07-12 (5 topics · 12 mcq · 8 tf · 7 fib · 13 match · 5 misc · 3 tips · 16 cards) | ⬜ run E2 checker with W1 | ✅ 19 Qs / 53 marks | ✅ uploaded |
| 1.1.2 CPU performance | ✅ 2026-07-17 (6 topics · 12 mcq · 8 tf · 8 fib · 14 match · 6 misc · 3 tips · 18 cards) | ⬜ run E2 checker with W1 | ✅ 11 Qs / 35 marks (see note) | ✅ uploaded |
| 1.1.3 Embedded systems | ✅ 2026-07-17 (5 topics · 12 mcq · 8 tf · 8 fib · 14 match · 6 misc · 3 tips · 18 cards) | ⬜ run E2 checker with W1 | ✅ 8 Qs / 20 marks (full paper, no overlap) | ✅ uploaded |
| 1.2.1 Primary storage | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.2 Secondary storage | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.3 Units | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.4 Numbers | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.5 Characters | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.6 Images | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.7 Sound | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.2.8 Compression | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.3.1 Networks & topologies | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.3.2 Wired/wireless, protocols, layers | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.4.1 Threats | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.4.2 Preventing vulnerabilities | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.5.1 Operating systems | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.5.2 Utility software | ⬜ | ⬜ | ⬜ | ⬜ |
| 1.6.1 Impacts & legislation | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.1.1 Computational thinking | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.1.2 Designing/refining algorithms | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.1.3 Searching & sorting | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.2.1 Programming fundamentals | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.2.2 Data types | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.2.3 Additional techniques | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.3.1 Defensive design | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.3.2 Testing | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.4.1 Boolean logic | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.5.1 Languages | ⬜ | ⬜ | ⬜ | ⬜ |
| 2.5.2 The IDE | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Appendix A — J277 assessment intelligence (for tip/exam-question authors)

- AO weighting: AO1 30% / AO2 40% / AO3 30% (AO3 lives entirely in Paper 2).
- Paper 1: MCQ + short + medium + ONE 8-mark discuss (sustained reasoning; may
  carry bullet prompts e.g. stakeholders/technology/ethical/environmental).
- Calculators are banned in BOTH papers — mental binary arithmetic matters, so
  drills must be done without a calculator.
- Paper 2 Section A: answers may be pseudocode/flowchart/bullets/ERL/HLL/English;
  logic assessed, syntax not. Section B response contract: Design→English or
  pseudocode/flowchart; **Write→ERL or HLL ONLY (English/bullets score 0)**;
  Test→trace tables/test plans/test data; Refine→ERL/HLL/English.
- Mark schemes: point-per-bullet with accept/do-not-allow lists for ≤5 marks;
  banded levels (3 bands) for 6* and 8-mark items; "extra ticks void the row"
  on grids; pair-marking on two-column tables.
- Command words to tag questions with: State, Give, Identify, Define, Describe,
  Explain, Compare, Discuss, Evaluate, Justify, Calculate, Convert, Complete,
  Draw, Label, Order, Design, Write, Refine, Show, Tick.

## Appendix B — Per-page spec coverage (the builder's scope statement)

Compressed from the OCR J277 spec (v3.1). Each bullet = content the page MUST
teach; "NR" = explicitly not required (teach students the boundary too).

**1.1.1 Architecture of the CPU** — purpose of the CPU (fetch–decode–execute);
common components: ALU, CU, cache, registers (role of each); von Neumann
registers: MAR, MDR, PC, Accumulator — purpose of each and whether it holds
data or an address. NR: register-to-register data flow per FE stage.
**1.1.2 CPU performance** — clock speed, cache size, number of cores: what each
is and its effect on performance, individually and combined.
**1.1.3 Embedded systems** — purpose, characteristics, and a range of examples
(washing machine, engine management, etc.).
**1.2.1 Primary storage** — why computers need primary storage; RAM vs ROM
(characteristics, purposes); virtual memory (why + how RAM↔secondary transfer
works); cache's place in the hierarchy.
**1.2.2 Secondary storage** — need for it; optical/magnetic/solid-state;
choose suitable device per scenario judged on capacity, speed, portability,
durability, reliability, cost. NR: internal component parts of each medium.
**1.2.3 Units** — bit, nibble(4), byte(8), KB/MB/GB/TB/PB (1,000× steps per the
spec; note that mark schemes have also accepted 1,024 conversions — teach
1,000×, mention the alternative); why data must be binary; capacity requirement
calculations; file-size formulas: sound = sample rate × duration(s) × bit
depth; image = colour depth × height × width; text = bits/char × number of
characters.
**1.2.4 Numbers** — denary↔binary ≤8 bits (0–255, incl. padding e.g. 11010 →
00011010); MSB/LSB; binary addition ≤8 bits + overflow; denary↔2-digit hex
(00–FF); binary↔hex; binary shifts left/right and their ×2/÷2 effect.
**1.2.5 Characters** — character sets; binary codes for characters; bits-per-
character ↔ number of representable characters; ASCII is a 7-bit set (128
characters) commonly stored one byte per character — exam questions typically
present it as 8 bits, and calculations must use the bits-per-character GIVEN in
the question; logical ordering ('B' = 'A'+1); Unicode vs ASCII (more bits →
more characters/languages). NR: memorising codes.
**1.2.6 Images** — image = pixels, each pixel a binary colour code; colour
depth and resolution effects on quality AND file size; metadata (dimensions etc.).
**1.2.7 Sound** — analogue→digital sampling; sample rate (Hz), duration, bit
depth (bits/sample); effects on quality and file size.
**1.2.8 Compression** — why compress; lossy vs lossless: how each behaves,
advantages/disadvantages, scenario choice. NR: performing specific algorithms.
**1.3.1 Networks & topologies** — LAN vs WAN; performance factors (devices,
bandwidth); client-server vs peer-to-peer; hardware: WAP, router, switch, NIC,
transmission media; internet as a WAN: DNS (URL→IP), hosting, the cloud
(pros/cons), web servers/clients; star vs mesh topologies (pros/cons, scenarios).
**1.3.2 Wired/wireless, protocols & layers** — Ethernet vs Wi-Fi/Bluetooth
(compare, not internals); encryption principle; IPv4/IPv6 format & purpose;
MAC purpose/format; standards concept; protocols: TCP/IP, HTTP, HTTPS, FTP,
POP, IMAP, SMTP (basic purpose each); layering concept (4-layer TCP/IP as the
teaching example). NR: how the radio tech works, static/dynamic or public/
private IP, layer names/functions memorisation.
**1.4.1 Threats** — malware forms, social engineering (phishing; people as the
weak point), brute force, DoS, data interception/theft, SQL injection concept —
how each works and what it's for.
**1.4.2 Prevention** — penetration testing, anti-malware, firewalls, user
access levels, passwords, encryption, physical security — and WHICH 1.4.1
threat each limits (that mapping is the exam skill).
**1.5.1 Operating systems** — UI, memory management + multitasking, peripheral
management + drivers, user management, file management: what each does.
NR: paging/segmentation.
**1.5.2 Utility software** — housekeeping role; encryption software,
defragmentation, data compression: purpose and why needed.
**1.6.1 Impacts & legislation** — ethical/legal/cultural/environmental/privacy
impacts of digital tech (discussion skill, 8-marker home); DPA 2018, Computer
Misuse Act 1990, Copyright Designs & Patents Act 1988 — purpose of each, what
it allows/prohibits; open source vs proprietary licences (features, recommend
per scenario).
**2.1.1 Computational thinking** — abstraction, decomposition, algorithmic
thinking: definitions + how each helps define/refine problems.
**2.1.2 Designing/refining algorithms** — inputs/processes/outputs; structure
diagrams; create/interpret/correct/complete/refine algorithms in pseudocode,
flowcharts, ERL; syntax vs logic errors (spot + fix); trace tables (build +
complete); nesting selection/iteration. Flowchart symbols: line, input/output,
process, decision, sub-program, terminal.
**2.1.3 Searching & sorting** — binary search (prerequisite: sorted), linear
search; bubble, merge, insertion sort: main steps, apply to a data set,
identify the algorithm from its code. NR: memorising the code.
**2.2.1 Programming fundamentals** — variables/constants/operators/inputs/
outputs/assignment; sequence, selection, iteration (count- & condition-
controlled); comparison ops == != < <= > >=; arithmetic + − * / MOD DIV ^;
Boolean AND OR NOT.
**2.2.2 Data types** — integer, real, Boolean, character, string; casting
(str/int/float/real/bool); choosing suitable types.
**2.2.3 Additional techniques** — string manipulation (.length, substring,
left/right, upper/lower, ASC/CHR, concatenation, slicing); file handling
(open/read/write/close, readLine/writeLine/endOfFile, newFile); records
concept; **SQL: SELECT, FROM, WHERE only**; arrays 1D + 2D (0-indexed, static,
2D-as-table); functions vs procedures, parameters, return, local vs global;
random(a,b).
**2.3.1 Defensive design** — anticipate misuse; authentication; input
validation (practical); maintainability: sub-programs, naming, indentation,
commenting.
**2.3.2 Testing** — purpose; iterative vs final/terminal; syntax vs logic
errors; test data: normal, boundary, invalid, erroneous; select suitable test
data; create/complete test plans; refining.
**2.4.1 Boolean logic** — AND/OR/NOT gate symbols + truth tables; combine
gates; create/complete/edit logic diagrams and truth tables for multi-gate
circuits. Alternative notations accepted (T/F, ∨ etc.).
**2.5.1 Languages** — high vs low level (characteristics, purpose); need for
translators; compiler vs interpreter (characteristics, benefits, drawbacks).
NR: assemblers.
**2.5.2 The IDE** — editor, error diagnostics, run-time environment,
translators: how each helps a developer.

## Appendix C — OCR Exam Reference Language quick reference (the ONLY ERL source for builders)

```
// comment                          x = 3        const vat = 0.2    global id = "C1"
input(prompt)   print(expr)         casting: str() int() float() real() bool()
for i=0 to 9 [step n] … next i      while cond … endwhile          do … until cond
if cond then … elseif cond then … else … endif
switch var: case v1: … case v2: … default: … endswitch
Strings (0-indexed): s.length  s.substring(start,len)  s.left(n)  s.right(n)
  s.upper  s.lower  ASC(ch)  CHR(n)  concatenation with +
Files: f = open("x.txt")  f.readLine()  f.writeLine(s)  f.endOfFile()  f.close()  newFile("x.txt")
Arrays (0-indexed): array names[5]   array board[8,8]   names[3] = "N"   board[1,0] = "P"
Sub-programs: procedure p(a) … endprocedure     function f(a) … return v … endfunction
random(1,6) inclusive
Boolean literals: true / false
Operators: == != < <= > >=   |   + - * / ^ MOD DIV   |   AND OR NOT
Worked expression example: 17 MOD 5 == 2, 17 DIV 5 == 3, 2^3 == 8;
  if (age >= 13 AND age <= 19) OR member == true then … endif
```
SQL (2.2.3, not part of ERL): `SELECT fields FROM table WHERE condition`.
House style: ERL keywords lowercase as shown except MOD/DIV/AND/OR/NOT and
ASC/CHR; Python equivalents must run under CPython 3.

## Appendix D — File checklist for ANY new bank source/type (CS-D)

`tools/build_question_bank.py` (SOURCES list + parser + totals) · `script.js`
(renderer + tab + ProgressStore + tab-progress config) · `daily-revise.js` ·
`review-calendar.js` · `task.html` · `tasks-shared.js` · `teacher-tasks.html`/
picker · `teacher-worksheets.html` (picker duplicated from tasks — sync BOTH) ·
`teacher-analytics.html` · `teacher-dashboard.html` · `gamification.js` ·
`progress-shared.js` · `section-totals-all.js` · `netlify/functions/weekly-retry-tasks.js` ·
seed SQL under `supabase/bank-questions-seed/computer-science/` ·
`question-report.js` (report-a-question must open on the new type).
Verify with: `grep -rn "'fib'" --include=*.js --include=*.html --exclude-dir=node_modules .`
as the map of switch points (expected noise: `Templates/template.html` tab
markup; generated files like `section-totals-all.js` update via the pipeline
once `SOURCES` changes).

## Appendix E — Delegation prompt templates

### E1. Content builder (one page)

> Build the topic page `subjects/computer-science/<FILE>` for Vidya (GCSE CS,
> OCR J277). You own ONLY this file. Do not touch subject.json, shared JS/CSS,
> other pages, this plan file, or run any build tools. Read first:
> (1) CS-CONTENT-PLAN.md §4, §5, §6, Appendix A, Appendix B entry for
> <SPEC REF>, Appendix C; (2) the exemplar
> `subjects/economics/1.2_The_basic_economic_problem.html` (shapes + voice).
> The scaffolded page already exists — replace ONLY the data consts (`topics`,
> `mcqData`, `matchData`, `fibData`, `fibWords`, `tfData`, `miscData`,
> `examTips`, `flashcards`, `examQuestions`, plus `EXAM_CASE_STUDIES` if
> needed). Also: change the header `<p>` from "Interactive revision guide ·
> Content coming soon" to "Interactive revision guide" and remove the word
> "placeholder" from the DATA comment. Do NOT modify `pageMeta` (its id feeds
> bank ids).
>
> **Coverage — nothing skipped.** Appendix B's entry for <SPEC REF> is your
> entire scope AND your checklist: every bullet in it must land somewhere in
> `topics`, `flashcards`, or a practice array. None may be quietly dropped
> because it's awkward to phrase or doesn't fit a favourite question format.
> If a bullet genuinely won't fit inside the §5.1 size cap, that's a split
> trigger (below) — never a reason to cut it.
>
> **Own words, always (copyright).** All teaching content — Learn cards,
> `miscData`, `examTips`, `flashcards` — is written from your own
> understanding of the spec, never lifted or lightly reworded from the OCR
> spec text, SaveMyExams, Paul Long, Craig'n'Dave, or any other source (D6,
> clean-room hygiene).
>
> **Exam questions are ORIGINAL, not transcribed (§6.2, 2026-07-17 owner +
> copyright decision).** Do NOT open, extract, or paraphrase `CS
> resources/ExamquestionsNew/*.pdf` or `mock-papers/*.js` — reproducing OCR's
> papers digitally is not covered by the classroom-photocopy notice on those
> PDFs. Instead, author fresh, OCR-J277-style questions straight from the
> Appendix B spec scope, with your own scenarios (a real, specific situation
> per stem, not a generic placeholder) — the goal is COMPREHENSIVE coverage of
> every sub-topic, not a token one-question set.
>
> **Cover the question forms this topic is actually examined in.** Use the
> §6.1 taxonomy as your menu (MCQ, tick-grid, draw-a-line matching,
> complete-a-table, cloze / word-bank cloze, identify/state/describe/explain/
> justify, interpret-a-figure, 6-mark QWC, 8-mark discuss, calculate/convert,
> write/complete ERL code, truth/trace table, order/sequence). Pick the forms
> genuinely suited to this spec point — don't force a form that doesn't fit
> the topic just to tick a box — tag each with the correct `format` value from
> §6.2's enum, and spread tariffs/command words per §5.3. Every spec bullet
> should be examined in at least one form somewhere on the page.
>
> **Exam tips and misconceptions must be real, not invented.** Every
> `examTips` ladder and `miscData` entry has to be a genuine J277 convention or
> a real student trap — check it against Appendix A (AO weighting, command-word
> meanings, mark-scheme conventions) and the known-trap examples in §5.3, not
> something that merely sounds plausible. If you're not confident a
> "misconception" is a real error students make on this topic, leave it out
> rather than guess.
>
> **Smaller cards over dense ones.** Within the §5.1 cap, prefer more, narrow
> Learn cards to fewer crowded ones — split a card the moment it's carrying two
> distinct sub-ideas or creeps past ~8 bullets, so each card is one question-led
> idea a student can digest in one sitting.
>
> **If the topic is too big for one page, say so — don't cut content to fit.**
> If the full Appendix B scope still doesn't fit the size cap after tightening
> and splitting cards, STOP before writing further arrays and report a
> proposed split (e.g. "1.3.2a connections + 1.3.2b protocols and layers") for
> the owner to approve (D7). Don't split a topic that comfortably fits as one
> page just because it theoretically could be two.
>
> Verify per §9.2 BUILDER portion only (parse check + structural assertions —
> the live page sits behind an auth guard; do not claim browser checks you
> cannot perform). Report: counts per array, marks total of exam section,
> every Appendix B bullet and where it landed, and any flags (split proposal,
> scope doubts). "Done except verification" is not done.

### E2. Checker (one wave)

> You are the checker for wave <W> pages <LIST> of the Vidya CS build. Read
> CS-CONTENT-PLAN.md §2, §5, §6, §10 and Appendix B/C. For each page verify:
> every fact against the Appendix B scope; every answer key (recompute all
> calculations/conversions; mentally execute all code — flag any ERL that
> violates Appendix C; run Python snippets); every readCheck has 4 opts and a
> correct ans; mark schemes match the source PDF; NO prose from SaveMyExams/
> Paul Long/Craig'n'Dave/the spec anywhere (flag lifted SENTENCES, not shared
> terminology — protocol/register/keyword names always match the spec's words);
> examiner-report language only inside examQuestions; `format` values only from
> the §6.2 enum. Produce a numbered defect list with file:line refs and
> severity. Do not edit files.

---

*Retro log (append one line per delivered wave: what would have made it faster/safer?)*

- **MCQ length-bias sweep (2026-07-17, owner):** 108 of 165 authored MCQs/readChecks had the correct option as the single longest — a real "guess the longest" tell that undermines learning. Root cause is structural: a correct answer written in full is naturally longer than terse wrong ones, so this bias appears by DEFAULT unless authored against. Now a hard gate in verify-page.js + a §5.3 rule, and swept across all 6 built pages by one-agent-per-page (correct answers never touched; distractors rewritten into full plausible misconceptions, not padded). One agent also caught adjacent tells the brief didn't name (the definition embedded only in the correct option; distractors that explain their own wrongness) — worth adding to the rule if it recurs. Lesson: quality rules like this must be BUILT INTO the recipe from page 1, because retrofitting is a whole extra wave.

- **CS-0 (2026-07-12):** Q5's draw-a-line items were an embedded image, not text — PDF text extraction alone wasn't enough; rendering the page to PNG and reading it recovered the item lists. Builders should render any page whose question text looks incomplete. Also: the ExamBuilder mark schemes are per-question and immediately reusable — extraction is fast, don't over-plan it.
- **CS-C waves 1–2 (2026-07-13):** 6 parallel agents on disjoint new files with a pre-built framework contract = zero collisions and uniformly strong verification; the contract header comment in cs-lab.js did more coordination work than any prompt. The §4.4 scaffolder-reset trap fired FOR REAL mid-build (a template-change re-run silently re-flagged 1.1.1 noQuestions) — the documented rule caught it; never run the scaffolder without diffing subject.json after. Tools holding live resources need lifecycle hooks — added unmount() only after an agent hit the gap; design lifecycle first next time.
- **Python Lab v2 (2026-07-13):** interactive `input()` in a Pyodide worker genuinely needs SharedArrayBuffer + cross-origin isolation (COOP/COEP) — there is no lighter path for SYNCHRONOUS Python input from a worker; the worker blocks on `Atomics.wait`, main writes the line + `Atomics.notify`. COEP `credentialless` (not `require-corp`) avoids breaking Google Fonts/no-cors subresources; scope the headers to CS pages only so nothing else is touched. Stream stdout with Pyodide `write` (not `batched`) or `input()` prompts (no trailing newline) never appear before the input box. Pause the run-timeout while awaiting input. netlify dev does NOT hot-reload netlify.toml headers — restart + `curl -I` after any header edit. All of this is unit-testable in node (worker protocol, SAB decode with mocked Atomics, PRIMM logic) EXCEPT the real Pyodide+SAB round-trip, which only a browser can confirm.
- **Answer-box sizing (2026-07-17, owner — took two passes):** on screen a box opens at **one line per mark** (`linesForBox`), grows as the student types, scrolls past 5. "Give three characteristics [3]" = three ONE-line boxes; a 3-mark single box = 3 lines; 8-markers open at the full 5. Override an uneven split with `q.stubLines`. **The first attempt silently failed**: the inline `height` was overridden by `.ep-answer-area { min-height: 120px }` in style.css (min-height always beats height), so every box stayed ~4 lines and my jsdom test — which asserted the *inline style* — passed anyway. Two lessons: (1) `.ep-answer-area` is required for the paste-guard, so any widget using it MUST reset `min-height: 0`; (2) **a headless test that asserts what your code SET, not what the page RENDERS, will happily confirm a bug** — jsdom has no cascade, so CSS-override bugs are invisible to it. Assert the model (`rows`/`_minLines`), and treat "the owner can still see it" as the real test. `q.lines` remains the mock-exam PRINT size, where a full handwriting space IS wanted; code boxes stay taller (algorithms need structure visible).
- **Reusable verifier (2026-07-17):** `C:\Users\Public\csbuild\verify-page.js <page.html>` structurally checks any CS topic page (counts, readCheck shape, fib blanks vs `_____` vs fibWords, tips pills, exam field completeness, format enum, caseId resolution, mcq option ranges, bankCloze tokens ↔ answers ↔ bank, markPoints maxes summing to the tariff, stray `${`). Run it on every page before go-live; it caught nothing on W1 only because the checks were written from W1's real bugs.
- **1.1.2 (2026-07-17):** the ExamBuilder topic PDFs **overlap** — 19 of 1.1.2's 54 marks are questions already live verbatim on 1.1.1 (the Kerry cloze = 1.1.1 Q8; Dipesh = 1.1.1 Q11), and Q7 repeats Q2 *within the same PDF*. Decision: keep each question on ONE page (1.1.2 shipped 35 marks of unique questions incl. both extended-response items) rather than show students the same question twice. **Every future topic builder must diff their PDF's questions against already-live pages before transcribing.** Also: Fig. 4 was an embedded image that text extraction dropped silently — rendering the page to PNG recovered it (second time this trap has fired; always render figure pages). Marks that ARE on the wrong page (1.1.1 holds two questions that are really 1.1.2 content) were left alone — 1.1.1 is owner-approved and stable.
- **CS-B exam widgets + mocks (2026-07-17):** grounding the widget design in a census of the REAL papers changed the priorities completely — ruled-lines prose is 42% of all marks, the flashy grids only ~10%; without the census we'd have built the wrong thing first. Cross-agent data-shape drift happened exactly where predicted (transcriber invented `q.answers` at top level + `openChoice` while the widget builder worked from the brief's nested shapes) — the fix was cheap because BOTH agents were told about each other's outputs in their resume/launch briefs and the grids agent reconciled to the real data itself. Session-limit kills mid-run are survivable: all three agents resumed via SendMessage with full context and finished clean. And the §4.4 scaffolder reset trap fired a THIRD time (index regeneration) — the fix-after-run procedure is now muscle memory, but any future scaffolder change should just stop resetting noQuestions on existing manifest entries.
- **CS-C first real browser test (2026-07-13):** two coordinator-introduced bugs only surfaced once a human actually clicked through — no amount of unit testing would have caught either. (1) `cs-lab.js` checked `window.pageMeta`, but pages declare `pageMeta` with `const` — a global-scope identifier, never a `window` property. This silently zeroed out the Practice Lab on EVERY page; nothing threw, so nothing failed loudly. Lesson: `typeof x !== 'undefined'` + bare identifier is the correct cross-script-tag pattern on this codebase (script.js already does this at line 4732) — always grep for the existing convention before inventing a new access pattern. (2) pyworker.js only started loading Pyodide on receiving a 'run' message; py-runner.js only ever sends 'run' after receiving 'ready' — a two-file deadlock invisible to both files' own unit tests (each tested its OWN logic correctly in isolation; the bug was purely in the choreography BETWEEN them). Lesson: message-passing protocols between two independently-built files are exactly the seam integration/browser testing exists for — flag them for a live click-through explicitly, don't let "both sides unit-tested" read as "verified". Separately: `netlify dev` does not hot-reload `netlify.toml` headers — a stale dev-server process silently served an old CSP for hours; always confirm header changes with a fresh `curl -I`, not just a file edit.

