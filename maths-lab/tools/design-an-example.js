// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Design an Example (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'design-an-example'. Adapts the cs-lab "test data"
// classifier idiom (cs-lab/tools/test-data.js): instead of picking one right
// answer, the student INVENTS numbers satisfying a stated property, and a
// pure classify() function checks whatever they typed — any valid example
// passes, not just one curated "the" answer. A "Show me one" button reveals
// a curated instance for students who are stuck (which must itself pass its
// own classifier — enforced by the Node test harness for this module).
//
// Pure classifiers + the curated examples live at module scope with no DOM
// access, so they are unit-tested under Node via the module.exports guard at
// the bottom (never runs in the browser). LaTeX backslashes are DOUBLED in
// this source; delimiters \(...\) / \[...\] only (ADDMATHS-CONTENT-PLAN §8.4).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── numeric input normalisation (mirrors maths-drills.js normNum) ──
  function normNum(raw) {
    const c = String(raw == null ? '' : raw).replace(/[,\s]+/g, '');
    if (!/^[+-]?\d+(\.\d+)?$/.test(c)) return null;
    return parseFloat(c);
  }

  const EPS = 1e-9;          // equality tolerance for algebraic checks
  const TRIG_EPS = 1e-9;     // strict-sign tolerance for sin/cos checks
  const TAN_EPS = 1e-6;      // "cos is essentially zero" tolerance

  // Tidy a computed number for feedback text (kills float noise like 2.0000000000000004).
  function fmtNum(n) {
    if (!isFinite(n)) return String(n);
    const r = Math.round(n * 10000) / 10000;
    return (Object.is(r, -0) ? 0 : r).toString();
  }

  function toRad(deg) { return deg * Math.PI / 180; }

  // ── classifiers: pure, module-scope, one per task ──────────────────

  // 1.3 Quadratics and completing the square ──────────────────────────
  function classifyNoRealRoots(raw) {
    const a = normNum(raw.a), b = normNum(raw.b), c = normNum(raw.c);
    if (a === null || b === null || c === null) return { pass: false, reason: 'Enter numbers for a, b and c.' };
    if (a === 0) return { pass: false, reason: 'a cannot be 0 — then \\( ax^2+bx+c \\) is not a quadratic.' };
    const disc = b * b - 4 * a * c;
    if (disc < 0) {
      return { pass: true, reason: 'Discriminant \\( b^2-4ac = ' + fmtNum(disc) + ' \\), which is negative — no real roots.' };
    }
    return { pass: false, reason: 'Discriminant \\( b^2-4ac = ' + fmtNum(disc) + ' \\), which is not negative, so this quadratic does have real root(s). Try making \\( b^2 \\) smaller than \\( 4ac \\).' };
  }

  function classifyRepeatedRoot(raw) {
    const a = normNum(raw.a), b = normNum(raw.b), c = normNum(raw.c);
    if (a === null || b === null || c === null) return { pass: false, reason: 'Enter numbers for a, b and c.' };
    if (a === 0) return { pass: false, reason: 'a cannot be 0 — then \\( ax^2+bx+c \\) is not a quadratic.' };
    const disc = b * b - 4 * a * c;
    if (Math.abs(disc) < EPS) {
      const root = -b / (2 * a);
      return { pass: true, reason: 'Discriminant \\( b^2-4ac = 0 \\), so there is a repeated root at \\( x = ' + fmtNum(root) + ' \\).' };
    }
    return { pass: false, reason: 'Discriminant \\( b^2-4ac = ' + fmtNum(disc) + ' \\), not zero, so the roots are different (or there are none).' };
  }

  function classifyVertexBelowAxis(raw) {
    const a = normNum(raw.a), b = normNum(raw.b), c = normNum(raw.c);
    if (a === null || b === null || c === null) return { pass: false, reason: 'Enter numbers for a, b and c.' };
    if (a === 0) return { pass: false, reason: 'a cannot be 0 — then \\( ax^2+bx+c \\) is not a quadratic.' };
    if (a < 0) return { pass: false, reason: 'a must be greater than 0 — a negative a gives a maximum turning point, not a minimum.' };
    const minVal = c - (b * b) / (4 * a);
    if (minVal < 0) {
      return { pass: true, reason: 'Turning point value \\( c - \\dfrac{b^2}{4a} = ' + fmtNum(minVal) + ' \\), which is below the x-axis, and \\( a = ' + fmtNum(a) + ' &gt; 0 \\).' };
    }
    return { pass: false, reason: 'Turning point value \\( c - \\dfrac{b^2}{4a} = ' + fmtNum(minVal) + ' \\), which is not below the x-axis. Try a more negative c, or smaller b.' };
  }

  // 1.4 Linear and quadratic inequalities ─────────────────────────────
  // Inputs represent the factorised inequality a(x-p)(x-q) [ < 0 | > 0 ].
  function classifyBetweenRoots(raw) {
    const a = normNum(raw.a), p = normNum(raw.p), q = normNum(raw.q);
    if (a === null || p === null || q === null) return { pass: false, reason: 'Enter numbers for a, p and q.' };
    if (a <= 0) return { pass: false, reason: 'a must be positive — with a negative, \\( a(x-p)(x-q) \\) is negative outside the roots, not between them.' };
    const lo = Math.min(p, q), hi = Math.max(p, q);
    if (Math.abs(lo - 2) < EPS && Math.abs(hi - 5) < EPS) {
      return { pass: true, reason: 'Roots at 2 and 5 with \\( a &gt; 0 \\): the parabola dips below the x-axis exactly between them, giving \\( 2 < x < 5 \\).' };
    }
    return { pass: false, reason: 'With roots \\( ' + fmtNum(lo) + ' \\) and \\( ' + fmtNum(hi) + ' \\), the solution set is \\( ' + fmtNum(lo) + ' < x < ' + fmtNum(hi) + ' \\), not \\( 2 < x < 5 \\).' };
  }

  function classifyOutsideRoots(raw) {
    const a = normNum(raw.a), p = normNum(raw.p), q = normNum(raw.q);
    if (a === null || p === null || q === null) return { pass: false, reason: 'Enter numbers for a, p and q.' };
    if (a <= 0) return { pass: false, reason: 'a must be positive — with a negative, \\( a(x-p)(x-q) \\) is positive between the roots, not outside them.' };
    const lo = Math.min(p, q), hi = Math.max(p, q);
    if (Math.abs(lo - (-1)) < EPS && Math.abs(hi - 3) < EPS) {
      return { pass: true, reason: 'Roots at -1 and 3 with \\( a &gt; 0 \\): the parabola is above the x-axis outside the roots, giving \\( x < -1 \\) or \\( x > 3 \\).' };
    }
    return { pass: false, reason: 'With roots \\( ' + fmtNum(lo) + ' \\) and \\( ' + fmtNum(hi) + ' \\), the solution set is \\( x < ' + fmtNum(lo) + ' \\) or \\( x > ' + fmtNum(hi) + ' \\), not \\( x < -1 \\) or \\( x > 3 \\).' };
  }

  function classifyNeverNegative(raw) {
    const a = normNum(raw.a), b = normNum(raw.b), c = normNum(raw.c);
    if (a === null || b === null || c === null) return { pass: false, reason: 'Enter numbers for a, b and c.' };
    if (a <= 0) return { pass: false, reason: 'a must be positive so the curve stays above (or touches) the x-axis for it to never dip below.' };
    const disc = b * b - 4 * a * c;
    if (disc <= EPS) {
      return { pass: true, reason: 'Discriminant \\( b^2-4ac = ' + fmtNum(disc) + ' \\) with \\( a &gt; 0 \\): the curve never goes below the x-axis, so \\( ax^2+bx+c < 0 \\) has no solutions.' };
    }
    return { pass: false, reason: 'Discriminant \\( b^2-4ac = ' + fmtNum(disc) + ' \\), which is positive, so the curve does dip below the x-axis somewhere — that gives solutions.' };
  }

  // 5.1 Trig ratios for any angle ──────────────────────────────────────
  function classifyQuadrant4(raw) {
    const theta = normNum(raw.theta);
    if (theta === null) return { pass: false, reason: 'Enter an angle in degrees.' };
    const s = Math.sin(toRad(theta)), c = Math.cos(toRad(theta));
    if (s < -TRIG_EPS && c > TRIG_EPS) {
      return { pass: true, reason: '\\( \\sin(' + fmtNum(theta) + '°) = ' + fmtNum(s) + ' \\) (negative) and \\( \\cos(' + fmtNum(theta) + '°) = ' + fmtNum(c) + ' \\) (positive) — a 4th-quadrant angle.' };
    }
    return { pass: false, reason: '\\( \\sin(' + fmtNum(theta) + '°) = ' + fmtNum(s) + ' \\), \\( \\cos(' + fmtNum(theta) + '°) = ' + fmtNum(c) + ' \\) — that is not (sin negative, cos positive). Try an angle between 270° and 360°.' };
  }

  function classifyTanUndefined(raw) {
    const theta = normNum(raw.theta);
    if (theta === null) return { pass: false, reason: 'Enter an angle in degrees.' };
    const c = Math.cos(toRad(theta));
    if (Math.abs(c) < TAN_EPS) {
      return { pass: true, reason: '\\( \\cos(' + fmtNum(theta) + '°) \\approx 0 \\), so \\( \\tan(' + fmtNum(theta) + '°) \\) is undefined (division by zero).' };
    }
    return { pass: false, reason: '\\( \\cos(' + fmtNum(theta) + '°) = ' + fmtNum(c) + ' \\), not zero, so \\( \\tan \\) is defined here. Try a multiple of 90° (like 90 or 270).' };
  }

  function classifyQuadrant2(raw) {
    const theta = normNum(raw.theta);
    if (theta === null) return { pass: false, reason: 'Enter an angle in degrees.' };
    const s = Math.sin(toRad(theta)), c = Math.cos(toRad(theta));
    if (s > TRIG_EPS && c < -TRIG_EPS) {
      return { pass: true, reason: '\\( \\sin(' + fmtNum(theta) + '°) = ' + fmtNum(s) + ' \\) (positive) and \\( \\cos(' + fmtNum(theta) + '°) = ' + fmtNum(c) + ' \\) (negative) — a 2nd-quadrant angle.' };
    }
    return { pass: false, reason: '\\( \\sin(' + fmtNum(theta) + '°) = ' + fmtNum(s) + ' \\), \\( \\cos(' + fmtNum(theta) + '°) = ' + fmtNum(c) + ' \\) — that is not (sin positive, cos negative). Try an angle between 90° and 180°.' };
  }

  // 2.4 Sequences and recurrence relationships ─────────────────────────
  function classifyGeometricConverges(raw) {
    const a = normNum(raw.a), r = normNum(raw.r);
    if (a === null || r === null) return { pass: false, reason: 'Enter numbers for a and r.' };
    if (a === 0) return { pass: false, reason: 'a cannot be 0 — every term would be 0, not a proper geometric sequence.' };
    if (r === 0) return { pass: false, reason: 'r cannot be 0 — a geometric sequence needs a fixed non-zero common ratio.' };
    if (Math.abs(r) < 1) {
      return { pass: true, reason: '\\( |r| = ' + fmtNum(Math.abs(r)) + ' \\), which is less than 1, so the terms shrink toward 0 as \\( n \\to \\infty \\) — the sequence converges.' };
    }
    return { pass: false, reason: '\\( |r| = ' + fmtNum(Math.abs(r)) + ' \\), which is not less than 1, so the terms do not shrink to 0. Try an r between -1 and 1 (not 0).' };
  }

  function classifyGeometricDiverges(raw) {
    const a = normNum(raw.a), r = normNum(raw.r);
    if (a === null || r === null) return { pass: false, reason: 'Enter numbers for a and r.' };
    if (a === 0) return { pass: false, reason: 'a cannot be 0 — every term would be 0, which does not diverge.' };
    if (Math.abs(r) > 1) {
      return { pass: true, reason: '\\( |r| = ' + fmtNum(Math.abs(r)) + ' \\), which is greater than 1, so the terms grow without bound — the sequence diverges.' };
    }
    return { pass: false, reason: '\\( |r| = ' + fmtNum(Math.abs(r)) + ' \\), which is not greater than 1, so the terms do not grow without bound. Try an r beyond 1 or below -1.' };
  }

  function classifyArithmeticDecreasing(raw) {
    const a = normNum(raw.a), d = normNum(raw.d);
    if (a === null || d === null) return { pass: false, reason: 'Enter numbers for a and d.' };
    if (d < 0) {
      return { pass: true, reason: '\\( d = ' + fmtNum(d) + ' \\), which is negative, so each term is smaller than the last — the sequence decreases forever.' };
    }
    return { pass: false, reason: '\\( d = ' + fmtNum(d) + ' \\), which is not negative, so the sequence does not decrease forever. Try a negative common difference.' };
  }

  // ── task content, keyed by pageId (never edit the topic HTML) ───────
  const TASKS = {
    '1-3-quadratics-and-completing-the-square': [
      {
        id: 'no-real-roots',
        title: 'No real roots',
        prompt: 'Invent numbers \\( a, b, c \\) so that the quadratic \\( ax^2+bx+c \\) has <strong>no real roots</strong>.',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'b', label: 'b', placeholder: 'e.g. 0' },
          { id: 'c', label: 'c', placeholder: 'e.g. 1' },
        ],
        classify: classifyNoRealRoots,
        example: () => ({ a: 1, b: 0, c: 1 }),
      },
      {
        id: 'repeated-root',
        title: 'Repeated root',
        prompt: 'Invent numbers \\( a, b, c \\) so that \\( ax^2+bx+c \\) has a <strong>repeated (equal) root</strong>.',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'b', label: 'b', placeholder: 'e.g. 2' },
          { id: 'c', label: 'c', placeholder: 'e.g. 1' },
        ],
        classify: classifyRepeatedRoot,
        example: () => ({ a: 1, b: 2, c: 1 }),
      },
      {
        id: 'vertex-below-axis',
        title: 'Turning point below the axis',
        prompt: 'Invent numbers \\( a, b, c \\) so that \\( y = ax^2+bx+c \\) has a <strong>turning point below the x-axis</strong>, with \\( a > 0 \\).',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'b', label: 'b', placeholder: 'e.g. 0' },
          { id: 'c', label: 'c', placeholder: 'e.g. -4' },
        ],
        classify: classifyVertexBelowAxis,
        example: () => ({ a: 1, b: 0, c: -4 }),
      },
    ],
    '1-4-linear-and-quadratic-inequalities': [
      {
        id: 'between-roots',
        title: 'Solution 2 < x < 5',
        prompt: 'Invent numbers \\( a, p, q \\) (with \\( a > 0 \\)) so that \\( a(x-p)(x-q) < 0 \\) has solution set \\( 2 < x < 5 \\).',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'p', label: 'p', placeholder: 'e.g. 2' },
          { id: 'q', label: 'q', placeholder: 'e.g. 5' },
        ],
        classify: classifyBetweenRoots,
        example: () => ({ a: 1, p: 2, q: 5 }),
      },
      {
        id: 'outside-roots',
        title: 'Solution x < -1 or x > 3',
        prompt: 'Invent numbers \\( a, p, q \\) (with \\( a > 0 \\)) so that \\( a(x-p)(x-q) > 0 \\) has solution set \\( x < -1 \\) or \\( x > 3 \\).',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'p', label: 'p', placeholder: 'e.g. -1' },
          { id: 'q', label: 'q', placeholder: 'e.g. 3' },
        ],
        classify: classifyOutsideRoots,
        example: () => ({ a: 1, p: -1, q: 3 }),
      },
      {
        id: 'never-negative',
        title: 'No solutions',
        prompt: 'Invent numbers \\( a, b, c \\) (with \\( a > 0 \\)) so that \\( ax^2+bx+c < 0 \\) has <strong>no solutions</strong> at all.',
        inputs: [
          { id: 'a', label: 'a', placeholder: 'e.g. 1' },
          { id: 'b', label: 'b', placeholder: 'e.g. 0' },
          { id: 'c', label: 'c', placeholder: 'e.g. 1' },
        ],
        classify: classifyNeverNegative,
        example: () => ({ a: 1, b: 0, c: 1 }),
      },
    ],
    '5-1-trig-ratios-for-any-angle': [
      {
        id: 'trig-q4',
        title: 'sin < 0, cos > 0',
        prompt: 'Invent an angle \\( \\theta \\) in degrees with \\( \\sin\\theta < 0 \\) and \\( \\cos\\theta > 0 \\).',
        inputs: [{ id: 'theta', label: 'θ (degrees)', placeholder: 'e.g. -30' }],
        classify: classifyQuadrant4,
        example: () => ({ theta: -30 }),
      },
      {
        id: 'trig-tan-undef',
        title: 'tan undefined',
        prompt: 'Invent an angle \\( \\theta \\) in degrees where \\( \\tan\\theta \\) is <strong>undefined</strong>.',
        inputs: [{ id: 'theta', label: 'θ (degrees)', placeholder: 'e.g. 90' }],
        classify: classifyTanUndefined,
        example: () => ({ theta: 90 }),
      },
      {
        id: 'trig-q2',
        title: 'sin > 0, cos < 0',
        prompt: 'Invent an angle \\( \\theta \\) in degrees in the <strong>second quadrant</strong> (\\( \\sin\\theta > 0 \\), \\( \\cos\\theta < 0 \\)).',
        inputs: [{ id: 'theta', label: 'θ (degrees)', placeholder: 'e.g. 120' }],
        classify: classifyQuadrant2,
        example: () => ({ theta: 120 }),
      },
    ],
    '2-4-sequences-and-recurrence-relationships': [
      {
        id: 'geometric-converges',
        title: 'Converging geometric',
        prompt: 'Invent a first term \\( a \\) and common ratio \\( r \\) for a <strong>geometric sequence that converges</strong> (shrinks toward 0) as \\( n \\to \\infty \\).',
        inputs: [
          { id: 'a', label: 'a (first term)', placeholder: 'e.g. 4' },
          { id: 'r', label: 'r (common ratio)', placeholder: 'e.g. 0.5' },
        ],
        classify: classifyGeometricConverges,
        example: () => ({ a: 4, r: 0.5 }),
      },
      {
        id: 'geometric-diverges',
        title: 'Diverging geometric',
        prompt: 'Invent a first term \\( a \\) and common ratio \\( r \\) for a <strong>geometric sequence that diverges</strong> (grows without bound in magnitude).',
        inputs: [
          { id: 'a', label: 'a (first term)', placeholder: 'e.g. 2' },
          { id: 'r', label: 'r (common ratio)', placeholder: 'e.g. 3' },
        ],
        classify: classifyGeometricDiverges,
        example: () => ({ a: 2, r: 3 }),
      },
      {
        id: 'arithmetic-decreasing',
        title: 'Decreasing arithmetic',
        prompt: 'Invent a first term \\( a \\) and common difference \\( d \\) for an <strong>arithmetic sequence that decreases forever</strong>.',
        inputs: [
          { id: 'a', label: 'a (first term)', placeholder: 'e.g. 10' },
          { id: 'd', label: 'd (common difference)', placeholder: 'e.g. -2' },
        ],
        classify: classifyArithmeticDecreasing,
        example: () => ({ a: 10, d: -2 }),
      },
    ],
  };

  // ── DOM rendering ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('mathslab-design-style')) return;
    const style = document.createElement('style');
    style.id = 'mathslab-design-style';
    style.textContent =
      '.mathslab-design-intro{color:var(--mid);font-size:14px;margin:0 0 14px}' +
      '.mathslab-design-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.mathslab-design-tab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 14px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.mathslab-design-tab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-design-tab.done{border-color:var(--success)}' +
      '.mathslab-design-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-design-prompt{font-size:16px;font-weight:600;margin:0 0 14px;line-height:1.5}' +
      '.mathslab-design-fields{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:10px}' +
      '.mathslab-design-field label{display:block;font-size:13px;color:var(--mid);margin-bottom:4px}' +
      '.mathslab-design-field input[type=text]{width:150px;box-sizing:border-box;font-family:"DM Mono","Consolas",monospace;font-size:15px;padding:10px;min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--cream);color:var(--ink)}' +
      '.mathslab-design-field input.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-design-field input.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-design-field input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
      '.mathslab-design-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}';
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const tasks = TASKS[ctx.pageId] || [];

    const root = document.createElement('div');
    root.className = 'mathslab-design';
    el.appendChild(root);

    if (!tasks.length) {
      root.innerHTML = '<p class="mathslab-loading">No design tasks are configured for this page yet.</p>';
      return;
    }

    const intro = document.createElement('p');
    intro.className = 'mathslab-design-intro';
    intro.textContent = 'Invent your own numbers that satisfy the property below. Any valid example passes — there is no single "correct" answer.';
    root.appendChild(intro);

    const tabBar = document.createElement('div');
    tabBar.className = 'mathslab-design-tabs';
    const body = document.createElement('div');
    root.appendChild(tabBar);
    root.appendChild(body);

    function isPassed(id) {
      const passed = ctx.store.get('passed', []);
      return passed.indexOf(id) !== -1;
    }
    function markPassed(id) {
      const passed = ctx.store.get('passed', []);
      if (passed.indexOf(id) === -1) {
        passed.push(id);
        ctx.store.set('passed', passed);
      }
      ctx.complete({ task: id });
    }

    function refreshTabUI(activeId) {
      Array.prototype.forEach.call(tabBar.children, (b, i) => {
        b.classList.toggle('active', tasks[i].id === activeId);
        b.classList.toggle('done', isPassed(tasks[i].id));
      });
    }

    function renderTask(task) {
      body.innerHTML = '';
      refreshTabUI(task.id);

      const wrap = document.createElement('div');
      wrap.className = 'mathslab-design-q';

      const promptEl = document.createElement('p');
      promptEl.className = 'mathslab-design-prompt';
      promptEl.innerHTML = task.prompt;
      wrap.appendChild(promptEl);

      const fieldsWrap = document.createElement('div');
      fieldsWrap.className = 'mathslab-design-fields';
      const fieldEls = {};
      task.inputs.forEach(f => {
        const row = document.createElement('div');
        row.className = 'mathslab-design-field';
        const label = document.createElement('label');
        label.textContent = f.label;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = f.placeholder || '';
        input.autocomplete = 'off';
        input.inputMode = 'text';
        row.appendChild(label);
        row.appendChild(input);
        fieldsWrap.appendChild(row);
        fieldEls[f.id] = input;
      });
      wrap.appendChild(fieldsWrap);

      const feedback = document.createElement('div');
      feedback.className = 'mathslab-feedback';
      wrap.appendChild(feedback);

      const btnRow = document.createElement('div');
      btnRow.className = 'mathslab-design-btnrow';
      const checkBtn = ui.btn('Check my example');
      const showBtn = ui.btn('Show me one', 'secondary');
      btnRow.appendChild(checkBtn);
      btnRow.appendChild(showBtn);
      wrap.appendChild(btnRow);

      function getRaw() {
        const raw = {};
        task.inputs.forEach(f => { raw[f.id] = fieldEls[f.id].value; });
        return raw;
      }

      function doCheck() {
        const result = task.classify(getRaw());
        task.inputs.forEach(f => {
          fieldEls[f.id].classList.toggle('correct', result.pass);
          fieldEls[f.id].classList.toggle('incorrect', !result.pass);
        });
        ui.feedback(feedback, result.pass, (result.pass ? '✓ ' : '✗ ') + result.reason);
        ui.renderMath(feedback);
        if (result.pass) {
          markPassed(task.id);
          refreshTabUI(task.id);
        }
      }

      checkBtn.addEventListener('click', doCheck);
      Object.keys(fieldEls).forEach(id => {
        fieldEls[id].addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          doCheck();
        });
      });

      showBtn.addEventListener('click', () => {
        const ex = task.example();
        task.inputs.forEach(f => {
          fieldEls[f.id].value = String(ex[f.id]);
          fieldEls[f.id].classList.remove('correct', 'incorrect');
        });
        feedback.className = 'mathslab-feedback';
        feedback.textContent = 'That is one valid example — try inventing a different one of your own, then hit Check.';
      });

      body.appendChild(wrap);
      ui.renderMath(wrap);
      const firstInput = fieldsWrap.querySelector('input');
      if (firstInput) firstInput.focus();
    }

    tasks.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mathslab-design-tab';
      b.textContent = t.title;
      b.addEventListener('click', () => renderTask(t));
      tabBar.appendChild(b);
    });

    renderTask(tasks[0]);
  }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('design-an-example', { title: 'Design an Example', icon: '🎯', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normNum, fmtNum, toRad,
      classifyNoRealRoots, classifyRepeatedRoot, classifyVertexBelowAxis,
      classifyBetweenRoots, classifyOutsideRoots, classifyNeverNegative,
      classifyQuadrant4, classifyTanUndefined, classifyQuadrant2,
      classifyGeometricConverges, classifyGeometricDiverges, classifyArithmeticDecreasing,
      TASKS,
    };
  }
})();
