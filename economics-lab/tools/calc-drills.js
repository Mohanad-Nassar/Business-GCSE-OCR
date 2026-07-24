// ══════════════════════════════════════════════════════════════
// ECONOMICS PRACTICE LAB — Calculation Lab (calc-drills)
// Registers tool id 'calc-drills'. The "calculate" command word (an AO1 skill;
// ≥10% of GCSE marks are quantitative) — OCR J205 2.6 requires learners to
// calculate total cost, average cost, total revenue, average revenue, profit
// and loss. This generates FRESH numbers every round so students drill to
// fluency, self-marks with a tolerance, and shows the full worked solution with
// the recurring mark-scheme rules baked in (average = total ÷ quantity; a
// negative figure is a LOSS; use the £ sign).
//
// SOLVERS are pure module-scope functions, unit-tested under Node via
// module.exports; makeQuestion(mode, rng) takes an injectable RNG so a test can
// generate a question and confirm the stated answer equals the solver.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const G = (typeof window !== 'undefined') ? window : global;

  // ── pure solvers ───────────────────────────────────────────────
  function totalCost(fc, vc, q) { return fc + vc * q; }
  function averageCost(fc, vc, q) { return totalCost(fc, vc, q) / q; }
  function totalRevenue(p, q) { return p * q; }
  function averageRevenue(p) { return p; }              // AR always equals price
  function profit(tr, tc) { return tr - tc; }
  function round2(n) { return Math.round(n * 100) / 100; }

  function money(n) {
    const neg = n < 0;
    const v = Math.abs(round2(n));
    const s = (Number.isInteger(v) ? v.toString() : v.toFixed(2));
    return (neg ? '−£' : '£') + s;
  }
  function pct(n) {
    const v = round2(n);
    return (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + '%';
  }
  // Display an answer in its own unit ('£' → money, '%' → percentage).
  function showAns(value, unit) { return unit === '%' ? pct(value) : money(value); }

  // extra solvers (2.7 pay, 3.2 unemployment, 3.4 inflation)
  function netPay(gross, incomeTax, ni, pension) { return gross - (incomeTax + ni + pension); }
  function unemploymentRate(unemployed, employed) { return unemployed / (unemployed + employed) * 100; }
  function inflatedPrice(price, ratePct) { return price * (1 + ratePct / 100); }

  // ── student-input comparison (self-contained; exam-widgets.js is NOT loaded
  //    on economics pages). Strip £/$/€/%/commas/spaces, accept a bare decimal
  //    or a/b fraction, compare within tol. A leading '−' (minus) is honoured so
  //    a LOSS typed as −£420 or -420 is accepted. ──
  function normNum(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/−/g, '-').replace(/[\s,£$€%]/g, '');
  }
  function parseNum(ns) {
    if (/^-?\d+(\.\d+)?$/.test(ns)) return parseFloat(ns);
    const m = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(ns);
    if (m) { const d = parseFloat(m[2]); if (d !== 0) return parseFloat(m[1]) / d; }
    return null;
  }
  function answerCorrect(raw, value, tol) {
    const v = parseNum(normNum(raw));
    if (v === null) return false;
    return Math.abs(v - value) <= (tol == null ? 0.01 : tol) + 1e-9;
  }

  // ── question generation ────────────────────────────────────────
  const MODE_LABELS = {
    cost: 'Cost (TC & AC)',
    revenue: 'Revenue (TR & AR)',
    profit: 'Profit & loss',
    pay: 'Gross & net pay',
    unemployment: 'Unemployment rate',
    inflation: 'Inflation & prices',
  };

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  const FC_OPTS = [200, 300, 400, 500, 600, 800, 1000];
  const VC_OPTS = [2, 3, 4, 5, 6];
  const Q_OPTS = [20, 25, 40, 50, 80, 100];
  const P_OPTS = [3, 4, 5, 6, 8, 10];
  const GROSS_OPTS = [1600, 1800, 2000, 2400, 3000];
  const TAX_OPTS = [200, 250, 300, 400];
  const NI_OPTS = [100, 120, 150, 200];
  const PEN_OPTS = [50, 80, 100, 150];
  const LF_OPTS = [2000, 2500, 4000, 5000, 8000, 10000]; // labour force
  const RATE_OPTS = [2, 4, 5, 8, 10];                    // % (unemployment / inflation)
  const IPRICE_OPTS = [40, 50, 80, 100, 120, 200];

  // Returns { prompt, answer, tol, unit, worked } — worked is HTML.
  function makeQuestion(mode, rng) {
    rng = rng || Math.random;
    if (mode === 'cost') {
      const fc = pick(rng, FC_OPTS), vc = pick(rng, VC_OPTS), q = pick(rng, Q_OPTS);
      const askAC = rng() < 0.5;
      const tc = totalCost(fc, vc, q);
      if (!askAC) {
        return {
          prompt: 'A firm has <strong>fixed costs of ' + money(fc) + '</strong> and <strong>variable costs of ' + money(vc) + ' per unit</strong>. It makes <strong>' + q + ' units</strong>. Calculate its <strong>total cost</strong>.',
          answer: tc, tol: 0.01, unit: '£',
          worked: 'Total cost = fixed cost + total variable cost<br>= ' + money(fc) + ' + (' + money(vc) + ' × ' + q + ')<br>= ' + money(fc) + ' + ' + money(vc * q) + ' = <strong>' + money(tc) + '</strong>.',
        };
      }
      const ac = averageCost(fc, vc, q);
      return {
        prompt: 'A firm’s <strong>total cost is ' + money(tc) + '</strong> when it makes <strong>' + q + ' units</strong>. Calculate its <strong>average cost</strong> per unit.',
        answer: round2(ac), tol: 0.02, unit: '£',
        worked: 'Average cost = total cost ÷ quantity<br>= ' + money(tc) + ' ÷ ' + q + ' = <strong>' + money(ac) + '</strong> per unit.<br><em>Remember: “average” always means total ÷ quantity.</em>',
      };
    }
    if (mode === 'revenue') {
      const p = pick(rng, P_OPTS), q = pick(rng, Q_OPTS);
      const askAR = rng() < 0.34;
      const tr = totalRevenue(p, q);
      if (askAR) {
        return {
          prompt: 'A firm sells <strong>' + q + ' units</strong> for a <strong>total revenue of ' + money(tr) + '</strong>. Calculate its <strong>average revenue</strong> per unit.',
          answer: round2(averageRevenue(p)), tol: 0.02, unit: '£',
          worked: 'Average revenue = total revenue ÷ quantity<br>= ' + money(tr) + ' ÷ ' + q + ' = <strong>' + money(p) + '</strong>.<br><em>Average revenue always equals the price per unit.</em>',
        };
      }
      return {
        prompt: 'A firm sells <strong>' + q + ' units</strong> at a <strong>price of ' + money(p) + ' each</strong>. Calculate its <strong>total revenue</strong>.',
        answer: tr, tol: 0.01, unit: '£',
        worked: 'Total revenue = price × quantity<br>= ' + money(p) + ' × ' + q + ' = <strong>' + money(tr) + '</strong>.',
      };
    }
    if (mode === 'pay') {
      // 2.7: net (take-home) pay = gross − income tax − NI − pension
      const gross = pick(rng, GROSS_OPTS), tax = pick(rng, TAX_OPTS), ni = pick(rng, NI_OPTS), pen = pick(rng, PEN_OPTS);
      const net = netPay(gross, tax, ni, pen);
      return {
        prompt: 'A worker earns <strong>gross pay of ' + money(gross) + '</strong> a month. Deductions are <strong>income tax ' + money(tax) + '</strong>, <strong>National Insurance ' + money(ni) + '</strong> and a <strong>pension contribution of ' + money(pen) + '</strong>. Calculate their <strong>net (take-home) pay</strong>.',
        answer: net, tol: 0.01, unit: '£',
        worked: 'Net pay = gross pay − all deductions<br>= ' + money(gross) + ' − (' + money(tax) + ' + ' + money(ni) + ' + ' + money(pen) + ')<br>= ' + money(gross) + ' − ' + money(tax + ni + pen) + ' = <strong>' + money(net) + '</strong>.<br><em>Gross = before deductions; net = what actually reaches the worker.</em>',
      };
    }
    if (mode === 'unemployment') {
      // 3.2: unemployment rate = unemployed ÷ labour force × 100 (labour force = employed + unemployed)
      const lf = pick(rng, LF_OPTS), r = pick(rng, RATE_OPTS);
      const unemployed = Math.round(lf * r / 100), employed = lf - unemployed;
      const rate = unemploymentRate(unemployed, employed);
      return {
        prompt: 'In a country <strong>' + employed.toLocaleString() + '</strong> people are employed and <strong>' + unemployed.toLocaleString() + '</strong> are unemployed. Calculate the <strong>unemployment rate</strong> (%).',
        answer: round2(rate), tol: 0.1, unit: '%',
        worked: 'Unemployment rate = unemployed ÷ labour force × 100<br>Labour force = employed + unemployed = ' + employed.toLocaleString() + ' + ' + unemployed.toLocaleString() + ' = ' + lf.toLocaleString() + '<br>= ' + unemployed.toLocaleString() + ' ÷ ' + lf.toLocaleString() + ' × 100 = <strong>' + pct(rate) + '</strong>.<br><em>The labour force is employed PLUS unemployed — not the whole population.</em>',
      };
    }
    if (mode === 'inflation') {
      // 3.4: effect of inflation on a price — new price = old × (1 + rate)
      const price = pick(rng, IPRICE_OPTS), r = pick(rng, RATE_OPTS);
      const np = inflatedPrice(price, r);
      return {
        prompt: 'A good costs <strong>' + money(price) + '</strong>. Over a year inflation is <strong>' + r + '%</strong>. Calculate the good’s <strong>new price</strong> after one year.',
        answer: round2(np), tol: 0.02, unit: '£',
        worked: 'New price = old price × (1 + inflation rate)<br>= ' + money(price) + ' × (1 + ' + r + '/100)<br>= ' + money(price) + ' × ' + (1 + r / 100) + ' = <strong>' + money(np) + '</strong>.<br><em>Inflation raises the price level: divide the % by 100, then add 1.</em>',
      };
    }
    // profit (sometimes a loss)
    const fc = pick(rng, FC_OPTS), vc = pick(rng, VC_OPTS), q = pick(rng, Q_OPTS), p = pick(rng, P_OPTS);
    const tr = totalRevenue(p, q), tc = totalCost(fc, vc, q);
    const pr = profit(tr, tc);
    return {
      prompt: 'A firm sells <strong>' + q + ' units</strong> at <strong>' + money(p) + ' each</strong>. Its <strong>total costs are ' + money(tc) + '</strong>. Calculate its <strong>profit or loss</strong>.',
      answer: pr, tol: 0.01, unit: '£', isProfit: true,
      worked: 'Profit = total revenue − total cost<br>Total revenue = ' + money(p) + ' × ' + q + ' = ' + money(tr) + '<br>Profit = ' + money(tr) + ' − ' + money(tc) + ' = <strong>' + money(pr) + '</strong>.' +
        (pr < 0 ? '<br><em>This is negative, so it is a <strong>LOSS</strong> of ' + money(Math.abs(pr)) + ' — always say “loss” and show the minus sign.</em>' : ''),
    };
  }

  // ── DOM ────────────────────────────────────────────────────────
  function injectStyles() {
    if (G.document.getElementById('ecolab-calc-style')) return;
    const s = G.document.createElement('style');
    s.id = 'ecolab-calc-style';
    s.textContent =
      '.ecolab-calc-modes{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}' +
      '.ecolab-calc-mode{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:8px 14px;min-height:44px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.ecolab-calc-mode.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.ecolab-calc-mode:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.ecolab-calc-card{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:18px 18px 16px;max-width:560px}' +
      '.ecolab-calc-prompt{font-size:16px;line-height:1.6;margin:0 0 14px}' +
      '.ecolab-calc-inrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '.ecolab-calc-input{font-family:"DM Mono","Consolas",monospace;font-size:16px;padding:10px 12px;min-height:44px;width:160px;box-sizing:border-box;border:1px solid var(--border);border-radius:8px;background:var(--cream,var(--paper));color:var(--ink)}' +
      '.ecolab-calc-input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
      '.ecolab-calc-input.ok{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.ecolab-calc-input.no{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.ecolab-calc-fb{font-size:14px;font-weight:600;margin:12px 0 0;line-height:1.6}' +
      '.ecolab-calc-fb.ok{color:var(--success)}.ecolab-calc-fb.no{color:#c0392b}' +
      '.ecolab-calc-worked{margin-top:10px;padding:12px 14px;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--card-bg));font-size:14px;line-height:1.7;border-radius:0 8px 8px 0}' +
      '.ecolab-calc-hint{font-size:12px;color:var(--mid);margin-top:6px}' +
      '.ecolab-calc-stat{font-size:12px;color:var(--mid);font-family:"DM Mono","Consolas",monospace;margin:10px 0 0}';
    G.document.head.appendChild(s);
  }

  function mount(el, ctx) {
    injectStyles();
    const ui = ctx.ui;
    const allowed = (ctx.config && ctx.config.modes && ctx.config.modes.length) ? ctx.config.modes.filter(m => MODE_LABELS[m]) : Object.keys(MODE_LABELS);
    const modes = allowed.length ? allowed : Object.keys(MODE_LABELS);
    let mode = modes[0];
    let streak = 0, doneFired = false;

    const root = G.document.createElement('div');
    el.appendChild(root);

    const modeBar = ui.el('<div class="ecolab-calc-modes"></div>');
    modes.forEach(m => {
      const b = ui.el('<button type="button" class="ecolab-calc-mode' + (m === mode ? ' active' : '') + '">' + MODE_LABELS[m] + '</button>');
      b.addEventListener('click', () => { mode = m; Array.prototype.forEach.call(modeBar.children, x => x.classList.remove('active')); b.classList.add('active'); newQuestion(); });
      modeBar.appendChild(b);
    });
    root.appendChild(modeBar);

    const card = ui.el('<div class="ecolab-calc-card"></div>');
    root.appendChild(card);
    const stat = ui.el('<p class="ecolab-calc-stat"></p>');
    root.appendChild(stat);

    let q = null, answered = false;

    function refreshStat() { stat.textContent = 'Streak: ' + streak; }

    function newQuestion() {
      q = makeQuestion(mode, Math.random);
      answered = false;
      card.innerHTML = '';
      const prompt = ui.el('<p class="ecolab-calc-prompt">' + q.prompt + '</p>');
      card.appendChild(prompt);
      const row = ui.el('<div class="ecolab-calc-inrow"></div>');
      const input = G.document.createElement('input');
      input.type = 'text'; input.className = 'ecolab-calc-input'; input.autocomplete = 'off'; input.spellcheck = false;
      input.setAttribute('inputmode', 'text');
      input.setAttribute('aria-label', 'Your answer');
      input.placeholder = q.unit === '%' ? 'e.g. 5 or 5%' : (q.isProfit ? 'e.g. £420 or −£50' : 'e.g. £…');
      const check = ui.btn('✓ Check');
      row.appendChild(input); row.appendChild(check);
      card.appendChild(row);
      card.appendChild(ui.el('<p class="ecolab-calc-hint">Type the amount — the £ sign and commas are optional. Losses can be a minus number.</p>'));
      const fb = ui.el('<p class="ecolab-calc-fb"></p>');
      card.appendChild(fb);

      function grade() {
        if (answered) return; answered = true;
        const ok = answerCorrect(input.value, q.answer, q.tol);
        input.classList.add(ok ? 'ok' : 'no'); input.disabled = true; check.disabled = true;
        streak = ok ? streak + 1 : 0;
        refreshStat();
        fb.className = 'ecolab-calc-fb ' + (ok ? 'ok' : 'no');
        fb.innerHTML = (ok ? '✓ Correct!' : '✗ Not quite — the answer is ' + showAns(q.answer, q.unit) + '.') +
          '<div class="ecolab-calc-worked">' + q.worked + '</div>';
        const next = ui.btn('Next question →', 'secondary');
        next.addEventListener('click', newQuestion);
        card.appendChild(next);
        if (ok && streak >= 5 && !doneFired) { doneFired = true; ctx.complete({ mode: mode, streak: streak }); }
      }
      check.addEventListener('click', grade);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); grade(); } });
      try { input.focus(); } catch (e) {}
    }

    refreshStat();
    newQuestion();
  }

  function unmount() {}

  if (typeof EconomicsLab !== 'undefined' && EconomicsLab && typeof EconomicsLab.registerTool === 'function') {
    EconomicsLab.registerTool('calc-drills', { title: 'Calculation Lab', icon: '🔢', mount: mount, unmount: unmount });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { totalCost, averageCost, totalRevenue, averageRevenue, profit, netPay, unemploymentRate, inflatedPrice, round2, money, pct, showAns, normNum, parseNum, answerCorrect, makeQuestion, MODE_LABELS };
  }
})();
