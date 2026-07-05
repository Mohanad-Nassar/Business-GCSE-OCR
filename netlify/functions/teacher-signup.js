const { getAdminClient, jsonResponse } = require('./_lib/adminClient');

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
        const body = JSON.parse(event.body || '{}');
        const email = (body.email || '').trim();
        const password = body.password || '';
        const inviteCode = (body.invite_code || '').trim();

        if (!email || !password || !inviteCode) {
            return jsonResponse(400, { error: 'email, password and invite_code are all required' });
        }
        if (password.length < 8) {
            return jsonResponse(400, { error: 'Password must be at least 8 characters' });
        }

        const { data: code, error: codeError } = await admin
            .from('teacher_invite_codes')
            .select('code')
            .eq('code', inviteCode)
            .maybeSingle();
        if (codeError) {
            console.error('teacher-signup invite code lookup error:', JSON.stringify(codeError, Object.getOwnPropertyNames(codeError)));
            throw codeError;
        }
        if (!code) {
            return jsonResponse(403, { error: 'Invalid invite code' });
        }

        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (createError) {
            console.error('teacher-signup createUser error:', JSON.stringify(createError, Object.getOwnPropertyNames(createError)));
            const isDuplicate = /already registered|already exists/i.test(createError.message || '');
            return jsonResponse(isDuplicate ? 409 : 500, { error: createError.message });
        }

        const { error: profileError } = await admin
            .from('profiles')
            .insert({ id: created.user.id, role: 'teacher' });
        if (profileError) {
            // Roll back the auth user so a failed signup doesn't leave an orphaned account.
            await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
            throw profileError;
        }

        return jsonResponse(200, { ok: true });
    } catch (err) {
        // TEMPORARY: full error logged to the function log to diagnose the
        // "Invalid path" issue. Remove once the root cause is confirmed.
        console.error('teacher-signup error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
