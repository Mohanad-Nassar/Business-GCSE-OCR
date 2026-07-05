const { getAdminClient, requireTeacher, requireOwnedClass, jsonResponse } = require('./_lib/adminClient');
const { generateUsername, generatePassword } = require('./_lib/credentials');

const STUDENT_EMAIL_DOMAIN = 'students.local';
const MAX_BATCH = 60;
const CONCURRENCY = 8;
const MAX_USERNAME_ATTEMPTS = 5;

async function createOneStudent(admin, classId) {
    let lastError;
    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
        const username = generateUsername();
        const password = generatePassword();
        const email = `${username}@${STUDENT_EMAIL_DOMAIN}`;

        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { username },
        });

        if (error) {
            lastError = error;
            if (/already registered|already exists/i.test(error.message || '')) continue; // retry with a new random username
            return { ok: false, error: error.message };
        }

        const { error: profileError } = await admin
            .from('profiles')
            .insert({ id: data.user.id, role: 'student', username });
        if (profileError) {
            await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
            return { ok: false, error: profileError.message };
        }

        const { error: memberError } = await admin
            .from('class_students')
            .insert({ class_id: classId, student_id: data.user.id });
        if (memberError) {
            await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
            return { ok: false, error: memberError.message };
        }

        return { ok: true, username, password };
    }
    return { ok: false, error: (lastError && lastError.message) || 'Could not generate a unique username' };
}

async function createStudentsBatch(admin, classId, count) {
    const results = new Array(count);
    let next = 0;
    async function worker() {
        while (next < count) {
            const idx = next++;
            results[idx] = await createOneStudent(admin, classId);
        }
    }
    const workers = Array.from({ length: Math.min(CONCURRENCY, count) }, worker);
    await Promise.all(workers);
    return results;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    let admin;
    try {
        admin = getAdminClient();
    } catch (err) {
        return jsonResponse(500, { error: err.message });
    }

    try {
        const teacher = await requireTeacher(event, admin);
        const body = JSON.parse(event.body || '{}');
        const classId = body.class_id;
        const count = Number(body.count);

        if (!classId || !Number.isInteger(count) || count < 1 || count > MAX_BATCH) {
            return jsonResponse(400, { error: `count must be a whole number between 1 and ${MAX_BATCH}` });
        }
        await requireOwnedClass(admin, teacher.id, classId);

        const results = await createStudentsBatch(admin, classId, count);
        const students = results.filter(r => r.ok).map(({ username, password }) => ({ username, password }));
        const failures = results.filter(r => !r.ok).map(r => r.error);

        return jsonResponse(200, { students, failed: failures.length, errors: failures });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
