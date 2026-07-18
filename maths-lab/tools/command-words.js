// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Command Words (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'command-words'. Teaches the OCR command/instruction
// words used across Add Maths papers and exactly what each demands in an
// answer. Two rounds, both MCQ:
//   (A) MATCH    — given a command word ("Show that", "Hence", "Verify"…)
//                   pick what it requires from 4 options.
//   (B) CLASSIFY — given a short question stem, identify the command
//                   word in play / the depth of response it demands.
//
// Content is authored for page '11-1-command-words-and-detailed-reasoning'
// (keyed by pageId per the ADM-C convention so pages never need editing).
//
// Pure logic (item bank + option building/marking + the answer-length
// self-check) lives at module scope with no DOM access, so it can be
// unit-tested under Node — see the module.exports guard at the bottom
// (never runs in the browser). LaTeX backslashes are DOUBLED in this
// source; delimiters \(...\) / \[...\] only (ADDMATHS-CONTENT-PLAN §8.4).
//
// MCQ answer-quality rule (platform-wide, enforced here): the correct
// option must never be the strictly longest option in its item — every
// item is authored with at least one same-length-or-longer distractor,
// and optionLengthRuleOK()/auditItemBank() assert this for every item.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── small helpers ──────────────────────────────────────────────
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Answer-quality self-check: the correct option's text must NOT be
  // strictly longer than every distractor — at least one distractor must
  // be the same length or longer, so students can't win by picking the
  // longest option on sight.
  function optionLengthRuleOK(correctText, distractorTexts) {
    const correctLen = correctText.length;
    return distractorTexts.some(d => d.length >= correctLen);
  }

  // Builds the shuffled { id, text, correct } option list for one item.
  // Pure — no DOM — so it can be exercised directly under Node.
  function buildOptions(item) {
    const opts = [{ id: 'correct', text: item.correct, correct: true }]
      .concat(item.distractors.map((d, i) => ({ id: 'd' + i, text: d, correct: false })));
    return shuffle(opts);
  }

  function isCorrectChoice(optId) { return optId === 'correct'; }

  // Checks every item in a bank against the answer-length rule. Returns
  // an array of failures (empty = all items pass).
  function auditItemBank(items) {
    const failures = [];
    items.forEach(item => {
      if (!optionLengthRuleOK(item.correct, item.distractors)) failures.push(item.id);
    });
    return failures;
  }

  // ── Content: MATCH round ─────────────────────────────────────────
  // "What does this command word require in your answer?" One item per
  // OCR command word; every distractor is a real, plausible demand that
  // students commonly confuse the word with (not filler).

  const MATCH_ITEMS = [
    {
      id: 'state',
      word: 'State / Write down',
      correct: 'Give the result straight away — no working or justification needed',
      distractors: [
        'Substitute a given value in and confirm both sides come out equal',
        'Use algebraic steps to reach the exact result printed in the question',
        'Give reasons in words for why a statement is true',
      ],
      tip: 'e.g. "Write down the value of \\( f(0) \\)." — read it off, no calculation shown.',
    },
    {
      id: 'find',
      word: 'Find / Calculate',
      correct: 'Carry out the working needed and give a specific numeric or algebraic answer',
      distractors: [
        'Draw an approximate diagram showing the key features of a curve',
        'Use the answer or method already found in an earlier part of the question as your starting point here',
        'Give the result straight away with no working shown',
      ],
      tip: 'e.g. "Find the coordinates of the turning point." — you must show the working that gets you there.',
    },
    {
      id: 'show-that',
      word: 'Show that',
      correct: 'Use clear algebraic steps to reach the exact result printed in the question',
      distractors: [
        'Substitute one specific value into the expression and confirm that it satisfies the given statement',
        'Give a general argument that holds true for every possible case',
        'Give the result straight away with no working shown',
      ],
      tip: 'e.g. "Show that \\( x=1 \\) is a root of \\( x^3-1 \\)." — substitute AND write the explicit conclusion \\( f(1)=0 \\), not just the number.',
    },
    {
      id: 'prove',
      word: 'Prove',
      correct: 'Give a rigorous, general argument that holds true for every possible case',
      distractors: [
        'Use clear algebraic steps to reach the exact result printed in the question',
        'Substitute one specific value in and confirm it satisfies the statement',
        'Draw an approximate diagram showing the key features of a curve',
      ],
      tip: 'e.g. "Prove that \\( n^2+n \\) is even for every integer \\( n \\)." — checking a few numbers is not enough; the argument must cover ALL n.',
    },
    {
      id: 'hence',
      word: 'Hence',
      correct: 'Use the result or method from the previous part as your starting point',
      distractors: [
        'Start completely from scratch, ignoring any earlier part of the question',
        'Give a rigorous, general argument that holds true for every possible case',
        'Draw an approximate diagram showing the key features of a curve',
      ],
      tip: 'e.g. "Hence solve \\( x^2-5x+6=0 \\)." — if the previous part gave you the factorised form, reuse it; re-deriving it from zero loses marks for method.',
    },
    {
      id: 'verify',
      word: 'Verify',
      correct: 'Substitute the given value in and confirm it satisfies the statement',
      distractors: [
        'Use clear algebraic steps to derive the result from scratch, showing every stage',
        'Use the result or method from the previous part as your starting point',
        'Give reasons in words for why a statement is true',
      ],
      tip: 'e.g. "Verify that \\( x=2 \\) satisfies \\( x^3-3x^2+4=0 \\)." — plug in and show it equals 0; you do not need to solve the cubic first.',
    },
    {
      id: 'explain',
      word: 'Explain',
      correct: 'Give reasons or justification for a statement, not just the bare fact',
      distractors: [
        'Give the result straight away with no working or reasoning shown',
        'Carry out the working needed and give a specific numeric answer',
        'Substitute a specific value in and confirm it satisfies the statement',
      ],
      tip: 'e.g. "Explain why the discriminant being negative means no real roots." — a bare "because it is negative" is not enough; say WHY that stops real roots existing.',
    },
    {
      id: 'sketch',
      word: 'Sketch',
      correct: 'Draw an approximate diagram showing the key features, not an accurate plot',
      distractors: [
        'Use squared paper and a ruler to plot an exact, to-scale graph',
        'Carry out the working needed and give a specific numeric answer',
        'Give a rigorous, general argument that holds true for every possible case, not just one example',
      ],
      tip: 'e.g. "Sketch \\( y=x^2-4 \\)." — show the shape, the intercepts and the turning point; no graph paper or table of values needed.',
    },
  ];

  // ── Content: CLASSIFY round ───────────────────────────────────────
  // Given a short question stem, identify what depth of response is
  // expected — the distractors are the exact word-for-word confusions
  // students make between neighbouring command words.

  const CLASSIFY_ITEMS = [
    {
      id: 'classify-showthat-factorise',
      stem: 'Show that \\( 2x^2 + 5x - 3 = (2x-1)(x+3) \\).',
      correct: 'This is ‘Show that’ — expand or factorise with full algebraic steps until it matches exactly',
      distractors: [
        'This is ‘Verify’ — just substitute one value of x into both sides and confirm they come out equal',
        'This is ‘Hence’ — use the answer to an earlier part of the question as your starting point here',
        'This is ‘State’ — simply write down that the two expressions are equal with no working shown',
      ],
      tip: 'A single value matching on both sides only checks that ONE case works — "show that" needs the general algebraic identity, not a spot-check.',
    },
    {
      id: 'classify-verify-root',
      stem: 'Verify that \\( x = 2 \\) satisfies \\( x^3 - 3x^2 + 4 = 0 \\).',
      correct: 'This is ‘Verify’ — substitute \\( x=2 \\) into the expression and show it evaluates to 0',
      distractors: [
        'This is ‘Prove’ — give a general argument valid for every root of the cubic, not just \\( x=2 \\)',
        'This is ‘Show that’ — derive the full factorised form of the cubic using algebraic long division',
        'This is ‘Sketch’ — draw an approximate graph of the cubic to see roughly where it crosses zero',
      ],
      tip: '"Verify" only asks you to confirm ONE given value works — solving the whole cubic from nothing is unnecessary extra work.',
    },
    {
      id: 'classify-hence-tangent',
      stem: 'The gradient of the curve at \\( x = 1 \\) is 4. Hence find the equation of the tangent at this point.',
      correct: 'This is ‘Hence’ — use the gradient value 4 you were just given, together with the point',
      distractors: [
        'This is ‘Prove’ — give a general rule for the tangent at any point on the curve, not just \\( x=1 \\)',
        'This is ‘Verify’ — substitute \\( x=1 \\) back into the original curve equation and check it matches',
        'This is ‘Explain’ — write a few sentences justifying why the gradient equals 4',
      ],
      tip: 'Recomputing the gradient after being told "hence" wastes time and can lose you the method mark, which is awarded for USING the given fact.',
    },
    {
      id: 'classify-prove-even',
      stem: 'Prove that \\( n^2 + n \\) is even for every positive integer \\( n \\).',
      correct: 'This is ‘Prove’ — a general algebraic argument covering every possible value of n is required',
      distractors: [
        'This is ‘Verify’ — try a couple of values of n and confirm the result comes out even each time',
        'This is ‘Find’ — calculate the numeric value of \\( n^2+n \\) for one given value of n',
        'This is ‘State’ — simply write down that the expression is always even, with no reasoning needed',
      ],
      tip: 'Factorise as \\( n(n+1) \\): one of two consecutive integers is always even, so the product is always even — that general reasoning is what "prove" needs.',
    },
    {
      id: 'classify-sketch-graph',
      stem: 'Sketch the graph of \\( y = x^2 - 4 \\), showing the coordinates where the curve crosses the axes.',
      correct: 'This is ‘Sketch’ — draw an approximate curve with the correct shape and label the intercepts',
      distractors: [
        'This is ‘Find’ — calculate the exact turning point and intercepts as coordinates, with no drawing required',
        'This is ‘Prove’ — give a general argument that the curve always crosses the x-axis at those points',
        'This is ‘Explain’ — write sentences describing the shape of the curve without drawing anything',
      ],
      tip: 'A sketch still needs correct shape + labelled intercepts/turning point — it is not a bare drawing, but it does not need to be to scale.',
    },
  ];

  const PAGE_CONTENT = {
    '11-1-command-words-and-detailed-reasoning': { match: MATCH_ITEMS, classify: CLASSIFY_ITEMS },
  };
  const DEFAULT_PAGE_ID = '11-1-command-words-and-detailed-reasoning';
  function contentForPage(pageId) { return PAGE_CONTENT[pageId] || PAGE_CONTENT[DEFAULT_PAGE_ID]; }

  // ── DOM rendering ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('mathslab-cmdwords-style')) return;
    const style = document.createElement('style');
    style.id = 'mathslab-cmdwords-style';
    style.textContent =
      '.mathslab-cmdwords-intro{color:var(--mid);font-size:14px;margin:0 0 16px}' +
      '.mathslab-cmdwords-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.mathslab-cmdwords-tab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 14px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.mathslab-cmdwords-tab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-cmdwords-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-cmdwords-progress{color:var(--mid);font-size:13px;margin:0 0 8px}' +
      '.mathslab-cmdwords-prompt{font-size:16px;font-weight:600;margin:0 0 14px;line-height:1.5}' +
      '.mathslab-cmdwords-options{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}' +
      '.mathslab-cmdwords-options button{min-height:44px;text-align:left;background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:8px;padding:10px 14px;font-family:inherit;font-size:14px;line-height:1.4;cursor:pointer}' +
      '.mathslab-cmdwords-options button.cw-right{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-cmdwords-options button.cw-chosen-wrong{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-cmdwords-options button:disabled{cursor:default;opacity:.85}' +
      '.mathslab-cmdwords-options button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-cmdwords-tip{margin-top:10px;padding:10px 12px;background:var(--cream);border:1px solid var(--border);border-radius:8px;font-size:14px;color:var(--ink);line-height:1.6}' +
      '.mathslab-cmdwords-score{font-size:16px;font-weight:600;margin-bottom:12px}';
    document.head.appendChild(style);
  }

  const MODE_DEFS = [
    { id: 'match', label: 'Match the command word', promptOf: item => 'What does ‘' + item.word + '’ require in your answer?' },
    { id: 'classify', label: 'Classify the question', promptOf: item => item.stem },
  ];

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const content = contentForPage(ctx.pageId);
    const modes = MODE_DEFS.map(m => ({ def: m, items: content[m.id] || [] })).filter(m => m.items.length);
    if (!modes.length) { el.innerHTML = '<p class="mathslab-error">No command-word content for this page yet.</p>'; return; }

    const root = document.createElement('div');
    root.className = 'mathslab-cmdwords';
    root.appendChild(ui.el('<p class="mathslab-cmdwords-intro">Learn exactly what each OCR command word demands, then prove it: match the word to its requirement, and spot it inside real question stems.</p>'));

    const tabBar = document.createElement('div');
    tabBar.className = 'mathslab-cmdwords-tabs';
    const body = document.createElement('div');
    root.appendChild(tabBar);
    root.appendChild(body);
    el.appendChild(root);

    let round = null;

    function currentStreak() { return ctx.store.get('streak', 0); }
    function bestStreak() { return ctx.store.get('best', 0); }
    function registerAnswer(correct) {
      let streak = ctx.store.get('streak', 0);
      let best = ctx.store.get('best', 0);
      streak = correct ? streak + 1 : 0;
      if (streak > best) best = streak;
      ctx.store.set('streak', streak);
      ctx.store.set('best', best);
    }

    function setActiveTabUI(activeId) {
      Array.prototype.forEach.call(tabBar.children, (btn, i) => btn.classList.toggle('active', modes[i].def.id === activeId));
    }

    function progressText() {
      return 'Question ' + (round.index + 1) + ' of ' + round.total +
        ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')';
    }

    function startRound(mode) {
      setActiveTabUI(mode.def.id);
      round = { mode: mode, items: shuffle(mode.items), index: 0, score: 0, total: mode.items.length };
      renderQuestion();
    }

    function renderQuestion() {
      body.innerHTML = '';
      if (round.index >= round.total) { renderRoundDone(); return; }

      const item = round.items[round.index];
      const options = buildOptions(item);

      const wrap = document.createElement('div');
      wrap.className = 'mathslab-cmdwords-q';

      const progress = document.createElement('p');
      progress.className = 'mathslab-cmdwords-progress';
      progress.textContent = progressText();
      wrap.appendChild(progress);

      const promptEl = document.createElement('p');
      promptEl.className = 'mathslab-cmdwords-prompt';
      promptEl.innerHTML = round.mode.def.promptOf(item);
      wrap.appendChild(promptEl);

      const optWrap = document.createElement('div');
      optWrap.className = 'mathslab-cmdwords-options';
      wrap.appendChild(optWrap);

      const feedback = document.createElement('div');
      feedback.className = 'mathslab-feedback';
      wrap.appendChild(feedback);

      const tipEl = document.createElement('div');
      tipEl.className = 'mathslab-cmdwords-tip';
      tipEl.style.display = 'none';
      wrap.appendChild(tipEl);

      const nextBtn = ui.btn('Next', 'secondary');
      nextBtn.style.display = 'none';
      wrap.appendChild(nextBtn);

      let answered = false;
      const buttons = options.map(opt => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = opt.text;
        b.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const correct = isCorrectChoice(opt.id);
          buttons.forEach(pair => {
            pair.btn.disabled = true;
            if (isCorrectChoice(pair.opt.id)) pair.btn.classList.add('cw-right');
            else if (pair.opt.id === opt.id) pair.btn.classList.add('cw-chosen-wrong');
          });
          registerAnswer(correct);
          if (correct) round.score++;
          ui.feedback(feedback, correct, correct ? 'Correct!' : 'Not quite — here’s what it actually demands:');
          tipEl.innerHTML = item.tip;
          tipEl.style.display = '';
          ui.renderMath(wrap);
          progress.textContent = progressText();
          nextBtn.style.display = '';
          nextBtn.focus();
        });
        optWrap.appendChild(b);
        return { btn: b, opt: opt };
      });

      nextBtn.addEventListener('click', () => { round.index++; renderQuestion(); });

      body.appendChild(wrap);
      ui.renderMath(wrap);
    }

    function renderRoundDone() {
      body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'mathslab-cmdwords-done';
      const heading = document.createElement('p');
      heading.className = 'mathslab-cmdwords-score';
      heading.textContent = 'Round complete: ' + round.score + ' / ' + round.total +
        ' correct. Streak ' + currentStreak() + ' (best ' + bestStreak() + ').';
      wrap.appendChild(heading);
      const again = ui.btn('Play again');
      again.addEventListener('click', () => startRound(round.mode));
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ mode: round.mode.def.id, score: round.score });
    }

    modes.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mathslab-cmdwords-tab';
      b.textContent = m.def.label;
      b.addEventListener('click', () => startRound(m));
      tabBar.appendChild(b);
    });

    startRound(modes[0]);
  }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('command-words', { title: 'Command Words', icon: '🗝️', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      shuffle, optionLengthRuleOK, buildOptions, isCorrectChoice, auditItemBank,
      MATCH_ITEMS, CLASSIFY_ITEMS, PAGE_CONTENT, DEFAULT_PAGE_ID, contentForPage,
    };
  }
})();
