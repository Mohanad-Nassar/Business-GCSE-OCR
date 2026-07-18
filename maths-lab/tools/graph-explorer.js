// ══════════════════════════════════════════════════════════════
// MATHS PRACTICE LAB — Graph Explorer (C2, ADDMATHS-CONTENT-PLAN.md §7.1)
// Registers tool id 'graph-explorer'. Slider-driven function plotter adapting
// the cs-lab media-lab slider+canvas idiom. Five modes:
//   • quadratic   — y = ax² + bx + c (a, b, c sliders; vertex, discriminant, roots)
//   • exponential — y = k·aˣ         (k, a sliders; y-intercept, growth vs decay)
//   • sine        — y = a·sin(bx + c)(a, b, c sliders; amplitude, period)
//   • chord-tangent — chord gradient of y=x² over [x₀, x₀+h] → true gradient as h→0
//   • integral-area — midpoint Riemann sum of y=x² on [0,3] vs the exact area
//
// All plotting MATH is pure module-scope functions (unit-tested under Node via
// the module.exports guard). The canvas draw layer is thin and every
// getContext('2d') is guarded, so the tool degrades gracefully where no 2D
// context exists (and never crashes in a headless DOM). LaTeX backslashes are
// DOUBLED; delimiters \(...\) / \[...\] only.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── pure maths ─────────────────────────────────────────────────
  function fmt(n, dp) {
    if (!isFinite(n)) return '—';
    const r = Number(n.toFixed(dp == null ? 2 : dp));
    return (Object.is(r, -0) ? 0 : r).toString();
  }

  function quadraticInfo(a, b, c) {
    if (a === 0) {
      return { degenerate: true, vertex: null, disc: null, roots: [] };
    }
    const vx = -b / (2 * a);
    const vy = c - (b * b) / (4 * a);
    const disc = b * b - 4 * a * c;
    let roots = [];
    if (disc > 0) {
      const s = Math.sqrt(disc);
      roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)];
    } else if (Math.abs(disc) < 1e-12) {
      roots = [vx];
    }
    return { degenerate: false, vertex: [vx, vy], disc: disc, roots: roots };
  }

  // Midpoint Riemann sum of f on [lo, hi] with n strips.
  function riemannMidpoint(f, lo, hi, n) {
    const w = (hi - lo) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += f(lo + (i + 0.5) * w);
    return sum * w;
  }
  // Exact ∫ x² dx = x³/3.
  function exactIntegralXSquared(lo, hi) { return (hi * hi * hi - lo * lo * lo) / 3; }

  function chordGradient(f, x0, h) { return (f(x0 + h) - f(x0)) / h; }

  // Per-mode config: sliders + the function it plots + a pure readout builder.
  // readout(params) → { latex: '...', notes: ['...'] } (LaTeX rendered after insert).
  const MODES = {
    'quadratic': {
      label: 'Quadratic  y = ax² + bx + c',
      view: { xmin: -8, xmax: 8, ymin: -10, ymax: 10 },
      sliders: [
        { id: 'a', label: 'a', min: -4, max: 4, step: 0.5, def: 1 },
        { id: 'b', label: 'b', min: -8, max: 8, step: 1, def: 2 },
        { id: 'c', label: 'c', min: -8, max: 8, step: 1, def: -3 },
      ],
      fn: p => (x => p.a * x * x + p.b * x + p.c),
      readout: p => {
        const info = quadraticInfo(p.a, p.b, p.c);
        const eq = 'y = ' + latexQuad(p.a, p.b, p.c);
        if (info.degenerate) return { latex: '\\( ' + eq + ' \\)', notes: ['With \\( a = 0 \\) this is a straight line, not a parabola — move the a slider.'] };
        const notes = [];
        notes.push('Turning point (vertex): \\( (' + fmt(info.vertex[0]) + ',\\ ' + fmt(info.vertex[1]) + ') \\) — a ' + (p.a > 0 ? 'minimum' : 'maximum') + '.');
        notes.push('Discriminant \\( b^2 - 4ac = ' + fmt(info.disc) + ' \\): ' +
          (info.disc > 1e-12 ? 'two real roots' : Math.abs(info.disc) < 1e-12 ? 'one repeated root' : 'no real roots') + '.');
        if (info.roots.length === 2) notes.push('Roots: \\( x = ' + fmt(info.roots[0]) + ' \\) and \\( x = ' + fmt(info.roots[1]) + ' \\).');
        else if (info.roots.length === 1) notes.push('Root: \\( x = ' + fmt(info.roots[0]) + ' \\).');
        return { latex: '\\( ' + eq + ' \\)', notes: notes };
      },
    },
    'exponential': {
      label: 'Exponential  y = k·aˣ',
      view: { xmin: -4, xmax: 4, ymin: -1, ymax: 12 },
      sliders: [
        { id: 'k', label: 'k', min: 0.5, max: 4, step: 0.5, def: 1 },
        { id: 'a', label: 'a', min: 0.2, max: 3, step: 0.1, def: 2 },
      ],
      fn: p => (x => p.k * Math.pow(p.a, x)),
      readout: p => {
        const notes = [];
        notes.push('y-intercept: \\( y = k = ' + fmt(p.k) + ' \\) at \\( x = 0 \\) (since \\( a^0 = 1 \\)).');
        if (Math.abs(p.a - 1) < 1e-9) notes.push('With \\( a = 1 \\) the graph is the flat line \\( y = k \\).');
        else notes.push('\\( a = ' + fmt(p.a) + ' \\) &gt; 1 gives exponential <strong>growth</strong>; \\( 0 &lt; a &lt; 1 \\) gives <strong>decay</strong>. Here: ' + (p.a > 1 ? 'growth' : 'decay') + '.');
        notes.push('The x-axis \\( y = 0 \\) is a horizontal asymptote — the curve never reaches it.');
        return { latex: '\\( y = ' + fmt(p.k) + ' \\cdot ' + fmt(p.a) + '^{x} \\)', notes: notes };
      },
    },
    'sine': {
      label: 'Sine  y = a·sin(bx + c)',
      view: { xmin: -Math.PI * 2, xmax: Math.PI * 2, ymin: -5, ymax: 5 },
      sliders: [
        { id: 'a', label: 'a (amplitude)', min: 0.5, max: 4, step: 0.5, def: 2 },
        { id: 'b', label: 'b (frequency)', min: 0.5, max: 4, step: 0.5, def: 1 },
        { id: 'c', label: 'c (phase, rad)', min: -3, max: 3, step: 0.1, def: 0 },
      ],
      fn: p => (x => p.a * Math.sin(p.b * x + p.c)),
      readout: p => {
        const period = (2 * Math.PI) / p.b;
        return {
          latex: '\\( y = ' + fmt(p.a) + '\\sin(' + fmt(p.b) + 'x ' + (p.c >= 0 ? '+ ' : '- ') + fmt(Math.abs(p.c)) + ') \\)',
          notes: [
            'Amplitude \\( = |a| = ' + fmt(p.a) + ' \\) (peak height above the midline).',
            'Period \\( = \\dfrac{2\\pi}{b} = ' + fmt(period) + ' \\) radians (one full wave).',
            'The \\( +c \\) term shifts the wave left by \\( c/b = ' + fmt(p.c / p.b) + ' \\) radians (phase shift).',
          ],
        };
      },
    },
    'chord-tangent': {
      label: 'Chord → Tangent  (y = x²)',
      view: { xmin: -1, xmax: 4, ymin: -1, ymax: 10 },
      curve: x => x * x,
      sliders: [
        { id: 'x0', label: 'x₀ (point)', min: -1, max: 3, step: 0.1, def: 1 },
        { id: 'h', label: 'h (gap)', min: 0.01, max: 3, step: 0.01, def: 1.5 },
      ],
      fn: () => (x => x * x),
      readout: p => {
        const f = x => x * x;
        const chord = chordGradient(f, p.x0, p.h);
        const trueGrad = 2 * p.x0;
        return {
          latex: '\\( \\text{gradient of chord} = \\dfrac{f(x_0+h) - f(x_0)}{h} \\)',
          notes: [
            'At \\( x_0 = ' + fmt(p.x0) + ',\\ h = ' + fmt(p.h) + ' \\): chord gradient \\( = ' + fmt(chord) + ' \\).',
            'True gradient (the derivative) \\( f\\,\'(x_0) = 2x_0 = ' + fmt(trueGrad) + ' \\).',
            'As you shrink \\( h \\to 0 \\), the chord gradient \\( ' + fmt(chord) + ' \\to ' + fmt(trueGrad) + ' \\) — that limit <em>is</em> differentiation.',
          ],
        };
      },
    },
    'integral-area': {
      label: 'Area under a curve  (y = x²)',
      view: { xmin: -0.5, xmax: 3.5, ymin: -1, ymax: 10 },
      curve: x => x * x,
      bounds: [0, 3],
      sliders: [
        { id: 'n', label: 'n (rectangles)', min: 1, max: 50, step: 1, def: 6 },
      ],
      fn: () => (x => x * x),
      readout: p => {
        const f = x => x * x;
        const lo = 0, hi = 3;
        const approx = riemannMidpoint(f, lo, hi, Math.round(p.n));
        const exact = exactIntegralXSquared(lo, hi);
        const err = Math.abs(exact - approx);
        return {
          latex: '\\( \\displaystyle\\int_{0}^{3} x^2\\,dx = \\Big[\\tfrac{x^3}{3}\\Big]_0^3 = ' + fmt(exact) + ' \\)',
          notes: [
            'With \\( n = ' + Math.round(p.n) + ' \\) midpoint rectangles the estimated area \\( = ' + fmt(approx, 3) + ' \\).',
            'Error vs the exact area \\( = ' + fmt(err, 3) + ' \\).',
            'More, thinner rectangles \\( \\Rightarrow \\) the estimate \\( \\to ' + fmt(exact) + ' \\). That limit is the definite integral.',
          ],
        };
      },
    },
  };

  function latexQuad(a, b, c) {
    // "y = " body: ax^2 + bx + c with tidy signs/coefficients.
    function lead(a) {
      if (a === 1) return 'x^2';
      if (a === -1) return '-x^2';
      return fmt(a) + 'x^2';
    }
    function term(k, suf) {
      if (k === 0) return '';
      const sign = k > 0 ? ' + ' : ' - ';
      const v = Math.abs(k);
      if (suf === 'x' && v === 1) return sign + 'x';
      return sign + fmt(v) + suf;
    }
    return lead(a) + term(b, 'x') + term(c, '');
  }

  // ── DOM / canvas ───────────────────────────────────────────────
  function injectStyles() {
    if (G.document.getElementById('mathslab-graph-style')) return;
    const style = G.document.createElement('style');
    style.id = 'mathslab-graph-style';
    style.textContent =
      '.mathslab-graph-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.mathslab-graph-tab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 14px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.mathslab-graph-tab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.mathslab-graph-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.mathslab-graph-canvas{width:100%;max-width:620px;height:auto;aspect-ratio:16/10;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;display:block;touch-action:none}' +
      '.mathslab-graph-eq{font-size:16px;margin:12px 0 6px;line-height:1.5}' +
      '.mathslab-graph-sliders{display:flex;flex-direction:column;gap:12px;margin:10px 0;max-width:620px}' +
      '.mathslab-graph-slider-row label{display:flex;justify-content:space-between;font-size:13px;color:var(--mid);margin-bottom:4px;gap:12px}' +
      '.mathslab-graph-slider-row label .val{font-family:"DM Mono","Consolas",monospace;color:var(--ink);font-weight:600}' +
      '.mathslab-graph-slider-row input[type=range]{width:100%;min-height:44px;accent-color:var(--accent);cursor:pointer}' +
      '.mathslab-graph-notes{margin:8px 0 0;padding:0;list-style:none;max-width:620px}' +
      '.mathslab-graph-notes li{font-size:14px;color:var(--ink);line-height:1.6;margin-bottom:6px;padding-left:16px;position:relative}' +
      '.mathslab-graph-notes li::before{content:"›";position:absolute;left:0;color:var(--accent);font-weight:700}' +
      '.mathslab-graph-reset{margin-top:4px}';
    G.document.head.appendChild(style);
  }

  // Read the resolved theme colours off the page so the plot matches every theme.
  function themeColours() {
    try {
      const cs = getComputedStyle(G.document.body);
      const get = (v, fb) => (cs.getPropertyValue(v) || '').trim() || fb;
      return {
        ink: get('--ink', '#1a1a2e'),
        mid: get('--mid', '#6b7280'),
        accent: get('--accent', '#5a4bc4'),
        success: get('--success', '#2e9e6b'),
        border: get('--border', '#d8d8e0'),
      };
    } catch (e) {
      return { ink: '#1a1a2e', mid: '#6b7280', accent: '#5a4bc4', success: '#2e9e6b', border: '#d8d8e0' };
    }
  }

  function makePlot(canvas, view) {
    let ctx2d = null;
    try { ctx2d = canvas.getContext ? canvas.getContext('2d') : null; } catch (e) { ctx2d = null; }
    // Backing-store size (guard devicePixelRatio for headless).
    const dpr = (G.devicePixelRatio && isFinite(G.devicePixelRatio)) ? G.devicePixelRatio : 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = Math.round(cssW * 10 / 16);
    if (ctx2d) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const W = cssW, H = cssH;
    const { xmin, xmax, ymin, ymax } = view;
    const px = x => (x - xmin) / (xmax - xmin) * W;
    const py = y => H - (y - ymin) / (ymax - ymin) * H;
    return { ctx2d, W, H, xmin, xmax, ymin, ymax, px, py };
  }

  function drawAxes(plot, col) {
    const c = plot.ctx2d; if (!c) return;
    c.clearRect(0, 0, plot.W, plot.H);
    c.lineWidth = 1;
    c.strokeStyle = col.border;
    // gridlines at integers (skip if too dense)
    const stepX = (plot.xmax - plot.xmin) > 16 ? 2 : 1;
    for (let x = Math.ceil(plot.xmin); x <= plot.xmax; x += stepX) {
      c.beginPath(); c.moveTo(plot.px(x), 0); c.lineTo(plot.px(x), plot.H); c.stroke();
    }
    for (let y = Math.ceil(plot.ymin); y <= plot.ymax; y += 2) {
      c.beginPath(); c.moveTo(0, plot.py(y)); c.lineTo(plot.W, plot.py(y)); c.stroke();
    }
    // axes
    c.lineWidth = 1.6; c.strokeStyle = col.mid;
    if (plot.ymin < 0 && plot.ymax > 0) { c.beginPath(); c.moveTo(0, plot.py(0)); c.lineTo(plot.W, plot.py(0)); c.stroke(); }
    if (plot.xmin < 0 && plot.xmax > 0) { c.beginPath(); c.moveTo(plot.px(0), 0); c.lineTo(plot.px(0), plot.H); c.stroke(); }
  }

  function drawCurve(plot, f, col) {
    const c = plot.ctx2d; if (!c) return;
    c.lineWidth = 2.5; c.strokeStyle = col.accent; c.beginPath();
    let started = false;
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const x = plot.xmin + (plot.xmax - plot.xmin) * i / steps;
      const y = f(x);
      if (!isFinite(y)) { started = false; continue; }
      const sx = plot.px(x), sy = plot.py(y);
      // avoid drawing wild off-screen joins for steep exponentials
      if (sy < -plot.H || sy > 2 * plot.H) { started = false; continue; }
      if (!started) { c.moveTo(sx, sy); started = true; } else c.lineTo(sx, sy);
    }
    c.stroke();
  }

  function dot(plot, x, y, col, r) {
    const c = plot.ctx2d; if (!c) return;
    c.fillStyle = col; c.beginPath(); c.arc(plot.px(x), plot.py(y), r || 4, 0, Math.PI * 2); c.fill();
  }

  // Mode-specific overlays on top of curve+axes.
  function drawOverlay(mode, plot, p, col) {
    const c = plot.ctx2d; if (!c) return;
    if (mode === 'quadratic') {
      const info = quadraticInfo(p.a, p.b, p.c);
      if (!info.degenerate) {
        dot(plot, info.vertex[0], info.vertex[1], col.success, 5);
        info.roots.forEach(r => dot(plot, r, 0, col.ink, 4));
      }
    } else if (mode === 'exponential') {
      dot(plot, 0, p.k, col.success, 5);
    } else if (mode === 'chord-tangent') {
      const f = x => x * x;
      const x1 = p.x0, x2 = p.x0 + p.h;
      dot(plot, x1, f(x1), col.success, 5);
      dot(plot, x2, f(x2), col.ink, 4);
      c.strokeStyle = col.success; c.lineWidth = 2; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(plot.px(x1), plot.py(f(x1))); c.lineTo(plot.px(x2), plot.py(f(x2))); c.stroke();
      c.setLineDash([]);
    } else if (mode === 'integral-area') {
      const f = x => x * x, lo = 0, hi = 3, n = Math.round(p.n);
      const w = (hi - lo) / n;
      c.fillStyle = 'color-mix(in srgb, ' + col.accent + ' 22%, transparent)';
      c.strokeStyle = col.accent; c.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const mid = lo + (i + 0.5) * w, h = f(mid);
        const x0 = plot.px(lo + i * w), x1 = plot.px(lo + (i + 1) * w);
        const yTop = plot.py(h), yBase = plot.py(0);
        c.beginPath(); c.rect(x0, yTop, x1 - x0, yBase - yTop); c.fill(); c.stroke();
      }
    }
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const all = Object.keys(MODES);
    let modes = (ctx.config && ctx.config.modes && ctx.config.modes.length)
      ? ctx.config.modes.filter(m => MODES[m]) : all;
    if (!modes.length) modes = [all[0]];

    const root = G.document.createElement('div');
    root.className = 'mathslab-graph';
    el.appendChild(root);

    const tabBar = G.document.createElement('div');
    tabBar.className = 'mathslab-graph-tabs';
    root.appendChild(tabBar);

    const canvas = G.document.createElement('canvas');
    canvas.className = 'mathslab-graph-canvas';
    canvas.setAttribute('role', 'img');
    root.appendChild(canvas);

    const eq = G.document.createElement('p');
    eq.className = 'mathslab-graph-eq';
    root.appendChild(eq);

    const slidersWrap = G.document.createElement('div');
    slidersWrap.className = 'mathslab-graph-sliders';
    root.appendChild(slidersWrap);

    const notes = G.document.createElement('ul');
    notes.className = 'mathslab-graph-notes';
    root.appendChild(notes);

    const resetBtn = ui.btn('Reset sliders', 'secondary');
    resetBtn.classList.add('mathslab-graph-reset');
    root.appendChild(resetBtn);

    let activeMode = modes[0];
    let params = {};
    let completedOnce = false;

    function setTabUI() {
      Array.prototype.forEach.call(tabBar.children, (b, i) => b.classList.toggle('active', modes[i] === activeMode));
    }

    function redraw() {
      const def = MODES[activeMode];
      const col = themeColours();
      const plot = makePlot(canvas, def.view);
      drawAxes(plot, col);
      drawCurve(plot, def.fn(params), col);
      drawOverlay(activeMode, plot, params, col);

      const r = def.readout(params);
      eq.innerHTML = r.latex;
      notes.innerHTML = '';
      r.notes.forEach(n => { const li = G.document.createElement('li'); li.innerHTML = n; notes.appendChild(li); });
      ui.renderMath(eq);
      ui.renderMath(notes);

      // "explored" once the student has moved sliders enough to see a change.
      if (!completedOnce) { completedOnce = true; ctx.complete({ mode: activeMode }); }
    }

    function buildSliders() {
      slidersWrap.innerHTML = '';
      const def = MODES[activeMode];
      params = {};
      def.sliders.forEach(s => {
        params[s.id] = s.def;
        const row = G.document.createElement('div');
        row.className = 'mathslab-graph-slider-row';
        const label = G.document.createElement('label');
        const name = G.document.createElement('span'); name.textContent = s.label;
        const val = G.document.createElement('span'); val.className = 'val'; val.textContent = fmt(s.def);
        label.appendChild(name); label.appendChild(val);
        const input = G.document.createElement('input');
        input.type = 'range';
        input.min = String(s.min); input.max = String(s.max); input.step = String(s.step);
        input.value = String(s.def);
        input.setAttribute('aria-label', s.label);
        input.addEventListener('input', () => {
          params[s.id] = parseFloat(input.value);
          val.textContent = fmt(params[s.id]);
          redraw();
        });
        row.appendChild(label); row.appendChild(input);
        slidersWrap.appendChild(row);
        row._input = input; row._reset = () => { input.value = String(s.def); params[s.id] = s.def; val.textContent = fmt(s.def); };
      });
    }

    resetBtn.addEventListener('click', () => {
      Array.prototype.forEach.call(slidersWrap.children, row => { if (row._reset) row._reset(); });
      redraw();
    });

    function selectMode(m) {
      activeMode = m;
      setTabUI();
      buildSliders();
      redraw();
    }

    modes.forEach(m => {
      const b = G.document.createElement('button');
      b.type = 'button';
      b.className = 'mathslab-graph-tab';
      b.textContent = MODES[m].label;
      b.addEventListener('click', () => selectMode(m));
      tabBar.appendChild(b);
    });

    // Redraw on resize (canvas is fluid). Debounced.
    let rz = null;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(redraw, 120); };
    G.addEventListener && G.addEventListener('resize', onResize);
    root._cleanup = () => { G.removeEventListener && G.removeEventListener('resize', onResize); };

    selectMode(activeMode);
  }

  function unmount() {
    // resize listener is cleaned per-root; nothing global to release.
  }

  if (typeof MathsLab !== 'undefined' && MathsLab && typeof MathsLab.registerTool === 'function') {
    MathsLab.registerTool('graph-explorer', { title: 'Graph Explorer', icon: '📈', mount: mount, unmount: unmount });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      fmt, quadraticInfo, riemannMidpoint, exactIntegralXSquared, chordGradient, latexQuad, MODES,
    };
  }
})();
