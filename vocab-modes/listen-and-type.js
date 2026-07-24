// ══════════════════════════════════════════════════════════════
// LISTEN & TYPE — vocab.js mode module
//
// Pure listening comprehension, no text crutch — ties to the AQA Listening
// paper's dictation component (unlike Typed Recall, which always shows a
// written prompt on screen). Audio autoplays on each new word; the student
// types the Spanish spelling from what they heard. The headword is only
// revealed AFTER answering (win or lose), same as Typed Recall's reveal.
//
// Reuses the exact Submit→Next mobile-safe button pattern established in
// typed-recall.js / conjugation-drills.js (a phone has no physical Enter
// key, and not every on-screen keyboard reliably fires a keydown for
// return/"Go" either) — Enter still works too, as a desktop shortcut.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ROUND_SIZE = 15;

  function injectStyles() {
    if (document.getElementById('vlLtStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlLtStyles';
    s.textContent = `
      .vl-lt-prompt { text-align:center; padding:28px 20px; }
      .vl-lt-say { border:none; background:var(--accent); color:#fff; border-radius:999px; width:64px; height:64px; font-size:26px; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,.15); }
      .vl-lt-say:hover { opacity:.9; }
      .vl-lt-replayhint { font-size:11.5px; color:var(--mid); margin-top:8px; }
      .vl-lt-reveal { font-family:'Playfair Display',serif; font-weight:700; font-size:20px; color:var(--ink); margin-top:4px; }
      .vl-lt-revealgloss { font-size:13px; color:var(--mid); }
      .vl-lt-inputrow { display:flex; gap:8px; max-width:360px; margin:16px auto 6px; }
      .vl-lt-inputrow input { flex:1; padding:11px 14px; border:1.5px solid var(--border); border-radius:8px; font-size:15px; background:var(--card-bg); color:var(--ink); text-align:center; }
      .vl-lt-inputrow input.correct { border-color:var(--success); background:#d4edda; }
      .vl-lt-inputrow input.wrong { border-color:var(--wrong); background:#fde8e5; }
      .vl-lt-hint { text-align:center; font-size:11.5px; color:var(--mid); margin-bottom:10px; }
      .vl-lt-feedback { min-height:20px; font-size:13.5px; margin-bottom:6px; text-align:center; }
      .vl-lt-feedback.correct { color:var(--success); }
      .vl-lt-feedback.wrong { color:var(--wrong); }
      .vl-lt-nav { display:flex; justify-content:center; margin-bottom:14px; min-height:40px; }
      .vl-lt-stats { display:flex; justify-content:center; gap:20px; font-family:'DM Mono',monospace; font-size:12px; color:var(--mid); margin-bottom:10px; }
      .vl-lt-stats b { color:var(--ink); }
      .vl-lt-summary { text-align:center; padding:20px; }
    `;
    document.head.appendChild(s);
  }

  function mount(el, ctx) {
    injectStyles();
    if (!ctx.words.length) { el.innerHTML = '<div class="empty">No words match the current filters — widen them to build a round.</div>'; return; }

    const deck = ctx.smartShuffle(ctx.words).slice(0, Math.min(ROUND_SIZE, ctx.words.length));
    let index = 0, correctCount = 0, wrongCount = 0, combo = 0, awaitingNext = false;

    el.innerHTML = '<div class="vl-lt-stats" id="vlLtStats"></div><div id="vlLtArea"></div>';
    const area = el.querySelector('#vlLtArea');

    function renderStats() {
      el.querySelector('#vlLtStats').innerHTML =
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

      area.innerHTML =
        '<div class="vl-lt-prompt">' +
          '<button type="button" class="vl-lt-say" id="vlLtSay" aria-label="Play audio">🔊</button>' +
          '<div class="vl-lt-replayhint">Tap to hear it again</div>' +
        '</div>' +
        '<div class="vl-lt-inputrow"><input type="text" id="vlLtInput" placeholder="Type what you heard…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"></div>' +
        '<div class="vl-lt-hint">Type the Spanish spelling, then tap Submit (or press Enter).</div>' +
        '<div class="vl-lt-feedback" id="vlLtFeedback"></div>' +
        '<div class="vl-lt-nav" id="vlLtNav"><button type="button" class="vl-btn" id="vlLtSubmitBtn">Submit</button></div>';

      const sayBtn = area.querySelector('#vlLtSay');
      sayBtn.addEventListener('click', () => ctx.ui.speak(w.say));
      ctx.ui.speak(w.say); // autoplay — speechSynthesis isn't gated by the
                           // same autoplay policy as <audio>/<video>, and
                           // this always fires right after a Submit/Next
                           // click, well within a user-gesture chain anyway.

      const input = area.querySelector('#vlLtInput');
      const feedback = area.querySelector('#vlLtFeedback');
      ctx.ui.attachAccentBar(input);
      input.focus();
      area.querySelector('#vlLtSubmitBtn').addEventListener('click', () => submit(input, feedback, w));
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (awaitingNext) { advance(); return; }
        submit(input, feedback, w);
      });
    }

    function submit(input, feedback, w) {
      if (awaitingNext) return;
      const res = ctx.fuzzyMatch(input.value, w.headword);
      awaitingNext = true;
      input.classList.add(res.correct ? 'correct' : 'wrong');
      input.readOnly = true;
      const next = ctx.status.bump(w.id, res.correct);
      const isLast = index >= deck.length - 1;
      area.querySelector('.vl-lt-hint').textContent = '';
      area.querySelector('#vlLtNav').innerHTML = '<button type="button" class="vl-btn" id="vlLtNextBtn">' + (isLast ? 'See results →' : 'Next word →') + '</button>';
      area.querySelector('#vlLtNextBtn').addEventListener('click', advance);

      const revealHtml = '<div class="vl-lt-reveal">' + esc(w.headword) + '</div><div class="vl-lt-revealgloss">' + esc(ctx.simplifyGloss(w.english)) + '</div>';
      area.querySelector('.vl-lt-prompt').insertAdjacentHTML('beforeend', revealHtml);

      if (res.correct) {
        correctCount++; combo++;
        feedback.className = 'vl-lt-feedback correct';
        feedback.textContent = res.perfect ? '✓ Correct!' : '✓ Correct (close enough — mind the accent!)';
        ctx.ui.playSound('correct');
        if (combo > 0 && combo % 5 === 0) { ctx.ui.playSound('combo'); ctx.ui.comboToast(combo); }
        ctx.ui.xpToast(next === 'green' ? 3 : 1);
      } else {
        wrongCount++; combo = 0;
        feedback.className = 'vl-lt-feedback wrong';
        feedback.textContent = '✗ Not quite — see the correct spelling above.';
        ctx.ui.playSound('wrong');
      }
      renderStats();
    }

    function advance() { index++; renderPrompt(); }

    function renderSummary() {
      const perfect = wrongCount === 0 && correctCount > 0;
      if (perfect) ctx.ui.confetti(50);
      area.innerHTML = '<div class="vl-lt-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">' + (perfect ? '🌟 Flawless round!' : 'Round complete!') + '</h3>' +
        '<p class="muted">' + correctCount + ' correct · ' + wrongCount + ' wrong</p>' +
        '<button type="button" class="vl-btn" id="vlLtAgain" style="margin-top:14px;">Go again</button>' +
      '</div>';
      el.querySelector('#vlLtStats').innerHTML = '';
      area.querySelector('#vlLtAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    renderPrompt();
  }

  window.VocabLab.registerTool('listen-and-type', {
    title: 'Listen & Type',
    icon: '🎧',
    mount: mount,
    unmount() {},
  });
})();
