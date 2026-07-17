-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM OVERRIDE-FORK · S5 STEP 1 (schema + resolver + RLS)
-- Run AFTER subjects-v2-s4-fork-grants.sql (can_edit_platform_subject) AND
-- security-hardening-2026-07.sql (is_school_admin honours removed_at). Safe to
-- re-run. Source of truth: docs/SUBJECTS-V2-SPEC.md §5, §7, §10c (spike results).
--
-- WHAT THIS IS: a school can FORK a platform topic — edit its own copy while
-- every other school keeps the untouched master static page. Only the changed
-- topic is stored (subject_overrides.sections). Master content is NEVER mutated.
-- Step 1 lays the foundation: the table, its student/editor/admin RLS, and
-- _student_school_for_subject() — the server-derived anchor that BOTH the edge
-- override lookup (step 4) and the student-read RLS below depend on.
--
-- SLUG RULE (spec §10c A1): topic_slug is the HYPHENATED page-id tail
-- (e.g. '2-4-marketing-mix' = pageMeta.id), NOT the underscored file tail
-- ('2_4_marketing_mix') — so progress / bank_questions / topic.html all key on
-- the SAME page_id (subject_slug:topic_slug). Enforced by the CHECK below.
--
-- SECURITY (auth-authz / secure-coding): every gate is server-derived from
-- auth.uid(); cross-school isolation rests entirely on _student_school_for_subject
-- and _school_of. No client input decides which school's override a caller sees.
-- The §8 review (prove as anon + as a SECOND school's student) gates shipping.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 0 · CLASS SCHOOL ANCHOR  (adversarial-review fix #2)
-- ══════════════════════════════════════════════════════════════
-- A student's school MUST NOT be inferred from the class teacher's live,
-- admin-priority-ordered _school_of — a teacher who is a school_admin in school B
-- but teaches in school A would map their A students to B (cross-tenant leak).
-- So each class carries its OWN school_id, FROZEN at creation to the creating
-- teacher's school, and immutable thereafter. The student resolver (Section 1)
-- reads classes.school_id, never the teacher's current membership.
alter table classes add column if not exists school_id uuid references schools(id);
create index if not exists classes_school_idx on classes (school_id);

-- Set at creation (any insert path — client or create-class function — since the
-- trigger fires server-side), immutable after. A teacher with no school yet →
-- null (student then resolves to master-only, the safe fallback).
create or replace function _pin_class_school() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if new.school_id is null then
            new.school_id := _school_of(new.teacher_id);
        end if;
    -- Immutable ONLY once assigned: allow a first-time set (null → value), which
    -- is exactly what the backfill below and any late assignment do; block only
    -- CHANGING an already-set school (that would re-home the class's students).
    elsif old.school_id is not null and new.school_id is distinct from old.school_id then
        raise exception 'A class''s school cannot be changed (student cross-school isolation keys on it)';
    end if;
    return new;
end;
$$;
drop trigger if exists classes_pin_school on classes;
create trigger classes_pin_school before insert or update of school_id on classes
    for each row execute function _pin_class_school();

-- Backfill existing classes. _school_of(teacher_id) is the best signal available
-- for pre-existing rows; for single-membership teachers (the norm) it is exact.
-- Multi-membership teachers with a cross-school admin role are the only ambiguous
-- case (a proper per-class school picker is a later product item).
update classes set school_id = _school_of(teacher_id) where school_id is null;

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · _student_school_for_subject()  (spec §10c A4; review fix #2)
-- ══════════════════════════════════════════════════════════════
-- The caller's school FOR A GIVEN SUBJECT:
--   • Teacher → their own school (_school_of; subject-independent). Checked first
--     so a teacher who is somehow also a class_student still resolves to the
--     school they teach in.
--   • Student → the FROZEN school_id of the single ACTIVE class they're in for
--     this subject (Section 0). A student is in at most one class per subject
--     (guarded at both enrolment RPCs). Reading the class's own school_id — not
--     the teacher's live _school_of — is the review-fix #2 that stops a teacher's
--     cross-school admin membership from re-homing their students.
-- Students are not in school_members, so _school_of() is null for them and the
-- class branch runs. `not c.archived` pins it to a live enrolment.
create or replace function _student_school_for_subject(p_subject_id uuid) returns uuid
language sql security definer stable set search_path = public as $$
    select coalesce(
        _school_of(auth.uid()),          -- teacher: their own school
        (select c.school_id              -- student: their active class's FROZEN school
         from class_students cs
         join classes c on c.id = cs.class_id
         where cs.student_id = auth.uid()
           and c.subject_id = p_subject_id
           and not c.archived
         order by cs.joined_at asc
         limit 1)
    );
$$;
grant execute on function _student_school_for_subject(uuid) to authenticated;

-- my_school() — the caller's own school, as a SECURITY DEFINER wrapper that is
-- GRANTED to authenticated. This exists because _school_of(uuid) is (correctly)
-- revoked from client roles to stop the anon teacher→school oracle — but the
-- subject_overrides_editor_all RLS policy below calls the caller's school
-- DIRECTLY in its predicate, and RLS predicates run AS the querying role, which
-- therefore needs EXECUTE. Calling bare _school_of(auth.uid()) there raises
-- 'permission denied for function _school_of'. This wrapper takes NO argument
-- (auth.uid() only) so it leaks nothing — a caller can only ever learn their OWN
-- school — while keeping the policy executable.
create or replace function my_school() returns uuid
language sql security definer stable set search_path = public as $$
    select _school_of(auth.uid());
$$;
grant execute on function my_school() to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · subject_overrides  (one school's fork of one platform topic)
-- ══════════════════════════════════════════════════════════════
create table if not exists subject_overrides (
    id         uuid primary key default gen_random_uuid(),
    subject_id uuid not null references subjects(id) on delete cascade,  -- PLATFORM subject (created_by is null)
    school_id  uuid not null references schools(id)  on delete cascade,
    -- hyphenated page-id tail (A1). The CHECK rejects underscores, so an
    -- accidental file-tail slug (2_4_marketing_mix) can never be stored.
    topic_slug text not null check (topic_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    sections   jsonb not null default '{}'::jsonb
               check (char_length(sections::text) <= 600000),
    status     text not null default 'draft' check (status in ('draft', 'published')),
    created_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (subject_id, school_id, topic_slug)   -- one override per school per topic
);
create index if not exists subject_overrides_lookup_idx
    on subject_overrides (school_id, subject_id, status);

create or replace function _touch_subject_override() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists subject_overrides_touch on subject_overrides;
create trigger subject_overrides_touch before update on subject_overrides
    for each row execute function _touch_subject_override();

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · RLS
-- ══════════════════════════════════════════════════════════════
alter table subject_overrides enable row level security;

-- Students: PUBLISHED overrides for THEIR school + subject only (topic.html reads
-- this directly at render). _student_school_for_subject pins it to the caller's
-- own class's school — a student can never read another school's override.
drop policy if exists "subject_overrides_student_read" on subject_overrides;
create policy "subject_overrides_student_read" on subject_overrides for select
    using (status = 'published'
           and school_id = _student_school_for_subject(subject_id));

-- Editors: a teacher who may edit this platform subject (S4 AND-clamp:
-- can_edit_platform_subject), scoped to their OWN school's rows — full CRUD incl.
-- draft + publish. can_edit_platform_subject already requires created_by is null,
-- so a teacher-authored subject (which edits custom_topics directly) can never
-- acquire an override row. A school-less teacher (_school_of null) is excluded.
drop policy if exists "subject_overrides_editor_all" on subject_overrides;
-- Uses my_school() (definer wrapper, granted to authenticated), NOT bare
-- _school_of — see the my_school() note above. A bare _school_of here is
-- un-executable by `authenticated` (revoked) and bricks the whole policy.
create policy "subject_overrides_editor_all" on subject_overrides for all
    using      (can_edit_platform_subject(subject_id) and school_id = my_school())
    with check (can_edit_platform_subject(subject_id) and school_id = my_school());

-- Oversight READ: the platform owner + the school's admin (D4-style visibility).
-- No edit here — editing is the granted teachers' via the policy above.
drop policy if exists "subject_overrides_admin_read" on subject_overrides;
create policy "subject_overrides_admin_read" on subject_overrides for select
    using (_is_owner() or is_school_admin(school_id));
