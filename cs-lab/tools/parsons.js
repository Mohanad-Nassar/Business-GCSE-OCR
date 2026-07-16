// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Algorithm Builder (Parsons problems), tool T4
// Registers 'parsons'. Pages: 2-1-2 + 2-2-1 (default set), 2-1-3
// (config.set === 'sorting'). See cs-lab.js header for the tool contract.
//
// Shuffled lines of an ERL algorithm (Appendix C of CS-CONTENT-PLAN.md
// is the only ERL reference) become draggable cards; students reorder
// them into the working algorithm and drag any line that doesn't
// belong into the "not needed" bin. Every interaction has a tap
// fallback (select a line, then tap the target) so it works on touch.
//
// Wrapped so the pure logic (shuffle/isSolved/tokensForPuzzle) can be
// unit-tested under plain Node — see cs-lab/tools/parsons.test.js —
// without pulling in `window`/`document`.
// ══════════════════════════════════════════════════════════════

(function (root) {
  'use strict';

  // ── Pure logic (unit-tested) ───────────────────────────────────

  // Fisher-Yates shuffle. Returns a NEW array; does not mutate `arr`.
  // `rnd` is injectable so tests can pass a deterministic generator.
  function shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  // Lines get ids 'l0','l1',... (in target order) and distractors
  // get ids 'd0','d1',... — this is the whole puzzle "shape".
  function tokensForPuzzle(puzzle) {
    const lineTokens = puzzle.lines.map((text, i) => ({ id: 'l' + i, text: text, isDistractor: false }));
    const distractorTokens = puzzle.distractors.map((text, i) => ({ id: 'd' + i, text: text, isDistractor: true }));
    return lineTokens.concat(distractorTokens);
  }

  // Solved when the workspace holds exactly the line tokens in order
  // 'l0','l1',... and the bin holds exactly the distractor tokens
  // (bin order doesn't matter — they're just "not needed").
  function isSolved(workspaceIds, binIds, puzzle) {
    const wantLines = puzzle.lines.map((_, i) => 'l' + i);
    if (workspaceIds.length !== wantLines.length) return false;
    for (let i = 0; i < wantLines.length; i++) {
      if (workspaceIds[i] !== wantLines[i]) return false;
    }
    const wantDistractors = puzzle.distractors.map((_, i) => 'd' + i).slice().sort();
    const gotDistractors = binIds.slice().sort();
    if (gotDistractors.length !== wantDistractors.length) return false;
    for (let i = 0; i < wantDistractors.length; i++) {
      if (gotDistractors[i] !== wantDistractors[i]) return false;
    }
    return true;
  }

  // Move token `id` out of whichever of workspace/bin currently holds
  // it and insert it into `destArr` at `destIndex`. Mutates both
  // arrays in place (matches how the mount() UI state is threaded).
  function moveToken(id, workspaceArr, binArr, destKey, destIndex) {
    const srcKey = workspaceArr.indexOf(id) !== -1 ? 'workspace' : (binArr.indexOf(id) !== -1 ? 'bin' : null);
    if (!srcKey) return;
    const srcArr = srcKey === 'workspace' ? workspaceArr : binArr;
    const srcIdx = srcArr.indexOf(id);
    srcArr.splice(srcIdx, 1);
    if (srcKey === destKey && srcIdx < destIndex) destIndex -= 1;
    const destArr = destKey === 'workspace' ? workspaceArr : binArr;
    destIndex = Math.max(0, Math.min(destIndex, destArr.length));
    destArr.splice(destIndex, 0, id);
  }

  // ── Puzzle content (Appendix C ERL only) ───────────────────────
  // 5 per set, 0–2 plausible distractors each.

  const PUZZLES = {
    default: [
      {
        id: 'input-validate',
        title: 'Input and validate',
        lines: [
          'num = input("Enter a number between 1 and 10: ")',
          'num = int(num)',
          'while num < 1 OR num > 10',
          '    print("Invalid, try again")',
          '    num = input("Enter a number between 1 and 10: ")',
          '    num = int(num)',
          'endwhile',
          'print("Valid number entered")',
        ],
        distractors: [
          'while num < 1 AND num > 10',
          'endif',
        ],
        explanation: 'The loop keeps asking for input and re-validating until the number entered is inside the allowed range.',
      },
      {
        id: 'find-max',
        title: 'Find the maximum in an array',
        lines: [
          '// nums already contains 5 values',
          'max = nums[0]',
          'for i = 1 to 4',
          '    if nums[i] > max then',
          '        max = nums[i]',
          '    endif',
          'next i',
          'print(max)',
        ],
        distractors: [
          'for i = 0 to 4',
          'if nums[i] < max then',
        ],
        explanation: 'Start by assuming the first item is the biggest, then compare every other item and update max whenever a bigger one turns up.',
      },
      {
        id: 'average',
        title: 'Average of array values',
        lines: [
          '// values already contains 5 numbers',
          'total = 0',
          'for i = 0 to 4',
          '    total = total + values[i]',
          'next i',
          'average = total / 5',
          'print(average)',
        ],
        distractors: [
          'average = total DIV 5',
          'for i = 1 to 5',
        ],
        explanation: 'Add every value to a running total inside the loop, then divide the total by how many values there are.',
      },
      {
        id: 'countdown',
        title: 'Countdown with while',
        lines: [
          'count = 10',
          'while count > 0',
          '    print(count)',
          '    count = count - 1',
          'endwhile',
          'print("Blast off!")',
        ],
        distractors: [
          'count = count + 1',
          'while count >= 0',
        ],
        explanation: 'The loop prints the counter then decreases it by 1 each time, stopping as soon as it reaches 0.',
      },
      {
        id: 'fizzbuzz',
        title: 'FizzBuzz-style MOD printer',
        lines: [
          'for i = 1 to 15',
          '    if i MOD 15 == 0 then',
          '        print("FizzBuzz")',
          '    elseif i MOD 3 == 0 then',
          '        print("Fizz")',
          '    elseif i MOD 5 == 0 then',
          '        print("Buzz")',
          '    else',
          '        print(i)',
          '    endif',
          'next i',
        ],
        distractors: [
          'if i MOD 15 = 0 then',
          'endfor',
        ],
        explanation: 'Checking divisibility by 15 first catches multiples of both 3 and 5, so that more specific case is never missed by the later checks.',
      },
    ],
    sorting: [
      {
        id: 'sort-bubble-pass',
        title: 'One bubble sort pass',
        lines: [
          'for i = 0 to 3',
          '    if nums[i] > nums[i + 1] then',
          '        temp = nums[i]',
          '        nums[i] = nums[i + 1]',
          '        nums[i + 1] = temp',
          '    endif',
          'next i',
        ],
        distractors: [
          'for i = 0 to 4',
          'if nums[i] < nums[i + 1] then',
        ],
        explanation: 'Compare each pair of neighbours once and swap them if they are in the wrong order — this pushes the largest value one step towards the end.',
      },
      {
        id: 'sort-bubble-full',
        title: 'Full bubble sort with swapped flag',
        lines: [
          'swapped = true',
          'while swapped == true',
          '    swapped = false',
          '    for i = 0 to 3',
          '        if nums[i] > nums[i + 1] then',
          '            temp = nums[i]',
          '            nums[i] = nums[i + 1]',
          '            nums[i + 1] = temp',
          '            swapped = true',
          '        endif',
          '    next i',
          'endwhile',
        ],
        distractors: [
          'swapped = false',
          'while swapped == false',
        ],
        explanation: 'Keep repeating passes through the list until one whole pass makes no swaps — that means the list is now fully sorted.',
      },
      {
        id: 'sort-linear-search',
        title: 'Linear search',
        lines: [
          'found = false',
          'for i = 0 to 9',
          '    if nums[i] == target then',
          '        found = true',
          '        position = i',
          '    endif',
          'next i',
          'print(found)',
        ],
        distractors: [
          'if nums[i] = target then',
          'for i = 0 to 10',
        ],
        explanation: 'Check every item in turn from the start, recording the position whenever it matches the target.',
      },
      {
        id: 'sort-binary-search',
        title: 'Binary search (high/low/mid)',
        lines: [
          'low = 0',
          'high = 9',
          'found = false',
          'while low <= high AND found == false',
          '    mid = (low + high) DIV 2',
          '    if nums[mid] == target then',
          '        found = true',
          '    elseif nums[mid] < target then',
          '        low = mid + 1',
          '    else',
          '        high = mid - 1',
          '    endif',
          'endwhile',
          'print(found)',
        ],
        distractors: [
          'mid = (low + high) / 2',
          'low = mid',
        ],
        explanation: 'Repeatedly halve the search range by comparing the target to the middle item, moving low or high depending on the result.',
      },
      {
        id: 'sort-insertion',
        title: 'Insertion of an element into a sorted array',
        lines: [
          'i = n - 1',
          'while i >= 0 AND nums[i] > newValue',
          '    nums[i + 1] = nums[i]',
          '    i = i - 1',
          'endwhile',
          'nums[i + 1] = newValue',
          'n = n + 1',
        ],
        distractors: [
          'nums[i] = nums[i + 1]',
          'i = n',
        ],
        explanation: 'Shift every larger element one place to the right to make a gap, then drop the new value into that gap.',
      },
    ],
  };

  // ── UI ───────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById('cslab-parsons-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-parsons-style';
    style.textContent = `
.cslab-parsons-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }
.cslab-parsons-picker { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.cslab-parsons-chip {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px;
  color: var(--ink); font-family: inherit; font-size: 13px; padding: 7px 14px; cursor: pointer;
}
.cslab-parsons-chip:hover { border-color: var(--accent); }
.cslab-parsons-chip.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--card-bg)); }
.cslab-parsons-chip.solved { border-color: var(--success); color: var(--success); }
.cslab-parsons-stage h4 { margin: 0 0 4px; font-size: 16px; }
.cslab-parsons-zone { margin-bottom: 14px; }
.cslab-parsons-zone-label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: var(--mid); margin-bottom: 6px; }
.cslab-parsons-list {
  list-style: none; margin: 0; padding: 8px; min-height: 46px;
  background: var(--cream); border: 1px dashed var(--border); border-radius: 8px;
  display: flex; flex-direction: column; gap: 6px;
}
.cslab-parsons-list.bin { background: color-mix(in srgb, var(--mid) 8%, var(--cream)); }
.cslab-parsons-line {
  display: flex; align-items: center; gap: 8px; background: var(--card-bg);
  border: 1px solid var(--border); border-radius: 6px; padding: 7px 10px;
  font-family: 'DM Mono', 'Consolas', monospace; font-size: 13px; white-space: pre; cursor: grab;
  user-select: none;
}
.cslab-parsons-line:active { cursor: grabbing; }
.cslab-parsons-line.dragging { opacity: .4; }
.cslab-parsons-line.selected { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
.cslab-parsons-handle { color: var(--mid); font-size: 12px; }
.cslab-parsons-actions { display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.cslab-parsons-answer {
  margin: 10px 0 0; padding: 10px 14px; background: var(--cream); border: 1px solid var(--border);
  border-radius: 8px; font-family: 'DM Mono', 'Consolas', monospace; font-size: 13px; white-space: pre;
}
.cslab-parsons-explain { color: var(--mid); font-size: 13px; margin-top: 8px; }
`;
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyle();
    const set = ctx.config && ctx.config.set === 'sorting' ? 'sorting' : 'default';
    const puzzles = PUZZLES[set];
    let solvedIds = ctx.store.get('solved', []);

    const wrap = ctx.ui.el(
      '<div class="cslab-parsons">' +
      '<p class="cslab-parsons-intro">Choose a puzzle below, then drag the lines into the correct order. Drag any line that does not belong into the "Not needed" bin. On a phone or tablet, tap a line to pick it up, then tap where it should go.</p>' +
      '<div class="cslab-parsons-picker"></div>' +
      '<div class="cslab-parsons-stage" style="display:none"></div>' +
      '</div>'
    );
    el.appendChild(wrap);
    const picker = wrap.querySelector('.cslab-parsons-picker');
    const stage = wrap.querySelector('.cslab-parsons-stage');
    const chips = {};

    puzzles.forEach((puzzle, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cslab-parsons-chip' + (solvedIds.indexOf(puzzle.id) !== -1 ? ' solved' : '');
      chip.textContent = (idx + 1) + '. ' + puzzle.title;
      chip.addEventListener('click', () => loadPuzzle(puzzle, chip));
      chips[puzzle.id] = chip;
      picker.appendChild(chip);
    });

    function loadPuzzle(puzzle, chip) {
      Object.keys(chips).forEach(id => chips[id].classList.toggle('active', id === puzzle.id));
      stage.style.display = '';
      stage.innerHTML = '';

      const tokens = tokensForPuzzle(puzzle);
      const byId = {};
      tokens.forEach(t => { byId[t.id] = t; });

      let workspaceOrder = shuffle(tokens.map(t => t.id));
      let binOrder = [];
      let selectedId = null;
      let fails = 0;

      const head = ctx.ui.el('<h4></h4>');
      head.textContent = puzzle.title;
      stage.appendChild(head);

      const workspaceZone = ctx.ui.el(
        '<div class="cslab-parsons-zone">' +
        '<span class="cslab-parsons-zone-label">Algorithm (in order)</span>' +
        '<ol class="cslab-parsons-list workspace"></ol>' +
        '</div>'
      );
      const binZone = ctx.ui.el(
        '<div class="cslab-parsons-zone">' +
        '<span class="cslab-parsons-zone-label">Not needed</span>' +
        '<ul class="cslab-parsons-list bin"></ul>' +
        '</div>'
      );
      stage.appendChild(workspaceZone);
      stage.appendChild(binZone);
      const workspaceEl = workspaceZone.querySelector('.workspace');
      const binEl = binZone.querySelector('.bin');

      const actions = ctx.ui.el('<div class="cslab-parsons-actions"></div>');
      const checkBtn = ctx.ui.btn('Check');
      const revealBtn = ctx.ui.btn('Reveal', 'secondary');
      revealBtn.style.display = 'none';
      const feedback = document.createElement('span');
      feedback.className = 'cslab-feedback';
      actions.appendChild(checkBtn);
      actions.appendChild(revealBtn);
      actions.appendChild(feedback);
      stage.appendChild(actions);

      const answerBox = document.createElement('div');
      answerBox.style.display = 'none';
      stage.appendChild(answerBox);

      function arrFor(key) { return key === 'workspace' ? workspaceOrder : binOrder; }

      function buildLine(id) {
        const token = byId[id];
        const li = document.createElement('li');
        li.className = 'cslab-parsons-line';
        li.draggable = true;
        li.dataset.id = id;
        const handle = document.createElement('span');
        handle.className = 'cslab-parsons-handle';
        handle.textContent = '⠿';
        const text = document.createElement('span');
        text.textContent = token.text;
        li.appendChild(handle);
        li.appendChild(text);
        if (id === selectedId) li.classList.add('selected');

        li.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', id);
          e.dataTransfer.effectAllowed = 'move';
          li.classList.add('dragging');
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.addEventListener('dragover', e => e.preventDefault());
        li.addEventListener('drop', e => {
          e.preventDefault();
          e.stopPropagation();
          const draggedId = e.dataTransfer.getData('text/plain');
          if (!draggedId || !byId[draggedId]) return;
          const containerKey = li.parentElement === workspaceEl ? 'workspace' : 'bin';
          const idx = Array.prototype.indexOf.call(li.parentElement.children, li);
          const rect = li.getBoundingClientRect();
          const before = (e.clientY - rect.top) < rect.height / 2;
          moveToken(draggedId, workspaceOrder, binOrder, containerKey, before ? idx : idx + 1);
          render();
        });

        li.addEventListener('click', () => {
          const containerKey = li.parentElement === workspaceEl ? 'workspace' : 'bin';
          const idx = Array.prototype.indexOf.call(li.parentElement.children, li);
          handleTap(id, containerKey, idx);
        });
        return li;
      }

      function handleTap(clickedId, containerKey, idx) {
        if (!selectedId) {
          selectedId = clickedId;
          render();
          return;
        }
        if (selectedId === clickedId) {
          selectedId = null;
          render();
          return;
        }
        moveToken(selectedId, workspaceOrder, binOrder, containerKey, idx);
        selectedId = null;
        render();
      }

      [{ el: workspaceEl, key: 'workspace' }, { el: binEl, key: 'bin' }].forEach(({ el: containerEl, key }) => {
        containerEl.addEventListener('dragover', e => e.preventDefault());
        containerEl.addEventListener('drop', e => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('text/plain');
          if (!draggedId || !byId[draggedId]) return;
          moveToken(draggedId, workspaceOrder, binOrder, key, arrFor(key).length);
          render();
        });
        containerEl.addEventListener('click', e => {
          if (e.target !== containerEl) return; // background only, not a bubbled line click
          if (!selectedId) return;
          moveToken(selectedId, workspaceOrder, binOrder, key, arrFor(key).length);
          selectedId = null;
          render();
        });
      });

      function render() {
        workspaceEl.innerHTML = '';
        workspaceOrder.forEach(id => workspaceEl.appendChild(buildLine(id)));
        binEl.innerHTML = '';
        binOrder.forEach(id => binEl.appendChild(buildLine(id)));
      }

      checkBtn.addEventListener('click', () => {
        const ok = isSolved(workspaceOrder, binOrder, puzzle);
        if (ok) {
          ctx.ui.feedback(feedback, true, 'Correct — that is the right order.');
          if (solvedIds.indexOf(puzzle.id) === -1) {
            solvedIds = solvedIds.concat([puzzle.id]);
            ctx.store.set('solved', solvedIds);
          }
          chip.classList.add('solved');
          ctx.complete({ puzzle: puzzle.id });
        } else {
          fails += 1;
          ctx.ui.feedback(feedback, false, fails === 1
            ? 'Not quite — check the order, and whether any lines belong in "Not needed".'
            : 'Still not right. Try again, or reveal the explanation below.');
          if (fails >= 2) revealBtn.style.display = '';
        }
      });

      revealBtn.addEventListener('click', () => {
        answerBox.style.display = '';
        answerBox.innerHTML = '';
        const ans = document.createElement('div');
        ans.className = 'cslab-parsons-answer';
        ans.textContent = puzzle.lines.join('\n');
        const explain = document.createElement('p');
        explain.className = 'cslab-parsons-explain';
        explain.textContent = puzzle.explanation;
        answerBox.appendChild(ans);
        answerBox.appendChild(explain);
      });

      render();
    }
  }

  // ── Registration (browser) ─────────────────────────────────────

  if (root.CsLab && typeof root.CsLab.registerTool === 'function') {
    root.CsLab.registerTool('parsons', {
      title: 'Algorithm Builder',
      icon: '🧩',
      mount: mount,
    });
  }

  // ── Node export (tests only) ────────────────────────────────────

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shuffle: shuffle, tokensForPuzzle: tokensForPuzzle, isSolved: isSolved, moveToken: moveToken, PUZZLES: PUZZLES };
  }
})(typeof window !== 'undefined' ? window : globalThis);
