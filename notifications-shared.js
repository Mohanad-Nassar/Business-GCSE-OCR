// ══════════════════════════════════════════════════════════════
// STUDENT NOTIFICATIONS — a 🔔 bell + dropdown, loaded on every
// student-facing page (38 topic pages, index.html, dashboard.html,
// task.html — teacher pages don't load this). Self-contained like
// footer-legal.js: no dependency on script.js/tasks-shared.js load
// order, so it works on index.html exactly the same as everywhere
// else. No-ops entirely for teachers / logged-out visitors.
//
// deriveStudentNotifications() below is also called directly by
// dashboard.html's own "My Tasks" notification list (this file is
// loaded there before that inline script runs) — keep its name and
// signature stable. It used to live in tasks-shared.js; moved here
// because tasks-shared.js isn't loaded on topic pages/index.html.
// ══════════════════════════════════════════════════════════════

const NOTIF_SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
const NOTIF_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
const NOTIF_SESSION_KEY = 'gcse_session_v1';

// ── private copies of the small date/score helpers deriveStudentNotifications
// needs — kept internal (prefixed) so they never collide with the same-named
// globals tasks-shared.js still defines for its own, larger purposes on the
// pages that load both files. ──
function _notifEffectiveDue(task, assignment) {
    const o = assignment && assignment.due_override;
    return o ? new Date(o) : (task.due_at ? new Date(task.due_at) : null);
}
function _notifSubmittedAttempts(attempts) {
    return (attempts || []).filter(a => a.status === 'submitted');
}
function _notifAttemptPct(attempt) {
    if (!attempt || !attempt.marks_total) return null;
    return Math.round(((attempt.marks_awarded || 0) / attempt.marks_total) * 1000) / 10;
}
function _notifFmtDateTime(d) {
    if (!d) return '—';
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' +
           dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function _notifFmtScore(attempt) {
    if (!attempt || attempt.marks_total == null) return '—';
    const pct = _notifAttemptPct(attempt);
    return `${attempt.marks_awarded ?? 0}/${attempt.marks_total} (${pct}%)`;
}

// ── private copies of the spaced-repetition helpers (spaced-repetition.js is
// NOT loaded on topic pages, and this file must stay self-contained). Keep
// these in step with srTodayStr/srStatus/srStageLabel over there. ──

// Local-timezone 'YYYY-MM-DD', deliberately not toISOString() (UTC) — a review
// due "today" must flip at local midnight, not at 11pm/1am under BST.
function _notifTodayStr(d) {
    d = d || new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function _notifReviewStatus(row, todayStr) {
    if (row.completed_at) return 'completed';
    if (row.due_date < todayStr) return 'overdue';   // 'YYYY-MM-DD' sorts as a date
    if (row.due_date === todayStr) return 'due';
    return 'upcoming';
}
function _notifStageLabel(stage) {
    return { 1: '1 day', 2: '1 week', 3: '4 weeks' }[stage] || ('stage ' + stage);
}
// Topic display name for a review row. Tries the all-subjects tree (root
// pages), then the current subject's (topic pages load only their own), then
// degrades to the readable half of the page id — the bell runs on pages that
// have any of the three.
function _notifPageName(pageId) {
    const id = String(pageId || '');
    const trees = [];
    if (window.PAGE_GROUPS_ALL) Object.keys(window.PAGE_GROUPS_ALL).forEach(s => trees.push(window.PAGE_GROUPS_ALL[s]));
    if (window.PAGE_GROUPS) trees.push(window.PAGE_GROUPS);
    for (const groups of trees) {
        for (const g of (groups || [])) {
            for (const p of (g.pages || [])) {
                if (p.id === id) return p.name;
                for (const c of (p.children || [])) if (c.id === id) return c.name;
            }
        }
    }
    return id.split(':').pop().replace(/[-_]+/g, ' ') || id;
}

// ── Review-due notifications (shared: the bell AND notifications.html) ──
// Pure: takes schedule rows ({ page_id, stage, due_date, completed_at }) and
// returns the same note shape as deriveStudentNotifications.
//
// This derivation USED to live only inside notifications.html, which is why
// due reviews showed on that page but never reached the bell or its badge —
// students got no nudge unless they went looking. Both callers now share this
// one function so the two can't drift apart again, and so the note KEYS match:
// dismissals are stored per-key in task_notification_reads, so a review
// dismissed on the page must be the same key the bell dismisses.
//
// page_id is subject-prefixed ('business:1-3-business-ownership'), so the slug
// comes from the id itself — no extra `classes` round trip needed.
function deriveReviewNotifications(scheduleRows, readKeys, todayStr) {
    const today = todayStr || _notifTodayStr();
    const read = new Set(readKeys || []);
    const notes = [];
    (scheduleRows || []).forEach(r => {
        // 'example' is the permanent demo row get_review_schedule() re-dates to
        // today on every call. It has no questions and can NEVER be ticked off,
        // so nudging about it would put an un-clearable badge on every student
        // forever. It still shows on the calendar, where it's a harmless
        // "this is what a due review looks like" example.
        if (r.page_id === 'example') return;
        const st = _notifReviewStatus(r, today);
        if (st !== 'due' && st !== 'overdue') return;
        const slug = String(r.page_id).split(':')[0];
        const name = _notifPageName(r.page_id);
        notes.push({
            key: `review:${slug}:${r.page_id}:${r.stage}:${r.due_date}`,
            icon: st === 'overdue' ? '⏰' : '🗓️',
            at: new Date(r.due_date + 'T08:00:00').getTime(),
            href: '/review-calendar.html?subject=' + encodeURIComponent(slug),
            text: st === 'overdue'
                ? `Review overdue: “${name}” (${_notifStageLabel(r.stage)}) was due ${new Date(r.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
                : `Review due today: “${name}” (${_notifStageLabel(r.stage)}) — pass a short quiz to tick it off`,
        });
    });
    return notes.filter(n => !read.has(n.key)).map(notifDecorate).sort((a, b) => b.at - a.at);
}

// ── Student notifications (derived — no cron needed) ──
// Returns [{ key, icon, text, taskId, at }] newest first, excluding read keys.
function deriveStudentNotifications(rows, readKeys) {
    // rows: [{ task, assignment, attempts }]
    const notes = [];
    const read = new Set(readKeys || []);
    const now = Date.now();
    const SOON = 48 * 3600 * 1000;

    rows.forEach(({ task, assignment, attempts }) => {
        const due = _notifEffectiveDue(task, assignment);
        const subs = _notifSubmittedAttempts(attempts);
        const assignedAt = new Date(assignment.assigned_at).getTime();

        notes.push({
            key: 'assigned:' + task.id, icon: '📋', taskId: task.id, at: assignedAt,
            text: `New task assigned: “${task.title}”` + (due ? ` — due ${_notifFmtDateTime(due)}` : ''),
        });
        if (due && !subs.length) {
            if (now < due.getTime() && due.getTime() - now < SOON) {
                notes.push({
                    key: 'due:' + task.id, icon: '⏰', taskId: task.id, at: due.getTime() - SOON,
                    text: `Deadline approaching: “${task.title}” is due ${_notifFmtDateTime(due)}`,
                });
            }
            if (now > due.getTime()) {
                notes.push({
                    key: 'overdue:' + task.id, icon: '⚠️', taskId: task.id, at: due.getTime(),
                    text: task.late_policy === 'lock'
                        ? `Deadline passed: “${task.title}” has locked`
                        : `Overdue: “${task.title}” — you can still submit, it will be marked late`,
                });
            }
        }
        subs.filter(a => a.marking_complete).forEach(a => {
            notes.push({
                key: 'marked:' + a.id, icon: '✅', taskId: task.id,
                at: new Date(a.submitted_at || a.started_at).getTime(),
                text: `Results ready: “${task.title}” has been marked — ${_notifFmtScore(a)}`,
            });
        });
    });

    return notes.filter(n => !read.has(n.key)).map(notifDecorate).sort((a, b) => b.at - a.at);
}

function _notifEsc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION TYPE REGISTRY — the single source of truth for every
// alert the platform derives (student + teacher + admin). Each derived
// note carries `type` (a key of this map) and `priority`; the bell,
// both notifications pages and the preferences UI all read from here so
// icons, labels and defaults never drift apart.
//
//   aud      — who this type is for ('student' | 'teacher' | 'admin').
//   kind     — 'action' (must DO) | 'info' (FYI); mirrors teacher_todos.
//   priority — 'high' | 'normal' | 'low'; sorts high-first within a day.
// ══════════════════════════════════════════════════════════════
const NOTIF_TYPES = {
    // teacher
    marking:         { icon: '✍️',   label: 'Submissions to mark',              aud: 'teacher', kind: 'action', priority: 'high'   },
    topic_request:   { icon: '🙋',   label: 'Student topic-access requests',    aud: 'teacher', kind: 'action', priority: 'high'   },
    class_invite:    { icon: '🧑‍🏫', label: 'Co-teacher invites',               aud: 'teacher', kind: 'action', priority: 'normal' },
    edit_request:    { icon: '✋',   label: 'Requests to edit your subjects',   aud: 'teacher', kind: 'action', priority: 'normal' },
    external_share:  { icon: '🌐',   label: 'External share requests',          aud: 'admin',   kind: 'action', priority: 'normal' },
    question_report: { icon: '🚩',   label: 'Question reports from students',   aud: 'teacher', kind: 'action', priority: 'normal' },
    integrity:       { icon: '🚫',   label: 'Integrity alerts (blocked paste)', aud: 'teacher', kind: 'info',   priority: 'low'    },
    // student
    task_assigned:   { icon: '📋',   label: 'New tasks assigned',    aud: 'student', kind: 'action', priority: 'high'   },
    task_due:        { icon: '⏰',   label: 'Deadlines approaching', aud: 'student', kind: 'action', priority: 'high'   },
    task_overdue:    { icon: '⚠️',   label: 'Overdue tasks',         aud: 'student', kind: 'action', priority: 'high'   },
    task_marked:     { icon: '✅',   label: 'Marked results',        aud: 'student', kind: 'info',   priority: 'normal' },
    review_due:      { icon: '🗓️',  label: 'Reviews due',           aud: 'student', kind: 'action', priority: 'normal' },
};

// Key-prefix → type. Existing keys are IMMUTABLE (dismissals live per-key in
// task_notification_reads), so this maps the historical prefixes rather than
// changing them. Longest/most-specific prefixes are tested first ('overdue:'
// before 'due:') so neither shadows the other.
function notifTypeForKey(key) {
    const k = String(key || '');
    if (k.startsWith('mark:')) return 'marking';
    if (k.startsWith('req:')) return 'topic_request';
    if (k.startsWith('classinvite:')) return 'class_invite';
    if (k.startsWith('editreq:')) return 'edit_request';
    if (k.startsWith('extshare:')) return 'external_share';
    if (k.startsWith('qreport:')) return 'question_report';
    if (k.startsWith('integrity:')) return 'integrity';
    if (k.startsWith('assigned:')) return 'task_assigned';
    if (k.startsWith('overdue:')) return 'task_overdue';
    if (k.startsWith('due:')) return 'task_due';
    if (k.startsWith('marked:')) return 'task_marked';
    if (k.startsWith('review:')) return 'review_due';
    return null;
}

// Stamps `type`, `priority` and `kind` onto a derived note from the registry,
// without clobbering anything a derivation set explicitly. Applied at the
// return of every derive*Notifications function so callers can rely on the
// fields being present.
function notifDecorate(n) {
    if (!n.type) n.type = notifTypeForKey(n.key);
    const t = NOTIF_TYPES[n.type];
    if (t) {
        if (n.priority == null) n.priority = t.priority;
        if (n.kind == null) n.kind = t.kind;
    }
    if (n.priority == null) n.priority = 'normal';
    return n;
}

// ── Cached am_i_admin() (school-admin.sql) ──
// Memoised as a PROMISE on window so the bell derivation and the full to-do
// page (both of which call deriveTeacherNotifications on the same page load)
// share one RPC round-trip. Degrades to "not an admin" if the RPC is missing.
function notifAmIAdmin(client) {
    if (window._gcseAmIAdminP) return window._gcseAmIAdminP;
    window._gcseAmIAdminP = (async () => {
        try {
            const { data, error } = await client.rpc('am_i_admin');
            if (error) return { is_owner: false, schools: [] };
            return data || { is_owner: false, schools: [] };
        } catch (e) { return { is_owner: false, schools: [] }; }
    })();
    return window._gcseAmIAdminP;
}

// ══════════════════════════════════════════════════════════════
// FEED HEALTH (observability)
// supabase-js RESOLVES with { error } rather than throwing, so a discarded
// error is INDISTINGUISHABLE from "no rows" — a renamed column, changed RLS or
// drifted RPC signature silently kills a feed forever, and nobody notices
// because "zero notifications" looks exactly like a healthy quiet day. So every
// feed runs through notifFeed(): it still returns data||[] (a broken feed
// degrades, never throws), but records the outcome on window._gcseNotifHealth
// keyed by label. A QA pass or devtools can then assert, against a
// fully-migrated DB, that Object.values(_gcseNotifHealth).every(h => h.ok).
// Purely additive: no user-facing or control-flow change.
//   window._gcseNotifHealth = { edit_request:{ok,code,at}, integrity:{…}, … }
// ══════════════════════════════════════════════════════════════
function notifHealthMark(label, ok, code) {
    try {
        const w = (typeof window !== 'undefined') ? window : {};
        const health = (w._gcseNotifHealth = w._gcseNotifHealth || {});
        health[label] = { ok: !!ok, code: ok ? null : (code || 'error'), at: Date.now() };
    } catch (e) { /* no window (tests) — health is best-effort */ }
}
// Wrap a supabase query/RPC thunk. Records health for `label`, always resolves
// to an array (never throws), so callers just do `(await notifFeed(...)).forEach`.
async function notifFeed(label, thunk) {
    try {
        const res = await thunk();
        const err = res && res.error;
        notifHealthMark(label, !err, err && (err.code || err.message));
        return (res && res.data) || [];
    } catch (e) {
        notifHealthMark(label, false, (e && (e.code || e.message)) || 'threw');
        return [];
    }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES — per-type level + sound, plus a global
// sound switch. localStorage (gcse_notif_prefs_v1) is the primary store;
// user_notif_prefs (supabase/notification-prefs.sql — NOT yet run on
// live) is a best-effort cross-device sync. Everything degrades to
// localStorage-only when the table is missing (42P01), with no console spam.
//
//   level ∈ 'normal' (bell + badge + chime + page)
//         | 'quiet'  (page only — muted from the bell)
//         | 'off'    (hidden everywhere)
//   sound  — per-type chime opt-out (only meaningful at level 'normal')
//   soundOn — global master switch (default true)
// ══════════════════════════════════════════════════════════════
const NOTIF_PREFS_KEY = 'gcse_notif_prefs_v1';
const NOTIF_SEEN_KEY = 'gcse_notif_seen_v1';

// ── Per-account localStorage namespacing ──
// School machines are SHARED (ICT suites, staffrooms), so every localStorage
// key here is suffixed with the signed-in uid. An un-namespaced blob would leak
// one teacher's muted types onto the next person to log in on the same PC — and
// the moment they touched any setting, notifPrefsSave() would upsert the
// borrowed prefs into THEIR server row, making the bleed permanent and
// cross-device. uid is set the first time notifPrefsLoad()/notifPrefsSave()
// runs (both always receive it); before that the bare key is used for the
// pre-auth case only, where nothing syncs to a server row anyway.
let _notifPrefsUid = null;
function _notifNsKey(base) {
    return _notifPrefsUid ? base + ':' + _notifPrefsUid : base;
}
// Adopt the uid and, once, drop the legacy un-namespaced blobs from the
// pre-namespacing build so they can never be read as if they were this
// account's. Called with the uid the moment it's known.
function _notifSetUid(uid) {
    if (!uid || _notifPrefsUid === uid) return;
    _notifPrefsUid = uid;
    try { localStorage.removeItem(NOTIF_PREFS_KEY); localStorage.removeItem(NOTIF_SEEN_KEY); } catch (e) {}
}

// integrity alerts are noisy/low-stakes, so they start muted from the bell
// (still visible on the notifications page). Everything else is 'normal' —
// students in particular have always had "results ready" in their bell.
function _notifDefaultLevel(type) {
    return type === 'integrity' ? 'quiet' : 'normal';
}
function _notifPrefsDefaults() {
    const types = {};
    Object.keys(NOTIF_TYPES).forEach(t => { types[t] = { level: _notifDefaultLevel(t), sound: true }; });
    return { v: 1, soundOn: true, updatedAt: null, types };
}
// Defaults ← base ← incoming (later source wins per field). Unknown types in a
// stored blob are ignored, so adding a type to the registry Just Works.
function _notifPrefsMerge(base, incoming) {
    const out = _notifPrefsDefaults();
    const apply = (p) => {
        if (!p || typeof p !== 'object') return;
        if (typeof p.soundOn === 'boolean') out.soundOn = p.soundOn;
        if (p.updatedAt) out.updatedAt = p.updatedAt;
        if (p.types && typeof p.types === 'object') {
            Object.keys(p.types).forEach(t => {
                if (!out.types[t]) return;
                const src = p.types[t] || {};
                if (src.level === 'normal' || src.level === 'quiet' || src.level === 'off') out.types[t].level = src.level;
                if (typeof src.sound === 'boolean') out.types[t].sound = src.sound;
            });
        }
    };
    apply(base); apply(incoming);
    return out;
}
function _notifPrefsLoadLocal() {
    try {
        const raw = localStorage.getItem(_notifNsKey(NOTIF_PREFS_KEY));
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
function _notifPrefsSaveLocal(prefs) {
    try { localStorage.setItem(_notifNsKey(NOTIF_PREFS_KEY), JSON.stringify(prefs)); } catch (e) {}
}
// Synchronous, localStorage-only merged prefs — used by the bell on every
// refresh so a change made on the settings page is reflected next poll without
// another round trip.
function notifPrefsLocal() {
    return _notifPrefsMerge(_notifPrefsLoadLocal(), null);
}
// Async load with best-effort server merge (newer updatedAt wins). Always
// resolves to a usable prefs object; caches the merged result locally.
async function notifPrefsLoad(client, uid) {
    if (uid) _notifSetUid(uid);
    const local = _notifPrefsLoadLocal();
    let server = null;
    if (client && uid) {
        try {
            const { data, error } = await client.from('user_notif_prefs')
                .select('prefs, updated_at').eq('user_id', uid).maybeSingle();
            if (!error && data) {
                server = (data.prefs && typeof data.prefs === 'object') ? Object.assign({}, data.prefs) : {};
                server.updatedAt = data.updated_at || server.updatedAt || null;
            }
        } catch (e) { /* 42P01 / offline — localStorage only */ }
    }
    const lt = local && local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const st = server && server.updatedAt ? new Date(server.updatedAt).getTime() : 0;
    const prefs = st >= lt ? _notifPrefsMerge(local, server) : _notifPrefsMerge(server, local);
    _notifPrefsSaveLocal(prefs);
    return prefs;
}
// Writes localStorage synchronously (source of truth) then upserts the server
// row best-effort. A missing table just leaves the server copy absent.
async function notifPrefsSave(client, uid, prefs) {
    if (uid) _notifSetUid(uid);
    prefs = prefs || _notifPrefsDefaults();
    prefs.updatedAt = new Date().toISOString();
    _notifPrefsSaveLocal(prefs);
    if (client && uid) {
        try {
            await client.from('user_notif_prefs')
                .upsert({ user_id: uid, prefs: prefs, updated_at: prefs.updatedAt });
        } catch (e) { /* table missing — localStorage remains the source of truth */ }
    }
    return prefs;
}
function notifLevelFor(prefs, type) {
    const t = prefs && prefs.types && prefs.types[type];
    if (t && (t.level === 'normal' || t.level === 'quiet' || t.level === 'off')) return t.level;
    return _notifDefaultLevel(type);
}
function notifSoundFor(prefs, type) {
    const t = prefs && prefs.types && prefs.types[type];
    if (t && typeof t.sound === 'boolean') return t.sound;
    return true;
}

// ══════════════════════════════════════════════════════════════
// CHIME + "new item" detection. Self-contained Web Audio (NOT
// gamification.js — that isn't loaded on teacher pages). The seen-set
// (gcse_notif_seen_v1) records the first time each note key was seen at
// level 'normal', so a given notification chimes exactly once per browser
// even across page navigations. (NOTIF_SEEN_KEY is declared up top, next to
// NOTIF_PREFS_KEY, because both are per-account namespaced via _notifNsKey.)
// ══════════════════════════════════════════════════════════════
let _notifAudioCtx = null;

function _notifAudioContext() {
    if (_notifAudioCtx) return _notifAudioCtx;
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        _notifAudioCtx = new AC();
    } catch (e) { _notifAudioCtx = null; }
    return _notifAudioCtx;
}
// Autoplay policy blocks audio before a user gesture; resume on the first
// pointerdown so the next genuinely-new item can chime. No-op if no ctx yet.
function _notifResumeAudio() {
    if (_notifAudioCtx && _notifAudioCtx.state === 'suspended') {
        try { _notifAudioCtx.resume().catch(() => {}); } catch (e) {}
    }
}
// Two-tone ding (~880→1318 Hz, ~0.35 s, peak gain ≤0.12). Never throws.
function notifPlayChime() {
    const ctx = _notifAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        gain.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1318.5, now + 0.16);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.36);
    } catch (e) { /* audio unavailable — badge still updated */ }
}
function _notifSeenLoad() {
    try {
        const m = JSON.parse(localStorage.getItem(_notifNsKey(NOTIF_SEEN_KEY)) || '{}');
        return (m && typeof m === 'object') ? m : {};
    } catch (e) { return {}; }
}
function _notifSeenSave(map) {
    try {
        let keys = Object.keys(map);
        if (keys.length > 400) {
            keys = keys.sort((a, b) => (map[b] || 0) - (map[a] || 0)).slice(0, 400);
            const pruned = {};
            keys.forEach(k => { pruned[k] = map[k]; });
            map = pruned;
        }
        localStorage.setItem(_notifNsKey(NOTIF_SEEN_KEY), JSON.stringify(map));
    } catch (e) {}
}
// Pure: which of `visibleKeys` aren't in `seenMap` yet. Returns the new keys
// plus a fresh map with them recorded at `now`. Exported shape kept simple so
// it's unit-testable without a DOM.
function notifDetectNew(visibleKeys, seenMap, now) {
    now = now || Date.now();
    const map = Object.assign({}, seenMap || {});
    const newKeys = [];
    (visibleKeys || []).forEach(k => {
        if (!(k in map)) { map[k] = now; newKeys.push(k); }
    });
    return { newKeys, map };
}

// ── Teacher notifications (derived — no cron needed) ──
// Async: fetches everything currently needing the teacher's attention and
// returns [{ key, icon, text, href, at, kind }] newest-first, UNFILTERED
// (callers apply their own read / snooze / done state). Reused by the bell
// (below) AND the full teacher to-do page (teacher-notifications.html), so
// both stay in sync. `kind` is 'action' for items the teacher must DO;
// there's room for 'info' items later.
async function deriveTeacherNotifications(client, uid) {
    const notes = [];
    if (!client || !uid) return notes;
    // Hoisted so the new feeds below (which live in their OWN try/catch, outside
    // the tasks fetch) can still name a class even if the tasks query failed.
    const className = {};
    const pageName = (pageId) => {
        const bySlug = window.PAGE_GROUPS_ALL || {};
        for (const slug of Object.keys(bySlug)) {
            for (const g of bySlug[slug]) {
                for (const p of (g.pages || [])) {
                    if (p.id === pageId) return p.name;
                    for (const c of (p.children || [])) if (c.id === pageId) return c.name;
                }
            }
        }
        return pageId;
    };
    try {
        const [tasksRes, classesRes] = await Promise.all([
            client.from('tasks').select('id, title, class_id, status').eq('status', 'published'),
            client.from('classes').select('id, name'),
        ]);
        const tasks = tasksRes && tasksRes.data, classes = classesRes && classesRes.data;
        notifHealthMark('tasks', !(tasksRes && tasksRes.error),
            tasksRes && tasksRes.error && (tasksRes.error.code || tasksRes.error.message));
        (classes || []).forEach(c => { className[c.id] = c.name; });

        // ✍️ Submissions waiting to be marked, grouped per task.
        const taskIds = (tasks || []).map(t => t.id);
        if (taskIds.length) {
            const atts = await notifFeed('marking', () => client.from('task_attempts')
                .select('task_id, submitted_at')
                .in('task_id', taskIds)
                .eq('status', 'submitted').eq('marking_complete', false));
            const byTask = {};
            atts.forEach(a => {
                const b = byTask[a.task_id] = byTask[a.task_id] || { n: 0, at: 0 };
                b.n++;
                const t = new Date(a.submitted_at || 0).getTime();
                if (t > b.at) b.at = t;
            });
            Object.entries(byTask).forEach(([taskId, b]) => {
                const task = (tasks || []).find(t => t.id === taskId);
                if (!task) return;
                const cls = className[task.class_id] || '';
                notes.push({
                    key: `mark:${taskId}:${b.n}`, icon: '✍️', kind: 'action', at: b.at || Date.now(),
                    href: `/teacher-tasks.html?class=${encodeURIComponent(task.class_id)}&task=${encodeURIComponent(taskId)}`,
                    text: `${b.n} submission${b.n === 1 ? '' : 's'} waiting to be marked — “${task.title}”${cls ? ' (' + cls + ')' : ''}`,
                });
            });
        }

        // 🙋 Pending topic-access requests.
        (await notifFeed('topic_request', () => client.from('topic_access_requests')
            .select('id, page_id, class_id, requested_at, status, profiles!topic_access_requests_student_id_fkey(username)')
            .eq('status', 'pending'))).forEach(r => {
            const who = (r.profiles && r.profiles.username) || 'A student';
            const cls = className[r.class_id] || '';
            notes.push({
                key: `req:${r.id}`, icon: '🙋', kind: 'action', at: new Date(r.requested_at || 0).getTime(),
                href: `/teacher-dashboard.html?class=${encodeURIComponent(r.class_id)}#topic-access`,
                text: `${who} asked to open “${pageName(r.page_id)}”${cls ? ' (' + cls + ')' : ''}`,
            });
        });

        // 🧑‍🏫 Pending co-teacher invites (supabase/class-teachers.sql). Links to
        // My Classes, where the accept/decline banner lives.
        (await notifFeed('class_invite', () => client.rpc('get_my_pending_class_invites'))).forEach(iv => {
            notes.push({
                key: `classinvite:${iv.id}`, icon: '🧑‍🏫', kind: 'action',
                at: new Date(iv.created_at || 0).getTime(),
                href: '/teacher-classes.html',
                text: `${iv.invited_by || 'A teacher'} invited you to co-teach “${iv.class_name}” — open My Classes to accept`,
            });
        });
    } catch (e) { notifHealthMark('tasks', false, (e && (e.code || e.message)) || 'threw'); }

    // ── The four extra feeds live OUTSIDE the tasks try/catch, each in their
    // own guard, so a missing tasks table doesn't silence them (and vice
    // versa). Several of these source tables/RPCs are not installed on live —
    // every block degrades silently. ──

    // ✋ Requests to edit a subject you own (subjects-v2-s2-requests.sql).
    // notifFeed records health + returns [] on a missing table / errored RPC.
    (await notifFeed('edit_request', () => client.rpc('get_incoming_edit_requests'))).forEach(r => {
        notes.push({
            key: `editreq:${r.id}`, icon: NOTIF_TYPES.edit_request.icon,
            type: 'edit_request', kind: 'action', priority: 'normal',
            at: new Date(r.created_at || 0).getTime(),
            href: '/teacher-subjects.html',
            text: `“${r.requester_name || 'A teacher'}” asked to edit “${r.subject_name || 'a subject'}”`
                + (r.reason ? ` — “${r.reason}”` : ''),
        });
    });

    // 🌐 External-share requests (subjects-v2-s3-external.sql). Admin/owner only:
    // gated on the memoised am_i_admin() call, then queried per administered
    // school (the RPC is scoped to one school_id at a time, as admin.js does).
    try {
        const admin = await notifAmIAdmin(client);
        if (admin && (admin.is_owner || (admin.schools && admin.schools.length))) {
            for (const sc of (admin.schools || [])) {
                // Per-school; the label carries the school id so one school's
                // failure doesn't masquerade as another's success in health.
                const xr = await notifFeed('external_share:' + sc.id,
                    () => client.rpc('get_incoming_external_requests', { p_school_id: sc.id }));
                xr.filter(r => r.status === 'pending').forEach(r => {
                    notes.push({
                        key: `extshare:${r.id}`, icon: NOTIF_TYPES.external_share.icon,
                        type: 'external_share', kind: 'action', priority: 'normal',
                        at: new Date(r.created_at || 0).getTime(),
                        href: '/admin.html',
                        text: `External share request: “${r.subject_name}” → ${r.invitee_name} (${r.invitee_email})`
                            + (r.requester_name ? ` · from ${r.requester_name}` : ''),
                    });
                });
            }
        }
    } catch (e) { /* am_i_admin() unavailable — skip */ }

    // 🚩 Open question reports from students you teach (question-reports.sql).
    // Same 'open' filter the dashboard uses, so resolving one there stops it
    // re-alerting here (it leaves the 'open' set).
    (await notifFeed('question_report', () => client.rpc('get_question_reports', { p_status: 'open' }))).forEach(r => {
        const reasonLabel = ({ wrong_answer: 'wrong answer', typo: 'typo', confusing: 'confusing', technical: 'technical', other: 'issue' })[r.reason] || 'issue';
        notes.push({
            key: `qreport:${r.id}`, icon: NOTIF_TYPES.question_report.icon,
            type: 'question_report', kind: 'action', priority: 'normal',
            at: new Date(r.created_at || 0).getTime(),
            href: '/teacher-dashboard.html#alerts',
            text: `Question report (${reasonLabel}) from ${r.reporter_username || 'a student'}`
                + (r.subject_slug ? ` · ${r.subject_slug}` : ''),
        });
    });

    // 🚫 Integrity alerts — blocked copy-paste attempts in the last 48h,
    // grouped per student per LOCAL day (integrity-events.sql). kind 'info'.
    {
        const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const ev = await notifFeed('integrity', () => client.from('integrity_events')
            .select('student_id, created_at, profiles(username)')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(500));
        const groups = {};
        ev.forEach(e => {
            const day = _notifTodayStr(new Date(e.created_at));
            const gk = e.student_id + ':' + day;
            const g = groups[gk] = groups[gk] || { student_id: e.student_id, day, n: 0, at: 0, name: null };
            g.n++;
            const t = new Date(e.created_at).getTime();
            if (t > g.at) g.at = t;
            if (!g.name && e.profiles && e.profiles.username) g.name = e.profiles.username;
        });
        Object.keys(groups).forEach(gk => {
            const g = groups[gk];
            const dayLabel = new Date(g.day + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            notes.push({
                key: `integrity:${g.student_id}:${g.day}`, icon: NOTIF_TYPES.integrity.icon,
                type: 'integrity', kind: 'info', priority: 'low',
                at: g.at || Date.now(),
                href: '/teacher-dashboard.html#alerts',
                text: `${g.name || 'A student'} — ${g.n} blocked paste attempt${g.n === 1 ? '' : 's'} on ${dayLabel}`,
            });
        });
    }

    // Priority-aware sort: newest LOCAL day first, then high priority within a
    // day, then newest. Composite-key comparator so it stays transitive.
    const rank = { high: 0, normal: 1, low: 2 };
    return notes.map(notifDecorate).sort((a, b) => {
        const da = _notifTodayStr(new Date(a.at)), db = _notifTodayStr(new Date(b.at));
        if (da !== db) return db < da ? -1 : 1;               // newer day first
        const pr = (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
        if (pr) return pr;
        return b.at - a.at;
    });
}

// ── Bell UI (self-invoking; everything below is private to this IIFE) ──
(function () {
    const REFRESH_INTERVAL_MS = 2 * 60 * 1000; // backstop poll (was 5 min; no realtime yet)
    let _client = null;
    let _uid = null;
    let _items = [];
    let _role = 'student'; // set by boot(); teachers get their own derivation
    let _prefs = null;     // notification preferences (level + sound per type)
    let _baseTitle = null; // document.title without our "(n) " badge
    let _lastSetTitle = null;

    function injectStyles() {
        if (document.getElementById('gcseNotifStyles')) return;
        const s = document.createElement('style');
        s.id = 'gcseNotifStyles';
        s.textContent = `
.gcse-notif-wrap{position:relative;display:inline-flex;align-items:center;}
.gcse-notif-wrap.gcse-notif-fixed{position:fixed;bottom:20px;right:20px;z-index:500;}
.gcse-notif-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;
  width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.25);color:var(--chrome-text, var(--paper,#f5f0e8));font-size:16px;cursor:pointer;
  font-family:inherit;line-height:1;padding:0;transition:border-color .15s,background .15s;}
.gcse-notif-wrap.gcse-notif-fixed .gcse-notif-btn{background:var(--chrome, var(--ink,#0f1923));
  border-color:rgba(255,255,255,.3);box-shadow:0 4px 14px rgba(0,0,0,.35);}
.gcse-notif-btn:hover{border-color:var(--gold,#d4a843);background:rgba(255,255,255,.18);}
.gcse-notif-badge{position:absolute;top:-3px;right:-3px;background:var(--wrong,#c84b31);
  color:#fff;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;
  min-width:16px;height:16px;border-radius:99px;display:none;align-items:center;
  justify-content:center;padding:0 4px;border:2px solid var(--ink,#0f1923);}
.gcse-notif-badge.show{display:flex;}
.gcse-notif-panel{position:absolute;top:calc(100% + 10px);right:0;width:320px;max-width:88vw;
  max-height:70vh;overflow-y:auto;background:var(--card-bg,#fffcf6);
  border:1px solid var(--border,#c9bfaa);border-radius:10px;
  box-shadow:0 14px 40px rgba(0,0,0,.25);padding:6px;display:none;z-index:501;
  font-family:'DM Sans',sans-serif;color:var(--ink,#1a2332);}
.gcse-notif-panel.show{display:block;}
.gcse-notif-wrap.gcse-notif-fixed .gcse-notif-panel{top:auto;bottom:calc(100% + 10px);}
.gcse-notif-empty{padding:20px 10px;text-align:center;color:var(--mid,#5a6e7f);font-size:12.5px;font-style:italic;}
.gcse-notif-row{display:flex;gap:8px;align-items:flex-start;padding:10px 8px;font-size:12.5px;line-height:1.4;}
.gcse-notif-row+.gcse-notif-row{border-top:1px solid var(--border,#c9bfaa);}
.gcse-notif-row .gcse-notif-icon{flex-shrink:0;}
.gcse-notif-row .gcse-notif-text{flex:1;}
.gcse-notif-row .gcse-notif-open{display:block;margin-top:3px;color:var(--accent,#4a6fa5);font-weight:600;text-decoration:none;font-size:11.5px;}
.gcse-notif-dismiss{flex-shrink:0;background:none;border:none;color:var(--mid,#5a6e7f);
  cursor:pointer;font-size:13px;padding:2px 5px;border-radius:4px;line-height:1;}
.gcse-notif-dismiss:hover{background:var(--cream,#ede7d9);color:var(--ink,#1a2332);}
@media (max-width:520px){
  .gcse-notif-panel{position:fixed !important;top:auto !important;bottom:0 !important;left:0;right:0;
    width:100%;max-width:100%;max-height:60vh;border-radius:14px 14px 0 0;}
}
        `;
        document.head.appendChild(s);
    }

    function buildBell() {
        const wrap = document.createElement('div');
        wrap.className = 'gcse-notif-wrap';
        wrap.innerHTML = `
            <button type="button" class="gcse-notif-btn" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
                <span aria-hidden="true">🔔</span><span class="gcse-notif-badge"></span>
            </button>
            <div class="gcse-notif-panel" role="menu" aria-label="Notifications"></div>`;
        const btn = wrap.querySelector('.gcse-notif-btn');
        const panel = wrap.querySelector('.gcse-notif-panel');
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const willShow = !panel.classList.contains('show');
            panel.classList.toggle('show', willShow);
            btn.setAttribute('aria-expanded', String(willShow));
        });
        document.addEventListener('click', e => {
            if (!wrap.contains(e.target)) {
                panel.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
        panel.addEventListener('click', async e => {
            // "Mark all read" — dismiss everything in one click.
            if (e.target.closest('.gcse-notif-clearall')) {
                const keys = _items.map(n => n.key);
                _items = [];
                render(wrap);
                if (_client && _uid && keys.length) {
                    try {
                        await _client.from('task_notification_reads')
                            .upsert(keys.map(k => ({ student_id: _uid, note_key: k })));
                    } catch (err) { console.error('task_notification_reads upsert', err); }
                }
                return;
            }
            const dismissBtn = e.target.closest('.gcse-notif-dismiss');
            if (!dismissBtn) return;
            const key = dismissBtn.closest('.gcse-notif-row').dataset.key;
            _items = _items.filter(n => n.key !== key);
            render(wrap);
            if (_client && _uid) {
                try { await _client.from('task_notification_reads').upsert({ student_id: _uid, note_key: key }); }
                catch (err) { console.error('task_notification_reads upsert', err); }
            }
        });
        return wrap;
    }

    function render(wrap) {
        const badge = wrap.querySelector('.gcse-notif-badge');
        const panel = wrap.querySelector('.gcse-notif-panel');
        badge.textContent = _items.length > 9 ? '9+' : String(_items.length);
        badge.classList.toggle('show', _items.length > 0);
        // Full-history / to-do page: students → notifications.html,
        // teachers → their task-management page.
        const viewAllHref = _role === 'teacher' ? '/teacher-notifications.html' : '/notifications.html';
        const settingsHref = _role === 'teacher' ? '/teacher-notifications.html#settings' : '/notifications.html';
        const viewAll = `<a href="${viewAllHref}" style="font-size:11px;color:var(--accent,#4a6fa5);font-weight:600;text-decoration:none;">View all →</a>`;
        const gear = `<a href="${settingsHref}" title="Notification settings" aria-label="Notification settings" style="font-size:13px;line-height:1;text-decoration:none;color:var(--mid,#5a6e7f);">⚙️</a>`;
        const head = _items.length
            ? `<div class="gcse-notif-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 8px 6px;border-bottom:1px solid var(--border,#c9bfaa);">
                 <strong style="font-size:12px;">Notifications (${_items.length})</strong>
                 <span style="display:inline-flex;gap:12px;align-items:center;">${viewAll}<button type="button" class="gcse-notif-clearall" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--accent,#4a6fa5);font-weight:600;">Mark all read</button>${gear}</span>
               </div>`
            : '';
        panel.innerHTML = head + (_items.length ? _items.map(n => `
            <div class="gcse-notif-row" data-key="${_notifEsc(n.key)}">
                <span class="gcse-notif-icon" aria-hidden="true">${n.icon}</span>
                <span class="gcse-notif-text">${_notifEsc(n.text)}<a class="gcse-notif-open" href="${_notifEsc(n.href || ('/task.html?id=' + encodeURIComponent(n.taskId)))}">Open →</a></span>
                <button type="button" class="gcse-notif-dismiss" title="Dismiss" aria-label="Dismiss notification">✕</button>
            </div>`).join('') : `<div class="gcse-notif-empty">No new notifications.<br><br><span style="display:inline-flex;gap:12px;align-items:center;">${viewAll}${gear}</span></div>`);
    }

    // Bell shows only level 'normal' items; badge counts only those. Called by
    // both role paths after they build _items. Also drives the tab-title badge
    // and the once-per-new-item chime.
    function applyPrefsAndRender(wrap) {
        _prefs = notifPrefsLocal();
        _items = _items.filter(n => notifLevelFor(_prefs, n.type || notifTypeForKey(n.key)) === 'normal');
        render(wrap);
        updateTitleBadge(_items.length);
        maybeChime();
    }

    // Capture the base title once; if another script has since rewritten it,
    // adopt the new value (stripping any stale "(n) " prefix) so we never fight
    // over the title with, e.g., a page that shows an unsaved-changes marker.
    function updateTitleBadge(n) {
        try {
            if (_baseTitle === null) _baseTitle = document.title;
            else if (document.title !== _lastSetTitle) _baseTitle = document.title.replace(/^\(\d+\)\s+/, '');
            const next = (n ? '(' + n + ') ' : '') + _baseTitle;
            document.title = next;
            _lastSetTitle = next;
        } catch (e) {}
    }

    // One chime per refresh, once per new item ever, gated on prefs. New =
    // a normal-level key not previously in the seen-set (which persists, so a
    // notification never chimes twice across page loads).
    function maybeChime() {
        const keys = _items.map(n => n.key);
        const { newKeys, map } = notifDetectNew(keys, _notifSeenLoad());
        _notifSeenSave(map);
        if (!newKeys.length) return;
        if (!_prefs || !_prefs.soundOn) return;
        const anyAudible = newKeys.some(k => notifSoundFor(_prefs, notifTypeForKey(k)) !== false);
        if (anyAudible) notifPlayChime();
    }

    function mountBell(wrap, tries) {
        // Preferred home: the slot inside the shared profile cluster
        // (script.js), so the bell sits beside the avatar on EVERY page.
        // The cluster is injected after auth resolves, so poll briefly —
        // the old behaviour of falling straight back to a floating
        // bottom-right button made the header inconsistent across pages.
        tries = tries || 0;
        const slot = document.getElementById('gcseNotifSlot');
        if (slot) { slot.appendChild(wrap); return; }
        if (tries < 25) { setTimeout(() => mountBell(wrap, tries + 1), 200); return; }
        const siteNav = document.getElementById('siteNav');
        if (siteNav) { siteNav.appendChild(wrap); return; }
        const accountBar = document.getElementById('accountBar');
        if (accountBar && accountBar.parentNode) { accountBar.insertAdjacentElement('afterend', wrap); return; }
        wrap.classList.add('gcse-notif-fixed');
        document.body.appendChild(wrap);
    }

    // Reuses window._gcseSupabaseClient if another already-loaded script
    // (script.js / tasks-shared.js / index.html's inline bootstrap) has set
    // one up — bounded poll, since that assignment happens after an async
    // setSession() call, not necessarily by the time this file runs. Only
    // builds its own as a last resort.
    function getClient() {
        return new Promise(resolve => {
            let tries = 0;
            (function poll() {
                if (window._gcseSupabaseClient) return resolve(window._gcseSupabaseClient);
                if (++tries < 10) return setTimeout(poll, 200);
                if (!window.supabase) return resolve(null);
                let cached;
                try { cached = JSON.parse(localStorage.getItem(NOTIF_SESSION_KEY) || 'null'); } catch (e) { cached = null; }
                if (!cached) return resolve(null);
                const client = window.supabase.createClient(NOTIF_SUPABASE_URL, NOTIF_SUPABASE_ANON_KEY);
                client.auth.setSession({ access_token: cached.access_token, refresh_token: cached.refresh_token })
                    .then(({ data, error }) => {
                        if (error || !data.session) return resolve(null);
                        window._gcseSupabaseClient = client;
                        resolve(client);
                    })
                    .catch(() => resolve(null));
            })();
        });
    }

    // ── Due reviews for the bell ──
    // The schedule is seeded LAZILY, inside get_review_schedule() — which is a
    // write (it inserts the +1d/+7d/+28d rows for any topic that has none). A
    // student who only ever opens topic pages would otherwise never have a
    // schedule seeded, and so would never be nudged: the exact gap this fixes.
    // But running a write on every page load and every 5-minute poll, for every
    // student, would be indefensible. So: seed at most ONCE A DAY per browser,
    // then read the schedule straight from topic_reviews on every refresh —
    // that read is RLS-guarded (topic_reviews_self_select), hits the
    // (student_id, due_date) index, and returns only what's actionable.
    // Seeding daily is enough: a topic studied today has its +1d review created
    // by tomorrow's first page load, which is exactly when it first comes due.
    const SR_SEED_DAY_KEY = 'gcse_sr_seeded_v1';

    async function loadDueReviews() {
        const today = _notifTodayStr();
        // Per-account (see _notifNsKey): on a shared machine, seeding must run
        // once per DAY per STUDENT, not once per machine — otherwise only the
        // first student to log in each day gets their +1d/+7d/+28d rows created,
        // and everyone after them silently loses the very nudge this restores.
        const seedKey = _notifNsKey(SR_SEED_DAY_KEY);
        let seededOn = null;
        try { seededOn = localStorage.getItem(seedKey); } catch (e) {}
        if (seededOn !== today) {
            // Only stamp the day as seeded when the RPC actually SUCCEEDED.
            // supabase-js resolves with { error } instead of throwing, so an
            // unconditional setItem would mark the day done even when seeding
            // failed — a transient network blip, or the spaced-repetition
            // migration not yet being live, would then suppress seeding until
            // tomorrow: the exact day the +1d review first comes due. On the
            // day the migration is finally run, every browser that already
            // polled would skip seeding for the rest of that day.
            let ok = false;
            try {
                const { error } = await _client.rpc('get_review_schedule', { p_subject: null });
                ok = !error;
                notifHealthMark('review_seed', ok, error && (error.code || error.message));
            } catch (e) { notifHealthMark('review_seed', false, (e && (e.code || e.message)) || 'threw'); }
            if (ok) { try { localStorage.setItem(seedKey, today); } catch (e) {} }
        }
        // due today + overdue = everything actionable.
        return await notifFeed('review_due', () => _client.from('topic_reviews')
            .select('page_id, stage, due_date, completed_at')
            .is('completed_at', null)
            .lte('due_date', today));
    }

    async function loadAndRender(wrap) {
        if (!_uid) {
            try {
                const { data } = await _client.auth.getSession();
                _uid = data && data.session && data.session.user && data.session.user.id;
            } catch (e) { return; }
        }
        if (!_uid) return;
        try {
            const [{ data: tasks }, { data: asg }, { data: atts }, { data: reads }, reviews] = await Promise.all([
                _client.from('tasks').select('*'),
                _client.from('task_assignments').select('*').eq('student_id', _uid),
                _client.from('task_attempts').select('*').eq('student_id', _uid),
                _client.from('task_notification_reads').select('note_key').eq('student_id', _uid),
                loadDueReviews(),
            ]);
            const readKeys = (reads || []).map(r => r.note_key);
            const rows = (asg || []).map(a => {
                const task = (tasks || []).find(t => t.id === a.task_id);
                if (!task) return null;
                return { task, assignment: a, attempts: (atts || []).filter(x => x.task_id === a.task_id) };
            }).filter(Boolean);
            // Same derivation (and so the same keys) notifications.html uses, so
            // dismissing a review in either place clears it in both.
            _items = deriveStudentNotifications(rows, readKeys)
                .concat(deriveReviewNotifications(reviews, readKeys))
                .sort((a, b) => b.at - a.at);
            applyPrefsAndRender(wrap);
        } catch (e) { /* tasks schema not installed yet, or offline — leave as-is */ }
    }

    // ── Teacher notifications (derived) — see deriveTeacherNotifications()
    // above (top-level, shared with teacher-notifications.html). Keys embed
    // the moving parts (pending count / request id) so dismissing one stays
    // dismissed until something genuinely new happens, which re-alerts.
    async function loadAndRenderTeacher(wrap) {
        if (!_uid) {
            try {
                const { data } = await _client.auth.getSession();
                _uid = data && data.session && data.session.user && data.session.user.id;
            } catch (e) { return; }
        }
        if (!_uid) return;
        try {
            // Derivation shared with the full to-do page (deriveTeacherNotifications).
            // The bell hides items the teacher has dismissed or SNOOZED on that
            // page (teacher_notif_state); dismissals still also land in
            // task_notification_reads (the bell's own ✕ writes there), so both
            // sources are honoured.
            const [notes, { data: reads }, snoozed] = await Promise.all([
                deriveTeacherNotifications(_client, _uid),
                _client.from('task_notification_reads').select('note_key').eq('student_id', _uid),
                _teacherNotifState(_client, _uid),
            ]);
            const read = new Set((reads || []).map(r => r.note_key));
            const now = Date.now();
            _items = notes.filter(n => {
                if (read.has(n.key)) return false;
                const st = snoozed[n.key];
                if (st && st.done) return false;
                if (st && st.snooze_until && new Date(st.snooze_until).getTime() > now) return false;
                return true;
            });
            applyPrefsAndRender(wrap);
        } catch (e) { /* tasks schema not installed yet, or offline — leave as-is */ }
    }

    // Snooze/done state for derived items, from the teacher to-do page's table.
    // Best-effort: if the table isn't installed yet, everything is "active".
    async function _teacherNotifState(client, uid) {
        try {
            const { data, error } = await client.from('teacher_notif_state')
                .select('note_key, snooze_until, done').eq('teacher_id', uid);
            if (error) return {};
            const m = {};
            (data || []).forEach(r => { m[r.note_key] = r; });
            return m;
        } catch (e) { return {}; }
    }

    async function boot() {
        let cached;
        try { cached = JSON.parse(localStorage.getItem(NOTIF_SESSION_KEY) || 'null'); } catch (e) { cached = null; }
        if (!cached || (cached.role !== 'student' && cached.role !== 'teacher')) return;
        _role = cached.role;

        injectStyles();
        const wrap = buildBell();
        mountBell(wrap);

        _client = await getClient();
        if (!_client) return;

        // Resume a suspended AudioContext on the first user gesture so a chime
        // that was blocked pre-gesture can sound on the next new item.
        document.addEventListener('pointerdown', _notifResumeAudio);

        // Resolve uid + do the one server-merge of prefs up front; every refresh
        // then reads prefs from localStorage synchronously (fast, no round trip).
        try {
            const { data } = await _client.auth.getSession();
            _uid = (data && data.session && data.session.user && data.session.user.id) || _uid;
        } catch (e) {}
        _prefs = await notifPrefsLoad(_client, _uid);

        const refresh = () => (_role === 'teacher' ? loadAndRenderTeacher(wrap) : loadAndRender(wrap));
        refresh();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
        setInterval(refresh, REFRESH_INTERVAL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();

// ══════════════════════════════════════════════════════════════
// PASTE GUARD — written exam-answer boxes.
// Students shouldn't be able to paste a Googled/AI answer into an
// exam-style answer box, so paste and text drag-drop are blocked in the
// two shared written-answer textareas (.ep-answer-area on topic pages,
// .answer-box on task.html). The student sees a warning toast and every
// blocked attempt is logged via record_integrity_event()
// (supabase/integrity-events.sql), which the teacher dashboard reads.
// Lives in this file because it's the one shared script every
// student-facing page already loads — topic HTMLs are never edited.
// ══════════════════════════════════════════════════════════════
(function () {
    const GUARD_SELECTOR = 'textarea.ep-answer-area, textarea.answer-box';
    let _lastLoggedAt = 0;
    let _warnTimer = null;

    function _guardRole() {
        try {
            const s = JSON.parse(localStorage.getItem(NOTIF_SESSION_KEY) || 'null');
            return s ? s.role : null;
        } catch (e) { return null; }
    }

    // Same id the page's own progress writes use, so the teacher sees one
    // consistent topic name; task.html has no getPageId(), so its attempts
    // log as 'task:<uuid>'.
    function _guardPageId() {
        if (typeof getPageId === 'function') {
            try { return getPageId(); } catch (e) {}
        }
        if (location.pathname.endsWith('/task.html')) {
            const m = location.search.match(/[?&]id=([^&]+)/);
            if (m) return 'task:' + decodeURIComponent(m[1]);
        }
        return location.pathname.split('/').pop().replace('.html', '') || 'unknown';
    }

    function _guardContext(ta) {
        const m = (ta.id || '').match(/^epTextarea-(\d+)$/);
        if (m) return 'exam q' + (parseInt(m[1], 10) + 1);
        if (ta.id === 'writtenAnswer') return 'task written answer';
        return ta.id || 'answer box';
    }

    function _guardShowWarning(alerted) {
        let el = document.getElementById('gcsePasteWarn');
        if (!el) {
            const s = document.createElement('style');
            s.textContent = `
#gcsePasteWarn{position:fixed;top:18px;left:50%;transform:translateX(-50%) translateY(-8px);
  max-width:min(440px,92vw);z-index:9999;background:var(--wrong,#c84b31);color:#fff;
  font-family:'DM Sans',sans-serif;font-size:13.5px;line-height:1.45;font-weight:600;
  padding:12px 18px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);
  opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;text-align:center;}
#gcsePasteWarn.show{opacity:1;transform:translateX(-50%) translateY(0);}`;
            document.head.appendChild(s);
            el = document.createElement('div');
            el.id = 'gcsePasteWarn';
            el.setAttribute('role', 'alert');
            document.body.appendChild(el);
        }
        el.textContent = '🚫 Copying and pasting is not allowed here — exam answers must be typed in your own words.'
            + (alerted ? ' Your teacher has been alerted.' : '');
        el.classList.add('show');
        clearTimeout(_warnTimer);
        _warnTimer = setTimeout(() => el.classList.remove('show'), 5000);
    }

    function _guardLog(ta, chars) {
        const client = window._gcseSupabaseClient;
        if (!client) return false; // logged out — still blocked, just nothing to log
        const now = Date.now();
        if (now - _lastLoggedAt < 4000) return true; // one row per burst of retries
        _lastLoggedAt = now;
        try {
            client.rpc('record_integrity_event', {
                p_page_id: _guardPageId(),
                p_context: _guardContext(ta),
                p_detail: { chars: chars || 0 },
            }).then(({ error }) => { if (error) console.error('record_integrity_event', error); });
        } catch (e) {}
        return true;
    }

    function _guardHandler(e) {
        const ta = e.target && e.target.closest && e.target.closest(GUARD_SELECTOR);
        if (!ta) return;
        if (_guardRole() === 'teacher') return; // a teacher previewing isn't policed
        e.preventDefault();
        let chars = 0;
        try {
            const dt = e.clipboardData || e.dataTransfer;
            chars = dt ? String(dt.getData('text') || '').length : 0;
        } catch (err) {}
        const alerted = _guardLog(ta, chars);
        _guardShowWarning(alerted);
    }

    // Capture phase so the block runs before any per-textarea listeners.
    document.addEventListener('paste', _guardHandler, true);
    document.addEventListener('drop', _guardHandler, true);
})();
