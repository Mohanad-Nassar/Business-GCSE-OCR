// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Flowchart Symbols (2.1.2, CS-CONTENT-PLAN.md §7.1)
// Registers 'flow-label'.
//
// Wrapped as (function (global) { ... })(window) so the pure helpers
// (gradeActivityA, gradeActivityB) can be unit-tested under plain Node
// via require() — the CsLab.registerTool call is skipped when there is
// no global.CsLab (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function el(tag, cls, text) {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function injectStyle() {
    if (global.document.getElementById('cslab-flow-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-flow-style';
    style.textContent = [
      '.cslab-flow-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }',
      '.cslab-flow-section { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 20px; }',
      '.cslab-flow-section h4 { margin: 0 0 6px; }',
      '.cslab-flow-section-desc { color: var(--mid); font-size: 13.5px; margin: 0 0 14px; }',
      '.cslab-flow-svg { width: 100%; height: 100%; display: block; }',
      // Activity A
      '.cslab-flow-grid-a { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }',
      '.cslab-flow-symbol-box { border: 1.5px solid var(--border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; }',
      '.cslab-flow-symbol-box.right { border-color: var(--success); }',
      '.cslab-flow-symbol-box.wrong { border-color: #c0392b; }',
      '.cslab-flow-symbol-box .cslab-flow-svg-wrap { width: 110px; height: 58px; }',
      '.cslab-flow-slot-label { min-height: 44px; width: 100%; padding: 6px 10px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--cream); color: var(--ink); font-family: inherit; font-size: 12.5px; cursor: pointer; text-align: center; }',
      '.cslab-flow-slot-label.empty { color: var(--mid); font-style: italic; }',
      '.cslab-flow-bank { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; min-height: 44px; }',
      '.cslab-flow-chip { min-height: 44px; padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 13px; cursor: pointer; }',
      '.cslab-flow-chip.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--card-bg)); font-weight: 600; }',
      // Activity B
      '.cslab-flow-tray { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; min-height: 44px; }',
      '.cslab-flow-card { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 12px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 12.5px; cursor: pointer; }',
      '.cslab-flow-card .cslab-flow-svg-wrap { width: 46px; height: 26px; flex-shrink: 0; }',
      '.cslab-flow-card.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--card-bg)); }',
      '.cslab-flow-slots-wrap { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }',
      '.cslab-flow-slot-box { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 6px 12px; border: 1.5px solid var(--border); border-radius: 8px; cursor: pointer; }',
      '.cslab-flow-slot-box.filled { background: var(--cream); }',
      '.cslab-flow-slot-box.right { border-color: var(--success); }',
      '.cslab-flow-slot-box.wrong { border-color: #c0392b; }',
      '.cslab-flow-slot-num { font-weight: 700; width: 20px; flex-shrink: 0; color: var(--mid); }',
      '.cslab-flow-slot-empty { color: var(--mid); font-style: italic; font-size: 12.5px; }',
      '.cslab-flow-slot-text { font-size: 13px; }',
      '.cslab-flow-explain-list { margin: 10px 0 0; padding-left: 20px; font-size: 13px; color: var(--mid); }',
      '.cslab-flow-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ── The six OCR flowchart symbols (Appendix B 2.1.2) ────────────────
  const SYMBOLS = [
    { id: 'terminal', name: 'Terminal', desc: 'Shows the start or end of a flowchart.' },
    { id: 'process', name: 'Process', desc: 'A single step or instruction being carried out.' },
    { id: 'decision', name: 'Decision', desc: 'A yes/no question that branches the flow.' },
    { id: 'io', name: 'Input/Output', desc: 'Data going into the program, or being displayed.' },
    { id: 'subprogram', name: 'Sub-program', desc: 'A call to another procedure or function defined elsewhere.' },
    { id: 'flowline', name: 'Flow line', desc: 'An arrow showing the order the steps run in.' },
  ];

  // Pure: SVG markup for one symbol (currentColor strokes so both dark
  // themes work; no ids, so drawing the same symbol twice never collides).
  function symbolSvg(kind) {
    const s = 'fill="none" stroke="currentColor" stroke-width="2.2"';
    switch (kind) {
      case 'terminal':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="112" height="48" rx="24" ' + s + '/></svg>';
      case 'process':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="112" height="48" ' + s + '/></svg>';
      case 'decision':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><polygon points="60,4 116,30 60,56 4,30" ' + s + '/></svg>';
      case 'io':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><polygon points="28,6 116,6 92,54 4,54" ' + s + '/></svg>';
      case 'subprogram':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="112" height="48" ' + s + '/><line x1="20" y1="6" x2="20" y2="54" stroke="currentColor" stroke-width="2.2"/><line x1="100" y1="6" x2="100" y2="54" stroke="currentColor" stroke-width="2.2"/></svg>';
      case 'flowline':
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><line x1="6" y1="30" x2="88" y2="30" stroke="currentColor" stroke-width="3"/><polygon points="86,20 114,30 86,40" fill="currentColor"/></svg>';
      default:
        return '<svg class="cslab-flow-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"></svg>';
    }
  }

  function svgWrap(kind, ctx) {
    const w = el('div', 'cslab-flow-svg-wrap');
    w.appendChild(ctx.ui.el(symbolSvg(kind)));
    return w;
  }

  // Pure: grade Activity A (label matching). `assignments[i]` is the name
  // (or null) placed against `slots[i]`.
  function gradeActivityA(assignments, slots) {
    let correct = 0;
    const results = slots.map((s, i) => {
      const ok = assignments[i] === s.name;
      if (ok) correct++;
      return ok;
    });
    return { correct, total: slots.length, results, allCorrect: correct === slots.length };
  }

  // Pure: grade Activity B (ordering). `placed[i]` is the original-index of
  // the card in slot i (or null); the correct order is 0..n-1.
  function gradeActivityB(placed, correctIds) {
    let correct = 0;
    const results = correctIds.map((id, i) => {
      const ok = placed[i] === id;
      if (ok) correct++;
      return ok;
    });
    return { correct, total: correctIds.length, results, allCorrect: correct === correctIds.length };
  }

  // ── Activity A: label the six symbols ───────────────────────────────
  function mountActivityA(container, ctx) {
    const slots = shuffle(SYMBOLS);
    let assignments = new Array(slots.length).fill(null);
    let selectedChip = null;
    let completed = false;

    const grid = el('div', 'cslab-flow-grid-a');
    const bank = el('div', 'cslab-flow-bank');
    const controls = el('div', 'cslab-flow-controls');
    const checkBtn = ctx.ui.btn('Check');
    controls.appendChild(checkBtn);
    const feedback = el('p', 'cslab-feedback');

    function availableNames() {
      const used = assignments.filter(Boolean);
      return SYMBOLS.map(s => s.name).filter(n => used.indexOf(n) === -1);
    }

    function renderBank() {
      bank.innerHTML = '';
      availableNames().forEach(name => {
        const chip = el('button', 'cslab-flow-chip', name);
        chip.type = 'button';
        if (name === selectedChip) chip.classList.add('selected');
        chip.addEventListener('click', () => {
          selectedChip = (selectedChip === name) ? null : name;
          renderBank();
        });
        bank.appendChild(chip);
      });
    }

    function renderGrid() {
      grid.innerHTML = '';
      slots.forEach((sym, i) => {
        const box = el('div', 'cslab-flow-symbol-box');
        box.appendChild(svgWrap(sym.id, ctx));
        const labelBtn = el('button', 'cslab-flow-slot-label', assignments[i] || '— tap a name —');
        labelBtn.type = 'button';
        if (!assignments[i]) labelBtn.classList.add('empty');
        labelBtn.addEventListener('click', () => {
          if (assignments[i]) {
            assignments[i] = null;
            renderGrid(); renderBank();
            return;
          }
          if (selectedChip) {
            assignments[i] = selectedChip;
            selectedChip = null;
            renderGrid(); renderBank();
          }
        });
        box.appendChild(labelBtn);
        grid.appendChild(box);
      });
    }

    checkBtn.addEventListener('click', () => {
      const result = gradeActivityA(assignments, slots);
      Array.prototype.forEach.call(grid.children, (box, i) => {
        box.classList.remove('right', 'wrong');
        box.classList.add(result.results[i] ? 'right' : 'wrong');
      });
      ctx.ui.feedback(feedback, result.allCorrect,
        result.allCorrect ? '✓ All six symbols correctly labelled!' : (result.correct + ' / ' + result.total + ' correct — wrong ones are outlined in red. Tap a slot to clear it and try again.'));
      if (result.allCorrect && !completed) { completed = true; ctx.complete({ activity: 'A' }); }
    });

    container.appendChild(grid);
    container.appendChild(bank);
    container.appendChild(controls);
    container.appendChild(feedback);
    renderGrid();
    renderBank();
  }

  // ── Activity B: assemble a flowchart (password-until-correct) ───────
  const FLOW_B_STEPS = [
    { symbol: 'terminal', text: 'Start' },
    { symbol: 'io', text: 'Input password' },
    { symbol: 'decision', text: 'Is the password correct?' },
    { symbol: 'flowline', text: 'No → loop back to "Input password"' },
    { symbol: 'io', text: "Output 'Access granted'" },
    { symbol: 'terminal', text: 'Stop' },
  ];
  const FLOW_B_EXPLAIN = [
    'Every flowchart starts with a Terminal symbol.',
    'The password has to be INPUT before it can be checked.',
    'A Decision symbol asks the yes/no question that controls whether the flow repeats.',
    'If the answer is No, the Flow line loops back to ask for the password again — that’s what makes it repeat UNTIL correct.',
    'Once the Decision answers Yes, the program can Output that access is granted.',
    'Every flowchart ends with a Terminal symbol.',
  ];

  function mountActivityB(container, ctx) {
    const correctIds = FLOW_B_STEPS.map((s, i) => i);
    const trayOrder = shuffle(correctIds.slice());
    let placed = new Array(FLOW_B_STEPS.length).fill(null);
    let selectedCard = null;
    let completed = false;

    const tray = el('div', 'cslab-flow-tray');
    const slotsWrap = el('div', 'cslab-flow-slots-wrap');
    const controls = el('div', 'cslab-flow-controls');
    const checkBtn = ctx.ui.btn('Check');
    const explainBtn = ctx.ui.btn('Explain', 'secondary');
    controls.appendChild(checkBtn);
    controls.appendChild(explainBtn);
    const feedback = el('p', 'cslab-feedback');
    const explainList = el('ol', 'cslab-flow-explain-list');
    explainList.style.display = 'none';

    function remainingTray() {
      const used = placed.filter(v => v !== null);
      return trayOrder.filter(idx => used.indexOf(idx) === -1);
    }

    function renderTray() {
      tray.innerHTML = '';
      remainingTray().forEach(idx => {
        const step = FLOW_B_STEPS[idx];
        const card = el('button', 'cslab-flow-card');
        card.type = 'button';
        if (idx === selectedCard) card.classList.add('selected');
        card.appendChild(svgWrap(step.symbol, ctx));
        card.appendChild(global.document.createTextNode(step.text));
        card.addEventListener('click', () => {
          selectedCard = (selectedCard === idx) ? null : idx;
          renderTray();
        });
        tray.appendChild(card);
      });
    }

    function renderSlots() {
      slotsWrap.innerHTML = '';
      for (let i = 0; i < placed.length; i++) {
        const box = el('div', 'cslab-flow-slot-box');
        box.appendChild(el('span', 'cslab-flow-slot-num', String(i + 1)));
        if (placed[i] !== null) {
          const step = FLOW_B_STEPS[placed[i]];
          box.classList.add('filled');
          box.appendChild(svgWrap(step.symbol, ctx));
          box.appendChild(el('span', 'cslab-flow-slot-text', step.text));
        } else {
          box.appendChild(el('span', 'cslab-flow-slot-empty', 'tap a card to place it here'));
        }
        box.addEventListener('click', () => {
          if (placed[i] !== null) {
            placed[i] = null;
            renderSlots(); renderTray();
            return;
          }
          if (selectedCard !== null) {
            placed[i] = selectedCard;
            selectedCard = null;
            renderSlots(); renderTray();
          }
        });
        slotsWrap.appendChild(box);
      }
    }

    checkBtn.addEventListener('click', () => {
      const result = gradeActivityB(placed, correctIds);
      Array.prototype.forEach.call(slotsWrap.children, (box, i) => {
        box.classList.remove('right', 'wrong');
        box.classList.add(result.results[i] ? 'right' : 'wrong');
      });
      ctx.ui.feedback(feedback, result.allCorrect,
        result.allCorrect ? '✓ Correct order!' : (result.correct + ' / ' + result.total + ' in the right place — wrong ones are outlined in red.'));
      if (result.allCorrect && !completed) { completed = true; ctx.complete({ activity: 'B' }); }
    });

    explainBtn.addEventListener('click', () => {
      if (explainList.style.display === 'none') {
        explainList.innerHTML = '';
        FLOW_B_STEPS.forEach((step, i) => {
          explainList.appendChild(el('li', null, step.text + ' — ' + FLOW_B_EXPLAIN[i]));
        });
        explainList.style.display = '';
        explainBtn.textContent = 'Hide explanation';
      } else {
        explainList.style.display = 'none';
        explainBtn.textContent = 'Explain';
      }
    });

    container.appendChild(tray);
    container.appendChild(slotsWrap);
    container.appendChild(controls);
    container.appendChild(feedback);
    container.appendChild(explainList);
    renderTray();
    renderSlots();
  }

  function mountFlowLabel(el0, ctx) {
    injectStyle();
    const wrap = el('div', 'cslab-flow');
    wrap.appendChild(el('p', 'cslab-flow-intro', 'Two activities on the OCR flowchart symbols used to design and refine algorithms.'));

    const sectionA = el('div', 'cslab-flow-section');
    sectionA.appendChild(el('h4', null, 'A. Label the symbols'));
    sectionA.appendChild(el('p', 'cslab-flow-section-desc', 'Tap a name below, then tap the symbol it belongs to. Tap a filled symbol to clear it.'));
    mountActivityA(sectionA, ctx);
    wrap.appendChild(sectionA);

    const sectionB = el('div', 'cslab-flow-section');
    sectionB.appendChild(el('h4', null, 'B. Assemble a flowchart'));
    sectionB.appendChild(el('p', 'cslab-flow-section-desc', 'Put these steps in order for a flowchart that keeps asking for a password until it is correct. Tap a card, then tap the numbered slot to place it.'));
    mountActivityB(sectionB, ctx);
    wrap.appendChild(sectionB);

    el0.appendChild(wrap);
  }

  // ── Registration (skipped outside the browser) ─────────────────────
  if (global && global.CsLab) {
    global.CsLab.registerTool('flow-label', { title: 'Flowchart Symbols', icon: '🔀', mount: mountFlowLabel });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SYMBOLS, symbolSvg, gradeActivityA, gradeActivityB, FLOW_B_STEPS };
  }
})(typeof window !== 'undefined' ? window : this);
