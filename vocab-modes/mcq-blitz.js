// ══════════════════════════════════════════════════════════════
// MCQ BLITZ — vocab.js mode module
//
// Recognition, not production (that's Typed Recall's job): show a word, tap
// the correct meaning from 4 options. Distractors are auto-generated — 3
// random OTHER words sharing the target's part-of-speech bucket (verbs vs
// verbs, nouns vs nouns...), so options read as plausible without any
// hand-authoring. No systematic length bias to guard against here the way
// docs/QUESTION-AUTHORING.md warns about for hand-authored MCQs — these
// distractors are random real glosses from the same pool the correct answer
// itself is drawn from, not an author's own (possibly lazy) invention — but
// option ORDER is still shuffled every question regardless.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ROUND_SIZE = 15;
  const OPTION_COUNT = 4;
  // Module-level, not per-mount closure — same reasoning as match-attack.js/
  // speed-vocab.js: unmount() must be able to cancel whichever round's
  // pending auto-advance is live, or clicking "← All activities" right after
  // answering (but before the 1.1s auto-advance fires) leaves it running
  // against a detached DOM once the area is cleared.
  let activeAdvanceTimer = null;

  function injectStyles() {
    if (document.getElementById('vlMqStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlMqStyles';
    s.textContent = `
      .vl-mq-dirrow { display:flex; justify-content:center; gap:8px; margin-bottom:16px; }
      .vl-mq-prompt { text-align:center; padding:20px 20px 8px; }
      .vl-mq-word { font-family:'Playfair Display',serif; font-weight:700; font-size:24px; color:var(--ink); }
      .vl-mq-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; margin-bottom:6px; }
      .vl-mq-options { display:flex; flex-direction:column; gap:8px; max-width:420px; margin:12px auto 0; }
      .vl-mq-opt { background:var(--cream); border:1.5px solid var(--border); border-radius:9px; padding:12px 16px; font-size:14px; text-align:left; cursor:pointer; color:var(--ink); }
      .vl-mq-opt:hover:not(:disabled) { border-color:var(--accent); }
      .vl-mq-opt:disabled { cursor:default; }
      .vl-mq-opt.correct { background:#d4edda; border-color:var(--success); color:var(--success); font-weight:600; }
      .vl-mq-opt.wrong { background:#fde8e5; border-color:var(--wrong); color:var(--wrong); font-weight:600; }
      .vl-mq-stats { display:flex; justify-content:center; gap:20px; font-family:'DM Mono',monospace; font-size:12px; color:var(--mid); margin-bottom:10px; }
      .vl-mq-stats b { color:var(--ink); }
      .vl-mq-summary { text-align:center; padding:20px; }
    `;
    document.head.appendChild(s);
  }

  const DIR_KEY = 'geo_vocablab_mq_dir';
  function getDir() { try { return localStorage.getItem(DIR_KEY) || 'es-en'; } catch (e) { return 'es-en'; } }
  function setDir(v) { try { localStorage.setItem(DIR_KEY, v); } catch (e) {} }

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // 3 distractors sharing the target's pos bucket, preferring the current
  // filtered pool for thematic consistency and falling back to the full
  // wordbank if that pool is too narrow to find enough.
  function pickDistractors(target, ctx) {
    const bucket = ctx.posBucket(target.pos);
    const sameBucket = pool => pool.filter(w => w.id !== target.id && ctx.posBucket(w.pos) === bucket);
    let candidates = sameBucket(ctx.words);
    if (candidates.length < OPTION_COUNT - 1) candidates = sameBucket(ctx.allWords);
    if (candidates.length < OPTION_COUNT - 1) candidates = ctx.allWords.filter(w => w.id !== target.id); // last resort: any word
    return shuffleArr(candidates).slice(0, OPTION_COUNT - 1);
  }

  function mount(el, ctx) {
    injectStyles();
    if (ctx.words.length < OPTION_COUNT) { el.innerHTML = '<div class="empty">Need at least ' + OPTION_COUNT + ' words in the current filters to play MCQ Blitz — widen them.</div>'; return; }

    el.innerHTML =
      '<div class="vl-mq-dirrow">' +
        '<button type="button" class="vl-pill" data-dir="es-en">🇪🇸 → 🇬🇧 See Spanish, pick English</button>' +
        '<button type="button" class="vl-pill" data-dir="en-es">🇬🇧 → 🇪🇸 See English, pick Spanish</button>' +
      '</div>' +
      '<div class="vl-mq-stats" id="vlMqStats"></div><div id="vlMqArea"></div>';

    const dirBtns = el.querySelectorAll('[data-dir]');
    function syncDirButtons() { dirBtns.forEach(b => b.classList.toggle('active', b.dataset.dir === getDir())); }
    dirBtns.forEach(b => b.addEventListener('click', () => { setDir(b.dataset.dir); syncDirButtons(); startRound(); }));
    syncDirButtons();

    const area = el.querySelector('#vlMqArea');
    let deck = [], index = 0, correctCount = 0, wrongCount = 0, combo = 0;

    function startRound() {
      deck = ctx.smartShuffle(ctx.words).slice(0, Math.min(ROUND_SIZE, ctx.words.length));
      index = 0; correctCount = 0; wrongCount = 0; combo = 0;
      renderQuestion();
    }

    function renderStats() {
      el.querySelector('#vlMqStats').innerHTML =
        '<span>Word <b>' + (index + 1) + '</b>/' + deck.length + '</span>' +
        '<span><b>' + correctCount + '</b> correct</span>' +
        '<span><b>' + wrongCount + '</b> wrong</span>' +
        (combo >= 3 ? '<span>🔥 <b>' + combo + '</b> streak</span>' : '');
    }

    function renderQuestion() {
      if (activeAdvanceTimer) { clearTimeout(activeAdvanceTimer); activeAdvanceTimer = null; }
      if (index >= deck.length) { renderSummary(); return; }
      renderStats();
      const w = deck[index];
      const dir = getDir();
      const promptText = dir === 'es-en' ? w.headword : ctx.simplifyGloss(w.english);

      const distractors = pickDistractors(w, ctx);
      const options = shuffleArr([w, ...distractors]);
      const correctIdx = options.indexOf(w);

      area.innerHTML =
        '<div class="vl-mq-prompt">' +
          (dir === 'es-en' ? '<button type="button" class="vl-mq-say" id="vlMqSay" aria-label="Listen">🔊</button><br>' : '') +
          '<div class="vl-mq-word">' + esc(promptText) + '</div>' +
        '</div>' +
        '<div class="vl-mq-options" id="vlMqOptions">' +
          options.map((o, i) => '<button type="button" class="vl-mq-opt" data-i="' + i + '">' +
            esc(dir === 'es-en' ? ctx.simplifyGloss(o.english) : o.headword) + '</button>').join('') +
        '</div>';

      if (dir === 'es-en') area.querySelector('#vlMqSay').addEventListener('click', () => ctx.ui.speak(w.say));
      area.querySelectorAll('.vl-mq-opt').forEach(btn => btn.addEventListener('click', () => choose(+btn.dataset.i, correctIdx, w)));
    }

    function choose(chosenIdx, correctIdx, w) {
      const buttons = area.querySelectorAll('.vl-mq-opt');
      buttons.forEach(b => b.disabled = true);
      const correct = chosenIdx === correctIdx;
      buttons[correctIdx].classList.add('correct');
      if (!correct) buttons[chosenIdx].classList.add('wrong');

      const next = ctx.status.bump(w.id, correct);
      if (correct) {
        correctCount++; combo++;
        ctx.ui.playSound('correct');
        if (combo > 0 && combo % 5 === 0) { ctx.ui.playSound('combo'); ctx.ui.comboToast(combo); }
        ctx.ui.xpToast(next === 'green' ? 3 : 1);
      } else {
        wrongCount++; combo = 0;
        ctx.ui.playSound('wrong');
      }
      renderStats();
      activeAdvanceTimer = setTimeout(() => { index++; renderQuestion(); }, 1100);
    }

    function renderSummary() {
      const perfect = wrongCount === 0 && correctCount > 0;
      if (perfect) ctx.ui.confetti(50);
      area.innerHTML = '<div class="vl-mq-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">' + (perfect ? '🌟 Flawless round!' : 'Round complete!') + '</h3>' +
        '<p class="muted">' + correctCount + ' correct · ' + wrongCount + ' wrong</p>' +
        '<button type="button" class="vl-btn" id="vlMqAgain" style="margin-top:14px;">Go again</button>' +
      '</div>';
      el.querySelector('#vlMqStats').innerHTML = '';
      area.querySelector('#vlMqAgain').addEventListener('click', () => { ctx.complete(); startRound(); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    startRound();
  }

  window.VocabLab.registerTool('mcq-blitz', {
    title: 'MCQ Blitz',
    icon: '🎯',
    mount: mount,
    unmount() { if (activeAdvanceTimer) clearTimeout(activeAdvanceTimer); },
  });

  // ── Node export (tests only) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROUND_SIZE, OPTION_COUNT, pickDistractors, shuffleArr };
  }
})();
