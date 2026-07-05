// ══════════════════════════════════════════════════════════════
// TOPIC ACCESS GUARD
// Included on every topic page, after script.js + progress-shared.js +
// section-totals.js. Checks whether the current student's class has
// locked this topic (manual hide, or sequential-unlock not yet reached)
// and, if so, replaces the page content with a locked notice + a
// "request access" action.
//
// Soft gate, by design: this runs after the page has already rendered
// (there's no synchronous way to gate static HTML without a flash), and
// only 'manual' mode is also enforced server-side (record_progress
// rejects writes for a hidden topic — see supabase/topic-access-schema.sql).
// 'sequential' mode is a pacing nudge, not a secret, so it's client-side
// only. Teachers previewing pages are never gated.
// ══════════════════════════════════════════════════════════════

(function () {
  const NO_GUARD_FILES = ['index.html', 'login.html', 'teacher-signup.html', 'dashboard.html', 'teacher-dashboard.html', ''];
  function currentFile() { return location.pathname.split('/').pop() || ''; }
  if (NO_GUARD_FILES.includes(currentFile())) return;

  function waitForClient(tries) {
    tries = tries || 0;
    if (window._gcseSupabaseClient && window._gcseProfile) { checkAccess(); return; }
    if (tries > 100) return; // ~10s — give up quietly rather than block the page forever
    setTimeout(() => waitForClient(tries + 1), 100);
  }

  // Content-less curriculum "overview" pages (e.g. the 2.4 Marketing Mix
  // hub, which just links out to 2.4.1-2.4.6 and has no gradable content)
  // must be excluded from the sequential-unlock chain — otherwise they can
  // never register as "complete" and permanently lock every topic after them.
  function hasGradableContent(pageId) {
    const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pageId];
    return !!t && Object.keys(t).some(k => k !== 'flashcards' && t[k] > 0);
  }

  async function fetchOwnProgress(pageId) {
    const { data } = await window._gcseSupabaseClient
      .from('progress_summary').select('section, done, total').eq('page_id', pageId);
    const pd = {};
    (data || []).forEach(r => { pd[r.section] = { done: r.done, total: r.total }; });
    return pd;
  }

  async function checkAccess() {
    if (!window._gcseProfile || _gcseProfile.role !== 'student') return;
    const pageId = typeof getPageId === 'function' ? getPageId() : null;
    if (!pageId || typeof PAGE_GROUPS === 'undefined') return;

    let settings;
    try {
      const { data, error } = await window._gcseSupabaseClient.rpc('get_my_topic_settings');
      if (error || !data) return; // fail open on a network hiccup — don't block the page
      settings = data;
    } catch (e) { return; }

    const { mode, hidden, granted, requests } = settings;
    if ((granted || []).includes(pageId)) return;
    if (mode === 'open') return;

    let locked = false, reason = '';
    if (mode === 'manual') {
      locked = (hidden || []).includes(pageId);
      reason = "Your teacher hasn't opened this topic for your class yet.";
    } else if (mode === 'sequential') {
      const order = [];
      PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { if (hasGradableContent(p.id)) order.push(p.id); }));
      const idx = order.indexOf(pageId);
      if (idx > 0) {
        const prevId = order[idx - 1];
        const prevProgress = await fetchOwnProgress(prevId);
        const sections = pageSectionTotals(prevId, prevProgress).filter(s => s.total > 0);
        const complete = sections.length > 0 && sections.every(s => s.done >= s.total);
        locked = !complete;
        reason = `Finish "${pageTitle(prevId)}" first to unlock this topic.`;
      }
    }
    if (locked) showLockedOverlay(pageId, reason, requests);
  }

  function showLockedOverlay(pageId, reason, requests) {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = 'max-width:520px;margin:60px auto;padding:32px;text-align:center;font-family:"DM Sans",sans-serif;';
    box.innerHTML = `
      <div style="font-size:40px;margin-bottom:10px;" aria-hidden="true">🔒</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:22px;margin-bottom:10px;">This topic isn't open yet</h1>
      <p style="color:#666;margin-bottom:20px;">${reason}</p>
      <div id="tgRequestArea"></div>
      <p style="margin-top:24px;"><a href="dashboard.html" style="color:inherit;">← Back to dashboard</a></p>`;
    main.appendChild(box);

    const area = box.querySelector('#tgRequestArea');
    const existing = (requests || []).find(r => r.page_id === pageId && r.status !== 'denied')
      || (requests || []).filter(r => r.page_id === pageId).sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))[0];

    function renderPending() {
      area.innerHTML = '<span style="font-family:\'DM Mono\',monospace;font-size:12px;">⏳ Access request sent — waiting for your teacher.</span>';
    }
    function renderAskButton(label) {
      area.innerHTML = `<button type="button" id="tgReqBtn" class="btn" style="cursor:pointer;">${label}</button>`;
      area.querySelector('#tgReqBtn').addEventListener('click', async () => {
        const btn = area.querySelector('#tgReqBtn');
        btn.disabled = true; btn.textContent = 'Sending…';
        try {
          const { error } = await window._gcseSupabaseClient.rpc('request_topic_access', { p_page_id: pageId });
          if (error) throw error;
          renderPending();
        } catch (e) {
          area.innerHTML = '<span style="color:#c84b31;">Couldn\'t send that — try again shortly.</span>';
        }
      });
    }

    if (existing && existing.status === 'pending') renderPending();
    else if (existing && existing.status === 'denied') renderAskButton('🙋 Ask again');
    else renderAskButton('🙋 Ask my teacher to open this topic');
  }

  waitForClient();
})();
