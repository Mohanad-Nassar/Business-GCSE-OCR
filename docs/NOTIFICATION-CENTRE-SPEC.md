# Notification Centre — Spec (source of truth)

Written 2026-07-16. Goal: centralise EVERY alert a teacher / school-admin / owner can
receive into one system (the 🔔 bell + `teacher-notifications.html`), add per-type
notification management (levels, pause, sound), add a notification chime + live badge
for all users (students included), and clean up the teacher dashboard (remove the
"All caught up" strip message; make the Getting-started guide dismiss-once with a
replay icon).

Everything builds on the EXISTING seam: `deriveTeacherNotifications()` in
`notifications-shared.js` already feeds both the bell and the To-Do page. We extend
that seam rather than inventing a parallel system.

---

## 0. Current state (verified 2026-07-16)

- `notifications-shared.js` — one file: student derivations (`deriveStudentNotifications`,
  `deriveReviewNotifications`), teacher derivation (`deriveTeacherNotifications`, line ~185,
  3 types: marking `mark:`, topic-access `req:`, co-teacher invite `classinvite:`), bell IIFE
  (5-min poll + visibilitychange, badge, dropdown, `task_notification_reads` dismissals),
  paste-guard IIFE at the bottom.
- `teacher-notifications.html` — To-Do page: 5 filter tabs (todo/info/snoozed/done/all),
  own to-dos (`teacher_todos`), snooze/done state for derived notes (`teacher_notif_state`),
  graceful 42P01 degrade (`#setupNotice`). Tables in `supabase/teacher-todos.sql` (NOT yet
  run on live DB — degrade paths must keep working).
- **Feeds that today bypass the bell/page (the gap):**
  - Subject edit requests — `get_incoming_edit_requests()` / `resolve_subject_edit_request`
    (`supabase/subjects-v2-s2-requests.sql`); surfaced only on `teacher-subjects.html`
    (`#incomingRequests`) and `admin.js` Sharing tab.
  - External share requests — `get_incoming_external_requests()` (`subjects-v2-s3-external.sql`);
    surfaced only in `admin.js` Sharing tab (admin/owner only).
  - Question reports — `question_reports` table (`supabase/question-reports.sql`); surfaced only
    on the teacher-dashboard reports tab.
  - Integrity events (blocked paste) — `integrity_events` (`supabase/integrity-events.sql`,
    NOT yet run); surfaced only on the teacher dashboard.
- Roles: `am_i_admin()` RPC returns `{ is_owner, schools:[{id,name,role}] }` (used by
  `teacher-nav.js` `maybeAddOwnerLink` and `admin.js`).
- Audio: only `gamification.js` (Web Audio oscillator; `gcse_sound_off` key). It is NOT loaded
  on teacher pages — the chime must be self-contained in `notifications-shared.js`.
- No Supabase realtime in the browser. Poll + visibilitychange only.

---

## 1. Notification type registry (new, in `notifications-shared.js`)

One exported const, the single source of truth. Every derived note gains a `type` field.

```js
const NOTIF_TYPES = {
  // teacher
  marking:         { icon:'✍️',  label:'Submissions to mark',            aud:'teacher', kind:'action', priority:'high'   },
  topic_request:   { icon:'🙋',  label:'Student topic-access requests',  aud:'teacher', kind:'action', priority:'high'   },
  class_invite:    { icon:'🧑‍🏫', label:'Co-teacher invites',             aud:'teacher', kind:'action', priority:'normal' },
  edit_request:    { icon:'✋',  label:'Requests to edit your subjects', aud:'teacher', kind:'action', priority:'normal' },
  external_share:  { icon:'🌐',  label:'External share requests',        aud:'admin',   kind:'action', priority:'normal' },
  question_report: { icon:'🚩',  label:'Question reports from students', aud:'teacher', kind:'action', priority:'normal' },
  integrity:       { icon:'🚫',  label:'Integrity alerts (blocked paste)', aud:'teacher', kind:'info', priority:'low'    },
  // student
  task_assigned:   { icon:'📋',  label:'New tasks assigned',   aud:'student', kind:'action', priority:'high'   },
  task_due:        { icon:'⏰',  label:'Deadlines approaching', aud:'student', kind:'action', priority:'high'  },
  task_overdue:    { icon:'⚠️',  label:'Overdue tasks',        aud:'student', kind:'action', priority:'high'   },
  task_marked:     { icon:'✅',  label:'Marked results',       aud:'student', kind:'info',   priority:'normal' },
  review_due:      { icon:'🗓️', label:'Reviews due',          aud:'student', kind:'action', priority:'normal' },
};
```

Key-prefix → type mapping (existing keys MUST NOT change — dismissals live in
`task_notification_reads` per key): `mark:`→marking, `req:`→topic_request,
`classinvite:`→class_invite, `assigned:`→task_assigned, `due:`→task_due,
`overdue:`→task_overdue, `marked:`→task_marked, `review:`→review_due. New feeds:
`editreq:{id}`, `extshare:{id}`, `qreport:{id}`, `integrity:{studentId}:{YYYY-MM-DD}`.
Provide `notifTypeForKey(key)` helper. Priority also becomes a field on each note
(used for sorting: high first within same-day, then by `at`).

## 2. New feeds in `deriveTeacherNotifications`

Each in its own `try/catch` (schema may not be installed — same pattern as existing
blocks). All notes gain `type` + `priority`.

1. **edit_request** — `client.rpc('get_incoming_edit_requests')`, pending only.
   key `editreq:{id}`, href `/teacher-subjects.html`, text like
   `“{requester}” asked to edit “{subject name}”` (check the RPC's actual return columns
   in `supabase/subjects-v2-s2-requests.sql` before writing the text).
2. **external_share** (admin/owner ONLY) — first check role via a cached `am_i_admin`
   call: add shared helper `notifAmIAdmin(client)` that memoises the RPC result on
   `window._gcseAmIAdminP` (a promise) so nav/admin/bell share one call per page load.
   If `is_owner || schools.length`: `client.rpc('get_incoming_external_requests')`,
   key `extshare:{id}`, href `/admin.html` (deep-link to the Sharing tab if admin.js
   supports a hash — check; if not, plain `/admin.html` is fine).
3. **question_report** — read `question_reports` for open/pending reports visible to
   this teacher (CHECK the real schema/columns/RLS in `supabase/question-reports.sql`
   and how teacher-dashboard queries + dismisses them — reuse the same filter so a
   report dismissed on the dashboard doesn't keep alerting). key `qreport:{id}`,
   kind 'action', href to the dashboard reports tab (match the dashboard's own URL/hash).
4. **integrity** — recent `integrity_events` (last 48h), grouped per student per local
   day: key `integrity:{student_id}:{YYYY-MM-DD}` with count in the text, kind 'info',
   href to the class dashboard. Guarded — table may not exist.

Do NOT remove the existing per-page surfaces (teacher-subjects panels, admin Sharing
tab, dashboard reports/integrity tabs) — they are the action surfaces the hrefs point at.

## 3. Preferences — "Manage notifications"

**Model.** Per type: `level` ∈ `normal` | `quiet` | `off`, plus `sound` boolean.
- `normal` — bell + badge + chime + notifications page (default for all types except
  `integrity`, which defaults to `quiet`).
- `quiet` — notifications page only; never in the bell/badge, never chimes.
  (= "paused but still visible on the page")
- `off` — hidden everywhere (= fully paused).
Global: `soundOn` boolean (default true).

**Storage.** localStorage `gcse_notif_prefs_v1`:
`{ v:1, soundOn:true, updatedAt:<iso>, types:{ marking:{level:'normal',sound:true}, … } }`
plus best-effort server sync to a NEW table (new file `supabase/notification-prefs.sql`,
do NOT run it — degrade gracefully):

```sql
create table user_notif_prefs (
  user_id uuid primary key references profiles(id) on delete cascade,
  prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
-- RLS: own-row for all (select/insert/update using user_id = auth.uid()),
-- same style as teacher-todos.sql. Include the touch-updated_at trigger.
```

Shared helpers in `notifications-shared.js` (used by bell + both pages):
`notifPrefsLoad(client, uid)` (server row wins if its updatedAt is newer; merge into
local; always resolves to a usable prefs object), `notifPrefsSave(client, uid, prefs)`
(write localStorage synchronously, upsert server best-effort), `notifLevelFor(prefs, type)`,
`notifSoundFor(prefs, type)`. 42P01 / missing table ⇒ localStorage-only, no console spam.

**Filtering.** Bell shows only `level === 'normal'` items; badge counts only those.
`teacher-notifications.html` and `notifications.html` show `normal` + `quiet` items
(quiet items get a small "muted from bell" chip); `off` items are not derived into the
list at all — the settings UI shows "paused" state instead.

## 4. Sound + live badge (all roles)

In the bell IIFE:
- **Chime** — self-contained Web Audio two-tone ding (sine ~880→1318 Hz, ~0.35 s, gain
  envelope, peak ≤0.12). No dependency on gamification.js. Create/resume AudioContext
  lazily; if the browser blocks it pre-gesture, skip silently (badge still updates) and
  retry on the next user gesture (one `pointerdown` listener that resumes the ctx).
- **New-item detection** — localStorage `gcse_notif_seen_v1` = `{ key: firstSeenEpochMs }`,
  pruned to newest 400 entries. On every render: keys now visible at level `normal` that
  are NOT in the seen map ⇒ mark seen, and (if any) play ONE chime (not one per item).
  This survives page navigations so the same notification never chimes twice.
- **Gating** — chime only when `prefs.soundOn` AND at least one new item's type has
  `sound !== false` AND its level is `normal`.
- **Tab title badge** — capture `document.title` once at boot; on render set
  `document.title = (n ? `(${n}) ` : '') + baseTitle`. Guard against other scripts
  rewriting the title (re-capture if current title isn't ours).
- **Poll cadence** — `REFRESH_INTERVAL_MS` 5 min → **2 min**, keep visibilitychange
  refresh. (Realtime is out of scope; noted as future work.)

## 5. `teacher-notifications.html` redesign

Keep the page's existing skeleton (tabs, add/edit form, snooze/done, 42P01 notice). Add:

1. **Type filter chips** — a second row under the existing status tabs: `All types` +
   one chip per teacher type present (icon + short label + live count). Chips filter the
   list client-side; combinable with the status tabs. (No new `<select>`s needed for
   this; the page already loads searchable-select.js if you do add any.)
2. **Type chip on each row** — each derived item shows its type icon; quiet-level items
   get a small muted chip ("🔕 quiet").
3. **⚙️ Manage notifications** section — a new panel reachable via a "⚙️ Settings"
   button on the tab bar row (and `#settings` hash opens it directly; the bell's panel
   header gains a small ⚙️ link here). Contents:
   - Global: sound on/off toggle + "▶ Test sound" button (plays the chime).
   - One row per type in `NOTIF_TYPES` with `aud` teacher (plus `admin` rows only when
     `notifAmIAdmin` says so): label + icon, a 3-way level control
     (🔔 Normal / 🔕 Quiet — page only / ⏸ Off), and a per-type Sound checkbox
     (disabled unless level = Normal). Include a one-line explainer of the three levels.
   - Saves via `notifPrefsSave` immediately on change (no Save button), with a small
     "saved ✓" flash. Note under the panel: "Settings sync to your account when
     available; otherwise they apply to this browser."
4. **Admin/owner rows** — `external_share` settings row and any `extshare:` items only
   appear for admins/owners (via `notifAmIAdmin`).
5. Filtering respects levels as per §3.

Student side: `notifications.html` gets ONLY a small 🔊 sound on/off toggle wired to the
same prefs (`soundOn`) — no full settings table, no new `<select>` elements (that page
does not load searchable-select.js).

## 6. Bell dropdown polish

- Panel header gains a ⚙️ icon-link → `/teacher-notifications.html#settings` (teacher)
  or `/notifications.html` (student).
- Rows keep existing behaviour; item icon comes from the note as today.

## 7. `admin.html` — bell for admins/owners

Add the bell to admin.html: include `/subjects-index.js`? NOT needed — just add
`<script src="/notifications-shared.js" defer></script>` after the supabase CDN tag and
verify the mount fallback lands somewhere sensible (admin.html has no `#gcseNotifSlot`;
if the fixed bottom-right fallback looks wrong, add an explicit
`<span id="gcseNotifSlot"></span>` in admin.html's header). `window.PAGE_GROUPS_ALL`
absence is fine (pageName falls back to the id) — but if topic names would show as raw
ids in the bell there, also include `/page-groups-all.js`.

## 8. Teacher dashboard changes (`teacher-dashboard.html`)

1. **Remove "All caught up"** — in `renderActionStrip()` (~line 1160): delete the
   `else if (students > 0)` branch; when nothing is pending the strip is simply hidden
   (same as the no-students case). The "📥 Needs you today" pending state stays.
2. **Getting-started guide: dismiss once** — change `#guideToggle` ("Hide guide") to
   HIDE the panel completely (`display:none`, e.g. add class `guide-hidden` +
   `#guidePanel.guide-hidden{display:none}`), persisting the existing
   `gcse_teacher_guide_hidden` = '1'. Remove the collapse/"Show guide" toggle behaviour.
   On load, if the key is '1' the panel does not render at all.
3. **Replay icon** — next to the `#classesTabArchived` button (line ~363) add a small
   icon-only button `id="guideReplayBtn"` (`👋`, `title="Replay the getting-started
   guide"`, `aria-label` set, class `subtab` styled icon-size). Clicking it clears the
   key to '0', shows the panel again (remove `guide-hidden`), and scrolls it into view.
   The button is always visible (it must work in both states).

## 9. Files touched (builder must stay inside this list)

- `notifications-shared.js` — registry, new feeds, prefs helpers, chime, seen-set,
  title badge, poll cadence, level filtering in bell, ⚙️ link.
- `teacher-notifications.html` — type chips, settings panel, level filtering.
- `notifications.html` — sound toggle; make sure student list still respects levels
  (student types honour prefs too).
- `teacher-dashboard.html` — action strip, guide behaviour, replay button.
- `admin.html` — bell include (+ slot span if needed).
- `supabase/notification-prefs.sql` — NEW (not run; everything degrades).
- `docs/NOTIFICATION-CENTRE-SPEC.md` — this file (update the "Build status" line below
  when done).

**Do not touch:** paste-guard IIFE, student derivation logic/keys, `teacher-nav.js`
(except nothing — it needs no change), the 88 topic HTMLs, `script.js`, `tasks-shared.js`.

## 10. Invariants / gotchas

- Existing note KEYS are immutable (dismissals are stored per-key).
- Every Supabase feed runs through `notifFeed(label, thunk)` (notifications-shared.js):
  it returns `data || []` (a broken feed degrades, never throws) AND records
  `{ok, code, at}` on `window._gcseNotifHealth[label]`. supabase-js *resolves* with
  `{error}` rather than throwing, so a discarded error is indistinguishable from
  "no rows" — a dead feed and a healthy-but-quiet day look identical. The health
  object is the ONLY way to tell them apart; see the QA note under Build status.
- localStorage keys are namespaced per-account via `_notifNsKey` (school machines are
  shared): `gcse_notif_prefs_v1:{uid}`, `gcse_notif_seen_v1:{uid}`, `gcse_sr_seeded_v1:{uid}`.
  Legacy un-namespaced blobs from the pre-namespacing build are deleted once on uid adopt.
- `task_notification_reads` uses column `student_id` even for teachers — keep.
- Redo-notice invariant (docs/ARCHITECTURE-SCALE-SECURITY.md §6b) untouched.
- Site is theme-aware: any new UI uses the existing CSS custom properties
  (`var(--card-bg)`, `var(--ink)`, `var(--border)`, etc.) like the bell styles do.
- New buttons/links must be keyboard-accessible with aria-labels.
- XSS: all dynamic text through `_notifEsc` / `escapeHtml` (requester names, subject
  names, class names are user-controlled).
- localStorage access always in try/catch (private-mode Safari).

## Build status

- [x] Built (2026-07-16)
- [x] QA pass — DEGRADE paths only (2026-07-16 — adversarial Opus QA: SHIP, 0 blockers;
  architect follow-ups applied: theme-token flash colour, task_marked default back to normal)
- [ ] **QA pass — WORKS paths (BLOCKED on live migrations).** The 2026-07-16 pass could only
  verify that missing tables degrade silently — `topic_reviews`, `integrity_events`,
  `user_notif_prefs`, `teacher_todos` and several v2 RPCs are NOT on live, so the "feed
  actually returns and renders" path was never exercised. That claim of "0 blockers" covers
  degrade-only. Before trusting any feed, re-run QA against a DB with ALL migrations applied
  and assert `Object.values(window._gcseNotifHealth).every(h => h.ok)` in devtools — a feed
  that errored (renamed column, RLS, RPC drift) looks identical to "quiet" without it.
- [x] Adversarial-review fixes (2026-07-18): per-account localStorage namespacing (shared-machine
  pref bleed), `notifFeed` health instrumentation (unobservable feed failures).
- [ ] SQL run on live DB (`supabase/notification-prefs.sql`)

## Deviations

Everything was built as specified. Minor implementation choices worth recording:

- **`get_incoming_external_requests` takes `p_school_id`.** The spec's §2.2 shorthand
  (`client.rpc('get_incoming_external_requests')`) omits the required argument. The RPC
  is scoped to one school at a time, so the bell iterates the `schools[]` returned by the
  memoised `am_i_admin()` and queries each (exactly as `admin.js` does), collecting the
  pending rows. Each per-school call is in its own inner try/catch.
- **Question-report + integrity hrefs → `/teacher-dashboard.html#alerts`.** The dashboard's
  hash router (`btnByHash`) maps `alerts`/`reports`/`integrity` → the Alerts & reports tab,
  so that hash is the closest existing deep link. (The reports queue is cross-class, so the
  tab only populates once a class is opened — no per-report class link exists.)
- **Only `integrity` defaults to `quiet`** (resolved post-QA: `task_marked` was originally
  spec'd quiet too, but that silently removed the "results ready" bell nudge students have
  always had — a behaviour regression. Its default is back to `normal`; §3 updated to match).
- **`am_i_admin()` memo is only shared among `notifications-shared.js` consumers.** `admin.js`
  and `teacher-nav.js` still call the RPC directly (both out of scope to edit), so the
  `window._gcseAmIAdminP` cache saves the duplicate call between the bell and the to-do
  page's own `deriveTeacherNotifications`, not across those other scripts.
- **`admin.html`: no explicit `#gcseNotifSlot` added.** `teacher-nav.js` already loads the
  account cluster (which creates `#gcseNotifSlot`) on teacher-role pages, and admins are
  teacher accounts, so the bell mounts there; the added `<script>` tag is deduped by
  `teacher-nav.js`'s `loadScriptOnce`. The fixed bottom-right fallback covers the edge case.
