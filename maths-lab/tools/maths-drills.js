// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Maths Drills (C1, ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'maths-drills'. Infinite typed-answer practice for the
// Algebra Toolkit: expand, factorise, complete the square, quadratic formula,
// index laws, simplifying surds. Adapts the cs-lab drills engine
// (round/streak/store loop) but every prompt/working carries KaTeX LaTeX and
// answers are TYPED numeric fields (no MCQ → no guess-by-length exposure).
//
// Pure generator/marking logic lives at module scope with no DOM access, so it
// can be unit-tested under Node — see the module.exports guard at the bottom
// (never runs in the browser). LaTeX backslashes are DOUBLED in this source;
// delimiters \(...\) / \[...\] only (ADDMATHS-CONTENT-PLAN §8.4).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── small helpers ──────────────────────────────────────────────
  function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function pickNonZero(min, max) { let n = 0; while (n === 0) n = randInt(min, max); return n; }

  function normInt(raw) {
    const c = String(raw == null ? '' : raw).replace(/[,\s]+/g, '');
    if (!/^[+-]?\d+$/.test(c)) return null;
    return parseInt(c, 10);
  }
  function normNum(raw) {
    const c = String(raw == null ? '' : raw).replace(/[,\s]+/g, '');
    if (!/^[+-]?\d+(\.\d+)?$/.test(c)) return null;
    return parseFloat(c);
  }

  // LaTeX term builders (leading x^2 is always positive, so only the lower
  // terms need signed formatting).
  function addTerm(k, suffix) {
    if (k === 0) return '';
    const sign = k > 0 ? ' + ' : ' - ';
    const v = Math.abs(k);
    if (suffix === 'x' && v === 1) return sign + 'x';
    return sign + v + suffix;
  }
  function quadLatex(b, c) { return 'x^2' + addTerm(b, 'x') + addTerm(c, ''); }
  function signed(n) { return (n >= 0 ? '+ ' : '- ') + Math.abs(n); }

  // ── generators ─────────────────────────────────────────────────
  // Each returns { prompt (LaTeX HTML), fields:[{id,label,placeholder,check?}],
  //   working (LaTeX HTML), checkAll?(getVal)->bool }.
  // When checkAll is present it drives scoring (used for order-independent
  // answers like roots/factors); otherwise every field.check must pass.

  function genCompleteSquare() {
    const p = pickNonZero(-6, 6);
    const b = 2 * p;                 // even so p is an integer
    const c = randInt(-12, 12);
    const q = c - p * p;             // (x+p)^2 + q
    return {
      prompt: 'Write \\( ' + quadLatex(b, c) + ' \\) in the form \\( (x+p)^2 + q \\).<br>Enter the values of \\( p \\) and \\( q \\).',
      fields: [
        { id: 'p', label: 'p', placeholder: 'e.g. 3', check: raw => normInt(raw) === p },
        { id: 'q', label: 'q', placeholder: 'e.g. -20', check: raw => normInt(raw) === q },
      ],
      working: 'Halve the coefficient of \\( x \\): \\( ' + b + ' \\div 2 = ' + p + ' \\), so \\( p = ' + p + ' \\). ' +
        'Then \\( q = c - p^2 = ' + c + ' - ' + (p * p) + ' = ' + q + ' \\). ' +
        'Answer: \\( (x ' + signed(p) + ')^2 ' + signed(q) + ' \\).',
    };
  }

  function genFactoriseQuad() {
    const m = pickNonZero(-9, 9);
    const n = pickNonZero(-9, 9);
    const b = m + n, c = m * n;
    return {
      prompt: 'Factorise \\( ' + quadLatex(b, c) + ' \\) into the form \\( (x+a)(x+b) \\).<br>Enter the two numbers \\( a \\) and \\( b \\) (either order).',
      fields: [
        { id: 'a', label: 'first number', placeholder: 'e.g. 4' },
        { id: 'b', label: 'second number', placeholder: 'e.g. -3' },
      ],
      checkAll: get => {
        const x = normInt(get('a')), y = normInt(get('b'));
        if (x === null || y === null) return false;
        return (x === m && y === n) || (x === n && y === m);
      },
      working: 'Find two numbers that multiply to \\( ' + c + ' \\) and add to \\( ' + b + ' \\): ' +
        '\\( ' + m + ' \\) and \\( ' + n + ' \\). So \\( ' + quadLatex(b, c) + ' = (x ' + signed(m) + ')(x ' + signed(n) + ') \\).',
    };
  }

  function genExpandDouble() {
    const m = pickNonZero(-9, 9);
    const n = pickNonZero(-9, 9);
    const B = m + n, C = m * n;
    return {
      prompt: 'Expand \\( (x ' + signed(m) + ')(x ' + signed(n) + ') \\) and write it as \\( x^2 + Bx + C \\).<br>Enter \\( B \\) and \\( C \\).',
      fields: [
        { id: 'B', label: 'B (coefficient of x)', placeholder: 'e.g. 1', check: raw => normInt(raw) === B },
        { id: 'C', label: 'C (constant)', placeholder: 'e.g. -12', check: raw => normInt(raw) === C },
      ],
      working: 'FOIL: \\( x \\cdot x = x^2 \\); outer + inner \\( = ' + m + 'x ' + signed(n) + 'x = ' + B + 'x \\); ' +
        '\\( ' + m + ' \\times ' + n + ' = ' + C + ' \\). Result: \\( ' + quadLatex(B, C) + ' \\).',
    };
  }

  function genIndexLaws() {
    const variant = pick(['mult', 'div', 'pow']);
    const a = randInt(2, 9), b = randInt(2, 9);
    let prompt, ans, working;
    if (variant === 'mult') {
      ans = a + b;
      prompt = 'Simplify \\( x^{' + a + '} \\times x^{' + b + '} \\) to a single power \\( x^{n} \\). Enter \\( n \\).';
      working = 'Multiplying powers of the same base adds the indices: \\( ' + a + ' + ' + b + ' = ' + ans + ' \\).';
    } else if (variant === 'div') {
      ans = a - b;
      prompt = 'Simplify \\( \\dfrac{x^{' + a + '}}{x^{' + b + '}} \\) to a single power \\( x^{n} \\). Enter \\( n \\).';
      working = 'Dividing powers of the same base subtracts the indices: \\( ' + a + ' - ' + b + ' = ' + ans + ' \\).';
    } else {
      ans = a * b;
      prompt = 'Simplify \\( (x^{' + a + '})^{' + b + '} \\) to a single power \\( x^{n} \\). Enter \\( n \\).';
      working = 'A power raised to a power multiplies the indices: \\( ' + a + ' \\times ' + b + ' = ' + ans + ' \\).';
    }
    return {
      prompt: prompt,
      fields: [{ id: 'n', label: 'n', placeholder: 'e.g. ' + ans, check: raw => normInt(raw) === ans }],
      working: working,
    };
  }

  function genSurdsSimplify() {
    const b = pick([2, 3, 5, 6, 7, 10, 11]); // square-free
    const a = randInt(2, 6);
    const N = a * a * b;
    return {
      prompt: 'Simplify \\( \\sqrt{' + N + '} \\) to the form \\( a\\sqrt{b} \\) with \\( b \\) as small as possible.<br>Enter \\( a \\) and \\( b \\).',
      fields: [
        { id: 'a', label: 'a (outside)', placeholder: 'e.g. ' + a, check: raw => normInt(raw) === a },
        { id: 'b', label: 'b (inside)', placeholder: 'e.g. ' + b, check: raw => normInt(raw) === b },
      ],
      working: 'Take out the largest square factor: \\( ' + N + ' = ' + (a * a) + ' \\times ' + b + ' \\), ' +
        'and \\( \\sqrt{' + (a * a) + '} = ' + a + ' \\). So \\( \\sqrt{' + N + '} = ' + a + '\\sqrt{' + b + '} \\).',
    };
  }

  function genQuadFormula() {
    // integer a,b,c with two distinct real, non-integer roots (so the formula
    // is genuinely needed and the answer is a 2 d.p. decimal).
    let a, b, c, disc, root;
    for (let tries = 0; tries < 200; tries++) {
      a = pick([1, 1, 2]);
      b = pickNonZero(-9, 9);
      c = pickNonZero(-9, 9);
      disc = b * b - 4 * a * c;
      root = Math.sqrt(disc);
      if (disc > 0 && Math.abs(root - Math.round(root)) > 1e-6) break; // irrational surd
    }
    const r1 = (-b - root) / (2 * a);
    const r2 = (-b + root) / (2 * a);
    const r1s = r1.toFixed(2), r2s = r2.toFixed(2);
    const acoef = a === 1 ? '' : String(a);
    return {
      prompt: 'Solve \\( ' + acoef + 'x^2 ' + signed(b) + 'x ' + signed(c) + ' = 0 \\) using the quadratic formula.<br>Give both roots to <strong>2 decimal places</strong> (either order).',
      fields: [
        { id: 'r1', label: 'one root', placeholder: 'e.g. ' + r1s },
        { id: 'r2', label: 'other root', placeholder: 'e.g. ' + r2s },
      ],
      checkAll: get => {
        const x = normNum(get('r1')), y = normNum(get('r2'));
        if (x === null || y === null) return false;
        const tol = 0.05;
        const near = (u, v) => Math.abs(u - v) <= tol;
        return (near(x, r1) && near(y, r2)) || (near(x, r2) && near(y, r1));
      },
      working: 'Quadratic formula \\( x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\) with ' +
        '\\( a = ' + a + ',\\ b = ' + b + ',\\ c = ' + c + ' \\). ' +
        'Discriminant \\( = ' + b + '^2 - 4(' + a + ')(' + c + ') = ' + disc + ' \\), \\( \\sqrt{' + disc + '} \\approx ' + root.toFixed(3) + ' \\). ' +
        'Roots: \\( ' + r1s + ' \\) and \\( ' + r2s + ' \\).',
    };
  }

  const GENERATORS = {
    'complete-square': genCompleteSquare,
    'quad-formula': genQuadFormula,
    'factorise-quad': genFactoriseQuad,
    'expand-double': genExpandDouble,
    'index-laws': genIndexLaws,
    'surds-simplify': genSurdsSimplify,
  };
  const MODE_LABELS = {
    'complete-square': 'Completing the Square',
    'quad-formula': 'Quadratic Formula',
    'factorise-quad': 'Factorising',
    'expand-double': 'Expanding Brackets',
    'index-laws': 'Index Laws',
    'surds-simplify': 'Simplifying Surds',
  };
  const ROUND_LENGTH = 10;

  // ── DOM rendering ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('mathslab-drills-style')) return;
    const style = document.createElement('style');
    style.id = 'mathslab-drills-style';
    style.textContent =
      '.mathslab-drills-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.mathslab-drills-tab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 14px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.mathslab-drills-tab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-drills-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-drills-progress{color:var(--mid);font-size:13px;margin:0 0 8px}' +
      '.mathslab-drills-prompt{font-size:16px;font-weight:600;margin:0 0 14px;line-height:1.5}' +
      '.mathslab-drills-fields{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:10px}' +
      '.mathslab-drills-field label{display:block;font-size:13px;color:var(--mid);margin-bottom:4px}' +
      '.mathslab-drills-field input[type=text]{width:150px;box-sizing:border-box;font-family:"DM Mono","Consolas",monospace;font-size:15px;padding:10px;min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--cream);color:var(--ink)}' +
      '.mathslab-drills-field input.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-drills-field input.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-drills-field input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
      '.mathslab-drills-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}' +
      '.mathslab-drills-working{margin-top:12px;padding:10px 12px;background:var(--cream);border:1px solid var(--border);border-radius:8px;font-size:14px;color:var(--ink);line-height:1.6}' +
      '.mathslab-drills-score{font-size:16px;font-weight:600;margin-bottom:12px}';
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const allModes = Object.keys(GENERATORS);
    const modes = (ctx.config && ctx.config.modes && ctx.config.modes.length)
      ? ctx.config.modes.filter(m => GENERATORS[m]) : allModes;
    if (!modes.length) modes.push(allModes[0]);

    const root = document.createElement('div');
    root.className = 'mathslab-drills';
    el.appendChild(root);

    const tabBar = document.createElement('div');
    tabBar.className = 'mathslab-drills-tabs';
    const body = document.createElement('div');
    root.appendChild(tabBar);
    root.appendChild(body);

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

    function setActiveTabUI(activeMode) {
      Array.prototype.forEach.call(tabBar.children, (btn, i) => btn.classList.toggle('active', modes[i] === activeMode));
    }

    function startRound(mode) {
      setActiveTabUI(mode);
      round = { mode: mode, index: 0, score: 0, total: ROUND_LENGTH };
      renderQuestion();
    }

    function progressText() {
      return 'Question ' + (round.index + 1) + ' of ' + round.total +
        ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')';
    }

    function renderQuestion() {
      body.innerHTML = '';
      if (round.index >= round.total) { renderRoundDone(); return; }

      const q = GENERATORS[round.mode]();
      const wrap = document.createElement('div');
      wrap.className = 'mathslab-drills-q';

      const progress = document.createElement('p');
      progress.className = 'mathslab-drills-progress';
      progress.textContent = progressText();
      wrap.appendChild(progress);

      const promptEl = document.createElement('p');
      promptEl.className = 'mathslab-drills-prompt';
      promptEl.innerHTML = q.prompt;
      wrap.appendChild(promptEl);

      const fieldsWrap = document.createElement('div');
      fieldsWrap.className = 'mathslab-drills-fields';
      const fieldEls = {};
      q.fields.forEach(f => {
        const row = document.createElement('div');
        row.className = 'mathslab-drills-field';
        const label = document.createElement('label');
        label.innerHTML = f.label;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = f.placeholder || '';
        input.autocomplete = 'off';
        input.inputMode = 'text';
        row.appendChild(label);
        row.appendChild(input);
        fieldsWrap.appendChild(row);
        fieldEls[f.id] = { get: () => input.value, el: input };
      });
      wrap.appendChild(fieldsWrap);

      const feedback = document.createElement('div');
      feedback.className = 'mathslab-feedback';
      wrap.appendChild(feedback);

      const btnRow = document.createElement('div');
      btnRow.className = 'mathslab-drills-btnrow';
      const checkBtn = ui.btn('Check');
      const workingBtn = ui.btn('Show working', 'secondary');
      workingBtn.style.display = 'none';
      const nextBtn = ui.btn('Next', 'secondary');
      nextBtn.style.display = 'none';
      btnRow.appendChild(checkBtn);
      btnRow.appendChild(workingBtn);
      btnRow.appendChild(nextBtn);
      wrap.appendChild(btnRow);

      const workingEl = document.createElement('div');
      workingEl.className = 'mathslab-drills-working';
      workingEl.style.display = 'none';
      wrap.appendChild(workingEl);

      const getVal = id => fieldEls[id].get();
      let answered = false;

      function doCheck() {
        if (answered) return;
        answered = true;
        let allCorrect;
        if (typeof q.checkAll === 'function') {
          allCorrect = !!q.checkAll(getVal);
          q.fields.forEach(f => {
            fieldEls[f.id].el.classList.toggle('correct', allCorrect);
            fieldEls[f.id].el.classList.toggle('incorrect', !allCorrect);
          });
        } else {
          allCorrect = true;
          q.fields.forEach(f => {
            const ok = typeof f.check === 'function' ? !!f.check(getVal(f.id)) : false;
            if (!ok) allCorrect = false;
            fieldEls[f.id].el.classList.toggle('correct', ok);
            fieldEls[f.id].el.classList.toggle('incorrect', !ok);
          });
        }
        registerAnswer(allCorrect);
        if (allCorrect) round.score++;
        checkBtn.disabled = true;
        ui.feedback(feedback, allCorrect, allCorrect ? 'Correct!' : 'Not quite — reveal the working to see how.');
        workingBtn.style.display = '';
        nextBtn.style.display = '';
        progress.textContent = progressText();
      }

      checkBtn.addEventListener('click', doCheck);
      // Enter in any field submits the answer (then advances).
      Object.keys(fieldEls).forEach(id => {
        fieldEls[id].el.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (!answered) doCheck(); else nextBtn.click();
        });
      });

      workingBtn.addEventListener('click', () => {
        workingEl.innerHTML = q.working;
        workingEl.style.display = '';
        ui.renderMath(workingEl);
        workingBtn.style.display = 'none';
      });

      nextBtn.addEventListener('click', () => { round.index++; renderQuestion(); });

      body.appendChild(wrap);
      ui.renderMath(wrap);
      const firstInput = fieldsWrap.querySelector('input');
      if (firstInput) firstInput.focus();
    }

    function renderRoundDone() {
      body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'mathslab-drills-done';
      const heading = document.createElement('p');
      heading.className = 'mathslab-drills-score';
      heading.textContent = 'Round complete: ' + round.score + ' / ' + round.total +
        ' correct. Streak ' + currentStreak() + ' (best ' + bestStreak() + ').';
      wrap.appendChild(heading);
      const again = ui.btn('Play again');
      again.addEventListener('click', () => startRound(round.mode));
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ mode: round.mode, score: round.score });
    }

    modes.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mathslab-drills-tab';
      b.textContent = MODE_LABELS[m] || m;
      b.addEventListener('click', () => startRound(m));
      tabBar.appendChild(b);
    });

    startRound(modes[0]);
  }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('maths-drills', { title: 'Maths Drills', icon: '🔢', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      randInt, pick, normInt, normNum, quadLatex, addTerm, signed,
      GENERATORS, MODE_LABELS,
    };
  }
})();
