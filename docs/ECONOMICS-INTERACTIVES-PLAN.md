# Economics interactive activities — build plan

**Status:** PLAN (written 2026-07-19), not built. Source of truth for the four
new economics activity types. Approved directions: Diagram Lab, Calculation Lab,
Data-Response Lab, Evaluation Builder — "plan first, then build".

Economics currently has the nine standard activities (Key Learning, MCQ,
Matching, Fill-the-Blanks, Misconceptions, Exam Tips, Flashcards, True/False,
Exam Practice) plus faithfully transcribed exam questions. What it CANNOT do
yet is let a student *practise* the two hands-on skills the spec singles out —
and both are things other subjects already got a bespoke capability for (CS
practice labs, Maths numeric comparator, Spanish voice).

---

## 1. Why these four — the spec argument

OCR J205 §3c maps command words to assessment objectives:

| AO (weight) | Command words |
|---|---|
| **AO1** (35%) | State · Give an example · Explain · **Calculate** · **Draw** |
| **AO2** (35%) | (apply to context) |
| **AO3** (30%) | **Analyse** · **Evaluate** |

- **"Draw"** and **"Calculate"** are AO1 command words — on *every* paper — and are exactly the two skills the site cannot practise interactively today (static PNG diagrams + a written mark scheme only).
- §5d: **at least 10% of all marks reward quantitative skills.**
- §3j: the **extended-response** (evaluation) questions 21/22/23 (d)(iii) are asterisked in *both* papers — AO3 is 30% of the qualification and where students lose the most.
- The content pages demand data analysis throughout: *"analyse recent and historical GDP / inflation / unemployment data"*, *"quantitative information on exports and imports"*.

Each activity targets one of these, and each maps to specific spec bullets (§2 below).

### Spec → activity coverage

**Draw (→ Diagram Lab).** Every "draw" bullet in the spec:
- 2.2 draw & explain a demand curve from data (individual + market); draw shifts of / movements along; draw demand curves of different elasticity
- 2.3 the same three for supply
- 2.4 draw & analyse the interaction of demand and supply; analyse how market forces affect equilibrium price & quantity
- 3.8 (implied) tax/subsidy & externality diagrams — the exam papers carry MS answer diagrams for these

**Calculate (→ Calculation Lab).** Every "calculate" bullet:
- 2.6 total cost, average cost, total revenue, average revenue, profit, loss
- 2.7 gross & net pay (income tax, National Insurance, pension deductions)
- 2.8 effect on savings & borrowings of interest-rate changes
- 3.1 GDP and GDP per capita
- 3.2 unemployment rate (Claimant Count)
- 3.4 effect of inflation on prices (CPI; real vs nominal)
- 3.5 effect of taxes & government spending on markets / the economy

**Analyse data (→ Data-Response Lab).** 3.1 GDP data · 3.2 unemployment figures · 3.4 inflation figures · 4.1–4.4 exports/imports & exchange-rate data.

**Evaluate (→ Evaluation Builder).** Every "evaluate" bullet (2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 3.1, 3.4, 3.5, 3.6, 3.7, 3.8, 4.x) and the asterisked (d)(iii) extended responses.

---

## 2. How each plugs into the existing architecture

The survey (see below for the seams) shows the lift is far smaller than "four
new features": three of the four reuse machinery already shipped for CS/Maths.

### A. Calculation Lab — LOWEST lift (mostly authoring)
The Maths **numeric comparator already exists and is subject-agnostic**:
- Client widget: `cs-lab/exam-widgets.js` `register('numeric', …)`, `mountNumeric()` — grades with `numericKeyCorrect()` (exact `accept[]` OR `|value − key.value| ≤ tol`).
- Auto-routing: `_epUseWidget(q)` (`script.js:3971`) sends any exam question with `format:"numeric"` to the widget — **no `script.js` change**.
- Server grading: `qtype:'numeric'` branch in `supabase/topic-grading.sql`; the comparator is mirrored byte-identical in `supabase/numeric-normalise.sql`.
- Build emitter: `tools/build_question_bank.py:542-570` already turns a `format:"numeric"` exam question into a `qtype:'numeric'` bank row (snapshot has no answer; `answer_key.numeric` hidden, RLS-protected).

**So the Calculation Lab is: author numeric questions.** Two delivery modes:
1. **Exam-embedded** — add `format:"numeric"` + `numeric:{…}` to existing/new
   `examQuestions` (e.g. 2.6 cost/revenue parts, 2.7 net pay, 3.2 unemployment
   rate). These auto-grade client- AND server-side today.
2. **A dedicated "Calculation" practice tab** (`economics-lab` tool, see D) that
   *generates fresh numbers each attempt* so students can drill to fluency —
   client-side only, self-contained, no bank rows. Use the `mathParts` idiom
   (`exam-widgets.js` `mountMathParts`) for multi-step "show your working"
   questions (step marks: figures mark + answer mark; Own Figure Rule).

Authoring rules (from the economics mark schemes): require the £ sign where the
scheme does; "loss" must be stated as a loss/negative; percentages need ÷100;
reward shown working under the Own Figure Rule via `mathParts` `markPoints`.

### B. Data-Response Lab — LOW lift (reuse bank + existing PNGs)
Reduces to question types the bank already supports (`mcq`, `numeric`) attached
to a chart the student reads. You already have the extracted charts
(`images/economics/*-extracted.png`) and the `caseStudy` field renders `<img>`.
Delivery: a set of MCQ/numeric items whose `caseStudy` is a chart, authored to
bake in the recurring examiner traps this course documents:
- "inflation fell from 14% to 8% — did prices fall?" → No, still rising
- trend answer = direction + one figure; rewriting the data scores 0
- annual-%-change vs level confusion
No new code; optionally a thin `economics-lab` "Data detective" tool to theme it.

### C. Evaluation Builder — LOW/MEDIUM lift (new widget `format`, no SQL)
Model on `mathParts` + `buildSelfMarkPanel()` (`exam-widgets.js`), which already
does point-by-point self-marking with no server answer and no `script.js` change
(`_epUseWidget` routes it, `_epSaveWidgetResult` persists it). New `format:
"evalBuilder"` in the `CsExamWidgets` registry:
- Student assembles/reveals **point → linked counter-point → supported judgement**
  (the Level-3 structure: "One reason… However… Overall…").
- Self-marks against grouped `markPoints` (the house self-marking convention —
  see docs/SELF-MARK-POINTS-AUTHORING.md; mark points MUST match the tariff).
- Purely client-side; reuses the KaTeX-free rich-text already in the widgets.

### D. Diagram Lab — HIGHEST lift (new interactive canvas tool)
No economics diagram widget exists (economics pages are static PNG only). The
closest precedent to CLONE is **`maths-lab.js` + `maths-lab/tools/graph-explorer.js`**:
a self-installing lab that injects a 10th tab and lazy-loads tool modules, each
a pure math core + a thin `getContext('2d')` layer, keyed by `pageId` so pages
never need editing.

Plan a new framework **`economics-lab/economics-lab.js`** (self-guards to
`subject==='economics'`, mirrors `cs-lab.js`/`maths-lab.js`) with tools under
`economics-lab/tools/`:

- **`supply-demand.js`** — an SVG/canvas with a Demand line and a Supply line;
  equilibrium (P\*, Q\*) computed live from their intersection and shown with
  dashed guide lines. Controls: shift D left/right, shift S left/right, steepen/
  flatten each (elasticity). Pure core: two lines `p = a − b·q` (D) and
  `p = c + d·q` (S); `equilibrium()` solves for intersection — unit-testable with
  no canvas (as graph-explorer's math core is).
- **Challenge mode** (auto-marked, client-side): e.g. *"A new indirect tax raises
  firms' costs. Shift the correct curve, then state what happens to equilibrium
  price and quantity."* Checks the student shifted **S left** and selected **P↑
  Q↓**. Feedback names the mark-scheme rule ("unlabelled axes score 0";
  "movement along vs shift").
- **Elasticity insight:** same shift on a steep (inelastic) vs flat (elastic)
  curve — watch price move more when demand is inelastic.
- Assigned via a `PAGE_TOOLS`-style map: 2.2 (demand), 2.3 (supply), 2.4
  (equilibrium/price), 2.5 (competition), 3.8 (tax/subsidy on externalities).

Progress/state: client-side localStorage mirror with optional cloud sync to a
new table (mirror `cs_lab_saves`), OR keep it ungraded/practice-only for v1 to
avoid a schema change. **v1 recommendation: practice-only, no server row** — the
learning value is in the manipulation, and it sidesteps SQL + RLS work.

---

## 3. Build order

Ordered by value-per-unit-effort, each shippable independently:

1. **Calculation Lab (exam-embedded numeric)** — highest ratio: the widget,
   router, grader, and SQL mirror already exist. Author numeric questions for
   the 7 "calculate" bullets (start 2.6, 2.7, 3.2, 3.4). *Days, mostly content.*
2. **Data-Response Lab** — author chart-based mcq/numeric items with the examiner
   traps; reuses bank + existing PNGs. *Days, content.*
3. **Diagram Lab pilot** — build `economics-lab` + `supply-demand.js`, pilot on
   **2.4 Price** (equilibrium is the cleanest first case), then extend to 2.2/2.3.
   *The real engineering; do one topic end-to-end for review before scaling.*
4. **Evaluation Builder** — new `evalBuilder` widget `format`; pilot on one
   6-marker, then roll across the (d)(iii) extended responses.

Phases 1–2 need **no new JS files and no SQL** — they exercise paths already in
production. Phase 3 is the only substantial new code. Phase 4 is one new widget.

---

## 4. Definition of done (per activity)

- **Authoring contract honoured:** numeric answers hidden from the client
  (bank `answer_key`, never in `snapshot`); mark points match the tariff
  (self-mark convention); MCQ option-quality rules (correct answer not the
  longest; vary position) still enforced by the existing checkers.
- **Determinism:** `python tools/build_question_bank.py --subject economics
  --seed 12345` rebuilds clean; marks totals unchanged unless questions added.
- **Client + server agree:** any new auto-graded type keeps its JS and SQL
  comparators byte-identical (as `numeric` does across `exam-widgets.js` /
  `numeric-normalise.sql`).
- **Diagram Lab:** pure math core unit-tested headless (equilibrium, shift,
  elasticity) with `jsdom`/node; canvas layer verified in a real browser via the
  Playwright toolchain; challenge auto-marking proven by injection (right answer
  passes, wrong fails) as with the other verification harnesses this repo uses.
- **No topic-HTML edits for labs:** tools key off `pageId`, matching cs-lab /
  maths-lab, so the 88 topic HTMLs are never touched (house rule: features live
  in shared JS).

## 5. Risks / open questions

- **Diagram Lab scope creep** — a full "policy sandbox" sim (interest rates →
  saving/borrowing; tax burden) is tempting but out of scope for v1; the
  supply/demand core is the spec-required part. Sandbox is a later extension.
- **Server persistence for the lab** — v1 is practice-only (no schema change).
  If diagram challenges should count toward progress/streaks later, add a
  `cs_lab_saves`-style table + RLS then, not now.
- **Numeric authoring volume** — the payoff of the Calculation Lab scales with
  how many "calculate" items are written; treat it as an ongoing content stream,
  not a one-shot.
- **Accessibility** — the diagram tool needs a non-drag path (buttons, not only
  pointer-drag) and readable contrast in both dark themes (theme.js).
