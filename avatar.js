// ══════════════════════════════════════════════════════════════
// AVATAR — the single source of the rewards-store character art (WP-2).
//
// Renders a student's equipped avatar: one of the 16 cast characters, in a
// chosen accent (skin), on an optional background, in an optional frame, with an
// optional pet. Plain <script src="/avatar.js"> like the rest of the shared JS
// (no build step); exposes a namespaced global `VidyaAvatar`.
//
// The cast is 16 deliberately-different characters (docs/REWARDS-STORE-PLAN.md),
// so the customisable cosmetics are the ones that work on ANY of them —
// recolour (skin), background, frame, pet. Per-character wearables (hats/outfits)
// are NOT practical across a fox, an inkblot and a pixel sprite and are out of
// scope for v1 (the shop's hat/outfit rows stay dormant until per-character art
// exists).
//
// SECURITY: everything rendered here comes from FIXED maps keyed by item id —
// character ids are validated against CHARACTERS, the accent comes from the SKINS
// allowlist (never free client text), and no username/user text is rendered here
// (that's account-cluster.js, which escapes it). So a consumer can innerHTML the
// output safely as long as it passes item ids, not arbitrary strings.
//
// Consumed by: account-cluster.js (header avatar), the leaderboard, and
// locker.html (the customiser). All art uses `var(--acc)` so one CSS variable
// recolours a whole character — that's what makes skins/themes almost free.
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Shared <defs> (namespaced `va-` so nothing here can clash with the app's
  // own SVG filter/gradient ids). Injected once, referenced document-wide. ──
  var DEFS_ID = 'vidya-avatar-defs';
  function ensureDefs() {
    if (document.getElementById(DEFS_ID)) return;
    var host = document.body || document.documentElement;
    if (!host) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', DEFS_ID);
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML =
      '<defs>' +
      '<linearGradient id="va-molten" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a4d"/><stop offset=".5" stop-color="#ff5f3c"/><stop offset="1" stop-color="#d62f34"/></linearGradient>' +
      '<linearGradient id="va-chassis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f4fb"/><stop offset="1" stop-color="#c8cede"/></linearGradient>' +
      '<linearGradient id="va-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1ff"/><stop offset="1" stop-color="#cdd3f0"/></linearGradient>' +
      '<linearGradient id="va-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#f6b32e"/><stop offset="1" stop-color="#d68908"/></linearGradient>' +
      '<linearGradient id="va-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6b8"/><stop offset="1" stop-color="#ff9d8a"/></linearGradient>' +
      '<linearGradient id="va-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2260"/><stop offset="1" stop-color="#0e1030"/></linearGradient>' +
      '<filter id="va-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.5"/></filter>' +
      '</defs>';
    host.appendChild(svg);
  }

  // ── The 16 characters (viewBox 0 0 220 260, inner markup only). Every
  // accent-bearing shape uses var(--acc). Authored in the character-concepts
  // studio; this is their production home. ──
  var CHARACTERS = {
    nova: function () { return ''
      + '<ellipse cx="110" cy="104" rx="74" ry="23" fill="none" stroke="var(--acc)" stroke-width="2.5" opacity=".55" transform="rotate(-16 110 104)"/>'
      + '<circle cx="182" cy="86" r="4.5" fill="#f6ad2f"/>'
      + '<rect x="82" y="150" width="56" height="12" rx="6" fill="#13233a"/>'
      + '<ellipse cx="76" cy="160" rx="17" ry="14" fill="#2b2952"/><ellipse cx="144" cy="160" rx="17" ry="14" fill="#2b2952"/>'
      + '<path d="M80 154 L140 154 L150 226 Q110 238 70 226 Z" fill="#242247"/>'
      + '<path d="M80 154 L140 154 L150 226 Q110 238 70 226 Z" fill="none" stroke="var(--acc)" stroke-width="2" opacity=".65"/>'
      + '<path d="M110 160 V228" stroke="var(--acc)" stroke-width="1.4" opacity=".35"/>'
      + '<circle cx="110" cy="178" r="6" fill="var(--acc)"/><circle cx="110" cy="178" r="11" fill="var(--acc)" opacity=".3" filter="url(#va-glow)"/>'
      + '<rect x="98" y="140" width="24" height="16" rx="5" fill="#1a1836"/>'
      + '<circle cx="110" cy="102" r="45" fill="url(#va-glass)"/><circle cx="110" cy="102" r="45" fill="none" stroke="#c7ccec" stroke-width="3"/>'
      + '<path d="M80 96 Q110 77 140 96 Q143 119 128 127 Q110 133 92 127 Q77 119 80 96 Z" fill="#0b0f2c"/>'
      + '<path d="M80 96 Q110 77 140 96 Q143 119 128 127 Q110 133 92 127 Q77 119 80 96 Z" fill="none" stroke="var(--acc)" stroke-width="2" opacity=".8"/>'
      + '<rect x="91" y="101" width="15" height="6.5" rx="3.2" fill="var(--acc)"/><rect x="114" y="101" width="15" height="6.5" rx="3.2" fill="var(--acc)"/>'
      + '<rect x="91" y="101" width="15" height="6.5" rx="3.2" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/><rect x="114" y="101" width="15" height="6.5" rx="3.2" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/>'
      + '<path d="M90 90 Q99 100 95 114" stroke="#fff" stroke-width="3" opacity=".18" fill="none"/>'
      + '<path d="M110 57 V44" stroke="#c7ccec" stroke-width="3"/>'
      + '<path d="M110 40 l1.8 5.4 5.4 1.8 -5.4 1.8 -1.8 5.4 -1.8 -5.4 -5.4 -1.8 5.4 -1.8 z" fill="#f6ad2f"/>'; },
    vesper: function () { return ''
      + '<path d="M60 240 Q62 152 90 122 L130 122 Q158 152 160 240 Q110 254 60 240 Z" fill="#1a1533"/>'
      + '<path d="M60 240 Q62 152 90 122" fill="none" stroke="var(--acc)" stroke-width="1.6" opacity=".45"/>'
      + '<path d="M158 240 Q158 152 130 122" fill="none" stroke="var(--acc)" stroke-width="1.6" opacity=".2"/>'
      + '<path d="M90 122 Q110 134 130 122 L150 170 Q110 152 70 170 Z" fill="#241c40"/>'
      + '<path d="M110 40 C71 42 61 96 82 128 L138 128 C159 96 149 42 110 40 Z" fill="#2b2149"/>'
      + '<path d="M110 40 C71 42 61 96 82 128" fill="none" stroke="var(--acc)" stroke-width="1.6" opacity=".5"/>'
      + '<path d="M87 90 Q110 82 133 90 Q136 120 110 126 Q84 120 87 90 Z" fill="#070510"/>'
      + '<rect x="94" y="101" width="15" height="5" rx="2.5" fill="var(--acc)" transform="rotate(-9 101 103)"/>'
      + '<rect x="111" y="101" width="15" height="5" rx="2.5" fill="var(--acc)" transform="rotate(9 119 103)"/>'
      + '<rect x="94" y="101" width="15" height="5" rx="2.5" fill="var(--acc)" opacity=".6" filter="url(#va-glow)" transform="rotate(-9 101 103)"/>'
      + '<rect x="111" y="101" width="15" height="5" rx="2.5" fill="var(--acc)" opacity=".6" filter="url(#va-glow)" transform="rotate(9 119 103)"/>'
      + '<path d="M110 80 l3.4 5.6 -3.4 5.6 -3.4 -5.6 z" fill="var(--acc)"/>'
      + '<g transform="translate(150,176)"><circle r="14" fill="var(--acc)" opacity=".2" filter="url(#va-glow)"/><path d="M0 -11 L8 0 L0 11 L-8 0 Z" fill="none" stroke="var(--acc)" stroke-width="2.4"/><path d="M0 -5 L4 0 L0 5 L-4 0 Z" fill="#f6ad2f"/></g>'; },
    byte: function () { return ''
      + '<path d="M110 46 V33" stroke="#aeb6c8" stroke-width="3"/><circle cx="110" cy="29" r="5" fill="#f6ad2f"/><circle cx="110" cy="29" r="10" fill="#f6ad2f" opacity=".3" filter="url(#va-glow)"/>'
      + '<rect x="70" y="72" width="9" height="22" rx="3" fill="#c3cad9"/><rect x="141" y="72" width="9" height="22" rx="3" fill="#c3cad9"/>'
      + '<rect x="76" y="50" width="68" height="62" rx="17" fill="url(#va-chassis)"/><rect x="76" y="50" width="68" height="62" rx="17" fill="none" stroke="#aab2c6" stroke-width="2.5"/>'
      + '<rect x="84" y="60" width="52" height="42" rx="11" fill="#0c1220"/><rect x="84" y="60" width="52" height="42" rx="11" fill="none" stroke="var(--acc)" stroke-width="1.5" opacity=".6"/>'
      + '<rect x="93" y="74" width="10" height="13" rx="4.5" fill="var(--acc)"/><rect x="117" y="74" width="10" height="13" rx="4.5" fill="var(--acc)"/>'
      + '<rect x="93" y="74" width="10" height="13" rx="4.5" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/><rect x="117" y="74" width="10" height="13" rx="4.5" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/>'
      + '<path d="M98 93 q12 7 24 0" stroke="var(--acc)" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      + '<rect x="101" y="110" width="18" height="12" fill="#aeb6c8"/>'
      + '<rect x="56" y="128" width="15" height="46" rx="7.5" fill="#cfd5e2"/><rect x="149" y="128" width="15" height="46" rx="7.5" fill="#cfd5e2"/>'
      + '<rect x="72" y="122" width="76" height="74" rx="19" fill="url(#va-chassis)"/><rect x="72" y="122" width="76" height="74" rx="19" fill="none" stroke="#aab2c6" stroke-width="2.5"/>'
      + '<circle cx="110" cy="150" r="9" fill="var(--acc)"/><circle cx="110" cy="150" r="15" fill="var(--acc)" opacity=".3" filter="url(#va-glow)"/>'
      + '<path d="M86 172 h48" stroke="#aab2c6" stroke-width="2"/><path d="M96 182 h28" stroke="#aab2c6" stroke-width="2"/>'
      + '<rect x="87" y="196" width="17" height="20" rx="6" fill="#c3cad9"/><rect x="116" y="196" width="17" height="20" rx="6" fill="#c3cad9"/>'; },
    ember: function () { return ''
      + '<path d="M142 196 q32 6 26 -32 q-1 22 -20 20 z" fill="url(#va-molten)"/>'
      + '<path d="M92 82 L80 48 L104 76 Z" fill="url(#va-molten)"/><path d="M128 82 L140 48 L116 76 Z" fill="url(#va-molten)"/>'
      + '<path d="M110 74 C84 78 70 114 76 154 C80 192 95 212 110 212 C125 212 140 192 144 154 C150 114 136 78 110 74 Z" fill="url(#va-molten)"/>'
      + '<path d="M110 62 c6 -13 -5 -19 -3 -30 c9 8 20 13 13 30 z" fill="var(--acc)"/><circle cx="109" cy="34" r="3" fill="#ffe08a"/>'
      + '<ellipse cx="110" cy="152" rx="25" ry="36" fill="#ffd7a6" opacity=".45"/>'
      + '<path d="M82 110 q13 -7 25 1" stroke="#b8331b" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
      + '<ellipse cx="97" cy="122" rx="13.5" ry="15.5" fill="#fff"/><circle cx="99" cy="126" r="7" fill="#241009"/><circle cx="101.5" cy="123" r="2.4" fill="#fff"/>'
      + '<ellipse cx="128" cy="123" rx="9" ry="10.5" fill="#fff"/><circle cx="129" cy="126" r="5" fill="#241009"/><circle cx="130.5" cy="124" r="1.6" fill="#fff"/>'
      + '<path d="M90 150 q18 15 37 4" stroke="#7a2412" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
      + '<path d="M113 152 l3.5 9 4 -6 z" fill="#fff"/>'
      + '<path d="M74 152 q-15 6 -14 21" stroke="url(#va-molten)" stroke-width="11" fill="none" stroke-linecap="round"/>'
      + '<path d="M146 152 q15 6 14 21" stroke="url(#va-molten)" stroke-width="11" fill="none" stroke-linecap="round"/>'; },
    kitsu: function () { return ''
      + '<path d="M80 158 Q36 150 42 104 Q48 132 72 128 Q56 150 80 158 Z" fill="#d07b3a"/>'
      + '<path d="M50 110 Q47 126 66 127" fill="none" stroke="#fbe9d2" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M82 128 Q82 116 96 114 L124 114 Q138 116 138 128 L147 212 Q110 224 73 212 Z" fill="var(--acc)"/>'
      + '<path d="M92 116 Q110 130 128 116" fill="none" stroke="#00000033" stroke-width="4"/>'
      + '<path d="M110 130 V150" stroke="#00000033" stroke-width="3"/>'
      + '<ellipse cx="98" cy="182" rx="10" ry="8" fill="#fbe9d2"/><ellipse cx="122" cy="182" rx="10" ry="8" fill="#fbe9d2"/>'
      + '<path d="M86 66 L74 30 L102 58 Z" fill="#d9803f"/><path d="M89 60 L82 40 L99 56 Z" fill="var(--acc)"/>'
      + '<path d="M134 66 L146 30 L118 58 Z" fill="#d9803f"/><path d="M131 60 L138 40 L121 56 Z" fill="var(--acc)"/>'
      + '<path d="M82 64 Q110 56 138 64 Q147 92 124 108 L110 118 L96 108 Q73 92 82 64 Z" fill="#e58f4d"/>'
      + '<path d="M96 96 Q110 104 124 96 Q120 113 110 119 Q100 113 96 96 Z" fill="#fbe9d2"/>'
      + '<path d="M105 100 L115 100 L110 106 Z" fill="#2a1a12"/>'
      + '<path d="M88 84 Q98 80 106 87 Q98 91 88 84 Z" fill="#241109"/><path d="M132 84 Q122 80 114 87 Q122 91 132 84 Z" fill="#241109"/>'
      + '<circle cx="97" cy="85" r="1.6" fill="var(--acc)"/><circle cx="123" cy="85" r="1.6" fill="var(--acc)"/>'
      + '<path d="M86 74 Q94 71 100 74" stroke="#c96f2e" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M134 74 Q126 71 120 74" stroke="#c96f2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; },
    vyrn: function () { return ''
      + '<path d="M94 150 L52 120 L64 142 L48 150 L66 158 L54 176 L86 160 Z" fill="var(--acc)"/>'
      + '<path d="M126 150 L168 120 L156 142 L172 150 L154 158 L166 176 L134 160 Z" fill="var(--acc)"/>'
      + '<path d="M110 118 Q83 121 81 160 Q79 198 110 202 Q141 198 139 160 Q137 121 110 118 Z" fill="#2aa39a"/>'
      + '<ellipse cx="110" cy="170" rx="19" ry="25" fill="var(--acc)" opacity=".3"/>'
      + '<path d="M99 160 h22 M100 172 h20 M102 184 h16" stroke="#1c7d76" stroke-width="2" opacity=".5"/>'
      + '<path d="M90 196 q-3 10 7 12 M130 196 q3 10 -7 12" stroke="#2aa39a" stroke-width="10" fill="none" stroke-linecap="round"/>'
      + '<path d="M126 198 Q156 202 154 172 Q150 188 132 186" stroke="#2aa39a" stroke-width="11" fill="none" stroke-linecap="round"/>'
      + '<path d="M150 174 l10 -2 -4 9 z" fill="var(--acc)"/>'
      + '<path d="M84 92 Q110 72 136 92 Q141 114 118 120 L102 120 Q79 114 84 92 Z" fill="#2fb1a7"/>'
      + '<path d="M92 78 Q78 56 68 60 Q82 66 88 86 Z" fill="#1f8b83"/><path d="M99 74 l6 -3 -1 7 z" fill="var(--acc)"/>'
      + '<path d="M128 78 Q142 56 152 60 Q138 66 132 86 Z" fill="#1f8b83"/><path d="M121 74 l-6 -3 1 7 z" fill="var(--acc)"/>'
      + '<ellipse cx="98" cy="98" rx="8" ry="9" fill="#fff"/><ellipse cx="99" cy="99" rx="3.4" ry="8" fill="#141414"/><circle cx="100" cy="95" r="1.5" fill="var(--acc)"/>'
      + '<ellipse cx="124" cy="98" rx="7" ry="8" fill="#fff"/><ellipse cx="125" cy="99" rx="3" ry="7" fill="#141414"/>'
      + '<path d="M95 110 Q110 118 126 110" stroke="#12564f" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      + '<path d="M104 112 l2 5 3 -4 z" fill="#fff"/>'
      + '<circle cx="98" cy="106" r="1.4" fill="#12564f"/><circle cx="122" cy="106" r="1.4" fill="#12564f"/>'; },
    wisp: function () { return ''
      + '<ellipse cx="110" cy="140" rx="50" ry="66" fill="var(--acc)" opacity=".15" filter="url(#va-glow)"/>'
      + '<path d="M74 132 Q74 72 110 72 Q146 72 146 132 L146 198 Q138 186 130 197 Q122 209 114 197 Q106 185 98 197 Q90 209 82 197 Q74 187 74 198 Z" fill="#eef1ff"/>'
      + '<path d="M74 132 Q74 72 110 72 Q146 72 146 132" fill="none" stroke="var(--acc)" stroke-width="2" opacity=".5"/>'
      + '<path d="M84 120 Q84 96 110 96 Q136 96 136 120" fill="none" stroke="var(--acc)" stroke-width="1.4" opacity=".22"/>'
      + '<ellipse cx="96" cy="120" rx="8" ry="10" fill="var(--acc)"/><ellipse cx="96" cy="120" rx="8" ry="10" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/><ellipse cx="94" cy="116" rx="2.4" ry="3" fill="#fff"/>'
      + '<ellipse cx="124" cy="120" rx="8" ry="10" fill="var(--acc)"/><ellipse cx="124" cy="120" rx="8" ry="10" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/><ellipse cx="122" cy="116" rx="2.4" ry="3" fill="#fff"/>'
      + '<path d="M98 141 Q110 153 122 141 Q116 150 110 150 Q104 150 98 141 Z" fill="#2a2740"/>'
      + '<path d="M70 150 q-12 6 -8 20" stroke="#eef1ff" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M150 150 q12 6 8 20" stroke="#eef1ff" stroke-width="9" fill="none" stroke-linecap="round"/>'; },
    orion: function () { return ''
      + '<path d="M84 112 Q84 152 78 202 L142 202 Q136 152 136 112 Q124 122 110 122 Q96 122 84 112 Z" fill="#0e1230"/>'
      + '<circle cx="110" cy="84" r="31" fill="#0e1230"/>'
      + '<path d="M84 112 Q84 152 78 202 L142 202 Q136 152 136 112" fill="none" stroke="var(--acc)" stroke-width="1.8" opacity=".5"/>'
      + '<circle cx="110" cy="84" r="31" fill="none" stroke="var(--acc)" stroke-width="1.8" opacity=".5"/>'
      + '<path d="M100 74 L118 90 L104 150 L126 168 M104 150 L92 122 L118 90" stroke="var(--acc)" stroke-width="1" opacity=".55" fill="none"/>'
      + ['100,74', '118,90', '92,122', '104,150', '126,168', '88,182', '130,140', '112,196'].map(function (p) { var xy = p.split(','); return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="1.7" fill="#fff"/>'; }).join('')
      + '<path d="M100 84 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="var(--acc)"/>'
      + '<path d="M120 84 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="var(--acc)"/>'
      + '<circle cx="100" cy="84" r="6" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/><circle cx="120" cy="84" r="6" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/>'
      + '<path d="M95 47 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#f6ad2f"/><path d="M110 40 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z" fill="#f6ad2f"/><path d="M125 47 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#f6ad2f"/>'; },
    blot: function () { return ''
      + '<ellipse cx="110" cy="150" rx="50" ry="60" fill="var(--acc)" opacity=".14" filter="url(#va-glow)"/>'
      + '<path d="M100 66 Q86 60 90 76 M120 66 Q134 60 130 76" stroke="#141221" stroke-width="7" fill="none" stroke-linecap="round"/>'
      + '<path d="M110 70 Q80 70 74 104 Q60 108 66 130 Q52 142 64 158 Q58 188 90 192 Q98 212 110 192 Q122 210 132 192 Q162 188 156 158 Q168 142 154 130 Q160 106 146 104 Q140 70 110 70 Z" fill="#141221"/>'
      + '<circle cx="86" cy="204" r="4" fill="#141221"/><circle cx="134" cy="206" r="3.4" fill="#141221"/><circle cx="110" cy="212" r="3" fill="#141221"/>'
      + '<path d="M110 70 Q80 70 74 104" fill="none" stroke="var(--acc)" stroke-width="1.6" opacity=".4"/>'
      + '<ellipse cx="97" cy="132" rx="11" ry="13" fill="var(--acc)"/><ellipse cx="97" cy="132" rx="11" ry="13" fill="var(--acc)" opacity=".5" filter="url(#va-glow)"/><path d="M97 126 v12" stroke="#141221" stroke-width="3"/>'
      + '<ellipse cx="127" cy="136" rx="7" ry="8.5" fill="var(--acc)"/><path d="M127 132 v8" stroke="#141221" stroke-width="2.4"/>'
      + '<path d="M90 160 L98 168 L106 160 L114 168 L122 160" stroke="var(--acc)" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'; },
    pixl: function () {
      var cell = 11, x0 = 66, y0 = 54, S = '#f1cda2', E = '#1f2136', B = '#3a3550', W = '#ffffff', out = '';
      function P(c, r, col) { out += '<rect x="' + (x0 + c * cell) + '" y="' + (y0 + r * cell) + '" width="' + (cell + 0.6) + '" height="' + (cell + 0.6) + '" fill="' + col + '"/>'; }
      [[3, 0], [4, 0], [2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [2, 2], [5, 2], [6, 2]].forEach(function (p) { P(p[0], p[1], 'var(--acc)'); });
      [[3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [1, 4], [3, 4], [4, 4], [6, 4], [1, 5], [2, 5], [3, 5], [5, 5], [6, 5]].forEach(function (p) { P(p[0], p[1], S); });
      P(2, 4, E); P(5, 4, E); P(4, 5, E);
      [[2, 6], [3, 6], [4, 6], [5, 6], [1, 7], [2, 7], [4, 7], [5, 7], [6, 7], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8]].forEach(function (p) { P(p[0], p[1], 'var(--acc)'); });
      P(3, 7, W); P(0, 7, S); P(7, 7, S); P(0, 8, 'var(--acc)'); P(7, 8, 'var(--acc)');
      [[2, 9], [3, 9], [5, 9], [6, 9], [2, 10], [3, 10], [5, 10], [6, 10]].forEach(function (p) { P(p[0], p[1], B); });
      return out;
    },
    boba: function () { return ''
      + '<path d="M84 112 L136 112 L143 210 Q110 221 77 210 Z" fill="#eef1fb" opacity=".9"/>'
      + '<path d="M80 152 L140 152 L143 210 Q110 221 77 210 Z" fill="var(--acc)" opacity=".82"/>'
      + '<circle cx="90" cy="196" r="5" fill="#3a2a20"/><circle cx="104" cy="202" r="5" fill="#3a2a20"/><circle cx="119" cy="197" r="5" fill="#3a2a20"/><circle cx="131" cy="201" r="4.5" fill="#3a2a20"/><circle cx="110" cy="188" r="4.5" fill="#3a2a20"/>'
      + '<path d="M84 112 L136 112 L143 210 Q110 221 77 210 Z" fill="none" stroke="#c7cbe0" stroke-width="2.5"/>'
      + '<path d="M80 112 Q110 94 140 112 Z" fill="#dfe3f2"/><rect x="78" y="107" width="64" height="10" rx="4" fill="#cfd4e8"/>'
      + '<rect x="120" y="70" width="12" height="72" rx="6" fill="#ff7aa8" transform="rotate(12 126 106)"/>'
      + '<ellipse cx="96" cy="138" rx="6" ry="7.5" fill="#20223a"/><ellipse cx="124" cy="138" rx="6" ry="7.5" fill="#20223a"/>'
      + '<circle cx="94" cy="135" r="1.8" fill="#fff"/><circle cx="122" cy="135" r="1.8" fill="#fff"/>'
      + '<path d="M100 148 q10 8 20 0" stroke="#20223a" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      + '<ellipse cx="85" cy="145" rx="5" ry="3.5" fill="#ff9db8" opacity=".6"/><ellipse cx="135" cy="145" rx="5" ry="3.5" fill="#ff9db8" opacity=".6"/>'
      + '<path d="M76 168 q-10 4 -9 16 M144 168 q10 4 9 16" stroke="#eef1fb" stroke-width="8" fill="none" stroke-linecap="round"/>'; },
    cadence: function () { return ''
      + '<path d="M56 90 Q56 62 110 62 Q164 62 164 90" fill="none" stroke="#2f2b45" stroke-width="8" stroke-linecap="round"/>'
      + '<rect x="46" y="84" width="20" height="32" rx="8" fill="#2f2b45"/><rect x="154" y="84" width="20" height="32" rx="8" fill="#2f2b45"/>'
      + '<rect x="60" y="96" width="100" height="94" rx="16" fill="var(--acc)"/><rect x="60" y="96" width="100" height="94" rx="16" fill="none" stroke="#00000030" stroke-width="2"/>'
      + '<rect x="72" y="150" width="76" height="30" rx="8" fill="#ffffff" opacity=".18"/>'
      + '<circle cx="90" cy="132" r="15" fill="#f4f5fb"/>' + [0, 60, 120, 180, 240, 300].map(function (a) { var r = a * Math.PI / 180; return '<path d="M90 132 L' + (90 + Math.cos(r) * 13).toFixed(1) + ' ' + (132 + Math.sin(r) * 13).toFixed(1) + '" stroke="#c7cbe0" stroke-width="2"/>'; }).join('') + '<circle cx="90" cy="132" r="4" fill="#2f2b45"/>'
      + '<circle cx="130" cy="132" r="15" fill="#f4f5fb"/>' + [30, 90, 150, 210, 270, 330].map(function (a) { var r = a * Math.PI / 180; return '<path d="M130 132 L' + (130 + Math.cos(r) * 13).toFixed(1) + ' ' + (132 + Math.sin(r) * 13).toFixed(1) + '" stroke="#c7cbe0" stroke-width="2"/>'; }).join('') + '<circle cx="130" cy="132" r="4" fill="#2f2b45"/>'
      + '<path d="M104 160 q6 5 12 0" stroke="#2f2b45" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      + '<g transform="translate(40,58)"><ellipse cx="0" cy="14" rx="5" ry="4" fill="#f6ad2f"/><rect x="4" y="-2" width="2.4" height="16" fill="#f6ad2f"/><path d="M6.4 -2 q8 2 6 12 q0 -8 -6 -8 z" fill="#f6ad2f"/></g>'
      + '<rect x="86" y="192" width="14" height="16" rx="4" fill="#2f2b45"/><rect x="120" y="192" width="14" height="16" rx="4" fill="#2f2b45"/>'; },
    kami: function () { return ''
      + '<path d="M108 138 L50 112 L98 152 Z" fill="var(--acc)"/>'
      + '<path d="M112 138 L170 112 L122 152 Z" fill="var(--acc)"/><path d="M112 138 L170 112 L122 152 Z" fill="#000" opacity=".08"/>'
      + '<path d="M110 120 L136 150 L110 194 L84 150 Z" fill="var(--acc)"/>'
      + '<path d="M110 120 L136 150 L110 194 Z" fill="#000" opacity=".10"/>'
      + '<path d="M110 120 V194 M84 150 H136" stroke="#ffffff" stroke-width="1.2" opacity=".35"/>'
      + '<path d="M100 130 L70 76 L84 80 L110 124 Z" fill="var(--acc)"/>'
      + '<path d="M70 76 L54 74 L72 86 Z" fill="var(--acc)"/><path d="M70 76 L54 74 L72 86 Z" fill="#000" opacity=".12"/>'
      + '<circle cx="72" cy="80" r="2" fill="#20223a"/>'
      + '<path d="M120 172 L160 150 L150 172 Z" fill="var(--acc)"/><path d="M120 172 L160 150 L150 172 Z" fill="#000" opacity=".1"/>'; },
    lumen: function () { return ''
      + '<ellipse cx="110" cy="150" rx="54" ry="46" fill="var(--acc)" opacity=".12" filter="url(#va-glow)"/>'
      + '<path d="M150 150 L184 126 L176 150 L184 174 Z" fill="#16273f"/>'
      + '<path d="M62 150 Q66 104 118 104 Q158 104 158 150 Q158 190 118 190 Q70 192 62 150 Z" fill="#12233c"/>'
      + '<path d="M78 168 Q118 184 150 168 Q150 178 118 180 Q86 180 78 168 Z" fill="#0c1a2e"/>'
      + '<path d="M104 104 L96 84 L118 100 Z" fill="#16273f"/>'
      + '<path d="M116 100 Q126 66 150 64" fill="none" stroke="#16273f" stroke-width="3"/>'
      + '<circle cx="152" cy="62" r="8" fill="var(--acc)"/><circle cx="152" cy="62" r="15" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/>'
      + '<circle cx="98" cy="140" r="15" fill="#fff"/><circle cx="101" cy="142" r="8" fill="#141414"/><circle cx="104" cy="139" r="2.6" fill="#fff"/>'
      + '<circle cx="98" cy="140" r="15" fill="none" stroke="var(--acc)" stroke-width="1.5" opacity=".7"/>'
      + '<path d="M74 162 Q104 176 140 160" stroke="#0a1526" stroke-width="3" fill="none"/>'
      + '<path d="M82 162 l3 7 4 -6 z M96 166 l3 7 4 -6 z M112 167 l3 7 4 -6 z M128 164 l3 6 4 -5 z" fill="#e9f2ff"/>'
      + '<circle cx="130" cy="126" r="2.5" fill="var(--acc)"/><circle cx="140" cy="144" r="2.5" fill="var(--acc)"/><circle cx="122" cy="176" r="2.5" fill="var(--acc)"/>'; },
    codex: function () { return ''
      + '<rect x="72" y="176" width="76" height="22" rx="4" fill="#8a5a3c"/><rect x="72" y="176" width="8" height="22" fill="#6e4630"/>'
      + '<rect x="66" y="152" width="84" height="24" rx="4" fill="#3f6d8c" transform="rotate(-3 108 164)"/>'
      + '<rect x="76" y="128" width="80" height="24" rx="4" fill="#5f7a52" transform="rotate(2 116 140)"/>'
      + '<path d="M74 116 L74 96 Q110 84 146 96 L146 116 Q110 102 74 116 Z" fill="#e6d8bb"/>'
      + '<path d="M74 116 Q110 108 146 116 L146 122 Q110 114 74 122 Z" fill="#c9b28a"/>'
      + '<path d="M110 90 V116" stroke="#b09a72" stroke-width="2"/>'
      + '<path d="M92 102 l3 4 -3 4 -3 -4 z" fill="var(--acc)"/><path d="M128 102 l3 4 -3 4 -3 -4 z" fill="var(--acc)"/>'
      + '<circle cx="92" cy="102" r="6" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/><circle cx="128" cy="102" r="6" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/>'
      + '<path d="M100 111 q10 4 20 0" stroke="#8a7550" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<rect x="52" y="150" width="16" height="30" rx="8" fill="#e6d8bb"/><circle cx="60" cy="150" r="8" fill="#d8c69f"/>'
      + '<rect x="152" y="150" width="16" height="30" rx="8" fill="#e6d8bb"/><circle cx="160" cy="150" r="8" fill="#d8c69f"/>'
      + '<rect x="86" y="198" width="16" height="10" rx="3" fill="#6e4630"/><rect x="118" y="198" width="16" height="10" rx="3" fill="#6e4630"/>'
      + '<path d="M56 100 l2 4 -2 4 -2 -4 z" fill="var(--acc)" opacity=".7"/><path d="M164 108 l2 4 -2 4 -2 -4 z" fill="var(--acc)" opacity=".7"/>'; },
    geode: function () { return ''
      + '<ellipse cx="110" cy="152" rx="48" ry="44" fill="var(--acc)" opacity=".12" filter="url(#va-glow)"/>'
      + '<path d="M84 96 L96 130 L72 128 Z" fill="var(--acc)" opacity=".85"/><path d="M138 96 L124 130 L150 126 Z" fill="var(--acc)" opacity=".85"/><path d="M110 82 L120 122 L100 122 Z" fill="var(--acc)"/>'
      + '<path d="M74 132 Q70 108 96 106 L124 106 Q152 108 148 134 Q156 172 130 190 L90 190 Q64 172 74 132 Z" fill="#4c4a60"/>'
      + '<path d="M74 132 Q70 108 96 106 L124 106 Q152 108 148 134" fill="none" stroke="#615f7a" stroke-width="2"/>'
      + '<path d="M92 150 L110 130 L128 150 L118 178 L102 178 Z" fill="var(--acc)"/>'
      + '<path d="M110 130 L128 150 L118 178 Z" fill="#000" opacity=".14"/>'
      + '<path d="M110 130 L110 178 M92 150 L128 150" stroke="#ffffff" stroke-width="1" opacity=".4"/>'
      + '<circle cx="110" cy="153" r="7" fill="#fff"/><circle cx="110" cy="153" r="7" fill="var(--acc)" opacity=".5"/><circle cx="110" cy="153" r="12" fill="var(--acc)" opacity=".4" filter="url(#va-glow)"/>'
      + '<path d="M70 150 q-12 4 -12 18" stroke="#4c4a60" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M150 150 q12 4 12 18" stroke="#4c4a60" stroke-width="11" fill="none" stroke-linecap="round"/>'
      + '<rect x="88" y="188" width="16" height="10" rx="3" fill="#3d3b50"/><rect x="116" y="188" width="16" height="10" rx="3" fill="#3d3b50"/>'; }
  };

  // Each character's signature accent (used when no skin is equipped).
  var DEFAULT_ACCENTS = {
    nova: '#37e0cf', vesper: '#b96bff', byte: '#8ef04a', ember: '#ff7a3d',
    kitsu: '#7b6bff', vyrn: '#ff6ba6', wisp: '#63dcff', orion: '#8f7bff',
    blot: '#3df0b0', pixl: '#ff5a5a', boba: '#b98cff', cadence: '#5ec8c0',
    kami: '#ff8f5e', lumen: '#39d7c8', codex: '#ffbe3d', geode: '#c06bff'
  };

  // Character lore — the "THE SCHOLAR / VESPER" treatment, one per character,
  // true to what each is actually drawn as. Cool/mysterious tone, GCSE-age (not
  // sweet). Shown in the Locker stagecard for the worn character. Keep archetype
  // ≤ ~14 chars (it renders as an uppercase eyebrow); traits are exactly three.
  var LORE = {
    nova:    { archetype: 'The Voyager',     tagline: 'First to the edge of the map. Never looks back.',
               blurb: "A deep-space explorer sealed behind a mirror visor, trailing one quiet orbit. Goes where the signal drops out — and comes back with answers.",
               traits: ['Bubble helmet, glow-visor eyes', 'Orbits a lone star-mote', 'A chest-core that never dims'] },
    vesper:  { archetype: 'The Scholar',     tagline: 'Quiet, sharp, a little mysterious. Knows more than it lets on.',
               blurb: "A hooded night-scholar with glowing eye-slits instead of eyes — the ‘cool’ pick. Streetwear silhouette, a faint forehead sigil, a floating rune.",
               traits: ['Hood-up silhouette — mysterious, not sweet', 'Glowing slit-eyes + a rank-marking sigil', 'A floating rune-spark it can conjure'] },
    byte:    { archetype: 'The Analyst',     tagline: 'Reads the room in binary. Usually right.',
               blurb: "A tidy little automaton with a screen for a face and an antenna always listening. Processes everything twice, panics never.",
               traits: ['Screen-face, pixel eyes', 'Antenna tuned to the answer', 'Runs cool under pressure'] },
    ember:   { archetype: 'The Firebrand',   tagline: 'Small flame, short fuse, big heart.',
               blurb: "A molten little fox forged from embers — flame-tipped ears and a tail that won't sit still. Burns brightest mid-streak.",
               traits: ['A living-ember coat', 'Flame ears + a restless tail', 'Hotter with every win'] },
    kitsu:   { archetype: 'The Trickster',   tagline: 'Three steps ahead, smiling the whole way.',
               blurb: "A fox-spirit with sharp ears and sharper instincts. Plays the long game and lets you think you're winning.",
               traits: ['Fox ears, knowing eyes', 'Whisker-flick confidence', 'Always one move ahead'] },
    vyrn:    { archetype: 'The Flame-Keeper', tagline: 'Guards what it earns — knowledge, not gold.',
               blurb: "A pocket-sized wyvern with leather wings and a spade-tipped tail. Small enough to perch on a page, proud enough to defend it.",
               traits: ['Bat-wings, scaled belly', 'A spade-tail flick', 'Collector of hard-won wins'] },
    wisp:    { archetype: 'The Phantom',     tagline: "Here, then not. You'll feel it before you see it.",
               blurb: "A soft-glowing spirit that drifts through the quiet hours. Doesn't haunt — just keeps you company while you work late.",
               traits: ['Glow-lit and weightless', 'Drifts, never rushes', 'Warmer than it looks'] },
    orion:   { archetype: 'The Astromancer', tagline: 'Reads futures in the dark between stars.',
               blurb: "A cloaked stargazer with a live constellation across its chest and starlight for eyes. Maps the way when nothing's clear.",
               traits: ['A star-map cloak', 'Constellation eyes', 'Crowned with three lights'] },
    blot:    { archetype: 'The Inkling',     tagline: 'Shapeless, fearless, impossible to pin down.',
               blurb: "A mischievous ink-blob that oozes wherever it likes, grinning in zigzags. Spills into every corner of a problem until it fits.",
               traits: ['A drippy ink body', 'Glow-dot eyes, zigzag grin', 'Reshapes to fit anything'] },
    pixl:    { archetype: 'The 8-Bit',       tagline: "Loading… done. Let's go.",
               blurb: "A retro hero rendered in clean pixels, straight out of a cartridge you forgot you loved. Extra lives, no continues needed.",
               traits: ['Pure pixel-art build', 'Two-tone determination', 'Respawns, never quits'] },
    boba:    { archetype: 'The Brew',        tagline: 'Sweet on top, tough at the bottom.',
               blurb: "A cheerful cup of bubble tea with pearls to spare and a straw at a jaunty angle. Easy company for a long session.",
               traits: ['A tapioca-pearl base', 'One jaunty pink straw', 'Unshakably chill'] },
    cadence: { archetype: 'The Beatmaker',   tagline: 'Sets the tempo. You just keep up.',
               blurb: "A retro cassette-bot spinning reels behind chunky headphones. Turns grind into rhythm, revision into a set.",
               traits: ['A headphone crown', 'Spinning-reel eyes', 'Finds the flow in anything'] },
    kami:    { archetype: 'The Paper Spirit', tagline: 'One fold from something new.',
               blurb: "A spirit folded from a single sheet — all crisp angles and quiet intent. Remakes itself the moment the old shape stops working.",
               traits: ['A folded-paper form', 'Sharp origami edges', 'Reinvents on a crease'] },
    lumen:   { archetype: 'The Lantern',     tagline: 'Brings light to the darkest questions.',
               blurb: "A deep-sea lantern-fish that thrives where no one else will go. Its glow finds the answer hiding right at the bottom.",
               traits: ['A bioluminescent lure', 'Deep-dark eyes', 'Fearless in the deep end'] },
    codex:   { archetype: 'The Archive',     tagline: "Every answer's in here somewhere — and it remembers where.",
               blurb: "A living stack of tomes crowned by an open book with rune-lit eyes. Old, patient, quietly certain of everything.",
               traits: ['A tower of well-read tomes', 'Rune-glow eyes', 'Forgets nothing'] },
    geode:   { archetype: 'The Crystal-Heart', tagline: 'Rough outside. Rare all the way through.',
               blurb: "A stone-shouldered golem cracked open to reveal a glowing crystal core. Takes a while to break through — worth every second when you do.",
               traits: ['A rocky, crystal-crowned shell', 'A core revealed under pressure', 'Rare by nature'] }
  };

  // Skins = recolour presets. A skin item id maps to the accent it applies to the
  // equipped character (one CSS var repaints the whole character). Allowlisted —
  // the ONLY source of the injected accent, so it can never be arbitrary client text.
  var SKINS = {
    skin_cyan: '#35c4b5', skin_berry: '#e0567f', skin_mint: '#57c86a',
    skin_sky: '#4aa6e8', skin_grape: '#9370e0', skin_coral: '#ff7d68',
    skin_gold: '#f6c945', skin_ink: '#3df0b0'
  };

  // ── Universal cosmetics (character-agnostic: they sit behind / around / beside
  // any character). Backgrounds fill the frame; frames ring the edge; pets tuck
  // into a bottom corner. ──
  var BACKGROUNDS = {
    none: '',
    bg_dawn: '<rect width="220" height="260" fill="url(#va-dawn)"/>',
    bg_night: '<rect width="220" height="260" fill="url(#va-night)"/>'
      + '<circle cx="40" cy="44" r="1.6" fill="#fff" opacity=".85"/><circle cx="176" cy="60" r="1.4" fill="#fff" opacity=".8"/><circle cx="150" cy="30" r="1.5" fill="#fff" opacity=".8"/><circle cx="64" cy="24" r="1.3" fill="#fff" opacity=".7"/><circle cx="190" cy="120" r="1.4" fill="#fff" opacity=".7"/>',
    bg_mint: '<rect width="220" height="260" fill="#e6f7f0"/>',
    bg_grid: '<rect width="220" height="260" fill="#f4f3fb"/>'
      + '<path d="M0 65 H220 M0 130 H220 M0 195 H220 M55 0 V260 M110 0 V260 M165 0 V260" stroke="#dcd8ee" stroke-width="1"/>'
  };
  var FRAMES = {
    none: '',
    frame_bronze: '<rect x="5" y="5" width="210" height="250" rx="20" fill="none" stroke="#c98a4a" stroke-width="6"/>',
    frame_silver: '<rect x="5" y="5" width="210" height="250" rx="20" fill="none" stroke="#c2c7d4" stroke-width="6"/>',
    frame_gold: '<rect x="5" y="5" width="210" height="250" rx="20" fill="none" stroke="url(#va-gold)" stroke-width="7"/>',
    frame_glow: '<rect x="5" y="5" width="210" height="250" rx="20" fill="none" stroke="var(--acc)" stroke-width="5"/><rect x="5" y="5" width="210" height="250" rx="20" fill="none" stroke="var(--acc)" stroke-width="9" opacity=".35" filter="url(#va-glow)"/>'
  };
  var PETS = {
    none: '',
    pet_spark: '<g transform="translate(40,212)"><circle r="11" fill="#f6c945" opacity=".3" filter="url(#va-glow)"/><path d="M0 -8 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="#f6c945"/><circle cx="-2" cy="-1" r="1" fill="#3a2f10"/><circle cx="2" cy="-1" r="1" fill="#3a2f10"/></g>',
    pet_star: '<g transform="translate(40,212)"><path d="M0 -11 l3.2 8 8.4 .6 -6.4 5.4 2 8.2 -7.2 -4.4 -7.2 4.4 2 -8.2 -6.4 -5.4 8.4 -.6 z" fill="#ffcf5e"/><circle cx="-3" cy="-1" r="1.4" fill="#3a2f10"/><circle cx="3" cy="-1" r="1.4" fill="#3a2f10"/></g>',
    pet_orb: '<g transform="translate(40,212)"><circle r="12" fill="var(--acc)" opacity=".3" filter="url(#va-glow)"/><circle r="8" fill="var(--acc)"/><circle cx="-3" cy="-3" r="2.4" fill="#fff" opacity=".7"/></g>'
  };

  // ── Per-character WEARABLES. Unlike the universal cosmetics above, each is
  // drawn to fit ONE specific character's geometry (a hat that sits on Nova's
  // helmet can't sit on an inkblot), so it renders ONLY when its character is
  // equipped. Keyed by item id → { char, slot, svg }. Slots render on top of the
  // character in order outfit → accessory → hat. Adding more is just new entries. ──
  var WEARABLES = {
    nova_scarf:{char:'nova',slot:'outfit',svg:function(){return '<rect x="88" y="142" width="44" height="11" rx="5" fill="#e0512e"/><rect x="102" y="151" width="11" height="18" rx="5" fill="#e0512e"/>';}},
    nova_flag:{char:'nova',slot:'accessory',svg:function(){return '<g transform="translate(158,150)"><rect x="0" y="-16" width="2" height="30" fill="#c7ccec"/><path d="M2 -16 L16 -11 L2 -6 Z" fill="var(--acc)"/></g>';}},
    vesper_sash:{char:'vesper',slot:'outfit',svg:function(){return '<path d="M86 132 L150 188 L142 198 L80 142 Z" fill="var(--acc)" opacity=".65"/>';}},
    vesper_book:{char:'vesper',slot:'accessory',svg:function(){return '<g transform="translate(150,158)"><rect x="-2" y="-10" width="20" height="16" rx="2" fill="var(--acc)"/><rect x="0" y="-8" width="16" height="12" fill="#0a0814"/></g>';}},
    byte_tie:{char:'byte',slot:'outfit',svg:function(){return '<path d="M104 118 L116 118 L114 124 L106 124 Z" fill="#c23f2e"/><path d="M106 124 L114 124 L112 152 L110 160 L108 152 Z" fill="#e0512e"/>';}},
    byte_wrench:{char:'byte',slot:'accessory',svg:function(){return '<g transform="translate(156,155) rotate(30)"><rect x="-2" y="-14" width="5" height="26" rx="2" fill="#aeb6c8"/><circle cx="0.5" cy="-14" r="5" fill="none" stroke="#aeb6c8" stroke-width="3"/></g>';}},
    ember_bowtie:{char:'ember',slot:'outfit',svg:function(){return '<path d="M100 166 l-11 -4 0 13 11 -4 z" fill="#241009"/><path d="M120 166 l11 -4 0 13 -11 -4 z" fill="#241009"/><rect x="106" y="167" width="8" height="7" fill="#7a2412"/>';}},
    ember_fork:{char:'ember',slot:'accessory',svg:function(){return '<g transform="translate(158,148)"><rect x="0" y="-4" width="3" height="36" fill="#7a2412"/><path d="M-6 -4 v-11 M1.5 -4 v-15 M9 -4 v-11" stroke="#7a2412" stroke-width="3"/></g>';}},
    kitsu_scarf:{char:'kitsu',slot:'outfit',svg:function(){return '<rect x="88" y="124" width="44" height="12" rx="6" fill="#f6ad2f"/><rect x="90" y="130" width="40" height="3" fill="#c98a1a" opacity=".5"/>';}},
    kitsu_leaf:{char:'kitsu',slot:'accessory',svg:function(){return '<g transform="translate(156,152)"><path d="M0 0 Q12 -12 20 0 Q12 8 0 0 Z" fill="#2aa39a"/><path d="M0 0 L18 -2" stroke="#1c7d76" stroke-width="1"/></g>';}},
    vyrn_bib:{char:'vyrn',slot:'outfit',svg:function(){return '<path d="M92 116 Q110 128 128 116 L124 132 Q110 124 96 132 Z" fill="var(--acc)"/>';}},
    vyrn_coin:{char:'vyrn',slot:'accessory',svg:function(){return '<g transform="translate(156,155)"><circle r="9" fill="url(#va-gold)" stroke="#c47f10"/><path d="M-3 0 h6" stroke="#c47f10" stroke-width="1.5"/></g>';}},
    wisp_bowtie:{char:'wisp',slot:'outfit',svg:function(){return '<path d="M100 135 l-11 -4 0 12 11 -4 z" fill="var(--acc)"/><path d="M120 135 l11 -4 0 12 -11 -4 z" fill="var(--acc)"/><rect x="106" y="136" width="8" height="6" fill="var(--acc)"/>';}},
    wisp_candle:{char:'wisp',slot:'accessory',svg:function(){return '<g transform="translate(156,156)"><rect x="-3" y="-2" width="6" height="18" fill="#eef1ff"/><path d="M0 -2 q-3 -6 0 -10 q3 4 0 10z" fill="var(--acc)"/></g>';}},
    orion_sash:{char:'orion',slot:'outfit',svg:function(){return '<path d="M84 150 Q110 160 136 150" stroke="var(--acc)" stroke-width="3" fill="none"/><circle cx="110" cy="156" r="2" fill="#fff"/><circle cx="96" cy="152" r="1.4" fill="#fff"/><circle cx="124" cy="152" r="1.4" fill="#fff"/>';}},
    orion_moon:{char:'orion',slot:'accessory',svg:function(){return '<g transform="translate(156,148)"><path d="M2 -8 a9 9 0 1 0 5 15 a6.5 6.5 0 1 1 -5 -15z" fill="#ffe9a8"/></g>';}},
    blot_bowtie:{char:'blot',slot:'outfit',svg:function(){return '<path d="M100 155 l-11 -4 0 12 11 -4 z" fill="var(--acc)"/><path d="M120 155 l11 -4 0 12 -11 -4 z" fill="var(--acc)"/><rect x="106" y="156" width="8" height="6" fill="#141221"/>';}},
    blot_quill:{char:'blot',slot:'accessory',svg:function(){return '<g transform="translate(156,150) rotate(18)"><path d="M0 16 L5 -14 Q9 -4 5 8 Z" fill="var(--acc)"/></g>';}},
    pixl_collar:{char:'pixl',slot:'outfit',svg:function(){return '<g fill="#e0512e"><rect x="88" y="118" width="44" height="11"/></g>';}},
    pixl_sword:{char:'pixl',slot:'accessory',svg:function(){return '<rect x="150" y="128" width="6" height="26" fill="#c2c7d4"/><rect x="145" y="150" width="16" height="5" fill="#8a5a3c"/><rect x="151" y="122" width="4" height="6" fill="#e6e9f2"/>';}},
    boba_sleeve:{char:'boba',slot:'outfit',svg:function(){return '<rect x="80" y="170" width="60" height="16" rx="3" fill="#c98a5a"/><path d="M80 178 h60" stroke="#a5713f" stroke-width="1.5"/>';}},
    boba_heart:{char:'boba',slot:'accessory',svg:function(){return '<g transform="translate(156,150)"><path d="M0 4 C-6 -4 -12 2 0 10 C12 2 6 -4 0 4 Z" fill="#ff7aa8"/></g>';}},
    cadence_label:{char:'cadence',slot:'outfit',svg:function(){return '<rect x="82" y="164" width="56" height="14" rx="2" fill="#f6ad2f"/><path d="M86 171 h20" stroke="#c98a1a" stroke-width="1.5"/>';}},
    cadence_disc:{char:'cadence',slot:'accessory',svg:function(){return '<g transform="translate(158,155)"><circle r="10" fill="#2f2b45"/><circle r="3" fill="var(--acc)"/><circle r="10" fill="none" stroke="#4a4568" stroke-width="1"/></g>';}},
    kami_ribbon:{char:'kami',slot:'outfit',svg:function(){return '<path d="M96 148 L124 148 L120 158 L100 158 Z" fill="var(--acc)"/><path d="M96 148 L124 148 L120 158 L100 158 Z" fill="#000" opacity=".08"/>';}},
    kami_crane2:{char:'kami',slot:'accessory',svg:function(){return '<g transform="translate(156,155)"><path d="M-8 0 L2 -7 L8 -1 L0 5 Z" fill="var(--acc)"/><path d="M2 -7 L10 -10" stroke="var(--acc)" stroke-width="2"/></g>';}},
    lumen_bowtie:{char:'lumen',slot:'outfit',svg:function(){return '<path d="M100 172 l-10 -3 0 10 10 -3 z" fill="var(--acc)"/><path d="M120 172 l10 -3 0 10 -10 -3 z" fill="var(--acc)"/><rect x="106" y="172" width="8" height="6" fill="#0a1526"/>';}},
    lumen_bubble:{char:'lumen',slot:'accessory',svg:function(){return '<g fill="var(--acc)" opacity=".55"><circle cx="156" cy="150" r="5"/><circle cx="164" cy="140" r="3"/><circle cx="150" cy="138" r="2"/></g>';}},
    codex_ribbon:{char:'codex',slot:'outfit',svg:function(){return '<rect x="106" y="128" width="8" height="60" fill="#c23f2e"/><path d="M106 188 L110 194 L114 188 Z" fill="#c23f2e"/>';}},
    codex_scroll:{char:'codex',slot:'accessory',svg:function(){return '<g transform="translate(156,156)"><rect x="-8" y="-8" width="16" height="16" rx="2" fill="#e6d8bb"/><path d="M-5 -4 h10 M-5 0 h10 M-5 4 h7" stroke="#b09a72" stroke-width="1"/></g>';}},
    geode_sash:{char:'geode',slot:'outfit',svg:function(){return '<path d="M84 168 Q110 178 136 168" stroke="var(--acc)" stroke-width="4" fill="none"/><path d="M110 174 l3 4 -3 4 -3 -4 z" fill="#fff"/>';}},
    geode_pick:{char:'geode',slot:'accessory',svg:function(){return '<g transform="translate(156,150) rotate(40)"><rect x="0" y="-4" width="3" height="24" fill="#6e4630"/><path d="M-8 -4 Q1 -10 10 -4" stroke="#c2c7d4" stroke-width="4" fill="none"/></g>';}},
    nova_halo:{char:'nova',slot:'hat',svg:function(){return '<ellipse cx="110" cy="50" rx="30" ry="7" fill="none" stroke="#f6c945" stroke-width="3"/>';}},
    nova_medal:{char:'nova',slot:'accessory',svg:function(){return '<path d="M96 154 L110 178 L124 154" stroke="#4aa6e8" stroke-width="4" fill="none"/><circle cx="110" cy="184" r="9" fill="url(#va-gold)" stroke="#c47f10"/>';}},
    vesper_halo:{char:'vesper',slot:'hat',svg:function(){return '<ellipse cx="110" cy="34" rx="24" ry="6" fill="none" stroke="var(--acc)" stroke-width="3" opacity=".85"/>';}},
    vesper_amulet:{char:'vesper',slot:'accessory',svg:function(){return '<path d="M96 128 Q110 140 124 128" stroke="var(--acc)" stroke-width="2" fill="none"/><path d="M110 138 l4 6 -4 6 -4 -6 z" fill="var(--acc)"/>';}},
    byte_shades:{char:'byte',slot:'accessory',svg:function(){return '<rect x="88" y="72" width="20" height="9" rx="2" fill="#20223a"/><rect x="112" y="72" width="20" height="9" rx="2" fill="#20223a"/><rect x="106" y="75" width="8" height="3" fill="#20223a"/>';}},
    byte_prop:{char:'byte',slot:'hat',svg:function(){return '<ellipse cx="110" cy="50" rx="28" ry="8" fill="#3f6d9e"/><rect x="108" y="38" width="4" height="12" fill="#333"/><ellipse cx="110" cy="36" rx="14" ry="3.5" fill="#f6c945"/>';}},
    ember_horns:{char:'ember',slot:'hat',svg:function(){return '<path d="M92 60 Q86 46 96 44 Q94 54 100 62 Z" fill="#7a1414"/><path d="M128 60 Q134 46 124 44 Q126 54 120 62 Z" fill="#7a1414"/>';}},
    ember_shades:{char:'ember',slot:'accessory',svg:function(){return '<path d="M84 118 h26 v8 h-26 z" fill="#20223a" opacity=".9"/><path d="M116 119 h22 v7 h-22 z" fill="#20223a" opacity=".9"/><path d="M110 120 h6" stroke="#20223a" stroke-width="3"/>';}},
    kitsu_glasses:{char:'kitsu',slot:'accessory',svg:function(){return '<circle cx="97" cy="86" r="7" fill="none" stroke="#2a2a3a" stroke-width="2"/><circle cx="123" cy="86" r="7" fill="none" stroke="#2a2a3a" stroke-width="2"/><path d="M104 85 h12" stroke="#2a2a3a" stroke-width="2"/>';}},
    kitsu_cap:{char:'kitsu',slot:'hat',svg:function(){return '<path d="M80 66 Q110 50 140 66 Z" fill="#2aa39a"/><path d="M140 66 Q156 66 154 74 L136 72 Z" fill="#1c7d76"/>';}},
    vyrn_party:{char:'vyrn',slot:'hat',svg:function(){return '<path d="M110 46 L100 74 L120 74 Z" fill="var(--acc)"/><circle cx="110" cy="46" r="4" fill="#fff"/>';}},
    vyrn_monocle:{char:'vyrn',slot:'accessory',svg:function(){return '<circle cx="98" cy="98" r="11" fill="none" stroke="url(#va-gold)" stroke-width="2"/><path d="M98 109 q3 12 -6 16" stroke="url(#va-gold)" stroke-width="1.5" fill="none"/>';}},
    wisp_bow:{char:'wisp',slot:'hat',svg:function(){return '<path d="M100 70 l-12 -5 0 12 12 -4 z" fill="var(--acc)"/><path d="M120 70 l12 -5 0 12 -12 -4 z" fill="var(--acc)"/><rect x="106" y="70" width="8" height="8" fill="var(--acc)"/>';}},
    wisp_chain:{char:'wisp',slot:'accessory',svg:function(){return '<path d="M92 150 q-4 12 2 22 M128 150 q4 12 -2 22" stroke="#c2c7d4" stroke-width="2" fill="none" opacity=".7"/>';}},
    orion_halo:{char:'orion',slot:'hat',svg:function(){return '<ellipse cx="110" cy="46" rx="26" ry="6" fill="none" stroke="#f6c945" stroke-width="2.5"/>';}},
    orion_comet:{char:'orion',slot:'accessory',svg:function(){return '<circle cx="150" cy="150" r="4" fill="#fff"/><path d="M150 150 L172 140" stroke="#fff" stroke-width="2" opacity=".5"/>';}},
    blot_glasses:{char:'blot',slot:'accessory',svg:function(){return '<circle cx="97" cy="132" r="12" fill="none" stroke="var(--acc)" stroke-width="2"/><circle cx="127" cy="136" r="8" fill="none" stroke="var(--acc)" stroke-width="2"/><path d="M109 133 h8" stroke="var(--acc)" stroke-width="2"/>';}},
    blot_bowler:{char:'blot',slot:'hat',svg:function(){return '<ellipse cx="110" cy="72" rx="20" ry="4" fill="var(--acc)"/><path d="M92 72 Q92 58 110 58 Q128 58 128 72 Z" fill="var(--acc)"/><rect x="92" y="66" width="36" height="3" fill="#141221"/>';}},
    pixl_shades:{char:'pixl',slot:'accessory',svg:function(){return '<rect x="86" y="98" width="17" height="8" fill="#20223a"/><rect x="118" y="98" width="17" height="8" fill="#20223a"/>';}},
    pixl_horns:{char:'pixl',slot:'hat',svg:function(){return '<g fill="#e6d8bb"><rect x="77" y="56" width="11" height="11"/><rect x="66" y="45" width="11" height="11"/><rect x="143" y="56" width="11" height="11"/><rect x="154" y="45" width="11" height="11"/></g>';}},
    boba_glasses:{char:'boba',slot:'accessory',svg:function(){return '<circle cx="96" cy="138" r="8" fill="none" stroke="#20223a" stroke-width="2"/><circle cx="124" cy="138" r="8" fill="none" stroke="#20223a" stroke-width="2"/><path d="M104 138 h12" stroke="#20223a" stroke-width="2"/>';}},
    boba_bow:{char:'boba',slot:'hat',svg:function(){return '<path d="M118 66 l-10 -4 0 10 10 -3 z" fill="#ff7aa8"/><path d="M134 66 l10 -4 0 10 -10 -3 z" fill="#ff7aa8"/><rect x="116" y="66" width="8" height="7" fill="#e0567f"/>';}},
    cadence_shades:{char:'cadence',slot:'accessory',svg:function(){return '<circle cx="90" cy="132" r="16" fill="#20223a" opacity=".85"/><circle cx="130" cy="132" r="16" fill="#20223a" opacity=".85"/><rect x="106" y="128" width="8" height="4" fill="#20223a"/>';}},
    cadence_cap:{char:'cadence',slot:'hat',svg:function(){return '<path d="M64 96 Q110 78 156 96 Z" fill="#3f6d9e"/><path d="M156 96 Q172 96 170 104 L152 102 Z" fill="#2f5580"/>';}},
    kami_flower:{char:'kami',slot:'accessory',svg:function(){return '<g transform="translate(140,150)"><path d="M0 -6 L5 0 L0 6 L-5 0 Z" fill="var(--acc)"/><circle r="2" fill="#fff"/></g>';}},
    kami_crown:{char:'kami',slot:'hat',svg:function(){return '<path d="M92 74 L98 60 L110 70 L122 60 L128 74 Z" fill="var(--acc)"/>';}},
    lumen_shades:{char:'lumen',slot:'accessory',svg:function(){return '<path d="M82 136 h32 v9 h-32 z" fill="#0a1526"/><path d="M100 138 h8" stroke="#0a1526" stroke-width="2"/>';}},
    lumen_fin:{char:'lumen',slot:'hat',svg:function(){return '<path d="M96 104 Q110 84 124 104 Z" fill="#16273f"/>';}},
    codex_glasses:{char:'codex',slot:'accessory',svg:function(){return '<circle cx="92" cy="104" r="8" fill="none" stroke="#6e4630" stroke-width="2"/><circle cx="128" cy="104" r="8" fill="none" stroke="#6e4630" stroke-width="2"/><path d="M100 104 h20" stroke="#6e4630" stroke-width="2"/>';}},
    codex_crown:{char:'codex',slot:'hat',svg:function(){return '<path d="M92 92 L98 78 L110 88 L122 78 L128 92 Z" fill="url(#va-gold)" stroke="#c47f10"/>';}},
    geode_spikes:{char:'geode',slot:'hat',svg:function(){return '<path d="M100 90 L104 74 L108 90 Z" fill="var(--acc)"/><path d="M118 92 L122 78 L126 92 Z" fill="var(--acc)"/>';}},
    geode_gem:{char:'geode',slot:'accessory',svg:function(){return '<g transform="translate(150,150)"><path d="M0 -6 L6 0 L0 8 L-6 0 Z" fill="var(--acc)"/><path d="M-6 0 L6 0" stroke="#fff" stroke-width="1" opacity=".5"/></g>';}},
    nova_crown:    { char: 'nova',    slot: 'hat', svg: function () { return '<path d="M90 58 L94 44 L102 54 L110 40 L118 54 L126 44 L130 58 Z" fill="url(#va-gold)" stroke="#c47f10" stroke-width="1" stroke-linejoin="round"/><circle cx="110" cy="49" r="2.6" fill="#ff6b6b"/><circle cx="97" cy="52" r="1.7" fill="#4aa6e8"/><circle cx="123" cy="52" r="1.7" fill="#4aa6e8"/>'; } },
    vesper_wizard: { char: 'vesper',  slot: 'hat', svg: function () { return '<path d="M110 10 Q103 34 86 47 L134 47 Q117 34 110 10 Z" fill="var(--acc)"/><path d="M110 10 Q103 34 86 47" fill="none" stroke="#000" stroke-width="1" opacity=".15"/><ellipse cx="110" cy="47" rx="27" ry="5" fill="var(--acc)"/><path d="M110 22 l1.6 4.2 4.2 1.6 -4.2 1.6 -1.6 4.2 -1.6 -4.2 -4.2 -1.6 4.2 -1.6 z" fill="#ffdf85"/>'; } },
    byte_cap:      { char: 'byte',    slot: 'hat', svg: function () { return '<path d="M77 53 Q110 35 143 53 Z" fill="#e0512e"/><path d="M77 53 Q61 53 58 61 L79 59 Z" fill="#c23f2e"/><circle cx="110" cy="40" r="2.4" fill="#c23f2e"/>'; } },
    ember_grad:    { char: 'ember',   slot: 'hat', svg: function () { return '<path d="M110 62 Q98 60 90 56 L90 52 Q110 60 130 52 L130 56 Q122 60 110 62 Z" fill="#2a2540"/><path d="M84 52 L110 44 L136 52 L110 60 Z" fill="#33304d"/><path d="M84 52 L110 44 L136 52 L110 60 Z" fill="none" stroke="#1a1830" stroke-width="1"/><path d="M110 52 L134 47 L134 62" stroke="#f6c945" stroke-width="1.6" fill="none"/><circle cx="134" cy="64" r="2.6" fill="#f6c945"/>'; } },
    kitsu_beanie:  { char: 'kitsu',   slot: 'hat', svg: function () { return '<path d="M79 72 Q79 56 110 56 Q141 56 141 72 Z" fill="#3f6d9e"/><rect x="77" y="68" width="66" height="8" rx="4" fill="#2f5580"/><circle cx="110" cy="52" r="5" fill="#f6c945"/>'; } },
    vyrn_crown:    { char: 'vyrn',    slot: 'hat', svg: function () { return '<path d="M93 82 L97 66 L105 76 L110 62 L115 76 L123 66 L127 82 Z" fill="url(#va-gold)" stroke="#c47f10" stroke-width="1" stroke-linejoin="round"/><circle cx="110" cy="72" r="2.4" fill="#e0567f"/>'; } },
    wisp_tophat:   { char: 'wisp',    slot: 'hat', svg: function () { return '<ellipse cx="110" cy="74" rx="26" ry="5" fill="#2a2740"/><rect x="93" y="50" width="34" height="26" rx="2" fill="#2a2740"/><rect x="93" y="66" width="34" height="6" fill="var(--acc)"/>'; } },
    orion_laurel:  { char: 'orion',   slot: 'hat', svg: function () { return '<path d="M80 64 Q66 84 80 106" fill="none" stroke="#5fae6d" stroke-width="3" stroke-linecap="round"/><path d="M140 64 Q154 84 140 106" fill="none" stroke="#5fae6d" stroke-width="3" stroke-linecap="round"/><ellipse cx="72" cy="76" rx="4" ry="2" fill="#5fae6d" transform="rotate(-40 72 76)"/><ellipse cx="70" cy="92" rx="4" ry="2" fill="#5fae6d" transform="rotate(-70 70 92)"/><ellipse cx="148" cy="76" rx="4" ry="2" fill="#5fae6d" transform="rotate(40 148 76)"/><ellipse cx="150" cy="92" rx="4" ry="2" fill="#5fae6d" transform="rotate(70 150 92)"/>'; } },
    blot_tophat:   { char: 'blot',    slot: 'hat', svg: function () { return '<ellipse cx="110" cy="72" rx="22" ry="4" fill="var(--acc)"/><path d="M95 52 L125 52 L123 72 L97 72 Z" fill="var(--acc)"/><rect x="95" y="65" width="30" height="4" fill="#141221"/>'; } },
    pixl_crown:    { char: 'pixl',    slot: 'hat', svg: function () { return '<g fill="#f6c945"><rect x="88" y="44" width="11" height="8"/><rect x="110" y="40" width="11" height="12"/><rect x="132" y="44" width="11" height="8"/></g>'; } },
    boba_hat:      { char: 'boba',    slot: 'hat', svg: function () { return '<ellipse cx="110" cy="104" rx="30" ry="5" fill="#3a2a20"/><path d="M89 104 Q89 86 110 86 Q131 86 131 104 Z" fill="#3a2a20"/><rect x="89" y="98" width="42" height="4" fill="#7a5a20" opacity=".5"/>'; } },
    cadence_beanie:{ char: 'cadence', slot: 'hat', svg: function () { return '<path d="M62 96 Q62 70 110 70 Q158 70 158 96 Z" fill="#e0512e"/><rect x="60" y="92" width="100" height="8" rx="4" fill="#c23f2e"/><circle cx="110" cy="66" r="5" fill="#f6c945"/>'; } },
    kami_hat:      { char: 'kami',    slot: 'hat', svg: function () { return '<path d="M58 74 L70 58 L84 76 Z" fill="var(--acc)"/><path d="M58 74 L70 58 L84 76 Z" fill="#000" opacity=".1"/><path d="M70 58 L70 76" stroke="#fff" stroke-width="1" opacity=".3"/>'; } },
    lumen_crown:   { char: 'lumen',   slot: 'hat', svg: function () { return '<path d="M143 62 L145 52 L149 59 L152 49 L155 59 L159 52 L161 62 Z" fill="url(#va-gold)" stroke="#c47f10" stroke-width=".8" stroke-linejoin="round"/>'; } },
    codex_grad:    { char: 'codex',   slot: 'hat', svg: function () { return '<path d="M110 100 Q100 98 92 94 L92 90 Q110 98 128 90 L128 94 Q120 98 110 100 Z" fill="#2a2540"/><path d="M84 90 L110 82 L136 90 L110 98 Z" fill="#33304d"/><path d="M84 90 L110 82 L136 90 L110 98 Z" fill="none" stroke="#1a1830" stroke-width="1"/><path d="M110 90 L134 85 L134 100" stroke="#f6c945" stroke-width="1.6" fill="none"/><circle cx="134" cy="102" r="2.4" fill="#f6c945"/>'; } },
    geode_crown:   { char: 'geode',   slot: 'hat', svg: function () { return '<path d="M92 96 L98 78 L106 90 L110 74 L114 90 L122 78 L128 96 Z" fill="var(--acc)" stroke="#fff" stroke-width=".6" opacity=".92" stroke-linejoin="round"/><path d="M110 74 L114 90 L128 96 Z" fill="#000" opacity=".12"/>'; } }
  };

  var CHAR_IDS = Object.keys(CHARACTERS);

  function pick(map, key, fallback) {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
  }

  // Compose an equipped avatar as an <svg> string.
  //   loadout = { character, skin, background, frame, pet }  (all item ids)
  //   opts    = { size, crop }   crop: 'full' (portrait) | 'bust' (square, head)
  function compose(loadout, opts) {
    loadout = loadout || {}; opts = opts || {};
    ensureDefs();
    var id = pick(CHARACTERS, loadout.character, null) ? loadout.character : 'nova';
    var accent = pick(SKINS, loadout.skin, null) || DEFAULT_ACCENTS[id] || '#37e0cf';
    var bg = pick(BACKGROUNDS, loadout.background, '');
    var fr = pick(FRAMES, loadout.frame, '');
    var pet = pick(PETS, loadout.pet, '');
    // Per-character wearables — rendered only when their character is equipped
    // (a mismatched item in the loadout is simply skipped, never an error).
    var wl = '';
    ['outfit', 'accessory', 'hat'].forEach(function (slot) {
      var wr = loadout[slot] ? WEARABLES[loadout[slot]] : null;
      if (wr && wr.char === id && wr.slot === slot) wl += wr.svg();
    });
    var crop = opts.crop === 'bust' ? 'bust' : 'full';
    var vb = crop === 'bust' ? '34 28 152 152' : '0 0 220 260';
    var size = opts.size || 120;
    var w = size, h = crop === 'bust' ? size : Math.round(size * 260 / 220);
    return '<svg class="vidya-avatar va-' + id + '" viewBox="' + vb + '" width="' + w + '" height="' + h + '" '
      + 'style="--acc:' + accent + '" role="img" aria-label="Student avatar" xmlns="http://www.w3.org/2000/svg">'
      + (bg ? '<g class="va-bg">' + bg + '</g>' : '')
      + '<g class="va-char">' + CHARACTERS[id]() + '</g>'
      + (wl ? '<g class="va-wear">' + wl + '</g>' : '')
      + (pet ? '<g class="va-pet">' + pet + '</g>' : '')
      + (fr ? '<g class="va-frame">' + fr + '</g>' : '')
      + '</svg>';
  }

  global.VidyaAvatar = {
    compose: compose,
    characters: CHAR_IDS.slice(),
    defaultAccent: function (id) { return DEFAULT_ACCENTS[id] || '#37e0cf'; },
    has: function (id) { return Object.prototype.hasOwnProperty.call(CHARACTERS, id); },
    lore: function (id) { return LORE[id] || null; },
    skins: SKINS,
    backgrounds: Object.keys(BACKGROUNDS),
    frames: Object.keys(FRAMES),
    pets: Object.keys(PETS),
    // item ids of the wearables drawn for a given character (for the Locker to
    // show only the wearables that fit the character being viewed).
    wearablesFor: function (id) {
      return CHAR_IDS.indexOf(id) < 0 ? [] : Object.keys(WEARABLES).filter(function (k) { return WEARABLES[k].char === id; });
    },
    wearableSlot: function (itemId) { return WEARABLES[itemId] ? WEARABLES[itemId].slot : null; },
    ensureDefs: ensureDefs
  };
})(window);
