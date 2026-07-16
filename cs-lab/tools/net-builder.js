// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Network Builder (CS-CONTENT-PLAN §7.1, appendix 1.3.1)
// Registers 'net-builder' on 1.3.1 Networks and Topologies.
//
// The playground is one fixed roster of 6 devices (4 PCs, 1 switch,
// 1 server). Challenge 1 (star) wires all 5 non-switch devices to
// the switch and only the switch. Challenge 2 (mesh) ignores the
// switch and wires the same 5 devices directly to each other
// (n(n-1)/2 = 10 links for n=5) — the classic OCR star-vs-mesh pair.
//
// Everything above the "DOM / UI" banner is pure graph logic with no
// DOM dependency, so it is unit-testable in plain Node (see the
// module.exports guard at the bottom).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── PURE GRAPH LOGIC ─────────────────────────────────────────────

  const STAR_NODES = ['switch', 'pc1', 'pc2', 'pc3', 'pc4', 'server'];
  const MESH_NODES = ['pc1', 'pc2', 'pc3', 'pc4', 'server']; // 5 nodes — switch not used in a mesh

  const LABELS = { switch: 'the switch', pc1: 'PC1', pc2: 'PC2', pc3: 'PC3', pc4: 'PC4', server: 'the server' };
  function labelOf(id) { return LABELS[id] || id; }

  function edgeKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  function edgeEndpoints(key) { return key.split('|'); }

  function toggleEdge(edgeSet, a, b) {
    const k = edgeKey(a, b);
    const next = new Set(edgeSet);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  }

  function hasEdge(edgeSet, a, b) { return edgeSet.has(edgeKey(a, b)); }

  function neighbours(edgeSet, nodeId) {
    const out = [];
    edgeSet.forEach(function (k) {
      const pair = edgeEndpoints(k);
      if (pair[0] === nodeId) out.push(pair[1]);
      else if (pair[1] === nodeId) out.push(pair[0]);
    });
    return out;
  }

  // Every spoke must connect to the switch, and ONLY the switch.
  function checkStar(edgeSet) {
    const spokes = STAR_NODES.filter(function (n) { return n !== 'switch'; });
    const problems = [];
    spokes.forEach(function (id) {
      if (!hasEdge(edgeSet, 'switch', id)) {
        problems.push({ type: 'missing', message: labelOf(id) + ' still needs a cable to the switch.' });
      }
    });
    edgeSet.forEach(function (k) {
      const pair = edgeEndpoints(k);
      if (pair[0] !== 'switch' && pair[1] !== 'switch') {
        problems.push({
          type: 'direct',
          message: labelOf(pair[0]) + ' is connected to ' + labelOf(pair[1]) + ' — in a star, devices only connect to the central switch.',
        });
      }
    });
    return { ok: problems.length === 0, problems: problems };
  }

  function meshCableCount(n) { return (n * (n - 1)) / 2; }

  // Every pair of the 5 mesh devices must have a direct cable.
  function checkMesh(edgeSet) {
    const problems = [];
    let actual = 0;
    for (let i = 0; i < MESH_NODES.length; i++) {
      for (let j = i + 1; j < MESH_NODES.length; j++) {
        const a = MESH_NODES[i], b = MESH_NODES[j];
        if (hasEdge(edgeSet, a, b)) {
          actual += 1;
        } else {
          problems.push({ type: 'missing', message: 'Missing a cable between ' + labelOf(a) + ' and ' + labelOf(b) + '.' });
        }
      }
    }
    return { ok: problems.length === 0, problems: problems, required: meshCableCount(MESH_NODES.length), actual: actual };
  }

  // BFS reachability from `anchor` over `edgeSet`, restricted to `allNodes`.
  function reachableFrom(edgeSet, anchor, allNodes) {
    const seen = new Set([anchor]);
    const queue = [anchor];
    while (queue.length) {
      const cur = queue.shift();
      neighbours(edgeSet, cur).forEach(function (nb) {
        if (!seen.has(nb) && allNodes.indexOf(nb) !== -1) { seen.add(nb); queue.push(nb); }
      });
    }
    return seen;
  }

  // Node ids in `allNodes` that can no longer reach `anchor` once the
  // edges in `cutKeys` are removed.
  function disconnectedAfterCuts(edgeSet, cutKeys, anchor, allNodes) {
    const remaining = new Set(edgeSet);
    cutKeys.forEach(function (k) { remaining.delete(k); });
    const reachable = reachableFrom(remaining, anchor, allNodes);
    return allNodes.filter(function (n) { return n !== anchor && !reachable.has(n); });
  }

  // ══════════════════════════════════════════════════════════════
  // DOM / UI — only runs in the browser, inside the registered tool.
  // ══════════════════════════════════════════════════════════════

  const ICONS = { switch: '🖧', server: '🗄️', pc1: '💻', pc2: '💻', pc3: '💻', pc4: '💻' };
  const VIEW_W = 480, VIEW_H = 340;

  function defaultPositions() {
    const center = { x: VIEW_W / 2, y: VIEW_H / 2 };
    const radius = 130;
    const outer = ['server', 'pc1', 'pc2', 'pc4', 'pc3'];
    const positions = { switch: { x: center.x, y: center.y } };
    outer.forEach(function (id, i) {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / outer.length);
      positions[id] = { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
    });
    return positions;
  }

  function injectStyle() {
    if (document.getElementById('cslab-net-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-net-style';
    style.textContent =
      '.cslab-net { display: flex; flex-direction: column; gap: 12px; }' +
      '.cslab-net .net-tabs { display: flex; gap: 8px; flex-wrap: wrap; }' +
      '.cslab-net .net-tab { min-height: 44px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);' +
      '  background: var(--paper); color: var(--ink); font-family: inherit; font-size: 14px; cursor: pointer; }' +
      '.cslab-net .net-tab.active { background: var(--accent); color: var(--paper); border-color: var(--accent); font-weight: 600; }' +
      '.cslab-net .net-instructions { font-size: 14px; color: var(--mid); margin: 0; }' +
      '.cslab-net .net-board-wrap { border: 1px solid var(--border); border-radius: 10px; background: var(--card-bg); touch-action: none; }' +
      '.cslab-net svg { width: 100%; height: auto; display: block; }' +
      '.cslab-net .net-cable { stroke: currentColor; color: var(--mid); stroke-width: 3; }' +
      '.cslab-net .net-cable-hit { stroke: transparent; stroke-width: 22; cursor: pointer; }' +
      '.cslab-net .net-cable--cut { stroke-dasharray: 6 6; opacity: .35; }' +
      '.cslab-net .net-node-circle { fill: var(--card-bg); stroke: var(--border); stroke-width: 2; cursor: grab; }' +
      '.cslab-net .net-node.selected .net-node-circle { stroke: var(--accent); stroke-width: 4; }' +
      '.cslab-net .net-node.grey .net-node-circle { opacity: .35; }' +
      '.cslab-net .net-node.grey .net-node-label, .cslab-net .net-node.grey .net-node-icon { opacity: .35; }' +
      '.cslab-net .net-node-icon { font-size: 26px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }' +
      '.cslab-net .net-node-label { font-size: 12px; fill: var(--ink); text-anchor: middle; pointer-events: none; font-weight: 600; }' +
      '.cslab-net .net-feedback { font-size: 14px; font-weight: 600; margin: 0; min-height: 20px; }' +
      '.cslab-net .net-feedback.ok { color: var(--success); }' +
      '.cslab-net .net-feedback.no { color: var(--wrong); }' +
      '.cslab-net .net-hints { margin: 0; padding-left: 18px; font-size: 13px; color: var(--mid); }' +
      '.cslab-net .net-caption { font-size: 14px; font-weight: 600; color: var(--ink); min-height: 20px; }' +
      '.cslab-net .net-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }' +
      '.cslab-net .cslab-btn { min-height: 44px; }' +
      '.cslab-net .net-quiz-q { border: 1px solid var(--border); border-radius: 10px; padding: 14px; background: var(--card-bg); display: flex; flex-direction: column; gap: 8px; }' +
      '.cslab-net .net-quiz-q input[type=number] { min-height: 40px; width: 100px; font-family: inherit; font-size: 14px; padding: 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--paper); color: var(--ink); }' +
      '.cslab-net .net-quiz-working { font-size: 13px; color: var(--mid); }' +
      '.cslab-net .net-quiz-result { font-weight: 700; }' +
      '.cslab-net .net-quiz-result.ok { color: var(--success); }' +
      '.cslab-net .net-quiz-result.no { color: var(--wrong); }';
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyle();

    const wrap = document.createElement('div');
    wrap.className = 'cslab-net';
    wrap.innerHTML =
      '<div class="net-tabs">' +
      '  <button type="button" class="net-tab" data-mode="star">⭐ Star challenge</button>' +
      '  <button type="button" class="net-tab" data-mode="mesh">🕸️ Mesh challenge</button>' +
      '  <button type="button" class="net-tab" data-mode="quiz">🔢 Mesh cable quiz</button>' +
      '</div>' +
      '<p class="net-instructions"></p>' +
      '<div class="net-panel-play">' +
      '  <div class="net-board-wrap"><svg viewBox="0 0 ' + VIEW_W + ' ' + VIEW_H + '"></svg></div>' +
      '  <p class="net-caption"></p>' +
      '  <div class="net-row">' +
      '    <button type="button" class="cslab-btn net-check">Check my wiring</button>' +
      '    <button type="button" class="cslab-btn secondary net-clear">Clear cables</button>' +
      '    <button type="button" class="cslab-btn secondary net-failure" hidden>💥 Try failure sim</button>' +
      '    <button type="button" class="cslab-btn secondary net-restore" hidden>Restore all cables</button>' +
      '  </div>' +
      '  <p class="net-feedback"></p>' +
      '  <ul class="net-hints"></ul>' +
      '</div>' +
      '<div class="net-panel-quiz" hidden></div>';
    el.appendChild(wrap);

    const els = {
      tabs: wrap.querySelectorAll('.net-tab'),
      instructions: wrap.querySelector('.net-instructions'),
      playPanel: wrap.querySelector('.net-panel-play'),
      quizPanel: wrap.querySelector('.net-panel-quiz'),
      svg: wrap.querySelector('svg'),
      caption: wrap.querySelector('.net-caption'),
      check: wrap.querySelector('.net-check'),
      clear: wrap.querySelector('.net-clear'),
      failure: wrap.querySelector('.net-failure'),
      restore: wrap.querySelector('.net-restore'),
      feedback: wrap.querySelector('.net-feedback'),
      hints: wrap.querySelector('.net-hints'),
    };

    const state = {
      mode: 'star',
      edges: new Set(),
      positions: defaultPositions(),
      selected: null,
      solvedStarEdges: ctx.store.get('solvedStarEdges', null),
      solvedMeshEdges: ctx.store.get('solvedMeshEdges', null),
      failureMode: null,   // 'star' | 'mesh' | null
      cutSet: new Set(),
      drag: null,          // { id, moved }
    };

    function nodesForMode(mode) { return mode === 'mesh' ? MESH_NODES : STAR_NODES; }

    function instructionsFor(mode) {
      if (mode === 'star') return 'Connect every device so the office works as a star network: click a device, then click another to add or remove a cable. Every PC and the server must connect to the switch — and only the switch.';
      if (mode === 'mesh') return 'Wire these 5 devices (the PCs and the server — ignore the switch) into a full mesh: every device needs a direct cable to every other device.';
      return 'How many cables does a full mesh need? Work it out with n(n-1)÷2.';
    }

    function renderBoard() {
      const svg = els.svg;
      svg.innerHTML = '';
      const nsUrl = 'http://www.w3.org/2000/svg';
      const activeNodes = state.failureMode ? nodesForMode(state.failureMode) : nodesForMode(state.mode);
      const dimmedNode = state.mode === 'mesh' && !state.failureMode ? 'switch' : null;

      const disconnected = state.failureMode
        ? disconnectedAfterCuts(
            state.failureMode === 'star' ? state.solvedStarEdges : state.solvedMeshEdges,
            state.cutSet,
            state.failureMode === 'star' ? 'switch' : MESH_NODES[0],
            nodesForMode(state.failureMode)
          )
        : [];

      const edgesToDraw = state.failureMode
        ? (state.failureMode === 'star' ? state.solvedStarEdges : state.solvedMeshEdges)
        : state.edges;

      // Cables first (so nodes draw on top)
      edgesToDraw.forEach(function (key) {
        const pair = edgeEndpoints(key);
        const a = state.positions[pair[0]], b = state.positions[pair[1]];
        if (!a || !b) return;
        const isCut = state.failureMode && state.cutSet.has(key);
        const group = document.createElementNS(nsUrl, 'g');
        const hit = document.createElementNS(nsUrl, 'line');
        hit.setAttribute('class', 'net-cable-hit');
        hit.setAttribute('x1', a.x); hit.setAttribute('y1', a.y);
        hit.setAttribute('x2', b.x); hit.setAttribute('y2', b.y);
        const line = document.createElementNS(nsUrl, 'line');
        line.setAttribute('class', 'net-cable' + (isCut ? ' net-cable--cut' : ''));
        line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
        line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
        group.appendChild(hit);
        group.appendChild(line);
        if (state.failureMode) {
          group.style.cursor = 'pointer';
          group.addEventListener('click', function () {
            const next = new Set(state.cutSet);
            if (next.has(key)) next.delete(key); else next.add(key);
            state.cutSet = next;
            renderBoard();
            updateFailureCaption();
          });
        }
        svg.appendChild(group);
      });

      // Nodes
      STAR_NODES.forEach(function (id) {
        const pos = state.positions[id];
        const isActive = activeNodes.indexOf(id) !== -1;
        const g = document.createElementNS(nsUrl, 'g');
        g.setAttribute('class', 'net-node' +
          (state.selected === id ? ' selected' : '') +
          ((disconnected.indexOf(id) !== -1 || (!isActive && !state.failureMode)) ? ' grey' : ''));
        g.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');
        const circle = document.createElementNS(nsUrl, 'circle');
        circle.setAttribute('class', 'net-node-circle');
        circle.setAttribute('r', '28');
        const icon = document.createElementNS(nsUrl, 'text');
        icon.setAttribute('class', 'net-node-icon');
        icon.setAttribute('y', '-2');
        icon.textContent = ICONS[id];
        const label = document.createElementNS(nsUrl, 'text');
        label.setAttribute('class', 'net-node-label');
        label.setAttribute('y', '44');
        label.textContent = labelOf(id) === 'the switch' ? 'Switch' : (labelOf(id) === 'the server' ? 'Server' : labelOf(id));
        g.appendChild(circle);
        g.appendChild(icon);
        g.appendChild(label);
        if (isActive || state.failureMode) wireNodeEvents(g, id);
        svg.appendChild(g);
      });

      if (dimmedNode) {
        // switch is visible but inert during the mesh challenge
      }
    }

    function clampPos(x, y) {
      return { x: Math.max(30, Math.min(VIEW_W - 30, x)), y: Math.max(30, Math.min(VIEW_H - 30, y)) };
    }

    function svgPoint(evt) {
      const rect = els.svg.getBoundingClientRect();
      const scaleX = VIEW_W / rect.width, scaleY = VIEW_H / rect.height;
      return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
    }

    function wireNodeEvents(g, id) {
      g.addEventListener('pointerdown', function (evt) {
        if (state.failureMode) return; // no repositioning mid failure-sim
        evt.preventDefault();
        state.drag = { id: id, moved: false, start: svgPoint(evt) };
        try { g.setPointerCapture(evt.pointerId); } catch (e) {}
      });
      g.addEventListener('pointermove', function (evt) {
        if (!state.drag || state.drag.id !== id) return;
        const p = svgPoint(evt);
        if (Math.abs(p.x - state.drag.start.x) > 4 || Math.abs(p.y - state.drag.start.y) > 4) state.drag.moved = true;
        if (state.drag.moved) {
          state.positions[id] = clampPos(p.x, p.y);
          renderBoard();
        }
      });
      g.addEventListener('pointerup', function () {
        if (!state.drag || state.drag.id !== id) return;
        const moved = state.drag.moved;
        state.drag = null;
        if (!moved) handleNodeTap(id);
      });
    }

    function handleNodeTap(id) {
      if (state.mode === 'mesh' && id === 'switch') return; // switch is inert in the mesh challenge
      if (state.selected === null) {
        state.selected = id;
      } else if (state.selected === id) {
        state.selected = null;
      } else {
        state.edges = toggleEdge(state.edges, state.selected, id);
        state.selected = null;
      }
      renderBoard();
    }

    function runCheck() {
      const result = state.mode === 'star' ? checkStar(state.edges) : checkMesh(state.edges);
      els.hints.innerHTML = '';
      if (result.ok) {
        els.feedback.className = 'net-feedback ok';
        els.feedback.textContent = state.mode === 'star'
          ? '✓ That is a working star network — every device connects only to the switch.'
          : '✓ Full mesh complete — all ' + result.required + ' cables are in place.';
        if (state.mode === 'star') { state.solvedStarEdges = new Set(state.edges); ctx.store.set('solvedStarEdges', Array.from(state.solvedStarEdges)); }
        else { state.solvedMeshEdges = new Set(state.edges); ctx.store.set('solvedMeshEdges', Array.from(state.solvedMeshEdges)); }
        ctx.complete({ challenge: state.mode });
        els.failure.hidden = false;
      } else {
        els.feedback.className = 'net-feedback no';
        els.feedback.textContent = '✗ Not quite — ' + result.problems.length + ' thing' + (result.problems.length === 1 ? '' : 's') + ' to fix:';
        result.problems.slice(0, 4).forEach(function (p) {
          const li = document.createElement('li');
          li.textContent = p.message;
          els.hints.appendChild(li);
        });
      }
    }

    function updateFailureCaption() {
      const anchor = state.failureMode === 'star' ? 'switch' : MESH_NODES[0];
      const disconnected = disconnectedAfterCuts(
        state.failureMode === 'star' ? state.solvedStarEdges : state.solvedMeshEdges,
        state.cutSet, anchor, nodesForMode(state.failureMode)
      );
      if (state.cutSet.size === 0) {
        els.caption.textContent = 'Click a cable to cut it and see what happens.';
        return;
      }
      if (state.failureMode === 'star') {
        els.caption.textContent = disconnected.length
          ? disconnected.map(labelOf).join(' and ') + ' dropped off the network — but the rest are fine. A single cable cut only affects one device. If the switch ITSELF failed though, every device would lose its only connection at once — that is the star topology\'s weak point.'
          : 'That cable did not disconnect anything.';
      } else {
        els.caption.textContent = disconnected.length
          ? disconnected.map(labelOf).join(' and ') + ' lost every remaining path — that only happens once you cut enough cables to fully isolate a device.'
          : 'Every device can still reach every other device through a different cable — mesh networks reroute around a single failure.';
      }
    }

    function enterFailureMode() {
      state.failureMode = state.mode;
      state.cutSet = new Set();
      els.check.hidden = true;
      els.clear.hidden = true;
      els.failure.hidden = true;
      els.restore.hidden = false;
      els.feedback.textContent = '';
      els.hints.innerHTML = '';
      renderBoard();
      updateFailureCaption();
    }

    function exitFailureMode() {
      state.failureMode = null;
      state.cutSet = new Set();
      els.check.hidden = false;
      els.clear.hidden = false;
      els.failure.hidden = !((state.mode === 'star' && state.solvedStarEdges) || (state.mode === 'mesh' && state.solvedMeshEdges));
      els.restore.hidden = true;
      els.caption.textContent = '';
      renderBoard();
    }

    function setMode(mode) {
      state.mode = mode;
      state.selected = null;
      if (state.failureMode) exitFailureMode();
      Array.prototype.forEach.call(els.tabs, function (t) { t.classList.toggle('active', t.dataset.mode === mode); });
      els.instructions.textContent = instructionsFor(mode);
      if (mode === 'quiz') {
        els.playPanel.hidden = true;
        els.quizPanel.hidden = false;
        renderQuiz();
      } else {
        els.playPanel.hidden = false;
        els.quizPanel.hidden = true;
        state.edges = new Set();
        els.feedback.textContent = '';
        els.hints.innerHTML = '';
        els.failure.hidden = !((mode === 'star' && state.solvedStarEdges) || (mode === 'mesh' && state.solvedMeshEdges));
        els.restore.hidden = true;
        els.check.hidden = false;
        els.clear.hidden = false;
        renderBoard();
      }
    }

    Array.prototype.forEach.call(els.tabs, function (t) {
      t.addEventListener('click', function () { setMode(t.dataset.mode); });
    });
    els.check.addEventListener('click', runCheck);
    els.clear.addEventListener('click', function () {
      state.edges = new Set();
      state.selected = null;
      els.feedback.textContent = '';
      els.hints.innerHTML = '';
      renderBoard();
    });
    els.failure.addEventListener('click', enterFailureMode);
    els.restore.addEventListener('click', exitFailureMode);

    // ── Mini quiz: cables for a full mesh of 4, 6, 8 nodes ─────────
    const QUIZ_NS = [4, 6, 8];

    function renderQuiz() {
      const quiz = { pos: 0, score: 0 };
      els.quizPanel.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'net-quiz-q';
      els.quizPanel.appendChild(box);
      askQuizQuestion(quiz, box);
    }

    function askQuizQuestion(quiz, box) {
      if (quiz.pos >= QUIZ_NS.length) {
        box.innerHTML = '<p class="net-quiz-result ' + (quiz.score === QUIZ_NS.length ? 'ok' : 'no') + '">Quiz complete: ' + quiz.score + ' / ' + QUIZ_NS.length + '</p>';
        ctx.complete({ quiz: true, score: quiz.score });
        return;
      }
      const n = QUIZ_NS[quiz.pos];
      box.innerHTML =
        '<p>Question ' + (quiz.pos + 1) + ' of ' + QUIZ_NS.length + ': how many cables does a full mesh of <strong>' + n + '</strong> devices need?</p>' +
        '<input type="number" class="net-quiz-input" min="0">' +
        '<button type="button" class="cslab-btn net-quiz-submit">Submit</button>' +
        '<p class="net-quiz-working"></p>';
      const input = box.querySelector('.net-quiz-input');
      const working = box.querySelector('.net-quiz-working');
      box.querySelector('.net-quiz-submit').addEventListener('click', function () {
        const answer = Number(input.value);
        const correct = meshCableCount(n);
        const isRight = answer === correct;
        if (isRight) quiz.score += 1;
        working.textContent = 'Working: ' + n + ' × (' + n + ' − 1) ÷ 2 = ' + correct + '.' + (isRight ? ' Correct!' : ' You answered ' + (Number.isFinite(answer) ? answer : '(nothing)') + '.');
        working.className = 'net-quiz-working ' + (isRight ? '' : '');
        input.disabled = true;
        box.querySelector('.net-quiz-submit').disabled = true;
        setTimeout(function () {
          quiz.pos += 1;
          askQuizQuestion(quiz, box);
        }, 1400);
      });
    }

    setMode('star');
  }

  if (global && global.CsLab) {
    global.CsLab.registerTool('net-builder', {
      title: 'Network Builder',
      icon: '🕸️',
      mount: mount,
    });
  }

  // Node-only export for unit tests; no effect when loaded as a <script> tag.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      edgeKey: edgeKey,
      toggleEdge: toggleEdge,
      hasEdge: hasEdge,
      checkStar: checkStar,
      checkMesh: checkMesh,
      meshCableCount: meshCableCount,
      reachableFrom: reachableFrom,
      disconnectedAfterCuts: disconnectedAfterCuts,
      STAR_NODES: STAR_NODES,
      MESH_NODES: MESH_NODES,
    };
  }
})(typeof window !== 'undefined' ? window : undefined);
