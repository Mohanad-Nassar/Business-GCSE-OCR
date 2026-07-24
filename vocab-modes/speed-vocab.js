// ══════════════════════════════════════════════════════════════
// SPEED VOCAB — vocab.js mode module (named in SPANISH-CONTENT-PLAN.md's
// original Spanish Lab tool list: "10-in-90 flip EN↔ES with 🔊; timed;
// streak/best")
//
// Pure fluency/recall speed, not recognition-among-decoys (that's MCQ
// Blitz's job): flip as many cards as you honestly can in 90 seconds,
// self-report Knew it / Didn't know, chase your own best score. Status is
// DERIVED via ctx.status.bump() rather than a direct self-grade set() — a
// single rushed "Knew it" tap during a speed round shouldn't instantly mark
// a brand-new word fully "known" the way Flashcards+'s deliberate R/A/G
// self-grade does; it takes two correct signals, same as every other
// auto-graded mode.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ROUND_SECONDS = 90;
  const DIR_KEY = 'geo_vocablab_sv_dir';
  const BEST_KEY = 'geo_vocablab_speedvocab_best';
  function getDir() { try { return localStorage.getItem(DIR_KEY) || 'es-en'; } catch (e) { return 'es-en'; } }
  function setDir(v) { try { localStorage.setItem(DIR_KEY, v); } catch (e) {} }
  function getBest(dir) { try { const m = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); return m[dir] || null; } catch (e) { return null; } }
  function setBest(dir, n) {
    try { const m = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); m[dir] = n; localStorage.setItem(BEST_KEY, JSON.stringify(m)); } catch (e) {}
  }

  // Module-level, not per-mount closure — see the match-attack.js fix this
  // module was built alongside: unmount() must be able to reach whichever
  // round is currently live to stop its 1s tick, or clicking "← All
  // activities" mid-round leaves it running forever against a detached DOM.
  let activeTimerHandle = null;

  function injectStyles() {
    if (document.getElementById('vlSvStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlSvStyles';
    s.textContent = `
      .vl-sv-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:'DM Mono',monospace; font-size:13px; color:var(--mid); }
      .vl-sv-timer { font-weight:700; color:var(--ink); font-size:16px; }
      .vl-sv-timer.urgent { color:var(--wrong); }
      .vl-sv-dirrow { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:16px; }
      .vl-sv-card { background:var(--cream); border:2px solid var(--border); border-radius:14px; padding:36px 28px; text-align:center; min-height:130px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer; }
      .vl-sv-term { font-family:'Playfair Display',serif; font-weight:700; font-size:22px; color:var(--ink); }
      .vl-sv-def { font-size:15px; color:var(--mid); display:none; }
      .vl-sv-card.flipped .vl-sv-def { display:block; }
      .vl-sv-card.flipped .vl-sv-hint { display:none; }
      .vl-sv-hint { font-size:11.5px; color:var(--mid); font-style:italic; }
      .vl-sv-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; margin-bottom:4px; }
      .vl-sv-nav { display:flex; justify-content:center; gap:10px; margin-top:18px; min-height:44px; }
      .vl-sv-grade { border:none; border-radius:8px; padding:12px 24px; font-weight:700; font-size:14px; cursor:pointer; color:#fff; }
      .vl-sv-grade.no { background:#c84b31; }
      .vl-sv-grade.yes { background:#2d7a4f; }
      .vl-sv-summary { text-align:center; padding:20px; }
      .vl-sv-newbest { color:var(--gold, #b8860b); font-weight:700; }
    `;
    document.head.appendChild(s);
  }

  function freshDeck(ctx) { return ctx.smartShuffle(ctx.words); }

  function mount(el, ctx) {
    injectStyles();
    if (!ctx.words.length) { el.innerHTML = '<div class="empty">No words match the current filters — widen them to play.</div>'; return; }

    let deck = freshDeck(ctx), index = 0, seenCount = 0, knownCount = 0;
    let secondsLeft = ROUND_SECONDS, startedAt = null, finished = false, flipped = false;

    el.innerHTML =
      '<div class="vl-sv-dirrow">' +
        '<button type="button" class="vl-pill" data-dir="es-en">🇪🇸 → 🇬🇧</button>' +
        '<button type="button" class="vl-pill" data-dir="en-es">🇬🇧 → 🇪🇸</button>' +
      '</div>' +
      '<div class="vl-sv-topbar"><span class="vl-sv-timer" id="vlSvTimer">⏱ 1:30</span><span id="vlSvScore">Known: 0</span></div>' +
      '<div id="vlSvArea"></div>';

    const dirBtns = el.querySelectorAll('[data-dir]');
    function syncDirButtons() { dirBtns.forEach(b => b.classList.toggle('active', b.dataset.dir === getDir())); }
    dirBtns.forEach(b => b.addEventListener('click', () => {
      if (startedAt) return; // direction is locked once the round has started
      setDir(b.dataset.dir); syncDirButtons(); renderCard();
    }));
    syncDirButtons();

    const area = el.querySelector('#vlSvArea');
    const timerEl = el.querySelector('#vlSvTimer');
    const scoreEl = el.querySelector('#vlSvScore');

    function fmtTime(sec) { const m = Math.floor(sec / 60), s = sec % 60; return '⏱ ' + m + ':' + String(s).padStart(2, '0'); }

    function startTimerIfNeeded() {
      if (startedAt) return;
      startedAt = Date.now();
      activeTimerHandle = setInterval(() => {
        if (finished) return;
        secondsLeft = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
        timerEl.textContent = fmtTime(secondsLeft);
        timerEl.classList.toggle('urgent', secondsLeft <= 10);
        if (secondsLeft === 0) finish();
      }, 250);
    }

    function renderCard() {
      if (finished) return;
      flipped = false;
      const w = deck[index];
      const dir = getDir();
      const front = dir === 'es-en' ? w.headword : ctx.simplifyGloss(w.english);
      const back = dir === 'es-en' ? ctx.simplifyGloss(w.english) : w.headword;

      area.innerHTML =
        '<div class="vl-sv-card" id="vlSvCard">' +
          (dir === 'es-en' ? '<button type="button" class="vl-sv-say" id="vlSvSay" aria-label="Listen">🔊</button>' : '') +
          '<div class="vl-sv-term">' + esc(front) + '</div>' +
          '<div class="vl-sv-hint">Tap to reveal</div>' +
          '<div class="vl-sv-def">' + esc(back) + '</div>' +
        '</div>' +
        '<div class="vl-sv-nav" id="vlSvNav"></div>';

      if (dir === 'es-en') area.querySelector('#vlSvSay').addEventListener('click', (e) => { e.stopPropagation(); ctx.ui.speak(w.say); });
      area.querySelector('#vlSvCard').addEventListener('click', flip);
    }

    function flip() {
      if (flipped || finished) return;
      startTimerIfNeeded();
      flipped = true;
      area.querySelector('#vlSvCard').classList.add('flipped');
      area.querySelector('#vlSvNav').innerHTML =
        '<button type="button" class="vl-sv-grade no" id="vlSvNo">✗ Didn\'t know</button>' +
        '<button type="button" class="vl-sv-grade yes" id="vlSvYes">✓ Knew it</button>';
      area.querySelector('#vlSvNo').addEventListener('click', () => grade(false));
      area.querySelector('#vlSvYes').addEventListener('click', () => grade(true));
    }

    function grade(knewIt) {
      if (finished) return;
      const w = deck[index];
      seenCount++;
      if (knewIt) knownCount++;
      ctx.status.bump(w.id, knewIt);
      ctx.ui.playSound(knewIt ? 'correct' : 'wrong');
      scoreEl.textContent = 'Known: ' + knownCount;
      index++;
      if (index >= deck.length) { deck = freshDeck(ctx); index = 0; } // endless — reshuffle rather than stall
      renderCard();
    }

    function finish() {
      finished = true;
      clearInterval(activeTimerHandle);
      const dir = getDir();
      const best = getBest(dir);
      const isNewBest = seenCount > 0 && (best == null || knownCount > best);
      if (isNewBest) setBest(dir, knownCount);
      if (isNewBest) ctx.ui.confetti(60);
      area.innerHTML = '<div class="vl-sv-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">⏱ Time\'s up!</h3>' +
        '<p class="muted">' + knownCount + ' known out of ' + seenCount + ' seen' +
        (isNewBest ? ' — <span class="vl-sv-newbest">new best! 🏆</span>' : (best != null ? ' · Best: ' + best : '')) + '</p>' +
        '<button type="button" class="vl-btn" id="vlSvAgain" style="margin-top:14px;">Play again</button>' +
      '</div>';
      el.querySelector('#vlSvTimer').style.visibility = 'hidden';
      area.querySelector('#vlSvAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    timerEl.textContent = fmtTime(ROUND_SECONDS);
    renderCard();
  }

  window.VocabLab.registerTool('speed-vocab', {
    title: 'Speed Vocab',
    icon: '⚡',
    mount: mount,
    unmount() { clearInterval(activeTimerHandle); },
  });

  // ── Node export (tests only) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROUND_SECONDS };
  }
})();
