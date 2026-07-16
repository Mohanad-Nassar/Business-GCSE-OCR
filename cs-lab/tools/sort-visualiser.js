// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Sort & Search Visualiser (T9, CS-CONTENT-PLAN §7.1)
// Registers 'sort-visualiser' on 2.1.3 Searching and Sorting Algorithms.
//
// Everything below the "PURE STEP GENERATORS" banner has no DOM
// dependency — it takes a list (and a target, for search) and returns
// a precomputed array of step objects. The UI at the bottom just
// plays that array; nothing in the algorithms themselves touches the
// page. This split is what makes the logic unit-testable in plain
// Node (see the module.exports guard at the very end).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── PURE STEP GENERATORS ────────────────────────────────────────
  // step = { state, highlights, caption, comparisons, passEnd }
  //   state       — array snapshot AFTER this step's action
  //   highlights  — which bars/indices to draw attention to
  //   caption     — plain-English commentary, exam mark-scheme vocabulary
  //   comparisons — cumulative comparison count up to and including this step
  //   passEnd     — true at a natural checkpoint (end of pass / end of check)

  function mkStep(list, highlights, caption, comparisons, passEnd) {
    return {
      state: list.slice(),
      highlights: highlights || {},
      caption: caption,
      comparisons: comparisons,
      passEnd: !!passEnd,
    };
  }

  function range(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  function bubbleSortSteps(input) {
    const list = input.slice();
    const n = list.length;
    const steps = [];
    let comparisons = 0;
    const sortedIdx = new Set();

    steps.push(mkStep(list, {}, 'Starting list: [' + list.join(', ') + '].', comparisons, false));

    let limit = n - 1;
    let pass = 0;
    let anySwapThisPass = true;

    while (limit > 0 && anySwapThisPass) {
      pass += 1;
      anySwapThisPass = false;
      for (let i = 0; i < limit; i++) {
        comparisons += 1;
        const a = list[i], b = list[i + 1];
        if (a > b) {
          list[i] = b;
          list[i + 1] = a;
          anySwapThisPass = true;
          steps.push(mkStep(list, { compare: [i, i + 1], swap: [i, i + 1], sorted: Array.from(sortedIdx) },
            'Compare ' + a + ' and ' + b + ' — swap.', comparisons, false));
        } else {
          steps.push(mkStep(list, { compare: [i, i + 1], sorted: Array.from(sortedIdx) },
            'Compare ' + a + ' and ' + b + ' — no swap needed.', comparisons, false));
        }
      }
      sortedIdx.add(limit);
      limit -= 1;
      const caption = pass === 1
        ? 'End of pass 1: largest value has bubbled to the end.'
        : 'End of pass ' + pass + ': next largest value has bubbled into place.';
      steps.push(mkStep(list, { sorted: Array.from(sortedIdx) }, caption, comparisons, true));
      if (!anySwapThisPass) {
        for (let k = 0; k <= limit; k++) sortedIdx.add(k);
        steps.push(mkStep(list, { sorted: Array.from(sortedIdx) },
          'No swaps in this pass — the list is already sorted. Stop.', comparisons, true));
      }
    }
    if (limit <= 0) sortedIdx.add(0);
    steps.push(mkStep(list, { sorted: range(0, n - 1) }, 'Sorted! [' + list.join(', ') + '].', comparisons, true));
    return { steps: steps, finalState: list, comparisons: comparisons };
  }

  function insertionSortSteps(input) {
    const list = input.slice();
    const n = list.length;
    const steps = [];
    let comparisons = 0;
    let sorted = [0];

    steps.push(mkStep(list, { sorted: sorted.slice() },
      'Starting list: [' + list.join(', ') + ']. The first value counts as a sorted list of one.', comparisons, false));

    for (let i = 1; i < n; i++) {
      const key = list[i];
      steps.push(mkStep(list, { key: i, sorted: sorted.slice() },
        'Pass ' + i + ': take ' + key + ' and find its place in the sorted part.', comparisons, false));
      let j = i - 1;
      while (j >= 0) {
        comparisons += 1;
        if (list[j] > key) {
          const bumped = list[j];
          list[j + 1] = list[j];
          steps.push(mkStep(list, { compare: [j, j + 1], shift: j, sorted: sorted.slice() },
            'Compare ' + key + ' and ' + bumped + ' — ' + bumped + ' is bigger, shift it right.', comparisons, false));
          j -= 1;
        } else {
          steps.push(mkStep(list, { compare: [j, j + 1], sorted: sorted.slice() },
            'Compare ' + key + ' and ' + list[j] + ' — ' + key + ' stays here, insert next to it.', comparisons, false));
          break;
        }
      }
      list[j + 1] = key;
      sorted = range(0, i);
      steps.push(mkStep(list, { inserted: j + 1, sorted: sorted.slice() },
        'Insert ' + key + ' into position ' + (j + 1) + '.', comparisons, false));
      const itemWord = (i + 1) + (i + 1 === 1 ? ' item is' : ' items are');
      steps.push(mkStep(list, { sorted: sorted.slice() },
        'End of pass ' + i + ': first ' + itemWord + ' in order.', comparisons, true));
    }
    steps.push(mkStep(list, { sorted: range(0, n - 1) }, 'Sorted! [' + list.join(', ') + '].', comparisons, true));
    return { steps: steps, finalState: list, comparisons: comparisons };
  }

  function mergeSortSteps(input) {
    const list = input.slice();
    const n = list.length;
    const steps = [];
    let comparisons = 0;

    steps.push(mkStep(list, {}, 'Starting list: [' + list.join(', ') + '].', comparisons, false));

    function merge(lo, mid, hi) {
      const left = list.slice(lo, mid + 1);
      const right = list.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        comparisons += 1;
        if (left[i] <= right[j]) {
          list[k] = left[i];
          steps.push(mkStep(list, { mergeRange: [lo, hi], take: k },
            'Merge: take ' + left[i] + ' from the left half.', comparisons, false));
          i += 1;
        } else {
          list[k] = right[j];
          steps.push(mkStep(list, { mergeRange: [lo, hi], take: k },
            'Merge: take ' + right[j] + ' from the right half.', comparisons, false));
          j += 1;
        }
        k += 1;
      }
      while (i < left.length) {
        list[k] = left[i];
        steps.push(mkStep(list, { mergeRange: [lo, hi], take: k },
          'Merge: copy the rest of the left half — take ' + left[i] + '.', comparisons, false));
        i += 1; k += 1;
      }
      while (j < right.length) {
        list[k] = right[j];
        steps.push(mkStep(list, { mergeRange: [lo, hi], take: k },
          'Merge: copy the rest of the right half — take ' + right[j] + '.', comparisons, false));
        j += 1; k += 1;
      }
      steps.push(mkStep(list, { sorted: range(lo, hi), mergeRange: [lo, hi] },
        'Merged: [' + list.slice(lo, hi + 1).join(', ') + '] is now in order.', comparisons, true));
    }

    function recurse(lo, hi) {
      if (hi - lo < 1) return;
      const mid = Math.floor((lo + hi) / 2);
      steps.push(mkStep(list, { mergeRange: [lo, hi], splitAt: mid },
        'Split into [' + list.slice(lo, mid + 1).join(', ') + '] and [' + list.slice(mid + 1, hi + 1).join(', ') + '].',
        comparisons, false));
      recurse(lo, mid);
      recurse(mid + 1, hi);
      merge(lo, mid, hi);
    }

    recurse(0, n - 1);
    steps.push(mkStep(list, { sorted: range(0, n - 1) }, 'Sorted! [' + list.join(', ') + '].', comparisons, true));
    return { steps: steps, finalState: list, comparisons: comparisons };
  }

  function linearSearchSteps(input, target) {
    const list = input.slice();
    const steps = [];
    let comparisons = 0;
    steps.push(mkStep(list, {}, 'Searching for ' + target + ' in [' + list.join(', ') + '], starting at index 0.', comparisons, false));
    for (let i = 0; i < list.length; i++) {
      comparisons += 1;
      if (list[i] === target) {
        steps.push(mkStep(list, { compare: [i], found: i },
          'Check index ' + i + ': is ' + list[i] + ' equal to ' + target + '? Yes — found at index ' + i + '.', comparisons, true));
        return { steps: steps, foundIndex: i, comparisons: comparisons };
      }
      steps.push(mkStep(list, { compare: [i] },
        'Check index ' + i + ': is ' + list[i] + ' equal to ' + target + '? No — move to the next item.', comparisons, true));
    }
    steps.push(mkStep(list, { notFound: true }, 'Reached the end of the list — ' + target + ' was not found.', comparisons, true));
    return { steps: steps, foundIndex: -1, comparisons: comparisons };
  }

  function binarySearchSteps(input, target) {
    const original = input.slice();
    const list = original.slice().sort(function (a, b) { return a - b; });
    const steps = [];
    let comparisons = 0;
    let wasSorted = true;
    for (let i = 1; i < original.length; i++) {
      if (original[i - 1] > original[i]) { wasSorted = false; break; }
    }
    if (wasSorted) {
      steps.push(mkStep(list, {}, 'The list [' + list.join(', ') + '] is already sorted — binary search can start.', comparisons, false));
    } else {
      steps.push(mkStep(list, {},
        'Binary search needs a sorted list — sorting [' + original.join(', ') + '] first: [' + list.join(', ') + '].', comparisons, false));
    }
    let low = 0, high = list.length - 1, foundIndex = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      comparisons += 1;
      if (list[mid] === target) {
        steps.push(mkStep(list, { low: low, high: high, mid: mid, found: mid },
          'low=' + low + ', high=' + high + ', mid=' + mid + ' — check ' + list[mid] + ': equal to ' + target + '. Found at index ' + mid + '.',
          comparisons, true));
        foundIndex = mid;
        break;
      } else if (list[mid] < target) {
        steps.push(mkStep(list, { low: low, high: high, mid: mid, discarded: range(low, mid) },
          'low=' + low + ', high=' + high + ', mid=' + mid + ' — check ' + list[mid] + ': smaller than ' + target + '. Search the right half — discard indices ' + low + '-' + mid + '.',
          comparisons, true));
        low = mid + 1;
      } else {
        steps.push(mkStep(list, { low: low, high: high, mid: mid, discarded: range(mid, high) },
          'low=' + low + ', high=' + high + ', mid=' + mid + ' — check ' + list[mid] + ': bigger than ' + target + '. Search the left half — discard indices ' + mid + '-' + high + '.',
          comparisons, true));
        high = mid - 1;
      }
    }
    if (foundIndex === -1) {
      steps.push(mkStep(list, { notFound: true }, 'low has passed high — ' + target + ' is not in the list.', comparisons, true));
    }
    return { steps: steps, foundIndex: foundIndex, sortedList: list, comparisons: comparisons };
  }

  // ── PURE QUIZ HELPERS (predict-the-next-step mode) ──────────────
  // Distractors are always drawn from OTHER real steps in the same
  // run (not invented), per the task spec.

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function uniqueSample(pool, count, rng, keyFn) {
    keyFn = keyFn || function (x) { return x; };
    const seen = new Set();
    const shuffled = shuffle(pool, rng);
    const out = [];
    for (let i = 0; i < shuffled.length && out.length < count; i++) {
      const k = keyFn(shuffled[i]);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(shuffled[i]);
    }
    return out;
  }

  function perturb(state, rng) {
    const copy = state.slice();
    if (copy.length < 2) return copy;
    const i = Math.floor(rng() * copy.length);
    let j = Math.floor(rng() * copy.length);
    if (j === i) j = (j + 1) % copy.length;
    const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    return copy;
  }

  // Picks `count` distinct step indices (>=1, so each has a "before" state)
  // at which to pause playback and ask a question about steps[index].
  function pickQuizIndices(steps, count, rng) {
    rng = rng || Math.random;
    const pool = [];
    for (let i = 1; i < steps.length; i++) pool.push(i);
    const chosen = shuffle(pool, rng).slice(0, Math.min(count, pool.length));
    chosen.sort(function (a, b) { return a - b; });
    return chosen;
  }

  function buildQuizQuestion(steps, atIndex, rng) {
    rng = rng || Math.random;
    const target = steps[atIndex];
    const types = ['next', 'comparisons'];
    if (target.passEnd) types.push('afterPass');
    const type = types[Math.floor(rng() * types.length)];

    if (type === 'afterPass') {
      const correctState = target.state.slice();
      const pool = steps.filter(function (s, i) { return i !== atIndex && s.passEnd; }).map(function (s) { return s.state.slice(); });
      const distractors = uniqueSample(pool, 2, rng, function (st) { return st.join(','); })
        .filter(function (st) { return st.join(',') !== correctState.join(','); });
      while (distractors.length < 2) distractors.push(perturb(correctState, rng));
      const options = shuffle([
        { label: '[' + correctState.join(', ') + ']', correct: true },
        { label: '[' + distractors[0].join(', ') + ']', correct: false },
        { label: '[' + distractors[1].join(', ') + ']', correct: false },
      ], rng);
      return { type: type, prompt: 'What will the list look like after this step?', options: options };
    }

    if (type === 'comparisons') {
      const correctCount = target.comparisons;
      const pool = steps.map(function (s) { return s.comparisons; }).filter(function (c) { return c !== correctCount; });
      const distractors = uniqueSample(pool, 2, rng);
      let guess = correctCount;
      while (distractors.length < 2) {
        guess = Math.max(0, guess + (distractors.length % 2 === 0 ? 1 : -2));
        if (guess !== correctCount && distractors.indexOf(guess) === -1) distractors.push(guess);
        else guess += 1;
      }
      const options = shuffle([
        { label: String(correctCount), correct: true },
        { label: String(distractors[0]), correct: false },
        { label: String(distractors[1]), correct: false },
      ], rng);
      return { type: type, prompt: 'How many comparisons have been made so far?', options: options };
    }

    const correctCaption = target.caption;
    const pool = steps.filter(function (s, i) { return i !== atIndex; }).map(function (s) { return s.caption; });
    const distractors = uniqueSample(pool, 2, rng).filter(function (c) { return c !== correctCaption; });
    while (distractors.length < 2) distractors.push('Nothing happens — the list stays the same.');
    const options = shuffle([
      { label: correctCaption, correct: true },
      { label: distractors[0], correct: false },
      { label: distractors[1], correct: false },
    ], rng);
    return { type: type, prompt: 'What happens next?', options: options };
  }

  // ══════════════════════════════════════════════════════════════
  // DOM / UI — only runs in the browser, inside the registered tool.
  // ══════════════════════════════════════════════════════════════

  const ALGO_META = {
    bubble: { label: 'Bubble sort', kind: 'sort', run: bubbleSortSteps },
    insertion: { label: 'Insertion sort', kind: 'sort', run: insertionSortSteps },
    merge: { label: 'Merge sort', kind: 'sort', run: mergeSortSteps },
    linear: { label: 'Linear search', kind: 'search', run: linearSearchSteps },
    binary: { label: 'Binary search', kind: 'search', run: binarySearchSteps },
  };

  function injectStyle() {
    if (document.getElementById('cslab-sortviz-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-sortviz-style';
    style.textContent =
      '.cslab-sortviz { display: flex; flex-direction: column; gap: 12px; }' +
      '.cslab-sortviz .sv-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; }' +
      '.cslab-sortviz label { font-size: 13px; color: var(--mid); display: flex; align-items: center; gap: 6px; }' +
      '.cslab-sortviz select, .cslab-sortviz input[type=text], .cslab-sortviz input[type=number] {' +
      '  font-family: inherit; font-size: 14px; padding: 8px 10px; min-height: 40px;' +
      '  border: 1px solid var(--border); border-radius: 8px; background: var(--paper); color: var(--ink); }' +
      '.cslab-sortviz input[type=number] { width: 80px; }' +
      '.cslab-sortviz input[type=text] { width: 220px; }' +
      '.cslab-sortviz .sv-error { color: var(--wrong); font-size: 12px; min-height: 16px; }' +
      '.cslab-sortviz .sv-bars {' +
      '  display: flex; align-items: flex-end; gap: 8px; min-height: 200px; padding: 12px 8px 0;' +
      '  border-bottom: 2px solid var(--border); }' +
      '.cslab-sortviz .sv-bar { flex: 1 1 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 28px; }' +
      '.cslab-sortviz .sv-bar-value { font-size: 12px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }' +
      '.cslab-sortviz .sv-bar-fill { width: 100%; min-width: 28px; background: var(--mid); border-radius: 6px 6px 0 0; transition: height .25s, background .2s; }' +
      '.cslab-sortviz .sv-bar-ptr { font-size: 10px; color: var(--accent); min-height: 14px; font-weight: 700; }' +
      '.cslab-sortviz .sv-bar--compare .sv-bar-fill { background: var(--gold); }' +
      '.cslab-sortviz .sv-bar--swap .sv-bar-fill { background: var(--wrong); }' +
      '.cslab-sortviz .sv-bar--sorted .sv-bar-fill { background: var(--success); }' +
      '.cslab-sortviz .sv-bar--discarded .sv-bar-fill { background: var(--border); opacity: .4; }' +
      '.cslab-sortviz .sv-bar--found .sv-bar-fill { background: var(--success); box-shadow: 0 0 0 2px var(--accent) inset; }' +
      '.cslab-sortviz .sv-caption { font-size: 15px; font-weight: 600; color: var(--ink); min-height: 22px; }' +
      '.cslab-sortviz .sv-stats { display: flex; gap: 18px; font-size: 13px; color: var(--mid); }' +
      '.cslab-sortviz .sv-speed-wrap { display: flex; align-items: center; gap: 6px; }' +
      '.cslab-sortviz .sv-quiz-panel { border: 1px solid var(--border); border-radius: 10px; padding: 14px; background: var(--card-bg); display: flex; flex-direction: column; gap: 10px; }' +
      '.cslab-sortviz .sv-quiz-prompt { font-weight: 600; margin: 0; }' +
      '.cslab-sortviz .sv-quiz-option { text-align: left; min-height: 44px; }' +
      '.cslab-sortviz .sv-quiz-correct { border-color: var(--success) !important; color: var(--success); }' +
      '.cslab-sortviz .sv-quiz-wrong { border-color: var(--wrong) !important; color: var(--wrong); }' +
      '.cslab-sortviz .sv-quiz-score { font-weight: 700; margin: 0; }' +
      '.cslab-sortviz .cslab-btn { min-height: 44px; }';
    document.head.appendChild(style);
  }

  function parseListInput(text) {
    const parts = text.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    if (parts.length < 6 || parts.length > 8) {
      return { ok: false, error: 'Enter between 6 and 8 numbers, separated by commas.' };
    }
    const values = [];
    for (let i = 0; i < parts.length; i++) {
      const n = Number(parts[i]);
      if (!Number.isFinite(n) || Math.abs(n) > 999) return { ok: false, error: 'Each value must be a plain number.' };
      values.push(Math.round(n));
    }
    return { ok: true, values: values };
  }

  function randomList() {
    const count = 6 + Math.floor(Math.random() * 3); // 6, 7 or 8
    const out = [];
    for (let i = 0; i < count; i++) out.push(1 + Math.floor(Math.random() * 40));
    return out;
  }

  function passLabel(algo) { return algo === 'linear' || algo === 'binary' ? 'Checks' : 'Pass'; }

  function passCount(steps, uptoIndex) {
    let n = 0;
    for (let i = 0; i <= uptoIndex; i++) if (steps[i].passEnd) n += 1;
    return n;
  }

  function mount(el, ctx) {
    injectStyle();

    const wrap = document.createElement('div');
    wrap.className = 'cslab-sortviz';
    wrap.innerHTML =
      '<div class="sv-row">' +
      '  <label>Algorithm ' +
      '    <select class="sv-algo">' +
      '      <option value="bubble">Bubble sort</option>' +
      '      <option value="insertion">Insertion sort</option>' +
      '      <option value="merge">Merge sort</option>' +
      '      <option value="linear">Linear search</option>' +
      '      <option value="binary">Binary search</option>' +
      '    </select>' +
      '  </label>' +
      '  <label>List <input type="text" class="sv-list-input"></label>' +
      '  <button type="button" class="cslab-btn secondary sv-randomise">🎲 Randomise</button>' +
      '  <label class="sv-target-wrap" hidden>Target <input type="number" class="sv-target"></label>' +
      '</div>' +
      '<p class="sv-error"></p>' +
      '<div class="sv-bars"></div>' +
      '<p class="sv-caption">Press Step or Play to begin.</p>' +
      '<div class="sv-stats"><span class="sv-pass"></span><span class="sv-comparisons"></span></div>' +
      '<div class="sv-row">' +
      '  <button type="button" class="cslab-btn secondary sv-restart">⏮ Restart</button>' +
      '  <button type="button" class="cslab-btn sv-step">Step ▶</button>' +
      '  <button type="button" class="cslab-btn sv-play">▶ Play</button>' +
      '  <span class="sv-speed-wrap">Speed <input type="range" class="sv-speed" min="1" max="10" value="5"></span>' +
      '  <button type="button" class="cslab-btn secondary sv-quiz">🧠 Predict-the-step quiz</button>' +
      '</div>' +
      '<div class="sv-quiz-panel" hidden></div>' +
      '<p class="sv-best"></p>';
    el.appendChild(wrap);

    const els = {
      algo: wrap.querySelector('.sv-algo'),
      listInput: wrap.querySelector('.sv-list-input'),
      randomise: wrap.querySelector('.sv-randomise'),
      targetWrap: wrap.querySelector('.sv-target-wrap'),
      target: wrap.querySelector('.sv-target'),
      error: wrap.querySelector('.sv-error'),
      bars: wrap.querySelector('.sv-bars'),
      caption: wrap.querySelector('.sv-caption'),
      pass: wrap.querySelector('.sv-pass'),
      comparisons: wrap.querySelector('.sv-comparisons'),
      restart: wrap.querySelector('.sv-restart'),
      step: wrap.querySelector('.sv-step'),
      play: wrap.querySelector('.sv-play'),
      speed: wrap.querySelector('.sv-speed'),
      quizBtn: wrap.querySelector('.sv-quiz'),
      quizPanel: wrap.querySelector('.sv-quiz-panel'),
      best: wrap.querySelector('.sv-best'),
    };

    const state = {
      algo: 'bubble',
      list: randomList(),
      target: null,
      result: null,
      index: 0,
      playing: false,
      playTimer: null,
      quiz: null,
    };
    state.target = state.list[Math.floor(state.list.length / 2)];

    function recompute() {
      const meta = ALGO_META[state.algo];
      state.result = meta.kind === 'search' ? meta.run(state.list, state.target) : meta.run(state.list);
      state.index = 0;
      state.playing = false;
      clearTimeout(state.playTimer);
      els.play.textContent = '▶ Play';
      render();
    }

    function maxValue() {
      let m = 1;
      for (let i = 0; i < state.list.length; i++) m = Math.max(m, Math.abs(state.list[i]));
      return m;
    }

    function render() {
      const step = state.result.steps[state.index];
      const h = step.highlights || {};
      const max = maxValue();
      els.bars.innerHTML = '';
      step.state.forEach(function (value, i) {
        const bar = document.createElement('div');
        bar.className = 'sv-bar';
        if (h.compare && h.compare.indexOf(i) !== -1) bar.className += ' sv-bar--compare';
        if (h.swap && h.swap.indexOf(i) !== -1) bar.className += ' sv-bar--swap';
        if (h.sorted && h.sorted.indexOf(i) !== -1) bar.className += ' sv-bar--sorted';
        if (h.discarded && h.discarded.indexOf(i) !== -1) bar.className += ' sv-bar--discarded';
        if (typeof h.found === 'number' && h.found === i) bar.className += ' sv-bar--found';
        const pct = Math.max(8, Math.round((Math.abs(value) / max) * 100));
        let ptr = '';
        if (h.low === i) ptr += 'L';
        if (h.mid === i) ptr += 'M';
        if (h.high === i) ptr += 'H';
        bar.innerHTML =
          '<span class="sv-bar-value">' + value + '</span>' +
          '<div class="sv-bar-fill" style="height:' + pct + '%"></div>' +
          '<span class="sv-bar-ptr">' + ptr + '</span>';
        els.bars.appendChild(bar);
      });
      els.caption.textContent = step.caption;
      els.pass.textContent = passLabel(state.algo) + ': ' + passCount(state.result.steps, state.index);
      els.comparisons.textContent = 'Comparisons: ' + step.comparisons;
      els.step.disabled = state.index >= state.result.steps.length - 1;
      const best = ctx.store.get('bestScore_' + state.algo, null);
      els.best.textContent = best ? ('Best quiz score for ' + ALGO_META[state.algo].label + ': ' + best + ' / 5') : '';
    }

    function stopPlaying() {
      state.playing = false;
      clearTimeout(state.playTimer);
      els.play.textContent = '▶ Play';
    }

    function stepForward() {
      if (state.index < state.result.steps.length - 1) {
        state.index += 1;
        render();
        return true;
      }
      stopPlaying();
      return false;
    }

    function scheduleAutoStep() {
      if (!state.playing) return;
      const delay = 1100 - Number(els.speed.value) * 100;
      state.playTimer = setTimeout(function () {
        const moved = stepForward();
        if (moved && state.playing) scheduleAutoStep();
      }, Math.max(80, delay));
    }

    els.algo.addEventListener('change', function () {
      state.algo = els.algo.value;
      const isSearch = ALGO_META[state.algo].kind === 'search';
      els.targetWrap.hidden = !isSearch;
      recompute();
    });

    els.listInput.addEventListener('change', function () {
      const parsed = parseListInput(els.listInput.value);
      if (!parsed.ok) { els.error.textContent = parsed.error; return; }
      els.error.textContent = '';
      state.list = parsed.values;
      recompute();
    });

    els.randomise.addEventListener('click', function () {
      state.list = randomList();
      state.target = state.list[Math.floor(state.list.length / 2)];
      els.target.value = state.target;
      els.listInput.value = state.list.join(', ');
      els.error.textContent = '';
      recompute();
    });

    els.target.addEventListener('change', function () {
      const n = Number(els.target.value);
      state.target = Number.isFinite(n) ? Math.round(n) : state.target;
      recompute();
    });

    els.restart.addEventListener('click', function () {
      stopPlaying();
      state.index = 0;
      render();
    });

    els.step.addEventListener('click', function () {
      stopPlaying();
      stepForward();
    });

    els.play.addEventListener('click', function () {
      if (state.playing) { stopPlaying(); return; }
      if (state.index >= state.result.steps.length - 1) state.index = 0;
      state.playing = true;
      els.play.textContent = '⏸ Pause';
      scheduleAutoStep();
    });

    // ── Quiz mode ──────────────────────────────────────────────
    function startQuiz() {
      stopPlaying();
      if (state.result.steps.length < 6) { els.error.textContent = 'This list is too short for a quiz round.'; return; }
      state.quiz = { indices: pickQuizIndices(state.result.steps, 5, Math.random), pos: 0, score: 0 };
      state.index = 0;
      render();
      advanceToNextQuizPoint();
    }

    function advanceToNextQuizPoint() {
      const q = state.quiz;
      if (!q) return;
      if (q.pos >= q.indices.length) { finishQuiz(); return; }
      const targetIndex = q.indices[q.pos];
      (function tick() {
        if (state.index >= targetIndex - 1) { showQuizQuestion(targetIndex); return; }
        state.index += 1;
        render();
        state.playTimer = setTimeout(tick, 350);
      })();
    }

    function showQuizQuestion(targetIndex) {
      const q = buildQuizQuestion(state.result.steps, targetIndex, Math.random);
      els.quizPanel.hidden = false;
      els.quizPanel.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'sv-quiz-prompt';
      p.textContent = 'Question ' + (state.quiz.pos + 1) + ' of ' + state.quiz.indices.length + ' — ' + q.prompt;
      els.quizPanel.appendChild(p);
      q.options.forEach(function (opt) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cslab-btn secondary sv-quiz-option';
        b.textContent = opt.label;
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(els.quizPanel.querySelectorAll('.sv-quiz-option'), function (x) { x.disabled = true; });
          if (opt.correct) {
            state.quiz.score += 1;
            b.classList.add('sv-quiz-correct');
          } else {
            b.classList.add('sv-quiz-wrong');
            const idx = q.options.indexOf(opt);
            const buttons = els.quizPanel.querySelectorAll('.sv-quiz-option');
            q.options.forEach(function (o, i) { if (o.correct) buttons[i].classList.add('sv-quiz-correct'); });
          }
          setTimeout(function () {
            state.quiz.pos += 1;
            state.index = targetIndex;
            render();
            els.quizPanel.hidden = true;
            advanceToNextQuizPoint();
          }, 900);
        });
        els.quizPanel.appendChild(b);
      });
    }

    function finishQuiz() {
      const q = state.quiz;
      els.quizPanel.hidden = false;
      els.quizPanel.innerHTML = '<p class="sv-quiz-score">Quiz complete: ' + q.score + ' / ' + q.indices.length + '</p>';
      const best = ctx.store.get('bestScore_' + state.algo, 0);
      if (q.score > best) ctx.store.set('bestScore_' + state.algo, q.score);
      ctx.complete({ algo: state.algo, score: q.score });
      state.quiz = null;
      render();
    }

    els.quizBtn.addEventListener('click', startQuiz);

    els.listInput.value = state.list.join(', ');
    els.target.value = state.target;
    recompute();
  }

  if (global && global.CsLab) {
    global.CsLab.registerTool('sort-visualiser', {
      title: 'Sort & Search Visualiser',
      icon: '🪜',
      mount: mount,
    });
  }

  // Node-only export for unit tests; no effect when loaded as a <script> tag.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      bubbleSortSteps: bubbleSortSteps,
      insertionSortSteps: insertionSortSteps,
      mergeSortSteps: mergeSortSteps,
      linearSearchSteps: linearSearchSteps,
      binarySearchSteps: binarySearchSteps,
      pickQuizIndices: pickQuizIndices,
      buildQuizQuestion: buildQuizQuestion,
    };
  }
})(typeof window !== 'undefined' ? window : undefined);
