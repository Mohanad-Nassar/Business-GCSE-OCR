// ══════════════════════════════════════════════════════════════
// SEED DEMO CLASS (WP-C6 / G10) — one click gives a new teacher a
// populated class to explore: a class + a few demo students + some
// pre-filled progress, so the dashboard/analytics aren't a wall of
// zeros on day one.
//
// Auth: same as every service-key function — requireTeacher() verifies
// the caller's JWT + teacher role before anything privileged runs.
// Idempotent: if this teacher already has a demo class, it's returned
// as-is (no second pile of demo accounts). Everything it creates is
// clearly labelled and deletable like any other class/student.
// ══════════════════════════════════════════════════════════════

const { getAdminClient, requireTeacher, jsonResponse } = require('./_lib/adminClient');

const STUDENT_EMAIL_DOMAIN = 'students.local';
const DEMO_CLASS_NAME = '✨ Demo Class (safe to delete)';
const DEMO_PASSWORD = 'demo-explore-1'; // shared so the teacher can log in AS a demo student to see the student view

// Four demo students with a spread of progress so the class looks real:
// one racing ahead, a couple mid-way, one just starting. Page ids + totals
// are self-consistent (the dashboard reads the stored done/total), so they
// render sensible bars regardless of the live content.
const DEMO_STUDENTS = [
    { first: 'Alex',  correct: 142, mastered: 38, progress: [
        ['business:1-1-role-of-business-enterprise', 'learn', 4, 4],
        ['business:1-1-role-of-business-enterprise', 'mcq', 10, 10],
        ['business:1-1-role-of-business-enterprise', 'tf', 8, 8],
        ['business:1-2-business-planning', 'learn', 3, 3],
        ['business:1-2-business-planning', 'mcq', 9, 10],
    ] },
    { first: 'Priya', correct: 96, mastered: 21, progress: [
        ['business:1-1-role-of-business-enterprise', 'learn', 4, 4],
        ['business:1-1-role-of-business-enterprise', 'mcq', 7, 10],
        ['business:1-2-business-planning', 'learn', 2, 3],
    ] },
    { first: 'Sam',   correct: 54, mastered: 9, progress: [
        ['business:1-1-role-of-business-enterprise', 'learn', 3, 4],
        ['business:1-1-role-of-business-enterprise', 'mcq', 4, 10],
    ] },
    { first: 'Mia',   correct: 12, mastered: 1, progress: [
        ['business:1-1-role-of-business-enterprise', 'learn', 1, 4],
    ] },
];

function rand4() { return Math.random().toString(36).slice(2, 6); }

async function createDemoStudent(admin, classId, first) {
    const username = `demo-${first.toLowerCase()}-${rand4()}`;
    const email = `${username}@${STUDENT_EMAIL_DOMAIN}`;
    const { data, error } = await admin.auth.admin.createUser({
        email, password: DEMO_PASSWORD, email_confirm: true,
        user_metadata: { username },
    });
    if (error) return { ok: false, error: error.message };
    const uid = data.user.id;

    const { error: pErr } = await admin.from('profiles')
        .insert({ id: uid, role: 'student', username, account_type: 'class_student' });
    if (pErr) { await admin.auth.admin.deleteUser(uid).catch(() => {}); return { ok: false, error: pErr.message }; }

    const { error: mErr } = await admin.from('class_students')
        .insert({ class_id: classId, student_id: uid });
    if (mErr) { await admin.auth.admin.deleteUser(uid).catch(() => {}); return { ok: false, error: mErr.message }; }

    return { ok: true, id: uid, username };
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    let admin;
    try { admin = getAdminClient(); }
    catch (err) { return jsonResponse(500, { error: err.message }); }

    try {
        const teacher = await requireTeacher(event, admin);

        // Idempotent: don't stack demo classes / accounts.
        const { data: existing } = await admin.from('classes')
            .select('id').eq('teacher_id', teacher.id).eq('name', DEMO_CLASS_NAME).limit(1);
        if (existing && existing.length) {
            return jsonResponse(200, { ok: true, alreadyExists: true, class_id: existing[0].id });
        }

        // Create the class (subject_id defaults to business via default_subject_id()).
        const { data: cls, error: clsErr } = await admin.from('classes')
            .insert({ name: DEMO_CLASS_NAME, teacher_id: teacher.id })
            .select('id').single();
        if (clsErr) return jsonResponse(500, { error: 'Could not create demo class: ' + clsErr.message });
        const classId = cls.id;

        // Students (sequential — only four; keeps failures easy to unwind).
        const created = [];
        for (const s of DEMO_STUDENTS) {
            const r = await createDemoStudent(admin, classId, s.first);
            if (r.ok) created.push({ ...r, spec: s });
        }

        // Progress + daily-revise stats so the dashboard shows life.
        const progressRows = [];
        const statRows = [];
        for (const c of created) {
            for (const [page_id, section, done, total] of c.spec.progress) {
                progressRows.push({ student_id: c.id, page_id, section, done, total });
            }
            statRows.push({
                student_id: c.id, subject_slug: 'business',
                total_correct: c.spec.correct, total_mastered: c.spec.mastered,
            });
        }
        if (progressRows.length) {
            await admin.from('progress_summary').upsert(progressRows,
                { onConflict: 'student_id,page_id,section' }).then(() => {}, () => {});
        }
        if (statRows.length) {
            await admin.from('daily_revise_stats').upsert(statRows,
                { onConflict: 'student_id,subject_slug' }).then(() => {}, () => {});
        }

        return jsonResponse(200, {
            ok: true, class_id: classId,
            students: created.map(c => ({ username: c.username })),
            password: DEMO_PASSWORD,
            created: created.length,
        });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
