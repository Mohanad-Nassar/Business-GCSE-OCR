// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Python Lab (T1 pyRunner, CS-CONTENT-PLAN.md §7.1)
//
// Registers tool id 'py-runner'. Real CPython via a Pyodide Web Worker
// (cs-lab/pyworker.js), created lazily on first Run.
//
// Two things define this rebuild (2026-07-13):
//  1. LIVE console input. Student code that calls input() pauses and lets
//     the student type into the console right there, then continues — no
//     more pre-supplying every answer up front. Implemented with a
//     SharedArrayBuffer the worker blocks on (see pyworker.js). If the page
//     isn't cross-origin isolated, we fall back to a pre-supplied inputs
//     box.
//  2. PRIMM structure. Each activity runs through Predict → Run →
//     Investigate → Modify → Make (Sofia Sentance's PRIMM approach): read
//     and predict code before writing it, so novices aren't staring at a
//     blank editor. Activities may use a subset of phases; "Challenge" and
//     "Story Sandbox" activities are just activities with fewer phases.
//
// Pure helpers (no DOM) live at the top and are exported for node unit
// testing via module.exports when not in a browser.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var RUN_TIMEOUT_MS = 15000;      // wall-clock cap on a single run (paused while awaiting input)
  var AUTOSAVE_DEBOUNCE_MS = 800;

  // ── Pure helpers (unit-tested with node) ──────────────────────────
  function normStdout(s) {
    return String(s == null ? '' : s).replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  }
  function checkStdout(actual, expect) { return normStdout(actual) === normStdout(expect); }
  function checkFile(files, file, expect) {
    var got = files && Object.prototype.hasOwnProperty.call(files, file) ? files[file] : null;
    if (got == null) return false;
    return normStdout(got) === normStdout(expect);
  }
  // result = { stdout, files }; returns true/false, or null when there's no check.
  function runCheck(check, result) {
    if (!check) return null;
    if (check.type === 'stdout') return checkStdout(result.stdout, check.expect);
    if (check.type === 'file') return checkFile(result.files, check.file, check.expect);
    if (check.type === 'stdout+file') {
      return checkStdout(result.stdout, check.expect) && checkFile(result.files, check.file, check.fileExpect);
    }
    return null;
  }
  // Files are path-addressed ("data/names.txt") with optional binary content
  // (base64, e.g. uploaded images). Wire format to/from the worker:
  //   { "<path>": { t:'text'|'b64', c: <string> } }
  function filesArrayToObject(arr) {
    var out = {};
    (arr || []).forEach(function (f) {
      out[f.name] = { t: f.binary ? 'b64' : 'text', c: f.content };
    });
    return out;
  }
  function filesObjectToArray(existingArr, filesObj) {
    var order = (existingArr || []).map(function (f) { return f.name; });
    var names = Object.keys(filesObj || {});
    names.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a < b ? -1 : (a > b ? 1 : 0);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return names.map(function (n) {
      var e = filesObj[n];
      // tolerate plain-string entries (old snapshots) as text
      if (e == null || typeof e === 'string') return { name: n, content: String(e == null ? '' : e), binary: false };
      return { name: n, content: e.c, binary: e.t === 'b64' };
    });
  }
  // Plain { path: text } map of just the text files — what auto-checks read.
  function textFileMap(filesObj) {
    var out = {};
    Object.keys(filesObj || {}).forEach(function (n) {
      var e = filesObj[n];
      if (typeof e === 'string') out[n] = e;
      else if (e && e.t === 'text') out[n] = e.c;
    });
    return out;
  }
  // One path segment (file or folder name) — no slashes here; paths are
  // built by joining validated segments with '/'.
  function validateSegment(name, siblings) {
    var trimmed = (name || '').trim();
    if (!trimmed) return 'Give it a name.';
    if (/[\/\\]/.test(trimmed)) return 'Names cannot contain / or \\ — create folders with “New folder”.';
    if (trimmed === '.' || trimmed === '..') return 'That name is not allowed.';
    if (trimmed.length > 64) return 'Names must be 64 characters or fewer.';
    if (siblings && siblings.indexOf(trimmed) !== -1) return 'Something with that name already exists here.';
    return null;
  }
  // kept for backwards compatibility with older callers/tests
  function validateFileName(name, existingNames) { return validateSegment(name, existingNames); }
  function parentOf(path) {
    var i = path.lastIndexOf('/');
    return i === -1 ? '' : path.slice(0, i);
  }
  function baseName(path) {
    var i = path.lastIndexOf('/');
    return i === -1 ? path : path.slice(i + 1);
  }
  function joinPath(dir, name) { return dir ? dir + '/' + name : name; }
  function extOf(name) {
    var b = baseName(name);
    var i = b.lastIndexOf('.');
    return i === -1 ? '' : b.slice(i + 1).toLowerCase();
  }
  var IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];
  var TEXT_EXTS = ['txt', 'py', 'csv', 'md', 'json', 'html', 'css', 'js', 'svg', 'xml', 'tsv', 'log', 'dat'];
  function isImagePath(name) { return IMAGE_EXTS.indexOf(extOf(name)) !== -1; }
  function isTextExt(name) { return TEXT_EXTS.indexOf(extOf(name)) !== -1; }
  function editorModeFor(name) { return extOf(name) === 'py' ? 'python' : 'text'; }
  function imageMime(name) {
    var e = extOf(name);
    return e === 'jpg' ? 'image/jpeg' : 'image/' + e;
  }
  // Nested tree { dirs: { name: subtree }, files: [names] } from path-based
  // files + explicit folder paths (so empty folders render too).
  function buildTree(fileArr, folders) {
    var rootNode = { dirs: {}, files: [] };
    function dirNode(path) {
      if (!path) return rootNode;
      var node = rootNode;
      path.split('/').forEach(function (seg) {
        if (!node.dirs[seg]) node.dirs[seg] = { dirs: {}, files: [] };
        node = node.dirs[seg];
      });
      return node;
    }
    (folders || []).forEach(function (d) { dirNode(d); });
    (fileArr || []).forEach(function (f) {
      dirNode(parentOf(f.name)).files.push(baseName(f.name));
    });
    function sortNode(n) {
      n.files.sort();
      Object.keys(n.dirs).forEach(function (k) { sortNode(n.dirs[k]); });
    }
    sortNode(rootNode);
    return rootNode;
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, cx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(cx, args); }, ms);
    };
  }
  // ── Minimal ZIP writer (method 0 "stored", UTF-8 names) ──────────
  // Self-contained so "Download project" needs no CDN library (the lab's
  // no-network rule); student projects are tiny, so skipping compression
  // costs nothing. Understood by File Explorer, macOS and every unzip tool.
  var _crcTable = null;
  function crc32(u8) {
    if (!_crcTable) {
      _crcTable = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        _crcTable[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = _crcTable[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  // entries: [{ path, data: Uint8Array }] — a path ending in '/' is a folder
  // entry (keeps empty folders in the archive). Returns the zip bytes as an
  // array of Uint8Array chunks ready for `new Blob(chunks)`.
  function buildZipChunks(entries) {
    var enc = new TextEncoder();
    var chunks = [], central = [], offset = 0;
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    entries.forEach(function (e) {
      var nameU8 = enc.encode(e.path);
      var data = e.data || new Uint8Array(0);
      var crc = crc32(data);
      var local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);  // local file header signature
      local.setUint16(4, 20, true);          // version needed
      local.setUint16(6, 0x0800, true);      // flags: UTF-8 file names
      local.setUint16(8, 0, true);           // method: stored
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, nameU8.length, true);
      local.setUint16(28, 0, true);          // extra length
      chunks.push(new Uint8Array(local.buffer), nameU8, data);
      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);    // central directory signature
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true);
      cen.setUint16(12, dosTime, true);
      cen.setUint16(14, dosDate, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, data.length, true);
      cen.setUint32(24, data.length, true);
      cen.setUint16(28, nameU8.length, true);
      // 30 extra / 32 comment / 34 disk / 36 internal attrs — all zero
      cen.setUint32(38, /\/$/.test(e.path) ? 0x10 : 0, true); // DOS dir bit
      cen.setUint32(42, offset, true);       // local header offset
      central.push(new Uint8Array(cen.buffer), nameU8);
      offset += 30 + nameU8.length + data.length;
    });
    var cdSize = 0;
    central.forEach(function (c) { cdSize += c.length; });
    var eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);     // end-of-central-directory
    eocd.setUint16(8, entries.length, true);
    eocd.setUint16(10, entries.length, true);
    eocd.setUint32(12, cdSize, true);
    eocd.setUint32(16, offset, true);
    central.push(new Uint8Array(eocd.buffer));
    return chunks.concat(central);
  }
  // Which PRIMM phases an activity actually has, in canonical order.
  function phasesFor(activity) {
    if (activity.sandbox) return ['sandbox'];
    var out = [];
    if (activity.predict) { out.push('predict'); out.push('run'); }
    if (activity.investigate) out.push('investigate');
    if (activity.modify) out.push('modify');
    if (activity.make) out.push('make');
    return out;
  }
  // Starting code for a phase (editable phases seed the editor from here).
  function codeForPhase(activity, phase) {
    if (phase === 'sandbox') return activity.starter || '';
    if (phase === 'predict' || phase === 'run') return activity.predict ? activity.predict.code : '';
    if (phase === 'investigate') return (activity.investigate && activity.investigate.code) || (activity.predict && activity.predict.code) || '';
    if (phase === 'modify') return (activity.modify && activity.modify.code) || (activity.predict && activity.predict.code) || '';
    if (phase === 'make') return (activity.make && activity.make.starter) || '';
    return '';
  }
  function checkForPhase(activity, phase) {
    if (phase === 'modify') return activity.modify && activity.modify.check;
    if (phase === 'make') return activity.make && activity.make.check;
    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // CONTENT — PRIMM activities per page. Every string of HTML here is
  // authored by us (safe to set via innerHTML). Phase pieces:
  //   predict:     { code, ask (HTML question), sample (HTML model answer) }
  //   investigate: { intro (HTML), prompts:[HTML,…], code? }
  //   modify:      { goal (HTML), code?, check }
  //   make:        { brief (HTML), criteria:[HTML,…], starter, check }
  // A "Challenge" is an activity with only `make`. A "Story Sandbox" sets
  // `sandbox:true` + `starter` and has no checks.
  // ══════════════════════════════════════════════════════════════

  var STORY_SANDBOX = {
    id: 'story-sandbox',
    title: '📖 Story Sandbox',
    sandbox: true,
    intro: '<p>A free space to play — and the console asks <em>you</em> for input as the ' +
      'program runs. Run it, then type your answers in the console one at a time. ' +
      'Change the questions and the story to make it your own.</p>',
    starter:
      '# STORY MAKER — this program asks YOU questions while it runs.\n' +
      '# Press Run, then type each answer in the console and press Enter.\n\n' +
      'name = input("Type a name: ")\n' +
      'animal = input("Type an animal: ")\n' +
      'place = input("Type a place: ")\n' +
      'number = input("Type a number: ")\n\n' +
      'print()\n' +
      'print("One day, " + name + " found " + number + " talking " + animal + "s")\n' +
      'print("living in " + place + ".")\n' +
      'print(name + " was never bored again!")\n',
  };

  var ACTIVITIES = {

    '2-1-2-designing-creating-and-refining-algorithms': [
      {
        id: 'average-primm',
        title: 'Average score (PRIMM)',
        predict: {
          code: 'scores = [56, 78, 45, 90, 61]\n\ntotal = 0\nfor s in scores:\n    total = total + s\n\nprint("Total:", total)\n',
          ask: '<p>Read this program carefully. <strong>Before you run it</strong>, predict:</p>' +
            '<ul><li>How many lines will it print?</li><li>What exactly will the output be?</li></ul>',
          sample: '<p>It prints <strong>one</strong> line: <code>Total: 330</code> ' +
            '(56 + 78 + 45 + 90 + 61 = 330). The loop adds each score to <code>total</code>; ' +
            'the <code>print</code> is outside the loop, so it runs once at the end.</p>',
        },
        investigate: {
          intro: '<p>Now dig into how it works. Run it after each change and watch what happens:</p>',
          prompts: [
            'Add <code>print(total)</code> <em>inside</em> the loop (indented). How many lines print now, and why?',
            'What happens if you start with <code>total = 100</code> instead of <code>0</code>?',
            'Change the list to <code>[10, 20]</code>. Does the total update correctly?',
          ],
        },
        modify: {
          goal: '<p>Extend the program so it also prints the <strong>mean average</strong> ' +
            '(total ÷ how many scores there are) on a second line. Your output should be exactly:</p>' +
            '<pre>Total: 330\nAverage: 66.0</pre>' +
            '<p>Hint: <code>len(scores)</code> tells you how many scores there are.</p>',
          check: { type: 'stdout', expect: 'Total: 330\nAverage: 66.0' },
        },
        make: {
          brief: '<p>Now build one from scratch. Write a program that stores <strong>your own</strong> ' +
            'list of at least 4 numbers, then prints the largest number in the list, like ' +
            '<code>Largest: 90</code>.</p><p>Hint: <code>max(scores)</code> finds the biggest value.</p>',
          criteria: ['Stores a list of 4 or more numbers', 'Prints the largest, in the form <code>Largest: n</code>'],
          starter: '# Store your own list of numbers, then print the largest.\nscores = [56, 78, 45, 90, 61]\n\n',
          check: { type: 'stdout', expect: 'Largest: 90' },
        },
      },
      // Challenges (former tasks) kept as make-only activities
      {
        id: 'refine-validate-age',
        title: 'Challenge: validation loop',
        make: {
          brief: '<p>This program should keep asking for a whole-number age until it gets one ' +
            'between 0 and 120. Right now it only checks once. Change the <code>if</code> into a ' +
            '<code>while</code> loop so it re-asks whenever the number is out of range. Keep the ' +
            'prompt text exactly as written — type your answers in the console.</p>',
          criteria: ['Uses a <code>while</code> loop', 'Re-prints the message for each out-of-range value', 'Accepts the first valid age'],
          starter: 'age = int(input("Enter your age: "))\n\nif age < 0 or age > 120:\n    print("Please enter a whole number between 0 and 120.")\n\nprint("Age accepted:", age)\n',
          check: { type: 'stdout', expect: 'Please enter a whole number between 0 and 120.\nPlease enter a whole number between 0 and 120.\nAge accepted: 17' },
        },
      },
      {
        id: 'refine-fix-extend',
        title: 'Challenge: fix, then extend',
        make: {
          brief: '<p>This should add up all the <em>even</em> numbers from 1 to 20 inclusive. Run ' +
            'it — there is a bug, so it adds the odd numbers instead. Fix it, then extend it to also ' +
            'print how many even numbers were added as a second line: <code>Count: 10</code>.</p>',
          criteria: ['Adds even numbers (Total: 110)', 'Also prints <code>Count: 10</code>'],
          starter: 'total = 0\ncount = 0\n\nfor n in range(1, 20):\n    if n % 2 == 1:\n        total = total + n\n\nprint("Total:", total)\n',
          check: { type: 'stdout', expect: 'Total: 110\nCount: 10' },
        },
      },
    ],

    '2-2-1-programming-fundamentals': [
      {
        id: 'greeting-primm',
        title: 'Greeting & selection (PRIMM)',
        predict: {
          code: 'name = input("What is your name? ")\nage = int(input("How old are you? "))\n\nprint("Hello,", name)\nif age >= 11 and age <= 18:\n    print("You are of secondary-school age.")\n',
          ask: '<p>Predict what this program does. If someone types <code>Sam</code> and then ' +
            '<code>14</code>, what will it print? What if they type <code>25</code> as the age?</p>',
          sample: '<p>For <code>Sam</code> / <code>14</code> it prints <code>Hello, Sam</code> then ' +
            '<code>You are of secondary-school age.</code> For age <code>25</code>, the ' +
            '<code>if</code> condition is false, so only <code>Hello, Sam</code> prints.</p>',
        },
        investigate: {
          intro: '<p>Run it and experiment. Type your answers in the console each time:</p>',
          prompts: [
            'Try the age <code>11</code> and then <code>18</code> — are the boundaries included?',
            'Remove <code>int(...)</code> from the age line and run with age 14. What error appears, and why?',
            'What does <code>and</code> mean here? Try changing it to <code>or</code> and see what happens with age 25.',
          ],
        },
        modify: {
          goal: '<p>Add an <code>else</code> so that when the age is <em>not</em> 11–18 it prints ' +
            '<code>You are not of secondary-school age.</code> Test it with an age like 25 — the ' +
            'expected output for name <code>Sam</code>, age <code>25</code> is:</p>' +
            '<pre>Hello, Sam\nYou are not of secondary-school age.</pre>',
          check: { type: 'stdout', expect: 'Hello, Sam\nYou are not of secondary-school age.' },
        },
        make: {
          brief: '<p>Build a times-table program. Ask the user which times table they want, then use ' +
            'a <strong>count-controlled loop</strong> (a <code>for</code> loop) to print the 1–12 ' +
            'times table for that number, one row per line, like <code>1 x 7 = 7</code>.</p>',
          criteria: ['Asks which table with <code>input()</code>', 'Uses a <code>for</code> loop over 1–12', 'Each line reads <code>a x n = b</code>'],
          starter: 'number = int(input("Which times table would you like? "))\n\n# Use a for loop to print the table from 1 to 12, e.g.  1 x 7 = 7\n',
          check: { type: 'stdout', expect: [1,2,3,4,5,6,7,8,9,10,11,12].map(function (i) { return i + ' x 7 = ' + (i * 7); }).join('\n') },
        },
      },
      {
        id: 'seq-pattern',
        title: 'Challenge: print a pattern',
        make: {
          brief: '<p>Using three separate <code>print()</code> statements (one per line), output ' +
            'this pattern exactly:</p><pre>*\n**\n***</pre>',
          criteria: ['Exactly three lines', 'Uses three <code>print()</code> statements'],
          starter: '# Print the pattern below using three print statements:\n# *\n# **\n# ***\n\n',
          check: { type: 'stdout', expect: '*\n**\n***' },
        },
      },
      {
        id: 'ask-until-yes',
        title: 'Challenge: keep asking',
        make: {
          brief: '<p>Ask <code>Are you ready to start? (yes/no)</code> and keep asking (a ' +
            '<strong>condition-controlled loop</strong> — a <code>while</code> loop) until the answer ' +
            'is exactly <code>yes</code>. Then print <code>Let\'s begin!</code> Type your answers in ' +
            'the console.</p>',
          criteria: ['Uses a <code>while</code> loop', 'Stops only on exactly <code>yes</code>', 'Prints <code>Let\'s begin!</code>'],
          starter: 'answer = input("Are you ready to start? (yes/no) ")\n\n# Keep asking until the answer is exactly "yes", then print: Let\'s begin!\n',
          check: { type: 'stdout', expect: "Let's begin!" },
        },
      },
    ],

    '2-2-2-data-types': [
      {
        id: 'casting-primm',
        title: 'Casting & numbers (PRIMM)',
        predict: {
          code: 'a = input("Enter the first number: ")\nb = input("Enter the second number: ")\n\nprint("Joined:", a + b)\n',
          ask: '<p>If the user types <code>4</code> and then <code>5</code>, what does this print — ' +
            '<code>9</code> or <code>45</code>? Why?</p>',
          sample: '<p>It prints <code>Joined: 45</code>. <code>input()</code> always returns a ' +
            '<strong>string</strong>, and <code>+</code> on two strings joins them end to end ' +
            '("4" + "5" = "45") rather than adding them as numbers.</p>',
        },
        investigate: {
          intro: '<p>Run it, then investigate how data types change the result:</p>',
          prompts: [
            'Wrap both inputs in <code>int(...)</code>, e.g. <code>a = int(input(...))</code>. Now what does 4 and 5 give?',
            'With <code>int</code> casting, try typing <code>4.5</code>. What error appears? What does <code>float(...)</code> do instead?',
            'Try <code>7 / 2</code>, <code>7 // 2</code> and <code>7 % 2</code> in the editor. What is each one for?',
          ],
        },
        modify: {
          goal: '<p>Fix the program so it <strong>adds</strong> the two numbers instead of joining ' +
            'them, by casting each input to a whole number. For inputs 4 and 5 it should print:</p>' +
            '<pre>Total: 9</pre>',
          code: 'a = input("Enter the first number: ")\nb = input("Enter the second number: ")\n\ntotal = a + b\nprint("Total:", total)\n',
          check: { type: 'stdout', expect: 'Total: 9' },
        },
        make: {
          brief: '<p>A pizza has 20 slices, shared between 8 people. Print three lines: how many ' +
            '<strong>whole</strong> slices each person gets (use <code>//</code>), how many are ' +
            '<strong>left over</strong> (use <code>%</code>), and the <strong>exact</strong> average ' +
            'as a decimal (use <code>/</code>).</p>',
          criteria: ['<code>Each person gets: 2</code>', '<code>Leftover: 4</code>', '<code>Exact average: 2.5</code>'],
          starter: 'slices = 20\npeople = 8\n\n# Print three lines using //, % and / (see the brief).\n',
          check: { type: 'stdout', expect: 'Each person gets: 2\nLeftover: 4\nExact average: 2.5' },
        },
      },
      {
        id: 'concat-fix',
        title: 'Challenge: fix the crash',
        make: {
          brief: '<p>This should print a sentence including the score, but it crashes — you can\'t ' +
            'join text and a number with <code>+</code> directly. Fix it (e.g. with <code>str()</code>) ' +
            'so it prints:</p><pre>Your score is 87 out of 100</pre>',
          criteria: ['Runs without a TypeError', 'Prints the exact sentence'],
          starter: 'score = 87\n\nprint("Your score is " + score + " out of 100")\n',
          check: { type: 'stdout', expect: 'Your score is 87 out of 100' },
        },
      },
    ],

    '2-2-3-additional-programming-techniques': [
      {
        id: 'files-primm',
        title: 'Writing & reading files (PRIMM)',
        predict: {
          code: 'scores = [45, 78, 62]\n\nf = open("scores.txt", "w")\nfor s in scores:\n    f.write(str(s) + "\\n")\nf.close()\n\nprint("Done — check the Files panel!")\n',
          ask: '<p>Predict what this program does. What appears in the <strong>Files panel</strong> ' +
            'after it runs, and what will be inside it?</p>',
          sample: '<p>It creates a file <code>scores.txt</code> containing three lines — <code>45</code>, ' +
            '<code>78</code>, <code>62</code> — and prints <code>Done — check the Files panel!</code> ' +
            'Opening with <code>"w"</code> means "write"; <code>str(s)</code> turns each number into ' +
            'text and <code>"\\n"</code> starts a new line.</p>',
        },
        investigate: {
          intro: '<p>Run it, then open <code>scores.txt</code> in the Files panel to see the result. Investigate:</p>',
          prompts: [
            'Remove the <code>+ "\\n"</code>. Run again and re-open the file — what happened to the layout?',
            'Run it a second time. Does the file grow, or start fresh? (<code>"w"</code> overwrites.)',
            'Change <code>"w"</code> to <code>"a"</code> (append) and run twice. What is different now?',
          ],
        },
        modify: {
          goal: '<p>The file <code>temperatures.txt</code> is already in your Files panel, one reading ' +
            'per line. Write a program that <strong>reads</strong> it, adds up all the readings, and ' +
            'prints the total as <code>Total: 98</code>.</p>' +
            '<p>Hint: <code>open("temperatures.txt")</code> then loop <code>for line in f:</code> and ' +
            'use <code>int(line)</code>.</p>',
          code: '# Open temperatures.txt for reading, total the numbers, print: Total: <total>\n',
          check: { type: 'stdout', expect: 'Total: 98' },
        },
        make: {
          brief: '<p>Write a function <code>area_of_rectangle(width, height)</code> that ' +
            '<strong>returns</strong> the area, then call it for a rectangle 6 wide and 4 high and ' +
            'print <code>Area: 24</code>.</p>',
          criteria: ['Defines a function with two parameters', 'Uses <code>return</code>', 'Prints <code>Area: 24</code>'],
          starter: '# Write area_of_rectangle(width, height) that returns width * height,\n# then call it with 6 and 4 and print: Area: <result>\n',
          check: { type: 'stdout', expect: 'Area: 24' },
        },
      },
      {
        id: 'initials',
        title: 'Challenge: initials',
        make: {
          brief: '<p>Ask for a full name (first and last, one space between) and print the initials in ' +
            'capitals, e.g. <code>Ada Lovelace</code> → <code>AL</code>. Type the name in the console.</p>' +
            '<p>Hint: <code>name[0]</code> is the first letter; <code>name.find(" ")</code> finds the space.</p>',
          criteria: ['Reads a full name', 'Prints two capital initials'],
          starter: 'name = input("Enter your full name: ")\n\n# Print the initials in capitals, e.g. "Ada Lovelace" -> "AL"\n',
          check: { type: 'stdout', expect: 'AL' },
        },
      },
      {
        id: 'write-scores-challenge',
        title: 'Challenge: write scores.txt',
        make: {
          brief: '<p>Write each score in the list to a file called <code>scores.txt</code>, one per ' +
            'line, then check the Files panel.</p>',
          criteria: ['Creates <code>scores.txt</code>', 'One score per line'],
          starter: 'scores = [45, 78, 62, 90, 55]\n\n# Open scores.txt for writing and write each score on its own line.\n',
          check: { type: 'file', file: 'scores.txt', expect: '45\n78\n62\n90\n55' },
        },
      },
    ],

    '2-3-1-defensive-design': [
      {
        id: 'validation-primm',
        title: 'Input validation (PRIMM)',
        predict: {
          code: 'choice = int(input("Choose 1, 2 or 3: "))\n\nif choice >= 1 and choice <= 3:\n    print("You chose option:", choice)\nelse:\n    print("That is not a valid option.")\n',
          ask: '<p>What does this print if the user types <code>2</code>? What about <code>7</code>? ' +
            'And what do you think happens if they type <code>hello</code>?</p>',
          sample: '<p><code>2</code> → <code>You chose option: 2</code>. <code>7</code> → ' +
            '<code>That is not a valid option.</code> <code>hello</code> → the program ' +
            '<strong>crashes</strong> with a <code>ValueError</code>, because <code>int()</code> ' +
            'can\'t convert <code>"hello"</code> to a number. That crash is exactly what defensive ' +
            'design has to prevent.</p>',
        },
        investigate: {
          intro: '<p>Run it and probe its weaknesses (this is "anticipating misuse"):</p>',
          prompts: [
            'Type <code>hello</code> and read the error. Which line fails, and what is the error called?',
            'Type <code>0</code> or <code>4</code>. Does the program cope, or crash? (These are boundary/invalid values.)',
            'The program only checks <em>once</em>. How could you make it keep asking until the input is valid?',
          ],
        },
        modify: {
          goal: '<p>Make it <strong>robust</strong>: keep re-asking (printing <code>Please enter 1, 2 ' +
            'or 3.</code> each time) until the user enters a valid option, then print ' +
            '<code>You chose option: n</code>. For inputs 5, 0, then 2 the output should be:</p>' +
            '<pre>Please enter 1, 2 or 3.\nPlease enter 1, 2 or 3.\nYou chose option: 2</pre>',
          code: 'choice = int(input("Choose 1, 2 or 3: "))\n\n# Keep asking (a while loop) until choice is 1, 2 or 3,\n# printing "Please enter 1, 2 or 3." for each invalid try.\n# Then print: You chose option: <choice>\n',
          check: { type: 'stdout', expect: 'Please enter 1, 2 or 3.\nPlease enter 1, 2 or 3.\nYou chose option: 2' },
        },
        make: {
          brief: '<p>Build a login check. The correct password is <code>PYTHON123</code>. Allow up to ' +
            '3 attempts: print <code>Incorrect password.</code> after each wrong guess, ' +
            '<code>Access granted.</code> as soon as it is right, or <code>Account locked.</code> if ' +
            'all 3 are wrong. Type guesses in the console.</p>',
          criteria: ['At most 3 attempts', 'Correct password grants access immediately', '3 failures locks the account'],
          starter: 'password = "PYTHON123"\nattempts = 0\n\n# Allow up to 3 attempts (see the brief).\n',
          check: { type: 'stdout', expect: 'Incorrect password.\nIncorrect password.\nAccess granted.' },
        },
      },
      {
        id: 'age-digits',
        title: 'Challenge: reject non-numbers',
        make: {
          brief: '<p>Ask for an age as text. Keep asking (printing <code>Please enter digits only.</code> ' +
            'for each bad attempt) until it contains only digits — use <code>.isdigit()</code>. Then ' +
            'convert it and print <code>Age recorded: n</code>.</p>',
          criteria: ['Uses <code>.isdigit()</code>', 'Re-asks on non-digit input', 'Prints <code>Age recorded: n</code>'],
          starter: 'age_text = input("Enter your age: ")\n\n# Keep asking until age_text.isdigit() is True, printing\n# "Please enter digits only." each bad try. Then print: Age recorded: <age>\n',
          check: { type: 'stdout', expect: 'Please enter digits only.\nAge recorded: 21' },
        },
      },
    ],

    '2-5-2-the-integrated-development-environment-ide': [
      {
        id: 'errors-primm',
        title: 'Reading errors (PRIMM)',
        predict: {
          code: 'name = "Ada"\n\nif name == "Ada"\n    print("Hello, Ada!")\n',
          ask: '<p>Will this program run? If not, predict what the IDE will tell you and roughly where ' +
            'the problem is.</p>',
          sample: '<p>It will <strong>not</strong> run — there is a <strong>syntax error</strong>. The ' +
            '<code>if</code> line is missing its colon (<code>:</code>). A good IDE reports a ' +
            '<code>SyntaxError</code> and points at that line before any code runs at all.</p>',
        },
        investigate: {
          intro: '<p>Run it and read the error diagnostics — a key IDE feature:</p>',
          prompts: [
            'Which line number does the error point to? What word/symbol does it say is expected?',
            'Add the missing <code>:</code> and run again. Does it work now?',
            'Now delete a quote mark from <code>"Ada"</code> and run. How is <em>this</em> error message different?',
          ],
        },
        modify: {
          goal: '<p>Fix every error so the program runs and prints exactly:</p><pre>Hello, Ada!</pre>' +
            '<p>Use the error messages the IDE gives you to find each problem.</p>',
          check: { type: 'stdout', expect: 'Hello, Ada!' },
        },
        make: {
          brief: '<p>This program adds up a list of scores but stops with an <code>IndexError</code>. ' +
            'Use the run-time environment and the error message to find why the loop asks for an item ' +
            'that doesn\'t exist, then fix it so it prints <code>Total: 60</code>.</p>',
          criteria: ['Runs without an IndexError', 'Prints <code>Total: 60</code>'],
          starter: 'scores = [10, 20, 30]\n\ntotal = 0\nfor i in range(4):\n    total = total + scores[i]\n\nprint("Total:", total)\n',
          check: { type: 'stdout', expect: 'Total: 60' },
        },
      },
    ],
  };

  var DEFAULT_FILES_FOR_PAGE = {
    '2-2-3-additional-programming-techniques': [
      { name: 'temperatures.txt', content: '18\n21\n19\n23\n17\n' },
    ],
  };

  function activitiesFor(pageId) {
    var list = (ACTIVITIES[pageId] || []).slice();
    list.push(STORY_SANDBOX);
    return list;
  }

  var PHASE_META = {
    predict: { label: 'Predict', icon: '🤔' },
    run: { label: 'Run', icon: '▶️' },
    investigate: { label: 'Investigate', icon: '🔍' },
    modify: { label: 'Modify', icon: '🔧' },
    make: { label: 'Make', icon: '🛠️' },
    sandbox: { label: 'Sandbox', icon: '📖' },
  };

  // ── Browser-only: DOM + worker orchestration ──────────────────────
  // IDE workspace (2026-07-13): file tabs above the editor, a left file-
  // explorer sidebar (folders, uploads incl. images, rename/delete), image
  // preview tabs, and a console that docks at the bottom or to the right.

  function buildStyleOnce() {
    if (document.getElementById('cslab-py-runner-style')) return;
    var s = document.createElement('style');
    s.id = 'cslab-py-runner-style';
    s.textContent = [
      '.cslab-py { display:flex; flex-direction:column; gap:14px; }',
      '.cslab-py-acts { display:flex; gap:8px; flex-wrap:wrap; }',
      '.cslab-py-act { background:var(--card-bg); border:1px solid var(--border); border-radius:8px;',
      '  padding:8px 12px; font-family:inherit; font-size:13px; color:var(--ink); cursor:pointer; min-height:36px; }',
      '.cslab-py-act:hover { border-color:var(--accent); }',
      '.cslab-py-act.active { background:var(--accent); color:var(--paper); border-color:var(--accent); }',
      '.cslab-py-act.done::after { content:" ✓"; color:var(--success); font-weight:700; }',
      '.cslab-py-act.active.done::after { color:var(--paper); }',
      '.cslab-py-stepper { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }',
      '.cslab-py-step { display:flex; align-items:center; gap:6px; background:var(--cream); border:1px solid var(--border);',
      '  border-radius:20px; padding:5px 12px; font-size:12.5px; color:var(--mid); cursor:pointer; }',
      '.cslab-py-step:hover { border-color:var(--accent); }',
      '.cslab-py-step.active { background:var(--accent); color:var(--paper); border-color:var(--accent); font-weight:600; }',
      '.cslab-py-step.done { color:var(--success); }',
      '.cslab-py-step.active.done { color:var(--paper); }',
      '.cslab-py-step-sep { color:var(--mid); }',
      '.cslab-py-brief { background:var(--card-bg); border:1px solid var(--border); border-radius:10px;',
      '  padding:12px 14px; font-size:14px; line-height:1.55; }',
      '.cslab-py-brief pre { background:var(--cream); border:1px solid var(--border); border-radius:6px;',
      '  padding:8px 10px; overflow-x:auto; font-family:"DM Mono",Consolas,monospace; font-size:12.5px; }',
      '.cslab-py-brief code { background:var(--cream); border-radius:4px; padding:1px 5px;',
      '  font-family:"DM Mono",Consolas,monospace; font-size:12.5px; }',
      '.cslab-py-phasebadge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700;',
      '  text-transform:uppercase; letter-spacing:.06em; color:var(--accent); margin-bottom:6px; }',
      '.cslab-py-predict textarea { width:100%; box-sizing:border-box; min-height:70px; font-family:inherit;',
      '  font-size:13px; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--card-bg); color:var(--ink); }',
      '.cslab-py-reveal { background:var(--cream); border:1px solid var(--border); border-left:3px solid var(--success);',
      '  border-radius:8px; padding:10px 12px; font-size:13.5px; line-height:1.5; margin-top:8px; }',
      '.cslab-py-invlist { margin:6px 0 0; padding-left:18px; font-size:13.5px; line-height:1.6; }',
      '.cslab-py-invlist li { margin-bottom:4px; }',
      '.cslab-py-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }',
      '.cslab-py-btns { display:flex; gap:8px; flex-wrap:wrap; }',
      '.cslab-py-note { font-size:12px; color:var(--mid); }',

      // ── Sizing vars: editor/console caps scale with the viewport (vh) so
      // small laptops get ~12 lines and tall monitors ~28 before scrolling
      // starts INSIDE the pane, instead of the page growing forever.
      // --cslab-code-fs is the student-adjustable code font size (A−/A+).
      '.cslab-py { --cslab-edmax:clamp(240px, 48vh, 620px); --cslab-conmax:clamp(150px, 30vh, 440px); --cslab-code-fs:13px; }',

      // ── Workspace grid: sidebar | editor column (| console column) ──
      '.cslab-py-ws { display:grid; grid-template-columns:210px minmax(0,1fr); gap:14px; align-items:start; }',
      '.cslab-py-ws.console-right { grid-template-columns:210px minmax(0,1.15fr) minmax(0,1fr); }',
      '.cslab-py-ws.side-collapsed { grid-template-columns:40px minmax(0,1fr); }',
      '.cslab-py-ws.side-collapsed.console-right { grid-template-columns:40px minmax(0,1.15fr) minmax(0,1fr); }',
      '@media (max-width:900px){ .cslab-py-ws, .cslab-py-ws.console-right, .cslab-py-ws.side-collapsed, .cslab-py-ws.side-collapsed.console-right { grid-template-columns:1fr; } }',

      // ── Collapsed-sidebar rail: a slim strip with one expand button ──
      '.cslab-py-siderail { background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:6px 4px; display:flex; flex-direction:column; align-items:center; gap:8px; }',
      '.cslab-py-siderail button { background:transparent; border:none; color:var(--mid); font-size:15px; cursor:pointer; padding:6px 4px; border-radius:6px; line-height:1; }',
      '.cslab-py-siderail button:hover { color:var(--ink); background:var(--cream); }',
      '.cslab-py-raillabel { writing-mode:vertical-rl; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--mid); -webkit-user-select:none; user-select:none; }',

      // ── Sidebar: file explorer ──
      '.cslab-py-side { background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:10px 10px 12px; min-width:0; }',
      '.cslab-py-sidehead { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px; cursor:pointer; }',
      '.cslab-py-sidehead h4 { margin:0; font-size:13.5px; }',
      '.cslab-py-sidebtns { display:flex; gap:4px; }',
      '.cslab-py-mini { background:transparent; border:1px solid var(--border); border-radius:6px; color:var(--mid);',
      '  font-size:12px; line-height:1; padding:5px 7px; cursor:pointer; font-family:inherit; }',
      '.cslab-py-mini:hover { color:var(--ink); border-color:var(--accent); }',
      '.cslab-py-target { font-size:11px; color:var(--mid); margin:0 0 6px; font-family:"DM Mono",Consolas,monospace;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.cslab-py-tree { list-style:none; margin:0; padding:0; font-size:12.5px; }',
      '.cslab-py-tree ul { list-style:none; margin:0; padding-left:14px; }',
      '.cslab-py-treerow { display:flex; align-items:center; gap:5px; padding:4px 6px; border-radius:6px; cursor:pointer;',
      '  color:var(--ink); min-height:28px; }',
      '.cslab-py-treerow:hover { background:var(--cream); }',
      '.cslab-py-treerow.sel { background:color-mix(in srgb, var(--accent) 14%, transparent); }',
      '.cslab-py-treerow.open-tab { font-weight:600; }',
      '.cslab-py-treename { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
      '  font-family:"DM Mono",Consolas,monospace; }',
      '.cslab-py-treerow .cslab-py-rowbtns { display:none; gap:2px; }',
      '.cslab-py-treerow:hover .cslab-py-rowbtns, .cslab-py-treerow.sel .cslab-py-rowbtns { display:flex; }',
      '.cslab-py-rowbtns button { background:transparent; border:none; color:var(--mid); cursor:pointer; font-size:12px;',
      '  padding:2px 3px; border-radius:4px; }',
      '.cslab-py-rowbtns button:hover { color:var(--ink); background:var(--border); }',
      '.cslab-py-empty { color:var(--mid); font-size:12px; font-style:italic; padding:4px 6px; }',

      // ── Editor column: tab bar + editor/preview ──
      '.cslab-py-edcol { display:flex; flex-direction:column; gap:0; min-width:0; }',
      '.cslab-py-tabsrow { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:0; }',
      // Real-IDE tab strip: ONE row that scrolls horizontally when tabs
      // overflow — tabs must never wrap or resize the editor as files are
      // opened/renamed. Tabs keep their natural width (flex:none) and the
      // strip scrolls; the editor pane's width never moves.
      '.cslab-py-tabs { display:flex; gap:3px; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; align-items:flex-end;',
      '  flex:1; min-width:0; scrollbar-width:thin; }',
      '.cslab-py-tabs::-webkit-scrollbar { height:6px; }',
      '.cslab-py-tabs::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }',
      '.cslab-py-tab { display:inline-flex; align-items:center; gap:7px; padding:7px 12px; font-family:"DM Mono",Consolas,monospace;',
      '  font-size:12.5px; background:var(--cream); border:1px solid var(--border); border-bottom:none;',
      '  border-radius:8px 8px 0 0; color:var(--mid); cursor:pointer; max-width:200px; flex:0 0 auto; }',
      '.cslab-py-tab .tabname { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.cslab-py-tab.active { background:var(--card-bg); color:var(--ink); font-weight:600;',
      '  box-shadow:inset 0 2px 0 var(--accent); position:relative; }',
      '.cslab-py-tab .tabclose { border:none; background:transparent; color:var(--mid); cursor:pointer; font-size:13px;',
      '  padding:0 1px; line-height:1; border-radius:3px; }',
      '.cslab-py-tab .tabclose:hover { color:var(--ink); background:var(--border); }',
      // Rename pencil on the program tab — only shown while that tab is active
      // (keeps inactive tabs quiet; double-click renames on every tab too).
      '.cslab-py-tab .tabedit { display:none; border:none; background:transparent; color:var(--mid); cursor:pointer;',
      '  font-size:11px; padding:0 1px; line-height:1; border-radius:3px; }',
      '.cslab-py-tab.active .tabedit { display:inline; }',
      '.cslab-py-tab .tabedit:hover { color:var(--ink); background:var(--border); }',
      '.cslab-py-editorbox { border-radius:0 8px 8px 8px; }',
      '.cslab-py-editor .CodeMirror, .cslab-py-editor .cslab-editor-fallback { min-height:240px; border-top-left-radius:0; }',
      // Cap the editor and scroll inside it (CodeMirror auto-grows with
      // height:auto; capping .CodeMirror-scroll is the documented recipe for
      // "grow up to a max, then scroll"). Same cap on the textarea fallback.
      '.cslab-py-editor .CodeMirror-scroll { max-height:var(--cslab-edmax); }',
      '.cslab-py-editor .CodeMirror { font-size:var(--cslab-code-fs); }',
      '.cslab-py-editor .cslab-editor-fallback-ta { max-height:var(--cslab-edmax); font-size:var(--cslab-code-fs); }',
      '.cslab-py-editor .cslab-editor-gutter { font-size:var(--cslab-code-fs); }',
      // Run-time error line, highlighted in the editor from the traceback.
      '.cslab-py .cslab-errline { background:color-mix(in srgb, var(--wrong, #c0392b) 18%, transparent) !important; }',
      // IDE status bar under the editor: Ln/Col left, font-size controls right.
      '.cslab-py-statusbar { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:4px 2px 0; }',
      '.cslab-py-statusbar .pos { font-family:"DM Mono",Consolas,monospace; font-size:11px; color:var(--mid); }',
      '.cslab-py-statusbar .right { display:flex; align-items:center; gap:6px; }',
      '.cslab-py-preview { background:var(--cream); border:1px solid var(--border); border-radius:0 8px 8px 8px;',
      '  padding:16px; text-align:center; min-height:240px; display:flex; align-items:center; justify-content:center; }',
      '.cslab-py-preview img { max-width:100%; max-height:420px; border-radius:6px; box-shadow:0 2px 12px rgba(0,0,0,.15); }',
      '.cslab-py-btnbar { display:flex; align-items:center; justify-content:flex-end; gap:8px; margin:10px 0 8px; flex-wrap:wrap; }',

      // ── Console ──
      '.cslab-py-conswrap { display:flex; flex-direction:column; gap:6px; min-width:0; }',
      '.cslab-py-ws.console-right > .cslab-py-conswrap { align-self:stretch; }',
      '.cslab-py-console-label { font-size:12.5px; font-weight:600; color:var(--mid); }',
      // consbox = positioning context for the hover icons overlaid on the
      // console's top-right corner (they must ride the console itself, not
      // the label row above it).
      '.cslab-py-consbox { position:relative; flex:1; display:flex; flex-direction:column; min-width:0; min-height:0; }',
      '.cslab-py-console { background:#12151c; color:#e6edf3; border:1px solid var(--border); border-radius:8px;',
      '  padding:10px 12px; font-family:"DM Mono",Consolas,monospace; font-size:var(--cslab-code-fs); line-height:1.5;',
      '  white-space:pre-wrap; word-break:break-word; min-height:110px; max-height:var(--cslab-conmax); overflow-y:auto; flex:1; }',
      '.cslab-py-ws.console-right .cslab-py-console { max-height:var(--cslab-edmax); min-height:300px; height:100%; box-sizing:border-box; }',
      // Hover-only console controls (clear / copy / dock). Invisible until the
      // pointer is over the console — or a control has keyboard focus, so
      // they stay reachable by Tab (hover-only would lock keyboard users out).
      '.cslab-py-consicons { position:absolute; top:8px; right:8px; display:flex; gap:6px; z-index:2;',
      '  opacity:0; pointer-events:none; transition:opacity .15s ease; }',
      '.cslab-py-consbox:hover .cslab-py-consicons, .cslab-py-consicons:focus-within { opacity:1; pointer-events:auto; }',
      '@media (prefers-reduced-motion: reduce){ .cslab-py-consicons { transition:none; } }',
      '.cslab-py-consicon { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); border-radius:6px;',
      '  color:#c7d5e0; font-size:13px; line-height:1; padding:6px 7px; cursor:pointer; }',
      '.cslab-py-consicon:hover { background:rgba(255,255,255,.16); color:#fff; }',
      '.cslab-py-consicon:focus-visible { outline:2px solid #7ee0c0; outline-offset:1px; }',
      '.cslab-py-console .sep { color:#6b7f95; }',
      '.cslab-py-console .err { color:#ff8a80; }',
      '.cslab-py-console .status { color:#7ee0c0; }',
      '.cslab-py-console .inecho { color:#ffd479; }',
      '.cslab-py-console-input { background:transparent; border:none; outline:none; color:#ffd479;',
      '  font-family:inherit; font-size:13px; caret-color:#ffd479; min-width:8ch; }',
      '.cslab-py-inputs textarea { width:100%; box-sizing:border-box; min-height:56px; font-family:"DM Mono",Consolas,monospace;',
      '  font-size:12.5px; padding:6px 8px; border:1px solid var(--border); border-radius:6px; background:var(--cream); color:var(--ink); }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(label, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cslab-btn' + (cls ? ' ' + cls : '');
    b.textContent = label;
    return b;
  }
  function miniBtn(label, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cslab-py-mini';
    b.textContent = label;
    if (title) b.title = title;
    return b;
  }

  var MAX_UPLOAD_BYTES = 400 * 1024;

  var _activeUnmount = null;

  function mount(rootEl, ctx) {
    buildStyleOnce();

    var ISOLATED = (typeof self !== 'undefined' && self.crossOriginIsolated === true &&
      typeof SharedArrayBuffer !== 'undefined');

    var activities = activitiesFor(ctx.pageId);
    var activityById = {};
    activities.forEach(function (a) { activityById[a.id] = a; });

    var progress = ctx.store.get('_progress', {}) || {};
    function actProgress(id) { return progress[id] || (progress[id] = { phases: {} }); }
    function saveProgress() { ctx.store.set('_progress', progress); }

    var filesArr = ctx.store.get('files', DEFAULT_FILES_FOR_PAGE[ctx.pageId] || []) || [];
    var foldersArr = ctx.store.get('folders', []) || [];

    // ── worker state ──
    var worker = null, workerReadyPromise = null, workerBusy = false, runTimer = null;
    var stdoutBuf = '';
    var stderrBuf = '';   // this run's traceback text, parsed for the error line
    var errLine = null;   // 0-based editor line currently highlighted as the error
    var sab = null, sabCtrl = null, sabBytes = null;
    if (ISOLATED) {
      sab = new SharedArrayBuffer(65536);
      sabCtrl = new Int32Array(sab, 0, 2);
      sabBytes = new Uint8Array(sab, 8);
    }
    var awaitingInput = false;

    // ── DOM skeleton ──
    var root = el('div', 'cslab-py');
    var actsBar = el('div', 'cslab-py-acts');
    var stepper = el('div', 'cslab-py-stepper');
    var briefBox = el('div', 'cslab-py-brief');
    var predictBox = el('div', 'cslab-py-predict');
    var workspace = el('div', 'cslab-py-ws');
    var feedback = el('div', 'cslab-feedback');
    root.appendChild(actsBar);
    root.appendChild(stepper);
    root.appendChild(briefBox);
    root.appendChild(predictBox);
    root.appendChild(workspace);
    root.appendChild(feedback);
    rootEl.appendChild(root);

    // Sidebar: file explorer
    var sidebar = el('div', 'cslab-py-side');
    var sideHead = el('div', 'cslab-py-sidehead');
    sideHead.title = 'Click to target the top folder';
    sideHead.appendChild(el('h4', null, '📁 Files'));
    var sideBtns = el('div', 'cslab-py-sidebtns');
    sideBtns.style.flexWrap = 'wrap';
    var newFileBtn = miniBtn('＋📄', 'New file');
    var newFolderBtn = miniBtn('＋📁', 'New folder');
    var uploadBtn = miniBtn('⬆', 'Upload files (images welcome)');
    var dlProjBtn = miniBtn('📦', 'Download the whole project (.zip)');
    var collapseBtn = miniBtn('«', 'Hide the files panel');
    sideBtns.appendChild(newFileBtn); sideBtns.appendChild(newFolderBtn); sideBtns.appendChild(uploadBtn);
    sideBtns.appendChild(dlProjBtn); sideBtns.appendChild(collapseBtn);
    sideHead.appendChild(sideBtns);
    var targetLabel = el('div', 'cslab-py-target', 'in: / (top folder)');
    var treeEl = el('ul', 'cslab-py-tree');
    var sideNote = el('div', 'cslab-py-note', 'Files save with your work. Very large files may stay on this device only.');
    sideNote.style.marginTop = '8px';
    sidebar.appendChild(sideHead);
    sidebar.appendChild(targetLabel);
    sidebar.appendChild(treeEl);
    sidebar.appendChild(sideNote);
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    sidebar.appendChild(fileInput);
    workspace.appendChild(sidebar);

    // Collapsed-state rail: sidebar and rail swap display; the grid's first
    // column narrows via .side-collapsed (works in both console docks).
    var sideRail = el('div', 'cslab-py-siderail');
    var expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.textContent = '📁';
    expandBtn.title = 'Show the files panel';
    expandBtn.setAttribute('aria-label', 'Show the files panel');
    sideRail.appendChild(expandBtn);
    sideRail.appendChild(el('span', 'cslab-py-raillabel', 'Files'));
    workspace.insertBefore(sideRail, sidebar);

    var sideCollapsed = !!ctx.store.get('sideCollapsed', false);
    function applySideCollapsed() {
      workspace.classList.toggle('side-collapsed', sideCollapsed);
      sidebar.style.display = sideCollapsed ? 'none' : '';
      sideRail.style.display = sideCollapsed ? '' : 'none';
      if (editorInst) editorInst.refresh(); // CodeMirror must re-measure after the column resize
    }
    collapseBtn.addEventListener('click', function () {
      sideCollapsed = true; ctx.store.set('sideCollapsed', true); applySideCollapsed();
    });
    expandBtn.addEventListener('click', function () {
      sideCollapsed = false; ctx.store.set('sideCollapsed', false); applySideCollapsed();
    });

    // Editor column: tab bar + buttons, editor / image preview, fallback inputs
    var editorCol = el('div', 'cslab-py-edcol');
    var tabsRow = el('div', 'cslab-py-tabsrow');
    var tabsBar = el('div', 'cslab-py-tabs');
    var editorBtns = el('div', 'cslab-py-btns');
    var resetBtn = miniBtn('↺', 'Reset this step back to the original starter code');
    var runBtn = btn('▶ Run'); runBtn.disabled = true;
    runBtn.title = 'Run your program (Ctrl+Enter)';
    var stopBtn = btn('■ Stop', 'secondary'); stopBtn.disabled = true;
    var submitBtn = btn('✓ Submit', 'secondary');
    editorBtns.appendChild(resetBtn);
    editorBtns.appendChild(runBtn); editorBtns.appendChild(stopBtn); editorBtns.appendChild(submitBtn);
    tabsRow.appendChild(tabsBar); tabsRow.appendChild(editorBtns);
    var editorContainer = el('div', 'cslab-py-editor cslab-py-editorbox');
    var previewBox = el('div', 'cslab-py-preview');
    previewBox.style.display = 'none';
    // IDE status bar: cursor position (CodeMirror only) + code font size.
    var statusBar = el('div', 'cslab-py-statusbar');
    var posLabel = el('span', 'pos', '');
    var statusRight = el('div', 'right');
    statusRight.appendChild(el('span', 'cslab-py-note', 'Ctrl+Enter runs'));
    var fsMinus = miniBtn('A−', 'Smaller code text');
    var fsPlus = miniBtn('A＋', 'Larger code text');
    statusRight.appendChild(fsMinus); statusRight.appendChild(fsPlus);
    statusBar.appendChild(posLabel);
    statusBar.appendChild(statusRight);
    editorCol.appendChild(tabsRow);
    editorCol.appendChild(editorContainer);
    editorCol.appendChild(statusBar);
    editorCol.appendChild(previewBox);

    var fontSize = Number(ctx.store.get('fontSize', 13)) || 13;
    function applyFontSize() {
      root.style.setProperty('--cslab-code-fs', fontSize + 'px');
      if (editorInst) editorInst.refresh();
    }
    fsMinus.addEventListener('click', function () {
      fontSize = Math.max(11, fontSize - 1); ctx.store.set('fontSize', fontSize); applyFontSize();
    });
    fsPlus.addEventListener('click', function () {
      fontSize = Math.min(19, fontSize + 1); ctx.store.set('fontSize', fontSize); applyFontSize();
    });
    var inputsBox = null;
    if (!ISOLATED) {
      var inputsWrap = el('div', 'cslab-py-inputs');
      inputsWrap.style.marginTop = '8px';
      inputsWrap.appendChild(el('div', 'cslab-py-note', 'Your browser can\'t type into the console live, so enter each answer here in advance — one per line.'));
      inputsBox = document.createElement('textarea');
      inputsBox.placeholder = 'One answer per line…';
      inputsWrap.appendChild(inputsBox);
      editorCol.appendChild(inputsWrap);
    }
    workspace.appendChild(editorCol);

    // Console (dockable): bottom = inside editor column; right = own grid column.
    // Its controls are icon buttons overlaid on the console's top-right corner,
    // shown on hover (or keyboard focus) so the console face stays clean.
    var consoleWrap = el('div', 'cslab-py-conswrap');
    consoleWrap.style.marginTop = '10px';
    var consRow = el('div', 'cslab-py-row');
    consRow.appendChild(el('span', 'cslab-py-console-label', ISOLATED ? 'Console — type your answers here when asked' : 'Console'));
    var consBox = el('div', 'cslab-py-consbox');
    var consoleEl = el('div', 'cslab-py-console');
    var consIcons = el('div', 'cslab-py-consicons');
    function consIcon(glyph, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-py-consicon';
      b.textContent = glyph;
      b.title = label;
      b.setAttribute('aria-label', label);
      return b;
    }
    var iconClear = consIcon('🧹', 'Clear the console');
    var iconCopy = consIcon('📋', 'Copy the console output');
    var iconDock = consIcon('⇥', 'Move the console to the right');
    consIcons.appendChild(iconClear); consIcons.appendChild(iconCopy); consIcons.appendChild(iconDock);
    consBox.appendChild(consoleEl);
    consBox.appendChild(consIcons);
    consoleWrap.appendChild(consRow);
    consoleWrap.appendChild(consBox);

    var consolePos = ctx.store.get('consolePos', 'bottom');
    function applyConsolePos() {
      if (consolePos === 'right') {
        workspace.classList.add('console-right');
        consoleWrap.style.marginTop = '0';
        workspace.appendChild(consoleWrap);
        iconDock.textContent = '⇣';
        iconDock.title = 'Move the console below the editor';
        iconDock.setAttribute('aria-label', iconDock.title);
      } else {
        workspace.classList.remove('console-right');
        consoleWrap.style.marginTop = '10px';
        editorCol.appendChild(consoleWrap);
        iconDock.textContent = '⇥';
        iconDock.title = 'Move the console to the right';
        iconDock.setAttribute('aria-label', iconDock.title);
      }
    }
    iconDock.addEventListener('click', function () {
      consolePos = consolePos === 'right' ? 'bottom' : 'right';
      ctx.store.set('consolePos', consolePos);
      applyConsolePos();
      if (editorInst) editorInst.refresh();
    });
    iconCopy.addEventListener('click', function () {
      var text = consoleEl.innerText || '';
      var flash = function () {
        iconCopy.textContent = '✓';
        setTimeout(function () { iconCopy.textContent = '📋'; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash, function () {});
      }
    });
    applyConsolePos();

    // ── editor ──
    var editorInst = null;
    var editorReady = ctx.ui.mountCodeEditor(editorContainer, {
      mode: 'python', value: '',
      onChange: function (v) { onEditorChange(v); },
    }).then(function (inst) { editorInst = inst; refreshRunEnabled(); return inst; });

    // ── state ──
    var state = { activity: null, phase: null };
    var mainCode = '';                    // the program (main.py) for the current phase
    var openTabs = [];                    // file paths open as tabs (main.py is implicit)
    var activeTab = 'main';               // 'main' | file path
    var selectedDir = '';                 // target folder for new/upload ('' = root)
    var collapsed = {};                   // folder path -> true (collapsed)
    // Display name of the program tab — renamable like any other file. Only
    // the LABEL changes (the worker runs the code string, not a named file),
    // so renaming can never break a run.
    var mainName = String(ctx.store.get('mainName', 'main.py') || 'main.py');

    function fileEntry(path) {
      for (var i = 0; i < filesArr.length; i++) if (filesArr[i].name === path) return filesArr[i];
      return null;
    }

    function saveCode(actId, phase, val) { ctx.store.set('code::' + actId + '::' + phase, val); }
    function loadCode(actId, phase) {
      var d = ctx.store.get('code::' + actId + '::' + phase, null);
      return d == null ? codeForPhase(activityById[actId], phase) : d;
    }
    var saveFiles = debounce(function () { ctx.store.set('files', filesArr); ctx.store.set('folders', foldersArr); }, AUTOSAVE_DEBOUNCE_MS);
    var saveInputs = debounce(function (v) { if (state.activity && state.phase) ctx.store.set('inputs::' + state.activity.id + '::' + state.phase, v); }, AUTOSAVE_DEBOUNCE_MS);
    if (inputsBox) inputsBox.addEventListener('input', function () { saveInputs(inputsBox.value); });

    function onEditorChange(v) {
      clearErrLine(); // edits shift lines, so a stale error tint would lie
      if (activeTab === 'main') {
        mainCode = v;
        if (state.activity && state.phase && state.phase !== 'predict') saveCode(state.activity.id, state.phase, v);
      } else {
        var f = fileEntry(activeTab);
        if (f && !f.binary) { f.content = v; saveFiles(); }
      }
    }

    // Push whatever the editor currently shows into its backing model NOW
    // (tab switches, phase switches and Run must not lose the last keystrokes
    // still inside the autosave debounce window).
    function captureEditor() {
      if (!editorInst) return;
      onEditorChange(editorInst.getValue());
    }

    function refreshRunEnabled() {
      runBtn.disabled = !editorInst || workerBusy || state.phase === 'predict';
    }

    // ── tabs ──
    function renderTabs() {
      tabsBar.innerHTML = '';
      var mainTab = el('button', 'cslab-py-tab' + (activeTab === 'main' ? ' active' : ''));
      mainTab.type = 'button';
      mainTab.title = mainName + ' — your program (double-click to rename)';
      mainTab.appendChild(el('span', 'tabname', '🐍 ' + mainName));
      var pencil = el('button', 'tabedit', '✎');
      pencil.type = 'button';
      pencil.title = 'Rename ' + mainName;
      pencil.setAttribute('aria-label', 'Rename ' + mainName);
      pencil.addEventListener('click', function (e) { e.stopPropagation(); renameMain(); });
      mainTab.appendChild(pencil);
      mainTab.addEventListener('click', function () { switchTab('main'); });
      mainTab.addEventListener('dblclick', renameMain);
      tabsBar.appendChild(mainTab);
      openTabs.forEach(function (path) {
        var t = el('button', 'cslab-py-tab' + (activeTab === path ? ' active' : ''));
        t.type = 'button';
        t.title = path + ' (double-click to rename)';
        t.appendChild(el('span', 'tabname', (isImagePath(path) ? '🖼️ ' : '📄 ') + baseName(path)));
        var x = el('button', 'tabclose', '×');
        x.type = 'button';
        x.title = 'Close';
        x.addEventListener('click', function (e) { e.stopPropagation(); closeTab(path); });
        t.appendChild(x);
        t.addEventListener('click', function () { switchTab(path); });
        t.addEventListener('dblclick', function () { renameFile(path); });
        tabsBar.appendChild(t);
      });
    }

    function renameMain() {
      var name = window.prompt('Rename your program file:', mainName);
      if (name == null) return;
      name = name.trim();
      if (name === mainName) return;
      if (!/\.py$/i.test(name)) { window.alert('Your program file must keep a .py ending (e.g. game.py).'); return; }
      var problem = validateSegment(name, siblingNames(''));
      if (problem) { window.alert(problem); return; }
      mainName = name;
      ctx.store.set('mainName', mainName);
      renderTabs();
    }

    function switchTab(id) {
      if (id === activeTab) return;
      captureEditor();
      activeTab = id;
      renderTabs();
      renderTree();
      refreshEditorArea();
    }

    function openFileTab(path) {
      if (openTabs.indexOf(path) === -1) openTabs.push(path);
      switchTab(path);
      if (activeTab !== path) { renderTabs(); } // switchTab no-ops if already active
    }

    function closeTab(path) {
      captureEditor();
      openTabs = openTabs.filter(function (p) { return p !== path; });
      if (activeTab === path) activeTab = 'main';
      renderTabs();
      renderTree();
      refreshEditorArea();
    }

    function refreshEditorArea() {
      var f = activeTab === 'main' ? null : fileEntry(activeTab);
      if (activeTab !== 'main' && !f) { activeTab = 'main'; renderTabs(); }
      var showImage = activeTab !== 'main' && f && f.binary && isImagePath(activeTab);
      previewBox.style.display = showImage ? '' : 'none';
      editorContainer.style.display = showImage ? 'none' : '';
      statusBar.style.display = showImage ? 'none' : '';
      if (showImage) {
        previewBox.innerHTML = '';
        var img = document.createElement('img');
        img.src = 'data:' + imageMime(activeTab) + ';base64,' + f.content;
        img.alt = activeTab;
        previewBox.appendChild(img);
        return;
      }
      var value, mode;
      if (activeTab === 'main') { value = mainCode; mode = 'python'; }
      else if (f.binary) { value = '(binary file — download it from the Files panel)'; mode = 'text'; }
      else { value = f.content; mode = editorModeFor(activeTab); }
      var apply = function () {
        editorInst.setValue(value);
        try {
          if (editorInst.cm) editorInst.cm.setOption('mode', mode === 'python' ? 'python' : null);
        } catch (e) {}
        editorInst.refresh();
      };
      if (editorInst) apply(); else editorReady.then(apply);
    }

    // ── file tree ──
    function renderTree() {
      treeEl.innerHTML = '';
      targetLabel.textContent = 'in: /' + (selectedDir || ' (top folder)');
      var tree = buildTree(filesArr, foldersArr);
      if (!filesArr.length && !foldersArr.length) {
        treeEl.appendChild(el('li', 'cslab-py-empty', 'No files yet — create or upload one, or write one from your code.'));
        return;
      }
      renderNode(tree, '', treeEl);
    }

    function renderNode(node, dirPath, ul) {
      Object.keys(node.dirs).sort().forEach(function (name) {
        var path = joinPath(dirPath, name);
        var li = document.createElement('li');
        var row = el('div', 'cslab-py-treerow' + (selectedDir === path ? ' sel' : ''));
        row.appendChild(el('span', null, collapsed[path] ? '▸' : '▾'));
        row.appendChild(el('span', null, '📁'));
        row.appendChild(el('span', 'cslab-py-treename', name));
        var rowBtns = el('span', 'cslab-py-rowbtns');
        var rn = el('button', null, '✎'); rn.type = 'button'; rn.title = 'Rename folder';
        var dl = el('button', null, '✕'); dl.type = 'button'; dl.title = 'Delete folder';
        rowBtns.appendChild(rn); rowBtns.appendChild(dl);
        row.appendChild(rowBtns);
        row.addEventListener('click', function () {
          if (selectedDir === path) collapsed[path] = !collapsed[path];
          selectedDir = path;
          renderTree();
        });
        rn.addEventListener('click', function (e) { e.stopPropagation(); renameFolder(path); });
        dl.addEventListener('click', function (e) { e.stopPropagation(); deleteFolder(path); });
        li.appendChild(row);
        if (!collapsed[path]) {
          var sub = document.createElement('ul');
          renderNode(node.dirs[name], path, sub);
          li.appendChild(sub);
        }
        ul.appendChild(li);
      });
      node.files.forEach(function (name) {
        var path = joinPath(dirPath, name);
        var li = document.createElement('li');
        var row = el('div', 'cslab-py-treerow' + (activeTab === path ? ' open-tab' : ''));
        row.appendChild(el('span', null, isImagePath(path) ? '🖼️' : (extOf(path) === 'py' ? '🐍' : '📄')));
        row.appendChild(el('span', 'cslab-py-treename', name));
        var rowBtns = el('span', 'cslab-py-rowbtns');
        var rn = el('button', null, '✎'); rn.type = 'button'; rn.title = 'Rename';
        var dl = el('button', null, '⬇'); dl.type = 'button'; dl.title = 'Download';
        var rm = el('button', null, '✕'); rm.type = 'button'; rm.title = 'Delete';
        rowBtns.appendChild(rn); rowBtns.appendChild(dl); rowBtns.appendChild(rm);
        row.appendChild(rowBtns);
        row.addEventListener('click', function () { selectedDir = dirPath; openFileTab(path); });
        rn.addEventListener('click', function (e) { e.stopPropagation(); renameFile(path); });
        dl.addEventListener('click', function (e) { e.stopPropagation(); downloadFile(path); });
        rm.addEventListener('click', function (e) { e.stopPropagation(); deleteFile(path); });
        li.appendChild(row);
        ul.appendChild(li);
      });
    }

    function siblingNames(dir) {
      var out = [];
      filesArr.forEach(function (f) { if (parentOf(f.name) === dir) out.push(baseName(f.name)); });
      foldersArr.forEach(function (d) { if (parentOf(d) === dir) out.push(baseName(d)); });
      return out;
    }

    function newFile() {
      var name = window.prompt('New file name (e.g. names.txt):', '');
      if (name == null) return;
      var problem = validateSegment(name, siblingNames(selectedDir));
      if (problem) { window.alert(problem); return; }
      var path = joinPath(selectedDir, name.trim());
      filesArr.push({ name: path, content: '', binary: false });
      saveFiles(); renderTree(); openFileTab(path);
    }

    function newFolder() {
      var name = window.prompt('New folder name:', '');
      if (name == null) return;
      var problem = validateSegment(name, siblingNames(selectedDir));
      if (problem) { window.alert(problem); return; }
      var path = joinPath(selectedDir, name.trim());
      foldersArr.push(path);
      selectedDir = path;
      saveFiles(); renderTree();
    }

    function renameFile(path) {
      var name = window.prompt('Rename file:', baseName(path));
      if (name == null || name.trim() === baseName(path)) return;
      var dir = parentOf(path);
      var problem = validateSegment(name, siblingNames(dir));
      if (problem) { window.alert(problem); return; }
      var next = joinPath(dir, name.trim());
      var f = fileEntry(path);
      if (f) f.name = next;
      openTabs = openTabs.map(function (p) { return p === path ? next : p; });
      if (activeTab === path) activeTab = next;
      saveFiles(); renderTree(); renderTabs(); refreshEditorArea();
    }

    function renameFolder(path) {
      var name = window.prompt('Rename folder:', baseName(path));
      if (name == null || name.trim() === baseName(path)) return;
      var dir = parentOf(path);
      var problem = validateSegment(name, siblingNames(dir));
      if (problem) { window.alert(problem); return; }
      var next = joinPath(dir, name.trim());
      var prefix = path + '/';
      foldersArr = foldersArr.map(function (d) {
        return d === path ? next : (d.indexOf(prefix) === 0 ? next + '/' + d.slice(prefix.length) : d);
      });
      filesArr.forEach(function (f) {
        if (f.name.indexOf(prefix) === 0) f.name = next + '/' + f.name.slice(prefix.length);
      });
      openTabs = openTabs.map(function (p) { return p.indexOf(prefix) === 0 ? next + '/' + p.slice(prefix.length) : p; });
      if (activeTab !== 'main' && activeTab.indexOf(prefix) === 0) activeTab = next + '/' + activeTab.slice(prefix.length);
      if (selectedDir === path || selectedDir.indexOf(prefix) === 0) selectedDir = next + selectedDir.slice(path.length);
      saveFiles(); renderTree(); renderTabs(); refreshEditorArea();
    }

    function deleteFile(path) {
      if (!window.confirm('Delete ' + path + '?')) return;
      filesArr = filesArr.filter(function (f) { return f.name !== path; });
      saveFiles();
      closeTab(path); // also re-renders tree + tabs + editor
    }

    function deleteFolder(path) {
      var prefix = path + '/';
      var count = filesArr.filter(function (f) { return f.name.indexOf(prefix) === 0; }).length;
      if (!window.confirm('Delete folder ' + path + (count ? ' and the ' + count + ' file(s) inside it' : '') + '?')) return;
      filesArr = filesArr.filter(function (f) { return f.name.indexOf(prefix) !== 0; });
      foldersArr = foldersArr.filter(function (d) { return d !== path && d.indexOf(prefix) !== 0; });
      openTabs = openTabs.filter(function (p) { return p.indexOf(prefix) !== 0; });
      if (activeTab !== 'main' && activeTab.indexOf(prefix) === 0) activeTab = 'main';
      if (selectedDir === path || selectedDir.indexOf(prefix) === 0) selectedDir = '';
      saveFiles(); renderTree(); renderTabs(); refreshEditorArea();
    }

    function b64ToU8(b64) {
      var bin = atob(b64), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }

    // Whole project as one .zip: the program + every file/folder in the tree.
    function downloadProject() {
      captureEditor();
      var enc = new TextEncoder();
      // If a real file shares the program's name, suffix the program copy so
      // the archive never holds two entries at the same path.
      var programName = mainName;
      if (fileEntry(programName)) {
        var dot = programName.lastIndexOf('.');
        programName = dot === -1 ? programName + ' (program)'
          : programName.slice(0, dot) + ' (program)' + programName.slice(dot);
      }
      var entries = [{ path: programName, data: enc.encode(mainCode) }];
      foldersArr.forEach(function (d) { entries.push({ path: d + '/', data: new Uint8Array(0) }); });
      filesArr.forEach(function (f) {
        var data;
        try { data = f.binary ? b64ToU8(f.content) : enc.encode(f.content); }
        catch (e) { return; } // a corrupt base64 entry shouldn't sink the whole zip
        entries.push({ path: f.name, data: data });
      });
      var blob = new Blob(buildZipChunks(entries), { type: 'application/zip' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'python-project.zip';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function downloadFile(path) {
      var f = fileEntry(path);
      if (!f) return;
      var url;
      if (f.binary) {
        url = 'data:' + (isImagePath(path) ? imageMime(path) : 'application/octet-stream') + ';base64,' + f.content;
      } else {
        url = URL.createObjectURL(new Blob([f.content], { type: 'text/plain' }));
      }
      var a = document.createElement('a');
      a.href = url; a.download = baseName(path);
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (!f.binary) setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function handleUploads(fileList) {
      Array.prototype.forEach.call(fileList, function (file) {
        if (file.size > MAX_UPLOAD_BYTES) {
          window.alert(file.name + ' is too big (' + Math.round(file.size / 1024) + ' KB — the limit is ' + (MAX_UPLOAD_BYTES / 1024) + ' KB).');
          return;
        }
        var name = file.name.replace(/[\/\\]/g, '_');
        // avoid silent overwrite: de-dupe with (1), (2)…
        var base = name, n = 1;
        while (fileEntry(joinPath(selectedDir, name))) {
          var dot = base.lastIndexOf('.');
          name = dot === -1 ? base + ' (' + n + ')' : base.slice(0, dot) + ' (' + n + ')' + base.slice(dot);
          n++;
        }
        var path = joinPath(selectedDir, name);
        var reader = new FileReader();
        if (isTextExt(name)) {
          reader.onload = function () {
            filesArr.push({ name: path, content: String(reader.result), binary: false });
            saveFiles(); renderTree();
          };
          reader.readAsText(file);
        } else {
          reader.onload = function () {
            var dataUrl = String(reader.result);
            var b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
            filesArr.push({ name: path, content: b64, binary: true });
            saveFiles(); renderTree();
            if (isImagePath(name)) openFileTab(path);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    newFileBtn.addEventListener('click', newFile);
    newFolderBtn.addEventListener('click', newFolder);
    dlProjBtn.addEventListener('click', downloadProject);
    uploadBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) handleUploads(fileInput.files);
      fileInput.value = '';
    });
    sideHead.addEventListener('click', function (e) {
      if (e.target && e.target.tagName === 'BUTTON') return;
      selectedDir = '';
      renderTree();
    });

    // ── console rendering ──
    function scrollConsole() { consoleEl.scrollTop = consoleEl.scrollHeight; }
    function clearConsole() {
      consoleEl.innerHTML = '';
      pendingInputEl = null;
      // If the program is mid-run waiting for a line, clearing wiped its input
      // box — put a fresh one back so the run can still be answered (and Stop
      // still works). Otherwise a cleared console would strand the program.
      if (awaitingInput) showInputBox();
    }
    var pendingInputEl = null;
    function appendConsole(text, cls) {
      var node = cls ? el('span', cls) : document.createTextNode('');
      node.textContent = text;
      if (pendingInputEl) consoleEl.insertBefore(node, pendingInputEl);
      else consoleEl.appendChild(node);
      scrollConsole();
    }
    function consoleSeparator() {
      var d = new Date();
      var hh = ('0' + d.getHours()).slice(-2), mm = ('0' + d.getMinutes()).slice(-2), ss = ('0' + d.getSeconds()).slice(-2);
      appendConsole('── RUN AT ' + hh + ':' + mm + ':' + ss + ' ──\n', 'sep');
    }

    // ── worker orchestration ──
    function resetWorker() { worker = null; workerReadyPromise = null; workerBusy = false; awaitingInput = false; }
    function terminateWorker() {
      if (worker) { try { worker.terminate(); } catch (e) {} }
      resetWorker();
      removePendingInput();
    }
    function ensureWorker() {
      if (workerReadyPromise) return workerReadyPromise;
      appendConsole('Starting Python…\n', 'status');
      worker = new Worker('/cs-lab/pyworker.js');
      workerReadyPromise = new Promise(function (resolve, reject) {
        worker.onmessage = function (ev) { handleWorkerMessage(ev.data, resolve, reject); };
        worker.onerror = function (e) { reject(new Error((e && e.message) || 'The Python worker failed to start.')); };
      });
      workerReadyPromise.catch(function () {});
      return workerReadyPromise;
    }
    function startRunTimer() {
      clearTimeout(runTimer);
      runTimer = setTimeout(function () {
        appendConsole('\n⏱️ Your program took too long (an infinite loop?) and was stopped after 15 seconds.\n', 'err');
        terminateWorker();
        setRunning(false);
      }, RUN_TIMEOUT_MS);
    }

    function handleWorkerMessage(msg, resolveReady, rejectReady) {
      if (!msg) return;
      switch (msg.type) {
        case 'progress': appendConsole(msg.text + '\n', 'status'); break;
        case 'ready': if (resolveReady) resolveReady(); break;
        case 'load-error':
          appendConsole('⚠️ Could not load Python — the CDN may be blocked on this network. (' + msg.message + ')\n', 'err');
          if (rejectReady) rejectReady(new Error(msg.message));
          finishRun(null); terminateWorker();
          break;
        case 'stdout': stdoutBuf += msg.text; appendConsole(msg.text); break;
        case 'stderr': stderrBuf += msg.text; appendConsole(msg.text, 'err'); break;
        case 'input-request': onInputRequest(); break;
        case 'done': finishRun(msg.files || {}, msg.dirs || []); break;
        case 'error': appendConsole('⚠️ ' + msg.message + '\n', 'err'); finishRun(null); terminateWorker(); break;
      }
    }

    // Live input: the worker (blocked in the input() bridge) posts
    // 'input-request'; we show an inline editable box in the console, and on
    // Enter write the typed line into the SAB and wake the worker.
    function onInputRequest() {
      if (!ISOLATED) return;
      awaitingInput = true;
      clearTimeout(runTimer); // don't count "waiting for a human" against the 15s cap
      showInputBox();
    }
    function showInputBox() {
      removePendingInput();
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'cslab-py-console-input';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.spellcheck = false;
      pendingInputEl = input;
      consoleEl.appendChild(input);
      input.focus();
      scrollConsole();
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var value = input.value;
        removePendingInput();
        appendConsole(value + '\n', 'inecho');
        provideInput(value);
      });
    }
    function removePendingInput() {
      if (pendingInputEl && pendingInputEl.parentNode) pendingInputEl.parentNode.removeChild(pendingInputEl);
      pendingInputEl = null;
    }
    function provideInput(value) {
      awaitingInput = false;
      if (!sab) return;
      // Raw typed line, NO trailing newline (the input() bridge handles it).
      // Empty line → length 0 → input() correctly returns "".
      var enc = new TextEncoder().encode(value);
      var n = Math.min(enc.length, sabBytes.length);
      if (n > 0) sabBytes.set(enc.subarray(0, n));
      Atomics.store(sabCtrl, 1, n);
      Atomics.store(sabCtrl, 0, 1);
      Atomics.notify(sabCtrl, 0, 1);
      startRunTimer();
    }

    function setRunning(on) {
      workerBusy = on;
      stopBtn.disabled = !on;
      refreshRunEnabled();
    }

    // ── error-line spotlight ──
    // Pyodide tracebacks name the student's program "<exec>"; the deepest
    // (last) frame is where it actually failed. Tint that line in the editor
    // so students connect the traceback to their code — the highlight clears
    // as soon as they edit or re-run. CodeMirror only; the fallback editor
    // has no line API, and the traceback text still tells the story there.
    function clearErrLine() {
      if (errLine != null && editorInst && editorInst.cm) {
        try { editorInst.cm.removeLineClass(errLine, 'background', 'cslab-errline'); } catch (e) {}
      }
      errLine = null;
    }
    function highlightErrLine() {
      if (!editorInst || !editorInst.cm || activeTab !== 'main') return;
      var m, last = null, re = /File "<exec>", line (\d+)/g;
      while ((m = re.exec(stderrBuf))) last = Number(m[1]);
      if (last == null) {
        var m2 = stderrBuf.match(/line (\d+)/); // SyntaxError phrasing
        if (m2) last = Number(m2[1]);
      }
      if (last == null) return;
      clearErrLine();
      var idx = Math.max(0, Math.min(last - 1, editorInst.cm.lineCount() - 1));
      try {
        editorInst.cm.addLineClass(idx, 'background', 'cslab-errline');
        errLine = idx;
      } catch (e) {}
    }

    function finishRun(filesObj, dirs) {
      clearTimeout(runTimer);
      removePendingInput();
      awaitingInput = false;
      setRunning(false);
      highlightErrLine();
      if (!filesObj) return;
      filesArr = filesObjectToArray(filesArr, filesObj);
      foldersArr = dirs || [];
      saveFiles(); renderTree();
      // if the open tab's file changed (or vanished) reflect it
      if (activeTab !== 'main') refreshEditorArea();
      renderTabs();
      var check = checkForPhase(state.activity, state.phase);
      if (!check) return;
      var passed = runCheck(check, { stdout: stdoutBuf, files: textFileMap(filesObj) });
      if (passed === true) {
        feedback.className = 'cslab-feedback ok';
        feedback.textContent = '✅ Nice — that meets the goal!';
        markPhaseDone(state.activity, state.phase);
      } else if (passed === false) {
        feedback.className = 'cslab-feedback no';
        feedback.textContent = 'Not quite — compare your output with the goal and try again.';
      }
    }

    function runCode() {
      if (workerBusy || !editorInst || state.phase === 'predict') return;
      captureEditor();
      feedback.className = 'cslab-feedback'; feedback.textContent = '';
      stdoutBuf = '';
      stderrBuf = '';
      clearErrLine();
      clearConsole(); // each run starts on a fresh console — old output only misleads
      consoleSeparator();
      setRunning(true);
      ensureWorker().then(function () {
        if (!worker) return;
        var msg = {
          type: 'run', code: mainCode,
          files: filesArrayToObject(filesArr), folders: foldersArr.slice(),
          interactive: ISOLATED,
        };
        if (ISOLATED) msg.sab = sab;
        else msg.inputs = (inputsBox ? inputsBox.value : '').split(/\r\n|\r|\n/).filter(function (l, i, arr) { return !(l === '' && i === arr.length - 1); });
        if (ISOLATED) { Atomics.store(sabCtrl, 0, 0); Atomics.store(sabCtrl, 1, 0); }
        worker.postMessage(msg);
        startRunTimer();
        if (state.phase === 'run' || state.phase === 'investigate' || state.phase === 'sandbox') {
          markPhaseDone(state.activity, state.phase);
        }
      }, function () { setRunning(false); });
    }

    runBtn.addEventListener('click', runCode);
    submitBtn.addEventListener('click', runCode);
    stopBtn.addEventListener('click', function () {
      clearTimeout(runTimer);
      appendConsole('\nStopped.\n', 'status');
      if (ISOLATED && awaitingInput) { Atomics.store(sabCtrl, 0, -1); Atomics.notify(sabCtrl, 0, 1); }
      terminateWorker();
      setRunning(false);
    });
    iconClear.addEventListener('click', clearConsole);

    resetBtn.addEventListener('click', function () {
      if (!state.activity || state.phase === 'predict') return;
      if (!window.confirm('Replace your code with the original starter code for this step? Your current code will be lost.')) return;
      if (activeTab !== 'main') switchTab('main');
      mainCode = codeForPhase(state.activity, state.phase);
      saveCode(state.activity.id, state.phase, mainCode);
      clearErrLine();
      refreshEditorArea();
    });

    // Ctrl+Enter (Cmd+Enter on Mac) runs from anywhere in the workspace —
    // including mid-typing in the editor, the biggest run-loop speedup there is.
    root.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !runBtn.disabled && runBtn.style.display !== 'none') {
        e.preventDefault();
        runCode();
      }
    });

    // ── PRIMM phase / activity navigation ──
    function markPhaseDone(activity, phase) {
      var p = actProgress(activity.id);
      p.phases[phase] = true;
      var phases = phasesFor(activity);
      var lastCheckPhase = phases.indexOf('make') !== -1 ? 'make' : (phases.indexOf('modify') !== -1 ? 'modify' : null);
      var doneNow;
      if (lastCheckPhase) doneNow = !!p.phases[lastCheckPhase];
      else doneNow = phases.every(function (ph) { return p.phases[ph]; });
      if (doneNow && !p.done) {
        p.done = true;
        ctx.complete({ activity: activity.id });
      }
      saveProgress();
      renderActs();
      renderStepper();
    }

    function renderActs() {
      actsBar.innerHTML = '';
      activities.forEach(function (a) {
        var b = el('button', 'cslab-py-act' + (state.activity && a.id === state.activity.id ? ' active' : '') + (progress[a.id] && progress[a.id].done ? ' done' : ''), a.title);
        b.type = 'button';
        b.addEventListener('click', function () { selectActivity(a.id); });
        actsBar.appendChild(b);
      });
    }

    function renderStepper() {
      stepper.innerHTML = '';
      if (!state.activity) return;
      if (state.activity.sandbox) { stepper.style.display = 'none'; return; }
      stepper.style.display = '';
      var phases = phasesFor(state.activity);
      var p = actProgress(state.activity.id);
      phases.forEach(function (ph, i) {
        if (i > 0) stepper.appendChild(el('span', 'cslab-py-step-sep', '›'));
        var meta = PHASE_META[ph];
        var chip = el('button', 'cslab-py-step' + (ph === state.phase ? ' active' : '') + (p.phases[ph] ? ' done' : ''));
        chip.type = 'button';
        chip.textContent = meta.icon + ' ' + meta.label + (p.phases[ph] ? ' ✓' : '');
        chip.addEventListener('click', function () { showPhase(ph); });
        stepper.appendChild(chip);
      });
    }

    function selectActivity(id) {
      captureEditor();
      state.activity = activityById[id];
      var phases = phasesFor(state.activity);
      renderActs();
      showPhase(phases[0]);
    }

    function showPhase(phase) {
      captureEditor();
      state.phase = phase;
      feedback.className = 'cslab-feedback'; feedback.textContent = '';
      renderStepper();
      var a = state.activity;

      var meta = PHASE_META[phase];
      var briefHtml = '<div class="cslab-py-phasebadge">' + meta.icon + ' ' + meta.label + '</div>';
      if (phase === 'sandbox') briefHtml += a.intro || '';
      else if (phase === 'predict') briefHtml += a.predict.ask;
      else if (phase === 'run') briefHtml += '<p>Run the code and watch the console. Did it match your prediction?</p>';
      else if (phase === 'investigate') briefHtml += (a.investigate.intro || '') + '<ul class="cslab-py-invlist"><li>' + a.investigate.prompts.join('</li><li>') + '</li></ul>';
      else if (phase === 'modify') briefHtml += a.modify.goal;
      else if (phase === 'make') briefHtml += a.make.brief + (a.make.criteria ? '<p><strong>Success criteria:</strong></p><ul class="cslab-py-invlist"><li>' + a.make.criteria.join('</li><li>') + '</li></ul>' : '');
      briefBox.innerHTML = briefHtml;

      var isPredict = phase === 'predict';
      predictBox.style.display = isPredict ? '' : 'none';
      submitBtn.style.display = (phase === 'modify' || phase === 'make') ? '' : 'none';
      runBtn.style.display = isPredict ? 'none' : '';
      stopBtn.style.display = isPredict ? 'none' : '';
      resetBtn.style.display = isPredict ? 'none' : '';
      if (isPredict) buildPredictBox(a);

      // Phase changes always look at the program, not a data file.
      activeTab = 'main';
      mainCode = isPredict ? codeForPhase(a, 'predict') : loadCode(a.id, phase);
      renderTabs();
      renderTree();
      refreshEditorArea();
      refreshRunEnabled();
      if (inputsBox) inputsBox.value = ctx.store.get('inputs::' + a.id + '::' + phase, '');
    }

    function buildPredictBox(a) {
      predictBox.innerHTML = '';
      var ta = document.createElement('textarea');
      ta.placeholder = 'What will this program print? (Write your prediction here.)';
      ta.value = ctx.store.get('predict::' + a.id, '');
      ta.addEventListener('input', function () { ctx.store.set('predict::' + a.id, ta.value); });
      predictBox.appendChild(ta);
      var row = el('div', 'cslab-py-row');
      var revealBtn = btn('Reveal answer & continue to Run', 'secondary');
      row.appendChild(el('span', 'cslab-py-note', 'Have a go at predicting first — then reveal and run.'));
      row.appendChild(revealBtn);
      predictBox.appendChild(row);
      var reveal = el('div', 'cslab-py-reveal');
      reveal.style.display = 'none';
      reveal.innerHTML = '<strong>Answer:</strong> ' + a.predict.sample;
      predictBox.appendChild(reveal);
      revealBtn.addEventListener('click', function () {
        reveal.style.display = '';
        markPhaseDone(a, 'predict');
        showPhase('run');
      });
    }

    // ── initial render ──
    renderActs();
    editorReady.then(function () {
      selectActivity(activities[0].id);
      // Ln/Col readout — CodeMirror only; the fallback editor has no cursor
      // API, so its status bar just shows the font controls.
      if (editorInst && editorInst.cm) {
        var updatePos = function () {
          var c = editorInst.cm.getCursor();
          posLabel.textContent = 'Ln ' + (c.line + 1) + ', Col ' + (c.ch + 1);
        };
        editorInst.cm.on('cursorActivity', updatePos);
        updatePos();
      }
      applyFontSize(); // refresh() inside needs the editor to exist
    });
    renderTree();
    applySideCollapsed();
    applyFontSize();

    _activeUnmount = function () { clearTimeout(runTimer); terminateWorker(); };
  }

  if (typeof window !== 'undefined' && window.CsLab) {
    window.CsLab.registerTool('py-runner', {
      title: 'Python Lab', icon: '🐍',
      mount: mount,
      // Releases the live worker (and the WASM runtime it holds) when the
      // student leaves this tool — Back, or opening a different one.
      unmount: function () { if (_activeUnmount) { _activeUnmount(); _activeUnmount = null; } },
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normStdout: normStdout, checkStdout: checkStdout, checkFile: checkFile, runCheck: runCheck,
      filesArrayToObject: filesArrayToObject, filesObjectToArray: filesObjectToArray, textFileMap: textFileMap,
      validateFileName: validateFileName, validateSegment: validateSegment,
      parentOf: parentOf, baseName: baseName, joinPath: joinPath, extOf: extOf,
      isImagePath: isImagePath, isTextExt: isTextExt, editorModeFor: editorModeFor, buildTree: buildTree,
      crc32: crc32, buildZipChunks: buildZipChunks,
      phasesFor: phasesFor, codeForPhase: codeForPhase, checkForPhase: checkForPhase,
      activitiesFor: activitiesFor, ACTIVITIES: ACTIVITIES,
      STORY_SANDBOX: STORY_SANDBOX, DEFAULT_FILES_FOR_PAGE: DEFAULT_FILES_FOR_PAGE,
    };
  }
})();
