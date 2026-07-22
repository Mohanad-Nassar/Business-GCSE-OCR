// ══════════════════════════════════════════════════════════════
// TYPED RECALL — vocab.js mode module
//
// No flip, just speed: one direction (ES→EN default, toggle for EN→ES), type
// the other side, instant fuzzyMatch grading, streak/combo feedback. Status
// is DERIVED via ctx.status.bump(id, correct) rather than a self-grade —
// this is the "type the word, auto-check" mode the owner asked for.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const DIR_KEY = 'geo_vocablab_tr_dir';
  function getDir() { try { return localStorage.getItem(DIR_KEY) || 'es-en'; } catch (e) { return 'es-en'; } }
  function setDir(v) { try { localStorage.setItem(DIR_KEY, v); } catch (e) {} }

  function injectStyles() {
    if (document.getElementById('vlTrStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlTrStyles';
    s.textContent = `
      .vl-tr-dirrow { display:flex; justify-content:center; gap:8px; margin-bottom:16px; }
      .vl-tr-prompt { text-align:center; padding:24px; }
      .vl-tr-word { font-family:'Playfair Display',serif; font-weight:700; font-size:26px; color:var(--ink); margin-bottom:4px; }
      .vl-tr-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; }
      .vl-tr-inputrow { display:flex; gap:8px; max-width:360px; margin:16px auto 6px; }
      .vl-tr-inputrow input { flex:1; padding:11px 14px; border:1.5px solid var(--border); border-radius:8px; font-size:15px; background:var(--card-bg); color:var(--ink); }
      .vl-tr-inputrow input.correct { border-color:var(--success); background:#d4edda; }
      .vl-tr-inputrow input.wrong { border-color:var(--wrong); background:#fde8e5; }
      .vl-tr-hint { text-align:center; font-size:11.5px; color:var(--mid); margin-bottom:10px; }
      .vl-tr-feedback { min-height:20px; font-size:13.5px; margin-bottom:6px; text-align:center; }
      .vl-tr-feedback.correct { color:var(--success); }
      .vl-tr-feedback.wrong { color:var(--wrong); }
      .vl-tr-nav { display:flex; justify-content:center; margin-bottom:14px; min-height:40px; }
      .vl-tr-stats { display:flex; justify-content:center; gap:20px; font-family:'DM Mono',monospace; font-size:12px; color:var(--mid); margin-bottom:10px; }
      .vl-tr-stats b { color:var(--ink); }
      .vl-tr-summary { text-align:center; padding:20px; }
    `;
    document.head.appendChild(s);
  }

  function mount(el, ctx) {
    injectStyles();
    if (!ctx.words.length) { el.innerHTML = '<div class="empty">No words match the current filters — widen them to build a round.</div>'; return; }

    const deck = ctx.smartShuffle(ctx.words);
    let index = 0, correctCount = 0, wrongCount = 0, combo = 0, awaitingNext = false;

    el.innerHTML =
      '<div class="vl-tr-dirrow">' +
        '<button type="button" class="vl-pill" data-dir="es-en">🇪🇸 → 🇬🇧 See Spanish, type English</button>' +
        '<button type="button" class="vl-pill" data-dir="en-es">🇬🇧 → 🇪🇸 See English, type Spanish</button>' +
      '</div>' +
      '<div class="vl-tr-stats" id="vlTrStats"></div>' +
      '<div id="vlTrArea"></div>';

    const dirBtns = el.querySelectorAll('[data-dir]');
    function syncDirButtons() { dirBtns.forEach(b => b.classList.toggle('active', b.dataset.dir === getDir())); }
    dirBtns.forEach(b => b.addEventListener('click', () => { setDir(b.dataset.dir); syncDirButtons(); renderPrompt(); }));
    syncDirButtons();

    const area = el.querySelector('#vlTrArea');

    function renderStats() {
      el.querySelector('#vlTrStats').innerHTML =
        '<span>Word <b>' + (index + 1) + '</b>/' + deck.length + '</span>' +
        '<span><b>' + correctCount + '</b> correct</span>' +
        '<span><b>' + wrongCount + '</b> wrong</span>' +
        (combo >= 3 ? '<span>🔥 <b>' + combo + '</b> streak</span>' : '');
    }

    function renderPrompt() {
      if (index >= deck.length) { renderSummary(); return; }
      renderStats();
      awaitingNext = false;
      const w = deck[index];
      const dir = getDir();
      const promptText = dir === 'es-en' ? w.headword : w.english;
      const acceptedText = dir === 'es-en' ? w.english : w.headword;

      area.innerHTML =
        '<div class="vl-tr-prompt">' +
          (dir === 'es-en' ? '<button type="button" class="vl-tr-say" id="vlTrSay" aria-label="Listen">🔊</button>' : '') +
          '<div class="vl-tr-word">' + esc(promptText) + '</div>' +
        '</div>' +
        '<div class="vl-tr-inputrow"><input type="text" id="vlTrInput" placeholder="Type your answer…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"></div>' +
        '<div class="vl-tr-hint">Type your answer, then tap Submit (or press Enter).</div>' +
        '<div class="vl-tr-feedback" id="vlTrFeedback"></div>' +
        '<div class="vl-tr-nav" id="vlTrNav"><button type="button" class="vl-btn" id="vlTrSubmitBtn">Submit</button></div>';

      if (dir === 'es-en') area.querySelector('#vlTrSay').addEventListener('click', () => ctx.ui.speak(w.say));
      const input = area.querySelector('#vlTrInput');
      const feedback = area.querySelector('#vlTrFeedback');
      input.focus();
      // Both a tappable Submit button AND the Enter key work — a phone's
      // on-screen keyboard has no physical Enter key, and not every mobile
      // keyboard/IME reliably fires a keydown for its return/"Go" key either,
      // so the button is the primary path and Enter is a bonus for desktop.
      area.querySelector('#vlTrSubmitBtn').addEventListener('click', () => submit(input, feedback, w, acceptedText));
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (awaitingNext) { advance(); return; }
        submit(input, feedback, w, acceptedText);
      });
    }

    function submit(input, feedback, w, acceptedText) {
      if (awaitingNext) return; // Enter-key path and Submit-button path could otherwise double-fire
      const res = ctx.fuzzyMatch(input.value, acceptedText);
      awaitingNext = true;
      input.classList.add(res.correct ? 'correct' : 'wrong');
      // readOnly, NOT disabled: a disabled input can't hold focus or receive
      // keydown at all, which silently killed "press Enter to continue" and
      // left the round stuck. readOnly still blocks editing but keeps the
      // element focusable/listenable.
      input.readOnly = true;
      const next = ctx.status.bump(w.id, res.correct);
      const isLast = index >= deck.length - 1;
      const navLabel = isLast ? 'See results →' : 'Next word →';
      area.querySelector('.vl-tr-hint').textContent = '';
      area.querySelector('#vlTrNav').innerHTML = '<button type="button" class="vl-btn" id="vlTrNextBtn">' + navLabel + '</button>';
      area.querySelector('#vlTrNextBtn').addEventListener('click', advance);
      if (res.correct) {
        correctCount++; combo++;
        feedback.className = 'vl-tr-feedback correct';
        feedback.textContent = res.perfect ? '✓ Correct!' : '✓ Correct — ' + w.headword + ' (mind the accent!)';
        ctx.ui.playSound('correct');
        if (combo > 0 && combo % 5 === 0) { ctx.ui.playSound('combo'); ctx.ui.comboToast(combo); }
        ctx.ui.xpToast(next === 'green' ? 3 : 1);
      } else {
        wrongCount++; combo = 0;
        feedback.className = 'vl-tr-feedback wrong';
        feedback.textContent = '✗ Not quite — the answer was "' + (getDir() === 'es-en' ? w.english : w.headword) + '".';
        ctx.ui.playSound('wrong');
      }
      renderStats();
    }

    function advance() { index++; renderPrompt(); }

    function renderSummary() {
      const perfect = wrongCount === 0 && correctCount > 0;
      if (perfect) ctx.ui.confetti(50);
      area.innerHTML = '<div class="vl-tr-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">' + (perfect ? '🌟 Flawless round!' : 'Round complete!') + '</h3>' +
        '<p class="muted">' + correctCount + ' correct · ' + wrongCount + ' wrong</p>' +
        '<button type="button" class="vl-btn" id="vlTrAgain" style="margin-top:14px;">Go again</button>' +
      '</div>';
      el.querySelector('#vlTrStats').innerHTML = '';
      area.querySelector('#vlTrAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    renderPrompt();
  }

  window.VocabLab.registerTool('typed-recall', {
    title: 'Typed Recall',
    icon: '⌨️',
    mount: mount,
    unmount() {},
  });
})();
