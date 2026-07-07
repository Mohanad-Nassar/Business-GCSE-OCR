// ══════════════════════════════════════════════════════════════
// SHARED PROGRESS RENDERING
// Section definitions + a read-only ring grid, used by the
// teacher dashboard to show the same view a student sees. Self-
// contained: it injects its own CSS once, so any page can just
// include this file and call renderProgressGrid(container, progress).
//
// `progress` shape (same as ProgressStore / progress_summary):
//   { pageId: { sectionKey: { done, total } } }
//
// !! REQUIRES window.PAGE_GROUPS to be set BEFORE this file loads.
// The old hand-maintained PAGE_GROUPS literal is gone -- the topic tree is
// now generated from each subject's manifest by tools/build_question_bank.py:
//   - topic pages -> <script src="page-groups.js"> (their own directory;
//     it also sets window.SUBJECT)
//   - root pages  -> <script src="/page-groups-all.js"> +
//     <script src="/subject-loader.js"> + subjectLoaderInit({mode:'single'|'all'})
// Page ids are subject-prefixed ("business:1-1-role-of-business-enterprise")
// and hrefs root-absolute ("/subjects/business/1_1_... .html"). Every bare
// PAGE_GROUPS reference below resolves to the window property.
// ══════════════════════════════════════════════════════════════

if (!window.PAGE_GROUPS) {
  console.error('progress-shared.js: window.PAGE_GROUPS is missing -- include ' +
    'page-groups.js (topic pages) or page-groups-all.js + subject-loader.js + ' +
    'subjectLoaderInit(...) (root pages) BEFORE progress-shared.js');
}

const SECTIONS = [
  {key:'learn',icon:'📚',label:'Key Learning'},
  {key:'mcq',icon:'❓',label:'MCQ'},
  {key:'match',icon:'🔗',label:'Matching'},
  {key:'fib',icon:'✏️',label:'Fill Blanks'},
  {key:'misc',icon:'⚠️',label:'Misconceptions'},
  {key:'tips',icon:'🎯',label:'Exam Tips'},
  {key:'flashcards',icon:'🃏',label:'Flashcards'},
  {key:'tf',icon:'✅',label:'True/False'},
  {key:'exam',icon:'📝',label:'Exam Practice'},
];

const PAGE_TITLES = (() => {
  const m = {};
  (window.PAGE_GROUPS || []).forEach(g => flatPages(g).forEach(p => { m[p.id] = p.name; }));
  return m;
})();
function pageTitle(pageId) { return PAGE_TITLES[pageId] || pageId; }

function flatPages(group) {
  const out = [];
  group.pages.forEach(p => {
    out.push(p);
    if (p.children) p.children.forEach(c => out.push({ ...c, isChild: true }));
  });
  return out;
}

function _tfgEsc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _tfgInjectStyles() {
  if (document.getElementById('topicFilterGridStyles')) return;
  const s = document.createElement('style');
  s.id = 'topicFilterGridStyles';
  s.textContent = `
    .tv-group{border:1px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden;}
    .tv-group-header{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--cream);-webkit-user-select:none;user-select:none;border-left:4px solid var(--accent);}
    .tv-group-header .t{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;}
    .tv-group-btn{flex:1;display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;text-align:left;font-family:inherit;padding:0;}
    .tv-group-btn .t{flex:1;}
    .tv-count{font-size:10.5px;font-family:'DM Mono',monospace;white-space:nowrap;}
    .tv-unit-cb{width:16px;height:16px;cursor:pointer;flex-shrink:0;accent-color:var(--accent);}
    .tv-bulk{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
    .tv-group-body{padding:6px 14px 10px;}
    .tv-group-body.hidden{display:none;}
    .tv-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--border);font-size:13px;}
    .tv-row:first-child{border-top:none;}
    .tv-row label{display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;}
    .tv-row label.disabled{cursor:default;opacity:.7;}
  `;
  document.head.appendChild(s);
}

// Reusable grouped topic-checkbox grid — colour-striped curriculum units,
// each with a whole-unit tickbox ("n/m" count, indeterminate when mixed)
// and an expand/collapse chevron, and a flat list of per-topic checkboxes
// underneath. This is the same component behind the Teacher Dashboard's
// Topic Access visibility grid and Daily Revise class-scope grid — any
// page that already includes this file (for PAGE_GROUPS/flatPages) can
// reuse it instead of hand-rolling another checkbox accordion.
//
// opts:
//   isChecked(pageId) -> bool       current state of one row
//   onToggle(pageIds, checked)      called with every affected page id
//                                   whenever a row, a whole unit, or a bulk
//                                   button changes state — mutate your own
//                                   state here; the grid re-renders itself
//                                   right after, reading it back fresh
//   countLabel(onCount, total) -> string   text for the "n/m …" chip
//   bulkButtons?: [{ label, onClick(allPageIds) }]   0-2 buttons; omit
//                                   entirely (e.g. read-only views) to hide
//                                   the whole bulk row
//   bulkNote?: string               shown after the bulk buttons
//   disabledRow?(pageId) -> bool    true = force-checked, no listener
//                                   (e.g. a teacher's fixed selection shown
//                                   read-only to a student)
//   openGroups: Set                 which group ids start/stay expanded —
//                                   caller-owned so it survives re-renders
//   groups?: array                  defaults to PAGE_GROUPS
//   pageFilter?(page) -> bool       restrict which topics appear at all;
//                                   a unit with zero pages left is skipped
function renderTopicFilterGrid(container, opts) {
  _tfgInjectStyles();
  container.innerHTML = '';
  const groups = opts.groups || PAGE_GROUPS;
  const rerender = () => renderTopicFilterGrid(container, opts);

  if (opts.bulkButtons && opts.bulkButtons.length) {
    const all = [];
    groups.forEach(g => {
      const pages = opts.pageFilter ? flatPages(g).filter(opts.pageFilter) : flatPages(g);
      pages.forEach(p => all.push(p.id));
    });
    const bulk = document.createElement('div');
    bulk.className = 'tv-bulk';
    bulk.innerHTML = opts.bulkButtons.map((b, i) =>
      `<button type="button" class="btn secondary small" data-tfg-bulk="${i}">${_tfgEsc(b.label)}</button>`).join('')
      + (opts.bulkNote ? `<span class="muted" style="font-size:11.5px;">${opts.bulkNote}</span>` : '');
    bulk.addEventListener('click', e => {
      const btn = e.target.closest('button[data-tfg-bulk]');
      if (!btn) return;
      opts.bulkButtons[Number(btn.dataset.tfgBulk)].onClick(all);
      rerender();
    });
    container.appendChild(bulk);
  }

  groups.forEach(group => {
    const pages = opts.pageFilter ? flatPages(group).filter(opts.pageFilter) : flatPages(group);
    if (!pages.length) return;
    const onCount = pages.filter(p => opts.isChecked(p.id)).length;
    const wrap = document.createElement('div');
    wrap.className = 'tv-group';
    const isOpen = opts.openGroups.has(group.id);
    wrap.innerHTML = `
      <div class="tv-group-header" style="border-left-color:${group.colour}">
        <input type="checkbox" class="tv-unit-cb" title="Toggle every topic in ${_tfgEsc(group.title)}" aria-label="Toggle every topic in ${_tfgEsc(group.title)}"/>
        <button type="button" class="tv-group-btn">
          <span class="t">${_tfgEsc(group.title)}</span>
          <span class="muted tv-count">${_tfgEsc(opts.countLabel(onCount, pages.length))}</span>
          <span aria-hidden="true">&#9662;</span>
        </button>
      </div>
      <div class="tv-group-body${isOpen ? '' : ' hidden'}"></div>`;

    const unitCb = wrap.querySelector('.tv-unit-cb');
    unitCb.checked = onCount === pages.length;
    unitCb.indeterminate = onCount > 0 && onCount < pages.length;
    unitCb.addEventListener('change', () => {
      opts.onToggle(pages.map(p => p.id), unitCb.checked);
      rerender();
    });

    const body = wrap.querySelector('.tv-group-body');
    body.innerHTML = pages.map(p => {
      const disabled = !!(opts.disabledRow && opts.disabledRow(p.id));
      const checked = disabled || opts.isChecked(p.id);
      return `<div class="tv-row">
        <label class="${disabled ? 'disabled' : ''}"><input type="checkbox" data-page="${p.id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}/> ${_tfgEsc(p.name)}</label>
      </div>`;
    }).join('');
    wrap.querySelector('.tv-group-btn').addEventListener('click', () => {
      body.classList.toggle('hidden');
      if (body.classList.contains('hidden')) opts.openGroups.delete(group.id); else opts.openGroups.add(group.id);
    });
    body.querySelectorAll('input[data-page]:not([disabled])').forEach(cb => cb.addEventListener('change', () => {
      opts.onToggle([cb.dataset.page], cb.checked);
      rerender();
    }));
    container.appendChild(wrap);
  });
}

function makeRing(done, total, size = 40, label = '') {
  const r = size * .37, circ = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  const pct = total > 0 ? done / total : 0, offset = circ - pct * circ, sw = size * .09;
  const col = total === 0 ? '#c9bfaa' : done >= total ? '#d4a843' : done > 0 ? '#7a5c9e' : '#c9bfaa';
  const tc = total === 0 ? '#5a6e7f' : done >= total ? '#8f6d19' : done > 0 ? '#6a4f8c' : '#767676';
  const lbl = total === 0 ? '–' : `${done}/${total}`;
  const fs = lbl.length > 4 ? size * .135 : size * .165;
  const a11y = total === 0
    ? `${label ? label + ': ' : ''}not available`
    : `${label ? label + ': ' : ''}${done} of ${total} complete`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${a11y}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c9bfaa" stroke-width="${sw}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + size * .065}" text-anchor="middle"
      font-family="DM Mono,monospace" font-size="${fs.toFixed(1)}"
      fill="${tc}" font-weight="500">${lbl}</text>
  </svg>`;
}

// True question/flashcard count for one page+section, independent of
// whether the student has touched it — from the generated
// section-totals.js (window.SECTION_TOTALS). Falls back to whatever total
// is already recorded (e.g. section-totals.js isn't loaded on this page).
function trueSectionTotal(pageId, sectionKey, fallback) {
  const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pageId];
  return (t && t[sectionKey] != null) ? t[sectionKey] : fallback;
}

// A page's per-section {done,total} pairs, always using the TRUE total from
// the generated section-totals.js — regardless of whether the student has
// ever opened this topic. A brand-new student (or a topic they simply
// haven't started yet) still sees its real question counts (e.g. "0/12"),
// not a blank "–" placeholder, on both the student and teacher dashboards.
// Totals stay in sync automatically: SECTION_TOTALS is regenerated by
// tools/build_question_bank.py every time a topic's questions/cards change.
function pageSectionTotals(pageId, pd) {
  return SECTIONS.map(s => {
    const d = pd[s.key] || { done: 0, total: 0 };
    return { key: s.key, done: d.done || 0, total: trueSectionTotal(pageId, s.key, d.total || 0) };
  });
}

// Roll a progress object up to headline numbers.
function computeTotals(progress) {
  let grandDone = 0, grandTotal = 0, pagesStarted = 0;
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => {
    const pd = progress[p.id] || {};
    let started = false;
    pageSectionTotals(p.id, pd).forEach(d => {
      grandDone += d.done; grandTotal += d.total;
      if (d.done > 0) started = true;
    });
    if (started) pagesStarted++;
  }));
  return { grandDone, grandTotal, pagesStarted, pct: grandTotal ? Math.round(grandDone / grandTotal * 100) : 0 };
}

function _injectGridStyles() {
  if (document.getElementById('pg-grid-styles')) return;
  const style = document.createElement('style');
  style.id = 'pg-grid-styles';
  style.textContent = `
    .pg-group{margin-bottom:16px;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--card-bg);}
    .pg-group-header{display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;-webkit-user-select:none;user-select:none;border-left:4px solid var(--accent);background:var(--card-bg);width:100%;text-align:left;border:none;font-family:inherit;}
    .pg-group-header:hover{background:var(--cream);}
    .pg-group-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--ink);}
    .pg-group-sub{font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);}
    .pg-pct{font-family:'DM Mono',monospace;font-size:11px;color:var(--mid);white-space:nowrap;}
    .pg-chevron{font-size:11px;color:var(--mid);transition:transform .2s ease;}
    .pg-group.collapsed .pg-chevron{transform:rotate(-90deg);}
    .pg-table-wrap{overflow-x:auto;border-top:1px solid var(--border);}
    .pg-group.collapsed .pg-table-wrap{display:none;}
    table.pg-table{width:100%;border-collapse:collapse;min-width:660px;margin:0;}
    table.pg-table th{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:var(--mid);padding:8px 6px;text-align:center;background:var(--cream);}
    table.pg-table th.pg-topic{text-align:left;padding-left:16px;min-width:160px;}
    table.pg-table td{padding:7px 6px;text-align:center;border-top:1px solid var(--border);vertical-align:middle;}
    table.pg-table td.pg-topic{text-align:left;padding-left:16px;font-size:12px;font-weight:600;color:var(--ink);}
    table.pg-table td.pg-topic.pg-indent{padding-left:30px;font-weight:500;color:#555;}
    .pg-ring{display:inline-flex;align-items:center;justify-content:center;}
  `;
  document.head.appendChild(style);
}

function _pgRow(page, pd, isChild) {
  const tr = document.createElement('tr');
  let rowDone = 0, rowTotal = 0;
  const cells = pageSectionTotals(page.id, pd).map(d => {
    rowDone += d.done; rowTotal += d.total;
    return `<td><span class="pg-ring">${makeRing(d.done, d.total, isChild ? 30 : 34, SECTIONS.find(s => s.key === d.key).label)}</span></td>`;
  }).join('');
  tr.innerHTML =
    `<td class="pg-topic${isChild ? ' pg-indent' : ''}">${isChild ? '↳ ' : ''}${page.name}</td>` +
    cells +
    `<td><span class="pg-ring">${makeRing(rowDone, rowTotal, isChild ? 34 : 38, 'Total')}</span></td>`;
  return tr;
}

// Renders the full collapsible topic × section ring grid into `container`.
function renderProgressGrid(container, progress) {
  _injectGridStyles();
  container.innerHTML = '';
  PAGE_GROUPS.forEach(group => {
    let gDone = 0, gTotal = 0;
    flatPages(group).forEach(p => {
      const pd = progress[p.id] || {};
      pageSectionTotals(p.id, pd).forEach(d => { gDone += d.done; gTotal += d.total; });
    });
    const gPct = gTotal ? Math.round(gDone / gTotal * 100) : 0;

    const groupEl = document.createElement('section');
    groupEl.className = 'pg-group collapsed';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'pg-group-header';
    header.style.borderLeftColor = group.colour;
    header.innerHTML =
      `<div style="flex:1"><div class="pg-group-title">${group.title}</div><div class="pg-group-sub">${group.sub}</div></div>
       <span class="pg-ring">${makeRing(gDone, gTotal, 34, group.title + ' overall')}</span>
       <span class="pg-pct">${gTotal ? gPct + '%' : '–'}</span>
       <span class="pg-chevron" aria-hidden="true">▾</span>`;

    const wrap = document.createElement('div');
    wrap.className = 'pg-table-wrap';
    const table = document.createElement('table');
    table.className = 'pg-table';
    table.innerHTML =
      `<thead><tr><th class="pg-topic">Topic</th>` +
      SECTIONS.map(s => `<th><span aria-hidden="true">${s.icon}</span><br><span style="font-size:8px">${s.label}</span></th>`).join('') +
      `<th>Total</th></tr></thead>`;
    const tbody = document.createElement('tbody');
    group.pages.forEach(page => {
      tbody.appendChild(_pgRow(page, progress[page.id] || {}, false));
      if (page.children) page.children.forEach(ch => tbody.appendChild(_pgRow(ch, progress[ch.id] || {}, true)));
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    groupEl.appendChild(header);
    groupEl.appendChild(wrap);
    container.appendChild(groupEl);

    header.addEventListener('click', () => groupEl.classList.toggle('collapsed'));
  });
}
