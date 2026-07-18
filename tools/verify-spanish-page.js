#!/usr/bin/env node
/* verify-spanish-page.js — structural + option-quality gate for a Spanish topic page.
 * Usage:  node tools/verify-spanish-page.js subjects/spanish/<page>.html
 * Checks (SPANISH-CONTENT-PLAN.md §8.5 + docs/QUESTION-AUTHORING.md):
 *   1. the inline data <script> parses;
 *   2. array contracts: mcq opts=4 + ans in range; every readCheck (topics/misc/tips)
 *      is {q,opts[4],ans,explain}; tf answers boolean; examTips have pills;
 *      FIB blank keys match the _____ count; exam markPoints sum to q.marks;
 *   3. LENGTH-TELL audit — the correct answer must NOT be the unique longest option,
 *      and every item must have >=1 distractor of equal-or-greater length;
 *   4. audio sanity: every data-say is non-empty; accented Spanish present.
 * Exits non-zero (with a list) on any failure. */
const fs = require('fs'), vm = require('vm');

const page = process.argv[2];
if (!page) { console.error('usage: node tools/verify-spanish-page.js <page.html>'); process.exit(2); }
const html = fs.readFileSync(page, 'utf8');
const block = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(b => b.includes('const pageMeta'));
if (!block) { console.error('FAIL: no inline data <script> with pageMeta found'); process.exit(1); }

const ctx = {}; vm.createContext(ctx);
try {
  vm.runInContext(block + '\n;Object.assign(this,{pageMeta,topics,mcqData,matchData,fibData,fibWords,tfData,miscData,examTips,flashcards,examQuestions});', ctx);
} catch (e) { console.error('FAIL: inline data does not parse —', e.message); process.exit(1); }

const errs = [], chk = (c, m) => { if (!c) errs.push(m); };
const strip = s => String(s).replace(/<[^>]*>/g, '').trim();

// ---- contract ----
ctx.mcqData.forEach((q, i) => { chk(q.opts.length === 4, `mcq[${i}] opts!=4`); chk(q.ans >= 0 && q.ans < 4, `mcq[${i}] ans out of range`); });
const rc = (o, tag) => { if (!o) return; chk(o.q, `${tag} readCheck.q missing`); chk(Array.isArray(o.opts) && o.opts.length === 4, `${tag} readCheck opts!=4`); chk(o.ans >= 0 && o.ans < 4, `${tag} readCheck ans out of range`); };
ctx.topics.forEach((t, i) => rc(t.readCheck, `topic[${i}]`));
ctx.miscData.forEach((m, i) => { rc(m.readCheck, `misc[${i}]`); chk(m.wrong && m.correct, `misc[${i}] wrong/correct missing`); });
ctx.examTips.forEach((t, i) => { rc(t.readCheck, `tip[${i}]`); chk(Array.isArray(t.pills), `tip[${i}] pills missing (renderer crashes)`); });
ctx.tfData.forEach((t, i) => chk(typeof t.answer === 'boolean', `tf[${i}] answer not boolean`));
ctx.fibData.forEach((f, i) => { const n = (f.display.match(/_____/g) || []).length, k = Object.keys(f.blanks).length; chk(n === k, `fib[${i}] ${n} _____ vs ${k} keys`); });
ctx.examQuestions.forEach((q, i) => { if (q.markPoints) { const s = q.markPoints.groups.reduce((a, g) => a + g.max, 0); chk(s === q.marks, `examQ[${i}] markPoints ${s}!=marks ${q.marks}`); } });

// ---- length-tell audit ----
function audit(tag, opts, ans) {
  const L = opts.map(o => strip(o).length), cl = L[ans], max = Math.max(...L);
  if (cl === max && L.filter(x => x === max).length === 1) errs.push(`${tag}: correct is the UNIQUE longest option (${cl} vs ${L.join('/')})`);
  else if (!L.some((x, i) => i !== ans && x >= cl)) errs.push(`${tag}: no distractor >= correct length`);
}
ctx.mcqData.forEach((q, i) => audit(`mcq[${i}]`, q.opts, q.ans));
ctx.topics.forEach((t, i) => t.readCheck && audit(`topic[${i}].rc`, t.readCheck.opts, t.readCheck.ans));
ctx.miscData.forEach((m, i) => m.readCheck && audit(`misc[${i}].rc`, m.readCheck.opts, m.readCheck.ans));
ctx.examTips.forEach((t, i) => t.readCheck && audit(`tip[${i}].rc`, t.readCheck.opts, t.readCheck.ans));

// ---- audio sanity ----
const says = [...html.matchAll(/data-say="([^"]*)"/g)].map(m => m[1]);
says.forEach((s, i) => chk(s.trim().length > 0, `empty data-say #${i}`));
chk(/[áéíóúñ¿¡ü]/i.test(says.join(' ')), 'no accented Spanish in any data-say (suspicious)');

const c = ctx;
console.log(`counts: topics=${c.topics.length} mcq=${c.mcqData.length} match=${c.matchData.length} fib=${c.fibData.length} tf=${c.tfData.length} misc=${c.miscData.length} tips=${c.examTips.length} cards=${c.flashcards.length} exam=${c.examQuestions.length} data-say=${says.length}`);
if (errs.length) { console.error(`FAIL (${errs.length}):\n- ` + errs.join('\n- ')); process.exit(1); }
console.log('PASS — contract + length-tell + audio all clean');
