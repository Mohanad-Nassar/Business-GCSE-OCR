// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Step Solver (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'step-solver'. Adapts the cs-lab Parsons-problem idiom
// (cs-lab/tools/parsons.js) from "reorder shuffled program lines" to
// "reorder the shuffled steps of a worked maths solution": every step of a
// worked example is shown in a SHUFFLED order; the learner uses Up/Down move
// buttons (no HTML5 drag — simple + keyboard accessible) to put the steps
// back into the correct logical order, then checks. Marking is order-only,
// exactly like parsons' isSolved(): a step is "right" only if it sits in its
// correct position, never scored individually. Once every step is in the
// correct position the fully worked solution (with its final-answer note) is
// revealed and ctx.complete() fires. A "Reveal solution" hint is available
// any time so a stuck learner is never blocked.
//
// Pure logic (shuffle / order-checking / move) lives at module scope with no
// DOM access, so it is unit-testable under plain Node — see the
// module.exports guard at the bottom (never runs in the browser). Problems
// below are original practice items written for this tool, NOT taken from
// any real OCR past paper. LaTeX backslashes are DOUBLED in this source;
// delimiters \(...\) / \[...\] only (ADDMATHS-CONTENT-PLAN §8.4).
// ══════════════════════════════════════════════════════════════

(function (root) {
  'use strict';

  // ── Pure logic (unit-tested) ────────────────────────────────────

  // Fisher-Yates shuffle. Returns a NEW array; does not mutate `arr`.
  // `rnd` is injectable so tests/replays can pass a deterministic generator.
  function shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function isIdentityOrder(order) {
    for (let i = 0; i < order.length; i++) {
      if (order[i] !== i) return false;
    }
    return true;
  }

  // Returns a shuffled permutation of [0..n-1] that is GUARANTEED to differ
  // from the correct (identity) order — the whole point of this tool is that
  // the learner always has real reordering work to do. Retries a bounded
  // number of times, then falls back to a deterministic single swap so it
  // can never spin forever (matters for n <= 1 too, where it's a no-op).
  function shuffledStepOrder(n, rnd) {
    const identity = [];
    for (let i = 0; i < n; i++) identity.push(i);
    if (n < 2) return identity;
    let order = shuffle(identity, rnd);
    for (let tries = 0; tries < 30 && isIdentityOrder(order); tries++) {
      order = shuffle(identity, rnd);
    }
    if (isIdentityOrder(order)) {
      order = order.slice();
      const tmp = order[0]; order[0] = order[1]; order[1] = tmp;
    }
    return order;
  }

  // `order` holds original step indices in their CURRENT display position.
  // Correct order-only marking: position i is right iff order[i] === i.
  function positionCorrectness(order) {
    return order.map((originalIndex, i) => originalIndex === i);
  }

  function isCorrectOrder(order) {
    return positionCorrectness(order).every(Boolean);
  }

  // Pure, immutable move: swap the item at `index` with its neighbour in
  // direction `dir` (-1 = up, +1 = down). Out-of-range moves are a no-op
  // (returns an equal-valued array) so callers never need bounds checks.
  function moveStep(order, index, dir) {
    const j = index + dir;
    if (j < 0 || j >= order.length || index < 0 || index >= order.length) return order.slice();
    const out = order.slice();
    const tmp = out[index]; out[index] = out[j]; out[j] = tmp;
    return out;
  }

  // ── Solution content (original practice items, not past-paper) ─────
  // pageId -> array of { id, title, problem (LaTeX), steps: [LaTeX, ...] }
  // Steps are listed here in their CORRECT order; the UI shuffles them.

  const SOLUTIONS = {
    '1-3-quadratics-and-completing-the-square': [
      {
        id: 'complete-square-example',
        title: 'Solve by completing the square',
        problem: 'Solve \\( x^2 - 6x + 7 = 0 \\) by completing the square, giving your answers in exact surd form.',
        steps: [
          '\\( x^2 - 6x + 7 = 0 \\)',
          'Halve the coefficient of \\( x \\) (\\( -6 \\div 2 = -3 \\)) and complete the square: \\( (x-3)^2 - 9 + 7 = 0 \\)',
          'Simplify the constants: \\( (x-3)^2 - 2 = 0 \\)',
          'Add 2 to both sides: \\( (x-3)^2 = 2 \\)',
          'Square root both sides: \\( x - 3 = \\pm\\sqrt{2} \\)',
          'Add 3 to both sides: \\( x = 3 \\pm \\sqrt{2} \\)',
        ],
      },
      {
        id: 'quad-formula-example',
        title: 'Solve using the quadratic formula',
        problem: 'Solve \\( 2x^2 + 3x - 5 = 0 \\) using the quadratic formula.',
        steps: [
          'Identify the coefficients: \\( a = 2,\\ b = 3,\\ c = -5 \\)',
          'Write down the formula: \\( x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)',
          'Substitute the coefficients: \\( x = \\dfrac{-3 \\pm \\sqrt{3^2 - 4(2)(-5)}}{2(2)} \\)',
          'Simplify inside the square root: \\( x = \\dfrac{-3 \\pm \\sqrt{9 + 40}}{4} = \\dfrac{-3 \\pm \\sqrt{49}}{4} \\)',
          'Evaluate the square root: \\( \\sqrt{49} = 7 \\), so \\( x = \\dfrac{-3 \\pm 7}{4} \\)',
          'Split into the two solutions: \\( x = \\dfrac{4}{4} = 1 \\) or \\( x = \\dfrac{-10}{4} = -\\dfrac{5}{2} \\)',
        ],
      },
    ],
    '2-2-the-factor-theorem-and-cubics': [
      {
        id: 'factor-theorem-cubic',
        title: 'Factorise a cubic using the factor theorem',
        problem: 'Show that \\( (x-2) \\) is a factor of \\( f(x) = x^3 - 3x^2 - 4x + 12 \\), then fully factorise \\( f(x) \\).',
        steps: [
          'Evaluate \\( f(2) = 2^3 - 3(2)^2 - 4(2) + 12 \\)',
          'Simplify: \\( f(2) = 8 - 12 - 8 + 12 = 0 \\), so by the factor theorem \\( (x-2) \\) is a factor',
          'Write \\( f(x) = (x-2)(x^2 + bx + c) \\) for unknown \\( b \\) and \\( c \\)',
          'Match the \\( x^2 \\) coefficient: \\( b - 2 = -3 \\), so \\( b = -1 \\)',
          'Match the \\( x \\) coefficient (using this \\( b \\)): \\( c - 2b = -4 \\), so \\( c = -4 + 2(-1) = -6 \\)',
          'So \\( f(x) = (x-2)(x^2 - x - 6) \\)',
          'Factorise the quadratic and state the full factorisation: \\( x^2 - x - 6 = (x-3)(x+2) \\), so \\( f(x) = (x-2)(x-3)(x+2) \\)',
        ],
      },
      {
        id: 'solve-cubic-three-roots',
        title: 'Solve a cubic equation',
        problem: 'Solve \\( x^3 - 6x^2 + 11x - 6 = 0 \\).',
        steps: [
          'Try \\( x = 1 \\): \\( f(1) = 1 - 6 + 11 - 6 = 0 \\), so \\( (x-1) \\) is a factor',
          'Divide \\( f(x) \\) by \\( (x-1) \\): \\( f(x) = (x-1)(x^2 - 5x + 6) \\)',
          'Factorise the quadratic — find two numbers that multiply to \\( 6 \\) and add to \\( -5 \\): \\( -2 \\) and \\( -3 \\)',
          'So \\( x^2 - 5x + 6 = (x-2)(x-3) \\)',
          'Fully factorised: \\( f(x) = (x-1)(x-2)(x-3) \\)',
          'Set each factor to zero and solve: \\( x = 1,\\ 2,\\ 3 \\)',
        ],
      },
    ],
    '5-4-trigonometric-equations': [
      {
        id: 'linear-sine-equation',
        title: 'Solve a linear sine equation',
        problem: 'Solve \\( 2\\sin(x) - 1 = 0 \\) for \\( 0^\\circ \\le x \\le 360^\\circ \\).',
        steps: [
          'Rearrange: \\( 2\\sin(x) = 1 \\), so \\( \\sin(x) = \\dfrac{1}{2} \\)',
          'Find the principal value: \\( x = \\sin^{-1}\\left(\\dfrac{1}{2}\\right) = 30^\\circ \\)',
          'Sine is positive in the 1st and 2nd quadrants (CAST), so there are two solutions in range',
          'Second solution: \\( x = 180^\\circ - 30^\\circ = 150^\\circ \\)',
          'State both solutions in range: \\( x = 30^\\circ \\) or \\( x = 150^\\circ \\)',
        ],
      },
      {
        id: 'quadratic-cosine-equation',
        title: 'Solve a quadratic equation in cosine',
        problem: 'Solve \\( 2\\cos^2(x) - \\cos(x) - 1 = 0 \\) for \\( 0^\\circ \\le x \\le 360^\\circ \\).',
        steps: [
          'Let \\( c = \\cos(x) \\), so the equation becomes \\( 2c^2 - c - 1 = 0 \\)',
          'Factorise: \\( 2c^2 - c - 1 = (2c + 1)(c - 1) \\)',
          'Solve for \\( c \\): \\( c = -\\dfrac{1}{2} \\) or \\( c = 1 \\)',
          'For \\( \\cos(x) = 1 \\): \\( x = 0^\\circ \\) (equivalently \\( 360^\\circ \\))',
          'For \\( \\cos(x) = -\\dfrac{1}{2} \\), find the principal value: \\( x = 120^\\circ \\)',
          'Cosine is negative in the 2nd and 3rd quadrants, so the other solution is \\( x = 360^\\circ - 120^\\circ = 240^\\circ \\)',
          'State all solutions in range: \\( x = 0^\\circ,\\ 120^\\circ,\\ 240^\\circ \\)',
        ],
      },
    ],
    '7-4-reduction-to-linear-form': [
      {
        id: 'power-law-general',
        title: 'Reduce a power law to linear form',
        problem: 'The variables \\( x \\) and \\( y \\) satisfy \\( y = ax^n \\). By taking logs, show how plotting \\( \\log y \\) against \\( \\log x \\) gives a straight line, and state how \\( a \\) and \\( n \\) relate to its gradient and intercept.',
        steps: [
          'Start with \\( y = ax^n \\)',
          'Take logs of both sides: \\( \\log y = \\log(ax^n) \\)',
          'Use the product law for logs: \\( \\log y = \\log a + \\log(x^n) \\)',
          'Use the power law for logs: \\( \\log y = \\log a + n\\log x \\)',
          'Compare with \\( Y = mX + c \\) using \\( Y = \\log y \\) and \\( X = \\log x \\): the gradient \\( m = n \\) and the intercept \\( c = \\log a \\)',
        ],
      },
      {
        id: 'power-law-numeric',
        title: 'Find a and n from a graph',
        problem: 'Given that \\( y = ax^n \\), a graph of \\( \\log_{10} y \\) against \\( \\log_{10} x \\) is a straight line with gradient \\( 3 \\) and \\( y \\)-intercept \\( 0.7 \\). Find \\( a \\) and \\( n \\) (\\( a \\) to 2 s.f.).',
        steps: [
          'Taking logs of \\( y = ax^n \\) gives \\( \\log_{10} y = n\\log_{10} x + \\log_{10} a \\)',
          'Compare with \\( Y = mX + c \\): the gradient \\( m = n \\), so \\( n = 3 \\)',
          'The intercept \\( c = \\log_{10} a \\), so \\( \\log_{10} a = 0.7 \\)',
          'Solve for \\( a \\) by raising both sides as a power of 10: \\( a = 10^{0.7} \\)',
          'Evaluate: \\( a \\approx 5.0 \\) (2 s.f.)',
        ],
      },
    ],
  };

  // ── UI ───────────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById('mathslab-stepsolver-style')) return;
    const style = document.createElement('style');
    style.id = 'mathslab-stepsolver-style';
    style.textContent =
      '.mathslab-stepsolver-intro{color:var(--mid);font-size:14px;margin:0 0 14px}' +
      '.mathslab-stepsolver-picker{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}' +
      '.mathslab-stepsolver-chip{background:var(--card-bg);border:1px solid var(--border);border-radius:20px;color:var(--ink);font-family:inherit;font-size:13px;padding:8px 14px;min-height:44px;cursor:pointer}' +
      '.mathslab-stepsolver-chip:hover{border-color:var(--accent)}' +
      '.mathslab-stepsolver-chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-stepsolver-chip.active{border-color:var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--card-bg))}' +
      '.mathslab-stepsolver-chip.solved{border-color:var(--success);color:var(--success)}' +
      '.mathslab-stepsolver-stage h4{margin:0 0 4px;font-size:16px}' +
      '.mathslab-stepsolver-problem{margin:0 0 14px;padding:10px 14px;background:var(--cream);border:1px solid var(--border);border-radius:8px;font-size:15px;line-height:1.6}' +
      '.mathslab-stepsolver-hint{color:var(--mid);font-size:13px;margin:0 0 10px}' +
      '.mathslab-stepsolver-list{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:8px}' +
      '.mathslab-stepsolver-step{display:flex;align-items:center;gap:10px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px}' +
      '.mathslab-stepsolver-step.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-stepsolver-step.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-stepsolver-num{flex:0 0 auto;min-width:24px;font-family:"DM Mono","Consolas",monospace;font-weight:700;color:var(--mid)}' +
      '.mathslab-stepsolver-text{flex:1 1 auto;font-size:15px;line-height:1.5}' +
      '.mathslab-stepsolver-moves{flex:0 0 auto;display:flex;gap:6px}' +
      '.mathslab-stepsolver-movebtn{width:44px;height:44px;min-width:44px;min-height:44px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--ink);font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
      '.mathslab-stepsolver-movebtn:hover:not(:disabled){border-color:var(--accent)}' +
      '.mathslab-stepsolver-movebtn:disabled{opacity:.35;cursor:not-allowed}' +
      '.mathslab-stepsolver-movebtn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-stepsolver-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px}' +
      '.mathslab-stepsolver-reveal{margin-top:14px;padding:12px 14px;background:var(--cream);border:1px solid var(--border);border-radius:8px}' +
      '.mathslab-stepsolver-reveal ol{margin:0;padding-left:20px}' +
      '.mathslab-stepsolver-reveal li{font-size:14px;line-height:1.7;color:var(--ink)}';
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyle();
    const ui = ctx.ui;
    const pageId = ctx.pageId;
    const solutions = SOLUTIONS[pageId] || [];
    let solvedIds = ctx.store.get('solved', []);

    const wrap = ui.el(
      '<div class="mathslab-stepsolver">' +
      '<p class="mathslab-stepsolver-intro">Choose a worked solution below. Its steps are shuffled — use the ▲ ▼ buttons to put them back into the correct order, then check.</p>' +
      '<div class="mathslab-stepsolver-picker"></div>' +
      '<div class="mathslab-stepsolver-stage" style="display:none"></div>' +
      '</div>'
    );
    el.appendChild(wrap);

    if (!solutions.length) {
      const none = document.createElement('p');
      none.className = 'mathslab-stepsolver-hint';
      none.textContent = 'No step-by-step solutions are set up for this page yet.';
      wrap.appendChild(none);
      return;
    }

    const picker = wrap.querySelector('.mathslab-stepsolver-picker');
    const stage = wrap.querySelector('.mathslab-stepsolver-stage');
    const chips = {};

    solutions.forEach((sol, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mathslab-stepsolver-chip' + (solvedIds.indexOf(sol.id) !== -1 ? ' solved' : '');
      chip.textContent = (idx + 1) + '. ' + sol.title;
      chip.addEventListener('click', () => loadSolution(sol, chip));
      chips[sol.id] = chip;
      picker.appendChild(chip);
    });

    function loadSolution(sol, chip) {
      Object.keys(chips).forEach(id => chips[id].classList.toggle('active', id === sol.id));
      stage.style.display = '';
      stage.innerHTML = '';

      let order = shuffledStepOrder(sol.steps.length, Math.random);
      let solved = false;
      let fails = 0;

      const head = document.createElement('h4');
      head.textContent = sol.title;
      stage.appendChild(head);

      const problemEl = document.createElement('p');
      problemEl.className = 'mathslab-stepsolver-problem';
      problemEl.innerHTML = sol.problem;
      stage.appendChild(problemEl);
      ui.renderMath(problemEl); // problem statement carries LaTeX; render it (the
                                // step list renders separately in render() below)

      const hint = document.createElement('p');
      hint.className = 'mathslab-stepsolver-hint';
      hint.textContent = 'Steps ' + sol.steps.length + ' — arrange them from first to last.';
      stage.appendChild(hint);

      const list = document.createElement('ol');
      list.className = 'mathslab-stepsolver-list';
      stage.appendChild(list);

      const actions = document.createElement('div');
      actions.className = 'mathslab-stepsolver-actions';
      const checkBtn = ui.btn('Check order');
      const revealBtn = ui.btn('Reveal solution', 'secondary');
      const shuffleBtn = ui.btn('Shuffle again', 'secondary');
      const feedback = document.createElement('span');
      feedback.className = 'mathslab-feedback';
      actions.appendChild(checkBtn);
      actions.appendChild(revealBtn);
      actions.appendChild(shuffleBtn);
      actions.appendChild(feedback);
      stage.appendChild(actions);

      const revealBox = document.createElement('div');
      revealBox.className = 'mathslab-stepsolver-reveal';
      revealBox.style.display = 'none';
      stage.appendChild(revealBox);

      function render(focusIndex) {
        list.innerHTML = '';
        order.forEach((originalIndex, i) => {
          const li = document.createElement('li');
          li.className = 'mathslab-stepsolver-step';

          const num = document.createElement('span');
          num.className = 'mathslab-stepsolver-num';
          num.textContent = (i + 1) + '.';

          const text = document.createElement('span');
          text.className = 'mathslab-stepsolver-text';
          text.innerHTML = sol.steps[originalIndex];

          const moves = document.createElement('span');
          moves.className = 'mathslab-stepsolver-moves';
          const upBtn = document.createElement('button');
          upBtn.type = 'button';
          upBtn.className = 'mathslab-stepsolver-movebtn';
          upBtn.setAttribute('aria-label', 'Move step ' + (i + 1) + ' up');
          upBtn.textContent = '▲';
          upBtn.disabled = i === 0;
          const downBtn = document.createElement('button');
          downBtn.type = 'button';
          downBtn.className = 'mathslab-stepsolver-movebtn';
          downBtn.setAttribute('aria-label', 'Move step ' + (i + 1) + ' down');
          downBtn.textContent = '▼';
          downBtn.disabled = i === order.length - 1;

          upBtn.addEventListener('click', () => {
            order = moveStep(order, i, -1);
            solved = false;
            render(Math.max(0, i - 1));
          });
          downBtn.addEventListener('click', () => {
            order = moveStep(order, i, 1);
            solved = false;
            render(Math.min(order.length - 1, i + 1));
          });

          moves.appendChild(upBtn);
          moves.appendChild(downBtn);
          li.appendChild(num);
          li.appendChild(text);
          li.appendChild(moves);
          list.appendChild(li);
        });
        ui.renderMath(list);
        if (typeof focusIndex === 'number') {
          const items = list.querySelectorAll('.mathslab-stepsolver-movebtn');
          const target = items[focusIndex * 2]; // up-button of the target row
          if (target) target.focus();
        }
      }

      checkBtn.addEventListener('click', () => {
        const perStep = positionCorrectness(order);
        Array.prototype.forEach.call(list.children, (li, i) => {
          li.classList.toggle('correct', perStep[i]);
          li.classList.toggle('incorrect', !perStep[i]);
        });
        const ok = isCorrectOrder(order);
        if (ok) {
          solved = true;
          ui.feedback(feedback, true, 'Correct — every step is in the right place.');
          if (solvedIds.indexOf(sol.id) === -1) {
            solvedIds = solvedIds.concat([sol.id]);
            ctx.store.set('solved', solvedIds);
          }
          chip.classList.add('solved');
          showReveal();
          ctx.complete({ solution: sol.id });
        } else {
          fails += 1;
          const rightCount = perStep.filter(Boolean).length;
          ui.feedback(feedback, false, rightCount + ' of ' + perStep.length +
            ' steps are in the right position. Move the wrong ones and check again.');
        }
      });

      revealBtn.addEventListener('click', showReveal);

      shuffleBtn.addEventListener('click', () => {
        order = shuffledStepOrder(sol.steps.length, Math.random);
        solved = false;
        fails = 0;
        ui.feedback(feedback, true, '');
        feedback.textContent = '';
        revealBox.style.display = 'none';
        render();
      });

      function showReveal() {
        revealBox.style.display = '';
        revealBox.innerHTML = '<ol></ol>';
        const ol = revealBox.querySelector('ol');
        sol.steps.forEach(stepLatex => {
          const li = document.createElement('li');
          li.innerHTML = stepLatex;
          ol.appendChild(li);
        });
        ui.renderMath(revealBox);
      }

      render();
    }
  }

  // ── Registration (browser) ──────────────────────────────────────

  if (root.MathsLab && typeof root.MathsLab.registerTool === 'function') {
    root.MathsLab.registerTool('step-solver', {
      title: 'Step Solver',
      icon: '🧩',
      mount: mount,
    });
  }

  // ── Node export (tests only) ─────────────────────────────────────

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      shuffle: shuffle,
      isIdentityOrder: isIdentityOrder,
      shuffledStepOrder: shuffledStepOrder,
      positionCorrectness: positionCorrectness,
      isCorrectOrder: isCorrectOrder,
      moveStep: moveStep,
      SOLUTIONS: SOLUTIONS,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
