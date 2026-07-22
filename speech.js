/* speech.js — shared text-to-speech helper for the Spanish subject.
 *
 * Exposes globals: speak(text, opts), stopSpeaking(), voicesReady (Promise),
 * pickVoice(langPrefix), enhanceAudio(el), and the persisted prefs the student sets
 * in the on-page Audio panel (speed + voice). Mirrors math-render.js: ONE small
 * self-contained file, loaded on Spanish pages only (scaffolder slug=="spanish"
 * include), BEFORE /script.js.
 *
 * Contract (SPANISH-CONTENT-PLAN.md §8.1):
 *  - Output voice ONLY (Web Speech `speechSynthesis`). No recognition/ASR (D2).
 *  - Zero vendor bytes, zero CSP change — browser API.
 *  - Audible Spanish is marked with data-say="…". enhanceAudio walks a container and
 *    gives each [data-say] element a 🔊 button. data-listen REMOVES the written text
 *    (dictation/listen-and-choose) so only the audio remains.
 *  - Student controls: a persistent Audio panel sets PLAYBACK SPEED (0.5–1.25×) and,
 *    when the device has more than one Spanish voice, WHICH VOICE. Saved in
 *    localStorage (gcse_tts_rate / gcse_tts_voice) and honoured by every speak().
 *  - Self-installs: on DOMContentLoaded it enhances the page, injects the panel, and
 *    observes <main> so activities rendered later (tab switches, quiz rebuilds) get
 *    audio automatically. Pages NEVER call speechSynthesis directly.
 *  - Absent/broken engine → buttons show a muted state, never throws.
 */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var SUPPORTED = !!synth && typeof global.SpeechSynthesisUtterance === 'function';

  var KEY_RATE = 'gcse_tts_rate';
  var KEY_VOICE = 'gcse_tts_voice';
  var RATE_MIN = 0.5, RATE_MAX = 1.25, RATE_DEFAULT = 0.9;

  // ---- persisted prefs -------------------------------------------------------
  // localStorage access can THROW (privacy mode, opaque origin), not just return null —
  // every read/write is guarded so audio never breaks the page.
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getRate() {
    var r = parseFloat(lsGet(KEY_RATE));
    if (isNaN(r)) return RATE_DEFAULT;
    return Math.min(RATE_MAX, Math.max(RATE_MIN, r));
  }
  function setRate(r) { lsSet(KEY_RATE, String(r)); }
  function getVoicePref() { return lsGet(KEY_VOICE) || ''; }
  function setVoicePref(uri) { try { localStorage.setItem(KEY_VOICE, uri || ''); } catch (e) {} }

  // ---- voice loading (async on most browsers) --------------------------------
  var voicesReady = new Promise(function (resolve) {
    if (!SUPPORTED) { resolve([]); return; }
    var got = synth.getVoices();
    if (got && got.length) { resolve(got); return; }
    var done = false;
    function settle() { if (done) return; done = true; resolve(synth.getVoices() || []); }
    synth.addEventListener && synth.addEventListener('voiceschanged', settle);
    var tries = 0;
    var iv = setInterval(function () {
      var v = synth.getVoices();
      if ((v && v.length) || ++tries > 20) { clearInterval(iv); settle(); }
    }, 150);
  });

  function spanishVoices() {
    var voices = SUPPORTED ? (synth.getVoices() || []) : [];
    return voices.filter(function (v) { return (v.lang || '').toLowerCase().indexOf('es') === 0; });
  }

  function pickVoice() {
    var voices = SUPPORTED ? (synth.getVoices() || []) : [];
    var lc = function (v) { return (v.lang || '').toLowerCase().replace('_', '-'); };
    // 1) the student's saved choice, if still available
    var pref = getVoicePref();
    if (pref) {
      var chosen = voices.find(function (v) { return v.voiceURI === pref || v.name === pref; });
      if (chosen) return chosen;
    }
    // 2) Iberian es-ES, then any es-*, else engine default
    return voices.find(function (v) { return lc(v) === 'es-es'; })
        || voices.find(function (v) { return lc(v).indexOf('es-') === 0; })
        || voices.find(function (v) { return lc(v).indexOf('es') === 0; })
        || null;
  }

  // ---- speaking --------------------------------------------------------------
  function stopSpeaking() { if (SUPPORTED) { try { synth.cancel(); } catch (e) {} } }

  function speak(text, opts) {
    if (!SUPPORTED || !text) return false;
    opts = opts || {};
    stopSpeaking();
    try {
      var u = new global.SpeechSynthesisUtterance(String(text));
      u.lang = opts.lang || 'es-ES';
      u.rate = typeof opts.rate === 'number' ? opts.rate : getRate();
      if (typeof opts.pitch === 'number') u.pitch = opts.pitch;
      var v = pickVoice();
      if (v) u.voice = v;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }

  // ---- audio buttons ---------------------------------------------------------
  var BTN_CLASS = 'say-btn';

  function makeButton(text, listenOnly) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = BTN_CLASS + (SUPPORTED ? '' : ' say-btn--muted');
    b.setAttribute('aria-label', listenOnly ? 'Play audio' : 'Hear it in Spanish');
    b.title = SUPPORTED ? 'Listen' : 'Audio not available in this browser';
    b.textContent = '🔊';
    b.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      if (!SUPPORTED) return;
      b.classList.add('say-btn--active');
      speak(text);
      global.setTimeout(function () { b.classList.remove('say-btn--active'); }, 600);
    });
    return b;
  }

  function enhanceAudio(container) {
    if (!container || !container.querySelectorAll) return;
    // include the container itself if it carries data-say (used by the flashcard hook)
    var nodes = [];
    if (container.getAttribute && container.getAttribute('data-say') != null && !container.hasAttribute('data-say-done')) nodes.push(container);
    var found = container.querySelectorAll('[data-say]:not([data-say-done])');
    for (var k = 0; k < found.length; k++) nodes.push(found[k]);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute('data-say-done', '1');
      var text = el.getAttribute('data-say');
      if (!text) continue;
      var listenOnly = el.hasAttribute('data-listen');
      // For listen-only prompts the written Spanish IS the answer — remove it so the
      // student must decode the audio (the text to speak survives in data-say).
      if (listenOnly) { el.textContent = ''; el.classList.add('say-hidden'); }
      var btn = makeButton(text, listenOnly);
      if (el.firstChild) el.insertBefore(btn, el.firstChild);
      else el.appendChild(btn);
    }
  }

  // ---- the student Audio panel (speed + voice) -------------------------------
  function injectStyles() {
    if (document.getElementById('speechStyles')) return;
    var css = ''
      + '.say-btn{border:1px solid var(--line,#d9dee8);background:var(--card,#fff);border-radius:999px;padding:1px 8px;margin-right:7px;font-size:.85em;line-height:1.4;cursor:pointer;vertical-align:baseline;transition:transform .12s,background .12s}'
      + '.say-btn:hover{background:var(--soft,#eef1ff)}'
      + '.say-btn--active{transform:scale(1.15)}'
      + '.say-btn--muted{opacity:.45;cursor:not-allowed}'
      + '.say-hidden{font-style:italic;color:var(--mid,#5e6b82)}'
      + '.say-hidden::after{content:"🎧 escucha";font-style:normal;font-size:.85em;color:var(--mid,#5e6b82);margin-left:2px}'
      // Sits to the RIGHT of the theme switcher (#gcseThemeBtn at left:16px), so the two
      // settings controls never overlap. High z-index so it is never buried by page chrome.
      + '#ttsControls{position:fixed;left:72px;bottom:16px;z-index:9984;font-family:inherit}'
      + '#ttsToggle{height:46px;padding:0 15px;border-radius:23px;border:1px solid var(--line,#d9dee8);background:var(--card,#fff);color:var(--ink,#172033);font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(20,30,55,.18);display:inline-flex;align-items:center;gap:7px;white-space:nowrap}'
      + '#ttsToggle:hover{transform:translateY(-1px)}'
      + '#ttsPanel{position:absolute;left:0;bottom:56px;width:260px;background:var(--card,#fff);color:var(--ink,#172033);border:1px solid var(--line,#d9dee8);border-radius:14px;box-shadow:0 14px 40px rgba(20,30,55,.22);padding:14px;display:none}'
      + '#ttsPanel.open{display:block}'
      + '#ttsPanel h4{margin:0 0 10px;font-size:14px;letter-spacing:.02em}'
      + '#ttsPanel label{display:block;font-size:12px;font-weight:600;color:var(--mid,#5e6b82);margin:10px 0 4px}'
      + '#ttsPanel input[type=range]{width:100%}'
      + '#ttsPanel select{width:100%;padding:7px;border-radius:9px;border:1px solid var(--line,#d9dee8);background:var(--bg,#fff);color:inherit;font:inherit}'
      + '#ttsRateVal{float:right;font-weight:700;color:var(--ink,#172033)}'
      + '#ttsTest{margin-top:12px;width:100%;padding:9px;border:0;border-radius:10px;background:var(--purple,#6c4cff);color:#fff;font-weight:700;cursor:pointer}'
      + '#ttsPanel .tts-note{font-size:11px;color:var(--mid,#5e6b82);margin-top:8px}';
    var s = document.createElement('style');
    s.id = 'speechStyles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function injectControls() {
    if (!SUPPORTED || document.getElementById('ttsControls')) return;
    injectStyles();
    var wrap = document.createElement('div');
    wrap.id = 'ttsControls';
    wrap.innerHTML =
      '<button id="ttsToggle" type="button" title="Audio settings — speed &amp; voice" aria-label="Audio settings: speed and voice">🔊 Audio</button>' +
      '<div id="ttsPanel" role="dialog" aria-label="Audio settings">' +
        '<h4>🔊 Audio <span id="ttsRateVal"></span></h4>' +
        '<label for="ttsRate">Speed</label>' +
        '<input id="ttsRate" type="range" min="' + RATE_MIN + '" max="' + RATE_MAX + '" step="0.05">' +
        '<label for="ttsVoice">Voice</label>' +
        '<select id="ttsVoice"><option value="">System default</option></select>' +
        '<div class="tts-note" id="ttsVoiceNote"></div>' +
        '<button id="ttsTest" type="button">▶ Probar la voz</button>' +
      '</div>';
    document.body.appendChild(wrap);

    var toggle = wrap.querySelector('#ttsToggle');
    var panel = wrap.querySelector('#ttsPanel');
    var rate = wrap.querySelector('#ttsRate');
    var rateVal = wrap.querySelector('#ttsRateVal');
    var voiceSel = wrap.querySelector('#ttsVoice');
    var voiceNote = wrap.querySelector('#ttsVoiceNote');

    function showRate() { rateVal.textContent = Number(rate.value).toFixed(2) + '×'; }
    rate.value = getRate(); showRate();
    rate.addEventListener('input', function () { showRate(); setRate(Number(rate.value)); });

    toggle.addEventListener('click', function () { panel.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) panel.classList.remove('open');
    });
    wrap.querySelector('#ttsTest').addEventListener('click', function () {
      speak('Hola. Se debe comer una dieta equilibrada.', { rate: Number(rate.value) });
    });

    function fillVoices() {
      var all = SUPPORTED ? (synth.getVoices() || []) : [];
      var isEs = function (v) { return (v.lang || '').toLowerCase().indexOf('es') === 0; };
      var es = all.filter(isEs);
      var other = all.filter(function (v) { return !isEs(v); });
      voiceSel.innerHTML = '<option value="">Default Spanish voice</option>';
      function addOpt(v, spanish) {
        var o = document.createElement('option');
        o.value = v.voiceURI || v.name;
        o.textContent = (spanish ? '🇪🇸 ' : '') + v.name + ' — ' + v.lang;
        voiceSel.appendChild(o);
      }
      es.forEach(function (v) { addOpt(v, true); });        // Spanish voices first
      other.forEach(function (v) { addOpt(v, false); });    // then any others, so switching always works
      voiceSel.value = getVoicePref();
      if (!all.length) {
        voiceNote.textContent = 'No voices detected yet — reopen this panel, or add a Spanish voice in your device settings.';
      } else if (es.length) {
        voiceNote.textContent = es.length + ' Spanish voice' + (es.length > 1 ? 's' : '') + ' (🇪🇸) available. Pick es-ES for Spain.';
      } else {
        voiceNote.textContent = 'No dedicated Spanish voice on this device — install one in your OS for the best pronunciation.';
      }
    }
    voiceSel.addEventListener('change', function () {
      setVoicePref(voiceSel.value);
      speak('Hola, ¿qué tal?', { rate: Number(rate.value) }); // preview the new voice
    });
    fillVoices();
    voicesReady.then(fillVoices); // repopulate once async voices arrive
  }

  // ---- self-install ----------------------------------------------------------
  function enhanceRoot() {
    var root = document.querySelector('main') || document.body;
    if (!root) return;
    enhanceAudio(root);
    // Surface the student Audio panel (speed + voice) only once the page actually
    // has audible content. Topic pages always have [data-say] in their static
    // markup, so it appears immediately; the shared activity pages (daily revise,
    // task, review) render questions asynchronously, so the observer re-runs this
    // and the panel appears the moment a Spanish question is drawn — and never on
    // Business/Economics pages, which carry no [data-say] at all.
    if (document.querySelector('[data-say]')) injectControls();
  }
  function install() {
    enhanceRoot();
    var root = document.querySelector('main') || document.body;
    if (root && global.MutationObserver) {
      var mo = new MutationObserver(function () {
        clearTimeout(global.__sayT);
        global.__sayT = setTimeout(enhanceRoot, 30);
      });
      mo.observe(root, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); });
  } else {
    setTimeout(install, 0);
  }

  global.speak = speak;
  global.stopSpeaking = stopSpeaking;
  global.pickVoice = pickVoice;
  global.voicesReady = voicesReady;
  global.enhanceAudio = enhanceAudio;
  global.speechSupported = SUPPORTED;
})(window);
