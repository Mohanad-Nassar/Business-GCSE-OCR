// ══════════════════════════════════════════════════════════════
// ECONOMICS PRACTICE LAB — Diagram Lab (supply & demand)
// Registers tool id 'supply-demand'. The signature "draw" skill: OCR J205 uses
// the DRAW command word (an AO1 skill) across 2.2–2.4 — draw D/S curves, draw
// shifts of and movements along them, draw their interaction to find
// equilibrium. Students currently only see static PNGs; this lets them move the
// curves and watch equilibrium (P*, Q*) respond.
//
// Two modes:
//   • Explore   — shift D and S left/right, change elasticity, read P*/Q* live.
//   • Challenge — a real scenario ("a poor harvest cuts supply"): shift the
//                 correct curve the correct way, then predict P and Q. Auto-
//                 marked against the equilibrium the maths actually gives.
//
// All economics MATH is pure module-scope functions (unit-tested under Node via
// module.exports). The canvas layer is thin and every getContext('2d') is
// guarded, so it degrades gracefully in a headless DOM and never crashes.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── pure economics core ────────────────────────────────────────
  // A market is two lines in P = a + b·Q form (P = price, Q = quantity):
  //   demand:  P = dA − dB·Q   (b negative: downward sloping)
  //   supply:  P = sA + sB·Q   (b positive: upward sloping)
  // Base values put equilibrium at the centre of the plot: (Q*, P*) = (10, 10).
  const BASE = { dA: 18, dB: 0.8, sA: 2, sB: 0.8 };
  const SHIFT_STEP = 3.2;   // one shift unit moves an intercept by this much
  const PMAX = 20, QMAX = 20;

  // Elasticity pivots a curve about its price-axis intercept (Q = 0) by scaling
  // the slope: steeper = more inelastic, flatter = more elastic.
  const ELAST = { inelastic: 2, normal: 1, elastic: 0.5 };

  // Build the two lines for a given state.
  // state = { demandShift, supplyShift, dElast, sElast } — shift in curve units,
  // + = rightward (D right = more demand; S right = more supply), elast is a key
  // of ELAST. Rightward SUPPLY shift lowers the intercept sA (curve moves down/
  // right); rightward DEMAND shift raises dA.
  function linesFor(state) {
    const s = state || {};
    const dShift = s.demandShift || 0, sShift = s.supplyShift || 0;
    const dB = BASE.dB * (ELAST[s.dElast] != null ? ELAST[s.dElast] : 1);
    const sB = BASE.sB * (ELAST[s.sElast] != null ? ELAST[s.sElast] : 1);
    return {
      demand: { a: BASE.dA + dShift * SHIFT_STEP, b: -dB },
      supply: { a: BASE.sA - sShift * SHIFT_STEP, b: sB },
    };
  }

  // Intersection of two P = a + b·Q lines. Returns null if parallel or if the
  // equilibrium is not in the sensible first-quadrant box.
  function equilibrium(demand, supply) {
    const db = demand.b - supply.b;
    if (Math.abs(db) < 1e-9) return null;
    const q = (supply.a - demand.a) / db;
    const p = demand.a + demand.b * q;
    if (!(q > 0.01 && p > 0.01) || q > QMAX || p > PMAX) return { q: q, p: p, offscreen: true };
    return { q: q, p: p, offscreen: false };
  }

  function eqFor(state) {
    const L = linesFor(state);
    return equilibrium(L.demand, L.supply);
  }

  // Sign of change in P and Q when a shift is applied to the base market.
  // Derived from the maths (not hardcoded), so the readout can never disagree
  // with the picture. Returns { p: -1|0|1, q: -1|0|1 }.
  function effectOf(curve, dir) {
    const before = eqFor({});
    const state = {};
    if (curve === 'demand') state.demandShift = dir; else state.supplyShift = dir;
    const after = eqFor(state);
    if (!before || !after) return { p: 0, q: 0 };
    const sgn = (x) => (Math.abs(x) < 1e-6 ? 0 : (x > 0 ? 1 : -1));
    return { p: sgn(after.p - before.p), q: sgn(after.q - before.q) };
  }

  // Scenarios for 2.4 Price — each names a real market event; the learner must
  // shift the RIGHT curve the RIGHT way and predict P and Q. `curve`/`dir` are
  // the correct move; the expected P/Q are computed by effectOf so they always
  // match the diagram. Rules/themes drawn from the OCR market-forces content and
  // the tax/subsidy mark schemes (3.8).
  const SCENARIOS = [
    { text: 'A disease ruins much of the wheat harvest, so farmers can supply far less wheat.', curve: 'supply', dir: -1, note: 'Fewer goods available at every price → the <strong>supply</strong> curve shifts <strong>left</strong>.' },
    { text: 'A popular health study says blueberries prevent illness, and shoppers want far more of them.', curve: 'demand', dir: 1, note: 'People want more at every price → the <strong>demand</strong> curve shifts <strong>right</strong>.' },
    { text: 'A new machine lets a factory make trainers much more cheaply.', curve: 'supply', dir: 1, note: 'Lower costs let firms supply more at every price → <strong>supply</strong> shifts <strong>right</strong>.' },
    { text: 'A recession cuts household incomes, and people buy less of a normal good like restaurant meals.', curve: 'demand', dir: -1, note: 'Lower incomes cut demand for a normal good → <strong>demand</strong> shifts <strong>left</strong>.' },
    { text: 'The government puts a new tax on sugary drinks, raising producers’ costs.', curve: 'supply', dir: -1, theme: 'externality', note: 'A tax raises firms’ costs → they supply less at every price → <strong>supply</strong> shifts <strong>left</strong> (a classic tax diagram).' },
    { text: 'The government gives solar-panel makers a subsidy that lowers their costs.', curve: 'supply', dir: 1, theme: 'externality', note: 'A subsidy lowers costs → firms supply more at every price → <strong>supply</strong> shifts <strong>right</strong>.' },
    { text: 'A summer heatwave makes ice cream far more popular.', curve: 'demand', dir: 1, note: 'Tastes change towards the good → <strong>demand</strong> shifts <strong>right</strong>.' },
    { text: 'A rival product falls sharply in price, so people switch away from this good.', curve: 'demand', dir: -1, note: 'A cheaper substitute pulls buyers away → <strong>demand</strong> for this good shifts <strong>left</strong>.' },
    // externality-specific (3.8): a tax to correct a NEGATIVE externality shifts
    // supply left toward the social optimum; a subsidy for a POSITIVE externality
    // shifts supply right.
    { text: 'A factory’s pollution harms local residents, so the government taxes each unit it makes to correct this negative externality.', curve: 'supply', dir: -1, theme: 'externality', note: 'Taxing a negative externality raises the firm’s costs → <strong>supply</strong> shifts <strong>left</strong>, cutting output toward the social optimum.' },
    { text: 'Flu vaccinations benefit everyone, not just the person vaccinated, so the government subsidises them to correct this positive externality.', curve: 'supply', dir: 1, theme: 'externality', note: 'Subsidising a positive externality lowers costs → <strong>supply</strong> shifts <strong>right</strong>, raising output toward the social optimum.' },
  ];

  function fmt1(n) {
    if (!isFinite(n)) return '—';
    const r = Number(n.toFixed(1));
    return (Object.is(r, -0) ? 0 : r).toString();
  }
  const arrow = (s) => (s > 0 ? '▲ rises' : s < 0 ? '▼ falls' : '– no change');

  // ── DOM / canvas ───────────────────────────────────────────────
  function injectStyles() {
    if (G.document.getElementById('ecolab-sd-style')) return;
    const style = G.document.createElement('style');
    style.id = 'ecolab-sd-style';
    style.textContent =
      '.ecolab-sd-modes{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}' +
      '.ecolab-sd-mode{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 16px;min-height:44px;font-family:inherit;font-size:14px;cursor:pointer}' +
      '.ecolab-sd-mode.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.ecolab-sd-mode:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.ecolab-sd-canvas{width:100%;max-width:560px;height:auto;aspect-ratio:1/1;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;display:block;touch-action:none}' +
      '.ecolab-sd-read{font-size:15px;margin:12px 0 4px;line-height:1.6}' +
      '.ecolab-sd-read .v{font-family:"DM Mono","Consolas",monospace;font-weight:700;color:var(--ink)}' +
      '.ecolab-sd-ctrls{display:flex;flex-wrap:wrap;gap:18px;margin:12px 0;max-width:560px}' +
      '.ecolab-sd-group{display:flex;flex-direction:column;gap:6px}' +
      '.ecolab-sd-group h4{margin:0;font-size:13px;color:var(--mid);font-weight:600}' +
      '.ecolab-sd-row{display:flex;gap:6px;align-items:center}' +
      '.ecolab-sd-sbtn{min-width:44px;min-height:44px;border:1px solid var(--border);background:var(--card-bg);color:var(--ink);border-radius:8px;font-size:16px;cursor:pointer}' +
      '.ecolab-sd-sbtn:hover{border-color:var(--accent)}' +
      '.ecolab-sd-sbtn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.ecolab-sd-seg{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden}' +
      '.ecolab-sd-seg button{min-height:40px;padding:0 10px;border:0;background:var(--card-bg);color:var(--ink);font-family:inherit;font-size:13px;cursor:pointer;border-left:1px solid var(--border)}' +
      '.ecolab-sd-seg button:first-child{border-left:0}' +
      '.ecolab-sd-seg button.on{background:var(--accent);color:var(--paper)}' +
      '.ecolab-sd-notes{margin:8px 0 0;padding:0;list-style:none;max-width:560px}' +
      '.ecolab-sd-notes li{font-size:14px;color:var(--ink);line-height:1.6;margin-bottom:6px;padding-left:16px;position:relative}' +
      '.ecolab-sd-notes li::before{content:"›";position:absolute;left:0;color:var(--accent);font-weight:700}' +
      '.ecolab-sd-scenario{background:color-mix(in srgb,var(--accent) 8%,var(--card-bg));border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;font-size:15px;line-height:1.5}' +
      '.ecolab-sd-q{margin:12px 0}.ecolab-sd-q h4{margin:0 0 6px;font-size:14px}' +
      '.ecolab-sd-fb{font-size:14px;font-weight:600;margin:10px 0;line-height:1.6}' +
      '.ecolab-sd-fb.ok{color:var(--success)}.ecolab-sd-fb.no{color:#c0392b}' +
      '.ecolab-sd-progress{font-size:12px;color:var(--mid);font-family:"DM Mono","Consolas",monospace;margin-left:auto}';
    G.document.head.appendChild(style);
  }

  function themeColours() {
    try {
      const cs = getComputedStyle(G.document.body);
      const get = (v, fb) => (cs.getPropertyValue(v) || '').trim() || fb;
      return {
        ink: get('--ink', '#1a1a2e'), mid: get('--mid', '#6b7280'),
        accent: get('--accent', '#5a4bc4'), success: get('--success', '#2e9e6b'),
        border: get('--border', '#d8d8e0'), paper: get('--paper', '#fff'),
      };
    } catch (e) {
      return { ink: '#1a1a2e', mid: '#6b7280', accent: '#5a4bc4', success: '#2e9e6b', border: '#d8d8e0', paper: '#fff' };
    }
  }

  const PAD = 34; // px for axis labels
  function makePlot(canvas) {
    let ctx2d = null;
    try { ctx2d = canvas.getContext ? canvas.getContext('2d') : null; } catch (e) { ctx2d = null; }
    const dpr = (G.devicePixelRatio && isFinite(G.devicePixelRatio)) ? G.devicePixelRatio : 1;
    const cssW = canvas.clientWidth || 520;
    const cssH = cssW; // square
    if (ctx2d) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const W = cssW, H = cssH;
    const px = (q) => PAD + (q / QMAX) * (W - PAD - 8);
    const py = (p) => (H - PAD) - (p / PMAX) * (H - PAD - 8);
    return { ctx2d, W, H, px, py };
  }

  // clip a P = a + b·Q line to the visible Q∈[0,QMAX], P∈[0,PMAX] box → 2 points
  function lineSegment(line) {
    const pts = [];
    const atQ = (q) => line.a + line.b * q;
    [0, QMAX].forEach((q) => { const p = atQ(q); if (p >= -0.01 && p <= PMAX + 0.01) pts.push([q, p]); });
    // where it crosses P=0 and P=PMAX
    [0, PMAX].forEach((p) => { if (Math.abs(line.b) > 1e-9) { const q = (p - line.a) / line.b; if (q >= -0.01 && q <= QMAX + 0.01) pts.push([q, p]); } });
    // dedupe & take the two extreme points
    const uniq = [];
    pts.forEach((pt) => { if (!uniq.some((u) => Math.abs(u[0] - pt[0]) < 1e-6 && Math.abs(u[1] - pt[1]) < 1e-6)) uniq.push(pt); });
    uniq.sort((a, b) => a[0] - b[0]);
    return uniq.length >= 2 ? [uniq[0], uniq[uniq.length - 1]] : null;
  }

  function drawMarket(canvas, state, opts) {
    const plot = makePlot(canvas);
    const c = plot.ctx2d; if (!c) return eqFor(state);
    const col = themeColours();
    c.clearRect(0, 0, plot.W, plot.H);

    // axes
    c.strokeStyle = col.mid; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(plot.px(0), plot.py(0)); c.lineTo(plot.px(0), plot.py(PMAX)); c.stroke();
    c.beginPath(); c.moveTo(plot.px(0), plot.py(0)); c.lineTo(plot.px(QMAX), plot.py(0)); c.stroke();
    c.fillStyle = col.mid; c.font = '13px system-ui,sans-serif';
    c.save(); c.translate(11, plot.py(PMAX / 2)); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText('Price', 0, 0); c.restore();
    c.textAlign = 'center'; c.fillText('Quantity', plot.px(QMAX / 2), plot.H - 8);

    function drawLine(line, colour, dashed, label) {
      const seg = lineSegment(line); if (!seg) return;
      c.strokeStyle = colour; c.lineWidth = dashed ? 1.6 : 2.6;
      c.setLineDash(dashed ? [6, 5] : []);
      c.beginPath(); c.moveTo(plot.px(seg[0][0]), plot.py(seg[0][1])); c.lineTo(plot.px(seg[1][0]), plot.py(seg[1][1])); c.stroke();
      c.setLineDash([]);
      if (label && !dashed) {
        c.fillStyle = colour; c.font = 'bold 15px system-ui,sans-serif'; c.textAlign = 'left';
        const end = seg[1][1] > seg[0][1] ? seg[1] : seg[0]; // the higher-P end
        c.fillText(label, Math.min(plot.px(end[0]) + 4, plot.W - 18), plot.py(end[1]) + 4);
      }
    }

    const L = linesFor(state);
    // ghost of the pre-shift curves (faint dashed) so the MOVEMENT is visible
    if (opts && opts.showGhost) {
      const L0 = linesFor({ dElast: state.dElast, sElast: state.sElast });
      if (state.demandShift) drawLine(L0.demand, col.mid, true);
      if (state.supplyShift) drawLine(L0.supply, col.mid, true);
    }
    drawLine(L.demand, col.accent, false, 'D');
    drawLine(L.supply, col.success, false, 'S');

    const eq = equilibrium(L.demand, L.supply);
    if (eq && !eq.offscreen) {
      c.strokeStyle = col.ink; c.setLineDash([4, 4]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(plot.px(0), plot.py(eq.p)); c.lineTo(plot.px(eq.q), plot.py(eq.p)); c.stroke();
      c.beginPath(); c.moveTo(plot.px(eq.q), plot.py(0)); c.lineTo(plot.px(eq.q), plot.py(eq.p)); c.stroke();
      c.setLineDash([]);
      c.fillStyle = col.ink; c.beginPath(); c.arc(plot.px(eq.q), plot.py(eq.p), 5, 0, Math.PI * 2); c.fill();
    }
    return eq;
  }

  // ── mount ──────────────────────────────────────────────────────
  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const state = { demandShift: 0, supplyShift: 0, dElast: 'normal', sElast: 'normal' };

    const root = G.document.createElement('div');
    root.className = 'ecolab-sd';
    el.appendChild(root);

    // mode switch
    const modeBar = ui.el('<div class="ecolab-sd-modes"></div>');
    const exploreBtn = ui.el('<button type="button" class="ecolab-sd-mode active">🔍 Explore</button>');
    const challengeBtn = ui.el('<button type="button" class="ecolab-sd-mode">🎯 Challenge</button>');
    modeBar.appendChild(exploreBtn); modeBar.appendChild(challengeBtn);
    root.appendChild(modeBar);

    const canvas = G.document.createElement('canvas');
    canvas.className = 'ecolab-sd-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Supply and demand diagram');
    root.appendChild(canvas);

    const readout = ui.el('<p class="ecolab-sd-read"></p>');
    root.appendChild(readout);

    const controls = ui.el('<div class="ecolab-sd-panel"></div>');
    root.appendChild(controls);

    let mode = 'explore';

    function refreshReadout(showGhost) {
      const eq = drawMarket(canvas, state, { showGhost: showGhost });
      if (!eq) { readout.innerHTML = 'The curves are parallel — no equilibrium.'; return; }
      if (eq.offscreen) { readout.innerHTML = 'Equilibrium is off the diagram — reset and try smaller shifts.'; return; }
      readout.innerHTML = 'Equilibrium: price <span class="v">' + fmt1(eq.p) + '</span> · quantity <span class="v">' + fmt1(eq.q) + '</span>';
    }

    // ── Explore controls ─────────────────────────────────────────
    function buildExplore() {
      controls.innerHTML = '';
      const wrap = ui.el('<div class="ecolab-sd-ctrls"></div>');

      function shiftGroup(title, key) {
        const g = ui.el('<div class="ecolab-sd-group"><h4>' + title + '</h4></div>');
        const row = ui.el('<div class="ecolab-sd-row"></div>');
        const left = ui.el('<button type="button" class="ecolab-sd-sbtn" aria-label="' + title + ' shift left">◀</button>');
        const right = ui.el('<button type="button" class="ecolab-sd-sbtn" aria-label="' + title + ' shift right">▶</button>');
        left.addEventListener('click', () => { state[key] = Math.max(-2, state[key] - 1); refreshReadout(true); });
        right.addEventListener('click', () => { state[key] = Math.min(2, state[key] + 1); refreshReadout(true); });
        row.appendChild(left); row.appendChild(ui.el('<span style="font-size:12px;color:var(--mid)">shift</span>')); row.appendChild(right);
        g.appendChild(row);
        return g;
      }
      function elastGroup(title, key) {
        const g = ui.el('<div class="ecolab-sd-group"><h4>' + title + '</h4></div>');
        const seg = ui.el('<div class="ecolab-sd-seg"></div>');
        [['inelastic', 'Inelastic'], ['normal', 'Normal'], ['elastic', 'Elastic']].forEach(([val, lbl]) => {
          const b = ui.el('<button type="button">' + lbl + '</button>');
          if (state[key] === val) b.classList.add('on');
          b.addEventListener('click', () => {
            state[key] = val;
            Array.prototype.forEach.call(seg.children, (x) => x.classList.remove('on'));
            b.classList.add('on'); refreshReadout(true);
          });
          seg.appendChild(b);
        });
        g.appendChild(seg);
        return g;
      }

      wrap.appendChild(shiftGroup('Demand (D)', 'demandShift'));
      wrap.appendChild(shiftGroup('Supply (S)', 'supplyShift'));
      wrap.appendChild(elastGroup('Demand elasticity', 'dElast'));
      wrap.appendChild(elastGroup('Supply elasticity', 'sElast'));
      controls.appendChild(wrap);

      const reset = ui.btn('Reset diagram', 'secondary');
      reset.addEventListener('click', () => { state.demandShift = 0; state.supplyShift = 0; state.dElast = 'normal'; state.sElast = 'normal'; buildExplore(); refreshReadout(false); });
      controls.appendChild(reset);

      const notes = ui.el('<ul class="ecolab-sd-notes">' +
        '<li><strong>Demand right</strong> (more wanted): price ▲, quantity ▲. <strong>Demand left</strong>: both ▼.</li>' +
        '<li><strong>Supply right</strong> (more made): price ▼, quantity ▲. <strong>Supply left</strong>: price ▲, quantity ▼.</li>' +
        '<li>An <strong>inelastic</strong> curve is steep — the same shift moves <em>price</em> more and <em>quantity</em> less.</li>' +
        '</ul>');
      controls.appendChild(notes);
      refreshReadout(true);
    }

    // ── Challenge controls ───────────────────────────────────────
    // Per-page focus (config.focus): 'demand'/'supply' restrict to that curve
    // (2.2 Demand, 2.3 Supply); 'externalities' to the tax/subsidy set (3.8);
    // anything else uses all scenarios (2.4 Price, 2.5 Competition).
    const focus = (ctx.config && ctx.config.focus) || 'all';
    const pool = (function () {
      let p = SCENARIOS;
      if (focus === 'demand') p = SCENARIOS.filter(s => s.curve === 'demand');
      else if (focus === 'supply') p = SCENARIOS.filter(s => s.curve === 'supply');
      else if (focus === 'externalities') p = SCENARIOS.filter(s => s.theme === 'externality');
      return p.length ? p : SCENARIOS;
    })();
    let order = pool.map((_, i) => i);
    let ci = 0, correctCount = 0, answered = false;

    function buildChallenge() {
      controls.innerHTML = '';
      state.demandShift = 0; state.supplyShift = 0; state.dElast = 'normal'; state.sElast = 'normal';
      answered = false;
      const sc = pool[order[ci]];

      const scEl = ui.el('<div class="ecolab-sd-scenario"><strong>Scenario ' + (ci + 1) + ' of ' + order.length + ':</strong> ' + sc.text + '</div>');
      controls.appendChild(scEl);

      // shift controls (both curves; the student must choose which to move)
      const shiftWrap = ui.el('<div class="ecolab-sd-ctrls"></div>');
      function shiftGroup(title, key) {
        const g = ui.el('<div class="ecolab-sd-group"><h4>' + title + '</h4></div>');
        const row = ui.el('<div class="ecolab-sd-row"></div>');
        const left = ui.el('<button type="button" class="ecolab-sd-sbtn" aria-label="' + title + ' left">◀</button>');
        const right = ui.el('<button type="button" class="ecolab-sd-sbtn" aria-label="' + title + ' right">▶</button>');
        left.addEventListener('click', () => { if (answered) return; state[key] = Math.max(-2, state[key] - 1); refreshReadout(true); });
        right.addEventListener('click', () => { if (answered) return; state[key] = Math.min(2, state[key] + 1); refreshReadout(true); });
        row.appendChild(left); row.appendChild(ui.el('<span style="font-size:12px;color:var(--mid)">shift</span>')); row.appendChild(right);
        g.appendChild(row); return g;
      }
      shiftWrap.appendChild(shiftGroup('Move Demand (D)', 'demandShift'));
      shiftWrap.appendChild(shiftGroup('Move Supply (S)', 'supplyShift'));
      controls.appendChild(shiftWrap);

      // P and Q prediction selectors
      const picks = { p: 0, q: 0 };
      function predictGroup(title, key) {
        const q = ui.el('<div class="ecolab-sd-q"><h4>' + title + '</h4></div>');
        const seg = ui.el('<div class="ecolab-sd-seg"></div>');
        [[1, '▲ Rises'], [0, '– No change'], [-1, '▼ Falls']].forEach(([val, lbl]) => {
          const b = ui.el('<button type="button">' + lbl + '</button>');
          b.addEventListener('click', () => { if (answered) return; picks[key] = val; Array.prototype.forEach.call(seg.children, (x) => x.classList.remove('on')); b.classList.add('on'); });
          seg.appendChild(b);
        });
        q.appendChild(seg); return q;
      }
      controls.appendChild(predictGroup('What happens to equilibrium PRICE?', 'p'));
      controls.appendChild(predictGroup('What happens to equilibrium QUANTITY?', 'q'));

      const fb = ui.el('<p class="ecolab-sd-fb"></p>');
      const check = ui.btn('✓ Check my answer');
      const next = ui.btn('Next scenario →', 'secondary');
      next.style.display = 'none';
      const barRow = ui.el('<div class="ecolab-sd-row" style="align-items:center"></div>');
      barRow.appendChild(check); barRow.appendChild(next);
      barRow.appendChild(ui.el('<span class="ecolab-sd-progress">Score ' + correctCount + '/' + order.length + '</span>'));
      controls.appendChild(barRow);
      controls.appendChild(fb);

      check.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const want = effectOf(sc.curve, sc.dir);
        const movedRight = sc.curve === 'demand' ? (state.demandShift > 0 && state.supplyShift === 0) : (state.supplyShift > 0 && state.demandShift === 0);
        const movedLeft = sc.curve === 'demand' ? (state.demandShift < 0 && state.supplyShift === 0) : (state.supplyShift < 0 && state.demandShift === 0);
        const curveOK = sc.dir > 0 ? movedRight : movedLeft;
        const pOK = picks.p === want.p, qOK = picks.q === want.q;
        const all = curveOK && pOK && qOK;
        if (all) correctCount++;
        fb.className = 'ecolab-sd-fb ' + (all ? 'ok' : 'no');
        fb.innerHTML =
          (all ? '✓ Correct! ' : '✗ Not quite. ') + sc.note +
          '<br>Correct answer: move ' + (sc.curve === 'demand' ? 'Demand' : 'Supply') + ' ' + (sc.dir > 0 ? 'right' : 'left') +
          ' → price ' + arrow(want.p) + ', quantity ' + arrow(want.q) + '.' +
          (all ? '' : (curveOK ? '' : ' (You moved the wrong curve or shifted both.)'));
        check.disabled = true;
        // snap the diagram to the correct move so the picture matches the answer
        state.demandShift = sc.curve === 'demand' ? sc.dir : 0;
        state.supplyShift = sc.curve === 'supply' ? sc.dir : 0;
        refreshReadout(true);
        Array.prototype.forEach.call(controls.querySelectorAll('.ecolab-sd-progress'), (x) => { x.textContent = 'Score ' + correctCount + '/' + order.length; });
        if (ci + 1 < order.length) next.style.display = '';
        else { next.textContent = 'Start again ↺'; next.style.display = ''; ctx.complete({ score: correctCount, total: order.length }); }
      });
      next.addEventListener('click', () => {
        if (ci + 1 < order.length) { ci++; } else { ci = 0; correctCount = 0; }
        buildChallenge();
      });

      refreshReadout(false);
    }

    function setMode(m) {
      mode = m;
      exploreBtn.classList.toggle('active', m === 'explore');
      challengeBtn.classList.toggle('active', m === 'challenge');
      if (m === 'explore') { state.demandShift = 0; state.supplyShift = 0; buildExplore(); }
      else { ci = 0; correctCount = 0; buildChallenge(); }
    }
    exploreBtn.addEventListener('click', () => setMode('explore'));
    challengeBtn.addEventListener('click', () => setMode('challenge'));

    let rz = null;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => refreshReadout(mode !== 'explore' || state.demandShift !== 0 || state.supplyShift !== 0), 120); };
    G.addEventListener && G.addEventListener('resize', onResize);
    root._cleanup = () => { G.removeEventListener && G.removeEventListener('resize', onResize); };

    setMode('explore');
  }

  function unmount() { /* resize listener cleaned per-root */ }

  if (typeof EconomicsLab !== 'undefined' && EconomicsLab && typeof EconomicsLab.registerTool === 'function') {
    EconomicsLab.registerTool('supply-demand', { title: 'Diagram Lab', icon: '📉', mount: mount, unmount: unmount });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE, SHIFT_STEP, PMAX, QMAX, linesFor, equilibrium, eqFor, effectOf, SCENARIOS, lineSegment };
  }
})();
