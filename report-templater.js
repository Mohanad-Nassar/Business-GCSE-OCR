// ══════════════════════════════════════════════════════════════
// REPORT TEMPLATER — deterministic, NO AI. Pure functions over the
// get_student_report / get_class_report_batch jsonb (docs/REPORT-WRITER-PLAN.md
// §6). Same input → same words, every time. Loaded as a plain <script> on
// report.html (attaches to window) and require()-able for node tests.
//
// FAIRNESS FIRST (owner's explicit requirement, memory architecture-scale-
// security): lead with effort + strengths + growth; frame weak areas as
// "next steps", never a wall of red. A low-activity or struggling student's
// report must still read as specific and encouraging. Two hard rules enforce
// this and are unit-tested:
//   1. Below MIN_ACTIVITY answered questions, accuracy verdicts are suppressed
//      entirely — a "getting started" template runs instead.
//   2. When any strength exists, the report never lists MORE next-steps than
//      strengths (no red-heavy page).
//
// The `audience` flag gates the teacher-only block: the 'parent' branch never
// emits misconceptions / effort-vs-accuracy / percentile prose.
// ══════════════════════════════════════════════════════════════
(function (root) {
  'use strict';

  // ── Tunable thresholds (single place so a school could adjust) ──
  var MIN_ACTIVITY = 15;   // graded+practice answers below which accuracy is not judged
  var MIN_GROUP    = 5;    // graded answers a group needs before it can be a strength / next-step
  var MAX_ITEMS    = 3;    // cap on strengths and on next-steps

  // ── Small helpers ──
  function pct(n) { return (n === null || n === undefined) ? null : Math.round(n); }
  function has(n) { return n !== null && n !== undefined; }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  // Flatten a PAGE_GROUPS subtree's pages (business 2.4 nests children) into a
  // flat [{id}] list so every leaf page maps to its top-level group.
  function flatPages(group) {
    var out = [];
    (group.pages || []).forEach(function (p) {
      out.push(p);
      (p.children || []).forEach(function (c) { out.push(c); });
    });
    return out;
  }

  // page_id → { groupId, groupTitle } map from PAGE_GROUPS (one subject's tree).
  function pageToGroup(pageGroups) {
    var map = {};
    (pageGroups || []).forEach(function (g) {
      flatPages(g).forEach(function (p) { map[p.id] = { groupId: g.id, groupTitle: g.title }; });
    });
    return map;
  }

  // Fold the RPC's per-page topics[] into per-group aggregates. Pure arithmetic
  // over server numbers — the client does the grouping, never the accuracy.
  function foldGroups(report, pageGroups) {
    var map = pageToGroup(pageGroups);
    var by = {};
    (report.topics || []).forEach(function (t) {
      var g = map[t.page_id];
      if (!g) return; // page not in this subject's tree (defensive)
      var row = by[g.groupId] || (by[g.groupId] = {
        groupId: g.groupId, groupTitle: g.groupTitle,
        graded_answered: 0, graded_correct: 0, practice_answered: 0,
        mastered: 0, bank_total: 0, prev_graded_answered: 0, prev_graded_correct: 0
      });
      row.graded_answered += t.graded_answered || 0;
      row.graded_correct  += t.graded_correct || 0;
      row.practice_answered += t.practice_answered || 0;
      row.mastered += t.mastered || 0;
      row.bank_total += t.bank_total || 0;
      row.prev_graded_answered += t.prev_graded_answered || 0;
      // prev_graded_accuracy_pct is per-page; reconstruct prev correct for a fair group prev.
      if (has(t.prev_graded_accuracy_pct) && t.prev_graded_answered) {
        row.prev_graded_correct += Math.round(t.prev_graded_answered * t.prev_graded_accuracy_pct / 100);
      }
    });
    return Object.keys(by).map(function (k) {
      var r = by[k];
      r.graded_accuracy = r.graded_answered ? (100 * r.graded_correct / r.graded_answered) : null;
      r.prev_graded_accuracy = r.prev_graded_answered ? (100 * r.prev_graded_correct / r.prev_graded_answered) : null;
      r.improvement = (has(r.graded_accuracy) && has(r.prev_graded_accuracy))
        ? r.graded_accuracy - r.prev_graded_accuracy : null;
      return r;
    });
  }

  // Trend verdict from window-vs-previous graded accuracy + new masteries.
  function trendVerdict(report) {
    var h = report.headline || {};
    var cur = h.graded_accuracy_pct, prev = (report.prev || {}).graded_accuracy_pct;
    var newMastery = h.mastered_window || 0;
    if (!has(cur) && newMastery === 0) return { label: 'Getting started', tone: 'neutral' };
    var delta = (has(cur) && has(prev)) ? cur - prev : null;
    if (delta !== null && delta >= 5) return { label: 'Improving', tone: 'good' };
    if (delta !== null && delta <= -8) return { label: 'Needs a nudge', tone: 'watch' };
    if (newMastery >= 5 && (delta === null || delta > -8)) return { label: 'Improving', tone: 'good' };
    return { label: 'Steady', tone: 'neutral' };
  }

  // TEACHER-ONLY: effort-vs-accuracy quadrant flag. Never called for parents.
  function effortAccuracyFlag(report) {
    var h = report.headline || {};
    var busy = (h.attempts || 0) >= MIN_ACTIVITY;
    var acc = h.graded_accuracy_pct;
    if (!busy) return { code: 'low-effort', text: 'Low activity so far — the priority is building a regular habit before reading much into accuracy.' };
    if (has(acc) && acc < 55) return { code: 'high-effort-low-acc', text: 'Putting in the work but accuracy is lagging — a good candidate for re-teaching the weak topics below rather than more practice alone.' };
    if (has(acc) && acc >= 80) return { code: 'secure', text: 'Working hard and scoring well — ready for stretch or exam-style questions.' };
    return { code: 'on-track', text: 'Engaged and progressing at a typical rate.' };
  }

  // ── Main prose builder ──
  // opts: { audience: 'parent'|'teacher', name: string, pageGroups: [...] }
  function buildProse(report, opts) {
    opts = opts || {};
    var audience = opts.audience === 'teacher' ? 'teacher' : 'parent';
    var name = opts.name || 'This student';
    var h = report.headline || {};
    var window = windowLabel(report);
    var groups = foldGroups(report, opts.pageGroups);

    var out = {
      verdict: trendVerdict(report),
      opening: '',
      strengths: [],
      growth: [],
      nextSteps: [],
      effortNote: null,
      caveat: 'Practice-mode accuracy reflects self-checked answers; graded figures come from Daily-Revise questions marked by Vidya.'
    };

    // Opening ALWAYS leads with effort/engagement, not accuracy.
    var attempts = h.attempts || 0;
    var days = h.active_days || 0;
    var mastered = h.mastered_window || 0;
    out.opening = name + ' answered ' + attempts + ' ' + plural(attempts, 'question')
      + ' across ' + days + ' active ' + plural(days, 'day') + ' this ' + window
      + (mastered > 0 ? ', mastering ' + mastered + ' new ' + plural(mastered, 'question') + '.' : '.');

    // ── Low-activity guard: suppress accuracy verdicts, encourage. ──
    if (attempts < MIN_ACTIVITY) {
      out.opening = name + ' is just getting started this ' + window + ' — '
        + attempts + ' ' + plural(attempts, 'question') + ' answered so far'
        + (mastered > 0 ? ' and ' + mastered + ' already mastered' : '') + '.';
      var toTry = groups.filter(function (g) { return g.bank_total > g.mastered; })
        .sort(function (a, b) { return (b.bank_total - b.mastered) - (a.bank_total - a.mastered); })
        .slice(0, MAX_ITEMS);
      out.nextSteps = toTry.map(function (g) {
        return 'A few minutes of Daily-Revise on ' + g.groupTitle + ' would be a great first step ('
          + g.mastered + '/' + g.bank_total + ' mastered so far).';
      });
      if (audience === 'teacher') out.effortNote = effortAccuracyFlag(report).text;
      return out;
    }

    // ── Strengths: top groups by graded accuracy OR improvement (with enough data). ──
    var rated = groups.filter(function (g) { return g.graded_answered >= MIN_GROUP && has(g.graded_accuracy); });
    var strong = rated.slice().sort(function (a, b) { return b.graded_accuracy - a.graded_accuracy; })
      .filter(function (g) { return g.graded_accuracy >= 65; }).slice(0, MAX_ITEMS);
    out.strengths = strong.map(function (g) {
      return g.groupTitle + ' is a strong area — ' + pct(g.graded_accuracy) + '% correct'
        + (g.mastered ? ' with ' + g.mastered + ' ' + plural(g.mastered, 'question') + ' mastered' : '') + '.';
    });

    // ── Growth: any group/metric up vs previous window is celebrated explicitly. ──
    var improved = rated.filter(function (g) { return has(g.improvement) && g.improvement >= 5; })
      .sort(function (a, b) { return b.improvement - a.improvement; }).slice(0, MAX_ITEMS);
    out.growth = improved.map(function (g) {
      return g.groupTitle + ' is up from ' + pct(g.prev_graded_accuracy) + '% to ' + pct(g.graded_accuracy) + '%.';
    });
    var mv = report.headline.mastery_velocity_per_week;
    if (has(mv) && mv >= 1) out.growth.push('Mastering about ' + (Math.round(mv * 10) / 10) + ' new questions a week.');

    // ── Next steps: lowest-accuracy groups with enough data, framed as actions. ──
    var weak = rated.slice().sort(function (a, b) { return a.graded_accuracy - b.graded_accuracy; })
      .filter(function (g) { return g.graded_accuracy < 65; }).slice(0, MAX_ITEMS);
    out.nextSteps = weak.map(function (g) {
      return 'A short Daily-Revise session on ' + g.groupTitle + ' would help — '
        + pct(g.graded_accuracy) + '% so far, ' + g.mastered + '/' + g.bank_total + ' mastered.';
    });
    // Under-practised groups (no graded data yet) → "not started", never a failure.
    if (out.nextSteps.length < MAX_ITEMS) {
      groups.filter(function (g) { return g.graded_answered < MIN_GROUP && g.bank_total > 0; })
        .sort(function (a, b) { return b.bank_total - a.bank_total; })
        .slice(0, MAX_ITEMS - out.nextSteps.length)
        .forEach(function (g) { out.nextSteps.push(g.groupTitle + ' hasn’t been practised much yet — worth a first look.'); });
    }

    // FAIRNESS RULE 2: never more next-steps than strengths when strengths exist.
    if (out.strengths.length > 0 && out.nextSteps.length > out.strengths.length) {
      out.nextSteps = out.nextSteps.slice(0, out.strengths.length);
    }

    if (audience === 'teacher') out.effortNote = effortAccuracyFlag(report).text;
    return out;
  }

  function windowLabel(report) {
    var m = report.meta || {};
    if (!m.from) return 'period';
    var from = new Date(m.from), to = new Date(m.to || Date.now());
    if (from.getFullYear() <= 1971) return 'year';
    var days = Math.round((to - from) / 86400000);
    if (days <= 31) return 'month';
    if (days <= 100) return 'term';
    return 'period';
  }

  // Class-level: rank each student by graded accuracy for the teacher percentile
  // (teacher-only; derived from the batch, which holds every classmate).
  function classPercentiles(batch) {
    var reports = batch.reports || {};
    var rows = Object.keys(reports).map(function (id) {
      var acc = ((reports[id].headline || {}).graded_accuracy_pct);
      return { id: id, acc: has(acc) ? acc : -1 };
    }).filter(function (r) { return r.acc >= 0; });
    rows.sort(function (a, b) { return a.acc - b.acc; });
    var n = rows.length, out = {};
    rows.forEach(function (r, i) { out[r.id] = { percentile: n > 1 ? Math.round(100 * i / (n - 1)) : 100, n: n }; });
    return out;
  }

  var api = {
    foldGroups: foldGroups, trendVerdict: trendVerdict, buildProse: buildProse,
    effortAccuracyFlag: effortAccuracyFlag, classPercentiles: classPercentiles,
    _config: { MIN_ACTIVITY: MIN_ACTIVITY, MIN_GROUP: MIN_GROUP, MAX_ITEMS: MAX_ITEMS }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReportTemplater = api;
})(typeof window !== 'undefined' ? window : this);
