# Vidya — Complete Product & Redesign Brief

> **What this document is.** A single, exhaustive, **design‑agnostic** specification of everything the
> platform *does* — from the smallest touch to the largest system — written to be handed to a design
> team and/or another AI model that will create a **brand‑new visual design and build it as a
> responsive web app AND a mobile app**.
>
> **What this document deliberately excludes.** The current visual design, CSS, colours, layout, and
> HTML structure. Those are being replaced. Everything here is *function, content, data, behaviour,
> roles, states, and product vision* — the raw material a designer needs to redesign the surface
> without losing a single capability.
>
> **How it is structured.** It follows the standard professional redesign‑brief / PRD + developer‑handoff
> structure (discovery/audit → goals → audiences → roles → platforms → information architecture →
> journeys → exhaustive feature inventory → content model → data model → gamification economy →
> spaced‑repetition engine → states & edge cases → non‑functional/security → edtech safeguarding →
> tone → constraints & build‑status → glossary). Sections 0–8 are the *brief*; 9–13 are the
> *feature/content/data detail*; 14–20 are the *developer + safeguarding layer*.
>
> **One‑sentence product definition.** Vidya is a multi‑subject GCSE / KS3–KS5 revision platform that
> pairs original, exam‑aligned interactive lessons with subject‑specific tools (real in‑browser Python,
> logic circuits, typeset maths, Spanish audio) on top of a gamified, server‑verified, spaced‑repetition
> learning engine — with a full teacher LMS and multi‑school administration — and is evolving into a
> **service where any teacher can author their own subject** and run the entire engine behind it.

---

## 0. Executive summary

Vidya turns each curriculum topic into a full interactive lesson (read → recall → apply → sit real exam
questions you mark like an examiner). Everything a student practises is automatically rescheduled to
return right before they would forget it (a **1‑day / 7‑day / 28‑day** review cycle plus a daily
"get it right 3× in a row = mastered" drill). Points, levels, streaks, badges, coins, collectible avatars
and leaderboards reward **real, server‑verified answers** — nothing is forgeable. Teachers get
join‑code classes, one‑click tasks with AI‑assisted marking, printable worksheets, live analytics, and
the ability to **build their own subjects**. Schools get multi‑tenant administration with role‑based
control and full auditing.

**Three simultaneous audiences** land on this product and every design decision must serve all three:
**students** (want it fun, effective, fair), **teachers** (want time saved, insight, control), and
**school leaders / parents** (want safeguarding, data isolation, evidence of progress).

**Current reality (be truthful in the design):** the platform is in live use with real students, free to
the founding school for 2026–27. Some subjects are newer (Spanish at pilot stage). The teacher LMS and
school admin are built and in use; a few advanced modules (Report Writer UI, some Subjects‑V2 sharing
tables) are specified/partly built but not yet fully switched on — flagged as **PLANNED** throughout so
the redesign never over‑promises.

**Tech substrate the new front‑end must sit on:** Supabase (Postgres + Auth + Row‑Level Security +
server‑side grading RPCs) and Netlify (edge + serverless functions). One shared student engine powers
every subject. A redesign can restyle everything but must preserve the data contracts in §10–§13.

---

## 1. Why redesign now — the product vision

### 1.1 The problem with the present surface
The platform grew feature‑first: ~40 standalone HTML pages, a 273 KB monolithic activity engine, and a
visual layer bolted on over time. It works and is feature‑rich, but the surface is inconsistent, was
never designed mobile‑first, and does not yet feel like one coherent product across the student, teacher,
and school experiences. The **capabilities are world‑class; the presentation is not.** This redesign
keeps 100% of the capability and rebuilds the surface as one designed system for web + mobile.

### 1.2 The strategic pivot the design must anticipate
Today Vidya ships a fixed catalogue of subjects (Business, Economics, Computer Science, Additional Maths,
Spanish, Sport Studies). **The direction of travel is to become a service**, where:

- **Any teacher can author their own subject** (PE, History, anything) that behaves *identically* to the
  built‑in ones — the full 9‑activity lesson model, Daily Revise, the 1‑7‑28 review calendar, tasks,
  worksheets, mastery, analytics and gamification all work behind it with zero extra setup.
- **Teachers share and co‑author subjects** with colleagues, their whole school, or (via admin approval)
  people outside their school.
- **Schools fork and customise** the platform subjects into their own school‑specific copy while still
  receiving upstream fixes to untouched topics.
- **Teachers track progress, assign tasks, and drive the spaced‑repetition engine** for whatever subject
  they run.

The redesign must therefore treat "subject" as a **first‑class, user‑creatable object**, not a fixed
menu — the IA, empty states, and authoring flows must feel native to a teacher creating subject #1 as
much as to a student revising Business. This is the single most important forward‑looking constraint.

---

## 2. Goals & success metrics

The redesign should be briefed against measurable goals (baselines to be pulled from current analytics).

| Goal | Why | Example metric to move |
|---|---|---|
| One coherent, modern, mobile‑first product | Current surface is inconsistent and desktop‑era | Task‑completion time; mobile session length |
| Make the learning loop obvious | The 1‑7‑28 + daily mastery loop is the core value and is currently under‑surfaced | % of active students who complete ≥1 review/day; 7‑ and 30‑day retention |
| Make teacher setup effortless | Adoption depends on a teacher creating a class + first task + first subject fast | Time‑to‑first‑task; time‑to‑first‑authored‑subject |
| Surface gamification as motivation, not decoration | XP/badges/coins/streaks must feel earned and fair | Daily‑goal completion rate; streak length distribution |
| Trustworthy for schools & parents | Safeguarding/data isolation/evidence are the buying decision | Admin activation; report generation |
| Accessible to minors on any device | It is used in classrooms and on phones | WCAG conformance; small‑screen completion parity |

Design deliverables should be accompanied by success‑metric hypotheses per major flow (onboarding,
daily revise, review, task attempt, subject authoring, class setup, admin).

---

## 3. Scope

**In scope for the redesign:** the entire visual system and interaction design for all student, teacher,
school‑admin, and (planned) parent surfaces, as **responsive web + a mobile app** (see §6 for platform
strategy). All feature functionality in §9 must be preserved and re‑expressed.

**Out of scope (this pass):** changing the backend data contracts (§10–§13) — the new UI binds to the
same entities/RPCs; billing/paywall (parked); structural forking of platform subjects (content‑only);
transitive re‑sharing of subjects; version history/rollback of authored content.

**Future phases the design should leave room for:** Report Writer UI (parent‑shareable reports),
full Subjects‑V2 sharing/fork switch‑on, native push notifications, offline mode, a unified cross‑subject
profile + cosmetics store, and a parent portal.

---

## 4. Audiences & personas

Four human audiences, each needing distinct personas, journeys, and screens. (Persona = *who & why*;
Role = *system permissions* — see §5.)

### 4.1 Student (the core user; often a minor, 11–18)
- **Goals:** pass exams, revise efficiently, not be bored, feel progress, compete a bit.
- **Context:** school desktop, home laptop, and heavily **on a phone** (on the bus, in bed). Short bursts.
- **Frustrations:** passive revision, not knowing what to revise, losing streaks, unfair‑feeling quizzes.
- **Key tasks:** daily revise (10 min), do due reviews, complete a lesson's 9 activities, sit exam
  practice and self‑mark, complete assigned tasks, spend coins on avatars, check the leaderboard.
- **Must‑feel:** fun, fair, effective; instant feedback; clear "what next".

### 4.2 Teacher (the power user & the growth engine)
- **Goals:** save marking time, see the gap before the mock, set targeted work, run their own subject.
- **Context:** desktop for setup/marking; phone for quick checks/notifications. Time‑poor.
- **Frustrations:** slow marking, no visibility, generic resources, clunky tools.
- **Key tasks:** create a class + join code, add/generate student logins, invite co‑teachers, **author a
  subject** (9‑activity wizard or AI‑filled JSON import), build & assign tasks (auto + AI‑assisted
  marking), build printable worksheets, read analytics, set Daily‑Revise/topic‑access controls, manage
  the leaderboard, clear the notification/to‑do queue, oversee reviews.
- **Must‑feel:** in control, respected, fast; nothing hidden; safe to experiment.

### 4.3 School leader / admin (the buyer & safeguarder)
- **Goals:** safe rollout, control who can do what, evidence for SLT/Ofsted, one platform many subjects.
- **Key tasks:** manage teachers (suspend/reset/remove/delete/promote), grant subjects to the school and
  to teachers (two‑tier), mint per‑school invite codes, approve external shares, read the audit log,
  create/switch schools (owner), (planned) generate SLT/HoD reports.
- **Must‑feel:** authoritative, auditable, least‑privilege, no cross‑school leakage.

### 4.4 Parent (planned audience)
- **Goals:** understand how their child is doing, in plain, fair language.
- **Current reality:** **no parent account exists.** The only parent surface is a **planned
  parent‑shareable per‑student report** (PDF/CSV) a teacher generates — deterministic prose, fairness‑first,
  teacher‑only data suppressed. The redesign should design the *parent report artefact* and leave room for
  a future parent portal, but must not imply a parent login exists today.

---

## 5. User roles & permissions

Roles are **always resolved server‑side** from the session; never trusted from the client.

| Role | Source of truth | One‑line definition |
|---|---|---|
| **Student** | `profiles.role='student'` (default) | Learns; sees only subjects their class is enrolled in. Generated logins use `@students.local`. |
| **Teacher** | `profiles.role='teacher'` + `account_type='teacher'` | Full teaching powers on classes they own/co‑teach; can author subjects. Created only via invite code. |
| **Co‑teacher** | membership in `class_teachers` | Same `teacher` role, per‑class parity (teach, task, settings) — but not destructive class acts. |
| **Class creator** | `classes.teacher_id` | The teacher allowed destructive acts on that class (delete, remove a teacher). |
| **School admin** | `school_members.role='school_admin'` | Manages teachers, subjects, codes, shares, audit for their school(s). |
| **Owner (platform)** | `profiles.is_owner=true` | Global superuser across all schools; grants school‑level subject/edit access; creates schools. |
| **Parent** | *does not exist yet* | Planned: receives a generated report; no login. |

### 5.1 Permissions matrix (design the UI to reflect this — hide what a role can't do)

| Capability | Student | Teacher | Co‑teacher | Class creator | School admin | Owner |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Learn / revise / take reviews & tasks | ✅ | — | — | — | — | — |
| Join a class by code | ✅ | — | — | — | — | — |
| Spend coins / equip avatar | ✅ | — | — | — | — | — |
| Create a class (subject bound) | ❌ | ✅¹ | ✅¹ | ✅ | ✅ | ✅ |
| Generate/add/reset/delete student logins | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite / accept / remove co‑teacher | ❌ | ✅ (invite/accept) | ✅ (invite/accept) | ✅ (remove) | ✅ | ✅ |
| Delete/archive a class | ❌ | archive | archive | ✅ delete | ✅ | ✅ |
| Author own subject (9‑activity) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Share own subject (in‑school view/edit) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request external share | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve external share / see & revoke all shares | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit a **platform** subject (school fork/override) | ❌ | ✅ if granted² | ✅ if granted² | ✅ if granted² | ✅ if granted² | ✅ |
| Assign tasks / mark / AI‑suggest marks | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Build worksheets | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View analytics / manage leaderboard / topic access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage teachers (suspend/reset/remove/delete/promote) | ❌ | ❌ | ❌ | ❌ | ✅ (own school) | ✅ (all) |
| Grant subjects to a **school** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Grant subjects to a **teacher** (from school set) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create schools / switch school context | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read audit log | ❌ | ❌ | ❌ | ❌ | ✅ (own school) | ✅ (all) |

¹ constrained to the teacher's *effective subject set*. ² edit grant is clamped: owner grants a **school**
the right, then the school admin grants **teachers** within that set; revoking the school grant instantly
voids all teacher grants under it.

---

## 6. Platform & device targets

Two decisions drive the whole redesign — **decide these first and design against them:**

### 6.1 Mobile strategy (recommendation to confirm)
Recommended: **responsive‑web + installable PWA** as the primary target, with the architecture ready to
wrap as native later. Rationale: the app is content‑ and form‑heavy, must run on locked‑down school
devices and any phone, and benefits more from reach + install than from deep native APIs today. If a
true native app is required, design to Apple **Human Interface Guidelines** + Google **Material** as well.

The design must explicitly specify, per surface, the behaviour of these **native‑like capabilities**:
- **Offline / poor‑connection:** the current engine is already *local‑first* (progress writes to
  localStorage, then syncs to the server via a retry queue) — the redesign should surface offline state
  and queued‑sync status. Labs run fully in‑browser (Pyodide/SQL/etc.) and already work offline.
- **Push notifications:** today notifications are in‑app (a bell + poll). A mobile app should map the
  existing notification types (§9.10, §9.24) to real push, respecting the per‑type Normal/Quiet/Off prefs.
- **Install / home‑screen, tap feedback, gestures, haptics:** design for touch‑first interaction across
  every activity type (drag‑matching, flip‑cards, sliders, drawing diagrams, code entry).
- **Audio:** Spanish TTS uses the Web Speech API (output only) — verify/replace on native.

### 6.2 Responsive requirements (learned from the current build — preserve these)
- **Every surface must work on a phone**, including the calendar, daily practice, exam self‑marking,
  the authoring wizard, analytics grids, and the labs.
- The lesson **tab bar of 9–10 activities must never wrap or scroll sideways**; the current engine
  measures the bar and steps labels full → short → mini → icon as the screen narrows. Preserve this
  behaviour (label degradation), or design an equivalent (e.g. overflow menu / bottom nav) that keeps all
  activities reachable one‑tap on mobile.
- Wide content (tables, matrices, diagrams, code) must scroll inside its own container — the page body
  must never scroll horizontally.
- Respect **"reduce motion"** — all reveal/hover/count‑up motion must have a calm fallback.
- **Browser/OS support matrix** to be confirmed, incl. school‑managed devices and minimum versions.

---

## 7. Information architecture — full surface inventory

Every current page and its purpose. The redesign can restructure the IA (e.g. into an app‑shell with
persistent nav) but must provide a home for each function. Grouped by audience.

### 7.1 Public / auth
- **Landing / index** — marketing entry; two CTAs ("Get started" / "I have a class login"); redirect target.
- **Login** — two modes: *class login* (username → `…@students.local` + password) and *email* (email +
  password); Google OAuth (Microsoft coded but hidden). Single post‑login router by role.
- **Signup** (student self‑signup) and **Teacher signup** (requires staff invite code; supports an
  external‑share invite token).
- **Auth callback** (OAuth return). **Join** (student enters a class join code).
- Legal/compliance: **Privacy policy, Cookie policy, Terms, Acceptable use, Accessibility statement,
  Children's code, DPIA** (a full compliance surface — signals a school‑ready product).

### 7.2 Student app
- **Hub** ("My Subjects" launcher) → per subject: **Dashboard**, **Daily Revise**, **Tasks**,
  **Review Calendar**, **Leaderboard**, **Vocab**.
- **Topic page** — the core lesson (9–10 activity tabs).
- **Badges** (gamification gallery), **Locker** (rewards store / avatars / perks), **Vocab** (7 modes),
  **Notifications**, **Manage account**, **Subject view** (a subject's topic index).

### 7.3 Teacher app
- **Teacher dashboard** (per‑class hub: progress, Daily‑Revise controls, topic access, alerts/reports).
- **My Classes** (create/manage classes, students, join codes, co‑teachers).
- **My Content / Subjects** (author subjects; share; fork platform subjects).
- **Tasks** (build/assign/mark), **Worksheets** (printable/PDF/Word), **Daily Revise analytics**,
  **Leaderboard** (manage), **Calendar** (task deadlines), **To‑Do / Notifications**.
- (Planned) **Report writer**.

### 7.4 Admin app
- **Admin console** (tabbed): Teachers · Invite codes · Sharing · Audit log · (owner) School subjects ·
  Schools.

### 7.5 Navigation context rules to preserve
- Student links always carry `?subject=<slug>` (subject scoping is pervasive). A `gcse_last_subject`
  fallback resolves the active subject when absent.
- Teacher nav carries a `?class=` context across class‑scoped pages; an **Admin** link appears only for
  owner/school‑admin.
- Auth guards redirect unauthenticated users to the landing page (not a bare login), preserving intended
  destination via `?redirect=`.

---

## 8. Key user journeys (per persona, whole‑lifecycle)

Design current‑state → proposed for each; cover onboarding, core loop, empty state, re‑engagement, error
recovery. The essential loops:

- **Student first‑run:** land → sign up / class login → (guided onboarding tour spanning home, dashboard,
  a real topic) → join a class by code → hub → first lesson → first daily revise.
- **Student daily loop (the heart of the product):** notification/bell → "reviews due" + daily goal →
  Daily Revise (get 3‑in‑a‑row = mastered) → any due 1‑7‑28 reviews (5‑question quiz, ≥60% to pass) →
  earn XP/coins/streak → optionally spend coins in Locker / check leaderboard.
- **Student lesson loop:** open topic → move left‑to‑right through the 9 activities (read → recall →
  apply) → Exam Practice (write, reveal mark scheme, self‑mark like an examiner) → topic‑complete
  celebration → next topic.
- **Teacher setup:** teacher signup (code) → create class (pick subject) → generate/add student logins or
  share join code → optionally invite co‑teachers.
- **Teacher subject authoring (the pivotal new journey):** My Content → create subject → 4‑step wizard
  (Basics → Structure → Content → Publish) OR download JSON template → fill by hand or via the supplied AI
  prompt → import with friendly validation → publish → students in the bound class see it, and Daily
  Revise / tasks / worksheets / analytics light up automatically.
- **Teacher weekly loop:** dashboard "needs you today" → mark queue (auto‑marked done; AI‑suggested marks
  to approve for written) → analytics (weakest topics, most‑failed questions) → set a targeted task /
  retry‑wrong task → clear notifications/to‑dos.
- **Admin loop:** manage a joiner/leaver (invite code / suspend / reset / remove) → grant subjects →
  approve an external share → check audit log.
- **Parent (planned):** teacher generates a per‑student report → shares PDF → parent reads plain‑language
  strengths / growth / next‑steps.

---

## 9. Feature inventory (exhaustive)

The complete catalogue of capabilities, from smallest polish to largest system. Each item is what it
*does* — restyle freely, but keep the function. **[BUILT]/[PLANNED]** flags reflect current status.

### 9.0 Whole‑product polish (small touches that make it feel like a product) [BUILT]
- **Searchable dropdowns** — every long `<select>` (classes, topics, schools) is upgraded to a
  type‑to‑filter combobox.
- **Themes & backgrounds** — 7 colour themes (incl. 2 true dark modes) + 20+ background patterns,
  remembered per device, live across tabs, via a floating switcher on every page. (The *new* design owns
  the default look; a theme/appearance system is expected to remain.)
- **Motion system** — scroll‑reveal, hover‑lift, count‑up stats from real numbers; honours reduce‑motion.
- **Notification bell** on every page (one shared derivation feeds bell + full page).
- **Guided onboarding tour** — first‑run walkthrough, survives navigation, once per browser.
- **Celebrations** — XP toasts, badge toasts (new‑only), level‑up, combo toasts, streak‑safe/daily‑goal
  celebrations, topic‑complete confetti, synthesized sounds, and an avatar buddy that reacts.

### 9.1 The topic page — a full lesson (the core unit) [BUILT]
Every topic (built‑in *and* teacher‑authored) renders the **same skeleton** as a tab bar of **nine
activities**, in this fixed order, with a **10th "🧪 Practice Lab"** tab injected on eligible subjects:

1. **📚 Key Learning** — expandable note cards ("mark read" = progress); a card may embed a *read‑check*
   MCQ that must be answered to count. Active reading, not passive scrolling.
2. **❓ MCQ Quiz** — multiple choice, instant right/wrong + explanation.
3. **🔗 Matching** — tap term → tap definition; round‑based; connector lines; resumes across sessions.
4. **✏️ Fill the Blanks** — cloze sentences; per‑blank dropdown (Standard) or free‑text (Advanced/Typing).
5. **⚠️ Misconceptions** — myth vs examiner‑correct cards; optional read‑check.
6. **🎯 Exam Tips** — question‑type & mark‑scheme guidance; optional read‑check.
7. **🃏 Flashcards** — flip, self‑rate Got‑It / Still‑Learning (RAG buckets), re‑drill the weak ones.
8. **✅ True / False** — statement + T/F, instant feedback + explanation.
9. **📝 Exam Practice** — real exam questions with self‑marking (§9.2).
10. **🧪 Practice Lab** — subject‑specific interactive tools (§9.11), on CS / Economics / Additional Maths.

**Framework behaviours to preserve:** per‑tab progress rings; a persistent **HUD** (level/XP/streak/badges
+ this topic's progress + prev/next links); **redo‑wrong** per section; per‑section and per‑page **reset**;
expand‑all; topic‑complete celebration (once, re‑armed on reset); keyboard tab navigation; course sidebar
drawer; scroll‑to‑top.

**Teacher‑configurable pacing ("focus mode"):** a teacher can, per class, switch on one‑question/card at a
time (Back/Next), add a **reading cooldown** (a delay before answering) and an **answer cooldown** (pause
before Next), and **lock the activity order** so students go through tabs in sequence. Settings sync from
the server, no student refresh.

### 9.2 Exam practice & self‑marking (the signature feature) [BUILT]
- Authentic exam questions with **mark tariff** and original **exam‑series year**; each offers a
  **💡 Hint** and a **✍️ Sentence Starter**, then **"Submit & See Mark Scheme."**
- **MCQ exam questions:** auto‑reveal correct/incorrect + full mark‑scheme rationale.
- **Written questions — tick‑the‑mark‑scheme self‑marking:** after submitting a typed answer, the student
  marks it **like an examiner** — each creditable mark‑scheme point is a tick‑box; ticks total the score
  (0.5 steps). Compound schemes are grouped so a perfect answer ticks to full and a half answer to half. A
  **required reflection sentence** is captured. The typed answer **locks** on submit; a question only
  counts as attempted once self‑marked; a self‑award is not stored as right/wrong.
- **Levelled/banded answers:** 6‑ and 8‑mark essays use a banded widget (pick the level band + a mark
  within it from examiner descriptors).
- **CS exam widgets:** grid‑fill / code questions can auto‑compute a mark or drive point‑by‑point
  self‑assessment; state persists.
- **Case‑study grouping:** questions sharing one extract show it once per run (not repeated per question).
- **Paste‑guard (integrity):** written boxes block paste and drag‑drop; a gentle warning shows; every
  blocked attempt is logged server‑side and surfaced to the teacher as an integrity alert. Monitoring, not
  lockdown (proportionate for formative revision; screen readers/answer boxes stay usable).
- **AI marking assist (teacher‑side, benefits students):** AI can pre‑mark written answers into the
  *teacher's* queue as *suggestions only* with feedback; the teacher edits/approves; students never see an
  AI mark before a teacher releases it.

### 9.3 Daily Revise — the "Rule of 3" [BUILT]
- A fresh personalised queue each day, per subject, drawn from every topic studied. Subject switcher;
  streak + mastery stats; filter (topic scope grid + "incorrect only" / "exclude mastered").
- Each question carries a **4‑segment mastery bar** (red → orange → yellow → green): answer correctly
  **three times in a row** to master it; a wrong answer **resets** to one red segment.
- Question types: MCQ (shuffled options), True/False, Fill‑blank (dropdown or typed). LaTeX for maths.
- Every answer is **server‑graded** (`record_mastery_answer`). Correct answers earn real, permanent XP;
  the day‑streak is genuine; first‑ever mastery of a question is gated against farming.
- Teacher class controls: **mode** (teacher‑controlled / teacher‑guided / student‑controlled), active‑topics
  grid, weekly question cap, reading‑time before a question, pause‑after‑answer.

### 9.4 Review Calendar — spaced repetition, 1 · 7 · 28 [BUILT]
- The first time a student genuinely works a topic, the **server** schedules three reviews at
  **+1 day, +7 days (1 week), +28 days (4 weeks)**.
- Month calendar (Monday‑start) with due / overdue / done states, filters, stats, a "due now" list, a
  multi‑subject view, and **task deadlines overlaid**.
- Ticking a review off = passing a **5‑question, server‑graded quiz** (session target = min(5, available),
  **pass = ≥60%**); fail restarts the session; topics with no gradable questions can't be completed.
- Fully server‑side & cross‑device; lazily seeded; retroactively seeded for older topics; a permanent
  demo "example" review exists for onboarding (excluded from nagging).
- A "reviews due" pill appears on hub/dashboard (red when overdue).

### 9.5 Gamification — XP, levels, streaks, combos [BUILT]
XP is a **pure function of verified progress** (recomputed, never independently stored → tamper‑resistant):
- **+10 XP** per correct question · **+50 XP** per section completed · **+200 XP** per topic completed.
  Flashcards and wrong answers earn no XP; reading a card / revealing a mark scheme does. Daily Revise
  folds in +10 per lifetime correct and +50 per mastered.
- **Levels:** level *n* costs `n²·50` XP; badge thresholds at L5/10/15/20/30.
- **Streak:** a day counts if ≥1 correct answer; first correct of the day fires a "streak safe"
  celebration; **daily goal = 10 questions** fires its own celebration; longest streak tracked. A
  purchasable **Streak Freeze** protects one missed day.
- **Combos (session display):** consecutive corrects trigger toasts/sounds at milestones
  (3,5,8,12,16,20,25,30,40,50); a wrong answer resets the combo.
- **Per‑subject scoping:** streak, XP‑derived stats, mastery, leaderboard and subject badge sets are
  scoped per subject — Business progress never bleeds into Economics.

### 9.6 Badges [BUILT]
A cross‑subject **profile badge set** with rarities **common → uncommon → rare → epic → legendary →
mythic**, each with a custom medallion. Categories & triggers:
- **Progress (questions answered):** 1 / 100 / 500 / 1,000 / 2,500 / 5,000 / 10,000.
- **XP:** 500 / 2,000 / 5,000 / 10,000. **Levels:** 5 / 10 / 15 / 20 / 30.
- **Topics completed:** 1 / 5 / 15 / 30; complete a whole unit; complete every topic ("Course Legend").
- **Activity categories:** complete each activity type across N topics; "All‑Rounder" = every type ≥1.
- **Streaks:** 3 / 7 / 14 / 30 / 100 / 180 days.
- **Daily Revise:** 20 correct; master 25 / 100 / 500. **Review Calendar:** 1 / 10 / 30 / 100 reviews.
- **Leaderboard (best‑ever):** reach top 10 / top 3 / #1 of class.
- **Subject‑specific sets:** one bespoke 7‑badge arc per subject (e.g. Business "Startup Founder → Business
  Mogul"; CS "Hello, World! → Sentient"); a default questions‑only set for custom subjects.
- A **Badges page** shows locked/unlocked, grouped, with a summary strip and rarity legend.

### 9.7 Coins, Locker, Avatars & Rewards store [BUILT]
- **Coins/wallet** earned through play (monotonic, daily‑capped, anti‑abuse). Balance shown.
- **Locker** (the store & customisation) with tabs:
  - **Character** — buy & equip characters (starters free), each with lore.
  - **Style** — universal cosmetics: skins, backgrounds, frames, pets (equip a loadout).
  - **Wardrobe** — per‑character wearables.
  - **Perks** — consumables that never affect marks/mastery: **🧊 Streak Freeze**, **🎁 Mystery Box**
    (random unowned cosmetic).
- **Avatar system** — recolourable SVG characters (skins/backgrounds/frames/pets/wearables) with a live
  preview; the equipped character appears as a **floating buddy** across pages, reacting to
  celebrate/mistake events (dismissable, hidden on mobile/Locker). No user image uploads (safeguarding).
- **Design note / future:** the roadmap unifies this into a cross‑subject profile + XP store for
  avatars/cosmetics. Design the store to scale to many collectibles.

### 9.8 Leaderboard [BUILT]
- **Scopes:** My class · Whole subject · Class‑vs‑class "groups" (teacher‑defined comparison groups).
- **Metrics (all shown, one highlighted):** ⭐ Overall points, 🎯 Accuracy %, ✍️ Attempts (distinct
  questions, so grinding can't inflate), 🧠 Mastery, 🔥 Streak.
- **Windows:** 24h / 7d / 30d / all‑time, with movement arrows. Avatars per row.
- **Fairness/safety:** teachers control enable, real‑names vs anonymised, visible count (0–200), and can
  exclude individual students; students only ever see names from their own class; durable rank badges are
  computed server‑side (unspoofable).

### 9.9 Vocab lab (Spanish‑focused, extensible) [BUILT]
A vocabulary workspace with a filter sidebar (topic/theme/search + per‑word mastery) and **7 modes**:
1. **🃏 Flashcards+** (flip + RAG self‑grade, 🔊 audio, optional type‑before‑flip).
2. **⌨️ Typed Recall** (type the answer, instant check, streak).
3. **🧩 Match Attack** (timed tile matching; beat best time).
4. **🔤 Conjugation Drills** (infinitive + person + tense → produce the form).
5. **⚡ Speed Vocab** (90‑second flip‑as‑many, self‑report).
6. **🎯 MCQ Blitz** (fast recognition, 4 options).
7. **🎧 Listen & Type** (audio‑only TTS → type the Spanish spelling; ties to the Listening paper).
- **TTS (speech.js):** Web Speech output only (no speech recognition); a 🔊 on any phrase; student Audio
  panel sets **speed (0.5–1.25×)** and voice, persisted.

### 9.10 Student notifications [BUILT]
A shared **bell** (badge + chime + panel) on every student page, plus a full notifications page — both fed
by one derivation (so nothing is silently dropped). Types: **task_assigned** 📋, **task_due** ⏰,
**task_overdue** ⚠️, **task_marked** ✅ (with score), **review_due** 🗓️. Derived client‑side from
task/assignment/attempt data + the review schedule; read/dismiss state persists server‑side. Priority
drives whether a chime + banner fire.

### 9.11 Interactive labs (the 10th tab) [BUILT]
Subject‑specific tool suites that turn theory into practice; each tool lazy‑loads and can save state.

- **Computer Science lab (~20 tools):** 🐍 **Python Lab** (real CPython via Pyodide, incl. live
  interactive `input()`, runaway‑loop kill switch, PRIMM flow), 🗃️ **SQL Lab** (real SELECT on a seeded
  DB), 🔌 **Logic Gate Lab** (build circuits + truth tables), 🔢 **Data Drills** (binary/hex/units/
  file‑size/ASCII, infinite), 📋 Trace Tables, 🧩 Algorithm/Parsons builder, 🔮 Predict‑the‑Output,
  🐛 Bug Hunt, 🪜 Sort & Search visualiser, 🕸️ Network Builder (star/mesh), ⚙️ Fetch‑Execute simulator,
  💾 Storage Chooser, 🛡️ Threat vs Defence, 🖼️ Bitmap/Sampling/Compression labs, 🧪 Test‑Data Sorter,
  🔀 Flowchart Symbols, 🖊️ Examiner Trainer, 🗝️ Command Words. Plus **Mock Papers** (full past papers,
  timed runner, marking view, results breakdown, print).
- **Economics lab:** 📉 **Diagram Lab** (drag supply/demand curves → equilibrium → challenges) and
  🔢 **Calculation Lab** (endless cost/revenue/profit with fresh numbers + worked solutions).
- **Additional Maths lab:** 🔢 Maths Drills (expand/factorise/complete‑square/surds/indices), 📈 Graph
  Explorer (sliders), 📐 LP Builder (feasible region + optimal vertex), 🖊️ Examiner Trainer, 🧩 Step
  Solver, 🎯 Design‑an‑Example (auto‑checked), 🪜 Step Visualiser, 🗝️ Command Words, 🧭 Choose‑the‑Method.
- Maths rendering uses **self‑hosted KaTeX** (maths pages only); marking uses a **tolerance‑aware numeric
  comparator** (grades values/expressions, not just letters). Spanish uses an **accent‑tolerant fuzzy
  grader**.

### 9.12 Subjects (built‑in catalogue) [BUILT]
One engine, multiple subjects; each is a manifest (`subject.json`: topic tree, exam board, spec code,
exam date, colour, icon) + a generated question bank. Current catalogue: **Business (OCR J204)**,
**Economics (OCR J205)**, **Computer Science (OCR J277)** (most tool‑rich), **Additional Maths (OCR FSMQ
6993)**, **Spanish (AQA 8692)** (first MFL/non‑OCR; TTS + fuzzy grading), **Sport Studies (OCR J829)**.
One account holds every subject a student studies; classes bind to exactly one subject; students see only
subjects their class is enrolled in.

### 9.13 Teacher — classes, students, join codes, co‑teachers [BUILT]
- **Create class** bound to one subject (constrained to the teacher's subject set); active/archived tabs;
  per‑subject sub‑tabs.
- **Students:** batch‑**generate logins** (1–60; random or class‑prefixed usernames; per‑student or shared
  password; shown once), **add by email** (enumeration‑safe, one class per student per subject), **reset
  password**, **delete**, **move between classes**.
- **Join codes:** one active 8‑char code per class (ambiguity‑free alphabet), optional expiry (1–365 days)
  and max‑uses (1–1000); regenerate revokes prior; redemption throttled.
- **Co‑teachers:** invite by email (same‑school), accept/decline, revoke, remove (creator only), leave
  (co‑teacher). **Full teaching parity** for all teachers; **destructive acts creator‑only**. Set which
  teachers display to students ("Mr X & Miss Y"). Roster shows teachers, students, pending invites.
- **Archive/delete class** (delete is creator‑only, cascades tasks/settings, optional student‑login delete;
  answer history retained).

### 9.14 Teacher — author your own subject ("My Content") [BUILT]
The pivotal capability. A teacher creates a real subject that behaves exactly like a platform subject.
- **4‑step wizard:** 1 Basics (name/colour/icon) → 2 Structure (units/topics tree) → 3 Content
  (per‑topic authoring across the same **9 activities**, each opt‑out‑able) → 4 Publish & bind classes.
- **Rich‑text editor** with sanitised HTML, theme‑safe preset text colours, highlights, tables, callouts.
- **Template import/export:** download a pre‑filled JSON template, get a **copy‑paste AI prompt** to fill
  it in ChatGPT/etc., re‑import with friendly validation (letter↔index answer normalisation, plain text →
  paragraphs). **Scope selector:** whole subject / one unit / one lesson / blank — author incrementally.
- **Automatic full package:** on publish, questions sync into the bank so **Daily Revise, mastery, spaced
  repetition, tasks, worksheets, and analytics all light up with zero extra setup**; students see only
  Published topics; a "publish everything with content" bulk action exists.
- The authored lesson renders via the same engine as built‑in topics (identical tabs/XP/streaks/focus mode).

### 9.15 Teacher — subject sharing & school fork [BUILT in code; some live‑switch‑on PLANNED]
- **Share** a subject with a colleague or the whole school at **view** or **edit** level; see/revoke shares.
- **Request to edit** a view‑only subject (approved by owner or admin).
- **External share** (outside the school): teacher requests → **admin approves** → one‑time signup link
  (72h) that can onboard a brand‑new person with the subject attached.
- **Platform‑subject fork/override:** a granted school edits its **own copy** of a platform subject
  topic‑by‑topic; untouched topics keep tracking (and receiving fixes from) the master; only that school's
  students see the customised version; the edge routes overridden topics to the dynamic renderer.

### 9.16 Teacher — Tasks (assign · mark · analyse) [BUILT]
- **3‑step builder:** (1) Details & settings — title, instructions, due date/time, **late policy**
  (accept‑late‑flagged or lock‑at‑deadline), **attempts** (1–10 or unlimited), **attempt scoring**
  (best/latest/first), **timer on leave** (running/paused), **time limit**, marking mode. (2) Choose
  questions — from any topics of the class's subject (same bank picker as worksheets); question + answer
  key snapshotted separately (students never receive the key). Types: MCQ / T‑F / fill‑blank / numeric
  (auto), written (manual). (3) Assign — to classes and individual students, each with **per‑student
  overrides** (deadline extension, extra time minutes for SEN); one task can target several classes.
- **Draft vs Published** (publish requires a due date).
- **Task detail:** Analytics · **Marking queue** (unmarked written answers, per‑question marks + feedback;
  "✨ Suggest marks" AI assist) · Students & overrides · Questions. Auto‑types marked at submit; written
  awaits teacher (or AI‑then‑teacher). Per‑task "to mark" counts and class averages.
- **Weakest topics** list per class (worst‑first). **Retry‑wrong** task (a student spins up a task of just
  the auto‑marked questions they missed; a scheduled weekly auto‑retry generator also exists).

### 9.17 Teacher — Worksheet builder (print / PDF / Word) [BUILT]
Same question picker → a printable A4 sheet, **PDF**, or **editable Word (.doc)** with title, instructions,
font scaling, columns, **word banks**, SEN options (sentence starters, larger spacing), matching‑as‑table,
distractor/column **shuffle** ("version B"), and the **answer key on a fresh final page** (print all‑but‑last
for the class). Draft autosave; handles questions that left the bank.

### 9.18 Teacher — Analytics [BUILT]
Per class: **usage table** (per student: attempts, days revised, days since last, accuracy, mastered;
windowed all/7/30), **student mastery overview** (tiers), **question analysis** (top‑10 least/most
understood, windowed, **CSV export**), **class×topic matrix** (% "on a correct run", mastered/total,
class‑average headers), and embedded Daily‑Revise class settings. The dashboard adds whole‑class completion
grids per topic/activity, per‑student sub‑views, and per‑task attention badges.

### 9.19 Teacher — Daily Revise & topic‑access controls [BUILT]
- **Daily Revise controls** (see §9.3): mode, active topics, weekly cap, reading/answer timers.
- **Topic access:** per class set topics **open / manual / sequential** (a topic unlocks when the previous
  is complete); force activity order; set question display; clear a queue of **student topic‑access
  requests** (approve/deny).

### 9.20 Teacher — Leaderboard management [BUILT] (controls listed in §9.8).

### 9.21 Teacher — Question reports & integrity [BUILT]
Students flag a wrong/confusing question ("⚑ Report a problem", reason + free text, rate‑limited) into a
per‑teacher queue (open/handled); paste attempts in exam boxes appear as integrity alerts (grouped per
student per day). Both surface in the dashboard alerts tab and the bell.

### 9.22 Teacher — Calendar [BUILT]
Month grid of **published task deadlines** across all the teacher's classes; prev/next/today; filter by
subject × class; per‑class colour; "+ New Task" shortcut (drafts excluded). (Distinct from the
student‑facing review calendar.)

### 9.23 Teacher — Report Writer [PLANNED / partial]
Deterministic prose engine + SQL exist, but **no UI page/nav yet**. Intended: four read‑only report views
off one spine — **per‑student** (parent + teacher copy), **class summary**, **head‑of‑department**
(cross‑class in a subject), **SLT** (cross‑subject cohort). **No AI** (deterministic templating,
fairness‑first, unit‑tested). Per‑student report: headline (attempts, distinct questions, **graded** vs
**practice** accuracy, mastered, reviews, active days, streak), a trend verdict badge (Improving / Steady /
Needs a nudge / Getting started), per‑group + per‑topic tables, an activity sparkline, and prose that leads
with effort, then Strengths / Growth / Next‑steps (never "weaknesses"; verdicts suppressed below a minimum
activity threshold). Teacher‑only block (misconceptions, effort‑vs‑accuracy, percentile) omitted on the
parent copy. Windows: all‑time / term / since‑last‑report / 30 days. Batch = one PDF per class (page‑break
per student) + class CSV. Export = **print‑to‑PDF + CSV** (no heavy client libs).

### 9.24 Teacher/Admin — Notification centre & to‑do [BUILT]
One derivation feeds the 🔔 bell (poll + badge + chime + tab‑title count) **and** a To‑Do page. Derived
alert types: **marking** ✍️ (grouped per task), **topic_request** 🙋, **class_invite** 🧑‍🏫,
**edit_request** ✋, **external_share** 🌐 (admins), **question_report** 🚩, **integrity** 🚫. The To‑Do page
adds personal to‑dos (priority, links) with **snooze** ("remind me in X hours/days/weeks") and done state,
five status tabs, and type filters. Per‑type prefs **Normal / Quiet / Off** + per‑type chime + global sound;
a dashboard "needs you today" strip summarises pending marking + access requests. Each feed degrades
silently if its backing table isn't live.

### 9.25 School Admin console [BUILT]
Tabbed console; access gated to owner / school‑admin (re‑checked server‑side each call). Owner gets a
school switcher + Schools + School‑subjects tabs.
- **Teacher management** (Active / Suspended / Removed / Deleted): per teacher — username, email, role,
  class & student counts, last sign‑in. Actions: **suspend** (block sign‑in, optionally freeze their
  classes) / reinstate; **reset password** (temporary password or email link); **remove from school**
  (soft, reversible) / **re‑add**; **delete forever** (only after removed; class disposition = handoff /
  orphan / delete‑too; type‑to‑confirm); **promote/demote** admin (can't demote the last); **add existing
  teacher by email**.
- **Two‑tier subject access:** owner sets which subjects each **school** may use; admin grants, from that
  set, which subjects each **teacher** gets (clamped). Plus **fork/edit grants** (owner→school→teacher).
- **Invite codes (per school):** create (optional expiry/max‑uses/role, auto‑suggested `PREFIX‑XXXX`),
  copy, revoke; active/revoked tabs; consumed atomically at teacher signup.
- **Sharing tab:** approve/deny external‑share and edit requests; view + revoke every share in the school.
- **Schools (owner):** create school (name + contact email), list, "manage teachers →" switch.
- **Audit log:** last 200 (actor, target, action, detail, timestamp); owner reads all, admin reads own
  school. Every destructive/grant action is audited.

### 9.26 Parent surface [PLANNED — none built]
No parent account/role/portal exists. The only intended parent surface is the **parent copy of the
per‑student report** (§9.23) — a teacher‑generated, plain‑language PDF/CSV with teacher‑only data
suppressed. Distribution is manual today; a parent portal is a future phase.

---

## 10. Content model

### 10.1 The universal topic model (drives every lesson, built‑in and authored)
A topic is a set of optional blocks (each opt‑out‑able), stored as normalised JSON (`sections`). This is the
authoring contract a teacher fills (by hand or AI), and the exact shape the lesson renderer consumes:

- **reading** — notes HTML + optional single MCQ "read‑check".
- **learn** — key‑learning items, each `{title, html, optional check MCQ}`.
- **terms** — `{term, definition}` pairs → drive **both** flashcards and the matching game (matching
  distractors sampled from other pairs).
- **mcq** — `{question, options[], answer index, explain}`.
- **fib** — cloze sentences with answers in `[brackets]`, 1–3 per sentence; the player builds each blank's
  word bank from other answers. (Two blank conventions exist in legacy content — named `___B1___` and
  positional `_____` — parse via the shared helpers, never by counting raw underscores.)
- **tf** — `{statement, answer(bool), explain}`.
- **misc** (misconceptions) — `{myth, truth, optional check}`; a check‑less misconception auto‑becomes a
  True/False so it stays gradable.
- **tips** — `{title, html, optional check}`.
- **exam** — `{question, marks, hint, sentence starter, markScheme(HTML), modelAnswer, year, format}`;
  written exam questions are manually marked (excluded from the auto‑graded bank).

**Authoring rules the content must obey (recurring quality contract):**
- The **correct MCQ answer must not be the longest / most‑detailed option** (students guess by length);
  ≥1 distractor must be equally long or longer *and* plausible; distractors are real errors; vary the
  correct position. Listening prompts are audio‑only (no transcript leak).
- **Self‑mark points must match the tariff** (compound schemes grouped) or students under/over‑award.
- **Model answers stay tight** (8‑marker ≈ 120–160 words; 4‑marker ≈ 50–70) — never an essay.
- "Copyright‑free" subjects reword/reorder even enumerated spec lists (verify with an n‑gram overlap check),
  and carry a non‑affiliation disclaimer.

### 10.2 The question bank (generated) [BUILT]
Each subject compiles to `QUESTION_BANK` rows: `{id, pageId, pageName, source, type(mcq/written/tf/fib),
marks, num, question, caseStudy, hint, starter, options[], key{answer, markScheme, modelAnswer}}`. Business
alone ≈ 3,045 questions. The bank powers the topic page, Daily Revise, tasks, worksheets, and reviews. For
server‑graded flows the answer key is split out and never sent to the client until after submission.

### 10.3 Progress model (per‑section keys)
Per topic, progress is tracked per section — `learn, mcq, match, fib, misc, tips, tf, exam` (+ flashcards),
as done/total, keyed on a **subject‑prefixed page id** (e.g. `business:1-1-role-of-business-enterprise`).

---

## 11. Data model / entities

The backend is Postgres (Supabase) with ~70 tables under Row‑Level Security. The new front‑end binds to
these entities and their guarded RPCs — restyle the UI, keep the contracts. Grouped by domain:

- **Identity & tenancy:** `profiles` (id, role, username, account_type, email, is_owner, school_id),
  `schools`, `school_members` (role + lifecycle: status, suspended_mode, frozen_class_ids, removed_at),
  `school_invite_codes`, `teacher_invite_codes` (legacy), `platform_settings`, `admin_audit_log`.
- **Subjects & content:** `subjects` (slug, name, key_stage, level, exam_board, spec_code, exam_date,
  colour, icon, created_by[null=platform]), `custom_topics` (teacher‑authored `sections` jsonb),
  `platform_topic_master`, `bank_questions` (server‑side questions + split answer key, subject_slug,
  school_id for overrides).
- **Subjects‑V2 sharing/fork:** `subject_shares`, `subject_edit_requests`, `subject_external_share_requests`,
  `external_share_invite_tokens`, `subject_overrides`, `subject_school_edit_grants`,
  `teacher_subject_edit_access`, `school_subjects`, `teacher_subject_access`, `entitlements`.
- **Classes & membership:** `classes` (subject_id), `class_students`, `class_teachers`,
  `class_teacher_invites`, `class_join_codes`, `join_code_attempts`, `class_link_groups`,
  `class_link_group_members`, `student_account`.
- **Learning progress:** `progress_events` (per‑answer log), `progress_summary` (per‑section done/total),
  `flight_path_snapshots` (progress‑over‑time), `question_mastery`, `mastery_events`,
  `daily_revise_stats`.
- **Spaced repetition:** `topic_reviews` (page_id, stage 1/2/3, due_date, completed_at, teacher_checked).
- **Tasks:** `tasks`, `task_questions` (snapshot + key), `task_assignments` (+ overrides),
  `task_attempts`, `task_answers`, `task_answer_suggestions` (AI), `task_notification_reads`.
- **Gamification & economy:** `shop_items`, `student_purchases`, `perk_purchases`, `student_perks`,
  `streak_shields`, `wallet_ledger`, `student_avatar`, `leaderboard_achievements`,
  `leaderboard_settings`, `leaderboard_exclusions`.
- **Controls & governance:** `class_topic_visibility`, `class_topic_filter_active`,
  `student_topic_grants`, `topic_access_requests`, `class_gamification` (flow settings),
  `daily_revise_class_settings`, `integrity_events`, `question_reports`, `teacher_todos`,
  `teacher_notif_state`, `user_notif_prefs`, `cs_lab_saves`, `reports` (planned).

**Key relationships to model in the ER diagram:** a `class` binds to exactly one `subject`; a `student`
belongs to a `class` (one per subject); a `teacher` teaches many classes (creator or co‑teacher); a
`school` scopes teachers, codes, subject grants, and overrides; progress/mastery/reviews key on
`(student, subject‑prefixed page_id, section/question)`.

---

## 12. Gamification economy & engagement loop (spec, not decoration)

Document and design gamification as a **system** with explicit earning rules, sinks, caps, and states.

- **Signals → rewards:** verified correct answer → +10 XP (+ combo, + coins within a daily cap); section
  complete → +50 XP; topic complete → +200 XP + confetti; daily‑revise mastery (3‑in‑a‑row) → mastery
  counters + XP; passing a scheduled review → review counters + badges; leaderboard best‑ever → badges.
- **Currencies:** **XP** (pure function of progress → levels; not spendable) and **coins** (spendable in
  the Locker; monotonic, daily‑capped, anti‑abuse). Keep them distinct in the UI.
- **Sinks:** characters, cosmetics (skins/backgrounds/frames/pets/wearables), perks (Streak Freeze,
  Mystery Box). No pay‑to‑win — perks never affect marks/mastery.
- **The engagement loop to make legible:** *trigger* (bell: reviews due + daily goal) → *action* (daily
  revise + due reviews) → *variable reward* (XP/coins/combo/badge/celebration) → *investment* (streak,
  collection, level) → back to trigger the next day. The redesign's job is to make this loop the spine of
  the student home, not a scattered set of pages.
- **Fairness & child‑safety:** every point is a real server‑verified answer (nothing forgeable);
  "Attempts" counts distinct questions so grinding can't inflate rank; leaderboards among minors are
  teacher‑controlled (anonymise, exclude, limit); students see only their own class's names.
- **States to design for each mechanic:** locked vs unlocked badge, empty leaderboard, level‑up,
  streak‑safe vs streak‑at‑risk vs streak‑frozen, daily‑goal incomplete/complete, coin‑earn capped,
  reward‑claimed, mystery‑box reveal, new‑vs‑seen badge.

---

## 13. Spaced‑repetition engine (spec)

Two complementary layers — design both clearly:

1. **Per‑question "Rule of 3" (Daily Revise):** a question is *mastered* after **3 correct in a row**; a
   wrong answer **resets** it so it resurfaces. First‑ever mastery is gated against farming. Feeds
   mastery counters, XP, streak.
2. **Per‑topic "1‑7‑28" (Review Calendar):** when a student first genuinely works a topic (anchored to the
   earliest real answer, excluding daily‑drill events), three reviews schedule at **+1 / +7 / +28 days**. A
   stage is completed by passing a **5‑question quiz at ≥60%**; failing restarts it. Scheduling is
   server‑side, cross‑device, lazily seeded, and retroactive. Teachers can view overdue counts and
   teacher‑confirm a review (separate from the student's earned completion).

**States:** upcoming / due / overdue / completed; "no gradable questions" (can't complete); the permanent
onboarding demo review.

---

## 14. States, edge cases & error handling

Design every screen for all applicable states (default, loading, empty, partial, success, error, offline,
permission‑denied). Notable domain edge cases the current product handles and the redesign must not lose:

- **Empty states everywhere:** no subjects yet (→ join a class), no classes yet (→ create one), no authored
  subjects (→ create your first — the *service* onboarding), empty leaderboard, no reviews due, no tasks,
  no badges yet, no analytics data (< minimum activity → "getting started", suppress verdicts).
- **Offline / sync:** local‑first writes with a retry queue; show queued/synced/failed; labs run offline.
- **Reset & tombstones:** resetting a page/section must not be resurrected by cross‑device hydration
  (reset "tombstones" exist) — design a clear reset + undo affordance.
- **Locked / gated:** topic locked (sequential mode), activity locked (focus mode order), task locked
  (missed deadline), review can't complete (no questions), subject not published (hidden from students).
- **Timers & cooldowns:** reading pause before answering, pause before "Next", task time limit, task
  timer running vs paused on leave.
- **Integrity:** paste blocked (gentle warning), throttled join‑code failures, rate‑limited question
  reports.
- **Auth latency:** the profile row can lag the session (poll/retry) — design a graceful "setting up your
  account" state rather than a flash of the wrong role.
- **Degraded features:** several PLANNED backing tables may be absent; the UI degrades silently today —
  the redesign should decide whether to hide or show "coming soon" for not‑yet‑live modules.
- **Answer feedback:** correct/incorrect reveal + explanation + disabled inputs; self‑mark locks the
  answer; mastery bar animates forward or snaps back on wrong.

---

## 15. Non‑functional requirements

- **Security is server‑authoritative (the trust core):** real answers live server‑side with the correct
  answer split out; server‑graded quizzes fetch questions **without** the key and grade atomically, so XP,
  mastery, streaks, and rank **cannot be forged or read from page source**. Options are shuffled per
  question; typed modes remove elimination‑guessing. Roles resolve from the session only. (One known legacy
  hole — client‑side grading on older static topic pages — is being closed by the server‑grading pattern;
  the redesign should assume server grading everywhere.)
- **Multi‑tenant isolation:** airtight cross‑school isolation enforced by Row‑Level Security; no school ever
  sees another's students/content; every destructive/grant mutation is audited.
- **Performance:** local‑first UX; lazy‑loaded labs/modules; server round‑trips minimised and cached (e.g.
  leaderboard/schedule caches). The current engine is a 273 KB monolith — the redesign is an opportunity to
  modularise, but must keep perceived latency low on school networks and phones.
- **Content protection:** casual‑copy deterrents on student pages (honest scope — no DevTools blocking, no
  accessibility harm); subject content + images kept off search engines (robots).
- **Reliability:** offline queueing + retry; graceful degradation when optional tables are absent; strict
  SQL migration ordering.

## 16. Accessibility & inclusive design

- Target **WCAG AA** (confirm level): sufficient contrast in every theme (including the dark modes),
  full keyboard operability (the tab bar and activities are keyboard‑navigable today), screen‑reader
  support (answer boxes and content must stay readable — content protection must not harm a11y),
  visible focus, and respect for **reduce‑motion**.
- **SEN accommodations are first‑class:** per‑student extra time on tasks, sentence starters, larger
  spacing, word banks, matching‑as‑table on worksheets — the redesign must keep these easy for teachers to
  apply and comfortable for students to use.
- **Readable typography & touch targets** for minors on phones; audio support (TTS) for language learners.

## 17. Edtech & safeguarding requirements

Because the primary users are minors used in schools, treat these as product requirements, not legal
boilerplate:

- **Age‑appropriate design & child privacy by default:** data minimisation, privacy‑favouring defaults,
  plain‑language notices; the platform already ships privacy/cookie/accessibility/children's‑code pages and
  a DPIA — keep and surface them. Consider COPPA (under‑13s), the Age‑Appropriate Design Code, and
  FERPA/GDPR for education records.
- **No user‑generated media that could expose a child:** avatars are pre‑made recolourable SVGs (no photo
  uploads) — a deliberate safeguarding choice; keep it.
- **Safeguarding in features that connect people:** leaderboards among minors are teacher‑controlled
  (anonymise/exclude/limit) and students only ever see their own class's names; no student‑to‑student
  messaging exists — do not add unsafeguarded social surfaces.
- **Vet third‑party SDKs/analytics** for child‑directed use; keep AI marking human‑in‑the‑loop and free of
  student identifiers in prompts.
- **Learning‑objective alignment:** every mechanic (including games/labs) maps to curriculum/exam
  objectives — keep the gamification tied to real learning, not time‑on‑app.

## 18. Tone, voice & brand inputs needed

The redesign needs brand direction up front (missing brand guidance is the #1 cause of redesign rework).
Current positioning to build from: **built by teachers, used in our own classrooms; effective, fair, and
honest; playful for students without being childish; professional and calm for teachers/leaders.** Provide
(or the design should define): logo/mark, colour system (must support light + ≥2 dark themes and remain
theme‑switchable), type scale, iconography (the product leans on expressive emoji‑style activity icons),
illustration/avatar style, motion principles, and **three voices** — student (encouraging, celebratory),
teacher (efficient, respectful), admin/parent (clear, trustworthy). Microcopy rules matter: next‑steps are
never "weaknesses"; feedback is specific and kind.

## 19. Constraints, assumptions, dependencies & build status

- **Preserve the data contracts (§10–§13);** the redesign is a surface + IA rebuild, not a backend rewrite.
- **Subject is a user‑creatable object** — design the IA so authoring a subject is a first‑class flow.
- **Mobile is co‑primary** — no desktop‑only surfaces.
- **Build status to respect** (don't imply the not‑yet‑live is live):
  - **BUILT & live:** auth (email + Google; Microsoft hidden), student engine & 9‑activity lessons,
    Daily Revise, 1‑7‑28 reviews, gamification/badges/coins/locker/avatars, leaderboard, vocab, labs
    (CS/Eco/Maths), student notifications, classes/join‑codes/co‑teachers, custom subject authoring,
    tasks (+ AI marking suggestions), worksheets, analytics, Daily‑Revise/topic‑access controls,
    question reports, teacher calendar, notification centre/to‑do, school admin (teacher lifecycle,
    two‑tier subjects, codes, sharing approvals, schools, audit).
  - **BUILT in code, live‑switch‑on uncertain:** parts of Subjects‑V2 sharing/fork (some tables flagged
    not yet run on live; UI degrades silently).
  - **PLANNED / partial:** Report Writer (engine + SQL exist; no UI/nav), parent‑facing anything,
    server‑grading on legacy static topic pages, native push/offline, unified profile + cosmetics store,
    Microsoft OAuth.
- **Assumptions to confirm with the owner:** exact mobile strategy (PWA vs native), WCAG target level,
  which PLANNED modules to design now vs later, and the target device/browser matrix.

## 20. Glossary

- **Topic / lesson** — the core unit; one page of 9–10 activities.
- **Activity / section** — one of the nine interaction types (learn, mcq, match, fib, misc, tips, tf,
  flashcards, exam) + the optional lab.
- **Daily Revise** — the daily mastery drill ("Rule of 3": 3 correct in a row = mastered).
- **Review / 1‑7‑28** — the spaced‑repetition calendar; a topic returns at +1/+7/+28 days via a 5‑Q quiz.
- **Mastery** — a per‑question durable state reached by the Rule of 3.
- **Bank / question bank** — the compiled question set (with server‑split answer keys) powering everything.
- **Custom / teacher subject** — a subject a teacher authored (`created_by` set); behaves like a platform
  subject.
- **Override / fork** — a school's editable copy of a platform subject's topics; untouched topics track the
  master.
- **Class / join code** — a subject‑bound group of students; an 8‑char code students redeem to enrol.
- **XP vs coins** — XP (progress → levels, not spendable) vs coins (spendable in the Locker).
- **Perk** — a consumable (Streak Freeze, Mystery Box) that never affects marks.
- **Focus mode** — teacher pacing controls (one‑at‑a‑time, cooldowns, locked order).
- **Owner / school_admin / teacher / co‑teacher / student** — the role hierarchy (§5).
- **RLS / RPC** — Row‑Level Security (multi‑tenant isolation) / server‑side functions that do trusted
  reads/writes and grading.

---

*End of brief. Every capability above is grounded in the live codebase and the platform's own specs. Status
flags are inline so the redesign never over‑promises. The redesign's mandate: keep 100% of this function,
re‑express it as one coherent, mobile‑first, accessible, safeguarding‑first product for students, teachers,
schools and parents — and design it so "create your own subject" feels as native as "revise Business."*
