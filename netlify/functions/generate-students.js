const { getAdminClient, requireTeacher, requireOwnedClass, jsonResponse } = require('./_lib/adminClient');
const {
    generateUsername,
    generatePassword,
    sanitizeUsernamePrefix,
    buildSequentialUsername,
    escapeForLike,
    escapeForRegex,
    sanitizeFixedPassword,
} = require('./_lib/credentials');

const STUDENT_EMAIL_DOMAIN = 'students.local';
const MAX_BATCH = 60;
const CONCURRENCY = 8;
const MAX_USERNAME_ATTEMPTS = 5;

// Custom-prefix mode ("class code"): find the next free S<n><prefix> index by
// looking at usernames already using this exact prefix (across ALL classes —
// usernames must be globally unique, since each backs a real auth email), so
// generating more later with the same code continues the numbering instead
// of colliding with S1, S2… already handed out. A broad LIKE prefilter (ends
// with the prefix) keeps the query small; the anchored regex afterwards is
// what actually decides which rows count.
async function nextSequentialIndex(admin, prefix) {
    const pattern = 'S%' + escapeForLike(prefix);
    const { data, error } = await admin
        .from('profiles')
        .select('username')
        .eq('role', 'student')
        .like('username', pattern);
    if (error) throw new Error(error.message);

    const re = new RegExp('^S(\\d+)' + escapeForRegex(prefix) + '$');
    let max = 0;
    (data || []).forEach((row) => {
        const m = re.exec(row.username);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return max + 1;
}

// () => string. Random mode re-rolls a fresh word+number every call (the
// existing behaviour); sequential mode hands out the next index from a
// shared, closed-over counter — safe under the concurrent workers below
// because JS is single-threaded, so `idx++` can't race between calls.
function makeUsernamePicker(prefix, startIndex) {
    if (!prefix) return () => generateUsername();
    let idx = startIndex;
    return () => buildSequentialUsername(prefix, idx++);
}

async function createOneStudent(admin, classId, nextUsername, nextPassword) {
    let lastError;
    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
        const username = nextUsername();
        const password = nextPassword();
        const email = `${username}@${STUDENT_EMAIL_DOMAIN}`;

        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { username },
        });

        if (error) {
            lastError = error;
            if (/already registered|already exists/i.test(error.message || '')) continue; // retry with the next username (fresh random roll, or the next sequential index)
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

async function createStudentsBatch(admin, classId, count, nextUsername, nextPassword) {
    const results = new Array(count);
    let next = 0;
    async function worker() {
        while (next < count) {
            const idx = next++;
            results[idx] = await createOneStudent(admin, classId, nextUsername, nextPassword);
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

        // Optional "class code" mode: S1<prefix>, S2<prefix>, … instead of
        // random word usernames. sanitizeUsernamePrefix throws (400) on an
        // unsafe/empty-after-trim prefix; null means "use random usernames".
        const prefix = sanitizeUsernamePrefix(body.prefix);
        const startIndex = prefix ? await nextSequentialIndex(admin, prefix) : null;
        const nextUsername = makeUsernamePicker(prefix, startIndex);

        // Optional shared-password mode: every student in this batch gets the
        // SAME password instead of a random one each. sanitizeFixedPassword
        // throws (400) on a too-short/too-long password; null means "random".
        // Either way, the student can change it themselves once signed in
        // (manage-account.html's Password tab) — this is only ever a starting
        // point.
        const fixedPassword = sanitizeFixedPassword(body.password);
        const nextPassword = fixedPassword ? () => fixedPassword : generatePassword;

        const results = await createStudentsBatch(admin, classId, count, nextUsername, nextPassword);
        const students = results.filter(r => r.ok).map(({ username, password }) => ({ username, password }));
        const failures = results.filter(r => !r.ok).map(r => r.error);

        return jsonResponse(200, {
            students, failed: failures.length, errors: failures,
            prefix, startIndex,
            passwordMode: fixedPassword ? 'fixed' : 'random',
        });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
