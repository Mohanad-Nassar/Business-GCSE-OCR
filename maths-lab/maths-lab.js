// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — framework (ADDMATHS-CONTENT-PLAN.md §7, wave ADM-C)
//
// Loaded on every Additional Mathematics (OCR FSMQ 6993) topic page (include
// added by the scaffold template, mirroring cs-lab.js on CS pages). Injects a
// 10th tab "🧪 Practice Lab" when this page has tools mapped in PAGE_TOOLS
// below, renders a launcher of tool cards, and lazy-loads each tool's module
// from /maths-lab/tools/ only when the student opens it.
//
// Deliberate divergences from cs-lab.js (see ADDMATHS-ACTIVITIES-HANDOFF.md):
//   • Progress is LOCAL ONLY in v1 — geo_mathslab::<pageId>::<tool>::<k> in
//     localStorage. No cloud sync, no cs_lab_saves twin, NOT in SECTION_TOTALS
//     / daily-revise / tasks / gamification. Containment keeps ADM-C safe to
//     run parallel with anything and needs no new SQL. (Cloud promotion is a
//     later, owner-triggered phase.)
//   • No Pyodide / CodeMirror / CSP change — 6993 has no programming. Tools are
//     pure DOM + KaTeX. The UI kit exposes ui.renderMath(el) so any tool that
//     inserts \(...\) / \[...\] LaTeX renders it (guarded no-op if math-render
//     isn't loaded).
//
// ── Contract for tool modules (what builder agents code against) ──
//
//   MathsLab.registerTool('tool-id', {
//     title: 'Data Drills',             // informational (launcher uses CARD_META)
//     icon:  '🔢',
//     mount(el, ctx) { ... },           // build your UI inside `el`
//     unmount() { ... }                 // OPTIONAL: release live resources
//                                       // (timers, listeners) — called when the
//                                       // student leaves via Back or opens
//                                       // another tool
//   });
//
//   ctx = {
//     pageId,                  // e.g. '1-3-quadratics-and-completing-the-square'
//     config,                  // this page's config object from PAGE_TOOLS ({} if none)
//     store: {                 // persistent, namespaced (pageId + tool), LOCAL only
//       get(k, def), set(k, v), remove(k),
//     },
//     ui: { el, btn, feedback, renderMath },
//     complete(detail),        // call when the student finishes a round/task —
//                              // marks the card ✓ and counts completions
//   }
//
//   Rules for tools (also in ADDMATHS-CONTENT-PLAN.md §7.1 / §10.3):
//   - One module file per agent-owned tool; a file MAY register several tool ids.
//   - Style with CSS variables only (--ink/--paper/--cream/--card-bg/--border/
//     --mid/--accent/--success) so all 7 themes (incl. both darks) work. Put
//     tool-specific CSS in a <style> injected by the module, prefixed
//     .mathslab-<tool>.
//   - Per-page task CONTENT lives inside the tool module keyed by pageId, so
//     pages never need editing.
//   - Store RAW LaTeX and call ctx.ui.renderMath(el) AFTER inserting it.
//     DOUBLE every backslash in JS source; delimiters \(...\) / \[...\] only.
//   - Everything lazy; visible loading state and graceful failure message.
//   - 44px minimum touch targets; keyboard operable; theme-aware.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Which tools appear on which pages ─────────────────────────
  // pageId → array of { tool, config? }. Per-page content lives inside each
  // module keyed by pageId; this map only decides which cards a page shows.
  const PAGE_TOOLS = {
    '1-1-notation-functions-and-indices': [{ tool: 'maths-drills', config: { modes: ['index-laws', 'expand-double', 'factorise-quad'] } }],
    '1-2-surds-and-algebraic-fractions': [{ tool: 'maths-drills', config: { modes: ['surds-simplify'] } }],
    '1-3-quadratics-and-completing-the-square': [
      { tool: 'maths-drills', config: { modes: ['complete-square', 'quad-formula', 'factorise-quad'] } },
      { tool: 'choose-the-method' },
      { tool: 'step-solver' },
      { tool: 'design-an-example' },
    ],
    '1-4-linear-and-quadratic-inequalities': [{ tool: 'design-an-example' }],
    '2-1-polynomial-arithmetic-and-division': [{ tool: 'step-visualiser' }],
    '2-2-the-factor-theorem-and-cubics': [{ tool: 'step-solver' }],
    '2-4-sequences-and-recurrence-relationships': [{ tool: 'design-an-example' }],
    '3-3-sketching-and-plotting-graphs': [{ tool: 'graph-explorer', config: { modes: ['quadratic', 'sine'] } }],
    '4-1-inequalities-in-two-variables': [{ tool: 'lp-builder' }],
    '4-3-solving-lp-problems-graphically': [{ tool: 'lp-builder' }],
    '5-1-trig-ratios-for-any-angle': [{ tool: 'design-an-example' }],
    '5-4-trigonometric-equations': [{ tool: 'step-solver' }],
    '7-1-exponential-functions': [{ tool: 'graph-explorer', config: { modes: ['exponential'] } }],
    '7-4-reduction-to-linear-form': [{ tool: 'step-solver' }],
    '8-1-the-gradient-function': [{ tool: 'graph-explorer', config: { modes: ['chord-tangent'] } }],
    '9-2-definite-integrals-and-areas': [{ tool: 'graph-explorer', config: { modes: ['integral-area'] } }],
    '9-3-numerical-areas-and-the-trapezium-rule': [{ tool: 'step-visualiser' }, { tool: 'choose-the-method' }],
    '10-1-kinematics': [{ tool: 'choose-the-method' }],
    '10-2-solving-equations-numerically': [{ tool: 'step-visualiser' }],
    '11-1-command-words-and-detailed-reasoning': [{ tool: 'examiner-trainer' }, { tool: 'command-words' }],
  };

  // module file per tool id (several ids may share one file)
  const TOOL_FILES = {
    'maths-drills': 'tools/maths-drills.js',
    'graph-explorer': 'tools/graph-explorer.js',
    'lp-builder': 'tools/lp-builder.js',
    'examiner-trainer': 'tools/examiner-trainer.js',
    'step-solver': 'tools/step-solver.js',
    'design-an-example': 'tools/design-an-example.js',
    'step-visualiser': 'tools/step-visualiser.js',
    'command-words': 'tools/command-words.js',
    'choose-the-method': 'tools/choose-the-method.js',
  };

  // Launcher card copy (shown before the module is loaded).
  const CARD_META = {
    'maths-drills': { icon: '🔢', title: 'Maths Drills', blurb: 'Infinite practice: expand, factorise, complete the square, surds and index laws — with worked solutions.' },
    'graph-explorer': { icon: '📈', title: 'Graph Explorer', blurb: 'Drag the sliders and watch the graph move — see how each coefficient changes the curve.' },
    'lp-builder': { icon: '📐', title: 'LP Builder', blurb: 'Shade the feasible region, then read off the vertex that optimises the objective.' },
    'examiner-trainer': { icon: '🖊️', title: 'Examiner Trainer', blurb: 'Mark a student’s answer against the real scheme — learn exactly where marks are lost.' },
    'step-solver': { icon: '🧩', title: 'Step Solver', blurb: 'Put the shuffled steps of a worked solution back into the right order.' },
    'design-an-example': { icon: '🎯', title: 'Design an Example', blurb: 'Invent your own example that fits the rule — the checker tells you if it works.' },
    'step-visualiser': { icon: '🪜', title: 'Step Visualiser', blurb: 'Step through a method one line at a time and predict the next value.' },
    'command-words': { icon: '🗝️', title: 'Command Words', blurb: 'State, show that, hence, prove — know exactly what each instruction demands.' },
    'choose-the-method': { icon: '🧭', title: 'Choose the Method', blurb: 'Pick the best method for each problem — and see why the others are slower or wrong.' },
  };

  // `pageMeta` is declared `const` in each topic page's inline <script>, so it's
  // a global-scope identifier shared with this (classic, non-module) script —
  // but NOT a `window` property (let/const never attach to the global object).
  // Match script.js's own lookup rather than window.pageMeta (always undefined).
  const _pm = typeof pageMeta !== 'undefined' ? pageMeta : null;
  const pageId = (_pm && _pm.id) || null;
  const subject = (_pm && _pm.subject) || null;
  if (!pageId || subject !== 'additional-maths') return;
  const toolsHere = PAGE_TOOLS[pageId];
  if (!toolsHere || !toolsHere.length) return;

  // ── Persistent store: localStorage only (v1 containment decision) ──
  const LS_PREFIX = 'geo_mathslab::' + pageId + '::';
  function _lsKey(tool, k) { return LS_PREFIX + tool + '::' + k; }

  function storeFor(tool) {
    return {
      get(k, def) {
        try {
          const raw = localStorage.getItem(_lsKey(tool, k));
          if (raw == null) return def;
          const env = JSON.parse(raw);
          return env && typeof env === 'object' && 't' in env ? env.v : def;
        } catch (e) { return def; }
      },
      set(k, v) {
        const env = { v: v, t: Date.now() };
        try { localStorage.setItem(_lsKey(tool, k), JSON.stringify(env)); } catch (e) {}
      },
      remove(k) {
        try { localStorage.removeItem(_lsKey(tool, k)); } catch (e) {}
      },
    };
  }

  // ── Tiny UI kit ────────────────────────────────────────────────
  const ui = {
    el(html) {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },
    btn(label, cls) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mathslab-btn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      return b;
    },
    feedback(el, ok, msg) {
      el.className = 'mathslab-feedback ' + (ok ? 'ok' : 'no');
      el.textContent = msg;
    },
    // Render any \(...\) / \[...\] LaTeX inside `el` after insertion. Guarded so
    // a tool never hard-fails if math-render.js / KaTeX isn't present.
    renderMath(el) {
      try { if (typeof renderMathIn === 'function') renderMathIn(el); } catch (e) {}
    },
  };

  // ── Registry + lazy loader ─────────────────────────────────────
  const _defs = {};       // tool id -> registered def
  const _loading = {};    // file -> Promise
  window.MathsLab = {
    registerTool(id, def) { _defs[id] = def; },
    ui: ui,
  };

  function loadModule(file) {
    if (_loading[file]) return _loading[file];
    _loading[file] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/maths-lab/' + file;
      s.onload = () => resolve();
      s.onerror = () => { delete _loading[file]; reject(new Error(file + ' failed to load')); };
      document.head.appendChild(s);
    });
    return _loading[file];
  }

  // ── Tab + launcher UI ──────────────────────────────────────────
  let _panel, _launcher, _mountArea;

  function _cardId(tool) { return 'mathslab-card-' + tool; }
  function _isDone(tool) { return !!storeFor(tool).get('_done', null); }

  function _refreshAllCards() {
    toolsHere.forEach(t => {
      const card = document.getElementById(_cardId(t.tool));
      if (card) card.classList.toggle('done', _isDone(t.tool));
    });
  }

  let _mountedDef = null; // currently open tool's def, for unmount()

  function _unmountCurrent() {
    if (_mountedDef && typeof _mountedDef.unmount === 'function') {
      try { _mountedDef.unmount(); } catch (e) { console.error('[maths-lab] unmount', e); }
    }
    _mountedDef = null;
  }

  function openTool(entry) {
    const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
    _unmountCurrent();
    _launcher.style.display = 'none';
    _mountArea.innerHTML = '';
    _mountArea.style.display = '';
    const head = ui.el('<div class="mathslab-toolhead"><button type="button" class="mathslab-back">← All activities</button><h3>' + meta.icon + ' ' + meta.title + '</h3></div>');
    head.querySelector('.mathslab-back').addEventListener('click', () => {
      _unmountCurrent();
      _mountArea.style.display = 'none';
      _mountArea.innerHTML = '';
      _launcher.style.display = '';
      _refreshAllCards();
    });
    _mountArea.appendChild(head);
    const body = ui.el('<div class="mathslab-toolbody"><p class="mathslab-loading">Loading activity…</p></div>');
    _mountArea.appendChild(body);

    loadModule(TOOL_FILES[entry.tool]).then(() => {
      const def = _defs[entry.tool];
      if (!def) throw new Error('module loaded but tool "' + entry.tool + '" never registered');
      _mountedDef = def;
      body.innerHTML = '';
      const store = storeFor(entry.tool);
      def.mount(body, {
        pageId: pageId,
        config: entry.config || {},
        store: store,
        ui: ui,
        complete(detail) {
          const done = store.get('_done', { count: 0 });
          store.set('_done', { count: (done.count || 0) + 1, last: Date.now(), detail: detail || null });
          _refreshAllCards();
        },
      });
      // Safety net: render any LaTeX the tool inserted during mount but did not
      // renderMath() itself (e.g. a static intro/prompt outside its per-question
      // container). Tools still call ctx.ui.renderMath for content they insert
      // LATER (Next, reveal, etc.); re-rendering already-rendered KaTeX is a
      // no-op, so this never double-renders.
      ui.renderMath(body);
    }).catch(err => {
      console.error('[maths-lab]', err);
      body.innerHTML = '<p class="mathslab-error">⚠️ This activity could not load. Check your connection and try again — if you are on a school network, ask your teacher to report it.</p>';
    });
  }

  function buildTab() {
    const tabBar = document.getElementById('tabBar');
    const main = document.querySelector('main');
    if (!tabBar || !main || typeof window.switchTab !== 'function') return;

    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.setAttribute('onclick', "switchTab('mathslab', this)");
    btn.textContent = '🧪 Practice Lab';
    tabBar.appendChild(btn);

    _panel = ui.el('<div class="tab-panel" id="tab-mathslab"><h2 class="section-title">Practice Lab</h2><p class="section-sub">Hands-on practice for this topic. Your progress saves on this device.</p></div>');
    _launcher = ui.el('<div class="mathslab-launcher"></div>');
    _mountArea = ui.el('<div class="mathslab-mount" style="display:none"></div>');
    _panel.appendChild(_launcher);
    _panel.appendChild(_mountArea);
    main.appendChild(_panel);

    toolsHere.forEach(entry => {
      const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
      const card = ui.el(
        '<button type="button" class="mathslab-card" id="' + _cardId(entry.tool) + '">' +
        '<span class="mathslab-card-icon">' + meta.icon + '</span>' +
        '<span class="mathslab-card-title">' + meta.title + '</span>' +
        '<span class="mathslab-card-blurb">' + meta.blurb + '</span>' +
        '<span class="mathslab-card-done">✓ completed</span>' +
        '</button>');
      card.addEventListener('click', () => openTool(entry));
      _launcher.appendChild(card);
    });
    _refreshAllCards();
  }

  function init() {
    try {
      if (!document.querySelector('link[href="/maths-lab/maths-lab.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = '/maths-lab/maths-lab.css';
        document.head.appendChild(l);
      }
      buildTab();
    } catch (e) { console.error('[maths-lab] init failed', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
