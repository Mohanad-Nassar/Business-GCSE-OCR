-- ══════════════════════════════════════════════════════════════
-- REWARDS STORE — COIN ECONOMY (WP-1) — run AFTER schema.sql,
-- daily-revise-stats-schema.sql, daily-revise-functions.sql,
-- spaced-repetition.sql, leaderboard.sql and gamification-functions.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Design source of truth: docs/REWARDS-STORE-PLAN.md.
--
-- DUAL CURRENCY. XP is unchanged — still a pure function of progress
-- (gamification.js), never stored, never spent. This adds COINS, a second,
-- SPENDABLE currency. Spending never touches XP / level / streak / badges.
--
-- ANTI-FORGE MODEL (the whole point — see [[architecture-scale-security]]):
--   • earned  = accrued server-side into wallet_ledger from server-graded,
--               self-RLS signals a student cannot write directly
--               (mastery_events, topic_reviews). It is a MONOTONIC HIGH-WATER
--               MARK (only ever increases → a balance can never go negative)
--               and is DAILY-CAPPED (anti-grind, plan §4.2/§6.4).
--   • spent   = an append-only ledger (student_purchases).
--   • balance = earned − spent, ALWAYS recomputed server-side inside buy_item.
--               The client's idea of its balance is trusted for nothing.
--
--   ⚠ SIGNAL TRUST (honest): earned draws only on mastery_events (first-masteries)
--   and completed topic_reviews. record_mastery_answer now gates the mastery
--   counters to FIRST-EVER per question (daily-revise-functions.sql, 2026-07-19),
--   so mastery is distinct-once and CANNOT be farmed past the number of real
--   questions that exist — the coin earning signal is genuinely earned. Residual,
--   lower-stakes gaps stay bounded by the DAILY CAP: a student who already knows an
--   answer can master a question once trivially (answer visibility is OUT OF SCOPE
--   per [[architecture-scale-security]] §1), and review completion still lacks
--   per-subject enrolment scoping (the P1 "topic pages trust client answers" work).
--   Streak and raw-attempt rewards remain excluded until progress_events is
--   server-graded. Net: coins are earned, not minted; residual abuse is capped at
--   ~one day's worth — no faster than just doing the work.
--
-- CHILDREN'S DATA: no new personal data — only a student's own purchases and a
-- cosmetic loadout (non-sensitive ids), self-scoped by RLS. Teachers may read a
-- student's equipped avatar (roster display); peers never read it directly —
-- classmate rendering goes through a definer function in WP-3, like get_leaderboard.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- The catalogue, and the SERVER TRUTH for price + unlock rule. buy_item reads
-- price from HERE, never from the client. Characters are items too
-- (category='character') — the cast model means coins unlock characters as well
-- as cosmetics.
create table if not exists shop_items (
    item_id       text primary key,
    category      text not null check (category in
                    ('character','skin','hat','outfit','accessory','background','pet','frame','perk')),
    name          text not null,
    rarity        text not null default 'common' check (rarity in
                    ('common','uncommon','rare','epic','legendary','mythic')),
    tier          text not null default 'unlockable' check (tier in
                    ('starter','unlockable','prestige')),
    price         int check (price is null or price >= 0),  -- null = not buyable with coins
    unlock_rule   text,          -- null = not achievement-gated; else a rule key evaluated in WP-4
    is_consumable boolean not null default false,
    active        boolean not null default true,
    sort_order    int not null default 0,
    meta          jsonb not null default '{}'::jsonb
);
create index if not exists shop_items_category_idx on shop_items (category, sort_order);
-- Per-character wearables (WP-2b): a hat/outfit/accessory drawn to fit ONE
-- character (avatar.js WEARABLES). null = universal (skins/backgrounds/frames/
-- pets, and the characters themselves). Additive column — safe on the live table.
alter table shop_items add column if not exists character_scope text;

-- Append-only purchase ledger — a student's owned items. UNIQUE(student_id,
-- item_id): you own an item once, and it doubles as a database-level guard
-- against a double-buy race (belt with the advisory-lock braces in buy_item).
create table if not exists student_purchases (
    id           bigserial primary key,
    student_id   uuid not null references profiles(id) on delete cascade,
    item_id      text not null references shop_items(item_id) on delete cascade,
    price_paid   int  not null default 0,
    purchased_at timestamptz not null default now(),
    unique (student_id, item_id)
);
create index if not exists student_purchases_student_idx on student_purchases (student_id);

-- The one genuinely per-student PREFERENCE: which character is worn, and the
-- cosmetic loadout on top of it. Written ONLY via equip_character()/equip_items()
-- (SECURITY DEFINER), which validate ownership/slot — so it can only ever
-- reference items the student owns or free Starters. There is deliberately NO
-- direct-write RLS policy (a `for all` policy would let a student equip anything).
create table if not exists student_avatar (
    student_id   uuid primary key references profiles(id) on delete cascade,
    character_id text references shop_items(item_id),
    loadout      jsonb not null default '{}'::jsonb,   -- { slot: item_id, … }
    updated_at   timestamptz not null default now()
);

-- The coin wallet: a MONOTONIC, DAILY-CAPPED accrual. `earned` only ever rises
-- (high-water mark → balance = earned − spent can never go negative, even if an
-- underlying signal wobbles down, e.g. a page-progress reset). `earned_today`
-- caps how much can accrue in a single day (anti-grind). Written ONLY by the
-- wallet functions (definer); self-read only.
create table if not exists wallet_ledger (
    student_id   uuid primary key references profiles(id) on delete cascade,
    earned       int  not null default 0,     -- lifetime coins earned (never decreases)
    day          date,                         -- day that earned_today applies to
    earned_today int  not null default 0,      -- coins accrued so far today (for the daily cap)
    seeded       boolean not null default false,-- capped retroactive launch grant applied
    updated_at   timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · ROW LEVEL SECURITY  (every table, no exceptions)
-- ══════════════════════════════════════════════════════════════

alter table shop_items        enable row level security;
alter table student_purchases enable row level security;
alter table student_avatar    enable row level security;
alter table wallet_ledger     enable row level security;

-- shop_items — readable by any signed-in user (the catalogue isn't secret; its
-- prices are server-truth the client can't write). No write policy: seeded here.
drop policy if exists "shop_items_read" on shop_items;
create policy "shop_items_read" on shop_items
    for select using (active and auth.uid() is not null);

-- student_purchases — self read only. NO insert/update/delete policy: every write
-- goes through buy_item() (definer), same trust pattern as question_mastery.
drop policy if exists "student_purchases_self_select" on student_purchases;
create policy "student_purchases_self_select" on student_purchases
    for select using (student_id = auth.uid());

-- student_avatar — owner reads their own; the student's teacher may read it
-- (roster). NO direct write policy — writes only via equip_character()/equip_items()
-- so ownership/slot rules can't be bypassed by a direct upsert.
drop policy if exists "student_avatar_self_all"       on student_avatar;   -- remove any earlier over-broad policy
drop policy if exists "student_avatar_self_select"    on student_avatar;
create policy "student_avatar_self_select" on student_avatar
    for select using (student_id = auth.uid());
drop policy if exists "student_avatar_teacher_select" on student_avatar;
create policy "student_avatar_teacher_select" on student_avatar
    for select using (teaches_student(student_avatar.student_id));

-- wallet_ledger — self read only; written by the wallet functions (definer).
drop policy if exists "wallet_ledger_self_select" on wallet_ledger;
create policy "wallet_ledger_self_select" on wallet_ledger
    for select using (student_id = auth.uid());


-- ══════════════════════════════════════════════════════════════
-- SECTION 2b · PERK TABLES  (consumables — WP-5)
-- Perks are consumables (buy many, spend on use), so they live OUTSIDE the
-- own-once student_purchases ledger. A perk may only affect NON-attainment
-- signals (docs/REWARDS-STORE-PLAN.md §5/§6) — never mastery/accuracy.
-- ══════════════════════════════════════════════════════════════

-- Current perk holdings (count owned; decremented on use).
create table if not exists student_perks (
    student_id uuid not null references profiles(id) on delete cascade,
    perk_key   text not null,                       -- a shop_items.item_id, category='perk'
    qty        int  not null default 0 check (qty >= 0),
    updated_at timestamptz not null default now(),
    primary key (student_id, perk_key)
);

-- Append-only spend ledger for perk buys. Coins spent here count toward the
-- wallet exactly like student_purchases — see _wallet_spent().
create table if not exists perk_purchases (
    id           bigserial primary key,
    student_id   uuid not null references profiles(id) on delete cascade,
    perk_key     text not null,
    price_paid   int  not null check (price_paid >= 0),
    purchased_at timestamptz not null default now()
);
create index if not exists perk_purchases_student_idx on perk_purchases (student_id);

-- Streak-freeze shields: a date that counts as "active" for a subject's day-
-- streak. Written only by use_perk('perk_streak_freeze'); UNIONed into the three
-- streak functions. Touches ONLY the streak (consistency), never any mark.
create table if not exists streak_shields (
    student_id   uuid not null references profiles(id) on delete cascade,
    subject_slug text not null references subjects(slug),
    shield_date  date not null,
    created_at   timestamptz not null default now(),
    primary key (student_id, subject_slug, shield_date)
);

alter table student_perks   enable row level security;
alter table perk_purchases  enable row level security;
alter table streak_shields  enable row level security;

-- Self-SELECT only; every write goes through the SECURITY DEFINER perk RPCs
-- (fail-closed — no INSERT/UPDATE/DELETE policy).
drop policy if exists "student_perks_self_select" on student_perks;
create policy "student_perks_self_select" on student_perks for select using (student_id = auth.uid());
drop policy if exists "perk_purchases_self_select" on perk_purchases;
create policy "perk_purchases_self_select" on perk_purchases for select using (student_id = auth.uid());
drop policy if exists "streak_shields_self_select" on streak_shields;
create policy "streak_shields_self_select" on streak_shields for select using (student_id = auth.uid());

grant select on student_perks, perk_purchases, streak_shields to authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · FUNCTIONS  (all SECURITY DEFINER, fixed search_path, auth.uid()-gated)
-- ══════════════════════════════════════════════════════════════

-- Uncapped lifetime EARNING TARGET — the compute-on-read formula. EVERY term is
-- a FORGE-SAFE, server-written signal for the calling student (auth.uid()); a
-- tampered client cannot inflate any of them (docs/REWARDS-STORE-PLAN.md §4/§6):
--   • the RULE-OF-3 LADDER (owner design 2026-07-20) — a question pays as it is
--     learned: 1 coin the 1st time it is answered correctly, 2 the 2nd, 3 the 3rd
--     (= mastered) ⇒ 6 coins total per question mastered. Wrong answers pay 0.
--     Both inputs are server-graded (question_mastery + mastery_events are written
--     only by record_mastery_answer / grade_topic_answer, never by a client).
--     mastery_count RESETS on a wrong answer (pedagogy: forgotten questions must
--     re-surface) — that is NOT a farm, because the wallet is a MONOTONIC
--     high-water ledger: re-climbing a ladder you've already been paid for adds
--     nothing. Ever-mastered questions are pinned at the full 6 via mastery_events
--     (first-ever, never cleared) so a later reset can't drop them back down.
--   • completed topic reviews — completed_at set server-side, never cleared.
--   • completed teacher tasks (distinct task) — task_attempts.status='submitted'
--     is flipped only inside submit_task_attempt; the table is read-only to
--     clients. Guarded by to_regclass so this still works if tasks aren't deployed.
--     NOTE: this one pays on SUBMISSION whatever the mark — the fairness backstop
--     now that every other term is correctness-gated.
-- STILL EXCLUDED (client-forgeable until the topic-page server-grading rollout):
-- topic completion + per-topic accuracy (progress_summary / is_correct are still
-- client-written for fib/exam/learn/misc/tips). Weights are v1 — calibrate WP-6.
-- The real anti-grind governor is the daily cap in _wallet_earned(), not these.
create or replace function _wallet_target() returns int
language plpgsql stable security definer set search_path = public as $$
declare
    v_uid    uuid := auth.uid();
    v_mast   int := 0;   -- questions EVER mastered → full ladder (1+2+3) each
    v_ladder int := 0;   -- questions part-way up the ladder (not yet mastered)
    v_rev    int := 0;   -- reviews completed
    v_task   int := 0;   -- teacher tasks completed
begin
    if v_uid is null then return 0; end if;

    select count(*) into v_mast from mastery_events where student_id = v_uid;

    -- Everything without a mastery_event row, priced off the CURRENT count:
    -- 1 correct = 1, 2 correct = 1+2 = 3, 3 correct = 1+2+3 = 6. The count=3 case
    -- matters because question_mastery is ALSO advanced by grade_topic_answer
    -- (server-graded MCQ / True-False on topic pages) while mastery_events is
    -- written only by Daily Revise — so without it, mastering on a topic page
    -- would pay 3 instead of 6. mastery_count is CHECKed to 0..3.
    select coalesce(sum(case when qm.mastery_count >= 3 then 6
                             when qm.mastery_count  = 2 then 3
                             when qm.mastery_count  = 1 then 1
                             else 0 end), 0)
      into v_ladder
    from question_mastery qm
    where qm.student_id = v_uid
      and not exists (select 1 from mastery_events me
                      where me.student_id = v_uid and me.question_key = qm.question_key);

    select count(*) into v_rev  from topic_reviews  where student_id = v_uid and completed_at is not null;

    -- Tasks are an optional subsystem; skip cleanly if its schema isn't present.
    if to_regclass('public.task_attempts') is not null then
        select count(distinct task_id) into v_task
        from task_attempts where student_id = v_uid and status = 'submitted';
    end if;

    return coalesce(v_mast,   0) * 6      -- mastered question: 1 + 2 + 3
         + coalesce(v_ladder, 0)          -- part-way: 1 (once right) or 3 (twice right)
         + coalesce(v_rev,    0) * 5      -- retention
         + coalesce(v_task,   0) * 10;    -- assigned work (pays on submission, whatever the mark)
end;
$$;

-- Accrue earned coins toward the target, MONOTONICALLY (never decreases) and
-- DAILY-CAPPED (anti-grind). Lazily creates the ledger row with the capped
-- retroactive launch grant on first read. Row-locked so concurrent reads can't
-- double-accrue.
create or replace function _wallet_earned() returns int
language plpgsql security definer set search_path = public as $$
declare
    v_uid    uuid := auth.uid();
    v_target int;
    v_row    wallet_ledger%rowtype;
    v_today  date := current_date;
    v_allow  int;
    v_delta  int;
    v_grant  int;
    c_daily  constant int := 100;   -- max coins that can accrue per day (anti-grind). Tune WP-6.
    c_retro  constant int := 600;   -- capped retroactive launch grant.               Tune WP-6.
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    v_target := _wallet_target();

    -- ensure a ledger row exists (capped retroactive grant on first creation);
    -- race-safe — a concurrent first read converges on one row.
    insert into wallet_ledger (student_id, earned, day, earned_today, seeded)
    values (v_uid, least(v_target, c_retro), v_today, 0, true)
    on conflict (student_id) do nothing;

    select * into v_row from wallet_ledger where student_id = v_uid for update;

    if v_row.day is distinct from v_today then      -- new day → reset the daily bucket
        v_row.earned_today := 0;
        v_row.day := v_today;
    end if;

    v_delta := v_target - v_row.earned;             -- shortfall to bank (never negative-effect)
    if v_delta > 0 then
        v_allow := greatest(c_daily - v_row.earned_today, 0);
        v_grant := least(v_delta, v_allow);
        v_row.earned := v_row.earned + v_grant;
        v_row.earned_today := v_row.earned_today + v_grant;
    end if;

    update wallet_ledger
       set earned = v_row.earned, day = v_row.day,
           earned_today = v_row.earned_today, updated_at = now()
     where student_id = v_uid;
    return v_row.earned;
end;
$$;

-- Total coins SPENT by the caller: permanent purchases + consumable perk buys.
-- One helper so get_my_wallet, buy_item and buy_perk all agree on the balance
-- (a mismatch would let coins be double-spent across the two ledgers).
create or replace function _wallet_spent() returns int
language sql stable security definer set search_path = public as $$
    select coalesce((select sum(price_paid) from student_purchases where student_id = auth.uid()), 0)
         + coalesce((select sum(price_paid) from perk_purchases    where student_id = auth.uid()), 0);
$$;
revoke execute on function _wallet_spent() from public, anon, authenticated;

-- Public: the wallet snapshot for the current student.
create or replace function get_my_wallet() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid   uuid := auth.uid();
    v_earn  int;
    v_spent int;
    v_today int;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    v_earn := _wallet_earned();
    v_spent := _wallet_spent();
    select earned_today into v_today from wallet_ledger where student_id = v_uid;
    return jsonb_build_object(
        'balance', v_earn - v_spent,
        'earned',  v_earn,
        'spent',   v_spent,
        'earned_today', coalesce(v_today, 0)
    );
end;
$$;

-- Public: THE anti-forge chokepoint. Re-checks existence, active, price,
-- purchasability, ownership and affordability entirely server-side, then writes
-- the ledger row atomically. The client sends only an item id.
create or replace function buy_item(p_item_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid  uuid := auth.uid();
    v_item shop_items%rowtype;
    v_bal  int;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        raise exception 'students only';
    end if;
    -- serialise this student's purchases so two concurrent buys can't both pass
    -- the balance check and overspend (the UNIQUE constraint additionally blocks
    -- duplicate items).
    perform pg_advisory_xact_lock(hashtext(v_uid::text)::bigint);

    select * into v_item from shop_items where item_id = p_item_id and active;
    if not found then raise exception 'item not found'; end if;
    if v_item.category = 'perk' or v_item.is_consumable then
        raise exception 'perks are bought via buy_perk';       -- consumables never enter the own-once ledger
    end if;
    if v_item.price is null or v_item.unlock_rule is not null then
        raise exception 'item not purchasable with coins';    -- prestige / not for sale
    end if;
    if v_item.price = 0 then
        raise exception 'item is free — no purchase needed';  -- free Starters equip without buying
    end if;
    if exists (select 1 from student_purchases where student_id = v_uid and item_id = p_item_id) then
        raise exception 'already owned';
    end if;

    v_bal := _wallet_earned() - _wallet_spent();
    if v_bal < v_item.price then raise exception 'insufficient balance'; end if;

    insert into student_purchases (student_id, item_id, price_paid)
    values (v_uid, p_item_id, v_item.price);

    return jsonb_build_object('ok', true, 'item_id', p_item_id, 'balance', v_bal - v_item.price);
end;
$$;

-- Public: choose the worn character. Allowed for a free Starter or a character
-- the student owns (bought, or later granted by a prestige claim in WP-4).
create or replace function equip_character(p_character_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid  uuid := auth.uid();
    v_item shop_items%rowtype;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        raise exception 'students only';
    end if;
    select * into v_item from shop_items
    where item_id = p_character_id and active and category = 'character';
    if not found then raise exception 'character not found'; end if;
    if v_item.tier <> 'starter'
       and not exists (select 1 from student_purchases where student_id = v_uid and item_id = p_character_id) then
        raise exception 'character not owned';
    end if;
    insert into student_avatar (student_id, character_id) values (v_uid, p_character_id)
    on conflict (student_id) do update set character_id = excluded.character_id, updated_at = now();
    return jsonb_build_object('ok', true, 'character_id', p_character_id);
end;
$$;

-- Public: set the cosmetic loadout. Every referenced item must be active, sit in
-- the cosmetic slot named by its category, and be a free Starter or owned.
create or replace function equip_items(p_loadout jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid  uuid := auth.uid();
    v_slot text;
    v_item text;
    v_rec  shop_items%rowtype;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        raise exception 'students only';
    end if;
    p_loadout := coalesce(p_loadout, '{}'::jsonb);
    if jsonb_typeof(p_loadout) <> 'object' then raise exception 'loadout must be an object'; end if;

    for v_slot, v_item in select key, value from jsonb_each_text(p_loadout) loop
        if v_item is null or v_item = '' then continue; end if;   -- empty slot
        if v_slot not in ('skin','hat','outfit','accessory','background','pet','frame') then
            raise exception 'not a cosmetic slot: %', v_slot;     -- characters go via equip_character
        end if;
        select * into v_rec from shop_items where item_id = v_item and active;
        if not found then raise exception 'unknown item: %', v_item; end if;
        if v_rec.category <> v_slot then raise exception 'item % does not belong in slot %', v_item, v_slot; end if;
        if v_rec.tier <> 'starter'
           and not exists (select 1 from student_purchases where student_id = v_uid and item_id = v_item) then
            raise exception 'item not owned: %', v_item;
        end if;
    end loop;

    insert into student_avatar (student_id, loadout) values (v_uid, p_loadout)
    on conflict (student_id) do update set loadout = excluded.loadout, updated_at = now();
    return jsonb_build_object('ok', true);
end;
$$;

-- Only the four public RPCs are callable by clients. The _wallet_* helpers are
-- internal (the definer functions call them as the owner). Revoke from every
-- client-reachable role explicitly — not just PUBLIC — in case the project's
-- default privileges grant execute to anon/authenticated directly.
grant  execute on function get_my_wallet()       to authenticated;
grant  execute on function buy_item(text)         to authenticated;
grant  execute on function equip_character(text)  to authenticated;
grant  execute on function equip_items(jsonb)     to authenticated;
revoke execute on function _wallet_target()       from public, anon, authenticated;
revoke execute on function _wallet_earned()       from public, anon, authenticated;

-- ── Default starter for students who haven't chosen ─────────────────────────
-- Deterministically map a student's id to ONE free starter character, so a
-- student who never opened the Locker still shows a stable face (never the bare
-- initial) — the SAME character in their header and on the leaderboard, and it
-- never flickers between renders (a hash of the id, not random()). Restricted
-- to tier='starter' (free), so this can never seat a paid/prestige character on
-- someone for nothing. Internal — clients reach it only via the wrappers below.
create or replace function _default_starter(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
    select item_id from (
        select item_id,
               row_number() over (order by sort_order, item_id) - 1 as idx,
               count(*)     over ()                                  as n
        from shop_items
        where category = 'character' and tier = 'starter' and active
    ) s
    where s.idx = abs(hashtext(p_uid::text)) % greatest(s.n, 1)
    limit 1;
$$;
revoke execute on function _default_starter(uuid) from public, anon, authenticated;

-- Public: the caller's avatar for rendering. Their equipped row if they have one
-- (chosen=true), else their deterministic default starter (chosen=false) — and
-- it does NOT write, so a plain read never manufactures a "choice". Equipping
-- (equip_character) is the only thing that persists a real pick. Teachers, who
-- have no avatar, get character=null and keep their initial.
create or replace function get_my_avatar_or_default() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_char    text;
    v_loadout jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    select character_id, loadout into v_char, v_loadout
    from student_avatar where student_id = v_uid;
    if v_char is not null then
        return jsonb_build_object('character', v_char, 'loadout', coalesce(v_loadout, '{}'::jsonb), 'chosen', true);
    end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        return jsonb_build_object('character', null, 'loadout', '{}'::jsonb, 'chosen', false);
    end if;
    return jsonb_build_object('character', _default_starter(v_uid), 'loadout', '{}'::jsonb, 'chosen', false);
end;
$$;
grant execute on function get_my_avatar_or_default() to authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3d · PERKS  (WP-5 — buy_perk / use_perk)
-- Consumables whose effects touch ONLY non-attainment signals: a per-subject
-- streak shield (consistency, not a mark) and a random-cosmetic box. They never
-- read or write mastery_events / question_mastery / accuracy.
-- ══════════════════════════════════════════════════════════════

-- Buy a consumable perk (category='perk'). Same anti-forge chokepoint as
-- buy_item: server re-checks price + affordability, records the spend in
-- perk_purchases (counted by _wallet_spent), increments the holding. Serialised
-- per student so it can't race buy_item into an overspend.
create or replace function buy_perk(p_perk_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid  uuid := auth.uid();
    v_item shop_items%rowtype;
    v_bal  int;
    v_qty  int;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        raise exception 'students only';
    end if;
    perform pg_advisory_xact_lock(hashtext(v_uid::text)::bigint);

    select * into v_item from shop_items where item_id = p_perk_key and active and category = 'perk';
    if not found then raise exception 'perk not found'; end if;
    if v_item.price is null or v_item.unlock_rule is not null then raise exception 'perk not purchasable with coins'; end if;
    if v_item.price = 0 then raise exception 'perk is free'; end if;

    v_bal := _wallet_earned() - _wallet_spent();
    if v_bal < v_item.price then raise exception 'insufficient balance'; end if;

    insert into perk_purchases (student_id, perk_key, price_paid) values (v_uid, p_perk_key, v_item.price);
    insert into student_perks (student_id, perk_key, qty) values (v_uid, p_perk_key, 1)
        on conflict (student_id, perk_key) do update set qty = student_perks.qty + 1, updated_at = now();
    select qty into v_qty from student_perks where student_id = v_uid and perk_key = p_perk_key;

    return jsonb_build_object('ok', true, 'perk_key', p_perk_key, 'balance', v_bal - v_item.price, 'qty', v_qty);
end;
$$;
grant execute on function buy_perk(text) to authenticated;

-- Use a held perk. The effect runs FIRST and raises if it can't apply (which
-- rolls the whole tx back, so the perk isn't wasted); the holding is decremented
-- only on success. p_subject is required for the streak freeze (per-subject).
create or replace function use_perk(p_perk_key text, p_subject text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid    uuid := auth.uid();
    v_qty    int;
    v_last   date;
    v_shield date;
    v_grant  text;
    v_result jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from profiles where id = v_uid and role = 'student') then
        raise exception 'students only';
    end if;
    perform pg_advisory_xact_lock(hashtext(v_uid::text)::bigint);

    select qty into v_qty from student_perks where student_id = v_uid and perk_key = p_perk_key;
    if coalesce(v_qty, 0) < 1 then raise exception 'you have none of that perk'; end if;

    if p_perk_key = 'perk_streak_freeze' then
        if p_subject is null then raise exception 'subject required'; end if;
        if not exists (select 1 from subjects where slug = p_subject) then raise exception 'unknown subject'; end if;
        -- last day that already counts as active: real practice OR an earlier shield
        select max(d) into v_last from (
            select (answered_at at time zone 'utc')::date as d from progress_events
            where student_id = v_uid and page_id like p_subject || ':%'
            union
            select shield_date from streak_shields where student_id = v_uid and subject_slug = p_subject
        ) x;
        if v_last is null then raise exception 'no streak to protect yet'; end if;
        v_shield := v_last + 1;                                   -- bridge the single next gap day
        if v_shield > current_date then raise exception 'your streak is safe today — save the freeze for a day you miss'; end if;
        if v_shield < current_date - 1 then raise exception 'that streak lapsed too long ago — a freeze only covers a single missed day'; end if;
        if exists (select 1 from streak_shields where student_id = v_uid and subject_slug = p_subject and shield_date = v_shield) then
            raise exception 'that day is already frozen';
        end if;
        insert into streak_shields (student_id, subject_slug, shield_date) values (v_uid, p_subject, v_shield);
        v_result := jsonb_build_object('ok', true, 'effect', 'streak_freeze', 'subject', p_subject, 'frozen_date', v_shield);

    elsif p_perk_key = 'perk_mystery_box' then
        -- a random UNIVERSAL cosmetic the student doesn't already own (universal =
        -- works on any character, so a box never grants gear for a locked one)
        select item_id into v_grant from shop_items s
        where s.active and s.character_scope is null
          and s.category in ('skin','background','frame','pet')
          and s.price is not null and s.unlock_rule is null
          and not exists (select 1 from student_purchases sp where sp.student_id = v_uid and sp.item_id = s.item_id)
        order by random() limit 1;
        if v_grant is null then raise exception 'you already own every cosmetic a box can hold'; end if;
        insert into student_purchases (student_id, item_id, price_paid) values (v_uid, v_grant, 0)
            on conflict (student_id, item_id) do nothing;
        v_result := jsonb_build_object('ok', true, 'effect', 'mystery_box', 'granted', v_grant,
                                       'granted_name', (select name from shop_items where item_id = v_grant));
    else
        raise exception 'unknown perk';
    end if;

    update student_perks set qty = qty - 1, updated_at = now() where student_id = v_uid and perk_key = p_perk_key;
    return v_result || jsonb_build_object('perk_key', p_perk_key, 'remaining', v_qty - 1);
end;
$$;
grant execute on function use_perk(text, text) to authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · SEED  (the 16-character cast + a starter cosmetic set)
-- The cast is locked (docs/REWARDS-STORE-PLAN.md). Cosmetics here are a small
-- representative set so buy_item is testable now; the full wardrobe is seeded
-- alongside the SVG art in WP-2. Idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════

insert into shop_items (item_id, category, name, rarity, tier, price, unlock_rule, sort_order) values
    -- Starters (free on day one)
    ('nova',    'character', 'Nova',    'rare',      'starter',    0,    null,               1),
    ('ember',   'character', 'Ember',   'rare',      'starter',    0,    null,               2),
    ('boba',    'character', 'Boba',    'uncommon',  'starter',    0,    null,               3),
    ('byte',    'character', 'Byte',    'uncommon',  'starter',    0,    null,               4),
    -- Unlockables (bought with coins)
    ('vesper',  'character', 'Vesper',  'epic',      'unlockable', 350,  null,               5),
    ('kitsu',   'character', 'Kitsu',   'rare',      'unlockable', 350,  null,               6),
    ('wisp',    'character', 'Wisp',    'uncommon',  'unlockable', 300,  null,               7),
    ('pixl',    'character', 'Pixl',    'uncommon',  'unlockable', 300,  null,               8),
    ('cadence', 'character', 'Cadence', 'rare',      'unlockable', 350,  null,               9),
    ('kami',    'character', 'Kami',    'rare',      'unlockable', 400,  null,              10),
    ('vyrn',    'character', 'Vyrn',    'epic',      'unlockable', 500,  null,              11),
    ('blot',    'character', 'Blot',    'rare',      'unlockable', 450,  null,              12),
    ('lumen',   'character', 'Lumen',   'epic',      'unlockable', 500,  null,              13),
    ('codex',   'character', 'Codex',   'epic',      'unlockable', 500,  null,              14),
    -- Prestige (earned only — not purchasable at any price; rules evaluated in WP-4)
    ('orion',   'character', 'Orion',   'legendary', 'prestige',   null, 'streak_30',       15),
    ('geode',   'character', 'Geode',   'mythic',    'prestige',   null, 'subject_mastery', 16),
    -- Universal cosmetics — item ids MUST match avatar.js SKINS/BACKGROUNDS/FRAMES/PETS keys
    ('skin_cyan',   'skin',       'Cyan',        'common',    'starter',    0,    null,        1),
    ('skin_berry',  'skin',       'Berry',       'uncommon',  'unlockable', 120,  null,        2),
    ('skin_mint',   'skin',       'Mint',        'common',    'unlockable', 80,   null,        3),
    ('skin_sky',    'skin',       'Sky',         'common',    'unlockable', 80,   null,        4),
    ('skin_grape',  'skin',       'Grape',       'uncommon',  'unlockable', 120,  null,        5),
    ('skin_coral',  'skin',       'Coral',       'uncommon',  'unlockable', 120,  null,        6),
    ('skin_ink',    'skin',       'Toxic Ink',   'rare',      'unlockable', 200,  null,        7),
    ('skin_gold',   'skin',       'Gold Shine',  'legendary', 'prestige',   null, 'streak_30', 8),
    ('bg_dawn',     'background',  'Dawn',        'common',    'unlockable', 100,  null,        1),
    ('bg_night',    'background',  'Starry Night','uncommon',  'unlockable', 200,  null,        2),
    ('bg_mint',     'background',  'Mint',        'common',    'unlockable', 100,  null,        3),
    ('bg_grid',     'background',  'Grid',        'common',    'unlockable', 100,  null,        4),
    ('frame_bronze','frame',      'Bronze',      'common',    'unlockable', 120,  null,        1),
    ('frame_silver','frame',      'Silver',      'uncommon',  'unlockable', 200,  null,        2),
    ('frame_gold',  'frame',      'Gold',        'rare',      'unlockable', 450,  null,        3),
    ('frame_glow',  'frame',      'Glow',        'epic',      'unlockable', 600,  null,        4),
    ('pet_spark',   'pet',        'Spark',       'common',    'unlockable', 120,  null,        1),
    ('pet_star',    'pet',        'Star Buddy',  'uncommon',  'unlockable', 200,  null,        2),
    ('pet_orb',     'pet',        'Orb',         'uncommon',  'unlockable', 200,  null,        3)
on conflict (item_id) do update set
    category   = excluded.category,
    name       = excluded.name,
    rarity     = excluded.rarity,
    tier       = excluded.tier,
    price      = excluded.price,
    unlock_rule= excluded.unlock_rule,
    sort_order = excluded.sort_order,
    active     = true;

-- Consumable perks (WP-5). is_consumable=true → bought via buy_perk (repeatable),
-- held in student_perks, spent via use_perk. Prices are v1 placeholders.
insert into shop_items (item_id, category, name, rarity, tier, price, unlock_rule, is_consumable, sort_order) values
    ('perk_streak_freeze', 'perk', 'Streak Freeze', 'uncommon', 'unlockable', 120, null, true, 1),
    ('perk_mystery_box',   'perk', 'Mystery Box',   'rare',     'unlockable', 150, null, true, 2)
on conflict (item_id) do update set
    category      = excluded.category,
    name          = excluded.name,
    rarity        = excluded.rarity,
    tier          = excluded.tier,
    price         = excluded.price,
    unlock_rule   = excluded.unlock_rule,
    is_consumable = excluded.is_consumable,
    sort_order    = excluded.sort_order,
    active        = true;

-- Per-character wearables (WP-2b) — one signature, character-accurate headwear
-- each (avatar.js WEARABLES). character_scope binds the item to its character;
-- the Locker only offers a character's own wearables, and avatar.js renders one
-- only while its character is worn. Item ids MUST match avatar.js WEARABLES keys.
insert into shop_items (item_id, category, name, rarity, tier, price, unlock_rule, sort_order, character_scope) values
    ('nova_crown',     'hat', 'Star Crown',      'rare',     'unlockable', 250, null, 1, 'nova'),
    ('vesper_wizard',  'hat', 'Arcane Hat',      'rare',     'unlockable', 250, null, 1, 'vesper'),
    ('byte_cap',       'hat', 'Ball Cap',        'uncommon', 'unlockable', 120, null, 1, 'byte'),
    ('ember_grad',     'hat', 'Grad Cap',        'uncommon', 'unlockable', 120, null, 1, 'ember'),
    ('kitsu_beanie',   'hat', 'Cosy Beanie',     'common',   'unlockable', 80,  null, 1, 'kitsu'),
    ('vyrn_crown',     'hat', 'Hoard Crown',     'rare',     'unlockable', 250, null, 1, 'vyrn'),
    ('wisp_tophat',    'hat', 'Spectral Topper', 'uncommon', 'unlockable', 120, null, 1, 'wisp'),
    ('orion_laurel',   'hat', 'Star Laurel',     'rare',     'unlockable', 250, null, 1, 'orion'),
    ('blot_tophat',    'hat', 'Ink Topper',      'uncommon', 'unlockable', 120, null, 1, 'blot'),
    ('pixl_crown',     'hat', '8-Bit Crown',     'rare',     'unlockable', 250, null, 1, 'pixl'),
    ('boba_hat',       'hat', 'Bowler',          'uncommon', 'unlockable', 120, null, 1, 'boba'),
    ('cadence_beanie', 'hat', 'Lofi Beanie',     'common',   'unlockable', 80,  null, 1, 'cadence'),
    ('kami_hat',       'hat', 'Paper Hat',       'common',   'unlockable', 80,  null, 1, 'kami'),
    ('lumen_crown',    'hat', 'Lure Crown',      'rare',     'unlockable', 250, null, 1, 'lumen'),
    ('codex_grad',     'hat', 'Scholar Board',   'uncommon', 'unlockable', 120, null, 1, 'codex'),
    ('geode_crown',    'hat', 'Crystal Crown',   'epic',     'unlockable', 400, null, 1, 'geode'),
    -- second wave (batch 1: a second headwear + an accessory each)
    ('nova_halo',      'hat',       'Halo',            'uncommon', 'unlockable', 120, null, 2, 'nova'),
    ('nova_medal',     'accessory', 'Gold Medal',      'rare',     'unlockable', 200, null, 3, 'nova'),
    ('vesper_halo',    'hat',       'Dark Halo',       'uncommon', 'unlockable', 120, null, 2, 'vesper'),
    ('vesper_amulet',  'accessory', 'Rune Amulet',     'uncommon', 'unlockable', 100, null, 3, 'vesper'),
    ('byte_shades',    'accessory', 'Visor Shades',    'uncommon', 'unlockable', 100, null, 2, 'byte'),
    ('byte_prop',      'hat',       'Propeller Cap',   'uncommon', 'unlockable', 120, null, 3, 'byte'),
    ('ember_horns',    'hat',       'Imp Horns',       'uncommon', 'unlockable', 120, null, 2, 'ember'),
    ('ember_shades',   'accessory', 'Cool Shades',     'uncommon', 'unlockable', 100, null, 3, 'ember'),
    ('kitsu_glasses',  'accessory', 'Sly Specs',       'common',   'unlockable', 80,  null, 2, 'kitsu'),
    ('kitsu_cap',      'hat',       'Snapback',        'uncommon', 'unlockable', 120, null, 3, 'kitsu'),
    ('vyrn_party',     'hat',       'Party Hat',       'common',   'unlockable', 80,  null, 2, 'vyrn'),
    ('vyrn_monocle',   'accessory', 'Gold Monocle',    'rare',     'unlockable', 200, null, 3, 'vyrn'),
    ('wisp_bow',       'hat',       'Spooky Bow',      'common',   'unlockable', 80,  null, 2, 'wisp'),
    ('wisp_chain',     'accessory', 'Ghost Chains',    'uncommon', 'unlockable', 100, null, 3, 'wisp'),
    ('orion_halo',     'hat',       'Gilded Halo',     'uncommon', 'unlockable', 120, null, 2, 'orion'),
    ('orion_comet',    'accessory', 'Comet',           'uncommon', 'unlockable', 100, null, 3, 'orion'),
    ('blot_glasses',   'accessory', 'Ink Specs',       'uncommon', 'unlockable', 100, null, 2, 'blot'),
    ('blot_bowler',    'hat',       'Ink Bowler',      'uncommon', 'unlockable', 120, null, 3, 'blot'),
    ('pixl_shades',    'accessory', 'Pixel Shades',    'uncommon', 'unlockable', 100, null, 2, 'pixl'),
    ('pixl_horns',     'hat',       'Viking Helm',     'rare',     'unlockable', 200, null, 3, 'pixl'),
    ('boba_glasses',   'accessory', 'Round Specs',     'common',   'unlockable', 80,  null, 2, 'boba'),
    ('boba_bow',       'hat',       'Straw Bow',       'common',   'unlockable', 80,  null, 3, 'boba'),
    ('cadence_shades', 'accessory', 'Lofi Shades',     'uncommon', 'unlockable', 100, null, 2, 'cadence'),
    ('cadence_cap',    'hat',       'Snapback',        'uncommon', 'unlockable', 120, null, 3, 'cadence'),
    ('kami_flower',    'accessory', 'Paper Bloom',     'common',   'unlockable', 80,  null, 2, 'kami'),
    ('kami_crown',     'hat',       'Paper Crown',     'uncommon', 'unlockable', 120, null, 3, 'kami'),
    ('lumen_shades',   'accessory', 'Deep Shades',     'uncommon', 'unlockable', 100, null, 2, 'lumen'),
    ('lumen_fin',      'hat',       'Dorsal Fin',      'uncommon', 'unlockable', 120, null, 3, 'lumen'),
    ('codex_glasses',  'accessory', 'Reading Glasses', 'common',   'unlockable', 80,  null, 2, 'codex'),
    ('codex_crown',    'hat',       'Book Crown',      'rare',     'unlockable', 200, null, 3, 'codex'),
    ('geode_spikes',   'hat',       'Extra Facets',    'uncommon', 'unlockable', 120, null, 2, 'geode'),
    ('geode_gem',      'accessory', 'Floating Gem',    'rare',     'unlockable', 200, null, 3, 'geode'),
    -- batch 2: an outfit (front piece) + a held item each (→ 5 wearables per character)
    ('nova_scarf',     'outfit',    'Scarf',           'common',   'unlockable', 100, null, 4, 'nova'),
    ('nova_flag',      'accessory', 'Explorer Flag',   'uncommon', 'unlockable', 120, null, 5, 'nova'),
    ('vesper_sash',    'outfit',    'Rune Sash',       'uncommon', 'unlockable', 120, null, 4, 'vesper'),
    ('vesper_book',    'accessory', 'Spellbook',       'rare',     'unlockable', 200, null, 5, 'vesper'),
    ('byte_tie',       'outfit',    'Necktie',         'common',   'unlockable', 100, null, 4, 'byte'),
    ('byte_wrench',    'accessory', 'Wrench',          'uncommon', 'unlockable', 120, null, 5, 'byte'),
    ('ember_bowtie',   'outfit',    'Bow Tie',         'common',   'unlockable', 100, null, 4, 'ember'),
    ('ember_fork',     'accessory', 'Pitchfork',       'rare',     'unlockable', 200, null, 5, 'ember'),
    ('kitsu_scarf',    'outfit',    'Fox Scarf',       'common',   'unlockable', 100, null, 4, 'kitsu'),
    ('kitsu_leaf',     'accessory', 'Magic Leaf',      'uncommon', 'unlockable', 120, null, 5, 'kitsu'),
    ('vyrn_bib',       'outfit',    'Scale Collar',    'common',   'unlockable', 100, null, 4, 'vyrn'),
    ('vyrn_coin',      'accessory', 'Gold Coin',       'uncommon', 'unlockable', 120, null, 5, 'vyrn'),
    ('wisp_bowtie',    'outfit',    'Ghost Bow',       'common',   'unlockable', 100, null, 4, 'wisp'),
    ('wisp_candle',    'accessory', 'Wisp Candle',     'uncommon', 'unlockable', 120, null, 5, 'wisp'),
    ('orion_sash',     'outfit',    'Star Belt',       'uncommon', 'unlockable', 120, null, 4, 'orion'),
    ('orion_moon',     'accessory', 'Crescent',        'rare',     'unlockable', 200, null, 5, 'orion'),
    ('blot_bowtie',    'outfit',    'Ink Bow',         'common',   'unlockable', 100, null, 4, 'blot'),
    ('blot_quill',     'accessory', 'Quill',           'uncommon', 'unlockable', 120, null, 5, 'blot'),
    ('pixl_collar',    'outfit',    'Pixel Collar',    'common',   'unlockable', 100, null, 4, 'pixl'),
    ('pixl_sword',     'accessory', 'Pixel Sword',     'rare',     'unlockable', 200, null, 5, 'pixl'),
    ('boba_sleeve',    'outfit',    'Cup Sleeve',      'common',   'unlockable', 100, null, 4, 'boba'),
    ('boba_heart',     'accessory', 'Heart',           'common',   'unlockable', 80,  null, 5, 'boba'),
    ('cadence_label',  'outfit',    'Mixtape Label',   'common',   'unlockable', 100, null, 4, 'cadence'),
    ('cadence_disc',   'accessory', 'Vinyl',           'uncommon', 'unlockable', 120, null, 5, 'cadence'),
    ('kami_ribbon',    'outfit',    'Paper Ribbon',    'common',   'unlockable', 100, null, 4, 'kami'),
    ('kami_crane2',    'accessory', 'Mini Crane',      'uncommon', 'unlockable', 120, null, 5, 'kami'),
    ('lumen_bowtie',   'outfit',    'Deep Bow',        'common',   'unlockable', 100, null, 4, 'lumen'),
    ('lumen_bubble',   'accessory', 'Bubbles',         'uncommon', 'unlockable', 120, null, 5, 'lumen'),
    ('codex_ribbon',   'outfit',    'Bookmark',        'common',   'unlockable', 100, null, 4, 'codex'),
    ('codex_scroll',   'accessory', 'Scroll',          'uncommon', 'unlockable', 120, null, 5, 'codex'),
    ('geode_sash',     'outfit',    'Gem Belt',        'uncommon', 'unlockable', 120, null, 4, 'geode'),
    ('geode_pick',     'accessory', 'Pickaxe',         'rare',     'unlockable', 200, null, 5, 'geode')
on conflict (item_id) do update set
    category   = excluded.category,
    name       = excluded.name,
    rarity     = excluded.rarity,
    tier       = excluded.tier,
    price      = excluded.price,
    unlock_rule= excluded.unlock_rule,
    sort_order = excluded.sort_order,
    character_scope = excluded.character_scope,
    active     = true;


-- ══════════════════════════════════════════════════════════════
-- Deactivate ids from earlier drafts that avatar.js has no art for (idempotent).
update shop_items set active = false where item_id in ('frame_champ','hat_beanie','hat_grad','hat_crown');


-- ══════════════════════════════════════════════════════════════
-- HOW TO TEST (run as a logged-in student — via the app, or set the request JWT
-- in the SQL editor). Expectations noted inline.
--   select get_my_wallet();                 -- {balance, earned, spent, earned_today}
--   select equip_character('nova');         -- ok (free Starter)
--   select equip_character('vesper');       -- ERROR: character not owned
--   select buy_item('hat_beanie');          -- ok if balance ≥ 80; balance drops 80
--   select buy_item('hat_beanie');          -- ERROR: already owned
--   select buy_item('orion');               -- ERROR: item not purchasable with coins
--   select buy_item('nova');                -- ERROR: item is free — no purchase needed
--   select equip_items('{"hat":"hat_beanie"}'::jsonb);   -- ok once owned
--   select equip_items('{"hat":"skin_cyan"}'::jsonb);    -- ERROR: wrong slot
-- FORGE CHECKS (all must fail):
--   insert into student_purchases(student_id,item_id) values (auth.uid(),'orion');  -- RLS: no insert policy
--   update wallet_ledger set earned = 999999 where student_id = auth.uid();         -- RLS: no update policy
--   insert into student_avatar(student_id,character_id) values (auth.uid(),'orion');-- RLS: no write policy
-- ══════════════════════════════════════════════════════════════
