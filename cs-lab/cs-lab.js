// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — framework (CS-CONTENT-PLAN.md §7, wave CS-C)
//
// Loaded on every Computer Science topic page (include added by the
// scaffold template). Injects a 10th tab "🧪 Practice Lab" when this
// page has tools mapped in PAGE_TOOLS below, renders a launcher of
// tool cards, and lazy-loads each tool's module from /cs-lab/tools/
// only when the student opens it.
//
// ── Contract for tool modules (what builder agents code against) ──
//
//   CsLab.registerTool('tool-id', {
//     title: 'Trace tables',            // informational (launcher uses CARD_META)
//     icon:  '📋',
//     mount(el, ctx) { ... },           // build your UI inside `el`
//     unmount() { ... }                 // OPTIONAL: release live resources
//                                       // (workers, DB handles, timers) —
//                                       // called when the student leaves the
//                                       // tool via Back or opens another tool
//   });
//
//   ctx = {
//     pageId,                  // e.g. '2-2-1-programming-fundamentals'
//     config,                  // this page's config object from PAGE_TOOLS ({} if none)
//     store: {                 // persistent, namespaced (pageId + tool)
//       get(k, def),           //   sync read (local mirror)
//       set(k, v),             //   sync write + debounced cloud sync
//       remove(k),
//     },
//     ui: { el, btn, feedback },
//     complete(detail),        // call when the student finishes a round/task —
//                              // marks the card ✓ and counts completions
//   }
//
//   Rules for tools (also in CS-CONTENT-PLAN.md §7.1):
//   - One module file per agent-owned tool; a file MAY register several
//     tool ids (micro-sims, media-lab do).
//   - Style with CSS variables only (--ink/--paper/--cream/--card-bg/
//     --border/--mid/--accent/--success) so all 7 themes work. Put
//     tool-specific CSS in a <style> element injected by the module,
//     prefixed with your tool's class (.cslab-<tool>).
//   - Per-page task CONTENT lives inside the tool module keyed by
//     pageId (small default sets), so pages never need editing.
//   - Everything lazy: heavy runtimes (Pyodide, sql.js) load only after
//     an explicit user action inside the tool, with a visible loading
//     state and a graceful failure message.
//   - Never use the classes ep-answer-area / answer-box on editors
//     (the exam paste-guard blocks paste there; labs must allow it).
//   - No network calls except jsDelivr runtimes + the ctx.store sync.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Which tools appear on which pages ─────────────────────────
  const PAGE_TOOLS = {
    '1-1-1-architecture-of-the-cpu': [{ tool: 'fde-sim' }, { tool: 'examiner-trainer' }],
    '1-1-2-cpu-performance': [{ tool: 'examiner-trainer' }, { tool: 'command-words' }],
    '1-2-1-primary-storage-memory': [{ tool: 'examiner-trainer' }],
    '1-2-2-secondary-storage': [{ tool: 'storage-chooser' }],
    '1-2-3-units': [{ tool: 'drills', config: { modes: ['units', 'filesize'] } }],
    '1-2-4-data-storage-numbers': [{ tool: 'drills', config: { modes: ['bin-den', 'den-bin', 'bin-hex', 'hex-den', 'addition', 'shifts'] } }],
    '1-2-5-data-storage-characters': [{ tool: 'drills', config: { modes: ['ascii'] } }],
    '1-2-6-data-storage-images': [{ tool: 'media-bitmap' }, { tool: 'drills', config: { modes: ['imagesize'] } }],
    '1-2-7-data-storage-sound': [{ tool: 'media-sound' }, { tool: 'drills', config: { modes: ['soundsize'] } }],
    '1-2-8-compression': [{ tool: 'media-compression' }],
    '1-3-1-networks-and-topologies': [{ tool: 'net-builder' }],
    '1-4-1-threats-to-computer-systems-and-networks': [{ tool: 'threat-defence' }, { tool: 'examiner-trainer' }],
    '1-6-1-ethical-legal-cultural-and-environmental-impact': [{ tool: 'command-words' }],
    '1-4-2-identifying-and-preventing-vulnerabilities': [{ tool: 'threat-defence', config: { mode: 'defence-first' } }],
    '2-1-2-designing-creating-and-refining-algorithms': [{ tool: 'py-runner' }, { tool: 'trace-table' }, { tool: 'parsons' }, { tool: 'bug-hunt' }, { tool: 'flow-label' }],
    '2-1-3-searching-and-sorting-algorithms': [{ tool: 'sort-visualiser' }, { tool: 'parsons', config: { set: 'sorting' } }],
    '2-2-1-programming-fundamentals': [{ tool: 'py-runner' }, { tool: 'code-predict' }, { tool: 'trace-table' }, { tool: 'parsons' }],
    '2-2-2-data-types': [{ tool: 'py-runner' }, { tool: 'code-predict', config: { set: 'data-types' } }],
    '2-2-3-additional-programming-techniques': [{ tool: 'py-runner' }, { tool: 'sql-lab' }, { tool: 'code-predict', config: { set: 'techniques' } }, { tool: 'bug-hunt', config: { set: 'techniques' } }],
    '2-3-1-defensive-design': [{ tool: 'py-runner' }, { tool: 'bug-hunt', config: { set: 'defensive' } }],
    '2-3-2-testing': [{ tool: 'test-data' }, { tool: 'trace-table', config: { set: 'testing' } }, { tool: 'bug-hunt', config: { set: 'testing' } }],
    '2-4-1-boolean-logic': [{ tool: 'logic-lab' }],
    '2-5-2-the-integrated-development-environment-ide': [{ tool: 'py-runner', config: { set: 'ide' } }],
  };

  // module file per tool id (several ids may share one file)
  const TOOL_FILES = {
    'py-runner': 'tools/py-runner.js',
    'sql-lab': 'tools/sql-lab.js',
    'trace-table': 'tools/trace-table.js',
    'logic-lab': 'tools/logic-lab.js',
    'drills': 'tools/drills.js',
    'parsons': 'tools/parsons.js',
    'code-predict': 'tools/code-predict.js',
    'bug-hunt': 'tools/bug-hunt.js',
    'sort-visualiser': 'tools/sort-visualiser.js',
    'net-builder': 'tools/net-builder.js',
    'fde-sim': 'tools/micro-sims.js',
    'storage-chooser': 'tools/micro-sims.js',
    'threat-defence': 'tools/micro-sims.js',
    'media-bitmap': 'tools/media-lab.js',
    'media-sound': 'tools/media-lab.js',
    'media-compression': 'tools/media-lab.js',
    'test-data': 'tools/test-data.js',
    'flow-label': 'tools/flow-label.js',
    'examiner-trainer': 'tools/examiner-trainer.js',
    'command-words': 'tools/examiner-trainer.js',
  };

  // Launcher card copy (shown before the module is loaded).
  const CARD_META = {
    'py-runner': { icon: '🐍', title: 'Python Lab', blurb: 'Write, run and save real Python — with files, inputs and tasks.' },
    'sql-lab': { icon: '🗃️', title: 'SQL Lab', blurb: 'Query a real database with SELECT, FROM and WHERE.' },
    'trace-table': { icon: '📋', title: 'Trace Tables', blurb: 'Step through code line by line and fill in the values.' },
    'logic-lab': { icon: '🔌', title: 'Logic Gate Lab', blurb: 'Build circuits and complete truth tables for AND, OR and NOT.' },
    'drills': { icon: '🔢', title: 'Data Drills', blurb: 'Infinite practice: conversions, binary maths and file sizes.' },
    'parsons': { icon: '🧩', title: 'Algorithm Builder', blurb: 'Drag shuffled lines of code into working order.' },
    'code-predict': { icon: '🔮', title: 'Predict the Output', blurb: 'Read the code, predict exactly what it prints.' },
    'bug-hunt': { icon: '🐛', title: 'Bug Hunt', blurb: 'Find and fix the syntax and logic errors.' },
    'sort-visualiser': { icon: '🪜', title: 'Sort & Search Visualiser', blurb: 'Watch bubble, merge and insertion sorts — then predict the next step.' },
    'net-builder': { icon: '🕸️', title: 'Network Builder', blurb: 'Wire up star and mesh topologies and see what happens when links fail.' },
    'fde-sim': { icon: '⚙️', title: 'Fetch–Execute Simulator', blurb: 'Step the CPU through the cycle and watch the registers change.' },
    'storage-chooser': { icon: '💾', title: 'Storage Chooser', blurb: 'Pick the right storage device for the scenario — and justify it.' },
    'threat-defence': { icon: '🛡️', title: 'Threat vs Defence', blurb: 'Match attacks to the protections that stop them. Beat the clock.' },
    'media-bitmap': { icon: '🖼️', title: 'Bitmap Lab', blurb: 'Paint pixels and watch the binary (and file size) change live.' },
    'media-sound': { icon: '🔊', title: 'Sampling Lab', blurb: 'Play with sample rate and bit depth; hear and see the trade-off.' },
    'media-compression': { icon: '🗜️', title: 'Compression Lab', blurb: 'Lossy vs lossless — squeeze a file and see what survives.' },
    'test-data': { icon: '🧪', title: 'Test Data Sorter', blurb: 'Normal, boundary, invalid or erroneous? Classify against the rules.' },
    'flow-label': { icon: '🔀', title: 'Flowchart Symbols', blurb: 'Label the symbols and assemble a working flowchart.' },
    'examiner-trainer': { icon: '🖊️', title: 'Examiner Trainer', blurb: 'Mark a student’s answer against the real scheme — learn where marks are lost.' },
    'command-words': { icon: '🗝️', title: 'Command Words', blurb: 'State, describe, explain, discuss — know exactly what each demands.' },
  };

  // `pageMeta` is declared `const` in each topic page's inline <script>, so
  // it's a global-scope identifier shared with this (classic, non-module)
  // script — but NOT a `window` property, since let/const declarations never
  // attach to the global object. Match script.js's own lookup (script.js:4732)
  // rather than checking window.pageMeta, which is always undefined.
  const _pm = typeof pageMeta !== 'undefined' ? pageMeta : null;
  const pageId = (_pm && _pm.id) || null;
  const subject = (_pm && _pm.subject) || null;
  if (!pageId || subject !== 'computer-science') return;
  const toolsHere = PAGE_TOOLS[pageId];
  if (!toolsHere || !toolsHere.length) return;

  // ── Persistent store: localStorage mirror + debounced cloud sync ──
  const LS_PREFIX = 'vidya_cslab::' + pageId + '::';
  const _pushQueue = {};   // "tool::k" -> timer
  let _client = null;      // supabase client once script.js has built it
  let _cloudPulled = false;

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
        _queuePush(tool, k, env);
      },
      remove(k) {
        try { localStorage.removeItem(_lsKey(tool, k)); } catch (e) {}
        _queuePush(tool, k, null);
      },
    };
  }

  function _queuePush(tool, k, env) {
    if (!_client) return; // no session → local-only, still fully functional
    const qk = tool + '::' + k;
    clearTimeout(_pushQueue[qk]);
    _pushQueue[qk] = setTimeout(async () => {
      try {
        if (env === null) {
          await _client.from('cs_lab_saves').delete()
            .match({ page_id: pageId, tool: tool, k: k });
        } else {
          const uid = (await _client.auth.getUser()).data.user;
          if (!uid) return;
          await _client.from('cs_lab_saves').upsert({
            user_id: uid.id, page_id: pageId, tool: tool, k: k,
            v: env, updated_at: new Date().toISOString(),
          });
        }
      } catch (e) { /* offline / RLS / table missing → local copy still holds */ }
    }, 1500);
  }

  // Pull this page's cloud rows once, newer-timestamp-wins against local.
  async function _pullCloud() {
    if (_cloudPulled || !_client) return;
    _cloudPulled = true;
    try {
      const { data, error } = await _client.from('cs_lab_saves')
        .select('tool,k,v').eq('page_id', pageId);
      if (error || !Array.isArray(data)) return;
      data.forEach(row => {
        try {
          const localRaw = localStorage.getItem(_lsKey(row.tool, row.k));
          const local = localRaw ? JSON.parse(localRaw) : null;
          const cloud = row.v;
          if (!cloud || typeof cloud !== 'object' || !('t' in cloud)) return;
          if (!local || (cloud.t || 0) > (local.t || 0)) {
            localStorage.setItem(_lsKey(row.tool, row.k), JSON.stringify(cloud));
          }
        } catch (e) {}
      });
      _refreshAllCards();
    } catch (e) {}
  }

  function _watchClient(tries) {
    if (window._gcseSupabaseClient) { _client = window._gcseSupabaseClient; _pullCloud(); return; }
    if ((tries || 0) > 100) return; // ~10s; stay local-only
    setTimeout(() => _watchClient((tries || 0) + 1), 100);
  }

  // ── Real code editor (CodeMirror 5, lazy) with a plain-textarea fallback ──
  const CM_BASE = 'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/';
  const CM_ASSETS = {
    core: [CM_BASE + 'lib/codemirror.min.js'],
    python: [CM_BASE + 'mode/python/python.min.js'],
    sql: [CM_BASE + 'mode/sql/sql.min.js'],
    matchbrackets: [CM_BASE + 'addon/edit/matchbrackets.min.js'],
    activeline: [CM_BASE + 'addon/selection/active-line.min.js'],
  };
  let _cmLoadPromise = null;

  function _loadScriptSrc(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function _loadCodeMirror() {
    if (_cmLoadPromise) return _cmLoadPromise;
    _cmLoadPromise = (async () => {
      // CSS is fetched and inlined as a <style> (not a <link>) so only
      // script-src/connect-src need jsDelivr — style-src is untouched.
      if (!document.getElementById('cslab-cm-css')) {
        const css = await fetch(CM_BASE + 'lib/codemirror.min.css').then(r => {
          if (!r.ok) throw new Error('codemirror.min.css ' + r.status);
          return r.text();
        });
        const styleEl = document.createElement('style');
        styleEl.id = 'cslab-cm-css';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
      }
      await _loadScriptSrc(CM_ASSETS.core[0]); // modes/addons attach to the global CodeMirror core, so this must finish first
      await Promise.all([
        _loadScriptSrc(CM_ASSETS.python[0]),
        _loadScriptSrc(CM_ASSETS.sql[0]),
        _loadScriptSrc(CM_ASSETS.matchbrackets[0]),
        _loadScriptSrc(CM_ASSETS.activeline[0]),
      ]);
      return window.CodeMirror;
    })();
    return _cmLoadPromise;
  }

  function _mountFallbackEditor(container, opts) {
    container.innerHTML = '';
    const wrap = ui.el('<div class="cslab-editor-fallback"><div class="cslab-editor-gutter"></div></div>');
    const ta = document.createElement('textarea');
    ta.className = 'cslab-code cslab-editor-fallback-ta';
    ta.spellcheck = false;
    ta.value = opts.value || '';
    ta.readOnly = !!opts.readOnly;
    wrap.appendChild(ta);
    container.appendChild(wrap);
    const gutter = wrap.querySelector('.cslab-editor-gutter');
    function syncGutter() {
      const n = ta.value.split('\n').length;
      let html = '';
      for (let i = 1; i <= n; i++) html += i + '<br>';
      gutter.innerHTML = html;
    }
    ta.addEventListener('input', () => { syncGutter(); if (opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener('scroll', () => { gutter.scrollTop = ta.scrollTop; });
    ta.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 4;
      syncGutter();
      if (opts.onChange) opts.onChange(ta.value);
    });
    syncGutter();
    return {
      getValue: () => ta.value,
      setValue: v => { ta.value = v || ''; syncGutter(); },
      focus: () => ta.focus(),
      refresh: () => syncGutter(),
    };
  }

  async function mountCodeEditor(container, opts) {
    let CM;
    try {
      CM = await _loadCodeMirror();
      if (!CM) throw new Error('CodeMirror did not attach to window');
    } catch (e) {
      console.error('[cs-lab] CodeMirror failed to load, using fallback editor', e);
      return _mountFallbackEditor(container, opts);
    }
    container.innerHTML = '';
    const cm = CM(container, {
      value: opts.value || '',
      mode: opts.mode === 'sql' ? 'text/x-sql' : opts.mode === 'text' ? null : 'python',
      theme: 'cslab',
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      matchBrackets: true,
      styleActiveLine: true,
      viewportMargin: Infinity,
      readOnly: !!opts.readOnly,
      extraKeys: { Tab: cm => cm.replaceSelection('    ') },
    });
    if (opts.onChange) cm.on('change', () => opts.onChange(cm.getValue()));
    return {
      getValue: () => cm.getValue(),
      setValue: v => cm.setValue(v || ''),
      focus: () => cm.focus(),
      refresh: () => cm.refresh(),
      cm,
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
      b.className = 'cslab-btn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      return b;
    },
    feedback(el, ok, msg) {
      el.className = 'cslab-feedback ' + (ok ? 'ok' : 'no');
      el.textContent = msg;
    },
    // Real code editor with line numbers, syntax highlighting and bracket
    // matching (CodeMirror 5, lazy-loaded from jsDelivr — same origin
    // already allowed by CSP for the Python/SQL runtimes). Falls back to a
    // plain textarea with a synced line-number gutter if the CDN is
    // unreachable, so a tool built on this never hard-fails.
    //
    //   const editor = await ui.mountCodeEditor(containerEl, {
    //     value: 'starter code', mode: 'python' | 'sql' | 'text',
    //     onChange(value) { ... }, readOnly: false,
    //   });
    //   editor.getValue() / editor.setValue(v) / editor.focus() / editor.refresh()
    //
    // refresh() must be called after making the container visible again
    // (e.g. switching back to a hidden tab panel) — CodeMirror measures
    // itself on creation and goes blank if mounted while `display:none`.
    mountCodeEditor(container, opts) { return mountCodeEditor(container, opts || {}); },
  };

  // ── Registry + lazy loader ─────────────────────────────────────
  const _defs = {};       // tool id -> registered def
  const _loading = {};    // file -> Promise
  window.CsLab = {
    registerTool(id, def) { _defs[id] = def; },
    // exposed for tools that want cross-tool niceties later
    ui: ui,
  };

  function loadModule(file) {
    if (_loading[file]) return _loading[file];
    _loading[file] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/cs-lab/' + file;
      s.onload = () => resolve();
      s.onerror = () => { delete _loading[file]; reject(new Error(file + ' failed to load')); };
      document.head.appendChild(s);
    });
    return _loading[file];
  }

  // ── Tab + launcher UI ──────────────────────────────────────────
  let _panel, _launcher, _mountArea;

  function _cardId(tool) { return 'cslab-card-' + tool; }

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
      try { _mountedDef.unmount(); } catch (e) { console.error('[cs-lab] unmount', e); }
    }
    _mountedDef = null;
  }

  function openTool(entry) {
    const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
    _unmountCurrent();
    _launcher.style.display = 'none';
    _mountArea.innerHTML = '';
    _mountArea.style.display = '';
    const head = ui.el('<div class="cslab-toolhead"><button type="button" class="cslab-back">← All activities</button><h3>' + meta.icon + ' ' + meta.title + '</h3></div>');
    head.querySelector('.cslab-back').addEventListener('click', () => {
      _unmountCurrent();
      _mountArea.style.display = 'none';
      _mountArea.innerHTML = '';
      _launcher.style.display = '';
      _refreshAllCards();
    });
    _mountArea.appendChild(head);
    const body = ui.el('<div class="cslab-toolbody"><p class="cslab-loading">Loading activity…</p></div>');
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
    }).catch(err => {
      console.error('[cs-lab]', err);
      body.innerHTML = '<p class="cslab-error">⚠️ This activity could not load. Check your connection and try again — if you are on a school network, ask your teacher to report it.</p>';
    });
  }

  function buildTab() {
    const tabBar = document.getElementById('tabBar');
    const main = document.querySelector('main');
    if (!tabBar || !main || typeof window.switchTab !== 'function') return;

    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.setAttribute('onclick', "switchTab('cslab', this)");
    btn.textContent = '🧪 Practice Lab';
    tabBar.appendChild(btn);

    _panel = ui.el('<div class="tab-panel" id="tab-cslab"><h2 class="section-title">Practice Lab</h2><p class="section-sub">Hands-on activities for this topic. Your work saves automatically' + (window._gcseProfile ? ' and syncs to your account' : '') + '.</p></div>');
    _launcher = ui.el('<div class="cslab-launcher"></div>');
    _mountArea = ui.el('<div class="cslab-mount" style="display:none"></div>');
    _panel.appendChild(_launcher);
    _panel.appendChild(_mountArea);
    main.appendChild(_panel);

    toolsHere.forEach(entry => {
      const meta = CARD_META[entry.tool] || { icon: '🧪', title: entry.tool, blurb: '' };
      const card = ui.el(
        '<button type="button" class="cslab-card" id="' + _cardId(entry.tool) + '">' +
        '<span class="cslab-card-icon">' + meta.icon + '</span>' +
        '<span class="cslab-card-title">' + meta.title + '</span>' +
        '<span class="cslab-card-blurb">' + meta.blurb + '</span>' +
        '<span class="cslab-card-done">✓ completed</span>' +
        '</button>');
      card.addEventListener('click', () => openTool(entry));
      _launcher.appendChild(card);
    });
    _refreshAllCards();
  }

  function init() {
    try {
      if (!document.querySelector('link[href="/cs-lab/cs-lab.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = '/cs-lab/cs-lab.css';
        document.head.appendChild(l);
      }
      buildTab();
      _watchClient(0);
    } catch (e) { console.error('[cs-lab] init failed', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
