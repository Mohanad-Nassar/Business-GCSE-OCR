# Rewards Store & Avatar Mascot — Plan

**Status:** Planning (spec written 2026-07-19). Nothing built yet.
**Source of truth:** this file. Update it when decisions change; don't scatter design notes elsewhere.
**Related:** [[per-subject-gamification]], [[architecture-scale-security]], [[leaderboard-feature]], [[theme-system]]. Sits *beside* the existing gamification system in `gamification.js`, does **not** replace it.

---

## 0. One-paragraph summary

Add a second, **spendable** currency ("Coins") that students earn from real, server-verified learning and spend in a **Shop** on cosmetics for **one ownable platform mascot** they customise (their avatar). XP stays exactly as-is: the permanent, un-spendable rank. Coins are earned in parallel. The avatar shows everywhere a student's name appears, which is what makes cosmetics worth chasing. The whole earning side is computed on read from signals students can't fake; only *purchases* and *what's equipped* become new stored state.

---

## 1. Decisions locked (from the planning conversation)

| Area | Decision |
|---|---|
| Currency model | **Dual** — XP = permanent rank (unchanged, pure-function). **Coins** = new spendable currency. Spending never lowers XP/level. |
| Wallet scope | **One global wallet** across all subjects (not per-subject like XP/streaks). |
| Avatar model | **Collectible cast** (revised 2026-07-19) — students pick a base character from a roster, then customise it; coins/prestige unlock *more characters*, not just gear. Supersedes the earlier "one mascot" call. Tiers: free **Starters** · coin **Unlockables** · achievement-locked **Prestige**. Cast LOCKED 2026-07-19 at **16 flat-vector characters** (character-concepts artifact); painterly guide-cast and genie explorations were rejected. |
| Art style | **Flat vector / SVG** — code-drawn, recolourable, theme-aware, self-hosted, zero AI/stock image assets. |
| Earning logic | **Effort + mastery, accuracy as a bonus** — coins for doing & mastering work; high accuracy adds a multiplier. Never accuracy-*gated*. |
| Launch economy | **Capped retroactive grant** — past server-verified work converts to a starting balance, capped so no one buys the whole shop day one. |
| Cosmetic categories (v1) | **Universal cosmetics** (skin recolour · background · frame · pet — work on any character) **+ per-character wearables** (revised 2026-07-19 to include them): each character gets its own **tailored** headwear (and later outfit/accessory), drawn to fit that character's geometry and shown only while it's worn. v1 ships **one signature headwear per character** (16); the system (`avatar.js` `WEARABLES` + `shop_items.character_scope`) makes adding more trivial. |
| Prestige | **Mostly buyable, some achievement-locked** — a subset of items can't be bought at any price; only earned via badges/streaks/mastery. |
| Visibility | **Everywhere:** own dashboard/profile, class leaderboard, peer-facing name spots, teacher class views. |
| What coins buy | **Cosmetics + soft perks** (e.g. streak-freeze) — *never* anything that changes scores/mastery (see §6 integrity guardrails). |
| Teacher role | **Automatic earning at launch**; optional capped teacher "bonus coins" lever deferred to a later phase. |
| Grind pace | **Balanced** — a regular student affords a mid-tier item in ~a week; prestige items take longer. |
| Mascot-as-guide | **Design the rig so it can become a guide/coach later**; this build ships avatar + shop only. |

---

## 2. Core architecture — and the one hard constraint

Everything else in `gamification.js` is a **pure function over progress data** — XP/levels/badges are recomputed on every page load, never "awarded" or stored, so nothing drifts and nothing can be double-claimed ([gamification-functions.sql:5-10](../supabase/gamification-functions.sql#L5-L10)).

A coin you can **spend** breaks that model, because a balance that goes *down* is mutable state, and — per [[architecture-scale-security]] — **anything the client can write, a student can forge.** So the wallet must be **server-authoritative**. But we keep as much of the compute-on-read philosophy as possible by splitting the balance:

```
                 ┌─────────────────────────────────────────────┐
   balance   =   │  earned_total   (COMPUTE-ON-READ, server)    │
                 │    from server-verified signals only:        │
                 │    daily_revise_stats · question_mastery ·   │
                 │    mastery_events · topic_reviews · streak    │
                 └─────────────────────────────────────────────┘
                 ┌─────────────────────────────────────────────┐
             −   │  spent_total    (append-only LEDGER, server) │
                 │    sum of student_purchases.price_paid       │
                 └─────────────────────────────────────────────┘
```

- **`earned_total`** is a deterministic function of tables that are already written **server-side and server-graded** — a student cannot inflate them from the browser. This is the anti-forge core, and it means "how many coins have I ever earned" needs no new "award" writes, exactly like XP.
- **`spent_total`** comes from one new append-only table. The *only* new mutable state.
- **`balance = earned_total − spent_total`**, always recomputed server-side inside the buy RPC — never trusted from the client.
- **Inventory** (what you own) = achievement-unlocks (derived) + the purchase ledger (derived). Also no separate "grant" writes.
- **Equipped loadout** (what's worn right now) = one small settings row — the only genuinely per-student stored *preference*.

> **Why this matters for the Reports feature (planned next):** the parent-facing reports read the *same* mastery signals. Because coins are earned from those signals and spending can never touch them (§6), the shop can't corrupt what a report says. The two features stay independent.

---

## 3. The currency

- **Working name:** "Coins." Open to a branded name (see §12) — e.g. tied to the **Vidya** brand or the mascot.
- **Dual with XP.** Both tick up together from the same learning moments; XP is rank, Coins are pocket money. Spending Coins never affects XP, level, streak, badges, or leaderboard position.
- **Global.** A single balance per student across every subject. (Earning is *computed* per subject then summed, so a subject-by-subject breakdown is still available for a "where did my coins come from" view.)

---

## 4. Earning model — "effort + mastery, accuracy as bonus"

### 4.1 Sources (server-verified only)

| Signal | Table (existing) | Rewards | Forge-safe? |
|---|---|---|---|
| Correct answer in Daily Revise | `daily_revise_stats.total_correct` | Effort | ✅ server-graded via `record_mastery_answer` |
| Item **mastered** in Daily Revise | `daily_revise_stats.total_mastered` | Mastery (accuracy bonus) | ✅ |
| Bank question mastered | `question_mastery` | Mastery | ✅ server-graded (bank pattern) |
| Mastery event (leaderboard) | `mastery_events` | Mastery | ✅ written server-side, rank never trusted from client |
| Review session completed | `topic_reviews.completed_at` | Retention | ✅ |
| Day-streak milestone reached | `get_my_streak` | Consistency | ✅ server scan of `progress_events` |

**Deliberately excluded from earning:** raw topic-page section progress (`geo_progress_*` localStorage / client-written `progress_events`). It's forgeable today, so it must not mint coins. **As the topic-page server-grading rollout lands (the P1 build in [[architecture-scale-security]]), those answers become eligible and slot in here** — the earning function just gains a source, no redesign.

### 4.2 Formula — IMPLEMENTED v1 (broadened 2026-07-20; `_wallet_target()` in `supabase/rewards-store.sql`)

Every term is a **forge-safe, server-written** signal (a tampered client can't inflate any of them). Distinct-counting on the daily-revise terms makes re-answering the same question not re-pay.

```
earned_total =
    RULE-OF-3 LADDER, per question:  1st correct = 1 ✦, 2nd = 2 ✦, 3rd (mastered) = 3 ✦
        → ever-mastered question  = 6   (pinned via mastery_events, never drops)
        → mastery_count = 2       = 3   (1+2)
        → mastery_count = 1       = 1
  + 5  × reviews completed        (topic_reviews)      // retention
  + 10 × teacher tasks completed  (task_attempts submitted, distinct task)  // assigned work
```

- **Broadened from the original `15×mastery + 15×reviews`**, then re-shaped by the owner 2026-07-20 into a **ladder that pays as a question is learned** — the reward now *teaches* the Rule of 3 instead of sitting beside it. The ladder subsumes the old separate mastery bonus (mastering already pays its 3rd rung), so there is no double-count.
- **Farm-proof by construction:** `mastery_count` resets on a wrong answer (pedagogy — forgotten questions must re-surface), which would look like a farm (right→wrong→right). It isn't, because `earned` is a **monotonic high-water ledger**: re-climbing a rung already paid for adds nothing. Ever-mastered questions are pinned at 6 via `mastery_events` (first-ever, never cleared) so a later reset can't claw them back.
- **Fairness note:** wrong answers pay nothing, and reviews/mastery are correctness-gated. The backstop is **teacher tasks, which pay on submission whatever the mark** — a student who does their set work still earns. Watch at calibration: if weaker students earn near-nothing, re-add a small effort term.
- **Explained in-product:** `daily-revise.html` carries a collapsible "How Daily Revise works" panel (auto-opens on first visit) covering the Rule of 3, the reset, the 1/2/3 coin ladder, and a teacher-facing note on why mastery resets and why coins can't be farmed.
- Teacher-task completion (`task_attempts.status='submitted'`, server-auto-marked, read-only to clients) is guarded by `to_regclass` so it contributes 0 if the tasks schema isn't deployed.
- **Still EXCLUDED (client-forgeable today):** topic completion + per-topic ≥80% accuracy bonus — they read `progress_summary`/`is_correct`, still client-written for fib/exam/learn/misc/tips. They slot in as new terms once the P1 topic-page server-grading rollout lands ([[architecture-scale-security]]); no redesign, just more sources. Daily-revise correctness (the `+2` term) is the forge-safe accuracy reward in the meantime.
- **The master anti-grind governor is the daily cap** (`c_daily`, currently 100/day, in `_wallet_earned()`), NOT the per-unit weights: whatever the activity mix, a student banks ≤ cap/day, so "buy everything" stays a term-long goal.

- **Accuracy is a bonus, never a gate.** A student earns for every correct answer (effort); *mastering* an item (getting it right across spaced repetitions) pays 3× on top. So higher accuracy → faster mastery → more coins, but a struggling student still earns steadily for effort. No one is locked out.
- **Anti-grind daily cap:** a soft cap (~**60–80 coins/day** from the effort component) so a student can't farm the same easy questions all evening. Mastery/review/streak bonuses sit *above* the cap (they're naturally rate-limited by spaced repetition — you can't "master" the same card twice in a day). Mirrors the existing `FC_DAILY_CAP` precedent in `gamification.js`.

### 4.3 Launch: capped retroactive grant

On first load after launch, `get_my_wallet()` computes `earned_total` from each student's *existing* history — so a student who's already mastered 400 items arrives with a balance, not zero. **Capped** (e.g. retroactive earned capped at ~one mid-tier + one nice item's worth, ~600 coins) so heavy users feel rewarded without trivialising the shop. The cap applies only to the pre-launch backfill; earning is uncapped-per-lifetime afterward (subject to the daily cap).

### 4.4 Pricing anchor (balanced pace)

Tuned so a regular student (~20 Daily-Revise Qs/day, some mastery, occasional review) nets **~250–350 coins/week**:

| Tier | Example items | Price (v1) | ≈ time to afford |
|---|---|---|---|
| Starter | basic hats, plain colours, simple backgrounds | 60–120 | 1–3 days |
| Mid | themed outfits, patterned skins, scene backgrounds | 300–400 | ~1 week |
| Premium | animated/"shiny" skins, elaborate outfits, pets | 800–1,200 | 2–4 weeks |
| **Prestige (earned-only)** | not for sale — unlocked by badge/streak/mastery | — | achievement-gated |

### 4.5 Calibration step (recommended before locking numbers)

The rates above are guesses. Your `.env` has live credentials and `daily_revise_stats` / `progress_events` hold real usage. **Before finalising, I can query the actual distribution** (coins/day per active student under this formula) and tune the constants + daily cap so "balanced" is true for *your* students, not a hypothetical one. One-off, read-only.

---

## 5. Spending — the Shop

- **Coins unlock characters *and* gear.** With the cast model (§1), the base character is itself unlockable — most of the roster is bought with coins, a few **Starters** are free, a few are **Prestige** (achievement-only). Cosmetics then layer on top of whichever character a student picks. `student_avatar` gains a `character_id`; `shop_items` gains a `character` category.
- **Mostly buyable + a prestige tier.** Coins buy the everyday catalogue. A curated subset is **achievement-locked** — `unlock_rule` references an existing badge/streak/mastery test (reuse the `BADGE_DEFS` tests in `gamification.js`), can't be bought at any price. So the rarest looks *signal real learning*.
- **Soft perks (chosen at planning):** a small non-cosmetic shelf. **Strict rule:** a perk may only touch things that are **not** mastery/accuracy signals. Allowed examples:
  - **Streak-freeze** — protects the day-streak flag for one missed day. (Streak is consistency, not attainment; freezing it doesn't fake any mark.)
  - **Extra flashcard round** — flashcards already earn no XP and aren't a graded signal, so this is pure practice.
  - **Cosmetic "mystery box"** — random cosmetic, no learning effect.
  - **Forbidden forever:** hints, retries, score/mark boosts, anything that alters `question_mastery` / `mastery_events` / accuracy. These would corrupt the reports & leaderboard.
- **No student-to-student transfers/gifting** (v1) — avoids coercion/bullying dynamics. Coins are non-transferable.
- **Purchases are permanent** — you own a cosmetic forever once bought; buying ≠ consuming (except perks, which are consumables).

---

## 6. Integrity & fairness guardrails (the non-negotiables)

1. **Server is the only authority.** Price, affordability, ownership, and unlock rules are re-checked inside a `security definer` RPC on every purchase. The client's idea of its balance is display-only.
2. **Prices live server-side** (`shop_items` table), never read from client JS at purchase time — so a tampered catalogue can't discount anything.
3. **Earn from forge-safe signals only** (§4.1). No coins from client-writable progress until it's server-graded.
4. **Daily earn cap + monotonic high-water ledger** (`wallet_ledger`) — coins accrue at most a cap/day and `earned` never decreases, so a balance can't be farmed fast or driven negative by a progress reset. **`record_mastery_answer` now gates the durable mastery counters to FIRST-EVER per question** (2026-07-19), so `mastery_events` (the coin earning signal) is distinct-once and un-farmable past the count of real questions, while `mastery_count` still resets so forgotten questions re-surface (pedagogy intact). Residual lower-stakes gaps — trivially mastering a *known* answer (out of scope per [[architecture-scale-security]] §1) and review-completion enrolment scoping (P1) — stay bounded by the daily cap. Streak / raw-attempt rewards remain excluded until `progress_events` is server-graded.
5. **Soft perks can't touch attainment** (§5). Protects the Reports feature and leaderboard.
6. **XP/level/streak/badges are untouched** — this feature only *reads* them.
7. **Usernames/one free-text field stay XSS-escaped** via `gcseEscapeHtml` (already the discipline in `account-cluster.js`); avatars are composed from a fixed server-validated part list, never free-form user markup.

---

## 7. Where the avatar renders

| Surface | File | Change |
|---|---|---|
| **Every page header** (the "Hi, name" cluster) | `account-cluster.js` | Replace the `.gcse-avatar` initial-circle with the composed mascot SVG. One change → shows platform-wide. |
| **Leaderboard / Hall of Fame** | `leaderboard.js` + `supabase/leaderboard.sql` | Render each ranked student's equipped mascot next to their name — needs `get_leaderboard` to return equipped loadouts (peer-readable). |
| **Class roster & peer-facing name spots** | shared render helper | Same compositor, small size. |
| **Teacher class views** | teacher dashboards | Read-only render of student avatars. |
| **The Locker (profile/dress-up hub)** | new `locker.html` (linked from `badges.html`) | Full-size mascot + wardrobe (equip owned) + shop (buy) + perks. |

---

## 8. Data model (new)

Minimal, matching the app's "one server function only when unavoidable" philosophy.

**Tables**
- `shop_items` — the catalogue **as server truth**: `item_id (pk)`, `category` (wearable/skin/background/pet/flair/perk), `slot`, `price` (null if not for sale), `unlock_rule` (null = buyable; else a badge/streak/mastery key), `rarity` (reuse `GAM_RARITY`), `is_consumable`, `active`. Seeded like the badge/question seeds.
- `student_purchases` — **append-only ledger**: `id`, `student_id`, `item_id`, `price_paid`, `purchased_at`. RLS: student SELECTs own; **INSERT only via `buy_item` RPC** (no direct client insert).
- `student_avatar` — equipped loadout: `student_id (pk)`, `loadout jsonb` (`{skin, hat, outfit, accessory, background, pet, frame}`), `updated_at`. RLS: owner writes; **peer/teacher SELECT allowed** (needed to render others' avatars) — exposes only cosmetic ids, nothing sensitive.
- `student_perks` — consumable balances (e.g. streak-freezes held): `student_id`, `perk_id`, `qty`. Decremented server-side on use.

**RPCs (`security definer`)**
- `get_my_wallet()` → `{ balance, earned_total, spent_total, by_subject, daily_earned_today }`. Compute-on-read, like `get_my_streak`.
- `buy_item(p_item_id)` → validates existence, `active`, price, affordability (recomputed balance), not-already-owned, and `unlock_rule` if present; inserts the purchase atomically; returns new balance. **The anti-forge chokepoint.**
- `equip_items(p_loadout jsonb)` → validates every referenced item is owned (or a free default) and slot-correct; upserts `student_avatar`.
- `use_perk(p_perk_id)` → server-side effect (e.g. set streak-freeze), decrement `student_perks`.
- (leaderboard) extend `get_leaderboard` to join `student_avatar` so peers' avatars render in one round trip.

All new SQL goes in `supabase/rewards-store.sql` (run in the Supabase SQL editor, safe to re-run — same convention as the other migrations, several of which are also pending).

---

## 9. The mascot & cosmetic system (SVG rig)

- **One base rig, layered slots**, composed at render time (mirrors the `gamBadgeIconSvg` inner-markup-plus-wrapper pattern already in `gamification.js`):

  ```
  z-order (back → front):  background · pet · body(skin colour) · outfit · face · accessory · hat · frame
  ```
- Each cosmetic = a small SVG snippet keyed to `{slot, z}`. A `composeAvatar(loadout, ownedParts)` function assembles one `<svg>`. **Colours via CSS vars / `currentColor`** so items recolour per theme (ties into [[theme-system]]) and one "skin" item can ship multiple palettes for near-zero extra art.
- **No AI slop, no external assets:** the mascot and every cosmetic are hand-authored SVG committed to the repo — crisp at any size, ~2–5 KB each, inline, self-hosted (consistent with the KaTeX-self-hosted / no-CDN stance in [[theme-system]] and [[js-verification-toolchain]]). **I can draft the original mascot + a starter cosmetic set directly in SVG** for you to own outright.
- **Rarity** reuses `GAM_RARITY` (common → mythic) for shop framing and prestige items.
- **Guide-ready:** author the rig with a couple of expression/pose variants (idle, happy, thinking) even though v1 only uses idle — so the later "mascot as coach" feature (nudges/celebrations) has poses to use without a re-draw.

---

## 10. Client architecture (no per-HTML edits)

Follows [[business-gcse-shared-js-architecture]] — features live in shared JS, never in the 38+ topic HTMLs.

- `avatar.js` — the SVG compositor + the static **visual** catalogue (part id → SVG + slot/z). Included wherever avatars render.
- `wallet.js` — `get_my_wallet` client, balance HUD, buy/equip calls, optimistic-then-reconcile UI.
- `shop-catalog.js` — display metadata (names, blurbs, rarity) mirroring `shop_items` by id (server holds the price truth).
- `locker.html` — new dress-up + shop + perks page (standalone page pattern, `tasksAuthInit`-style, links from `badges.html`).
- Hook coin-earn toasts into the existing `gamificationOnAnswer` path so "+X coins" can flash alongside "+10 XP" (display-only; truth is server).

---

## 11. Build phases

Each phase is independently shippable; load the noted skills at build time.

1. **WP-1 Economy backend** — `shop_items` + `student_purchases` + `get_my_wallet` + `buy_item`; retroactive-grant + daily-cap logic; RLS. *(load `secure-coding`, `cloud-scale-limits`, `api-design`)*
   **DoD:** a seeded item can be bought via RPC; balance can't be forged from the client; over-spend and double-buy are rejected server-side.
   **BUILT 2026-07-19 → `supabase/rewards-store.sql`** (also adds `student_avatar`, `equip_character`/`equip_items`, `wallet_ledger`). Security-reviewed by security-auditor; **2 criticals found & fixed** — (a) `student_avatar` had a `for all` RLS policy letting a student `upsert`-equip any prestige item free → now self-SELECT-only, writes via the definer `equip_*` fns; (b) no server daily cap + non-monotonic balance (a page-reset could go negative) → reworked to a monotonic, daily-capped `wallet_ledger`. **NOT yet run in Supabase.**
2. **WP-2 Mascot rig + starter cosmetics (SVG)** — base mascot, ~15–20 launch items across all four categories, `composeAvatar`. *(load `frontend-design`)*
   **DoD:** loadout composes correctly, recolours with themes, renders crisp 24px→256px.
   **BUILT 2026-07-19 → `avatar.js`** — `VidyaAvatar.compose(loadout, {size, crop})` renders the 16-character cast + universal cosmetics (skin recolour · background · frame · pet), namespaced `va-` defs (no clash with app SVG ids), `bust`/`full` crops. Verified via the avatar-preview artifact (all 16 render + live customiser).
   **WP-2b 2026-07-19 → per-character wearables** — each character now has a signature, drawn-to-fit **headwear** (16 total) in `avatar.js` `WEARABLES` (rendered only while its character is worn). `shop_items` gains a `character_scope` column; 16 `hat` rows seeded, character-scoped. **Re-run `supabase/rewards-store.sql`** (idempotent — adds the column + rows). Per-character outfits/accessories are the next content drop; the rig supports them already.
3. **WP-3 Avatar everywhere** — swap `account-cluster.js` initial-circle for the mascot; leaderboard + roster + teacher render; peer-readable loadouts.
   **DoD:** your dressed mascot shows on every page and on the leaderboard next to your name.
   **BUILT 2026-07-20.** **Header (every page):** `account-cluster.js` now lazy-loads `avatar.js` on demand (no HTML edits) and paints the student's equipped **bust** into the `.gcse-avatar` circle (button + dropdown head), students only. **Cache-then-revalidate** — renders the last look instantly from `localStorage['gcse_avatar_v1']`, then confirms from `student_avatar` (self-SELECT, one PK lookup); `locker.js` writes that same cache on equip so there's no stale flash. No pick / no client / no lib → the initial letter simply stays. Also added a **"🛍️ The Locker"** link to the student account dropdown. **Leaderboard:** `get_leaderboard` (in `supabase/leaderboard.sql`) now returns `avatar` {character, loadout} per row under the **same `name_ok` visibility gate as the username** (an avatar is as identifying as a name, so a student never sees the avatar of anyone they can't already name); `leaderboard.js` paints it as a post-render pass, falling back to the initial when absent. ⚠ **Re-run `supabase/leaderboard.sql`** to pick up the avatar field — and it must run **after** `rewards-store.sql` (it now joins `student_avatar`). NOT yet verified against a live login. NOTE: the leaderboard feature itself is still pending its first live rollout.
4. **WP-4 The Locker** — `locker.html`: wardrobe (equip owned), shop (buy, with affordability + prestige lock states), coin HUD.
   **DoD:** full earn→save→spend→equip loop works end-to-end for a real student account. *(verify with the `verify` skill against a logged-in account — topic/profile pages need real login per [[js-verification-toolchain]])*
   **BUILT 2026-07-20 → `locker.html` + `locker.js`** — Characters / Style / Wardrobe tabs; buy + equip via the live RPCs (`get_my_wallet`/`buy_item`/`equip_character`/`equip_items`); hero avatar + item previews via `avatar.js`; coin HUD; prestige-locked, owned, affordability + toggle-off states. Standalone student page (`tasksAuthInit` + `account-cluster`), same includes as `daily-revise.html`. Cosmetic ids in `avatar.js` **aligned** to the shop ids (`bg_*`/`frame_*`/`pet_*`). **Re-run `supabase/rewards-store.sql`** (adds the aligned cosmetic rows + deactivates orphaned draft ids). ⚠ NOT yet verified against a live login — open `/locker.html` in the running app to test.
5. **WP-5 Soft perks** — streak-freeze + one practice perk, `student_perks` + `use_perk`, integrity guardrails from §6.
   **DoD:** a perk changes only its allowed target and provably touches no mastery signal.
   **BUILT 2026-07-20.** Two consumables: **Streak Freeze** (protects one missed day of a subject streak) + **Mystery Box** (grants a random universal cosmetic). SQL in `rewards-store.sql`: new tables `student_perks` (holdings) / `perk_purchases` (spend ledger) / `streak_shields` (self-SELECT RLS, definer-only writes); `buy_perk` + `use_perk` (SECURITY DEFINER, advisory-locked like `buy_item`); a `_wallet_spent()` helper now used by `get_my_wallet`/`buy_item`/`buy_perk` so perk spends count toward the balance; `buy_item` now rejects consumables. **Streak Freeze mechanic:** `use_perk` writes a shield for the single next gap day (bounded to today/yesterday, idempotent, effect-before-decrement so a failed apply doesn't waste the token); `streak_shields` is UNIONed into the "active days" of all THREE streak functions — `get_my_streak`, `_lb_streaks`, `get_class_streaks` (each file got an idempotent `create table if not exists` guard so it runs in any order). Touches ONLY the streak (consistency) — never mastery/accuracy/Overall; it does affect the streak leaderboard metric + streak badges by design. Locker gets a **Perks tab** (`locker.js`/`locker.html`): buy, per-subject freeze picker, "Open box" with confetti. ⚠ **Re-run `rewards-store.sql` FIRST, then `gamification-functions.sql` + `leaderboard.sql` + `class-gamification.sql`.** JS passes `node --check`. **security-auditor pass done — 1 HIGH found + FIXED:** the idempotent `create table if not exists streak_shields` guards created the table WITHOUT RLS, and since `rewards-store.sql` runs last there was a window where the table was world-writable via the anon key (a student could forge streaks → corrupt the streak leaderboard + streak-gated prestige). Fix: all four files now create the table AND enable RLS + self-select policy in the same block, so it can never exist unprotected. Everything else (wallet accounting, `buy_item` perk guard, mystery-box eligibility, effect-before-decrement, advisory locks, streak-union SQL) reviewed clean. NOT yet live-login verified.
6. **WP-6 Calibration & polish** — tune constants from real data (§4.5), earn toasts, sounds (reuse the synthesised `gamification.js` audio), first-purchase celebration.
   **Calibration report BUILT 2026-07-20 → `supabase/rewards-store-calibration.sql`** — READ-ONLY; run in the Supabase SQL editor, returns one labelled metric table (data availability · current constants · weekly earn p25/median/p75/p90 · weeks-to-afford · does the 100/day cap bite · does the 600 retro cap clip). Feeds the tuning of the ×15 multipliers + `c_daily`/`c_retro` in `rewards-store.sql` and the seed prices. If `students_active_earners` is ~0 (pre-launch), calibrate by model instead and re-run post-launch. **Ran 2026-07-20: 8/242 active, `mastery_events=0` (confirmed genuine — nobody's finished the Rule-of-3 yet, not a bug), caps have huge headroom (peak day p90=64 vs 100 cap; lifetime p90=90 vs 600 retro). Verdict: too thin to tune — v1 constants LEFT AS-IS, re-run post-launch.**
   **Polish (partial) BUILT 2026-07-20 → `locker.js` + `locker.html`:** first-purchase **celebration** (gold-led confetti, respects `prefers-reduced-motion`, + big toast) fired when a student's first bought item lands; **buy** + **equip** WebAudio sounds via a self-contained helper that honours the same `gcse_sound_off` toggle (Locker doesn't load `gamification.js`). Also fixed a pre-existing a11y bug (tab buttons now have `role=tablist/tab/tabpanel`). **Deferred:** the global "+N ✦" earn-toast during Daily Revise — it should ride the mastery/review banking event, so build it once there's live mastery activity to hook.

---

## 12. Open decisions (small — can settle alongside the visual draft)

- **Currency name** — keep "Coins" or brand it (e.g. a Vidya-/mascot-themed name)?
- **Mascot name & personality** — I'll propose 3–4 options with the first SVG draft; pick one.
- **Exact prices / earn constants / daily cap** — hold until the §4.5 calibration pass.
- **Retroactive cap value** — placeholder ~600 coins; confirm after calibration.

## 13. Explicitly out of scope (future features, not this build)

- **Mascot-as-guide/coach** (nudges, tips, celebrations) — rig is designed for it (§9); ships as its own feature later.
- **Teacher "bonus coins" lever** — deferred; automatic earning only at launch.
- **Seasonal/limited-time drops, student gifting** — later, if wanted.
- **Reports feature (A5/C2/C3)** — the *next* thing to plan; shares the same mastery signals but is independent of this.
