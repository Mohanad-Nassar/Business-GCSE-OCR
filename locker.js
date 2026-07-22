// ══════════════════════════════════════════════════════════════
// LOCKER (WP-4) — the rewards-store customiser. A student picks a base
// character, buys characters + universal cosmetics + per-character wearables
// with earned coins, and equips a full loadout. Renders every preview via
// avatar.js (VidyaAvatar); wired to the WP-1 RPCs:
//   get_my_wallet · buy_item · equip_character · equip_items
//
// Standalone student page — same auth + account-cluster pattern as
// daily-revise.js (tasksAuthInit makes the client from the stored session and
// redirects to /index.html if signed out). Item ids in shop_items match the
// keys in avatar.js exactly (characters, SKINS, BACKGROUNDS, FRAMES, PETS,
// WEARABLES), so a stored loadout renders directly. See docs/REWARDS-STORE-PLAN.md.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var client = null;
  var state = { balance: 0, owned: {}, items: [], byId: {}, character: null, loadout: {}, tab: 'character', busy: false,
                perks: {}, subjects: [], freezeSubject: null };

  // Short blurbs for the consumable perks (matched to the use_perk effects).
  var PERK_INFO = {
    perk_streak_freeze: { icon: '🧊', desc: 'Protects one missed day so a subject streak survives. Use it on a day you know you\'ll miss — or right after a slip. Never touches your marks.' },
    perk_mystery_box:   { icon: '🎁', desc: 'Opens to a random cosmetic you don\'t own yet — a skin, background, frame or pet.' }
  };

  var $ = function (s) { return document.querySelector(s); };
  var esc = (typeof taskEscapeHtml === 'function') ? taskEscapeHtml : function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var RAR = { common: '--lk-common', uncommon: '--lk-uncommon', rare: '--lk-rare', epic: '--lk-epic', legendary: '--lk-legendary', mythic: '--lk-mythic' };
  var SLOT_LABEL = { skin: 'Skins — recolour', hat: 'Headwear', accessory: 'Accessories', outfit: 'Outfits', background: 'Backgrounds', frame: 'Frames', pet: 'Pets' };
  var WEAR_SLOTS = ['hat', 'accessory', 'outfit'];
  var STYLE_SLOTS = ['skin', 'background', 'frame', 'pet'];

  async function init() {
    if (typeof tasksAuthInit !== 'function' || typeof VidyaAvatar === 'undefined') return;
    var auth = await tasksAuthInit('student');
    if (!auth) return;                       // tasksAuthInit already redirected
    client = auth.client;
    window._gcseProfile = window._gcseProfile || { username: auth.username, role: auth.role };
    window._gcseSupabaseClient = window._gcseSupabaseClient || client;
    if (typeof _gcseInjectAccountBar === 'function') _gcseInjectAccountBar();
    await loadAll();
    render();
  }

  async function loadAll() {
    try { var w = await client.rpc('get_my_wallet'); if (!w.error && w.data) state.balance = w.data.balance | 0; } catch (e) {}
    try {
      var it = await client.from('shop_items')
        .select('item_id,category,name,rarity,tier,price,unlock_rule,sort_order,character_scope')
        .eq('active', true);
      state.items = (it.data || []).slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    } catch (e) { state.items = []; }
    state.byId = {};
    state.items.forEach(function (i) { state.byId[i.item_id] = i; });

    try {
      var pu = await client.from('student_purchases').select('item_id');
      state.owned = {};
      (pu.data || []).forEach(function (r) { state.owned[r.item_id] = 1; });
    } catch (e) { state.owned = {}; }

    try {
      // Seat them on their equipped character, or the same stable default the
      // header shows (get_my_avatar_or_default doesn't persist — equipping does).
      var av = await client.rpc('get_my_avatar_or_default');
      state.character = (av.data && av.data.character) || firstStarter();
      state.loadout = (av.data && av.data.loadout) || {};
    } catch (e) { state.character = firstStarter(); state.loadout = {}; }

    if (!state.character || !VidyaAvatar.has(state.character)) state.character = firstStarter();
    if (!state.loadout || typeof state.loadout !== 'object') state.loadout = {};

    // Perk holdings (qty per perk).
    try {
      var pk = await client.from('student_perks').select('perk_key, qty');
      state.perks = {};
      (pk.data || []).forEach(function (r) { state.perks[r.perk_key] = r.qty | 0; });
    } catch (e) { state.perks = {}; }

    // The student's subjects — used by the streak-freeze picker (streaks are
    // per-subject). Falls back gracefully if the RPC isn't present.
    try {
      var su = await client.rpc('get_my_subjects');
      state.subjects = (su.data || []).map(function (s) { return { slug: s.slug, name: s.name }; });
    } catch (e) { state.subjects = []; }
    var last = null; try { last = localStorage.getItem('gcse_last_subject'); } catch (e) {}
    state.freezeSubject = (state.subjects.some(function (s) { return s.slug === last; }) ? last
      : (state.subjects[0] && state.subjects[0].slug)) || null;
  }

  function firstStarter() {
    var c = state.items.filter(function (i) { return i.category === 'character' && i.tier === 'starter' && VidyaAvatar.has(i.item_id); });
    return c.length ? c[0].item_id : (VidyaAvatar.characters[0] || 'nova');
  }

  // ── helpers ──
  function isOwned(it) { return it.tier === 'starter' || !!state.owned[it.item_id]; }
  function isEquipped(it) { return it.category === 'character' ? state.character === it.item_id : state.loadout[it.category] === it.item_id; }
  function niceName(it) { return esc((it.name || it.item_id).replace((it.character_scope || '') + '_', '').replace(/_/g, ' ')); }

  // A small preview for a shop card: the item on the right character.
  function preview(it) {
    if (it.category === 'skin') {
      var col = (VidyaAvatar.skins && VidyaAvatar.skins[it.item_id]) || 'var(--mid)';
      return '<span class="lk-sw" style="background:' + col + '"></span>';
    }
    var base = (WEAR_SLOTS.indexOf(it.category) >= 0 && it.character_scope) ? it.character_scope : state.character;
    var lo = { character: base };
    lo[it.category] = it.item_id;
    return VidyaAvatar.compose(lo, { size: 92 });
  }

  function cardFoot(it, eq, owned) {
    if (it.tier === 'prestige' && !owned) return '<span class="lk-btn locked">🔒 Earned</span>';
    if (it.category === 'character') {
      if (eq) return '<span class="lk-btn equipped">Equipped ✓</span>';
      if (owned) return '<button class="lk-btn equip" type="button" data-equip="' + esc(it.item_id) + '">Equip</button>';
    } else {
      if (owned) return '<button class="lk-btn ' + (eq ? 'equipped' : 'equip') + '" type="button" data-equip="' + esc(it.item_id) + '">' + (eq ? 'Worn ✓' : 'Equip') + '</button>';
    }
    if (state.balance >= it.price) return '<button class="lk-btn buy" type="button" data-buy="' + esc(it.item_id) + '">✦ ' + it.price + '</button>';
    return '<button class="lk-btn buy" type="button" disabled>✦ ' + it.price + '</button>';
  }

  function cardHtml(it) {
    var eq = isEquipped(it), owned = isOwned(it);
    return '<div class="lk-card' + (eq ? ' eq' : '') + '"><span class="lk-rar" style="background:var(' + (RAR[it.rarity] || RAR.common) + ')"></span>'
      + '<div class="lk-p">' + preview(it) + '</div>'
      + '<div class="lk-cm"><div class="lk-nm">' + niceName(it) + '</div>' + cardFoot(it, eq, owned) + '</div></div>';
  }

  function grid(list) { return '<div class="lk-items">' + list.map(cardHtml).join('') + '</div>'; }
  function byCat(cat, scope) {
    return state.items.filter(function (i) {
      return i.category === cat && (scope === undefined || (i.character_scope || null) === scope);
    });
  }

  function renderHero() {
    var lo = { character: state.character };
    Object.keys(state.loadout).forEach(function (k) { lo[k] = state.loadout[k]; });
    var stage = $('#lkStage'); if (stage) stage.innerHTML = VidyaAvatar.compose(lo, { size: 240 });
    var cItem = state.byId[state.character];
    var who = $('#lkWho'); if (who) who.textContent = cItem ? cItem.name : state.character;

    // Character lore (from avatar.js) — the story for the worn character.
    var lore = (typeof VidyaAvatar.lore === 'function') ? VidyaAvatar.lore(state.character) : null;
    var arch = $('#lkArch'); if (arch) arch.textContent = lore ? lore.archetype : '';
    var tl = $('#lkTagline'); if (tl) tl.textContent = lore ? lore.tagline : '';
    var bl = $('#lkBlurb'); if (bl) bl.textContent = lore ? lore.blurb : '';
    var tr = $('#lkTraits');
    if (tr) tr.innerHTML = (lore && lore.traits) ? lore.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') : '';
    var tags = [];
    ['skin', 'hat', 'accessory', 'outfit', 'background', 'frame', 'pet'].forEach(function (sl) {
      var id = state.loadout[sl];
      if (id && state.byId[id]) tags.push('<span class="lk-wtag">' + niceName(state.byId[id]) + '</span>');
    });
    var wear = $('#lkWearing'); if (wear) wear.innerHTML = tags.join('') || '<span class="lk-wtag lk-empty">nothing equipped yet</span>';
    var bal = $('#lkBal'); if (bal) bal.textContent = state.balance;
  }

  function renderBody() {
    var html = '';
    if (state.tab === 'character') {
      html = grid(byCat('character'));
    } else if (state.tab === 'style') {
      STYLE_SLOTS.forEach(function (cat) {
        var list = byCat(cat, null);
        if (list.length) html += '<div class="lk-sub">' + SLOT_LABEL[cat] + '</div>' + grid(list);
      });
    } else if (state.tab === 'wardrobe') {
      var cName = (state.byId[state.character] || {}).name || state.character;
      html = '<p class="lk-hint">Wearables are made to fit the character you have on (<b>' + esc(cName) + '</b>). Equip another character to see theirs.</p>';
      var any = false;
      WEAR_SLOTS.forEach(function (cat) {
        var list = byCat(cat, state.character);
        if (list.length) { any = true; html += '<div class="lk-sub">' + SLOT_LABEL[cat] + '</div>' + grid(list); }
      });
      if (!any) html += '<p class="lk-hint">No wearables for this character yet.</p>';
    } else if (state.tab === 'perks') {
      var perks = state.items.filter(function (i) { return i.category === 'perk'; })
        .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
      html = perks.length
        ? '<p class="lk-hint">Perks are consumables — buy them, then use them when you need them. They never touch your marks or mastery.</p>' + perks.map(perkCard).join('')
        : '<p class="lk-hint">No perks available yet.</p>';
    }
    var body = $('#lkBody'); if (body) body.innerHTML = html;
  }

  function subjectSelectHtml() {
    if (!state.subjects.length) return '';
    return '<select class="lk-perk-subj" id="lkFreezeSubj" aria-label="Which streak to protect">'
      + state.subjects.map(function (s) {
          return '<option value="' + esc(s.slug) + '"' + (s.slug === state.freezeSubject ? ' selected' : '') + '>' + esc(s.name) + '</option>';
        }).join('')
      + '</select>';
  }

  function perkCard(it) {
    var info = PERK_INFO[it.item_id] || { icon: '✨', desc: '' };
    var qty = state.perks[it.item_id] | 0;
    var buyBtn = '<button class="lk-btn buy" type="button" data-buyperk="' + esc(it.item_id) + '"'
      + (state.balance >= it.price ? '' : ' disabled') + '>✦ ' + it.price + '</button>';
    var useRow = '';
    if (qty > 0) {
      if (it.item_id === 'perk_streak_freeze') useRow = subjectSelectHtml() + '<button class="lk-btn equip" type="button" data-useperk="' + esc(it.item_id) + '">Freeze streak</button>';
      else useRow = '<button class="lk-btn equip" type="button" data-useperk="' + esc(it.item_id) + '">Open</button>';
    }
    return '<div class="lk-perk"><div class="lk-perk-ico" aria-hidden="true">' + info.icon + '</div>'
      + '<div class="lk-perk-body">'
      + '<div class="lk-perk-top"><span class="lk-perk-name">' + esc(it.name) + '</span>'
      + (qty > 0 ? '<span class="lk-perk-qty">×' + qty + ' owned</span>' : '') + '</div>'
      + '<p class="lk-perk-desc">' + esc(info.desc) + '</p>'
      + '<div class="lk-perk-actions">' + buyBtn + useRow + '</div>'
      + '</div></div>';
  }

  function syncTabs() {
    document.querySelectorAll('#lkTabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === state.tab); });
  }
  function render() { renderHero(); renderBody(); syncTabs(); cacheAvatar(); }

  // Keep the header avatar (account-cluster.js WP-3) in sync: same cache key,
  // so navigating away shows the freshly-equipped look with no flash of the old.
  function cacheAvatar() {
    try {
      var u = window._gcseProfile && window._gcseProfile.username;
      localStorage.setItem('gcse_avatar_v1', JSON.stringify({ u: u, character: state.character, loadout: state.loadout }));
    } catch (e) {}
  }

  function toast(msg, big) {
    var t = $('#lkToast'); if (!t) return;
    t.textContent = msg;
    t.classList.toggle('lk-big', !!big);
    t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, big ? 3200 : 2200);
  }

  // ── Feedback: sound + celebration (WP-6 polish) ──
  // Self-contained WebAudio (the Locker doesn't load gamification.js), but it
  // honours the SAME 'gcse_sound_off' toggle, so the global 🔊 switch governs it.
  var _lkAudio = null;
  function lkSoundOn() { try { return localStorage.getItem('gcse_sound_off') !== '1'; } catch (e) { return true; } }
  function lkTone(freq, start, dur, type, gain) {
    try {
      if (!_lkAudio) _lkAudio = new (window.AudioContext || window.webkitAudioContext)();
      if (_lkAudio.state === 'suspended') _lkAudio.resume();
      var ctx = _lkAudio, t0 = ctx.currentTime + start;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type || 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    } catch (e) {}
  }
  function lkSound(kind) {
    if (!lkSoundOn()) return;
    if (kind === 'buy') { lkTone(880, 0, .12, 'triangle', .13); lkTone(1320, .09, .18, 'triangle', .15); }
    else if (kind === 'celebrate') { [660, 880, 1100, 1320].forEach(function (f, i) { lkTone(f, i * .1, .3, 'triangle', .16); }); }
    else if (kind === 'equip') { lkTone(560, 0, .08, 'sine', .08); }
  }

  // A short, tasteful gold-led confetti burst. Skipped for reduced-motion.
  function lkConfetti() {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var colors = ['#e0a52e', '#3b82f6', '#3fae5a', '#a855f7', '#ec4899', '#d4a843'];
      var wrap = document.createElement('div');
      wrap.className = 'lk-confetti';
      for (var i = 0; i < 40; i++) {
        var p = document.createElement('i');
        var ang = Math.random() * Math.PI * 2, mag = 120 + Math.random() * 220;
        p.style.background = colors[i % colors.length];
        p.style.setProperty('--dx', Math.round(Math.cos(ang) * mag) + 'px');
        p.style.setProperty('--dy', Math.round(Math.sin(ang) * mag * 0.8 + 120) + 'px');
        p.style.setProperty('--rot', Math.round((Math.random() * 720 - 360)) + 'deg');
        p.style.animationDelay = (Math.random() * 90) + 'ms';
        wrap.appendChild(p);
      }
      document.body.appendChild(wrap);
      setTimeout(function () { wrap.remove(); }, 1500);
    } catch (e) {}
  }

  function celebrate(name) {
    lkSound('celebrate');
    lkConfetti();
    toast('🎉 First unlock — ' + name + '!', true);
  }
  function friendlyErr(e) {
    var m = (e && e.message) || '';
    if (/insufficient/i.test(m)) return 'Not enough coins yet — keep practising!';
    if (/already owned/i.test(m)) return 'You already own that one.';
    if (/not purchasable/i.test(m)) return 'That one is earned, not bought.';
    if (/is free/i.test(m)) return 'That one is free — just equip it.';
    if (/students only/i.test(m)) return 'The Locker is for student accounts.';
    if (/none of that perk/i.test(m)) return "You don't have that perk to use.";
    if (/safe today/i.test(m)) return "Your streak's safe today — save the freeze for a day you miss.";
    if (/lapsed too long/i.test(m)) return 'That streak lapsed too long ago for a freeze.';
    if (/already frozen/i.test(m)) return "That day's already frozen.";
    if (/no streak to protect/i.test(m)) return 'No streak to protect yet — do some practice first!';
    if (/own every cosmetic/i.test(m)) return 'You already own everything a box can hold!';
    if (/subject required/i.test(m)) return 'Pick a subject to protect.';
    return 'Something went wrong — please try again.';
  }

  async function buy(id) {
    if (state.busy) return; state.busy = true;
    var firstEver = Object.keys(state.owned).length === 0;   // no bought items yet
    try {
      var r = await client.rpc('buy_item', { p_item_id: id });
      if (r.error) { toast(friendlyErr(r.error)); }
      else {
        if (r.data && typeof r.data.balance === 'number') state.balance = r.data.balance;
        state.owned[id] = 1;
        if (firstEver) celebrate(niceName(state.byId[id]));
        else { lkSound('buy'); toast('Bought ' + niceName(state.byId[id]) + '  ✦'); }
        render();
      }
    } catch (e) { toast(friendlyErr(e)); }
    state.busy = false;
  }

  async function equipCharacter(id) {
    if (state.busy) return; state.busy = true;
    try {
      var r = await client.rpc('equip_character', { p_character_id: id });
      if (r.error) { toast(friendlyErr(r.error)); }
      else {
        state.character = id;
        // drop wearables that fit the OLD character; keep universal cosmetics
        var lo = {};
        STYLE_SLOTS.forEach(function (k) { if (state.loadout[k]) lo[k] = state.loadout[k]; });
        state.loadout = lo;
        try { await client.rpc('equip_items', { p_loadout: lo }); } catch (e) {}
        lkSound('equip');
        render();
      }
    } catch (e) { toast(friendlyErr(e)); }
    state.busy = false;
  }

  async function equipCosmetic(cat, id) {
    if (state.busy) return; state.busy = true;
    var lo = {}; Object.keys(state.loadout).forEach(function (k) { lo[k] = state.loadout[k]; });
    if (lo[cat] === id) delete lo[cat]; else lo[cat] = id;   // toggle
    try {
      var r = await client.rpc('equip_items', { p_loadout: lo });
      if (r.error) { toast(friendlyErr(r.error)); }
      else { state.loadout = lo; lkSound('equip'); render(); }
    } catch (e) { toast(friendlyErr(e)); }
    state.busy = false;
  }

  async function buyPerk(id) {
    if (state.busy) return; state.busy = true;
    try {
      var r = await client.rpc('buy_perk', { p_perk_key: id });
      if (r.error) { toast(friendlyErr(r.error)); }
      else {
        if (r.data && typeof r.data.balance === 'number') state.balance = r.data.balance;
        state.perks[id] = (r.data && typeof r.data.qty === 'number') ? r.data.qty : ((state.perks[id] | 0) + 1);
        lkSound('buy');
        toast('Bought ' + esc((state.byId[id] || {}).name || 'perk'));
        render();
      }
    } catch (e) { toast(friendlyErr(e)); }
    state.busy = false;
  }

  async function usePerk(id) {
    if (state.busy) return; state.busy = true;
    var subj = null;
    if (id === 'perk_streak_freeze') {
      var sel = $('#lkFreezeSubj');
      subj = sel ? sel.value : state.freezeSubject;
      if (!subj) { toast('Pick a subject to protect'); state.busy = false; return; }
      state.freezeSubject = subj;
    }
    try {
      var r = await client.rpc('use_perk', { p_perk_key: id, p_subject: subj });
      if (r.error) { toast(friendlyErr(r.error)); }
      else {
        var d = r.data || {};
        state.perks[id] = (typeof d.remaining === 'number') ? d.remaining : Math.max(0, (state.perks[id] | 0) - 1);
        if (d.effect === 'streak_freeze') { lkSound('equip'); toast('🧊 Streak frozen — ' + (d.frozen_date || 'covered'), true); }
        else if (d.effect === 'mystery_box') {
          if (d.granted) state.owned[d.granted] = 1;
          lkSound('celebrate'); lkConfetti();
          toast('🎁 You unboxed ' + (d.granted_name || 'a cosmetic') + '!', true);
        } else { toast('Done'); }
        render();
      }
    } catch (e) { toast(friendlyErr(e)); }
    state.busy = false;
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var tb = e.target.closest('#lkTabs [data-tab]');
    if (tb) { state.tab = tb.dataset.tab; renderBody(); syncTabs(); return; }
    var b = e.target.closest('[data-buy]');
    if (b) { buy(b.dataset.buy); return; }
    var bp = e.target.closest('[data-buyperk]');
    if (bp) { buyPerk(bp.dataset.buyperk); return; }
    var up = e.target.closest('[data-useperk]');
    if (up) { usePerk(up.dataset.useperk); return; }
    var eqEl = e.target.closest('[data-equip]');
    if (eqEl) {
      var it = state.byId[eqEl.dataset.equip];
      if (!it) return;
      if (it.category === 'character') equipCharacter(it.item_id);
      else equipCosmetic(it.category, it.item_id);
    }
  });

  // Persist the streak-freeze subject choice across re-renders.
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'lkFreezeSubj') state.freezeSubject = e.target.value;
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
