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

    return notes.filter(n => !read.has(n.key)).sort((a, b) => b.at - a.at);
}

function _notifEsc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
        const [{ data: tasks }, { data: classes }] = await Promise.all([
            client.from('tasks').select('id, title, class_id, status').eq('status', 'published'),
            client.from('classes').select('id, name'),
        ]);
        const className = {};
        (classes || []).forEach(c => { className[c.id] = c.name; });

        // ✍️ Submissions waiting to be marked, grouped per task.
        const taskIds = (tasks || []).map(t => t.id);
        if (taskIds.length) {
            const { data: atts } = await client.from('task_attempts')
                .select('task_id, submitted_at')
                .in('task_id', taskIds)
                .eq('status', 'submitted').eq('marking_complete', false);
            const byTask = {};
            (atts || []).forEach(a => {
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
        try {
            const { data: reqs } = await client.from('topic_access_requests')
                .select('id, page_id, class_id, requested_at, status, profiles!topic_access_requests_student_id_fkey(username)')
                .eq('status', 'pending');
            (reqs || []).forEach(r => {
                const who = (r.profiles && r.profiles.username) || 'A student';
                const cls = className[r.class_id] || '';
                notes.push({
                    key: `req:${r.id}`, icon: '🙋', kind: 'action', at: new Date(r.requested_at || 0).getTime(),
                    href: `/teacher-dashboard.html?class=${encodeURIComponent(r.class_id)}#topic-access`,
                    text: `${who} asked to open “${pageName(r.page_id)}”${cls ? ' (' + cls + ')' : ''}`,
                });
            });
        } catch (e) { /* topic-access schema not installed — skip */ }

        // 🧑‍🏫 Pending co-teacher invites (supabase/class-teachers.sql). Links to
        // My Classes, where the accept/decline banner lives.
        try {
            const { data: invs } = await client.rpc('get_my_pending_class_invites');
            (invs || []).forEach(iv => {
                notes.push({
                    key: `classinvite:${iv.id}`, icon: '🧑‍🏫', kind: 'action',
                    at: new Date(iv.created_at || 0).getTime(),
                    href: '/teacher-classes.html',
                    text: `${iv.invited_by || 'A teacher'} invited you to co-teach “${iv.class_name}” — open My Classes to accept`,
                });
            });
        } catch (e) { /* class-teachers.sql not installed — skip */ }
    } catch (e) { /* tasks schema not installed yet, or offline */ }
    return notes.sort((a, b) => b.at - a.at);
}

// ── Bell UI (self-invoking; everything below is private to this IIFE) ──
(function () {
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // conservative backstop poll
    let _client = null;
    let _uid = null;
    let _items = [];
    let _role = 'student'; // set by boot(); teachers get their own derivation

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
        const viewAll = `<a href="${viewAllHref}" style="font-size:11px;color:var(--accent,#4a6fa5);font-weight:600;text-decoration:none;">View all →</a>`;
        const head = _items.length
            ? `<div class="gcse-notif-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 8px 6px;border-bottom:1px solid var(--border,#c9bfaa);">
                 <strong style="font-size:12px;">Notifications (${_items.length})</strong>
                 <span style="display:inline-flex;gap:12px;align-items:center;">${viewAll}<button type="button" class="gcse-notif-clearall" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--accent,#4a6fa5);font-weight:600;">Mark all read</button></span>
               </div>`
            : '';
        panel.innerHTML = head + (_items.length ? _items.map(n => `
            <div class="gcse-notif-row" data-key="${_notifEsc(n.key)}">
                <span class="gcse-notif-icon" aria-hidden="true">${n.icon}</span>
                <span class="gcse-notif-text">${_notifEsc(n.text)}<a class="gcse-notif-open" href="${_notifEsc(n.href || ('/task.html?id=' + encodeURIComponent(n.taskId)))}">Open →</a></span>
                <button type="button" class="gcse-notif-dismiss" title="Dismiss" aria-label="Dismiss notification">✕</button>
            </div>`).join('') : `<div class="gcse-notif-empty">No new notifications.<br><br>${viewAll}</div>`);
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

    async function loadAndRender(wrap) {
        if (!_uid) {
            try {
                const { data } = await _client.auth.getSession();
                _uid = data && data.session && data.session.user && data.session.user.id;
            } catch (e) { return; }
        }
        if (!_uid) return;
        try {
            const [{ data: tasks }, { data: asg }, { data: atts }, { data: reads }] = await Promise.all([
                _client.from('tasks').select('*'),
                _client.from('task_assignments').select('*').eq('student_id', _uid),
                _client.from('task_attempts').select('*').eq('student_id', _uid),
                _client.from('task_notification_reads').select('note_key').eq('student_id', _uid),
            ]);
            const readKeys = (reads || []).map(r => r.note_key);
            const rows = (asg || []).map(a => {
                const task = (tasks || []).find(t => t.id === a.task_id);
                if (!task) return null;
                return { task, assignment: a, attempts: (atts || []).filter(x => x.task_id === a.task_id) };
            }).filter(Boolean);
            _items = deriveStudentNotifications(rows, readKeys);
            render(wrap);
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
            render(wrap);
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
