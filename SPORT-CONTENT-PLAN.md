# SPORT-CONTENT-PLAN.md — OCR Cambridge Nationals Sport Studies (J829), Unit R184 course build

Written 2026-07-23. Owner: Mohanad. Companion to `CS-CONTENT-PLAN.md` (the house
template this plan is modelled on), `ADDMATHS-CONTENT-PLAN.md`,
`PLATFORM-V2-MASTER-PLAN.md` (features) and `CONTENT-REWRITE-PLAN.md` (copyright
programme). This file is the single source of truth for building the **Sport Studies**
subject. It is written so smaller LLM agents (Opus/Sonnet builders) can execute any step
from this file alone, without re-deriving context.

> **Spec verified 2026-07-23** against the official OCR spec PDF (`610953`) and the
> Contemporary Issues in Sport Sample Assessment Material (`610867`). The topic map,
> sub-topic list, and exam section structure below are taken from those documents — NOT
> from memory.
>
> **Grain (owner directive 2026-07-23): one page per spec sub-topic (x.y), and one page
> per sub-sub-topic (x.y.z) wherever a sub-topic has more than one.** Filenames and page
> ids use the spec's own numbering so every page is traceable to the specification.

**Qualification:** OCR Cambridge Nationals **Sport Studies Level 1/Level 2 (J829)**.
Four units — but only **R184 "Contemporary issues in sport"** is externally assessed:
a **written paper, 70 marks, 1 hour 15 minutes, 40% of the qualification**, in **three
sections (A / B / C)**. It is a **terminal** assessment (must be sat in the final series).
The other three units (R185 Performance & leadership in sports activities, R186 Sport &
the media, R187 Increasing awareness of Outdoor & Adventurous Activities) are **NEA /
centre-assessed coursework** and are OUT OF SCOPE for the exam-quiz build (§1.2 P2).
Grades run **Level 1 Pass/Merit/Distinction** and **Level 2 Pass/Merit/Distinction/
Distinction\***. First teaching Sept 2022; first assessment summer 2024.

**Why this subject is different from every subject we have built so far — and why that is
GOOD news:**
1. **It needs ZERO new engineering.** No KaTeX, no `speech.js`, no numeric comparator, no
   Pyodide. Sport Studies is pure prose + MCQ + self-marked written answers — the exact
   capabilities the CS/Economics machinery already ships. This is the cheapest subject to
   stand up: it is **100% a content-authoring job**.
2. **It is our first fully copyright-clean subject from day one.** Our other subjects carry
   a narrow verbatim exception (real past-paper text inside `examQuestions`, gitignored,
   never deployed). Sport Studies carries **NO verbatim exception at all** — see §2.
3. **The exam is won on APPLICATION and EVALUATION, not recall.** R184 is a "contemporary
   issues" paper explicitly designed so that "a range of question types will be used... but
   it will always require students to use the skills of analysis and evaluation." Sections B
   and C are scenario-based. Candidates who list facts cap at the bottom band.

---

## 0. How to use this file (agents read this first)

- Every work item has an ID (`SPT-0`, `SPT-A`, `T1`, …). Status lives in the tables in §8
  and §9 (⬜ → 🔄 → ✅). ONLY the coordinator updates this file, from builder reports —
  builders never edit SPORT-CONTENT-PLAN.md.
- A **content builder** agent builds exactly ONE lesson page per run and touches ONLY that
  page file. It follows the recipe in §5, the exam mapping in §6, the coverage bullets in
  Appendix B for its page, and the copyright firewall in §2. Prompt template: **Appendix E**.
- The **coordinator** (owner's main session) is the only party that edits the scaffolder
  `SUBJECTS` tree / `subjects/sport-studies/subject.json`, `netlify.toml`, shared JS/CSS,
  deletes files, runs `python tools/build_question_bank.py`, and commits.
- Decisions marked **LOCKED** were made by the owner. Decisions marked **PROPOSED** are this
  plan's recommendation awaiting owner sign-off (§1.2). Flag new evidence; never silently
  reverse a LOCKED decision.

---

## 1. Decisions

### 1.1 Locked by owner (2026-07-23)

| # | Decision | Detail |
|---|---|---|
| D1 | **Copyright-free, zero verbatim** | No exam-board verbatim material anywhere — not even inside `examQuestions`. All questions, scenarios, mark schemes and prose are 100% original. Facts, spec structure, topic areas, command words and mark tariffs (non-copyrightable) are mirrored freely. See §2. |
| D2 | **Reuse the CS machinery wholesale, invest ZERO new engineering** | 9 activity tabs, the self-mark tick-the-mark-scheme model (`cs-lab/exam-widgets.js`), the `banded` format for levelled responses, the mock-exam engine, the `{mark,max,state}` widget contract — all adopted as-is. |
| D3 | **Finest-grain page map** | One page per spec sub-topic (x.y); one page per sub-sub-topic (x.y.z) where a sub-topic has several. Owner directive 2026-07-23. Yields 29 content pages (§3). |

### 1.2 Proposed (awaiting owner sign-off)

| # | Proposal | Rationale |
|---|---|---|
| P1 | **Course grain = 6 groups / 31 pages** (29 content + 2 Exam Preparation), per D3 (§3). | Every spec sub-topic and sub-sub-topic (1.1.1 → 5.2.3) becomes its own focused, spaced-repeatable page; comparable size to CS (29 pages). |
| P2 | **R184 only at launch; NEA units (R185/R186/R187) OUT OF SCOPE.** | Coursework, not exam-assessed — the server-graded quiz model does not fit them. A later "Coursework knowledge support" phase (revision notes only) can be added if wanted. |
| P3 | **Owner-preferred videos: to be supplied.** | Link by **direct video ID**, never a third-party collection-playlist URL. Coordinator fills `research/sport/video-map.md` before pages cite videos; until then pages ship without embeds. |
| P4 | **`exam_date` CONFIRMED = 2027-05-11.** | Owner confirmed the OCR J829/R184 exam is **Tuesday 11 May 2027 (PM)**. Set in subject.json + scaffolder. |
| P5 | **No new exam formats.** Existing widgets only: `mcq`, `lines`, `banded` (6- and 8-mark levelled). | The R184 SAM uses MCQ + short/medium + levelled 6-/8-mark "Discuss/Evaluate" — all already supported (§6). |
| P6 | **Micro-page exam practice may borrow from the parent sub-topic.** | On a single-sub-sub-topic page (e.g. 2.5.4 Sanctions), an 8-mark Discuss can be thin; the builder may set an applied scenario that spans the parent sub-topic (all of 2.5 PEDs) so the extended-response stays authentic (§5). |

**Optional merge (owner's call):** two split pairs are natural "two sides of one argument" —
`2.5.1 Why performers use PEDs` / `2.5.2 Why they should not`, and `5.2.1 Positive` / `5.2.2
Negative effects of technology`. Split (as here) gives focused recall pages; the balanced
Discuss/Evaluate skill they feed is rehearsed in each page's Exam Practice and in Group 6.
Say the word to merge either pair back into one page.

---

## 2. THE COPYRIGHT FIREWALL (the defining constraint — read twice)

This subject exists to be **provably free of OCR copyright**. The rule is simple and absolute:

> **Mirror the exam's MECHANICS. Never reproduce its WORDING.**

**Non-copyrightable — mirror freely (facts & structure):** the five topic areas and their
sub-topics/scope (ideas, in your own words); the assessment structure (70 marks, 1h15,
Sections A(30)/B(28)/C(12), question styles); command-word meanings and mark tariffs; genuine
public facts about real events, athletes, NGBs and technologies, stated in your own words.

**Copyrightable — NEVER reproduce, quote, or lightly paraphrase:** any sentence from the OCR
specification, sample assessment materials, past papers, mark schemes, or examiner reports
(this INCLUDES the Olympic Creed wording and the printed value definitions — teach those ideas
in your own words); any textbook/revision-guide/website prose, worked examples, tables,
diagrams or images; OCR's specific scenario wording or case studies. **Invent your own**
scenarios, athletes, teams and events (or describe genuine public facts originally).

**There is NO `examQuestions` verbatim exception for this subject.** Every exam-practice
question and its mark scheme is original prose. Keep any research notes under `research/sport/`
and out of the deploy for tidiness.

**Writing rule for ALL content:** write from subject understanding in our own words, matching
the house voice of `subjects/economics/1.2_The_basic_economic_problem.html` (calm, direct,
second person, UK English, pitched at Level 1 with stretch for Level 2).

---

## 3. The page map — 6 groups, 31 pages (P1, awaiting sign-off)

Groups appear on the subject index in this order. Filenames/ids use the spec numbering
(`<spec-ref>-<slug>.html`; id = the same, dashes for dots). Each page follows the
**teach → apply → exam-technique** shape. The "Spec ref" column is the coverage contract
(full bullets in Appendix B).

| Group (header) | Page file | Spec ref | Covers |
|---|---|---|---|
| **1 · Issues affecting participation** (TA1) | `1.1-user-groups.html` | 1.1.1 | the 12 user groups who participate in sport |
| | `1.2-barriers-to-participation.html` | 1.2.1 | barriers (employment, income, transport, provision, role models, media coverage) |
| | `1.3-solutions-to-barriers.html` | 1.3.1 | provision, promotion, transport, facilities/equipment, access, pricing |
| | `1.4-popularity-of-sport-in-the-uk.html` | 1.4.1 | factors that raise/lower a sport's popularity in the UK |
| | `1.5-emerging-and-new-sports.html` | 1.5.1 | growth, development and participation in emerging/new sports |
| **2 · The role of sport in promoting values** (TA2) | `2.1-values-promoted-through-sport.html` | 2.1.1 | team spirit, fair play, citizenship, tolerance & respect (ONE value), inclusion, national pride, excellence |
| | `2.2-the-olympic-and-paralympic-movement.html` | 2.2.1 | Creed, symbol/rings; Olympic values (Excellence, Friendship, Respect); Paralympic values (Courage, Determination, Inspiration, Equality) |
| | `2.3-initiatives-and-campaigns.html` | 2.3.1 | initiatives, campaigns & events promoting sporting values (local/regional/national) |
| | `2.4.1-etiquette-of-performers.html` | 2.4.1 | reasons to observe etiquette; sportsmanship vs gamesmanship (performers) |
| | `2.4.2-etiquette-of-spectators.html` | 2.4.2 | appropriate spectator behaviour and safety |
| | `2.5.1-why-performers-use-peds.html` | 2.5.1 | reasons performers use PEDs |
| | `2.5.2-why-performers-should-not-use-peds.html` | 2.5.2 | reasons performers should not use PEDs |
| | `2.5.3-the-role-of-wada.html` | 2.5.3 | WADA: the Whereabouts Rule and testing methods |
| | `2.5.4-sanctions-against-peds.html` | 2.5.4 | sanctions to prevent PED use (bans, fines) |
| | `2.5.5-education-against-peds.html` | 2.5.5 | educational strategies to prevent PED use |
| | `2.5.6-the-impact-of-peds-on-sport.html` | 2.5.6 | the impact of PED use on the sport |
| **3 · Hosting a major sporting event** (TA3) | `3.1.1-types-of-major-events.html` | 3.1.1 | event types & scheduling: regular / one-off / regular & recurring |
| | `3.1.2-participants-and-spectators.html` | 3.1.2 | the nature of participants and spectators (usually international) |
| | `3.2-pre-event-aspects.html` | 3.2.1 | pre-event positives/negatives: bidding, infrastructure, investment, employment, objections |
| | `3.3.1-during-the-event.html` | 3.3.1 | during-event positives and negatives |
| | `3.3.2-post-event-and-legacy.html` | 3.3.2 | immediate & long-term post-event positives/negatives (legacy, unused venues, reputation) |
| **4 · National Governing Bodies** (TA4) | `4.1-the-role-of-ngbs.html` | 4.1.1 | what NGBs do: participation, coaching/officiating, competitions, rules & discipline, safety, support, policies, funding |
| **5 · Technology in sport** (TA5) | `5.1.1-technology-to-enhance-performance.html` | 5.1.1 | technology/equipment/clothing that enhances performance |
| | `5.1.2-technology-to-increase-safety.html` | 5.1.2 | technology that increases participant safety |
| | `5.1.3-technology-and-officiating.html` | 5.1.3 | technology for fair play & officiating accuracy (e.g. video review) |
| | `5.1.4-technology-to-enhance-spectatorship.html` | 5.1.4 | technology that enhances spectatorship (e.g. big screens) |
| | `5.2.1-positive-effects-of-technology.html` | 5.2.1 | positives: performance, injury risk/recovery, accuracy, analysis |
| | `5.2.2-negative-effects-of-technology.html` | 5.2.2 | negatives: unequal access, cost, flow of game, over-reliance |
| | `5.2.3-technology-and-the-spectator-experience.html` | 5.2.3 | positive & negative effects on the spectator experience |
| **6 · Exam Preparation** | `6.1-command-words-and-exam-sections.html` | (all) | Sections A(30)/B(28)/C(12); answering by tariff; command words |
| | `6.2-extended-response-technique.html` | (all) | building the 8-mark "Discuss/Evaluate" answer: apply → analyse both sides → judgement |

Sequencing: Groups 1–5 map to the five topic areas and can be built in any order. Group 6
(Exam Preparation) is built LAST so it can reference misconceptions surfaced in Groups 1–5.

---

## 4. `subjects/sport-studies/subject.json` (coordinator creates)

Create this manifest verbatim (fill `exam_date` per P4 before go-live).

```json
{
  "slug": "sport-studies",
  "name": "Sport Studies (R184)",
  "key_stage": "ks4",
  "level": "Level 1/Level 2",
  "exam_board": "OCR",
  "spec_code": "J829",
  "exam_date": "2027-05-11",
  "colour": "#16a34a",
  "icon": "🏅",
  "groups": [
    { "id": "1-issues-affecting-participation", "title": "1. Issues Affecting Participation", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "1-1-user-groups", "name": "1.1 User Groups", "sub": "Issues Affecting Participation", "file": "1.1-user-groups.html" },
      { "id": "1-2-barriers-to-participation", "name": "1.2 Barriers to Participation", "sub": "Issues Affecting Participation", "file": "1.2-barriers-to-participation.html" },
      { "id": "1-3-solutions-to-barriers", "name": "1.3 Solutions to Barriers", "sub": "Issues Affecting Participation", "file": "1.3-solutions-to-barriers.html" },
      { "id": "1-4-popularity-of-sport-in-the-uk", "name": "1.4 Popularity of Sport in the UK", "sub": "Issues Affecting Participation", "file": "1.4-popularity-of-sport-in-the-uk.html" },
      { "id": "1-5-emerging-and-new-sports", "name": "1.5 Emerging and New Sports", "sub": "Issues Affecting Participation", "file": "1.5-emerging-and-new-sports.html" }
    ]},
    { "id": "2-the-role-of-sport-in-promoting-values", "title": "2. The Role of Sport in Promoting Values", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "2-1-values-promoted-through-sport", "name": "2.1 Values Promoted Through Sport", "sub": "The Role of Sport in Promoting Values", "file": "2.1-values-promoted-through-sport.html" },
      { "id": "2-2-the-olympic-and-paralympic-movement", "name": "2.2 The Olympic & Paralympic Movement", "sub": "The Role of Sport in Promoting Values", "file": "2.2-the-olympic-and-paralympic-movement.html" },
      { "id": "2-3-initiatives-and-campaigns", "name": "2.3 Initiatives and Campaigns", "sub": "The Role of Sport in Promoting Values", "file": "2.3-initiatives-and-campaigns.html" },
      { "id": "2-4-1-etiquette-of-performers", "name": "2.4.1 Etiquette of Performers", "sub": "The Role of Sport in Promoting Values", "file": "2.4.1-etiquette-of-performers.html" },
      { "id": "2-4-2-etiquette-of-spectators", "name": "2.4.2 Etiquette of Spectators", "sub": "The Role of Sport in Promoting Values", "file": "2.4.2-etiquette-of-spectators.html" },
      { "id": "2-5-1-why-performers-use-peds", "name": "2.5.1 Why Performers Use PEDs", "sub": "The Role of Sport in Promoting Values", "file": "2.5.1-why-performers-use-peds.html" },
      { "id": "2-5-2-why-performers-should-not-use-peds", "name": "2.5.2 Why Performers Should Not Use PEDs", "sub": "The Role of Sport in Promoting Values", "file": "2.5.2-why-performers-should-not-use-peds.html" },
      { "id": "2-5-3-the-role-of-wada", "name": "2.5.3 The Role of WADA", "sub": "The Role of Sport in Promoting Values", "file": "2.5.3-the-role-of-wada.html" },
      { "id": "2-5-4-sanctions-against-peds", "name": "2.5.4 Sanctions Against PEDs", "sub": "The Role of Sport in Promoting Values", "file": "2.5.4-sanctions-against-peds.html" },
      { "id": "2-5-5-education-against-peds", "name": "2.5.5 Education Against PEDs", "sub": "The Role of Sport in Promoting Values", "file": "2.5.5-education-against-peds.html" },
      { "id": "2-5-6-the-impact-of-peds-on-sport", "name": "2.5.6 The Impact of PEDs on Sport", "sub": "The Role of Sport in Promoting Values", "file": "2.5.6-the-impact-of-peds-on-sport.html" }
    ]},
    { "id": "3-hosting-a-major-sporting-event", "title": "3. Hosting a Major Sporting Event", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "3-1-1-types-of-major-events", "name": "3.1.1 Types of Major Events", "sub": "Hosting a Major Sporting Event", "file": "3.1.1-types-of-major-events.html" },
      { "id": "3-1-2-participants-and-spectators", "name": "3.1.2 Participants and Spectators", "sub": "Hosting a Major Sporting Event", "file": "3.1.2-participants-and-spectators.html" },
      { "id": "3-2-pre-event-aspects", "name": "3.2 Pre-Event Aspects", "sub": "Hosting a Major Sporting Event", "file": "3.2-pre-event-aspects.html" },
      { "id": "3-3-1-during-the-event", "name": "3.3.1 During the Event", "sub": "Hosting a Major Sporting Event", "file": "3.3.1-during-the-event.html" },
      { "id": "3-3-2-post-event-and-legacy", "name": "3.3.2 Post-Event and Legacy", "sub": "Hosting a Major Sporting Event", "file": "3.3.2-post-event-and-legacy.html" }
    ]},
    { "id": "4-national-governing-bodies", "title": "4. National Governing Bodies", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "4-1-the-role-of-ngbs", "name": "4.1 The Role of NGBs", "sub": "National Governing Bodies", "file": "4.1-the-role-of-ngbs.html" }
    ]},
    { "id": "5-technology-in-sport", "title": "5. Technology in Sport", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "5-1-1-technology-to-enhance-performance", "name": "5.1.1 Technology to Enhance Performance", "sub": "Technology in Sport", "file": "5.1.1-technology-to-enhance-performance.html" },
      { "id": "5-1-2-technology-to-increase-safety", "name": "5.1.2 Technology to Increase Safety", "sub": "Technology in Sport", "file": "5.1.2-technology-to-increase-safety.html" },
      { "id": "5-1-3-technology-and-officiating", "name": "5.1.3 Technology and Officiating", "sub": "Technology in Sport", "file": "5.1.3-technology-and-officiating.html" },
      { "id": "5-1-4-technology-to-enhance-spectatorship", "name": "5.1.4 Technology to Enhance Spectatorship", "sub": "Technology in Sport", "file": "5.1.4-technology-to-enhance-spectatorship.html" },
      { "id": "5-2-1-positive-effects-of-technology", "name": "5.2.1 Positive Effects of Technology", "sub": "Technology in Sport", "file": "5.2.1-positive-effects-of-technology.html" },
      { "id": "5-2-2-negative-effects-of-technology", "name": "5.2.2 Negative Effects of Technology", "sub": "Technology in Sport", "file": "5.2.2-negative-effects-of-technology.html" },
      { "id": "5-2-3-technology-and-the-spectator-experience", "name": "5.2.3 Technology and the Spectator Experience", "sub": "Technology in Sport", "file": "5.2.3-technology-and-the-spectator-experience.html" }
    ]},
    { "id": "6-exam-preparation", "title": "6. Exam Preparation", "sub": "R184 · Contemporary Issues in Sport", "colour": "#16a34a", "pages": [
      { "id": "6-1-command-words-and-exam-sections", "name": "6.1 Command Words and Exam Sections", "sub": "Exam Preparation", "file": "6.1-command-words-and-exam-sections.html" },
      { "id": "6-2-extended-response-technique", "name": "6.2 Extended-Response Technique", "sub": "Exam Preparation", "file": "6.2-extended-response-technique.html" }
    ]}
  ]
}
```

---

## 5. Per-page build recipe (the 9 activities)

Every topic page ships all 9 activity tabs (Flashcards optional), in `ACTIVITY_ORDER`:
**📚 Learn · ❓ MCQ · 🔗 Match · ✏️ FIB · ⚠️ Misconceptions · 🎯 Exam Tips · 🃏 Flashcards ·
✅ True/False · 📝 Exam Practice**. Build one page per run using the prompt in **Appendix E**,
then wire it as the existing subjects do (mirror an economics page — inject content inside
`main`, never restyle the shell; body is a desktop CSS grid). Hard contracts:

- **MCQ / TF / Match / FIB** obey `docs/QUESTION-AUTHORING.md`: correct answer never the unique
  longest option; ≥1 equal-or-longer genuine trap distractor per item; vary the correct
  position; never reveal the answer in the stem; FIB blanks use the positional `_____`
  convention and the surrounding words must not give the answer away.
- **Written exam answers** use tick-the-mark-scheme self-marking (`docs/SELF-MARK-POINTS-AUTHORING.md`):
  wire `/cs-lab/exam-widgets.js` before `/script.js`; author `q.markPoints` (grouped for any
  compound scheme; group maxes sum to `q.marks`); use `format: 'banded'` for the 6- and 8-mark
  levelled responses (never `markPoints`).
- **Micro-pages** (a single sub-sub-topic, e.g. 2.5.4) still ship all 9 tabs. Where the topic is
  too narrow for a full mini-assessment, scale down item counts and let the **Exam Practice**
  scenario span the parent sub-topic (all of 2.5 PEDs) so the 8-mark Discuss stays authentic (P6).
- **Every tested fact is taught first in Learn** — no question draws on a fact the page didn't teach.

---

## 6. Exam mapping (R184 → widgets) — verified against the SAM

The paper has three sections. Sections B and C are scenario/context-based; the paper "will
always require students to use the skills of analysis and evaluation."

| Section | Marks | What it contains (from the SAM) | Website widget | Marking |
|---|---|---|---|---|
| **A** | 30 | MCQ + short/medium recall (1–4 marks) **and one 8-mark levelled question** | `mcq`, `lines`, `banded` (the 8-marker) | 1 mark/bullet fallback or grouped `markPoints`; `banded` for the 8-marker |
| **B** | 28 | Scenario short/medium (Describe/Explain, 3–6 marks) including **6-mark levelled** questions | `lines`, `banded` (6-markers) | grouped `markPoints` (point + application pairs); `banded` for 6-markers |
| **C** | 12 | Scenario extended response — short parts + an **8-mark "Discuss/Evaluate"** levelled question | `lines` + `banded` (8-marker) | 3-band descriptor grid + indicative content |

**Command words:** Identify/State (name it) · Describe (say what happens) · Explain (give
reasons — because…) · Discuss (weigh both sides) · Evaluate (weigh up + justified judgement).
Mark count signals depth: 1 = one point; 4 = two developed points or point+application×2;
6/8 levelled = analysis of BOTH sides + a justified judgement (bottom band = basic, unbalanced,
listy; top band = thorough, balanced, reasoned).

**Banded boundaries are auto-derived by the widget from the tariff** — author the markScheme
descriptors to match: an **8-mark** question bands as **1-2 / 3-5 / 6-8**; a **6-mark** as
**1-2 / 3-4 / 5-6**. Do NOT use `markPoints` on a banded question. Keep the `modelAnswer` tight
(§Appendix E): the minimum that earns the marks, never an essay.

---

## 7. New capabilities required

**None** (§1.1 D2). Sport Studies reuses the existing content and marking machinery with no new
JS/CSS engineering. The only shared-file edits are the coordinator adding the subject to the
scaffolder `SUBJECTS` tree and `subject.json`, then running the build pipeline — identical to
how a new Economics group is added.

---

## 8. Build waves

| Wave | Work items | Owner |
|---|---|---|
| SPT-0 | Create `subject.json` (§4); register subject in scaffolder + `netlify.toml`; smoke-test an empty index renders | Coordinator |
| SPT-A | Build Group 1 (5 pages: T1–T5) | Builders |
| SPT-B | Build Group 2 (11 pages: T6–T16) — the largest group; PEDs 2.5.1–2.5.6 | Builders |
| SPT-C | Build Group 3 (5: T17–T21) + Group 4 (1: T22) + Group 5 (7: T23–T29) | Builders |
| SPT-D | Build Group 6 (2: T30–T31) — references misconceptions found in SPT-A/B/C | Builders |
| SPT-E | Length-pass audit (MCQ length tell), self-mark audit (compound schemes have `markPoints`; 6/8-markers are `banded`), copyright spot-check (no verbatim), coverage check vs Appendix B, run `build_question_bank.py`, deploy | Coordinator |

---

## 9. Status

| ID | Page | Status |
|---|---|---|
| SPT-0 | subject.json + scaffolding | ✅ (scaffolder entry + 3-tuple spec-numbering support + exam-widgets include; 31 pages + index + manifest generated; registered platform-wide, 6 subjects) |
| T1 | 1.1 User Groups | ✅ (gold-standard pilot: 9 activities, length-audit pass, markPoints/banded verified, live in manifest, pipeline-parsed 51 marks) |
| T2 | 1.2 Barriers to Participation | ✅ |
| T3 | 1.3 Solutions to Barriers | ✅ |
| T4 | 1.4 Popularity of Sport in the UK | ✅ |
| T5 | 1.5 Emerging and New Sports | ✅ |
| T6 | 2.1 Values Promoted Through Sport | ✅ |
| T7 | 2.2 The Olympic & Paralympic Movement | ✅ |
| T8 | 2.3 Initiatives and Campaigns | ✅ |
| T9 | 2.4.1 Etiquette of Performers | ✅ |
| T10 | 2.4.2 Etiquette of Spectators | ✅ |
| T11 | 2.5.1 Why Performers Use PEDs | ✅ |
| T12 | 2.5.2 Why Performers Should Not Use PEDs | ✅ |
| T13 | 2.5.3 The Role of WADA | ✅ |
| T14 | 2.5.4 Sanctions Against PEDs | ✅ |
| T15 | 2.5.5 Education Against PEDs | ✅ |
| T16 | 2.5.6 The Impact of PEDs on Sport | ✅ |
| T17 | 3.1.1 Types of Major Events | ✅ |
| T18 | 3.1.2 Participants and Spectators | ✅ |
| T19 | 3.2 Pre-Event Aspects | ✅ |
| T20 | 3.3.1 During the Event | ✅ |
| T21 | 3.3.2 Post-Event and Legacy | ✅ |
| T22 | 4.1 The Role of NGBs | ✅ |
| T23 | 5.1.1 Technology to Enhance Performance | ✅ |
| T24 | 5.1.2 Technology to Increase Safety | ✅ |
| T25 | 5.1.3 Technology and Officiating | ✅ |
| T26 | 5.1.4 Technology to Enhance Spectatorship | ✅ |
| T27 | 5.2.1 Positive Effects of Technology | ✅ |
| T28 | 5.2.2 Negative Effects of Technology | ✅ |
| T29 | 5.2.3 Technology and the Spectator Experience | ✅ |
| T30 | 6.1 Command Words and Exam Sections | ✅ |
| T31 | 6.2 Extended-Response Technique | ✅ |

---

## Appendix A — R184 assessment facts (mirror freely; non-copyrightable)

- Unit **R184 "Contemporary issues in sport"**, part of Cambridge Nationals **Sport Studies J829**.
- **Written paper, 70 marks, 1 hour 15 minutes, 40% of the qualification**, **terminal**.
- **Three sections:** **A = 30** (MCQ + short/medium recall, incl. one 8-mark levelled question);
  **B = 28** (scenario short/medium incl. 6-mark levelled); **C = 12** (scenario extended
  response incl. an 8-mark "Discuss/Evaluate" levelled question).
- The paper "will always require students to use the skills of analysis and evaluation."
- Five topic areas (§3): (1) issues which affect participation, (2) the role of sport in
  promoting values, (3) implications of hosting a major sporting event, (4) the role NGBs play
  in developing their sport, (5) the use of technology in sport.
- Grades: **Level 1 Pass/Merit/Distinction**, **Level 2 Pass/Merit/Distinction/Distinction\***.
- `exam_date`: **Tuesday 11 May 2027 (PM)** — confirmed by owner (P4).

---

## Appendix B — per-page coverage checklist (the contract; from spec §4.2)

One block per page. Tick every bullet is TAUGHT (in Learn) and TESTED (somewhere) on that page.

**T1 — 1.1 User groups:** gender; different ethnic groups; retired/over-60s; families with
children; carers; people with family commitments; young children; teenagers; people with
disabilities; parents; people who work; unemployed/economically disadvantaged — with the
awareness that different groups have different needs/goals.

**T2 — 1.2 Barriers:** employment/unemployment; family commitments; lack of disposable income;
lack of transport; lack of positive sporting/family role models & support; lack of / lack of
awareness of appropriate provision; unequal media coverage (gender & ethnicity).

**T3 — 1.3 Barrier solutions:** provision (programmes/sessions/activities/times per user group);
promotion strategies (targeted promotion, role models, initiatives); transport; appropriate
facilities & equipment (hoists, hearing loops, braille); improved access; appropriate
pricing/concessions — each tied to the barrier it solves.

**T4 — 1.4 Popularity of sport in the UK:** how these factors raise or lower a sport's
popularity — participation numbers; facility provision; environment/climate; live spectator
opportunities; media coverage; elite success; positive role models; social acceptability.

**T5 — 1.5 Emerging/new sports:** examples of current emerging sports; their development and
the opportunities to participate.

**T6 — 2.1 Values through sport:** team spirit; fair play; citizenship; **tolerance AND respect
(ONE value)**; inclusion; national pride; excellence — with a sporting example of each.

**T7 — 2.2 Olympic & Paralympic movement:** the Creed; the symbol (five rings = five
continents); Olympic values (Excellence, Friendship, Respect); Paralympic values (Courage,
Determination, Inspiration, Equality). *(Teach in your OWN words — do NOT quote the Creed.)*

**T8 — 2.3 Initiatives & campaigns:** current initiatives, campaigns and events that promote the
sporting values from 2.1, at local / regional / national level.

**T9 — 2.4.1 Etiquette (performers):** reasons to observe etiquette (fairness, safety,
reinforcing values); when to be quiet/appropriate; sportsmanship vs gamesmanship.

**T10 — 2.4.2 Etiquette (spectators):** appropriate spectator behaviour; spectator
responsibility to players and each other; safety.

**T11 — 2.5.1 Why performers use PEDs:** the reasons sports performers choose to use PEDs.

**T12 — 2.5.2 Why performers should not use PEDs:** health, ethical, legal and career reasons
against; the detrimental effects of using PEDs.

**T13 — 2.5.3 The role of WADA:** WADA's purpose; the Whereabouts Rule; testing methods.

**T14 — 2.5.4 Sanctions against PEDs:** bans and fines of varying lengths/costs used to deter use.

**T15 — 2.5.5 Education against PEDs:** educational strategies/campaigns (led by role models,
peers, family) to discourage use.

**T16 — 2.5.6 Impact of PEDs on the sport:** how PED use affects the sport (reputation, fairness,
public trust).

**T17 — 3.1.1 Types of major events:** regular; one-off; regular & recurring — with applied
examples; importance of the different types.

**T18 — 3.1.2 Participants & spectators:** the international nature of participants and
spectators at a major event.

**T19 — 3.2 Pre-event aspects (positive & negative):** bidding; infrastructure & transport
development; financial/commercial investment; potential increased employment; local/national
objections to the bid.

**T20 — 3.3.1 During the event:** positives (social infrastructure, morale/cohesion, national
status, interest, media, tourism, short-term jobs) vs negatives (transport/litter/noise,
terrorism/crime risk, poor home performance, regional neglect, negative coverage).

**T21 — 3.3.2 Post-event & legacy:** positives (facility & transport legacy, participation/
profile rise, international status, future investment) vs negatives (cost > revenue, unused
facilities, reputational loss).

**T22 — 4.1 The role of NGBs:** for a named NGB — promote participation; develop coaching &
officiating; organise competitions; amend rules & apply discipline; ensure safety; provide
support/insurance/guidance; develop policies & initiatives; lobby for funding.

**T23 — 5.1.1 Technology to enhance performance:** methods, equipment and clothing that enhance
performance in named sports.

**T24 — 5.1.2 Technology to increase safety:** technology that enhances participant safety in
named sports.

**T25 — 5.1.3 Technology & officiating:** video review and similar technology supporting
officials and improving fair play/accuracy in named sports.

**T26 — 5.1.4 Technology to enhance spectatorship:** e.g. screens in stadia allowing spectators
to view appeals/decisions.

**T27 — 5.2.1 Positive effects of technology:** enhanced performance; lower injury risk; quicker
recovery; more accurate decisions; technical analysis.

**T28 — 5.2.2 Negative effects of technology:** unequal access to quality technology; cost;
availability/affordability; reduced flow of the game; officials over-relying on / misreading
technology.

**T29 — 5.2.3 Technology & the spectator experience:** the positive and negative effects of
technology on spectators; suitability of technology; named examples.

**T30–T31 — Exam Preparation:** the A/B/C section structure and mark tariffs; command-word
demands; building a balanced, judged 8-mark Discuss/Evaluate answer with sentence scaffolds.

---

## Appendix E — CONTENT BUILDER PROMPT (one topic page per run)

> Paste this to a content-builder agent, filling the TOPIC line with the page and its Appendix B
> bullets. It is the improved version of the owner's original R184 resource-pack prompt,
> re-mapped onto the website's 9 activity tabs and both authoring contracts, with the copyright
> firewall hard-wired and the real Section A/B/C exam structure.

```
# CONTENT BUILDER PROMPT — Sport Studies (J829, Unit R184) topic page

You are an expert Chief Examiner and Master Teacher for OCR Cambridge Nationals
Sport Studies Level 1/Level 2 (J829), Unit R184 "Contemporary issues in sport"
(the only externally-assessed unit — 70 marks, 1h15, three sections A/B/C). You are
authoring content for a self-study revision website, NOT a worksheet. You build
EXACTLY ONE topic page per run.

## TOPIC FOR THIS RUN
[INSERT the page (e.g. "2.5.3 The Role of WADA") and paste its Appendix B bullets —
the exact content this page must teach and test. If it is a narrow micro-page, you may
set the Exam Practice scenario across the whole parent sub-topic (e.g. all of 2.5 PEDs).]

## COPYRIGHT FIREWALL (hard rule — this subject must be 100% copyright-free)
ZERO verbatim exam-board material — stricter than our other subjects. You MAY mirror
non-copyrightable facts and structure freely: topic areas, sub-topics, assessment
structure, command-word meanings, mark tariffs. You may NOT reproduce, quote, or lightly
paraphrase any wording from the OCR specification, sample assessment materials, past
papers, mark schemes, examiner reports, or any textbook/website (this INCLUDES the
Olympic Creed and printed value definitions — teach those ideas in your own words).
Everything expressive is YOUR OWN: invent all scenarios, case studies, named athletes/
teams/events (or state genuine public facts in your own words), questions, distractors,
and mark-scheme phrasing. No copied prose, no copied images. Plain, encouraging UK
English pitched at Level 1/Level 2, in our house voice (calm, direct, second person).

## OUTPUT — author these 9 activity sections, in this order
### 1. LEARN — complete notes covering EVERY Appendix B bullet for this page, in short
   chunks with sub-headings; define each key term as **term — plain definition**. Every
   fact tested below must appear here first.
### 2. MCQ QUIZ (4-6 items) — OBEY THE CONTRACT: correct answer NOT the uniquely longest
   option; EVERY item has >=1 distractor equal-to-or-longer than the correct answer and it
   is a genuine near-miss; vary the correct position; same register/length/form; never
   reveal the answer in the stem; mine misconceptions for distractors. Give stem, A-D,
   correct letter, one-line "why the wrong ones are wrong".
### 3. MATCHING (5-8 pairs) — term <-> plain definition; definition must not contain the term.
### 4. FILL THE BLANKS (4-6 sentences) — positional _____; surroundings must not give it away.
### 5. MISCONCEPTIONS (3-4) — the specific mistakes on THIS topic; the correct understanding;
   and WHY it costs marks (confusing terms e.g. sportsmanship/gamesmanship, treating
   "tolerance and respect" as two values, listing instead of explaining, one-sided answers,
   not using the scenario).
### 6. EXAM TIPS — command words likely here (Identify/State/Describe/Explain/Discuss/
   Evaluate) with what the examiner wants + the mark-count signal; which section this tends
   to appear in and why; 3 punchy topic-specific tips; 3 sentence starters for an L1 student's
   levelled (6/8-mark) evaluation ("One way... is", "This matters because...", "On the other
   hand...", "Overall, the most important... because...").
### 7. FLASHCARDS (optional, 5-8) — front prompt/term, back concise answer.
### 8. TRUE / FALSE (5-6) — false ones encode a real misconception, not an absurdity; give
   verdict + one-line reason.
### 9. EXAM PRACTICE (original questions + self-mark schemes):
   - Section A style: 2 short-recall items (1-3 marks). 1 mark/bullet needs no markPoints;
     if any bullet != 1 mark, author GROUPED markPoints (group max = tariff; maxes sum to marks).
   - Section B style: 1 applied-scenario question (4-6 marks). Invent a realistic context;
     student must APPLY. Grouped markPoints (point + application pairs); bake accept/reject into
     the tick text. If it is 6-mark levelled, use format: 'banded'.
   - Section C style: 1 extended response — an 8-mark "Discuss"/"Evaluate". Use format: 'banded'
     (NOT markPoints). The widget AUTO-DERIVES the bands from q.marks, so write the markScheme
     descriptors to match its REAL boundaries: Band 1 (basic) 1-2 = listy/unbalanced/little
     application; Band 2 (reasonable) 3-5 = some analysis, applied, may be one-sided; Band 3
     (thorough) 6-8 = BALANCED, reasoned, with a justified judgement. Then Indicative content
     ("indicative, reward valid alternatives"). [A 6-mark levelled Q auto-bands 1-2 / 3-4 / 5-6.]
   - modelAnswer = the Band-3 exemplar, but TIGHT — ONLY what secures the marks. An 8-mark model
     answer is ~120-160 words (a few applied points + one "however" + a justified judgement), NOT
     an essay; shorter written answers scale down (a 4-marker ~50-70 words). A model answer that is
     too long does not get read, so it fails its job. (Owner feedback 2026-07-24.)

## SELF-CHECK
- [ ] Every Appendix B bullet for this page is taught in Learn and tested somewhere.
- [ ] Nothing copied from OCR/SAM/textbook wording (incl. the Creed) - all original.
- [ ] No MCQ/TF correct answer is the uniquely longest; each has a >=-length genuine trap;
      correct positions vary.
- [ ] Compound 4-6 mark schemes use grouped markPoints (maxes sum to tariff); 6/8-mark
      levelled use banded, NOT markPoints.
- [ ] The Discuss/Evaluate answer is balanced (both sides) and reaches a judgement.
```
```
