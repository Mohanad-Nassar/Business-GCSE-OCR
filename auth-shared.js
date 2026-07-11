// ══════════════════════════════════════════════════════════════
// AUTH SHARED (WP-A1) — email/Google/Microsoft sign-in helpers used by
// login.html, signup.html and auth-callback.html.
//
// Design rules (PLATFORM-V2-MASTER-PLAN.md §WP-A1):
//  • Supabase Auth is the only identity system. The teacher-generated
//    student logins (<username>@students.local) keep working untouched —
//    this file only ADDS the email + OAuth paths.
//  • Every successful login funnels through vidyaFinishLogin(), which
//    writes the exact same localStorage session shape login.html always
//    wrote (gcse_session_v1: access/refresh tokens + role + username), so
//    tasksAuthInit() and every existing page keep working unchanged.
//  • Routing after login: teachers → teacher-dashboard; students → their
//    ?redirect target if safe, else the subjects hub when they're enrolled
//    in ≥1 subject, else join.html (WP-A2) to redeem a class code.
//  • vidya_at cookie: a copy of the access token for the WP-A3 Netlify
//    Edge content gate. Not extra exposure — the same token already lives
//    in localStorage; the cookie is just transport the Edge can read.
// ══════════════════════════════════════════════════════════════

const VIDYA_SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
const VIDYA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
const VIDYA_SESSION_KEY = 'gcse_session_v1';

// Which OAuth providers render on login/signup. Microsoft ('azure') is
// built and wired but hidden until its Entra app registration is set up —
// re-enable by adding 'azure' back to this list, nothing else needed.
const VIDYA_OAUTH_PROVIDERS = ['google'];

function vidyaAuthClient() {
  if (!window._vidyaAuthClient) {
    window._vidyaAuthClient = supabase.createClient(VIDYA_SUPABASE_URL, VIDYA_SUPABASE_ANON_KEY);
  }
  return window._vidyaAuthClient;
}

// The WP-A3 Edge gate reads this cookie. `Secure` is dropped on plain-http
// localhost so `netlify dev` keeps working; production is always https.
function vidyaSetSessionCookie(accessToken) {
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'vidya_at=' + accessToken + '; Path=/; SameSite=Lax' + secure + '; Max-Age=604800';
  } catch (e) {}
}
function vidyaClearSessionCookie() {
  try { document.cookie = 'vidya_at=; Path=/; Max-Age=0'; } catch (e) {}
}

function vidyaWriteSession(session, role, username) {
  localStorage.setItem(VIDYA_SESSION_KEY, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    role, username,
  }));
  vidyaSetSessionCookie(session.access_token);
}

// Only ever follow same-site relative redirect targets — mirrors the rule
// login.html has always applied.
function vidyaSafeRedirect(target) {
  return target && target.startsWith('/') === false && !target.includes('://') ? target : null;
}

// ── OAuth ──
// Provider ids are Supabase's: 'google' and 'azure' (Microsoft personal +
// work/school accounts via a Microsoft Entra app registration).
async function vidyaStartOAuth(provider, redirectTarget) {
  try {
    if (redirectTarget) localStorage.setItem('vidya_post_auth_redirect', redirectTarget);
    else localStorage.removeItem('vidya_post_auth_redirect');
  } catch (e) {}
  const { error } = await vidyaAuthClient().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: location.origin + '/auth-callback.html',
      scopes: provider === 'azure' ? 'email openid profile' : undefined,
    },
  });
  return error || null; // browser navigates away on success
}

// Shared markup for the OAuth buttons + divider (only providers listed in
// VIDYA_OAUTH_PROVIDERS render). Self-contained SVG glyphs (no external
// images — CSP-friendly).
function vidyaOAuthButtonsHtml() {
  const buttons = {
    google: `<button type="button" class="oauth-btn" data-oauth="google">
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.4 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.2a24 24 0 0 0 0 21.6l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.6-3.9-13.5-9.3l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/></svg>
        Google
      </button>`,
    azure: `<button type="button" class="oauth-btn" data-oauth="azure">
        <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>
        Microsoft
      </button>`,
  };
  const row = VIDYA_OAUTH_PROVIDERS.map(p => buttons[p]).filter(Boolean).join('');
  if (!row) return '';
  return `
    <div class="oauth-divider" role="separator"><span>or continue with</span></div>
    <div class="oauth-row">${row}</div>`;
}

// Injects the shared styles the OAuth buttons need (pages each have their
// own inline stylesheet, so these live here once).
function vidyaInjectOAuthStyles() {
  if (document.getElementById('vidya-oauth-styles')) return;
  const s = document.createElement('style');
  s.id = 'vidya-oauth-styles';
  s.textContent = `
    .oauth-divider{display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:var(--mid,#5a6e7f);
      font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
    .oauth-divider::before,.oauth-divider::after{content:'';flex:1;border-top:1px solid var(--border,#c9bfaa);}
    .oauth-row{display:flex;gap:10px;}
    .oauth-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;
      background:#fff;border:1px solid var(--border,#c9bfaa);border-radius:7px;padding:10px 12px;
      font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:600;color:var(--ink,#0f1923);cursor:pointer;}
    .oauth-btn:hover{border-color:var(--accent,#4a6fa5);background:var(--cream,#ede7d9);}
    .oauth-btn:disabled{opacity:.6;cursor:default;}`;
  document.head.appendChild(s);
}

// Wire every [data-oauth] button inside `root`. showError(text) is the
// page's own message renderer.
function vidyaWireOAuthButtons(root, redirectTarget, showError) {
  vidyaInjectOAuthStyles();
  root.querySelectorAll('[data-oauth]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const err = await vidyaStartOAuth(btn.dataset.oauth, redirectTarget);
      if (err) {
        btn.disabled = false;
        showError(err.message && err.message.includes('not enabled')
          ? 'That sign-in method isn’t switched on yet — use email instead, or ask us to enable it.'
          : 'Could not start sign-in: ' + (err.message || 'unknown error'));
      }
    });
  });
}

// ── Post-login: profile → session → route ──
// The on_auth_user_created trigger (supabase/schema.sql §auth-v2) creates
// the profile for brand-new email/OAuth users; it can land a beat after the
// session exists, so poll briefly before giving up.
async function vidyaFetchProfileWithRetry(client, userId, tries) {
  for (let i = 0; i < (tries || 8); i++) {
    const { data, error } = await client.from('profiles')
      .select('role, username, account_type').eq('id', userId).maybeSingle();
    if (data) return data;
    if (error && error.code && error.code !== 'PGRST116') break; // real error, not just 0 rows
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

// One exit point for every login path. Returns an error string (for the
// page to show) or navigates away.
async function vidyaFinishLogin(client, session, preferredRedirect) {
  const profile = await vidyaFetchProfileWithRetry(client, session.user.id);
  if (!profile) {
    try { await client.auth.signOut(); } catch (e) {}
    return 'Your account was created but its profile isn’t ready yet. Try logging in again in a minute — if it keeps happening, contact your teacher.';
  }
  const username = profile.username || (session.user.email || '').split('@')[0] || 'you';
  vidyaWriteSession(session, profile.role, username);

  if (profile.role === 'teacher') {
    location.replace('teacher-dashboard.html');
    return null;
  }

  const safe = vidyaSafeRedirect(preferredRedirect);
  if (safe) { location.replace(safe); return null; }

  // Student: enrolled somewhere → hub; brand new with no classes → join page.
  let hasSubjects = false;
  try {
    const { data: subjects } = await client.rpc('get_my_subjects');
    hasSubjects = Array.isArray(subjects) && subjects.length > 0;
  } catch (e) {}
  try { if (hasSubjects) sessionStorage.setItem('vidya_has_subjects', '1'); } catch (e) {}
  location.replace(hasSubjects ? 'index.html' : 'join.html');
  return null;
}
