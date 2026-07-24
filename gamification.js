// ══════════════════════════════════════════════════════════════
// GAMIFICATION — XP, levels, badges, streaks, combos, sound effects.
// Included on topic pages (after script.js + section-totals.js +
// progress-shared.js), on index.html and on both dashboards. On topic
// pages it also injects a persistent HUD (level/XP/streak/badges + this
// topic's progress), prev/next topic navigation and a one-time
// topic-complete confetti celebration; on index.html it injects the
// hero HUD and per-card progress footers — see the sections at the
// bottom of this file.
//
// XP/levels/badges are pure functions over progress data (see the header
// note in supabase/gamification-functions.sql for why) — nothing here is
// "awarded" or written anywhere except two tiny localStorage flags (which
// badges have already been shown as a toast, and whether sound is muted).
// Depends on PAGE_GROUPS / flatPages / pageSectionTotals from
// progress-shared.js, and SOURCE_ORDER-style category keys.
// ══════════════════════════════════════════════════════════════

const GAMIFICATION_XP_PER_QUESTION = 10;
const GAMIFICATION_CATEGORY_BONUS = 50;
const GAMIFICATION_TOPIC_BONUS = 200;
const GAMIFICATION_CATEGORY_KEYS = ['learn', 'mcq', 'match', 'fib', 'misc', 'tips', 'tf', 'exam'];

// ── Custom badge icons (line-style SVG, 24×24, stroke = currentColor) ──
// A small cohesive icon set so badges look like a designed game system, not a
// row of OS emoji. Each value is the inner markup; gamBadgeIconSvg() wraps it.
// Reused across badges and tinted by rarity via the medallion frame in CSS.
const GAM_BADGE_ICONS = {
  flag:     '<path d="M6 21V4M6 4h11l-2 3.5L17 11H6"/>',
  target:   '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  medal:    '<path d="M9 3l3 5.4L15 3"/><path d="M9 3H6l2.9 5.2M15 3h3l-2.9 5.2"/><circle cx="12" cy="15" r="5.5"/><circle cx="12" cy="15" r="1.6"/>',
  bolt:     '<polygon points="13,2 4,13.5 11,13.5 11,22 20,10 13,10"/>',
  flame:    '<path d="M12 3c1.5 3 4.5 4.2 4.5 8a4.5 4.5 0 0 1-9 0c0-1.8.8-2.9 1.7-3.8C10 8.6 11 6 12 3z"/>',
  shield:   '<path d="M12 3l7.5 3v5.2c0 4.6-3.3 7.5-7.5 9-4.2-1.5-7.5-4.4-7.5-9V6z"/>',
  star:     '<polygon points="12,2.6 14.9,9 21.8,9.6 16.5,14.2 18.2,21 12,17.3 5.8,21 7.5,14.2 2.2,9.6 9.1,9"/>',
  sparkle:  '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.8 15.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  crown:    '<path d="M4 18.5h16M4.6 18.5l-1-9 4.9 3.8L12 5l3.5 8.3 4.9-3.8-1 9"/>',
  diamond:  '<path d="M5 4h14l2.6 4.6L12 21 2.4 8.6z"/><path d="M2.4 8.6h19.2M9 4L6 8.6 12 21M15 4l3 4.6"/>',
  hexagon:  '<polygon points="12,2.6 20.5,7.3 20.5,16.7 12,21.4 3.5,16.7 3.5,7.3"/>',
  check:    '<circle cx="12" cy="12" r="8.5"/><polyline points="8,12.5 11,15.5 16.5,9.5"/>',
  book:     '<path d="M6.5 4H17a1.5 1.5 0 0 1 1.5 1.5V20H8a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M6.5 4v17.5M9.5 8.5h6M9.5 11.5h4"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3v4.5M15.5 3v4.5M8 14.5l2 2 3.5-3.5"/>',
  chart:    '<path d="M4 20h16"/><rect x="5.5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="15.5" y="10" width="3" height="8"/>',
  trending: '<polyline points="3,16.5 9,10.5 13,14.5 21,6.5"/><polyline points="15,6.5 21,6.5 21,12.5"/>',
  rocket:   '<path d="M12 3c2.6 2 4 5.2 4 8.4L14 16h-4l-2-4.6C8 8.2 9.4 5 12 3z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M10 16l-2.5 4M14 16l2.5 4M12 16v4"/>',
  globe:    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 2.6 3 14.4 0 17M12 3.5c-3 2.6-3 14.4 0 17"/>',
  atom:     '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  key:      '<circle cx="8.5" cy="8.5" r="4.5"/><path d="M11.8 11.8L20 20M16.5 16.5l2-2M18.5 18.5l1.5-1.5"/>',
  puzzle:   '<path d="M9.5 4.5h5v2.2a1.8 1.8 0 1 0 0 3.6v3.6H11a1.8 1.8 0 1 1-3.6 0H4.9v-3.6h2.2a1.8 1.8 0 1 0 0-3.6z"/>',
  compass:  '<circle cx="12" cy="12" r="8.5"/><polygon points="15.5,8.5 11,11 8.5,15.5 13,13"/>',
};
function gamBadgeIconSvg(name, cls) {
  const inner = GAM_BADGE_ICONS[name] || GAM_BADGE_ICONS.star;
  return `<svg class="${cls || 'bdg-glyph'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// ── Rarity tiers ── higher = harder/rarer; drives the medallion colour, glow
// and the "N legendary" breakdown on the badges page. `order` sorts them.
const GAM_RARITY = {
  common:    { label: 'Common',    order: 1 },
  uncommon:  { label: 'Uncommon',  order: 2 },
  rare:      { label: 'Rare',      order: 3 },
  epic:      { label: 'Epic',      order: 4 },
  legendary: { label: 'Legendary', order: 5 },
  mythic:    { label: 'Mythic',    order: 6 },
};
function gamRarityOrder(key) { return (GAM_RARITY[key] && GAM_RARITY[key].order) || 1; }

// `group` sections the list; `rarity` + `svg` drive the look. `icon` (emoji) is
// kept as a fallback for surfaces that don't render SVG (e.g. the toast).
const BADGE_DEFS = [
  // ── Progress: questions answered ──
  { id: 'first-steps',    icon: '🥉', svg: 'flag',     rarity: 'common',    label: 'First Steps',       desc: 'Answer your first question',   group: 'Progress', test: s => s.totalDone >= 1 },
  { id: 'century',        icon: '💯', svg: 'target',   rarity: 'uncommon',  label: 'Century',           desc: 'Answer 100 questions',         group: 'Progress', test: s => s.totalDone >= 100 },
  { id: 'half-thousand',  icon: '🎓', svg: 'target',   rarity: 'rare',      label: 'Half-Thousand Club',desc: 'Answer 500 questions',         group: 'Progress', test: s => s.totalDone >= 500 },
  { id: 'question-machine',icon:'🧠', svg: 'bolt',     rarity: 'epic',      label: 'Question Machine',  desc: 'Answer 1,000 questions',       group: 'Progress', test: s => s.totalDone >= 1000 },
  { id: 'relentless',     icon: '🦾', svg: 'flame',    rarity: 'epic',      label: 'Relentless',        desc: 'Answer 2,500 questions',       group: 'Progress', test: s => s.totalDone >= 2500 },
  { id: 'iron-mind',      icon: '🛡️', svg: 'shield',   rarity: 'legendary', label: 'Iron Mind',         desc: 'Answer 5,000 questions',       group: 'Progress', test: s => s.totalDone >= 5000 },
  { id: 'ten-thousand',   icon: '💠', svg: 'diamond',  rarity: 'mythic',    label: 'Ten-Thousand',      desc: 'Answer 10,000 questions',      group: 'Progress', test: s => s.totalDone >= 10000 },
  // ── XP ──
  { id: 'getting-serious',icon: '🚀', svg: 'trending', rarity: 'common',    label: 'Getting Serious',   desc: 'Reach 500 XP',                 group: 'XP & Levels', test: s => s.xp >= 500 },
  { id: 'xp-grinder',     icon: '📈', svg: 'trending', rarity: 'uncommon',  label: 'XP Grinder',        desc: 'Reach 2,000 XP',               group: 'XP & Levels', test: s => s.xp >= 2000 },
  { id: 'xp-machine',     icon: '⚙️', svg: 'chart',    rarity: 'rare',      label: 'XP Machine',        desc: 'Reach 5,000 XP',               group: 'XP & Levels', test: s => s.xp >= 5000 },
  { id: 'xp-titan',       icon: '🏋️', svg: 'chart',    rarity: 'epic',      label: 'XP Titan',          desc: 'Reach 10,000 XP',              group: 'XP & Levels', test: s => s.xp >= 10000 },
  // ── Levels ──
  { id: 'rising-star',    icon: '⭐', svg: 'star',     rarity: 'uncommon',  label: 'Rising Star',       desc: 'Reach Level 5',                group: 'XP & Levels', test: s => s.level >= 5 },
  { id: 'veteran-scholar',icon: '🎖️', svg: 'star',     rarity: 'rare',      label: 'Veteran Scholar',   desc: 'Reach Level 10',               group: 'XP & Levels', test: s => s.level >= 10 },
  { id: 'elite-scholar',  icon: '💠', svg: 'sparkle',  rarity: 'epic',      label: 'Elite Scholar',     desc: 'Reach Level 15',               group: 'XP & Levels', test: s => s.level >= 15 },
  { id: 'master-scholar', icon: '👑', svg: 'crown',    rarity: 'legendary', label: 'Master Scholar',    desc: 'Reach Level 20',               group: 'XP & Levels', test: s => s.level >= 20 },
  { id: 'grandmaster',    icon: '♛',  svg: 'crown',    rarity: 'mythic',    label: 'Grandmaster',       desc: 'Reach Level 30',               group: 'XP & Levels', test: s => s.level >= 30 },
  // ── Topics completed ──
  { id: 'topic-master',   icon: '🏆', svg: 'check',    rarity: 'common',    label: 'Topic Master',      desc: 'Fully complete one topic',     group: 'Topics', test: s => s.topicsComplete >= 1 },
  { id: 'on-a-roll',      icon: '🏅', svg: 'check',    rarity: 'uncommon',  label: 'On a Roll',         desc: 'Fully complete 5 topics',      group: 'Topics', test: s => s.topicsComplete >= 5 },
  { id: 'topic-adept',    icon: '🎯', svg: 'check',    rarity: 'rare',      label: 'Topic Adept',       desc: 'Fully complete 15 topics',     group: 'Topics', test: s => s.topicsComplete >= 15 },
  { id: 'topic-veteran',  icon: '🗿', svg: 'shield',   rarity: 'epic',      label: 'Topic Veteran',     desc: 'Fully complete 30 topics',     group: 'Topics', test: s => s.topicsComplete >= 30 },
  { id: 'unit-champion',  icon: '🌟', svg: 'hexagon',  rarity: 'rare',      label: 'Unit Champion',     desc: 'Fully complete every topic in one unit', group: 'Topics', test: s => s.unitComplete },
  { id: 'gcse-legend',    icon: '👑', svg: 'crown',    rarity: 'legendary', label: 'Course Legend',     desc: 'Fully complete every topic',   group: 'Topics', test: s => s.topicsComplete >= s.totalTopics && s.totalTopics > 0 },
  // ── Activity categories ──
  { id: 'bookworm',       icon: '📚', svg: 'book',     rarity: 'uncommon',  label: 'Bookworm',          desc: 'Complete Key Learning in 10 topics',    group: 'Categories', test: s => s.byCategory.learn >= 10 },
  { id: 'quiz-whiz',      icon: '❓', svg: 'check',    rarity: 'uncommon',  label: 'Quiz Whiz',         desc: 'Complete MCQ Quiz in 10 topics',        group: 'Categories', test: s => s.byCategory.mcq >= 10 },
  { id: 'match-master',   icon: '🔗', svg: 'puzzle',   rarity: 'uncommon',  label: 'Match Master',      desc: 'Complete Matching in 10 topics',        group: 'Categories', test: s => s.byCategory.match >= 10 },
  { id: 'fill-it-in',     icon: '✏️', svg: 'book',     rarity: 'uncommon',  label: 'Fill It In',        desc: 'Complete Fill the Blanks in 10 topics', group: 'Categories', test: s => s.byCategory.fib >= 10 },
  { id: 'myth-buster',    icon: '⚠️', svg: 'shield',   rarity: 'uncommon',  label: 'Myth Buster',       desc: 'Complete Misconceptions in 10 topics',  group: 'Categories', test: s => s.byCategory.misc >= 10 },
  { id: 'tip-top',        icon: '🎯', svg: 'target',   rarity: 'uncommon',  label: 'Tip Top',           desc: 'Complete Exam Tips in 10 topics',       group: 'Categories', test: s => s.byCategory.tips >= 10 },
  { id: 'true-believer',  icon: '✅', svg: 'check',    rarity: 'uncommon',  label: 'True Believer',     desc: 'Complete True/False in 10 topics',      group: 'Categories', test: s => s.byCategory.tf >= 10 },
  { id: 'exam-ready',     icon: '📝', svg: 'sparkle',  rarity: 'rare',      label: 'Exam Ready',        desc: 'Complete Exam Practice in 5 topics',    group: 'Categories', test: s => s.byCategory.exam >= 5 },
  { id: 'all-rounder',    icon: '🎨', svg: 'sparkle',  rarity: 'rare',      label: 'All-Rounder',       desc: 'Complete every activity type at least once', group: 'Categories', test: s => ['learn','mcq','match','fib','misc','tips','tf','exam'].every(k => (s.byCategory[k] || 0) >= 1) },
  // ── Streaks ──
  { id: 'on-fire',        icon: '🔥', svg: 'flame',    rarity: 'common',    label: 'On Fire',           desc: '3-day answering streak',       group: 'Streaks', test: s => s.streak >= 3 },
  { id: 'unstoppable',    icon: '🔥', svg: 'flame',    rarity: 'uncommon',  label: 'Unstoppable',       desc: '7-day answering streak',       group: 'Streaks', test: s => s.streak >= 7 },
  { id: 'two-week-streak',icon: '⚡', svg: 'bolt',     rarity: 'rare',      label: 'Two-Week Streak',   desc: '14-day answering streak',      group: 'Streaks', test: s => s.streak >= 14 },
  { id: 'monthly-streak', icon: '🌋', svg: 'flame',    rarity: 'epic',      label: 'Monthly Streak',    desc: '30-day answering streak',      group: 'Streaks', test: s => s.streak >= 30 },
  { id: 'century-streak', icon: '💎', svg: 'diamond',  rarity: 'legendary', label: 'Century Streak',    desc: '100-day answering streak',     group: 'Streaks', test: s => s.streak >= 100 },
  { id: 'eternal-flame',  icon: '☄️', svg: 'flame',    rarity: 'mythic',    label: 'Eternal Flame',     desc: '180-day answering streak',     group: 'Streaks', test: s => s.streak >= 180 },
  // ── Daily Revise ──
  { id: 'daily-starter',  icon: '🎯', svg: 'target',   rarity: 'common',    label: 'Daily Habit',       desc: 'Answer 20 Daily Revise questions correctly', group: 'Daily Revise', test: s => s.drCorrect >= 20 },
  { id: 'daily-sharp',    icon: '🥈', svg: 'medal',    rarity: 'uncommon',  label: 'Getting Sharp',     desc: 'Master 25 questions in Daily Revise',  group: 'Daily Revise', test: s => s.drMastered >= 25 },
  { id: 'daily-pro',      icon: '🥇', svg: 'medal',    rarity: 'rare',      label: 'Daily Revise Pro',  desc: 'Master 100 questions in Daily Revise', group: 'Daily Revise', test: s => s.drMastered >= 100 },
  { id: 'daily-master',   icon: '🏆', svg: 'medal',    rarity: 'epic',      label: 'Mastery Machine',   desc: 'Master 500 questions in Daily Revise', group: 'Daily Revise', test: s => s.drMastered >= 500 },
  // ── Review Calendar ──
  { id: 'first-review',   icon: '🔁', svg: 'calendar', rarity: 'common',    label: 'First Review',      desc: 'Complete your first Review Calendar review', group: 'Review Calendar', test: s => s.reviewsCompleted >= 1 },
  { id: 'review-regular', icon: '🗓️', svg: 'calendar', rarity: 'uncommon',  label: 'Review Regular',    desc: 'Complete 10 Review Calendar reviews',  group: 'Review Calendar', test: s => s.reviewsCompleted >= 10 },
  { id: 'retention-master',icon:'🧲', svg: 'calendar', rarity: 'rare',      label: 'Retention Master',  desc: 'Complete 30 Review Calendar reviews',  group: 'Review Calendar', test: s => s.reviewsCompleted >= 30 },
  { id: 'retention-legend',icon:'🧠', svg: 'calendar', rarity: 'epic',      label: 'Memory Palace',     desc: 'Complete 100 Review Calendar reviews', group: 'Review Calendar', test: s => s.reviewsCompleted >= 100 },
  // ── Leaderboard (best-ever tier across subjects) ──
  { id: 'leaderboard-top10',icon:'📊', svg: 'chart',   rarity: 'rare',      label: 'Top of the Class',  desc: 'Reach the top 10 of your class leaderboard', group: 'Leaderboard', test: s => s.lbTop10 },
  { id: 'leaderboard-podium',icon:'🏅',svg: 'medal',   rarity: 'epic',      label: 'Podium Finish',     desc: 'Reach the top 3 of your class leaderboard',  group: 'Leaderboard', test: s => s.lbTop3 },
  { id: 'leaderboard-first',icon:'👑', svg: 'crown',   rarity: 'legendary', label: 'Class Champion',    desc: 'Hit #1 on your class leaderboard',           group: 'Leaderboard', test: s => s.lbFirst },
];

// ── Subject-specific badges ── a bespoke, subject-flavoured set for each
// subject the student is enrolled in (badges.html instantiates them against
// that subject's own stats, so they only show for subjects the student
// actually has). Progress-derived only (questions/topics/units/XP) so they
// need no extra per-subject server round trips. Same rarity tiers as the
// profile badges; emoji icons. Slugs must match the subject registry.
// `_sbAll` = every topic in the subject fully complete.
const _sbAll = s => s.totalTopics > 0 && s.topicsComplete >= s.totalTopics;
const SUBJECT_BADGE_SETS = {
  'business': [
    { id: 'biz-startup',  icon: '🌱', rarity: 'common',    label: 'Startup Founder',   desc: 'Answer your first Business question',   test: s => s.totalDone >= 1 },
    { id: 'biz-cashflow', icon: '💷', rarity: 'uncommon',  label: 'Cash Flow Positive',desc: 'Answer 100 Business questions',         test: s => s.totalDone >= 100 },
    { id: 'biz-analyst',  icon: '📊', rarity: 'rare',      label: 'Market Analyst',    desc: 'Fully complete 5 Business topics',      test: s => s.topicsComplete >= 5 },
    { id: 'biz-ops',      icon: '🏭', rarity: 'rare',      label: 'Operations Manager',desc: 'Complete a whole Business unit',        test: s => s.unitComplete },
    { id: 'biz-scale',    icon: '📈', rarity: 'epic',      label: 'Scaling Up',        desc: 'Answer 500 Business questions',         test: s => s.totalDone >= 500 },
    { id: 'biz-boss',     icon: '👔', rarity: 'legendary', label: 'The Big Boss',      desc: 'Fully complete every Business topic',   test: _sbAll },
    { id: 'biz-mogul',    icon: '🦈', rarity: 'mythic',    label: 'Business Mogul',    desc: 'Complete every topic AND answer 1,000 Business questions', test: s => _sbAll(s) && s.totalDone >= 1000 },
  ],
  'computer-science': [
    { id: 'cs-hello',   icon: '👋', rarity: 'common',    label: 'Hello, World!',  desc: 'Answer your first Computer Science question', test: s => s.totalDone >= 1 },
    { id: 'cs-binary',  icon: '🔢', rarity: 'uncommon',  label: 'Binary Brain',   desc: 'Answer 100 Computer Science questions',       test: s => s.totalDone >= 100 },
    { id: 'cs-loop',    icon: '🔁', rarity: 'rare',      label: 'Loop Master',    desc: 'Fully complete 5 Computer Science topics',    test: s => s.topicsComplete >= 5 },
    { id: 'cs-bug',     icon: '🐛', rarity: 'rare',      label: 'Bug Squasher',   desc: 'Complete a whole Computer Science unit',      test: s => s.unitComplete },
    { id: 'cs-network', icon: '🌐', rarity: 'epic',      label: 'Network Ninja',  desc: 'Answer 500 Computer Science questions',       test: s => s.totalDone >= 500 },
    { id: 'cs-root',    icon: '🔓', rarity: 'legendary', label: 'Root Access',    desc: 'Fully complete every Computer Science topic', test: _sbAll },
    { id: 'cs-sentient',icon: '🤖', rarity: 'mythic',    label: 'Sentient',       desc: 'Complete every topic AND answer 1,000 CS questions', test: s => _sbAll(s) && s.totalDone >= 1000 },
  ],
  'economics': [
    { id: 'eco-trade',  icon: '🪙', rarity: 'common',    label: 'First Trade',        desc: 'Answer your first Economics question', test: s => s.totalDone >= 1 },
    { id: 'eco-demand', icon: '⚖️', rarity: 'uncommon',  label: 'Supply & Demander',  desc: 'Answer 100 Economics questions',       test: s => s.totalDone >= 100 },
    { id: 'eco-market', icon: '💹', rarity: 'rare',      label: 'Market Mover',       desc: 'Fully complete 5 Economics topics',    test: s => s.topicsComplete >= 5 },
    { id: 'eco-bank',   icon: '🏦', rarity: 'rare',      label: 'Central Banker',     desc: 'Complete a whole Economics unit',      test: s => s.unitComplete },
    { id: 'eco-macro',  icon: '🌍', rarity: 'epic',      label: 'Macro Mind',         desc: 'Answer 500 Economics questions',       test: s => s.totalDone >= 500 },
    { id: 'eco-hand',   icon: '🎩', rarity: 'legendary', label: 'The Invisible Hand', desc: 'Fully complete every Economics topic', test: _sbAll },
    { id: 'eco-tycoon', icon: '💰', rarity: 'mythic',    label: 'Tycoon',             desc: 'Complete every topic AND answer 1,000 Economics questions', test: s => _sbAll(s) && s.totalDone >= 1000 },
  ],
  'spanish': [
    { id: 'es-hola',    icon: '👋', rarity: 'common',    label: '¡Hola!',        desc: 'Answer your first Spanish question', test: s => s.totalDone >= 1 },
    { id: 'es-conv',    icon: '🗣️', rarity: 'uncommon',  label: 'Conversador',   desc: 'Answer 100 Spanish questions',       test: s => s.totalDone >= 100 },
    { id: 'es-est',     icon: '📖', rarity: 'rare',      label: 'Estudiante',    desc: 'Fully complete 5 Spanish topics',    test: s => s.topicsComplete >= 5 },
    { id: 'es-fiesta',  icon: '🎉', rarity: 'rare',      label: 'Fiesta Ready',  desc: 'Complete a whole Spanish unit',      test: s => s.unitComplete },
    { id: 'es-escritor',icon: '✍️', rarity: 'epic',      label: 'Escritor',      desc: 'Answer 500 Spanish questions',       test: s => s.totalDone >= 500 },
    { id: 'es-fluido',  icon: '🏆', rarity: 'legendary', label: 'Fluidez Total', desc: 'Fully complete every Spanish topic', test: _sbAll },
    { id: 'es-nativo',  icon: '💃', rarity: 'mythic',    label: 'Casi Nativo',   desc: 'Complete every topic AND answer 1,000 Spanish questions', test: s => _sbAll(s) && s.totalDone >= 1000 },
  ],
  'additional-maths': [
    { id: 'am-first',   icon: '➗', rarity: 'common',    label: 'First Principles', desc: 'Answer your first Additional Maths question', test: s => s.totalDone >= 1 },
    { id: 'am-surd',    icon: '🧮', rarity: 'uncommon',  label: 'Surd Slayer',      desc: 'Answer 100 Additional Maths questions',       test: s => s.totalDone >= 100 },
    { id: 'am-trig',    icon: '📐', rarity: 'rare',      label: 'Trig Titan',       desc: 'Fully complete 5 Additional Maths topics',    test: s => s.topicsComplete >= 5 },
    { id: 'am-calc',    icon: '📈', rarity: 'rare',      label: 'Calculus Cadet',   desc: 'Complete a whole Additional Maths unit',      test: s => s.unitComplete },
    { id: 'am-vector',  icon: '🔺', rarity: 'epic',      label: 'Vector Voyager',   desc: 'Answer 500 Additional Maths questions',       test: s => s.totalDone >= 500 },
    { id: 'am-magic',   icon: '🎩', rarity: 'legendary', label: 'Mathemagician',    desc: 'Fully complete every Additional Maths topic', test: _sbAll },
    { id: 'am-infinity',icon: '♾️', rarity: 'mythic',    label: 'To Infinity',      desc: 'Complete every topic AND answer 1,000 Additional Maths questions', test: s => _sbAll(s) && s.totalDone >= 1000 },
  ],
  // Fallback for ANY other subject — including teacher-authored ones, whose
  // topic tree isn't in the static registry. Tests use ONLY questions answered
  // (countable from progress for any subject, static or custom — see
  // gamSubjectStatsFromProgress), so they actually unlock, unlike completion
  // tests which need a topic tree we don't have for custom subjects.
  '_default': [
    { id: 'sub-first', icon: '🌱', rarity: 'common',    label: 'First Steps',    desc: 'Answer your first question in this subject', test: s => s.totalDone >= 1 },
    { id: 'sub-50',    icon: '🎯', rarity: 'uncommon',  label: 'Getting Going',  desc: 'Answer 50 questions in this subject',        test: s => s.totalDone >= 50 },
    { id: 'sub-100',   icon: '⚡', rarity: 'rare',      label: 'Century',        desc: 'Answer 100 questions in this subject',       test: s => s.totalDone >= 100 },
    { id: 'sub-250',   icon: '📚', rarity: 'rare',      label: 'Dedicated',      desc: 'Answer 250 questions in this subject',       test: s => s.totalDone >= 250 },
    { id: 'sub-500',   icon: '🔥', rarity: 'epic',      label: 'Powerhouse',     desc: 'Answer 500 questions in this subject',       test: s => s.totalDone >= 500 },
    { id: 'sub-1000',  icon: '🏆', rarity: 'legendary', label: 'Subject Master', desc: 'Answer 1,000 questions in this subject',     test: s => s.totalDone >= 1000 },
    { id: 'sub-2500',  icon: '🌟', rarity: 'mythic',    label: 'Living Legend',  desc: 'Answer 2,500 questions in this subject',     test: s => s.totalDone >= 2500 },
  ],
};
function gamSubjectBadgeDefs(slug) {
  return SUBJECT_BADGE_SETS[slug] || SUBJECT_BADGE_SETS._default;
}

// Per-subject stats for one subject. Static subjects use their page tree from
// PAGE_GROUPS_ALL (full stats incl. topic completion). Teacher-authored
// subjects aren't in that static registry, so we fall back to counting answered
// questions straight from progress — enough for the questions-only _default
// badge set. Streak/Daily-Revise/review left at 0 (subject badges are
// progress-derived). Never returns null now, so custom subjects show badges.
function gamComputeSubjectStats(slug, progress) {
  const groups = (window.PAGE_GROUPS_ALL && window.PAGE_GROUPS_ALL[slug]) || null;
  if (groups && groups.length) {
    return computeGamificationStats(progress, 0, { correctCount: 0, masteredCount: 0 }, { completed: 0 }, {}, groups);
  }
  return gamSubjectStatsFromProgress(slug, progress);
}

// Minimal per-subject stats derived only from progress — for subjects with no
// static topic tree (teacher-authored). Sums answered questions across page ids
// prefixed 'slug:'; completion fields stay 0/false (unknowable without a tree),
// which is why the _default badge set is questions-only.
function gamSubjectStatsFromProgress(slug, progress) {
  const prefix = slug + ':';
  let totalDone = 0;
  Object.keys(progress || {}).forEach(pid => {
    if (pid.lastIndexOf(prefix, 0) !== 0) return;      // starts-with prefix
    const secs = progress[pid] || {};
    Object.keys(secs).forEach(k => {
      if (k !== 'flashcards') totalDone += (secs[k] && secs[k].done) || 0;
    });
  });
  const xp = totalDone * GAMIFICATION_XP_PER_QUESTION;
  return {
    xp, level: gamificationLevelFromXp(xp).level,
    topicsComplete: 0, totalDone, totalTopics: 0, byCategory: {},
    unitComplete: false, streak: 0, drCorrect: 0, drMastered: 0,
    reviewsCompleted: 0, lbTop10: false, lbTop3: false, lbFirst: false,
  };
}
function gamificationSubjectBadgesFor(subjectStats, slug) {
  return subjectStats ? gamSubjectBadgeDefs(slug).filter(b => b.test(subjectStats)) : [];
}

function gamificationLevelFromXp(xp) {
  let level = 1, xpForThis = 0;
  while (xp >= xpForThis + level * level * 50) { xpForThis += level * level * 50; level++; }
  return { level, xpIntoLevel: xp - xpForThis, xpForNextLevel: level * level * 50 };
}

// Content-less curriculum "overview" pages (e.g. the 2.4 Marketing Mix hub)
// have no gradable sections at all and can never register as "complete" —
// excluded here so they don't make unit/course completion permanently
// unreachable (mirrors the same fix in topic-guard.js/dashboard.html).
function _gamHasGradableContent(pageId) {
  const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pageId];
  return !!t && Object.keys(t).some(k => k !== 'flashcards' && t[k] > 0);
}

// The single source of truth for XP/levels/badges/completion — call this
// with the same merged {pageId:{section:{done,total}}} progress object
// the dashboards already build, plus a streak count (0 if unknown yet) and
// (optionally) this student's lifetime Daily Revise stats — see
// gamificationRefreshDailyReviseStats()/gamificationRefreshReviewStats();
// both default to their last-fetched cache so existing call sites that
// don't pass them keep working unchanged.
function computeGamificationStats(progress, streak, drStats, reviewStats, lbStats, pageGroups) {
  drStats = drStats || _gamDrStats;
  reviewStats = reviewStats || _gamReviewStats;
  lbStats = lbStats || _gamLbStats;
  let xp = 0, topicsComplete = 0, totalDone = 0, totalTopics = 0, unitCompleteAny = false;
  const byCategory = {};
  GAMIFICATION_CATEGORY_KEYS.forEach(k => { byCategory[k] = 0; });

  // pageGroups defaults to the page's current subject (window.PAGE_GROUPS);
  // badges.html passes one subject's tree to compute that subject's own stats.
  (pageGroups || PAGE_GROUPS).forEach(group => {
    const pages = flatPages(group).filter(p => _gamHasGradableContent(p.id));
    let unitComplete = 0;
    pages.forEach(p => {
      totalTopics++;
      const sections = pageSectionTotals(p.id, progress[p.id] || {}).filter(s => s.key !== 'flashcards');
      let anySection = false, allComplete = true;
      sections.forEach(s => {
        totalDone += s.done;
        xp += s.done * GAMIFICATION_XP_PER_QUESTION;
        if (s.total > 0) {
          anySection = true;
          if (s.done >= s.total) {
            xp += GAMIFICATION_CATEGORY_BONUS;
            if (byCategory[s.key] != null) byCategory[s.key]++;
          } else {
            allComplete = false;
          }
        }
      });
      if (anySection && allComplete) { xp += GAMIFICATION_TOPIC_BONUS; topicsComplete++; unitComplete++; }
    });
    if (pages.length > 0 && unitComplete === pages.length) unitCompleteAny = true;
  });

  // Daily Revise practice — a durable, only-ever-growing lifetime count (see
  // daily_revise_stats / record_mastery_answer in daily-revise-functions.sql)
  // folded into the same XP total everything else uses. Mastering a
  // question earns the same bonus as fully completing a topic section.
  const drCorrect = (drStats && drStats.correctCount) || 0;
  const drMastered = (drStats && drStats.masteredCount) || 0;
  totalDone += drCorrect;
  xp += drCorrect * GAMIFICATION_XP_PER_QUESTION;
  xp += drMastered * GAMIFICATION_CATEGORY_BONUS;

  // Review Calendar — a count of ticked-off review sessions, not individual
  // question answers (those are already folded into drCorrect/drMastered
  // above, since a review quiz answer is graded via record_mastery_answer
  // same as Daily Revise). Purely a badge-test signal, so it doesn't feed XP.
  const reviewsCompleted = (reviewStats && reviewStats.completed) || 0;

  // Leaderboard tiers reached (see leaderboard.sql / leaderboard_achievements) —
  // best-ever flags across subjects, purely badge-test signals (no XP: a
  // relative ranking mustn't inflate an absolute score).
  const lbTop10 = !!(lbStats && lbStats.everTop10);
  const lbTop3  = !!(lbStats && lbStats.everTop3);
  const lbFirst = !!(lbStats && lbStats.everFirst);

  const lvl = gamificationLevelFromXp(xp);
  return {
    xp, level: lvl.level, xpIntoLevel: lvl.xpIntoLevel, xpForNextLevel: lvl.xpForNextLevel,
    topicsComplete, totalDone, totalTopics, byCategory,
    unitComplete: unitCompleteAny, streak: streak || 0,
    drCorrect, drMastered, reviewsCompleted,
    lbTop10, lbTop3, lbFirst,
  };
}

function gamificationEarnedBadges(stats) {
  return BADGE_DEFS.filter(b => b.test(stats));
}

// Diffs newly-earned badges against what's already been shown, toasts the
// new ones, and remembers what's been shown — purely a "don't re-toast the
// same badge on every page load" flag, not the badge state itself (that's
// always recomputed from `stats`).
function gamificationCheckNewBadges(stats) {
  const earned = gamificationEarnedBadges(stats);
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem('gcse_badges_seen') || '[]'); } catch (e) {}
  const seenSet = new Set(seen);
  const fresh = earned.filter(b => !seenSet.has(b.id));
  if (fresh.length) {
    try { localStorage.setItem('gcse_badges_seen', JSON.stringify(earned.map(b => b.id))); } catch (e) {}
    fresh.forEach((b, i) => setTimeout(() => gamificationShowBadgeToast(b), i * 3200));
  }
  return earned;
}

// ── Sound (synthesized — no external audio assets) ──

let _gamAudioCtx = null;
function _gamCtx() {
  if (!_gamAudioCtx) {
    try { _gamAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  return _gamAudioCtx;
}

function gamificationSoundEnabled() {
  try { return localStorage.getItem('gcse_sound_off') !== '1'; } catch (e) { return true; }
}
function gamificationSetSoundEnabled(on) {
  try { localStorage.setItem('gcse_sound_off', on ? '0' : '1'); } catch (e) {}
}

function _gamTone(freq, start, dur, type, peak) {
  const ctx = _gamCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak || 0.15, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function gamificationPlaySound(kind) {
  if (!gamificationSoundEnabled()) return;
  if (kind === 'correct') { _gamTone(660, 0, .12, 'sine'); _gamTone(990, .09, .18, 'sine'); }
  else if (kind === 'wrong') { _gamTone(220, 0, .18, 'sine', .1); }
  else if (kind === 'levelup') { [523, 659, 784, 1047].forEach((f, i) => _gamTone(f, i * .09, .22, 'triangle', .16)); }
  else if (kind === 'badge') { _gamTone(784, 0, .14, 'triangle', .16); _gamTone(1175, .1, .28, 'triangle', .18); }
  else if (kind === 'combo') { _gamTone(880, 0, .1, 'triangle', .13); _gamTone(1320, .08, .16, 'triangle', .15); }
  else { _gamTone(440, 0, .08, 'sine', .08); }
}

// ── Toasts ──

function _gamEnsureStyles() {
  if (document.getElementById('gam-toast-styles')) return;
  const style = document.createElement('style');
  style.id = 'gam-toast-styles';
  style.textContent = `
    .gam-xp-toast{position:fixed;top:18px;right:18px;z-index:490;background:var(--chrome, var(--ink,#1a2332));color:#fff;font-family:'DM Mono',monospace;font-size:13px;font-weight:600;padding:8px 16px;border-radius:99px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transform:translateY(-10px);transition:opacity .25s,transform .25s;pointer-events:none;}
    .gam-xp-toast.show{opacity:1;transform:translateY(0);}
    .gam-badge-toast{position:fixed;top:18px;right:18px;z-index:491;display:flex;align-items:center;gap:12px;background:#fff;border:2px solid var(--gold,#d4a843);color:#1a2332;font-family:'DM Sans',sans-serif;padding:12px 18px;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.3);opacity:0;transform:translateY(-16px) scale(.95);transition:opacity .3s,transform .3s;max-width:280px;}
    .gam-badge-toast.show{opacity:1;transform:translateY(0) scale(1);}
    .gam-badge-icon{font-size:28px;line-height:1;}
    .gam-badge-title{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#8f6d19;}
    .gam-badge-name{font-family:'Playfair Display',serif;font-weight:700;font-size:14px;}
    .gam-levelup-toast{position:fixed;top:18px;right:18px;z-index:402;background:linear-gradient(135deg,#7a5c9e,#4a6fa5);color:#fff;font-family:'Playfair Display',serif;font-weight:700;font-size:15px;padding:14px 20px;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.35);opacity:0;transform:translateY(-16px) scale(.95);transition:opacity .3s,transform .3s;}
    .gam-levelup-toast.show{opacity:1;transform:translateY(0) scale(1);}
    .gam-combo-toast{position:fixed;top:64px;right:18px;z-index:400;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#b8860b,#d4a843);color:#fff;font-family:'DM Mono',monospace;font-size:13px;font-weight:600;padding:8px 16px;border-radius:99px;box-shadow:0 8px 24px rgba(184,134,11,.4);opacity:0;transform:translateY(-10px) scale(.9);transition:opacity .25s,transform .25s cubic-bezier(.34,1.4,.64,1);pointer-events:none;}
    .gam-combo-toast.show{opacity:1;transform:translateY(0) scale(1);}
    /* Streak-safe celebration — deliberately bottom-centre and bigger than the
       other toasts so the once-a-day moment feels like an event, not a chip. */
    .gam-streak-toast{position:fixed;left:50%;bottom:26px;z-index:492;display:flex;align-items:center;gap:14px;
      background:linear-gradient(135deg,#e25822,#f0a02a);color:#fff;font-family:'DM Sans',sans-serif;
      padding:14px 22px 14px 18px;border-radius:16px;box-shadow:0 14px 40px rgba(226,88,34,.45);
      max-width:min(92vw,430px);opacity:0;transform:translateX(-50%) translateY(14px) scale(.96);
      transition:opacity .3s,transform .35s cubic-bezier(.34,1.4,.64,1);pointer-events:none;}
    .gam-streak-toast.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}
    .gam-streak-flame{font-size:38px;line-height:1;flex-shrink:0;animation:gamFlamePulse 1.1s ease-in-out infinite;}
    @keyframes gamFlamePulse{0%,100%{transform:scale(1);}50%{transform:scale(1.16);}}
    .gam-streak-kicker{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.9;}
    .gam-streak-headline{font-family:'Playfair Display',serif;font-weight:700;font-size:17px;line-height:1.2;margin-top:1px;}
    .gam-streak-days{font-family:'DM Mono',monospace;font-size:12px;margin-top:3px;opacity:.95;}
    .gam-streak-days b{font-size:15px;}
    .gam-streak-sub{font-size:11.5px;opacity:.85;margin-top:3px;line-height:1.4;}
    @media (prefers-reduced-motion: reduce){
      .gam-streak-flame{animation:none;}
      .gam-streak-toast{transition:opacity .2s;}
    }
  `;
  document.head.appendChild(style);
}

function _gamToast(el, holdMs) {
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, holdMs);
}

// Fire-and-forget: lets avatar-buddy.js (or anything else) react to a
// celebration without gamification.js knowing it exists — no listener means
// no-op, so this is safe on every page whether or not the buddy is mounted.
function _gamNotifyBuddy(kind, detail) {
  try { window.dispatchEvent(new CustomEvent('vidya:celebrate', { detail: Object.assign({ kind }, detail) })); } catch (e) {}
}

function gamificationShowXpToast(amount) {
  _gamEnsureStyles();
  const el = document.createElement('div');
  el.className = 'gam-xp-toast';
  el.textContent = `+${amount} XP`;
  _gamToast(el, 900);
}

function gamificationShowBadgeToast(badge) {
  _gamEnsureStyles();
  _gamNotifyBuddy('badge', { label: badge.label, icon: badge.icon });
  gamificationPlaySound('badge');
  const el = document.createElement('div');
  el.className = 'gam-badge-toast';
  el.innerHTML = `<span class="gam-badge-icon" aria-hidden="true">${badge.icon}</span>
    <div><div class="gam-badge-title">Badge unlocked!</div><div class="gam-badge-name">${badge.label}</div></div>`;
  _gamToast(el, 4200);
}

function gamificationShowLevelUpToast(level) {
  _gamEnsureStyles();
  _gamNotifyBuddy('levelup', { level });
  const el = document.createElement('div');
  el.className = 'gam-levelup-toast';
  el.textContent = `⭐ Level ${level}!`;
  _gamToast(el, 2600);
}

function gamificationShowComboToast(combo) {
  _gamEnsureStyles();
  _gamNotifyBuddy('combo', { combo });
  const el = document.createElement('div');
  el.className = 'gam-combo-toast';
  el.innerHTML = `<span aria-hidden="true">🔥</span> ${combo} correct in a row!`;
  _gamToast(el, 1600);
}

// ── "Streak safe" celebration (once a day, when the daily goal is met) ──
// Rotating copy so the daily moment doesn't go stale, with milestone lines
// taking over on the big days.
const _GAM_STREAK_LINES = [
  'Streak secured!', 'Streak locked in!', 'Chain unbroken!',
  'Still burning!', 'Another day, still on fire!', 'Your streak lives on!',
];
function _gamStreakHeadline(streak, fallback) {
  if (streak >= 365) return 'A full YEAR. Absolutely legendary.';
  if (streak >= 100) return 'One hundred days. Legendary.';
  if (streak >= 50) return '50 days strong — unstoppable!';
  if (streak >= 30) return 'A whole month. Incredible!';
  if (streak >= 14) return 'Two weeks running!';
  if (streak >= 7) return 'A full week — nice one!';
  return fallback;
}

// Shared card builder for the two daily moments below.
function _gamStreakCard(kicker, headline, subLine, showDays) {
  const el = document.createElement('div');
  el.className = 'gam-streak-toast';
  el.setAttribute('role', 'status');
  el.__paint = (streak) => {
    const days = (showDays && streak > 0)
      ? `<div class="gam-streak-days"><b>${streak}</b> day${streak === 1 ? '' : 's'} in a row</div>` : '';
    el.innerHTML = `
      <div class="gam-streak-flame" aria-hidden="true">🔥</div>
      <div>
        <div class="gam-streak-kicker">${gcseEscapeHtmlSafe(kicker)}</div>
        <div class="gam-streak-headline">${typeof headline === 'function' ? headline(streak) : headline}</div>
        ${days}
        <div class="gam-streak-sub">${subLine}</div>
      </div>`;
  };
  return el;
}

// Pull the freshest streak from the server and repaint the card — this is also
// what stops the HUD showing a stale streak until the student refreshes.
function _gamRefreshStreakInto(el) {
  const client = window._gcseSupabaseClient || _gamLastClient;
  if (!client || typeof gamificationRefreshStreak !== 'function') return;
  Promise.resolve(gamificationRefreshStreak(client))
    .then(s => { if (el && el.parentNode && el.__paint) el.__paint(s); })
    .catch(() => {});
}

// ① First CORRECT answer of the day in this subject — the streak is now safe.
// Nudges them toward the daily goal without implying the streak depends on it.
function gamificationCelebrateStreakSafe(todayCount) {
  _gamEnsureStyles();
  _gamNotifyBuddy('streak', { todayCount: todayCount || 1, streak: _gamStreak });
  gamificationPlaySound('badge');
  if (typeof _gamConfettiBurst === 'function') _gamConfettiBurst(22);

  const fallback = _GAM_STREAK_LINES[Math.floor(Math.random() * _GAM_STREAK_LINES.length)];
  const subjName = (window.SUBJECT && window.SUBJECT.name) || '';
  const left = Math.max(0, GAMIFICATION_DAILY_GOAL - (todayCount || 1));
  const sub = left > 0
    ? `That's your streak locked in for today. <b>${left} more</b> to hit your daily goal of ${GAMIFICATION_DAILY_GOAL}.`
    : `Streak locked in — and today's goal of ${GAMIFICATION_DAILY_GOAL} is already done!`;

  const el = _gamStreakCard(
    subjName ? subjName + ' streak safe' : 'Streak safe',
    (streak) => _gamStreakHeadline(streak, fallback), sub, true);
  el.__paint(_gamStreak);
  _gamToast(el, 5200);
  _gamRefreshStreakInto(el);
}

// ② Daily goal reached — the bigger, optional target.
function gamificationCelebrateDailyGoal() {
  _gamEnsureStyles();
  _gamNotifyBuddy('daily-goal', {});
  gamificationPlaySound('badge');
  if (typeof _gamConfettiBurst === 'function') _gamConfettiBurst(44);

  const subjName = (window.SUBJECT && window.SUBJECT.name) || '';
  const el = _gamStreakCard(
    'Daily goal', 'Daily goal smashed! 🎯',
    `${GAMIFICATION_DAILY_GOAL} questions${subjName ? ' in ' + gcseEscapeHtmlSafe(subjName) : ''} today — brilliant work.`,
    true);
  el.__paint(_gamStreak);
  _gamToast(el, 5000);
  _gamRefreshStreakInto(el);
}

// Local escape (account-cluster.js isn't loaded on every page that toasts).
function gcseEscapeHtmlSafe(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ── Streak (needs a server round trip — see gamification-functions.sql) ──

let _gamStreak = 0;
// The best-ever streak and the timestamp of the most recent answered question
// (all subjects), both from get_my_streak. Used to show "longest ever" and,
// once a streak has lapsed, "last practised X ago" instead of a bare 0.
let _gamStreakLongest = 0;
let _gamStreakLastActive = null;
// The all-subjects ("overall") streak — get_my_streak with p_subject null.
// On a subject-scoped page it's the reassurance number: a student who practises
// every day but rotates subjects keeps NO single subject's daily streak, so the
// subject chip can read 0 while they've genuinely been active all week. Shown
// alongside the subject streak on the practice calendar. Null until fetched (and
// left null on the cross-subject view, where the subject streak already IS this).
let _gamStreakOverall = null;
// Last Supabase client any gamification refresh was handed — lets the
// heatmap poller find the client on pages (dashboard, badges) that keep it
// in a module-local, not a window global. Set by the refreshers below.
let _gamLastClient = null;
async function gamificationRefreshStreak(client, subjectOverride) {
  try {
    if (!client) return 0;
    _gamLastClient = client;
    // Scope the streak to the current subject (window.SUBJECT set by the
    // subject loader / page-groups); null on the cross-subject profile view
    // (badges.html) keeps the all-subjects streak. Pass subjectOverride
    // explicitly (the Review Calendar passes null) to force a scope. Falls
    // back to the old no-arg call if the subject-aware fn isn't deployed yet.
    const p_subject = arguments.length > 1
      ? subjectOverride : ((window.SUBJECT && window.SUBJECT.slug) || null);
    let { data, error } = await client.rpc('get_my_streak', { p_subject });
    if (error) { ({ data, error } = await client.rpc('get_my_streak')); }
    if (!error && data) {
      _gamStreak = data.current || 0;
      _gamStreakLongest = data.longest || 0;
      _gamStreakLastActive = data.last_active || null;
      // Repaint the topic/home HUD if one is on this page (no-op elsewhere) —
      // callers like script.js refresh the streak after auth without repainting.
      if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    }
    // On a subject-scoped page, also fetch the all-subjects streak (p_subject
    // null) for the "overall" chip. On the cross-subject view (p_subject already
    // null) the streak above IS the overall one — reuse it, no extra round trip.
    if (p_subject && !error) {
      const { data: od, error: oe } = await client.rpc('get_my_streak', { p_subject: null });
      if (!oe && od) _gamStreakOverall = { current: od.current || 0, longest: od.longest || 0, lastActive: od.last_active || null };
    } else if (!p_subject && !error && data) {
      _gamStreakOverall = { current: _gamStreak, longest: _gamStreakLongest, lastActive: _gamStreakLastActive };
    }
  } catch (e) {}
  return _gamStreak;
}

// Human "time ago" label from an ISO timestamp OR a 'YYYY-MM-DD' date string.
// Day-only inputs (the practice-calendar buckets) are compared as whole UTC
// days so we never print a misleading "0 hours ago"; timestamps get
// minute/hour precision. Powers the "last practised …" text on the dashboard
// heatmap and the teacher dashboard. Returns '' for empty/unparseable input.
function gamificationAgoLabel(input) {
  if (!input) return '';
  const s = String(input);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const then = dateOnly ? _gamParseDay(s) : new Date(s);
  if (isNaN(then.getTime())) return '';
  const now = new Date();
  const ago = (n, w) => n + ' ' + w + (n === 1 ? '' : 's') + ' ago';
  if (dateOnly) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const days = Math.round((today - then.getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return ago(days, 'day');
    if (days < 30) return ago(Math.floor(days / 7), 'week');
    if (days < 365) return ago(Math.floor(days / 30), 'month');
    return ago(Math.floor(days / 365), 'year');
  }
  const secs = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return ago(mins, 'min');
  const hours = Math.floor(mins / 60);
  if (hours < 24) return ago(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 7) return ago(days, 'day');
  if (days < 30) return ago(Math.floor(days / 7), 'week');
  if (days < 365) return ago(Math.floor(days / 30), 'month');
  return ago(Math.floor(days / 365), 'year');
}

// Most recent 'YYYY-MM-DD' in a practice-calendar array (day strings sort
// lexically), a fallback source for "last practised" when the streak RPC
// hasn't been extended with last_active yet.
function gamificationLastActiveDay(activityDays) {
  let max = null;
  (activityDays || []).forEach(r => { if (r && r.day && (!max || r.day > max)) max = r.day; });
  return max;
}

// ── Daily Revise lifetime stats (needs a server round trip — see
// daily_revise_stats / daily-revise-stats-schema.sql). Reset to zero on
// every page load, same as the streak above; computeGamificationStats()
// falls back to this cache when no drStats argument is passed. ──

let _gamDrStats = { correctCount: 0, masteredCount: 0 };
async function gamificationRefreshDailyReviseStats(client) {
  try {
    if (!client) return _gamDrStats;
    _gamLastClient = client;
    const { data: { user } = {} } = await client.auth.getUser();
    if (!user) return _gamDrStats;
    // daily_revise_stats is one row PER SUBJECT (PK student_id + subject_slug).
    // Scope to the current subject so its XP folds into that subject's total;
    // with no subject in context (badges/profile view) sum every subject.
    const slug = (window.SUBJECT && window.SUBJECT.slug) || null;
    let query = client.from('daily_revise_stats')
      .select('total_correct, total_mastered').eq('student_id', user.id);
    if (slug) query = query.eq('subject_slug', slug);
    const { data, error } = await query;
    if (!error && data) {
      _gamDrStats = {
        correctCount: data.reduce((s, r) => s + (r.total_correct || 0), 0),
        masteredCount: data.reduce((s, r) => s + (r.total_mastered || 0), 0),
      };
      if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    }
  } catch (e) {}
  return _gamDrStats;
}

// ── Review Calendar lifetime stats (see supabase/spaced-repetition.sql) —
// topic_reviews carries a student-only SELECT policy (student_id = auth.uid()),
// so this is a direct table read, same as daily_revise_stats above, no RPC
// needed. Counts completed_at across every stage/topic/subject. Reset to
// zero on every page load; computeGamificationStats() falls back to this
// cache when no reviewStats argument is passed. ──

let _gamReviewStats = { completed: 0 };
async function gamificationRefreshReviewStats(client) {
  try {
    if (!client) return _gamReviewStats;
    _gamLastClient = client;
    const { data: { user } = {} } = await client.auth.getUser();
    if (!user) return _gamReviewStats;
    // Scope completed reviews to the current subject (page ids are
    // subject-prefixed); no subject in context = every subject.
    const slug = (window.SUBJECT && window.SUBJECT.slug) || null;
    let query = client.from('topic_reviews')
      .select('completed_at').eq('student_id', user.id);
    if (slug) query = query.like('page_id', slug + ':%');
    const { data, error } = await query;
    if (!error && data) {
      _gamReviewStats = { completed: data.filter(r => r.completed_at).length };
      if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    }
  } catch (e) {}
  return _gamReviewStats;
}

// ── Leaderboard achievements (see supabase/leaderboard.sql) — the best-ever
// tier a student has reached (top 10 / top 3 / #1), rolled up across subjects
// by get_my_leaderboard_achievements(). Written server-side only (rank is
// computed there, never trusted from the client), so the three Leaderboard
// badges these flags unlock are real. Reset to false on every page load, same
// as the two caches above; computeGamificationStats() falls back to this cache
// when no lbStats argument is passed. The board page (leaderboard.js) calls
// this after it has synced the caller's current standing. ──

let _gamLbStats = { everTop10: false, everTop3: false, everFirst: false, bestRank: null };
async function gamificationRefreshLeaderboardStats(client) {
  try {
    if (!client) return _gamLbStats;
    _gamLastClient = client;
    const { data, error } = await client.rpc('get_my_leaderboard_achievements');
    if (!error && data) {
      _gamLbStats = {
        everTop10: !!data.ever_top10, everTop3: !!data.ever_top3,
        everFirst: !!data.ever_first, bestRank: data.best_rank == null ? null : data.best_rank,
      };
      if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    }
  } catch (e) {}
  return _gamLbStats;
}

// ── Daily goal (device-local, display-only — XP stays pure) ──
// Gives the day-streak something visible to chase: answer N questions
// today. Counted locally per calendar day; old keys are pruned as we go.
// 10 per subject — a student with 9 subjects can't realistically hit 20 in
// each. The streak is secured by the first CORRECT answer (see _gamBumpDaily);
// this is the stretch target on top.
const GAMIFICATION_DAILY_GOAL = 10;

// The counter is scoped per STUDENT, per SUBJECT, per day. It used to be a
// bare `gcse_daily_<date>`, which meant every student sharing a browser (and
// every subject) incremented ONE counter — so a student who had answered
// nothing could show 20/20, and the goal celebration could never fire because
// the shared count was already past the goal. Date first so pruning old days
// is a prefix test that never wipes today's other subjects.
function _gamTodayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function _gamDailyOwner() {
  try {
    const s = JSON.parse(localStorage.getItem('gcse_session_v1') || 'null');
    if (s && s.username) return String(s.username);
  } catch (e) {}
  return 'anon';
}
function _gamDailySubject() { return (window.SUBJECT && window.SUBJECT.slug) || 'all'; }
function _gamDailyKey() {
  return `gcse_daily_${_gamTodayStr()}_${_gamDailyOwner()}_${_gamDailySubject()}`;
}
// Shown-once-per-day flag for the "streak safe" toast (same scoping).
function _gamStreakSafeKey() {
  return `gcse_safe_${_gamTodayStr()}_${_gamDailyOwner()}_${_gamDailySubject()}`;
}

function gamificationDailyCount() {
  try { return parseInt(localStorage.getItem(_gamDailyKey()) || '0', 10) || 0; } catch (e) { return 0; }
}
function _gamSetDailyCount(n) {
  try { localStorage.setItem(_gamDailyKey(), String(n)); } catch (e) {}
}
function _gamPruneOldDaily() {
  const keep = `gcse_daily_${_gamTodayStr()}_`;
  const keepSafe = `gcse_safe_${_gamTodayStr()}_`;
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.indexOf('gcse_daily_') === 0 && k.indexOf(keep) !== 0) localStorage.removeItem(k);
      if (k.indexOf('gcse_safe_') === 0 && k.indexOf(keepSafe) !== 0) localStorage.removeItem(k);
    });
  } catch (e) {}
}

// isCorrect: true only for a correct answer. The FIRST correct answer of the
// day in this subject is what secures the streak (server rule: a day counts
// when there's at least one correct answer), so that's when we celebrate —
// the 10-question daily goal is a separate, bigger target.
function _gamBumpDaily(isCorrect) {
  _gamPruneOldDaily();
  _gamAnsweredThisSession = true;   // sync stops correcting downwards from here
  const n = gamificationDailyCount() + 1;
  _gamSetDailyCount(n);

  if (isCorrect === true) {
    let shown = null;
    try { shown = localStorage.getItem(_gamStreakSafeKey()); } catch (e) {}
    if (!shown) {
      try { localStorage.setItem(_gamStreakSafeKey(), '1'); } catch (e) {}
      try { gamificationCelebrateStreakSafe(n); } catch (e) {}
    }
  }
  if (n === GAMIFICATION_DAILY_GOAL) {
    try { gamificationCelebrateDailyGoal(); } catch (e) {}
  }
  return n;
}

// Reconcile today's count with the server so the chip is right on a second
// device and after a browser wipe.
//
// Counts DISTINCT questions, NOT raw events: progress_events logs one row per
// ATTEMPT (a wrong FIB pick, a retried MCQ, a re-answer each add a row — see
// the deliberate wrong-pick logging in script.js), so the old
// get_my_activity_days row-count made "2 questions answered" read as 4. The
// heatmap wants raw activity; this chip means questions, so they differ.
//
// Authoritative on page load (it can correct a locally-inflated count), but
// only ever raises the number once the student has started answering in this
// session, so the chip never visibly jumps backwards mid-practice while a
// write is still in flight.
let _gamAnsweredThisSession = false;
async function gamificationSyncDailyCount(client) {
  try {
    if (!client) return gamificationDailyCount();
    const slug = (window.SUBJECT && window.SUBJECT.slug) || null;
    const start = new Date(); start.setHours(0, 0, 0, 0);   // local midnight
    // RLS (progress_events_self_select) already limits this to the caller.
    let q = client.from('progress_events')
      .select('page_id, section, question_id, answer')
      .gte('answered_at', start.toISOString())
      .limit(2000);
    if (slug) q = q.like('page_id', slug + ':%');
    const { data, error } = await q;
    if (error || !Array.isArray(data)) return gamificationDailyCount();

    // Mirror the client rules exactly, or the load-time reconcile would put the
    // inflated number straight back: skip flashcards, and skip progress markers
    // (a card ticked "read" stores the bare JSON `true`; real answers are
    // objects), which is the other half of the check-up double-count.
    const seen = new Set();
    data.forEach(r => {
      if (!r || r.section === 'flashcards' || r.answer === true) return;
      seen.add(`${r.page_id}|${r.section}|${r.question_id}`);
    });
    const server = seen.size;
    const local = gamificationDailyCount();
    if (server !== local && (server > local || !_gamAnsweredThisSession)) {
      _gamPruneOldDaily();
      _gamSetDailyCount(server);
      if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    }
  } catch (e) {}
  return gamificationDailyCount();
}

// ── Flashcard daily review cap (separate from the daily goal above —
// flashcards are deliberately excluded from that counter/streak, since this
// one caps volume to enforce spaced repetition rather than reward it).
// 60/day lets a student finish one full deck (~18 cards) plus a couple of
// review-wrong rounds — the old cap of 20 blocked completing even a single
// deck with its review pass. ──
const FC_DAILY_CAP = 60;

function _fcDailyKey() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `gcse_fc_daily_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fcDailyReviewCount() {
  try { return parseInt(localStorage.getItem(_fcDailyKey()) || '0', 10) || 0; } catch (e) { return 0; }
}

function _fcBumpDaily() {
  const key = _fcDailyKey();
  const n = fcDailyReviewCount() + 1;
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('gcse_fc_daily_') && k !== key) localStorage.removeItem(k);
    });
    localStorage.setItem(key, String(n));
  } catch (e) {}
  return n;
}

// ── Per-answer hook, called from script.js's ProgressStore.saveAnswers() ──

// In-session combo: consecutive correct answers (display-only — XP stays a
// pure function of progress data). Neutral answers (reading a card,
// revealing a mark scheme) neither extend nor break it.
let _gamCombo = 0;
const GAMIFICATION_COMBO_MILESTONES = [3, 5, 8, 12, 16, 20, 25, 30, 40, 50];

function _gamTrackCombo(isCorrect) {
  if (isCorrect === true) {
    _gamCombo++;
    if (GAMIFICATION_COMBO_MILESTONES.includes(_gamCombo)) {
      gamificationPlaySound('combo');
      gamificationShowComboToast(_gamCombo);
    }
  } else if (isCorrect === false) {
    _gamCombo = 0;
  }
}

let _gamLevelSeen = null;
let _gamCheckTimer = null;
// opts.countsAsQuestion === false = a progress marker (a Key Learning /
// Misconceptions / Exam Tips card ticked "read"), not an answered question.
// It still earns XP, but must NOT advance the daily-goal counter — otherwise
// one check-up question counts twice (card marker + the answer itself).
function gamificationOnAnswer(isCorrect, section, opts) {
  if (typeof PAGE_GROUPS === 'undefined' || typeof ProgressStore === 'undefined') return;
  gamificationPlaySound(isCorrect === true ? 'correct' : isCorrect === false ? 'wrong' : 'neutral');
  // XP is only earned for CORRECT answers (quiz sections store done =
  // correct count), so a wrong answer gets no "+10 XP" flash. Neutral
  // actions (reading a card, revealing a mark scheme) still earn.
  // Flashcards never earn XP (see computeGamificationStats).
  if (isCorrect !== false && section !== 'flashcards') gamificationShowXpToast(GAMIFICATION_XP_PER_QUESTION);
  if (section !== 'flashcards' && !(opts && opts.countsAsQuestion === false)) _gamBumpDaily(isCorrect);
  _gamTrackCombo(isCorrect);

  // Debounced so a burst of quick answers doesn't spam badge/level toasts.
  clearTimeout(_gamCheckTimer);
  _gamCheckTimer = setTimeout(() => {
    const stats = computeGamificationStats(ProgressStore.getAll(), _gamStreak);
    if (_gamLevelSeen != null && stats.level > _gamLevelSeen) {
      gamificationPlaySound('levelup');
      gamificationShowLevelUpToast(stats.level);
    }
    _gamLevelSeen = stats.level;
    gamificationCheckNewBadges(stats);
    if (typeof _gamUpdateHud === 'function') _gamUpdateHud(stats);
    if (typeof _gamMaybeCelebrateTopic === 'function') _gamMaybeCelebrateTopic();
  }, 450);
}

// Prime the "already at this level" baseline once, quietly, so the very
// first answer of a session doesn't wrongly look like a level-up.
(function gamificationPrimeLevel() {
  if (typeof PAGE_GROUPS === 'undefined' || typeof ProgressStore === 'undefined') return;
  try { _gamLevelSeen = computeGamificationStats(ProgressStore.getAll(), 0).level; } catch (e) {}
})();

// ══════════════════════════════════════════════════════════════
// TOPIC-PAGE HUD + PREV/NEXT TOPIC NAVIGATION
// Auto-injected on topic pages only (detected by a .tab-bar plus a page
// id that exists in PAGE_GROUPS — dashboards have neither, so they keep
// their own gam-bar markup). Surfaces the same level/XP/streak/badges
// state the dashboard shows, plus this topic's own progress, and adds
// previous/next topic links so students can move through the course
// without bouncing back to the home page. Lives entirely inside <main>
// so it is safe in both the mobile flow layout and the desktop
// sidebar/tabbar body grid in style.css.
// ══════════════════════════════════════════════════════════════

function _gamOrderedPages() {
  const out = [];
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => out.push({ ...p, groupTitle: g.title, colour: g.colour })));
  return out;
}

// XP still on the table for a topic: 10/question + 50/section + the
// 200 topic bonus (flashcards never earn XP — see computeGamificationStats).
function _gamPagePotentialXp(pageId) {
  const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pageId];
  if (!t) return 0;
  let xp = 0, any = false;
  Object.keys(t).forEach(k => {
    if (k !== 'flashcards' && t[k] > 0) { any = true; xp += t[k] * GAMIFICATION_XP_PER_QUESTION + GAMIFICATION_CATEGORY_BONUS; }
  });
  return any ? xp + GAMIFICATION_TOPIC_BONUS : 0;
}

// Progress source that works on pages without script.js (index.html):
// prefer the live ProgressStore, otherwise rebuild the same
// {pageId:{section:{done,total}}} shape straight from its localStorage
// keys (PREFIX and key format mirror ProgressStore in script.js).
function _gamReadLocalProgress() {
  const PREFIX = 'geo_progress_';
  const result = {};
  try {
    Object.keys(localStorage).forEach(k => {
      if (!k.startsWith(PREFIX)) return;
      const rest = k.slice(PREFIX.length);
      if (rest.indexOf('__answers__') !== -1) return;
      const sep = rest.indexOf('__');
      if (sep <= 0) return;
      const pageId = rest.slice(0, sep), section = rest.slice(sep + 2);
      if (!section) return;
      let v = null;
      try { v = JSON.parse(localStorage.getItem(k)); } catch (e) {}
      if (!v) return;
      (result[pageId] = result[pageId] || {})[section] = { done: v.done || 0, total: v.total || 0, ts: v.ts || 0 };
    });
  } catch (e) {}
  return result;
}

function _gamProgressData() {
  let base = null;
  if (typeof ProgressStore !== 'undefined') {
    try { base = ProgressStore.getAll(); } catch (e) {}
  }
  if (!base) base = _gamReadLocalProgress();
  // On the home page a server snapshot may be merged in for display (this
  // device's localStorage can lag another device) — take the higher done.
  if (_gamServerProgress) base = _gamMergeProgress(base, _gamServerProgress);
  return base;
}

let _gamServerProgress = null;

function _gamMergeProgress(local, server) {
  const out = {};
  [local, server].forEach(src => {
    Object.keys(src || {}).forEach(pid => {
      Object.keys(src[pid]).forEach(section => {
        const cur = (out[pid] = out[pid] || {})[section] || { done: 0, total: 0, ts: 0 };
        const row = src[pid][section];
        out[pid][section] = {
          done: Math.max(cur.done || 0, row.done || 0),
          total: Math.max(cur.total || 0, row.total || 0),
          ts: Math.max(cur.ts || 0, row.ts || 0),
        };
      });
    });
  });
  return out;
}

// Home-page display refresh from the server (students only): pulls the
// progress_summary rollups, merges them over local data, and repaints the
// hero HUD, the continue card and every topic-card footer. Display-only —
// nothing is written to localStorage (topic pages do real hydration via
// gcseHydrateFromServer in script.js).
async function gamificationRefreshHomeFromServer(client) {
  try {
    if (!client) return;
    const { data, error } = await client.from('progress_summary').select('page_id, section, done, total');
    if (error || !data || !data.length) return;
    const prog = {};
    data.forEach(r => {
      (prog[r.page_id] = prog[r.page_id] || {})[r.section] = { done: r.done || 0, total: r.total || 0 };
    });
    _gamServerProgress = prog;
  } catch (e) { return; }

  _gamUpdateHud();
  document.querySelectorAll('.gam-card-prog').forEach(el => el.remove());
  document.querySelectorAll('.topic-card.gam-complete').forEach(el => el.classList.remove('gam-complete'));
  gamificationDecorateTopicCards();
  const mount = document.getElementById('gamHudMount');
  if (mount) {
    const cont = mount.querySelector('.gam-continue');
    if (cont) cont.remove();
    _gamInjectContinueCard(mount);
  }
}

// This topic's done/total across scored sections, always against TRUE
// totals (so an untouched topic reads 0/58 rather than 0/0).
function _gamTopicProgress(pageId, progress) {
  const pd = (progress || {})[pageId] || {};
  let done = 0, total = 0, anySection = false, allComplete = true;
  SECTIONS.forEach(s => {
    if (s.key === 'flashcards') return;
    const d = pd[s.key] || {};
    const t = trueSectionTotal(pageId, s.key, d.total || 0);
    done += d.done || 0;
    total += t;
    if (t > 0) { anySection = true; if ((d.done || 0) < t) allComplete = false; }
  });
  return { done, total, complete: anySection && allComplete };
}

function _gamInjectHudStyles() {
  if (document.getElementById('gam-hud-styles')) return;
  const style = document.createElement('style');
  style.id = 'gam-hud-styles';
  style.textContent = `
    .gam-hud{background:var(--card-bg,#fffcf6);border:1.5px solid var(--border,#c9bfaa);border-radius:12px;padding:14px 18px 12px;margin:0 0 22px;}
    .gam-hud-main{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
    .gam-hud-level{display:flex;flex-direction:column;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7a5c9e,#4a6fa5);color:#fff;flex-shrink:0;box-shadow:0 3px 10px rgba(74,111,165,.35);}
    .gam-hud-level-num{font-family:'Playfair Display',serif;font-weight:700;font-size:18px;line-height:1;}
    .gam-hud-level-lbl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;}
    @keyframes gamHudLevelPop{0%{transform:scale(1)}45%{transform:scale(1.22)}100%{transform:scale(1)}}
    .gam-hud-level.pop{animation:gamHudLevelPop .6s ease;}
    .gam-hud-xp{flex:1;min-width:150px;}
    .gam-hud-xp-lbl{display:flex;justify-content:space-between;gap:10px;font-family:'DM Mono',monospace;font-size:10px;color:var(--mid,#5a6e7f);margin-bottom:5px;}
    .gam-hud-xp-track{background:var(--border,#c9bfaa);border-radius:99px;height:8px;overflow:hidden;}
    .gam-hud-xp-fill{height:100%;width:0%;background:linear-gradient(90deg,#7a5c9e,#4a6fa5);border-radius:99px;transition:width .5s ease;}
    .gam-hud-chips{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .gam-hud-chip{display:inline-flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:11.5px;font-weight:600;color:var(--ink,#1a2332);background:var(--cream,#ede7d9);border:1px solid var(--border,#c9bfaa);border-radius:99px;padding:6px 12px;text-decoration:none;cursor:pointer;transition:border-color .15s,background .15s;}
    .gam-hud-chip:hover{border-color:var(--accent,#4a6fa5);background:var(--card-bg,#fffcf6);}
    .gam-hud-streak{color:#8f6d19;cursor:help;}
    .gam-hud-daily{cursor:help;}
    .gam-hud-daily.goal-met{background:rgba(45,122,79,.14);border-color:#2d7a4f;color:#2d7a4f;}
    .gam-hud-topic{display:flex;align-items:center;gap:10px;margin-top:11px;padding-top:10px;border-top:1px dashed var(--border,#c9bfaa);}
    .gam-hud-topic-lbl{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mid,#5a6e7f);white-space:nowrap;}
    .gam-hud-topic-track{flex:1;background:var(--border,#c9bfaa);border-radius:99px;height:6px;overflow:hidden;}
    .gam-hud-topic-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--gold,#d4a843),#b8860b);border-radius:99px;transition:width .5s ease;}
    .gam-hud-topic-count{font-family:'DM Mono',monospace;font-size:10.5px;color:var(--mid,#5a6e7f);white-space:nowrap;}
    .gam-hud-topic-done{font-family:'DM Mono',monospace;font-size:10.5px;font-weight:600;color:#2d7a4f;white-space:nowrap;}
    .gam-hud-nextup{background:linear-gradient(135deg,#d4a843,#b8860b) !important;color:#fff !important;border-color:#b8860b !important;}
    .gam-hud-nextup:hover{filter:brightness(1.08);}
    /* ── Prev/next topic nav ── */
    .gam-topic-nav{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;margin:36px 0 8px;padding-top:22px;border-top:2px solid var(--border,#c9bfaa);}
    .gam-nav-card{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:4px;background:var(--card-bg,#fffcf6);border:1.5px solid var(--border,#c9bfaa);border-radius:10px;padding:14px 16px 13px;text-decoration:none;color:var(--ink,#1a2332);transition:box-shadow .2s,transform .2s,border-color .2s;}
    .gam-nav-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--gam-accent,var(--accent,#4a6fa5));}
    .gam-nav-card:hover{box-shadow:0 6px 22px rgba(0,0,0,.13);transform:translateY(-2px);border-color:#b0a490;}
    .gam-nav-next{text-align:right;align-items:flex-end;}
    .gam-nav-next::before{left:auto;right:0;}
    .gam-nav-dir{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mid,#5a6e7f);}
    .gam-nav-name{font-family:'Playfair Display',serif;font-weight:700;font-size:14.5px;line-height:1.3;}
    .gam-nav-xp{font-family:'DM Mono',monospace;font-size:10px;color:#8f6d19;}
    .gam-nav-home{align-items:center;justify-content:center;text-align:center;font-size:20px;padding:14px 18px;}
    .gam-nav-home::before{display:none;}
    .gam-nav-home span{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mid,#5a6e7f);}
    .gam-nav-spacer{visibility:hidden;}
    .gam-topic-nav .celebrate{border-color:var(--gold,#d4a843);background:linear-gradient(135deg,rgba(212,168,67,.14),var(--card-bg,#fffcf6));}
    .gam-topic-nav .celebrate .gam-nav-dir{color:#8f6d19;}
    /* ── Home-page hero variant (dark background) ── */
    .gam-hud--hero{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16);margin:26px 0 0;position:relative;z-index:1;}
    .gam-hud--hero .gam-hud-xp-lbl{color:#9fb0bd;}
    .gam-hud--hero .gam-hud-xp-track{background:rgba(255,255,255,.16);}
    .gam-hud--hero .gam-hud-chip{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.2);color:var(--chrome-text, var(--paper,#f5f0e8));}
    .gam-hud--hero .gam-hud-chip:hover{border-color:var(--gold,#d4a843);background:rgba(255,255,255,.14);}
    .gam-hud--hero .gam-hud-streak{color:var(--gold,#d4a843);}
    /* ── "Continue where you left off" hero card ── */
    .gam-continue{display:flex;align-items:center;gap:14px;margin-top:14px;background:linear-gradient(135deg,#d4a843,#b8860b);border-radius:14px;padding:14px 18px;text-decoration:none;color:#fff;position:relative;z-index:1;box-shadow:0 8px 24px rgba(184,134,11,.35);transition:transform .15s,box-shadow .15s;}
    .gam-continue:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(184,134,11,.5);}
    .gam-continue-play{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.22);font-size:15px;flex-shrink:0;}
    .gam-continue-txt{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0;}
    .gam-continue-lbl{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;}
    .gam-continue-name{font-family:'Playfair Display',serif;font-weight:700;font-size:17px;line-height:1.25;}
    .gam-continue-bar{display:block;height:5px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;margin-top:5px;max-width:320px;}
    .gam-continue-bar > span{display:block;height:100%;background:#fff;border-radius:99px;}
    .gam-continue-pct{font-family:'DM Mono',monospace;font-size:13px;font-weight:600;white-space:nowrap;}
    /* ── Home-page topic-card progress footers ── */
    .gam-card-prog{display:flex;align-items:center;gap:8px;margin-top:12px;}
    .gam-card-prog-track{flex:1;height:5px;border-radius:99px;background:var(--border,#c9bfaa);overflow:hidden;}
    .gam-card-prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent,#4a6fa5),var(--gold,#d4a843));}
    .gam-card-prog-pct{font-family:'DM Mono',monospace;font-size:10px;color:var(--mid,#5a6e7f);white-space:nowrap;}
    .gam-card-prog-xp{font-family:'DM Mono',monospace;font-size:10px;color:#8f6d19;white-space:nowrap;}
    .gam-card-complete-chip{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:#8f6d19;background:rgba(212,168,67,.16);border:1px solid var(--gold,#d4a843);border-radius:99px;padding:2px 9px;}
    a.topic-card.gam-complete{border-color:var(--gold,#d4a843);}
    /* ── Topic-complete celebration ── */
    .gam-celeb-overlay{position:fixed;inset:0;z-index:480;background:rgba(15,25,35,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .3s;}
    .gam-celeb-overlay.show{opacity:1;}
    .gam-celeb-card{background:var(--card-bg,#fffcf6);border:2px solid var(--gold,#d4a843);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.45);max-width:420px;width:100%;padding:34px 30px 26px;text-align:center;font-family:'DM Sans',sans-serif;color:var(--ink,#1a2332);transform:scale(.6) rotate(-3deg);transition:transform .45s cubic-bezier(.34,1.5,.5,1);}
    .gam-celeb-overlay.show .gam-celeb-card{transform:scale(1) rotate(0);}
    .gam-celeb-trophy{font-size:56px;line-height:1;animation:gamTrophyFloat 2.4s ease-in-out infinite;}
    @keyframes gamTrophyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
    .gam-celeb-title{font-family:'Playfair Display',serif;font-weight:900;font-size:27px;margin:12px 0 6px;}
    .gam-celeb-sub{font-size:13.5px;color:var(--mid,#5a6e7f);line-height:1.5;margin-bottom:16px;}
    .gam-celeb-bonus{display:inline-block;font-family:'DM Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.1em;color:#8f6d19;background:rgba(212,168,67,.16);border:1.5px solid var(--gold,#d4a843);border-radius:99px;padding:7px 18px;margin-bottom:20px;}
    .gam-celeb-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .gam-celeb-btn{font-family:'DM Mono',monospace;font-size:12px;font-weight:600;padding:10px 18px;border-radius:8px;cursor:pointer;text-decoration:none;border:1.5px solid var(--gold,#d4a843);background:linear-gradient(135deg,#d4a843,#b8860b);color:#fff;transition:transform .15s,box-shadow .15s;}
    .gam-celeb-btn:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(184,134,11,.4);}
    .gam-celeb-btn.ghost{background:transparent;color:var(--ink,#1a2332);border-color:var(--border,#c9bfaa);}
    .gam-confetti{position:fixed;top:-18px;width:9px;height:15px;z-index:481;pointer-events:none;animation:gamConfettiFall linear forwards;}
    @keyframes gamConfettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(680deg);opacity:0}}
    @media (prefers-reduced-motion:reduce){
      .gam-confetti{display:none;}
      .gam-celeb-trophy{animation:none;}
      .gam-celeb-card{transition:none;transform:none;}
    }
    @media (max-width:700px){
      .gam-hud{padding:12px 12px 10px;}
      .gam-hud-main{gap:10px;}
      .gam-hud-dash span{display:none;}
      .gam-topic-nav{grid-template-columns:1fr 1fr;}
      .gam-nav-home{display:none;}
      .gam-nav-spacer{display:none;}
      .gam-topic-nav .gam-nav-card:only-child{grid-column:1/-1;}
    }
  `;
  document.head.appendChild(style);
}

let _gamHudEl = null;
let _gamHudPageId = null;
let _gamHudLevelShown = null;

function _gamUpdateHud(stats) {
  if (!_gamHudEl) return;
  if (!stats) { try { stats = computeGamificationStats(_gamProgressData(), _gamStreak); } catch (e) { return; } }
  const $ = id => _gamHudEl.querySelector('#' + id);

  $('gamHudLevelNum').textContent = stats.level;
  const levelEl = $('gamHudLevel');
  if (_gamHudLevelShown != null && stats.level > _gamHudLevelShown) {
    levelEl.classList.remove('pop');
    void levelEl.offsetWidth; // restart the animation
    levelEl.classList.add('pop');
  }
  _gamHudLevelShown = stats.level;

  $('gamHudXpLbl').textContent = `${stats.xpIntoLevel} / ${stats.xpForNextLevel} XP to level ${stats.level + 1}`;
  $('gamHudXpTotal').textContent = `${stats.xp} XP total`;
  const pct = stats.xpForNextLevel ? Math.round(stats.xpIntoLevel / stats.xpForNextLevel * 100) : 0;
  $('gamHudXpFill').style.width = pct + '%';

  $('gamHudStreak').textContent = stats.streak;

  const dailyEl = $('gamHudDailyCount');
  if (dailyEl) {
    const n = gamificationDailyCount();
    dailyEl.textContent = `${Math.min(n, GAMIFICATION_DAILY_GOAL)}/${GAMIFICATION_DAILY_GOAL}`;
    const chip = $('gamHudDaily');
    if (chip) chip.classList.toggle('goal-met', n >= GAMIFICATION_DAILY_GOAL);
  }

  const earned = gamificationEarnedBadges(stats);
  $('gamHudBadgeCount').textContent = `${earned.length}/${BADGE_DEFS.length}`;

  // This topic's own progress row
  if (_gamHudPageId) {
    const tp = _gamTopicProgress(_gamHudPageId, _gamProgressData());
    $('gamHudTopicFill').style.width = (tp.total ? Math.round(tp.done / tp.total * 100) : 0) + '%';
    $('gamHudTopicCount').textContent = tp.total ? `${Math.min(tp.done, tp.total)}/${tp.total}` : '–';
    $('gamHudTopicDone').hidden = !tp.complete;

    // "▶ Next up" — appears only once the activity the student is working
    // on is finished, pointing at the next unfinished one. While they're
    // mid-activity it stays hidden (no point advertising the tab they're
    // already on). When the whole topic is complete it points at the next
    // lesson instead.
    const nextBtn = $('gamHudNextUp');
    if (nextBtn) {
      let show = false;
      if (tp.complete) {
        const nextCard = document.getElementById('gamNavNextCard');
        const href = nextCard ? nextCard.getAttribute('href') : null;
        if (href) {
          const nameEl = nextCard.querySelector('.gam-nav-name');
          show = true;
          nextBtn.innerHTML = href.indexOf('/dashboard.html') === 0
            ? '🎉 Topic done — see my progress →'
            : `▶ Next lesson: 📚 ${nameEl ? nameEl.textContent : 'Next topic'} →`;
          nextBtn.dataset.href = href;
          delete nextBtn.dataset.tabId;
        }
      } else if (typeof ACTIVITY_ORDER !== 'undefined'
          && typeof sectionIsComplete === 'function' && typeof _activityTotal === 'function') {
        const next = ACTIVITY_ORDER.find(a => !a.optional && _activityTotal(a.section) > 0 && !sectionIsComplete(a.section)) || null;
        if (next && next.section !== _gamActiveTabSection()) {
          show = true;
          nextBtn.innerHTML = `▶ Next up: ${next.icon} ${next.label} →`;
          nextBtn.dataset.tabId = next.tabId;
          delete nextBtn.dataset.href;
        }
      }
      nextBtn.hidden = !show;
    }

    // Light up the "next topic" card once this topic is finished
    const nextCard = document.getElementById('gamNavNextCard');
    if (nextCard) {
      nextCard.classList.toggle('celebrate', tp.complete);
      const dir = nextCard.querySelector('.gam-nav-dir');
      if (dir) dir.textContent = tp.complete ? '🎉 Topic complete — next up' : 'Next →';
    }
  }
}

// ── Topic-complete celebration (confetti + card, once per topic) ──

function _gamCelebFlagKey(pageId) { return 'gcse_topic_celebrated_' + pageId; }

// Quietly mark this topic as already-celebrated when it's complete —
// used at HUD init and after cross-device hydration, so progress that
// merely *arrives* finished never pops confetti.
function gamificationMarkTopicCelebratedIfComplete() {
  if (!_gamHudPageId) return;
  try {
    if (_gamTopicProgress(_gamHudPageId, _gamProgressData()).complete) {
      localStorage.setItem(_gamCelebFlagKey(_gamHudPageId), '1');
    }
  } catch (e) {}
}

function _gamConfettiBurst(count) {
  _gamInjectHudStyles();
  const colours = ['#7a5c9e', '#d4a843', '#1a6b6b', '#c84b31', '#2d7a4f', '#4a6fa5'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'gam-confetti';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colours[i % colours.length];
    piece.style.animationDuration = (2 + Math.random() * 1.6) + 's';
    piece.style.animationDelay = (Math.random() * .7) + 's';
    piece.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4600);
  }
}

// Fired from the debounced answer check the moment the last activity of a
// topic is finished. The localStorage flag makes it once-per-topic; the
// flag is cleared by ProgressStore.clearPage() when a student resets the
// page, and set quietly at HUD init for topics that were already complete
// (so a long-finished page doesn't pop confetti on every future visit).
function _gamMaybeCelebrateTopic() {
  if (!_gamHudPageId || typeof ProgressStore === 'undefined') return;
  let tp;
  try { tp = _gamTopicProgress(_gamHudPageId, ProgressStore.getAll()); } catch (e) { return; }
  if (!tp.complete) return;
  const key = _gamCelebFlagKey(_gamHudPageId);
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch (e) {}
  _gamShowTopicCelebration();
}

function _gamShowTopicCelebration() {
  if (document.getElementById('gamCelebOverlay')) return;
  _gamInjectHudStyles();
  gamificationPlaySound('levelup');
  _gamConfettiBurst(44);

  const name = (typeof pageTitle === 'function' && _gamHudPageId) ? pageTitle(_gamHudPageId) : 'this topic';
  const nextCard = document.getElementById('gamNavNextCard');
  const nextHref = nextCard ? nextCard.getAttribute('href') : '/dashboard.html';
  const nextLabel = nextCard && nextCard.getAttribute('href').indexOf('/dashboard.html') !== 0 ? 'Next topic →' : 'See my progress →';

  const overlay = document.createElement('div');
  overlay.className = 'gam-celeb-overlay';
  overlay.id = 'gamCelebOverlay';
  overlay.innerHTML = `
    <div class="gam-celeb-card" role="dialog" aria-modal="true" aria-label="Topic complete">
      <div class="gam-celeb-trophy" aria-hidden="true">🏆</div>
      <div class="gam-celeb-title">Topic Complete!</div>
      <p class="gam-celeb-sub">You've finished every activity in<br><strong>${name}</strong></p>
      <div class="gam-celeb-bonus">+${GAMIFICATION_TOPIC_BONUS} XP TOPIC BONUS</div>
      <div class="gam-celeb-actions">
        <button type="button" class="gam-celeb-btn ghost" id="gamCelebClose">Keep practising</button>
        <a class="gam-celeb-btn" href="${nextHref}">${nextLabel}</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 320);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#gamCelebClose').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
}

// The level/XP/streak/badges row shared by the topic-page HUD and the
// home-page hero HUD (same element ids, so _gamUpdateHud repaints both).
function _gamHudMainHtml() {
  return `
    <div class="gam-hud-main">
      <div class="gam-hud-level" id="gamHudLevel" title="Earn XP by answering questions to level up">
        <div class="gam-hud-level-num" id="gamHudLevelNum">1</div>
        <div class="gam-hud-level-lbl">Level</div>
      </div>
      <div class="gam-hud-xp">
        <div class="gam-hud-xp-lbl"><span id="gamHudXpLbl">0 XP</span><span id="gamHudXpTotal"></span></div>
        <div class="gam-hud-xp-track"><div class="gam-hud-xp-fill" id="gamHudXpFill"></div></div>
      </div>
      <div class="gam-hud-chips">
        <span class="gam-hud-chip gam-hud-daily" id="gamHudDaily" title="Daily goal — answer ${GAMIFICATION_DAILY_GOAL} questions today (on this device) to keep your streak alive">🎯 <span id="gamHudDailyCount">0/${GAMIFICATION_DAILY_GOAL}</span></span>
        <span class="gam-hud-chip gam-hud-streak" title="Days in a row you've answered questions">🔥 <span id="gamHudStreak">0</span></span>
        <a class="gam-hud-chip gam-hud-badges-btn" id="gamHudBadgesBtn" href="/badges.html">🏅 <span id="gamHudBadgeCount">0/${BADGE_DEFS.length}</span></a>
      </div>
    </div>`;
}


// Reusable sound on/off toggle — lives in the site nav on topic pages
// and in the hero nav on index.html (dashboards keep their own control,
// all sharing the same localStorage flag).
function gamificationCreateSoundButton(cls) {
  const btn = document.createElement('button');
  btn.type = 'button';
  if (cls) btn.className = cls;
  btn.title = 'Toggle sound effects';
  btn.setAttribute('aria-label', 'Toggle sound effects');
  const paint = () => { btn.textContent = gamificationSoundEnabled() ? '🔊' : '🔇'; };
  paint();
  btn.addEventListener('click', () => {
    gamificationSetSoundEnabled(!gamificationSoundEnabled());
    paint();
  });
  return btn;
}

function _gamInjectTopicHud(current) {
  const main = document.querySelector('main');
  if (!main) return;
  _gamInjectHudStyles();

  const hud = document.createElement('div');
  hud.className = 'gam-hud';
  hud.id = 'gamHud';
  hud.innerHTML = _gamHudMainHtml() + `
    <div class="gam-hud-topic">
      <span class="gam-hud-topic-lbl">This topic</span>
      <div class="gam-hud-topic-track"><div class="gam-hud-topic-fill" id="gamHudTopicFill"></div></div>
      <span class="gam-hud-topic-count" id="gamHudTopicCount">–</span>
      <span class="gam-hud-topic-done" id="gamHudTopicDone" hidden>✓ Complete · +${GAMIFICATION_TOPIC_BONUS} XP bonus banked</span>
      <button type="button" class="gam-hud-chip gam-hud-nextup" id="gamHudNextUp" hidden>▶ Next up</button>
    </div>`;
  main.insertBefore(hud, main.firstChild);
  _gamHudEl = hud;
  _gamHudPageId = current.id;
  hud.querySelector('#gamHudNextUp').addEventListener('click', function () {
    if (this.dataset.href) { location.href = this.dataset.href; return; }
    if (this.dataset.tabId && typeof goToActivity === 'function') goToActivity(this.dataset.tabId);
  });
}

// Which activity's tab panel is currently open (null on non-topic pages).
function _gamActiveTabSection() {
  const panel = document.querySelector('.tab-panel.active');
  if (!panel || typeof ACTIVITY_ORDER === 'undefined') return null;
  const tabId = (panel.id || '').replace(/^tab-/, '');
  const act = ACTIVITY_ORDER.find(a => a.tabId === tabId);
  return act ? act.section : null;
}

// Home-page hero variant: same status row, no "this topic" bar.
function _gamInjectHomeHud(mount) {
  _gamInjectHudStyles();
  const hud = document.createElement('div');
  hud.className = 'gam-hud gam-hud--hero';
  hud.id = 'gamHud';
  hud.innerHTML = _gamHudMainHtml();
  mount.appendChild(hud);
  _gamHudEl = hud;
  _gamHudPageId = null;
}

// "Continue where you left off" — the most recently worked-on,
// not-yet-complete topic (by the ts ProgressStore stamps on every save);
// falls back to the first incomplete topic in course order for students
// who haven't started anything on this device yet.
function _gamInjectContinueCard(mount) {
  if (mount.querySelector('.gam-continue')) return;
  const data = _gamProgressData();
  const pagesById = {};
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { pagesById[p.id] = p; }));

  let bestPage = null, bestTs = 0;
  Object.keys(data).forEach(pid => {
    const page = pagesById[pid];
    if (!page || !_gamHasGradableContent(pid)) return;
    const tp = _gamTopicProgress(pid, data);
    if (tp.complete || tp.done === 0) return;
    let ts = 0;
    Object.keys(data[pid]).forEach(s => { ts = Math.max(ts, data[pid][s].ts || 0); });
    if (ts >= bestTs) { bestTs = ts; bestPage = page; }
  });
  if (!bestPage) {
    const seq = [];
    PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { if (_gamHasGradableContent(p.id)) seq.push(p); }));
    bestPage = seq.find(p => !_gamTopicProgress(p.id, data).complete) || null;
  }
  if (!bestPage) return; // whole course complete — nothing to continue

  const tp = _gamTopicProgress(bestPage.id, data);
  const pct = tp.total ? Math.round(tp.done / tp.total * 100) : 0;
  const started = tp.done > 0;

  const card = document.createElement('a');
  card.className = 'gam-continue';
  card.href = bestPage.href;
  card.innerHTML = `
    <span class="gam-continue-play" aria-hidden="true">▶</span>
    <span class="gam-continue-txt">
      <span class="gam-continue-lbl">${started ? 'Continue where you left off' : 'Start your next topic'}</span>
      <span class="gam-continue-name">${bestPage.name}</span>
      ${started ? `<span class="gam-continue-bar"><span style="width:${pct}%"></span></span>` : ''}
    </span>
    <span class="gam-continue-pct">${started ? pct + '%' : '⚡ +' + _gamPagePotentialXp(bestPage.id) + ' XP'}</span>`;
  mount.appendChild(card);
}

// Adds a progress footer to every curriculum card on the home page:
// a gold "Complete" chip, an in-progress bar with %, or the XP still on
// the table for untouched topics. Reads the same local progress the
// topic pages write, so it works logged-in or not.
function gamificationDecorateTopicCards() {
  if (typeof PAGE_GROUPS === 'undefined') return;
  const cards = document.querySelectorAll('a.topic-card[href]');
  if (!cards.length) return;
  _gamInjectHudStyles();

  const byHref = {};
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { byHref[p.href] = p; }));
  const progress = _gamProgressData();

  cards.forEach(card => {
    const page = byHref[card.getAttribute('href')];
    if (!page || card.querySelector('.gam-card-prog')) return;
    const tp = _gamTopicProgress(page.id, progress);
    if (!tp.total) return; // hub/overview pages with nothing gradable

    const row = document.createElement('div');
    row.className = 'gam-card-prog';
    if (tp.complete) {
      card.classList.add('gam-complete');
      row.innerHTML = `<span class="gam-card-complete-chip">🏆 Complete</span>
        <span class="gam-card-prog-xp">+${_gamPagePotentialXp(page.id)} XP banked</span>`;
    } else if (tp.done > 0) {
      const pct = Math.min(100, Math.round(tp.done / tp.total * 100));
      row.innerHTML = `<div class="gam-card-prog-track"><div class="gam-card-prog-fill" style="width:${pct}%"></div></div>
        <span class="gam-card-prog-pct">${pct}%</span>`;
    } else {
      row.innerHTML = `<span class="gam-card-prog-xp">⚡ up to ${_gamPagePotentialXp(page.id)} XP</span>`;
    }
    card.appendChild(row);
  });
}

function _gamInjectTopicNav(pages, idx) {
  const main = document.querySelector('main');
  if (!main) return;
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx < pages.length - 1 ? pages[idx + 1] : null;

  const nav = document.createElement('nav');
  nav.className = 'gam-topic-nav';
  nav.setAttribute('aria-label', 'Topic navigation');

  const prevHtml = prev
    ? `<a class="gam-nav-card" href="${prev.href}" style="--gam-accent:${prev.colour}">
         <span class="gam-nav-dir">← Previous</span>
         <span class="gam-nav-name">${prev.name}</span></a>`
    : `<span class="gam-nav-card gam-nav-spacer" aria-hidden="true"></span>`;

  // Keep the student inside the subject they're working in — topic pages
  // always have window.SUBJECT (set by the directory's page-groups.js).
  const navSlug = (window.SUBJECT && window.SUBJECT.slug) || null;
  const navQ = navSlug ? '?subject=' + encodeURIComponent(navSlug) : '';
  const homeHref = navSlug ? '/subjects/' + encodeURIComponent(navSlug) + '/index.html' : '/hub.html';

  let nextHtml;
  if (next) {
    const potXp = _gamPagePotentialXp(next.id);
    nextHtml = `<a class="gam-nav-card gam-nav-next" id="gamNavNextCard" href="${next.href}" style="--gam-accent:${next.colour}">
        <span class="gam-nav-dir">Next →</span>
        <span class="gam-nav-name">${next.name}</span>
        ${potXp ? `<span class="gam-nav-xp">⚡ up to ${potXp} XP waiting</span>` : ''}</a>`;
  } else {
    nextHtml = `<a class="gam-nav-card gam-nav-next" id="gamNavNextCard" href="/dashboard.html${navQ}" style="--gam-accent:var(--gold,#d4a843)">
        <span class="gam-nav-dir">Course end →</span>
        <span class="gam-nav-name">See your progress &amp; badges</span></a>`;
  }

  nav.innerHTML = prevHtml +
    `<a class="gam-nav-card gam-nav-home" href="${homeHref}"><span aria-hidden="true">🏡</span><span>All topics</span></a>` +
    nextHtml;
  main.appendChild(nav);
}

// Streak needs the Supabase client, which script.js creates asynchronously
// after auth — poll briefly, then refresh the streak and repaint the HUD.
function _gamHudStreakInit(tries) {
  tries = tries || 0;
  const client = window._gcseSupabaseClient;
  if (client) {
    gamificationRefreshStreak(client).then(() => _gamUpdateHud());
    gamificationRefreshDailyReviseStats(client).then(() => _gamUpdateHud());
    // Trust the server for "answered today" — the local counter can be behind
    // on a second device (or ahead of nothing, on a fresh browser).
    if (typeof gamificationSyncDailyCount === 'function') gamificationSyncDailyCount(client);
    return;
  }
  if (tries > 40) return; // ~20s — offline/teacher preview, streak just stays 0
  setTimeout(() => _gamHudStreakInit(tries + 1), 500);
}

// ── Init: topic pages only ──
(function gamificationInitTopicHud() {
  if (typeof PAGE_GROUPS === 'undefined' || typeof ProgressStore === 'undefined' || typeof getPageId !== 'function') return;
  if (!document.querySelector('.tab-bar') || !document.querySelector('main')) return;
  const pages = _gamOrderedPages();
  const pageId = getPageId();
  const idx = pages.findIndex(p => p.id === pageId);
  if (idx === -1) return; // not a curriculum topic page (e.g. exam prep)

  const build = () => {
    _gamInjectTopicHud(pages[idx]);
    _gamInjectTopicNav(pages, idx);
    _gamUpdateHud();
    _gamHudStreakInit();
    // A topic that was already complete before this visit shouldn't pop
    // confetti again — mark it celebrated quietly.
    gamificationMarkTopicCelebratedIfComplete();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

// ── Init: home page (index.html provides #gamHudMount) ──
(function gamificationInitHomeHud() {
  if (typeof PAGE_GROUPS === 'undefined') return;
  const build = () => {
    const mount = document.getElementById('gamHudMount');
    if (mount && !document.getElementById('gamHud')) {
      _gamInjectHomeHud(mount);
      _gamInjectContinueCard(mount);
      _gamUpdateHud();
      _gamHudStreakInit();
    }
    // Sound toggle joins the hero nav cluster (top right, next to My Progress)
    const heroNav = document.querySelector('.hero-nav');
    if (heroNav && !heroNav.querySelector('.gam-sound-btn')) {
      heroNav.appendChild(gamificationCreateSoundButton('gam-sound-btn'));
    }
    gamificationDecorateTopicCards();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

// ══════════════════════════════════════════════════════════════
// PRACTICE HEATMAP — a GitHub-contributions-style year calendar of days the
// student answered questions (any subject: topic pages + Daily Revise all
// write to progress_events, so this is inherently cross-subject, same as the
// streak). Auto-mounts on the dashboard (a full-width band right under the
// gamification bar) and on badges.html (under the summary block); does
// nothing anywhere else. Data comes from the get_my_activity_days RPC — see
// supabase/gamification-functions.sql. Everything below is guarded so a page
// with no auth/client just never shows the widget (no console errors).
// ══════════════════════════════════════════════════════════════

let _gamActivityDays = [];
async function gamificationRefreshActivityDays(client, subjectOverride) {
  try {
    if (!client) return _gamActivityDays;
    _gamLastClient = client;
    if (arguments.length > 1) {
      const { data: d2, error: e2 } = await client.rpc('get_my_activity_days', { p_subject: subjectOverride });
      if (!e2 && Array.isArray(d2)) _gamActivityDays = d2;
      return _gamActivityDays;
    }
    // Subject-scope the calendar on a subject-scoped page (window.SUBJECT set
    // by subjectLoaderInit mode:'single'); pass null on the cross-subject view
    // (mode:'all', e.g. badges.html) to aggregate every subject. p_days is left
    // to its server default.
    const { data, error } = await client.rpc('get_my_activity_days',
      { p_subject: (window.SUBJECT && window.SUBJECT.slug) || null });
    if (!error && Array.isArray(data)) _gamActivityDays = data;
  } catch (e) {}   // leave the cache as-is on any failure
  return _gamActivityDays;
}

// ── Pure date helpers (UTC-only, to match the server's date bucketing) ──
function _gamParseDay(s) {
  const p = String(s).split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
}
function _gamFmtDay(dt) {
  const p = n => String(n).padStart(2, '0');
  return dt.getUTCFullYear() + '-' + p(dt.getUTCMonth() + 1) + '-' + p(dt.getUTCDate());
}
function _gamAddDays(dt, n) { return new Date(dt.getTime() + n * 86400000); }
function _gamDayStart(d) {
  if (typeof d === 'string') return _gamParseDay(d);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// PURE grid model — no DOM. Returns an array of `weeks` week-columns, each a
// 7-cell array ordered Monday(row 0)→Sunday(row 6) (UK week). The final
// column is the week that contains endDate; earlier columns run back in time.
// Each cell: {date:'YYYY-MM-DD', count, level 0..4, inFuture}.
//
// INTENSITY RULE (documented): a day's level is its answer count scaled
// against THIS student's own busiest day in the data (maxCount), split into
// quartiles — level = ceil(count / maxCount * 4), clamped to 1..4; a count of
// 0 stays level 0. Relative-to-personal-max (rather than fixed thresholds) so
// the calendar reads the same whether a student's "big day" is 5 questions or
// 200: their best days always glow brightest and quieter days shade
// proportionally. Empty data → maxCount 0 → every cell level 0.
function computeHeatmapCells(activityDays, endDate, weeks) {
  weeks = weeks || 53;
  const counts = {};
  let maxCount = 0;
  (activityDays || []).forEach(r => {
    if (!r || !r.day) return;
    const c = Math.max(0, r.count || 0);
    counts[r.day] = c;
    if (c > maxCount) maxCount = c;
  });
  const levelFor = c => {
    if (c <= 0 || maxCount <= 0) return 0;
    return Math.min(4, Math.max(1, Math.ceil((c / maxCount) * 4)));
  };

  const end = _gamDayStart(endDate || new Date());
  const endRow = (end.getUTCDay() + 6) % 7;            // Mon=0 … Sun=6
  const endMonday = _gamAddDays(end, -endRow);
  const gridStart = _gamAddDays(endMonday, -(weeks - 1) * 7);

  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const dt = _gamAddDays(gridStart, w * 7 + r);
      const inFuture = dt.getTime() > end.getTime();
      const count = inFuture ? 0 : (counts[_gamFmtDay(dt)] || 0);
      col.push({ date: _gamFmtDay(dt), count: count, level: inFuture ? 0 : levelFor(count), inFuture: inFuture });
    }
    cols.push(col);
  }
  return cols;
}

const _GAM_WD_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _GAM_MO_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function _gamHeatTitle(cell) {
  const d = _gamParseDay(cell.date);
  const label = _GAM_WD_SHORT[(d.getUTCDay() + 6) % 7] + ' ' + d.getUTCDate() + ' ' +
    _GAM_MO_SHORT[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  const n = cell.count;
  const head = n > 0 ? (n === 1 ? '1 question' : n + ' questions') : 'No practice';
  return head + ' · ' + label;
}

function _gamInjectHeatStyles() {
  if (document.getElementById('gam-heat-styles')) return;
  const style = document.createElement('style');
  style.id = 'gam-heat-styles';
  // Level 0 = cream surface + hairline border; 1→4 a single-hue gold ramp
  // deepening light→dark to the site's deep gold #b8860b (a sequential
  // magnitude scale, monotone in lightness — see the dataviz skill).
  style.textContent = `
    .gam-heat-mount--dash{background:var(--card-bg,#fffcf6);border-bottom:1px solid var(--border,#c9bfaa);padding:15px 40px 17px;}
    .gam-heat-mount--badges{margin:16px 0 24px;}
    .gam-heat-mount--cal{background:var(--card-bg,#fffcf6);border:1px solid var(--border,#c9bfaa);border-radius:12px;padding:22px 24px;margin-bottom:22px;}
    .gam-heat{--gh-cell:12px;--gh-gap:3px;--gh-l0:var(--cream,#ede7d9);--gh-l1:#efd98f;--gh-l2:#e5bf5c;--gh-l3:var(--gold,#d4a843);--gh-l4:#b8860b;font-family:'DM Sans',sans-serif;color:var(--ink,#1a2332);}
    .gam-heat-title{font-family:'Playfair Display',serif;font-weight:700;font-size:15px;margin:0;text-align:center;}
    .gam-heat-hint{font-family:'DM Mono',monospace;font-size:10.5px;color:var(--mid,#5a6e7f);margin:3px 0 12px;text-align:center;}
    .gam-heat-stats{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:0 0 13px;}
    .gam-heat-stat{font-family:'DM Mono',monospace;font-size:11px;color:var(--mid,#5a6e7f);background:var(--cream,#ede7d9);border:1px solid var(--border,#c9bfaa);border-radius:99px;padding:4px 11px;white-space:nowrap;}
    .gam-heat-stat strong{color:var(--ink,#1a2332);font-weight:700;}
    .gam-heat-stat--overall{border-color:var(--gold,#d4a843);}
    .gam-heat-scroll{overflow-x:auto;overflow-y:hidden;padding-bottom:4px;-webkit-overflow-scrolling:touch;text-align:center;}
    .gam-heat-plot{display:inline-flex;gap:6px;}
    .gam-heat-side{display:flex;flex-direction:column;gap:var(--gh-gap);padding-top:20px;flex-shrink:0;}
    .gam-heat-wd{height:var(--gh-cell);line-height:var(--gh-cell);font-family:'DM Mono',monospace;font-size:8.5px;color:var(--mid,#5a6e7f);white-space:nowrap;}
    .gam-heat-main{display:flex;flex-direction:column;}
    .gam-heat-months{display:grid;grid-template-columns:repeat(var(--gh-weeks),var(--gh-cell));column-gap:var(--gh-gap);height:15px;font-family:'DM Mono',monospace;font-size:9px;color:var(--mid,#5a6e7f);}
    .gam-heat-mon{grid-row:1;white-space:nowrap;}
    .gam-heat-cells{display:grid;grid-auto-flow:column;grid-template-columns:repeat(var(--gh-weeks),var(--gh-cell));grid-template-rows:repeat(7,var(--gh-cell));column-gap:var(--gh-gap);row-gap:var(--gh-gap);}
    .gam-heat-cell{width:var(--gh-cell);height:var(--gh-cell);border-radius:2.5px;background:var(--gh-l0);box-shadow:inset 0 0 0 1px var(--border,#c9bfaa);}
    .gam-heat-cell[data-lvl="1"]{background:var(--gh-l1);box-shadow:none;}
    .gam-heat-cell[data-lvl="2"]{background:var(--gh-l2);box-shadow:none;}
    .gam-heat-cell[data-lvl="3"]{background:var(--gh-l3);box-shadow:none;}
    .gam-heat-cell[data-lvl="4"]{background:var(--gh-l4);box-shadow:none;}
    .gam-heat-cell--future{background:transparent;box-shadow:none;}
    .gam-heat-legend{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:11px;font-family:'DM Mono',monospace;font-size:9.5px;color:var(--mid,#5a6e7f);}
    .gam-heat-legend .gam-heat-sw{width:var(--gh-cell);height:var(--gh-cell);border-radius:2.5px;}
    .gam-heat-legend .gam-heat-sw[data-lvl="0"]{background:var(--gh-l0);box-shadow:inset 0 0 0 1px var(--border,#c9bfaa);}
    .gam-heat-legend .gam-heat-sw[data-lvl="1"]{background:var(--gh-l1);}
    .gam-heat-legend .gam-heat-sw[data-lvl="2"]{background:var(--gh-l2);}
    .gam-heat-legend .gam-heat-sw[data-lvl="3"]{background:var(--gh-l3);}
    .gam-heat-legend .gam-heat-sw[data-lvl="4"]{background:var(--gh-l4);}
    @media (max-width:700px){.gam-heat-mount--dash{padding:14px 16px 16px;}}
    @media (max-width:560px){.gam-heat-mount--cal{padding:18px 16px;}}
  `;
  document.head.appendChild(style);
}

// Renders the GitHub-style heatmap into mountEl. `activityDays` is the raw
// RPC array; endDate defaults to today, 53 weeks (~12 months) wide.
// streakInfo (optional): { current, longest, lastActive } — the numbers from
// get_my_streak/get_class_streaks. When given, a summary line shows the current
// and longest streak, plus "last practised X ago" once the current streak has
// lapsed (so a broken streak still says when they last worked). lastActive may
// be an ISO timestamp or a 'YYYY-MM-DD' day; it falls back to the most recent
// day in activityDays when the RPC hasn't been extended with last_active yet.
function renderStreakHeatmap(mountEl, activityDays, streakInfo) {
  if (!mountEl) return;
  _gamInjectHeatStyles();
  const weeks = 53;
  const cols = computeHeatmapCells(activityDays, new Date(), weeks);

  // Summary numbers for the accessible label.
  let totalActiveDays = 0, totalQuestions = 0, visibleDays = 0;
  cols.forEach(col => col.forEach(c => {
    if (c.inFuture) return;
    visibleDays++;
    if (c.count > 0) { totalActiveDays++; totalQuestions += c.count; }
  }));

  // Month labels: place one at the first column whose Monday starts a new month.
  let monthsHtml = '', prevMonth = -1;
  cols.forEach((col, i) => {
    const d = _gamParseDay(col[0].date);
    const m = d.getUTCMonth();
    if (m !== prevMonth) {
      monthsHtml += `<span class="gam-heat-mon" style="grid-column:${i + 1}">${_GAM_MO_SHORT[m]}</span>`;
      prevMonth = m;
    }
  });

  // Weekday labels — only Mon/Wed/Fri, blanks keep the row rhythm.
  const wdShow = { 0: 'Mon', 2: 'Wed', 4: 'Fri' };
  let sideHtml = '';
  for (let r = 0; r < 7; r++) sideHtml += `<span class="gam-heat-wd">${wdShow[r] || ''}</span>`;

  // Cells, column-major (col 0 rows 0..6, col 1 …) to match grid-auto-flow:column.
  let cellsHtml = '';
  cols.forEach(col => col.forEach(cell => {
    if (cell.inFuture) { cellsHtml += `<span class="gam-heat-cell gam-heat-cell--future" aria-hidden="true"></span>`; return; }
    cellsHtml += `<span class="gam-heat-cell" data-lvl="${cell.level}" title="${_gamHeatTitle(cell)}"></span>`;
  }));

  let legendHtml = '<span>Less</span>';
  for (let l = 0; l <= 4; l++) legendHtml += `<span class="gam-heat-sw" data-lvl="${l}" aria-hidden="true"></span>`;
  legendHtml += '<span>More</span>';

  const dayWord = totalActiveDays === 1 ? 'day' : 'days';
  const qWord = totalQuestions === 1 ? 'question' : 'questions';
  const ariaLabel = `Practice calendar. You practised on ${totalActiveDays} ${dayWord} of the last ${visibleDays}, answering ${totalQuestions} ${qWord} in total.`;

  // Subject-scoped pages (window.SUBJECT set, mode:'single') name the subject;
  // the cross-subject view (window.SUBJECT null, mode:'all', e.g. badges.html)
  // keeps the generic line. Interpolated the same way as ariaLabel above.
  // streakInfo.allSubjects forces the generic line on a page that HAS a
  // window.SUBJECT but is deliberately showing every subject (Review Calendar).
  const hintText = (!(streakInfo && streakInfo.allSubjects) && window.SUBJECT && window.SUBJECT.name)
    ? `Every ${window.SUBJECT.name} question you answer lights up a day.`
    : 'Every question you answer — on any subject — lights up a day.';

  // Streak summary: current + longest streak, and "last practised …" once the
  // current streak has lapsed (current 0). lastActive falls back to the newest
  // day in the calendar if the RPC didn't supply a timestamp.
  let summaryHtml = '';
  if (streakInfo) {
    const cur = streakInfo.current || 0;
    const lng = streakInfo.longest || 0;
    const last = streakInfo.lastActive || gamificationLastActiveDay(activityDays);
    const parts = [
      `<span class="gam-heat-stat"><strong>🔥 ${cur}</strong> day streak</span>`,
      `<span class="gam-heat-stat"><strong>🏆 ${lng}</strong> longest</span>`,
    ];
    // Overall (all-subjects) streak — only on a subject-scoped page (window.SUBJECT
    // set), where the 🔥 chip above counts THIS subject alone and can read 0 for a
    // student who practises daily but across different subjects. On the
    // cross-subject view the 🔥 chip already IS the overall streak, so no chip.
    const ov = streakInfo.overall;
    if (ov && window.SUBJECT && window.SUBJECT.slug) {
      parts.push(`<span class="gam-heat-stat gam-heat-stat--overall" title="Days in a row you've practised — counting every subject"><strong>🌍 ${ov.current || 0}</strong> day overall streak</span>`);
    }
    if (!cur && last) {
      const ago = gamificationAgoLabel(last);
      if (ago) parts.push(`<span class="gam-heat-stat">Last practised <strong>${ago}</strong></span>`);
    }
    summaryHtml = `<div class="gam-heat-stats">${parts.join('')}</div>`;
  }

  mountEl.innerHTML = `
    <section class="gam-heat" style="--gh-weeks:${weeks}">
      <h3 class="gam-heat-title">📅 Practice calendar</h3>
      <p class="gam-heat-hint">${hintText}</p>
      ${summaryHtml}
      <div class="gam-heat-scroll">
        <div class="gam-heat-plot" role="img" aria-label="${ariaLabel}">
          <div class="gam-heat-side">${sideHtml}</div>
          <div class="gam-heat-main">
            <div class="gam-heat-months">${monthsHtml}</div>
            <div class="gam-heat-cells">${cellsHtml}</div>
          </div>
        </div>
      </div>
      <div class="gam-heat-legend">${legendHtml}</div>
    </section>`;

  // Most-recent weeks are on the right — scroll there on load.
  const scroller = mountEl.querySelector('.gam-heat-scroll');
  if (scroller) scroller.scrollLeft = scroller.scrollWidth;
}

// Where the widget mounts on this page (null → not a heatmap page).
function _gamHeatmapAnchor() {
  const gamBar = document.querySelector('.gam-bar');        // dashboard.html
  if (gamBar && gamBar.parentNode) return { after: gamBar, cls: 'gam-heat-mount--dash' };
  const summary = document.getElementById('bdgSummary');    // badges.html
  if (summary && summary.parentNode) return { after: summary, cls: 'gam-heat-mount--badges' };
  // review-calendar.html — mount below the month-calendar panel, as a
  // sibling panel (the mount's --cal class restyles it to match .panel).
  const srGrid = document.getElementById('srCalGrid');
  if (srGrid) {
    const panel = srGrid.closest ? srGrid.closest('.panel') : null;
    if (panel && panel.parentNode) return { after: panel, cls: 'gam-heat-mount--cal' };
  }
  return null;
}

// Poller modelled on _gamHudStreakInit: wait for the Supabase client (a
// window global on topic pages, otherwise the last one a refresher was
// given), then fetch + render. Bails immediately on pages with no mount
// target, and after ~20s if no client ever appears (offline/teacher preview).
function _gamHeatmapInit(tries) {
  tries = tries || 0;
  const anchor = _gamHeatmapAnchor();
  if (!anchor) return;
  const client = window._gcseSupabaseClient || _gamLastClient;
  if (client) {
    // The Review Calendar is a cross-subject view (its subject filter defaults
    // to every subject), so its heatmap + streak cover ALL subjects — passing
    // null forces that scope regardless of the page's window.SUBJECT.
    // badges.html already gets it for free (window.SUBJECT is null there).
    const allSubjects = anchor.cls === 'gam-heat-mount--cal';
    // Fetch the calendar and the streak numbers together so the summary line
    // (current/longest/last-practised) renders with the grid in one pass.
    Promise.all([
      allSubjects ? gamificationRefreshActivityDays(client, null) : gamificationRefreshActivityDays(client),
      allSubjects ? gamificationRefreshStreak(client, null) : gamificationRefreshStreak(client),
    ]).then(([days]) => {
      if (document.getElementById('gamHeatmapMount')) return;   // already mounted
      const mount = document.createElement('div');
      mount.id = 'gamHeatmapMount';
      mount.className = 'gam-heat-mount ' + anchor.cls;
      anchor.after.parentNode.insertBefore(mount, anchor.after.nextSibling);
      renderStreakHeatmap(mount, days, {
        current: _gamStreak, longest: _gamStreakLongest, lastActive: _gamStreakLastActive,
        overall: _gamStreakOverall, allSubjects: allSubjects,
      });
    });
    return;
  }
  if (tries > 40) return;
  setTimeout(() => _gamHeatmapInit(tries + 1), 500);
}

(function gamificationInitHeatmap() {
  const build = () => { if (_gamHeatmapAnchor()) _gamHeatmapInit(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
