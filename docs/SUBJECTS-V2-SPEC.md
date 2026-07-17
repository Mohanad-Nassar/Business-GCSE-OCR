# Subjects V2 — teacher "Subjects" workspace (spec + phased plan)

**Status:** DRAFT for review (2026-07-15). No code written yet — this is the design
the build follows once approved.
**Supersedes the "My Content" page** ([teacher-subjects.html](../teacher-subjects.html)),
renaming it **Subjects** and turning it into a tabbed workspace.
**Builds on:** [docs/TEACHER-SUBJECTS-SPEC.md](TEACHER-SUBJECTS-SPEC.md) (teacher-authored
subjects), [supabase/school-admin.sql](../supabase/school-admin.sql) (two-tier *use*
access), [supabase/schools.sql](../supabase/schools.sql) (owner → school_admin → teacher).

---

## 1. Goal (one sentence)

> A teacher opens **Subjects** and, in one place, can browse every subject they're
> allowed to touch, edit a school-specific copy of a platform subject (when granted),
> build their own subjects, and share subjects with colleagues — with the owner and
> school admin holding tight, auditable control over who can do what.

---

## 2. Locked decisions (from the 2026-07-15 requirements Q&A)

| # | Decision | Why (recorded so it isn't relitigated) |
|---|----------|----------------------------------------|
| D1 | **Platform-subject edits = per-school override-layer fork.** Editing never touches the shared master; a school copy stores only the topics it changed, and untouched topics keep rendering from (and receiving fixes to) the master. | User chose "Override layer (tracks master)". Keeps master pristine across all schools; keeps school content fresh. |
| D2 | **One shared school copy**, not per-teacher. All granted teachers in a school co-edit the same fork; that school's students see it. | Matches the owner→school→teacher grant chain and the fact that students belong to a school. |
| D3 | **Edit grant chain for platform subjects:** platform **owner** grants a **school** the right to edit a subject; the **school_admin** then grants individual **teachers** within that set. A teacher can never exceed the school's set. | Mirrors the existing *use*-access two-tier model in school-admin.sql, so it's a familiar, proven shape. |
| D4 | **Teacher-to-teacher sharing is teacher-controlled but admin-visible.** A teacher shares their *own* subject with a specific colleague or the whole school without approval; every share is visible to (and revocable by) the school_admin. | User chose "Admin-visible, teacher-controlled". Autonomy + oversight. |
| D5 | **External sharing (outside the school) requires a request to the school_admin**, who sees the requester, the invitee's name + email, the timestamp, and the reason. | User's exact wording. School is the data-isolation boundary; crossing it is an admin decision. |
| D6 | **External invitees may be brand-new people** (no account yet): on approval they get a signup invite and land with the shared subject. | User chose "Allow new-person invites". |
| D7 | **Request-to-edit** (a view-only viewer asking for edit) can be approved by **the content owner OR a school_admin**. | User chose "Owner + school admin". |
| D8 | **Tabs:** *All* · *Platform* · *My subjects* · *Shared with me* (final wording in §4). | Naming delegated to us; these read plainly to a non-technical teacher. |

**Non-negotiable quality bar (user's words):** highest standard of authentication,
authorization and security — no exploitable gaps, no cross-tenant leakage,
full owner control cascading owner → school_admin → teacher. §8 is the security
contract this build is held to.

---

## 3. Subject taxonomy (the mental model)

Every `subjects` row is exactly one of:

- **Platform subject** — `created_by IS NULL` (Business / Computer Science /
  Economics). Static content under `/subjects/<slug>/…`, edge-gated. Shared by
  every school. **Read-only master, forever.**
- **Teacher subject** — `created_by = <a teacher>`. Content in `custom_topics`,
  rendered by `topic.html`. Owned and edited by that teacher.

V2 adds two *relationships* on top, neither of which mutates the taxonomy:

- **School override** of a platform subject — a `subject_overrides` layer
  (per school) that the renderer swaps in for that school's students. The
  platform row stays `created_by IS NULL`.
- **Share** of a teacher subject — a `subject_shares` grant to another teacher
  or a whole school, at `view` or `edit` level.

Keeping the taxonomy binary means the existing engine (classes bind to
`subject_id`, `record_progress` keys on `slug:topic`, entitlements, the hub,
Daily Revise) needs **no change** — V2 layers alongside it.

---

## 4. The Subjects page — tabs & behaviour

Header: **📚 Subjects** (was "🎨 My Content"). Sub-tabs (buttons, same
`.subtab` style already in the page):

### Tab 1 · **All**
Every subject the teacher may touch, in any capacity, one card each, deduped.
Each card carries a **relationship badge** so "why can I see this?" is never
ambiguous:

- `Platform · assigned` — usable (assign to a class), read-only.
- `Platform · editable` — the teacher holds an edit grant → **Edit school copy** button.
- `Mine` — created_by me.
- `Shared · can view` / `Shared · can edit` — shared by a colleague.

Search box + a relationship filter. This tab is a *view* — actions live on the
type-specific tabs, but primary actions (Open, Edit) are duplicated here for
convenience.

### Tab 2 · **Platform**
The official subjects the teacher's school is allowed to use (from the existing
`effective_teacher_subjects`). For each:

- Always: **Open / assign to a class**.
- If the teacher has **edit access** (D3): **✏️ Edit school copy** → opens the
  override editor (§7.1). Badge shows "School copy — N topics customised".
- If **not** granted edit but the school *is* allowed to edit it: **Request to
  edit** (→ §7.4).
- If the school isn't allowed to edit it at all: no edit affordance (deny by default).

### Tab 3 · **My subjects**
Exactly today's manager grid + 4-step wizard (unchanged behaviour), plus a
**Share** action per card (§7.2). This is the only tab where **Create a new
subject** lives.

### Tab 4 · **Shared with me**
Subjects colleagues have shared with the teacher:

- `can edit` → opens the wizard in edit mode (scoped by RLS to what they're
  allowed to change).
- `can view` → read-only preview + **Request to edit** (§7.4).
- A small **"My requests"** strip at the top shows the status of the teacher's
  own pending edit-requests and external-invite requests (pending / approved /
  denied) so they get closure without a direct table read.

> **Owner/school_admin management** of the *grant chains* (who may edit which
> platform subject; auditing/revoking shares; approving external invites and
> edit-requests) lives in **[admin.html](../admin.html)**, extending its existing
> tabbed shell — NOT on the teacher Subjects page. The teacher page only ever
> shows a teacher their own capabilities.

---

## 5. Data model (draft schema — new tables only)

All new tables get **RLS ON at creation**, policies per operation, and are
tested as another user before ship (§8). Everything below is illustrative and
finalised in the migration file `supabase/subjects-v2.sql` during the build.

```sql
-- ─────────────────────────────────────────────────────────────
-- 5.1  PLATFORM-SUBJECT EDIT GRANTS (control plane for D3)
-- ─────────────────────────────────────────────────────────────

-- Owner grants a SCHOOL the right to fork/edit a platform subject.
create table subject_school_edit_grants (
    school_id  uuid not null references schools(id)  on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,  -- platform (created_by is null)
    granted_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (school_id, subject_id)
);

-- School_admin grants a TEACHER edit rights, CLAMPED to the school's grants.
create table teacher_subject_edit_access (
    profile_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    granted_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (profile_id, subject_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5.2  OVERRIDE LAYER (the fork content, D1/D2)
-- ─────────────────────────────────────────────────────────────

-- One row per (school, platform subject, topic) the school has customised.
-- No row ⇒ that topic renders from the static master. Same 9-activity
-- `sections` shape as custom_topics, so the editor + custom-bank + topic.html
-- renderer are REUSED, not reinvented.
create table subject_overrides (
    id         uuid primary key default gen_random_uuid(),
    school_id  uuid not null references schools(id)  on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,   -- platform subject
    topic_slug text not null,                 -- the master topic's page-id tail (e.g. '2_4_marketing_mix')
    title      text,                          -- optional label override; null = keep master's
    section    text not null default '',
    sections   jsonb not null default '{}'::jsonb check (char_length(sections::text) <= 600000),
    status     text not null default 'draft' check (status in ('draft','published')),
    updated_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (school_id, subject_id, topic_slug)
);

-- ─────────────────────────────────────────────────────────────
-- 5.3  TEACHER-TO-TEACHER SHARES (D4)
-- ─────────────────────────────────────────────────────────────

-- Exactly one of grantee_profile_id / grantee_school_id is set.
create table subject_shares (
    id                 uuid primary key default gen_random_uuid(),
    subject_id         uuid not null references subjects(id) on delete cascade,  -- must be a TEACHER subject
    grantee_profile_id uuid references profiles(id) on delete cascade,
    grantee_school_id  uuid references schools(id)  on delete cascade,
    access             text not null default 'view' check (access in ('view','edit')),
    shared_by          uuid not null references profiles(id) on delete cascade,
    created_at         timestamptz not null default now(),
    check ( (grantee_profile_id is not null) <> (grantee_school_id is not null) )
);
create unique index subject_shares_one_per_teacher
    on subject_shares (subject_id, grantee_profile_id) where grantee_profile_id is not null;
create unique index subject_shares_one_per_school
    on subject_shares (subject_id, grantee_school_id)  where grantee_school_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 5.4  EXTERNAL SHARE REQUESTS (D5/D6 — admin-approved, new people allowed)
-- ─────────────────────────────────────────────────────────────

create table subject_external_share_requests (
    id            uuid primary key default gen_random_uuid(),
    subject_id    uuid not null references subjects(id) on delete cascade,
    requested_by  uuid not null references profiles(id) on delete cascade,
    school_id     uuid not null references schools(id)  on delete cascade,  -- approver scope
    invitee_name  text not null check (char_length(invitee_name)  between 1 and 120),
    invitee_email text not null check (char_length(invitee_email) between 3 and 200),
    access        text not null default 'view' check (access in ('view','edit')),
    reason        text not null check (char_length(reason) between 1 and 1000),
    status        text not null default 'pending'
                  check (status in ('pending','approved','denied','revoked')),
    resolved_by   uuid references profiles(id) on delete set null,
    resolved_at   timestamptz,
    created_at    timestamptz not null default now()
);
-- invite token for a NEW-account invitee lives in a separate, service-role-only
-- table (never exposed to clients): external_share_invite_tokens(token_hash,
-- request_id, expires_at, consumed_at). Token is single-use, hashed at rest,
-- ≤ 72h expiry — same hygiene as a password-reset token.

-- ─────────────────────────────────────────────────────────────
-- 5.5  REQUEST-TO-EDIT (D7 — view→edit escalation)
-- ─────────────────────────────────────────────────────────────

create table subject_edit_requests (
    id           uuid primary key default gen_random_uuid(),
    subject_id   uuid not null references subjects(id) on delete cascade,
    requested_by uuid not null references profiles(id) on delete cascade,
    scope        text not null check (scope in ('shared','platform_fork')),
    reason       text check (char_length(reason) <= 1000),
    status       text not null default 'pending' check (status in ('pending','approved','denied')),
    resolved_by  uuid references profiles(id) on delete set null,
    resolved_at  timestamptz,
    created_at   timestamptz not null default now()
);
create unique index subject_edit_requests_one_pending
    on subject_edit_requests (subject_id, requested_by) where status = 'pending';
```

Every destructive/admin mutation is written to the existing `admin_audit_log`
(actor, school, action, target, detail, timestamp).

---

## 6. Authorization model

### 6.1 Roles (unchanged, server-resolved only)
`owner` (`profiles.is_owner`) ▸ `school_admin` (`school_members.role`) ▸
`teacher` ▸ `student`. **Role is always read from the session server-side**
(`auth.uid()` → `profiles`/`school_members`); never from a request body.

### 6.2 Capability matrix

| Capability | owner | school_admin (own school) | teacher | student |
|---|---|---|---|---|
| Grant a **school** edit rights on a platform subject | ✅ | ❌ | ❌ | ❌ |
| Grant a **teacher** edit rights (within school's set) | ✅ | ✅ | ❌ | ❌ |
| Edit a platform subject's **school override** | ✅ | ✅ if granted | ✅ if granted | ❌ |
| See published override (as the school's student) | — | — | — | ✅ (own school only) |
| Create / edit **own** teacher subject | ✅ | ✅ | ✅ (own) | ❌ |
| **Share** own subject in-school (view/edit) | ✅ | ✅ | ✅ (own) | ❌ |
| See/revoke **any share** in the school | ✅ | ✅ | ❌ | ❌ |
| **Request** external share | ✅ | ✅ | ✅ | ❌ |
| **Approve** external share | ✅ | ✅ | ❌ | ❌ |
| Edit a **shared** subject | per grant | per grant | per grant (view/edit) | ❌ |
| **Request to edit** a view-only subject | ✅ | ✅ | ✅ | ❌ |
| **Approve** a request-to-edit | ✅ (content owner or admin) | ✅ | ✅ if they own the content | ❌ |

### 6.3 Central guards (SECURITY DEFINER, fixed `search_path = public`)
Reused where they exist; new ones mirror their shape.

- `_is_owner()`, `is_school_admin(school)`, `is_school_admin_over(profile)`,
  `_school_of(profile)` — **exist today** (schools.sql / school-admin.sql).
- `can_edit_platform_subject(subject_id)` *(new)* — true iff the caller is
  owner, OR (holds `teacher_subject_edit_access` for the subject **AND** the
  caller's school holds a `subject_school_edit_grants` row for it). The AND is
  the clamp — a stale teacher grant is void the moment the school grant is
  revoked, without touching the teacher rows.
- `can_edit_subject(subject_id)` *(new)* — true iff caller `created_by` owns it,
  OR holds an `edit` `subject_shares` grant (direct or whole-school).
- `can_view_subject(subject_id)` *(new)* — the above, plus `view` shares, plus
  enrolment.
- `_student_school_for_subject(subject_id)` *(new)* — resolves the viewing
  student's school for a subject via their class → class_teachers →
  school_members, so override resolution can't be spoofed by the client.

### 6.4 RLS sketch (the real gate — UI hiding is cosmetic only)

- `subject_school_edit_grants`: owner ALL; school members SELECT their own
  school's rows (to know the set). Writes via `set_school_edit_subjects()` RPC
  (owner-only), never direct.
- `teacher_subject_edit_access`: self SELECT; admin-over SELECT. Writes via
  `set_teacher_edit_subjects()` (owner/admin, clamped) only.
- `subject_overrides`:
  - teacher/admin SELECT+INSERT+UPDATE+DELETE **only when
    `can_edit_platform_subject(subject_id)` AND `school_id = _school_of(auth.uid())`**
    (both `USING` and `WITH CHECK` — so a granted teacher can't write another
    school's override by supplying a different `school_id`).
  - student SELECT **only** `status='published' AND school_id =
    _student_school_for_subject(subject_id)`.
- `subject_shares`: subject owner ALL (their own subject's shares);
  grantee SELECT (rows granting them); school_admin SELECT+DELETE for shares
  whose subject owner or grantee is in their school (the "admin-visible +
  revocable" of D4). No self-INSERT except by the owner.
- `subject_external_share_requests`: requester SELECT own; school_admin
  SELECT+UPDATE for `school_id` they administer; INSERT via
  `request_external_share()` RPC (validates the requester owns the subject).
- `subject_edit_requests`: requester SELECT own + INSERT via
  `request_subject_edit()`; approver (content owner or school_admin) SELECT +
  resolve via RPC.
- The extended **`subjects` read policy** gains `can_view_subject(id)` so a
  grantee/enrolled user can read the row; the existing
  `subjects_owner_update` stays owner-only (shares never let a grantee mutate
  the *subject row* — only its `custom_topics`, gated separately).
- The **`custom_topics` policies** extend: the current
  `custom_topics_teacher_all` (owner-only) gains an OR for `edit`-share holders;
  a new SELECT policy admits `view`-share holders (drafts included for editors,
  published-only for viewers) — carefully split so a `view` grant can never write.

### 6.5 Mutations are RPC-only where they cross a privilege boundary
Grant-setting, external-invite approval, edit-request resolution, and override
publish/bank-sync go through `SECURITY DEFINER` RPCs that re-check the guard and
write the audit row **in the same transaction** (so state and audit can't drift,
same pattern as `resolve_topic_access_request`). Clients never write those
tables directly.

---

## 7. The four capabilities in detail

### 7.1 Platform-subject editing = override-layer fork (D1/D2) — *the hard one*

**The core problem:** platform topics are **static HTML files** served by Netlify
under `/subjects/<slug>/…` (behind the [edge content-gate](../netlify/edge-functions/content-gate.ts)),
NOT database rows. There is no per-school variant of a static file. So "serve
school X's version of topic 2.4 to school X's students, and the master to
everyone else" has to be solved at routing/render time.

**Chosen approach — edge redirect + dynamic render, master untouched:**

1. **Authoring.** A granted teacher clicks *Edit school copy*. The override
   editor is the **existing 9-activity wizard**, writing to `subject_overrides`
   (one row per customised topic) instead of `custom_topics`. Topic list is the
   master's topic tree (from the generated `page-groups`/`section-totals` for
   that subject); editing a topic for the first time creates its override row,
   seeded (optionally) by importing the master topic's current content so the
   teacher edits *from* the real lesson rather than a blank page. Untouched
   topics never get a row.
2. **Serving to students.** Extend `edge_gate_check` (already called + cached
   per request by the content-gate) to also return, for the caller's school, the
   set of `topic_slug`s that have a **published** override for that subject. When
   the requested static topic path is in that set, the edge **302-redirects to
   `topic.html?s=<slug>&t=<topic_slug>`** (the existing dynamic renderer), which
   loads the override `sections` and renders identically to a teacher subject.
   Non-overridden topics serve the static master file as today (fast, cached).
   Because this is enforced at the **edge**, a student can't route around it to
   reach the un-customised master.
3. **Progress / bank / analytics parity.** `page_id` stays
   `<slug>:<topic_slug>` for both master and override, so `record_progress`,
   progress summaries, spaced repetition and teacher dashboards need **zero**
   change. Override questions sync into `bank_questions` under the **same
   subject_slug** but MUST be **school-scoped** so school X's customised
   questions don't leak into school Y's Daily Revise — this requires a
   `school_id` dimension on the synced rows (or a school-suffixed
   `question_key` namespace). **This is the single biggest integration risk and
   gets a de-risking spike before Phase S5 is committed** (§10).
4. **Freshness.** Because only changed topics have override rows, a master
   content fix automatically reaches every school for every topic they haven't
   customised — the property the user picked D1 for.

**Scope of an override (v1):** per-topic *content* only (the 9 activities).
Structural changes (adding/removing/reordering topics or renaming the subject)
are **out of scope for the fork** — those would diverge the school from the
master's page tree and break the "tracks master" guarantee. Recorded as a
Won't-this-time (§11); revisit only with a concrete need.

### 7.2 Teacher-to-teacher sharing (D4)

From a *My subjects* card → **Share**:
- Pick **a specific teacher in my school** (typeahead over school members) or
  **the whole school**, and a level: **can view** / **can edit**.
- Writes a `subject_shares` row via `share_subject()` RPC (validates caller owns
  the subject; grantee is in the caller's school). No admin step (D4).
- Appears immediately in the grantee's **Shared with me** tab, and in the
  **school_admin's admin panel**, which can revoke any of it.
- `edit` shares let the grantee open the wizard and change `custom_topics`
  (RLS-enforced); `view` shares are read-only preview. A grantee can never
  delete the subject, change its owner, or re-share it (no transitive sharing).

### 7.3 External sharing via admin request (D5/D6)

From a *My subjects* card → **Share outside my school**:
- Teacher submits invitee **name + email + access level + reason**; creates a
  `subject_external_share_requests` row (status `pending`) via
  `request_external_share()`.
- The **school_admin** sees the full request in admin.html — requester,
  invitee name/email, timestamp, reason, requested access — and
  **Approves / Denies** (`resolve_external_share()`):
  - **Invitee already has an account** → create a `subject_shares` row for them
    directly.
  - **New person** → mint a single-use, hashed, ≤72h **invite token**
    (service-role table), email a signup link; on signup the teacher-signup
    function consumes the token, provisions the account, attaches the share, and
    marks the request `approved`. (Reuses the school-invite consumption pattern
    in schools.sql.)
- Every transition is audited. A denied/expired request grants nothing.

### 7.4 Request-to-edit (D7)

On any **view-only** subject (shared or a platform subject the school may edit
but the teacher isn't yet granted): **Request to edit** → `subject_edit_requests`
row (`scope` = `shared` | `platform_fork`) via `request_subject_edit()`.
- **shared** → approvable by the subject's **owner** *or* a **school_admin**.
  Approval writes an `edit` `subject_shares` grant.
- **platform_fork** → approvable by a **school_admin** *or* **owner**. Approval
  writes a `teacher_subject_edit_access` row (still clamped to the school grant).
- One pending request per (subject, requester) — the unique partial index stops
  queue spam, same trick as `topic_access_requests`.

---

## 8. Security contract (the bar this build is held to)

Threats considered and how each is closed. This is the checklist the security
review (and `security-auditor` subagent, if run) verifies before any phase ships.

| Threat | Mitigation |
|---|---|
| **Cross-school data leak** (teacher/student of school A reads or writes school B's override/share) | Every override policy pins `school_id = _school_of(auth.uid())` in **both** `USING` and `WITH CHECK`; student override reads pin `_student_school_for_subject()` (server-derived, not client-supplied). Shares are school-scoped in RLS. |
| **Privilege escalation** (teacher self-grants platform edit, or raises own role) | Grant tables have **no self-INSERT policy**; writes are owner/admin-only RPCs that re-check `_is_owner()` / `is_school_admin_over()`. The existing `_profiles_block_privilege_change` trigger already pins role/school_id. |
| **Stale-grant bypass** (school grant revoked but teacher row lingers) | `can_edit_platform_subject()` requires **both** rows live (AND-clamp), so revoking the school grant instantly voids every teacher under it. |
| **Master corruption** (an edit reaches other schools / the real master) | Overrides are a separate table; the platform `subjects`/static files are never written by any V2 path. `subjects_owner_update` stays `created_by = auth.uid()` (null for platform ⇒ nobody). |
| **IDOR** on any request/share id | All resolve/approve RPCs re-fetch the row and re-check the approver guard before acting; no action trusts a client-passed role or ownership claim. |
| **XSS via authored content** | Unchanged from teacher subjects: all `sections` HTML is `RichText.sanitize()`d on save, import **and** render (allowlist); plain fields escaped at output. Override editor reuses the same path. |
| **Bank cross-contamination** | Override bank rows are school-scoped (§7.1 step 3); the sync RPC validates the caller's edit grant, the subject slug, published topics only, and shape — mirroring `sync_teacher_subject_bank`'s hard validation. |
| **Token abuse** (external invite) | Single-use, hashed-at-rest, short-expiry token in a service-role-only table; consumed transactionally at signup; released/void on failure. Never returned to a client. |
| **Request/share spam** | Unique partial indexes for one pending edit-request per (subject, requester); RPCs are idempotent no-ops on an existing pending row. |
| **Enumeration** (probing who has what) | Read policies are ownership/membership-scoped; no RPC returns another school's members or shares to a plain teacher. Admin reads are `is_school_admin`-gated `SECURITY DEFINER`. |
| **Auditability** | Every grant, approval, revoke and role change writes `admin_audit_log` (actor + target + timestamp + detail) in the mutating transaction. |

**Per-phase gate:** run the §8 review checklist from the `auth-authz` skill
("logged-out reach? user B reach user A? low role reach high action? role from
session? RLS on + tested as another user?") and prove each new policy **as a
second user and as anon**, not just as the owner. No phase merges on the happy
path alone.

---

## 9. Admin surfaces (owner + school_admin) — in admin.html

Extends the existing tabbed admin shell (school-admin.sql already feeds it):

- **Owner:** a per-school grid to set `subject_school_edit_grants` (which
  platform subjects each school may fork) — sits next to the existing *use*
  allow-list. `set_school_edit_subjects(school, subject_ids[])`.
- **School_admin:** a per-teacher grid to set `teacher_subject_edit_access`
  (clamped to the school's edit grants) — next to the existing per-teacher *use*
  grid. `set_teacher_edit_subjects(profile, subject_ids[])`.
- **School_admin:** an **External invite requests** queue (D5) and a **Shares**
  audit list (D4) with revoke.
- **Both:** the audit log already rendered by `get_teacher_admin_overview`
  gains the new action types.

---

## 10. Phased build plan

Sequenced **value-first, risk-last** (walking skeleton = sharing, which is the
most-wanted and lowest-risk; the fork engine that touches the edge gate and
every render surface is last, after a spike). Each phase is independently
shippable and has its own definition of done (code **+** exercised flow **+**
security check **+** nothing adjacent broken **+** committed).

| Phase | Deliverable | New files / touched | Risk |
|---|---|---|---|
| **S0 · Retab** | Rename page to **Subjects**; 4 tabs over *today's* data (My subjects = current manager; All & Platform read `get_my_entitlements`; Shared with me empty state). No backend. | teacher-subjects.html, teacher-nav.js label | Low |
| **S1 · Sharing (in-school)** | `subject_shares` + RLS + `share_subject()`/`revoke_share()`; Share UI on My-subjects cards; Shared-with-me tab populated; admin.html shares list + revoke. | subjects-v2.sql, teacher-subjects.html, admin.html/js | Med |
| **S2 · Request-to-edit** | `subject_edit_requests` + RPCs; Request-to-edit buttons; approver flow (owner/admin); "My requests" strip; notifications hook (reuse teacher-notifications). | subjects-v2.sql, teacher-subjects.html, admin.html/js, teacher-notifications | Med |
| **S3 · External invites** | `subject_external_share_requests` + token table + request/resolve RPCs; teacher-signup token consumption for new people; admin queue. | subjects-v2.sql, netlify/functions/teacher-signup.js, admin.html/js | Med-High |
| **S4 · Platform edit grants (control plane)** | `subject_school_edit_grants` + `teacher_subject_edit_access` + `can_edit_platform_subject()` + owner/admin grids. Platform tab shows "editable" + Request-to-edit, **no content editing yet**. | subjects-v2.sql, admin.html/js, teacher-subjects.html | Med |
| **SPIKE** | **De-risk the fork before S5:** prove (a) edge can cheaply learn a school's published-override set and redirect only those paths; (b) school-scoped override bank rows don't leak across schools in Daily Revise; (c) topic.html renders an override with full parity. Timebox; write findings into this doc. | throwaway branch / notes | — |
| **S5 · Override-layer fork engine** | `subject_overrides` + RLS + override editor (reuse wizard) + edge redirect + `topic.html` override load + school-scoped bank sync + all teacher/student surfaces resolve overrides. | subjects-v2.sql, content-gate.ts, edge_gate_check, topic.html, custom-bank.js, teacher-subjects.html | **High** |

**Dependencies:** S0 → (S1 → S2 → S3) can proceed independently of (S4 →
SPIKE → S5). S1 before S2 (edit-requests grant shares). S4 before S5 (grants
gate the editor). Schema → RLS → RPC → UI within every phase (never UI against
an imagined API).

**Parallelisation:** S1–S3 and S4 touch mostly disjoint files **except**
`subjects-v2.sql`, `teacher-subjects.html`, and `admin.html` — those three are
shared, so phases editing them run **sequentially**, not in parallel agents
(house rule: partition by files). One migration file, appended per phase.

---

## 10b. S5 spike protocol (designed 2026-07-15 — run before any S5 code)

Three questions, each with a concrete experiment and a pass/fail gate. Timebox:
one focused session. Findings get written back into this section; S5 starts only
when all three pass (or the design is amended to route around a failure).

**Q1 · Edge override lookup.** Can the edge learn "which topic slugs have a
published override for THIS student's school+subject" inside the existing single
`edge_gate_check` round-trip (cached 60s per token+subject)?
*Experiment:* extend `edge_gate_check(p_subject)` to also return
`override_slugs text[]` resolved via `_student_school_for_subject()`; measure the
added query cost on a seeded `subject_overrides` table (~50 rows). Update
content-gate.ts to 302 any `/subjects/<slug>/<topic>.html` whose topic slug is in
the set → `topic.html?s=<slug>&t=<topic>&ov=school`.
*Pass:* one RPC round-trip total (no second call), redirect fires only for
overridden slugs, cache key semantics unchanged (the verdict is per token+subject
— note the school is derivable from the token, so per-token caching is correct).
*Known risk to check:* students in TWO schools' classes for one subject (should be
impossible — verify class model forbids it; if not, define precedence).

**Q2 · School-scoped bank rows.** Can school X's customised questions live in
`bank_questions` without leaking into school Y's Daily Revise / mastery?
*Experiment:* add `school_id uuid null` (null = platform master row) + widen the
unique key to (question_key) → keep question_key globally unique by namespacing
override keys as `<subject>:<topic>:ovr:<school_id_prefix>:<hash>`; then patch the
TWO read paths — `get_daily_revise_queue` and `get_topic_questions` — to filter
`(school_id is null or school_id = <caller's school>)`, PREFERRING the school row
when both exist for the same logical question (master row suppressed for
overridden topics: simplest rule = when a topic slug is overridden for the
caller's school, exclude master rows for that page_id entirely).
*Pass:* seeded test shows school X's student queue contains X's override
questions and zero Y rows; Y unaffected; mastery rows keyed on the namespaced
keys don't collide.
*Decision this feeds:* whether §11.1's `school_id` column lands in
bank-questions-schema or a separate migration.

**Q3 · topic.html render parity for overrides.** Does the existing dynamic
renderer produce full parity (tabs, XP, server grading, focus mode) when fed a
`subject_overrides.sections` row instead of `custom_topics.sections`?
*Experiment:* hand-insert one override row for a business topic; point
topic.html's loader at it behind a query flag; click through all nine activities
as a student of the granted school.
*Pass:* progress records under the SAME page_id (`business:<topic-slug>`), the
server-graded sections work (P1 path), nothing double-counts.
*Dependency:* P1 server grading should be rolled out to the pilot page types
first, so parity is tested against the end-state engine, not the legacy one.

## 10c. Spike RESULTS + required design amendments (run 2026-07-16)

Verdicts: **Q1 PASS · Q2 PASS-with-caveat · Q3 PASS-with-caveat.** S5 is buildable
as designed — no re-architecture — but four corrections are LOCKED before build:

**A1 · Slug canonicalisation (blocks Q1 + Q3).** `subject_overrides.topic_slug`
MUST be the **hyphenated page-id tail** (e.g. `2-4-marketing-mix`, matching
`pageMeta.id`), NOT the underscored file tail (`2_4_marketing_mix`) shown in the
§5.2 example — that example is WRONG and would silently fork progress into a
second page_id. Three forms exist for each topic: file tail (`2_4_marketing_mix`,
what the edge matches in the URL), page-id tail (`2-4-marketing-mix`, what
progress/bank/topic.html use), and the static `pageMeta.id`. The edge derives the
file-tail↔page-id mapping from the master `page-groups.js` (href↔id), NOT a naive
`_→-`. topic_slug = the hyphen form everywhere internal.

**A2 · School-scope FIVE sites, not two.** §7/§10b said "patch the two read paths"
— that undercounts. Required: (1) `get_daily_revise_queue` filter, (2)
`get_topic_questions` filter, (3) **`grade_topic_answer`'s total-count**
(topic-grading.sql:190-192 — otherwise `total` double-counts master+override and
"done=total" is unreachable), (4) the override sync UPSERT and DELETE, (5) sweep
`get_daily_revise_settings` active_page_ids + DR-analytics denominators. Rule
everywhere: student sees `school_id is null OR school_id = <their school>`, and
master rows are SUPPRESSED for page_ids the school has overridden.

**A3 · Fork the sync function — do NOT reuse `sync_teacher_subject_bank_srv`.**
That function (a) validates page_ids against published `custom_topics` (platform
subjects have none → rejects every override row) and (b) ends with
`delete … where subject_slug = v_slug and not (question_key = any(v_kept))`
(bank-sync-hardening.sql:99-100) — for `subject_slug='business'` that would **wipe
every school's master bank**. S5 needs a sibling `sync_school_override_bank_srv`
that validates against published `subject_overrides` and pins BOTH upsert and
delete to `school_id = <school>`, never touching `school_id is null` master rows.

**A4 · Write `_student_school_for_subject()` (+ teacher branch).** Referenced
throughout the spec, defined nowhere. `_school_of()` only works for teachers
(students aren't `school_members`); the resolver needs student-via-class
(`class_students → classes → co-teacher → school_members`, pinned `not archived`)
AND teacher-via-`_school_of`. It anchors both the edge override set and the
`subject_overrides` student-read RLS.

Confirmed clean by the spike: edge one-round-trip + per-token cache = no
cross-school override-set leak (Q1); namespaced override question_keys don't
collide with master mastery rows (Q2); `isOwner=false` for platform subjects → correct
student view, progress merges under the same page_id once A1 holds (Q3); the
"student in two schools" case is forbidden at both enrolment RPCs (soft guard).

**Build order (each step green under a seeded TWO-SCHOOL test before the next):**
1. `subject_overrides` table + RLS + `_student_school_for_subject()` (subjects-v2.sql)
2. `bank_questions.school_id` + the five filter/count edits (A2) — prove school-X-only queue in isolation
3. `sync_school_override_bank_srv` fork (A3) + its sanitising Netlify function
4. `edge_gate_check` → `override_slugs`; `content-gate.ts` → 302 overridden paths
5. `topic.html` → `ov=school` load branch (canonical hyphen slug, A1)
6. Override editor (reuse wizard) + Platform-tab surfaces
§8 security-review gate (prove as anon + as a SECOND school's student) is mandatory
around the `subject_overrides` student-read RLS and the school-scoped delete.

## 11. Open questions / risks to resolve during build

1. **Override bank scoping (S5 blocker).** `bank_questions` is keyed by
   `subject_slug` with no school dimension. Cleanest fix: add `school_id`
   (nullable; null = platform master) and filter Daily Revise / mastery by the
   viewer's school for platform subjects. Confirm this is acceptable before S5 —
   it touches the DR read path. **Resolved in the SPIKE.**
2. **Edge cost.** The content-gate runs per gated request; adding override-set
   lookup must be folded into the existing 60s-cached `edge_gate_check` verdict,
   not a second round-trip. Verify cache-key shape (token+subject) still holds.
3. **New-account invitee = "teacher" with no school?** An external invitee
   accepting a share needs *some* account. Decide whether they become a
   school-less teacher who can only see the shared subject, or a member of the
   inviting school. Leaning: school-less "collaborator" account, share-only —
   confirm at S3.
4. **Whole-school `edit` shares** (D4 allows sharing edit to the whole school) —
   double-check that co-editing by many teachers on one `custom_topics` set has
   no lost-update problem (the wizard already assumes a single owner; may need
   optimistic `updated_at` checks). Flag at S1.

---

## 12. Won't-do-this-time (explicit scope fence)

- Structural forking of platform subjects (add/remove/reorder topics per school) — breaks "tracks master"; content-only overrides for now.
- Transitive re-sharing (a grantee sharing onward). Only the owner shares.
- Cross-school co-editing of one subject (shares stay within a school; external = a *copy*-style share, not shared live editing across schools) unless a concrete need appears.
- Billing / seat limits on shares (Phase B billing is parked per the platform master plan).
- Version history / rollback of overrides (nice-to-have; not v1).

---

*End of spec. Review the locked decisions (§2), the security contract (§8), and
the phase order (§10); once approved I'll start at S0 and work down.*
