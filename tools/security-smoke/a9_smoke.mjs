// ══════════════════════════════════════════════════════════════
// WP-A9 SECURITY SMOKE — live-database proof that the Phase A security
// properties hold, run as a REAL (throwaway) student account.
//
//   node tools/security-smoke/a9_smoke.mjs
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the repo-root .env
// (service key is used ONLY to create + delete the throwaway account;
// every check runs with the student's own JWT). The account is deleted
// at the end even if checks fail; its child rows (profile, join-code
// attempts, integrity events) cascade.
//
// Exit code 0 = all checks pass. Non-zero = at least one FAIL (table
// printed either way). Safe to re-run any time; never touches real
// accounts or classes.
// ══════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';

function readEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = readEnv();
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(2);
}

const results = [];
function record(name, pass, note) {
  results.push({ name, pass, note: note || '' });
  console.log(`${pass ? '  PASS' : '✗ FAIL'}  ${name}${note ? '  — ' + note : ''}`);
}

const adminHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};
function studentHeaders(jwt, extra) {
  return Object.assign({
    apikey: ANON_KEY,
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  }, extra || {});
}

async function rpc(jwt, fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: studentHeaders(jwt), body: JSON.stringify(args || {}),
  });
  let body = null;
  try { body = await res.json(); } catch { /* empty body (void fns) */ }
  return { status: res.status, body };
}

async function main() {
  const stamp = Date.now();
  const email = `qa-a9-smoke-${stamp}@example.com`;
  const password = 'Smoke-' + stamp + '-Aa1!';
  let uid = null;

  // ── create throwaway student (admin) ──
  const created = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const createdBody = await created.json();
  uid = createdBody.id || (createdBody.user && createdBody.user.id);
  if (!created.ok || !uid) {
    console.error('Could not create test user:', created.status, JSON.stringify(createdBody).slice(0, 300));
    process.exit(2);
  }
  console.log(`test user ${email} (${uid})`);

  try {
    // ── sign in with the password grant → student JWT ──
    const tok = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const tokBody = await tok.json();
    const jwt = tokBody.access_token;
    record('password sign-in issues a session', !!jwt, jwt ? '' : JSON.stringify(tokBody).slice(0, 160));
    if (!jwt) return;

    // ── handle_new_user trigger provisioned a profile (poll briefly) ──
    let profile = null;
    for (let i = 0; i < 10 && !profile; i++) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=role,username,account_type,is_owner`, {
        headers: studentHeaders(jwt),
      });
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length) profile = rows[0];
      else await new Promise(r => setTimeout(r, 500));
    }
    record('signup trigger created a profile', !!profile);
    if (profile) {
      record('profile role=student, account_type=self_signup, is_owner=false',
        profile.role === 'student' && profile.account_type === 'self_signup' && profile.is_owner === false,
        JSON.stringify(profile));
    }

    // ── entitlement surface: brand-new account sees nothing ──
    const subs = await rpc(jwt, 'get_my_subjects');
    record('get_my_subjects → empty for classless account',
      subs.status === 200 && Array.isArray(subs.body) && subs.body.length === 0,
      `status ${subs.status}, ${Array.isArray(subs.body) ? subs.body.length + ' rows' : typeof subs.body}`);

    const ents = await rpc(jwt, 'get_my_entitlements');
    record('get_my_entitlements → empty for classless account',
      ents.status === 200 && Array.isArray(ents.body) && ents.body.length === 0,
      `status ${ents.status}`);

    const gate = await rpc(jwt, 'edge_gate_check', { p_subject: 'business' });
    record('edge_gate_check → allow_content=false, allow_bank=false',
      gate.status === 200 && gate.body && gate.body.allow_content === false && gate.body.allow_bank === false,
      JSON.stringify(gate.body));

    // ── revoked functions stay revoked ──
    const core = await rpc(jwt, 'has_subject_access', { p_profile: uid, p_subject: 'business' });
    record('has_subject_access (core) denied to clients', core.status >= 400, `status ${core.status}`);
    const due = await rpc(jwt, 'task_effective_due', {
      p_task_id: '00000000-0000-0000-0000-000000000000',
      p_student_id: '00000000-0000-0000-0000-000000000000',
    });
    record('task_effective_due denied to clients', due.status >= 400, `status ${due.status}`);

    // ── the crown jewel: answer_key must be unreachable ──
    const bank = await fetch(`${SUPABASE_URL}/rest/v1/bank_questions?select=answer_key&limit=1`, {
      headers: studentHeaders(jwt),
    });
    const bankRows = bank.ok ? await bank.json() : null;
    record('bank_questions.answer_key unreachable for students',
      !bank.ok || (Array.isArray(bankRows) && bankRows.length === 0),
      `status ${bank.status}, rows ${Array.isArray(bankRows) ? bankRows.length : 'n/a'}`);

    // ── privilege-escalation trigger (the WP-A7 HIGH fix) ──
    const esc1 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: 'PATCH', headers: studentHeaders(jwt, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ is_owner: true }),
    });
    record('UPDATE profiles set is_owner=true is BLOCKED', esc1.status >= 400, `status ${esc1.status}`);
    const esc2 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: 'PATCH', headers: studentHeaders(jwt, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ role: 'teacher' }),
    });
    record('UPDATE profiles set role=teacher is BLOCKED', esc2.status >= 400, `status ${esc2.status}`);
    // …while a legitimate self-update still works
    const legit = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: 'PATCH', headers: studentHeaders(jwt, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ username: 'qa-a9-smoke-' + stamp }),
    });
    record('legitimate profile update (username) still allowed', legit.status < 300, `status ${legit.status}`);

    // confirm escalation really didn't stick
    const after = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=role,is_owner`, {
      headers: studentHeaders(jwt),
    });
    const afterRows = await after.json();
    record('role/is_owner unchanged after escalation attempts',
      afterRows[0] && afterRows[0].role === 'student' && afterRows[0].is_owner === false,
      JSON.stringify(afterRows[0]));

    // gate verdict still false after the attempts
    const gate2 = await rpc(jwt, 'edge_gate_check', { p_subject: 'business' });
    record('edge_gate_check still denies after escalation attempts',
      gate2.status === 200 && gate2.body && gate2.body.allow_bank === false, JSON.stringify(gate2.body));

    // ── join-code redemption: error slugs + failure throttle ──
    const bad = await rpc(jwt, 'redeem_join_code', { p_code: 'AAAAAAAA' });
    record('redeem_join_code invalid code → code_invalid',
      bad.status >= 400 && JSON.stringify(bad.body).includes('code_invalid'),
      `status ${bad.status}, body ${JSON.stringify(bad.body).slice(0, 220)}`);
    let throttled = false;
    for (let i = 0; i < 12 && !throttled; i++) {
      const r = await rpc(jwt, 'redeem_join_code', { p_code: 'BBBBBBB' + (i % 10) });
      if (JSON.stringify(r.body).includes('too_many_attempts')) throttled = true;
    }
    record('redeem_join_code throttles after 10 failures/hour', throttled);

    // ── integrity logging works with a student JWT ──
    const integ = await rpc(jwt, 'record_integrity_event', {
      p_page_id: 'qa:a9-smoke', p_context: 'a9_smoke', p_detail: { ok: true },
    });
    record('record_integrity_event succeeds as student', integ.status < 300, `status ${integ.status}`);

    // ── platform_settings readable + correct flags ──
    const ps = await fetch(`${SUPABASE_URL}/rest/v1/platform_settings?select=key,value`, {
      headers: studentHeaders(jwt),
    });
    const psRows = ps.ok ? await ps.json() : [];
    const flag = k => { const r = psRows.find(x => x.key === k); return r ? r.value : undefined; };
    record('platform_settings: billing_enforced=false', flag('billing_enforced') === false, String(flag('billing_enforced')));
    record('platform_settings: content_protect=true', flag('content_protect') === true, String(flag('content_protect')));
    record('platform_settings: daily_answer_cap present', flag('daily_answer_cap') !== undefined, String(flag('daily_answer_cap')));

    // ── no token at all → nothing usable comes back ──
    // Before the anon-revoke is applied in the DB the call succeeds but
    // returns all-false (auth.uid() is null) — no leak either way.
    const anon = await fetch(`${SUPABASE_URL}/rest/v1/rpc/edge_gate_check`, {
      method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_subject: 'business' }),
    });
    let anonBody = null; try { anonBody = await anon.json(); } catch {}
    const anonSafe = anon.status >= 400 ||
      (anonBody && anonBody.allow_content === false && anonBody.allow_bank === false);
    record('edge_gate_check grants nothing to anonymous callers', anonSafe,
      `status ${anon.status}${anon.status < 400 ? ' (all-false; re-run entitlements.sql to deny outright)' : ''}`);
  } finally {
    // ── cleanup: delete the throwaway account (children cascade) ──
    const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: 'DELETE', headers: adminHeaders,
    });
    console.log(del.ok ? `cleaned up test user ${uid}` : `!! cleanup failed (${del.status}) — delete ${email} manually in Supabase Auth`);
  }

  const fails = results.filter(r => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} checks passed`);

  // Detect the specific "live DB predates the WP-A7 SQL" signature — the
  // privilege-change trigger is the tell. If escalation succeeded, EVERY
  // downstream failure is explained by stale SQL, not by broken code.
  const escFailed = results.some(r =>
    r.name.includes('is_owner=true is BLOCKED') && !r.pass);
  if (escFailed) {
    console.log('\n⚠ ROOT CAUSE: the live database is running SQL from BEFORE the WP-A7');
    console.log('  hardening. Re-run these in the Supabase SQL editor (all re-run-safe),');
    console.log('  then run this smoke again — it should go green:');
    console.log('    supabase/schema.sql            (privilege-change trigger)');
    console.log('    supabase/entitlements.sql      (daily_answer_cap + anon revokes)');
    console.log('    supabase/daily-revise-functions.sql');
    console.log('    supabase/tasks-schema.sql      (task_effective_due revoke)');
    console.log('    supabase/join-codes.sql        (anon revokes)');
    console.log('  Until then the self-escalation → question-bank-leak path is LIVE.');
  }
  if (fails.length) process.exit(1);
}

main().catch(e => { console.error('smoke crashed:', e); process.exit(2); });
