// ══════════════════════════════════════════════════════════════
// BADGES — the full, growing badge list, moved out of the HUD's cramped
// dropdown (gamification.js) into its own page so new badges (e.g. the
// Daily Revise ones) have room to breathe. Renders every entry in
// BADGE_DEFS, grouped by its `group` field, locked/unlocked against this
// student's real stats — the same computeGamificationStats() everything
// else in the app uses, so a badge shown as earned here is earned
// everywhere else too.
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

  const [streak, drStats, reviewStats] = await Promise.all([
    typeof gamificationRefreshStreak === 'function' ? gamificationRefreshStreak(bdgClient) : 0,
    typeof gamificationRefreshDailyReviseStats === 'function' ? gamificationRefreshDailyReviseStats(bdgClient) : { correctCount: 0, masteredCount: 0 },
    typeof gamificationRefreshReviewStats === 'function' ? gamificationRefreshReviewStats(bdgClient) : { completed: 0 },
  ]);
  // Pulls this student's full per-topic progress over from the server and
  // merges it with whatever's in this device's localStorage — same
  // function index.html/dashboard.html already use, so XP/level/topic
  // badges match exactly what the student sees there (its DOM side effects
  // for topic cards etc. are harmless no-ops on this page, which has none).
  if (typeof gamificationRefreshHomeFromServer === 'function') {
    await gamificationRefreshHomeFromServer(bdgClient);
  }

  const progress = typeof _gamProgressData === 'function' ? _gamProgressData() : {};
  const stats = computeGamificationStats(progress, streak, drStats, reviewStats);
  render(stats);
  if (typeof gamificationCheckNewBadges === 'function') gamificationCheckNewBadges(stats);
}

function render(stats) {
  const earned = gamificationEarnedBadges(stats);
  const earnedIds = new Set(earned.map(b => b.id));

  document.getElementById('bdgSummary').innerHTML = `
    <div class="bdg-summary-level"><b>${stats.level}</b><span>Level</span></div>
    <div class="bdg-summary-stat">${stats.xp.toLocaleString()} <b>XP</b></div>
    <div class="bdg-summary-stat">🔥 <b>${stats.streak}</b> day streak</div>
    <div class="bdg-summary-count">${earned.length}/${BADGE_DEFS.length}<small>Badges earned</small></div>`;

  const groups = [];
  BADGE_DEFS.forEach(b => {
    const g = b.group || 'Badges';
    let entry = groups.find(x => x.name === g);
    if (!entry) { entry = { name: g, badges: [] }; groups.push(entry); }
    entry.badges.push(b);
  });

  document.getElementById('bdgGroups').innerHTML = groups.map(g => `
    <div class="bdg-group">
      <div class="bdg-group-title">${esc(g.name)}</div>
      <div class="bdg-grid">
        ${g.badges.map(b => {
          const got = earnedIds.has(b.id);
          return `<div class="bdg-card${got ? '' : ' locked'}">
            <span class="bdg-icon" aria-hidden="true">${b.icon}</span>
            <div>
              <div class="bdg-name">${esc(b.label)}</div>
              <div class="bdg-desc">${esc(b.desc)}</div>
              ${got ? '<div class="bdg-got-chip">✓ Earned</div>' : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', init);
