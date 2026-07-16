-- ══════════════════════════════════════════════════════════════
-- LEADERBOARDS — run AFTER schema.sql, daily-revise-stats-schema.sql and
-- daily-revise-functions.sql, in the Supabase SQL editor. Safe to re-run.
--
-- A class / whole-subject leaderboard for students AND teachers, with:
--   • four metrics — Accuracy, Attempts (distinct questions, so grinding one
--     question can't climb it), Mastery (Daily Revise), Streak — plus a
--     normalised Overall blend.
--   • four time windows — 24h / 7d / 30d / All-time. Attempts & Accuracy come
--     from progress_events.answered_at; Mastery from mastery_events (windowed)
--     or daily_revise_stats.total_mastered (all-time); Streak is always current.
--   • three scopes — one class, the whole subject (every same-subject class the
--     teacher owns), and a class-vs-class "groups" board.
--   • privacy for minors — a STUDENT sees real usernames only for their own
--     class (and only if their teacher left names on); every other class is
--     rank + class tag + a "You" marker, no stranger names. TEACHERS always see
--     names (they own the classes). Enforced HERE, server-side — a hidden name
--     is never sent to the browser, not merely hidden in CSS.
--   • teacher controls — enable/disable per class, how many rows students see,
--     names-on/off, and excluding an individual student. (leaderboard_settings
--     / leaderboard_exclusions.)
--
-- Everything a student may not see is filtered inside these SECURITY DEFINER
-- functions, the same trust model as get_daily_revise_queue (which omits the
-- answer key from its return shape). RLS on the base tables stays "self only";
-- these functions are the one controlled cross-student read.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- Timestamped first-mastery log. One row the FIRST time a question reaches
-- mastery_count = 3 for a student (written by record_mastery_answer() in
-- daily-revise-functions.sql, under the same guard as daily_revise_stats'
-- total_mastered). This is what lets Mastery be time-windowed.
create table if not exists mastery_events (
    id           bigserial primary key,
    student_id   uuid not null references profiles(id) on delete cascade,
    subject_slug text not null references subjects(slug),
    question_key text not null,
    page_id      text,
    mastered_at  timestamptz not null default now()
);
create index if not exists mastery_events_student_time_idx on mastery_events (student_id, mastered_at desc);
create index if not exists mastery_events_subject_time_idx on mastery_events (subject_slug, mastered_at desc);

-- Per-class leaderboard controls, owned by the class's teacher. Absence of a
-- row = every default (enabled, names shown, top 10) — so a teacher who never
-- touches this still gets a working, sensibly-limited board.
create table if not exists leaderboard_settings (
    class_id      uuid primary key references classes(id) on delete cascade,
    enabled       boolean not null default true,
    show_names    boolean not null default true,        -- names visible to students; else aliased
    visible_count int not null default 10 check (visible_count between 0 and 200), -- 0 = all
    updated_at    timestamptz not null default now()
);

-- Individual opt-out / teacher exclusion. An excluded student is removed from
-- every board (including their own view of it) — pairs with the children's-code
-- stance that a child can be kept off a public ranking entirely.
create table if not exists leaderboard_exclusions (
    class_id   uuid not null references classes(id) on delete cascade,
    student_id uuid not null references profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (class_id, student_id)
);

-- Optional named "link group" — a teacher's chosen subset of their same-subject
-- classes to compare against each other (the whole-subject board defaults to
-- ALL same-subject classes; a group narrows it).
create table if not exists class_link_groups (
    id         uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null references subjects(id),
    name       text not null,
    created_at timestamptz not null default now()
);
create table if not exists class_link_group_members (
    group_id uuid not null references class_link_groups(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    primary key (group_id, class_id)
);

-- Durable leaderboard achievements — the ONLY leaderboard state that persists,
-- so gamification.js can award real, non-relative badges (a rank is otherwise
-- ephemeral and can't be re-derived from a student's own progress the way XP
-- is). Written only by sync_my_leaderboard_achievements() (SECURITY DEFINER,
-- computes the rank server-side), never trusted from the client.
create table if not exists leaderboard_achievements (
    student_id      uuid not null references profiles(id) on delete cascade,
    subject_slug    text not null references subjects(slug),
    best_rank       int,                 -- best (lowest) all-time class rank reached
    best_percentile numeric,             -- best (highest) percentile, 0..1
    ever_top10      boolean not null default false,
    ever_top3       boolean not null default false,
    ever_first      boolean not null default false,
    updated_at      timestamptz not null default now(),
    primary key (student_id, subject_slug)
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table mastery_events          enable row level security;
alter table leaderboard_settings    enable row level security;
alter table leaderboard_exclusions  enable row level security;
alter table class_link_groups       enable row level security;
alter table class_link_group_members enable row level security;
alter table leaderboard_achievements enable row level security;

-- mastery_events — self + teacher-of-student read; writes only via the
-- security-definer grader (no insert/update/delete policy).
drop policy if exists "mastery_events_self_select" on mastery_events;
create policy "mastery_events_self_select" on mastery_events
    for select using (student_id = auth.uid());
drop policy if exists "mastery_events_teacher_select" on mastery_events;
create policy "mastery_events_teacher_select" on mastery_events
    for select using (teaches_student(mastery_events.student_id));

-- leaderboard_settings / exclusions — the owning teacher manages them directly
-- from the dashboard (students never read them; the definer functions apply
-- them). is_class_owner() is the same guard used across classes.
drop policy if exists "leaderboard_settings_owner_all" on leaderboard_settings;
create policy "leaderboard_settings_owner_all" on leaderboard_settings
    for all using (is_class_owner(class_id)) with check (is_class_owner(class_id));

drop policy if exists "leaderboard_exclusions_owner_all" on leaderboard_exclusions;
create policy "leaderboard_exclusions_owner_all" on leaderboard_exclusions
    for all using (is_class_owner(class_id)) with check (is_class_owner(class_id));

-- class_link_groups — teacher owns their own groups outright.
drop policy if exists "class_link_groups_owner_all" on class_link_groups;
create policy "class_link_groups_owner_all" on class_link_groups
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists "class_link_group_members_owner_all" on class_link_group_members;
create policy "class_link_group_members_owner_all" on class_link_group_members
    for all using (exists (select 1 from class_link_groups g
                           where g.id = group_id and g.teacher_id = auth.uid()))
    with check (exists (select 1 from class_link_groups g
                        where g.id = group_id and g.teacher_id = auth.uid())
                and is_class_owner(class_id));

-- leaderboard_achievements — the student reads their own; writes via definer only.
drop policy if exists "leaderboard_achievements_self_select" on leaderboard_achievements;
create policy "leaderboard_achievements_self_select" on leaderboard_achievements
    for select using (student_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · WINDOWED-METRICS HELPER
-- ══════════════════════════════════════════════════════════════
-- Per-student raw metrics for a set of classes, a subject and a [from, to)
-- time window. SECURITY DEFINER so it can read every rostered student's
-- progress_events / mastery_events (the intended, controlled cross-student
-- read); callers (get_leaderboard) enforce who is allowed to ask.
--
-- subject scoping matters: a Business-class student also answers Economics
-- questions, and both land in progress_events. page_id is subject-prefixed
-- ('business:1-1-…'), so `page_id like slug || ':%'` isolates one subject,
-- exactly as get_class_activity_days does. mastery_events carries subject_slug
-- directly. distinct_q counts distinct (page_id, question_id) pairs — the
-- anti-grind metric: re-answering the same question doesn't raise it.
create or replace function _lb_window_metrics(
    p_class_ids uuid[], p_subject text, p_from timestamptz, p_to timestamptz)
returns table (
    student_id uuid, attempts bigint, distinct_q bigint,
    answered bigint, correct bigint, mastered bigint)
language sql security definer stable set search_path = public as $$
    with roster as (
        select distinct cs.student_id
        from class_students cs
        where cs.class_id = any(p_class_ids)
    ),
    ev as (
        select pe.student_id,
               count(*)                                              as attempts,
               count(distinct (pe.page_id || '|' || pe.question_id))
                   filter (where pe.question_id is not null)         as distinct_q,
               count(*) filter (where pe.is_correct is not null)     as answered,
               count(*) filter (where pe.is_correct)                 as correct
        from progress_events pe
        join roster r on r.student_id = pe.student_id
        where pe.answered_at >= p_from and pe.answered_at < p_to
          and pe.page_id like p_subject || ':%'
        group by pe.student_id
    ),
    ms as (
        select me.student_id, count(*) as mastered
        from mastery_events me
        join roster r on r.student_id = me.student_id
        where me.mastered_at >= p_from and me.mastered_at < p_to
          and me.subject_slug = p_subject
        group by me.student_id
    )
    select r.student_id,
           coalesce(ev.attempts, 0),  coalesce(ev.distinct_q, 0),
           coalesce(ev.answered, 0),  coalesce(ev.correct, 0),
           coalesce(ms.mastered, 0)
    from roster r
    left join ev on ev.student_id = r.student_id
    left join ms on ms.student_id = r.student_id;
$$;
grant execute on function _lb_window_metrics(uuid[], text, timestamptz, timestamptz) to authenticated;

-- Current day-streak for every student in a set of classes, scoped to a
-- subject's events. Same "islands" technique and today-or-yesterday rule as
-- get_class_streaks()/get_my_streak(); returned as a flat table for joining.
create or replace function _lb_streaks(p_class_ids uuid[], p_subject text)
returns table (student_id uuid, streak int)
language sql security definer stable set search_path = public as $$
    with days as (
        select cs.student_id, (pe.answered_at at time zone 'utc')::date as d
        from class_students cs
        join progress_events pe on pe.student_id = cs.student_id
        where cs.class_id = any(p_class_ids)
          and pe.page_id like p_subject || ':%'
        group by cs.student_id, (pe.answered_at at time zone 'utc')::date
    ),
    islands as (
        select student_id, d,
               d - (row_number() over (partition by student_id order by d))::int as grp
        from days
    ),
    lens as (
        select student_id, count(*)::int as len, max(d) as last_d
        from islands group by student_id, grp
    )
    select student_id,
           coalesce(max(len) filter (where last_d >= current_date - 1), 0)::int as streak
    from lens group by student_id;
$$;
grant execute on function _lb_streaks(uuid[], text) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · CORE LEADERBOARD RPC
-- ══════════════════════════════════════════════════════════════
-- Returns jsonb { meta:{…}, rows:[…] }. One metric + one window per call, so
-- the client refetches (and caches) on tab / filter change and every rank,
-- movement arrow and name-visibility decision is made here.
--
-- p_scope   'class'    — one class (caller must be its owner or a member)
--           'subject'  — the whole subject: for a TEACHER, every same-subject
--                        class they own (or one link group); for a STUDENT, the
--                        same-subject classes owned by their class's teacher
--           'groups'   — class-vs-class standings over the same pool as 'subject'
-- p_metric  'overall' | 'accuracy' | 'attempts' | 'mastery' | 'streak'
-- p_window  '24h' | '7d' | '30d' | 'all'
create or replace function get_leaderboard(
    p_scope    text,
    p_metric   text default 'overall',
    p_window   text default 'all',
    p_class_id uuid default null,
    p_subject  text default null,
    p_group_id uuid default null
) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid          uuid := auth.uid();
    v_is_teacher   boolean;
    v_subject      text := p_subject;
    v_subject_id   uuid;
    v_pool         uuid[];
    v_self_classes uuid[];
    v_from         timestamptz;
    v_to           timestamptz := now();
    v_pfrom        timestamptz;
    v_pto          timestamptz;
    v_has_prev     boolean := true;
    v_min_answers  int := 10;      -- accuracy is unranked below this many graded answers
    v_enabled      boolean := true;
    v_show_names   boolean := true;
    v_visible      int := 10;
    v_teacher      uuid;
    v_rows         jsonb;
    v_self_rank    int;
    v_pool_size    int;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if p_metric not in ('overall','accuracy','attempts','mastery','streak') then p_metric := 'overall'; end if;
    if p_window not in ('24h','7d','30d','all') then p_window := 'all'; end if;

    v_is_teacher := exists (select 1 from profiles where id = v_uid and role = 'teacher');

    -- Window bounds + the matching PREVIOUS window (for movement arrows).
    if p_window = '24h' then
        v_from := now() - interval '24 hours'; v_pto := v_from; v_pfrom := now() - interval '48 hours'; v_min_answers := 3;
    elsif p_window = '7d' then
        v_from := now() - interval '7 days';  v_pto := v_from; v_pfrom := now() - interval '14 days';
    elsif p_window = '30d' then
        v_from := now() - interval '30 days'; v_pto := v_from; v_pfrom := now() - interval '60 days';
    else
        v_from := timestamptz '1970-01-01'; v_has_prev := false; v_pfrom := v_from; v_pto := v_from;
    end if;

    -- ── Resolve the class pool + subject + access ──
    if p_scope = 'class' then
        if p_class_id is null then
            -- Student convenience: resolve their own class for the subject so the
            -- client never has to know a class id. Teachers own several classes,
            -- so they must name one explicitly.
            if v_is_teacher or p_subject is null then raise exception 'class_id required for class scope'; end if;
            p_class_id := my_class_for_subject(p_subject);
            if p_class_id is null then
                return jsonb_build_object('meta', jsonb_build_object('empty', true, 'scope', p_scope), 'rows', '[]'::jsonb);
            end if;
        end if;
        if not (is_class_owner(p_class_id) or is_member_of_class(p_class_id)) then
            raise exception 'Not authorised';
        end if;
        v_pool := array[p_class_id];
        select s.slug into v_subject from classes c join subjects s on s.id = c.subject_id where c.id = p_class_id;
    else
        if v_subject is null then raise exception 'subject required for % scope', p_scope; end if;
        select id into v_subject_id from subjects where slug = v_subject;
        if v_subject_id is null then raise exception 'unknown subject'; end if;

        if v_is_teacher then
            if p_group_id is not null then
                if not exists (select 1 from class_link_groups g where g.id = p_group_id and g.teacher_id = v_uid) then
                    raise exception 'Not authorised';
                end if;
                select coalesce(array_agg(c.id), '{}') into v_pool
                from class_link_group_members m
                join classes c on c.id = m.class_id
                where m.group_id = p_group_id and c.teacher_id = v_uid and not c.archived;
            else
                select coalesce(array_agg(c.id), '{}') into v_pool
                from classes c
                where c.teacher_id = v_uid and c.subject_id = v_subject_id and not c.archived;
            end if;
        else
            -- Student: whole-subject pool = the same-subject classes owned by
            -- the teacher of the student's own class in this subject.
            select c.teacher_id into v_teacher
            from class_students cs
            join classes c on c.id = cs.class_id
            where cs.student_id = v_uid and c.subject_id = v_subject_id
            order by cs.joined_at asc limit 1;
            if v_teacher is null then
                return jsonb_build_object('meta', jsonb_build_object('empty', true, 'scope', p_scope), 'rows', '[]'::jsonb);
            end if;
            select coalesce(array_agg(c.id), '{}') into v_pool
            from classes c
            where c.teacher_id = v_teacher and c.subject_id = v_subject_id and not c.archived;
        end if;
    end if;

    if v_pool is null or array_length(v_pool, 1) is null then
        return jsonb_build_object('meta', jsonb_build_object('empty', true, 'scope', p_scope, 'subject', v_subject), 'rows', '[]'::jsonb);
    end if;

    -- The caller's own classes within the pool (drives name visibility + the
    -- "You" marker + which class's settings govern the student view).
    select coalesce(array_agg(cs.class_id), '{}') into v_self_classes
    from class_students cs where cs.student_id = v_uid and cs.class_id = any(v_pool);

    -- Effective student-facing settings: the caller's own class governs (class
    -- scope → that class; subject scope → the caller's class in the pool).
    -- A teacher is never gated by these — they manage the board.
    select coalesce(bool_and(coalesce(ls.enabled, true)), true),
           coalesce(bool_and(coalesce(ls.show_names, true)), true),
           coalesce(min(coalesce(ls.visible_count, 10)), 10)
    into v_enabled, v_show_names, v_visible
    from unnest(case when array_length(v_self_classes,1) is null then v_pool else v_self_classes end) sc(class_id)
    left join leaderboard_settings ls on ls.class_id = sc.class_id;

    if not v_is_teacher and not v_enabled then
        return jsonb_build_object('meta', jsonb_build_object('disabled', true, 'scope', p_scope, 'subject', v_subject), 'rows', '[]'::jsonb);
    end if;

    -- ── Individual boards (class / subject) ──
    if p_scope in ('class','subject') then
        with cur as (select * from _lb_window_metrics(v_pool, v_subject, v_from, v_to)),
             prev as (select * from _lb_window_metrics(v_pool, v_subject, v_pfrom, v_pto)),
             dr as (select student_id, total_mastered from daily_revise_stats where subject_slug = v_subject),
             st as (select * from _lb_streaks(v_pool, v_subject)),
             roster as (
                select distinct on (cs.student_id) cs.student_id, cs.class_id, c.name as class_name
                from class_students cs join classes c on c.id = cs.class_id
                where cs.class_id = any(v_pool)
                  and not exists (select 1 from leaderboard_exclusions x
                                  where x.class_id = cs.class_id and x.student_id = cs.student_id)
                order by cs.student_id, cs.joined_at asc
             ),
             base as (
                select r.student_id, r.class_id, r.class_name, p.username,
                       coalesce(cur.attempts,0) attempts, coalesce(cur.distinct_q,0) distinct_q,
                       coalesce(cur.answered,0) answered, coalesce(cur.correct,0) correct,
                       case when p_window='all' then coalesce(dr.total_mastered,0) else coalesce(cur.mastered,0) end mastered,
                       coalesce(st.streak,0) streak,
                       coalesce(prev.distinct_q,0) prev_distinct_q, coalesce(prev.mastered,0) prev_mastered,
                       coalesce(prev.answered,0) prev_answered, coalesce(prev.correct,0) prev_correct,
                       case when coalesce(cur.answered,0) >= v_min_answers then cur.correct::numeric/nullif(cur.answered,0) end accuracy,
                       case when coalesce(prev.answered,0) >= v_min_answers then prev.correct::numeric/nullif(prev.answered,0) end prev_accuracy
                from roster r join profiles p on p.id = r.student_id
                left join cur on cur.student_id=r.student_id
                left join prev on prev.student_id=r.student_id
                left join dr on dr.student_id=r.student_id
                left join st on st.student_id=r.student_id
             ),
             maxes as (
                select nullif(max(distinct_q),0)::numeric mx_q, nullif(max(mastered),0)::numeric mx_m,
                       nullif(max(prev_distinct_q),0)::numeric pmx_q, nullif(max(prev_mastered),0)::numeric pmx_m
                from base
             ),
             scored as (
                select b.*,
                       round(1000*(0.5*coalesce(b.mastered/m.mx_m,0)+0.3*coalesce(b.distinct_q/m.mx_q,0)+0.2*coalesce(b.accuracy,0))) overall,
                       round(1000*(0.5*coalesce(b.prev_mastered/m.pmx_m,0)+0.3*coalesce(b.prev_distinct_q/m.pmx_q,0)+0.2*coalesce(b.prev_accuracy,0))) prev_overall
                from base b cross join maxes m
             ),
             valued as (
                select s.*,
                       case p_metric when 'accuracy' then s.accuracy when 'attempts' then s.distinct_q::numeric
                            when 'mastery' then s.mastered::numeric when 'streak' then s.streak::numeric else s.overall::numeric end mval,
                       case p_metric when 'accuracy' then s.prev_accuracy when 'attempts' then s.prev_distinct_q::numeric
                            when 'mastery' then s.prev_mastered::numeric when 'streak' then null else s.prev_overall::numeric end pmval
                from scored s
             ),
             ranked as (
                select v.*,
                       case when v.mval is not null and v.mval > 0
                            then rank() over (order by v.mval desc nulls last, v.distinct_q desc, v.correct desc, v.student_id) end rnk,
                       case when v_has_prev and v.pmval is not null and v.pmval > 0
                            then rank() over (order by v.pmval desc nulls last, v.prev_distinct_q desc, v.prev_correct desc, v.student_id) end prnk
                from valued v
             ),
             marked as (
                select r.*,
                       (r.student_id = v_uid) as is_self,
                       (v_is_teacher or (r.class_id = any(v_self_classes) and v_show_names)) as name_ok
                from ranked r
             ),
             withself as (
                -- self_rank_all is the same on every row (a window over the whole
                -- pool), so the visible-count gate can reference it without the
                -- variable-not-yet-assigned trap of a SELECT … INTO self-reference.
                select m.*, max(m.rnk) filter (where m.is_self) over () as self_rank_all
                from marked m
             )
        select
            max(ws.self_rank_all),
            count(*)::int,
            -- Visible-count gate for students: top N, plus the caller's own row and
            -- its immediate neighbours (a wellbeing-safe partial view). 0 = all;
            -- teachers always see everyone.
            coalesce(jsonb_agg(
                jsonb_build_object(
                    'rank', ws.rnk, 'prev_rank', ws.prnk,
                    'delta', case when ws.rnk is not null and ws.prnk is not null then ws.prnk - ws.rnk end,
                    'is_self', ws.is_self,
                    'name', case when ws.name_ok then ws.username else null end,
                    'class_name', ws.class_name,
                    'id', case when ws.is_self then ws.student_id::text else null end,
                    'distinct_q', ws.distinct_q, 'attempts', ws.attempts,
                    'mastered', ws.mastered, 'streak', ws.streak,
                    'accuracy_pct', round(ws.accuracy * 100, 1), 'answered', ws.answered,
                    'overall', ws.overall
                ) order by coalesce(ws.rnk, 100000), ws.username
            ) filter (where
                v_is_teacher or v_visible = 0
                or (ws.rnk is null and ws.is_self)
                or ws.rnk <= v_visible
                or ws.is_self
                or (ws.self_rank_all is not null and ws.rnk is not null and abs(ws.rnk - ws.self_rank_all) <= 1)
            ), '[]'::jsonb)
        into v_self_rank, v_pool_size, v_rows
        from withself ws;

    -- ── Groups board (class-vs-class) ──
    else
        with cur as (select * from _lb_window_metrics(v_pool, v_subject, v_from, v_to)),
             prev as (select * from _lb_window_metrics(v_pool, v_subject, v_pfrom, v_pto)),
             dr as (select student_id, total_mastered from daily_revise_stats where subject_slug = v_subject),
             st as (select * from _lb_streaks(v_pool, v_subject)),  -- per-student current streak (always "now", not windowed)
             roster as (
                select distinct on (cs.student_id) cs.student_id, cs.class_id
                from class_students cs
                where cs.class_id = any(v_pool)
                  and not exists (select 1 from leaderboard_exclusions x where x.class_id=cs.class_id and x.student_id=cs.student_id)
                order by cs.student_id, cs.joined_at asc
             ),
             per as (
                select r.class_id,
                       coalesce(cur.distinct_q,0) distinct_q, coalesce(cur.answered,0) answered, coalesce(cur.correct,0) correct,
                       case when p_window='all' then coalesce(dr.total_mastered,0) else coalesce(cur.mastered,0) end mastered,
                       coalesce(prev.distinct_q,0) prev_distinct_q, coalesce(prev.mastered,0) prev_mastered,
                       coalesce(prev.answered,0) prev_answered, coalesce(prev.correct,0) prev_correct,
                       coalesce(st.streak,0) streak
                from roster r
                left join cur on cur.student_id=r.student_id
                left join prev on prev.student_id=r.student_id
                left join dr on dr.student_id=r.student_id
                left join st on st.student_id=r.student_id
             ),
             agg as (
                select c.id class_id, c.name class_name, count(per.class_id) members,
                       -- students with a live streak (≥1 day) — the numerator for
                       -- the groups board's "% on a streak" engagement column.
                       count(*) filter (where per.streak >= 1) active_streaks,
                       sum(distinct_q) distinct_q, sum(mastered) mastered, sum(answered) answered, sum(correct) correct,
                       sum(prev_distinct_q) prev_distinct_q, sum(prev_mastered) prev_mastered,
                       sum(prev_answered) prev_answered, sum(prev_correct) prev_correct
                from classes c left join per on per.class_id = c.id
                where c.id = any(v_pool)
                group by c.id, c.name
             ),
             -- per-class averages (fair across different class sizes)
             base as (
                select a.*,
                       case when members>0 then distinct_q::numeric/members else 0 end avg_q,
                       case when members>0 then mastered::numeric/members else 0 end avg_m,
                       case when members>0 then active_streaks::numeric/members*100 else null end active_pct,
                       case when answered>=v_min_answers then correct::numeric/nullif(answered,0) end accuracy,
                       case when prev_answered>=v_min_answers then prev_correct::numeric/nullif(prev_answered,0) end prev_accuracy,
                       case when members>0 then prev_distinct_q::numeric/members else 0 end prev_avg_q,
                       case when members>0 then prev_mastered::numeric/members else 0 end prev_avg_m
                from agg a
             ),
             maxes as (
                select nullif(max(avg_q),0)::numeric mx_q, nullif(max(avg_m),0)::numeric mx_m,
                       nullif(max(prev_avg_q),0)::numeric pmx_q, nullif(max(prev_avg_m),0)::numeric pmx_m from base
             ),
             scored as (
                select b.*,
                       round(1000*(0.5*coalesce(b.avg_m/m.mx_m,0)+0.3*coalesce(b.avg_q/m.mx_q,0)+0.2*coalesce(b.accuracy,0))) overall,
                       round(1000*(0.5*coalesce(b.prev_avg_m/m.pmx_m,0)+0.3*coalesce(b.prev_avg_q/m.pmx_q,0)+0.2*coalesce(b.prev_accuracy,0))) prev_overall
                from base b cross join maxes m
             ),
             valued as (
                select s.*,
                       case p_metric when 'accuracy' then s.accuracy when 'attempts' then s.avg_q
                            when 'mastery' then s.avg_m else s.overall::numeric end mval,
                       case p_metric when 'accuracy' then s.prev_accuracy when 'attempts' then s.prev_avg_q
                            when 'mastery' then s.prev_avg_m else s.prev_overall::numeric end pmval
                from scored s
             ),
             ranked as (
                select v.*,
                       case when v.mval is not null and v.mval>0 then rank() over (order by v.mval desc nulls last, v.avg_q desc, v.class_id) end rnk,
                       case when v_has_prev and v.pmval is not null and v.pmval>0 then rank() over (order by v.pmval desc nulls last, v.prev_avg_q desc, v.class_id) end prnk
                from valued v
             )
        select coalesce(jsonb_agg(row_to_json(x)::jsonb order by coalesce(x.rank,100000)), '[]'::jsonb)
        into v_rows
        from (
            select r.rnk rank, r.prnk prev_rank,
                   case when r.rnk is not null and r.prnk is not null then r.prnk - r.rnk end delta,
                   (r.class_id = any(v_self_classes)) is_self,
                   r.class_name name, r.members,
                   round(r.avg_q,1) avg_q, round(r.avg_m,1) avg_m,
                   round(r.accuracy*100,1) accuracy_pct, r.mastered, r.distinct_q, r.overall,
                   round(r.active_pct,0) active_pct
            from ranked r
        ) x;
        v_pool_size := array_length(v_pool, 1);
    end if;

    return jsonb_build_object(
        'meta', jsonb_build_object(
            'scope', p_scope, 'metric', p_metric, 'window', p_window,
            'subject', v_subject, 'is_teacher', v_is_teacher, 'class_id', p_class_id,
            'anonymised', (not v_is_teacher and not v_show_names),
            'self_rank', v_self_rank, 'pool_size', v_pool_size,
            'visible_count', v_visible, 'min_answers', v_min_answers,
            'has_prev', v_has_prev, 'class_count', array_length(v_pool,1)
        ),
        'rows', coalesce(v_rows, '[]'::jsonb)
    );
end;
$$;
grant execute on function get_leaderboard(text, text, text, uuid, text, uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · TEACHER META (settings + link groups for the UI)
-- ══════════════════════════════════════════════════════════════
-- One call to paint the teacher's leaderboard-admin panel: their classes for a
-- subject (with each class's settings + roster for the exclude list), and their
-- link groups. Everything here is the caller's own data, but bundling it keeps
-- the dashboard to a single round trip. Owner-checked implicitly (only own rows).
create or replace function get_leaderboard_admin(p_subject text) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_sid uuid;
    v_classes jsonb;
    v_groups jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    select id into v_sid from subjects where slug = p_subject;
    if v_sid is null then raise exception 'unknown subject'; end if;

    select coalesce(jsonb_agg(jsonb_build_object(
        'class_id', c.id, 'name', c.name,
        'enabled', coalesce(ls.enabled, true),
        'show_names', coalesce(ls.show_names, true),
        'visible_count', coalesce(ls.visible_count, 10),
        'students', (select coalesce(jsonb_agg(jsonb_build_object(
                        'student_id', p.id, 'username', p.username,
                        'excluded', exists (select 1 from leaderboard_exclusions x
                                            where x.class_id = c.id and x.student_id = p.id))
                        order by p.username), '[]'::jsonb)
                     from class_students cs2 join profiles p on p.id = cs2.student_id
                     where cs2.class_id = c.id)
    ) order by c.name), '[]'::jsonb)
    into v_classes
    from classes c
    left join leaderboard_settings ls on ls.class_id = c.id
    where c.teacher_id = v_uid and c.subject_id = v_sid and not c.archived;

    select coalesce(jsonb_agg(jsonb_build_object(
        'group_id', g.id, 'name', g.name,
        'class_ids', (select coalesce(jsonb_agg(m.class_id), '[]'::jsonb)
                      from class_link_group_members m where m.group_id = g.id)
    ) order by g.name), '[]'::jsonb)
    into v_groups
    from class_link_groups g
    where g.teacher_id = v_uid and g.subject_id = v_sid;

    return jsonb_build_object('classes', v_classes, 'groups', v_groups);
end;
$$;
grant execute on function get_leaderboard_admin(text) to authenticated;

-- Upsert one class's settings (owner only). Clamps visible_count to the CHECK
-- range so a tampered client can't store nonsense.
create or replace function set_leaderboard_settings(
    p_class_id uuid, p_enabled boolean, p_show_names boolean, p_visible_count int) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;
    insert into leaderboard_settings (class_id, enabled, show_names, visible_count, updated_at)
    values (p_class_id, coalesce(p_enabled,true), coalesce(p_show_names,true),
            least(greatest(coalesce(p_visible_count,10), 0), 200), now())
    on conflict (class_id) do update
        set enabled = excluded.enabled, show_names = excluded.show_names,
            visible_count = excluded.visible_count, updated_at = now();
end;
$$;
grant execute on function set_leaderboard_settings(uuid, boolean, boolean, int) to authenticated;

-- Exclude / re-include one student (owner only).
create or replace function set_leaderboard_exclusion(
    p_class_id uuid, p_student_id uuid, p_excluded boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;
    if coalesce(p_excluded, false) then
        insert into leaderboard_exclusions (class_id, student_id)
        values (p_class_id, p_student_id) on conflict do nothing;
    else
        delete from leaderboard_exclusions where class_id = p_class_id and student_id = p_student_id;
    end if;
end;
$$;
grant execute on function set_leaderboard_exclusion(uuid, uuid, boolean) to authenticated;

-- Create / replace a link group's membership in one call (owner only). Passing
-- an existing p_group_id renames + re-members it; null creates a new one.
-- Only classes the caller owns in the subject are accepted.
create or replace function save_class_link_group(
    p_group_id uuid, p_subject text, p_name text, p_class_ids uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_sid uuid;
    v_gid uuid := p_group_id;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    select id into v_sid from subjects where slug = p_subject;
    if v_sid is null then raise exception 'unknown subject'; end if;

    if v_gid is null then
        insert into class_link_groups (teacher_id, subject_id, name)
        values (v_uid, v_sid, coalesce(nullif(trim(p_name),''), 'Group')) returning id into v_gid;
    else
        update class_link_groups set name = coalesce(nullif(trim(p_name),''), name)
        where id = v_gid and teacher_id = v_uid;
        if not found then raise exception 'Not authorised'; end if;
        delete from class_link_group_members where group_id = v_gid;
    end if;

    insert into class_link_group_members (group_id, class_id)
    select v_gid, c.id from classes c
    where c.id = any(p_class_ids) and c.teacher_id = v_uid and c.subject_id = v_sid
    on conflict do nothing;

    return v_gid;
end;
$$;
grant execute on function save_class_link_group(uuid, text, text, uuid[]) to authenticated;

create or replace function delete_class_link_group(p_group_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    delete from class_link_groups where id = p_group_id and teacher_id = auth.uid();
    if not found then raise exception 'Not authorised'; end if;
end;
$$;
grant execute on function delete_class_link_group(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · ACHIEVEMENTS SYNC (for gamification badges)
-- ══════════════════════════════════════════════════════════════
-- Recomputes the caller's all-time Overall rank within their OWN class for a
-- subject, server-side, and folds it into their durable bests. Called by
-- leaderboard.js on load (students only). Returns the updated achievement row
-- so the client can toast a freshly-earned tier immediately. Rank is computed
-- here — never accepted from the client — so the badges stay real.
create or replace function sync_my_leaderboard_achievements(p_subject text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid   uuid := auth.uid();
    v_sid   uuid;
    v_class uuid;
    v_rank  int;
    v_size  int;
    v_pct   numeric;
    v_row   leaderboard_achievements%rowtype;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    select id into v_sid from subjects where slug = p_subject;
    if v_sid is null then return '{}'::jsonb; end if;

    select cs.class_id into v_class
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid and c.subject_id = v_sid
    order by cs.joined_at asc limit 1;
    if v_class is null then return '{}'::jsonb; end if;

    with m as (select * from _lb_window_metrics(array[v_class], p_subject, timestamptz '1970-01-01', now())),
         dr as (select student_id, total_mastered from daily_revise_stats where subject_slug = p_subject),
         base as (
            select m.student_id, m.distinct_q,
                   coalesce(dr.total_mastered,0) mastered,
                   case when m.answered >= 10 then m.correct::numeric/nullif(m.answered,0) end accuracy
            from m left join dr on dr.student_id = m.student_id
            where not exists (select 1 from leaderboard_exclusions x where x.class_id = v_class and x.student_id = m.student_id)
         ),
         mx as (select nullif(max(distinct_q),0)::numeric q, nullif(max(mastered),0)::numeric mm from base),
         scored as (
            select b.student_id,
                   round(1000*(0.5*coalesce(b.mastered/mx.mm,0)+0.3*coalesce(b.distinct_q/mx.q,0)+0.2*coalesce(b.accuracy,0))) overall
            from base b cross join mx
         ),
         ranked as (
            select student_id, overall,
                   rank() over (order by overall desc) rnk, count(*) over () n
            from scored where overall > 0
         )
    select rnk, n into v_rank, v_size from ranked where student_id = v_uid;

    if v_rank is null then
        -- Not yet ranked (no activity) — return current bests untouched.
        select * into v_row from leaderboard_achievements where student_id = v_uid and subject_slug = p_subject;
        return coalesce(to_jsonb(v_row), '{}'::jsonb);
    end if;

    v_pct := case when v_size > 1 then (v_size - v_rank)::numeric / (v_size - 1) else 1 end;

    insert into leaderboard_achievements (student_id, subject_slug, best_rank, best_percentile,
        ever_top10, ever_top3, ever_first, updated_at)
    values (v_uid, p_subject, v_rank, v_pct,
            v_rank <= 10, v_rank <= 3, v_rank = 1, now())
    on conflict (student_id, subject_slug) do update set
        best_rank       = least(leaderboard_achievements.best_rank, excluded.best_rank),
        best_percentile = greatest(leaderboard_achievements.best_percentile, excluded.best_percentile),
        ever_top10      = leaderboard_achievements.ever_top10 or excluded.ever_top10,
        ever_top3       = leaderboard_achievements.ever_top3  or excluded.ever_top3,
        ever_first      = leaderboard_achievements.ever_first or excluded.ever_first,
        updated_at      = now()
    returning * into v_row;

    return to_jsonb(v_row);
end;
$$;
grant execute on function sync_my_leaderboard_achievements(text) to authenticated;

-- Cross-subject roll-up of the caller's leaderboard achievements, for badge
-- computation on badges.html / the HUD (gamification.js sums nothing here — it
-- just needs the best-ever flags across subjects).
create or replace function get_my_leaderboard_achievements() returns jsonb
language sql security definer stable set search_path = public as $$
    select coalesce(jsonb_build_object(
        'best_rank',  min(best_rank),
        'best_percentile', max(best_percentile),
        'ever_top10', bool_or(ever_top10),
        'ever_top3',  bool_or(ever_top3),
        'ever_first', bool_or(ever_first)
    ), '{}'::jsonb)
    from leaderboard_achievements where student_id = auth.uid();
$$;
grant execute on function get_my_leaderboard_achievements() to authenticated;
