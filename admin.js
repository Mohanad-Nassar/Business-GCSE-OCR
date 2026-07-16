// ══════════════════════════════════════════════════════════════
// SCHOOL ADMIN — teacher management, subject access, invite codes.
//
// One page, role-branched, for the platform OWNER and each school's
// SCHOOL_ADMIN. Everything it does is backed by the guarded functions in
// supabase/school-admin.sql (reads + subject/role changes) and the service-role
// Netlify functions admin-suspend/remove/delete/reset-teacher (account actions
// that need the Auth admin API). This file is a thin shell: it never trusts a
// permission decision it made itself — the server re-checks owner / school_admin
// on every call.
//
// Access gate (in order): signed in (tasksAuthInit) → school-admin RPCs exist
// (school-admin.sql run) → caller is owner or a school_admin (am_i_admin).
// Owner gets a school switcher + a Schools tab + the school-subjects allow-list;
// a school_admin drops straight into their one school.
// ══════════════════════════════════════════════════════════════

const esc = (typeof taskEscapeHtml === 'function') ? taskEscapeHtml : (s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

let adClient = null;
let meta = { is_owner: false, schools: [] };   // from am_i_admin
let activeSchoolId = null;
let ov = null;                                  // get_teacher_admin_overview payload

let topTab = 'teachers';                        // teachers | subjects | codes | audit | schools
let teacherSub = 'active';                      // active | suspended | removed | deleted
let codeSub = 'active';                         // active | revoked

// ── Platform-subject edit grants (Subjects V2 · S4) ──
// Loaded best-effort alongside the overview; if the S4 migration isn't run yet
// these stay empty and editGrantsAvailable is false, so the edit-grant UI hides.
let schoolEditGrantIds = [];   // subject ids this school may fork/edit (get_school_edit_grants)
let teacherEditGrantIds = {};  // profile_id -> [subject_id] (teacher_subject_edit_access)
let editGrantsAvailable = false;

// ── Init / gating ───────────────────────────────────────────────
async function init() {
  const auth = await tasksAuthInit(); // any signed-in user; admin-gated below
  if (!auth) return;
  adClient = auth.client;

  const { data, error } = await adClient.rpc('am_i_admin');
  if (error) { renderSetupNeeded(error); return; }
  meta = data || { is_owner: false, schools: [] };
  if (!meta.is_owner && (!meta.schools || meta.schools.length === 0)) { renderNotAdmin(); return; }

  activeSchoolId = (meta.schools && meta.schools[0] && meta.schools[0].id) || null;
  document.getElementById('roleBadge').textContent = meta.is_owner ? 'Owner' : 'School admin';
  wireSchoolSwitch();

  if (!activeSchoolId) { topTab = 'schools'; renderShell(); return; } // owner with no schools yet
  await loadOverview();
}

function wireSchoolSwitch() {
  const wrap = document.getElementById('schoolSwitch');
  const sel = document.getElementById('schoolSelect');
  const list = meta.schools || [];
  if (list.length <= 1 && !meta.is_owner) { wrap.style.display = 'none'; return; }
  if (list.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  sel.innerHTML = list.map(s => `<option value="${esc(s.id)}"${s.id === activeSchoolId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  sel.onchange = () => { activeSchoolId = sel.value; topTab = 'teachers'; loadOverview(); };
}

async function loadOverview() {
  document.getElementById('adminMain').innerHTML = panel(`<div class="empty"><div class="empty-emoji">⏳</div><p>Loading…</p></div>`);
  try {
    const { data, error } = await adClient.rpc('get_teacher_admin_overview', { p_school_id: activeSchoolId });
    if (error) throw error;
    ov = data;
    await loadEditGrants();
    renderShell();
  } catch (e) {
    console.error('get_teacher_admin_overview', e);
    document.getElementById('adminMain').innerHTML = panel(
      `<div class="empty"><div class="empty-emoji">😕</div><p><strong>Couldn't load this school.</strong></p>
       <p class="muted">${esc(e.message || 'Please try again.')}</p></div>`);
  }
}

// Best-effort load of the S4 edit-grant control plane: the school's editable-
// subject set (owner + admin) and each teacher's current edit grants (RLS admits
// an admin-over read). Degrades quietly if subjects-v2-s4-fork-grants.sql isn't
// run yet, so the rest of the admin page keeps working.
async function loadEditGrants() {
  schoolEditGrantIds = [];
  teacherEditGrantIds = {};
  editGrantsAvailable = false;
  try {
    const { data, error } = await adClient.rpc('get_school_edit_grants', { p_school_id: activeSchoolId });
    if (error) throw error;
    schoolEditGrantIds = data || [];
    editGrantsAvailable = true;
  } catch (e) {
    return; // S4 migration not run — leave the edit-grant UI hidden
  }
  try {
    const { data } = await adClient.from('teacher_subject_edit_access').select('profile_id, subject_id');
    (data || []).forEach(r => {
      (teacherEditGrantIds[r.profile_id] = teacherEditGrantIds[r.profile_id] || []).push(r.subject_id);
    });
  } catch (e) { /* keep empty — checkboxes just render unchecked */ }
}

// ── Gate panels ─────────────────────────────────────────────────
function renderSetupNeeded(err) {
  document.getElementById('adminMain').innerHTML = panel(`
    <div class="empty">
      <div class="empty-emoji">🧩</div>
      <p><strong>Almost there — run the migrations first.</strong></p>
      <p class="muted">This page needs <code>supabase/schools.sql</code> and
      <code>supabase/school-admin.sql</code> to have been run in the Supabase SQL editor.
      Once they're in, reload this page.</p>
      <p class="muted" style="margin-top:8px;">(Details: ${esc(err.message || 'admin functions not found')})</p>
    </div>`);
}

function renderNotAdmin() {
  document.getElementById('adminMain').innerHTML = panel(`
    <div class="empty">
      <div class="empty-emoji">🔒</div>
      <p><strong>This page is for school admins and the platform owner.</strong></p>
      <p class="muted">If you should manage a school, ask your platform owner to promote you to
      <em>school admin</em>, or to mark your account as owner.</p>
    </div>`);
}

// ── Shell (tabs) ────────────────────────────────────────────────
function tabsFor() {
  const t = [
    { id: 'teachers', label: '👥 Teachers', count: (ov && ov.teachers ? ov.teachers.filter(x => !x.removed_at).length : 0) },
    { id: 'codes',    label: '🎟️ Invite codes', count: (ov && ov.codes ? ov.codes.filter(c => !c.revoked).length : 0) },
    { id: 'sharing',  label: '🤝 Sharing' },
    { id: 'audit',    label: '📜 Audit log' },
  ];
  if (meta.is_owner) {
    t.splice(2, 0, { id: 'subjects', label: '📚 School subjects' });
    t.push({ id: 'schools', label: '🏫 Schools' });
  }
  return t;
}

function renderShell() {
  const main = document.getElementById('adminMain');
  const tabs = tabsFor();
  main.innerHTML = `
    <div class="tabs" id="topTabs">
      ${tabs.map(t => `<button class="tab ${topTab === t.id ? 'active' : ''}" data-tab="${t.id}">
        ${t.label}${t.count != null ? `<span class="count">${t.count}</span>` : ''}</button>`).join('')}
    </div>
    <div id="tabBody"></div>`;
  main.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { topTab = b.dataset.tab; renderShell(); }));
  const body = document.getElementById('tabBody');
  if (topTab === 'teachers') renderTeachers(body);
  else if (topTab === 'codes') renderCodes(body);
  else if (topTab === 'subjects') renderSchoolSubjects(body);
  else if (topTab === 'sharing') renderSharing(body);
  else if (topTab === 'audit') renderAudit(body);
  else if (topTab === 'schools') renderSchools(body);
}

// ── Sharing tab (D4 — admin sees + revokes every share in the school) ──
function renderSharing(body) {
  body.innerHTML = `
    <div class="panel" id="extReqPanel" style="display:none; border-left:4px solid var(--accent, #4a6fa5);">
      <div class="section-label" style="margin-top:0;">🌐 External share requests — awaiting approval</div>
      <p class="muted" style="margin:0 0 10px;">A teacher wants to share a subject with someone outside this school. Review the invitee and reason before approving.</p>
      <div id="extReqList"></div>
    </div>
    <div class="panel" id="reqPanel" style="display:none; border-left:4px solid var(--accent, #4a6fa5);">
      <div class="section-label" style="margin-top:0;">✋ Requests to edit — awaiting approval</div>
      <div id="reqList"></div>
    </div>
    <div class="panel">
      <div class="section-label" style="margin-top:0;">Subject shares in this school</div>
      <p class="muted" style="margin:0 0 10px;">Every subject a teacher here has shared with a colleague or the whole school. You can revoke any of them.</p>
      <div id="sharesList">${emptyBox('⏳', 'Loading…')}</div>
    </div>`;
  loadSchoolShares();
  loadSchoolEditRequests();
  loadSchoolExternalRequests();
}

async function loadSchoolExternalRequests() {
  const panel = document.getElementById('extReqPanel');
  const list = document.getElementById('extReqList');
  if (!panel || !list) return;
  try {
    const { data, error } = await adClient.rpc('get_incoming_external_requests', { p_school_id: activeSchoolId });
    if (error) throw error;
    const pending = (data || []).filter(r => r.status === 'pending');
    if (!pending.length) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    list.innerHTML = pending.map(r => `<div class="audit-row">
      <div><div class="audit-act">${esc(r.subject_name)} → ${esc(r.invitee_name)} <span class="muted">(${esc(r.invitee_email)})</span></div>
        <div class="audit-when">requested by ${esc(r.requester_name || '—')} · ${esc(r.access)} · ${esc(r.created_at ? new Date(r.created_at).toLocaleString() : '')}${r.reason ? ' · “' + esc(r.reason) + '”' : ''}</div></div>
      <span style="display:flex; gap:6px;">
        <button type="button" class="btn small" data-act="approve-ext" data-id="${esc(r.id)}">Approve</button>
        <button type="button" class="btn small danger" data-act="deny-ext" data-id="${esc(r.id)}">Deny</button>
      </span>
    </div>`).join('');
    list.querySelectorAll('[data-act="approve-ext"]').forEach(b => b.addEventListener('click', () => resolveExternalReq(b.dataset.id, true)));
    list.querySelectorAll('[data-act="deny-ext"]').forEach(b => b.addEventListener('click', () => resolveExternalReq(b.dataset.id, false)));
  } catch (e) {
    panel.style.display = 'none';   // S3 migration may not be run yet — skip quietly
  }
}

async function resolveExternalReq(id, approve) {
  const { data, error } = await adClient.rpc('resolve_external_share', { p_request_id: id, p_approve: approve });
  if (error) { toast('Could not update: ' + error.message); return; }
  if (approve && data && data.mode === 'invite' && data.token) {
    const link = `${location.origin}/teacher-signup.html?xshare=${encodeURIComponent(data.token)}`;
    try { await navigator.clipboard.writeText(link); } catch (e) {}
    alert('Approved. This person has no account yet — send them this one-time signup link (copied to your clipboard):\n\n' + link + '\n\nIt expires in 72 hours.');
  } else if (approve) {
    toast('Approved — access granted');
  } else {
    toast('Request denied');
  }
  loadSchoolExternalRequests();
  loadSchoolShares();
}

async function loadSchoolEditRequests() {
  const panel = document.getElementById('reqPanel');
  const list = document.getElementById('reqList');
  if (!panel || !list) return;
  try {
    const { data, error } = await adClient.rpc('get_incoming_edit_requests');
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    list.innerHTML = rows.map(r => `<div class="audit-row">
      <div><div class="audit-act">${esc(r.subject_name)}</div>
        <div class="audit-when">${esc(r.requester_name || 'A teacher')} wants edit access${r.reason ? ' · “' + esc(r.reason) + '”' : ''}</div></div>
      <span style="display:flex; gap:6px;">
        <button type="button" class="btn small" data-act="approve-req" data-id="${esc(r.id)}">Approve</button>
        <button type="button" class="btn small danger" data-act="deny-req" data-id="${esc(r.id)}">Deny</button>
      </span>
    </div>`).join('');
    list.querySelectorAll('[data-act="approve-req"]').forEach(b => b.addEventListener('click', () => resolveEditReq(b.dataset.id, true)));
    list.querySelectorAll('[data-act="deny-req"]').forEach(b => b.addEventListener('click', () => resolveEditReq(b.dataset.id, false)));
  } catch (e) {
    panel.style.display = 'none';   // requests migration may not be run yet — skip quietly
  }
}

async function resolveEditReq(id, approve) {
  const { error } = await adClient.rpc('resolve_subject_edit_request', { p_request_id: id, p_approve: approve });
  if (error) { toast('Could not update: ' + error.message); return; }
  toast(approve ? 'Edit access granted' : 'Request denied');
  loadSchoolEditRequests(); loadSchoolShares();
}

async function loadSchoolShares() {
  const el = document.getElementById('sharesList');
  if (!el) return;
  try {
    const { data, error } = await adClient.rpc('get_school_shares', { p_school_id: activeSchoolId });
    if (error) throw error;
    const rows = data || [];
    el.innerHTML = rows.length ? rows.map(shareRow).join('') : emptyBox('🤝', 'No shares yet in this school.');
    el.querySelectorAll('[data-act="revoke-share"]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Revoke this share? The colleague will immediately lose access.')) return;
      const { error: e2 } = await adClient.rpc('revoke_share', { p_share_id: b.dataset.id });
      if (e2) { toast('Could not revoke: ' + e2.message); return; }
      toast('Share revoked'); loadSchoolShares();
    }));
  } catch (e) {
    el.innerHTML = `<div class="empty"><p class="muted">${esc(e.message || 'Could not load shares — is supabase/subjects-v2.sql run?')}</p></div>`;
  }
}

function shareRow(r) {
  const when = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
  const target = r.scope === 'school' ? '🏫 whole school' : '👤 ' + esc(r.grantee_name);
  return `<div class="audit-row">
    <div><div class="audit-act">${esc(r.subject_name)}</div>
      <div class="audit-when">${esc(r.owner_name || '—')} → ${target} · <strong>${esc(r.access)}</strong>${when ? ' · ' + esc(when) : ''}</div></div>
    <button type="button" class="btn small danger" data-act="revoke-share" data-id="${esc(r.id)}">Revoke</button>
  </div>`;
}

// ── Teachers tab ────────────────────────────────────────────────
function renderTeachers(body) {
  const teachers = (ov && ov.teachers) || [];
  const active = teachers.filter(t => !t.removed_at && t.status !== 'suspended');
  const suspended = teachers.filter(t => !t.removed_at && t.status === 'suspended');
  const removed = teachers.filter(t => t.removed_at);
  const deleted = ((ov && ov.audit) || []).filter(a => a.action === 'delete_teacher');
  const buckets = { active, suspended, removed, deleted };
  const cur = buckets[teacherSub] || [];

  const subtab = (id, label, n) => `<button class="subtab ${teacherSub === id ? 'active' : ''}" data-sub="${id}">${label} (${n})</button>`;

  let listHtml;
  if (teacherSub === 'deleted') {
    listHtml = deleted.length ? deleted.map(deletedRow).join('') : emptyBox('🗑️', 'No deleted teachers.');
  } else {
    listHtml = cur.length ? cur.map(t => teacherRow(t)).join('') : emptyBox('👤', `No ${teacherSub} teachers.`);
  }

  body.innerHTML = `
    <div class="subtabs">
      ${subtab('active', 'Active', active.length)}
      ${subtab('suspended', 'Suspended', suspended.length)}
      ${subtab('removed', 'Removed', removed.length)}
      ${subtab('deleted', 'Deleted', deleted.length)}
    </div>
    ${listHtml}
    <div class="panel" style="margin-top:18px;">
      <div class="section-label" style="margin-top:0;">Add an existing teacher to this school</div>
      <p class="muted" style="margin-bottom:10px;">The teacher must already have an account (they signed up with an invite code). To invite a brand-new teacher, use the <strong>Invite codes</strong> tab.</p>
      <div class="row">
        <div><label class="fld">Teacher email</label><input id="attachEmail" type="email" placeholder="teacher@school.org"/></div>
        <button class="btn" id="attachBtn">Add teacher</button>
      </div>
    </div>`;

  body.querySelectorAll('.subtab').forEach(b => b.addEventListener('click', () => { teacherSub = b.dataset.sub; renderShell(); }));
  body.querySelectorAll('.trow-head').forEach(h => h.addEventListener('click', e => {
    if (e.target.closest('button') || e.target.closest('.subchk')) return;
    h.parentElement.classList.toggle('open');
  }));
  wireTeacherActions(body);
  const attach = document.getElementById('attachBtn');
  if (attach) attach.addEventListener('click', () => {
    const email = document.getElementById('attachEmail').value.trim();
    if (!email) { toast('Enter a teacher email'); return; }
    rpc('attach_teacher_to_school', { p_school_id: activeSchoolId, p_email: email, p_role: 'teacher' },
      'Teacher added (if the email matched an account)', 'Could not add teacher');
  });
}

function subjectNames(ids) {
  const all = (ov && ov.all_subjects) || [];
  return (ids || []).map(id => { const s = all.find(x => x.id === id); return s ? s.name : null; }).filter(Boolean);
}
function schoolSetIds() {
  // The school's allowed set: explicit ids, or ALL subjects if none set.
  const explicit = (ov && ov.school_subject_ids) || [];
  if (explicit.length) return explicit;
  return ((ov && ov.all_subjects) || []).map(s => s.id);
}

function teacherRow(t) {
  const isRemoved = !!t.removed_at;
  const roleBadge = t.is_creator_owner ? '<span class="badge owner">owner</span>'
    : (t.role === 'school_admin' ? '<span class="badge admin">school admin</span>' : '');
  const stateBadge = isRemoved ? '<span class="badge rem">removed</span>'
    : (t.status === 'suspended' ? `<span class="badge susp">suspended${t.suspended_mode === 'login_frozen' ? ' · frozen' : ''}</span>` : '');
  const last = t.last_sign_in_at ? new Date(t.last_sign_in_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never';
  const effNames = subjectNames(t.effective_subject_ids);
  const subjLabel = effNames.length >= schoolSetIds().length ? 'All school subjects' : (effNames.join(', ') || 'None');
  const pid = esc(t.profile_id);

  // Body varies by state: owner account is read-only; a removed teacher shows
  // re-add / delete-forever; an active/suspended teacher gets the full toolkit.
  let bodyInner;
  if (t.is_creator_owner) {
    bodyInner = '<p class="muted">The platform owner account can\'t be managed here.</p>';
  } else if (isRemoved) {
    bodyInner = `
      <p class="muted">Removed from the school on ${esc(new Date(t.removed_at).toLocaleDateString())}. Their account and classes still exist.</p>
      <div class="actions">
        <button class="btn small" data-act="reattach" data-pid="${pid}">↩️ Re-add to school</button>
        <button class="btn small solid-danger" data-act="deleteforever" data-pid="${pid}">🗑️ Delete account forever</button>
      </div>`;
  } else {
    bodyInner = `
      <div class="section-label" style="margin-top:0;">Subject access</div>
      <p class="muted">Currently: <strong>${esc(subjLabel)}</strong>. Tick the subjects this teacher may access (limited to what your school is allowed).</p>
      <div class="subgrid" data-role="subjects">${subjectCheckboxes(t)}</div>
      <button class="btn small" data-act="savesubjects">Save subjects</button>
      ${editAccessBlock(t)}
      <div class="actions">
        <button class="btn small secondary" data-act="reset">🔑 Reset password</button>
        ${t.status === 'suspended'
          ? '<button class="btn small" data-act="reinstate">✅ Reinstate</button>'
          : '<button class="btn small secondary" data-act="suspend">⏸️ Suspend</button>'}
        ${t.role === 'school_admin'
          ? '<button class="btn small secondary" data-act="demote">Demote to teacher</button>'
          : '<button class="btn small secondary" data-act="promote">Make school admin</button>'}
        <button class="btn small danger" data-act="remove">Remove from school</button>
      </div>`;
  }

  return `
  <div class="trow ${isRemoved ? 'removed' : (t.status === 'suspended' ? 'suspended' : '')}" data-pid="${pid}">
    <div class="trow-head">
      <span class="chev">▶</span>
      <div class="trow-id">
        <div class="trow-name">${esc(t.username || '—')} ${roleBadge} ${stateBadge}</div>
        <div class="trow-email">${esc(t.email || 'no email on record')}</div>
      </div>
      <div class="trow-meta">
        <div class="stat"><b>${t.class_count || 0}</b><span>classes</span></div>
        <div class="stat"><b>${t.student_count || 0}</b><span>students</span></div>
        <div class="stat"><b>${esc(last)}</b><span>last sign-in</span></div>
      </div>
    </div>
    <div class="trow-body">${bodyInner}</div>
  </div>`;
}

function subjectCheckboxes(t) {
  const all = (ov && ov.all_subjects) || [];
  const setIds = schoolSetIds();
  const eff = new Set(t.effective_subject_ids || []);
  return all.map(s => {
    const inSchool = setIds.includes(s.id);
    const on = eff.has(s.id);
    return `<label class="subchk ${on ? 'on' : ''} ${inSchool ? '' : 'locked'}">
      <input type="checkbox" value="${esc(s.id)}" ${on ? 'checked' : ''} ${inSchool ? '' : 'disabled'}/>
      ${esc(s.icon || '')} ${esc(s.name)}</label>`;
  }).join('');
}

// ── Per-teacher platform-edit grants (Subjects V2 · S4) ──
// A parallel control to subject access: which platform subjects this teacher may
// edit a SCHOOL COPY of. Only the subjects the OWNER has granted this school
// appear; if the school has none, a muted note explains why.
function editAccessBlock(t) {
  if (!editGrantsAvailable) return '';
  if (!schoolEditGrantIds.length) {
    return `<div class="section-label">Can edit school copies of</div>
      <p class="muted">The platform owner hasn't granted this school any editable subjects yet.</p>`;
  }
  return `<div class="section-label">Can edit school copies of</div>
    <p class="muted">Tick the platform subjects this teacher may edit a school copy of (limited to what your school has been granted).</p>
    <div class="subgrid" data-role="editsubjects">${editSubjectCheckboxes(t)}</div>
    <button class="btn small" data-act="saveeditsubjects">Save editable subjects</button>`;
}

function editSubjectCheckboxes(t) {
  const all = (ov && ov.all_subjects) || [];
  const cur = new Set(teacherEditGrantIds[t.profile_id] || []);
  return all.filter(s => schoolEditGrantIds.includes(s.id)).map(s => {
    const on = cur.has(s.id);
    return `<label class="subchk ${on ? 'on' : ''}">
      <input type="checkbox" value="${esc(s.id)}" ${on ? 'checked' : ''}/>
      ${esc(s.icon || '')} ${esc(s.name)}</label>`;
  }).join('');
}

function deletedRow(a) {
  const when = a.created_at ? new Date(a.created_at).toLocaleString() : '';
  const d = a.detail || {};
  return `<div class="trow removed"><div class="trow-head" style="cursor:default;">
    <div class="trow-id"><div class="trow-name">${esc(a.target || a.target_email || 'teacher')}</div>
    <div class="trow-email">deleted by ${esc(a.actor || '—')} · ${esc(when)}${d.class_action ? ' · classes: ' + esc(d.class_action) : ''}</div></div>
  </div></div>`;
}

function wireTeacherActions(body) {
  body.querySelectorAll('.trow').forEach(row => {
    const pid = row.dataset.pid;
    const t = (ov.teachers || []).find(x => x.profile_id === pid);
    if (!t) return;
    const q = sel => row.querySelector(`[data-act="${sel}"]`);

    q('savesubjects') && q('savesubjects').addEventListener('click', () => {
      const checked = Array.from(row.querySelectorAll('[data-role="subjects"] input:checked')).map(i => i.value);
      const setIds = schoolSetIds();
      // all-of-school ticked → store empty (means "whole school set", auto-tracks additions)
      const payload = (checked.length >= setIds.length) ? [] : checked;
      rpc('set_teacher_subjects', { p_profile: pid, p_subject_ids: payload }, 'Subjects updated', 'Could not update subjects');
    });

    // Editable-subject grants (S4): deny by default — the checked set IS the
    // grant set, no "all = whole school" shorthand (empty means none).
    q('saveeditsubjects') && q('saveeditsubjects').addEventListener('click', () => {
      const checked = Array.from(row.querySelectorAll('[data-role="editsubjects"] input:checked')).map(i => i.value);
      rpc('set_teacher_edit_subjects', { p_profile: pid, p_subject_ids: checked }, 'Editable subjects updated', 'Could not update editable subjects');
    });

    q('promote') && q('promote').addEventListener('click', () =>
      rpc('set_teacher_role', { p_profile: pid, p_role: 'school_admin' }, 'Promoted to school admin', 'Could not promote'));
    q('demote') && q('demote').addEventListener('click', () =>
      rpc('set_teacher_role', { p_profile: pid, p_role: 'teacher' }, 'Demoted to teacher', 'Could not demote'));

    q('suspend') && q('suspend').addEventListener('click', () => openSuspendModal(t));
    q('reinstate') && q('reinstate').addEventListener('click', () => callAction('admin-suspend-teacher',
      { teacher_id: pid, suspend: false }, 'Teacher reinstated', 'Could not reinstate'));
    q('reset') && q('reset').addEventListener('click', () => openResetModal(t));
    q('remove') && q('remove').addEventListener('click', () => {
      if (!confirm(`Remove ${t.username || 'this teacher'} from the school? Their account and classes stay intact — they move to the Removed tab and can be re-added.`)) return;
      callAction('admin-remove-teacher', { teacher_id: pid, reattach: false }, 'Teacher removed', 'Could not remove');
    });
  });

  // Removed-tab rows carry reattach / delete-forever buttons
  body.querySelectorAll('[data-act="reattach"]').forEach(b => b.addEventListener('click', () =>
    callAction('admin-remove-teacher', { teacher_id: b.dataset.pid, reattach: true }, 'Teacher re-added', 'Could not re-add')));
  body.querySelectorAll('[data-act="deleteforever"]').forEach(b => b.addEventListener('click', () => {
    const t = (ov.teachers || []).find(x => x.profile_id === b.dataset.pid);
    openDeleteModal(t);
  }));
}

// ── Modals ──────────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modal').innerHTML = html;
  document.getElementById('modalBackdrop').classList.add('show');
}
function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });

function pickOpt(root, val) {
  root.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o.dataset.val === val));
  root.dataset.choice = val;
}

function openSuspendModal(t) {
  openModal(`
    <h3>Suspend ${esc(t.username || 'teacher')}</h3>
    <p class="muted">They won't be able to sign in until reinstated. Choose what happens to their classes:</p>
    <div id="suspOpts">
      <label class="opt sel" data-val="login"><b>Block sign-in only</b><span>Their classes keep working — students carry on as normal.</span></label>
      <label class="opt" data-val="login_frozen"><b>Block sign-in + freeze classes</b><span>Their classes are hidden from students until the teacher is reinstated.</span></label>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" data-x="cancel">Cancel</button>
      <button class="btn" data-x="go">Suspend teacher</button>
    </div>`);
  const opts = document.getElementById('suspOpts'); opts.dataset.choice = 'login';
  opts.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => pickOpt(opts, o.dataset.val)));
  document.querySelector('[data-x="cancel"]').onclick = closeModal;
  document.querySelector('[data-x="go"]').onclick = () => {
    closeModal();
    callAction('admin-suspend-teacher', { teacher_id: t.profile_id, suspend: true, mode: opts.dataset.choice },
      'Teacher suspended', 'Could not suspend');
  };
}

function openResetModal(t) {
  const hasEmail = !!t.email;
  openModal(`
    <h3>Reset password — ${esc(t.username || 'teacher')}</h3>
    <p class="muted">Choose how to reset this teacher's password:</p>
    <div id="resetOpts">
      <label class="opt sel" data-val="temp"><b>Show a temporary password</b><span>A new password appears here for you to pass on. Works with no email setup.</span></label>
      <label class="opt ${hasEmail ? '' : 'locked'}" data-val="email"><b>Email a reset link</b><span>${hasEmail ? esc(t.email) : 'No email on record for this teacher.'}</span></label>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" data-x="cancel">Cancel</button>
      <button class="btn" data-x="go">Reset password</button>
    </div>`);
  const opts = document.getElementById('resetOpts'); opts.dataset.choice = 'temp';
  opts.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => {
    if (o.dataset.val === 'email' && !hasEmail) return;
    pickOpt(opts, o.dataset.val);
  }));
  document.querySelector('[data-x="cancel"]').onclick = closeModal;
  document.querySelector('[data-x="go"]').onclick = async () => {
    const method = opts.dataset.choice;
    try {
      const res = await callFunction('admin-reset-teacher-password', { teacher_id: t.profile_id, method });
      if (method === 'temp' && res.password) {
        openModal(`<h3>Temporary password</h3>
          <p class="muted">Give this to ${esc(t.username || 'the teacher')} — they should change it after signing in.</p>
          <p style="font-family:'DM Mono',monospace; font-size:20px; background:var(--cream); padding:12px; border-radius:8px; text-align:center; letter-spacing:1px;">${esc(res.password)}</p>
          <div class="modal-actions"><button class="btn" data-x="done">Done</button></div>`);
        document.querySelector('[data-x="done"]').onclick = closeModal;
      } else {
        closeModal(); toast('Reset link emailed');
      }
    } catch (e) { closeModal(); toast(e.message || 'Could not reset password'); }
  };
}

function openDeleteModal(t) {
  if (!t) return;
  openModal(`
    <h3>Delete ${esc(t.username || 'teacher')} forever</h3>
    <p class="muted">This permanently deletes the account. Choose what happens to the ${t.class_count || 0} class(es) they created:</p>
    <div id="delOpts">
      <label class="opt sel" data-val="handoff"><b>Hand classes to a co-teacher / you</b><span>Ownership passes to an existing co-teacher, or to you if there's none. Students &amp; progress untouched.</span></label>
      <label class="opt" data-val="orphan"><b>Transfer classes to me</b><span>All their classes move to you to reassign later.</span></label>
      <label class="opt" data-val="delete"><b>Delete their classes too</b><span>Removes the classes and unlinks students. Answer history is kept. Destructive.</span></label>
    </div>
    <p class="warn">Type the teacher's username to confirm:</p>
    <input id="delConfirm" placeholder="${esc(t.username || '')}" style="width:100%;"/>
    <div class="modal-actions">
      <button class="btn secondary" data-x="cancel">Cancel</button>
      <button class="btn solid-danger" data-x="go" disabled>Delete forever</button>
    </div>`);
  const opts = document.getElementById('delOpts'); opts.dataset.choice = 'handoff';
  opts.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => pickOpt(opts, o.dataset.val)));
  const conf = document.getElementById('delConfirm');
  const go = document.querySelector('[data-x="go"]');
  conf.addEventListener('input', () => { go.disabled = conf.value.trim() !== (t.username || ''); });
  document.querySelector('[data-x="cancel"]').onclick = closeModal;
  go.onclick = () => {
    closeModal();
    callAction('admin-delete-teacher', { teacher_id: t.profile_id, class_action: opts.dataset.choice },
      'Teacher deleted', 'Could not delete teacher');
  };
}

// ── School subjects tab (owner only) ────────────────────────────
function renderSchoolSubjects(body) {
  const all = (ov && ov.all_subjects) || [];
  const explicit = (ov && ov.school_subject_ids) || [];
  const unrestricted = explicit.length === 0;
  body.innerHTML = `
    <div class="panel">
      <div class="section-label" style="margin-top:0;">Subjects this school can access</div>
      <p class="muted">Tick the subjects <strong>${esc((ov.school && ov.school.name) || 'this school')}</strong> may use. Its school admins can then grant these to individual teachers. Leave <em>all</em> ticked to keep it unrestricted (new subjects auto-included).</p>
      <div class="subgrid" id="schoolSubs">
        ${all.map(s => {
          const on = unrestricted || explicit.includes(s.id);
          return `<label class="subchk ${on ? 'on' : ''}"><input type="checkbox" value="${esc(s.id)}" ${on ? 'checked' : ''}/> ${esc(s.icon || '')} ${esc(s.name)}</label>`;
        }).join('')}
      </div>
      <button class="btn" id="saveSchoolSubs" style="margin-top:8px;">Save school subjects</button>
    </div>
    ${editGrantsAvailable ? `
    <div class="panel">
      <div class="section-label" style="margin-top:0;">Editable subjects (school copies)</div>
      <p class="muted">Tick the platform subjects <strong>${esc((ov.school && ov.school.name) || 'this school')}</strong> may fork and edit its own copy of. Its school admins then grant these to individual teachers. Nothing ticked = no editing (deny by default). Only platform subjects can be made editable.</p>
      <div class="subgrid" id="schoolEditSubs">
        ${all.map(s => {
          const on = schoolEditGrantIds.includes(s.id);
          return `<label class="subchk ${on ? 'on' : ''}"><input type="checkbox" value="${esc(s.id)}" ${on ? 'checked' : ''}/> ${esc(s.icon || '')} ${esc(s.name)}</label>`;
        }).join('')}
      </div>
      <button class="btn" id="saveSchoolEditSubs" style="margin-top:8px;">Save editable subjects</button>
    </div>` : `
    <div class="panel">
      <div class="section-label" style="margin-top:0;">Editable subjects (school copies)</div>
      <p class="muted">Run <code>supabase/subjects-v2-s4-fork-grants.sql</code> in the Supabase SQL editor to let schools edit their own copies of platform subjects.</p>
    </div>`}`;
  document.getElementById('saveSchoolSubs').addEventListener('click', () => {
    const checked = Array.from(document.querySelectorAll('#schoolSubs input:checked')).map(i => i.value);
    // all ticked → store empty (unrestricted); else store the selection
    const payload = (checked.length >= all.length) ? [] : checked;
    rpc('set_school_subjects', { p_school_id: activeSchoolId, p_subject_ids: payload }, 'School subjects saved', 'Could not save subjects');
  });
  const saveEdit = document.getElementById('saveSchoolEditSubs');
  if (saveEdit) saveEdit.addEventListener('click', () => {
    // Deny by default: the checked set IS the grant set (no "all = empty" trick).
    const checked = Array.from(document.querySelectorAll('#schoolEditSubs input:checked')).map(i => i.value);
    rpc('set_school_edit_subjects', { p_school_id: activeSchoolId, p_subject_ids: checked }, 'Editable subjects saved', 'Could not save editable subjects');
  });
}

// ── Invite codes tab ────────────────────────────────────────────
function renderCodes(body) {
  const codes = (ov && ov.codes) || [];
  const active = codes.filter(c => !c.revoked);
  const revoked = codes.filter(c => c.revoked);
  const cur = codeSub === 'active' ? active : revoked;
  body.innerHTML = `
    <div class="subtabs">
      <button class="subtab ${codeSub === 'active' ? 'active' : ''}" data-sub="active">Active (${active.length})</button>
      <button class="subtab ${codeSub === 'revoked' ? 'active' : ''}" data-sub="revoked">Revoked (${revoked.length})</button>
    </div>
    <div class="panel">
      ${cur.length ? cur.map(codeRow).join('') : emptyBox('🎟️', `No ${codeSub} codes.`)}
      ${codeSub === 'active' ? `<div class="inline-add">
        <div><label class="fld">Code</label><input class="c-code" value="${esc(genCode((ov.school && ov.school.name) || 'SCH'))}"/></div>
        <div><label class="fld">Expires (optional)</label><input class="c-exp" type="date"/></div>
        <div><label class="fld">Max uses (optional)</label><input class="c-max" type="number" min="1" placeholder="∞" style="width:110px;"/></div>
        <button class="btn small" id="addCodeBtn">+ Add code</button>
      </div>` : ''}
    </div>`;
  body.querySelectorAll('.subtab').forEach(b => b.addEventListener('click', () => { codeSub = b.dataset.sub; renderShell(); }));
  body.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () =>
    navigator.clipboard?.writeText(b.dataset.copy).then(() => toast('Code copied')).catch(() => {})));
  body.querySelectorAll('[data-act="revoke"]').forEach(b => b.addEventListener('click', () => {
    if (!confirm('Revoke this code? New teachers can no longer use it.')) return;
    rpc('revoke_school_invite_code', { p_code: b.dataset.code }, 'Code revoked', 'Could not revoke code');
  }));
  const add = document.getElementById('addCodeBtn');
  if (add) add.addEventListener('click', () => {
    const card = add.closest('.panel');
    const code = card.querySelector('.c-code').value.trim();
    const exp = card.querySelector('.c-exp').value;
    const maxRaw = card.querySelector('.c-max').value;
    if (!code) { toast('Enter a code'); return; }
    rpc('create_school_invite_code', {
      p_school_id: activeSchoolId, p_code: code,
      p_expires_at: exp ? new Date(exp + 'T23:59:59').toISOString() : null,
      p_max_uses: maxRaw ? Math.max(1, parseInt(maxRaw, 10)) : null, p_role: 'teacher',
    }, 'Code created', 'Could not create code (is it already in use?)');
  });
}

function codeRow(c) {
  const bits = [`used ${c.use_count}${c.max_uses != null ? '/' + c.max_uses : ''}`];
  if (c.expires_at) bits.push('expires ' + new Date(c.expires_at).toLocaleDateString());
  if (c.revoked) bits.push('revoked');
  return `<div class="code-row ${c.revoked ? 'revoked' : ''}">
    <span class="code-val">${esc(c.code)}</span>
    <button type="button" class="copy-btn" data-copy="${esc(c.code)}">copy</button>
    <span class="code-meta">${esc(bits.join(' · '))}</span>
    ${c.revoked ? '' : `<button type="button" class="btn small danger" data-act="revoke" data-code="${esc(c.code)}" style="margin-left:auto;">Revoke</button>`}
  </div>`;
}

// ── Audit tab ───────────────────────────────────────────────────
function renderAudit(body) {
  const rows = (ov && ov.audit) || [];
  body.innerHTML = `<div class="panel">
    <div class="section-label" style="margin-top:0;">Recent admin actions</div>
    ${rows.length ? rows.map(a => `<div class="audit-row">
      <div><div class="audit-when">${esc(a.created_at ? new Date(a.created_at).toLocaleString() : '')}</div>
      <div class="audit-act">${esc(a.action)}</div></div>
      <div>${esc(a.actor || '—')}${a.target ? ' → ' + esc(a.target) : (a.target_email ? ' → ' + esc(a.target_email) : '')}
        ${a.detail ? `<span class="muted"> · ${esc(JSON.stringify(a.detail))}</span>` : ''}</div>
    </div>`).join('') : emptyBox('📜', 'No admin actions logged yet.')}
  </div>`;
}

// ── Schools tab (owner only) ────────────────────────────────────
function renderSchools(body) {
  body.innerHTML = `
    <div class="panel">
      <div class="section-label" style="margin-top:0;">Create a school</div>
      <div class="row">
        <div><label class="fld">School name</label><input id="newSchoolName" placeholder="e.g. Avanti House Secondary"/></div>
        <div><label class="fld">Contact email (optional)</label><input id="newSchoolEmail" type="email" placeholder="office@school.org"/></div>
        <button class="btn" id="createSchoolBtn">+ Create school</button>
      </div>
    </div>
    <div class="section-label">Your schools</div>
    ${(meta.schools || []).map(s => `<div class="panel" style="display:flex;align-items:center;gap:12px;">
      <strong>${esc(s.name)}</strong>
      <button class="btn small secondary" data-manage="${esc(s.id)}" style="margin-left:auto;">Manage teachers →</button>
    </div>`).join('') || emptyBox('🏫', 'No schools yet — create your first above.')}`;
  document.getElementById('createSchoolBtn').addEventListener('click', async () => {
    const name = document.getElementById('newSchoolName').value.trim();
    const email = document.getElementById('newSchoolEmail').value.trim() || null;
    if (!name) { toast('Enter a school name'); return; }
    try {
      const { error } = await adClient.rpc('create_school', { p_name: name, p_contact_email: email });
      if (error) throw error;
      toast('School created');
      const { data } = await adClient.rpc('am_i_admin');
      meta = data || meta; wireSchoolSwitch(); renderShell();
    } catch (e) { toast(e.message || 'Could not create school'); }
  });
  body.querySelectorAll('[data-manage]').forEach(b => b.addEventListener('click', () => {
    activeSchoolId = b.dataset.manage; topTab = 'teachers';
    const sel = document.getElementById('schoolSelect'); if (sel) sel.value = activeSchoolId;
    loadOverview();
  }));
}

// ── Server calls ────────────────────────────────────────────────
// RPC then reload the overview. Thin shell over the guarded functions.
async function rpc(fn, args, okMsg, failMsg) {
  try {
    const { error } = await adClient.rpc(fn, args);
    if (error) throw error;
    toast(okMsg);
    await loadOverview();
  } catch (e) {
    console.error(fn, e);
    toast(failMsg ? `${failMsg}${e.message ? ' — ' + e.message : ''}` : (e.message || 'Something went wrong'));
  }
}

// Netlify service-role function (account actions). Returns parsed JSON.
async function callFunction(name, body) {
  const { data: { session } } = await adClient.auth.getSession();
  const res = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session && session.access_token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
// Fire a Netlify action, toast, reload.
async function callAction(name, body, okMsg, failMsg) {
  try { await callFunction(name, body); toast(okMsg); await loadOverview(); }
  catch (e) { console.error(name, e); toast(failMsg ? `${failMsg}${e.message ? ' — ' + e.message : ''}` : (e.message || 'Something went wrong')); }
}

// ── Small helpers ───────────────────────────────────────────────
function panel(html) { return `<div class="panel">${html}</div>`; }
function emptyBox(emoji, text) { return `<div class="empty"><div class="empty-emoji">${emoji}</div><p class="muted">${esc(text)}</p></div>`; }
function genCode(schoolName) {
  const prefix = String(schoolName || 'SCH').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'SCH';
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `${prefix}-${rand}`;
}
let _toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

document.addEventListener('DOMContentLoaded', init);
