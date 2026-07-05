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

module.exports = { generateUsername, generatePassword };
