// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — LP Builder (C3, ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'lp-builder'. Linear-programming lab (new UI, patterned on
// the logic-lab draw + net-builder build-and-check idioms):
//   1. SHADE — for each constraint pick which side of the boundary line to
//      shade OUT (the region NOT satisfying it, the OCR convention). Auto-check.
//   2. REGION — once shading is right, the feasible region + its vertices show.
//   3. OPTIMISE — read the objective at each vertex; pick the optimum. Auto-check.
//
// All LP geometry is pure module-scope functions (Node-unit-tested via the
// module.exports guard): half-plane test, line intersection, feasible-region
// vertices, objective optimum, and the correct shade-out side per constraint.
// The canvas draw layer is thin and every getContext('2d') is guarded, so the
// tool degrades gracefully with no 2D context. Per-page LP problems are keyed
// by pageId inside this module (pages never need editing). LaTeX backslashes
// DOUBLED; delimiters \(...\) / \[...\] only.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;
  const EPS = 1e-7;

  // ── pure LP geometry ───────────────────────────────────────────
  // constraint = { a, b, op: 'le'|'ge', c, label }  meaning  a·x + b·y op c
  function satisfies(con, x, y) {
    const v = con.a * x + con.b * y;
    return con.op === 'le' ? v <= con.c + 1e-6 : v >= con.c - 1e-6;
  }
  function satisfiesAll(cons, x, y) { return cons.every(con => satisfies(con, x, y)); }

  // Intersection of two boundary LINES a·x+b·y=c. null if parallel.
  function intersect(c1, c2) {
    const det = c1.a * c2.b - c2.a * c1.b;
    if (Math.abs(det) < EPS) return null;
    return {
      x: (c1.c * c2.b - c2.c * c1.b) / det,
      y: (c1.a * c2.c - c2.a * c1.c) / det,
    };
  }

  // Vertices of the feasible region = boundary-line intersections that satisfy
  // every constraint. Deduped to 4 d.p.
  function feasibleVertices(cons) {
    const pts = [];
    const seen = {};
    for (let i = 0; i < cons.length; i++) {
      for (let j = i + 1; j < cons.length; j++) {
        const p = intersect(cons[i], cons[j]);
        if (!p) continue;
        if (!satisfiesAll(cons, p.x, p.y)) continue;
        const key = p.x.toFixed(4) + ',' + p.y.toFixed(4);
        if (seen[key]) continue;
        seen[key] = true;
        pts.push({ x: round(p.x), y: round(p.y) });
      }
    }
    return sortByAngle(pts);
  }
  function round(n) { const r = Number(n.toFixed(6)); return Object.is(r, -0) ? 0 : r; }
  function sortByAngle(pts) {
    if (pts.length < 3) return pts.slice();
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return pts.slice().sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
  }

  // Objective = { a, b, goal: 'max'|'min', label }  value = a·x + b·y
  function evalObjective(obj, p) { return obj.a * p.x + obj.b * p.y; }
  function optimum(obj, vertices) {
    const scored = vertices.map(p => ({ p: p, value: evalObjective(obj, p) }));
    let best = scored[0];
    for (const s of scored) {
      if (obj.goal === 'min' ? s.value < best.value - EPS : s.value > best.value + EPS) best = s;
    }
    return { best: best, scored: scored };
  }

  // Which side of the boundary is the NON-required (shade-out) half-plane.
  // Returns 'above'|'below' for a sloped/horizontal line (b≠0), 'left'|'right'
  // for a vertical line (b=0). The shaded-out side is where the inequality FAILS.
  function shadeOutSide(con) {
    if (Math.abs(con.b) < EPS) {
      // vertical line a·x = c ; failing side for 'le' is x large (a>0) → right
      const rightFails = con.op === 'le' ? con.a > 0 : con.a < 0;
      return rightFails ? 'right' : 'left';
    }
    // as y→+∞, a·x+b·y → sign(b)·∞ ; 'le' fails where value > c
    const aboveFails = con.op === 'le' ? con.b > 0 : con.b < 0;
    return aboveFails ? 'above' : 'below';
  }
  function sideOptions(con) {
    return Math.abs(con.b) < EPS ? ['left', 'right'] : ['above', 'below'];
  }

  // ── per-page problems (keyed by pageId) ────────────────────────
  // x≥0, y≥0 are added implicitly as the axes; list only the real constraints.
  const NONNEG = [
    { a: 1, b: 0, op: 'ge', c: 0, label: 'x \\ge 0', axis: true },
    { a: 0, b: 1, op: 'ge', c: 0, label: 'y \\ge 0', axis: true },
  ];
  function withAxes(cons) { return cons.concat(NONNEG); }

  const PROBLEMS = {
    '4-1-inequalities-in-two-variables': [
      {
        title: 'Shade the region satisfying all three inequalities.',
        story: 'Shade OUT the unwanted side of each line. The unshaded region is where all the inequalities hold at once.',
        view: { xmax: 8, ymax: 8 },
        constraints: [
          { a: 1, b: 1, op: 'le', c: 6, label: 'x + y \\le 6' },
          { a: 1, b: 0, op: 'le', c: 4, label: 'x \\le 4' },
          { a: 0, b: 1, op: 'ge', c: 1, label: 'y \\ge 1' },
        ],
        objective: null,
      },
      {
        title: 'Shade the region defined by the constraints.',
        story: 'Each line is a boundary. Shade OUT the side that does not satisfy the inequality.',
        view: { xmax: 10, ymax: 10 },
        constraints: [
          { a: 2, b: 1, op: 'le', c: 12, label: '2x + y \\le 12' },
          { a: 1, b: 2, op: 'le', c: 10, label: 'x + 2y \\le 10' },
        ],
        objective: null,
      },
    ],
    '4-3-solving-lp-problems-graphically': [
      {
        title: 'Maximise \\( P = 5x + 4y \\).',
        story: 'A workshop makes x tables and y chairs. Shade the feasible region, then read off the vertex that maximises profit \\( P = 5x + 4y \\).',
        view: { xmax: 6, ymax: 6 },
        constraints: [
          { a: 6, b: 4, op: 'le', c: 24, label: '6x + 4y \\le 24' },
          { a: 1, b: 2, op: 'le', c: 6, label: 'x + 2y \\le 6' },
        ],
        objective: { a: 5, b: 4, goal: 'max', label: 'P = 5x + 4y' },
      },
      {
        title: 'Minimise \\( C = 3x + 2y \\).',
        story: 'Shade the feasible region, then find the vertex that minimises \\( C = 3x + 2y \\).',
        view: { xmax: 8, ymax: 8 },
        constraints: [
          { a: 1, b: 1, op: 'ge', c: 4, label: 'x + y \\ge 4' },
          { a: 1, b: 3, op: 'ge', c: 6, label: 'x + 3y \\ge 6' },
          { a: 1, b: 0, op: 'le', c: 8, label: 'x \\le 8' },
          { a: 0, b: 1, op: 'le', c: 8, label: 'y \\le 8' },
        ],
        objective: { a: 3, b: 2, goal: 'min', label: 'C = 3x + 2y' },
      },
    ],
  };

  const SIDE_WORD = { above: 'above', below: 'below', left: 'left of', right: 'right of' };

  // ── DOM / canvas ───────────────────────────────────────────────
  function injectStyles() {
    if (G.document.getElementById('mathslab-lp-style')) return;
    const s = G.document.createElement('style');
    s.id = 'mathslab-lp-style';
    s.textContent =
      '.mathslab-lp-layout{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}' +
      '.mathslab-lp-canvas{width:100%;max-width:460px;height:auto;aspect-ratio:1/1;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;display:block}' +
      '.mathslab-lp-panel{flex:1;min-width:260px}' +
      '.mathslab-lp-story{font-size:14px;color:var(--mid);line-height:1.6;margin:0 0 12px}' +
      '.mathslab-lp-con{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)}' +
      '.mathslab-lp-con-label{font-size:15px;min-width:110px}' +
      '.mathslab-lp-side{display:flex;gap:6px}' +
      '.mathslab-lp-side button{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:16px;padding:8px 12px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.mathslab-lp-side button.sel{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-lp-con.correct .mathslab-lp-con-label{color:var(--success);font-weight:600}' +
      '.mathslab-lp-con.wrong .mathslab-lp-con-label{color:#c0392b}' +
      '.mathslab-lp-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}' +
      '.mathslab-lp-verts{margin:12px 0 0;padding:0;list-style:none}' +
      '.mathslab-lp-verts li{font-size:14px;line-height:1.7}' +
      '.mathslab-lp-vertbtn{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:8px;padding:8px 12px;min-height:44px;font-family:"DM Mono","Consolas",monospace;font-size:14px;cursor:pointer;margin:4px 6px 0 0}' +
      '.mathslab-lp-vertbtn.sel{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-lp-vertbtn.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.mathslab-lp-vertbtn.wrong{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.mathslab-lp-nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}' +
      '.mathslab-lp-nav .count{font-size:13px;color:var(--mid)}';
    G.document.head.appendChild(s);
  }

  function themeColours() {
    try {
      const cs = getComputedStyle(G.document.body);
      const get = (v, fb) => (cs.getPropertyValue(v) || '').trim() || fb;
      return { ink: get('--ink', '#1a1a2e'), mid: get('--mid', '#6b7280'), accent: get('--accent', '#5a4bc4'), success: get('--success', '#2e9e6b'), border: get('--border', '#d8d8e0'), paper: get('--paper', '#fff') };
    } catch (e) { return { ink: '#1a1a2e', mid: '#6b7280', accent: '#5a4bc4', success: '#2e9e6b', border: '#d8d8e0', paper: '#fff' }; }
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const problems = PROBLEMS[ctx.pageId] || [];
    if (!problems.length) {
      el.innerHTML = '<p class="mathslab-loading">No LP activities are configured for this page yet.</p>';
      return;
    }

    let pIndex = 0;
    const root = G.document.createElement('div');
    el.appendChild(root);

    function render() {
      const prob = problems[pIndex];
      const cons = withAxes(prob.constraints);
      const realCons = prob.constraints; // the ones the student shades
      const verts = feasibleVertices(cons);
      const col = themeColours();
      // side choice per real constraint: undefined until picked
      const picks = realCons.map(() => null);
      let shadingChecked = false;

      root.innerHTML = '';
      const title = G.document.createElement('h4');
      title.style.margin = '0 0 6px';
      title.innerHTML = prob.title;
      root.appendChild(title);
      const story = G.document.createElement('p');
      story.className = 'mathslab-lp-story';
      story.innerHTML = prob.story;
      root.appendChild(story);

      const layout = G.document.createElement('div');
      layout.className = 'mathslab-lp-layout';
      root.appendChild(layout);

      const canvas = G.document.createElement('canvas');
      canvas.className = 'mathslab-lp-canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Linear programming graph');
      layout.appendChild(canvas);

      const panel = G.document.createElement('div');
      panel.className = 'mathslab-lp-panel';
      layout.appendChild(panel);

      // constraint shade-out controls
      const conRows = [];
      realCons.forEach((con, i) => {
        const row = G.document.createElement('div');
        row.className = 'mathslab-lp-con';
        const lab = G.document.createElement('span');
        lab.className = 'mathslab-lp-con-label';
        lab.innerHTML = '\\( ' + con.label + ' \\)';
        row.appendChild(lab);
        const prompt = G.document.createElement('span');
        prompt.style.cssText = 'font-size:12.5px;color:var(--mid)';
        prompt.textContent = 'shade out:';
        row.appendChild(prompt);
        const sideWrap = G.document.createElement('span');
        sideWrap.className = 'mathslab-lp-side';
        sideOptions(con).forEach(side => {
          const b = G.document.createElement('button');
          b.type = 'button';
          b.textContent = SIDE_WORD[side];
          b.dataset.side = side;
          b.addEventListener('click', () => {
            picks[i] = side;
            Array.prototype.forEach.call(sideWrap.children, c => c.classList.toggle('sel', c === b));
            row.classList.remove('correct', 'wrong');
            feedback.textContent = '';
          });
          sideWrap.appendChild(b);
        });
        row.appendChild(sideWrap);
        panel.appendChild(row);
        conRows.push(row);
      });

      const feedback = G.document.createElement('div');
      feedback.className = 'mathslab-feedback';
      panel.appendChild(feedback);

      const btnRow = G.document.createElement('div');
      btnRow.className = 'mathslab-lp-btnrow';
      const checkBtn = ui.btn('Check shading');
      btnRow.appendChild(checkBtn);
      panel.appendChild(btnRow);

      // area revealed after correct shading
      const reveal = G.document.createElement('div');
      panel.appendChild(reveal);

      function draw() {
        drawGraph(canvas, prob, cons, realCons, picks, verts, shadingChecked, col, selectedVertex);
      }

      let selectedVertex = null;

      checkBtn.addEventListener('click', () => {
        let allOk = true;
        realCons.forEach((con, i) => {
          const correct = shadeOutSide(con);
          const ok = picks[i] === correct;
          if (!ok) allOk = false;
          conRows[i].classList.toggle('correct', ok);
          conRows[i].classList.toggle('wrong', !ok);
        });
        shadingChecked = true;
        if (!allOk) {
          ui.feedback(feedback, false, 'Not quite — for \\( \\le \\) shade out the side where the line’s value is too big; for \\( \\ge \\), too small.');
          ui.renderMath(feedback);
          draw();
          return;
        }
        ui.feedback(feedback, true, 'Correct — the unshaded region is the feasible region.');
        buildReveal();
        draw();
      });

      function buildReveal() {
        reveal.innerHTML = '';
        const h = G.document.createElement('p');
        h.style.cssText = 'font-weight:600;margin:14px 0 4px';
        h.textContent = 'Feasible region vertices (corners):';
        reveal.appendChild(h);
        const list = G.document.createElement('ul');
        list.className = 'mathslab-lp-verts';
        verts.forEach(v => {
          const li = G.document.createElement('li');
          li.innerHTML = '\\( (' + fmtv(v.x) + ',\\ ' + fmtv(v.y) + ') \\)';
          list.appendChild(li);
        });
        reveal.appendChild(list);
        ui.renderMath(reveal);

        if (!prob.objective) { ctx.complete({ problem: pIndex, stage: 'region' }); buildNav(); return; }

        const oq = G.document.createElement('p');
        oq.style.cssText = 'font-weight:600;margin:14px 0 4px';
        oq.innerHTML = 'Now ' + (prob.objective.goal === 'max' ? 'maximise' : 'minimise') + ' \\( ' + prob.objective.label + ' \\): click the optimum vertex.';
        reveal.appendChild(oq);
        const vbtns = G.document.createElement('div');
        const opt = optimum(prob.objective, verts);
        verts.forEach(v => {
          const b = G.document.createElement('button');
          b.type = 'button';
          b.className = 'mathslab-lp-vertbtn';
          b.textContent = '(' + fmtv(v.x) + ', ' + fmtv(v.y) + ')';
          b.addEventListener('click', () => {
            selectedVertex = v;
            Array.prototype.forEach.call(vbtns.children, c => c.classList.remove('sel'));
            b.classList.add('sel');
            const ok = Math.abs(evalObjective(prob.objective, v) - opt.best.value) < 1e-6;
            b.classList.toggle('correct', ok);
            b.classList.toggle('wrong', !ok);
            ui.feedback(ofb, ok, ok
              ? 'Optimum! ' + prob.objective.label.split('=')[0].trim() + ' = ' + fmtv(opt.best.value) + ' at (' + fmtv(opt.best.p.x) + ', ' + fmtv(opt.best.p.y) + ').'
              : prob.objective.label.split('=')[0].trim() + ' = ' + fmtv(evalObjective(prob.objective, v)) + ' here — not the ' + prob.objective.goal + '. Try another corner.');
            if (ok) { ctx.complete({ problem: pIndex, stage: 'optimum' }); showTable(); buildNav(); }
            draw();
          });
          vbtns.appendChild(b);
        });
        reveal.appendChild(vbtns);
        const ofb = G.document.createElement('div');
        ofb.className = 'mathslab-feedback';
        reveal.appendChild(ofb);

        function showTable() {
          const wrap = G.document.createElement('div');
          wrap.style.cssText = 'margin-top:10px;font-size:14px';
          wrap.innerHTML = '<strong>Objective at every vertex:</strong>';
          const ul = G.document.createElement('ul');
          ul.className = 'mathslab-lp-verts';
          opt.scored.forEach(s => {
            const li = G.document.createElement('li');
            const isBest = Math.abs(s.value - opt.best.value) < 1e-6;
            li.innerHTML = '\\( (' + fmtv(s.p.x) + ',\\ ' + fmtv(s.p.y) + ') \\Rightarrow ' + fmtv(s.value) + ' \\)' + (isBest ? ' ✅' : '');
            ul.appendChild(li);
          });
          wrap.appendChild(ul);
          reveal.appendChild(wrap);
          ui.renderMath(wrap);
        }
      }

      function buildNav() {
        if (root.querySelector('.mathslab-lp-nav')) return;
        const nav = G.document.createElement('div');
        nav.className = 'mathslab-lp-nav';
        const count = G.document.createElement('span');
        count.className = 'count';
        count.textContent = 'Problem ' + (pIndex + 1) + ' of ' + problems.length;
        nav.appendChild(count);
        if (pIndex < problems.length - 1) {
          const next = ui.btn('Next problem →', 'secondary');
          next.addEventListener('click', () => { pIndex++; render(); });
          nav.appendChild(next);
        }
        const retry = ui.btn('Restart this one', 'secondary');
        retry.addEventListener('click', () => render());
        nav.appendChild(retry);
        root.appendChild(nav);
      }

      ui.renderMath(root);
      draw();
    }

    render();
  }

  function fmtv(n) { const r = Number(Number(n).toFixed(2)); return (Object.is(r, -0) ? 0 : r).toString(); }

  // ── canvas drawing (guarded) ───────────────────────────────────
  function drawGraph(canvas, prob, cons, realCons, picks, verts, shadingChecked, col, selectedVertex) {
    let c = null;
    try { c = canvas.getContext ? canvas.getContext('2d') : null; } catch (e) { c = null; }
    if (!c) return;
    const dpr = (G.devicePixelRatio && isFinite(G.devicePixelRatio)) ? G.devicePixelRatio : 1;
    const cssW = canvas.clientWidth || 440, cssH = cssW;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = cssW, H = cssH;
    const pad = 30;
    const xmax = prob.view.xmax, ymax = prob.view.ymax;
    const px = x => pad + (x / xmax) * (W - 2 * pad);
    const py = y => H - pad - (y / ymax) * (H - 2 * pad);

    c.clearRect(0, 0, W, H);
    // grid
    c.strokeStyle = col.border; c.lineWidth = 1; c.fillStyle = col.mid; c.font = '11px sans-serif';
    for (let x = 0; x <= xmax; x++) { c.beginPath(); c.moveTo(px(x), py(0)); c.lineTo(px(x), py(ymax)); c.globalAlpha = .5; c.stroke(); c.globalAlpha = 1; }
    for (let y = 0; y <= ymax; y++) { c.beginPath(); c.moveTo(px(0), py(y)); c.lineTo(px(xmax), py(y)); c.globalAlpha = .5; c.stroke(); c.globalAlpha = 1; }
    // axes
    c.strokeStyle = col.mid; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xmax), py(0)); c.stroke();
    c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(0), py(ymax)); c.stroke();

    // shade-out fills (student's current picks), light red
    realCons.forEach((con, i) => {
      if (!picks[i]) return;
      c.save();
      c.beginPath(); c.rect(px(0), py(ymax), px(xmax) - px(0), py(0) - py(ymax)); c.clip();
      c.globalAlpha = 0.16;
      c.fillStyle = '#c0392b';
      // fill the half-plane on the picked side using a big polygon sampled on grid
      fillHalfPlane(c, con, picks[i], px, py, xmax, ymax);
      c.restore();
    });

    // boundary lines
    realCons.forEach(con => {
      const seg = clipLineToBox(con, xmax, ymax);
      if (!seg) return;
      c.strokeStyle = col.accent; c.lineWidth = 2;
      c.beginPath(); c.moveTo(px(seg[0].x), py(seg[0].y)); c.lineTo(px(seg[1].x), py(seg[1].y)); c.stroke();
    });

    // feasible region (only once shading correct) + vertices
    if (shadingChecked && allPicksCorrect(realCons, picks) && verts.length >= 3) {
      c.fillStyle = 'rgba(46,158,107,0.18)';
      c.beginPath();
      verts.forEach((v, i) => { const X = px(v.x), Y = py(v.y); if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y); });
      c.closePath(); c.fill();
    }
    if (shadingChecked && allPicksCorrect(realCons, picks)) {
      verts.forEach(v => {
        const isSel = selectedVertex && Math.abs(selectedVertex.x - v.x) < 1e-6 && Math.abs(selectedVertex.y - v.y) < 1e-6;
        c.fillStyle = isSel ? col.accent : col.success;
        c.beginPath(); c.arc(px(v.x), py(v.y), isSel ? 6 : 4, 0, Math.PI * 2); c.fill();
      });
    }
  }

  function allPicksCorrect(realCons, picks) { return realCons.every((con, i) => picks[i] === shadeOutSide(con)); }

  function fillHalfPlane(c, con, side, px, py, xmax, ymax) {
    // Approximate the shaded half-plane by sampling a fine grid of cells whose
    // centre is on the chosen side, painting each cell. Crude but theme-safe and
    // context-guarded; only a visual aid.
    const N = 60, dx = xmax / N, dy = ymax / N;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = (i + 0.5) * dx, y = (j + 0.5) * dy;
        if (onSide(con, side, x, y)) {
          c.fillRect(px(i * dx), py((j + 1) * dy), px((i + 1) * dx) - px(i * dx), py(j * dy) - py((j + 1) * dy));
        }
      }
    }
  }
  // True when (x,y) lies on the named half-plane side of the boundary.
  function onSide(con, side, x, y) {
    if (side === 'above') return con.b === 0 ? false : (con.a * x + con.b * y - con.c) / con.b > 0;
    if (side === 'below') return con.b === 0 ? false : (con.a * x + con.b * y - con.c) / con.b < 0;
    if (side === 'right') return con.a === 0 ? false : (con.a * x - con.c) / con.a > 0;
    if (side === 'left') return con.a === 0 ? false : (con.a * x - con.c) / con.a < 0;
    return false;
  }

  function clipLineToBox(con, xmax, ymax) {
    // endpoints of boundary a·x+b·y=c within [0,xmax]×[0,ymax]
    const pts = [];
    const push = (x, y) => { if (x >= -EPS && x <= xmax + EPS && y >= -EPS && y <= ymax + EPS) pts.push({ x: clamp(x, 0, xmax), y: clamp(y, 0, ymax) }); };
    if (Math.abs(con.b) > EPS) { push(0, con.c / con.b); push(xmax, (con.c - con.a * xmax) / con.b); }
    if (Math.abs(con.a) > EPS) { push(con.c / con.a, 0); push((con.c - con.b * ymax) / con.a, ymax); }
    if (pts.length < 2) return null;
    return [pts[0], pts[pts.length - 1]];
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('lp-builder', { title: 'LP Builder', icon: '📐', mount: mount });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      satisfies, satisfiesAll, intersect, feasibleVertices, evalObjective, optimum,
      shadeOutSide, sideOptions, onSide, withAxes, PROBLEMS,
    };
  }
})();
