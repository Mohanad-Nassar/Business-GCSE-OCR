// ══════════════════════════════════════════════════════════════
// VOCAB LAB — controller for vocab.html (AQA GCSE Spanish 8692)
//
// Loads subjects/spanish/vocab-bank.js (window.VOCAB_BANK, 2,950 raw rows —
// see tools/parse_spanish_vocab.py), collapses it into one practice item per
// headword+pos (the raw bank has a SEPARATE row for a word's Foundation-table
// printing and its Higher-table printing — "el" appears twice — which would
// otherwise split one word's mastery progress across two cards), then runs a
// filter bar + Mastery Map + a launcher of game modes, mirroring the
// economics-lab.js / maths-lab.js "registry + lazy-load + local store" Lab
// pattern (adapted: scoped to the whole filtered word set, not one page's
// PAGE_TOOLS content, so there's no pageMeta/subject gate here).
//
// Mastery status reuses the flashcard system's own Red/Amber/Green language
// (script.js markCard) rather than inventing a new one — New/Practising/Known
// map onto it 1:1 so the mental model carries across every activity. Status
// is LOCAL ONLY (localStorage, one JSON blob), same v1 containment call as
// maths-lab/economics-lab: no SQL, no cloud sync, ships independently.
//
// Contract for mode modules (vocab-modes/*.js):
//   VocabLab.registerTool('mode-id', { title, icon, blurb, mount(el, ctx), unmount() });
//   ctx = {
//     words,                      // current FILTERED practice set (array)
//     allWords,                   // full practice set, unfiltered
//     status: { get(id), set(id,status), bump(id,correct) },  // shared store
//     ui: { el, btn, speak, playSound, xpToast, comboToast, confetti },
//     fuzzyMatch(input, acceptedText) -> { correct, perfect },
//     complete(),                 // call when a round ends, refreshes the Mastery Map
//   }
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Practice set: dedupe the raw bank's F/H duplicate rows ──────
  // Key = pos + '::' + headword (both tables print the same headword under
  // the same pos when it's genuinely one word). Foundation and Higher can
  // gloss the same word differently (Higher adds senses, e.g. "soy" gains
  // "(I) have been" for the present-perfect-in-disguise reading) — merge
  // distinct senses rather than picking one copy, so nothing taught is lost.
  function stripParens(s) { return String(s || '').replace(/\([^)]*\)/g, ' '); }
  function splitForms(s) {
    return stripParens(s).split(/[\/,;|]/).map(x => x.trim()).filter(Boolean);
  }
  function stripAccents(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function normKey(s) { return stripAccents(String(s || '')).toLowerCase().replace(/\s+/g, ' ').trim(); }

  function mergeSenses(a, b) {
    const seen = new Set(), out = [];
    [...splitForms(a), ...splitForms(b)].forEach(f => {
      const k = normKey(f);
      if (k && !seen.has(k)) { seen.add(k); out.push(f); }
    });
    return out.join(' | ');
  }

  function buildPracticeSet(bank) {
    const groups = new Map();
    bank.forEach(e => {
      const key = e.pos + '::' + e.headword;
      let g = groups.get(key);
      if (!g) {
        g = { id: e.id, pos: e.pos, headword: e.headword, english: e.english, tiers: new Set(), selection: e.selection, say: e.headword, rank: e.rank };
        groups.set(key, g);
      } else if (normKey(e.english) !== normKey(g.english)) {
        g.english = mergeSenses(g.english, e.english);
      }
      if (e.tier === 'F/H') { g.tiers.add('F'); g.tiers.add('H'); } else { g.tiers.add(e.tier); }
      if (e.selection === 'R') g.selection = 'R'; // R (required) wins if either copy says so
      // rank is the word's frequency-dictionary rank, not a per-table position —
      // the Foundation and Higher printings always agree (verified: 0 conflicts
      // across 1,185 shared headwords), so either copy's value is authoritative.
      if (g.rank == null && e.rank != null) g.rank = e.rank;
    });
    return Array.from(groups.values()).map(g => ({
      id: g.id, pos: g.pos, headword: g.headword, english: g.english, say: g.say,
      selection: g.selection, rank: g.rank,
      tierLabel: (g.tiers.has('F') && g.tiers.has('H')) ? 'Both' : g.tiers.has('H') ? 'Higher' : 'Foundation',
    }));
  }

  function posBucket(pos) {
    // AQA only lists a multi-word phrase (mwp) when it CAN'T be decoded from
    // its parts (spec §3.3: "bajo control" is excluded as transparent, "no
    // pasa nada" is kept because it isn't) — every mwp entry is therefore
    // something that has to be memorised as a chunk, not guessed. That's
    // different enough from "some other part of speech" to deserve its own
    // filter rather than being buried in "Other" alongside determiners.
    if (pos === 'mwp') return 'idioms';
    if (pos.startsWith('n ') || pos.startsWith('n(')) return 'nouns';
    if (pos.startsWith('v')) return 'verbs';
    if (pos.startsWith('adj')) return 'adjectives';
    return 'other';
  }

  // ── Shared per-word mastery store (local, one blob) ─────────────
  const STATUS_KEY = 'geo_vocablab_status';
  function _loadStatus() {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function _saveStatus(map) {
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(map)); } catch (e) {}
  }
  let _statusCache = null;
  function _status() { if (!_statusCache) _statusCache = _loadStatus(); return _statusCache; }

  const status = {
    get(id) { return _status()[id] || { status: 'red', correctStreak: 0, timesSeen: 0, lastSeen: 0 }; },
    set(id, s) {
      const map = _status();
      const cur = map[id] || { status: 'red', correctStreak: 0, timesSeen: 0, lastSeen: 0 };
      const correctStreak = s === 'green' ? Math.max(2, cur.correctStreak) : s === 'amber' ? 1 : 0;
      map[id] = { status: s, correctStreak, timesSeen: cur.timesSeen + 1, lastSeen: Date.now() };
      _saveStatus(map);
      renderMasteryAll();
    },
    // Derive the next status from a right/wrong answer (Typed Recall / Match
    // Attack) rather than an explicit self-grade (Flashcards+ uses .set directly).
    bump(id, correct) {
      const map = _status();
      const cur = map[id] || { status: 'red', correctStreak: 0, timesSeen: 0, lastSeen: 0 };
      const correctStreak = correct ? cur.correctStreak + 1 : 0;
      const next = correctStreak >= 2 ? 'green' : correctStreak === 1 ? 'amber' : 'red';
      map[id] = { status: next, correctStreak, timesSeen: cur.timesSeen + 1, lastSeen: Date.now() };
      _saveStatus(map);
      renderMasteryAll();
      return next;
    },
  };

  // Priority-shuffle: a random shuffle, then a STABLE sort by status
  // (red < amber < green) so weak words surface earlier without being
  // fully deterministic. Shared by every mode via ctx.smartShuffle so the
  // "practise what you're weak on more" behaviour can't drift between them.
  function smartShuffle(words) {
    const priority = { red: 0, amber: 1, green: 2 };
    const arr = words.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr
      .map((w, i) => ({ w, i, p: priority[status.get(w.id).status] }))
      .sort((a, b) => a.p - b.p || a.i - b.i)
      .map(x => x.w);
  }

  // ── Fuzzy matching for typed answers ─────────────────────────────
  // Accent-insensitive on both sides (Spanish input is graded leniently on
  // accents but the correct accented form is always shown back); multi-form
  // headwords/glosses ("sano / saludable", "el que, la que, los que, las
  // que") accept ANY listed form. Small edit-distance tolerance forgives a
  // single-character typo on words of reasonable length.
  function levenshtein1(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length === b.length) { i++; j++; }        // substitution
      else if (a.length > b.length) i++;               // deletion from a
      else j++;                                        // insertion into a
    }
    return true;
  }
  function fuzzyMatch(input, acceptedText) {
    const forms = splitForms(acceptedText);
    const trimmedInput = String(input || '').trim();
    if (!trimmedInput) return { correct: false, perfect: false };
    const normInput = normKey(trimmedInput);
    for (const f of forms) {
      const trimmedF = f.trim();
      const normF = normKey(trimmedF);
      if (normInput === normF) {
        // "perfect" = matched WITHOUT needing the accent-insensitive fallback —
        // callers use this to gently flag "right, but check the accent".
        return { correct: true, perfect: trimmedInput.toLowerCase() === trimmedF.toLowerCase() };
      }
      if (normF.length >= 4 && levenshtein1(normInput, normF)) return { correct: true, perfect: false };
    }
    return { correct: false, perfect: false };
  }

  // ── Tiny UI kit + confetti (self-contained — see plan: don't depend on
  // script.js's topic-page-coupled showCelebration) ──
  const ui = {
    el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; },
    btn(label, cls) { const b = document.createElement('button'); b.type = 'button'; b.className = 'vl-btn' + (cls ? ' ' + cls : ''); b.textContent = label; return b; },
    speak(text) { if (typeof window.speak === 'function') window.speak(text); },
    playSound(kind) { if (typeof gamificationPlaySound === 'function') gamificationPlaySound(kind); },
    xpToast(n) { if (typeof gamificationShowXpToast === 'function') gamificationShowXpToast(n); },
    comboToast(n) { if (typeof gamificationShowComboToast === 'function') gamificationShowComboToast(n); },
    confetti(n) {
      n = n || 40;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        const colors = ['#7a5c9e', '#4a6fa5', '#d4a843', '#2d7a4f', '#c84b31'];
        p.style.cssText = 'position:fixed;top:0;left:' + (Math.random() * 100) + 'vw;width:' + (6 + Math.random() * 8) + 'px;height:' + (6 + Math.random() * 8) + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > .5 ? '50%' : '2px') + ';z-index:10001;pointer-events:none;animation:vlConfettiFall ' + (1.5 + Math.random() * 2) + 's ' + (Math.random() * .5) + 's ease-in forwards;';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4000);
      }
    },
  };
  (function injectConfettiKeyframes() {
    const s = document.createElement('style');
    s.textContent = '@keyframes vlConfettiFall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } } .vl-btn { background: var(--chrome, var(--ink)); color: var(--chrome-text, var(--paper)); border: none; padding: 10px 18px; border-radius: 7px; font-family: "DM Sans", sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; } .vl-btn:hover { opacity: .9; } .vl-btn:disabled { opacity: .5; cursor: default; }';
    document.head.appendChild(s);
  })();

  // ── Mode registry + lazy loader (mirrors economics-lab.js) ──────
  const MODE_FILES = {
    'flashcards-plus': 'vocab-modes/flashcards-plus.js',
    'typed-recall': 'vocab-modes/typed-recall.js',
    'match-attack': 'vocab-modes/match-attack.js',
    'conjugation-drills': 'vocab-modes/conjugation-drills.js',
  };
  const MODE_ORDER = ['flashcards-plus', 'typed-recall', 'match-attack', 'conjugation-drills'];
  const _defs = {};
  const _loading = {};
  window.VocabLab = { registerTool(id, def) { _defs[id] = def; }, ui: ui };

  function loadModule(file) {
    if (_loading[file]) return _loading[file];
    _loading[file] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/' + file;
      s.onload = () => resolve();
      s.onerror = () => { delete _loading[file]; reject(new Error(file + ' failed to load')); };
      document.head.appendChild(s);
    });
    return _loading[file];
  }

  // ── State ────────────────────────────────────────────────────────
  let allWords = [];
  let filters = { tier: 'all', pos: 'all', status: 'all', freq: 'all', q: '' };
  let launcher, mountArea, mountedDef;

  // AQA's own selection criteria are frequency-derived (§3.3: "at least 85%
  // ... drawn from the 2,000 most frequent words") — these bands give
  // students a way to work through the list in the order AQA actually built
  // it in, instead of an arbitrary/alphabetical one. `rank` is null for the
  // ~30 mwp phrases + ~20 culture words + words added beyond the top-2000
  // purely on thematic grounds — those fall in "Beyond 1,000" as the
  // (deliberately) least frequency-driven band.
  function freqBand(rank) {
    if (rank == null) return 'beyond1000';
    if (rank <= 100) return 'core100';
    if (rank <= 500) return 'core500';
    if (rank <= 1000) return 'core1000';
    return 'beyond1000';
  }

  function applyFilters() {
    const filtered = allWords.filter(w => {
      if (filters.tier !== 'all') {
        if (filters.tier === 'foundation' && w.tierLabel === 'Higher') return false;
        if (filters.tier === 'higher' && w.tierLabel === 'Foundation') return false;
      }
      if (filters.pos !== 'all' && posBucket(w.pos) !== filters.pos) return false;
      if (filters.status !== 'all' && status.get(w.id).status !== filters.status) return false;
      if (filters.freq !== 'all' && freqBand(w.rank) !== filters.freq) return false;
      if (filters.q) {
        const q = normKey(filters.q);
        if (!normKey(w.headword).includes(q) && !normKey(w.english).includes(q)) return false;
      }
      return true;
    });
    // Most-frequent-first by default — unranked words (rank === null) sort
    // after every ranked word, in their original (extraction) order.
    return filtered.sort((a, b) => {
      if (a.rank == null && b.rank == null) return 0;
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    });
  }

  function statusLabel(s) { return s === 'green' ? 'Known' : s === 'amber' ? 'Practising' : 'New'; }

  // Split into two independent renders (Activities tab vs Word Browser tab —
  // see the plan for why: everything used to stack on one panel, so opening
  // the page meant scrolling past a 90-word grid to reach the actual
  // activities). Progress counts are always over the FULL word set regardless
  // of filters, so the compact summary never needs the filtered list at all.
  // Skip the (potentially 90-word-card) browser rebuild while it's hidden —
  // status.set/bump fires on every single answer in fast-paced modes like
  // Typed Recall, and that tab is usually not the one on screen during play.
  function renderMasteryAll() { renderProgressSummary(); if (activeTab === 'browse') renderWordBrowser(); }

  function renderProgressSummary() {
    const el = document.getElementById('vlProgressSummary');
    if (!el || !allWords.length) return;
    let red = 0, amber = 0, green = 0;
    allWords.forEach(w => { const s = status.get(w.id).status; if (s === 'green') green++; else if (s === 'amber') amber++; else red++; });
    const total = allWords.length;
    const pct = n => total ? (100 * n / total).toFixed(1) : 0;
    el.innerHTML =
      '<div class="vl-map-stats">' +
        '<div class="stat"><b>' + total + '</b>total words</div>' +
        '<div class="stat"><b>' + green + '</b>known</div>' +
        '<div class="stat"><b>' + amber + '</b>practising</div>' +
        '<div class="stat"><b>' + red + '</b>new</div>' +
      '</div>' +
      '<div class="vl-map-bar">' +
        '<div class="seg green" style="width:' + pct(green) + '%"></div>' +
        '<div class="seg amber" style="width:' + pct(amber) + '%"></div>' +
        '<div class="seg red" style="width:' + pct(red) + '%"></div>' +
      '</div>';
  }

  function renderWordBrowser() {
    const panel = document.getElementById('vlWordBrowser');
    if (!panel || !allWords.length) return;
    const filtered = applyFilters();

    const CAP = 90;
    const shown = filtered.slice(0, CAP);
    const wordsHtml = shown.map(w => {
      const st = status.get(w.id).status;
      return '<div class="vl-word-card">' +
        '<div class="vl-word-head"><span class="vl-word-es">' + esc(w.headword) + '</span>' +
        '<span class="vl-status-chip ' + st + '">' + statusLabel(st) + '</span></div>' +
        '<div class="vl-word-en">' + esc(w.english) + '</div>' +
        '<div class="vl-word-meta"><span class="vl-tier-tag">' + w.tierLabel + '</span>' +
        (w.rank != null ? '<span class="vl-tier-tag">#' + w.rank + '</span>' : '') + '</div>' +
        '</div>';
    }).join('');
    const moreNote = filtered.length > CAP
      ? '<div class="vl-more-note">Showing ' + CAP + ' of ' + filtered.length + ' — narrow the filters or search to see more.</div>'
      : (filtered.length === 0 ? '<div class="empty">No words match these filters.</div>' : '');

    const hadFocus = document.activeElement && document.activeElement.id === 'vlSearch';
    const caret = hadFocus ? document.activeElement.selectionStart : null;

    panel.innerHTML =
      '<div class="vl-filters" id="vlFilters">' +
        pillGroup('tier', [['all', 'All tiers'], ['foundation', 'Foundation'], ['higher', 'Higher']]) +
        pillGroup('pos', [['all', 'All types'], ['verbs', 'Verbs'], ['nouns', 'Nouns'], ['adjectives', 'Adjectives'], ['idioms', 'Idioms & Phrases'], ['other', 'Other']]) +
        pillGroup('status', [['all', 'Any status'], ['red', 'New'], ['amber', 'Practising'], ['green', 'Known']]) +
        pillGroup('freq', [['all', 'Any frequency'], ['core100', 'Core 100'], ['core500', 'Core 500'], ['core1000', 'Core 1000'], ['beyond1000', 'Beyond 1000']]) +
        '<input type="text" class="vl-search" id="vlSearch" placeholder="Search Spanish or English…" value="' + esc(filters.q) + '"/>' +
      '</div>' +
      '<div class="vl-grid">' + wordsHtml + '</div>' + moreNote;

    panel.querySelectorAll('.vl-pill').forEach(b => b.addEventListener('click', () => {
      filters[b.dataset.group] = b.dataset.val;
      renderWordBrowser();
    }));
    const search = panel.querySelector('#vlSearch');
    search.addEventListener('input', () => { filters.q = search.value; renderWordBrowser(); });
    // Preserve focus/caret across re-render (typing triggers a full re-render).
    if (hadFocus) { search.focus(); search.setSelectionRange(caret, caret); }
  }

  function pillGroup(group, opts) {
    return '<div class="vl-pillgroup">' + opts.map(([val, label]) =>
      '<button type="button" class="vl-pill' + (filters[group] === val ? ' active' : '') + '" data-group="' + group + '" data-val="' + val + '">' + label + '</button>'
    ).join('') + '</div>';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ── Mode launcher (mirrors economics-lab.js openTool) ────────────
  const MODE_META = {
    'flashcards-plus': { icon: '🃏', title: 'Flashcards+', blurb: 'The flashcard system you know — flip, self-grade Red/Amber/Green, with 🔊 audio. New: type your guess before you flip.' },
    'typed-recall': { icon: '⌨️', title: 'Typed Recall', blurb: 'See a word, type the answer — instant checking, no flipping. Fast-paced, builds a streak.' },
    'match-attack': { icon: '🧩', title: 'Match Attack', blurb: 'Flip pairs of tiles to match Spanish with English against the clock. Beat your best time.' },
    'conjugation-drills': { icon: '🔤', title: 'Conjugation Drills', blurb: 'Infinitive + person → you produce the present-tense form. Regular verbs only — the grammar the exam expects you to work out yourself.' },
  };

  function renderLauncher() {
    const grid = document.getElementById('vlModeGrid');
    grid.innerHTML = MODE_ORDER.map(id => {
      const m = MODE_META[id];
      return '<button type="button" class="vl-mode-card" data-mode="' + id + '">' +
        '<div class="vl-mode-icon">' + m.icon + '</div>' +
        '<div class="vl-mode-title">' + m.title + '</div>' +
        '<div class="vl-mode-blurb">' + m.blurb + '</div></button>';
    }).join('');
    grid.querySelectorAll('.vl-mode-card').forEach(b => b.addEventListener('click', () => openMode(b.dataset.mode)));
  }

  function unmountCurrent() {
    if (mountedDef && typeof mountedDef.unmount === 'function') {
      try { mountedDef.unmount(); } catch (e) { console.error('[vocab-lab] unmount', e); }
    }
    mountedDef = null;
  }

  function openMode(id) {
    const meta = MODE_META[id];
    unmountCurrent();
    launcher.style.display = 'none';
    mountArea.innerHTML = '';
    mountArea.style.display = '';
    const head = ui.el('<div class="vl-toolhead"><button type="button" class="vl-back">← All activities</button><h3>' + meta.icon + ' ' + meta.title + '</h3></div>');
    head.querySelector('.vl-back').addEventListener('click', () => {
      unmountCurrent();
      mountArea.style.display = 'none';
      mountArea.innerHTML = '';
      launcher.style.display = '';
      renderMasteryAll();
    });
    mountArea.appendChild(head);
    const body = ui.el('<div class="vl-loading">Loading activity…</div>');
    mountArea.appendChild(body);

    loadModule(MODE_FILES[id]).then(() => {
      const def = _defs[id];
      if (!def) throw new Error('module loaded but mode "' + id + '" never registered');
      mountedDef = def;
      body.className = '';
      body.innerHTML = '';
      def.mount(body, {
        words: applyFilters(),
        allWords: allWords,
        status: status,
        ui: ui,
        fuzzyMatch: fuzzyMatch,
        smartShuffle: smartShuffle,
        complete() { renderMasteryAll(); },
      });
    }).catch(err => {
      console.error('[vocab-lab]', err);
      body.textContent = 'Couldn’t load this activity — try again in a moment.';
    });
  }

  // ── Tabs: Activities (default landing) vs Word Browser ───────────
  // Two separate steps instead of stacking the full filterable word grid
  // above the activity launcher — that stacking meant scrolling past ~90
  // word cards just to reach the games. Word Browser only renders its grid
  // when it's actually the visible tab (renderMasteryAll checks this), so
  // switching to it is always fresh and gameplay never pays for a hidden re-render.
  let activeTab = 'play';
  function switchTab(tab) {
    activeTab = tab;
    document.getElementById('vlTabPlay').classList.toggle('active', tab === 'play');
    document.getElementById('vlTabBrowse').classList.toggle('active', tab === 'browse');
    document.getElementById('vlPlayPanel').style.display = tab === 'play' ? '' : 'none';
    document.getElementById('vlBrowsePanel').style.display = tab === 'browse' ? '' : 'none';
    if (tab === 'browse') renderWordBrowser();
  }

  // ── Boot ─────────────────────────────────────────────────────────
  async function init() {
    const auth = await tasksAuthInit('student');
    if (!auth) return;

    if (!window.VOCAB_BANK || !window.VOCAB_BANK.length) {
      document.getElementById('vlLoading').textContent = 'Couldn’t load the wordbank — try refreshing.';
      return;
    }
    allWords = buildPracticeSet(window.VOCAB_BANK);

    launcher = document.getElementById('vlLauncher');
    mountArea = document.getElementById('vlMountArea');
    document.getElementById('vlLoading').style.display = 'none';
    document.getElementById('vlTabs').style.display = '';
    document.getElementById('vlPlayPanel').style.display = '';
    document.getElementById('vlTabPlay').addEventListener('click', () => switchTab('play'));
    document.getElementById('vlTabBrowse').addEventListener('click', () => switchTab('browse'));
    renderLauncher();
    renderMasteryAll();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ── Node export (tests only) ─────────────────────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildPracticeSet, fuzzyMatch, posBucket, freqBand, normKey, stripAccents, splitForms, mergeSenses, levenshtein1, smartShuffle, status };
  }
})();
