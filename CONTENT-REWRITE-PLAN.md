# Phase R — Original Content Programme (copyright-clean rewrite)

Created 2026-07-11. Companion to `PLATFORM-V2-MASTER-PLAN.md`.

**Situation:** for the 2026–27 year the platform is free, used only by our own
school's students — a classroom study aid. Before the platform takes **any
money** (school invoices or individual subscriptions), every piece of content
derived from OCR exam papers, mark schemes, examiner reports, or other
third-party sources must be replaced with original material. The product's value
is the SYSTEM (Daily Revise, spaced repetition, tasks, AI marking, analytics);
the content must be original, exam-realistic, and at least as good as what it
replaces.

**Trigger:** start Phase R **16 weeks before the planned paid-launch date**.
Nothing in Phase R blocks the free-year roadmap. §3 sets the policy for content
still being written during the free year — read it, it's an explicit owner
choice, not an automatic rule.

> ⚠ This plan is engineering guidance, not legal advice. Before charging money,
> have a UK IP solicitor review: (1) a sample rewritten topic, (2) the exam-board
> name usage on the site, (3) the terms of sale. Budget one short engagement.

---

## 0. The rules every content agent must follow

Written for LLM agents. These distinctions decide everything downstream.

**NOT protected — free to use:**
- Facts, concepts, theories, definitions-as-ideas (what price elasticity IS,
  how break-even works, what a balance of payments records).
- The curriculum topic list (we teach the same 22/37/11 topics — that's an idea).
- Question FORMATS and structures (a 2-mark "state", a 9-mark "evaluate with
  a recommendation", MCQ with 4 options, fill-in-the-blank, diagram questions).
- Mark tariffs as numbers (2/4/6/9/12 marks), command words as single words
  (state, explain, analyse, evaluate), assessment-objective concepts (AO1/2/3).
- General exam technique advice expressed in our own words.

**PROTECTED — must never appear in shipped content:**
- The wording of real exam questions (even lightly paraphrased).
- Real case studies/extracts: company names, characters, storylines, data
  ensembles (Celandine Hotel, Plumwith Holidays, Kasia & Ben's window cleaning,
  the charity-shop dresses, CDS delivery — and every other one).
- Mark-scheme text: indicative content lists, level descriptors, "award 1 mark
  for…" phrasing copied or closely paraphrased.
- Examiner-report sentences ("Many candidates could not access more than three
  marks as they included no link to the extract" — these are quoted verbatim in
  our misconception cards today).
- Images cropped/extracted from papers or mark schemes (all 58
  `images/economics/*-extracted.png` files).
- The specification's own prose beyond short functional labels (topic TITLES are
  fine; copying spec bullet sentences wholesale is not).
- Third-party expression: textbook passages, YouTube "Video Notes" phrasing if
  closely followed (ideas fine, wording not).

**TRADEMARK (separate from copyright):** "OCR", "AQA" etc. are trade marks.
Compatibility statements are allowed: *"designed to support the OCR GCSE
Business (J204) specification"*. Never imply endorsement; add a footer
disclaimer: *"Not endorsed by or affiliated with OCR."* No OCR logos ever.

**The clean-room principle (how agents avoid accidental copying):** the agent
WRITING new content never sees the old exam-derived material or any OCR
document. It works only from: the topic outline (our own words), the Standards
Pack (§R1), and the Scenario Bank (§R2). A separate CHECKER agent — which DOES
see the old content and the blocklist — verifies nothing leaked through. Writers
create; checkers compare. Never the same agent, never the same context window.

---

## 1. What is at risk in this repo today (inventory baseline, 2026-07-11)

| Asset class | Where | Scale | Risk |
|---|---|---|---|
| Past-paper question banks | `subjects/business/exam_prep/` (paper1_all_AO1/AO2, paper2_All_MCQ, paper analyses) | 6 whole pages | SEVERE — verbatim papers; **delete or fully replace, never "edit"** |
| examQuestions arrays (questions + mark schemes + model answers from real papers) | all 59 content pages, embedded per page; mirrored into `bank_questions` seeds | ~59 pages' exam sections | SEVERE |
| Real case studies / extracts | examQuestions `caseStudy`/`caseId`, `EXAM_CASE_STUDIES`, `reading` fields | throughout | SEVERE |
| Examiner-report quotes | `miscData` (correct/wrong cards), `examTips`, some `explain` fields | 59 pages reference examiner/mark-scheme language | HIGH |
| Extracted exam images | `images/economics/*-extracted.png` (charts, grids, mark-scheme answer diagrams) | 58 files | SEVERE — direct reproductions |
| Mark-scheme level ladders | inside `markScheme` HTML blobs (graded L0/1/2 ladders per memory: built from real mark schemes) | economics + business exam sections | HIGH |
| Spec prose | topic intros possibly tracking spec bullets closely | unknown until R0 audit | MEDIUM |
| Video-Notes-derived teaching cards | `topics[].content` (economics recipe used Video Notes) | economics pages | MEDIUM — rewrite where phrasing tracks the videos |
| Source PDFs | `eco resources/` (LOCAL ONLY — now gitignored; never deploy) | n/a | contained |
| Originally-authored material | most MCQ/TF/FIB/match/flashcards stems, UI text, structure | majority of items | LOW — verify in R0, keep |

**Interim containment (already done / free-year hygiene):** `eco resources/`
gitignored; `robots.txt` blocks indexing of `/subjects/` and `/images/`;
WP-A3 (server-side auth gating) additionally takes ALL content off the open
web — prioritise it partly for this reason.

---

## 2. Programme architecture — five phases

```
R0 Inventory & tagging        → content-register.json  (what exists, provenance)
R1 Standards Pack             → 5 documents agents write FROM (the "clean room")
R2 Scenario Bank + tooling    → fictional universe + similarity gate scripts
R3 Pilot (3 topics)           → prove the process, tune the standards
R4 Wave rewrites              → 6–8 waves × 4–6 topics, gate + human review each
R5 Cutover & legal hygiene    → purge originals, reseed, disclaimers, solicitor
```

Roles per wave: **SCENARIO-SMITH** (extends the bank) → **WRITER** (clean-room
authoring) → **CHECKER** (similarity + factual QA) → **HUMAN** (teacher
sign-off — the owner) → **PIPELINE** (rebuild + reseed).

---

## 3. Free-year content policy for the topics still being written (OWNER'S CHOICE)

The remaining 12 economics topics (3.1–4.4) and future CS content are being
built during the free year. Two options — the owner has effectively chosen A,
and this plan is built to absorb it:

**Option A — current default: keep the verbatim recipe this year.**
Real past-paper questions, real mark schemes, real examiner guidance are the
best possible mock preparation for our own students, and classroom use this
year is the whole point. Cost: each verbatim page adds ~1 agent-day of Phase R
rewrite debt later (~12 more pages ≈ +2 wave-weeks — already inside the R4
estimate, which counts ALL 70 pages). Requirements while on Option A:
- Everything stays behind WP-A3's auth gate + robots.txt (no public exposure).
- Source PDFs stay local-only (`eco resources/` is gitignored — never commit).
- Keep the register-friendly structure (exam material stays inside
  `examQuestions`/`caseStudy`/`markScheme` fields, images keep the
  `-extracted` suffix) so R0's inventory auto-tags it cleanly for rewrite.

**Option B — write-clean for new pages (switch any time, per page):**
original exam-style items per the R1.1 blueprint, SVG diagrams instead of
extracted images, fictional scenarios, guidance without examiner quotes.
Reduces Phase R scope page-by-page; slightly weaker mock fidelity.

**Cheap wins worth taking even on Option A** (no fidelity cost):
- Write misconception/exam-tip *ladders* in our own words (state the trap and
  the fix without quoting examiner-report sentences verbatim where a paraphrase
  teaches identically).
- Keep new teaching cards (`topics[].content`) paraphrased from understanding —
  they mostly already are.

---

## 4. Phase R0 — Freeze & inventory (1 week)

**Goal:** a machine-readable register of every content asset with a provenance
tag, so waves can be planned and progress measured.

**Deliverables:** `tools/content_inventory.py`, `content-register.json`
(gitignored if it quotes protected text; summary CSV committed), counts report.

**Steps**
1. Script walks every `subjects/*/​*.html` (and `subjects/business/exam_prep/`),
   parses the data arrays (reuse the extraction logic in
   `tools/build_question_bank.py` — do not re-invent the parser), and emits one
   row per asset: `{page, array, index, field, chars, sha1}`.
2. Auto-classification pass (heuristics, then human review):
   - `examQuestions.*` → `ocr-derived` by default (that was the recipe).
   - `miscData`/`examTips` containing: `examiner`, `mark scheme`, `candidates`,
     `OCR`, `real 20xx`, `Assessment for Learning` → `ocr-derived`.
   - Known real case names (build list during audit: Celandine, Plumwith,
     Kasia, CDS, …) anywhere → `ocr-derived`.
   - `images/**/*-extracted*` → `ocr-image`.
   - Everything else → `original-presumed` (spot-check 10% by hand).
3. Owner reviews the auto-tags for one full subject; adjust heuristics; rerun.
4. Output the wave plan input: per page, the count of items needing rewrite.

**Acceptance:** register covers 100% of pages; spot-check agrees with tags ≥95%;
a one-page summary states totals per class (e.g. "Business: 214 exam items,
31 case studies, 118 examiner-quote cards…").

**▶ AGENT PROMPT (R0)**
```
Read first: CONTENT-REWRITE-PLAN.md §0–§4, tools/build_question_bank.py (the
page parser — reuse it as a library, do not fork the parsing logic),
subjects/business/2_2_market_research.html and subjects/economics/2.2_Demand.html
(shape reference). Task: build tools/content_inventory.py exactly per §R0.
It must run offline (no network), finish in <2 min, and write
content-register.json + a committed content-register-summary.csv (page, array,
total items, ocr-derived count, ocr-image count, original-presumed count).
Add 'content-register.json' to .gitignore. Verify: run it, paste the summary
table in your report, and hand-verify 5 rows against the actual files. Stop and
report.
```

---

## 5. Phase R1 — Standards Pack (2 weeks, mostly owner+one strong agent)

Five documents in `docs/standards/`. These are what WRITER agents see instead
of any OCR material — they must be complete enough that a smaller model can
produce exam-realistic items from them alone. **All five are written in our own
words; they may DESCRIBE the exam's structure (not protectable) but never quote
papers, mark schemes, or the spec's prose.**

### R1.1 `assessment-blueprint-<subject>.md` (one per subject)
For each subject: paper structure described factually (paper count, timing,
total marks, calculator rules); question-type mix per topic; command words with
OUR definitions and what a full answer shows; AO1/AO2/AO3 explained in our
words with the weighting each question type targets; tariff table (which
tariffs exist, what each expects — e.g. "9-mark evaluate: two-sided argument +
context + justified recommendation"); difficulty ladder (grade-3 / grade-5 /
grade-7 target items and what separates them); numeric-skills list (business:
break-even, margins, ARR…; economics: elasticity calc, diagram operations);
diagram conventions (economics: axes labels, shift vs movement, D1→D2 notation).

### R1.2 `house-style.md` (shared)
Tone (direct, second person for feedback), reading age (14–16), UK context
rules (£, UK institutions, no US spellings), terminology per subject (the exact
technical vocabulary students must see), formatting/HTML conventions THE
PIPELINE EXPECTS (allowed tags in each field per `taskRichText` whitelist;
`___` for FIB gaps; marks notation `[n marks]`; structure of each data array —
copy the shapes from an existing page), banned patterns (no "the examiner",
no "in the real exam paper", no rhetorical filler), accessibility rules (alt
text for every SVG, no colour-only meaning).

### R1.3 `mark-scheme-framework.md` (shared, subject annexes)
OUR original marking language: point-based schemes for 1–4 marks ("1 mark:
correct identification; +1: applied to the scenario…"), our own generic level
descriptors for levelled questions (write three fresh ladders: explain/analyse/
evaluate — original wording, reviewed once by the owner), model-answer rules
(every levelled question ships a full-mark model answer + a "typical mid-level
answer + what's missing" pair — this replaces the current graded L0/1/2 ladders
that were built from real mark schemes), feedback-tone rules for `explain`
fields.

### R1.4 `scenario-bank.md` + `docs/standards/scenario-bank.json`
The fictional universe (built in R2 — spec'd here): per subject ~40 fictional
UK organisations with rich, internally-consistent details. JSON schema:
```json
{ "id": "bs-017", "subject": "business", "name": "Fenwick & Moss Ltd",
  "sector": "artisan bakery chain", "location": "Midlands, 4 towns",
  "ownership": "private limited company", "size": "38 staff",
  "financials": {"revenue": "£1.2m", "grossMarginPct": 61},
  "people": [{"name": "Priya Fenwick", "role": "co-founder"}],
  "hooks": ["considering online ordering", "flour costs rising"],
  "usedIn": ["business:5-4-break-even", …] }
```
Rules: names generated then screened against (a) the real-case blocklist,
(b) a web-common-brands list, (c) Companies House quick search for exact hits
(owner does 5-min batch check); economics gets fictional markets/countries with
plausible data series; CS gets fictional apps/systems/networks. `usedIn`
tracking prevents over-reuse (max 3 pages per scenario). Scenario data must be
NUMERICALLY consistent (margins compute, elasticities match the story) — the
checker recomputes.

### R1.5 `blocklist.json` (NEVER shipped; lives in `eco resources/` locally)
Extracted from the current ocr-derived content (and the local PDFs): every real
scenario proper noun, distinctive ≥6-word phrases from questions/mark schemes/
examiner reports. Used only by the similarity gate (R2). Generation is scripted
(`tools/build_blocklist.py` reads content-register.json rows tagged ocr-derived).

**Acceptance for R1:** a WRITER agent given ONLY the pack + a topic outline
produces a 6-mark item + scheme that the owner judges exam-realistic on first
read. (This is literally the R3 pilot's first checkpoint — R1 isn't "done"
until R3 proves it.)

**▶ AGENT PROMPT (R1 — one per document)**
```
Read first: CONTENT-REWRITE-PLAN.md §0 (rules — binding), §R1 (your document's
spec), plus for context: one business page, one economics page (structure only).
You may NOT open: subjects/business/exam_prep/*, any file in eco resources/,
any examQuestions array content. Task: write docs/standards/<doc> per spec, in
our own words throughout. Where you describe the exam's structure, state facts
(paper count, tariffs, command words) — never reproduce question or mark-scheme
wording. Deliver the complete document; flag any place you were unsure of a
factual exam-structure detail as [OWNER-VERIFY]. Stop and report.
```

---

## 6. Phase R2 — Scenario Bank build + gate tooling (1–2 weeks, parallel with R1)

**Deliverables:**
1. `docs/standards/scenario-bank.json` — 40 business + 30 economics + 20 CS
   entries per R1.4 schema, generated by a SCENARIO-SMITH agent, screened:
   - `tools/check_scenarios.py`: no blocklist hits, no duplicate names, numeric
     consistency (recompute every derivable figure), name-distinctiveness
     (edit-distance ≥3 from every blocklist name and from each other).
   - Owner skims all names once (10 minutes) for real-world collisions.
2. `tools/similarity_gate.py` — THE enforcement tool:
   - Inputs: a candidate page/JSON content + the archive of pre-rewrite content
     + blocklist.json.
   - Checks: (a) proper-noun scan vs blocklist (zero tolerance); (b) n-gram
     overlap: any shared 8-gram with archived ocr-derived text or any blocklist
     phrase = FAIL (8 words tolerates standard technical collocations while
     catching lifted sentences); (c) shared-6-gram density >2 per 1,000 words =
     WARN for human look; (d) scenario names must exist in scenario-bank.json.
   - Output: PASS/WARN/FAIL report with the exact colliding strings.
   - Wired into `build_question_bank.py` as `--gate` (refuses to build/seed a
     page that FAILs) — active only for pages flagged `rewritten: true` in
     subject.json, so the free-year site keeps building unaffected until cutover.
3. `tools/archive_originals.py` — snapshots current content (the comparison
   corpus) into `eco resources/pre-rewrite-archive/` (local only) + a git
   branch `pre-rewrite-archive` for full history.

**Acceptance:** gate catches a planted lifted sentence + a planted case name in
a test page (write the test); passes an obviously-original page; scenario bank
validates clean.

**▶ AGENT PROMPT (R2 tooling)**
```
Read first: CONTENT-REWRITE-PLAN.md §R2, tools/build_question_bank.py (build
entry points + how pages are parsed), content-register.json summary. Task:
build check_scenarios.py, similarity_gate.py, archive_originals.py per spec,
plus a pytest-style self-test for the gate (planted-leak fixtures). Pure
Python, stdlib only, offline. The gate's FAIL output must show file, field,
and the exact colliding n-gram so a human can adjudicate in seconds. Wire
--gate into build_question_bank.py behind the rewritten:true page flag without
changing any current output (run --legacy byte-diff to prove it). Stop and report.
```

**▶ AGENT PROMPT (R2 scenario-smith)**
```
Read first: CONTENT-REWRITE-PLAN.md §0 + §R1.4 + docs/standards/house-style.md.
You may NOT read any subjects/ content or eco resources/ files. Task: generate
the scenario bank (40 business / 30 economics / 20 CS) per the JSON schema.
Every entry: plausible, internally consistent numbers (show your arithmetic in
a scratch field the script strips), varied sectors/sizes/ownership types
covering the blueprint's topic needs (finance topics need entries with rich
financials; HR topics need staffing detail; economics needs market/country
datasets). Distinct, clearly fictional names. Run tools/check_scenarios.py
until clean. Stop and report with the validation output.
```

---

## 7. Phase R3 — Pilot: three topics end-to-end (1–2 weeks)

Prove the whole loop on three deliberately different pages:
- `business:5-4-break-even` (numeric/calculation heavy),
- `economics:2-2-demand` (diagram-heavy, elasticity),
- `computer-science:1-1-systems-architecture` (technical recall + new subject).

**Per-topic loop (this IS the R4 wave process, run once carefully):**
1. **Prep (script):** emit the topic's "outline card" — spec-point list in our
   own words (owner writes/approves once per topic — 5 minutes each), current
   section counts (the rewrite must meet or beat them), scenario suggestions
   from the bank.
2. **WRITER agent** (clean room — sees outline card + Standards Pack + assigned
   scenarios ONLY): writes the full replacement content for the at-risk arrays:
   `examQuestions` (same count, same tariff mix per blueprint), case studies
   (from bank scenarios), `miscData`/`examTips` (original guidance), and any
   flagged `reading`/`topics` cards. Untouched-original items are passed
   through by the prep script, not rewritten.
3. **DIAGRAM step** (WRITER or separate agent): every needed chart/diagram as
   inline SVG (economics curves: a small reusable SVG helper — axes, curves,
   shift arrows, labels — added to the page data as markup the pipeline already
   allows) — replacing every `-extracted.png` reference on that page.
4. **CHECKER agent** (sees everything): runs `similarity_gate.py`; recomputes
   every number (break-even outputs, elasticity values, chart data); checks
   blueprint conformance (tariff mix, command words, AO coverage, model answers
   present); checks pipeline-shape validity (arrays parse, fields within
   taskRichText whitelist); writes a CHECK REPORT.
5. **HUMAN review** (owner): teach-quality judgement + spot factual review.
   Feedback loops back to WRITER max twice; third failure = escalate (standards
   doc is deficient — fix the doc, not just the page).
6. **PIPELINE:** mark page `rewritten: true` in subject.json, `--gate --upload`
   to STAGING Supabase project; QA the page in the app (all tabs, daily revise
   serves its items, task picker previews).

**Pilot exit criteria (gate for R4):** all three pages PASS the gate, pass owner
review ≤2 iterations, take ≤1 agent-day each, and the Standards Pack needed no
mid-pilot rewrites in the last of the three. Update time estimates from actuals.

**▶ AGENT PROMPT (R3/R4 WRITER — the core prompt, reused every wave)**
```
You are writing ORIGINAL GCSE content. Read ONLY these inputs (do not open any
other repo file): docs/standards/assessment-blueprint-<subject>.md,
docs/standards/house-style.md, docs/standards/mark-scheme-framework.md, the
scenario entries given below, and the topic outline card given below. You must
not request or open past papers, mark schemes, examiner reports, the existing
topic page, or anything in eco resources/. If you believe you need one of
those, STOP and report why instead.
Task: produce replacement content for <page-id>, arrays: <list from register>.
Requirements: counts and tariff mix per the outline card; every scenario from
the provided bank entries (verbatim names/figures — consistency matters); every
levelled question gets a full-mark model answer + point/level scheme per the
framework; numeric questions include your worked arithmetic in a `_scratch`
field; diagrams as inline SVG per house-style. Output as a JSON fragment
matching the array shapes in the outline card. Originality rule: if a sentence
feels like something an exam paper would say word-for-word, rewrite it — you
are writing in OUR voice, teaching the same ideas.
```

**▶ AGENT PROMPT (R3/R4 CHECKER)**
```
Read first: CONTENT-REWRITE-PLAN.md §0 and §R3 step 4, docs/standards/* (all),
the WRITER's output JSON, the CURRENT page file, content-register rows for this
page. Task: (1) run tools/similarity_gate.py on the writer output — include the
full report; (2) independently recompute every numeric answer and diagram data
point — list each with ✓/✗; (3) verify blueprint conformance (tariff mix,
command words, model answers, section counts vs the outline card) as a table;
(4) verify pipeline shape (parse the JSON, check fields against the
taskRichText whitelist, FIB gaps match blank keys); (5) scan for banned
patterns (examiner references, real-brand names, US spellings). Verdict:
PASS / FIX-LIST (specific, per item) / ESCALATE (standards-doc gap). You do not
rewrite content yourself. Stop and report.
```

---

## 8. Phase R4 — Wave rewrites (6–10 weeks calendar, parallelisable)

**Wave composition:** 4–6 topics per wave, one subject per wave (blueprint
context stays hot). Two waves can run in parallel IF different subjects (they
share no files except the bank — SCENARIO-SMITH extends it between waves, not
during).

**Priority order (risk-first):**
1. Wave 1–2 · Business exam sections — highest-traffic pages first
   (5.x finance, 2.x marketing), because business examQuestions are the oldest
   verbatim material.
2. Wave 3 · `subjects/business/exam_prep/` — **replace-or-delete decision per
   page**: the paper-analysis pages become original "how the papers work"
   guides (structure facts + our technique advice); the all-MCQ/all-AO1 banks
   are DELETED and replaced by two original full **mock papers** (assembled
   from rewritten bank items via the worksheet builder — a product feature,
   not a page).
3. Wave 4–6 · Economics (22 pages) — includes killing all 58 extracted images
   (each wave's pages replace theirs with SVG).
4. Wave 7 · CS (11 pages — mostly placeholders still; size depends on how much
   CS content exists by then and which §3 option it was built under).
5. Wave 8 · Sweep: `miscData`/`examTips` examiner-quote cards on pages whose
   exam sections were already original; `reading` passages flagged in R0;
   topic-card prose flagged as spec-tracking or video-tracking.

**Per-wave mechanics:** exactly the R3 loop × N topics. One tracking issue per
wave listing pages → register counts → gate status → review status. The wave is
DONE when: all pages `rewritten:true`, gate PASS, owner sign-off logged in the
tracking issue, staging QA green.

**Steady-state effort estimate (validate in R3):** ~1 agent-day per content
page + 20 min owner review; ~70 pages ⇒ ~14 wave-weeks of single-agent effort;
two parallel lanes ⇒ ~7–8 calendar weeks, matching the 16-week runway with
slack for R0–R2 and R5.

---

## 9. Phase R5 — Cutover & legal hygiene (2 weeks)

1. **Purge:** delete every remaining `*-extracted*` image; delete replaced
   exam_prep pages (redirects to the new guides); `git rm` any stray source
   material; verify `eco resources/` still untracked; run
   `tools/similarity_gate.py --full-site` (gate every page, not just rewritten
   ones) — zero FAIL.
2. **History note:** the pre-rewrite content remains in git history and the
   archive branch. That's acceptable for a private repo; do NOT make the repo
   public, ever. (If the repo must go public later: fresh-history export.)
3. **Reseed:** full pipeline `--gate --upload` against production Supabase;
   `bank_questions` rows for rewritten pages replace old ones (hash-keyed —
   confirm stale rows for deleted items are removed; check
   `build_question_bank.py`'s delete/upsert behaviour and fix if upsert-only).
   Students' mastery/progress keyed to question hashes will reset for rewritten
   items — **announce to students** ("fresh question bank for exam year").
4. **Wording pass:** site-wide sweep for "OCR" — keep only compatibility
   phrasing (+ footer disclaimer on landing, legal pages, teacher pages);
   remove "real exam question / real mark scheme / examiner report" claims
   everywhere (grep list in the wave-8 register).
5. **Docs:** update terms.html (content ownership: ours; user-generated:
   theirs), DPIA if data flows changed, SETUP.md content-recipe section.
6. **Solicitor review** (owner): sample pages + name usage + terms. Fix list.
7. **Unlock:** only after 1–6 are green does `PLATFORM-V2-MASTER-PLAN.md`
   Phase B (billing) get a go decision.

---

## 10. Quality bar (what "as good or better" means, measurably)

Per rewritten page, ALL of:
- Section counts ≥ current page (register comparison, scripted).
- Tariff/command-word mix matches the blueprint for that topic (checker table).
- Every levelled item: model answer + mid-level answer + original scheme.
- Every numeric item: checker-verified arithmetic.
- Diagrams: SVG with axes labels + alt text (a11y).
- Gate: PASS (zero blocklist hits, zero 8-gram overlaps).
- Owner review: "would set this for my own class unchanged" — logged.
- App QA: page loads, all tabs work, daily-revise serves items, worksheet
  builder previews cleanly (the taskRichText whitelist covers the markup used).

---

## 11. Operating notes for the owner

- **Do not delete anything during the free year** — the current content keeps
  serving your students; Phase R builds replacements alongside, page-flagged.
- The single highest-leverage thing before Phase R: **WP-A3 content gating**
  (takes everything off the public web) and **§3 write-clean rules for the 19
  economics topics still being written** (stops the debt growing).
- Keep `eco resources/` local-only forever (now gitignored). Blocklist and
  archive live inside it on purpose — they quote protected text.
- Budget items for launch prep: solicitor review, and optionally a subject
  teacher (non-you) as second reviewer for one wave per subject.
