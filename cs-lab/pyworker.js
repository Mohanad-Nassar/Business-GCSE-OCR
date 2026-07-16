// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Python worker (T1 pyRunner, CS-CONTENT-PLAN.md §7.1)
//
// Same-origin classic Web Worker running real CPython via Pyodide
// (jsDelivr). Pyodide loads as soon as this worker is created — the main
// thread (cs-lab/tools/py-runner.js) creates the worker lazily, only on
// first Run / "Start Python", so nothing is fetched before then.
//
// ── LIVE console input (the important bit) ──
// Python's input() is SYNCHRONOUS: when student code calls input(), the
// C runtime calls our JS stdin callback and expects a line back there and
// then. To let the student type into the console *at that moment* (rather
// than pre-supplying answers), the callback BLOCKS this worker thread on
// Atomics.wait() against a SharedArrayBuffer the main thread shares in with
// each run. The main thread shows an inline input box, and when the student
// presses Enter it writes the UTF-8 bytes into the SAB and Atomics.notify()s
// us awake. Blocking is legal on a Worker thread, and a runaway loop is
// still killable because the main thread uses worker.terminate() (which
// works even while we're blocked) — never a message we'd have to be awake
// to read.
//
// Cross-origin isolation (COOP+COEP, set on /subjects/computer-science/* in
// netlify.toml) is what makes SharedArrayBuffer available. If the page isn't
// isolated (older browser, headers missing), the main thread runs us in
// BATCH mode instead: it passes a fixed `inputs` array and our stdin pops
// from that queue — the pre-2026-07-13 behaviour, kept purely as a fallback.
//
// ── SAB layout (interactive mode) ──
//   Int32Array(sab, 0, 2):  [0] control  (0 = worker waiting for input,
//                                          1 = a line is ready to read,
//                                         -1 = EOF / stop)
//                           [1] byteLength of the pending input line
//   Uint8Array(sab, 8):     the input line's UTF-8 bytes (incl. trailing \n)
//
// ── Message protocol ──
// Main -> Worker:
//   { type:'run', code, files, folders, interactive, sab?, inputs? }
//   files = { "<relative/path>": { t:'text'|'b64', c } } (see the files
//   section below); folders = list of dir paths (so empty folders exist)
// Worker -> Main:
//   { type:'progress', text }        loading-stage notices (first spin-up)
//   { type:'ready' }                 Pyodide loaded; ready for 'run'
//   { type:'load-error', message }   Pyodide/CDN failed to load (fatal)
//   { type:'stdout', text }          a chunk of stdout (may be a partial
//                                    line — input() prompts arrive this way,
//                                    which is why stdout is streamed with
//                                    `write`, not line-batched)
//   { type:'stderr', text }          a chunk of stderr (Python tracebacks)
//   { type:'input-request' }         about to block for a line of input
//                                    (interactive mode) — main enables the
//                                    inline console input and pauses the
//                                    run-timeout clock
//   { type:'done', files }           run finished (success, Python error, or
//                                    EOF); files = { name: contents } read
//                                    back from the FS (binary / >200KB / non-
//                                    UTF8 files skipped)
//   { type:'error', message }        worker-level failure (not a Python error)
// ══════════════════════════════════════════════════════════════

'use strict';

var PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
var WORK_DIR = '/home/pyodide';
var MAX_READBACK_BYTES = 200 * 1024;

var pyodideReadyPromise = null;

// Run before each student program. Two jobs:
//  1. Wipe student-defined globals left over from the previous run so each Run
//     starts clean (keeps our own `_cslab*` helpers and dunder names).
//  2. Replace the built-in input() with a bridge to JS (`_cslab_read_line`).
//     We DON'T use Pyodide's setStdin for input(): its line-buffering re-calls
//     the stdin callback in ways that hang a blocking, line-at-a-time read.
//     Patching input() directly is fully predictable — the bridge writes the
//     prompt, does one blocking read, and returns exactly one line (or raises
//     EOFError when the read returns None, e.g. on Stop).
var PREAMBLE = [
  'for _cslab_name in list(globals().keys()):',
  "    if not (_cslab_name.startswith('_cslab') or _cslab_name.startswith('__')):",
  '        del globals()[_cslab_name]',
  '',
  'import builtins as _cslab_builtins',
  '',
  "def _cslab_input(_cslab_prompt=''):",
  '    _cslab_line = _cslab_read_line(_cslab_prompt)',
  '    if _cslab_line is None:',
  "        raise EOFError('no more input')",
  '    return _cslab_line',
  '',
  '_cslab_builtins.input = _cslab_input',
].join('\n');

function post(msg) { postMessage(msg); }

var _outDecoder = new TextDecoder('utf-8');
var _errDecoder = new TextDecoder('utf-8');

async function loadPyodideRuntime() {
  importScripts(PYODIDE_CDN + 'pyodide.js');
  post({ type: 'progress', text: 'Loading the Python runtime (first time only — later runs are instant)…' });
  var pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
  // Stream stdout/stderr a chunk at a time (not line-batched) so that an
  // input() prompt — written to stdout with no trailing newline — reaches
  // the console immediately, right before the input box appears.
  pyodide.setStdout({
    write: function (buf) {
      var text = _outDecoder.decode(buf, { stream: true });
      if (text) post({ type: 'stdout', text: text });
      return buf.length;
    },
  });
  pyodide.setStderr({
    write: function (buf) {
      var text = _errDecoder.decode(buf, { stream: true });
      if (text) post({ type: 'stderr', text: text });
      return buf.length;
    },
  });
  post({ type: 'ready' });
  return pyodide;
}

function getPyodide() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = loadPyodideRuntime().catch(function (err) {
      pyodideReadyPromise = null; // let the next Run try again from scratch
      throw err;
    });
  }
  return pyodideReadyPromise;
}

// Build the line-reader for this run — called by the input() bridge, once per
// input() call. Returns exactly one line as a plain string (NO trailing
// newline — input() strips it anyway) or null for EOF / Stop.
//   Interactive: block on the SAB until the main thread writes a typed line.
//   Batch (no isolation): pop from a pre-supplied queue and echo the value.
function makeReadLine(data) {
  if (data.interactive && data.sab) {
    var ctrl = new Int32Array(data.sab, 0, 2);
    var bytes = new Uint8Array(data.sab, 8);
    return function () {
      post({ type: 'input-request' });
      Atomics.store(ctrl, 0, 0);
      Atomics.wait(ctrl, 0, 0);          // sleep until main sets control != 0
      if (Atomics.load(ctrl, 0) === -1) return null; // Stop
      var len = Atomics.load(ctrl, 1);
      if (len <= 0) return '';           // empty line (student just pressed Enter)
      return new TextDecoder('utf-8').decode(bytes.slice(0, len));
    };
  }
  var queue = (data.inputs || []).slice();
  var pos = 0;
  return function () {
    if (pos >= queue.length) return null; // EOF
    var line = queue[pos++];
    post({ type: 'stdout', text: line + '\n' }); // echo so it appears after the prompt
    return line;
  };
}

// ── Files: nested folders + binary support (IDE workspace, 2026-07-13) ──
// Wire format both directions: files = { "<relative/path>": { t:'text'|'b64',
// c:<string> } }. Text stays a plain string; binary (images the student
// uploaded, or non-UTF8 files the code wrote) travels as base64. `folders` is
// a list of relative dir paths so empty folders survive the round trip.

function u8ToB64(u8) {
  var CHUNK = 0x8000, parts = [];
  for (var i = 0; i < u8.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(''));
}

function b64ToU8(b64) {
  var bin = atob(b64);
  var u8 = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function ensureDir(FS, relDir) {
  if (!relDir) return;
  var cur = WORK_DIR;
  relDir.split('/').forEach(function (part) {
    if (!part) return;
    cur += '/' + part;
    try { FS.mkdir(cur); } catch (e) { /* already exists */ }
  });
}

function writeFiles(pyodide, files, folders) {
  var FS = pyodide.FS;
  (folders || []).forEach(function (d) { try { ensureDir(FS, d); } catch (e) {} });
  Object.keys(files || {}).forEach(function (name) {
    try {
      var entry = files[name];
      var slash = name.lastIndexOf('/');
      if (slash > 0) ensureDir(FS, name.slice(0, slash));
      var content = (entry && entry.t === 'b64') ? b64ToU8(entry.c) : String(entry && entry.c != null ? entry.c : entry);
      FS.writeFile(WORK_DIR + '/' + name, content);
    } catch (e) { /* an odd filename from the student — skip it, don't fail the run */ }
  });
}

function walkDir(FS, dir, rel, outFiles, outDirs) {
  var names;
  try { names = FS.readdir(dir); } catch (e) { return; }
  names.forEach(function (name) {
    if (name === '.' || name === '..') return;
    var path = dir + '/' + name;
    var relPath = rel ? rel + '/' + name : name;
    try {
      var stat = FS.stat(path);
      if (FS.isDir(stat.mode)) {
        outDirs.push(relPath);
        walkDir(FS, path, relPath, outFiles, outDirs);
        return;
      }
      if (stat.size > MAX_READBACK_BYTES) return;
      var raw = FS.readFile(path); // Uint8Array
      try {
        outFiles[relPath] = { t: 'text', c: new TextDecoder('utf-8', { fatal: true }).decode(raw) };
      } catch (e2) {
        outFiles[relPath] = { t: 'b64', c: u8ToB64(raw) };
      }
    } catch (e) { /* vanished mid-read — skip it */ }
  });
}

function readFilesBack(pyodide) {
  var files = {}, dirs = [];
  walkDir(pyodide.FS, WORK_DIR, '', files, dirs);
  return { files: files, dirs: dirs };
}

async function handleRun(data) {
  var pyodide;
  try {
    pyodide = await getPyodide();
  } catch (err) {
    post({ type: 'load-error', message: (err && err.message) || String(err) });
    return;
  }

  try {
    // The input() bridge: Python calls _cslab_read_line(prompt); we write the
    // prompt to stdout (so it appears inline, right before the input box),
    // then do one blocking read and hand the line back. Returning null makes
    // the patched input() raise EOFError. (Pyodide converts the Python str
    // prompt to a JS string and our returned string back to a Python str.)
    var readLine = makeReadLine(data);
    pyodide.globals.set('_cslab_read_line', function (prompt) {
      if (prompt !== undefined && prompt !== null && prompt !== '') {
        post({ type: 'stdout', text: String(prompt) });
      }
      return readLine();
    });
    writeFiles(pyodide, data.files, data.folders);
    pyodide.runPython(PREAMBLE);
  } catch (err) {
    post({ type: 'error', message: 'Could not prepare the Python environment: ' + ((err && err.message) || err) });
    return;
  }

  try {
    await pyodide.runPythonAsync(data.code || '');
  } catch (err) {
    // Shown verbatim by the main thread — reading this traceback IS the
    // 2.5.2 error-diagnostics lesson, so it must not be softened. (A null
    // stdin at EOF surfaces here as EOFError, which reads fine.)
    post({ type: 'stderr', text: '\n' + ((err && err.message) || String(err)) });
  }

  var snapshot = { files: {}, dirs: [] };
  try {
    snapshot = readFilesBack(pyodide);
  } catch (e) { /* leave empty rather than fail an otherwise-fine run */ }

  post({ type: 'done', files: snapshot.files, dirs: snapshot.dirs });
}

self.onmessage = function (ev) {
  var data = ev.data || {};
  if (data.type === 'run') {
    handleRun(data).catch(function (err) {
      post({ type: 'error', message: (err && err.message) || String(err) });
    });
  }
};

self.onerror = function (msg) {
  post({ type: 'error', message: 'Worker error: ' + msg });
};

// Start loading Pyodide the instant this worker exists — do NOT wait for a
// 'run' message. The main thread waits for 'ready' before it sends 'run', so
// if loading only began on 'run' neither side would move first (a deadlock,
// the 2026-07-13 bug). getPyodide() is memoized, so this and handleRun()'s
// own call share one in-flight load.
getPyodide().catch(function (err) {
  post({ type: 'load-error', message: (err && err.message) || String(err) });
});
