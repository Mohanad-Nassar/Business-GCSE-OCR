// ══════════════════════════════════════════════════════════════
// CUSTOM SUBJECT QUESTION BANK (shared) — turns a teacher-authored
// subject's topics (custom_topics.sections jsonb) into the SAME
// question-bank structures the platform build pipeline generates for
// Business/Economics/CS, so the whole downstream machine works
// unchanged:
//
//  · buildBankEntries()  → question-bank.js-shaped entries (answers
//    inline) for the teacher-only task/worksheet pickers
//    (window.QUESTION_BANK via tasks-shared.js's loadSubjectBank).
//  · buildBankRows()     → bank_questions rows (snapshot / answer_key
//    split, no answers in snapshot) for the
//    sync_teacher_subject_bank() RPC — this is what makes Daily
//    Revise / mastery / analytics work for teacher subjects.
//  · buildGroups()       → window.PAGE_GROUPS-shaped topic tree
//    (hrefs point at /topic.html, the dynamic lesson page).
//  · registerSubject()   → pushes the subject into the runtime
//    registries (window.SUBJECTS / PAGE_GROUPS_ALL / SECTION_TOTALS_ALL)
//    so every existing registry lookup just finds it.
//
// Only auto-gradable questions become bank rows (mcq / tf / fib —
// same rule as tools/build_question_bank.py): quick-fire MCQs, key
// learning + misconception check questions, true/false, fill-in-the-
// blanks, and matching questions generated from the key-term pairs.
// Written exam-practice questions are excluded, exactly like the
// platform's.
//
// Determinism: distractor picks (fib word-banks, matching options)
// are seeded from the question's own id hash, so re-syncing unchanged
// content produces byte-identical rows (no churn in bank_questions).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // FNV-1a 32-bit → 8 hex chars. Stable content-hash for question ids
  // (platform ids use the same idea with a different hash function —
  // only uniqueness + stability within a subject matter).
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }

  // Deterministic PRNG seeded by a question id, for distractor sampling.
  function mulberry32(seed) {
    let a = seed | 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededSample(pool, count, seedStr) {
    const rnd = mulberry32(parseInt(fnv1a(seedStr), 16));
    const copy = pool.slice();
    const out = [];
    while (copy.length && out.length < count) {
      out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
    }
    return out;
  }
  function seededShuffle(list, seedStr) {
    return seededSample(list, list.length, 'shuffle:' + seedStr);
  }

  const on = (S, k) => !!(S && S[k] && S[k].enabled !== false);

  // ── The unified extraction: one object per gradable question ──
  // { id, pageId, pageName, source, qtype, marks,
  //   snapshot: {…student-visible…}, key: {…answers…} }
  function extractQuestions(subject, topicRows) {
    const out = [];
    const slug = subject.slug;

    // Subject-wide fib answer pool (distractors come from sibling blanks,
    // same as the platform build).
    const fibPool = [];
    topicRows.forEach(t => {
      const S = t.sections || {};
      if (!on(S, 'fib')) return;
      (S.fib.questions || []).forEach(q => {
        (String(q.text || '').match(/\[([^\[\]]+)\]/g) || []).forEach(m => {
          const w = m.slice(1, -1).trim();
          if (w && fibPool.indexOf(w) === -1) fibPool.push(w);
        });
      });
    });

    topicRows.forEach(t => {
      const S = t.sections || {};
      const pageId = slug + ':' + t.slug;
      const pageName = t.title;
      const idFor = (source, content) => pageId + ':' + source + ':' + fnv1a(source + '|' + content);
      const push = q => out.push(q);

      const checkQuestion = (source, check, reading, readingTitle) => {
        if (!check || !check.question || !(check.options || []).length) return;
        const id = idFor(source, check.question + '|' + check.options.join('|') + '|' + check.answer);
        push({
          id, pageId, pageName, source, qtype: 'mcq', marks: 1,
          snapshot: Object.assign(
            { question: check.question, options: check.options.slice() },
            reading ? { reading, readingTitle: readingTitle || '' } : {}
          ),
          key: { answer: check.answer | 0, explain: check.explain || '' },
        });
      };

      // The lesson-notes quick check (reading.check) is a 'learn'-source
      // question, so it joins Key Learning in Tasks / Daily Revise and gives
      // "one question at a time" mode something to answer on the notes card.
      if (on(S, 'reading') && S.reading.check)
        checkQuestion('learn', S.reading.check, S.reading.html || '', 'Lesson notes');

      if (on(S, 'learn')) (S.learn.items || []).forEach(it =>
        checkQuestion('learn', it.check, it.html || '', it.title || ''));

      if (on(S, 'misc')) (S.misc.items || []).forEach(it => {
        const reading =
          '<p><strong>❌ Common misconception:</strong> ' + escapeHtml(it.myth || '') + '</p>' +
          '<p><strong>✅ The correct idea:</strong> ' + escapeHtml(it.truth || '') + '</p>';
        if (it.check && it.check.question && (it.check.options || []).length) {
          checkQuestion('misc', it.check, reading, 'Misconception check');
        } else if (it.myth) {
          // No explicit check → make the misconception itself gradable as a
          // True/False (the myth is, by definition, the FALSE statement), so
          // it still reaches Tasks and Daily Revise. The correction becomes
          // the explanation. Teachers who want a richer question add a check.
          push({
            id: idFor('misc', 'tf|' + it.myth), pageId, pageName,
            source: 'misc', qtype: 'tf', marks: 1,
            snapshot: { question: it.myth, reading, readingTitle: 'Misconception check' },
            key: { answer: false, explain: it.truth || '' },
          });
        }
      });

      // Exam-tip check questions (source 'tips', like the platform bank),
      // so a tip's quick check joins Tasks / Daily Revise.
      if (on(S, 'tips')) (S.tips.items || []).forEach(it => {
        if (it.check) checkQuestion('tips', it.check, it.html || '', it.title || 'Exam tip');
      });

      if (on(S, 'mcq')) (S.mcq.questions || []).forEach(q => {
        if (!q.question || !(q.options || []).length) return;
        const id = idFor('mcq', q.question + '|' + q.options.join('|') + '|' + q.answer);
        push({
          id, pageId, pageName, source: 'mcq', qtype: 'mcq', marks: 1,
          snapshot: { question: q.question, options: q.options.slice() },
          key: { answer: q.answer | 0, explain: q.explain || '' },
        });
      });

      if (on(S, 'tf')) (S.tf.questions || []).forEach(q => {
        if (!q.statement) return;
        const id = idFor('tf', q.statement + '|' + q.answer);
        push({
          id, pageId, pageName, source: 'tf', qtype: 'tf', marks: 1,
          snapshot: { question: q.statement },
          key: { answer: !!q.answer, explain: q.explain || '' },
        });
      });

      if (on(S, 'fib')) (S.fib.questions || []).forEach(q => {
        const text = String(q.text || '');
        const answers = [];
        const display = text.replace(/\[([^\[\]]+)\]/g, (m, w) => {
          answers.push(w.trim());
          return '_____';
        });
        if (!answers.length) return;
        const id = idFor('fib', text);
        const blanks = {}, blankOptions = {};
        answers.forEach((w, i) => {
          const k = 'B' + (i + 1);
          blanks[k] = w;
          const distractors = seededSample(fibPool.filter(x => x !== w), 3, id + ':' + k);
          blankOptions[k] = seededShuffle([w].concat(distractors), id + ':' + k);
        });
        push({
          id, pageId, pageName, source: 'fib', qtype: 'fib', marks: answers.length,
          snapshot: { question: display, blankOptions },
          key: { blanks },
        });
      });

      if (on(S, 'terms')) {
        const pairs = (S.terms.pairs || []).filter(p => p.term && p.definition);
        if (pairs.length >= 2) {
          pairs.forEach(p => {
            const id = idFor('match', p.term + '|' + p.definition);
            const others = pairs.filter(x => x.term !== p.term).map(x => x.definition);
            const options = seededShuffle(
              [p.definition].concat(seededSample(others, Math.min(3, others.length), id)), id);
            push({
              id, pageId, pageName, source: 'match', qtype: 'mcq', marks: 1,
              snapshot: { question: 'Which definition matches the key term “' + p.term + '”?', options },
              key: { answer: options.indexOf(p.definition), explain: '“' + p.term + '” means: ' + p.definition },
            });
          });
        }
      }
    });
    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Written exam-practice questions. These are NOT in extractQuestions()
  // (which only yields auto-gradable rows for Daily Revise / bank_questions)
  // but ARE valid Task / Worksheet questions — manually marked, exactly like
  // the platform's 'exam' source. Shape matches the generated
  // question-bank.js exam entries (num, marks, markScheme in key). HTML
  // fields are already sanitised in storage (rich-editor on save/import);
  // plain question text is escaped since the pickers render it as HTML.
  function extractExam(subject, topicRows) {
    const out = [];
    (topicRows || []).forEach(t => {
      const S = t.sections || {};
      if (!on(S, 'exam')) return;
      const pageId = subject.slug + ':' + t.slug;
      (S.exam.questions || []).forEach((q, i) => {
        if (!q.question) return;
        out.push({
          id: pageId + ':exam:' + fnv1a('exam|' + q.question + '|' + i),
          pageId, pageName: t.title, source: 'exam', type: 'written',
          marks: Math.max(1, q.marks | 0), num: 'Q' + (i + 1),
          caseStudy: '', question: escapeHtml(q.question),
          hint: escapeHtml(q.hint || ''), starter: '',
          key: { markScheme: q.markScheme || '', modelAnswer: '' },
        });
      });
    });
    return out;
  }

  // question-bank.js-shaped entries (teacher-only pickers; answers inline).
  // Includes written exam questions so every activity the teacher authored
  // is pickable in Tasks and Worksheets, matching the platform subjects.
  function buildBankEntries(subject, topicRows) {
    const gradable = extractQuestions(subject, topicRows).map(q => Object.assign({
      id: q.id, pageId: q.pageId, pageName: q.pageName,
      source: q.source, type: q.qtype, marks: q.marks,
      key: q.key,
    }, q.snapshot));
    return gradable.concat(extractExam(subject, topicRows));
  }

  // Insert the school-override namespace segment before a question id's trailing
  // hash: `<slug>:<topic>:<source>:<hash>` → `<slug>:<topic>:<source>:ovr:<uuid>:<hash>`.
  // The id's parts never contain ':', so replacing only the final ':<segment>' is
  // exact. This is the ':ovr:<uuid>:' key namespace sync_school_override_bank_srv
  // (subjects-v2-s5-override-sync.sql) requires — the full school uuid with hyphens
  // stripped — so a school's forked questions can never collide with, or overwrite,
  // the platform master rows.
  function namespaceOverrideKey(id, schoolId) {
    const ns = ':ovr:' + String(schoolId).replace(/-/g, '') + ':';
    return id.replace(/:([^:]+)$/, ns + '$1');
  }

  // bank_questions rows for the bank-sync RPCs (snapshot/answer_key split).
  // Default (no options) → teacher-subject rows for sync_teacher_subject_bank,
  // byte-for-byte unchanged. With options.overrideSchoolId set → PLATFORM-OVERRIDE
  // rows for sync_school_override_bank_srv: page_id stays <subject>:<topic_slug>
  // (so progress / mastery merge under the same key), but every question_key is
  // override-namespaced so master and per-school rows never clash.
  function buildBankRows(subject, topicRows, options) {
    const overrideSchoolId = options && options.overrideSchoolId;
    return extractQuestions(subject, topicRows).map(q => ({
      question_key: overrideSchoolId ? namespaceOverrideKey(q.id, overrideSchoolId) : q.id,
      subject_slug: subject.slug,
      page_id: q.pageId, page_name: q.pageName,
      source: q.source, qtype: q.qtype, marks: q.marks,
      snapshot: q.snapshot, answer_key: q.key,
    }));
  }

  // window.PAGE_GROUPS-shaped topic tree, links to the dynamic lesson page.
  function buildGroups(subject, topicRows) {
    const groups = [], byName = new Map();
    (topicRows || []).forEach(r => {
      const key = r.section || 'Topics';
      let g = byName.get(key);
      if (!g) {
        g = {
          id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topics',
          title: key, sub: '', colour: subject.colour, pages: [],
        };
        byName.set(key, g); groups.push(g);
      }
      g.pages.push({
        id: subject.slug + ':' + r.slug, name: r.title, sub: key,
        href: '/topic.html?s=' + encodeURIComponent(subject.slug) + '&t=' + encodeURIComponent(r.slug),
      });
    });
    return groups;
  }

  // Push the subject into the runtime registries so every existing lookup
  // (setActiveSubject, pickers, dashboards) finds it like a platform one.
  function registerSubject(subjectRow, topicRows) {
    const entry = {
      slug: subjectRow.slug, name: subjectRow.name, colour: subjectRow.colour,
      icon: subjectRow.icon, keyStage: subjectRow.key_stage, level: subjectRow.level || '',
      examBoard: subjectRow.exam_board || '', specCode: subjectRow.spec_code || '',
      custom: true,
    };
    window.SUBJECTS = window.SUBJECTS || [];
    const i = window.SUBJECTS.findIndex(s => s.slug === entry.slug);
    if (i >= 0) window.SUBJECTS[i] = entry; else window.SUBJECTS.push(entry);

    window.PAGE_GROUPS_ALL = window.PAGE_GROUPS_ALL || {};
    window.PAGE_GROUPS_ALL[entry.slug] = buildGroups(subjectRow, topicRows);

    // Per-page section totals (dashboards / progress maths).
    window.SECTION_TOTALS_ALL = window.SECTION_TOTALS_ALL || {};
    (topicRows || []).forEach(t => {
      const S = t.sections || {};
      const totals = {};
      const put = (k, n) => { if (n > 0) totals[k] = n; };
      const readingExtra = on(S, 'reading') &&
        (String((S.reading || {}).html || '').replace(/<[^>]+>/g, '').trim() || (S.reading || {}).check) ? 1 : 0;
      put('learn', (on(S, 'learn') ? (S.learn.items || []).length : 0) + readingExtra);
      put('mcq', on(S, 'mcq') ? (S.mcq.questions || []).length : 0);
      put('match', on(S, 'terms') ? (S.terms.pairs || []).length : 0);
      put('fib', on(S, 'fib') ? (S.fib.questions || []).length : 0);
      put('misc', on(S, 'misc') ? (S.misc.items || []).length : 0);
      put('tips', on(S, 'tips') ? (S.tips.items || []).length : 0);
      put('flashcards', on(S, 'terms') ? (S.terms.pairs || []).length : 0);
      put('tf', on(S, 'tf') ? (S.tf.questions || []).length : 0);
      put('exam', on(S, 'exam') ? (S.exam.questions || []).length : 0);
      window.SECTION_TOTALS_ALL[subjectRow.slug + ':' + t.slug] = totals;
    });
    return entry;
  }

  window.CustomBank = {
    buildBankEntries, buildBankRows, buildGroups, registerSubject, extractQuestions,
  };
})();
