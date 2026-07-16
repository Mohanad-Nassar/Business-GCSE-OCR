// ══════════════════════════════════════════════════════════════
// STUDENT TASKS (shared) — the "My Tasks" list + task notifications +
// per-subject filter, used in TWO places so they never drift:
//   • dashboard.html  — inside the "📋 Tasks" tab
//   • tasks.html      — the standalone student Tasks page
//
// Both pages already load supabase, tasks-shared.js (task-state helpers),
// notifications-shared.js (deriveStudentNotifications) and subject-loader
// (window.SUBJECT). This module owns the data + rendering; the host page
// just provides a Supabase client + the signed-in user id and the DOM
// mount points, then calls studentTasksLoad().
//
// Expected mount element IDs (create whichever the page needs; missing
// ones are skipped): #tasksBody (table body), #notifList, #notifBadge,
// #taskSubjectFilterRow. onAfterRender(rows) lets the dashboard rebuild
// its Insights (score history) from the same rows.
// ══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    let _cfg = { client: null, getUid: () => null, onAfterRender: null };
    let _rows = [];            // [{ task, assignment, attempts }]
    let _readKeys = [];
    let _classSubjects = {};   // class_id -> { slug, name, icon }
    let _view = 'subject';     // 'subject' (active subject only) | 'all'

    // Small local escape alias — tasks-shared.js provides taskEscapeHtml.
    const esc = (s) => (typeof taskEscapeHtml === 'function' ? taskEscapeHtml(s) : String(s == null ? '' : s));
    const $ = (id) => document.getElementById(id);

    // The dashboard is a single-subject view; window.SUBJECT is set by
    // subject-loader.js from ?subject= (default business).
    function activeSlug() { return (window.SUBJECT && window.SUBJECT.slug) || 'business'; }
    function activeSubjectName() { return (window.SUBJECT && window.SUBJECT.name) || activeSlug(); }

    // Subject of a task via its class; null when unknown (fail open — an
    // unmapped task must never vanish from every view).
    function taskSubjectSlug(task) {
        const s = task && task.class_id ? _classSubjects[task.class_id] : null;
        return s ? s.slug : null;
    }

    window.studentTasksConfigure = function (cfg) { _cfg = Object.assign(_cfg, cfg || {}); };
    window.studentTasksRows = function () { return _rows; };
    window.studentTasksSetView = function (v) { _view = v; window.studentTasksRender(); };

    window.studentTasksLoad = async function () {
        const client = _cfg.client;
        const uid = _cfg.getUid && _cfg.getUid();
        if (!client || !uid) return;
        try {
            const [{ data: tasks }, { data: asg }, { data: atts }, { data: reads }, { data: cls }] = await Promise.all([
                client.from('tasks').select('*'),
                client.from('task_assignments').select('*').eq('student_id', uid),
                client.from('task_attempts').select('*').eq('student_id', uid),
                client.from('task_notification_reads').select('note_key').eq('student_id', uid),
                // A student's tasks span every class they're in — this map lets
                // the table filter by the task's class's subject.
                client.from('classes').select('id, subjects(slug, name, icon)'),
            ]);
            _readKeys = (reads || []).map(r => r.note_key);
            _classSubjects = {};
            (cls || []).forEach(c => { if (c.subjects) _classSubjects[c.id] = c.subjects; });
            _rows = (asg || []).map(a => {
                const task = (tasks || []).find(t => t.id === a.task_id);
                if (!task) return null;
                return { task, assignment: a, attempts: (atts || []).filter(x => x.task_id === a.task_id) };
            }).filter(Boolean);
        } catch (e) {
            return; // tasks schema not installed yet — leave the list empty
        }
        window.studentTasksRender();
    };

    window.studentTasksRender = function () {
        // ── Notifications ──
        const notifList = $('notifList');
        const badge = $('notifBadge');
        const notes = (typeof deriveStudentNotifications === 'function')
            ? deriveStudentNotifications(_rows, _readKeys) : [];
        if (badge) {
            badge.style.display = notes.length ? '' : 'none';
            badge.textContent = notes.length ? notes.length + ' new' : '';
        }
        if (notifList) {
            notifList.innerHTML = notes.map(n => `
                <div class="note-row" data-key="${esc(n.key)}">
                    <span aria-hidden="true">${n.icon}</span>
                    <span class="note-text">${esc(n.text)} <a href="task.html?id=${encodeURIComponent(n.taskId)}" style="color:var(--accent); font-weight:600;">Open →</a></span>
                    <button type="button" class="note-dismiss" title="Dismiss" aria-label="Dismiss notification">✕</button>
                </div>`).join('');
        }

        // ── Subject filter chips — only when the student's tasks actually
        // span more than the active subject. ──
        const slug = activeSlug();
        const spansOther = _rows.some(r => { const s = taskSubjectSlug(r.task); return s && s !== slug; });
        const filterRow = $('taskSubjectFilterRow');
        if (filterRow) {
            if (spansOther) {
                filterRow.style.display = 'flex';
                filterRow.innerHTML = `
                    <span style="font-family:'DM Mono',monospace; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--mid);">Show tasks:</span>
                    <button type="button" class="task-open-btn${_view === 'subject' ? '' : ' secondary'}" style="padding:5px 12px; font-size:11.5px;" data-taskview="subject">${esc(activeSubjectName())}</button>
                    <button type="button" class="task-open-btn${_view === 'all' ? '' : ' secondary'}" style="padding:5px 12px; font-size:11.5px;" data-taskview="all">All subjects</button>`;
                filterRow.querySelectorAll('[data-taskview]').forEach(b =>
                    b.addEventListener('click', () => window.studentTasksSetView(b.dataset.taskview)));
            } else {
                filterRow.style.display = 'none';
                _view = 'subject';
            }
        }

        // ── Task table ──
        const body = $('tasksBody');
        if (body) {
            const visible = _rows.filter(r => {
                if (_view === 'all' || !spansOther) return true;
                const s = taskSubjectSlug(r.task);
                return !s || s === slug; // unknown subject stays visible (fail open)
            });
            const order = { in_progress: 0, not_started: 1, overdue: 2, locked: 3, submitted: 4 };
            const rows = visible.slice().sort((a, b) => {
                const sa = studentTaskState(a.task, a.assignment, a.attempts);
                const sb = studentTaskState(b.task, b.assignment, b.attempts);
                if (order[sa] !== order[sb]) return order[sa] - order[sb];
                const da = effectiveDue(a.task, a.assignment), db = effectiveDue(b.task, b.assignment);
                return (da ? da.getTime() : Infinity) - (db ? db.getTime() : Infinity);
            });

            if (!rows.length) {
                body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:22px; color:var(--mid); font-size:13px;">${
                    _rows.length ? 'No tasks for this subject right now — try “All subjects”.'
                                 : 'No tasks assigned yet — your teacher’s homework will show up here.'
                }</td></tr>`;
            } else {
                body.innerHTML = rows.map(({ task, assignment, attempts }) => {
                    const state = studentTaskState(task, assignment, attempts);
                    const counted = countedAttempt(task, attempts);
                    const due = effectiveDue(task, assignment);
                    const subs = submittedAttempts(attempts);
                    let score = '—';
                    if (counted) {
                        score = counted.marking_complete
                            ? `${counted.marks_awarded}/${counted.marks_total} (${attemptPct(counted)}%)`
                            : '✍️ being marked';
                    }
                    const label = { submitted: counted && counted.is_late ? 'Submitted late' : 'Submitted',
                        in_progress: 'In progress', overdue: 'Overdue', locked: 'Missed',
                        not_started: 'To do' }[state];
                    const action = state === 'submitted' || state === 'locked'
                        ? `<a class="task-open-btn secondary" href="task.html?id=${task.id}">Results</a>`
                        : `<a class="task-open-btn" href="task.html?id=${task.id}">${state === 'in_progress' ? 'Resume' : 'Start'}</a>`;
                    let dueStyle = '', dueFlag = '';
                    if (due && (state === 'not_started' || state === 'in_progress')) {
                        const hrs = (due.getTime() - Date.now()) / 36e5;
                        if (hrs <= 24) { dueStyle = 'color:var(--wrong);font-weight:700;'; dueFlag = ' ⏰'; }
                        else if (hrs <= 72) { dueStyle = 'color:#8f6d19;font-weight:600;'; }
                    }
                    const subjInfo = task.class_id ? _classSubjects[task.class_id] : null;
                    const subjTag = _view === 'all' && spansOther && subjInfo
                        ? `<span class="task-chip" style="background:var(--cream); color:var(--ink);" title="Subject">${subjInfo.icon ? subjInfo.icon + ' ' : ''}${esc(subjInfo.name)}</span>` : '';
                    return `<tr>
                        <td class="col-page" style="text-align:left;"><strong style="font-size:13px;">${esc(task.title)}</strong>
                            ${subjTag}
                            ${assignment.due_override || assignment.extra_time_minutes ? '<span class="task-chip pending" title="You have an adjusted deadline or extra time">adjusted for you</span>' : ''}</td>
                        <td style="font-family:'DM Mono',monospace; font-size:11.5px; white-space:nowrap;${dueStyle}"${dueFlag ? ' title="Due within 24 hours"' : ''}>${due ? fmtDateTime(due) : '—'}${dueFlag}</td>
                        <td><span class="task-chip ${state}">${label}</span></td>
                        <td style="font-family:'DM Mono',monospace; font-size:12px;">${subs.length}${task.attempts_allowed ? '/' + task.attempts_allowed : ''}</td>
                        <td style="font-family:'DM Mono',monospace; font-size:12px; white-space:nowrap;">${score}</td>
                        <td>${action}</td>
                    </tr>`;
                }).join('');
            }
        }

        if (typeof _cfg.onAfterRender === 'function') {
            try { _cfg.onAfterRender(_rows); } catch (e) { console.error('studentTasks onAfterRender', e); }
        }
    };

    // Dismiss a notification (delegated — survives re-renders). Persists the
    // read so it doesn't come back on reload.
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest && e.target.closest('.note-dismiss');
        if (!btn) return;
        const row = btn.closest('.note-row');
        if (!row) return;
        const key = row.dataset.key;
        row.remove();
        _readKeys.push(key);
        window.studentTasksRender();
        try {
            const client = _cfg.client, uid = _cfg.getUid && _cfg.getUid();
            if (client && uid) await client.from('task_notification_reads').upsert({ student_id: uid, note_key: key });
        } catch (err) { console.error('task_notification_reads upsert', err); }
    });
})();
