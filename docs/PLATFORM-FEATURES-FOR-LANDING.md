# Vidya — Complete Feature Reference (for the landing page)

> **Purpose of this document.** A single, plain-language catalogue of *everything* the
> platform does, ordered from the smallest details to the biggest systems, with a short
> "how it works" for each feature and a ready-to-use marketing line. Written to be handed
> to a copywriter/designer building a professional landing page — every claim here is
> grounded in the live codebase.
>
> **What Vidya is, in one sentence:** a multi-subject GCSE & post-16 revision platform
> (Business, Economics, Computer Science, Additional Maths and Spanish) that pairs original,
> exam-aligned lessons with subject-specific interactive tools — real in-browser Python,
> logic circuits, typeset maths, Spanish audio — on top of a gamified, spaced-repetition
> learning engine with server-verified scoring, personalisable themes, and full
> teacher/school management.
>
> **Stack:** Supabase (Postgres + Row-Level Security + server-side grading functions) and
> Netlify (edge + serverless functions). One shared student engine powers every subject.

---

## The elevator pitch (three lengths)

- **Tagline:** *Revision that comes back until it sticks.*
- **One line:** Interactive, exam-aligned lessons with daily retrieval practice and a
  spaced-repetition calendar that reschedules every topic after 1 day, 1 week and 4 weeks —
  with teacher tasks, AI-assisted marking and live analytics on top.
- **Paragraph:** Vidya turns each GCSE topic into a full interactive lesson — read, quiz,
  match, drill, and sit real exam questions you mark like an examiner. Everything you
  practise is automatically scheduled to return right before you'd forget it, points and
  badges reward real progress (never idle clicks), and teachers get join-code classes,
  one-click tasks, AI-suggested marking and analytics that show the gap before the mock does.

**Headline numbers (verifiable from the catalogue):** 5 subjects · 70+ interactive topic
lessons and growing · 9 activity types per topic · a 1·7·28-day review cycle · 15+ hands-on
Computer Science lab tools · server-verified scoring.

---

# PART 1 — The small touches (the polish users feel before they can name it)

These are quiet, whole-site quality features. Individually small; together they make the
platform feel like a product, not a worksheet.

### 1.1 Searchable dropdowns everywhere
**How it works:** every standard dropdown is silently upgraded into a type-to-filter combo
box — start typing to filter long lists of classes, topics or schools — while the native
control stays the source of truth, so nothing breaks.
**Line:** *Every dropdown is instantly searchable — just start typing.*

### 1.2 Personalisable themes & backgrounds
**How it works:** a floating 🎨 switcher on **every** page offers **7 colour themes**
(including two true dark modes — Midnight Aurora and Obsidian Night) and **20+ background
patterns** (dot grid, graph paper, aurora glow, sparkles, confetti, night stars…). Your
choice is remembered on every device and updates live across open tabs.
**Line:** *Make it yours — seven themes, dark modes and 20+ backgrounds, remembered everywhere.*

### 1.3 Motion that respects you
**How it works:** content gracefully reveals as you scroll, cards lift on hover, and the
landing page's statistics count up from the *real* catalogue numbers. Everything honours
"reduce motion" — turn it on and content simply appears.
**Line:** *Polished, modern motion throughout — and it steps aside if you prefer calm.*

### 1.4 Notification bell
**How it works:** a 🔔 bell on every student page surfaces upcoming and overdue tasks and due
reviews, derived live. One shared engine feeds both the bell and the full notifications page,
so nothing is ever silently dropped.
**Line:** *A built-in bell keeps students on top of every task and deadline.*

### 1.5 Guided onboarding tour
**How it works:** first-time students get a friendly walkthrough spanning the home page,
dashboard and a real topic page — it survives navigation and runs once per browser.
**Line:** *New here? A quick guided tour shows you the ropes.*

### 1.6 Works on every device
**How it works:** every page is responsive, including the calendar and daily practice; the
9-tab lesson bar intelligently shrinks its labels (full → short → icon) so it never wraps or
scrolls sideways on a phone.
**Line:** *Revise on your phone on the bus, or your laptop for long answers.*

---

# PART 2 — The building blocks: activity types & question mechanics

Every lesson is assembled from these interaction types. Each is small on its own; the topic
page (Part 3) stitches nine of them into one journey.

### 2.1 Quick Check (active reading gate)
**How it works:** reading cards ("Key Learning") can't be marked read by scrolling past —
each card ends in a one-question **Quick Check** MCQ. Answer it to tick the card. Reading is
active, not passive.
**Line:** *You can't just scroll — a one-question check turns reading into learning.*

### 2.2 Multiple-choice quiz (MCQ)
**How it works:** instant right/wrong feedback with an explanation. Options are
**deterministically shuffled per question** so the answer isn't always in the same place, and
— on server-graded subjects — the correct answer isn't even in the page until you submit.
**Authoring rule enforced across the platform:** the correct answer is never the longest/most
detailed option, and at least one distractor is equally long and plausible, so students can't
guess by shape.
**Line:** *Real questions, real distractors — no guessing by elimination.*

### 2.3 True / False
**How it works:** true/false statements with instant feedback; also server-graded where
enabled.

### 2.4 Matching game
**How it works:** a term-to-definition game played over two rounds — tap a term, then its
match. Solved pairs persist across sessions so you resume where you left off.
**Line:** *Match terms to meanings — and pick up exactly where you left off.*

### 2.5 Fill the Blanks (two difficulty modes)
**How it works:** cloze sentences you can attempt in **Standard** mode (choose from a
per-blank dropdown) or **Advanced/Typing** mode (free text, no options — no guessing by
elimination). Server grades by blank key, so wrong answers are caught precisely.
**Line:** *Fill the gaps — from the list, or type it from memory when you're ready.*

### 2.6 Misconceptions ("Myths")
**How it works:** cards that surface the exact wrong ideas examiners see every year and
correct them head-on.
**Line:** *Learn the mistakes examiners punish — before you make them.*

### 2.7 Exam Tips
**How it works:** targeted, topic-specific advice on how to phrase answers and pick up marks.

### 2.8 Flashcards (self-rated)
**How it works:** a flip-card deck you sort into "confident" (green) vs "still learning"
(amber/red), then re-drill only the weak ones.
**Line:** *Flashcards that learn what you don't know yet.*

### 2.9 Progress rings & celebrations
**How it works:** every activity shows a completion ring; finishing one fires a celebration
with a one-click jump to the next — small dopamine, real momentum.

---

# PART 3 — The topic page: a full interactive lesson

**The core unit of the whole platform.** Every topic is a complete lesson presented as a
single tab bar of **nine activities** (the bar never wraps — labels shrink from
"Key Learning" → "Learn" → icon as the screen narrows):

**Key Learning → MCQ → Matching → Fill the Blanks → Misconceptions → Exam Tips → Flashcards
→ True/False → Exam Practice.**

A **10th "🧪 Practice Lab" tab** appears on Computer Science and Additional Maths pages
(Part 6).

**How it works:** a student moves left to right through read → recall → apply → exam. Each tab
tracks its own progress; completing a section celebrates and offers the next. Content is
authored once per topic; the same engine renders all 70+ topics identically.

**Line:** *Every topic is a full lesson — read it, quiz it, apply it, and sit real exam
questions, all in one place.*

### 3.1 Teacher-configurable pacing (Focus Mode & guided flow)
**How it works:** a teacher can switch a class into **Focus Mode** (one question/card at a
time with Back/Next), add **read/answer cooldown timers** (a delay that forces reading before
answering, and a pause before "Next"), and **lock the activity order** so students must work
through tabs in sequence. Settings sync from the server per class — no student refresh needed.
**Line:** *Teachers can slow it down and lock the order — one question at a time, read before
you answer.*

---

# PART 4 — Exam practice & the self-marking model (the platform's signature)

This is the feature the platform is proudest of, and the one to feature prominently.

### 4.1 Authentic exam questions with scaffolding
**How it works:** the Exam Practice tab presents real past-paper-style questions with their
**mark tariff** and original exam-series year. Each offers a **💡 Hint** and a **✍️ Sentence
Starter** for support, then a **"Submit & See Mark Scheme"** button.

### 4.2 Tick-the-mark-scheme self-marking
**How it works:** after submitting a written answer, the student marks it **like an examiner**.
Every creditable mark-scheme point appears as a tick-box; they tick what their answer actually
earned; the ticks total the score. Compound schemes are grouped correctly (e.g. "1 for naming
each register, 1 for its purpose") so a perfect answer ticks to full marks and a half answer
lands on half. The written answer is **locked** once submitted so the self-mark stays honest,
and a question only counts as attempted once it's been self-marked.
**Line:** *Don't just answer — mark yourself like an examiner, against the real scheme.*

### 4.3 Levelled / banded answers
**How it works:** 6- and 8-mark essay questions use a banded widget — the student picks the
level band and a mark within it from the examiner descriptors, learning how top-band answers
differ from the middle.

### 4.4 Paste-guard (integrity)
**How it works:** written exam-answer boxes block paste and text drag-drop, so a Googled or
AI-generated answer can't be dropped in. The student sees a gentle warning; every blocked
attempt is logged server-side and surfaced to the teacher as an "Integrity alert."
**Line:** *Answers are typed, not pasted — so practice stays honest.*

### 4.5 Case-study grouping
**How it works:** questions that share one exam extract reference it once, so the case study
is shown once per run of questions (not repeated under every question), and editing it updates
them all.

### 4.6 AI marking assist (teacher-side, benefiting students)
**How it works:** for written answers, AI can pre-mark into the **teacher's** queue as
*suggestions only*, with feedback. The teacher reviews, edits and releases — students never
see an AI mark before a teacher approves it. Fast feedback for students, final say for
teachers.
**Line:** *Set it Monday, marked by Tuesday — AI drafts the mark, the teacher approves it.*

---

# PART 5 — The learning engine: memory, mastery & motivation

Everything above feeds three systems that make revision stick and keep students coming back.

### 5.1 Daily Revise — the "Rule of 3"
**How it works:** a fresh personalised queue of questions each day, drawn from every topic
studied. Each question carries a **4-segment mastery bar** (red → orange → yellow → green):
answer it correctly **three times in a row** to master it — get it wrong and it starts over.
Students can filter to "incorrect only" or "exclude mastered." Correct answers earn real,
permanent XP; the day-streak is genuine.
**Line:** *Ten minutes a day — get it right three times in a row and it's mastered.*

### 5.2 Review Calendar — spaced repetition (1 day · 1 week · 4 weeks)
**How it works:** the first time a student works a topic, the **server** schedules three
reviews at **+1 day, +1 week, +4 weeks** — the intervals memory research keeps landing on.
They appear on a month calendar (due / overdue / done). Ticking a review off means passing a
short **5-question, server-graded quiz** (≥60% to pass); fail and the cycle restarts.
Scheduling is fully server-side and cross-device — start on your phone, review on the school
PC — and was seeded retroactively for older topics.
**Line:** *1 day. 1 week. 4 weeks. Automatically — the schedule that beats forgetting.*

### 5.3 Gamification — XP, levels, streaks, badges
**How it works:** 10 XP per verified correct answer feeds levels and combos; a persistent HUD
shows level, XP, streak and badges; topic completion fires confetti. Badges span Progress,
Categories, Streaks, Daily Revise, Review Calendar and Leaderboard groups, shown locked/
unlocked on a dedicated Badges page. **Crucially, every point maps to a real, server-verified
answer — nothing is forgeable, so scores mean something.**
**Line:** *Streaks, XP and badges that mean something — every point is a real, verified answer.*

### 5.4 Assigned tasks (student side)
**How it works:** students receive teacher-set tasks, answer them with the same written-answer
+ paste-guard model, and feed the teacher's marking queue — with due dates on their calendar
and bell.

---

# PART 6 — Subjects & their specialist tools

One engine, five subjects. Three of them layer on capabilities no generic quiz app has.

### 6.1 GCSE Business — OCR J204  *(the founding subject)*
7 sections across Components 1 & 2 plus a synoptic finale — ~37 lessons from enterprise and
the marketing mix to break-even and the wider business environment. Includes interactive
**organisational-chart builders** and a compare tool.
**Line:** *Complete OCR GCSE Business — enterprise to break-even, with real exam practice
throughout.*

### 6.2 GCSE Economics — OCR J205
4 units, ~22 lessons — the basic economic problem, demand & supply, elasticity, fiscal &
monetary policy, exchange rates and globalisation.
**Line:** *Full OCR GCSE Economics — from the basic economic problem to the global economy.*

### 6.3 GCSE Computer Science — OCR J277  *(the most tool-rich subject)*
11 topic groups across Papers 1 & 2, ~29 lessons — **plus the "🧪 Practice Lab"**, a suite of
**15+ hands-on tools** that turn theory into practice:
- **Python Lab** — writes and runs **real CPython in the browser** (Pyodide), including **live
  interactive `input()`** you type into mid-run, a runaway-loop kill switch, and a PRIMM
  teaching flow (Predict → Run → Investigate → Modify → Make).
- **SQL Lab** — run real `SELECT` queries against a seeded in-browser database (J277 scope).
- **Logic Gate Lab** — build AND/OR/NOT circuits and auto-generate truth tables.
- **Data Drills** — timed binary/hex/units, file-size, ASCII, image & sound calculations.
- **Trace Tables, Parsons problems, Predict-the-Output, Bug Hunt, Sort & Search Visualiser,
  Network Builder (star vs mesh), Flowchart Symbols, Test-Data Sorter, Media Lab,
  Micro-sims** (fetch-decode-execute, storage chooser, threat/defence).
- **Examiner Trainer & Command Words** — mark a fictional answer against a real scheme, then
  compare to a "senior examiner" verdict.
- **Mock Papers** — six full past papers (2022–2024, Papers 1 & 2) with a timed exam runner,
  a marking view, a results breakdown and a print view.
**Line:** *OCR GCSE Computer Science with a hands-on lab — write real Python, build circuits
and networks, and sit full mock exams in the browser.*

### 6.4 Additional Mathematics — OCR Level 3 FSMQ 6993
11 groups, ~37 lessons (Algebra Toolkit, Polynomials, Coordinate Geometry, Linear
Programming, Trigonometry, Calculus, Kinematics…). Two new capabilities: **self-hosted KaTeX**
renders all notation beautifully from raw LaTeX (loaded only on maths pages), and
**tolerance-aware numeric marking** grades values and expressions (not just letters). Its
**Maths Practice Lab** ships endless typed-answer drills (expand, factorise, complete the
square, surds, index laws).
**Line:** *OCR Additional Maths (FSMQ 6993) — beautifully typeset, tolerance-aware marking,
and endless typed drills.*

### 6.5 GCSE Spanish — AQA 8692  *(newest; the first non-OCR, first MFL subject)*
Foundation + Higher tiers across four papers (Listening incl. dictation, Speaking, Reading
incl. translation, Writing incl. translation). Two new capabilities: **built-in text-to-speech**
(🔊 on any phrase, adjustable **0.5–1.25× speed** and voice, plus **listen-and-type dictation**
that hides the text), and an **accent-tolerant fuzzy grader** that marks translations and
gap-fills the way AQA does — no API cost, no answer-security compromise.
**Line:** *AQA GCSE Spanish with spoken audio, dictation and smart accent-tolerant marking.*

### 6.6 Multi-subject architecture
**How it works:** one account holds every subject a student studies. Each class belongs to one
subject, so joining a class = enrolling in that subject; students only see the subjects
they're in. New subjects are added via a manifest + scaffolder — content pages are never
hand-wired — so the catalogue grows cleanly.
**Line:** *One account, every subject you study — organised side by side.*

---

# PART 7 — For teachers: run it like a classroom

The teacher side is a full LMS, not an afterthought. (Core tools are live; a few advanced
sharing/notification refinements are built and awaiting their final database switch-on.)

### 7.1 Classes, join codes & co-teachers
**How it works:** create a named class tied to a subject; students self-enrol with a
shareable **join code** (regenerable, with expiry/use caps) or are added by email. A class can
have **many co-teachers** with full teaching parity — only the creator can do destructive
things. A roster screen shows all teachers, students and pending invites; classes can be
archived.
**Line:** *One code to join, many teachers to teach — set up a class in seconds.*

### 7.2 Student login provisioning
**How it works:** for schools that don't want self-registration, a teacher mints ready-made
usernames + passwords in bulk (shown once to hand out), and can reset passwords or delete
accounts anytime.
**Line:** *Generate class logins in bulk — whatever fits your safeguarding setup.*

### 7.3 Task Manager (assign · mark · analyse)
**How it works:** a guided 3-step builder (settings → questions → students). The question
picker pulls from the same bank as the site, organised group → topic → activity. One task can
target several classes and individual students, each with its own due date. MCQ/true-false/
fill-blank auto-mark; written answers go to a **marking queue** with per-task "to mark" counts
and class averages; **AI suggests marks** for the teacher to approve. Each class shows its
**weakest topics** worst-first, and students can spin up a **retry-wrong** task of just the
questions they missed.
**Line:** *Build a task from thousands of questions in seconds — auto-marked where it can be,
AI-drafted where it can't.*

### 7.4 Worksheet Builder (printable / PDF / Word)
**How it works:** the same picker, but it outputs a **printable A4 sheet, PDF or editable Word
copy** with title, instructions, font scaling, word banks and answer lines — and the **answer
key on a fresh final page** so you print "all but the last page" for the class.
**Line:** *Printable worksheets with word banks and answer keys, from the same question bank.*

### 7.5 Teacher Calendar
**How it works:** every task with a due date across all your classes on one calendar,
colour-coded per class; click to open, or "+" a day to start a task pre-dated to it.

### 7.6 Leaderboards
**How it works:** three scopes — a single class, a whole subject, or a class-vs-class "groups"
board (define your own named comparison groups). **Four metrics** (Accuracy, Attempts as
distinct questions so grinding can't inflate it, Mastery, Streak, plus a blended Overall) over
**four windows** (24h/7d/30d/all-time) with movement arrows. Teachers control visibility, row
counts, names on/off, and can exclude individual students; students only ever see names from
their own class. Durable rank badges are computed server-side so they can't be spoofed.
**Line:** *Class, subject and class-vs-class leaderboards — fair by design, safe for minors.*

### 7.7 Progress dashboards & analytics
**How it works:** whole-class completion grids per unit/topic/activity, drill-down to any one
student, and **Daily Revise analytics** showing usage, mastery and **which exact questions the
class gets wrong most**, with a class×topic matrix and **CSV export** for department meetings.
**Line:** *See the gap before the mock does — down to the exact question the class is failing.*

### 7.8 Topic access & learning-flow controls
**How it works:** per class, set topics to **open / manual / sequential** (a topic unlocks
only when the previous one is complete); force **activity order** and **Focus Mode**; and clear
a queue of **student topic-access requests**.
**Line:** *Gate topics, pace the flow, unlock as they're ready.*

### 7.9 Question reports & integrity monitoring
**How it works:** students flag a wrong/confusing question into a per-teacher queue to mark
handled after fixing; paste attempts in exam boxes are logged and shown as integrity alerts
(monitoring, not lockdown — proportionate for formative revision).

### 7.10 Notification Centre & to-do
**How it works:** one 🔔 + to-do page aggregating everything a teacher must act on —
submissions to mark, topic-access requests, co-teacher invites, subject edit/share requests,
question reports and integrity alerts — plus personal to-dos with priority, links and a
**snooze** ("remind me in X hours/days/weeks"). Each type is Normal / Quiet / Off with its own
chime and a live tab badge.

---

# PART 8 — For schools: multi-tenant administration

### 8.1 Teacher-authored subjects
**How it works:** teachers build entirely new subjects (PE, History…) that behave exactly like
the built-in ones — classes bind to them, students join by code, and every topic uses the same
9-activity structure. A 4-step wizard with a theme-safe rich editor, per-activity opt-outs, and
**JSON template import** (fill by hand or with a supplied AI prompt, re-upload with friendly
validation). Authored content automatically flows into Daily Revise, Tasks, Worksheets,
mastery and analytics — no separate setup.
**Line:** *Build your own subject in an afternoon — with the full learning engine behind it.*

### 8.2 The "Subjects" workspace — sharing & school forks *(built; final switch-on pending)*
**How it works:** a tabbed workspace (My subjects / Platform / Shared with me / All), each card
badged so you know why you can see it. Teachers **share their own subjects** with a colleague
or the whole school (view or edit); **request edit access** on view-only ones; and **share
externally by request** (routed to a school admin, who can invite brand-new people). Schools
granted the right can **fork their own copy of a platform subject** topic-by-topic — untouched
topics keep tracking the master, and only that school's students see the customised version.
**Line:** *Share, co-author and adapt subjects across your department — safely.*

### 8.3 School Admin console
**How it works:** two roles — the platform **owner** (every school) and each school's
**school_admin** (their own school). A tabbed console manages teachers with **suspend /
reinstate / reset password / remove (reversible) / delete forever**, shows each teacher's role,
last sign-in and class/student counts, and can **promote/demote** admins. A **two-tier subject
access** model lets the owner set which subjects each *school* may use, and each admin then
grants teachers from that set. Every destructive action is **audited** (actor, target, time,
detail).
**Line:** *Full school control — manage teachers, grant subjects, and audit every action.*

### 8.4 Multi-school model & per-school signup
**How it works:** one deployment runs many schools, each its own data-isolation boundary. Each
school mints its **own signup codes** (role-scoped, with expiry/use caps, revocable); teachers
self-sign-up via Google / Microsoft / email against a code.
**Line:** *One platform, many schools — each with its own codes and its own walled data.*

---

# PART 9 — The foundation: security, integrity & scale

The "invisible" system that makes every score trustworthy — worth a confidence-building
section on the page.

### 9.1 Server-verified scoring (anti-cheat core)
**How it works:** real answers live in a server table with the correct answer split out.
Quizzes are fetched **without** the answer and graded by server functions that record progress
atomically — so XP, mastery, streaks and leaderboard rank **cannot be forged** or read from
page source. Options are shuffled per question; typed modes remove elimination-guessing.
**Line:** *Every score is verified on the server — nothing here can be faked.*

### 9.2 Multi-tenant isolation
**How it works:** airtight cross-school data isolation enforced in the database
(Row-Level Security), so no school can ever see another's students or content.

### 9.3 Content protection
**How it works:** casual-copy deterrents on student pages (honest scope — no DevTools blocking,
no accessibility harm; answer boxes and screen readers stay fully usable), plus a robots rule
keeping subject content and images off search engines.

### 9.4 Production & compliance readiness
**How it works:** a full legal/compliance surface — privacy policy, cookie policy,
accessibility statement, children's-code page and a DPIA — signalling a genuinely
school-ready product, not a hobby site.
**Line:** *Built for schools — private by default, compliant, and off the open web.*

---

# PART 10 — Suggested landing-page structure

A recommended narrative order (mixing "smallest-felt" polish into a benefit-led flow rather
than literally smallest-to-biggest, which reads better to visitors):

1. **Hero** — tagline + the 1·7·28 promise + two CTAs ("Get started" / "I have a class login").
   Animated mock cards (daily question, streak, review calendar).
2. **Stat band** — 5 subjects · 70+ lessons · 9 activities/topic · 1·7·28 review cycle
   (count-up from real numbers).
3. **How memory works** — Daily Revise (Rule of 3) → Review Calendar (1·7·28) → server-graded
   so answers never leak. *(Parts 5.1, 5.2, 9.1)*
4. **A full lesson, not a quiz** — the 9-activity topic page walkthrough. *(Part 3)*
5. **Mark it like an examiner** — the self-marking model + paste-guard. *(Part 4)*
6. **Hands-on by subject** — CS Practice Lab (real Python!), typeset Maths, Spanish audio.
   *(Part 6)* — this is the strongest differentiator; give it room.
7. **Momentum** — XP, streaks, badges that mean something. *(Part 5.3)*
8. **For teachers** — join-code classes, one-click tasks + AI marking, worksheets, analytics
   "see the gap before the mock." *(Part 7)*
9. **For schools** — multi-school admin, roles, subject grants, teacher-authored subjects.
   *(Part 8)*
10. **Trust band** — server-verified scores, school isolation, compliance. *(Part 9)*
11. **FAQ** — join a class, is it free, spaced repetition, "can I peek at answers?" (no),
    phone support, data.
12. **Final CTA** — "Your future self keeps the marks."

**Audience split to keep in mind:** three distinct visitors land here — **students** (want:
fun, effective, fair), **teachers** (want: time saved, insight, control), and **school
leaders** (want: safeguarding, isolation, compliance, one platform for many subjects). The
strongest page speaks to all three with a clear "For students / For teachers / For schools"
spine.

**Honest positioning note for whoever writes the copy:** the platform is currently free to the
founding school for 2026–27, in live use with real students. Lead with that authenticity —
"built by teachers, used in our own classrooms" — rather than over-claiming scale. Where a
subject is newer (Spanish is at pilot stage; Additional Maths lab progress is local-only in
v1), keep the copy truthful — "growing through the year" is already the site's honest framing.

---

*Every feature above is grounded in the live codebase (student engine `script.js`,
`daily-revise.js`, `spaced-repetition.js`; labs `cs-lab/` & `maths-lab/`; teacher suite
`teacher-*.html`; admin `admin.html`/`admin.js`; and the specs in `docs/`). Status caveats are
flagged inline so nothing on the finished page over-promises.*
