// ══════════════════════════════════════════════════════════════
// LEADERBOARD — the shared view layer for leaderboard.html, used by
// BOTH students and teachers (one page, role-branched).
//
// All the ranking, time-windowing and — crucially — the privacy rules
// live server-side in get_leaderboard() (supabase/leaderboard.sql).
// This file only picks a scope/metric/window, fetches, and paints. It
// never sees a name the viewer isn't allowed to see: the RPC returns
// name:null for anyone a student may not identify, so there's nothing
// here to leak.
//
//   • Scope   — My class · Whole <subject> · Class groups (class-vs-class)
//   • Metric  — Overall · Accuracy · Attempts (distinct questions) ·
//               Mastery (Daily Revise) · Streak
//   • Window  — 24h · 7 days · 30 days · All-time
//
// Movement arrows (▲▼ vs the previous equal window) and the "most
// improved" callout come straight from the delta/prev_rank the RPC
// computes. Teachers additionally get a ⚙ Manage modal (enable/disable,
// names on/off, how many rows students see, exclude a student, and named
// link groups) backed by the owner-only mutators in the same SQL file.
//
// Students, on load, call sync_my_leaderboard_achievements() so any newly
// reached tier (top 10 / top 3 / #1) is recorded server-side and toasted
// via gamification.js — the badges stay real because the rank is computed
// on the server, never trusted from here.
// ══════════════════════════════════════════════════════════════

const esc = (typeof taskEscapeHtml === 'function') ? taskEscapeHtml : (s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

let lbClient = null;
let lbUid = null;
let lbIsTeacher = false;
let lbSubject = 'business';       // subjects.slug
let lbSubjectName = 'Revision';
let lbSubjects = [];              // [{slug,name,icon,colour}] the viewer can pick from

// Current selection.
let lbSel = { scope: 'class', metric: 'overall', window: 'all', classId: null, groupId: null };

// Teacher admin data (classes + link groups for this subject), loaded lazily.
let lbAdmin = null;

// WP-3: equipped avatars. Rows carry an `avatar` {character, loadout} ONLY where
// the RPC also returned a name (same privacy gate). Rendering is a post-pass:
// each row stashes its avatar here keyed by index, then lbPaintAvatars() swaps
// the initial for the composed bust once avatar.js has loaded. Reset per render.
let lbAvatarQueue = [];

// Short-TTL client cache so flipping tabs back and forth doesn't hammer the
// RPC (the underlying data changes slowly). Keyed by the full selection.
const lbCache = new Map();
const LB_TTL_MS = 45000;

const SCOPES = [
  { id: 'class',   label: 'My class' },
  { id: 'subject', label: 'Whole subject' },
  { id: 'groups',  label: 'Class groups' },
];
const METRICS = [
  { id: 'overall',  label: '⭐ Overall',  unit: 'pts',   field: 'overall' },
  { id: 'accuracy', label: '🎯 Accuracy', unit: '%',     field: 'accuracy_pct' },
  { id: 'attempts', label: '✍️ Attempts', unit: 'q',      field: 'distinct_q' },
  { id: 'mastery',  label: '🧠 Mastery',  unit: 'mastered', field: 'mastered' },
  { id: 'streak',   label: '🔥 Streak',   unit: 'day',   field: 'streak' },
];
const WINDOWS = [
  { id: '24h', label: 'Last 24h' },
  { id: '7d',  label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

function lbMetric(id) { return METRICS.find(m => m.id === id) || METRICS[0]; }
function lbWindowLabel(id) { return (WINDOWS.find(w => w.id === id) || {}).label || id; }

// ── Comparison columns ──────────────────────────────────────────
// Every leaderboard row already carries ALL metric values (see get_leaderboard
// in supabase/leaderboard.sql) — ranking by one metric and DISPLAYING all of
// them together needs no extra fetch. lbColumns() returns the column set for
// the current board, flagging the ranked metric as `sel` (accent-highlighted);
// the rest are shown greyed for comparison only and never change the order.
// The class-vs-class groups board has no per-class streak, so it omits Streak
// and shows the per-student averages the RPC returns (avg_q / avg_m).
function lbColumns(isGroups) {
  const sel = lbSel.metric;
  const cols = isGroups ? [
    { id: 'overall',  label: 'Overall',  get: r => fmtNum(r.overall) },
    { id: 'accuracy', label: 'Avg acc',  get: r => r.accuracy_pct == null ? '—' : r.accuracy_pct + '%' },
    { id: 'attempts', label: 'Avg q',    get: r => fmtNum(r.avg_q) },
    { id: 'mastery',  label: 'Avg mast', get: r => fmtNum(r.avg_m) },
    // % of the class currently on a streak (≥1 day) — an engagement signal that
    // reads better than a zero-inflated average streak. Comparison-only.
    { id: 'streak',   label: '🔥 active', get: r => r.active_pct == null ? '—' : r.active_pct + '%' },
  ] : [
    { id: 'overall',  label: 'Overall',  get: r => fmtNum(r.overall) },
    { id: 'accuracy', label: 'Accuracy', get: r => r.accuracy_pct == null ? '—' : r.accuracy_pct + '%',
      sub: r => (r.answered || 0) + ' ans' },
    { id: 'attempts', label: 'Attempts', get: r => fmtNum(r.distinct_q) },
    { id: 'mastery',  label: 'Mastery',  get: r => fmtNum(r.mastered) },
    { id: 'streak',   label: 'Streak',   get: r => fmtNum(r.streak) + (r.streak > 0 ? '🔥' : '') },
  ];
  return cols.map(c => Object.assign({}, c, { sel: c.id === sel }));
}

// Size the board's grid from the column count: fixed rank + flexible name +
// one fixed track per metric. --lb-min forces the rows wider than a phone so
// #lbBoard.lb-multi scrolls sideways (rather than crushing the columns); on a
// wide screen --lb-min is below the panel width so the name column just fills.
function lbSetGrid(board, nCols) {
  board.style.setProperty('--lb-cols', `46px minmax(140px,1fr) repeat(${nCols}, 78px)`);
  board.style.setProperty('--lb-min', (46 + 140 + nCols * 78 + (nCols + 1) * 12 + 24) + 'px');
}

// One metric cell (used for both header labels and value rows).
function lbMetricCell(inner, sel) {
  return `<span class="lb-mcell${sel ? ' sel' : ''}">${inner}</span>`;
}

// ── Init ────────────────────────────────────────────────────────
async function init() {
  const auth = await tasksAuthInit(); // no required role — students AND teachers
  if (!auth) return;
  lbClient = auth.client;
  lbUid = auth.session.user.id;
  lbIsTeacher = auth.role === 'teacher';

  // Subject from ?subject= via subject-loader; may be switched below if the
  // viewer has more than one.
  lbSubject = (window.SUBJECT && window.SUBJECT.slug) || 'business';
  lbSubjectName = (window.SUBJECT && window.SUBJECT.name) || 'Revision';
  if (!lbIsTeacher && window.SUBJECT && window.SUBJECT.colour) {
    document.documentElement.style.setProperty('--accent', window.SUBJECT.colour);
  }

  document.title = `Leaderboard — ${lbSubjectName}`;
  document.getElementById('lbSubjectBadge').textContent = lbSubjectName;
  document.getElementById('lbDashLink').href = 'dashboard.html?subject=' + encodeURIComponent(lbSubject);
  document.getElementById('lbDailyLink').href = 'daily-revise.html?subject=' + encodeURIComponent(lbSubject);

  // Header account cluster (same avatar dropdown every other page uses).
  if (typeof _gcseInjectAccountBar === 'function') {
    window._gcseProfile = window._gcseProfile || { username: auth.username, role: auth.role };
    window._gcseSupabaseClient = window._gcseSupabaseClient || lbClient;
    _gcseInjectAccountBar();
  } else {
    document.getElementById('accountBar').innerHTML =
      `<span>Logged in as <strong>${esc(auth.username || 'you')}</strong></span>`;
  }
  // Warm the avatar library so the first board paints with faces, not initials.
  if (typeof _gcseEnsureAvatarLib === 'function') _gcseEnsureAvatarLib();

  // Which subjects can this viewer pick from? (Multi-subject teachers/students.)
  try {
    const { data: subs, error } = await lbClient.rpc('get_my_subjects');
    if (!error && Array.isArray(subs)) {
      lbSubjects = subs.map(s => ({ slug: s.slug, name: s.name, icon: s.icon, colour: s.colour }));
      if (lbSubjects.length && !lbSubjects.some(s => s.slug === lbSubject)) {
        // ?subject wasn't one of theirs — default to their first.
        lbSubject = lbSubjects[0].slug; lbSubjectName = lbSubjects[0].name;
      }
    }
  } catch (e) { /* fall back to the single loaded subject */ }

  // Teachers manage classes, so they start on a class they pick; a student's
  // class is resolved server-side, so they can start on it directly too.
  buildControls();
  if (lbIsTeacher) await loadAdmin();
  syncControlVisibility();
  await refresh();

  // Students: record any newly-reached leaderboard tier for badges.
  if (!lbIsTeacher) syncAchievements();
}

// ── Control bars ────────────────────────────────────────────────
function buildControls() {
  const seg = (host, items, current, onPick) => {
    const el = document.getElementById(host);
    el.innerHTML = items.map(it =>
      `<button type="button" data-id="${esc(it.id)}" aria-pressed="${it.id === current}">${it.label}</button>`).join('');
    el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => onPick(b.dataset.id)));
  };

  seg('lbScopeSeg', SCOPES, lbSel.scope, id => { lbSel.scope = id; lbSel.groupId = null; syncControlVisibility(); refresh(); markSeg(); });
  seg('lbMetricSeg', METRICS, lbSel.metric, id => { lbSel.metric = id; refresh(); markSeg(); });
  seg('lbWindowSeg', WINDOWS, lbSel.window, id => { lbSel.window = id; refresh(); markSeg(); });

  // Subject switcher (only when the viewer has more than one subject).
  if (lbSubjects.length > 1) {
    const row = document.querySelector('#lbControls .lb-row');
    if (row && !document.getElementById('lbSubjectSel')) {
      const wrap = document.createElement('span');
      wrap.className = 'lb-groupsel';
      wrap.innerHTML = `<label class="lb-rowlabel" for="lbSubjectSel" style="min-width:auto;">Subject</label>
        <select id="lbSubjectSel" aria-label="Choose subject">${lbSubjects.map(s =>
          `<option value="${esc(s.slug)}" ${s.slug === lbSubject ? 'selected' : ''}>${esc((s.icon ? s.icon + ' ' : '') + s.name)}</option>`).join('')}</select>`;
      row.insertBefore(wrap, document.getElementById('lbClassPick'));
      document.getElementById('lbSubjectSel').addEventListener('change', async e => {
        lbSubject = e.target.value;
        lbSubjectName = (lbSubjects.find(s => s.slug === lbSubject) || {}).name || lbSubjectName;
        document.getElementById('lbSubjectBadge').textContent = lbSubjectName;
        lbSel.classId = null; lbSel.groupId = null; lbAdmin = null;
        if (lbIsTeacher) await loadAdmin();
        syncControlVisibility();
        refresh();
      });
    }
  }

  document.getElementById('lbManageBtn').addEventListener('click', openManage);
  document.getElementById('lbModalClose').addEventListener('click', closeManage);
  document.getElementById('lbModalBackdrop').addEventListener('click', closeManage);
}

function markSeg() {
  const set = (host, cur) => document.getElementById(host).querySelectorAll('button')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === cur)));
  set('lbScopeSeg', lbSel.scope); set('lbMetricSeg', lbSel.metric); set('lbWindowSeg', lbSel.window);
}

// Show/hide the class picker (teacher + class scope) and the group selector
// (teacher + subject/groups scope), and the Manage button (teacher only).
function syncControlVisibility() {
  const classPick = document.getElementById('lbClassPick');
  const groupSel = document.getElementById('lbGroupSel');
  document.getElementById('lbManageBtn').style.display = lbIsTeacher ? '' : 'none';

  const wantClassPick = lbIsTeacher && lbSel.scope === 'class';
  classPick.style.display = wantClassPick ? 'inline-flex' : 'none';
  if (wantClassPick && lbAdmin) {
    const sel = document.getElementById('lbClassSelect');
    const classes = lbAdmin.classes || [];
    if (!lbSel.classId && classes.length) lbSel.classId = classes[0].class_id;
    sel.innerHTML = classes.map(c =>
      `<option value="${esc(c.class_id)}" ${c.class_id === lbSel.classId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')
      || '<option value="">No classes yet</option>';
    sel.onchange = e => { lbSel.classId = e.target.value; refresh(); };
  }

  const wantGroupSel = lbIsTeacher && (lbSel.scope === 'subject' || lbSel.scope === 'groups')
    && lbAdmin && (lbAdmin.groups || []).length;
  groupSel.style.display = wantGroupSel ? 'inline-flex' : 'none';
  if (wantGroupSel) {
    groupSel.innerHTML = `<label class="lb-rowlabel" for="lbGroupSelect" style="min-width:auto;">Group</label>
      <select id="lbGroupSelect" aria-label="Choose class group">
        <option value="">All my classes</option>
        ${lbAdmin.groups.map(g => `<option value="${esc(g.group_id)}" ${g.group_id === lbSel.groupId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
      </select>`;
    document.getElementById('lbGroupSelect').onchange = e => { lbSel.groupId = e.target.value || null; refresh(); };
  }
}

// ── Fetch + cache ───────────────────────────────────────────────
function cacheKey() {
  return [lbSel.scope, lbSel.metric, lbSel.window, lbSubject, lbSel.classId || '', lbSel.groupId || ''].join('|');
}

async function refresh() {
  const board = document.getElementById('lbBoard');
  const key = cacheKey();
  const hit = lbCache.get(key);
  if (hit && (Date.now() - hit.at) < LB_TTL_MS) { renderResult(hit.data); return; }

  board.innerHTML = `<div class="lb-empty"><div class="lb-empty-emoji">⏳</div><p>Loading…</p></div>`;
  try {
    const { data, error } = await lbClient.rpc('get_leaderboard', {
      p_scope: lbSel.scope, p_metric: lbSel.metric, p_window: lbSel.window,
      p_class_id: (lbSel.scope === 'class' && lbIsTeacher) ? lbSel.classId : null,
      p_subject: lbSubject,
      p_group_id: (lbSel.scope !== 'class') ? lbSel.groupId : null,
    });
    if (error) throw error;
    lbCache.set(key, { at: Date.now(), data });
    renderResult(data);
  } catch (e) {
    console.error('get_leaderboard', e);
    board.innerHTML = `<div class="lb-empty"><div class="lb-empty-emoji">😕</div>
      <p><strong>Couldn't load the leaderboard.</strong></p>
      <p class="muted">Please try again in a moment.</p></div>`;
  }
}

// ── Render ──────────────────────────────────────────────────────
function renderResult(data) {
  const meta = (data && data.meta) || {};
  const rows = (data && data.rows) || [];
  const board = document.getElementById('lbBoard');
  const banners = document.getElementById('lbBanners');
  const foot = document.getElementById('lbFootnote');
  banners.innerHTML = '';
  foot.textContent = '';
  // Reset to the plain (non-scrolling, 3-column) layout; the individual/group
  // renderers below re-add lb-multi + size the grid when there are rows.
  board.classList.remove('lb-multi');

  if (meta.disabled) {
    board.innerHTML = emptyState('🔒', 'Leaderboard turned off',
      'Your teacher has hidden the leaderboard for your class right now.');
    return;
  }
  if (meta.empty || !rows.length) {
    board.innerHTML = emptyState('🌱', 'Nothing to rank yet',
      lbSel.window === 'all'
        ? 'As soon as your class starts practising, everyone shows up here. Answer some questions to get on the board!'
        : `No activity in the ${lbWindowLabel(lbSel.window).toLowerCase()} yet — try a wider period, or come back after some practice.`);
    return;
  }

  // Anonymised notice (student viewing beyond their own class, or names off).
  if (meta.anonymised) {
    banners.insertAdjacentHTML('beforeend', banner('info', '🕶️',
      'Names outside your own class are hidden — you\'ll see ranks and class tags only.'));
  } else if (!lbIsTeacher && lbSel.scope !== 'class') {
    banners.insertAdjacentHTML('beforeend', banner('info', '🏫',
      'Across the whole subject, only your own class shows names; other classes appear by rank and class tag.'));
  }

  if (lbSel.scope === 'groups') renderGroups(rows, meta);
  else renderIndividual(rows, meta);

  // Footnote: how the ranking is defined + the accuracy guard.
  const notes = [];
  if (lbSel.metric === 'attempts') notes.push('“Attempts” counts distinct questions — re-answering the same one doesn’t inflate it.');
  if (lbSel.metric === 'accuracy') notes.push(`Accuracy needs at least ${meta.min_answers || 10} answered questions in the period to be ranked.`);
  if (lbSel.metric === 'overall') notes.push('Overall blends mastery, effort (distinct questions) and accuracy.');
  if (lbSel.metric === 'streak') notes.push('Streak is your current run of consecutive days with practice — the time period doesn’t change it.');
  if (lbSel.metric === 'mastery') notes.push('Mastery counts questions you’ve locked in via Daily Revise’s Rule of 3.');
  foot.textContent = notes.join('  ');
}

function renderIndividual(rows, meta) {
  const board = document.getElementById('lbBoard');
  const banners = document.getElementById('lbBanners');
  const cols = lbColumns(false);
  lbAvatarQueue = [];
  board.classList.add('lb-multi');
  lbSetGrid(board, cols.length);

  // Most-improved callout (needs a previous period, so not on All-time).
  if (meta.has_prev) {
    const climbers = rows.filter(r => typeof r.delta === 'number' && r.delta > 0)
      .sort((a, b) => b.delta - a.delta);
    if (climbers.length) {
      const c = climbers[0];
      const who = c.is_self ? 'You' : (c.name ? esc(c.name) : `A student in ${esc(c.class_name || 'another class')}`);
      banners.insertAdjacentHTML('beforeend', banner('improve', '📈',
        `<strong>Most improved:</strong> ${who} climbed ${c.delta} place${c.delta === 1 ? '' : 's'} since the previous ${lbWindowLabel(lbSel.window).toLowerCase()}.`));
    }
  }

  const showClassTag = lbSel.scope !== 'class';
  let lastRank = 0;
  const body = rows.map(r => {
    // A jump in rank number (visible-count gate skipped some) → divider.
    let divider = '';
    if (r.rank && lastRank && r.rank > lastRank + 1) divider = `<div class="lb-divider">⋯</div>`;
    if (r.rank) lastRank = r.rank;
    return divider + individualRow(r, cols, showClassTag);
  }).join('');

  board.innerHTML = headerRow(cols, false) + body;
  lbPaintAvatars();

  // If a student isn't ranked yet, nudge them under the board.
  if (!lbIsTeacher && meta.self_rank == null) {
    board.insertAdjacentHTML('beforeend',
      `<div class="lb-divider" style="text-transform:none; letter-spacing:0; padding-top:14px;">
        You're not on the board yet — a bit more practice and you'll appear here. 💪</div>`);
  }
}

// Metric value cells shared by student + group rows: the ranked column (sel)
// carries the value bold in the accent colour; the rest are greyed. An optional
// `sub` (e.g. the answered count under Accuracy) shows small beneath the value.
function metricCells(r, cols) {
  return cols.map(c => {
    const sub = c.sub ? c.sub(r) : '';
    return lbMetricCell(
      `<span class="lb-mval">${c.get(r)}</span>${sub ? `<span class="lb-msub">${esc(sub)}</span>` : ''}`,
      c.sel);
  }).join('');
}

function individualRow(r, cols, showClassTag) {
  const self = r.is_self;
  const named = !!r.name;
  const initial = named ? esc(String(r.name).trim().charAt(0).toUpperCase()) : '•';
  const displayName = named ? esc(r.name) : 'Student';
  const rankCell = r.rank ? rankHtml(r.rank, r.delta, lbMetric(lbSel.metric)) : '<span class="lb-rank">—</span>';
  const classTag = (showClassTag && r.class_name)
    ? `<span class="lb-classtag" title="${esc(r.class_name)}">${esc(r.class_name)}</span>` : '';
  // Stash the avatar (only present on named rows) for the post-render paint pass.
  const avKey = (named && r.avatar && r.avatar.character) ? (lbAvatarQueue.push(r.avatar) - 1) : -1;
  return `
    <div class="lb-rowitem ${self ? 'is-self' : ''}">
      ${rankCell}
      <div class="lb-who">
        <span class="lb-avatar ${named ? '' : 'anon'}"${avKey >= 0 ? ` data-avkey="${avKey}"` : ''} aria-hidden="true">${initial}</span>
        <span class="lb-name-wrap">
          <span class="lb-name">${displayName}${self ? '<span class="lb-you-pill">YOU</span>' : ''}</span>
          ${classTag}
        </span>
      </div>
      ${metricCells(r, cols)}
    </div>`;
}

function renderGroups(rows, meta) {
  const board = document.getElementById('lbBoard');
  const cols = lbColumns(true);
  board.classList.add('lb-multi');
  lbSetGrid(board, cols.length);
  const body = rows.map(r => {
    const self = r.is_self;
    const rankCell = r.rank ? rankHtml(r.rank, r.delta, lbMetric(lbSel.metric)) : '<span class="lb-rank">—</span>';
    return `
      <div class="lb-rowitem ${self ? 'is-self' : ''}">
        ${rankCell}
        <div class="lb-who">
          <span class="lb-avatar" aria-hidden="true">🏫</span>
          <span class="lb-name-wrap">
            <span class="lb-name">${esc(r.name || 'Class')}${self ? '<span class="lb-you-pill">YOURS</span>' : ''}</span>
            <span class="lb-classtag">${r.members || 0} student${r.members === 1 ? '' : 's'}</span>
          </span>
        </div>
        ${metricCells(r, cols)}
      </div>`;
  }).join('');
  board.innerHTML = headerRow(cols, true) + body;
}

function headerRow(cols, groups) {
  const metricHead = cols.map(c => lbMetricCell(esc(c.label), c.sel)).join('');
  return `<div class="lb-head"><span>#</span><span>${groups ? 'Class' : 'Student'}</span>${metricHead}</div>`;
}

// Rank cell with medal for top 3 + accessible movement arrow.
function rankHtml(rank, delta, m) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  let move = '';
  if (m.id !== 'streak' && typeof delta === 'number') {
    if (delta > 0) move = `<span class="lb-move up" title="Up ${delta}">▲${delta}<span class="sr-only"> up ${delta} places</span></span>`;
    else if (delta < 0) move = `<span class="lb-move down" title="Down ${-delta}">▼${-delta}<span class="sr-only"> down ${-delta} places</span></span>`;
    else move = `<span class="lb-move same" title="No change">–</span>`;
  }
  return `<span class="lb-rank">${medal ? `<span class="medal" aria-hidden="true">${medal}</span>` : ''}${rank}${move}</span>`;
}

function fmtNum(n) { return (n == null) ? '—' : Number(n).toLocaleString(); }

// WP-3: after a board renders, swap each named row's initial for its equipped
// avatar bust. avatar.js is loaded on demand via account-cluster's shared
// loader; if it (or the lib) is unavailable, the initials simply remain.
async function lbPaintAvatars() {
  if (!lbAvatarQueue.length || typeof _gcseEnsureAvatarLib !== 'function') return;
  const ok = await _gcseEnsureAvatarLib();
  if (!ok || !window.VidyaAvatar) return;
  const board = document.getElementById('lbBoard');
  if (!board) return;
  board.querySelectorAll('.lb-avatar[data-avkey]').forEach(el => {
    const a = lbAvatarQueue[+el.dataset.avkey];
    if (!a || !a.character || !VidyaAvatar.has(a.character)) return;
    const lo = { character: a.character }, l = a.loadout || {};
    Object.keys(l).forEach(k => { if (l[k]) lo[k] = l[k]; });
    try {
      el.innerHTML = VidyaAvatar.compose(lo, { size: 40, crop: 'bust' });
      el.classList.add('lb-avatar-art');
    } catch (e) {}
  });
}

// Art-mode styling for leaderboard avatars (mirrors the header treatment).
(function ensureLbAvatarArt() {
  if (document.getElementById('lb-avatar-art')) return;
  const st = document.createElement('style');
  st.id = 'lb-avatar-art';
  st.textContent = '.lb-avatar.lb-avatar-art{background:#e9edf3;overflow:hidden;padding:0;}'
    + '.lb-avatar.lb-avatar-art svg{width:100%;height:100%;display:block;}';
  document.head.appendChild(st);
})();

function banner(kind, emoji, html) {
  return `<div class="lb-banner ${kind}"><span class="lb-b-emoji" aria-hidden="true">${emoji}</span><span>${html}</span></div>`;
}
function emptyState(emoji, title, body) {
  return `<div class="lb-empty"><div class="lb-empty-emoji">${emoji}</div>
    <p><strong>${esc(title)}</strong></p><p class="muted">${esc(body)}</p></div>`;
}

// ── Teacher admin (settings modal) ──────────────────────────────
async function loadAdmin() {
  try {
    const { data, error } = await lbClient.rpc('get_leaderboard_admin', { p_subject: lbSubject });
    if (!error) lbAdmin = data;
  } catch (e) { console.error('get_leaderboard_admin', e); }
}

function openManage() {
  if (!lbAdmin) return;
  renderManage();
  document.getElementById('lbModalBackdrop').classList.add('show');
  document.getElementById('lbModal').classList.add('show');
}
function closeManage() {
  document.getElementById('lbModalBackdrop').classList.remove('show');
  document.getElementById('lbModal').classList.remove('show');
}

function renderManage() {
  const classes = (lbAdmin && lbAdmin.classes) || [];
  const groups = (lbAdmin && lbAdmin.groups) || [];
  const body = document.getElementById('lbModalBody');

  const classCards = classes.map(c => `
    <div class="lb-set-class" data-cid="${esc(c.class_id)}">
      <h3>${esc(c.name)}</h3>
      <div class="lb-set-line">
        <label><input type="checkbox" data-k="enabled" ${c.enabled ? 'checked' : ''}/> Show leaderboard to this class</label>
      </div>
      <div class="lb-set-line">
        <label><input type="checkbox" data-k="show_names" ${c.show_names ? 'checked' : ''}/> Students can see classmates’ names</label>
      </div>
      <div class="lb-set-line">
        <label>Rows students see: <input type="number" data-k="visible_count" min="0" max="200" value="${Number(c.visible_count)}"/></label>
        <span class="muted">(0 = everyone)</span>
      </div>
      <div class="lb-set-line" style="align-items:flex-start;">
        <span class="lb-rowlabel" style="min-width:auto; padding-top:5px;">Exclude</span>
        <div class="lb-excludes">
          ${(c.students || []).map(s => `<button type="button" class="lb-exchip" data-sid="${esc(s.student_id)}" aria-pressed="${s.excluded}">${esc(s.username || 'student')}</button>`).join('') || '<span class="muted">No students yet.</span>'}
        </div>
      </div>
    </div>`).join('') || '<p class="muted">You have no classes for this subject yet.</p>';

  const groupsHtml = `
    <div class="lb-groups-wrap">
      <h3 style="font-size:15px; font-weight:600; margin-bottom:8px;">Class groups <span class="muted" style="font-weight:400;">— compare a chosen subset of your classes</span></h3>
      <div id="lbGroupList">${groups.map(g => `
        <div class="lb-group-row" data-gid="${esc(g.group_id)}">
          <strong>${esc(g.name)}</strong>
          <span class="muted">${(g.class_ids || []).length} class${(g.class_ids || []).length === 1 ? '' : 'es'}</span>
          <button type="button" class="btn-ghost lb-editgroup" style="padding:5px 10px; font-size:12px;">Edit</button>
          <button type="button" class="btn-ghost lb-delgroup" style="padding:5px 10px; font-size:12px;">Delete</button>
        </div>`).join('') || '<p class="muted">No groups yet.</p>'}</div>
      <button type="button" class="btn" id="lbNewGroup" style="margin-top:8px;">+ New group</button>
    </div>`;

  body.innerHTML = `
    <h2>Leaderboard settings</h2>
    <p class="muted">Controls apply to what <strong>students</strong> see — you always see full names and everyone.</p>
    ${classCards}
    ${groupsHtml}
    <div style="margin-top:18px; display:flex; justify-content:flex-end;">
      <button type="button" class="btn" id="lbCloseSave">Done</button>
    </div>`;

  // Wire per-class settings — each change persists immediately.
  body.querySelectorAll('.lb-set-class').forEach(card => {
    const cid = card.dataset.cid;
    const readAndSave = () => {
      const enabled = card.querySelector('[data-k="enabled"]').checked;
      const showNames = card.querySelector('[data-k="show_names"]').checked;
      let vc = parseInt(card.querySelector('[data-k="visible_count"]').value, 10);
      if (isNaN(vc) || vc < 0) vc = 0; if (vc > 200) vc = 200;
      saveSettings(cid, enabled, showNames, vc);
    };
    card.querySelectorAll('[data-k="enabled"], [data-k="show_names"]').forEach(el => el.addEventListener('change', readAndSave));
    card.querySelector('[data-k="visible_count"]').addEventListener('change', readAndSave);
    card.querySelectorAll('.lb-exchip').forEach(chip => chip.addEventListener('click', () => {
      const next = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(next));
      toggleExclude(cid, chip.dataset.sid, next);
    }));
  });

  body.querySelector('#lbCloseSave').addEventListener('click', () => { closeManage(); lbAdmin = null; loadAdmin().then(() => { syncControlVisibility(); lbCache.clear(); refresh(); }); });
  const newBtn = body.querySelector('#lbNewGroup');
  if (newBtn) newBtn.addEventListener('click', () => editGroup(null));
  body.querySelectorAll('.lb-group-row').forEach(row => {
    const gid = row.dataset.gid;
    row.querySelector('.lb-editgroup').addEventListener('click', () => editGroup(gid));
    row.querySelector('.lb-delgroup').addEventListener('click', () => deleteGroup(gid));
  });
}

async function saveSettings(classId, enabled, showNames, visibleCount) {
  try {
    await lbClient.rpc('set_leaderboard_settings', {
      p_class_id: classId, p_enabled: enabled, p_show_names: showNames, p_visible_count: visibleCount,
    });
    // Keep the in-memory copy in step so a reopen shows the saved state.
    const c = (lbAdmin.classes || []).find(x => x.class_id === classId);
    if (c) { c.enabled = enabled; c.show_names = showNames; c.visible_count = visibleCount; }
    lbCache.clear();
  } catch (e) { console.error('set_leaderboard_settings', e); alert('Could not save that setting — please try again.'); }
}

async function toggleExclude(classId, studentId, excluded) {
  try {
    await lbClient.rpc('set_leaderboard_exclusion', { p_class_id: classId, p_student_id: studentId, p_excluded: excluded });
    const c = (lbAdmin.classes || []).find(x => x.class_id === classId);
    const s = c && (c.students || []).find(x => x.student_id === studentId);
    if (s) s.excluded = excluded;
    lbCache.clear();
  } catch (e) { console.error('set_leaderboard_exclusion', e); }
}

// Group editor — a tiny prompt-based flow (name + which classes) so the modal
// stays lightweight. Reuses the same class list already loaded.
function editGroup(groupId) {
  const classes = (lbAdmin.classes || []);
  if (!classes.length) { alert('Add some classes for this subject first.'); return; }
  const existing = groupId ? (lbAdmin.groups || []).find(g => g.group_id === groupId) : null;
  const name = prompt('Group name:', existing ? existing.name : 'Set 1 vs Set 2');
  if (name == null) return;
  const current = new Set(existing ? existing.class_ids : classes.map(c => c.class_id));
  const menu = classes.map((c, i) => `${i + 1}. ${c.name}${current.has(c.class_id) ? '  ✓' : ''}`).join('\n');
  const pick = prompt(`Which classes are in this group? Enter numbers separated by commas:\n\n${menu}`,
    classes.map((c, i) => current.has(c.class_id) ? (i + 1) : null).filter(Boolean).join(','));
  if (pick == null) return;
  const idxs = pick.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(i => i >= 0 && i < classes.length);
  const classIds = idxs.map(i => classes[i].class_id);
  if (classIds.length < 2) { alert('Pick at least two classes for a group.'); return; }
  saveGroup(groupId, name, classIds);
}

async function saveGroup(groupId, name, classIds) {
  try {
    await lbClient.rpc('save_class_link_group', {
      p_group_id: groupId, p_subject: lbSubject, p_name: name, p_class_ids: classIds,
    });
    lbAdmin = null; await loadAdmin(); renderManage(); syncControlVisibility(); lbCache.clear();
  } catch (e) { console.error('save_class_link_group', e); alert('Could not save the group.'); }
}

async function deleteGroup(groupId) {
  if (!confirm('Delete this group? The classes and their data are untouched.')) return;
  try {
    await lbClient.rpc('delete_class_link_group', { p_group_id: groupId });
    if (lbSel.groupId === groupId) lbSel.groupId = null;
    lbAdmin = null; await loadAdmin(); renderManage(); syncControlVisibility(); lbCache.clear();
  } catch (e) { console.error('delete_class_link_group', e); }
}

// ── Achievements → badges (students) ────────────────────────────
async function syncAchievements() {
  try {
    const { data, error } = await lbClient.rpc('sync_my_leaderboard_achievements', { p_subject: lbSubject });
    if (error || !data) return;
    if (typeof gamificationRefreshLeaderboardStats === 'function') {
      // Let gamification.js re-fetch the cross-subject roll-up and re-toast any
      // newly-earned leaderboard badge on its usual schedule.
      gamificationRefreshLeaderboardStats(lbClient);
    }
  } catch (e) { /* non-fatal — the board still renders */ }
}

// A tiny screen-reader-only helper class (movement arrows carry text too).
(function ensureSrOnly() {
  if (document.getElementById('lb-sr-only')) return;
  const st = document.createElement('style');
  st.id = 'lb-sr-only';
  st.textContent = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}';
  document.head.appendChild(st);
})();

// Refresh when returning to the page (a classmate may have practised).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && lbClient) { lbCache.clear(); refresh(); }
});

document.addEventListener('DOMContentLoaded', init);
