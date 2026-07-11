-- ══════════════════════════════════════════════════════════════
-- SECTION RESET — lets a student wipe their own server-side progress
-- for ONE activity on one page (the per-section RESET buttons in
-- script.js). Mirrors reset_my_page_progress() from schema.sql, just
-- scoped to a single section, so cross-device sync doesn't resurrect
-- an activity the student deliberately reset to practise again.
--
-- Run this whole file once in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════

create or replace function reset_my_section_progress(p_page_id text, p_section text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    delete from progress_events  where student_id = v_uid and page_id = p_page_id and section = p_section;
    delete from progress_summary where student_id = v_uid and page_id = p_page_id and section = p_section;
end;
$$;

revoke all on function reset_my_section_progress(text, text) from public;
grant execute on function reset_my_section_progress(text, text) to authenticated;
