// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Predict the Output, tool T5
// Registers 'code-predict'. Pages: 2-2-1 (default), 2-2-2
// ('data-types'), 2-2-3 ('techniques'). See cs-lab.js header for the
// tool contract.
//
// Shows an ERL (Appendix C of CS-CONTENT-PLAN.md is the only ERL
// reference) or Python snippet — language always labelled — and the
// student types the exact program output. All snippets are
// deterministic (no random()) so marking is unambiguous.
//
// Wrapped so the pure logic (line normalisation / diffing) can be
// unit-tested under plain Node — see cs-lab/tools/code-predict.test.js.
// ══════════════════════════════════════════════════════════════

(function (root) {
  'use strict';

  // ── Pure logic (unit-tested) ───────────────────────────────────

  // Trims each line (leading + trailing whitespace) so trailing
  // spaces/blank-line padding never fail a match; case is preserved
  // so string literal case still counts.
  function normaliseLine(line) {
    return line.replace(/\r$/, '').trim();
  }

  function splitLines(text) {
    return String(text == null ? '' : text).replace(/\r\n/g, '\n').split('\n');
  }

  // Compares expected vs actual output line-by-line. Returns
  // { correct, rows: [{expected, actual, match}], firstMismatch }
  // where firstMismatch is the 0-based index of the first differing
  // line, or -1 if everything matched.
  function diffOutput(expectedText, actualText) {
    const expectedLines = splitLines(expectedText).map(normaliseLine);
    const actualLines = splitLines(actualText).map(normaliseLine);
    // Trailing wholly-blank lines (e.g. an extra Enter in the textarea)
    // don't count against the student.
    while (expectedLines.length > 1 && expectedLines[expectedLines.length - 1] === '') expectedLines.pop();
    while (actualLines.length > 1 && actualLines[actualLines.length - 1] === '') actualLines.pop();

    const rowCount = Math.max(expectedLines.length, actualLines.length);
    const rows = [];
    let firstMismatch = -1;
    for (let i = 0; i < rowCount; i++) {
      const expected = i < expectedLines.length ? expectedLines[i] : '';
      const actual = i < actualLines.length ? actualLines[i] : '';
      const match = expected === actual;
      if (!match && firstMismatch === -1) firstMismatch = i;
      rows.push({ expected: expected, actual: actual, match: match });
    }
    return { correct: firstMismatch === -1, rows: rows, firstMismatch: firstMismatch };
  }

  // ── Snippet content (Appendix C ERL only, or CPython 3) ─────────
  // Sets of 6. `lang` is 'ERL' or 'Python'. `output` is the exact
  // expected stdout, one print per line.

  const ITEMS = {
    default: [
      {
        id: 'seq-arithmetic',
        lang: 'ERL',
        code: ['a = 5', 'b = 3', 'c = a + b', 'print(c)', 'print(a - b)'],
        output: '8\n2',
        explanation: 'Sequence: each line runs once, top to bottom, using the values already assigned to a and b.',
      },
      {
        id: 'seq-floordiv-mod',
        lang: 'Python',
        code: ['x = 10', 'y = 4', 'print(x // y)', 'print(x % y)'],
        output: '2\n2',
        explanation: '// always rounds down to a whole number, and % gives the remainder left over after that division.',
      },
      {
        id: 'sel-grade',
        lang: 'ERL',
        code: [
          'score = 72',
          'if score >= 80 then',
          '    print("A")',
          'elseif score >= 60 then',
          '    print("B")',
          'else',
          '    print("C")',
          'endif',
        ],
        output: 'B',
        explanation: 'elseif is only checked once the first condition is false — 72 fails the first check but passes the second.',
      },
      {
        id: 'sel-oddeven',
        lang: 'Python',
        code: ['n = 7', 'if n % 2 == 0:', '    print("Even")', 'else:', '    print("Odd")'],
        output: 'Odd',
        explanation: '% 2 gives the remainder after dividing by 2 — a remainder of 1 means the number is odd.',
      },
      {
        id: 'iter-sum',
        lang: 'ERL',
        code: ['total = 0', 'for i = 1 to 5', '    total = total + i', 'next i', 'print(total)'],
        output: '15',
        explanation: 'The loop adds 1, then 2, then 3, then 4, then 5 to total, giving 1+2+3+4+5 = 15.',
      },
      {
        id: 'iter-countdown-step',
        lang: 'ERL',
        code: ['for i = 5 to 1 step -1', '    print(i)', 'next i'],
        output: '5\n4\n3\n2\n1',
        explanation: 'step -1 makes the loop count down one at a time from 5 until it passes 1.',
      },
    ],
    'data-types': [
      {
        id: 'dt-int-cast',
        lang: 'ERL',
        code: ['x = "7"', 'y = int(x) + 3', 'print(y)'],
        output: '10',
        explanation: 'int("7") converts the text "7" into the whole number 7 before the addition happens.',
      },
      {
        id: 'dt-div-mod',
        lang: 'ERL',
        code: ['print(7 / 2)', 'print(7 DIV 2)', 'print(7 MOD 2)'],
        output: '3.5\n3\n1',
        explanation: '/ gives an exact answer including decimals, DIV keeps only the whole-number part, and MOD gives the remainder.',
      },
      {
        id: 'dt-string-concat',
        lang: 'ERL',
        code: ['a = "5"', 'b = "6"', 'print(a + b)'],
        output: '56',
        explanation: 'a and b are strings here, so + joins the text together instead of adding numbers.',
      },
      {
        id: 'dt-float-print',
        lang: 'Python',
        code: ['x = 6 / 2', 'print(x)'],
        output: '3.0',
        explanation: "Python's / always produces a float, even when the numbers divide exactly — so it prints 3.0, not 3.",
      },
      {
        id: 'dt-int-truncate',
        lang: 'ERL',
        code: ['x = int(7.9)', 'print(x)'],
        output: '7',
        explanation: 'int() truncates towards zero — it cuts off the decimal part rather than rounding.',
      },
      {
        id: 'dt-str-concat',
        lang: 'Python',
        code: ['age = 15', 'message = "You are " + str(age) + " years old"', 'print(message)'],
        output: 'You are 15 years old',
        explanation: 'str(age) converts the number to text so it can be joined onto the rest of the sentence with +.',
      },
    ],
    techniques: [
      {
        id: 'tq-substring',
        lang: 'ERL',
        code: ['word = "Computer"', 'print(word.substring(0,3))'],
        output: 'Com',
        explanation: 'substring(0,3) starts at index 0 and takes 3 characters: C, o, m.',
      },
      {
        id: 'tq-left-right',
        lang: 'ERL',
        code: ['word = "Science"', 'print(word.left(3))', 'print(word.right(2))'],
        output: 'Sci\nce',
        explanation: 'left(3) takes the first 3 characters; right(2) takes the last 2 characters.',
      },
      {
        id: 'tq-upper',
        lang: 'ERL',
        code: ['name = "ocr"', 'print(name.upper)'],
        output: 'OCR',
        explanation: 'upper converts every letter in the string to capitals.',
      },
      {
        id: 'tq-2d-array',
        lang: 'ERL',
        code: [
          'array board[3,3]',
          'board[0,0] = "X"',
          'board[1,1] = "O"',
          'board[1,0] = "X"',
          'print(board[1,0])',
        ],
        output: 'X',
        explanation: 'board[1,0] was set to "X" on the line above, overwriting whatever value was there before.',
      },
      {
        id: 'tq-function-return',
        lang: 'ERL',
        code: ['function double(n)', '    return n * 2', 'endfunction', 'result = double(6)', 'print(result)'],
        output: '12',
        explanation: 'return sends the value n * 2 back to wherever the function was called from.',
      },
      {
        id: 'tq-length',
        lang: 'ERL',
        code: ['word = "algorithm"', 'print(word.length)'],
        output: '9',
        explanation: 'length counts every character in the string — "algorithm" has 9 characters.',
      },
    ],
  };

  // ── UI ───────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById('cslab-predict-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-predict-style';
    style.textContent = `
.cslab-predict-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }
.cslab-predict-picker { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.cslab-predict-chip {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px;
  color: var(--ink); font-family: inherit; font-size: 13px; padding: 7px 14px; cursor: pointer;
}
.cslab-predict-chip:hover { border-color: var(--accent); }
.cslab-predict-chip.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--card-bg)); }
.cslab-predict-chip.solved { border-color: var(--success); color: var(--success); }
.cslab-predict-lang {
  display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: var(--accent); border: 1px solid var(--accent); border-radius: 4px; padding: 2px 7px; margin-bottom: 8px;
}
.cslab-predict-actions { display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.cslab-predict-diff { width: 100%; border-collapse: collapse; margin-top: 10px; font-family: 'DM Mono', 'Consolas', monospace; font-size: 13px; }
.cslab-predict-diff th { text-align: left; color: var(--mid); font-size: 11px; text-transform: uppercase; padding: 4px 8px; }
.cslab-predict-diff td { padding: 4px 8px; border-top: 1px solid var(--border); white-space: pre; }
.cslab-predict-diff tr.mismatch td { background: color-mix(in srgb, #c0392b 10%, transparent); }
.cslab-predict-diff tr.mismatch.first td { outline: 2px solid #c0392b; outline-offset: -2px; }
.cslab-predict-explain { color: var(--mid); font-size: 13px; margin-top: 10px; }
`;
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyle();
    const set = (ctx.config && ITEMS[ctx.config.set]) ? ctx.config.set : 'default';
    const items = ITEMS[set];
    let solvedIds = ctx.store.get('solved', []);

    const wrap = ctx.ui.el(
      '<div class="cslab-predict">' +
      '<p class="cslab-predict-intro">Read the code carefully, then type EXACTLY what it would print — one line per print statement.</p>' +
      '<div class="cslab-predict-picker"></div>' +
      '<div class="cslab-predict-stage" style="display:none"></div>' +
      '</div>'
    );
    el.appendChild(wrap);
    const picker = wrap.querySelector('.cslab-predict-picker');
    const stage = wrap.querySelector('.cslab-predict-stage');
    const chips = {};

    items.forEach((item, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cslab-predict-chip' + (solvedIds.indexOf(item.id) !== -1 ? ' solved' : '');
      chip.textContent = (idx + 1) + '. ' + item.lang + ' snippet';
      chip.addEventListener('click', () => loadItem(item, chip));
      chips[item.id] = chip;
      picker.appendChild(chip);
    });

    function loadItem(item, chip) {
      Object.keys(chips).forEach(id => chips[id].classList.toggle('active', id === item.id));
      stage.style.display = '';
      stage.innerHTML = '';

      const lang = document.createElement('span');
      lang.className = 'cslab-predict-lang';
      lang.textContent = item.lang;
      stage.appendChild(lang);

      const code = document.createElement('pre');
      code.className = 'cslab-code';
      code.style.padding = '12px';
      code.style.margin = '0 0 12px';
      code.textContent = item.code.join('\n');
      stage.appendChild(code);

      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.fontSize = '13px';
      label.style.color = 'var(--mid)';
      label.style.marginBottom = '4px';
      label.textContent = 'What does this print?';
      stage.appendChild(label);

      const textarea = document.createElement('textarea');
      textarea.className = 'cslab-code';
      textarea.style.minHeight = '90px';
      textarea.setAttribute('spellcheck', 'false');
      textarea.setAttribute('autocomplete', 'off');
      stage.appendChild(textarea);

      const actions = ctx.ui.el('<div class="cslab-predict-actions"></div>');
      const checkBtn = ctx.ui.btn('Check');
      const revealBtn = ctx.ui.btn('Show explanation', 'secondary');
      const feedback = document.createElement('span');
      feedback.className = 'cslab-feedback';
      actions.appendChild(checkBtn);
      actions.appendChild(revealBtn);
      actions.appendChild(feedback);
      stage.appendChild(actions);

      const resultBox = document.createElement('div');
      stage.appendChild(resultBox);

      let solvedThisRound = false;

      function renderDiff(diff) {
        resultBox.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'cslab-predict-diff';
        table.innerHTML = '<thead><tr><th>Your line</th><th>Actual output</th></tr></thead>';
        const tbody = document.createElement('tbody');
        diff.rows.forEach((row, i) => {
          const tr = document.createElement('tr');
          if (!row.match) {
            tr.className = 'mismatch' + (i === diff.firstMismatch ? ' first' : '');
          }
          const tdActual = document.createElement('td');
          tdActual.textContent = row.actual;
          const tdExpected = document.createElement('td');
          tdExpected.textContent = row.expected;
          tr.appendChild(tdActual);
          tr.appendChild(tdExpected);
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        resultBox.appendChild(table);
      }

      checkBtn.addEventListener('click', () => {
        const diff = diffOutput(item.output, textarea.value);
        renderDiff(diff);
        if (diff.correct) {
          ctx.ui.feedback(feedback, true, 'Correct!');
          if (!solvedThisRound) {
            solvedThisRound = true;
            if (solvedIds.indexOf(item.id) === -1) {
              solvedIds = solvedIds.concat([item.id]);
              ctx.store.set('solved', solvedIds);
            }
            chip.classList.add('solved');
            ctx.complete({ item: item.id });
          }
        } else {
          ctx.ui.feedback(feedback, false, 'Not quite — check the highlighted line below.');
        }
      });

      revealBtn.addEventListener('click', () => {
        const explain = document.createElement('p');
        explain.className = 'cslab-predict-explain';
        explain.textContent = item.explanation;
        resultBox.appendChild(explain);
      });
    }
  }

  // ── Registration (browser) ─────────────────────────────────────

  if (root.CsLab && typeof root.CsLab.registerTool === 'function') {
    root.CsLab.registerTool('code-predict', {
      title: 'Predict the Output',
      icon: '🔮',
      mount: mount,
    });
  }

  // ── Node export (tests only) ────────────────────────────────────

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normaliseLine: normaliseLine, splitLines: splitLines, diffOutput: diffOutput, ITEMS: ITEMS };
  }
})(typeof window !== 'undefined' ? window : globalThis);
