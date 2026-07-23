#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// Builds subjects/spanish/vocab-bank.js (window.VOCAB_BANK, TRACKED —
// resources/ is gitignored so this is what ships to students) from the
// topic-mapped wordbank the owner supplied:
//   resources/spanish/wordbank/spanish-vocab-bytopic/sp_vocab_bank.json
//     — one row per word, already includes {topics: [{topic, theme}]}
//
// This SUPERSEDES tools/parse_spanish_vocab.py as the source of
// subjects/spanish/vocab-bank.js (that script's own _emit_js_bank call was
// removed to avoid two scripts fighting over the same output file — it
// still produces the raw PDF-extracted JSON for reference/rank lookup).
//
// sp_vocab_bank.json is NOT independently PDF-verified the way the old
// extraction was (spot-checks found ~8 words with no match anywhere in the
// actual AQA PDF, plus a handful of dropped word-senses) — the owner chose
// to use it anyway for its topic coverage. `rank` (frequency) has no
// equivalent in the new file, so it's backfilled here by matching headword
// against the OLD PDF-verified wordbank purely as a supplementary sort
// key — rank is never used to validate or gate content, only to order the
// Word Browser, so a best-effort match is fine; words with no match get
// rank=null (sort last, same as before).
// ══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const NEW_BANK_PATH = path.join(REPO_ROOT, 'resources', 'spanish', 'wordbank', 'spanish-vocab-bytopic', 'sp_vocab_bank.json');
const OLD_RANK_SOURCE_PATH = path.join(REPO_ROOT, 'resources', 'spanish', 'wordbank', 'spanish-vocab.json');
const OUT_PATH = path.join(REPO_ROOT, 'subjects', 'spanish', 'vocab-bank.js');

function main() {
  const newBank = JSON.parse(fs.readFileSync(NEW_BANK_PATH, 'utf8'));

  let rankByHeadword = new Map();
  if (fs.existsSync(OLD_RANK_SOURCE_PATH)) {
    const old = JSON.parse(fs.readFileSync(OLD_RANK_SOURCE_PATH, 'utf8'));
    old.entries.forEach(e => {
      if (e.rank != null && !rankByHeadword.has(e.headword)) rankByHeadword.set(e.headword, e.rank);
    });
  } else {
    console.warn('No old wordbank found for rank backfill — every word will have rank=null.');
  }

  const EXAM_TIER_LABEL = { foundation_higher: 'F/H', higher_only: 'H' };
  let unknownExamTier = 0;

  const entries = newBank.map(e => {
    const tierLabel = EXAM_TIER_LABEL[e.exam_tier];
    if (!tierLabel) unknownExamTier++;
    return {
      id: e.id,
      pos: e.pos,
      headword: e.headword,
      english: e.english,
      selection: e.tier, // 'required' | 'other' — the new file's simplified selection code
      tierLabel: tierLabel || 'F/H',
      topics: e.topics.map(t => t.topic),
      rank: rankByHeadword.has(e.headword) ? rankByHeadword.get(e.headword) : null,
    };
  });

  if (unknownExamTier > 0) {
    console.error(`${unknownExamTier} entries had an exam_tier value other than foundation_higher/higher_only — check sp_vocab_bank.json.`);
    process.exit(1);
  }

  const withRank = entries.filter(e => e.rank != null).length;
  console.log(`Rank backfilled for ${withRank}/${entries.length} words from the old PDF-verified wordbank.`);

  const header =
    '// ══════════════════════════════════════════════════════════════\n' +
    '// SPANISH VOCAB BANK — GENERATED FILE, DO NOT EDIT BY HAND\n' +
    '// Built by tools/build_vocab_bank_by_topic.js from the owner-supplied\n' +
    '// resources/spanish/wordbank/spanish-vocab-bytopic/sp_vocab_bank.json\n' +
    '// (topic-mapped; NOT independently PDF-verified — see that tool\'s\n' +
    '// header comment for the known discrepancies). Regenerate after an\n' +
    '// update to the source file:\n' +
    '//     node tools/build_vocab_bank_by_topic.js\n' +
    `// Generated: ${new Date().toISOString()} · ${entries.length} entries\n` +
    '// ══════════════════════════════════════════════════════════════\n';
  const body = 'window.VOCAB_BANK = ' + JSON.stringify(entries, null, 1) + ';\n';
  fs.writeFileSync(OUT_PATH, header + body, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`);
}

main();
