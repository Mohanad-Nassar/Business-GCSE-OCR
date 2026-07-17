-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM OVERRIDE-FORK · S5 STEP 4 (edge redirect)
-- Run AFTER entitlements.sql AND subjects-v2-s5-overrides.sql. Safe to re-run.
-- **RE-RUN this file whenever entitlements.sql is re-run** — entitlements.sql
-- redefines edge_gate_check with the plain (no override_slugs) body, so it must
-- be followed by this file to restore the override-aware version. Source of
-- truth: docs/SUBJECTS-V2-SPEC.md §7.1 (step 2) + §10c A1/A3.
--
-- WHAT THIS DOES: teaches the edge content-gate which platform topics THIS
-- student's school has PUBLISHED an override for, so it can 302 those (and only
-- those) static URLs to the dynamic renderer (topic.html). Two pure-adds:
--   1. subject_overrides.file_slug — the UNDERSCORED static-file tail the edge
--      matches against the requested URL (topic_slug stays the internal page-id
--      tail; see §10c A1). Set by the override editor (Step 6) when a teacher
--      picks a platform topic to override.
--   2. edge_gate_check() gains ONE returned key, 'override_slugs' — the
--      file_slugs of PUBLISHED overrides for the CALLER'S OWN school in this
--      subject. Every existing key/grant/security setting is unchanged.
--
-- SECURITY (auth-authz / secure-coding): override_slugs is 100% server-derived.
-- The school is resolved from auth.uid() via _student_school_for_subject() — the
-- client cannot pass, spoof, or influence which school's set it receives. The
-- 60s per-token+subject verdict cache in content-gate.ts already scopes the
-- returned set to the requesting student's own school, so there is no
-- cross-school leak (spike Q1, §10c).
-- ══════════════════════════════════════════════════════════════

-- ── 1 · file_slug column on subject_overrides ──
-- The UNDERSCORED static-file tail (e.g. '2_4_marketing_mix') — the URL-match
-- key the edge compares against the requested /subjects/<slug>/<fileTail>.html.
-- topic_slug stays the internal HYPHENATED page-id tail (progress/bank/topic.html
-- key on that). No CHECK: file tails vary in case and the mapping from page-id is
-- non-trivial (see §10c A1), so the editor (Step 6) is the source of correctness.
alter table subject_overrides add column if not exists file_slug text;

-- Review fix #6: at most one override per (subject, school, file_slug), so
-- topic.html's `.eq('file_slug', …).maybeSingle()` lookup can never match two
-- rows and throw. The editor (Step 6) must set file_slug to the exact page-groups
-- file tail (case included) so the edge's case-sensitive URL match lines up.
create unique index if not exists subject_overrides_file_slug_uk
    on subject_overrides (subject_id, school_id, file_slug) where file_slug is not null;
comment on column subject_overrides.file_slug is
    'UNDERSCORED static-file tail (e.g. 2_4_marketing_mix) — the URL-match key the '
    'edge content-gate uses to 302 this school''s students to topic.html. '
    'topic_slug stays the internal hyphenated page-id tail (spec §10c A1). '
    'Set by the override editor; no CHECK — the editor is the source of correctness.';

-- ── 2 · edge_gate_check() — pure add of 'override_slugs' ──
-- Body copied VERBATIM from entitlements.sql (allow_content + allow_bank), plus
-- the single 'override_slugs' key below. Grants / search_path / security definer
-- kept EXACTLY. A missing key (old cache entries, or this file not yet run) is
-- backward-compatible: content-gate.ts defaults overrideSlugs to [].
--
-- override_slugs = file_slugs of PUBLISHED overrides for the CALLER'S OWN school
-- in this subject. school comes from _student_school_for_subject(s.id) — derived
-- from auth.uid(), so the client cannot influence which school's set it gets.
create or replace function edge_gate_check(p_subject text) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'allow_content', has_subject_access(auth.uid(), p_subject),
        'allow_bank', exists (
            select 1 from profiles p
            where p.id = auth.uid() and (p.role = 'teacher' or p.is_owner)
        ),
        'override_slugs', coalesce((
            select array_agg(o.file_slug)
            from subject_overrides o
            join subjects s on s.id = o.subject_id
            where s.slug = p_subject
              and o.status = 'published'
              and o.file_slug is not null
              and o.school_id = _student_school_for_subject(s.id)
        ), '{}'::text[])
    );
$$;
grant execute on function edge_gate_check(text) to authenticated;
-- definer functions default EXECUTE to PUBLIC — anon calls are harmless
-- here (auth.uid() null → false / empty set) but pointless; deny them anyway.
revoke execute on function edge_gate_check(text) from public;
revoke execute on function edge_gate_check(text) from anon;
