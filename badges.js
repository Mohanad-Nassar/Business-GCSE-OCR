// ══════════════════════════════════════════════════════════════
// BADGES — the full badge gallery. Two scopes:
//   • Profile badges (BADGE_DEFS)         — cross-subject, tested against the
//     student's combined stats (this page is subjectLoaderInit mode:'all').
//   • Subject badges (SUBJECT_BADGE_SETS) — a bespoke set PER enrolled subject,
//     tested against that subject's own stats, so they only appear for the
//     subjects the student actually has.
// Every badge carries a rarity (common → mythic) and a custom SVG icon; the
// medallion look + rarity breakdown live in badges.html's CSS. The earned/
// locked state is the same computeGamificationStats() the whole app uses, so a
// badge shown earned here is earned everywhere.
// ══════════════════════════════════════════════════════════════

const esc = taskEscapeHtml;

let bdgClient = null;

async function init() {
  const auth = await tasksAuthInit('student');
  if (!auth) return;
  bdgClient = auth.client;

  // Shared avatar + "Hi, name" dropdown (account-cluster.js) so this page's
  // header matches every other page; minimal escaped bar as a fallback.
  if (typeof _gcseInjectAccountBar === 'function') {
    window._gcseProfile = window._gcseProfile || { username: auth.username, role: auth.role };
    window._gcseSupabaseClient = window._gcseSupabaseClient || bdgClient;
    _gcseInjectAccountBar();
  } else {
    document.getElementById('accountBar').innerHTML =
      `<span>Logged in as <strong>${esc(auth.username || 'you')}</strong></span>
       <button type="button" class="nav-link" id="logoutBtn">Log out</button>`;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await bdgClient.auth.signOut();
      localStorage.removeItem('gcse_session_v1');
      location.replace('login.html');
    });
  }

  const [streak, drStats, reviewStats, lbStats] = await Promise.all([
    typeof gamificationRefreshStreak === 'function' ? gamificationRefreshStreak(bdgClient) : 0,
    typeof gamificationRefreshDailyReviseStats === 'function' ? gamificationRefreshDailyReviseStats(bdgClient) : { correctCount: 0, masteredCount: 0 },
    typeof gamificationRefreshReviewStats === 'function' ? gamificationRefreshReviewStats(bdgClient) : { completed: 0 },
    typeof gamificationRefreshLeaderboardStats === 'function' ? gamificationRefreshLeaderboardStats(bdgClient) : { everTop10: false, everTop3: false, everFirst: false },
  ]);
  // Pulls this student's full per-topic progress over from the server and
  // merges it with localStorage — same as index/dashboard, so XP/level/topic
  // badges match exactly what the student sees there.
  if (typeof gamificationRefreshHomeFromServer === 'function') {
    await gamificationRefreshHomeFromServer(bdgClient);
  }

  const progress = typeof _gamProgressData === 'function' ? _gamProgressData() : {};
  // Cross-subject profile stats (window.PAGE_GROUPS is every subject here).
  const stats = computeGamificationStats(progress, streak, drStats, reviewStats, lbStats);
  const subjects = await bdgEnrolledSubjects(progress);
  render(stats, progress, subjects);
  if (typeof gamificationCheckNewBadges === 'function') gamificationCheckNewBadges(stats);
}

// Subjects the student is enrolled in (get_my_subjects), else a fallback to
// whichever subjects they already have progress in — so subject badges only
// show for subjects the student actually has.
async function bdgEnrolledSubjects(progress) {
  try {
    const { data, error } = await bdgClient.rpc('get_my_subjects');
    if (!error && Array.isArray(data) && data.length) {
      return data.map(s => ({ slug: s.slug, name: s.name || s.slug, icon: s.icon || '📘' }));
    }
  } catch (e) {}
  const reg = window.SUBJECTS || [];
  const has = new Set();
  Object.keys(progress || {}).forEach(pid => { const i = pid.indexOf(':'); if (i > 0) has.add(pid.slice(0, i)); });
  return reg.filter(s => has.has(s.slug)).map(s => ({ slug: s.slug, name: s.name, icon: s.icon || '📘' }));
}

// One medallion card — an emoji inside a rarity-coloured medallion.
function bdgCard(def, earned) {
  const rarity = def.rarity || 'common';
  const rLabel = (typeof GAM_RARITY !== 'undefined' && GAM_RARITY[rarity]) ? GAM_RARITY[rarity].label : rarity;
  return `<div class="bdg-card r-${rarity}${earned ? ' earned' : ' locked'}">
      <div class="bdg-medal"><span class="bdg-emoji">${esc(def.icon || '🏅')}</span></div>
      <div class="bdg-meta">
        <div class="bdg-name">${esc(def.label)}</div>
        <div class="bdg-desc">${esc(def.desc)}</div>
        <div class="bdg-tags">
          <span class="bdg-rarity">${esc(rLabel)}</span>
          ${earned ? '<span class="bdg-got">✓ Earned</span>' : ''}
        </div>
      </div>
    </div>`;
}

// A titled grid of badges, given a list of {def, earned}.
function bdgSection(title, subtitle, items) {
  const earnedN = items.filter(i => i.earned).length;
  return `<section class="bdg-group">
      <div class="bdg-group-head">
        <div class="bdg-group-title">${title}</div>
        <div class="bdg-group-count">${earnedN}/${items.length}</div>
      </div>
      ${subtitle ? `<div class="bdg-group-sub">${subtitle}</div>` : ''}
      <div class="bdg-grid">${items.map(i => bdgCard(i.def, i.earned)).join('')}</div>
    </section>`;
}

function render(stats, progress, subjects) {
  // ── Profile (cross-subject) badges, earned against combined stats ──
  const profileEarnedIds = new Set(gamificationEarnedBadges(stats).map(b => b.id));
  const profileItems = BADGE_DEFS.map(b => ({ def: b, earned: profileEarnedIds.has(b.id) }));

  // ── Subject badges, one set per enrolled subject against that subject's stats ──
  const subjectBlocks = (subjects || []).map(subj => {
    const sStats = typeof gamComputeSubjectStats === 'function' ? gamComputeSubjectStats(subj.slug, progress) : null;
    const defs = typeof gamSubjectBadgeDefs === 'function' ? gamSubjectBadgeDefs(subj.slug) : [];
    const earnedIds = new Set(gamificationSubjectBadgesFor(sStats, subj.slug).map(b => b.id));
    const items = defs.map(b => ({ def: b, earned: earnedIds.has(b.id) }));
    return { subj, items };
  }).filter(b => b.items.length);

  // ── Totals + rarity breakdown across everything earned ──
  const allEarned = profileItems.filter(i => i.earned)
    .concat(subjectBlocks.flatMap(b => b.items.filter(i => i.earned)));
  const totalCount = profileItems.length + subjectBlocks.reduce((n, b) => n + b.items.length, 0);
  const byRarity = {};
  allEarned.forEach(i => { const r = i.def.rarity || 'common'; byRarity[r] = (byRarity[r] || 0) + 1; });
  const rarityOrder = Object.keys((typeof GAM_RARITY !== 'undefined' && GAM_RARITY) || {})
    .sort((a, b) => gamRarityOrder(a) - gamRarityOrder(b));

  // ── Summary strip ──
  const legend = rarityOrder.map(r =>
    `<span class="bdg-legend-chip r-${r}"><i class="bdg-legend-dot"></i>${esc(GAM_RARITY[r].label)} <b>${byRarity[r] || 0}</b></span>`).join('');
  document.getElementById('bdgSummary').innerHTML = `
    <div class="bdg-summary-level"><b>${stats.level}</b><span>Level</span></div>
    <div class="bdg-summary-stats">
      <div class="bdg-summary-stat">${stats.xp.toLocaleString()} <b>XP</b></div>
      <div class="bdg-summary-stat">🔥 <b>${stats.streak}</b> day streak</div>
    </div>
    <div class="bdg-summary-count"><b>${allEarned.length}</b><span>of ${totalCount} badges</span></div>
    <div class="bdg-legend">${legend}</div>`;

  // ── Body ──
  // Profile badges grouped by their `group`.
  const groups = [];
  profileItems.forEach(it => {
    const g = it.def.group || 'Badges';
    let entry = groups.find(x => x.name === g);
    if (!entry) { entry = { name: g, items: [] }; groups.push(entry); }
    entry.items.push(it);
  });

  let html = `<div class="bdg-scope-title">🏅 Profile badges <span>· earned across every subject</span></div>`;
  html += groups.map(g => bdgSection(esc(g.name), '', g.items)).join('');

  if (subjectBlocks.length) {
    // Quick-jump chips when the student has several subjects (scales to 9+).
    const jump = subjectBlocks.length > 2
      ? `<div class="bdg-subject-jump">${subjectBlocks.map(b =>
          `<a class="bdg-jump-chip" href="#subj-${esc(b.subj.slug)}">${esc(b.subj.icon)} ${esc(b.subj.name)}</a>`).join('')}</div>`
      : '';
    html += `<div class="bdg-scope-title bdg-scope-subjects">📚 Subject badges <span>· only for your subjects</span></div>${jump}`;
    html += subjectBlocks.map(b =>
      `<div id="subj-${esc(b.subj.slug)}">${bdgSection(
        `<span class="bdg-subj-icon">${esc(b.subj.icon)}</span> ${esc(b.subj.name)}`,
        '', b.items)}</div>`).join('');
  }

  document.getElementById('bdgGroups').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', init);
