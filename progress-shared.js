// ══════════════════════════════════════════════════════════════
// SHARED PROGRESS RENDERING
// Topic/section definitions + a read-only ring grid, used by the
// teacher dashboard to show the same view a student sees. Self-
// contained: it injects its own CSS once, so any page can just
// include this file and call renderProgressGrid(container, progress).
//
// `progress` shape (same as ProgressStore / progress_summary):
//   { pageId: { sectionKey: { done, total } } }
// ══════════════════════════════════════════════════════════════

const PAGE_GROUPS = [
  { id:'1-business-activity', title:'1. Business Activity', sub:'Component 1 · Section 1', colour:'#7a5c9e', pages:[
    { id:'1-1-role-of-business-enterprise',  name:'1.1 Role of Business Enterprise', href:'1_1_role_of_business_enterprise.html' },
    { id:'1-2-business-planning',             name:'1.2 Business Planning',            href:'1_2_business_planning.html' },
    { id:'1-3-business-ownership',            name:'1.3 Business Ownership',           href:'1_3_business_ownership.html' },
    { id:'1-4-business-aims-objectives',      name:'1.4 Aims and Objectives',          href:'1_4_business_aims_objectives.html' },
    { id:'1-5-stakeholders-in-business',      name:'1.5 Stakeholders in Business',     href:'1_5_stakeholders_in_business.html' },
    { id:'1-6-business-growth',               name:'1.6 Business Growth',              href:'1_6_business_growth.html' },
  ]},
  { id:'2-marketing', title:'2. Marketing', sub:'Component 1 · Section 2', colour:'#1a6b6b', pages:[
    { id:'2-1-role-of-marketing',   name:'2.1 The Role of Marketing', href:'2_1_role_of_marketing.html' },
    { id:'2-2-market-research',     name:'2.2 Market Research',       href:'2_2_market_research.html' },
    { id:'2-3-market-segmentation', name:'2.3 Market Segmentation',   href:'2_3_market_segmentation.html' },
    { id:'2-4-marketing-mix', name:'2.4 The Marketing Mix', sub:'Overview', href:'2_4_marketing_mix.html', children:[
      { id:'2-4-1-introduction-marking-mix',    name:'2.4.1 Introduction',      sub:'Marketing Mix foundations', href:'2_4_1_introduction_marking_mix.html' },
      { id:'2-4-2-product-and-product-life',    name:'2.4.2 Product & PLC',     sub:'Product Life Cycle',        href:'2_4_2_Product_and_The_Product_Life_Cycle.html' },
      { id:'2-4-3-pricing-methods',             name:'2.4.3 Pricing Methods',   sub:'Pricing strategies',        href:'2_4_3_pricing_methods.html' },
      { id:'2-4-4-promotion',                   name:'2.4.4 Promotion',         sub:'Promotional mix',           href:'2_4_4_Promotion.html' },
      { id:'2-4-5-place',                       name:'2.4.5 Place',             sub:'Distribution channels',     href:'2_4_5_place.html' },
      { id:'2-4-6-market-data-integrated-mix',  name:'2.4.6 Market Data & Mix', sub:'Integrated strategy',      href:'2_4_6_market_data_integrated_mix.html' },
    ]},
  ]},
  { id:'3-people', title:'3. People', sub:'Component 1 · Section 3', colour:'#c84b31', pages:[
    { id:'3-1-role-of-human-resources',     name:'3.1 Role of Human Resources',    href:'3_1_role_of_human_resources.html' },
    { id:'3-2-organisational-structures',   name:'3.2 Organisational Structures',  href:'3_2_organisational_structures.html' },
    { id:'3-3-communication-in-business',   name:'3.3 Communication in Business',  href:'3_3_communication_in_business.html' },
    { id:'3-4-recruitment-and-selection',   name:'3.4 Recruitment and Selection',  href:'3_4_recruitment_and_selection.html' },
    { id:'3-5-motivation-and-retention',    name:'3.5 Motivation and Retention',   href:'3_5_motivation_and_retention.html' },
    { id:'3-6-training-and-development',    name:'3.6 Training and Development',   href:'3_6_training_and_development.html' },
    { id:'3-7-employment-law',              name:'3.7 Employment Law',             href:'3_7_employment_law.html' },
  ]},
  { id:'4-operations', title:'4. Operations', sub:'Component 1 · Section 4', colour:'#d4a843', pages:[
    { id:'4-1-production-processes',          name:'4.1 Production Processes',         href:'4_1_production_processes.html' },
    { id:'4-2-quality-of-goods-services',     name:'4.2 Quality of Goods & Services',  href:'4_2_quality_of_goods_services.html' },
    { id:'4-3-sales-process-customer-service',name:'4.3 The Sales Process',            href:'4_3_sales_process_customer_service.html' },
    { id:'4-4-consumer-law',                  name:'4.4 Consumer Law',                 href:'4_4_consumer_law.html' },
    { id:'4-5-business-location',             name:'4.5 Business Location',            href:'4_5_business_location.html' },
    { id:'4-6-working-with-suppliers',        name:'4.6 Working with Suppliers',       href:'4_6_working_with_suppliers.html' },
  ]},
  { id:'5-finance', title:'5. Finance', sub:'Component 2 · Section 5', colour:'#2d7a4f', pages:[
    { id:'5-1-role-of-finance-function',  name:'5.1 Role of Finance Function', href:'5_1_role_of_finance_function.html' },
    { id:'5-2-sources-of-finance',        name:'5.2 Sources of Finance',       href:'5_2_sources_of_finance.html' },
    { id:'5-3-revenue-costs-profit-loss', name:'5.3 Revenue, Costs, Profit',   href:'5_3_revenue_costs_profit_loss.html' },
    { id:'5-4-break-even',                name:'5.4 Break-even',               href:'5_4_break_even.html' },
    { id:'5-5-cash-and-cash-flow',        name:'5.5 Cash and Cash Flow',       href:'5_5_cash_and_cash_flow.html' },
  ]},
  { id:'6-influences', title:'6. Influences', sub:'Component 2 · Section 6', colour:'#0077b6', pages:[
    { id:'6-1-ethical-environmental', name:'6.1 Ethical & Environmental', href:'6_1_ethical_environmental.html' },
    { id:'6-2-the-economic-climate',  name:'6.2 The Economic Climate',    href:'6_2_the_economic_climate.html' },
    { id:'6-3-globalisation',         name:'6.3 Globalisation',           href:'6_3_globalisation.html' },
  ]},
  { id:'7-final', title:'7. Final', sub:'Synoptic Overview', colour:'#5a6e7f', pages:[
    { id:'7-1-final', name:'7.1 Interdependent Nature', sub:'Synoptic', href:'7_1_final.html' },
  ]},
];

const SECTIONS = [
  {key:'learn',icon:'📚',label:'Key Learning'},
  {key:'mcq',icon:'❓',label:'MCQ'},
  {key:'match',icon:'🔗',label:'Matching'},
  {key:'fib',icon:'✏️',label:'Fill Blanks'},
  {key:'misc',icon:'⚠️',label:'Misconceptions'},
  {key:'tips',icon:'🎯',label:'Exam Tips'},
  {key:'flashcards',icon:'🃏',label:'Flashcards'},
  {key:'tf',icon:'✅',label:'True/False'},
  {key:'exam',icon:'📝',label:'Exam Practice'},
];

const PAGE_TITLES = (() => {
  const m = {};
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { m[p.id] = p.name; }));
  return m;
})();
function pageTitle(pageId) { return PAGE_TITLES[pageId] || pageId; }

function flatPages(group) {
  const out = [];
  group.pages.forEach(p => {
    out.push(p);
    if (p.children) p.children.forEach(c => out.push({ ...c, isChild: true }));
  });
  return out;
}

function makeRing(done, total, size = 40, label = '') {
  const r = size * .37, circ = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  const pct = total > 0 ? done / total : 0, offset = circ - pct * circ, sw = size * .09;
  const col = total === 0 ? '#c9bfaa' : done >= total ? '#d4a843' : done > 0 ? '#7a5c9e' : '#c9bfaa';
  const tc = total === 0 ? '#5a6e7f' : done >= total ? '#8f6d19' : done > 0 ? '#6a4f8c' : '#767676';
  const lbl = total === 0 ? '–' : `${done}/${total}`;
  const fs = lbl.length > 4 ? size * .135 : size * .165;
  const a11y = total === 0
    ? `${label ? label + ': ' : ''}not available`
    : `${label ? label + ': ' : ''}${done} of ${total} complete`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${a11y}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c9bfaa" stroke-width="${sw}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + size * .065}" text-anchor="middle"
      font-family="DM Mono,monospace" font-size="${fs.toFixed(1)}"
      fill="${tc}" font-weight="500">${lbl}</text>
  </svg>`;
}

// True question/flashcard count for one page+section, independent of
// whether the student has touched it — from the generated
// section-totals.js (window.SECTION_TOTALS). Falls back to whatever total
// is already recorded (e.g. section-totals.js isn't loaded on this page).
function trueSectionTotal(pageId, sectionKey, fallback) {
  const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pageId];
  return (t && t[sectionKey] != null) ? t[sectionKey] : fallback;
}

// A page's per-section {done,total} pairs, fixed up so that once a student
// has engaged with a topic AT ALL (done>0 in any section), every section
// counts toward totals using its TRUE total — not just the sections they
// personally happened to start. An untouched topic is left as-is (0/0
// everywhere) so it doesn't drag down the average before the student ever
// opens it.
function pageSectionTotals(pageId, pd) {
  const started = SECTIONS.some(s => ((pd[s.key] || {}).done || 0) > 0);
  return SECTIONS.map(s => {
    const d = pd[s.key] || { done: 0, total: 0 };
    return { key: s.key, done: d.done || 0, total: started ? trueSectionTotal(pageId, s.key, d.total || 0) : (d.total || 0) };
  });
}

// Roll a progress object up to headline numbers.
function computeTotals(progress) {
  let grandDone = 0, grandTotal = 0, pagesStarted = 0;
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => {
    const pd = progress[p.id] || {};
    let started = false;
    pageSectionTotals(p.id, pd).forEach(d => {
      grandDone += d.done; grandTotal += d.total;
      if (d.done > 0) started = true;
    });
    if (started) pagesStarted++;
  }));
  return { grandDone, grandTotal, pagesStarted, pct: grandTotal ? Math.round(grandDone / grandTotal * 100) : 0 };
}

function _injectGridStyles() {
  if (document.getElementById('pg-grid-styles')) return;
  const style = document.createElement('style');
  style.id = 'pg-grid-styles';
  style.textContent = `
    .pg-group{margin-bottom:16px;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--card-bg);}
    .pg-group-header{display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;user-select:none;border-left:4px solid var(--accent);background:var(--card-bg);width:100%;text-align:left;border:none;font-family:inherit;}
    .pg-group-header:hover{background:var(--cream);}
    .pg-group-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--ink);}
    .pg-group-sub{font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);}
    .pg-pct{font-family:'DM Mono',monospace;font-size:11px;color:var(--mid);white-space:nowrap;}
    .pg-chevron{font-size:11px;color:var(--mid);transition:transform .2s ease;}
    .pg-group.collapsed .pg-chevron{transform:rotate(-90deg);}
    .pg-table-wrap{overflow-x:auto;border-top:1px solid var(--border);}
    .pg-group.collapsed .pg-table-wrap{display:none;}
    table.pg-table{width:100%;border-collapse:collapse;min-width:660px;margin:0;}
    table.pg-table th{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:var(--mid);padding:8px 6px;text-align:center;background:var(--cream);}
    table.pg-table th.pg-topic{text-align:left;padding-left:16px;min-width:160px;}
    table.pg-table td{padding:7px 6px;text-align:center;border-top:1px solid var(--border);vertical-align:middle;}
    table.pg-table td.pg-topic{text-align:left;padding-left:16px;font-size:12px;font-weight:600;color:var(--ink);}
    table.pg-table td.pg-topic.pg-indent{padding-left:30px;font-weight:500;color:#555;}
    .pg-ring{display:inline-flex;align-items:center;justify-content:center;}
  `;
  document.head.appendChild(style);
}

function _pgRow(page, pd, isChild) {
  const tr = document.createElement('tr');
  let rowDone = 0, rowTotal = 0;
  const cells = pageSectionTotals(page.id, pd).map(d => {
    rowDone += d.done; rowTotal += d.total;
    return `<td><span class="pg-ring">${makeRing(d.done, d.total, isChild ? 30 : 34, SECTIONS.find(s => s.key === d.key).label)}</span></td>`;
  }).join('');
  tr.innerHTML =
    `<td class="pg-topic${isChild ? ' pg-indent' : ''}">${isChild ? '↳ ' : ''}${page.name}</td>` +
    cells +
    `<td><span class="pg-ring">${makeRing(rowDone, rowTotal, isChild ? 34 : 38, 'Total')}</span></td>`;
  return tr;
}

// Renders the full collapsible topic × section ring grid into `container`.
function renderProgressGrid(container, progress) {
  _injectGridStyles();
  container.innerHTML = '';
  PAGE_GROUPS.forEach(group => {
    let gDone = 0, gTotal = 0;
    flatPages(group).forEach(p => {
      const pd = progress[p.id] || {};
      pageSectionTotals(p.id, pd).forEach(d => { gDone += d.done; gTotal += d.total; });
    });
    const gPct = gTotal ? Math.round(gDone / gTotal * 100) : 0;

    const groupEl = document.createElement('section');
    groupEl.className = 'pg-group collapsed';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'pg-group-header';
    header.style.borderLeftColor = group.colour;
    header.innerHTML =
      `<div style="flex:1"><div class="pg-group-title">${group.title}</div><div class="pg-group-sub">${group.sub}</div></div>
       <span class="pg-ring">${makeRing(gDone, gTotal, 34, group.title + ' overall')}</span>
       <span class="pg-pct">${gTotal ? gPct + '%' : '–'}</span>
       <span class="pg-chevron" aria-hidden="true">▾</span>`;

    const wrap = document.createElement('div');
    wrap.className = 'pg-table-wrap';
    const table = document.createElement('table');
    table.className = 'pg-table';
    table.innerHTML =
      `<thead><tr><th class="pg-topic">Topic</th>` +
      SECTIONS.map(s => `<th><span aria-hidden="true">${s.icon}</span><br><span style="font-size:8px">${s.label}</span></th>`).join('') +
      `<th>Total</th></tr></thead>`;
    const tbody = document.createElement('tbody');
    group.pages.forEach(page => {
      tbody.appendChild(_pgRow(page, progress[page.id] || {}, false));
      if (page.children) page.children.forEach(ch => tbody.appendChild(_pgRow(ch, progress[ch.id] || {}, true)));
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    groupEl.appendChild(header);
    groupEl.appendChild(wrap);
    container.appendChild(groupEl);

    header.addEventListener('click', () => groupEl.classList.toggle('collapsed'));
  });
}
