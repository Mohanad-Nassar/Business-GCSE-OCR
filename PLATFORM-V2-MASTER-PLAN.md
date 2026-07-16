# Vidya V2 — Master Build Plan (multi-subject SaaS platform)

Created 2026-07-11. Successor to `MULTI-SUBJECT-PLAN.md` (whose steps 1–5 are DONE:
subjects/ tree, pipeline v2, subject-prefixed page ids, subjects hub, per-subject
generated files). This document turns the working multi-subject site into a
**sellable, secure, multi-subject revision platform** with real authentication,
subscriptions, an owner admin portal, and a marketing landing page.

**Deadline anchor: mocks/exams Jan–Feb 2027.** Phase A must be fully live well
before then.

**Scope decision (2026-07-11, supersedes the original phase order):** for the
2026–27 school year the platform is **free, for our own school only** — no
selling, no payments. Therefore:
- **Phase A + Phase C are the active roadmap** (everything except money).
- **Phase B (billing/Stripe/credits-metering) is PARKED** — fully specified
  below so the structure stays ready, but no Phase B work package may start
  until (1) a commercial go decision AND (2) `CONTENT-REWRITE-PLAN.md`
  Phase R is complete (original, copyright-clean content). Build WP-B1's
  *schema* only if a WP needs a table from it earlier — nothing user-facing.
- `CONTENT-REWRITE-PLAN.md` (repo root) is the companion document: the full
  multi-phase programme for rewriting all OCR-derived content before going
  paid. Its §3 records the free-year content policy: **the verbatim recipe
  continues for the remaining topics (owner's choice — best mock fidelity;
  rewrite debt accepted and already counted in the Phase R estimate).**
- Free-year copyright hygiene already applied: `eco resources/` gitignored,
  `robots.txt` blocks indexing of `/subjects/` + `/images/`; WP-A3's
  server-side gating additionally takes all content off the open web —
  prioritise it.

---

## 0. How to use this document

This plan is written so that **each work package (WP) can be handed to a smaller
model (Opus/Sonnet) as a self-contained prompt**. Rules for the human operator:

1. Run work packages **in order inside a phase** unless the package says
   "parallel-safe". Packages in different phases must not overlap if they touch
   the same files (each WP lists its files).
2. Give the agent ONLY the prompt block (`▶ AGENT PROMPT`) plus repo access.
   Every prompt tells the agent which files to read first — do not skip that.
3. After every WP: run the WP's **Verification** list before committing.
4. One WP = one commit (message given in the WP). Never batch WPs into one commit.
5. If an agent wants to change something outside its listed files, it must stop
   and report instead.

### Standing rules for every agent (paste into every prompt if the agent seems lost)

- Architecture: static multi-page HTML + shared root JS + Netlify Functions/Edge
  Functions + Supabase (Postgres + Auth + RLS). No frameworks, no bundlers.
- Features go in **shared JS files** (script.js, tasks-shared.js, gamification.js,
  account-cluster.js…), never into the 71 topic HTML pages. Topic pages are
  content + one generated `page-groups.js` include only.
- Generated files are NEVER hand-edited: `subjects/*/page-groups.js`,
  `subjects/*/question-bank.js`, `subjects/*/section-totals.js`, root
  `subjects-index.js`, `page-groups-all.js`, `section-totals-all.js`,
  `supabase/bank-questions-seed/**`. Change `tools/build_question_bank.py` or the
  manifests instead and re-run the pipeline.
- `teacher-tasks.html` and `teacher-worksheets.html` share a duplicated question
  picker — any change to one MUST be mirrored in the other (grep for the same
  function name in both).
- SQL changes are folded into the **canonical files in `supabase/`** (no separate
  migration files, pre-launch convention), and the file's header comment says
  what order to run things in. New tables always get RLS enabled + policies in
  the same file.
- All user-visible strings escaped with `taskEscapeHtml`/`gcseEscapeHtml`; bank
  content fields (question/caseStudy/explain/hint/starter/modelAnswer) render via
  `taskRichText()` (tasks-shared.js); `reading`/`markScheme` are trusted
  site-generated HTML rendered raw — do not change that without WP-A7.
- Verification tooling available: Node (`node --check file.js`), Python
  (`python tools/logic_test.py`), local serve (`python -m http.server` or
  `netlify dev`), V8 parse of inline blocks (see tools/).
- localStorage keys: legacy prefixes `gcse_`/`geo_` exist; new keys use `vidya_`
  (rename sweep happens in WP-C1, do not do it piecemeal).

### Current state snapshot (2026-07-11)

- Subjects live: Business (37 content pages), Economics (22 pages, content being
  filled in by parallel sessions), Computer Science (11 placeholder pages).
- Auth today: Supabase Auth. Teachers sign up with an invite code
  (`netlify/functions/teacher-signup.js`); teachers generate per-class student
  logins (`generate-students.js`) with synthetic emails `<username>@students.local`.
  Session cached in `localStorage.gcse_session_v1`; `tasksAuthInit(role)` guards pages.
- Netlify functions: create-class, generate-students, delete-student,
  reset-student-password, teacher-signup, suggest-marks (Gemini AI marking,
  server-side key, teacher-release design), weekly-retry-tasks (cron), env-check.
- Supabase schema: see `supabase/*.sql` — classes (with subject_id), class_students,
  profiles, progress_summary/progress_events, tasks chain (tasks, task_questions,
  task_assignments, task_attempts, task_answers, task_answer_suggestions),
  bank_questions (snapshot/answer_key split — answers never ship to students),
  daily-revise (settings/functions/stats), spaced-repetition reviews, topic-access,
  gamification, class-gamification, integrity_events, section-reset, flight-path.
- Known pending SQL (run in Supabase dashboard if not yet): `integrity-events.sql`,
  `section-reset.sql`, `spaced-repetition.sql` (check each header; safe to re-run).
- Fixed today (2026-07-11, this session): literal HTML tags showing in quiz/task/
  worksheet renders (`taskRichText()` added in tasks-shared.js and applied in
  daily-revise.js, review-calendar.js, task.html, teacher-tasks.html,
  teacher-worksheets.html, teacher-analytics.html); Daily Revise serving Business
  to Economics students (subject persistence in subject-loader.js +
  `?subject=` added to account-cluster.js menu, script.js site-nav,
  gamification.js topic-nav, dashboard.html CTA, business index nav).

### Locked decisions (user-confirmed 2026-07-11)

| Decision | Choice |
|---|---|
| Business model 2026–27 | **Free for our school only** — no payments this year; Phase B parked; commercial launch gated on CONTENT-REWRITE-PLAN.md Phase R |
| Payments (when unparked) | **Stripe hybrid** — Stripe Checkout/Portal for individuals; schools by invoice/PO, activated manually in admin portal |
| Auth | **Supabase Auth** + email/password + Google OAuth + Microsoft (Entra) OAuth; teacher-generated class logins stay |
| Architecture | **Keep current stack** (static + shared JS + Netlify + Supabase) |
| Admin portal | **Owner-only at launch**; school-admin role in a later phase |
| Solo students | **Self-guided full access** — subscription = enrollment, all topics unlocked, self-serve AI marking with credit allowance |
| Anti-copy | **Strong deterrents** — server-side content gating + copy/print/context blocking + watermark + integrity logging; accessibility preserved |
| Build order | **Students first** (Phase A), billing after (Phase B) |
| Deadline | Mocks **Jan–Feb 2027** |
| Brand | Vidya, marigold `#c77f1f`, per-subject colours (Business `#7a5c9e`, CS `#1a6b6b`, Economics `#2d7a4f`) — from MULTI-SUBJECT-PLAN.md |

### Design changes proposed in this plan (flag to owner before the WP that builds them)

These were requested in spirit ("restructure… redesign buttons and links… confirm
with me first"). Each is listed again inside its WP; the owner approves by
green-lighting the WP:

1. `index.html` becomes the **public marketing landing page**; the logged-in
   subjects hub moves to **`/hub.html`** (WP-A6). All "My Subjects" links repoint.
2. Student dashboard gains a **subject switcher header** and the hub becomes the
   student's true home (WP-A4).
3. Calendar becomes a **merged, colour-coded, filterable calendar** (WP-A5) —
   spaced-repetition chips + teacher-task chips.
4. Global **button/link restyle** to the Vidya design language happens once, in
   WP-C1 (not piecemeal), so every page changes together.

---

## 1. Target data model (all of Phase A+B in one view)

New tables (full SQL written inside the WPs; this is the map):

```
schools           id, name, contact_email, notes, status(active|suspended), created_at
school_members    school_id, profile_id, role(teacher|school_admin)   -- teachers belong to a school
subscriptions     id, owner_type(school|student), owner_id, plan(monthly|annual),
                  seats, subjects text[] ('all' allowed), starts_at, ends_at,
                  status(active|trialing|past_due|cancelled), stripe_customer_id,
                  stripe_subscription_id, source(stripe|invoice|voucher|admin)
entitlements(view/RPC) -- derived: "may profile X access subject Y right now?"
join_codes        code (8 chars, unique), class_id, created_by, expires_at,
                  max_uses, use_count, revoked
vouchers          code, kind(subscription|credits), payload jsonb, redeemed_by, redeemed_at
credit_ledger     id, owner_type(school|student), owner_id, delta, reason
                  (grant|purchase|ai_marking_spend|admin_adjust|refund),
                  ref (answer_id / stripe id), created_at   -- balance = SUM(delta)
plans             slug, name, audience(school|individual), price_monthly_pence,
                  price_annual_pence, included_credits_month, active
                  -- pricing lives in DB so admin can change it without deploys
calendar: teacher tasks already have due dates (tasks.due_at) — no new table;
          the merged calendar reads tasks + reviews. One new RPC.
```

Existing tables reused: `classes.subject_id` (subject scoping), `class_students`
(membership), `profiles` (gets `account_type` + `school_id` columns),
`integrity_events` (gets new event kinds), `task_answer_suggestions` (credits hook).

**Entitlement rule (single source of truth, used by RLS, Edge gate and UI):**
a profile may access subject S iff
- they are a member of a class whose subject = S and whose teacher's school has
  an active subscription covering S (or the class is marked `legacy_free`), OR
- they personally hold an active subscription covering S, OR
- their profile has `role in ('teacher','owner')` and school subscription covers S
  (teachers see their school's subjects), OR
- profile has `is_owner = true` (you) — sees everything.
Implemented once as SQL function `has_subject_access(p_profile uuid, p_subject text)
returns boolean` + RPC `get_my_entitlements()` returning the subject list + reason.
During Phase A (before billing exists) every school subscription check returns
TRUE via a feature flag row (`platform_settings.billing_enforced = false`) so
nothing breaks mid-build; Phase B flips it.

---

## 2. PHASE A — students & teachers first (mocks-critical)

Order: A0 → A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9.
A6 (landing) is parallel-safe with A4/A5. A7/A8 after everything else has landed.

---

### WP-A0 — Ship the 2026-07-11 fixes, reseed banks, run pending SQL

**Goal:** the two user-reported bugs (raw HTML in outputs; Economics students
getting Business Daily Revise) are live in production, and the database matches
the repo.

**Files:** already edited (see snapshot above) — this WP is verify + deploy only.

**Steps**
1. `git status` / `git diff` — review the edited files listed in the snapshot.
2. Run verification (below), commit, push (Netlify auto-deploys).
3. In Supabase SQL editor, run any pending canonical files (check each file's
   header): `supabase/integrity-events.sql`, `supabase/section-reset.sql`,
   `supabase/spaced-repetition.sql`, `supabase/daily-revise-class-settings.sql`.
   All are written to be safe to re-run.
4. Re-run the content pipeline so Economics topics built by parallel sessions are
   seeded: `python tools/build_question_bank.py --upload` (uses `.env` creds).

**Verification**
- `node --check` on: tasks-shared.js, daily-revise.js, review-calendar.js,
  account-cluster.js, subject-loader.js, script.js, gamification.js → all OK.
- Serve locally; as an economics student: open `/daily-revise.html` (no params)
  → economics questions; avatar menu → Daily Revise → stays economics.
- Open a Review Calendar due review on a business topic → mark-scheme feedback
  renders formatted (no literal `<p>`/`<strong>` text).
- Teacher → Tasks → pick economics questions → preview shows formatted text.

**Commit:** `Fix raw-HTML rendering via taskRichText + subject-aware student links`

---

### WP-A1 — Auth v2: email signup, Google + Microsoft OAuth, unified account model

**Goal:** anyone can create an account with email/password, Google, or Microsoft.
New accounts start with NO access (no classes, no subjects) until they join a
class (A2) or later hold a subscription (Phase B). Existing teacher-invite and
generated student logins keep working unchanged.

**Owner prerequisites (human, not agent):**
1. Supabase Dashboard → Auth → Providers: enable **Google** (create OAuth client
   in Google Cloud Console, authorized redirect
   `https://eaohjlyiotyqhvsizcpw.supabase.co/auth/v1/callback`) and
   **Azure/Microsoft** (Entra app registration, same redirect; supported account
   types: personal + org). Paste client ids/secrets into Supabase.
2. Auth → URL configuration: site URL = production domain; add
   `http://localhost:8888` to redirect allowlist for `netlify dev`.
3. Auth → Email: enable confirmations. For real deliverability configure custom
   SMTP (see Gap G1 — Resend/Postmark) — default Supabase SMTP is fine for dev only.

**Files:** `login.html` (rework), NEW `signup.html`, NEW `auth-shared.js`,
`tasks-shared.js` (tasksAuthInit), `manage-account.html`,
`supabase/schema.sql` (profiles columns + trigger), `netlify.toml` (no change
expected), `SETUP.md` (document providers).

**Schema (fold into `supabase/schema.sql`):**
```sql
alter table profiles
  add column if not exists account_type text not null default 'class_student'
    check (account_type in ('class_student','self_signup','teacher','owner')),
  add column if not exists email text,            -- real email for self signups
  add column if not exists school_id uuid,        -- filled in Phase B
  add column if not exists is_owner boolean not null default false;
-- profile auto-creation for OAuth/email signups (generated students already
-- get profiles from generate-students.js):
create or replace function handle_new_user() returns trigger ... -- insert into
-- profiles (id, username, role, account_type, email) values (new.id,
-- split_part(new.email,'@',1) de-duplicated, 'student', 'self_signup', new.email)
-- ON CONFLICT DO NOTHING; skip when email ends with '@students.local'.
create trigger on_auth_user_created after insert on auth.users ...
```

**Implementation steps**
1. NEW `auth-shared.js`: one function `vidyaAuthUi(mount, {mode})` used by both
   login.html and signup.html — renders email+password form, "Continue with
   Google", "Continue with Microsoft" buttons
   (`supabase.auth.signInWithOAuth({provider:'google'|'azure', options:{redirectTo: location.origin + '/auth-callback.html'}})`),
   error display, password rules (≥8 chars), and the existing student-username
   tab (kept verbatim from login.html — `<username>@students.local` synthetic
   email path).
2. NEW `auth-callback.html`: tiny page that completes the OAuth code exchange
   (`supabase.auth.exchangeCodeForSession` is automatic with detectSessionInUrl),
   fetches the profile, writes `gcse_session_v1` in the exact same shape login.html
   writes today (`{role, username}` + whatever it stores), then redirects:
   teachers → `/teacher-dashboard.html`, students with ≥1 subject → `/hub.html`
   (until A6 lands: `/index.html`), students with none → `/join.html` (A2).
3. `signup.html`: role choice is NOT offered — all self-signups are students.
   (Teachers continue via invite-code `teacher-signup.html`; a "I'm a teacher"
   link points there.) Email verification notice after signup.
4. `tasksAuthInit()` in tasks-shared.js: no behaviour change for existing roles;
   add: if authed student has zero classes AND zero entitlements → redirect to
   `/join.html` instead of letting them land on empty dashboards (guard flag so
   join.html itself doesn't loop).
5. `manage-account.html`: show linked provider (google/azure/email), allow email
   users to change password (already exists), show account_type.
6. Update `docs/QA-CHECKLIST.md` with the new flows.

**Verification**
- Email signup → verification email → verify → login → lands on join page.
- Google + Microsoft sign-in round-trip on `netlify dev` (localhost callback).
- Existing generated student + teacher logins unchanged (regression).
- `node --check auth-shared.js`; V8-parse inline blocks of new pages.
- Supabase: `select * from profiles order by created_at desc limit 5` shows
  correct account_type/email for each signup path.

**Commit:** `Auth v2: email/Google/Microsoft signup with Supabase Auth`

**▶ AGENT PROMPT (WP-A1)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A1 (this section), login.html,
teacher-signup.html, tasks-shared.js (tasksAuthInit + session helpers),
manage-account.html, supabase/schema.sql, SETUP.md §4-7.
Task: implement WP-A1 exactly as specified. Keep the existing student-username
login tab byte-for-byte functional. New shared code goes in auth-shared.js; do
not duplicate auth logic into pages. Fold schema changes into supabase/schema.sql
with a header note "re-run safe". Do not touch generated files. Do not build
join.html (that is WP-A2) — link to it but leave a placeholder redirect target.
Verify per the WP's Verification list; run node --check on every JS file you
touched; then stop and report with the commit message from the WP.
```

---

### WP-A2 — Class join codes + multi-subject membership

**Goal:** teachers keep generated per-class logins AND can issue a **join code**
per class. Any student account (generated or self-signup) can redeem codes to
join classes across different subjects. Students without any class see only the
join page.

**Files:** NEW `join.html`, `teacher-classes.html` (code management UI),
`teacher-dashboard.html` (code chip on class header), NEW SQL in
`supabase/tasks-schema.sql` (or a new `supabase/join-codes.sql` canonical file),
`tasks-shared.js` (redeem helper), `netlify/functions/` — NOT needed (RPCs suffice).

**Schema (new canonical file `supabase/join-codes.sql`):**
```sql
create table if not exists class_join_codes (
  code text primary key,                 -- 8 chars, unambiguous alphabet (no 0/O/1/I)
  class_id uuid not null references classes(id) on delete cascade,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,                -- null = no expiry
  max_uses int,                          -- null = unlimited
  use_count int not null default 0,
  revoked boolean not null default false
);
-- RLS: teachers select/insert/update codes for THEIR classes only; students: none.
-- RPC generate_join_code(p_class_id, p_expires_at, p_max_uses) SECURITY DEFINER:
--   verifies auth.uid() owns the class; generates code with unambiguous alphabet;
--   returns the row. Regenerating revokes the old code (one active code per class).
-- RPC redeem_join_code(p_code) SECURITY DEFINER:
--   normalises case; checks revoked/expiry/max_uses; inserts class_students row
--   (idempotent: already-member returns ok); increments use_count atomically;
--   returns {class_name, subject_slug, teacher_name}.
--   RAISES clear errors: 'code_invalid', 'code_expired', 'code_full',
--   'already_member'. Rate-limit: reject >10 failed attempts per user per hour
--   (count from a small join_code_attempts table) → 'too_many_attempts'.
```
Multi-subject rule: `class_students` may hold one class per student **per
subject** (the Vidya convention). `redeem_join_code` enforces: if the student
already has a class in that subject → error `subject_taken` with the existing
class name in the message (teacher moves them via existing tools if needed).

**UI steps**
1. `join.html`: paste/enter code (big friendly input, auto-uppercase), on
   success show "You joined <class> — <subject>" + button to that subject's
   dashboard; list current memberships; can redeem more codes (different
   subjects). Uses tasksAuthInit('student').
2. `teacher-classes.html`: per class row — show active code (or "generate"),
   copy button, regenerate (with confirm), optional expiry (7/30/90 days/never)
   and max uses. Show use_count.
3. `dashboard`/hub empty states: "Ask your teacher for a join code" + input.

**Verification**
- Teacher generates code; student (self-signup) redeems → appears in class list,
  teacher sees them in teacher-dashboard; student's hub now shows that subject.
- Second redeem of a different-subject code → both subjects on hub.
- Redeem of same-subject second class → clear 'subject_taken' error.
- Expired/revoked/full codes → correct errors. 11 garbage codes → rate-limited.
- Generated-login students unaffected (regression: their class still lists them).

**Commit:** `Class join codes: teacher issue/revoke + student redeem across subjects`

**▶ AGENT PROMPT (WP-A2)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A2, supabase/tasks-schema.sql (classes,
class_students, RLS patterns), teacher-classes.html, tasks-shared.js, join flow
notes in WP-A1 (tasksAuthInit redirect). Task: implement WP-A2 exactly. SQL goes
in a NEW canonical file supabase/join-codes.sql following the header style of
supabase/section-reset.sql (safe to re-run, states run order after tasks-schema).
All server logic in SECURITY DEFINER RPCs — no new Netlify functions. UI matches
the existing teacher page visual language (read teacher-classes.html styles).
Do not touch generated files. Verify per WP list; node --check + V8-parse inline
scripts; stop and report.
```

---

### WP-A3 — Server-side content gating ("no class → no content")

**Goal:** students cannot reach ANY subject content (topic pages, question data,
subject index pages) unless entitled (member of a class in that subject — Phase A
definition). Today topic pages are public static files; topic-guard.js is
client-side only. This closes that.

**Files:** NEW `netlify/edge-functions/content-gate.ts`, `netlify.toml`
(edge function mount on `/subjects/*`), NEW `supabase/entitlements.sql`
(`has_subject_access` + `get_my_entitlements` + `platform_settings`),
`login.html` (already stores session; add a lightweight cookie), `auth-shared.js`,
`tasks-shared.js`, `topic-guard.js` (keep as in-page UX layer), `subjects/*/index.html`
guards (they already auth-check — verify), `docs/QA-CHECKLIST.md`.

**Design**
1. `supabase/entitlements.sql`:
   ```sql
   create table if not exists platform_settings(key text primary key, value jsonb);
   insert ... ('billing_enforced', 'false') on conflict do nothing;
   create or replace function has_subject_access(p_profile uuid, p_subject text)
     returns boolean language sql stable security definer as $$
       -- Phase A: exists(select 1 from class_students cs join classes c ...
       --   where cs.student_id = p_profile and c.subject_slug/subject_id → p_subject)
       -- or profile is teacher/owner. Phase B ORs in subscriptions (billing flag).
     $$;
   create or replace function get_my_entitlements() returns jsonb ...
     -- [{subject:'economics', via:'class', class:'10B'}...] for auth.uid()
   ```
2. **Cookie for the Edge gate:** on login/refresh, client sets
   `vidya_at=<supabase access_token>; Path=/; Secure; SameSite=Lax` (NOT httpOnly —
   it's the same token already in localStorage; the cookie is transport, not new
   exposure). auth-shared.js owns set/clear (logout clears).
3. `content-gate.ts` (Netlify Edge, runs on `/subjects/*`):
   - Allow `page-groups.js`/`section-totals.js` (tiny, non-content) — everything
     else requires a valid JWT: verify signature against Supabase JWKS (cache the
     JWKS), extract sub.
   - Subject slug = first path segment after /subjects/. Call PostgREST
     `rpc/has_subject_access` with the user's own JWT (one fetch, ~30ms, cache
     result in a per-isolate Map with 60s TTL keyed sub+subject).
   - Fail → 302 to `/index.html?redirect=<path>` (no JWT — landing page,
     which forwards ?redirect= on to login.html) or `/join.html?subject=<slug>`
     (JWT but no access).
   - **`question-bank.js` gets a stricter rule:** teachers only (it contains
     answers inline — students must never fetch it; teacher-tasks loads it).
4. Keep `topic-guard.js` for the in-page locked-topic UX (sequential unlocks) —
   unchanged; the Edge gate is the outer wall.
5. Local dev note: `netlify dev` runs edge functions locally; document in SETUP.md.

**Verification**
- Logged out: `curl -I https://site/subjects/economics/2.2_Demand.html` → 302 login.
- Economics-only student: business topic URL → 302 join.html?subject=business;
  economics topic loads. Their own subject index loads.
- Student fetch of `/subjects/business/question-bank.js` → 302/403 even when
  enrolled; teacher fetch works (teacher-tasks page still functions).
- Cached pages: after logout (cookie cleared), refresh → redirected.
- Performance: topic page TTFB overhead < 100ms (JWKS + entitlement cached).

**Commit:** `Server-side content gating: Netlify Edge + has_subject_access`

**▶ AGENT PROMPT (WP-A3)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A3, netlify.toml, topic-guard.js,
tasks-shared.js session handling, login.html completeLogin, auth-shared.js (from
WP-A1), supabase/topic-access-schema.sql (style reference). Task: implement WP-A3
exactly. Edge function in TypeScript under netlify/edge-functions/, mounted in
netlify.toml with `[[edge_functions]] path = "/subjects/*"`. JWT verification
against the project JWKS (https://eaohjlyiotyqhvsizcpw.supabase.co/auth/v1/.well-known/jwks.json)
— no service key in the edge function. SQL in NEW supabase/entitlements.sql.
The billing_enforced flag must exist and default false. Do not break teacher
access to question-bank.js. Verify with curl per the WP list using `netlify dev`.
node --check every JS; stop and report.
```

---

### WP-A4 — Student home restructure: hub-first, per-subject everything

**Goal:** when a student logs in they land on the **hub** and every feature is
reachable *per subject*: dashboard, Daily Revise, Tasks, Topics, Calendar — plus
one cross-subject calendar entry point (A5 builds its filters).

**Files:** `index.html` (hub — becomes `hub.html` only when A6 lands; until then
edit in place), `subject-home.js`, `account-cluster.js` (menu gains per-subject
submenu), `dashboard.html` (subject switcher already exists — polish + tasks
section per subject), `daily-revise.html/js` (already subject-scoped ✔),
`review-calendar.html/js` (subject-scoped ✔), `badges.html` (stays cross-subject),
`onboarding-tour.js` (tour updated for hub-first).

**Steps**
1. Hub subject cards (renderStudentSubjectsHub) get **five action buttons** per
   card: 📖 Topics (subject index) · 📊 Dashboard · 🎯 Daily Revise · 📋 Tasks
   (dashboard#tasksSection) · 🗓️ Calendar — each with `?subject=<slug>`. Add one
   global card "🗓️ All-subjects calendar" → `review-calendar.html?subject=all`
   (A5 implements `all`).
2. `account-cluster.js` student menu: group per current subject (existing links,
   already subject-aware after WP-A0) + "🗂️ My Subjects" hub link (done in A0) —
   verify + add "Switch subject ▸" flyout listing `get_my_entitlements()` subjects
   (cache 60s in sessionStorage).
3. Dashboard: tasks list filtered to the active subject (tasks belong to classes;
   classes have subject) — add the filter + an "All subjects" toggle chip.
4. Empty states everywhere: no entitlements → join CTA (from A2).
5. Teacher side untouched in this WP (teacher pages already per-class).

**Verification**
- Student in 2 subjects: hub shows 2 cards × 5 working buttons, each lands
  subject-correct (check the header badge on each page).
- Student in 1 subject: same but 1 card; dashboard subject switcher hidden
  (existing `get_my_subjects` rule) — hub still works.
- Tasks list: business task not visible under economics dashboard filter;
  "All subjects" shows both. Onboarding tour completes on fresh profile.

**Commit:** `Hub-first student navigation: per-subject actions on every subject card`

**▶ AGENT PROMPT (WP-A4)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A4, index.html (hub render functions),
subject-home.js, account-cluster.js, dashboard.html (initSubjectSwitcher,
renderTasks area), subjects-index.js (generated — read only). Task: implement
WP-A4 exactly. Reuse subjectCardHtml; do not fork it. Keep all links
subject-parameterised with encodeURIComponent. Tasks-per-subject filter must
derive subject from the task's class join (tasks → task_assignments → class →
subject) — check what the existing dashboard task fetch already returns before
adding queries. Do not touch generated files or teacher pages. Verify per WP
list; node --check; stop and report.
```

---

### WP-A5 — Merged calendar: teacher tasks + spaced repetition, multi-select filters

**Goal:** one calendar system showing BOTH (a) 1d/7d/28d spaced-repetition
reviews (existing) and (b) teacher-set tasks by due date (new on the calendar),
colour-coded differently, with **multi-select filters**: subjects × event types
for students; subjects × event types × classes for teachers. `?subject=all`
supported. Works on `review-calendar.html` (student) and `teacher-calendar.html`.

**Colour system (design sign-off item):** each chip carries its **subject
colour** as the left border/accent; event TYPE distinguishes fill — 🔁 reviews =
soft outline chip (existing style), 📋 tasks = solid-fill chip with white text.
Legend rendered above the grid. Overdue tasks get a red dot; completed get ✓.

**Files:** `review-calendar.html/js`, `teacher-calendar.html`,
`spaced-repetition.js` (fetch layer), NEW RPC in `supabase/spaced-repetition.sql`
or `tasks-analytics-functions.sql`: `get_my_calendar(p_from date, p_to date,
p_subjects text[] default null)` returning rows
`{kind:'review'|'task', date, subject_slug, title, page_id?, task_id?, status}`;
teacher variant `get_teacher_calendar(p_from, p_to, p_subjects, p_class_ids)`.

**Steps**
1. SQL: implement both RPCs (SECURITY DEFINER, scoped to auth.uid()). Reviews
   come from the existing review-schedule tables; tasks from
   task_assignments×tasks (due_at) for the student's classes — status from
   task_attempts (not_started/in_progress/submitted/marked).
2. Student calendar: filter bar = two multi-select chip groups (Subjects:
   [all|each enrolled], Types: [Reviews, Tasks]). Multi-select = toggle chips,
   persisted in `localStorage.vidya_cal_filters_v1`. `?subject=all` preselects
   all subjects; `?subject=economics` preselects one. Day cells render up to 3
   chips + "+n more" popover (existing pattern if present — else add).
3. Clicking a task chip → `task.html?id=…`; review chip → existing quiz flow.
4. Teacher calendar: same component + third multi-select (their classes).
   Task chips show class name; clicking → teacher-tasks detail.
5. Extract the calendar grid into a shared function if review-calendar.js and
   teacher-calendar.html would otherwise duplicate >100 lines (new file
   `calendar-shared.js`, loaded by both).
6. Upcoming-tasks list under the grid mirrors the filters.

**Verification**
- Student with business+economics, tasks due this week in both, reviews scheduled:
  every filter combination shows exactly the right chips (test all-on, one
  subject, tasks-only, reviews-only, none → empty-state message).
- Colours: review chip outline vs task chip solid; subject accents correct.
- Teacher: class filter isolates one class; combined filters correct.
- Filters persist across reload; URL param overrides persisted subjects once.
- `python tools/logic_test.py` still passes; add pure-function tests for the
  filter-combination logic there (the file has a harness pattern to copy).

**Commit:** `Merged calendar: tasks + reviews with multi-select subject/type/class filters`

**▶ AGENT PROMPT (WP-A5)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A5, review-calendar.js (calendar grid
+ srFetchSchedule), spaced-repetition.js, teacher-calendar.html,
supabase/spaced-repetition.sql, supabase/tasks-schema.sql (tasks/due_at/
assignments/attempts), tools/logic_test.py (test harness pattern). Task:
implement WP-A5 exactly, including the shared calendar-shared.js if duplication
>100 lines. Filter logic must be pure functions (testable without DOM) added to
logic_test.py. Colour rule: subject colour = accent, type = fill style. Do not
break the existing review quiz flow (renderQuizQuestion etc.). SQL folded into
the canonical files with re-run-safe guards. Verify per WP list; node --check;
run logic_test.py; stop and report.
```

---

### WP-A6 — Public marketing landing page (animated) + hub move

**Goal:** `index.html` becomes a modern, animated, public landing page marketing
the platform; the logged-in subjects hub moves to `hub.html`. Logged-in visitors
hitting `/` are auto-forwarded to the hub.

**Design brief (sign-off item — this IS the requested "confirm first" design):**
- Vidya brand: marigold `#c77f1f` on paper/ink palette, Playfair Display display
  face + DM Sans body (already loaded site-wide). Subject colour accents.
- Sections (in order): sticky translucent nav (logo, Features, Subjects, For
  Schools, Log in, **Get started** CTA — NO pricing section during the free
  year; a "School access" band explains sign-in is for our school's students,
  and the pricing section slots in when Phase B unparks) → hero (headline + subhead +
  CTA pair + floating UI mockup cards with slow parallax) → social-proof strip →
  **scroll-storytelling feature sections** (one per flagship feature: Daily
  Revise rule-of-3, Review Calendar 1/7/28, Tasks & AI marking, Gamification/XP/
  badges, Teacher analytics & flight paths, Worksheets) each revealing on scroll
  → subjects grid (Business/Economics/CS cards with per-subject colour) → for-
  schools band (join codes, class controls, invoice billing) → FAQ accordion →
  footer (existing legal links from footer-legal.js).
- Motion: IntersectionObserver `reveal` classes (translateY+fade, stagger),
  hero parallax via rAF on scroll (transform-only, no layout thrash), animated
  counter stats, subtle gradient shift on CTA hover, `prefers-reduced-motion`
  media query disables ALL of it (accessibility requirement).
- NO frameworks, NO external JS libs — hand-rolled ~200-line `landing.js`.
  Images: reuse existing `images/` screenshots or pure-CSS mockups.
- Lighthouse targets: Performance ≥90, A11y ≥95 (landing only).

**Steps**
1. Copy current index.html → `hub.html` unchanged; strip the public-subjects
   fallback from hub (hub is logged-in only; logged-out → redirect login).
2. Rewrite `index.html` as the landing (new `landing.css` + `landing.js`; do NOT
   load style.css to keep it light — self-contained styles).
3. On load: if a Supabase session exists → `location.replace('/hub.html')`.
4. Repoint hub links: account-cluster "My Subjects" (+ any `/index.html` student
   links in script.js/gamification.js/onboarding-tour.js/login redirect/
   auth-callback) → `/hub.html`. Teacher links unchanged. Old anchor
   `index.html#...` references checked with grep.
5. Update onboarding-tour.js start page to hub.html.
6. netlify.toml: no redirect needed (index.html stays the entry).

**Verification**
- Logged out `/` shows landing; every nav anchor scrolls; reveals fire once;
  `prefers-reduced-motion: reduce` (DevTools emulation) → no motion.
- Logged-in student `/` → hub.html with their subjects; teacher → hub works too
  (teacher card links to teacher-dashboard).
- Grep proves no student-facing link still points at the old hub location:
  `grep -rn 'index.html' *.js *.html --exclude landing*` reviewed line-by-line.
- Lighthouse run (Chrome DevTools) meets targets; page weight < 300KB.

**Commit:** `Marketing landing page at / with animated scroll story; hub moves to /hub.html`

**▶ AGENT PROMPT (WP-A6)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A6 (the design brief is binding),
index.html (current hub — you will copy it to hub.html), account-cluster.js,
onboarding-tour.js, login.html redirect, footer-legal.js, business-style.css
(brand tokens: colours/fonts). Task: implement WP-A6 exactly. The landing must be
fully self-contained (landing.css/landing.js, no style.css), hand-rolled motion
with IntersectionObserver + prefers-reduced-motion opt-out, no external
libraries, no fabricated testimonials (use feature facts, not fake quotes; the
social-proof strip says what the platform does, e.g. question counts computed
from subjects-index.js, not invented school names). Copy must market: Daily
Revise, Review Calendar, Tasks + AI marking, gamification, teacher analytics,
worksheets, multi-subject. Verify per WP list including the grep sweep; stop and
report.
```

---

### WP-A7 — Security hardening pass (audit + fixes)

**Goal:** close the classes of vulnerability the user asked about. Note: the
client never builds SQL strings (supabase-js → PostgREST is parameterised), so
classic SQL injection is not the main risk — **RLS/RPC authorisation, XSS, and
function abuse are.** This WP is an audit with a fix-list format: the agent
produces `docs/SECURITY-AUDIT-<date>.md` with findings AND applies the fixes.

**Checklist (execute in order):**
1. **RLS audit:** for every table in every `supabase/*.sql`: confirm
   `enable row level security` + policies exist; students can only reach their
   own rows; teachers only their classes' rows. Specifically re-verify:
   task_answers (student self-select), task_answer_suggestions (teacher-only),
   bank_questions (answer_key never selectable by students — the snapshot/
   answer_key split), progress tables, integrity_events (student insert-own,
   teacher select-their-classes), class_join_codes (A2), calendar RPCs (A5).
   Method: scripted PostgREST smoke tests with a student JWT + a teacher JWT
   (pattern exists per MULTI-SUBJECT-PLAN "scripted PostgREST smoke tests").
2. **RPC audit:** every `security definer` function must (a) filter by
   `auth.uid()`, (b) validate ownership of any passed id (p_class_id belongs to
   caller, p_task_id assigned to caller…), (c) `set search_path = public`.
   Fix any misses in the canonical files.
3. **Netlify function audit:** each function must verify the caller's JWT and
   role before using the service key (create-class, generate-students,
   delete-student, reset-student-password: teacher-and-owns-class; suggest-marks:
   teacher-owns-task; teacher-signup: invite code compare uses constant-time
   check; weekly-retry-tasks: reject external HTTP invocation unless a shared
   secret header matches — Netlify cron sets none, so require
   `x-cron-secret === process.env.CRON_SECRET` and set that env var).
4. **XSS sweep:** grep every `innerHTML`/`insertAdjacentHTML` in *.js and inline
   scripts; classify each interpolation as escaped / taskRichText / trusted-
   generated / UNSAFE. Known accepted-raw sites: `reading`, `markScheme`
   (site-generated). Everything user-typed (usernames, class names, task titles,
   student answers, teacher feedback, reflections) must be escaped — fix any miss.
   Add regression notes to docs/QA-CHECKLIST.md.
5. **CSV injection:** exports (teacher-analytics, task results) prefix cells
   matching `^[=+\-@]` with `'` — check toCsv() in tasks-shared.js and fix there.
6. **Security headers** in netlify.toml `[[headers]]`: 
   `Content-Security-Policy` (allow self + supabase.co + fonts.googleapis/gstatic
   + cdn.jsdelivr for supabase-js — then plan removal of the CDN by vendoring),
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
   Vendor `supabase.js` locally (`/vendor/supabase-2.js`) so CSP can drop
   jsdelivr; update every page include (scripted sed + verify).
7. **Auth/session:** confirm email-change + password-change require re-auth
   (Supabase setting), OAuth redirect allowlist is exact, anon key has no
   service-role grants (it never should), and `gcse_session_v1` never stores
   tokens beyond what supabase-js itself stores (it stores role/username only —
   verify and document).
8. **Rate limiting:** Supabase Auth has built-in login limits. Add DB-side
   throttles where missing: join-code redemption (A2 ✔), suggest-marks (cap
   answers/click already 20 — add per-teacher daily cap read from
   platform_settings), record_mastery_answer / record_review_answer (sanity cap
   per student/day to blunt scripted grinding, e.g. 500 — configurable).
9. **Secrets:** `.env` is gitignored (verify `git log --all -- .env` is empty);
   rotate any key ever committed; SETUP.md documents rotation.
10. **Dependency check:** `npm audit` on netlify functions deps; pin versions.

**Verification:** the audit doc lists every finding with file:line, severity,
fix commit ref. Smoke-test scripts committed under `tools/security-smoke/` and
green. Site still fully functional (run docs/QA-CHECKLIST.md critical paths).

**Commit:** `Security hardening: RLS/RPC/function audit fixes, CSP, CSV guard, rate limits`

**▶ AGENT PROMPT (WP-A7)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A7, every file in supabase/ (RLS +
RPCs), every file in netlify/functions/, tasks-shared.js toCsv, netlify.toml.
Task: execute the 10-point checklist in order, writing findings to
docs/SECURITY-AUDIT-2026-MM-DD.md as you go (file:line, severity, fix). Apply
fixes directly: SQL into the canonical files (re-run safe), function fixes in
place, headers in netlify.toml, vendored supabase.js under /vendor/ with all
includes updated. Do NOT weaken the bank_questions answer_key split. Do NOT
change reading/markScheme raw rendering (documented accepted risk — note it).
Anything you cannot fix safely, mark BLOCKED with reason. Verify per WP; stop
and report with the audit doc as your summary.
```

---

### WP-A8 — Anti-copy & anti-scrape deterrents (strong, accessibility-safe)

**Goal:** make casual copying of slide/case-study/question content hard, log
tampering signals, and rate-limit scraping — WITHOUT breaking screen readers,
keyboard navigation, or printing of teacher worksheets (that's a feature).

**Honest scope note (goes in the doc + tell the owner):** DevTools, screenshots
and OCR cannot be technically prevented on the open web. The durable protections
are WP-A3's server-side gating, per-account watermarking, rate limits, and terms
of service. Everything below raises effort, not impossibility.

**Files:** NEW `content-protect.js` (loaded by script.js on topic pages and by
daily-revise/review-calendar/task pages), `script.js` (loader hook),
`style.css`/`business-style.css` (print/selection CSS), `netlify/edge-functions/
content-gate.ts` (rate limiting), `supabase/integrity-events.sql` (new kinds),
teacher pages EXCLUDED (worksheets must stay printable/copyable).

**Steps**
1. `content-protect.js` (student content pages only; bail out for teachers):
   - Block `copy`/`cut`/`contextmenu`/`dragstart` on content containers
     (`.topic-content`, `.case-study`, `.qtext`, `.reading-card`, flashcards);
     `beforeprint`/`Ctrl+P` on topic pages → show "printing is disabled" toast
     (CSS `@media print { .topic-content,... { display:none } }` + a printed
     watermark note instead).
   - `user-select:none` on content containers, EXCEPT inputs/textareas (answers
     must stay typeable/pastable-into per the existing paste-guard rules which
     block paste INTO exam answers — keep both).
   - Per-user **watermark**: fixed, pointer-events:none, ~8% opacity diagonal
     repeating text `<username> · vidya` over content containers (CSS repeating
     element, not canvas — cheap). Screen readers unaffected (aria-hidden).
   - DevTools-open heuristic (window outer/inner delta + `debugger` timing probe
     ONCE per session, no loops): on detection just log integrity event
     `devtools_opened` (NO blanking/blurring — strong-not-maximum decision).
   - Copy attempt on content → log `copy_blocked` integrity event (throttled 1/min).
   - Everything wrapped in feature flag `platform_settings.content_protect`
     (default on) so support can disable remotely if it misfires.
2. Keyboard/reader safety: do NOT block keydown globally; only the specific
   combos on content pages (Ctrl+C handled by the copy event itself; do not
   touch Ctrl+F/arrows/Tab). Test with NVDA reading a topic card.
3. Obfuscation: embedded per-page data arrays stay (they must render), but the
   nightly-visible low-effort path — "View Source → copy mcqData" — gets a speed
   bump: pipeline v2 gains `--pack` option that ships each page's data block
   base64-packed and unpacked at runtime (`JSON.parse(atob(...))`). Document
   clearly in the plan that this is obfuscation, not security. (Skip if pipeline
   changes feel risky before mocks — flagged OPTIONAL.)
4. Scrape rate limiting in content-gate.ts: per-user token bucket (Map in edge
   isolate): >40 content-page loads / 5 min → 429 page "Slow down — this looks
   automated" + integrity event `scrape_throttled` (fail-open on isolate reset;
   that's fine, it's a deterrent).
5. Teacher analytics: surface integrity events per student on
   teacher-dashboard (a small "integrity" chip count next to students with
   events, drill-down list). Owner sees platform-wide in admin (Phase B).

**Verification**
- As student: cannot select/copy/right-click topic content; CAN type + paste
  into its own answer boxes except where the exam paste-guard forbids; print
  preview of a topic page shows the blocked notice; watermark shows YOUR username.
- NVDA (or Windows Narrator) reads a topic card normally.
- Teacher worksheets print flawlessly (regression).
- Integrity events appear in Supabase after simulated triggers.
- 41 rapid page loads → 429; normal browsing never trips it.

**Commit:** `Content protection: selection/copy/print deterrents, watermark, integrity logging, scrape throttle`

**▶ AGENT PROMPT (WP-A8)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-A8 (scope note is binding — no
devtools blanking, no global keydown traps), script.js (paste-guard + loader
patterns), supabase/integrity-events.sql, netlify/edge-functions/content-gate.ts
(from WP-A3), teacher-worksheets.html print CSS. Task: implement WP-A8 exactly.
content-protect.js is a new shared file loaded via script.js's existing dynamic-
load pattern (see how account-cluster.js is loaded) and by the standalone student
pages' script includes. Teacher pages and print worksheets must be provably
unaffected. The --pack pipeline step is OPTIONAL — implement last and only if
build_question_bank.py tests stay green (tools has verify patterns). Verify per
WP list incl. a screen-reader pass; stop and report.
```

---

### WP-A9 — Phase A QA gate (full end-to-end before Phase B starts)

**Goal:** scripted + manual proof that everything above works together, for all
three roles (generated student, self-signup student, teacher) × two subjects.

**Steps**
1. Extend `docs/QA-CHECKLIST.md` with a Phase-A matrix (the agent writes it from
   the WPs' verification lists — every row = who/where/expected).
2. Run it all on a staging deploy (Netlify branch deploy `phase-a`).
3. Fix-forward small issues; anything structural → new WP.
4. Data reset: wipe test accounts; reseed banks (`--upload`); confirm
   platform_settings flags: billing_enforced=false, content_protect=on.
5. Tag the repo `phase-a-complete`.

**Commit:** `Phase A QA matrix + fixes; tag phase-a-complete`

---

## 3. PHASE B — commercial layer (subscriptions, credits, admin) — ⏸ PARKED

**Do not start any WP in this phase.** Unpark conditions (both required):
1. Owner's explicit commercial go decision (target: 2027–28 year), and
2. `CONTENT-REWRITE-PLAN.md` Phase R complete through R5 (original content,
   purge done, solicitor review passed).

Kept fully specified so the structure stays ready and Phase A can build the
right seams (entitlements + `platform_settings.billing_enforced=false` are
Phase A groundwork and DO get built in WP-A3).

Order when unparked: B1 → B2 → B3 → B4 → B5. B1 blocks everything; B2/B3
parallel-safe after B1; B4 needs B2+B3; B5 last.

---

### WP-B1 — Entitlement schema + owner admin portal (manual school activation)

**Goal:** the owner (you) can run the whole business manually before Stripe
exists: create a school, attach teachers, set a subscription (duration, seats,
subjects, AI credits), suspend/extend it, issue vouchers — all from `/admin/`.

**Files:** NEW `admin/index.html` (+ `admin/admin.js`, standalone page in the
teacher-page style: inline auth via tasksAuthInit('owner')), NEW
`supabase/billing.sql` (schools, school_members, subscriptions, plans, vouchers,
credit_ledger, RPCs), `netlify/functions/` — none needed yet,
`tasks-shared.js` (tasksAuthInit learns role 'owner'),
`supabase/entitlements.sql` (has_subject_access ORs in subscriptions when
`billing_enforced=true`).

**Schema (supabase/billing.sql — canonical, re-run safe):** the tables from §1
verbatim, plus RLS: ALL billing tables are owner-only via
`exists(select 1 from profiles where id = auth.uid() and is_owner)` — teachers/
students reach billing data ONLY through narrow RPCs
(`get_my_school_subscription_status()`, `get_my_credit_balance()`).
Seed `plans`: school-per-student-annual, school-whole-annual,
individual-monthly, individual-annual (prices as placeholder pence values —
owner edits rows in admin; **pricing is data, never code**).

**Admin portal MVP screens (one page, tabbed, same visual language as teacher
dashboard):**
1. **Schools** — create; list with status/subscription summary; detail drawer:
   members (attach teacher by email — sets profiles.school_id + school_members),
   subscription editor (plan, subjects multi-select, seats, start/end, status),
   credit balance + manual grant (writes credit_ledger with reason admin_adjust),
   suspend (sets status → access flips off via has_subject_access).
2. **Individuals** — search student by email/username; view entitlements; grant
   comp subscription; adjust credits.
3. **Vouchers** — generate batch (kind subscription|credits, payload, count),
   list/revoke, export CSV.
4. **Usage** — counts: active students/teachers per school, AI credit burn (from
   credit_ledger), integrity events (from WP-A8), signups per week.
5. **Settings** — platform_settings editor (billing_enforced toggle,
   content_protect, caps).

**Owner bootstrap:** SQL one-liner in the file header:
`update profiles set is_owner = true where id = '<your auth uid>';`

**Verification:** owner logs in → /admin loads; non-owner (teacher/student) →
redirected away AND RLS blocks direct PostgREST reads of billing tables (curl
test with a teacher JWT). Create school→attach teacher→set subscription→flip
billing_enforced=true → students of that school keep access; students of a
school WITHOUT a subscription lose content access (Edge gate + RLS both);
flip back to false for launch prep.

**Commit:** `Owner admin portal + billing schema (manual activation, vouchers, credits)`

**▶ AGENT PROMPT (WP-B1)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §1 and §WP-B1, supabase/entitlements.sql,
supabase/schema.sql (profiles), teacher-dashboard.html (visual language + auth
pattern), tasks-shared.js (tasksAuthInit). Task: implement WP-B1 exactly.
billing.sql is a NEW canonical file; header documents run order (after
entitlements.sql) and the owner bootstrap line. Admin page is standalone like
teacher pages (inline style/script, tasksAuthInit('owner') — add that role
support to tasks-shared.js without disturbing existing roles). Every admin
mutation is an owner-checked SECURITY DEFINER RPC — the page never writes tables
directly. Verify per WP including the teacher-JWT curl denial; stop and report.
```

---

### WP-B2 — Stripe for individuals (checkout, portal, webhooks)

**Goal:** an individual student can buy per-subject monthly/annual plans by card,
manage/cancel in Stripe's customer portal, and their entitlement flips
automatically. Schools stay manual (B1).

**Owner prerequisites:** Stripe account; create Products/Prices matching `plans`
rows (store `stripe_price_id` on plans); portal configuration enabled; webhook
endpoint secret. Env vars in Netlify: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Files:** NEW `netlify/functions/stripe-checkout.js` (creates Checkout Session:
verifies JWT, `client_reference_id = profile id`, line item = chosen price,
`success_url=/hub.html?sub=ok`), NEW `netlify/functions/stripe-webhook.js`
(signature-verified; handles `checkout.session.completed`,
`customer.subscription.updated/deleted`, `invoice.payment_failed` → upserts
`subscriptions` rows; grants monthly `included_credits_month` via credit_ledger
on each `invoice.paid`), NEW `pricing.html` (public page: plan cards per subject
combo, reads `plans` via anon RPC `get_public_plans()`), `hub.html` (upsell card
for un-entitled subjects), `manage-account.html` ("Manage billing" button → NEW
`netlify/functions/stripe-portal.js` creating a portal session),
`supabase/billing.sql` (get_public_plans + webhook upsert RPC
`apply_stripe_event` SECURITY DEFINER, called ONLY from the function with
service key).

**Rules**
- Webhook is the ONLY writer of stripe-sourced subscription rows (idempotent on
  `stripe_subscription_id` + event id table to dedupe replays).
- `past_due` → 7-day grace (entitlement stays), then `cancelled` (Stripe setting).
- Voucher redemption page `redeem.html`: code → RPC `redeem_voucher` →
  subscription or credits (from B1 tables).
- Landing page pricing section links here; keep prices ONLY in DB/Stripe.

**Verification:** Stripe test mode end-to-end: buy monthly economics → webhook →
subscriptions row active → content access appears (billing_enforced=true in
staging); cancel in portal → access ends at period end; card-decline path →
past_due grace; replayed webhook event → no duplicate rows/credits. `stripe
listen --forward-to localhost:8888/.netlify/functions/stripe-webhook` for local.

**Commit:** `Stripe individual subscriptions: checkout, portal, webhooks, vouchers, pricing page`

**▶ AGENT PROMPT (WP-B2)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-B2, supabase/billing.sql,
netlify/functions/_lib/adminClient.js + teacher-signup.js (function patterns:
JWT check, service client, error shape), netlify.toml. Task: implement WP-B2
exactly. Functions use the stripe npm package (add to package.json). The webhook
must verify signatures and be idempotent (events table). No price/amount is ever
hardcoded in JS — plans table + Stripe Prices only. pricing.html is public,
matches landing visual language (read landing.css from WP-A6). Verify in Stripe
test mode per WP list; stop and report.
```

---

### WP-B3 — AI-marking credits metering

**Goal:** AI marking spends credits: schools draw from a school pool (granted at
subscription setup / topped up by owner or purchase), solo students from their
personal allowance (monthly grant + top-up packs). Teachers see balances; hitting
zero blocks the button with a friendly upsell (schools: "ask your admin").

**Files:** `netlify/functions/suggest-marks.js` (meter: before Gemini call,
RPC `spend_credits(owner, n_answers, ref)` — atomic, fails with
'insufficient_credits'; refund on Gemini failure), `supabase/billing.sql`
(spend_credits/refund_credits/get_my_credit_balance RPCs — SECURITY DEFINER,
race-safe via `for update` on a materialised balance row or serialisable retry),
`teacher-dashboard.html`/`teacher-tasks.html` marking queue UI (balance chip +
"insufficient" state), `admin` usage tab (burn chart), NEW Stripe credit-pack
one-time products in B2's checkout function (mode:'payment').

**Rules:** 1 credit = 1 marked answer (simple, explainable). Batch click of 20 =
20 credits, refunded individually for answers Gemini failed on. Ledger is
append-only; balance = sum(delta); nightly sanity job optional (Phase C).

**Verification:** balance 3 → click suggest on 5 answers → 3 marked, clear
"needs 2 more credits" message, ledger shows -3; Gemini error on one → +1 refund
row; concurrent double-click cannot double-spend (test with two rapid calls);
solo student sees personal balance on task results page.

**Commit:** `AI marking credit metering: atomic spend/refund ledger + balance UI`

**▶ AGENT PROMPT (WP-B3)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-B3, netlify/functions/suggest-marks.js
(entire flow), supabase/ai-marking.sql, supabase/billing.sql, teacher-tasks.html
marking queue UI. Task: implement WP-B3 exactly. The spend must be atomic and
race-safe — write the RPC so two concurrent spends cannot both succeed past the
balance (use select ... for update on a balances row maintained by trigger, or
an advisory lock keyed on owner id; prove it in a comment). UI states: normal /
low (<20) / empty. Do not change the AI suggest→teacher release design. Verify
per WP incl. the concurrency test (two parallel curl calls); stop and report.
```

---

### WP-B4 — Solo-student mode (subscription without a teacher)

**Goal:** the self-signup student with an active subscription gets the full
self-guided experience answered in the product decisions: all topics unlocked,
Daily Revise + Review Calendar auto-on, self-assigned practice tasks, self-serve
AI marking against their own credits.

**How teacherless features resolve (the user's "how will that work?" answer):**
- **Topic access:** has_subject_access(via='subscription') → topic-guard treats
  as `student_controlled` mode: nothing locked, no teacher gate. Daily Revise
  settings RPC returns student_controlled defaults (all topics active, no cap,
  5s/5s pacing) when no class row exists for that subject.
- **Tasks:** NEW "Practice task" builder for solo students — a trimmed copy of
  the worksheet picker flow (pick topics → n questions → due date optional) that
  creates a task assigned to THEMSELVES (tasks.created_by = student,
  class_id null, new tasks.kind='self'). RLS: self-tasks visible only to creator.
  They appear in the merged calendar as tasks (own colour rules apply).
- **AI marking:** on a self-task's written answers, the student can click
  "✨ AI feedback" — same suggest-marks function, but for kind='self' tasks the
  suggestion is auto-released as the mark (no teacher exists to release; the
  'AI suggests, teacher releases' design explicitly applies only to class tasks).
  Spends THEIR credits (B3). Clear labelling: "AI-marked — indicative only".
- **Leaderboards/class gamification:** solo students see personal XP/badges/
  streaks only (class-gamification panels hidden when classless) — verify
  gamification.js guards.
- **Joining a class later:** redeem code (A2) → that subject's class controls
  take over (daily-revise settings, teacher tasks); their history stays.

**Files:** `topic-guard.js` + `supabase/daily-revise-functions.sql` (defaults
when classless-but-entitled), `dashboard.html` (self-task builder entry),
NEW `practice-builder.html` (or a dashboard modal — builder UI), tasks RPCs in
`supabase/tasks-schema.sql` (kind='self', create_self_task), `task.html`
(AI feedback button on own written answers for self-tasks),
`netlify/functions/suggest-marks.js` (self-task path: caller = task creator,
auto-release, spend student credits).

**Verification:** solo test account with active economics sub: every topic open;
daily revise serves questions with no class settings row; builds a 10-question
self-task → appears on calendar → completes it → AI feedback on written answer
spends own credits and shows mark immediately; joins a business class via code →
business behaves class-controlled, economics stays self-guided.

**Commit:** `Solo-student mode: self-guided access, self-tasks, self-serve AI marking`

**▶ AGENT PROMPT (WP-B4)**
```
Read first: PLATFORM-V2-MASTER-PLAN.md §WP-B4 (the teacherless-resolution rules
are binding), topic-guard.js, supabase/daily-revise-functions.sql,
supabase/tasks-schema.sql (tasks/assignments/attempts + RLS),
teacher-worksheets.html picker (you will trim a copy for the builder — note the
sync-rule applies only to the two teacher pages, your copy is separate),
netlify/functions/suggest-marks.js, gamification.js class guards. Task:
implement WP-B4 exactly. kind='self' must be impossible to attach to a class_id
(check constraint). Auto-release path only for kind='self'. Verify per WP list;
stop and report.
```

---

### WP-B5 — School-admin role (phase-2 admin)

**Goal:** a school coordinator manages their own school: sees seats/usage,
invites/deactivates teachers, sees credit balance (cannot grant), buys credit
top-ups via Stripe invoice link (optional), all scoped by school_id.

**Files:** `admin/school.html` (scoped portal), `supabase/billing.sql`
(school_admin RLS policies: `school_members.role='school_admin'` +
school-scoped RPCs), `teacher-signup.js` (invite emails carry school_id),
admin portal (owner can appoint school_admins).

Details deferred until B1–B4 are live; keep this WP as the placeholder.

**Commit:** `School-admin scoped portal`

---

## 4. PHASE C — polish & scale (post-billing)

- **WP-C1 — Global restyle:** the requested button/link/nav redesign to the
  Vidya language in one sweep: shared button classes into style.css +
  business-style.css, localStorage prefix rename `gcse_/geo_ → vidya_` WITH a
  one-time migration shim (read old key → write new → delete old), favicon/logo,
  page titles. One WP so the whole site changes together. **Requires explicit
  owner sign-off on a style tile (agent produces a styles.html preview page
  first, owner approves, then rollout).**
- **WP-C2 — Transactional email:** Resend/Postmark for auth emails (custom SMTP
  in Supabase), task-assigned/marked notifications (opt-in), receipts (Stripe
  sends its own), weekly parent/self digest (optional).
- **WP-C3 — Observability:** Sentry (front-end + functions), uptime monitor,
  Supabase log drains; error budget doc.
- **WP-C4 — Data lifecycle:** Supabase PITR/backups verified restore, account
  deletion (right-to-erasure admin tool + self-serve), data export per school
  (CSV bundle), retention policy in DPIA.md updated for billing data.
- **WP-C5 — Question quality loop:** "⚑ Report this question" on every player →
  table + admin queue → pipeline fix workflow.
- **WP-C6 — Performance:** bank pagination for teacher pickers (economics bank
  will grow), image optimisation, HTTP caching headers for /subjects assets
  (immutable + build hash), Lighthouse pass on top 10 pages.
- **WP-C7 — CS extra activity types** (code tracing, algorithm ordering,
  data-rep drills) — the deferred MULTI-SUBJECT-PLAN item; big, separate design.

---

## 5. Gap analysis — things the owner didn't ask for but WILL need

Defaults chosen so agents can proceed; owner can override any of these.

| # | Gap | Default decision baked into this plan |
|---|---|---|
| G1 | **Email deliverability** — Supabase default SMTP is dev-only (rate-limited, spam-prone) | WP-C2 Resend with custom domain; needed before real school onboarding |
| G2 | **Children's data / GDPR** — self-signup means under-13s possible; UK Children's Code applies (docs/DPIA.md + childrens-code.html exist for class accounts) | signup asks DOB band; under-13 self-signup requires parent email confirmation loop; DPIA updated in WP-B2; solo subscriptions marketed to parents |
| G3 | **OCR exam-content copyright** ⚠ LEGAL | RESOLVED BY PLAN: free-for-our-school year means classroom-aid use for now; **`CONTENT-REWRITE-PLAN.md` (Phase R) rewrites all OCR-derived content before any paid launch** and gates Phase B. Immediate hygiene done: eco resources/ gitignored, robots.txt, WP-A3 gating prioritised, write-clean rules (§3 of that plan) apply to all new content from today. |
| G4 | **Terms/pricing pages** — terms.html predates billing | WP-B2 updates terms + refund policy + acceptable-use for subscriptions; cookie policy already exists |
| G5 | **Staging environment** | Netlify branch deploys + a SECOND Supabase project (free tier) seeded by pipeline; SETUP.md gains a staging section (WP-A9 uses it) |
| G6 | **Bot signups** | Cloudflare Turnstile on signup + join-code page (free, accessible) — added in WP-A1 if keys provided, else WP-C |
| G7 | **Account sharing** | Supabase sessions: limit to 3 concurrent refresh tokens (dashboard setting); integrity event on >2 device fingerprints/day (WP-A8 data); enforcement decision deferred |
| G8 | **Support channel** | help.html + mailto in footer (Phase A quick add inside WP-A6); proper helpdesk deferred |
| G9 | **Analytics** | Plausible (privacy-friendly, no cookie banner change) — script include in WP-A6 landing + hub only |
| G10 | **Teacher onboarding** | demo class with sample students/data auto-created on first teacher login (Phase C; teacher-signup function seeds it) |
| G11 | **Multi-school teachers** | school_members allows N schools per teacher; UI assumes 1 until B5 |
| G12 | **Payment failure UX** | 7-day grace → read-only (can see progress, no new questions) → locked; implemented via subscription status in has_subject_access (WP-B2) |
| G13 | **Timezones** | UK-only assumption everywhere (dates already Europe/London); revisit only if selling abroad |
| G14 | **Curriculum coverage for mocks** | Economics content build (19 topics remaining) continues in parallel sessions — THE biggest mocks risk is content, not features; owner should keep at least one session on content while agents do Phase A |

---

## 6. Sequencing with parallel Claude sessions (owner's working style)

**Master timeline (updated for the free year):**
```
2026-07 → 2026-10   Phase A (WP-A0…A9) + economics content completion
                    (new content follows CONTENT-REWRITE-PLAN.md §3 write-clean)
2026-10 → 2027-02   Phase C polish as wanted; MOCKS SUPPORT is the priority
~16 weeks before    CONTENT-REWRITE-PLAN.md Phase R0→R5 (content rewrite)
paid launch
2027-28 year        Commercial go? → unpark Phase B (B1→B5) → paid launch
```

- Content building (economics 3.1→4.4) is **file-disjoint** from Phase A WPs
  except the pipeline reseed — safe in parallel; always `git pull` before reseed.
  New topics keep the verbatim recipe per CONTENT-REWRITE-PLAN.md §3 Option A
  (owner's choice for mock fidelity); keep exam material in its standard fields
  and the `-extracted` image suffix so the Phase R inventory can find it all.
- Never run two WPs that both touch `tasks-shared.js`, `script.js`, or any
  `supabase/*.sql` at the same time. The per-WP file lists are the lock table.
- WP-A6 (landing) + WP-A5 (calendar) is the recommended first parallel pair.
- Commit after every WP (one commit per WP, message given) so parallel sessions
  rebase cleanly.

## 7. What was already fixed in this session (do not redo)

1. `taskRichText()`/`taskStripTags()` in tasks-shared.js + applied at every
   escaped bank-content render site (daily-revise.js, review-calendar.js,
   task.html, teacher-tasks.html, teacher-worksheets.html, teacher-analytics.html).
   review-calendar feedback now renders markScheme HTML like daily-revise does.
2. Subject persistence (`gcse_last_subject`) in subject-loader.js; subject-aware
   links in account-cluster.js (+ new "My Subjects" item), script.js site-nav,
   gamification.js topic-nav/celebration, dashboard.html Daily Revise CTA
   (`#dailyReviseLink` wired in initReviewCalendarCard), business index nav.
   Naked `daily-revise.html` now resolves to the student's last subject.

