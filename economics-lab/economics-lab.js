// ══════════════════════════════════════════════════════════════
// ECONOMICS PRACTICE LAB — framework (ECONOMICS-INTERACTIVES-PLAN.md)
//
// Loaded on OCR GCSE Economics (J205) topic pages (include added to the page
// template, mirroring maths-lab.js on Add-Maths pages and cs-lab.js on CS
// pages). Injects a 10th tab "🧪 Practice Lab" when this page has tools mapped
// in PAGE_TOOLS below, renders a launcher of tool cards, and lazy-loads each
// tool's module from /economics-lab/tools/ only when the student opens it.
//
// This is a near-verbatim clone of maths-lab.js — same containment decisions,
// same tool contract — so anyone who knows one knows both. Deliberate choices:
//   • Progress is LOCAL ONLY in v1 — geo_ecolab::<pageId>::<tool>::<k> in
//     localStorage. No cloud sync, no new table, NOT in SECTION_TOTALS /
//     daily-revise / tasks / gamification. Containment keeps this safe to ship
//     independently and needs no SQL and no script.js change.
//   • Pure DOM + <canvas>. No Pyodide / CodeMirror / KaTeX / CSP change. The UI
//     kit exposes ui.renderMath(el) as a guarded no-op so a tool that ever
//     wants LaTeX still works if math-render.js is later added.
//
// ── Contract for tool modules ──
//   EconomicsLab.registerTool('tool-id', {
//     title, icon, mount(el, ctx), unmount()   // unmount OPTIONAL
//   });
//   ctx = {
//     pageId, config,               // config = this page's PAGE_TOOLS entry ({} if none)
//     store: { get(k,def), set(k,v), remove(k) },   // LOCAL, namespaced
//     ui:   { el, btn, feedback, renderMath },
//     complete(detail),             // marks the card ✓ and counts completions
//   }
//   Rules: style with CSS variables only (--ink/--paper/--cream/--card-bg/
//   --border/--mid/--accent/--success) so all 7 themes (incl. both darks) work;
//   prefix tool CSS .ecolab-<tool>; per-page content lives IN the module keyed
//   by pageId so topic HTMLs are never edited; 44px min touch targets; keyboard
//   operable; everything lazy with a visible loading state + graceful failure.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Which tools appear on which pages ─────────────────────────
  // pageId → [{ tool, config? }]. Per-page content lives inside each module
  // keyed by pageId; this map only decides which cards a page shows.
  const PAGE_TOOLS = {
    // Diagram Lab — the "draw" skill (2.2–2.4) + externality diagrams (3.8).
    // config.focus restricts the challenge scenarios to that topic's curve/theme.
    '2-2-demand': [{ tool: 'supply-demand', config: { focus: 'demand' } }],
    '2-3-supply': [{ tool: 'supply-demand', config: { focus: 'supply' } }],
    '2-4-price': [{ tool: 'supply-demand', config: { focus: 'all' } }],
    '3-8-limitations-of-markets': [{ tool: 'supply-demand', config: { focus: 'externalities' } }],
    // Calculation Lab — the "calculate" bullets. config.modes = that topic's sums.
    '2-6-production': [{ tool: 'calc-drills', config: { modes: ['cost', 'revenue', 'profit'] } }],
    '2-7-the-labour-market': [{ tool: 'calc-drills', config: { modes: ['pay'] } }],
    '3-2-low-unemployment': [{ tool: 'calc-drills', config: { modes: ['unemployment'] } }],
    '3-4-price-stability': [{ tool: 'calc-drills', config: { modes: ['inflation'] } }],
  };

  const TOOL_FILES = {
    'supply-demand': 'tools/supply-demand.js',
    'calc-drills': 'tools/calc-drills.js',
  };

  const CARD_META = {
    'supply-demand': { icon: '📉', title: 'Diagram Lab', blurb: 'Shift the supply and demand curves and watch the equilibrium price and quantity move — then take the challenges.' },
    'calc-drills': { icon: '🔢', title: 'Calculation Lab', blurb: 'Endless practice on cost, revenue and profit — fresh numbers every time, with the full worked solution.' },
  };

  // `pageMeta` is `const` in each topic page's inline <script> — a global-scope
  // identifier shared with this classic script, but NOT a window property
  // (const never attaches to the global object), so read it by identifier the
  // way maths-lab.js / script.js do, guarded against the TDZ.
  let _pm = null;
  try { _pm = (typeof pageMeta !== 'undefined') ? pageMeta : null; } catch (e) { _pm = null; }
  const pageId = (_pm && _pm.id) || null;
  const subject = (_pm && _pm.subject) || null;
  if (!pageId || subject !== 'economics') return;
  const toolsHere = PAGE_TOOLS[pageId];
  if (!toolsHere || !toolsHere.length) return;

  // ── Persistent store: localStorage only (v1 containment decision) ──
  const LS_PREFIX = 'geo_ecolab::' + pageId + '::';
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
        try { localStorage.setItem(_lsKey(tool, k), JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
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
      b.className = 'ecolab-btn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      return b;
    },
    feedback(el, ok, msg) {
      el.className = 'ecolab-feedback ' + (ok ? 'ok' : 'no');
      el.textContent = msg;
    },
    renderMath(el) {
      try { if (typeof renderMathIn === 'function') renderMathIn(el); } catch (e) {}
    },
  };

  // ── Registry + lazy loader ─────────────────────────────────────
  const _defs = {};
  const _loading = {};
  window.EconomicsLab = {
    registerTool(id, def) { _defs[id] = def; },
    ui: ui,
  };

  function loadModule(file) {
    if (_loading[file]) return _loading[file];
    _loading[file] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/economics-lab/' + file;
      s.onload = () => resolve();
      s.onerror = () => { delete _loading[file]; reject(new Error(file + ' failed to load')); };
      document.head.appendChild(s);
    });
    return _loading[file];
  }

  // ── Tab + launcher UI ──────────────────────────────────────────
  let _panel, _launcher, _mountArea;

  function _cardId(tool) { return 'ecolab-card-' + tool; }
  function _isDone(tool) { return !!storeFor(tool).get('_done', null); }

  function _refreshAllCards() {
    toolsHere.forEach(t => {
      const card = document.getElementById(_cardId(t.tool));
      if (card) card.classList.toggle('done', _isDone(t.tool));
    });
  }

  let _mountedDef = null;

  function _unmountCurrent() {
    if (_mountedDef && typeof _mountedDef.unmount === 'function') {
      try { _mountedDef.unmount(); } catch (e) { console.error('[economics-lab] unmount', e); }
    }
    _mountedDef = null;
  }

  function openTool(entry) {
    const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
    _unmountCurrent();
    _launcher.style.display = 'none';
    _mountArea.innerHTML = '';
    _mountArea.style.display = '';
    const head = ui.el('<div class="ecolab-toolhead"><button type="button" class="ecolab-back">← All activities</button><h3>' + meta.icon + ' ' + meta.title + '</h3></div>');
    head.querySelector('.ecolab-back').addEventListener('click', () => {
      _unmountCurrent();
      _mountArea.style.display = 'none';
      _mountArea.innerHTML = '';
      _launcher.style.display = '';
      _refreshAllCards();
    });
    _mountArea.appendChild(head);
    const body = ui.el('<div class="ecolab-toolbody"><p class="ecolab-loading">Loading activity…</p></div>');
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
      ui.renderMath(body);
    }).catch(err => {
      console.error('[economics-lab]', err);
      body.innerHTML = '<p class="ecolab-error">⚠️ This activity could not load. Check your connection and try again — if you are on a school network, ask your teacher to report it.</p>';
    });
  }

  function buildTab() {
    const tabBar = document.getElementById('tabBar');
    const main = document.querySelector('main');
    if (!tabBar || !main || typeof window.switchTab !== 'function') return;

    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.setAttribute('onclick', "switchTab('ecolab', this)");
    btn.textContent = '🧪 Practice Lab';
    tabBar.appendChild(btn);

    _panel = ui.el('<div class="tab-panel" id="tab-ecolab"><h2 class="section-title">Practice Lab</h2><p class="section-sub">Hands-on practice for this topic. Your progress saves on this device.</p></div>');
    _launcher = ui.el('<div class="ecolab-launcher"></div>');
    _mountArea = ui.el('<div class="ecolab-mount" style="display:none"></div>');
    _panel.appendChild(_launcher);
    _panel.appendChild(_mountArea);
    main.appendChild(_panel);

    toolsHere.forEach(entry => {
      const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
      const card = ui.el(
        '<button type="button" class="ecolab-card" id="' + _cardId(entry.tool) + '">' +
        '<span class="ecolab-card-icon">' + meta.icon + '</span>' +
        '<span class="ecolab-card-title">' + meta.title + '</span>' +
        '<span class="ecolab-card-blurb">' + meta.blurb + '</span>' +
        '<span class="ecolab-card-done">✓ completed</span>' +
        '</button>');
      card.addEventListener('click', () => openTool(entry));
      _launcher.appendChild(card);
    });
    _refreshAllCards();
  }

  function init() {
    try {
      if (!document.querySelector('link[href="/economics-lab/economics-lab.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = '/economics-lab/economics-lab.css';
        document.head.appendChild(l);
      }
      buildTab();
    } catch (e) { console.error('[economics-lab] init failed', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
