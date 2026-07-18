# SPANISH-CONTENT-PLAN.md — AQA GCSE Spanish (8692) course build

Written 2026-07-18. Owner: Mohanad. Companion to `ADDMATHS-CONTENT-PLAN.md` and
`CS-CONTENT-PLAN.md` (the house templates this plan is modelled on),
`PLATFORM-V2-MASTER-PLAN.md` (features) and `CONTENT-REWRITE-PLAN.md` (copyright
programme). This file is the single source of truth for building the **Spanish**
subject. It is written so smaller LLM agents (Opus/Sonnet builders) can execute any
step from this file alone, without re-deriving context.

Primary research (spec text, extracted vocabulary wordbank, per-topic vocab/grammar
allocations) lives under `resources/spanish/` (gitignored, local-only — same copyright
policy as CS/eco/addmaths). Read the artefact named in each section before building
against it — this plan compresses them, it does not replace them.

**Qualification:** AQA GCSE Spanish, entry code **8692**. First exams **June 2026**.
Linear. **Foundation tier (grades 1–5)** and **Higher tier (grades 4–9)**; a student
sits all four papers at ONE tier. **Four papers, each 25%:**

| Paper | Skill | Format | Novel sub-tasks |
|---|---|---|---|
| **1 Listening** | comprehension + **dictation** | written exam, F 35min/40mk · H 45min/50mk | Section B dictation: transcribe spoken sentences (8mk F / 10mk H), incl. a few words outside the list |
| **2 Speaking** | Role-play + **Read-aloud** + Photo card | NEA, 50mk | Read-aloud min 35 words (F) / 50 (H); unprepared conversation; photo-card discussion |
| **3 Reading** | comprehension + **translation ES→EN** | written exam, F 45min · H 60min, 50mk | infer meaning of single words in context; Section B translation (10mk) |
| **4 Writing** | production + **translation EN→ES** | written exam, F 70min · H 75min, 50mk | photo-response sentences; **grammar tasks** (5mk F); translation; 90/150-word essays |

**This subject vs OCR CS/Business/Economics/AddMaths — what's different and what it forces:**
1. **First non-OCR subject** (AQA). Spec-navigation, tier model, and paper structure are
   authored fresh; there is no legacy question mine — content is spec- and
   wordlist-driven, not past-paper-driven (few 8692 papers exist yet).
2. **Two prescribed, machine-readable resources are the scope.** The **vocabulary list**
   (Appendix 2: ~1,200 Foundation word-forms, ~1,700 total, frequency-ranked, tier-tagged)
   and the **grammar list** (§3.2, two tiers) are the definition of what may be tested.
   AQA does **not** map words to topics — we author the topic↔vocab mapping.
3. **Sound is content, not garnish.** The spec mandates **dictation** (Paper 1),
   **read-aloud** (Paper 2) and teaches **Sound-Symbol Correspondences** (Appendix 1
   phonics). Output-voice (TTS) is therefore a *first-class* activity input, not an
   add-on. This is the one genuinely new capability (§8), analogous to AddMaths+KaTeX.
4. **Answers are language, not MCQ letters or values.** Comprehension is markable as MCQ
   today; **dictation, gap-fill, and translation need accent-normalised fuzzy text
   grading** (§8) — the second new capability, an extension of existing bank grading.

---

## 0. How to use this file (agents read this first)

- Work items have IDs (`ES-0`, `ES-A-W1`, `T1`…). Status lives in §9 (⬜ → 🔄 → ✅).
  ONLY the coordinator updates this file, from builder reports — builders never edit it.
- A **content builder** builds exactly ONE lesson page and touches ONLY that page file.
  It follows the recipe in §5, the vocab/grammar allocation for its page (§3 + the
  per-page dossier in `resources/spanish/allocations/`), and the Spanish authoring rules
  in §8.4.
- An **engine builder** (ES-R voice, ES-B fuzzy grader / new exam widgets, ES-C lab)
  touches shared JS/CSS and reads §7/§8. Never run a content builder and an engine
  builder in the same wave over the same shared file or `subjects/spanish/subject.json`.
- The **coordinator** (owner's main session) is the only party that edits the scaffolder
  `SUBJECTS` tree / `subject.json`, `netlify.toml`, shared JS/CSS, `/speech.js`,
  `/spanish-lab/`, deletes files, runs `python tools/build_question_bank.py`, and commits.
- Decisions marked **LOCKED** were made by the owner. **PROPOSED** = this plan's
  recommendation awaiting sign-off (§13). Never silently reverse a LOCKED decision.

---

## 1. Decisions

### 1.1 Locked by owner (2026-07-18)

| # | Decision | Detail |
|---|---|---|
| D1 | **Student self-study topic pages** | Spanish folds into the existing student machinery (auth, 9-activity shell, server-graded banks, spaced repetition, leaderboards) — same surface as CS/Economics/AddMaths. NOT the standalone teacher slide-deck (`preview.html`); that deck is a *content source*, not the delivery product. |
| D2 | **Output-voice only (TTS); no ASR** | Voice = `speechSynthesis` (es-ES), woven INTO activities (listen-and-choose, listen-and-type dictation, hear-the-answer, per-word pronunciation, read-aloud modelling). **No speech recognition** — speaking is practised with a model + self-mark rubric (the house self-mark convention), never machine-graded. Zero API cost, zero answer-security impact. |
| D3 | **AQA 8692, both tiers together** | Each topic page authors Foundation **and** Higher content from the start (Higher = all Foundation grammar + the Higher additions, incl. more tenses/subjunctive). Tier is a per-item tag so a page serves both cohorts. |
| D4 | **Reuse the platform machinery** | Adopt the proven contract wholesale: 9 activity tabs, self-mark tick-the-mark-scheme model, the `{mark,max,state}` widget contract, the bank pipeline, spaced-repetition, gamification. Invest new engineering in exactly TWO capabilities: **voice/TTS (§8.1)** and a **fuzzy text answer comparator (§8.2)**. |

### 1.2 Proposed (awaiting owner sign-off — §13)

| # | Proposal | Rationale |
|---|---|---|
| P1 | **Course grain = 12 groups / ~34 pages** (§3): 9 theme-topic groups broken into sub-lessons + a cross-cutting **Phonics & Sound-Symbol** group + a **Grammar Toolkit** group + an **Exam Skills** group (dictation / translation / read-aloud & photo card / writing structures). | GCSE MFL vocab load per topic is large; sub-lessons keep each page inside the §5.1 size caps. Comparable grain to CS (29) / AddMaths (37). |
| P2 | **`/speech.js` — one shared TTS helper**, mirrored on `math-render.js` (`speak(text,{lang,rate})`, `speakButton(text)`, voice-ready promise, es-ES voice selection, cancel-on-new). Loaded on Spanish pages only via a `slug == "spanish"` scaffolder include. | Same self-hosted-style, subject-scoped, zero-cost pattern as KaTeX; browser-native, no vendor bytes, no CSP change. |
| P3 | **Voice activity types layer on existing tabs, plus new lab tools (§7).** No new *exam-paper* format needed for comprehension (reuses MCQ/`lines`); dictation + translation + gap-fill need only the fuzzy comparator, not new widgets. | Keeps the shared bundle unchanged on non-Spanish pages; most of the course is markable at Tier 1. |
| P4 | **Fuzzy grader = accent-insensitive normalise + accept-lists** (`norm()` NFD-strip seed from `preview.html`), server-side branch in all four SQL graders, with a per-blank `accept[]` for spelling/synonym tolerance. Dictation marked word-position with accent tolerance per AQA's marking (minor accent errors not always penalised — see §6). | Extends the existing string-equality grader exactly as AddMaths added `numeric`; no new server model. |
| P5 | **Spanish Lab (10th tab)** = new tools the subject needs: `dictationTrainer`, `soundSymbol` (phonics minimal-pairs), `sentenceBuilder` (port of `preview.html` tiles), `verbConjugator` drills, `translationLadder`, `photoCardPrompt`, `speedVocab`. Local progress only in v1 (as CS). | The `preview.html` activities port directly; drills/examiner-trainer patterns reuse the CS lab framework. |

---

## 2. Sources and what each may be used for

All under `resources/spanish/` (gitignored, local-only — never commits/deploys).

| Source | Role | Copy policy |
|---|---|---|
| `spec/aqa-spanish-8692.pdf` + `research/spec-breakdown.md` | Authoritative scope: 3 themes/9 topics, the 4-paper assessment model, grammar §3.2, phonics Appendix 1, vocab Appendix 2. | Structure, codes, topic titles fine; NEVER copy spec prose — paraphrase. |
| `wordbank/spanish-vocab.json` (extracted, §2.1) | The prescribed lexicon: `{rank, pos, headword, english, tier(F/H), sel}`. Backbone for vocab activities, dictation targets, translation items, TTS, and answer-grading accept-lists. | AQA wordlist = permitted reference (headwords + glosses). Validate before use (§2.1). |
| `preview.html` (owner-supplied Spanish EPI deck) | Activity-design source: sentence-builder, faulty-echo dictation, translation ladder, speed grid, expansion, phonics-friendly TTS. | IDEAS + our own re-authored content. Not verbatim exam material. |
| AQA specimen/sample assessment materials (when downloaded to `papers/`) | The only verbatim exam-practice source, once available. | VERBATIM allowed ONLY inside `examQuestions` fields, per §6. |
| Owner-supplied video sources (TBD — §13) | Per-lesson "watch first" links by video ID. | Standard YouTube embeds by ID. |

**Writing rule for ALL teaching content** (Learn cards, MCQs, TF, FIB, match,
misconceptions, tips, flashcards): write from language-teaching understanding in our own
words, matching the house voice of the economics exemplar. Spanish target-language
strings come from / are checked against the prescribed wordlist. The ONLY verbatim
third-party material anywhere is AQA specimen material inside `examQuestions`.

### 2.1 The vocabulary wordbank (ES-0 foundation task)

`tools/parse_spanish_vocab.py` (seed in scratchpad) extracts Appendix 2 into
`resources/spanish/wordbank/spanish-vocab.json`. Two tables share column geometry
(rank~27, POS~44, headword~79/82, English~177–528, Tier~531/535, sel~556): **Foundation
pp61–77, Higher pp78–103.** The draft extract is ~2,600 rows (F ≈ 900 base forms + H
additions). **Validation pass required before content build:** (a) re-join multi-line
English glosses cleanly and stop continuation-merge bleeding into the next entry;
(b) strip the `*`/`**` homograph markers into a flag; (c) keep highly-irregular verb
forms (ser/estar/tener/ir paradigms are listed individually — that is intentional per
§3.2). Output is the authoritative wordbank; the coordinator then authors the
**topic→vocab allocation** (`resources/spanish/allocations/<topic>.md`) by tagging each
headword to one of the 9 topics (AQA does not do this — it is our editorial map).

---

## 3. The page map — 12 groups, ~34 pages (P1, awaiting sign-off)

Groups appear on the subject index in this order. Filenames follow the dotted convention
(`<group>.<lesson>-<slug>.html`); page `id` = slugify of `"<group>.<lesson> <title>"`.
Every topic page follows the **core-vocab → grammar-in-context → all-four-skills** shape
and uses TTS on every Spanish string (§8.1).

Groups **P** (Phonics) and **G** (Grammar Toolkit) are taught first / referenced
throughout; the 9 theme-topic groups (1–9) are re-sequencable to match the class
timetable; group **X** (Exam Skills) is last so it can reference finished content.

| Group (header) | Page file | AQA scope | Notes |
|---|---|---|---|
| **P · Phonics & Sound-Symbol** | `P.1-spanish-sounds-and-the-alphabet.html` | Appendix 1 SSCs (vowels, `ca/co/cu`, `ce/ci`, `z`, `que/qui`, `ga/go/gu`, `ge/gi`, `gue/gui`) | TTS minimal pairs; core of the phonics lab tool |
| | `P.2-tricky-letters-ll-ch-n-j-h-r-v.html` | `ll, ch, ñ, j, silent h, r/rr, v` | listen-and-spell dictation warmups |
| **G · Grammar Toolkit** | `G.1-nouns-articles-and-gender.html` | §3.2 noun phrases, articles, plurals | feminine/plural formation rules |
| | `G.2-adjectives-and-agreement.html` | §3.2 adjectival phrases, comparatives/superlatives | agreement + position |
| | `G.3-present-tense-and-key-irregulars.html` | present; ser/estar; tener/ir/hacer; reflexives; gustar-type | the highest-frequency verb machinery |
| | `G.4-talking-about-the-past.html` | preterite + imperfect (contrast) | F+H |
| | `G.5-future-conditional-and-more-tenses.html` | near future, future, conditional; (H) perfect, pluperfect, present subjunctive | Higher tiering concentrated here |
| | `G.6-pronouns-negatives-and-connectors.html` | object/reflexive/relative pronouns; negatives; conjunctions, intensifiers | sentence-extension toolkit |
| **1 · Identity & relationships** (Theme 1) | `1.1-me-my-family-and-friends.html` | T1 Topic 1 | descriptions, relationships |
| | `1.2-relationships-and-role-models.html` | T1 Topic 1 | getting on / conflict / marriage views (H) |
| **2 · Healthy living & lifestyle** (Theme 1) | `2.1-food-drink-and-a-balanced-diet.html` | T1 Topic 2 | ⭐ **PILOT PAGE (ES-0)** — ports `preview.html` |
| | `2.2-exercise-health-problems-and-advice.html` | T1 Topic 2 | `se debe`/advice; ailments; future plans |
| **3 · Education & work** (Theme 1) | `3.1-school-life-and-subjects.html` | T1 Topic 3 | routine, opinions on subjects |
| | `3.2-future-study-jobs-and-ambitions.html` | T1 Topic 3 | future/conditional in context |
| **4 · Free-time activities** (Theme 2) | `4.1-sport-hobbies-and-going-out.html` | T2 Topic 1 | present + preterite of leisure |
| | `4.2-music-tv-film-and-reading.html` | T2 Topic 1 | opinions + comparatives |
| **5 · Customs, festivals & celebrations** (Theme 2) | `5.1-food-customs-and-daily-life.html` | T2 Topic 2 | culture of Spanish-speaking world |
| | `5.2-festivals-and-traditions.html` | T2 Topic 2 | past + present descriptions |
| **6 · Celebrity culture** (Theme 2) | `6.1-celebrities-influencers-and-fame.html` | T2 Topic 3 | opinions, `porque`, justification |
| **7 · Travel & tourism** (Theme 3) | `7.1-holidays-transport-and-places.html` | T3 Topic 1 | past holidays; future plans |
| | `7.2-my-region-and-places-of-interest.html` | T3 Topic 1 | descriptions, directions |
| **8 · Media & technology** (Theme 3) | `8.1-technology-in-everyday-life.html` | T3 Topic 2 | uses, opinions, comparatives |
| | `8.2-social-media-and-online-safety.html` | T3 Topic 2 | advantages/disadvantages (H) |
| **9 · Environment & where people live** (Theme 3) | `9.1-my-town-home-and-local-area.html` | T3 Topic 3 | home/area descriptions |
| | `9.2-the-environment-and-global-issues.html` | T3 Topic 3 | problems + solutions (`se debería`) |
| **X · Exam Skills** | `X.1-listening-and-dictation.html` | Paper 1 technique | dictation trainer; accent rules |
| | `X.2-reading-and-translation-into-english.html` | Paper 3 technique | infer-in-context; ES→EN method |
| | `X.3-speaking-read-aloud-and-photo-card.html` | Paper 2 technique | TTS read-aloud model + self-mark; photo card |
| | `X.4-writing-and-translation-into-spanish.html` | Paper 4 technique | 40/90/150-word structures; EN→ES; grammar-task drills |

**Coverage check:** all 3 themes × 3 topics assigned; grammar §3.2 (both tiers) and
phonics Appendix 1 each own a group; all four papers have an Exam-Skills page. Exact
per-page vocab/grammar counts live in `resources/spanish/allocations/`.

---

## 4. Platform facts every agent must know (verified 2026-07-18)

1. **A lesson page is self-contained HTML** with inline `<script>` data arrays; the
   shared `/script.js` renders 9 tabs: `learn` (`topics`), `mcq` (`mcqData`), `matching`
   (`matchData`), `fib` (`fibData` + `fibWords`), `misconceptions` (`miscData`),
   `examtips` (`examTips`), `flashcards` (`flashcards`), `truefalse` (`tfData`),
   `exampractice` (`examQuestions`). Copy the tab markup + array shapes from the exemplar
   `subjects/economics/1.2_The_basic_economic_problem.html` (or the AddMaths proof page).
2. **Exact array shapes** (field names are parsed by the pipeline):
   - `topics[]`: `{ title, tag, content:<HTML string>, readCheck:{q,opts[4],ans,explain} }`
   - `mcqData[]`: `{ q, opts[4], ans, explain }`
   - `matchData[]`: `{ term, def }` (≥4 pairs)
   - `fibData[]`: `{ display:"… _____ …", blanks:{B1:"word"} }` + `fibWords[]`
   - `tfData[]`: `{ statement, answer:true|false, explanation }`
   - `miscData[]`: `{ wrong, correct, readCheck }`
   - `examTips[]`: `{ type, title, pills[], content, readCheck }` — **`pills` REQUIRED (renderer crashes without it).**
   - `flashcards[]`: `{ term, def }`
   - `examQuestions[]`: `{ num, marks, type, caseStudy|caseId, question, hint, starter, markScheme, modelAnswer }` (+ `options[]`/`answer` for mcq).
3. **Voice hook (NEW, §8.1):** any Spanish string that should be audible carries a
   speaker affordance. The renderer adds a 🔊 button beside items tagged for audio (see
   §8.1 for the data convention: `say:"…"` on cards / options / flashcards / fib prompts).
   Content builders write the Spanish text; the shared renderer wires the button — pages
   never call `speechSynthesis` directly (shared-JS rule #6).
4. **Pipeline:** when a page is ready the coordinator removes `"noQuestions": true` from
   `subjects/spanish/subject.json` and runs `python tools/build_question_bank.py --subject
   spanish --upload`. **Always scope with `--subject spanish`** (unscoped rebuilds other
   subjects → FIB `blankOptions` unseeded-RNG churn).
5. **Scaffolder — subject.json is OUTPUT.** Source of truth is `SUBJECTS["spanish"]` in
   `tools/scaffold_placeholder_subject.py` (the §3 tree). ⚠ **SCAFFOLDER RESET TRAP:**
   every re-run resets every page to `"noQuestions": true`; after any re-run, diff and
   re-remove `noQuestions` for live pages before any pipeline run, or `--upload` DELETES
   their Supabase rows.
6. **Subject registration:** extend the scaffolder **subject-conditional include** block
   with a `slug == "spanish"` branch emitting `<script src="/speech.js"></script>`
   (+ later `/spanish-lab/…`). The pipeline regenerates root registries
   (`subjects-index.js`, `page-groups-all.js`, `section-totals-all.js`).
7. **Shared-JS architecture rule:** features/fixes go in shared JS, never into the page
   HTMLs; pages hold ONLY their data arrays + the standard scaffold. Auth guards redirect
   to `/index.html`.
8. **`taskRichText` whitelist** (tasks-shared.js) un-escapes only bare tags. Spanish
   accented characters are plain UTF-8 and pass through untouched.
9. **CSP** (netlify.toml): `speechSynthesis` is a browser API — **no CSP change, no
   vendor bytes, no `connect-src`**. (Unlike KaTeX, TTS needs zero assets.)
10. **Content gating:** the edge function gates `/subjects/*`; new pages inherit it +
    robots.txt no-index. Server bank grading fails CLOSED.
11. **Paste-guard:** paste stays blocked in `.ep-answer-area` exam boxes and in dictation
    inputs (a student pasting defeats the transcription task), OFF on lab tool inputs.

---

## 5. The per-page content recipe (content builders follow this exactly)

### 5.1 Inputs, size caps, volume targets

**Inputs per page:** (a) the §3 scope + the page's `resources/spanish/allocations/*` vocab
& grammar set (the ONLY statement of scope); (b) the economics/AddMaths exemplar for
shapes/voice; (c) §5.3 tab guidance; (d) §8.4 Spanish authoring rules; (e) any owner
video ID for the lesson. Builders do NOT invent off-list vocabulary — every taught
Spanish word is on the prescribed list (dictation is the sole place a few off-list words
appear, per §6, and those come from AQA specimen material only).

**Size caps:** max 7 Learn cards / ~2,500 words of Learn content. If the allocation
can't fit, STOP and propose a split.

**Volume targets** (match economics/CS/AddMaths density):

| Array | Target | Notes |
|---|---|---|
| `topics` | 4–7 cards | each ends with a `readCheck`; every card's Spanish is audio-tagged |
| `mcqData` | 10–12 | mix meaning-choice, listen-and-choose (§8.1), grammar-in-context; distractors = real learner errors |
| `tfData` | 8 | explanations teach |
| `fibData` | 6–8 | + `fibWords`; verb endings, agreement, connectors, spelling |
| `matchData` | 10–14 | Spanish↔English, question↔answer, sound↔spelling, tense↔timeframe |
| `miscData` | 4–6 | real MFL errors (agreement, ser/estar, false friends, `gustar`) |
| `examTips` | 2–4 | one per relevant paper skill (dictation / translation / read-aloud / writing) |
| `flashcards` | 14–18 | every core word/phrase for the page, both directions, audio-tagged |
| `examQuestions` | per allocation | AQA specimen verbatim only; else our own spec-style items |

### 5.2 Build steps (in order)
1. Read the exemplar page once + the page allocation + §5.3, §8.4.
2. Write `topics` (Learn cards): core vocab table, grammar-in-context, worked model
   sentences; audio-tag every Spanish string (`say:`), tier-tag Higher-only items.
3. Write practice arrays: `mcqData`, `tfData`, `fibData`+`fibWords`, `matchData`,
   `flashcards`. Include ≥2 **listen-and-choose** MCQs and ≥1 **dictation** FIB per page.
4. Write `miscData` (real learner misconceptions) and `examTips` (per-paper ladders).
5. Write `examQuestions` (spec-style comprehension/translation/writing; verbatim only if
   AQA specimen); author `markPoints` grouped to the tariff for written/translation items.
6. Self-verify (all of): inline script parses (`node --check` on the extracted body);
   every `ans`/`answer` index correct; every `readCheck` has exactly 4 opts; blank keys
   match the `_____` count; **all Spanish spelled with correct accents/ñ (UTF-8), every
   audio-tagged string is valid Spanish, no bare dollar-brace / unescaped backtick**;
   fuzzy accept-lists present for any free-text answer; no off-list vocabulary outside a
   dictation item. Run `verify-spanish-page.js` (§8.5).
7. Report done with counts per array + flags. Do NOT edit subject.json or run the pipeline.

### 5.3 Tab-by-tab guidance (Spanish specifics)
- **Learn (`topics`)** — question-led `<h4>`; a compact Spanish↔English vocab table per
  card (every Spanish cell audio-tagged); a grammar-in-context card with 2–3 model
  sentences; a "build a longer sentence" card (opening + core + infinitive + extension,
  from `preview.html`). Tier-tag Higher structures.
- **MCQ** — three flavours: **meaning** (choose the English/Spanish), **listen-and-choose**
  (🔊 plays a sentence, pick the meaning/missing word — §8.1), **grammar-in-context**
  (right verb form / agreement / ser vs estar). Distractors = real errors.
- **Matching** — Spanish↔English, **sound↔spelling** (phonics pages), tense↔timeframe
  marker (`ayer`/`mañana`/`todos los días`), question↔natural answer.
- **FIB** — verb endings, adjective agreement, connectors, and **dictation gap-fill**
  (🔊 sentence, type the missing word). Answer values plain text; fuzzy accept-list holds
  accent/spelling variants. Prefer named `___B1___` blanks.
- **Misconceptions** — ser/estar, adjective agreement, `gustar` ("me gusta**n**"),
  preterite vs imperfect, false friends (`sensible`, `éxito`, `ropa`), silent h, `muy`
  vs `mucho`.
- **Exam tips** — per-paper ladders: dictation (listen for whole chunks, accent rules),
  translation (don't translate word-for-word; tenses; idioms), read-aloud (SSC pitfalls),
  writing (opening + opinion + reason + tense variety; the 5-bullet / 3-bullet structures).
- **Flashcards** — every core word/phrase, audio-tagged, both directions; ≤20-word glosses.
- **Video** — header links the owner-preferred lesson by video ID (source TBD, §13).

---

## 6. Exam questions — AQA's four papers online

No form is left unmarkable. Comprehension reuses MCQ + `lines`; the two novel skills
(dictation, translation) use the fuzzy comparator (§8.2); speaking is model + self-mark.

| AQA task | Engine mapping | Grading |
|---|---|---|
| Listening/Reading comprehension (English answers) | `mcq` or short `lines` vs accept-list | auto / self-mark |
| **Dictation** (Paper 1B) | 🔊 TTS plays sentence → student types → **fuzzy word-position compare** | auto; **accent tolerance** per AQA (minor accent slips not always penalised — accept-list carries both forms); a few off-list words come from AQA specimen only |
| **Translation ES→EN** (Paper 3B) | `lines` + grouped `markPoints` (per clause/chunk) | self-mark tick-the-scheme (partial credit) |
| **Translation EN→ES** (Paper 4) | short `lines` per sentence + fuzzy accept-list for exact ones; longer = self-mark markPoints | mixed |
| **Grammar tasks** (Paper 4 Q3, F) | `fib`/`mcq` (verb form, agreement) | auto fuzzy |
| Photo-response / 90–150-word essay (Paper 4) | `lines` + `markPoints` banded to AQA's content/quality/accuracy criteria | self-mark banded |
| **Read-aloud** + Photo card + Role-play (Paper 2 NEA) | Spanish-Lab tool: 🔊 model → record-or-say → **self-mark against model + VAN rubric** (no ASR, D2) | self-assessment |

`markPoints` grouped and summed to the tariff (contract: `docs/SELF-MARK-POINTS-AUTHORING.md`).
No duplicate questions across pages. AQA specimen material is the ONLY verbatim source and
lives only inside `examQuestions`.

---

## 7. Interactive activities — the Spanish Lab (phase ES-C)

Spanish pages get a 10th tab, **Practice Lab**, on the CS-lab framework (a `/spanish-lab/`
folder with `spanish-lab.js` = tab + `PAGE_TOOLS` map + lazy loader + local+cloud store
(`spanish_lab_saves` twin of `cs_lab_saves`), one module per tool, `spanish-lab.css`).
Per-page content lives inside each module keyed by pageId. House standards: theme-aware,
keyboard accessible, 44px targets, lazy-load, graceful failure, TTS via `/speech.js`.

| ID | Tool | Source | What it does | Pages |
|---|---|---|---|---|
| T1 | **soundSymbol** | NEW (SSC table) | 🔊 plays a sound; pick the spelling / the odd-one-out minimal pair; drill `ce/ci` vs `que/qui`, `g` soft/hard, `ll/ñ/j/h/rr`. | P.1, P.2 (bell-ringer everywhere) |
| T2 | **dictationTrainer** | NEW (port faulty-echo) | 🔊 sentence at adjustable rate → type it → fuzzy mark word-by-word with accent tolerance; "same/different" faulty-echo mode. | X.1 + every topic |
| T3 | **sentenceBuilder** | PORT `preview.html` tiles | click chunks (opening + core + infinitive + extension) into order; check vs target; 🔊 read the built sentence. | every topic |
| T4 | **verbConjugator** | ADAPT `drills.js` | infinite conjugation rounds by tense/person (present, preterite, imperfect, future, conditional, (H) subjunctive), instant mark, streak. | G.3–G.5, every topic |
| T5 | **translationLadder** | PORT `preview.html` ladder | translate escalating levels (word→sentence→extended) both directions; reveal + self-mark. | X.2, X.4 |
| T6 | **speedVocab** | PORT `preview.html` speed grid | 10-in-90 flip EN↔ES with 🔊; timed; streak/best. | every topic |
| T7 | **photoCardPrompt** | NEW | show a photo + AQA-style prompts; 10s think → speak → 🔊 model answer → self-mark VAN rubric. | X.3, topic pages |
| T8 | **examinerTrainer** | PORT `examiner-trainer.js` | student marks a flawed answer/translation vs the scheme; trains self-marking. | X.1–X.4 |

**Standing owner instruction (inherited):** when building any theory page, ask "is there
an activity that teaches this better?" and propose additions to `PAGE_TOOLS` rather than
skipping. **Local progress only in v1** (`geo_spanishlab_<pageId>_<tool>` keys; in-tab
streaks/badges; NOT in `SECTION_TOTALS`/gamification until an owner-triggered promotion).

---

## 8. The two new capabilities — voice (TTS) and fuzzy grading

### 8.1 Voice / TTS (ES-R, part of ES-0) — BUILT 2026-07-18
- **`/speech.js`** — one shared helper, mirrored on `math-render.js`. Exposes globals:
  `speak(text,{lang='es-ES',rate})`, `stopSpeaking()`, `voicesReady` (Promise —
  `getVoices()` is async/empty on first paint; resolve on `voiceschanged`),
  `pickVoice()` (student's saved voice → es-ES → any `es*` → default),
  and `enhanceAudio(container)` (walks the container, prepends a 🔊 button to any element
  carrying `data-say`; also handles the container element itself). Cancels any in-flight
  utterance before speaking. Bad/absent engine or `localStorage` throw → graceful no-op.
- **Student Audio panel (self-installed):** a fixed 🔊 control opens a panel with a
  **Speed slider (0.5–1.25×, default 0.9)** and, when the device has >1 Spanish voice, a
  **Voice picker** (prefers es-ES). Choices persist (`gcse_tts_rate` / `gcse_tts_voice`)
  and every `speak()` honours them; a "Probar" button previews. speech.js also injects its
  own CSS and a `<main>` MutationObserver, so audio + panel appear on every Spanish page
  with **zero per-page code**. (Removed the pilot's inline bootstrap.)
- **Flashcards speak:** one guarded hook in `script.js`'s `renderFC` sets `data-say` from a
  card's optional `say` field (no-op unless `/speech.js` is loaded and the card has `say`).
  Learn cards / listen-and-choose MCQs / dictation FIBs use `data-say` (+ `data-listen`).
- **Loading:** Spanish topic pages include `/speech.js` BEFORE `/script.js` via the
  scaffolder `slug == "spanish"` include. Zero vendor bytes, zero CSP change.
- **Data convention:** content arrays mark audible Spanish with a `say` field (e.g.
  `flashcards[] = {term, def, say:"..."}`, `mcqData[]` option `{text, say}`), OR wrap
  inline Spanish in `<span data-say="...">…</span>` inside `content`. The shared activity
  builders call `enhanceAudio(panel)` after each render + after `renderMathIn`-style
  insertion (integration checklist §8.5). **Pages never call `speechSynthesis`.**
- **Listen-first activities:** a `listen:true` flag on an `mcqData`/`fibData` item makes
  the prompt a 🔊 button that plays `say` and hides the written Spanish → true listening
  practice from the same data.

### 8.2 Fuzzy answer grading (Tier 1 ships the course)
Reuse before inventing: **self-mark tick-the-scheme** (grouped `markPoints`) for
translation/essay, **string equality** for closed vocab. Add ONE comparator:
- **`norm(s)`** = trim → lowercase → NFD strip diacritics → collapse spaces → drop
  terminal punctuation (seed: `preview.html`). **Accent-tolerant by default** (AQA does
  not always penalise minor accent errors); an item may opt into **accent-strict** where
  the accent is meaning-bearing (`sí`/`si`, `él`/`el`, `tú`/`tu`).
- **Accept-lists:** each blank/answer key carries `accept:[...]` (spelling/synonym/regional
  variants). Shape: `{"fuzzy":{"B1":{"canonical":"bebo","accept":["bebo"],"strict":false}}}`.
- **Server:** the fuzzy branch must land in **all four duplicated SQL graders**
  (`topic-grading.sql`, `tasks-schema.sql`, `daily-revise-functions.sql`,
  `subjects-v2-s5-bank-scope.sql`) or grading silently diverges. **MVP shortcut** (as FIB
  today): author a single canonical answer + accent-fold in `norm`, keep equality; add the
  accept-list branch next. Dictation marks per word-position with `norm` + per-word accept.

### 8.3 What is explicitly NOT built (D2)
No speech recognition / ASR, no audio recording upload, no pronunciation scoring. Speaking
is always model-TTS + student self-assessment. This keeps cost at zero and the
answer-security model (server grades by key, answers never shipped) intact.

### 8.4 Spanish authoring rules (content builders MUST follow)
1. **Correct orthography always:** accents (á é í ó ú), ñ, ¿ ¡ opening marks, ü. Store as
   plain UTF-8 — no HTML entities, no escapes. A missing accent is a spelling error and
   fails the verifier.
2. **Every taught Spanish string is on the prescribed wordlist** (check against
   `wordbank/spanish-vocab.json`). The only off-list words allowed are inside a dictation
   `examQuestions` item sourced from AQA specimen material.
3. **Audio-tag every Spanish string** students should hear (`say:` field or `data-say`);
   the value is the exact Spanish to speak (expand abbreviations; no English).
4. **Tier-tag Higher-only** grammar/vocab (`tier:"H"`) so a page serves both cohorts.
5. **FIB answer values stay plain text** (must survive `lower(btrim())` + `norm`); mark
   accent-bearing answers `strict` (§8.2). Never a run of 3+ raw underscores except the
   blank marker; prefer named `___B1___`.
6. **No bare dollar-brace / unescaped backtick** in any content string (breaks the build
   parser). Spanish never needs them.

### 8.5 Acceptance tests (ES-0 exit gate)
`verify-spanish-page.js`: inline script parses; array shapes/counts valid; every
`ans`/`answer` in range; `readCheck`s have 4 opts; blank keys match `_____` count; every
Spanish string is valid UTF-8 with plausible accents (flag ASCII-only "Spanish"); every
audio-tagged string non-empty; accept-lists present on free-text answers; no off-list word
outside dictation. Playwright: on a logged-in fixture, all 9 tabs render; 🔊 buttons appear
and `speechSynthesis.speak` is invoked (spy) on click; dictation FIB grades a correct
accent-folded answer as full marks; RESET + server-grade mode still correct; theme matrix
(midnight/obsidian) + copy-protect intact; worksheet print unaffected.

---

## 9. Phases, waves and status

**Dependency spine:** ES-0 (skeleton + `/speech.js` + wordbank validation + one pilot
page) → ES-A content waves (phonics/grammar first, then topics, re-sequencable) with ES-C
lab tools built just-in-time → ES-B (fuzzy grader SQL branch + specimen exam import) →
later bank/gamification promotion.

Unlike CS but like AddMaths, **one shared capability blocks the first *fully-functional*
page**: `/speech.js` (pages render without it, but voice — the point of the subject — is
dead). So ES-0 lands `/speech.js` + the pilot together.

| ID | Scope | Prereqs | Status |
|---|---|---|---|
| **ES-0** Walking skeleton | (1) `SUBJECTS["spanish"]` in scaffolder = §3 tree. (2) Run scaffolder (subject.json + index.html + ~34 pages). (3) `/speech.js` (`speak`/`enhanceAudio`/`voicesReady`). (4) Wire `enhanceAudio` into the 9 activity builders + `rebuildAllActivities` in script.js. (5) Scaffolder `slug=="spanish"` include emits `/speech.js`. (6) Validate `wordbank/spanish-vocab.json`. (7) Build **2.1 Food, drink & a balanced diet** fully as the pilot (9 tabs, TTS activities, ports `preview.html`). (8) `verify-spanish-page.js` + playwright + ui-reviewer on 2.1. (9) Owner review → recipe LOCKED or tuned. | D1–D4 | ⬜ IN PROGRESS |
| **ES-A-W1** | Group P (phonics) + Group G (grammar toolkit) | ES-0 | ⬜ |
| **ES-A-W2** | Groups 1–3 (Theme 1 topics) | ES-0, W1 | ⬜ |
| **ES-A-W3** | Groups 4–6 (Theme 2 topics) | ES-0, W1 | ⬜ |
| **ES-A-W4** | Groups 7–9 (Theme 3 topics) | ES-0, W1 | ⬜ |
| **ES-A-W5** | Group X (Exam Skills, all four papers) | W1–W4 | ⬜ |
| **ES-C-1** | Spanish Lab framework `/spanish-lab/spanish-lab.js` + `.css` + `spanish-lab-saves.sql`, include on all pages | ES-0 | ⬜ |
| **ES-C-2** | Tool modules T1–T8 (§7), per-page content, unit tests | ES-C-1 | ⬜ |
| **ES-B** | Fuzzy comparator SQL branch (all 4 graders) + accept-list keys + AQA specimen exam import + (optional) Spanish mock runner | ES-0 (+ W-data) | ⬜ |
| **ES-D** | Bank/gamification promotion of Lab activity (owner-triggered, deferred) | ES-A done + ES-B proven | ⬜ |

**Wave ordering:** phonics + grammar first (they underpin every topic); the 9 topic
groups are independent floats after that; Exam Skills last. Waves are independent after
ES-0; owner can reorder to the teaching timetable.

---

## 10. Agent workflow (parallelisation rules)
- One content builder per page; a wave runs ≤3 builders concurrently, each owning exactly
  one file under `subjects/spanish/`.
- `subject.json`, shared JS/CSS, `netlify.toml`, `/speech.js`, `/spanish-lab/`, and
  pipeline runs belong to the coordinator ONLY, serialized.
- Engine work (ES-R/ES-B/ES-C) never runs concurrently with another engine agent on the
  same files; it MAY run alongside content builders (disjoint files).
- Before any session: `git status` + `git log --oneline -5` (parallel sessions land
  commits mid-stream; design pages so a resumed agent can Edit-append missing `const`
  arrays).

---

## 13. Open decisions for the owner
| # | Question | This plan's default if unanswered |
|---|---|---|
| Q1 | Subject slug/branding: slug `spanish`, name **"GCSE Spanish"**, icon 🇪🇸, colour (proposed `#d6455d`)? | proceed with these |
| Q2 | Page grain — accept the 12-group / ~34-page map (§3, P1)? | proceed |
| Q3 | Video source (owner-preferred channel/playlist by video ID)? AddMaths used BareauMaths/CGS. | leave video header blank until supplied |
| Q4 | Which Spanish voice to prefer if several `es-*` are installed (es-ES Iberian vs es-MX/es-US)? | prefer es-ES, fall back to any es |
| Q5 | Confirm both-tiers-per-page authoring (D3) vs a Foundation-first pass? | both tiers per page (D3 locked) |

---

## 14. Status log
- **2026-07-18 (pm)** — Voice controls + wiring. `/speech.js` now self-installs (🔊
  buttons + Speed/Voice panel + `<main>` observer), guarded `renderFC` hook in `script.js`
  gives flashcards audio, pilot inline bootstrap removed. Scaffolder: `SUBJECTS["spanish"]`
  (12 groups / **29 pages**) + `slug=="spanish"` include (`/speech.js` + exam-widgets)
  added; badge logic now uses `exam_board` (AQA) not hard-coded OCR. **Scaffolder NOT run**
  (would overwrite the hand-built pilot 2.1 — owner runs it when generating the other 28
  placeholders, preserving 2.1). All re-verified (contract + length audit + jsdom controls/
  persistence/listen PASS; scaffolder compiles; manifest = AQA/GCSE Spanish/29 pages).
  Note: §3 lists ~34 pages; the built scaffolder tree is 29 (some topics single-page) —
  §3 table is indicative, the `SUBJECTS` tree is authoritative.
- **2026-07-18 (am)** — Plan written. Spec read (themes, 4 papers, grammar §3.2, phonics
  Appendix 1, vocab Appendix 2). Wordbank draft extracted (~2,600 rows, two-table geometry
  confirmed; validation pending, §2.1). Platform anatomy verified against AddMaths/CS.
  ES-0 in progress: `/speech.js` + fuzzy grader + scaffolder wiring + pilot page **2.1**.
