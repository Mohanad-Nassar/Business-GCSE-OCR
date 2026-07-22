// ══════════════════════════════════════════════════════════════
// FLASHCARDS+ — vocab.js mode module (lazy-loaded by vocab.js's loadModule)
//
// The existing flashcard engine's UX (flip, 🔊 audio, Red/Amber/Green self-
// grade) ported to the whole vocab wordbank, plus the owner's requested
// addition: an opt-in "Type it first" toggle that asks for the English
// meaning BEFORE the flip, so the self-grade is informed by an actual
// auto-checked attempt rather than just "did I recognise it on sight".
//
// "Smart shuffle": red/amber (not-yet-known) words are given priority in the
// deck order — a stable sort by status after an initial random shuffle, so
// weak words surface more often without a hard SRS scheduler.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const TYPEFIRST_KEY = 'geo_vocablab_typefirst';
  function getTypeFirst() { try { return localStorage.getItem(TYPEFIRST_KEY) === '1'; } catch (e) { return false; } }
  function setTypeFirst(v) { try { localStorage.setItem(TYPEFIRST_KEY, v ? '1' : '0'); } catch (e) {} }

  function injectStyles() {
    if (document.getElementById('vlFcStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlFcStyles';
    s.textContent = `
      .vl-fc-toggle { display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--mid); margin-bottom:14px; }
      .vl-fc-card { background:var(--cream); border:2px solid var(--border); border-radius:14px; padding:36px 28px; text-align:center; min-height:140px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; cursor:pointer; }
      .vl-fc-term { font-family:'Playfair Display',serif; font-weight:700; font-size:22px; color:var(--ink); }
      .vl-fc-def { font-size:15px; color:var(--mid); display:none; }
      .vl-fc-card.flipped .vl-fc-def { display:block; }
      .vl-fc-card.flipped .vl-fc-hint { display:none; }
      .vl-fc-hint { font-size:11.5px; color:var(--mid); font-style:italic; }
      .vl-fc-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; margin-top:4px; }
      .vl-fc-typebox { display:flex; gap:8px; margin:14px 0; }
      .vl-fc-typebox input { flex:1; padding:9px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:14px; background:var(--card-bg); color:var(--ink); }
      .vl-fc-typebox input.correct { border-color:var(--success); }
      .vl-fc-typebox input.wrong { border-color:var(--wrong); }
      .vl-fc-checkmsg { font-size:12.5px; margin:-6px 0 10px; min-height:16px; }
      .vl-fc-checkmsg.correct { color:var(--success); }
      .vl-fc-checkmsg.wrong { color:var(--wrong); }
      .vl-fc-nav { display:flex; justify-content:center; gap:10px; margin-top:18px; }
      .vl-fc-grade { border:none; border-radius:8px; padding:10px 20px; font-weight:700; font-size:13px; cursor:pointer; color:#fff; }
      .vl-fc-grade.red { background:#c84b31; }
      .vl-fc-grade.amber { background:#e9c46a; color:#4a3800; }
      .vl-fc-grade.green { background:#2d7a4f; }
      .vl-fc-progress { text-align:center; font-family:'DM Mono',monospace; font-size:11.5px; color:var(--mid); margin-bottom:10px; }
      .vl-fc-summary { text-align:center; padding:20px; }
    `;
    document.head.appendChild(s);
  }

  function mount(el, ctx) {
    injectStyles();
    if (!ctx.words.length) { el.innerHTML = '<div class="empty">No words match the current filters — widen them to build a deck.</div>'; return; }

    const deck = ctx.smartShuffle(ctx.words);
    let index = 0, flipped = false, typedOk = null;
    let graded = { red: 0, amber: 0, green: 0 };

    el.innerHTML =
      '<label class="vl-fc-toggle"><input type="checkbox" id="vlFcTypeFirst"> Type the English meaning before flipping</label>' +
      '<div class="vl-fc-progress" id="vlFcProgress"></div>' +
      '<div id="vlFcArea"></div>';

    const typeFirstBox = el.querySelector('#vlFcTypeFirst');
    typeFirstBox.checked = getTypeFirst();
    typeFirstBox.addEventListener('change', () => { setTypeFirst(typeFirstBox.checked); renderCard(); });

    const area = el.querySelector('#vlFcArea');

    function renderProgress() {
      el.querySelector('#vlFcProgress').textContent = 'Card ' + (index + 1) + ' of ' + deck.length;
    }

    function renderCard() {
      if (index >= deck.length) { renderSummary(); return; }
      renderProgress();
      const w = deck[index];
      flipped = false; typedOk = null;
      const typeFirst = getTypeFirst();

      area.innerHTML =
        (typeFirst ? '<div class="vl-fc-typebox"><input type="text" id="vlFcInput" placeholder="Type the English meaning…" autocomplete="off"><button type="button" class="vl-btn" id="vlFcCheckBtn">Check</button></div><div class="vl-fc-checkmsg" id="vlFcCheckMsg"></div>' : '') +
        '<div class="vl-fc-card" id="vlFcCard">' +
          '<button type="button" class="vl-fc-say" id="vlFcSay" aria-label="Listen">🔊</button>' +
          '<div class="vl-fc-term">' + esc(w.headword) + '</div>' +
          '<div class="vl-fc-hint">Tap to reveal</div>' +
          '<div class="vl-fc-def">' + esc(w.english) + '</div>' +
        '</div>' +
        '<div class="vl-fc-nav" id="vlFcNav" style="display:none;">' +
          '<button type="button" class="vl-fc-grade red" data-g="red">😕 Still learning</button>' +
          '<button type="button" class="vl-fc-grade amber" data-g="amber">🙂 Getting there</button>' +
          '<button type="button" class="vl-fc-grade green" data-g="green">😄 Know it</button>' +
        '</div>';

      area.querySelector('#vlFcSay').addEventListener('click', (e) => { e.stopPropagation(); ctx.ui.speak(w.say); });
      const card = area.querySelector('#vlFcCard');
      card.addEventListener('click', () => flip());

      if (typeFirst) {
        const input = area.querySelector('#vlFcInput');
        const checkBtn = area.querySelector('#vlFcCheckBtn');
        const msg = area.querySelector('#vlFcCheckMsg');
        const doCheck = () => {
          const res = ctx.fuzzyMatch(input.value, w.english);
          typedOk = res.correct;
          input.classList.toggle('correct', res.correct);
          input.classList.toggle('wrong', !res.correct);
          msg.className = 'vl-fc-checkmsg ' + (res.correct ? 'correct' : 'wrong');
          msg.textContent = res.correct ? (res.perfect ? '✓ Correct!' : '✓ Correct (close enough)!') : '✗ Not quite — flip to see the answer.';
          ctx.ui.playSound(res.correct ? 'correct' : 'wrong');
          flip();
        };
        checkBtn.addEventListener('click', doCheck);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doCheck(); });
        input.focus();
      }
    }

    function flip() {
      if (flipped) return;
      flipped = true;
      area.querySelector('#vlFcCard').classList.add('flipped');
      area.querySelector('#vlFcNav').style.display = 'flex';
      area.querySelectorAll('.vl-fc-grade').forEach(b => b.addEventListener('click', () => grade(b.dataset.g)));
    }

    function grade(g) {
      const w = deck[index];
      ctx.status.set(w.id, g);
      graded[g]++;
      if (g === 'green') ctx.ui.playSound('correct'); else if (g === 'red') ctx.ui.playSound('wrong');
      index++;
      renderCard();
    }

    function renderSummary() {
      const perfect = graded.red === 0 && graded.amber === 0;
      if (perfect) ctx.ui.confetti(50);
      area.innerHTML = '<div class="vl-fc-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">' + (perfect ? '🌟 Perfect deck!' : 'Deck complete!') + '</h3>' +
        '<p class="muted">' + graded.green + ' known · ' + graded.amber + ' practising · ' + graded.red + ' still learning</p>' +
        '<button type="button" class="vl-btn" id="vlFcAgain" style="margin-top:14px;">Go again</button>' +
      '</div>';
      el.querySelector('#vlFcProgress').textContent = '';
      area.querySelector('#vlFcAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    renderCard();
  }

  window.VocabLab.registerTool('flashcards-plus', {
    title: 'Flashcards+',
    icon: '🃏',
    mount: mount,
    unmount() {},
  });
})();
