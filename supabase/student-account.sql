-- ══════════════════════════════════════════════════════════════
-- STUDENT "MANAGE ACCOUNT" PAGE — run AFTER schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- manage-account.html shows a student their classes + teacher's name.
-- schema.sql's profiles RLS only lets a user read their OWN profile
-- row (profiles_select_own) or a teacher read a student they teach
-- (profiles_select_teacher_of_student) — there is no policy letting a
-- student read the profiles row of the TEACHER who owns their class.
-- Rather than widen profiles SELECT (which would let any student read
-- any teacher's row directly), this adds one SECURITY DEFINER function
-- — same pattern as is_class_owner()/teaches_student() in schema.sql —
-- that returns exactly what the page needs, already scoped to the
-- caller via auth.uid().
-- ══════════════════════════════════════════════════════════════

create or replace function get_my_classes() returns table (
    class_id        uuid,
    class_name      text,
    teacher_username text,
    joined_at       timestamptz
) language sql security definer stable set search_path = public as $$
    select c.id, c.name, p.username, cs.joined_at
    from class_students cs
    join classes c on c.id = cs.class_id
    join profiles p on p.id = c.teacher_id
    where cs.student_id = auth.uid()
    order by cs.joined_at;
$$;
grant execute on function get_my_classes() to authenticated;
