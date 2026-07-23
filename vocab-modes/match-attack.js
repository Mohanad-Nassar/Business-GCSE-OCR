// ══════════════════════════════════════════════════════════════
// MATCH ATTACK — vocab.js mode module
//
// Memory-grid: flip two tiles (one Spanish, one English) to find pairs from
// the current filtered set, against a clock, with a saved personal best per
// board size. A wrong pair is INCONCLUSIVE about either word individually
// (the student picked a bad pairing, not necessarily an unknown word) so it
// only resets the combo — status.bump only fires on a confirmed match, for
// BOTH words in the pair.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const PAIR_COUNT = 8;
  const BEST_KEY = 'geo_vocablab_match_best';
  // Module-level (not per-mount closure) so unmount() can reach whichever
  // round is currently live — only one mode is ever mounted at a time in
  // vocab.js, so this is safe. Without this, clicking "← All activities"
  // mid-round (before finish() has a chance to clearInterval) leaves the
  // 1s tick running forever against a detached DOM node.
  let activeTimerHandle = null;
  function getBest(n) { try { const m = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); return m[n] || null; } catch (e) { return null; } }
  function setBest(n, seconds) {
    try {
      const m = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      m[n] = seconds;
      localStorage.setItem(BEST_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('vlMaStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlMaStyles';
    s.textContent = `
      .vl-ma-bar { display:flex; justify-content:space-between; font-family:'DM Mono',monospace; font-size:12.5px; color:var(--mid); margin-bottom:14px; }
      .vl-ma-bar b { color:var(--ink); }
      .vl-ma-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
      .vl-ma-tile {
        background:var(--cream); border:1.5px solid var(--border); border-radius:9px;
        padding:14px 8px; min-height:56px; display:flex; align-items:center; justify-content:center;
        text-align:center; font-size:13px; font-weight:600; color:var(--ink); cursor:pointer; user-select:none;
        transition:background .15s,border-color .15s,transform .1s;
      }
      .vl-ma-tile:hover { border-color:var(--accent); }
      .vl-ma-tile.selected { border-color:var(--accent); background:color-mix(in srgb, var(--accent) 14%, var(--cream)); }
      .vl-ma-tile.matched { background:#d4edda; border-color:var(--success); color:var(--success); cursor:default; opacity:.65; }
      .vl-ma-tile.wrong { background:#fde8e5; border-color:var(--wrong); }
      .vl-ma-summary { text-align:center; padding:20px; }
      @media (max-width:600px) { .vl-ma-grid { grid-template-columns:repeat(3,1fr); } }
    `;
    document.head.appendChild(s);
  }

  function mount(el, ctx) {
    injectStyles();
    const n = Math.min(PAIR_COUNT, ctx.words.length);
    if (n < 3) { el.innerHTML = '<div class="empty">Need at least 3 words in the current filters to play Match Attack — widen them.</div>'; return; }

    const pairs = ctx.smartShuffle(ctx.words).slice(0, n);
    let tiles = [];
    pairs.forEach(w => {
      tiles.push({ wordId: w.id, side: 'es', text: w.headword, matched: false });
      tiles.push({ wordId: w.id, side: 'en', text: ctx.simplifyGloss(w.english), matched: false });
    });
    tiles = shuffleArr(tiles);

    let selected = [];
    let matchedCount = 0;
    let combo = 0;
    let startedAt = null;
    let finished = false;

    el.innerHTML =
      '<div class="vl-ma-bar"><span id="vlMaTimer">⏱ 0:00</span><span id="vlMaProgress"><b>0</b>/' + n + ' pairs</span></div>' +
      '<div class="vl-ma-grid" id="vlMaGrid"></div>';

    const timerEl = el.querySelector('#vlMaTimer');
    const progressEl = el.querySelector('#vlMaProgress');
    const grid = el.querySelector('#vlMaGrid');

    function fmtTime(sec) { const m = Math.floor(sec / 60), s = sec % 60; return '⏱ ' + m + ':' + String(s).padStart(2, '0'); }

    function startTimerIfNeeded() {
      if (startedAt) return;
      startedAt = Date.now();
      activeTimerHandle = setInterval(() => {
        if (finished) return;
        timerEl.textContent = fmtTime(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    }

    function render() {
      grid.innerHTML = tiles.map((t, i) => {
        const cls = ['vl-ma-tile'];
        if (t.matched) cls.push('matched');
        else if (selected.includes(i)) cls.push('selected');
        return '<div class="' + cls.join(' ') + '" data-i="' + i + '">' + esc(t.text) + '</div>';
      }).join('');
      grid.querySelectorAll('.vl-ma-tile').forEach(el2 => el2.addEventListener('click', () => onTileClick(+el2.dataset.i)));
    }

    function onTileClick(i) {
      if (finished || tiles[i].matched || selected.includes(i) || selected.length === 2) return;
      startTimerIfNeeded();
      selected.push(i);
      render();
      if (selected.length === 2) evaluate();
    }

    function evaluate() {
      const [a, b] = selected;
      const isMatch = tiles[a].wordId === tiles[b].wordId && tiles[a].side !== tiles[b].side;
      if (isMatch) {
        tiles[a].matched = true; tiles[b].matched = true;
        matchedCount++;
        combo++;
        ctx.status.bump(tiles[a].wordId, true);
        ctx.ui.playSound('correct');
        if (combo >= 3) ctx.ui.playSound('combo');
        selected = [];
        progressEl.innerHTML = '<b>' + matchedCount + '</b>/' + n + ' pairs';
        render();
        if (matchedCount === n) finish();
      } else {
        combo = 0;
        ctx.ui.playSound('wrong');
        grid.querySelectorAll('.vl-ma-tile').forEach((el2, idx) => { if (idx === a || idx === b) el2.classList.add('wrong'); });
        setTimeout(() => { selected = []; render(); }, 650);
      }
    }

    function finish() {
      finished = true;
      clearInterval(activeTimerHandle);
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const best = getBest(n);
      const isNewBest = best == null || elapsed < best;
      if (isNewBest) setBest(n, elapsed);
      ctx.ui.confetti(60);
      el.innerHTML = '<div class="vl-ma-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">🎉 Board cleared!</h3>' +
        '<p class="muted">Time: ' + fmtTime(elapsed).replace('⏱ ', '') + (isNewBest ? ' — new best! 🏆' : (best != null ? ' · Best: ' + fmtTime(best).replace('⏱ ', '') : '')) + '</p>' +
        '<button type="button" class="vl-btn" id="vlMaAgain" style="margin-top:14px;">Play again</button>' +
      '</div>';
      el.querySelector('#vlMaAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function shuffleArr(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    render();
  }

  window.VocabLab.registerTool('match-attack', {
    title: 'Match Attack',
    icon: '🧩',
    mount: mount,
    unmount() { clearInterval(activeTimerHandle); },
  });
})();
