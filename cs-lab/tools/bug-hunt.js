// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Bug Hunt (two-stage marking, like the exam)
// Registers 'bug-hunt'. Pages: 2-1-2 (default), 2-2-3 ('techniques'),
// 2-3-1 ('defensive'), 2-3-2 ('testing'). See cs-lab.js header for
// the tool contract.
//
// Buggy code is shown line-numbered (ERL per Appendix C of
// CS-CONTENT-PLAN.md, except the one labelled Python item in the
// 'defensive' set, where try/except-free ERL cannot express the fix).
// Stage 1: click the faulty line (1 point). Stage 2: type the
// corrected line (1 point; normalised comparison). Then the student
// labels the bug SYNTAX or LOGIC and reads why — that vocabulary is
// assessed on the exam.
//
// Wrapped so the pure logic (line normalisation / matching) can be
// unit-tested under plain Node — see cs-lab/tools/bug-hunt.test.js.
// ══════════════════════════════════════════════════════════════

(function (root) {
  'use strict';

  // ── Pure logic (unit-tested) ───────────────────────────────────

  // Collapses internal whitespace runs to a single space, trims the
  // ends, and lowercases — so indentation style and keyword case
  // never cause a false "wrong" on an otherwise-correct fix.
  function normaliseForCompare(line) {
    return String(line == null ? '' : line).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function isLineFixCorrect(studentLine, fixedLine) {
    return normaliseForCompare(studentLine) === normaliseForCompare(fixedLine);
  }

  function isFaultyLineFound(clickedIndex, buggyIndex) {
    return clickedIndex === buggyIndex;
  }

  // ── Bug content (Appendix C ERL only, unless lang: 'Python') ────
  // Sets of 5.

  const ITEMS = {
    default: [
      {
        id: 'missing-next-i',
        lang: 'ERL',
        code: ['total = 0', 'for i = 1 to 5', '    total = total + i', 'endfor', 'print(total)'],
        buggyIndex: 3,
        fixedLine: 'next i',
        type: 'SYNTAX',
        why: 'ERL for-loops are closed with "next i", not "endfor" — endfor is not valid ERL syntax.',
      },
      {
        id: 'assign-vs-equals',
        lang: 'ERL',
        code: ['age = 17', 'if age = 18 then', '    print("Adult")', 'else', '    print("Not adult")', 'endif'],
        buggyIndex: 1,
        fixedLine: 'if age == 18 then',
        type: 'SYNTAX',
        why: '== compares two values; a single = is assignment, which cannot appear inside an if condition.',
      },
      {
        id: 'misspelt-print',
        lang: 'ERL',
        code: ['score = 10', 'prnt(score)'],
        buggyIndex: 1,
        fixedLine: 'print(score)',
        type: 'SYNTAX',
        why: '"prnt" is not a recognised command — the keyword is spelt "print".',
      },
      {
        id: 'off-by-one-range',
        lang: 'ERL',
        code: ['// should count from 1 to 5 inclusive', 'count = 0', 'for i = 1 to 4', '    count = count + 1', 'next i', 'print(count)'],
        buggyIndex: 2,
        fixedLine: 'for i = 1 to 5',
        type: 'LOGIC',
        why: 'the loop should run 5 times (1 to 5 inclusive) but stops one iteration early, so count only reaches 4.',
      },
      {
        id: 'missing-endif',
        lang: 'ERL',
        code: ['mark = 45', 'if mark >= 40 then', '    print("Pass")', 'else', '    print("Fail")', 'endwhile'],
        buggyIndex: 5,
        fixedLine: 'endif',
        type: 'SYNTAX',
        why: 'an if-statement is closed with "endif", not "endwhile".',
      },
    ],
    techniques: [
      {
        id: 'wrong-substring-indices',
        lang: 'ERL',
        code: ['word = "Computing"', 'first4 = word.substring(1,4)', 'print(first4)'],
        buggyIndex: 1,
        fixedLine: 'first4 = word.substring(0,4)',
        type: 'LOGIC',
        why: 'substring is 0-indexed, so the first 4 characters start at index 0, not index 1.',
      },
      {
        id: 'missing-int-cast',
        lang: 'ERL',
        code: ['age = input("Enter your age: ")', 'nextYear = age + 1', 'print(nextYear)'],
        buggyIndex: 0,
        fixedLine: 'age = int(input("Enter your age: "))',
        type: 'LOGIC',
        why: 'input() always returns a string, so without int() the "+ 1" tries to add a number to text instead of doing arithmetic.',
      },
      {
        id: 'array-out-of-bounds',
        lang: 'ERL',
        code: ['array scores[5]', 'scores[0] = 60', 'scores[5] = 75', 'print(scores[5])'],
        buggyIndex: 2,
        fixedLine: 'scores[4] = 75',
        type: 'LOGIC',
        why: 'the array has 5 elements, indexed 0 to 4, so index 5 is out of bounds.',
      },
      {
        id: 'wrong-mod-div',
        lang: 'ERL',
        code: ['num = 8', 'if num DIV 2 == 0 then', '    print("Even")', 'else', '    print("Odd")', 'endif'],
        buggyIndex: 1,
        fixedLine: 'if num MOD 2 == 0 then',
        type: 'LOGIC',
        why: 'checking for an even number needs the remainder (MOD), not the quotient (DIV).',
      },
      {
        id: 'missing-return',
        lang: 'ERL',
        code: ['function square(n)', '    result = n * n', '    result', 'endfunction', 'print(square(4))'],
        buggyIndex: 2,
        fixedLine: 'return result',
        type: 'SYNTAX',
        why: 'a function must use "return" to send a value back — just naming the variable does nothing in ERL.',
      },
    ],
    defensive: [
      {
        id: 'invalid-boundary',
        lang: 'ERL',
        code: [
          'mark = int(input("Enter mark (0-100): "))',
          'while mark < 0 OR mark > 101',
          '    mark = int(input("Enter mark (0-100): "))',
          'endwhile',
          'print(mark)',
        ],
        buggyIndex: 1,
        fixedLine: 'while mark < 0 OR mark > 100',
        type: 'LOGIC',
        why: 'marks must be 0-100, but the check only rejects values above 101, so 101 itself wrongly passes validation.',
      },
      {
        id: 'infinite-validation-loop',
        lang: 'ERL',
        code: [
          'mark = int(input("Enter mark (0-100): "))',
          'while mark < 0 OR mark > 100',
          '    print("Invalid mark")',
          '    mark = mark',
          'endwhile',
          'print(mark)',
        ],
        buggyIndex: 3,
        fixedLine: 'mark = int(input("Enter mark (0-100): "))',
        type: 'LOGIC',
        why: 'the loop body never re-reads input, so an invalid value never changes and the loop runs forever.',
      },
      {
        id: 'or-instead-of-and',
        lang: 'ERL',
        code: [
          'if username == "admin" OR password == "letmein123" then',
          '    print("Access granted")',
          'else',
          '    print("Access denied")',
          'endif',
        ],
        buggyIndex: 0,
        fixedLine: 'if username == "admin" AND password == "letmein123" then',
        type: 'LOGIC',
        why: 'using OR means only one of the two needs to be correct — anyone who knows just the password gets in.',
      },
      {
        id: 'missing-lower',
        lang: 'ERL',
        code: ['answer = input("Enter yes or no: ")', 'if answer == "yes" then', '    print("Confirmed")', 'else', '    print("Not confirmed")', 'endif'],
        buggyIndex: 1,
        fixedLine: 'if answer.lower == "yes" then',
        type: 'LOGIC',
        why: 'without .lower, typing "Yes" or "YES" is rejected even though it means the same thing as "yes".',
      },
      {
        id: 'crash-non-numeric',
        lang: 'Python',
        code: ['age_text = input("Enter your age: ")', 'age = int(age_text)', 'print(age)'],
        buggyIndex: 1,
        fixedLine: 'age = int(age_text) if age_text.isdigit() else 0',
        type: 'LOGIC',
        why: 'int() crashes if the text is not a whole number — check age_text.isdigit() first and use a safe default otherwise.',
      },
    ],
    testing: [
      {
        id: 'loop-misses-last-item',
        lang: 'ERL',
        code: [
          'array marks[4]', 'marks[0] = 5', 'marks[1] = 7', 'marks[2] = 6', 'marks[3] = 8',
          'total = 0', 'for i = 0 to 2', '    total = total + marks[i]', 'next i', 'print(total)',
        ],
        buggyIndex: 6,
        fixedLine: 'for i = 0 to 3',
        type: 'LOGIC',
        testCase: { input: 'marks = [5, 7, 6, 8]', expected: '26', actual: '18' },
        why: 'the loop only covers indices 0 to 2, so the last value (index 3) is never added to the total.',
      },
      {
        id: 'wrong-comparison-count',
        lang: 'ERL',
        code: [
          'array nums[5]', 'nums[0] = 3', 'nums[1] = 7', 'nums[2] = 3', 'nums[3] = 3', 'nums[4] = 9',
          'count = 0', 'for i = 0 to 4', '    if nums[i] > 3 then', '        count = count + 1', '    endif', 'next i', 'print(count)',
        ],
        buggyIndex: 8,
        fixedLine: 'if nums[i] == 3 then',
        type: 'LOGIC',
        testCase: { input: 'nums = [3, 7, 3, 3, 9], target = 3', expected: '3', actual: '2' },
        why: 'the program should count values equal to 3, but > checks for greater than instead of equal to.',
      },
      {
        id: 'boundary-excludes-pass-mark',
        lang: 'ERL',
        code: ['mark = 50', 'if mark > 50 then', '    print("Pass")', 'else', '    print("Fail")', 'endif'],
        buggyIndex: 1,
        fixedLine: 'if mark >= 50 then',
        type: 'LOGIC',
        testCase: { input: 'mark = 50', expected: 'Pass', actual: 'Fail' },
        why: 'a mark of exactly 50 should pass, but > excludes it — the boundary needs >=.',
      },
      {
        id: 'wrong-average-divisor',
        lang: 'ERL',
        code: [
          'array temps[4]', 'temps[0] = 10', 'temps[1] = 20', 'temps[2] = 30', 'temps[3] = 40',
          'total = 0', 'for i = 0 to 3', '    total = total + temps[i]', 'next i', 'average = total / 5', 'print(average)',
        ],
        buggyIndex: 9,
        fixedLine: 'average = total / 4',
        type: 'LOGIC',
        testCase: { input: 'temps = [10, 20, 30, 40]', expected: '25', actual: '20' },
        why: 'there are 4 temperatures, but the total is divided by 5, giving the wrong average.',
      },
      {
        id: 'wrong-variable-in-calc',
        lang: 'ERL',
        code: ['price = 100', 'discount = 20', 'finalPrice = price - price', 'print(finalPrice)'],
        buggyIndex: 2,
        fixedLine: 'finalPrice = price - discount',
        type: 'LOGIC',
        testCase: { input: 'price = 100, discount = 20', expected: '80', actual: '0' },
        why: 'the final price subtracts price from itself instead of subtracting the discount, so it always shows 0.',
      },
    ],
  };

  // ── UI ───────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById('cslab-bughunt-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-bughunt-style';
    style.textContent = `
.cslab-bughunt-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }
.cslab-bughunt-picker { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.cslab-bughunt-chip {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px;
  color: var(--ink); font-family: inherit; font-size: 13px; padding: 7px 14px; cursor: pointer;
}
.cslab-bughunt-chip:hover { border-color: var(--accent); }
.cslab-bughunt-chip.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--card-bg)); }
.cslab-bughunt-chip.solved { border-color: var(--success); color: var(--success); }
.cslab-bughunt-lang {
  display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: var(--accent); border: 1px solid var(--accent); border-radius: 4px; padding: 2px 7px; margin-bottom: 8px;
}
.cslab-bughunt-testcase {
  background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px;
  font-size: 13px; margin-bottom: 10px;
}
.cslab-bughunt-code { border: 1px solid var(--border); border-radius: 8px; background: var(--cream); overflow: hidden; margin-bottom: 12px; }
.cslab-bughunt-row {
  display: flex; gap: 10px; padding: 4px 12px; font-family: 'DM Mono', 'Consolas', monospace; font-size: 13px;
  cursor: pointer; white-space: pre;
}
.cslab-bughunt-row:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.cslab-bughunt-row.locked { cursor: default; }
.cslab-bughunt-row.locked:hover { background: none; }
.cslab-bughunt-row.found { background: color-mix(in srgb, #c0392b 12%, transparent); }
.cslab-bughunt-lineno { color: var(--mid); min-width: 1.5em; text-align: right; user-select: none; }
.cslab-bughunt-stage { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
.cslab-bughunt-stage h5 { margin: 0 0 8px; font-size: 13px; color: var(--mid); text-transform: uppercase; letter-spacing: .03em; }
.cslab-bughunt-fixinput {
  font-family: 'DM Mono', 'Consolas', monospace; font-size: 13px; width: 100%; box-sizing: border-box;
  padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--ink);
}
.cslab-bughunt-actions { display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.cslab-bughunt-typebtns { display: flex; gap: 10px; margin-top: 6px; }
.cslab-bughunt-typebtns button.chosen.correct { border-color: var(--success); color: var(--success); }
.cslab-bughunt-typebtns button.chosen.wrong { border-color: #c0392b; color: #c0392b; }
.cslab-bughunt-why { color: var(--mid); font-size: 13px; margin-top: 10px; }
`;
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyle();
    const set = (ctx.config && ITEMS[ctx.config.set]) ? ctx.config.set : 'default';
    const items = ITEMS[set];
    let solvedIds = ctx.store.get('solved', []);

    const wrap = ctx.ui.el(
      '<div class="cslab-bughunt">' +
      '<p class="cslab-bughunt-intro">Just like the exam: first click the line with the bug, then type the corrected line, then say whether it was a SYNTAX or a LOGIC error.</p>' +
      '<div class="cslab-bughunt-picker"></div>' +
      '<div class="cslab-bughunt-stage-wrap" style="display:none"></div>' +
      '</div>'
    );
    el.appendChild(wrap);
    const picker = wrap.querySelector('.cslab-bughunt-picker');
    const stageWrap = wrap.querySelector('.cslab-bughunt-stage-wrap');
    const chips = {};

    items.forEach((item, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cslab-bughunt-chip' + (solvedIds.indexOf(item.id) !== -1 ? ' solved' : '');
      chip.textContent = 'Bug ' + (idx + 1);
      chip.addEventListener('click', () => loadItem(item, chip));
      chips[item.id] = chip;
      picker.appendChild(chip);
    });

    function loadItem(item, chip) {
      Object.keys(chips).forEach(id => chips[id].classList.toggle('active', id === item.id));
      stageWrap.style.display = '';
      stageWrap.innerHTML = '';

      let stage1Done = false;
      let stage2Done = false;

      const lang = document.createElement('span');
      lang.className = 'cslab-bughunt-lang';
      lang.textContent = item.lang;
      stageWrap.appendChild(lang);

      if (item.testCase) {
        const tc = document.createElement('div');
        tc.className = 'cslab-bughunt-testcase';
        tc.innerHTML = '<strong>Failing test:</strong> ';
        const span = document.createElement('span');
        span.textContent = 'input ' + item.testCase.input + ' → expected ' + item.testCase.expected + ', but this code gives ' + item.testCase.actual + '.';
        tc.appendChild(span);
        stageWrap.appendChild(tc);
      }

      const codeBox = document.createElement('div');
      codeBox.className = 'cslab-bughunt-code';
      stageWrap.appendChild(codeBox);

      const rows = item.code.map((line, idx) => {
        const row = document.createElement('div');
        row.className = 'cslab-bughunt-row';
        const no = document.createElement('span');
        no.className = 'cslab-bughunt-lineno';
        no.textContent = String(idx + 1);
        const text = document.createElement('span');
        text.textContent = line;
        row.appendChild(no);
        row.appendChild(text);
        row.addEventListener('click', () => handleLineClick(idx, row));
        codeBox.appendChild(row);
        return row;
      });

      const stage1Feedback = document.createElement('span');
      stage1Feedback.className = 'cslab-feedback';
      stageWrap.appendChild(stage1Feedback);

      const stage2Area = document.createElement('div');
      stage2Area.className = 'cslab-bughunt-stage';
      stage2Area.style.display = 'none';
      stage2Area.innerHTML = '<h5>Stage 2 — type the corrected line</h5>';
      const fixInput = document.createElement('input');
      fixInput.type = 'text';
      fixInput.className = 'cslab-bughunt-fixinput';
      fixInput.setAttribute('spellcheck', 'false');
      fixInput.setAttribute('autocomplete', 'off');
      stage2Area.appendChild(fixInput);
      const stage2Actions = document.createElement('div');
      stage2Actions.className = 'cslab-bughunt-actions';
      const checkFixBtn = ctx.ui.btn('Check fix');
      const stage2Feedback = document.createElement('span');
      stage2Feedback.className = 'cslab-feedback';
      stage2Actions.appendChild(checkFixBtn);
      stage2Actions.appendChild(stage2Feedback);
      stage2Area.appendChild(stage2Actions);
      stageWrap.appendChild(stage2Area);

      const stage3Area = document.createElement('div');
      stage3Area.className = 'cslab-bughunt-stage';
      stage3Area.style.display = 'none';
      stage3Area.innerHTML = '<h5>Stage 3 — what kind of bug was this?</h5>';
      const typeBtns = document.createElement('div');
      typeBtns.className = 'cslab-bughunt-typebtns';
      const syntaxBtn = ctx.ui.btn('SYNTAX', 'secondary');
      const logicBtn = ctx.ui.btn('LOGIC', 'secondary');
      typeBtns.appendChild(syntaxBtn);
      typeBtns.appendChild(logicBtn);
      stage3Area.appendChild(typeBtns);
      const whyBox = document.createElement('p');
      whyBox.className = 'cslab-bughunt-why';
      whyBox.style.display = 'none';
      stage3Area.appendChild(whyBox);
      stageWrap.appendChild(stage3Area);

      function handleLineClick(idx, row) {
        if (stage1Done) return;
        if (isFaultyLineFound(idx, item.buggyIndex)) {
          stage1Done = true;
          row.classList.add('found');
          rows.forEach(r => r.classList.add('locked'));
          ctx.ui.feedback(stage1Feedback, true, 'Found it — that line has the bug.');
          stage2Area.style.display = '';
          fixInput.focus();
        } else {
          ctx.ui.feedback(stage1Feedback, false, 'Not that line — look again.');
        }
      }

      checkFixBtn.addEventListener('click', () => {
        if (isLineFixCorrect(fixInput.value, item.fixedLine)) {
          stage2Done = true;
          ctx.ui.feedback(stage2Feedback, true, 'Correct fix!');
          stage3Area.style.display = '';
        } else {
          ctx.ui.feedback(stage2Feedback, false, 'Not quite — check spelling, keywords and operators.');
        }
      });

      function chooseType(chosen, btn, otherBtn) {
        if (!stage2Done) return;
        const correct = chosen === item.type;
        btn.classList.add('chosen', correct ? 'correct' : 'wrong');
        otherBtn.disabled = true;
        btn.disabled = true;
        whyBox.style.display = '';
        whyBox.textContent = (correct ? 'Yes — a ' : 'Actually a ') + item.type + ' error. ' + item.why;
        if (solvedIds.indexOf(item.id) === -1) {
          solvedIds = solvedIds.concat([item.id]);
          ctx.store.set('solved', solvedIds);
        }
        chip.classList.add('solved');
        ctx.complete({ item: item.id });
      }

      syntaxBtn.addEventListener('click', () => chooseType('SYNTAX', syntaxBtn, logicBtn));
      logicBtn.addEventListener('click', () => chooseType('LOGIC', logicBtn, syntaxBtn));
    }
  }

  // ── Registration (browser) ─────────────────────────────────────

  if (root.CsLab && typeof root.CsLab.registerTool === 'function') {
    root.CsLab.registerTool('bug-hunt', {
      title: 'Bug Hunt',
      icon: '🐛',
      mount: mount,
    });
  }

  // ── Node export (tests only) ────────────────────────────────────

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normaliseForCompare: normaliseForCompare,
      isLineFixCorrect: isLineFixCorrect,
      isFaultyLineFound: isFaultyLineFound,
      ITEMS: ITEMS,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
