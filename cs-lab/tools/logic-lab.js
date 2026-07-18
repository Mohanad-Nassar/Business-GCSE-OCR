// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Logic Gate Lab (T6, CS-CONTENT-PLAN.md §7.1)
// Registers tool id 'logic-lab'. OCR J277 2.4.1 Boolean logic:
// AND/OR/NOT gate symbols + truth tables, combining gates, multi-gate
// circuits (Appendix B entry 2.4.1 — no XOR/NAND/NOR in the spec).
//
// Circuit evaluation + truth-table generation are pure functions
// with no DOM access, so they can be unit-tested under Node against
// a brute-force evaluator — see the module.exports guard at the
// bottom (never runs in the browser).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ── circuit model: {inputs:['A','B'], gates:[{type,inputs,output}], output:'Q'} ──
  // gates must be listed in topological order (each gate's inputs are either
  // a raw input letter or an earlier gate's output).
  function gateEval(type, vals) {
    if (type === 'AND') return vals.every(v => v === 1) ? 1 : 0;
    if (type === 'OR') return vals.some(v => v === 1) ? 1 : 0;
    if (type === 'NOT') return vals[0] === 1 ? 0 : 1;
    throw new Error('unknown gate type ' + type);
  }
  function evalCircuit(circuit, inputValues) {
    const signals = Object.assign({}, inputValues);
    circuit.gates.forEach(g => {
      signals[g.output] = gateEval(g.type, g.inputs.map(id => signals[id]));
    });
    return signals;
  }
  // MSB-first row ordering (A changes slowest) so the table reads like a
  // conventional textbook truth table.
  function fullTruthTable(circuit) {
    const n = circuit.inputs.length;
    const rows = [];
    for (let mask = 0; mask < (1 << n); mask++) {
      const inputValues = {};
      circuit.inputs.forEach((letter, i) => { inputValues[letter] = (mask >> (n - 1 - i)) & 1; });
      rows.push(evalCircuit(circuit, inputValues));
    }
    return rows;
  }
  function intermediateIds(circuit) {
    return circuit.gates.filter(g => g.output !== circuit.output).map(g => g.output);
  }

  // ── Draw-the-circuit marking (T-CS-Logic mode 3) ──────────────────
  // A student-built circuit can be wired in ANY order (a later-placed gate
  // may feed an earlier one), unlike the hand-authored CIRCUITS below which
  // are already listed topologically — so evaluation here resolves each
  // signal on demand (with a cycle guard) instead of assuming array order.
  // Missing/incomplete wiring resolves to `undefined`, which simply fails
  // to equal 0/1 later rather than crashing.
  function evalCircuitSafe(circuit, inputValues) {
    const signals = Object.assign({}, inputValues);
    const gateByOutput = {};
    circuit.gates.forEach(function (g) { gateByOutput[g.output] = g; });
    const resolving = {};

    function resolve(id) {
      if (Object.prototype.hasOwnProperty.call(signals, id)) return signals[id];
      if (resolving[id]) return undefined; // cycle guard — never resolves cleanly
      const g = gateByOutput[id];
      if (!g) return undefined; // referenced but never placed/wired
      resolving[id] = true;
      const vals = g.inputs.map(function (srcId) {
        return srcId === null || srcId === undefined ? undefined : resolve(srcId);
      });
      resolving[id] = false;
      const out = vals.every(function (v) { return v === 0 || v === 1; }) ? gateEval(g.type, vals) : undefined;
      signals[id] = out;
      return out;
    }

    circuit.gates.forEach(function (g) { resolve(g.output); });
    return signals;
  }

  // Brute-force truth-table equivalence over every input combination — a
  // student circuit wired completely differently from the model answer
  // still counts as correct if it produces the same output for every
  // possible input, exactly like the real "logically correct" mark scheme
  // rule. Requires both circuits to share the same set of input letters.
  function circuitsEquivalent(a, b) {
    const aInputs = a.inputs.slice().sort();
    const bInputs = b.inputs.slice().sort();
    if (aInputs.length !== bInputs.length) return false;
    for (let i = 0; i < aInputs.length; i++) if (aInputs[i] !== bInputs[i]) return false;
    const n = a.inputs.length;
    for (let mask = 0; mask < (1 << n); mask++) {
      const inputValues = {};
      a.inputs.forEach(function (letter, i) { inputValues[letter] = (mask >> (n - 1 - i)) & 1; });
      const outA = evalCircuitSafe(a, inputValues)[a.output];
      const outB = evalCircuitSafe(b, inputValues)[b.output];
      if (outA !== outB) return false;
    }
    return true;
  }

  // OCR's real "draw the circuit" mark schemes accept any logically
  // correct circuit but cap it at max 2 (of 3) if it uses more or fewer
  // gates than the minimal/expected circuit ("max 2 if extra/missing
  // gates").
  function gradeDrawChallenge(studentCircuit, targetCircuit) {
    const correct = circuitsEquivalent(studentCircuit, targetCircuit);
    const gateCountMatches = studentCircuit.gates.length === targetCircuit.gates.length;
    const maxMarks = 3;
    const marks = !correct ? 0 : (gateCountMatches ? maxMarks : 2);
    return {
      correct: correct,
      gateCountMatches: gateCountMatches,
      marks: marks,
      maxMarks: maxMarks,
      studentGateCount: studentCircuit.gates.length,
      targetGateCount: targetCircuit.gates.length,
    };
  }

  // ── circuit registry ─────────────────────────────────────────────
  const CIRCUITS = {
    'and2': { label: 'AND', inputs: ['A', 'B'], gates: [{ type: 'AND', inputs: ['A', 'B'], output: 'Q' }], output: 'Q' },
    'or2': { label: 'OR', inputs: ['A', 'B'], gates: [{ type: 'OR', inputs: ['A', 'B'], output: 'Q' }], output: 'Q' },
    'not1': { label: 'NOT', inputs: ['A'], gates: [{ type: 'NOT', inputs: ['A'], output: 'Q' }], output: 'Q' },
    'a-and-notb': {
      label: 'A AND NOT B', inputs: ['A', 'B'],
      gates: [{ type: 'NOT', inputs: ['B'], output: 'W1' }, { type: 'AND', inputs: ['A', 'W1'], output: 'Q' }],
      output: 'Q',
    },
    'not-a-or-b': {
      label: 'NOT(A OR B)', inputs: ['A', 'B'],
      gates: [{ type: 'OR', inputs: ['A', 'B'], output: 'W1' }, { type: 'NOT', inputs: ['W1'], output: 'Q' }],
      output: 'Q',
    },
    'not-a-and-b': {
      label: 'NOT(A AND B)', inputs: ['A', 'B'],
      gates: [{ type: 'AND', inputs: ['A', 'B'], output: 'W1' }, { type: 'NOT', inputs: ['W1'], output: 'Q' }],
      output: 'Q',
    },
    'ab-or-c': {
      label: '(A AND B) OR C', inputs: ['A', 'B', 'C'],
      gates: [{ type: 'AND', inputs: ['A', 'B'], output: 'W1' }, { type: 'OR', inputs: ['W1', 'C'], output: 'Q' }],
      output: 'Q',
    },
    'ab-or-notc': {
      label: '(A AND B) OR (NOT C)', inputs: ['A', 'B', 'C'],
      gates: [
        { type: 'AND', inputs: ['A', 'B'], output: 'W1' },
        { type: 'NOT', inputs: ['C'], output: 'W2' },
        { type: 'OR', inputs: ['W1', 'W2'], output: 'Q' },
      ],
      output: 'Q',
    },
  };
  const PLAYGROUND_IDS = ['and2', 'or2', 'not1', 'a-and-notb', 'ab-or-c', 'not-a-or-b', 'ab-or-notc'];
  const CHALLENGE_IDS = ['and2', 'or2', 'not1', 'a-and-notb', 'not-a-or-b', 'not-a-and-b', 'ab-or-c', 'ab-or-notc'];
  // Draw-the-circuit mode (2024 paper style: "draw a circuit for P = …"),
  // easy → hard, reusing the same CIRCUITS registry as the model answers.
  const DRAW_CHALLENGE_IDS = ['not1', 'and2', 'a-and-notb', 'not-a-or-b', 'ab-or-c', 'ab-or-notc'];
  const DRAW_EXPR_LABELS = {
    'not1': 'P = NOT A',
    'and2': 'P = A AND B',
    'a-and-notb': 'P = A AND (NOT B)',
    'not-a-or-b': 'P = NOT (A OR B)',
    'ab-or-c': 'P = (A AND B) OR C',
    'ab-or-notc': 'P = (A AND B) OR (NOT C)',
  };

  // ── generic layered layout (depth = column, fan-out is always 1 here) ──
  function layoutCircuit(circuit) {
    const depth = {};
    circuit.inputs.forEach(letter => { depth[letter] = 0; });
    circuit.gates.forEach(g => {
      depth[g.output] = 1 + Math.max.apply(null, g.inputs.map(id => depth[id]));
    });

    const rawY = {};
    circuit.inputs.forEach((letter, i) => { rawY[letter] = i; });
    circuit.gates.forEach(g => {
      const ys = g.inputs.map(id => rawY[id]);
      rawY[g.output] = ys.reduce((a, b) => a + b, 0) / ys.length;
    });

    const maxDepth = Math.max.apply(null, Object.keys(depth).map(id => depth[id]));
    const columns = [];
    for (let d = 0; d <= maxDepth; d++) columns.push([]);
    Object.keys(depth).forEach(id => columns[depth[id]].push(id));
    columns.forEach(col => col.sort((a, b) => rawY[a] - rawY[b]));

    const maxRows = Math.max.apply(null, columns.map(c => c.length));
    const pos = {};
    columns.forEach((col, d) => {
      const offset = (maxRows - col.length) / 2;
      col.forEach((id, i) => { pos[id] = { col: d, row: i + offset }; });
    });

    return { pos, maxDepth, maxRows };
  }

  // ── SVG drawing (theme-aware: currentColor / CSS vars only) ─────────
  function makePath(svg, d, extraClass) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'cslab-logic-gate' + (extraClass ? ' ' + extraClass : ''));
    svg.appendChild(p);
    return p;
  }
  function drawAndGate(svg, x, y, w, h) {
    const straightW = w - h / 2;
    const d = 'M ' + x + ',' + y + ' H ' + (x + straightW) +
      ' A ' + (h / 2) + ',' + (h / 2) + ' 0 0 1 ' + (x + straightW) + ',' + (y + h) +
      ' H ' + x + ' Z';
    makePath(svg, d, 'gate-and');
    return { in: [{ x: x, y: y + h * 0.25 }, { x: x, y: y + h * 0.75 }], out: { x: x + w, y: y + h / 2 } };
  }
  function drawOrGate(svg, x, y, w, h) {
    const d = 'M ' + x + ',' + y +
      ' Q ' + (x + w * 0.28) + ',' + (y + h / 2) + ' ' + x + ',' + (y + h) +
      ' Q ' + (x + w * 0.62) + ',' + (y + h) + ' ' + (x + w) + ',' + (y + h / 2) +
      ' Q ' + (x + w * 0.62) + ',' + y + ' ' + x + ',' + y + ' Z';
    makePath(svg, d, 'gate-or');
    return { in: [{ x: x + w * 0.14, y: y + h * 0.25 }, { x: x + w * 0.14, y: y + h * 0.75 }], out: { x: x + w, y: y + h / 2 } };
  }
  function drawNotGate(svg, x, y, w, h) {
    const bubbleR = 5;
    const triW = w - bubbleR * 2;
    const d = 'M ' + x + ',' + y + ' L ' + x + ',' + (y + h) + ' L ' + (x + triW) + ',' + (y + h / 2) + ' Z';
    makePath(svg, d, 'gate-not');
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x + triW + bubbleR);
    circle.setAttribute('cy', y + h / 2);
    circle.setAttribute('r', bubbleR);
    circle.setAttribute('class', 'cslab-logic-gate gate-bubble');
    svg.appendChild(circle);
    return { in: [{ x: x, y: y + h / 2 }], out: { x: x + triW + bubbleR * 2, y: y + h / 2 } };
  }
  function drawGateShape(svg, type, x, y, w, h) {
    if (type === 'AND') return drawAndGate(svg, x, y, w, h);
    if (type === 'OR') return drawOrGate(svg, x, y, w, h);
    if (type === 'NOT') return drawNotGate(svg, x, y, w, h);
    throw new Error('unknown gate type ' + type);
  }
  function drawOrthogonalWire(svg, from, to) {
    const midX = (from.x + to.x) / 2;
    const d = 'M ' + from.x + ',' + from.y + ' L ' + midX + ',' + from.y + ' L ' + midX + ',' + to.y + ' L ' + to.x + ',' + to.y;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'cslab-logic-wire');
    svg.insertBefore(path, svg.firstChild); // keep wires visually behind gates/labels
    return path;
  }

  const COL_W = 130, ROW_H = 60, GATE_W = 62, GATE_H = 40, MARGIN_X = 44, MARGIN_Y = 20;

  function buildCircuitSVG(circuit) {
    const layout = layoutCircuit(circuit);
    const width = MARGIN_X * 2 + layout.maxDepth * COL_W + GATE_W + 34;
    const height = MARGIN_Y * 2 + Math.max(layout.maxRows - 1, 0) * ROW_H + GATE_H;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', Math.min(height, 260));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('cslab-logic-svg');

    function px(col) { return MARGIN_X + col * COL_W; }
    function py(row) { return MARGIN_Y + row * ROW_H + GATE_H / 2; }

    const pins = {};
    const wireEls = {};

    circuit.inputs.forEach(letter => {
      const p = layout.pos[letter];
      const x = px(p.col), y = py(p.row);
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x - 12);
      label.setAttribute('y', y + 5);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('class', 'cslab-logic-label');
      label.textContent = letter;
      svg.appendChild(label);
      pins[letter] = { x: x, y: y };
    });

    circuit.gates.forEach(g => {
      const p = layout.pos[g.output];
      const gx = px(p.col), gy = py(p.row) - GATE_H / 2;
      const drawn = drawGateShape(svg, g.type, gx, gy, GATE_W, GATE_H);
      pins[g.output] = drawn.out;
      g.inputs.forEach((sigId, i) => {
        const wire = drawOrthogonalWire(svg, pins[sigId], drawn.in[i]);
        (wireEls[sigId] = wireEls[sigId] || []).push(wire);
      });
    });

    const qPin = pins[circuit.output];
    const qLabelX = qPin.x + 26;
    const stub = drawOrthogonalWire(svg, qPin, { x: qLabelX - 10, y: qPin.y });
    (wireEls[circuit.output] = wireEls[circuit.output] || []).push(stub);
    const qLabel = document.createElementNS(SVG_NS, 'text');
    qLabel.setAttribute('x', qLabelX);
    qLabel.setAttribute('y', qPin.y + 5);
    qLabel.setAttribute('class', 'cslab-logic-label');
    qLabel.textContent = 'Q';
    svg.appendChild(qLabel);

    function setSignals(values) {
      Object.keys(wireEls).forEach(sigId => {
        const v = values[sigId];
        wireEls[sigId].forEach(w => {
          w.classList.remove('on', 'off');
          if (v === 1) w.classList.add('on');
          else if (v === 0) w.classList.add('off');
        });
      });
    }

    return { svg: svg, setSignals: setSignals };
  }

  // ── styles ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cslab-logic-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-logic-style';
    style.textContent =
      '.cslab-logic-modetabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.cslab-logic-modetab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:6px 14px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.cslab-logic-modetab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.cslab-logic-picker,.cslab-logic-challengelist{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}' +
      '.cslab-logic-pick-btn,.cslab-logic-challenge-btn{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px;cursor:pointer;position:relative}' +
      '.cslab-logic-pick-btn.active,.cslab-logic-challenge-btn.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.cslab-logic-challenge-btn.done{border-color:var(--success)}' +
      '.cslab-logic-challenge-btn.done::after{content:"✓";margin-left:6px;color:var(--success)}' +
      '.cslab-logic-challenge-btn.active.done::after{color:var(--paper)}' +
      '.cslab-logic-toggles{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}' +
      '.cslab-logic-toggle{font-family:"DM Mono","Consolas",monospace;font-size:15px;font-weight:600;border-radius:8px;padding:8px 16px;border:1px solid var(--border);cursor:pointer;background:var(--card-bg);color:var(--ink)}' +
      '.cslab-logic-toggle.on{background:var(--success);border-color:var(--success);color:var(--paper)}' +
      '.cslab-logic-toggle.off{background:var(--card-bg)}' +
      '.cslab-logic-svg{display:block;max-width:560px;color:var(--ink)}' +
      '.cslab-logic-gate{fill:var(--card-bg);stroke:var(--ink);stroke-width:2}' +
      '.cslab-logic-wire{fill:none;stroke:var(--mid);stroke-width:2.5}' +
      '.cslab-logic-wire.on{stroke:var(--success)}' +
      '.cslab-logic-wire.off{stroke:var(--mid)}' +
      '.cslab-logic-label{fill:var(--ink);font-size:15px;font-weight:700;font-family:inherit}' +
      '.cslab-logic-qreadout{font-family:"DM Mono","Consolas",monospace;font-size:16px;font-weight:600;margin-top:10px}' +
      '.cslab-logic-challenge-title{font-size:16px;font-weight:600;margin:0 0 10px}' +
      '.cslab-logic-diagram{margin-bottom:16px;overflow-x:auto}' +
      '.cslab-logic-tablewrap{overflow-x:auto;margin-bottom:12px}' +
      '.cslab-logic-table{border-collapse:collapse;font-family:"DM Mono","Consolas",monospace;font-size:14px}' +
      '.cslab-logic-table th,.cslab-logic-table td{border:1px solid var(--border);padding:6px 12px;text-align:center}' +
      '.cslab-logic-table th{background:var(--cream);color:var(--ink)}' +
      '.cslab-logic-fixed{color:var(--mid);background:var(--cream)}' +
      '.cslab-logic-cell{width:34px;height:30px;border:1px solid var(--border);border-radius:6px;background:var(--card-bg);color:var(--ink);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
      '.cslab-logic-cell.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.cslab-logic-cell.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.cslab-logic-draw-instructions{color:var(--mid);font-size:13px;margin:0 0 12px}' +
      '.cslab-logic-draw-palette{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}' +
      '.cslab-logic-draw-gatebtn{min-height:44px;padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--ink);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
      '.cslab-logic-draw-gatebtn:hover{border-color:var(--accent);color:var(--accent)}' +
      '.cslab-logic-draw-canvas{overflow-x:auto}' +
      '.cslab-logic-draw-status{font-size:13px;color:var(--mid);min-height:18px;margin:8px 0}' +
      '.cslab-logic-draw-gatelabel{font-size:10px;fill:var(--mid);text-anchor:middle;font-family:inherit}' +
      '.cslab-logic-draw-pin{cursor:pointer}' +
      '.cslab-logic-draw-pinhit{fill:transparent}' +
      '.cslab-logic-draw-pindot{fill:var(--card-bg);stroke:var(--mid);stroke-width:2}' +
      '.cslab-logic-draw-pin-out .cslab-logic-draw-pindot{stroke:var(--accent)}' +
      '.cslab-logic-draw-pin.armed .cslab-logic-draw-pindot{fill:var(--accent);stroke:var(--accent)}' +
      '.cslab-logic-draw-pin-in-filled .cslab-logic-draw-pindot{fill:var(--success);stroke:var(--success)}' +
      '.cslab-logic-draw-pin-in-empty .cslab-logic-draw-pindot{stroke:#c0392b;stroke-dasharray:3 2}' +
      '.cslab-logic-draw-remove{cursor:pointer}' +
      '.cslab-logic-draw-remove text{fill:var(--mid);font-size:13px;font-weight:700}' +
      '.cslab-logic-draw-remove:hover text{fill:#c0392b}';
    document.head.appendChild(style);
  }

  // ── Mode 1: Playground ──────────────────────────────────────────
  function mountPlayground(container, ctx) {
    container.innerHTML = '';
    const picker = document.createElement('div');
    picker.className = 'cslab-logic-picker';
    const stage = document.createElement('div');
    stage.className = 'cslab-logic-stage';
    container.appendChild(picker);
    container.appendChild(stage);

    PLAYGROUND_IDS.forEach(id => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-logic-pick-btn';
      b.textContent = CIRCUITS[id].label;
      b.addEventListener('click', () => selectCircuit(id));
      picker.appendChild(b);
    });

    function selectCircuit(id) {
      Array.prototype.forEach.call(picker.children, (btn, i) => btn.classList.toggle('active', PLAYGROUND_IDS[i] === id));
      renderStage(id);
    }

    function renderStage(id) {
      stage.innerHTML = '';
      const circuit = CIRCUITS[id];
      const values = {};
      circuit.inputs.forEach(letter => { values[letter] = 0; });

      const toggleRow = document.createElement('div');
      toggleRow.className = 'cslab-logic-toggles';
      circuit.inputs.forEach(letter => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cslab-logic-toggle off';
        btn.textContent = letter + ' = 0';
        btn.addEventListener('click', () => {
          values[letter] = values[letter] ? 0 : 1;
          btn.textContent = letter + ' = ' + values[letter];
          btn.classList.toggle('off', values[letter] === 0);
          btn.classList.toggle('on', values[letter] === 1);
          update();
        });
        toggleRow.appendChild(btn);
      });
      stage.appendChild(toggleRow);

      const built = buildCircuitSVG(circuit);
      const diagramWrap = document.createElement('div');
      diagramWrap.className = 'cslab-logic-diagram';
      diagramWrap.appendChild(built.svg);
      stage.appendChild(diagramWrap);

      const qReadout = document.createElement('p');
      qReadout.className = 'cslab-logic-qreadout';
      stage.appendChild(qReadout);

      function update() {
        const signals = evalCircuit(circuit, values);
        built.setSignals(signals);
        qReadout.textContent = 'Q = ' + signals[circuit.output];
      }
      update();
    }

    selectCircuit(PLAYGROUND_IDS[0]);
  }

  // ── Mode 2: Truth-table challenges ───────────────────────────────
  function buildChallengeTable(container, circuit) {
    const rows = fullTruthTable(circuit);
    const interIds = intermediateIds(circuit);
    const columns = circuit.inputs.concat(interIds).concat([circuit.output]);

    const table = document.createElement('table');
    table.className = 'cslab-logic-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const cellRefs = [];
    rows.forEach(rowSignals => {
      const tr = document.createElement('tr');
      const rowCells = {};
      columns.forEach(col => {
        const td = document.createElement('td');
        if (circuit.inputs.indexOf(col) !== -1) {
          td.textContent = String(rowSignals[col]);
          td.className = 'cslab-logic-fixed';
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cslab-logic-cell';
          btn.dataset.value = '0';
          btn.textContent = '0';
          btn.addEventListener('click', () => {
            const next = btn.dataset.value === '1' ? '0' : '1';
            btn.dataset.value = next;
            btn.textContent = next;
            btn.classList.remove('correct', 'incorrect');
          });
          td.appendChild(btn);
          rowCells[col] = btn;
        }
        tr.appendChild(td);
      });
      cellRefs.push(rowCells);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    return { rows: rows, columns: columns, cellRefs: cellRefs };
  }

  function markSolved(ctx, challengeId) {
    const list = ctx.store.get('solved', []);
    if (list.indexOf(challengeId) === -1) {
      list.push(challengeId);
      ctx.store.set('solved', list);
    }
  }

  function mountChallenge(container, ctx, challengeId, onSolved) {
    container.innerHTML = '';
    const circuit = CIRCUITS[challengeId];

    const head = document.createElement('p');
    head.className = 'cslab-logic-challenge-title';
    head.textContent = circuit.label + ' — complete the truth table';
    container.appendChild(head);

    const diagramWrap = document.createElement('div');
    diagramWrap.className = 'cslab-logic-diagram';
    diagramWrap.appendChild(buildCircuitSVG(circuit).svg);
    container.appendChild(diagramWrap);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'cslab-logic-tablewrap';
    container.appendChild(tableWrap);
    const t = buildChallengeTable(tableWrap, circuit);

    const feedback = document.createElement('div');
    feedback.className = 'cslab-feedback';
    container.appendChild(feedback);

    const btnRow = document.createElement('div');
    btnRow.className = 'cslab-drills-btnrow';
    const checkBtn = CsLab.ui.btn('Check');
    const revealBtn = CsLab.ui.btn('Reveal answers', 'secondary');
    revealBtn.style.display = 'none';
    btnRow.appendChild(checkBtn);
    btnRow.appendChild(revealBtn);
    container.appendChild(btnRow);

    const failsKey = 'fails_' + challengeId;
    let solved = false;

    checkBtn.addEventListener('click', () => {
      if (solved) return;
      let allCorrect = true;
      t.rows.forEach((rowSignals, rIdx) => {
        t.columns.forEach(col => {
          if (circuit.inputs.indexOf(col) !== -1) return;
          const btn = t.cellRefs[rIdx][col];
          const ok = btn.dataset.value === String(rowSignals[col]);
          btn.classList.toggle('correct', ok);
          btn.classList.toggle('incorrect', !ok);
          if (!ok) allCorrect = false;
        });
      });
      if (allCorrect) {
        solved = true;
        checkBtn.disabled = true;
        revealBtn.style.display = 'none';
        ctx.store.set(failsKey, 0);
        CsLab.ui.feedback(feedback, true, 'All correct! Table complete.');
        markSolved(ctx, challengeId);
        if (onSolved) onSolved();
        ctx.complete({ challenge: challengeId });
      } else {
        const fails = ctx.store.get(failsKey, 0) + 1;
        ctx.store.set(failsKey, fails);
        CsLab.ui.feedback(feedback, false, 'Some cells are wrong — try again.' + (fails >= 2 ? ' You can reveal the answers below.' : ''));
        if (fails >= 2) revealBtn.style.display = '';
      }
    });

    revealBtn.addEventListener('click', () => {
      t.rows.forEach((rowSignals, rIdx) => {
        t.columns.forEach(col => {
          if (circuit.inputs.indexOf(col) !== -1) return;
          const btn = t.cellRefs[rIdx][col];
          btn.dataset.value = String(rowSignals[col]);
          btn.textContent = String(rowSignals[col]);
          btn.classList.remove('incorrect');
          btn.classList.add('correct');
        });
      });
      CsLab.ui.feedback(feedback, true, 'Answers revealed — study the pattern, then try the next challenge.');
      revealBtn.disabled = true;
    });
  }

  function mountChallenges(container, ctx) {
    container.innerHTML = '';
    const picker = document.createElement('div');
    picker.className = 'cslab-logic-challengelist';
    const stage = document.createElement('div');
    stage.className = 'cslab-logic-stage';
    container.appendChild(picker);
    container.appendChild(stage);

    function solvedList() { return ctx.store.get('solved', []); }

    function refreshPicker(activeId) {
      picker.innerHTML = '';
      CHALLENGE_IDS.forEach((id, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cslab-logic-challenge-btn' + (id === activeId ? ' active' : '') + (solvedList().indexOf(id) !== -1 ? ' done' : '');
        b.textContent = (i + 1) + '. ' + CIRCUITS[id].label;
        b.addEventListener('click', () => selectChallenge(id));
        picker.appendChild(b);
      });
    }

    function selectChallenge(id) {
      refreshPicker(id);
      mountChallenge(stage, ctx, id, () => refreshPicker(id));
    }

    selectChallenge(CHALLENGE_IDS[0]);
  }

  // ── Mode 3: Draw the circuit ────────────────────────────────────
  // The 2024 paper asks students to DRAW a circuit for a given Boolean
  // expression. The student places gates from a palette into a single
  // canvas column, then wires it up by tapping an output pin (an input
  // letter, or a gate's own output) followed by the input pin it should
  // connect to. Any circuit that is logically equivalent to the target
  // passes — a differently-wired-but-correct circuit is still correct,
  // exactly like the real "logically correct" mark scheme rule — but
  // (also exactly like the real mark scheme) using more or fewer gates
  // than the model answer caps the mark at 2/3 instead of 3/3.

  const DRAW_COL_W = 150, DRAW_ROW_H = 64, DRAW_GATE_W = 62, DRAW_GATE_H = 40, DRAW_MARGIN_X = 50, DRAW_MARGIN_Y = 24;

  function drawSlotCountFor(type) { return type === 'NOT' ? 1 : 2; }

  function markDrawSolved(ctx, challengeId) {
    const list = ctx.store.get('drawSolved', []);
    if (list.indexOf(challengeId) === -1) {
      list.push(challengeId);
      ctx.store.set('drawSolved', list);
    }
  }

  function addSvgPin(svg, x, y, cls, onClick) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'cslab-logic-draw-pin ' + cls);
    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('cx', x); hit.setAttribute('cy', y); hit.setAttribute('r', 16);
    hit.setAttribute('class', 'cslab-logic-draw-pinhit');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 6);
    dot.setAttribute('class', 'cslab-logic-draw-pindot');
    g.appendChild(hit);
    g.appendChild(dot);
    if (onClick) g.addEventListener('click', onClick);
    svg.appendChild(g);
    return g;
  }

  function addSvgRemove(svg, x, y, onClick) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'cslab-logic-draw-remove');
    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('cx', x); hit.setAttribute('cy', y); hit.setAttribute('r', 14);
    hit.setAttribute('class', 'cslab-logic-draw-pinhit');
    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', x); txt.setAttribute('y', y + 4);
    txt.setAttribute('text-anchor', 'middle');
    txt.textContent = '✕';
    g.appendChild(hit);
    g.appendChild(txt);
    g.addEventListener('click', onClick);
    svg.appendChild(g);
  }

  function mountDrawChallenge(container, ctx, challengeId, onSolved) {
    container.innerHTML = '';
    const target = CIRCUITS[challengeId];
    const exprLabel = DRAW_EXPR_LABELS[challengeId];

    const head = document.createElement('p');
    head.className = 'cslab-logic-challenge-title';
    head.textContent = 'Build a circuit for: ' + exprLabel;
    container.appendChild(head);

    container.appendChild((function () {
      const p = document.createElement('p');
      p.className = 'cslab-logic-draw-instructions';
      p.textContent = "Tap a gate below to add it to your circuit, then wire it up: tap an output pin (an input letter, or a gate's right-hand pin), then tap the input pin you want to connect it to. Finish by wiring something into P on the right.";
      return p;
    })());

    const palette = document.createElement('div');
    palette.className = 'cslab-logic-draw-palette';
    container.appendChild(palette);

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'cslab-logic-diagram cslab-logic-draw-canvas';
    container.appendChild(canvasWrap);

    const statusEl = document.createElement('p');
    statusEl.className = 'cslab-logic-draw-status';
    container.appendChild(statusEl);

    const feedback = document.createElement('div');
    feedback.className = 'cslab-feedback';
    container.appendChild(feedback);

    const btnRow = document.createElement('div');
    btnRow.className = 'cslab-drills-btnrow';
    const checkBtn = CsLab.ui.btn('Check my circuit');
    const resetBtn = CsLab.ui.btn('Reset', 'secondary');
    const revealBtn = CsLab.ui.btn('Reveal a model answer', 'secondary');
    revealBtn.style.display = 'none';
    btnRow.appendChild(checkBtn);
    btnRow.appendChild(resetBtn);
    btnRow.appendChild(revealBtn);
    container.appendChild(btnRow);

    // ── state ──
    let gates = [];       // { id:'G1', type:'AND'|'OR'|'NOT', inputs:[srcId|null, ...] }
    let outputSrc = null;  // srcId wired into the final P terminal
    let armed = null;      // srcId currently armed for wiring, or null
    let nextGateNum = 1;
    let fails = 0;
    let solved = false;

    ['AND', 'OR', 'NOT'].forEach(function (type) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-logic-draw-gatebtn';
      b.textContent = '+ ' + type;
      b.addEventListener('click', function () { addGate(type); });
      palette.appendChild(b);
    });

    function addGate(type) {
      if (solved) return;
      gates.push({ id: 'G' + (nextGateNum++), type: type, inputs: new Array(drawSlotCountFor(type)).fill(null) });
      render();
    }

    function removeGate(id) {
      if (solved) return;
      gates = gates.filter(function (g) { return g.id !== id; });
      gates.forEach(function (g) { g.inputs = g.inputs.map(function (src) { return src === id ? null : src; }); });
      if (outputSrc === id) outputSrc = null;
      if (armed === id) armed = null;
      render();
    }

    function arm(srcId) {
      if (solved) return;
      armed = (armed === srcId) ? null : srcId;
      render();
    }

    function wireInto(gateId, slotIndex) {
      if (solved || armed === null || armed === gateId) return;
      const g = gates.filter(function (x) { return x.id === gateId; })[0];
      g.inputs[slotIndex] = armed;
      armed = null;
      render();
    }

    function wireIntoOutput() {
      if (solved || armed === null) return;
      outputSrc = armed;
      armed = null;
      render();
    }

    function resetAll() {
      gates = []; outputSrc = null; armed = null; nextGateNum = 1; fails = 0; solved = false;
      revealBtn.style.display = 'none';
      revealBtn.disabled = false;
      checkBtn.disabled = false;
      feedback.textContent = '';
      feedback.className = 'cslab-feedback';
      render();
    }
    resetBtn.addEventListener('click', resetAll);

    function buildStudentCircuit() {
      return {
        inputs: target.inputs,
        gates: gates.map(function (g) { return { type: g.type, inputs: g.inputs.slice(), output: g.id }; }),
        output: outputSrc,
      };
    }

    function isComplete() {
      if (outputSrc === null) return false;
      return gates.every(function (g) { return g.inputs.every(function (src) { return src !== null; }); });
    }

    checkBtn.addEventListener('click', function () {
      if (solved) return;
      if (!gates.length || !isComplete()) {
        CsLab.ui.feedback(feedback, false, 'Add at least one gate and wire up every input (including P) before checking.');
        return;
      }
      const result = gradeDrawChallenge(buildStudentCircuit(), target);
      if (result.correct && result.gateCountMatches) {
        solved = true;
        checkBtn.disabled = true;
        revealBtn.style.display = 'none';
        CsLab.ui.feedback(feedback, true, '✓ Logically correct AND built with the minimal number of gates — full marks: ' + result.marks + '/' + result.maxMarks + '.');
        markDrawSolved(ctx, challengeId);
        if (onSolved) onSolved();
        ctx.complete({ drawChallenge: challengeId, marks: result.marks });
      } else if (result.correct) {
        solved = true;
        checkBtn.disabled = true;
        revealBtn.style.display = 'none';
        CsLab.ui.feedback(feedback, true, '✓ Logically correct — but you used ' + result.studentGateCount +
          (result.studentGateCount === 1 ? ' gate' : ' gates') + ' where the model answer uses ' + result.targetGateCount +
          '. Real exam mark schemes cap circuits like this at ' + result.marks + '/' + result.maxMarks + ' ("max 2 if extra/missing gates").');
        markDrawSolved(ctx, challengeId);
        if (onSolved) onSolved();
        ctx.complete({ drawChallenge: challengeId, marks: result.marks });
      } else {
        fails += 1;
        CsLab.ui.feedback(feedback, false, "Not quite — that circuit doesn't match " + exprLabel + ' on every input combination. Try again.' +
          (fails >= 2 ? ' You can reveal a model answer below.' : ''));
        if (fails >= 2) revealBtn.style.display = '';
      }
      render();
    });

    revealBtn.addEventListener('click', function () {
      gates = target.gates.map(function (g) { return { id: g.output, type: g.type, inputs: g.inputs.slice() }; });
      nextGateNum = gates.length + 1;
      outputSrc = target.output;
      armed = null;
      CsLab.ui.feedback(feedback, true, 'Model answer revealed — study the wiring, then press Reset to try your own.');
      checkBtn.disabled = true;
      revealBtn.disabled = true;
      render();
    });

    function sourcePin(id, gatePins, inputPins) { return inputPins[id] || (gatePins[id] && gatePins[id].out); }

    function render() {
      canvasWrap.innerHTML = '';
      const rows = Math.max(target.inputs.length, gates.length, 1);
      const width = DRAW_MARGIN_X * 2 + DRAW_COL_W * 2 + 40;
      const height = DRAW_MARGIN_Y * 2 + Math.max(rows - 1, 0) * DRAW_ROW_H + DRAW_GATE_H;

      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', Math.min(height, 320));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.classList.add('cslab-logic-svg');

      const inputPins = {};
      target.inputs.forEach(function (letter, i) {
        const x = DRAW_MARGIN_X, y = DRAW_MARGIN_Y + i * DRAW_ROW_H + DRAW_GATE_H / 2;
        inputPins[letter] = { x: x, y: y };
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', x - 14);
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('class', 'cslab-logic-label');
        label.textContent = letter;
        svg.appendChild(label);
        addSvgPin(svg, x, y, 'cslab-logic-draw-pin-out' + (armed === letter ? ' armed' : ''), function () { arm(letter); });
      });

      const gatePins = {};
      gates.forEach(function (g, i) {
        const gx = DRAW_MARGIN_X + DRAW_COL_W;
        const gy = DRAW_MARGIN_Y + i * DRAW_ROW_H;
        const drawn = drawGateShape(svg, g.type, gx, gy, DRAW_GATE_W, DRAW_GATE_H);
        gatePins[g.id] = drawn;

        const gLabel = document.createElementNS(SVG_NS, 'text');
        gLabel.setAttribute('x', gx + DRAW_GATE_W / 2);
        gLabel.setAttribute('y', gy - 6);
        gLabel.setAttribute('text-anchor', 'middle');
        gLabel.setAttribute('class', 'cslab-logic-draw-gatelabel');
        gLabel.textContent = g.id;
        svg.appendChild(gLabel);

        if (!solved) addSvgRemove(svg, gx + DRAW_GATE_W + 14, gy + DRAW_GATE_H / 2, function () { removeGate(g.id); });

        addSvgPin(svg, drawn.out.x, drawn.out.y, 'cslab-logic-draw-pin-out' + (armed === g.id ? ' armed' : ''), function () { arm(g.id); });
        drawn.in.forEach(function (pin, slotIdx) {
          const filled = g.inputs[slotIdx] !== null;
          addSvgPin(svg, pin.x, pin.y, filled ? 'cslab-logic-draw-pin-in-filled' : 'cslab-logic-draw-pin-in-empty', function () { wireInto(g.id, slotIdx); });
        });
      });

      const pX = DRAW_MARGIN_X + DRAW_COL_W * 2, pY = DRAW_MARGIN_Y + DRAW_GATE_H / 2;
      const pLabel = document.createElementNS(SVG_NS, 'text');
      pLabel.setAttribute('x', pX + 16);
      pLabel.setAttribute('y', pY + 5);
      pLabel.setAttribute('class', 'cslab-logic-label');
      pLabel.textContent = 'P';
      svg.appendChild(pLabel);
      addSvgPin(svg, pX, pY, outputSrc !== null ? 'cslab-logic-draw-pin-in-filled' : 'cslab-logic-draw-pin-in-empty', wireIntoOutput);

      gates.forEach(function (g) {
        g.inputs.forEach(function (src, slotIdx) {
          if (src === null) return;
          const from = sourcePin(src, gatePins, inputPins);
          const to = gatePins[g.id].in[slotIdx];
          if (from && to) drawOrthogonalWire(svg, from, to);
        });
      });
      if (outputSrc !== null) {
        const from = sourcePin(outputSrc, gatePins, inputPins);
        if (from) drawOrthogonalWire(svg, from, { x: pX, y: pY });
      }

      canvasWrap.appendChild(svg);

      if (solved) statusEl.textContent = 'Solved — press Reset to try again, or pick another challenge above.';
      else if (armed !== null) statusEl.textContent = 'Now tap the input pin (dashed circle) you want to wire ' + armed + ' into.';
      else statusEl.textContent = "Tap an output pin to start a wire, then tap the input pin to connect it to.";
    }

    render();
  }

  function mountDrawChallenges(container, ctx) {
    container.innerHTML = '';
    const picker = document.createElement('div');
    picker.className = 'cslab-logic-challengelist';
    const stage = document.createElement('div');
    stage.className = 'cslab-logic-stage';
    container.appendChild(picker);
    container.appendChild(stage);

    function solvedList() { return ctx.store.get('drawSolved', []); }

    function refreshPicker(activeId) {
      picker.innerHTML = '';
      DRAW_CHALLENGE_IDS.forEach(function (id, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cslab-logic-challenge-btn' + (id === activeId ? ' active' : '') + (solvedList().indexOf(id) !== -1 ? ' done' : '');
        b.textContent = (i + 1) + '. ' + DRAW_EXPR_LABELS[id];
        b.addEventListener('click', function () { selectChallenge(id); });
        picker.appendChild(b);
      });
    }

    function selectChallenge(id) {
      refreshPicker(id);
      mountDrawChallenge(stage, ctx, id, function () { refreshPicker(id); });
    }

    selectChallenge(DRAW_CHALLENGE_IDS[0]);
  }

  // ── top-level mount ───────────────────────────────────────────────
  function mount(el, ctx) {
    injectStyles();
    const root = document.createElement('div');
    root.className = 'cslab-logic';
    el.appendChild(root);

    const modeTabs = document.createElement('div');
    modeTabs.className = 'cslab-logic-modetabs';
    const body = document.createElement('div');
    root.appendChild(modeTabs);
    root.appendChild(body);

    const MODES = [
      { id: 'playground', label: 'Playground', run: mountPlayground },
      { id: 'challenges', label: 'Truth-table challenges', run: mountChallenges },
      { id: 'draw', label: 'Draw the circuit', run: mountDrawChallenges },
    ];

    function selectMode(mode) {
      Array.prototype.forEach.call(modeTabs.children, (btn, i) => btn.classList.toggle('active', MODES[i].id === mode.id));
      mode.run(body, ctx);
    }

    MODES.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-logic-modetab';
      b.textContent = m.label;
      b.addEventListener('click', () => selectMode(m));
      modeTabs.appendChild(b);
    });

    selectMode(MODES[0]);
  }

  if (typeof CsLab !== 'undefined' && CsLab && typeof CsLab.registerTool === 'function') {
    CsLab.registerTool('logic-lab', { title: 'Logic Gate Lab', icon: '🔌', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      gateEval, evalCircuit, fullTruthTable, intermediateIds, layoutCircuit, CIRCUITS, PLAYGROUND_IDS, CHALLENGE_IDS,
      evalCircuitSafe, circuitsEquivalent, gradeDrawChallenge, DRAW_CHALLENGE_IDS, DRAW_EXPR_LABELS,
    };
  }
})();
