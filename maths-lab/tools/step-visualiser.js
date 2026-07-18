// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Step Visualiser (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'step-visualiser'. Steps through a numerical/algebraic
// procedure one step at a time, building up a running table, with an
// occasional "predict the next value" checkpoint (typed numeric answer with
// a tolerance — never MCQ, so there is no guess-by-length exposure). Adapts
// the cs-lab sort-visualiser step-player idiom (pure step generators, dumb
// DOM playback) to three OCR FSMQ 6993 procedures, one per page:
//
//   • 9-3-numerical-areas-and-the-trapezium-rule
//       Trapezium rule on ∫₀⁴ (x²+1) dx with n=4 strips: compute each
//       ordinate y₀..y₄, predict y₁, then combine with the h/2[...] formula.
//   • 10-2-solving-equations-numerically
//       Interval bisection on x³−x−3=0 starting from [1,2]: 5 iterates,
//       predict the 3rd midpoint, then read off the final bracket/root.
//   • 2-1-polynomial-arithmetic-and-division
//       Synthetic division of 2x³−3x²−11x+6 by (x−3): bring down / multiply
//       / add each coefficient, predict the 2nd quotient term, then check
//       the remainder is 0.
//
// Everything above the "DOM / UI" banner is pure module-scope maths with no
// DOM dependency (unit-tested under Node via the module.exports guard at the
// bottom — never runs in the browser). The authored per-page content
// (buildXProcedure) calls those pure algorithms rather than hand-typing
// results, so the numbers on screen are guaranteed to match the maths.
// LaTeX backslashes are DOUBLED in this source; delimiters \(...\) / \[...\]
// only (ADDMATHS-CONTENT-PLAN §8.4).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── formatting ────────────────────────────────────────────────
  function fmt(n, dp) {
    if (!isFinite(n)) return '—';
    const d = dp == null ? 2 : dp;
    const r = Number(n.toFixed(d));
    return (Object.is(r, -0) ? 0 : r).toString();
  }
  function signed(n, dp) { const v = fmt(Math.abs(n), dp); return (n >= 0 ? '+ ' : '- ') + v; }
  function normNum(raw) {
    const c = String(raw == null ? '' : raw).replace(/[,\s]+/g, '');
    if (!/^[+-]?\d+(\.\d+)?$/.test(c)) return null;
    return parseFloat(c);
  }

  // ── pure algorithms ──────────────────────────────────────────────

  // Composite trapezium rule for f on [a,b] with n equal strips.
  function trapeziumRule(f, a, b, n) {
    const h = (b - a) / n;
    const xs = [], ys = [];
    for (let i = 0; i <= n; i++) { const x = a + i * h; xs.push(x); ys.push(f(x)); }
    let sumMiddle = 0;
    for (let i = 1; i < n; i++) sumMiddle += ys[i];
    const estimate = (h / 2) * ((ys[0] + ys[n]) + 2 * sumMiddle);
    return { h: h, xs: xs, ys: ys, estimate: estimate };
  }

  // Interval bisection: `iterations` steps starting from [a0,b0], assuming
  // f(a0) and f(b0) have opposite signs. Each step halves the bracket,
  // keeping the half across which f changes sign.
  function bisectionSteps(f, a0, b0, iterations) {
    let a = a0, b = b0;
    const steps = [];
    for (let i = 1; i <= iterations; i++) {
      const c = (a + b) / 2;
      const fa = f(a);
      const fc = f(c);
      let na, nb;
      if ((fa < 0 && fc < 0) || (fa > 0 && fc > 0)) { na = c; nb = b; } else { na = a; nb = c; }
      steps.push({ i: i, aBefore: a, bBefore: b, c: c, fc: fc, aAfter: na, bAfter: nb });
      a = na; b = nb;
    }
    return { steps: steps, aFinal: a, bFinal: b };
  }

  // Synthetic division of a polynomial (coeffs, highest degree first) by
  // (x - root). Returns the quotient coefficients (one degree lower) and
  // the remainder, plus per-step detail for display.
  function syntheticDivision(coeffs, root) {
    const n = coeffs.length;
    const running = [coeffs[0]];
    const details = [];
    for (let i = 1; i < n; i++) {
      const mult = running[i - 1] * root;
      const sum = coeffs[i] + mult;
      running.push(sum);
      details.push({ index: i, prevCoeff: running[i - 1], mult: mult, added: coeffs[i], sum: sum });
    }
    return { quotient: running.slice(0, n - 1), remainder: running[n - 1], details: details };
  }

  function polyLatex(coeffs) {
    // coeffs highest degree first, e.g. [2,3,-2] -> "2x^2 + 3x - 2"
    const deg = coeffs.length - 1;
    let out = '';
    coeffs.forEach((k, idx) => {
      const p = deg - idx;
      if (k === 0 && coeffs.length > 1) return;
      const term = p === 0 ? fmt(Math.abs(k)) : (Math.abs(k) === 1 ? '' : fmt(Math.abs(k))) + 'x' + (p === 1 ? '' : '^' + p);
      out += (out === '' ? (k < 0 ? '-' : '') : (k < 0 ? ' - ' : ' + ')) + term;
    });
    return out || '0';
  }

  // ── authored per-page procedures ─────────────────────────────────
  // Each returns { intro, tableHeaders, rows, final }.
  //   rows[i]  = { id, kind:'given'|'predict', tableCells:[...],
  //                promptLatex (predict only), revealLatex, value, tolerance }
  //   final    = { revealLatex, value }

  function buildTrapeziumProcedure() {
    const f = x => x * x + 1;
    const tr = trapeziumRule(f, 0, 4, 4);
    const predictIdx = 1; // predict y1
    const rows = tr.xs.map((x, i) => {
      const y = tr.ys[i];
      const isPredict = i === predictIdx;
      return {
        id: 'y' + i,
        kind: isPredict ? 'predict' : 'given',
        tableCells: [String(i), fmt(x, 0), fmt(y, 0)],
        promptLatex: isPredict
          ? 'Predict \\( y_{' + i + '} \\): the value of \\( y = x^2 + 1 \\) at \\( x = ' + fmt(x, 0) + ' \\).'
          : null,
        revealLatex: '\\( y_{' + i + '} = ' + fmt(x, 0) + '^2 + 1 = ' + fmt(y, 0) + ' \\)',
        value: y,
        tolerance: 0.01,
      };
    });
    const middleSum = tr.ys.slice(1, tr.ys.length - 1).reduce((s, v) => s + v, 0);
    const final = {
      revealLatex:
        '\\[ \\text{Area} \\approx \\dfrac{h}{2}\\big[(y_0+y_4) + 2(y_1+y_2+y_3)\\big] \\]' +
        '\\( = \\dfrac{' + fmt(tr.h, 0) + '}{2}\\big[(' + fmt(tr.ys[0], 0) + '+' + fmt(tr.ys[4], 0) + ') + 2(' +
        tr.ys.slice(1, 4).map(v => fmt(v, 0)).join('+') + ')\\big] \\)<br>' +
        '\\( = \\dfrac{' + fmt(tr.h, 0) + '}{2}\\big[' + fmt(tr.ys[0] + tr.ys[4], 0) + ' + 2(' + fmt(middleSum, 0) + ')\\big] = ' + fmt(tr.estimate, 0) + ' \\)',
      value: tr.estimate,
    };
    return {
      intro: '\\( \\text{Estimate } \\displaystyle\\int_{0}^{4} (x^2+1)\\,dx \\) using the trapezium rule with \\( n = 4 \\) strips (\\( h = 1 \\)).',
      tableHeaders: ['i', 'xᵢ', 'yᵢ'],
      rows: rows,
      final: final,
    };
  }

  function buildBisectionProcedure() {
    const f = x => x * x * x - x - 3;
    const iterations = 5;
    const predictIter = 3; // predict c3
    const bi = bisectionSteps(f, 1, 2, iterations);
    const rows = bi.steps.map(s => {
      const isPredict = s.i === predictIter;
      return {
        id: 'c' + s.i,
        kind: isPredict ? 'predict' : 'given',
        tableCells: [String(s.i), fmt(s.aBefore, 5), fmt(s.bBefore, 5), fmt(s.c, 5), fmt(s.fc, 5)],
        promptLatex: isPredict
          ? 'The current bracket is \\( [' + fmt(s.aBefore, 5) + ',\\ ' + fmt(s.bBefore, 5) + '] \\). Predict the next midpoint \\( c_{' + s.i + '} = \\dfrac{a+b}{2} \\).'
          : null,
        revealLatex:
          '\\( c_{' + s.i + '} = \\dfrac{' + fmt(s.aBefore, 5) + ' + ' + fmt(s.bBefore, 5) + '}{2} = ' + fmt(s.c, 5) + ' \\), ' +
          '\\( f(c_{' + s.i + '}) = ' + fmt(s.fc, 5) + ' \\) — ' + (s.fc < 0 ? 'negative' : 'positive') + ', so the root is in \\( [' +
          fmt(s.aAfter, 5) + ',\\ ' + fmt(s.bAfter, 5) + '] \\).',
        value: s.c,
        tolerance: 0.01,
      };
    });
    const width = bi.bFinal - bi.aFinal;
    const root = (bi.aFinal + bi.bFinal) / 2;
    const final = {
      revealLatex:
        'After ' + iterations + ' iterations the root is trapped in \\( [' + fmt(bi.aFinal, 5) + ',\\ ' + fmt(bi.bFinal, 5) + '] \\), ' +
        'a bracket of width \\( ' + fmt(width, 5) + ' \\). Taking the midpoint: \\( x \\approx ' + fmt(root, 2) + ' \\) (2 d.p.).',
      value: root,
    };
    return {
      intro: 'Solve \\( x^3 - x - 3 = 0 \\) by interval bisection, starting from the interval \\( [1, 2] \\) (since \\( f(1) = ' + fmt(f(1), 0) + ' \\) and \\( f(2) = ' + fmt(f(2), 0) + ' \\) have opposite signs).',
      tableHeaders: ['n', 'a', 'b', 'cₙ', 'f(cₙ)'],
      rows: rows,
      final: final,
    };
  }

  function buildPolyDivisionProcedure() {
    const coeffs = [2, -3, -11, 6]; // 2x^3 - 3x^2 - 11x + 6
    const root = 3;
    const sd = syntheticDivision(coeffs, root);
    // sd.details has one entry per coefficient after the leading one:
    //   details[0] -> quotient's x-coefficient, details[1] -> quotient's
    //   constant term, details[2] -> the remainder. Only the first two are
    //   quotient-term rows; the remainder step is reported in `final`.
    const labels = ['x² coefficient (bring down)', 'x coefficient', 'constant coefficient'];
    function termRow(id, label, d, isPredict) {
      return {
        id: id,
        kind: isPredict ? 'predict' : 'given',
        tableCells: [label, fmt(d.sum, 0)],
        promptLatex: isPredict
          ? 'Multiply the running coefficient \\( ' + fmt(d.prevCoeff, 0) + ' \\) by the root \\( ' + fmt(root, 0) + ' \\), then add it to the next coefficient \\( ' + fmt(d.added, 0) + ' \\). Predict the result.'
          : null,
        revealLatex:
          '\\( ' + fmt(d.prevCoeff, 0) + ' \\times ' + fmt(root, 0) + ' = ' + fmt(d.mult, 0) + ' \\); \\( ' + fmt(d.added, 0) + ' ' + signed(d.mult, 0) + ' = ' + fmt(d.sum, 0) + ' \\).',
        value: d.sum,
        tolerance: 0.001,
      };
    }
    const rows = [
      // Row 0 (bring down the leading coefficient) is always "given" — there
      // is nothing to compute yet, just the starting value.
      {
        id: 'q_bring_down',
        kind: 'given',
        tableCells: [labels[0], fmt(coeffs[0], 0)],
        promptLatex: null,
        revealLatex: 'Bring down the leading coefficient: \\( ' + fmt(coeffs[0], 0) + ' \\).',
        value: coeffs[0],
        tolerance: 0.001,
      },
      termRow('q_x', labels[1], sd.details[0], true),   // predict: quotient's x-coefficient
      termRow('q_const', labels[2], sd.details[1], false), // given: quotient's constant term
    ];
    const remDetail = sd.details[2];
    const quotientLatex = polyLatex(sd.quotient);
    const final = {
      revealLatex:
        '\\( ' + fmt(remDetail.prevCoeff, 0) + ' \\times ' + fmt(root, 0) + ' = ' + fmt(remDetail.mult, 0) + ' \\); \\( ' +
        fmt(remDetail.added, 0) + ' ' + signed(remDetail.mult, 0) + ' = ' + fmt(remDetail.sum, 0) + ' \\). Remainder \\( = ' + fmt(sd.remainder, 0) + ' \\)' +
        (sd.remainder === 0 ? ' — \\( (x-3) \\) divides exactly, confirming it is a factor.' : '.') +
        '<br>Quotient: \\( ' + quotientLatex + ' \\). Check: \\( (x-3)(' + quotientLatex + ') = ' + polyLatex(coeffs) + ' \\).',
      value: sd.remainder,
    };
    return {
      intro: 'Divide \\( ' + polyLatex(coeffs) + ' \\) by \\( (x - 3) \\) using synthetic division (equivalent to long division by the linear factor \\( x-3 \\)).',
      tableHeaders: ['Term', 'Coefficient'],
      rows: rows,
      final: final,
    };
  }

  const PROCEDURES = {
    '9-3-numerical-areas-and-the-trapezium-rule': buildTrapeziumProcedure,
    '10-2-solving-equations-numerically': buildBisectionProcedure,
    '2-1-polynomial-arithmetic-and-division': buildPolyDivisionProcedure,
  };

  // ══════════════════════════════════════════════════════════════
  // DOM / UI — only runs in the browser (or under jsdom in a test harness).
  // ══════════════════════════════════════════════════════════════

  function injectStyles() {
    if (G.document.getElementById('mathslab-stepvis-style')) return;
    const style = G.document.createElement('style');
    style.id = 'mathslab-stepvis-style';
    style.textContent =
      '.mathslab-stepvis-intro{font-size:15px;line-height:1.5;margin:0 0 14px}' +
      '.mathslab-stepvis-tablewrap{overflow-x:auto;margin-bottom:16px}' +
      '.mathslab-stepvis-table{border-collapse:collapse;width:100%;min-width:280px;font-size:14px}' +
      '.mathslab-stepvis-table th,.mathslab-stepvis-table td{border:1px solid var(--border);padding:8px 10px;text-align:center}' +
      '.mathslab-stepvis-table th{background:var(--card-bg);color:var(--mid);font-weight:600}' +
      '.mathslab-stepvis-table td{background:var(--cream);color:var(--ink)}' +
      '.mathslab-stepvis-table tr.correct td{background:color-mix(in srgb, var(--success) 16%, var(--cream))}' +
      '.mathslab-stepvis-table tr.incorrect td{background:color-mix(in srgb, #c0392b 14%, var(--cream))}' +
      '.mathslab-stepvis-panel{border:1px solid var(--border);border-radius:10px;padding:14px 16px;background:var(--card-bg);margin-bottom:14px}' +
      '.mathslab-stepvis-progress{color:var(--mid);font-size:13px;margin:0 0 8px}' +
      '.mathslab-stepvis-prompt{font-size:15px;font-weight:600;margin:0 0 10px;line-height:1.5}' +
      '.mathslab-stepvis-reveal{font-size:15px;line-height:1.6;margin:0;color:var(--ink)}' +
      '.mathslab-stepvis-inputrow{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:10px}' +
      '.mathslab-stepvis-inputrow input[type=text]{width:150px;box-sizing:border-box;font-family:"DM Mono","Consolas",monospace;font-size:15px;padding:10px;min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--cream);color:var(--ink)}' +
      '.mathslab-stepvis-inputrow input.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-stepvis-inputrow input.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-stepvis-inputrow input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
      '.mathslab-stepvis-controls{display:flex;flex-wrap:wrap;gap:10px}' +
      '.mathslab-stepvis-final{border:1px solid var(--success);border-radius:10px;padding:14px 16px;background:color-mix(in srgb, var(--success) 10%, var(--card-bg))}' +
      '.mathslab-stepvis-final p{margin:0;font-size:15px;line-height:1.6;color:var(--ink)}';
    G.document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const build = PROCEDURES[ctx.pageId];
    const proc = build ? build() : buildTrapeziumProcedure();

    const root = G.document.createElement('div');
    root.className = 'mathslab-stepvis';
    el.appendChild(root);

    const introEl = G.document.createElement('p');
    introEl.className = 'mathslab-stepvis-intro';
    introEl.innerHTML = proc.intro;
    root.appendChild(introEl);

    const tableWrap = G.document.createElement('div');
    tableWrap.className = 'mathslab-stepvis-tablewrap';
    const table = G.document.createElement('table');
    table.className = 'mathslab-stepvis-table';
    const thead = G.document.createElement('thead');
    const headRow = G.document.createElement('tr');
    proc.tableHeaders.forEach(h => { const th = G.document.createElement('th'); th.textContent = h; headRow.appendChild(th); });
    thead.appendChild(headRow);
    const tbody = G.document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    const panel = G.document.createElement('div');
    root.appendChild(panel);

    const controls = G.document.createElement('div');
    controls.className = 'mathslab-stepvis-controls';
    const prevBtn = ui.btn('◀ Prev', 'secondary');
    const nextBtn = ui.btn('Next ▶');
    const playBtn = ui.btn('▶ Play', 'secondary');
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(playBtn);
    root.appendChild(controls);

    const rows = proc.rows;
    const state = { index: 0, answers: {}, playing: false, timer: null, finished: false, predictTotal: 0, predictCorrect: 0 };

    function stopPlay() {
      state.playing = false;
      if (state.timer) { clearTimeout(state.timer); state.timer = null; }
      playBtn.textContent = '▶ Play';
    }

    function renderTable() {
      tbody.innerHTML = '';
      for (let i = 0; i < Math.min(state.index, rows.length); i++) {
        const row = rows[i];
        const tr = G.document.createElement('tr');
        if (row.kind === 'predict' && state.answers[row.id]) {
          tr.className = state.answers[row.id].correct ? 'correct' : 'incorrect';
        }
        row.tableCells.forEach(cellText => {
          const td = G.document.createElement('td');
          td.textContent = cellText;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
    }

    function renderPanel() {
      panel.innerHTML = '';
      if (state.index >= rows.length) {
        const finalPanel = G.document.createElement('div');
        finalPanel.className = 'mathslab-stepvis-final';
        const p = G.document.createElement('p');
        p.innerHTML = proc.final.revealLatex;
        finalPanel.appendChild(p);
        panel.appendChild(finalPanel);
        ui.renderMath(finalPanel);
        if (!state.finished) {
          state.finished = true;
          stopPlay();
          ctx.complete({ pageId: ctx.pageId, predictCorrect: state.predictCorrect, predictTotal: state.predictTotal, finalValue: proc.final.value });
        }
        return;
      }

      const row = rows[state.index];
      const wrap = G.document.createElement('div');
      wrap.className = 'mathslab-stepvis-panel';

      const progress = G.document.createElement('p');
      progress.className = 'mathslab-stepvis-progress';
      progress.textContent = 'Step ' + (state.index + 1) + ' of ' + (rows.length + 1);
      wrap.appendChild(progress);

      if (row.kind === 'given') {
        const reveal = G.document.createElement('p');
        reveal.className = 'mathslab-stepvis-reveal';
        reveal.innerHTML = row.revealLatex;
        wrap.appendChild(reveal);
      } else {
        const answered = state.answers[row.id];
        const prompt = G.document.createElement('p');
        prompt.className = 'mathslab-stepvis-prompt';
        prompt.innerHTML = row.promptLatex;
        wrap.appendChild(prompt);

        const inputRow = G.document.createElement('div');
        inputRow.className = 'mathslab-stepvis-inputrow';
        const input = G.document.createElement('input');
        input.type = 'text';
        input.autocomplete = 'off';
        input.placeholder = 'Your answer';
        const checkBtn = ui.btn('Check');
        inputRow.appendChild(input);
        inputRow.appendChild(checkBtn);
        wrap.appendChild(inputRow);

        const feedback = G.document.createElement('div');
        feedback.className = 'mathslab-feedback';
        wrap.appendChild(feedback);

        if (answered) {
          input.value = answered.raw;
          input.disabled = true;
          checkBtn.disabled = true;
          input.classList.toggle('correct', answered.correct);
          input.classList.toggle('incorrect', !answered.correct);
          ui.feedback(feedback, answered.correct, answered.correct ? 'Correct!' : 'Not quite — see the working below.');
          const reveal = G.document.createElement('p');
          reveal.className = 'mathslab-stepvis-reveal';
          reveal.innerHTML = row.revealLatex;
          wrap.appendChild(reveal);
        } else {
          const doCheck = () => {
            if (state.answers[row.id]) return;
            const val = normNum(input.value);
            const tol = row.tolerance == null ? 0.01 : row.tolerance;
            const correct = val !== null && Math.abs(val - row.value) <= tol;
            state.answers[row.id] = { raw: input.value, value: val, correct: correct };
            state.predictTotal++;
            if (correct) state.predictCorrect++;
            render();
          };
          checkBtn.addEventListener('click', doCheck);
          input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doCheck(); } });
        }
      }

      panel.appendChild(wrap);
      ui.renderMath(wrap);
      if (row.kind === 'predict' && !state.answers[row.id]) {
        const input = wrap.querySelector('input[type=text]');
        if (input) input.focus();
      }
    }

    function renderControls() {
      prevBtn.disabled = state.index === 0;
      const atFinal = state.index >= rows.length;
      const blocked = !atFinal && rows[state.index].kind === 'predict' && !state.answers[rows[state.index].id];
      nextBtn.disabled = atFinal || blocked;
      playBtn.disabled = atFinal;
    }

    function render() {
      renderTable();
      renderPanel();
      renderControls();
    }

    prevBtn.addEventListener('click', () => {
      stopPlay();
      state.index = Math.max(0, state.index - 1);
      render();
    });

    nextBtn.addEventListener('click', () => {
      if (state.index < rows.length) { state.index++; render(); }
    });

    function playTick() {
      if (!state.playing) return;
      const atFinal = state.index >= rows.length;
      const blocked = !atFinal && rows[state.index].kind === 'predict' && !state.answers[rows[state.index].id];
      if (atFinal || blocked) { stopPlay(); render(); return; }
      state.index++;
      render();
      if (state.index >= rows.length) { stopPlay(); return; }
      state.timer = setTimeout(playTick, 1600);
    }

    playBtn.addEventListener('click', () => {
      if (state.playing) { stopPlay(); render(); return; }
      state.playing = true;
      playBtn.textContent = '⏸ Pause';
      state.timer = setTimeout(playTick, 1600);
    });

    render();
  }

  function unmount() {
    // No module-level timers/listeners are held outside the single mounted
    // instance's own closures; the framework never calls mount() again
    // without first calling unmount(), and each mount's Play timer is
    // cleared by its own stopPlay() on every render path (Prev/Next/final).
    // Nothing to release here — kept as a documented no-op per the tool
    // contract (guarded so a future stateful addition has somewhere to go).
  }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('step-visualiser', { title: 'Step Visualiser', icon: '🪜', mount: mount, unmount: unmount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      fmt, signed, normNum,
      trapeziumRule, bisectionSteps, syntheticDivision, polyLatex,
      buildTrapeziumProcedure, buildBisectionProcedure, buildPolyDivisionProcedure,
      PROCEDURES, mount, unmount,
    };
  }
})(typeof window !== 'undefined' ? window : undefined);
