// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Examiner Trainer (ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'examiner-trainer'. The learner is shown an exam-style
// question, a *sample* student answer containing a realistic mistake, and
// the mark scheme as tick-able M/A/B points. They award the marks they
// think the sample earns, then see the senior examiner's real verdict and
// a short note on exactly where marks were lost — training them to mark
// like an examiner, distinct from self-marking their own work.
//
// Adapted from cs-lab/tools/examiner-trainer.js's mark-vs-scheme engine
// (gradeExaminerRound is carried over almost verbatim — it is generic mark
// scheme grading, not CS-specific). All questions/mark schemes/sample
// answers below are original, OCR FSMQ 6993-style items — not taken from
// any real paper or examiner report.
//
// Pure grading logic lives at module scope with no DOM access, so it is
// unit-testable under Node — see the module.exports guard at the bottom
// (never runs in the browser). LaTeX backslashes are DOUBLED in this
// source; delimiters \(...\) / \[...\] only (ADDMATHS-CONTENT-PLAN §8.4).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── Pure marking logic (unit-tested under Node) ──────────────────
  // markScheme: [{id, type, marks, text}], correctAwardIds: string[] (the
  // points the senior examiner actually awards), playerTickedIds: string[]
  // (the points the learner ticked as earned). Score = how many of the
  // award/refuse decisions the learner got right, point by point.
  function gradeExaminerRound(markScheme, correctAwardIds, playerTickedIds) {
    const correctSet = new Set(correctAwardIds || []);
    const playerSet = new Set(playerTickedIds || []);
    let correctCount = 0;
    let correctMarks = 0;
    let playerMarks = 0;
    const perPoint = markScheme.map(function (p) {
      const shouldAward = correctSet.has(p.id);
      const playerAwarded = playerSet.has(p.id);
      const matches = shouldAward === playerAwarded;
      if (matches) correctCount += 1;
      if (shouldAward) correctMarks += p.marks;
      if (playerAwarded) playerMarks += p.marks;
      return { id: p.id, shouldAward: shouldAward, playerAwarded: playerAwarded, matches: matches };
    });
    return {
      perPoint: perPoint,
      totalPoints: markScheme.length,
      correctCount: correctCount,
      correctMarks: correctMarks,
      playerMarks: playerMarks,
      allMatched: correctCount === markScheme.length,
    };
  }

  // ── Content: 3 rounds for 11.1 Command Words and Detailed Reasoning ──
  // Every studentAnswer is fictional and deliberately flawed in ONE
  // specific, believable way — mirroring the mistakes examiner reports
  // actually flag (early rounding, no method shown, a dropped sign, an
  // answer not given in the form/interval asked for, a missing conclusion
  // in context) — not a real candidate script.

  const ROUNDS_BY_PAGE = {
    '11-1-command-words-and-detailed-reasoning': [
      {
        id: 'differentiation-cubic',
        topic: 'Differentiation — showing method',
        question: 'Differentiate \\( y = 3x^4 - 5x^2 + 7 \\) with respect to \\( x \\), showing your method. [3]',
        maxMarks: 3,
        markScheme: [
          { id: 'p1', type: 'M', marks: 1, text: 'Attempts to differentiate using the power rule — reduces the power by 1 on at least one term, with the method shown (not just a final answer)' },
          { id: 'p2', type: 'A', marks: 1, text: 'Correctly differentiates the \\( x^4 \\) and \\( x^2 \\) terms: the \\( 12x^3 \\) and \\( -10x \\) parts are both right' },
          { id: 'p3', type: 'A', marks: 1, text: 'Recognises the constant term \\( 7 \\) differentiates to \\( 0 \\), giving the fully correct final answer \\( \\dfrac{dy}{dx} = 12x^3 - 10x \\)' },
        ],
        studentAnswer: '\\( \\dfrac{dy}{dx} = 12x^3 - 10x + 7 \\)\nUsed the power rule on each term: multiply by the power, then reduce the power by 1.',
        correctAward: ['p1', 'p2'],
        commentary: {
          p1: 'Awarded — the power rule is applied and the method is stated, not just asserted.',
          p2: 'Awarded — \\( 12x^3 \\) and \\( -10x \\) are both correct.',
          p3: "Not awarded — a constant term always differentiates to \\( 0 \\), it does not carry through unchanged. Keeping the \\( +7 \\) in the derivative is a common slip; the final line should read \\( \\dfrac{dy}{dx} = 12x^3 - 10x \\) with no constant at all.",
        },
      },
      {
        id: 'cos-equation-interval',
        topic: 'Trig equations — every solution in the interval',
        question: 'Solve \\( 2\\cos(x) = 1 \\) for \\( 0^{\\circ} \\le x \\le 360^{\\circ} \\), showing your method and giving all solutions. [3]',
        maxMarks: 3,
        markScheme: [
          { id: 'p1', type: 'M', marks: 1, text: 'Correctly rearranges to \\( \\cos(x) = 0.5 \\) as a valid step towards solving' },
          { id: 'p2', type: 'A', marks: 1, text: 'Finds the first solution \\( x = 60^{\\circ} \\) (from \\( \\cos^{-1}(0.5) \\))' },
          { id: 'p3', type: 'A', marks: 1, text: 'Uses the symmetry of cosine to find the second solution in range, \\( x = 300^{\\circ} \\) (i.e. \\( 360^{\\circ} - 60^{\\circ} \\)), with no extra incorrect solutions given' },
        ],
        studentAnswer: '\\( 2\\cos(x) = 1 \\Rightarrow \\cos(x) = 0.5 \\)\n\\( x = \\cos^{-1}(0.5) = 60^{\\circ} \\)\nSo \\( x = 60^{\\circ} \\).',
        correctAward: ['p1', 'p2'],
        commentary: {
          p1: 'Awarded — the rearrangement to \\( \\cos(x) = 0.5 \\) is correct and shown.',
          p2: 'Awarded — \\( 60^{\\circ} \\) is the correct first solution from the calculator value.',
          p3: "Not awarded — cosine is positive in two quadrants between \\( 0^{\\circ} \\) and \\( 360^{\\circ} \\), but a calculator's \\( \\cos^{-1} \\) only ever returns the first one. The second solution, \\( 360^{\\circ} - 60^{\\circ} = 300^{\\circ} \\), was never found. Whenever a question says 'solve ... for' a given interval, every solution inside it is expected, not just the principal value.",
        },
      },
      {
        id: 'garden-area-quadratic',
        topic: 'Quadratics in context — reasoning to a conclusion',
        question: 'A rectangular garden has length \\( x \\) metres and width \\( (x-3) \\) metres. The area of the garden is \\( 40\\,\\text{m}^2 \\). Form and solve an equation to find \\( x \\), giving a reason for rejecting any invalid solution. [5]',
        maxMarks: 5,
        markScheme: [
          { id: 'p1', type: 'M', marks: 1, text: 'Forms the correct equation from the area, \\( x(x-3) = 40 \\), rearranged to \\( x^2 - 3x - 40 = 0 \\)' },
          { id: 'p2', type: 'M', marks: 1, text: 'Attempts to solve the quadratic by a correct method (factorising or the quadratic formula), with the method shown' },
          { id: 'p3', type: 'A', marks: 1, text: 'Obtains the correct roots, \\( x = 8 \\) and \\( x = -5 \\)' },
          { id: 'p4', type: 'B', marks: 1, text: 'Rejects \\( x = -5 \\) with a valid reason given in context (a length cannot be negative)' },
          { id: 'p5', type: 'A', marks: 1, text: 'States the correct final answer, \\( x = 8 \\), as the length of the garden' },
        ],
        studentAnswer: '\\( x(x-3) = 40 \\)\n\\( x^2 - 3x - 40 = 0 \\)\n\\( (x-8)(x+5) = 0 \\)\nSo \\( x = 8 \\) or \\( x = -5 \\).',
        correctAward: ['p1', 'p2', 'p3'],
        commentary: {
          p1: 'Awarded — the equation from the area is correctly formed and rearranged.',
          p2: 'Awarded — factorising is a valid method and it is clearly shown.',
          p3: 'Awarded — both roots, \\( 8 \\) and \\( -5 \\), are correct.',
          p4: "Not awarded — the answer never says why \\( x = -5 \\) is impossible here. 'Detailed reasoning' questions always need an invalid root explicitly rejected with a reason (a length cannot be negative), not just left sitting alongside the valid one.",
          p5: "Not awarded — because the negative root was never rejected, the answer never actually states which value solves the question that was asked (the garden's length). Two roots is not the same as a conclusion.",
        },
      },
    ],
  };

  // ── DOM helpers ────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = G.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function injectStyles() {
    if (G.document.getElementById('mathslab-examiner-style')) return;
    const style = G.document.createElement('style');
    style.id = 'mathslab-examiner-style';
    style.textContent =
      '.mathslab-examiner-intro{color:var(--mid);font-size:14px;margin:0 0 18px;line-height:1.5}' +
      '.mathslab-examiner-round{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:16px 18px}' +
      '.mathslab-examiner-progress{color:var(--mid);font-size:13px;margin:0 0 4px;font-weight:600}' +
      '.mathslab-examiner-question{font-size:16px;font-weight:600;margin:0 0 12px;line-height:1.5}' +
      '.mathslab-examiner-answer{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:12px}' +
      '.mathslab-examiner-answer-label{margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--mid)}' +
      '.mathslab-examiner-answer-text{margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap}' +
      '.mathslab-examiner-instructions{font-size:13px;color:var(--mid);margin:0 0 12px}' +
      '.mathslab-examiner-scheme{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:10px}' +
      '.mathslab-examiner-point{border:1px solid var(--border);border-radius:8px;padding:10px 12px}' +
      '.mathslab-examiner-point.match{border-color:var(--success)}' +
      '.mathslab-examiner-point.mismatch{border-color:#c0392b}' +
      '.mathslab-examiner-point-label{display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14px;min-height:44px;padding:4px 0}' +
      '.mathslab-examiner-point-label input{width:22px;height:22px;flex:none;margin-top:2px;accent-color:var(--accent)}' +
      '.mathslab-examiner-point-label input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-examiner-point-tag{display:inline-block;min-width:28px;font-family:"DM Mono","Consolas",monospace;font-weight:700;color:var(--accent);margin-right:2px}' +
      '.mathslab-examiner-comment{margin:8px 0 0;padding-top:8px;border-top:1px dashed var(--border);font-size:13px;color:var(--mid);line-height:1.5}' +
      '.mathslab-examiner-live{font-weight:600;font-size:14px;margin:4px 0 12px}' +
      '.mathslab-examiner-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}' +
      '.mathslab-examiner-done{text-align:left}' +
      '.mathslab-examiner-score{font-size:16px;font-weight:600;margin-bottom:12px;line-height:1.5}';
    G.document.head.appendChild(style);
  }

  function mount(el0, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const rounds = ROUNDS_BY_PAGE[ctx.pageId] || Object.values(ROUNDS_BY_PAGE)[0] || [];

    const root = el('div', 'mathslab-examiner');
    root.appendChild(el('p', 'mathslab-examiner-intro',
      "You're the senior examiner. Read the question, the mark scheme and the sample student answer, then tick every point you think the answer has genuinely earned. Compare your marking against the real verdict at the end of each round."));
    const body = el('div');
    root.appendChild(body);
    el0.appendChild(root);

    if (!rounds.length) {
      body.appendChild(el('p', 'mathslab-examiner-intro', 'No rounds are set up for this topic yet.'));
      return;
    }

    let session = null; // { index, correctPoints, totalPoints }

    function startSession() {
      session = { index: 0, correctPoints: 0, totalPoints: 0 };
      renderRound();
    }

    function renderRound() {
      body.innerHTML = '';
      if (session.index >= rounds.length) { renderSessionDone(); return; }
      const round = rounds[session.index];

      const wrap = el('div', 'mathslab-examiner-round');
      wrap.appendChild(el('p', 'mathslab-examiner-progress', 'Round ' + (session.index + 1) + ' of ' + rounds.length + ' — ' + round.topic));
      const questionEl = el('p', 'mathslab-examiner-question');
      questionEl.innerHTML = round.question;
      wrap.appendChild(questionEl);

      const answerBox = el('div', 'mathslab-examiner-answer');
      answerBox.appendChild(el('p', 'mathslab-examiner-answer-label', 'Sample student answer'));
      const answerText = el('p', 'mathslab-examiner-answer-text');
      answerText.innerHTML = round.studentAnswer;
      answerBox.appendChild(answerText);
      wrap.appendChild(answerBox);

      wrap.appendChild(el('p', 'mathslab-examiner-instructions',
        'Tick every mark scheme point you think this answer has earned, then submit your marking.'));

      const schemeList = el('ul', 'mathslab-examiner-scheme');
      const points = {}; // id -> { cb, li, commentEl }
      round.markScheme.forEach(function (p) {
        const li = el('li', 'mathslab-examiner-point');
        const label = G.document.createElement('label');
        label.className = 'mathslab-examiner-point-label';
        const cb = G.document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', p.type + p.marks + ': ' + p.text.replace(/\\\(|\\\)/g, ''));
        label.appendChild(cb);
        const textSpan = G.document.createElement('span');
        const tag = G.document.createElement('span');
        tag.className = 'mathslab-examiner-point-tag';
        tag.textContent = p.type + p.marks;
        textSpan.appendChild(tag);
        const body2 = G.document.createElement('span');
        body2.innerHTML = p.text + ' (' + p.marks + (p.marks === 1 ? ' mark)' : ' marks)');
        textSpan.appendChild(body2);
        label.appendChild(textSpan);
        li.appendChild(label);
        const commentEl = el('p', 'mathslab-examiner-comment');
        commentEl.style.display = 'none';
        li.appendChild(commentEl);
        schemeList.appendChild(li);
        points[p.id] = { cb: cb, li: li, commentEl: commentEl };
      });
      wrap.appendChild(schemeList);

      const liveMarks = el('p', 'mathslab-examiner-live', 'Your mark so far: 0 / ' + round.maxMarks);
      wrap.appendChild(liveMarks);

      function updateLive() {
        let sum = 0;
        round.markScheme.forEach(function (p) { if (points[p.id].cb.checked) sum += p.marks; });
        liveMarks.textContent = 'Your mark so far: ' + sum + ' / ' + round.maxMarks;
      }
      round.markScheme.forEach(function (p) { points[p.id].cb.addEventListener('change', updateLive); });

      const feedback = el('p', 'mathslab-feedback');
      const btnRow = el('div', 'mathslab-examiner-btnrow');
      const submitBtn = ui.btn('Submit my marking');
      const nextBtn = ui.btn('Next round', 'secondary');
      nextBtn.style.display = 'none';
      btnRow.appendChild(submitBtn);
      btnRow.appendChild(nextBtn);
      wrap.appendChild(feedback);
      wrap.appendChild(btnRow);

      let submitted = false;
      submitBtn.addEventListener('click', function () {
        if (submitted) return;
        submitted = true;
        const ticked = round.markScheme
          .filter(function (p) { return points[p.id].cb.checked; })
          .map(function (p) { return p.id; });
        const result = gradeExaminerRound(round.markScheme, round.correctAward, ticked);

        round.markScheme.forEach(function (p) { points[p.id].cb.disabled = true; });
        result.perPoint.forEach(function (pp) {
          const rec = points[pp.id];
          rec.li.classList.add(pp.matches ? 'match' : 'mismatch');
          rec.commentEl.style.display = '';
          rec.commentEl.innerHTML = (pp.shouldAward ? '✓ Examiner: awarded — ' : '✗ Examiner: not awarded — ') + round.commentary[pp.id];
        });

        session.correctPoints += result.correctCount;
        session.totalPoints += result.totalPoints;
        ui.feedback(feedback, result.allMatched,
          'You matched ' + result.correctCount + ' of ' + result.totalPoints + ' marking decisions. ' +
          'Senior examiner mark: ' + result.correctMarks + '/' + round.maxMarks + ' — your mark: ' + result.playerMarks + '/' + round.maxMarks + '.');
        submitBtn.disabled = true;
        nextBtn.style.display = '';
        session.index += 1;
        ui.renderMath(wrap);
      });

      nextBtn.addEventListener('click', renderRound);

      body.appendChild(wrap);
      ui.renderMath(wrap);
    }

    function renderSessionDone() {
      body.innerHTML = '';
      const wrap = el('div', 'mathslab-examiner-done');
      const pct = session.totalPoints ? Math.round((100 * session.correctPoints) / session.totalPoints) : 0;
      const prevBest = ctx.store.get('best', 0);
      const newBest = pct > prevBest;
      if (newBest) ctx.store.set('best', pct);
      wrap.appendChild(el('p', 'mathslab-examiner-score',
        'Session complete: you matched the senior examiner on ' + session.correctPoints + ' / ' + session.totalPoints +
        ' marking decisions (' + pct + '%). Best: ' + (newBest ? pct : prevBest) + '%.' + (newBest ? ' New best!' : '')));
      const again = ui.btn('Mark another set');
      again.addEventListener('click', startSession);
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ score: pct });
    }

    startSession();
  }

  // ── Registration (guarded — skipped outside the browser) ─────────
  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('examiner-trainer', { title: 'Examiner Trainer', icon: '🖊️', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      gradeExaminerRound: gradeExaminerRound,
      ROUNDS_BY_PAGE: ROUNDS_BY_PAGE,
    };
  }
})();
