-- ══════════════════════════════════════════════════════════════
-- TEACHER-AUTHORED SUBJECTS (v2) — run AFTER schema.sql, in full,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Teachers create their OWN subjects (PE, History, KS3 anything…)
-- as REAL rows in `subjects`, so the whole existing machine works
-- unchanged: the class-creation picker lists them, classes bind to
-- them, students join by class code / generated logins as normal,
-- class membership IS enrollment (get_my_subjects untouched), and
-- the teacher dashboard shows their classes like any other.
--
-- Topic content lives in `custom_topics.sections` (jsonb) following
-- the standard 9-activity structure (docs/TEACHER-SUBJECTS-SPEC.md):
-- reading, key learning (+check MCQs), key terms (flashcards +
-- matching), MCQ, fill-in-the-blanks, true/false, misconceptions,
-- exam tips, exam practice — every activity optional per topic.
-- Progress is recorded through the existing record_progress() with
-- page_id = subjects.slug || ':' || custom_topics.slug.
--
-- v1 NOTE: the earlier draft of this file (custom_subjects /
-- custom_subject_classes / one content_html blob per topic) was
-- replaced the same day it was written. Section 0 removes it —
-- including any subjects/topics created through the v1 pages.
--
-- Security model:
--  · subjects rows: platform rows (created_by null) are read-only
--    to everyone; teacher rows are created ONLY via the
--    create_teacher_subject() RPC and are editable/deletable by
--    their creator alone. Visibility: platform subjects → everyone;
--    teacher subjects → the creator + students enrolled via a class.
--  · A teacher can only attach a class to a PLATFORM subject or to
--    a subject THEY created (trigger) — so no teacher can route
--    their students into another teacher's content.
--  · custom_topics: full CRUD for the owning teacher; students get
--    SELECT on published topics of subjects their class is on.
--  · All HTML inside `sections` is sanitised client-side on save,
--    import AND render (rich-editor.js allowlist); the DB caps size.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 0 · REMOVE THE NEVER-DEPLOYED v1 OBJECTS
-- ══════════════════════════════════════════════════════════════

-- Tables first: v1's RLS policies depend on the v1 helper functions, and
-- dropping a table takes its policies with it — the function drops below
-- would otherwise fail with 2BP01 on a database where v1 WAS run.
-- NOTE: this discards any subjects/topics created with the v1 pages
-- (one rich-text blob per topic) — v2 stores content in a new shape.
drop table if exists custom_subject_classes;
drop table if exists custom_topics;      -- v1 shape (content_html) → recreated below
drop table if exists custom_subjects;
drop function if exists get_my_custom_subjects();
drop function if exists sees_custom_subject(uuid) cascade;
drop function if exists owns_custom_subject(uuid) cascade;

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · SUBJECTS TABLE EXTENSIONS
-- ══════════════════════════════════════════════════════════════

alter table subjects
    add column if not exists created_by  uuid references profiles(id) on delete cascade,
    add column if not exists description text not null default '';

create index if not exists subjects_created_by_idx on subjects (created_by);

-- ── Visibility helper (security definer — see schema.sql §2 for the
-- pattern). Enrolled = a member OR the teacher of a class on the subject.
create or replace function enrolled_in_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from class_students cs
        join classes c on c.id = cs.class_id
        where cs.student_id = auth.uid() and c.subject_id = p_subject_id
    ) or exists (
        select 1 from classes c
        where c.teacher_id = auth.uid() and c.subject_id = p_subject_id
    );
$$;
grant execute on function enrolled_in_subject(uuid) to authenticated;

-- Replace the blanket read policy: platform subjects stay visible to all
-- (pickers, hub), but one teacher's subjects are NOT another teacher's
-- business. (If schema.sql is ever re-run it recreates subjects_read_all;
-- re-run this file after it — that's already the SETUP.md order.)
drop policy if exists "subjects_read_all" on subjects;
drop policy if exists "subjects_read_scoped" on subjects;
create policy "subjects_read_scoped" on subjects
    for select using (
        created_by is null
        or created_by = auth.uid()
        or enrolled_in_subject(subjects.id)
    );

-- Teachers manage (update/delete) only their own subjects. There is
-- deliberately NO insert policy: creation goes through the RPC below so
-- slugs are generated server-side and limits are enforced.
drop policy if exists "subjects_owner_update" on subjects;
create policy "subjects_owner_update" on subjects
    for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "subjects_owner_delete" on subjects;
create policy "subjects_owner_delete" on subjects
    for delete using (created_by = auth.uid());

-- Identity freeze: slug is baked into every progress page_id and
-- created_by is the ownership root — neither may change after creation.
create or replace function _freeze_teacher_subject_identity() returns trigger
language plpgsql as $$
begin
    if old.created_by is not null then
        if new.slug is distinct from old.slug then
            raise exception 'A subject''s slug cannot be changed (student progress is keyed on it)';
        end if;
        if new.created_by is distinct from old.created_by then
            raise exception 'A subject''s owner cannot be changed';
        end if;
    end if;
    return new;
end;
$$;
drop trigger if exists subjects_identity_freeze on subjects;
create trigger subjects_identity_freeze before update on subjects
    for each row execute function _freeze_teacher_subject_identity();

-- A class may only point at a platform subject or one the class's own
-- teacher created — enforced here, not just in the picker UI.
create or replace function _class_subject_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    v_owner uuid;
begin
    select created_by into v_owner from subjects where id = new.subject_id;
    if v_owner is not null and v_owner <> new.teacher_id then
        raise exception 'Classes can only use platform subjects or subjects created by their own teacher';
    end if;
    return new;
end;
$$;
drop trigger if exists classes_subject_guard on classes;
create trigger classes_subject_guard before insert or update of subject_id on classes
    for each row execute function _class_subject_guard();

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · SUBJECT CREATION RPC
-- ══════════════════════════════════════════════════════════════

-- Creates a teacher subject with a server-generated unique slug
-- ('year-9-pe', or 'year-9-pe-3f2a' on collision). Never reuses or
-- collides with platform slugs (business/computer-science/economics
-- static paths) because ALL existing slugs are checked. Caps each
-- teacher at 30 subjects.
create or replace function create_teacher_subject(
    p_name text, p_level text default '', p_exam_board text default '',
    p_description text default '', p_colour text default '#4a6fa5',
    p_icon text default '📘'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid  uuid := auth.uid();
    v_base text;
    v_slug text;
    v_row  subjects%rowtype;
    v_n    int := 0;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'teacher') then
        raise exception 'Only teachers can create subjects';
    end if;
    if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
        raise exception 'Subject name must be 1–80 characters';
    end if;
    if char_length(coalesce(p_level, ''))       > 40  then raise exception 'Level too long (40 max)'; end if;
    if char_length(coalesce(p_exam_board, ''))  > 40  then raise exception 'Exam board too long (40 max)'; end if;
    if char_length(coalesce(p_description, '')) > 500 then raise exception 'Description too long (500 max)'; end if;
    if p_colour !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Colour must be a hex value like #4a6fa5'; end if;
    if char_length(coalesce(p_icon, '')) > 8 then raise exception 'Icon too long'; end if;
    if (select count(*) from subjects where created_by = v_uid) >= 30 then
        raise exception 'Subject limit reached (30) — archive or delete an old one first';
    end if;

    v_base := btrim(lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g')), '-');
    v_base := left(coalesce(nullif(v_base, ''), 'subject'), 40);
    v_slug := v_base;
    while exists (select 1 from subjects where slug = v_slug) and v_n < 20 loop
        v_n := v_n + 1;
        v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
    end loop;

    insert into subjects (slug, name, key_stage, level, exam_board, description,
                          colour, icon, sort_order, active, created_by)
    values (v_slug, btrim(p_name), 'ks4', nullif(btrim(coalesce(p_level, '')), ''),
            nullif(btrim(coalesce(p_exam_board, '')), ''), btrim(coalesce(p_description, '')),
            p_colour, coalesce(nullif(p_icon, ''), '📘'), 100, true, v_uid)
    returning * into v_row;
    return to_jsonb(v_row);
end;
$$;
grant execute on function create_teacher_subject(text, text, text, text, text, text) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · TOPICS
-- ══════════════════════════════════════════════════════════════

create table if not exists custom_topics (
    id         uuid primary key default gen_random_uuid(),
    subject_id uuid not null references subjects(id) on delete cascade,
    -- page_id for progress = subjects.slug || ':' || slug. Frozen after
    -- insert (trigger) so recorded progress never orphans.
    slug       text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    -- Free-text unit header, e.g. '1 · Athletics'. Topics sharing the
    -- string render under one heading, ordered by first appearance.
    section    text not null default '' check (char_length(section) <= 120),
    title      text not null check (char_length(title) between 1 and 160),
    sort_order int  not null default 0,
    -- The 9-activity structure (docs/TEACHER-SUBJECTS-SPEC.md). ~600k chars
    -- of JSON ≈ a very heavy topic; images are storage URLs, not base64.
    sections   jsonb not null default '{}'::jsonb
               check (char_length(sections::text) <= 600000),
    status     text not null default 'draft' check (status in ('draft', 'published')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (subject_id, slug)
);
create index if not exists custom_topics_subject_idx on custom_topics (subject_id, sort_order);

-- Topics only hang off teacher-created subjects (platform subjects have
-- static pages), and a topic's slug freezes at insert.
create or replace function _custom_topics_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if (select created_by from subjects where id = new.subject_id) is null then
            raise exception 'Topics can only be added to teacher-created subjects';
        end if;
    elsif new.slug is distinct from old.slug then
        raise exception 'A topic''s slug cannot be changed (student progress is keyed on it)';
    end if;
    return new;
end;
$$;
drop trigger if exists custom_topics_guard on custom_topics;
create trigger custom_topics_guard before insert or update on custom_topics
    for each row execute function _custom_topics_guard();

create or replace function _touch_custom_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists custom_topics_touch on custom_topics;
create trigger custom_topics_touch before update on custom_topics
    for each row execute function _touch_custom_updated_at();

-- ── RLS ──
create or replace function owns_teacher_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from subjects where id = p_subject_id and created_by = auth.uid()
    );
$$;
grant execute on function owns_teacher_subject(uuid) to authenticated;

alter table custom_topics enable row level security;

drop policy if exists "custom_topics_teacher_all" on custom_topics;
create policy "custom_topics_teacher_all" on custom_topics
    for all using (owns_teacher_subject(custom_topics.subject_id))
    with check (owns_teacher_subject(custom_topics.subject_id));

-- Students: published topics of subjects their class is enrolled in.
drop policy if exists "custom_topics_student_select" on custom_topics;
create policy "custom_topics_student_select" on custom_topics
    for select using (status = 'published' and enrolled_in_subject(custom_topics.subject_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · MANAGER RPC — the teacher's subjects with topic and
-- class counts in one call (manager cards, no N+1).
-- ══════════════════════════════════════════════════════════════

create or replace function get_my_teacher_subjects()
returns table (
    id uuid, slug text, name text, level text, exam_board text,
    description text, colour text, icon text, active boolean,
    published_topics bigint, total_topics bigint, class_count bigint,
    updated_at timestamptz
)
language sql security definer stable set search_path = public as $$
    select s.id, s.slug, s.name, s.level, s.exam_board, s.description,
           s.colour, s.icon, s.active,
           count(t.id) filter (where t.status = 'published'),
           count(t.id),
           (select count(*) from classes c where c.subject_id = s.id and not c.archived),
           coalesce(max(t.updated_at), s.created_at)
    from subjects s
    left join custom_topics t on t.subject_id = s.id
    where s.created_by = auth.uid()
    group by s.id
    order by s.active desc, s.name;
$$;
grant execute on function get_my_teacher_subjects() to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · DAILY REVISE / TASKS INTEGRATION — the "full package"
-- ══════════════════════════════════════════════════════════════
-- Teacher subjects feed the SAME bank_questions table the platform
-- build pipeline seeds (bank-questions-schema.sql must be run first).
-- The wizard's publish step calls sync_teacher_subject_bank() with
-- rows built client-side by custom-bank.js (mcq/tf/fib/learn-check/
-- misconception-check/matching questions from PUBLISHED topics), and
-- from then on Daily Revise, mastery, spaced repetition and the DR
-- analytics all work for the subject with zero further changes —
-- they only ever filter on bank_questions.subject_slug.

-- bank_questions.subject_slug references subjects(slug) with NO
-- delete action, which would block deleting a teacher subject once
-- it has bank rows. Cascade instead (a subject's generated bank is
-- cache, not authored data; question_mastery already cascades off
-- bank_questions). No-op when the bank schema isn't installed yet.
do $$
begin
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'bank_questions') then
        alter table bank_questions drop constraint if exists bank_questions_subject_slug_fkey;
        alter table bank_questions add constraint bank_questions_subject_slug_fkey
            foreign key (subject_slug) references subjects(slug) on delete cascade;
    end if;
end $$;

-- Replace the caller's OWN subject's bank rows with p_rows. Upsert +
-- delete-missing (not wipe-and-reload) so question_mastery survives
-- for unchanged questions — same semantics as the platform's
-- build --upload. Validated hard: only the owning teacher, only rows
-- keyed under their subject's slug, only PUBLISHED topics' page_ids,
-- only auto-gradable shapes, capped at 4000 rows.
create or replace function sync_teacher_subject_bank(p_subject_id uuid, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid   uuid := auth.uid();
    v_slug  text;
    v_row   jsonb;
    v_key   text;
    v_page  text;
    v_kept  text[] := '{}';
    v_count int := 0;
begin
    select slug into v_slug from subjects
    where id = p_subject_id and created_by = v_uid;
    if v_slug is null then raise exception 'Not your subject'; end if;

    if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
        raise exception 'Rows must be a JSON array';
    end if;
    if jsonb_array_length(p_rows) > 4000 then
        raise exception 'Too many questions (max 4000 per subject)';
    end if;

    for v_row in select * from jsonb_array_elements(p_rows) loop
        v_key  := v_row->>'question_key';
        v_page := v_row->>'page_id';
        if v_key is null or v_key not like v_slug || ':%' or char_length(v_key) > 300 then
            raise exception 'Bad question_key %', v_key;
        end if;
        if v_page is null or not exists (
            select 1 from custom_topics t
            where t.subject_id = p_subject_id and t.status = 'published'
              and v_slug || ':' || t.slug = v_page
        ) then
            raise exception 'page_id % is not a published topic of this subject', v_page;
        end if;
        if (v_row->>'source') not in ('exam','mcq','tf','learn','misc','tips','fib','match') then
            raise exception 'Bad source %', v_row->>'source';
        end if;
        if (v_row->>'qtype') not in ('mcq','tf','fib') then
            raise exception 'Bad qtype %', v_row->>'qtype';
        end if;
        if jsonb_typeof(v_row->'snapshot') <> 'object' or jsonb_typeof(v_row->'answer_key') <> 'object' then
            raise exception 'snapshot and answer_key must be objects';
        end if;

        insert into bank_questions (question_key, subject_slug, page_id, page_name,
                                    source, qtype, marks, snapshot, answer_key, updated_at)
        values (v_key, v_slug, v_page, left(coalesce(v_row->>'page_name', ''), 200),
                v_row->>'source', v_row->>'qtype',
                least(greatest(coalesce((v_row->>'marks')::numeric, 1), 0.5), 10),
                v_row->'snapshot', v_row->'answer_key', now())
        on conflict (question_key) do update set
            page_id = excluded.page_id, page_name = excluded.page_name,
            source = excluded.source, qtype = excluded.qtype, marks = excluded.marks,
            snapshot = excluded.snapshot, answer_key = excluded.answer_key,
            updated_at = now();

        v_kept := array_append(v_kept, v_key);
        v_count := v_count + 1;
    end loop;

    -- Anything of this subject's not in the new set is gone (unpublished
    -- topic, deleted question) — mastery rows cascade with it.
    delete from bank_questions
    where subject_slug = v_slug and not (question_key = any(v_kept));

    return jsonb_build_object('synced', v_count);
end;
$$;
grant execute on function sync_teacher_subject_bank(uuid, jsonb) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · STORAGE — images inserted by the rich-text editor
-- ══════════════════════════════════════════════════════════════
-- Public bucket: images readable by URL (names are UUIDs, bucket not
-- listable by anon). 2 MB cap; raster types only (no SVG — SVG can
-- carry script when opened directly).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('topic-images', 'topic-images', true, 2097152,
        array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do update set
    public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "topic_images_teacher_insert" on storage.objects;
create policy "topic_images_teacher_insert" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'topic-images'
        and (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
    );

drop policy if exists "topic_images_teacher_delete" on storage.objects;
create policy "topic_images_teacher_delete" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'topic-images'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
