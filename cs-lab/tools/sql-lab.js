// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — SQL Lab (T7, CS-CONTENT-PLAN.md §7.1)
// Registers 'sql-lab'. Used on 2.2.3 (additional programming techniques).
//
// sql.js (WASM) loads lazily from jsDelivr only after the student presses
// "Start SQL Lab". The database is our own fictional in-memory seed data —
// nothing server-side, nothing persisted beyond the browser tab. The lab is
// deliberately read-only: only SELECT ... FROM ... WHERE queries run, which
// matches OCR J277 2.2.3 scope (no JOIN/ORDER BY/aggregates expected).
//
// Wrapped as (function (global) { ... })(window) so the pure helpers
// (sameResultSet, guardQuery, buildSeedSql) can be unit-tested under plain
// Node via `require()` — the CsLab.registerTool call is skipped when there
// is no `global.CsLab` (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Seed data (single source of truth: used for both the SQL seed and
  //    the schema-panel sample rows) ──────────────────────────────────
  const BOOKS = [
    { BookID: 1, Title: 'The Silent Orchard', Author: 'R. Calloway', Genre: 'Mystery', Price: 6.99, Year: 2014 },
    { BookID: 2, Title: 'Wraithlight', Author: 'M. Duvall', Genre: 'Fantasy', Price: 8.50, Year: 2019 },
    { BookID: 3, Title: 'Iron Tide', Author: 'S. Okafor', Genre: 'Sci-Fi', Price: 7.25, Year: 2021 },
    { BookID: 4, Title: 'The Hollow Bell', Author: 'R. Calloway', Genre: 'Horror', Price: 5.99, Year: 2011 },
    { BookID: 5, Title: "Comet's Reach", Author: 'S. Okafor', Genre: 'Sci-Fi', Price: 9.00, Year: 2022 },
    { BookID: 6, Title: 'Paper Lanterns', Author: 'A. Whitfield', Genre: 'Comedy', Price: 4.50, Year: 2009 },
    { BookID: 7, Title: 'The Last Ember', Author: 'M. Duvall', Genre: 'Fantasy', Price: 8.99, Year: 2017 },
    { BookID: 8, Title: 'Nightshade Alley', Author: 'T. Ibarra', Genre: 'Horror', Price: 6.50, Year: 2016 },
    { BookID: 9, Title: 'Salt and Static', Author: 'A. Whitfield', Genre: 'Non-Fiction', Price: 10.00, Year: 2020 },
    { BookID: 10, Title: 'The Quiet Machine', Author: 'T. Ibarra', Genre: 'Sci-Fi', Price: 7.75, Year: 2013 },
    { BookID: 11, Title: 'Foxglove Winter', Author: 'R. Calloway', Genre: 'Mystery', Price: 5.50, Year: 2018 },
    { BookID: 12, Title: 'Static Bloom', Author: 'M. Duvall', Genre: 'Horror', Price: 6.25, Year: 2023 },
  ];

  const STUDENTS = [
    { StudentID: 1, FirstName: 'Amara', Surname: 'Osei', YearGroup: 10, House: 'Turing', Merits: 62 },
    { StudentID: 2, FirstName: 'Ben', Surname: 'Wycliffe', YearGroup: 9, House: 'Lovelace', Merits: 45 },
    { StudentID: 3, FirstName: 'Chidi', Surname: 'Nwosu', YearGroup: 11, House: 'Hopper', Merits: 88 },
    { StudentID: 4, FirstName: 'Delia', Surname: 'Marsh', YearGroup: 10, House: 'Berners-Lee', Merits: 51 },
    { StudentID: 5, FirstName: 'Ewan', Surname: 'Prentice', YearGroup: 9, House: 'Turing', Merits: 30 },
    { StudentID: 6, FirstName: 'Farah', Surname: 'Iqbal', YearGroup: 10, House: 'Hopper', Merits: 100 },
    { StudentID: 7, FirstName: 'Gethin', Surname: 'Ollerton', YearGroup: 11, House: 'Lovelace', Merits: 74 },
    { StudentID: 8, FirstName: 'Hana', Surname: 'Silvers', YearGroup: 10, House: 'Turing', Merits: 58 },
    { StudentID: 9, FirstName: 'Idris', Surname: 'Callow', YearGroup: 9, House: 'Berners-Lee', Merits: 20 },
    { StudentID: 10, FirstName: 'Jools', Surname: 'Fenwick', YearGroup: 11, House: 'Hopper', Merits: 65 },
    { StudentID: 11, FirstName: 'Kira', Surname: 'Ostrander', YearGroup: 10, House: 'Lovelace', Merits: 40 },
    { StudentID: 12, FirstName: 'Leo', Surname: 'Bramwell', YearGroup: 9, House: 'Turing', Merits: 95 },
  ];

  const BOOKS_COLS = ['BookID', 'Title', 'Author', 'Genre', 'Price', 'Year'];
  const STUDENTS_COLS = ['StudentID', 'FirstName', 'Surname', 'YearGroup', 'House', 'Merits'];

  const SQL_CDN_BASE = 'https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/';

  function sqlLiteral(v) {
    if (typeof v === 'number') return String(v);
    return "'" + String(v).replace(/'/g, "''") + "'";
  }

  function buildSeedSql() {
    const parts = [];
    parts.push('CREATE TABLE Books (BookID INTEGER, Title TEXT, Author TEXT, Genre TEXT, Price REAL, Year INTEGER);');
    BOOKS.forEach(b => {
      parts.push('INSERT INTO Books VALUES (' + BOOKS_COLS.map(c => sqlLiteral(b[c])).join(', ') + ');');
    });
    parts.push('CREATE TABLE Students (StudentID INTEGER, FirstName TEXT, Surname TEXT, YearGroup INTEGER, House TEXT, Merits INTEGER);');
    STUDENTS.forEach(s => {
      parts.push('INSERT INTO Students VALUES (' + STUDENTS_COLS.map(c => sqlLiteral(s[c])).join(', ') + ');');
    });
    return parts.join('\n');
  }

  // ── Tasks (strictly SELECT / FROM / WHERE — J277 2.2.3 scope) ───────
  const TASKS = [
    { id: 't1', prompt: 'List every book’s title.', solution: 'SELECT Title FROM Books' },
    { id: 't2', prompt: "Show the title and author of every book in the 'Horror' genre.", solution: "SELECT Title, Author FROM Books WHERE Genre = 'Horror'" },
    { id: 't3', prompt: 'Show all details of every book published after the year 2015.', solution: 'SELECT * FROM Books WHERE Year > 2015' },
    { id: 't4', prompt: 'Show the first name and surname of every Year 10 student with more than 50 merits.', solution: 'SELECT FirstName, Surname FROM Students WHERE YearGroup = 10 AND Merits > 50' },
    { id: 't5', prompt: "Without using OR, show all details of every student who is NOT in 'Turing' house and NOT in 'Lovelace' house.", solution: "SELECT * FROM Students WHERE House != 'Turing' AND House != 'Lovelace'", noOrHint: true },
    { id: 't6', prompt: "Show the titles of books priced under £6.00 that are not in the 'Comedy' genre.", solution: "SELECT Title FROM Books WHERE Price < 6 AND Genre != 'Comedy'" },
    { id: 't7', prompt: 'Show the StudentID and Surname of every student in Year 9 or Year 11.', solution: 'SELECT StudentID, Surname FROM Students WHERE YearGroup = 9 OR YearGroup = 11' },
    { id: 't8', prompt: "Show all details of every Fantasy or Sci-Fi book priced at £7.00 or more.", solution: "SELECT * FROM Books WHERE (Genre = 'Fantasy' OR Genre = 'Sci-Fi') AND Price >= 7" },
    { id: 't9', prompt: 'Show the House and Merits of the student (or students) with exactly 100 merits.', solution: 'SELECT House, Merits FROM Students WHERE Merits = 100' },
    { id: 't10', prompt: 'Free query: write your own SELECT statement on Books or Students. Try your own WHERE condition and see what comes back.', solution: null },
  ];

  // ── Pure helpers (unit-tested under Node) ────────────────────────────
  function normCellValue(v) {
    if (v === null || v === undefined) return 'NULL';
    return typeof v === 'number' ? v : String(v);
  }

  function rowKey(row) { return JSON.stringify(row.map(normCellValue)); }

  // Column order must match; row order is ignored (multiset compare).
  function sameResultSet(a, b) {
    if (!a || !b || !Array.isArray(a.columns) || !Array.isArray(b.columns)) return false;
    if (a.columns.length !== b.columns.length) return false;
    for (let i = 0; i < a.columns.length; i++) {
      if (a.columns[i] !== b.columns[i]) return false;
    }
    if (a.values.length !== b.values.length) return false;
    const ka = a.values.map(rowKey).sort();
    const kb = b.values.map(rowKey).sort();
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
    }
    return true;
  }

  // Read-only guard: only a single SELECT statement is allowed.
  function guardQuery(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return { ok: false, msg: 'Type a query first.' };
    const stripped = trimmed.replace(/;\s*$/, '');
    if (stripped.indexOf(';') !== -1) {
      return { ok: false, msg: 'Only one SELECT statement at a time — remove the extra semicolon(s).' };
    }
    if (!/^select\b/i.test(stripped)) {
      return { ok: false, msg: 'This lab is read-only — your query must start with SELECT (this topic only needs SELECT, FROM and WHERE).' };
    }
    if (/\b(insert|update|delete|drop|alter|attach|detach|pragma|create|replace|vacuum|into)\b/i.test(stripped)) {
      return { ok: false, msg: 'This lab is read-only — only SELECT … FROM … WHERE queries are allowed.' };
    }
    return { ok: true, sql: stripped };
  }

  // ── sql.js lazy loader ────────────────────────────────────────────
  let _sqlJsLoadPromise = null;
  function loadSqlJsLibrary() {
    if (_sqlJsLoadPromise) return _sqlJsLoadPromise;
    _sqlJsLoadPromise = new Promise((resolve, reject) => {
      if (global.initSqlJs) { resolve(global.initSqlJs); return; }
      const s = global.document.createElement('script');
      s.src = SQL_CDN_BASE + 'sql-wasm.js';
      s.onload = () => {
        if (global.initSqlJs) resolve(global.initSqlJs);
        else reject(new Error('sql.js loaded but initSqlJs was not found on window'));
      };
      s.onerror = () => { _sqlJsLoadPromise = null; reject(new Error('sql.js failed to load from the CDN')); };
      global.document.head.appendChild(s);
    });
    return _sqlJsLoadPromise;
  }

  // ── DOM building helpers (textContent only — a crafted SELECT can
  //    return arbitrary literal strings, so results must never go
  //    through innerHTML) ───────────────────────────────────────────
  function el(tag, cls, text) {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderSchemaPanel(container) {
    const wrap = el('div', 'cslab-sql-schema');
    [
      ['Books', BOOKS, BOOKS_COLS],
      ['Students', STUDENTS, STUDENTS_COLS],
    ].forEach(([name, rows, cols]) => {
      const det = global.document.createElement('details');
      det.className = 'cslab-sql-table-info';
      const sum = el('summary', null, name + '  (' + cols.join(', ') + ')');
      det.appendChild(sum);
      const table = el('table', 'cslab-sql-sample');
      const thead = global.document.createElement('thead');
      const htr = global.document.createElement('tr');
      cols.forEach(c => htr.appendChild(el('th', null, c)));
      thead.appendChild(htr);
      table.appendChild(thead);
      const tbody = global.document.createElement('tbody');
      rows.slice(0, 3).forEach(r => {
        const tr = global.document.createElement('tr');
        cols.forEach(c => tr.appendChild(el('td', null, String(r[c]))));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      det.appendChild(table);
      const note = el('p', 'cslab-sql-schema-note', '(showing 3 of ' + rows.length + ' rows)');
      det.appendChild(note);
      wrap.appendChild(det);
    });
    container.appendChild(wrap);
  }

  function renderResultTable(container, result) {
    container.innerHTML = '';
    if (!result || !result.columns || !result.columns.length) {
      container.appendChild(el('p', 'cslab-sql-empty', 'No rows returned.'));
      return;
    }
    const table = el('table', 'cslab-sql-result');
    const thead = global.document.createElement('thead');
    const htr = global.document.createElement('tr');
    result.columns.forEach(c => htr.appendChild(el('th', null, c)));
    thead.appendChild(htr);
    table.appendChild(thead);
    const tbody = global.document.createElement('tbody');
    const CAP = 50;
    result.values.slice(0, CAP).forEach(row => {
      const tr = global.document.createElement('tr');
      row.forEach(v => tr.appendChild(el('td', null, v === null ? 'NULL' : String(v))));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    if (result.values.length > CAP) {
      container.appendChild(el('p', 'cslab-sql-schema-note', 'Showing first ' + CAP + ' of ' + result.values.length + ' rows.'));
    } else if (result.values.length === 0) {
      container.appendChild(el('p', 'cslab-sql-empty', 'Query ran fine — no rows matched.'));
    }
  }

  // ── Style (injected once) ─────────────────────────────────────────
  function injectStyle() {
    if (global.document.getElementById('cslab-sql-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-sql-style';
    style.textContent = [
      '.cslab-sql-intro { color: var(--mid); font-size: 14px; margin: 0 0 12px; }',
      '.cslab-sql-start { margin-bottom: 16px; }',
      '.cslab-sql-schema { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }',
      '.cslab-sql-table-info { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }',
      '.cslab-sql-table-info summary { cursor: pointer; font-weight: 600; color: var(--ink); }',
      '.cslab-sql-sample, .cslab-sql-result { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 13px; overflow-x: auto; display: block; }',
      '.cslab-sql-sample th, .cslab-sql-sample td, .cslab-sql-result th, .cslab-sql-result td { border: 1px solid var(--border); padding: 5px 9px; text-align: left; white-space: nowrap; }',
      '.cslab-sql-sample thead, .cslab-sql-result thead { background: var(--cream); }',
      '.cslab-sql-result { display: table; }',
      '.cslab-sql-result-wrap { overflow-x: auto; }',
      '.cslab-sql-schema-note, .cslab-sql-empty { color: var(--mid); font-size: 12px; margin: 6px 0 0; }',
      '.cslab-sql-tasks { display: flex; flex-direction: column; gap: 16px; }',
      '.cslab-sql-task { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; position: relative; }',
      '.cslab-sql-task.solved { border-color: var(--success); }',
      '.cslab-sql-task-badge { display: none; position: absolute; top: 12px; right: 14px; font-size: 11px; font-weight: 600; color: var(--success); }',
      '.cslab-sql-task.solved .cslab-sql-task-badge { display: block; }',
      '.cslab-sql-task-prompt { font-weight: 600; margin: 0 0 10px; padding-right: 70px; }',
      '.cslab-sql-task textarea.cslab-code { min-height: 70px; margin-bottom: 8px; }',
      '.cslab-sql-task-controls { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ── Mount ────────────────────────────────────────────────────────
  function markTaskSolved(task, ctx, card, badge) {
    const solved = ctx.store.get('solved', []);
    if (solved.indexOf(task.id) !== -1) return;
    solved.push(task.id);
    ctx.store.set('solved', solved);
    ctx.complete({ task: task.id });
    card.classList.add('solved');
  }

  function runTask(task, rawQuery, db, resultArea, feedbackEl, ctx, card) {
    ctx.store.set('query_' + task.id, rawQuery);
    const guard = guardQuery(rawQuery);
    resultArea.innerHTML = '';
    if (!guard.ok) {
      ctx.ui.feedback(feedbackEl, false, guard.msg);
      return;
    }
    let result;
    try {
      const res = db.exec(guard.sql);
      result = res[0] || { columns: [], values: [] };
    } catch (e) {
      ctx.ui.feedback(feedbackEl, false, 'SQL error: ' + e.message);
      return;
    }
    renderResultTable(resultArea, result);

    if (task.solution) {
      let expected;
      try {
        const eres = db.exec(task.solution);
        expected = eres[0] || { columns: [], values: [] };
      } catch (e) {
        expected = { columns: [], values: [] };
      }
      const correct = sameResultSet(result, expected);
      if (correct) {
        let msg = '✓ Correct — ' + result.values.length + ' row(s) match.';
        if (task.noOrHint && /\bor\b/i.test(guard.sql)) {
          msg += ' (You used OR and still got the right rows here — double-check that’s not a coincidence on this data.)';
        }
        ctx.ui.feedback(feedbackEl, true, msg);
        markTaskSolved(task, ctx, card);
      } else {
        let msg = 'Not quite — check your columns and WHERE condition, then run again.';
        if (task.noOrHint && /\bor\b/i.test(guard.sql)) {
          msg += ' Tip: try two AND conditions instead of OR.';
        }
        ctx.ui.feedback(feedbackEl, false, msg);
      }
    } else {
      ctx.ui.feedback(feedbackEl, true, 'Query ran successfully — nice exploring!');
      markTaskSolved(task, ctx, card);
    }
  }

  function buildTasksList(container, ctx, db) {
    const solved = ctx.store.get('solved', []);
    const list = el('div', 'cslab-sql-tasks');
    TASKS.forEach((task, idx) => {
      const card = el('div', 'cslab-sql-task');
      if (solved.indexOf(task.id) !== -1) card.classList.add('solved');
      card.appendChild(el('span', 'cslab-sql-task-badge', '✓ solved'));
      card.appendChild(el('p', 'cslab-sql-task-prompt', (idx + 1) + '. ' + task.prompt));

      const textarea = global.document.createElement('textarea');
      textarea.className = 'cslab-code';
      textarea.spellcheck = false;
      textarea.value = ctx.store.get('query_' + task.id, '');
      card.appendChild(textarea);

      const controls = el('div', 'cslab-sql-task-controls');
      const runBtn = ctx.ui.btn('Run query');
      controls.appendChild(runBtn);
      card.appendChild(controls);

      const feedback = el('p', 'cslab-feedback');
      card.appendChild(feedback);

      const resultArea = el('div', 'cslab-sql-result-wrap');
      card.appendChild(resultArea);

      runBtn.addEventListener('click', () => {
        runTask(task, textarea.value, db, resultArea, feedback, ctx, card);
      });

      list.appendChild(card);
    });
    container.appendChild(list);
  }

  function mountSqlLab(el0, ctx) {
    injectStyle();

    const wrap = global.document.createElement('div');
    wrap.className = 'cslab-sql';
    el0.appendChild(wrap);

    wrap.appendChild(el('p', 'cslab-sql-intro',
      'This lab is read-only: every query must be a SELECT statement using FROM and WHERE. ' +
      'Explore the two tables below, then work through the tasks — your queries save automatically.'));

    renderSchemaPanel(wrap);

    const startArea = el('div', 'cslab-sql-start');
    const startBtn = ctx.ui.btn('▶ Start SQL Lab');
    startArea.appendChild(startBtn);
    wrap.appendChild(startArea);

    const labBody = global.document.createElement('div');
    labBody.style.display = 'none';
    wrap.appendChild(labBody);

    startBtn.addEventListener('click', () => {
      startBtn.disabled = true;
      const loadingMsg = el('p', 'cslab-loading', 'Loading the SQL engine (sql.js)…');
      startArea.appendChild(loadingMsg);

      loadSqlJsLibrary()
        .then(initSqlJs => initSqlJs({ locateFile: f => SQL_CDN_BASE + f }))
        .then(SQL => {
          const db = new SQL.Database();
          db.run(buildSeedSql());
          startArea.style.display = 'none';
          labBody.style.display = '';
          buildTasksList(labBody, ctx, db);
        })
        .catch(err => {
          console.error('[sql-lab]', err);
          loadingMsg.remove();
          startArea.appendChild(el('p', 'cslab-error',
            '⚠️ Could not load the SQL engine from the CDN. This can happen on some school ' +
            'networks — try again in a moment, or ask your teacher to check that cdn.jsdelivr.net is allowed.'));
          startBtn.disabled = false;
        });
    });
  }

  if (global && global.CsLab) {
    global.CsLab.registerTool('sql-lab', {
      title: 'SQL Lab',
      icon: '🗃️',
      mount: mountSqlLab,
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sameResultSet, guardQuery, buildSeedSql, TASKS, BOOKS, STUDENTS };
  }
})(typeof window !== 'undefined' ? window : this);
