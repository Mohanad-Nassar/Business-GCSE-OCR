// TEMPORARY diagnostic endpoint. Reports only whether the required
// environment variables are visible to the function at runtime — it
// never returns their values, so it is safe to leave in briefly, but
// delete it once setup is confirmed working.
//
// Visit:  https://YOUR-SITE.netlify.app/.netlify/functions/env-check
exports.handler = async () => {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const geminiKey = process.env.MARKING_GEMINI_API_KEY || '';
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            SUPABASE_URL_present: url.length > 0,
            SUPABASE_URL_startsWithHttps: url.startsWith('https://'),
            SUPABASE_URL_endsWithSlash: url.endsWith('/'),
            SUPABASE_URL_length: url.length,
            SUPABASE_SERVICE_ROLE_KEY_present: key.length > 0,
            SUPABASE_SERVICE_ROLE_KEY_length: key.length,
            MARKING_GEMINI_API_KEY_present: geminiKey.length > 0,
            MARKING_GEMINI_API_KEY_length: geminiKey.length,
            // Names of ALL env vars that start with SUPABASE/GEMINI (helps spot
            // typos like SUPABASE_SERVICE_KEY). Names only — no values.
            supabase_var_names_seen: Object.keys(process.env).filter(n => n.startsWith('SUPABASE')),
            gemini_var_names_seen: Object.keys(process.env).filter(n => n.startsWith('GEMINI') || n.startsWith('MARKING_GEMINI')),
        }, null, 2),
    };
};
