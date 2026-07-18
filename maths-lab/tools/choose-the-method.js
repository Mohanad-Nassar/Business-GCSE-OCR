// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Choose the Method (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'choose-the-method'. Exam-technique practice: the
// learner is shown a problem and 3-4 candidate METHODS, picks the one that
// is genuinely most appropriate, then sees why the right method fits this
// problem and why each other option is wrong or inefficient here. Choosing
// the right tool for the job — not just executing it — is a real 6993 skill
// (see ADDMATHS-CONTENT-PLAN §7.1 "exam technique" tools).
//
// Per-page item banks are pure module-scope data plus a pure length-rule
// auditor (auditItems) and grader (gradeChoice), unit-tested under Node via
// the module.exports guard at the bottom (never runs in the browser). LaTeX
// backslashes are DOUBLED in this source; delimiters \(...\) / \[...\] only
// (ADDMATHS-CONTENT-PLAN §8.4).
//
// Anti-guessing rule (docs/QUESTION-AUTHORING.md, repo-wide, owner-enforced):
// the correct method option must NOT be the strictly longest option in its
// item, at least one distractor must be same-length-or-longer AND plausible,
// and the correct option's position varies across items. Option LABELS are
// kept short and comparable — the "why" lives entirely in per-option
// feedback, never leaked through option text length. Every item below is
// covered by auditItems() so this is enforced by the test harness, not just
// eyeballed.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── pure logic: item bank ────────────────────────────────────────
  // Each item: { topic, prompt (LaTeX HTML), options: [{label, correct, feedback}] }
  // Option order is authored by hand (never shuffled at runtime) so the
  // length rule and position spread can be checked directly against source.
  const ITEMS_BY_PAGE = {
    '1-3-quadratics-and-completing-the-square': [
      {
        topic: 'Solving with exact answers',
        prompt: 'Solve \\( x^2 - 6x + 2 = 0 \\), giving your answers in exact (surd) form.',
        options: [
          { label: 'Factorise', correct: false,
            feedback: 'Does not work here: the discriminant is \\( 36 - 8 = 28 \\), which is not a perfect square, so there is no pair of integers that multiplies to 2 and adds to -6.' },
          { label: 'Complete the square', correct: true,
            feedback: 'Right choice: the coefficient of x is even (-6), so halving it is clean. \\( (x-3)^2 - 7 = 0 \\) leads straight to \\( x = 3 \\pm \\sqrt{7} \\).' },
          { label: 'Quadratic formula', correct: false,
            feedback: 'This also reaches the correct exact roots, but with an even b, completing the square is the more direct route here — no substitution into the formula needed.' },
          { label: 'Trial and improvement', correct: false,
            feedback: 'Only produces decimal approximations by guessing — never appropriate when a question asks for exact answers.' },
        ],
      },
      {
        topic: 'Finding a minimum value',
        prompt: 'Find the minimum value of \\( f(x) = x^2 - 6x + 2 \\).',
        options: [
          { label: 'Factorise', correct: false,
            feedback: 'This quadratic does not factorise over the integers, and even when a quadratic does factorise, the factorised form does not directly show the minimum value.' },
          { label: 'Complete the square', correct: true,
            feedback: 'Right choice: \\( (x-3)^2 - 7 \\) puts the vertex on display immediately — the minimum value is \\( -7 \\), at \\( x = 3 \\).' },
          { label: 'Quadratic formula', correct: false,
            feedback: 'The formula finds the roots (where the graph crosses the x-axis), not the turning point — the wrong target for this question.' },
          { label: 'Sketch and estimate', correct: false,
            feedback: 'A sketch only gives an approximate reading off the graph, not the exact minimum value that completing the square gives directly.' },
        ],
      },
      {
        topic: 'Solving a factorisable quadratic',
        prompt: 'Solve \\( x^2 - 5x + 6 = 0 \\).',
        options: [
          { label: 'Quadratic formula', correct: false,
            feedback: 'This gets to the same correct answer, but substituting a, b and c into the formula is slower than spotting the factor pair 2 and 3.' },
          { label: 'Complete the square', correct: false,
            feedback: 'This works but introduces fractions and extra steps for a quadratic that factorises instantly — not the efficient choice.' },
          { label: 'Iterative numerical method', correct: false,
            feedback: 'Pointless here — numerical iteration is for equations with no algebraic solution; this one has exact rational roots found in one line.' },
          { label: 'Factorise', correct: true,
            feedback: 'Right choice: 2 and 3 multiply to 6 and add to 5, so \\( (x-2)(x-3) = 0 \\) instantly. Always check for an easy integer factor pair first.' },
        ],
      },
      {
        topic: 'Solving with an odd middle coefficient',
        prompt: 'Solve \\( x^2 + 7x + 3 = 0 \\), giving your answers in exact (surd) form.',
        options: [
          { label: 'Complete the square', correct: false,
            feedback: 'This works but the odd b forces a fractional "half" (\\( 7/2 \\)) at every step — more awkward than needed when the formula avoids it until the final surd.' },
          { label: 'Trial and improvement', correct: false,
            feedback: 'Only produces decimal approximations by guessing — never appropriate when exact surd answers are required.' },
          { label: 'Quadratic formula', correct: true,
            feedback: 'Right choice: with b odd (7), the formula \\( x = \\dfrac{-b \\pm \\sqrt{b^2-4ac}}{2a} \\) reaches the exact surd answers without carrying a fraction through every intermediate line.' },
          { label: 'Factorise', correct: false,
            feedback: 'The discriminant is \\( 49 - 12 = 37 \\), not a perfect square, so there is no integer factor pair — this quadratic does not factorise.' },
        ],
      },
    ],
    '9-3-numerical-areas-and-the-trapezium-rule': [
      {
        topic: 'An integral with no elementary antiderivative',
        prompt: 'Estimate \\( \\displaystyle\\int_{1}^{2} e^{x^2}\\,dx \\).',
        options: [
          { label: 'Exact integration', correct: false,
            feedback: '\\( e^{x^2} \\) has no elementary antiderivative — there is no standard algebraic technique that integrates this function exactly.' },
          { label: 'Trapezium rule', correct: true,
            feedback: 'Right choice: with no algebraic antiderivative available, splitting the interval into strips and summing trapezium areas gives a reliable numerical estimate.' },
          { label: 'Differentiate the function', correct: false,
            feedback: 'Differentiation finds a gradient, not an area under a curve — the wrong operation entirely for an "estimate the integral" question.' },
          { label: 'Read values off a graph', correct: false,
            feedback: 'Far too imprecise for a numerical estimate — the trapezium rule is the structured method that a mark scheme expects here.' },
        ],
      },
      {
        topic: 'A standard power integral',
        prompt: 'Find \\( \\displaystyle\\int_{1}^{3} x^4\\,dx \\) exactly.',
        options: [
          { label: 'Trapezium rule', correct: false,
            feedback: 'This gives only an approximation. Since \\( x^4 \\) has a straightforward antiderivative, exact integration is both possible and expected here.' },
          { label: 'Riemann midpoint sum', correct: false,
            feedback: 'Another numerical estimate — unnecessary and imprecise when the exact power rule applies directly.' },
          { label: 'Exact integration', correct: true,
            feedback: 'Right choice: \\( \\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} \\) applies directly, giving a clean closed-form answer — no estimation needed.' },
          { label: 'Differentiate the function', correct: false,
            feedback: 'Differentiation is the opposite operation to what is being asked — it would undo, not find, the integral.' },
        ],
      },
      {
        topic: 'Discrete data with no formula',
        prompt: 'A sensor recorded a car’s speed at five evenly-spaced time points, with no formula linking speed to time. Estimate the distance travelled.',
        options: [
          { label: 'Trapezium rule', correct: true,
            feedback: 'Right choice: this is exactly what the trapezium rule is for — turning discrete data points into an area (distance) estimate by summing trapezium strips.' },
          { label: 'Exact integration', correct: false,
            feedback: 'There is no algebraic formula for speed here, only discrete readings — you cannot integrate a table of numbers algebraically.' },
          { label: 'Guess based on the average speed', correct: false,
            feedback: 'This ignores how speed varies between readings and gives a much rougher estimate than the trapezium rule, which uses every data point.' },
          { label: 'Differentiate the data', correct: false,
            feedback: 'Differentiation finds a rate of change, not an accumulated distance — the wrong operation for this question.' },
        ],
      },
      {
        topic: 'A standard trig integral',
        prompt: 'Find \\( \\displaystyle\\int_{0}^{\\pi/2} \\sin(x)\\,dx \\) exactly.',
        options: [
          { label: 'Riemann midpoint sum', correct: false,
            feedback: 'A numerical estimate — unnecessary here, since \\( \\sin(x) \\) has a well-known exact antiderivative.' },
          { label: 'Trapezium rule', correct: false,
            feedback: 'This only approximates the area. Since \\( \\sin(x) \\) integrates exactly to \\( -\\cos(x) \\), exact integration is both possible and expected.' },
          { label: 'Read values off a graph', correct: false,
            feedback: 'Far too imprecise, and unnecessary when an exact antiderivative for \\( \\sin(x) \\) is known.' },
          { label: 'Exact integration', correct: true,
            feedback: 'Right choice: \\( \\int \\sin(x)\\,dx = -\\cos(x) \\), so \\( \\big[-\\cos(x)\\big]_0^{\\pi/2} = -\\cos(\\pi/2) + \\cos(0) = 1 \\) — a clean exact value.' },
        ],
      },
    ],
    '10-1-kinematics': [
      {
        topic: 'Displacement to velocity',
        prompt: 'A particle’s displacement is \\( s(t) = t^3 - 6t^2 + 9t \\). Find its velocity at time \\( t \\).',
        options: [
          { label: 'Integrate', correct: false,
            feedback: 'Integration would move from acceleration to velocity, or velocity to displacement — the wrong direction when you already have displacement and want velocity.' },
          { label: 'Differentiate', correct: true,
            feedback: 'Right choice: velocity is the rate of change of displacement, so \\( v(t) = s\'(t) \\) — differentiate once to get \\( v(t) = 3t^2 - 12t + 9 \\).' },
          { label: 'Solve s(t) = 0', correct: false,
            feedback: 'This finds when the particle returns to the origin, not its velocity — a completely different question.' },
          { label: 'Substitute t values and tabulate', correct: false,
            feedback: 'This only gives estimated velocities at chosen instants from a table of displacements, not the exact velocity function everywhere.' },
        ],
      },
      {
        topic: 'Acceleration to velocity',
        prompt: 'A particle has acceleration \\( a(t) = 6t - 4 \\), with \\( v(0) = 3 \\). Find the velocity function \\( v(t) \\).',
        options: [
          { label: 'Differentiate', correct: false,
            feedback: 'Differentiating acceleration moves further away from velocity (towards the rate of change of acceleration), not closer to it.' },
          { label: 'Solve a(t) = 0', correct: false,
            feedback: 'This finds when the acceleration is momentarily zero, not the velocity function itself.' },
          { label: 'Integrate', correct: true,
            feedback: 'Right choice: velocity is the antiderivative of acceleration, \\( v(t) = \\int a(t)\\,dt \\), then \\( v(0) = 3 \\) pins down the constant of integration.' },
          { label: 'Find the gradient of a(t)', correct: false,
            feedback: 'The gradient of \\( a(t) \\) is another differentiation — again the wrong direction for reaching velocity.' },
        ],
      },
      {
        topic: 'Finding when a particle is at rest',
        prompt: 'A particle has velocity \\( v(t) = t^2 - 5t + 6 \\). Find the time(s) when the particle is momentarily at rest.',
        options: [
          { label: 'Solve v(t) = 0', correct: true,
            feedback: 'Right choice: "momentarily at rest" means velocity is zero, so setting \\( v(t) = 0 \\) and solving gives \\( t = 2 \\) and \\( t = 3 \\).' },
          { label: 'Find v(0)', correct: false,
            feedback: 'This only gives the velocity at the very start, \\( t = 0 \\), not the times when velocity becomes zero — a different question.' },
          { label: 'Differentiate v(t)', correct: false,
            feedback: 'Differentiating velocity gives acceleration, which does not tell you when velocity itself equals zero.' },
          { label: 'Integrate v(t)', correct: false,
            feedback: 'Integrating velocity gives displacement, not the times when the particle is at rest.' },
        ],
      },
      {
        topic: 'Velocity to displacement with an initial condition',
        prompt: 'A particle has velocity \\( v(t) = 4t - 8 \\) and \\( s(0) = 5 \\). Find the displacement at \\( t = 3 \\).',
        options: [
          { label: 'Differentiate v(t)', correct: false,
            feedback: 'Differentiating velocity gives acceleration, moving away from displacement entirely.' },
          { label: 'Solve v(t) = 0', correct: false,
            feedback: 'This finds when the particle is momentarily at rest, not the displacement at \\( t = 3 \\).' },
          { label: 'Substitute t = 3 into v(t)', correct: false,
            feedback: 'This gives the velocity at \\( t = 3 \\), not the displacement — a common mix-up between the two quantities.' },
          { label: 'Integrate v(t)', correct: true,
            feedback: 'Right choice: displacement is the antiderivative of velocity, \\( s(t) = \\int v(t)\\,dt + C \\); using \\( s(0) = 5 \\) fixes \\( C \\), then \\( s(3) \\) can be evaluated.' },
        ],
      },
    ],
  };

  // ── pure logic: length-rule auditor + grader (unit-tested under Node) ──
  // Repo-wide anti-guessing rule: the correct option must NOT be the
  // strictly longest option in its item. Returns one report per item.
  function auditItem(item) {
    const correctOpts = item.options.filter(o => o.correct);
    if (correctOpts.length !== 1) {
      return { ok: false, reason: 'item must have exactly one correct option, found ' + correctOpts.length };
    }
    const correct = correctOpts[0];
    const otherLens = item.options.filter(o => !o.correct).map(o => o.label.length);
    const maxOther = otherLens.length ? Math.max.apply(null, otherLens) : 0;
    const ok = correct.label.length <= maxOther;
    return {
      ok: ok,
      correctLabel: correct.label,
      correctLen: correct.label.length,
      maxOtherLen: maxOther,
      correctIndex: item.options.indexOf(correct),
    };
  }

  function auditItems(items) { return items.map(auditItem); }

  // Grade a single choice: selectedIndex is the option index the learner
  // clicked. Returns whether it was correct plus the correct index (for
  // rendering "the right answer was..." when they picked wrong).
  function gradeChoice(item, selectedIndex) {
    const correctIndex = item.options.findIndex(o => o.correct);
    return {
      correct: selectedIndex === correctIndex,
      selectedIndex: selectedIndex,
      correctIndex: correctIndex,
    };
  }

  // ── DOM helpers ────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = G.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function injectStyles() {
    if (G.document.getElementById('mathslab-method-style')) return;
    const style = G.document.createElement('style');
    style.id = 'mathslab-method-style';
    style.textContent =
      '.mathslab-method-intro{color:var(--mid);font-size:14px;margin:0 0 18px;line-height:1.5}' +
      '.mathslab-method-item{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:16px 18px}' +
      '.mathslab-method-progress{color:var(--mid);font-size:13px;margin:0 0 4px;font-weight:600}' +
      '.mathslab-method-topic{color:var(--accent);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}' +
      '.mathslab-method-prompt{font-size:16px;font-weight:600;margin:0 0 6px;line-height:1.5}' +
      '.mathslab-method-instructions{font-size:13px;color:var(--mid);margin:0 0 12px}' +
      '.mathslab-method-options{list-style:none;margin:0 0 4px;padding:0;display:flex;flex-direction:column;gap:10px}' +
      '.mathslab-method-opt{width:100%;text-align:left;background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:12px 14px;min-height:44px;font-family:inherit;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer}' +
      '.mathslab-method-opt:hover:not(:disabled){border-color:var(--accent)}' +
      '.mathslab-method-opt:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-method-opt:disabled{cursor:default}' +
      '.mathslab-method-opt.picked{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}' +
      '.mathslab-method-opt.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success);background:color-mix(in srgb, var(--success) 12%, var(--cream))}' +
      '.mathslab-method-opt.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-method-opt-note{display:block;font-weight:400;font-size:13px;color:var(--mid);margin-top:6px;line-height:1.5}' +
      '.mathslab-method-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}' +
      '.mathslab-method-done{text-align:left}' +
      '.mathslab-method-score{font-size:16px;font-weight:600;margin-bottom:12px;line-height:1.5}';
    G.document.head.appendChild(style);
  }

  function mount(el0, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const items = ITEMS_BY_PAGE[ctx.pageId] || Object.values(ITEMS_BY_PAGE)[0] || [];

    const root = el('div', 'mathslab-method');
    root.appendChild(el('p', 'mathslab-method-intro',
      'Read each problem and pick the method that is genuinely the best fit — not just a method that could eventually work. Then see why it fits, and why the others do not.'));
    const body = el('div');
    root.appendChild(body);
    el0.appendChild(root);

    if (!items.length) {
      body.appendChild(el('p', 'mathslab-method-intro', 'No items are set up for this topic yet.'));
      return;
    }

    let session = null; // { index, score }

    function startSession() {
      session = { index: 0, score: 0 };
      renderItem();
    }

    function renderItem() {
      body.innerHTML = '';
      if (session.index >= items.length) { renderSessionDone(); return; }
      const item = items[session.index];

      const wrap = el('div', 'mathslab-method-item');
      wrap.appendChild(el('p', 'mathslab-method-progress', 'Question ' + (session.index + 1) + ' of ' + items.length));
      wrap.appendChild(el('p', 'mathslab-method-topic', item.topic));
      const promptEl = el('p', 'mathslab-method-prompt');
      promptEl.innerHTML = item.prompt;
      wrap.appendChild(promptEl);
      wrap.appendChild(el('p', 'mathslab-method-instructions', 'Which method is the best choice here?'));

      const list = el('ul', 'mathslab-method-options');
      const optRows = []; // { btn, note, opt }
      let answered = false;

      item.options.forEach((opt, idx) => {
        const li = G.document.createElement('li');
        const btn = G.document.createElement('button');
        btn.type = 'button';
        btn.className = 'mathslab-method-opt';
        btn.textContent = opt.label;
        const note = el('span', 'mathslab-method-opt-note');
        note.style.display = 'none';
        btn.appendChild(note);
        li.appendChild(btn);
        list.appendChild(li);
        optRows.push({ btn: btn, note: note, opt: opt });

        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const result = gradeChoice(item, idx);
          if (result.correct) session.score++;

          optRows.forEach((row, i) => {
            row.btn.disabled = true;
            if (i === idx) row.btn.classList.add('picked');
            if (row.opt.correct) row.btn.classList.add('correct');
            else if (i === idx) row.btn.classList.add('incorrect');
            row.note.textContent = row.opt.feedback;
            row.note.style.display = '';
          });

          ui.feedback(feedback, result.correct,
            result.correct ? 'Correct — that is the most appropriate method here.'
              : 'Not quite — "' + item.options[result.correctIndex].label + '" was the best fit. Read why below.');
          nextBtn.style.display = '';
          ui.renderMath(wrap);
        });
      });
      wrap.appendChild(list);

      const feedback = el('p', 'mathslab-feedback');
      wrap.appendChild(feedback);

      const btnRow = el('div', 'mathslab-method-btnrow');
      const nextBtn = ui.btn(session.index === items.length - 1 ? 'Finish' : 'Next question', 'secondary');
      nextBtn.style.display = 'none';
      nextBtn.addEventListener('click', () => { session.index++; renderItem(); });
      btnRow.appendChild(nextBtn);
      wrap.appendChild(btnRow);

      body.appendChild(wrap);
      ui.renderMath(wrap);
    }

    function renderSessionDone() {
      body.innerHTML = '';
      const wrap = el('div', 'mathslab-method-done');
      const pct = items.length ? Math.round((100 * session.score) / items.length) : 0;
      const prevBest = ctx.store.get('best', 0);
      const newBest = pct > prevBest;
      if (newBest) ctx.store.set('best', pct);
      wrap.appendChild(el('p', 'mathslab-method-score',
        'Set complete: ' + session.score + ' / ' + items.length + ' correct (' + pct + '%). Best: ' +
        (newBest ? pct : prevBest) + '%.' + (newBest ? ' New best!' : '')));
      const again = ui.btn('Try again');
      again.addEventListener('click', startSession);
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ score: pct });
    }

    startSession();
  }

  // ── Registration (guarded — skipped outside the browser) ─────────
  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('choose-the-method', { title: 'Choose the Method', icon: '🧭', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      auditItem: auditItem,
      auditItems: auditItems,
      gradeChoice: gradeChoice,
      ITEMS_BY_PAGE: ITEMS_BY_PAGE,
    };
  }
})();
