// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Trace Tables (T3, CS-CONTENT-PLAN.md §7.1)
// Registers 'trace-table'. Used on:
//   2.1.2 (designing/creating/refining algorithms) — default set
//   2.2.1 (programming fundamentals)               — default set
//   2.3.2 (testing), config.set === 'testing'       — bug-spotting set
//
// Convention shown on screen (pick-one, stated explicitly per the task):
//   Fill in every column on the FIRST row. After that, leave a cell blank
//   if the value does NOT change from the row above — we accept a blank
//   cell or the repeated ("carried") value. Output is different: it only
//   ever means "something was printed on this row", so a blank Output
//   cell always means blank (never carried forward).
//
// Wrapped as (function (global) { ... })(window) so the pure grading
// helpers (cellMatches, computeCarried, gradeTable) can be unit-tested
// under plain Node via `require()`. CsLab.registerTool is skipped when
// there is no `global.CsLab` (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Pure marking helpers (unit-tested under Node) ────────────────

  function normalize(v) {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  // trim + case-insensitive for strings, "3" == 3 for numbers
  function valuesEqual(a, b) {
    const sa = normalize(a);
    const sb = normalize(b);
    if (sa === '' && sb === '') return true;
    if (sa.toLowerCase() === sb.toLowerCase()) return true;
    if (sa !== '' && sb !== '') {
      const na = Number(sa);
      const nb = Number(sb);
      if (!isNaN(na) && !isNaN(nb)) return na === nb;
    }
    return false;
  }

  // expectedRaw === '' means "unchanged on this row" -> accept blank OR
  // the carried-forward value from the nearest earlier non-blank row.
  function cellMatches(userRaw, expectedRaw, carriedRaw) {
    const user = normalize(userRaw);
    const expected = normalize(expectedRaw);
    if (expected === '') {
      if (user === '') return true;
      return valuesEqual(user, carriedRaw);
    }
    return valuesEqual(user, expected);
  }

  // For each row/column, the value that should count as "carried" if that
  // cell's authored expected value is blank. The Output column never
  // carries — a blank Output cell always means nothing was printed there.
  function computeCarried(rows, columns) {
    const carried = rows.map(() => ({}));
    const last = {};
    columns.forEach(c => { last[c] = ''; });
    rows.forEach((row, i) => {
      columns.forEach(c => {
        carried[i][c] = last[c];
        const v = row[c];
        if (c !== 'Output' && v !== undefined && normalize(v) !== '') last[c] = v;
      });
    });
    return carried;
  }

  // userGrid: array of row objects { colName: rawUserString }
  function gradeTable(instance, userGrid) {
    const carried = computeCarried(instance.rows, instance.columns);
    let allCorrect = true;
    let firstWrong = null;
    const marks = instance.rows.map((row, r) => {
      const rowMarks = {};
      instance.columns.forEach(c => {
        const userVal = (userGrid[r] || {})[c];
        const ok = cellMatches(userVal, row[c], carried[r][c]);
        rowMarks[c] = ok;
        if (!ok) {
          allCorrect = false;
          if (!firstWrong) firstWrong = { row: r, col: c };
        }
      });
      return rowMarks;
    });
    return { marks: marks, allCorrect: allCorrect, firstWrong: firstWrong };
  }

  // ── Instance content (author-owned, ERL per CS-CONTENT-PLAN.md Appx C) ──
  // Row-authoring rule used throughout: row 1 is always fully explicit;
  // from row 2 onward a column is left '' when it does not change from
  // the previous row. Output is always '' except on the row it prints.

  const ALGORITHMS_SET = [
    {
      id: 'while-counter',
      title: 'While-loop counter',
      blurb: 'Trace x and count after each pass through the loop, then the final Output.',
      code: [
        'x = 0',
        'count = 0',
        'while x < 6',
        '    count = count + 1',
        '    x = x + 2',
        'endwhile',
        'print(count)',
      ],
      columns: ['x', 'count', 'Output'],
      rows: [
        { x: '2', count: '1', Output: '' },
        { x: '4', count: '2', Output: '' },
        { x: '6', count: '3', Output: '' },
        { x: '', count: '', Output: '3' },
      ],
    },
    {
      id: 'for-step',
      title: 'For loop with a step',
      blurb: 'This loop counts down in twos. Trace n and the running total.',
      code: [
        'total = 0',
        'for n = 10 to 0 step -2',
        '    total = total + n',
        'next n',
        'print(total)',
      ],
      columns: ['n', 'total', 'Output'],
      rows: [
        { n: '10', total: '10', Output: '' },
        { n: '8', total: '18', Output: '' },
        { n: '6', total: '24', Output: '' },
        { n: '4', total: '28', Output: '' },
        { n: '2', total: '30', Output: '' },
        { n: '0', total: '', Output: '' },
        { n: '', total: '', Output: '30' },
      ],
    },
    {
      id: 'array-string',
      title: 'Building a string from an array',
      blurb: 'Trace the loop that joins every item in the array into one string.',
      code: [
        'array fruit[4]',
        'fruit[0] = "fig"',
        'fruit[1] = "pear"',
        'fruit[2] = "kiwi"',
        'fruit[3] = "plum"',
        'result = ""',
        'for i = 0 to 3',
        '    result = result + fruit[i] + ","',
        'next i',
        'print(result)',
      ],
      columns: ['i', 'result', 'Output'],
      rows: [
        { i: '0', result: 'fig,', Output: '' },
        { i: '1', result: 'fig,pear,', Output: '' },
        { i: '2', result: 'fig,pear,kiwi,', Output: '' },
        { i: '3', result: 'fig,pear,kiwi,plum,', Output: '' },
        { i: '', result: '', Output: 'fig,pear,kiwi,plum,' },
      ],
    },
    {
      id: 'linear-search',
      title: 'Linear search with an early exit',
      blurb: 'The loop stops as soon as the target is found. Trace i and found, then both outputs.',
      code: [
        'array codes[5]',
        'codes[0] = 12',
        'codes[1] = 45',
        'codes[2] = 78',
        'codes[3] = 9',
        'codes[4] = 33',
        'target = 78',
        'found = false',
        'i = 0',
        'while i < 5 AND found == false',
        '    if codes[i] == target then',
        '        found = true',
        '    endif',
        '    i = i + 1',
        'endwhile',
        'print(found)',
        'print(i)',
      ],
      columns: ['i', 'found', 'Output'],
      rows: [
        { i: '1', found: 'false', Output: '' },
        { i: '2', found: '', Output: '' },
        { i: '3', found: 'true', Output: '' },
        { i: '', found: '', Output: 'true' },
        { i: '', found: '', Output: '3' },
      ],
    },
  ];

  const FUNDAMENTALS_SET = [
    {
      id: 'sequence-warmup',
      title: 'Sequence and assignment warm-up',
      blurb: 'No loops here — just trace each assignment in order, then both outputs.',
      code: [
        'a = 5',
        'b = 3',
        'a = a + b',
        'b = a - b',
        'print(a)',
        'print(b)',
      ],
      columns: ['a', 'b', 'Output'],
      rows: [
        { a: '5', b: '3', Output: '' },
        { a: '8', b: '', Output: '' },
        { a: '', b: '5', Output: '' },
        { a: '', b: '', Output: '8' },
        { a: '', b: '', Output: '5' },
      ],
    },
    {
      id: 'if-elseif',
      title: 'if / elseif branch trace',
      blurb: 'Work out which branch runs for this score, then the Output.',
      code: [
        'score = 62',
        'if score >= 80 then',
        '    grade = "A"',
        'elseif score >= 60 then',
        '    grade = "B"',
        'elseif score >= 40 then',
        '    grade = "C"',
        'else',
        '    grade = "U"',
        'endif',
        'print(grade)',
      ],
      columns: ['score', 'grade', 'Output'],
      rows: [
        { score: '62', grade: 'B', Output: '' },
        { score: '', grade: '', Output: 'B' },
      ],
    },
    {
      id: 'for-running-total',
      title: 'For loop running total',
      blurb: 'Trace n and the running total on each pass through the loop.',
      code: [
        'total = 0',
        'for n = 1 to 4',
        '    total = total + n',
        'next n',
        'print(total)',
      ],
      columns: ['n', 'total', 'Output'],
      rows: [
        { n: '1', total: '1', Output: '' },
        { n: '2', total: '3', Output: '' },
        { n: '3', total: '6', Output: '' },
        { n: '4', total: '10', Output: '' },
        { n: '', total: '', Output: '10' },
      ],
    },
  ];

  const TESTING_SET = [
    {
      id: 'bug-offbyone',
      title: 'Bug hunt: adding 1 to 5',
      blurb: 'This code is supposed to add up the whole numbers 1 to 5. Trace it and see what actually happens.',
      code: [
        'total = 0',
        'for i = 1 to 4',
        '    total = total + i',
        'next i',
        'print(total)',
      ],
      columns: ['i', 'total', 'Output'],
      rows: [
        { i: '1', total: '1', Output: '' },
        { i: '2', total: '3', Output: '' },
        { i: '3', total: '6', Output: '' },
        { i: '4', total: '10', Output: '' },
        { i: '', total: '', Output: '10' },
      ],
      mcq: {
        question: 'The trace shows an Output of 10, not 15. Which line contains the error?',
        options: ['Line 1', 'Line 2', 'Line 3', 'Line 5'],
        correctIndex: 1,
        explain: 'Line 2 reads "for i = 1 to 4", so the loop stops before i reaches 5 and 5 is never added. It should read "for i = 1 to 5".',
      },
    },
    {
      id: 'bug-wrongcomparison',
      title: 'Bug hunt: the pass mark',
      blurb: 'A score of 50 or more should count as a Pass. Trace it and see what actually happens.',
      code: [
        'score = 50',
        'if score > 50 then',
        '    result = "Pass"',
        'else',
        '    result = "Fail"',
        'endif',
        'print(result)',
      ],
      columns: ['score', 'result', 'Output'],
      rows: [
        { score: '50', result: 'Fail', Output: '' },
        { score: '', result: '', Output: 'Fail' },
      ],
      mcq: {
        question: 'A score of exactly 50 should print "Pass", but the trace shows "Fail". Which line contains the error?',
        options: ['Line 1', 'Line 2', 'Line 3', 'Line 5'],
        correctIndex: 1,
        explain: 'Line 2 uses ">", which excludes a score of exactly 50. It should use ">=" so a score of 50 or more counts as a Pass.',
      },
    },
  ];

  const INSTANCE_SETS = {
    algorithms: ALGORITHMS_SET,
    fundamentals: FUNDAMENTALS_SET,
    testing: TESTING_SET,
  };

  function resolveSetKey(ctx) {
    if (ctx.config && ctx.config.set === 'testing') return 'testing';
    if (ctx.pageId === '2-2-1-programming-fundamentals') return 'fundamentals';
    return 'algorithms'; // 2-1-2 default, and a sane fallback elsewhere
  }

  // ── DOM helpers ────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function injectStyle() {
    if (global.document.getElementById('cslab-trace-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-trace-style';
    style.textContent = [
      '.cslab-trace-intro { color: var(--mid); font-size: 14px; margin: 0 0 18px; }',
      '.cslab-trace-instance { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; }',
      '.cslab-trace-instance.solved { border-color: var(--success); }',
      '.cslab-trace-title { margin: 0 0 4px; font-size: 16px; }',
      '.cslab-trace-blurb { color: var(--mid); font-size: 13px; margin: 0 0 12px; }',
      '.cslab-trace-code { padding: 10px 14px; margin-bottom: 14px; }',
      '.cslab-trace-codeline { display: flex; gap: 12px; }',
      '.cslab-trace-lineno { color: var(--mid); width: 1.6em; text-align: right; user-select: none; flex: none; }',
      '.cslab-trace-linetext { white-space: pre; }',
      '.cslab-trace-table { border-collapse: collapse; width: 100%; margin-bottom: 12px; overflow-x: auto; display: table; }',
      '.cslab-trace-table th, .cslab-trace-table td { border: 1px solid var(--border); padding: 4px; text-align: center; }',
      '.cslab-trace-table thead { background: var(--cream); }',
      '.cslab-trace-cell { width: 100%; box-sizing: border-box; border: none; background: transparent; color: var(--ink); font-family: "DM Mono", Consolas, monospace; font-size: 13px; text-align: center; padding: 6px 4px; }',
      '.cslab-trace-cell:focus { outline: 2px solid var(--accent); border-radius: 4px; }',
      '.cslab-trace-cell.cell-ok { background: color-mix(in srgb, var(--success) 18%, transparent); }',
      '.cslab-trace-cell.cell-bad { background: color-mix(in srgb, #c0392b 16%, transparent); }',
      '.cslab-trace-cell.cell-firstwrong { outline: 2px solid #c0392b; border-radius: 4px; }',
      '.cslab-trace-cell:disabled { color: var(--ink); opacity: .9; }',
      '.cslab-trace-controls { display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }',
      '.cslab-trace-mcq { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border); }',
      '.cslab-trace-mcq-q { font-weight: 600; margin: 0 0 10px; }',
      '.cslab-trace-mcq-opts { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }',
      '.cslab-trace-mcq-opts .cell-ok-btn { border-color: var(--success); color: var(--success); }',
      '.cslab-trace-mcq-opts .cell-bad-btn { border-color: #c0392b; color: #c0392b; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  function markInstanceSolved(ctx, instance, section) {
    if (ctx.store.get('solved_' + instance.id, false)) return;
    ctx.store.set('solved_' + instance.id, true);
    ctx.complete({ instance: instance.id });
    section.classList.add('solved');
  }

  function buildMcq(ctx, instance, section) {
    const box = el('div', 'cslab-trace-mcq');
    box.appendChild(el('p', 'cslab-trace-mcq-q', instance.mcq.question));
    const optWrap = el('div', 'cslab-trace-mcq-opts');
    const feedback = el('p', 'cslab-feedback');
    instance.mcq.options.forEach((opt, i) => {
      const b = ctx.ui.btn(opt, 'secondary');
      b.addEventListener('click', () => {
        if (i === instance.mcq.correctIndex) {
          b.classList.add('cell-ok-btn');
          optWrap.querySelectorAll('button').forEach(x => { x.disabled = true; });
          ctx.ui.feedback(feedback, true, '✓ Correct — ' + instance.mcq.explain);
          markInstanceSolved(ctx, instance, section);
        } else {
          b.classList.add('cell-bad-btn');
          ctx.ui.feedback(feedback, false, 'Not quite — try another line. ' + instance.mcq.explain);
        }
      });
      optWrap.appendChild(b);
    });
    box.appendChild(optWrap);
    box.appendChild(feedback);
    return box;
  }

  function resetMcqArea(box) {
    if (!box) return;
    box.querySelectorAll('button').forEach(b => {
      b.disabled = false;
      b.classList.remove('cell-ok-btn', 'cell-bad-btn');
    });
    const fb = box.querySelector('.cslab-feedback');
    if (fb) { fb.textContent = ''; fb.className = 'cslab-feedback'; }
  }

  function buildInstance(container, ctx, instance, isTesting) {
    const store = ctx.store;
    const section = el('section', 'cslab-trace-instance');
    if (store.get('solved_' + instance.id, false)) section.classList.add('solved');
    section.appendChild(el('h4', 'cslab-trace-title', instance.title));
    if (instance.blurb) section.appendChild(el('p', 'cslab-trace-blurb', instance.blurb));

    const codeBox = el('div', 'cslab-trace-code cslab-code');
    instance.code.forEach((line, i) => {
      const row = el('div', 'cslab-trace-codeline');
      row.appendChild(el('span', 'cslab-trace-lineno', String(i + 1)));
      row.appendChild(el('span', 'cslab-trace-linetext', line));
      codeBox.appendChild(row);
    });
    section.appendChild(codeBox);

    const table = global.document.createElement('table');
    table.className = 'cslab-trace-table';
    const thead = global.document.createElement('thead');
    const htr = global.document.createElement('tr');
    instance.columns.forEach(c => htr.appendChild(el('th', null, c)));
    thead.appendChild(htr);
    table.appendChild(thead);
    const tbody = global.document.createElement('tbody');
    const savedGrid = store.get('answers_' + instance.id, null);
    const inputs = [];
    instance.rows.forEach((row, r) => {
      const tr = global.document.createElement('tr');
      const rowInputs = {};
      instance.columns.forEach(c => {
        const td = global.document.createElement('td');
        const input = global.document.createElement('input');
        input.type = 'text';
        input.className = 'cslab-trace-cell';
        input.setAttribute('aria-label', c + ' row ' + (r + 1));
        if (savedGrid && savedGrid[r] && savedGrid[r][c] !== undefined) input.value = savedGrid[r][c];
        td.appendChild(input);
        tr.appendChild(td);
        rowInputs[c] = input;
      });
      inputs.push(rowInputs);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);

    const controls = el('div', 'cslab-trace-controls');
    const checkBtn = ctx.ui.btn('Check');
    const revealBtn = ctx.ui.btn('Reveal answers', 'secondary');
    const resetBtn = ctx.ui.btn('Reset', 'secondary');
    revealBtn.style.display = store.get('attempts_' + instance.id, 0) >= 2 ? '' : 'none';
    controls.appendChild(checkBtn);
    controls.appendChild(revealBtn);
    controls.appendChild(resetBtn);
    section.appendChild(controls);

    const feedback = el('p', 'cslab-feedback');
    section.appendChild(feedback);

    let mcqArea = null;
    if (isTesting && instance.mcq) {
      mcqArea = buildMcq(ctx, instance, section);
      mcqArea.style.display = store.get('table_done_' + instance.id, false) ? '' : 'none';
      section.appendChild(mcqArea);
    }

    function readGrid() {
      return instance.rows.map((row, r) => {
        const obj = {};
        instance.columns.forEach(c => { obj[c] = inputs[r][c].value; });
        return obj;
      });
    }

    function clearMarks() {
      inputs.forEach(rowInputs => {
        Object.keys(rowInputs).forEach(c => {
          rowInputs[c].classList.remove('cell-ok', 'cell-bad', 'cell-firstwrong');
        });
      });
    }

    function applyMarks(result) {
      clearMarks();
      result.marks.forEach((rowMarks, r) => {
        instance.columns.forEach(c => {
          inputs[r][c].classList.add(rowMarks[c] ? 'cell-ok' : 'cell-bad');
        });
      });
      if (result.firstWrong) {
        inputs[result.firstWrong.row][result.firstWrong.col].classList.add('cell-firstwrong');
      }
    }

    checkBtn.addEventListener('click', () => {
      const grid = readGrid();
      store.set('answers_' + instance.id, grid);
      const result = gradeTable(instance, grid);
      applyMarks(result);
      if (result.allCorrect) {
        store.set('attempts_' + instance.id, 0);
        store.set('table_done_' + instance.id, true);
        if (isTesting) {
          ctx.ui.feedback(feedback, true, 'All correct! Now answer the question below.');
          if (mcqArea) mcqArea.style.display = '';
        } else {
          ctx.ui.feedback(feedback, true, 'All correct — nice tracing.');
          markInstanceSolved(ctx, instance, section);
        }
      } else {
        const attempts = store.get('attempts_' + instance.id, 0) + 1;
        store.set('attempts_' + instance.id, attempts);
        ctx.ui.feedback(feedback, false, 'Not quite — the first wrong cell is outlined. Attempt ' + attempts + '.');
        if (attempts >= 2) revealBtn.style.display = '';
      }
    });

    revealBtn.addEventListener('click', () => {
      const carried = computeCarried(instance.rows, instance.columns);
      instance.rows.forEach((row, r) => {
        instance.columns.forEach(c => {
          const expected = row[c];
          const shown = (expected !== undefined && normalize(expected) !== '') ? expected : carried[r][c];
          inputs[r][c].value = shown === undefined ? '' : shown;
          inputs[r][c].disabled = true;
          inputs[r][c].classList.remove('cell-bad', 'cell-firstwrong');
          inputs[r][c].classList.add('cell-ok');
        });
      });
      ctx.ui.feedback(feedback, false, 'Answers revealed — have a look, then press Reset to try a fresh attempt.');
      checkBtn.disabled = true;
    });

    resetBtn.addEventListener('click', () => {
      inputs.forEach(rowInputs => {
        Object.keys(rowInputs).forEach(c => {
          rowInputs[c].value = '';
          rowInputs[c].disabled = false;
          rowInputs[c].classList.remove('cell-ok', 'cell-bad', 'cell-firstwrong');
        });
      });
      store.remove('answers_' + instance.id);
      store.set('attempts_' + instance.id, 0);
      store.set('table_done_' + instance.id, false);
      store.remove('solved_' + instance.id);
      section.classList.remove('solved');
      revealBtn.style.display = 'none';
      checkBtn.disabled = false;
      feedback.textContent = '';
      feedback.className = 'cslab-feedback';
      if (mcqArea) { mcqArea.style.display = 'none'; resetMcqArea(mcqArea); }
    });

    container.appendChild(section);
  }

  function mountTraceTable(el0, ctx) {
    injectStyle();
    const setKey = resolveSetKey(ctx);
    const instances = INSTANCE_SETS[setKey] || [];
    const isTesting = setKey === 'testing';

    const wrap = el('div', 'cslab-trace');
    el0.appendChild(wrap);

    wrap.appendChild(el('p', 'cslab-trace-intro',
      'Fill in every column on the first row. After that, leave a cell blank if the ' +
      'value does not change from the row above (we accept blank or the repeated ' +
      'value). Only fill in Output on the row where something is actually printed.' +
      (isTesting ? ' Two of these programs have a bug — the trace will show you where it bites.' : '')));

    instances.forEach(instance => buildInstance(wrap, ctx, instance, isTesting));
  }

  if (global && global.CsLab) {
    global.CsLab.registerTool('trace-table', {
      title: 'Trace Tables',
      icon: '📋',
      mount: mountTraceTable,
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      cellMatches: cellMatches,
      valuesEqual: valuesEqual,
      computeCarried: computeCarried,
      gradeTable: gradeTable,
      ALGORITHMS_SET: ALGORITHMS_SET,
      FUNDAMENTALS_SET: FUNDAMENTALS_SET,
      TESTING_SET: TESTING_SET,
      resolveSetKey: resolveSetKey,
    };
  }
})(typeof window !== 'undefined' ? window : this);
