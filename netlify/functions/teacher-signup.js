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
        // Subjects-V2 S3: an external-share invite lets a collaborator sign up
        // WITHOUT a school code — they become an unaffiliated teacher plus the
        // one shared subject. The token is bound to this email (peek re-checks).
        const externalToken = (body.external_share_token || '').trim();

        if (!email || !password) {
            return jsonResponse(400, { error: 'email and password are required' });
        }
        if (!inviteCode && !externalToken) {
            return jsonResponse(400, { error: 'An invite code or invite link is required' });
        }
        if (password.length < 8) {
            return jsonResponse(400, { error: 'Password must be at least 8 characters' });
        }

        // Validate the external-share token up front — reject a bad/expired/used
        // link before creating any account (no create-then-delete churn).
        if (externalToken) {
            const { data: peek, error: peekErr } = await admin.rpc(
                'peek_external_share_invite', { p_token: externalToken, p_email: email });
            if (peekErr) {
                console.error('peek_external_share_invite error:', peekErr.message);
                return jsonResponse(500, { error: 'Could not verify the invite link' });
            }
            if (!peek || !peek.ok) {
                const reasons = {
                    invalid: 'This invite link is not valid.',
                    used: 'This invite link has already been used.',
                    expired: 'This invite link has expired.',
                    not_approved: 'This invite is no longer available.',
                    email_mismatch: 'Please sign up with the email address this invite was sent to.',
                };
                return jsonResponse(403, { error: reasons[peek && peek.reason] || 'This invite link cannot be used.' });
            }
        }

        // Two invite systems, checked in order:
        //   1. Per-school codes (schools.sql) — consume_school_invite() atomically
        //      validates + counts one use and returns the school it belongs to.
        //   2. Legacy shared code (teacher_invite_codes) — kept as a fallback so
        //      signup keeps working before schools.sql is run and for any code not
        //      yet migrated. A school code, when present, always wins.
        // schoolId stays null on the legacy path (teacher is unaffiliated until an
        // owner/admin attaches them).
        let schoolId = null;
        if (!externalToken) try {
            const { data: sid, error: consumeErr } = await admin.rpc('consume_school_invite', { p_code: inviteCode });
            if (consumeErr) {
                // Most likely schools.sql hasn't been run yet (function absent) —
                // fall through to the legacy check rather than failing the signup.
                console.warn('consume_school_invite unavailable, using legacy code:', consumeErr.message);
            } else if (sid) {
                schoolId = sid;
            }
        } catch (e) {
            console.warn('consume_school_invite threw, using legacy code:', e.message);
        }

        if (!schoolId && !externalToken) {
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
        }

        // Hand a consumed school-code use back if anything below fails, so a real
        // retry (e.g. after a duplicate-email error) isn't blocked.
        const releaseCode = async () => {
            if (schoolId) await admin.rpc('release_school_invite', { p_code: inviteCode }).catch(() => {});
        };

        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (createError) {
            await releaseCode();
            console.error('teacher-signup createUser error:', JSON.stringify(createError, Object.getOwnPropertyNames(createError)));
            const isDuplicate = /already registered|already exists/i.test(createError.message || '');
            return jsonResponse(isDuplicate ? 409 : 500, { error: createError.message });
        }

        // UPSERT, not INSERT: since WP-A1 (2026-07-11) the on_auth_user_created
        // trigger (handle_new_user) already inserts a profiles row for every new
        // auth user with a real email, defaulting it to role='student'. A plain
        // insert here therefore collides on the primary key and every teacher
        // signup fails. Upserting updates that trigger-created row to the teacher
        // role instead. The service-role key has a null auth.uid(), so the
        // profiles privilege-guard trigger exempts this role change (and the
        // school_id it pins).
        //
        // school_id is added ONLY on the school path (which can only happen once
        // schools.sql has been run and added the column). On the legacy path the
        // key is omitted entirely, so this keeps working before schools.sql — the
        // upsert must never name a column that doesn't exist yet.
        const profileRow = { id: created.user.id, role: 'teacher', account_type: 'teacher' };
        if (schoolId) profileRow.school_id = schoolId;
        const { error: profileError } = await admin
            .from('profiles')
            .upsert(profileRow, { onConflict: 'id' });
        if (profileError) {
            // Roll back the auth user so a failed signup doesn't leave an orphan.
            await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
            await releaseCode();
            throw profileError;
        }

        // Record the school membership (the source of truth for role within a
        // school). Best-effort: a missing table (schools.sql not run) or a race
        // shouldn't fail an otherwise-good signup — the profile is already set.
        if (schoolId) {
            const { error: memberErr } = await admin
                .from('school_members')
                .upsert({ school_id: schoolId, profile_id: created.user.id, role: 'teacher' }, { onConflict: 'school_id,profile_id' });
            if (memberErr) console.error('school_members insert error (non-fatal):', memberErr.message);
        }

        // External-share invite (S3): attach the shared subject to the new
        // collaborator account, single-using the token. Roll back on failure so
        // a half-provisioned account can't linger.
        if (externalToken) {
            const { data: consumed, error: consErr } = await admin.rpc(
                'consume_external_share_invite',
                { p_token: externalToken, p_new_profile: created.user.id, p_email: email });
            if (consErr || !consumed || !consumed.ok) {
                await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
                console.error('consume_external_share_invite failed:', consErr ? consErr.message : (consumed && consumed.reason));
                return jsonResponse(403, { error: 'This invite link could not be completed — it may have just expired or been used.' });
            }
        }

        return jsonResponse(200, { ok: true, school_id: schoolId });
    } catch (err) {
        // TEMPORARY: full error logged to the function log to diagnose the
        // "Invalid path" issue. Remove once the root cause is confirmed.
        console.error('teacher-signup error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
