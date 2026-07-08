const crypto = require('crypto');

// Deliberately no real words that could look like slurs or brand names —
// short, neutral, easy for a student to read aloud and type correctly.
const USERNAME_WORDS = [
    'otter', 'falcon', 'maple', 'comet', 'cedar', 'ember', 'harbor', 'lumen',
    'quartz', 'willow', 'ridge', 'delta', 'pixel', 'coral', 'amber', 'birch',
    'canyon', 'drift', 'ferry', 'glade', 'haven', 'ivory', 'jasper', 'kite',
    'lagoon', 'meadow', 'nectar', 'onyx', 'plaza', 'quill', 'raven', 'summit',
    'terra', 'umber', 'vista', 'wren', 'yonder', 'zephyr', 'alder', 'breeze',
];

// Avoid ambiguous characters (0/O, 1/l/I) so passwords are easy to copy correctly.
const PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomInt(maxExclusive) {
    return crypto.randomInt(maxExclusive);
}

function generateUsername() {
    const word = USERNAME_WORDS[randomInt(USERNAME_WORDS.length)];
    const num = 100 + randomInt(900); // 3-digit suffix
    return `${word}${num}`;
}

function generatePassword(length = 10) {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
    }
    return out;
}

// ── Custom-prefix ("class code") usernames ──
// A teacher can opt into S1<prefix>, S2<prefix>, S3<prefix>… instead of the
// random word usernames above (e.g. prefix "Y10K.2026" -> S1Y10K.2026,
// S2Y10K.2026, …). The prefix becomes part of an email local-part
// (username@students.local), so it's restricted to the same safe charset a
// random username already uses implicitly.
const USERNAME_PREFIX_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;

function sanitizeUsernamePrefix(raw) {
    if (raw == null) return null;
    const prefix = String(raw).trim();
    if (!prefix) return null;
    if (!USERNAME_PREFIX_RE.test(prefix)) {
        const err = new Error(
            'Custom start must begin with a letter or number, use only letters, numbers, dots, hyphens or underscores, and be 40 characters or fewer.'
        );
        err.statusCode = 400;
        throw err;
    }
    return prefix;
}

function buildSequentialUsername(prefix, index) {
    return `S${index}${prefix}`;
}

// Escapes a literal string for safe use inside a Postgres LIKE pattern
// (backslash is the default LIKE escape character).
function escapeForLike(str) {
    return str.replace(/[\\%_]/g, (m) => '\\' + m);
}

// Escapes a literal string for safe use inside a JS RegExp.
function escapeForRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Shared ("fixed") password mode ──
// A teacher can give every student in a batch the SAME initial password
// instead of a random one per student (handy for younger classes who all
// log in together the first time) — see manage-account.html's Password tab
// for the other half of this: any student can change theirs after signing
// in, so a shared password is only ever a starting point, never permanent.
// Same 8-character floor as that page's client-side check, kept here too
// since this is a different entry point (bulk creation, not self-service
// change) and must not trust the browser alone.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // matches Supabase Auth's password length cap

function sanitizeFixedPassword(raw) {
    if (raw == null) return null;
    const password = String(raw);
    if (!password) return null; // empty/not provided -> caller falls back to random
    if (password.length < MIN_PASSWORD_LENGTH) {
        const err = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        err.statusCode = 400;
        throw err;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        const err = new Error(`Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);
        err.statusCode = 400;
        throw err;
    }
    return password;
}

module.exports = {
    generateUsername,
    generatePassword,
    sanitizeUsernamePrefix,
    buildSequentialUsername,
    escapeForLike,
    escapeForRegex,
    sanitizeFixedPassword,
};
