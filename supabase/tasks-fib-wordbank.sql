-- ══════════════════════════════════════════════════════════════
-- FILL-IN-THE-BLANKS WORD BANK — run AFTER tasks-schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- get_my_task_questions() deliberately withholds every answer_key
-- (see tasks-schema.sql's header note — keys are only revealed by
-- get_task_answer_keys() once revealing them is allowed, i.e. after
-- submission/lockout). This function is a narrow, intentional
-- exception: it lets an assigned student pull just the *shuffled
-- multiset* of correct fill-in-the-blank words for a task, with NO
-- link back to which question or which blank a word belongs to —
-- a word bank, not an answer key. The student still has to work out
-- placement themselves. Available before submission, unlike
-- get_task_answer_keys().
-- ══════════════════════════════════════════════════════════════

create or replace function get_task_fib_word_bank(p_task_id uuid)
returns text[]
language plpgsql security definer stable set search_path = public as $$
declare
    v_words text[];
begin
    if not (is_assigned_task(p_task_id) or owns_task(p_task_id)) then
        raise exception 'Not authorised';
    end if;

    select array_agg(v.val order by random())
    into v_words
    from task_questions q
    cross join lateral jsonb_each_text(coalesce(q.answer_key->'blanks', '{}'::jsonb)) as v(key, val)
    where q.task_id = p_task_id and q.qtype = 'fib';

    return coalesce(v_words, '{}'::text[]);
end;
$$;
grant execute on function get_task_fib_word_bank(uuid) to authenticated;
