// ══════════════════════════════════════════════════════════════
// SITE THEMES (shared) — one file defines every colour theme and the
// floating 🎨 switcher that appears on EVERY page (student topic pages,
// dashboards, teacher pages, landing, auth). Loaded dynamically by
// footer-legal.js (all pages) and teacher-nav.js (teacher-worksheets,
// which has no legal footer) — page HTML is never edited.
//
// How it works: style.css / business-style.css / the inline styles in
// hub.html + teacher pages / landing.css all resolve their colours from
// the same :root custom properties (--ink, --paper, --accent, …).
// Each theme below overrides those properties via html[data-theme="…"],
// which out-specifies every :root block regardless of load order.
// "classic" is the default: no attribute, zero overrides — choosing it
// restores today's design byte-for-byte.
//
// The chosen theme persists in localStorage ('gcse_theme'), applies on
// every page, and syncs live across open tabs via the storage event.
// ══════════════════════════════════════════════════════════════

(function () {
    'use strict';
    if (window.__gcseThemeInit) return;
    window.__gcseThemeInit = true;

    var STORAGE_KEY = 'gcse_theme';
    // Site-wide default when the visitor hasn't picked a theme yet.
    // An explicit choice (including 'classic') always wins over this.
    var DEFAULT_THEME = 'aurora';

    // Every key maps straight onto a custom property. The first eleven
    // are the app-shell palette shared by style.css / business-style.css
    // / hub / teacher inline styles; the last five are landing.css's own
    // names (index.html deliberately loads neither app stylesheet).
    var THEMES = [
        {
            id: 'classic',
            name: 'Vidya Classic',
            tagline: 'Warm parchment, plum & gold — the original look',
            vars: null // default — no overrides
        },
        {
            id: 'aurora',
            name: 'Aurora Blue',
            tagline: 'Cool navy & azure — a modern business aura (site default)',
            vars: {
                '--ink': '#0a1830', '--paper': '#eef4fb', '--cream': '#dfe9f6',
                '--accent': '#1e5fd0', '--gold': '#3f9fce', '--teal': '#0e6d86',
                '--mid': '#43597a', '--border': '#bfd2e8',
                '--success': '#1e7a46', '--wrong': '#c03a2e',
                '--card-bg': '#ffffff', '--primary': '#16457e',
                '--ink-2': '#123055', '--card': '#ffffff',
                '--marigold': '#1e5fd0', '--marigold-dark': '#16457e',
                '--shadow': '0 18px 50px rgba(10, 24, 48, .12)'
            },
            header: 'background-color:#0a1830;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(76,166,255,.22) 0,rgba(76,166,255,.22) 99px,transparent 100px),' +
                'linear-gradient(135deg,#0a1830 0%,#123764 62%,#155a8a 100%);'
        },
        {
            id: 'emerald',
            name: 'Emerald Executive',
            tagline: 'Deep pine & emerald with brass — calm and premium',
            vars: {
                '--ink': '#0c1f18', '--paper': '#f0f6f1', '--cream': '#e0ece2',
                '--accent': '#0d7a52', '--gold': '#c9a03a', '--teal': '#116c7d',
                '--mid': '#4c6357', '--border': '#c2d6c6',
                '--success': '#1e7a3c', '--wrong': '#bf4630',
                '--card-bg': '#fcfefc', '--primary': '#0d5c40',
                '--ink-2': '#123a2b', '--card': '#fcfefc',
                '--marigold': '#0d7a52', '--marigold-dark': '#0a5c3e',
                '--shadow': '0 18px 50px rgba(12, 31, 24, .12)'
            },
            header: 'background-color:#0c1f18;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(66,190,140,.20) 0,rgba(66,190,140,.20) 99px,transparent 100px),' +
                'linear-gradient(135deg,#0c1f18 0%,#12472f 65%,#0e5c3c 100%);'
        },
        {
            id: 'graphite',
            name: 'Graphite Minimal',
            tagline: 'Near-black, quiet greys, one indigo accent',
            vars: {
                '--ink': '#16181d', '--paper': '#f5f5f6', '--cream': '#eaeaec',
                '--accent': '#4f46e5', '--gold': '#a87c1f', '--teal': '#3f5f9e',
                '--mid': '#565b66', '--border': '#d7d8dc',
                '--success': '#2b7a4b', '--wrong': '#c2402f',
                '--card-bg': '#ffffff', '--primary': '#33383f',
                '--ink-2': '#24262d', '--card': '#ffffff',
                '--marigold': '#4f46e5', '--marigold-dark': '#3c34c4',
                '--shadow': '0 18px 50px rgba(22, 24, 29, .10)'
            },
            header: 'background-color:#16181d;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(99,102,241,.20) 0,rgba(99,102,241,.20) 99px,transparent 100px),' +
                'linear-gradient(135deg,#16181d 0%,#1e2027 70%,#26293a 100%);'
        },
        {
            id: 'sunset',
            name: 'Sunset Studio',
            tagline: 'Warm ivory, burnt orange & amber — energetic',
            vars: {
                '--ink': '#291710', '--paper': '#faf2ea', '--cream': '#f2e3d2',
                '--accent': '#b23f0e', '--gold': '#d9982a', '--teal': '#8a3d68',
                '--mid': '#6d5646', '--border': '#e2cbb3',
                '--success': '#3d7a2c', '--wrong': '#c22f2f',
                '--card-bg': '#fffcf7', '--primary': '#8f3a10',
                '--ink-2': '#3d2418', '--card': '#fffcf7',
                '--marigold': '#b23f0e', '--marigold-dark': '#8f3210',
                '--shadow': '0 18px 50px rgba(41, 23, 16, .12)'
            },
            header: 'background-color:#291710;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(235,150,70,.24) 0,rgba(235,150,70,.24) 99px,transparent 100px),' +
                'linear-gradient(135deg,#291710 0%,#5c2a12 60%,#8a3d18 100%);'
        },
        {
            id: 'midnight',
            name: 'Midnight Aurora',
            tagline: 'Dark mode — deep navy, dark header & sidebar',
            dark: true,
            surfaceDark: '#0d1524',      // sidebar / elevated dark chrome
            vars: {
                '--ink': '#e6ecf7', '--paper': '#0d1420', '--cream': '#182238',
                '--accent': '#5c9bf5', '--gold': '#e2b866', '--teal': '#5cc3d8',
                '--mid': '#9fb0cc', '--border': '#2b3a56',
                // success/wrong stay mid-dark: they are also used as text
                // colours on the hardcoded light feedback tints (#d4edda…)
                '--success': '#2f8a58', '--wrong': '#d05a45',
                '--card-bg': '#141d30', '--primary': '#24457c',
                '--ink-2': '#182238', '--card': '#141d30',
                '--marigold': '#5c9bf5', '--marigold-dark': '#3a6fc0',
                '--shadow': '0 18px 50px rgba(0, 0, 0, .55)',
                // chrome = the "dark UI band" surfaces (header/tab-bar/
                // sidebar/pills/solid buttons). Light themes leave these
                // unset so every var(--chrome, var(--ink)) falls back.
                '--chrome': '#111c30', '--chrome-text': '#e6ecf7'
            },
            // Dark header band (was a light "frost" — users wanted it dark).
            // Header text is forced light in the dark-theme block below.
            header: 'background-color:#0e1728;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(92,155,245,.25) 0,rgba(92,155,245,.25) 99px,transparent 100px),' +
                'linear-gradient(135deg,#0e1728 0%,#152742 62%,#1a3457 100%);'
        },
        {
            id: 'obsidian',
            name: 'Obsidian Night',
            tagline: 'Dark mode — charcoal black with violet glow',
            dark: true,
            surfaceDark: '#101019',
            vars: {
                '--ink': '#e9e7f2', '--paper': '#0c0d12', '--cream': '#191b24',
                '--accent': '#9285f0', '--gold': '#dcac57', '--teal': '#4bc7b8',
                '--mid': '#a8a6bd', '--border': '#2c2f3d',
                // success/wrong stay mid-dark: also used as text on the
                // hardcoded light feedback tints (#d4edda…)
                '--success': '#2f8a58', '--wrong': '#d05a45',
                '--card-bg': '#14161d', '--primary': '#3a3568',
                '--ink-2': '#191b24', '--card': '#14161d',
                '--marigold': '#9285f0', '--marigold-dark': '#6355cf',
                '--shadow': '0 18px 50px rgba(0, 0, 0, .6)',
                '--chrome': '#15151f', '--chrome-text': '#e9e7f2'
            },
            header: 'background-color:#111119;background-image:' +
                'radial-gradient(circle 100px at calc(100% - 60px) 60px,' +
                'rgba(146,133,240,.25) 0,rgba(146,133,240,.25) 99px,transparent 100px),' +
                'linear-gradient(135deg,#111119 0%,#191a2b 70%,#22243c 100%);'
        }
    ];

    // ── BACKGROUND PATTERNS — quiet, learning-friendly textures applied to
    // the page body via html[data-bg="…"]. Every colour is a color-mix of
    // the theme's own variables at single-digit opacity, so patterns
    // re-tint automatically when the theme changes and can never fight the
    // content. Default = 'none' (no attribute, plain theme colour).
    // Browsers without color-mix simply ignore the rule (plain background).
    var BG_STORAGE_KEY = 'gcse_bg';
    var DEFAULT_BG = 'none';
    var INK6 = 'color-mix(in srgb, var(--ink) 6%, transparent)';
    var INK9 = 'color-mix(in srgb, var(--ink) 9%, transparent)';
    var BGS = [
        { id: 'none', name: 'None', tagline: 'Plain theme colour (default)', css: '' },
        {
            id: 'dots', name: 'Dot Grid', tagline: 'Quiet dotted paper',
            css: 'background-image:radial-gradient(' + INK9 + ' 1.2px,transparent 1.2px);' +
                'background-size:22px 22px;'
        },
        {
            id: 'grid', name: 'Graph Paper', tagline: 'Fine squared grid',
            css: 'background-image:linear-gradient(' + INK6 + ' 1px,transparent 1px),' +
                'linear-gradient(90deg,' + INK6 + ' 1px,transparent 1px);' +
                'background-size:28px 28px;'
        },
        {
            id: 'lines', name: 'Ruled Lines', tagline: 'Exercise-book rules',
            css: 'background-image:linear-gradient(' + INK6 + ' 1px,transparent 1px);' +
                'background-size:100% 34px;'
        },
        {
            id: 'stripes', name: 'Pinstripe', tagline: 'Faint diagonal stripes',
            css: 'background-image:repeating-linear-gradient(45deg,' + INK6 + ' 0 1px,transparent 1px 16px);'
        },
        {
            id: 'lattice', name: 'Lattice', tagline: 'Woven diagonal weave',
            css: 'background-image:repeating-linear-gradient(45deg,' +
                'color-mix(in srgb, var(--ink) 4%, transparent) 0 1px,transparent 1px 18px),' +
                'repeating-linear-gradient(-45deg,' +
                'color-mix(in srgb, var(--ink) 4%, transparent) 0 1px,transparent 1px 18px);'
        },
        {
            id: 'chevron', name: 'Chevron', tagline: 'Soft zigzag texture',
            css: 'background-image:linear-gradient(135deg,' +
                'color-mix(in srgb, var(--ink) 4%, transparent) 25%,transparent 25%),' +
                'linear-gradient(225deg,' +
                'color-mix(in srgb, var(--ink) 4%, transparent) 25%,transparent 25%);' +
                'background-size:44px 22px;'
        },
        {
            id: 'rings', name: 'Ripples', tagline: 'Concentric rings from the corner',
            css: 'background-image:repeating-radial-gradient(circle at 110% -10%,' +
                'transparent 0 88px,' + INK6 + ' 88px 89px);background-attachment:fixed;',
            swatch: 'background-image:repeating-radial-gradient(circle at 110% -10%,' +
                'transparent 0 11px,' + INK9 + ' 11px 12px);'
        },
        {
            id: 'glow', name: 'Aurora Glow', tagline: 'Bold accent, teal & gold corner washes',
            css: 'background-image:radial-gradient(640px at 88% -8%,' +
                'color-mix(in srgb, var(--accent) 28%, transparent),transparent 70%),' +
                'radial-gradient(740px at -8% 108%,' +
                'color-mix(in srgb, var(--teal) 24%, transparent),transparent 70%),' +
                'radial-gradient(560px at 72% 68%,' +
                'color-mix(in srgb, var(--gold) 16%, transparent),transparent 72%);' +
                'background-attachment:fixed;background-repeat:no-repeat;',
            swatch: 'background-image:radial-gradient(70px at 88% -8%,' +
                'color-mix(in srgb, var(--accent) 34%, transparent),transparent 70%),' +
                'radial-gradient(80px at -8% 108%,' +
                'color-mix(in srgb, var(--teal) 30%, transparent),transparent 70%),' +
                'radial-gradient(60px at 72% 68%,' +
                'color-mix(in srgb, var(--gold) 22%, transparent),transparent 72%);' +
                'background-repeat:no-repeat;'
        },
        {
            id: 'wash', name: 'Duo Wash', tagline: 'Accent from the top, teal rising below',
            css: 'background-image:linear-gradient(180deg,' +
                'color-mix(in srgb, var(--accent) 16%, transparent),transparent 460px),' +
                'linear-gradient(0deg,' +
                'color-mix(in srgb, var(--teal) 10%, transparent),transparent 320px);' +
                'background-repeat:no-repeat;',
            swatch: 'background-image:linear-gradient(180deg,' +
                'color-mix(in srgb, var(--accent) 30%, transparent),transparent 60%),' +
                'linear-gradient(0deg,' +
                'color-mix(in srgb, var(--teal) 22%, transparent),transparent 55%);'
        },
        {
            id: 'speckle', name: 'Speckle', tagline: 'Colourful grain in ink, accent & gold',
            css: 'background-image:' +
                'radial-gradient(color-mix(in srgb, var(--ink) 16%, transparent) 1.5px,transparent 1.5px),' +
                'radial-gradient(color-mix(in srgb, var(--accent) 38%, transparent) 1.9px,transparent 1.9px),' +
                'radial-gradient(color-mix(in srgb, var(--gold) 50%, transparent) 1.8px,transparent 1.8px),' +
                'radial-gradient(' + INK9 + ' 1px,transparent 1px);' +
                'background-size:96px 96px,130px 130px,110px 110px,64px 64px;' +
                'background-position:0 0,40px 70px,82px 22px,26px 42px;'
        }
    ];

    // ── The second set: livelier, student-facing patterns. SVG tiles carry
    // fixed mid-tone colours (a data-URI can't read CSS variables) chosen to
    // stay legible on every theme, light or dark; the CSS-gradient ones keep
    // re-tinting through color-mix like the originals. All remain page-
    // background-only and print-stripped. ──
    function svgUrl(s) {
        return 'url("data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" ' + s + '</svg>') + '")';
    }
    var SPARK_GOLD = 'rgba(212,168,67,.55)', SPARK_BLUE = 'rgba(90,150,235,.45)',
        SPARK_TEAL = 'rgba(64,170,190,.45)';
    BGS.push(
        {
            id: 'sparkles', name: 'Sparkles', tagline: 'Gold & blue twinkles',
            css: 'background-image:' + svgUrl('width="170" height="170">' +
                '<path d="M20 8 Q22 18 30 20 Q22 22 20 32 Q18 22 10 20 Q18 18 20 8Z" fill="' + SPARK_GOLD + '"/>' +
                '<path d="M120 30 Q121.5 37 127 38.5 Q121.5 40 120 47 Q118.5 40 113 38.5 Q118.5 37 120 30Z" fill="' + SPARK_BLUE + '"/>' +
                '<path d="M70 90 Q72 100 80 102 Q72 104 70 114 Q68 104 60 102 Q68 100 70 90Z" fill="rgba(212,168,67,.4)"/>' +
                '<path d="M140 120 Q141.5 127 147 128.5 Q141.5 130 140 137 Q138.5 130 133 128.5 Q138.5 127 140 120Z" fill="' + SPARK_TEAL + '"/>' +
                '<circle cx="45" cy="140" r="2" fill="' + SPARK_BLUE + '"/>' +
                '<circle cx="150" cy="70" r="1.6" fill="' + SPARK_GOLD + '"/>' +
                '<circle cx="95" cy="15" r="1.6" fill="' + SPARK_TEAL + '"/>') + ';'
        },
        {
            id: 'confetti', name: 'Confetti', tagline: 'A celebration that stays quiet',
            css: 'background-image:' + svgUrl('width="150" height="150">' +
                '<rect x="18" y="22" width="9" height="3.4" rx="1.7" fill="' + SPARK_BLUE + '" transform="rotate(24 22 24)"/>' +
                '<rect x="98" y="14" width="9" height="3.4" rx="1.7" fill="' + SPARK_GOLD + '" transform="rotate(-35 102 16)"/>' +
                '<rect x="60" y="64" width="9" height="3.4" rx="1.7" fill="rgba(230,120,110,.42)" transform="rotate(60 64 66)"/>' +
                '<rect x="120" y="92" width="9" height="3.4" rx="1.7" fill="' + SPARK_TEAL + '" transform="rotate(-15 124 94)"/>' +
                '<rect x="30" y="112" width="9" height="3.4" rx="1.7" fill="rgba(150,110,200,.42)" transform="rotate(40 34 114)"/>' +
                '<rect x="86" y="128" width="9" height="3.4" rx="1.7" fill="' + SPARK_BLUE + '" transform="rotate(-55 90 130)"/>' +
                '<circle cx="52" cy="36" r="2.2" fill="' + SPARK_GOLD + '"/>' +
                '<circle cx="132" cy="52" r="2" fill="rgba(230,120,110,.4)"/>' +
                '<circle cx="12" cy="78" r="2" fill="' + SPARK_TEAL + '"/>') + ';'
        },
        {
            id: 'bubbles', name: 'Bubbles', tagline: 'Soft floating circles in theme colours',
            css: 'background-image:' +
                'radial-gradient(circle at 25% 25%,color-mix(in srgb, var(--accent) 10%, transparent) 0 46px,transparent 47px),' +
                'radial-gradient(circle at 75% 60%,color-mix(in srgb, var(--teal) 9%, transparent) 0 34px,transparent 35px),' +
                'radial-gradient(circle at 45% 85%,color-mix(in srgb, var(--gold) 12%, transparent) 0 26px,transparent 27px),' +
                'radial-gradient(circle at 88% 15%,color-mix(in srgb, var(--accent) 8%, transparent) 0 20px,transparent 21px);' +
                'background-size:340px 340px;'
        },
        {
            id: 'waves', name: 'Waves', tagline: 'Flowing lines across the page',
            css: 'background-image:' + svgUrl('width="220" height="130">' +
                '<path d="M0 30 Q27.5 18 55 30 T110 30 T165 30 T220 30" stroke="rgba(90,150,235,.3)" fill="none" stroke-width="1.5"/>' +
                '<path d="M0 75 Q27.5 63 55 75 T110 75 T165 75 T220 75" stroke="rgba(212,168,67,.3)" fill="none" stroke-width="1.5"/>' +
                '<path d="M0 112 Q27.5 100 55 112 T110 112 T165 112 T220 112" stroke="rgba(64,170,190,.3)" fill="none" stroke-width="1.5"/>') + ';'
        },
        {
            id: 'mesh', name: 'Colour Mesh', tagline: 'Bold glows in three theme colours',
            css: 'background-image:' +
                'radial-gradient(900px at 92% -12%,color-mix(in srgb, var(--accent) 20%, transparent),transparent 65%),' +
                'radial-gradient(800px at -12% 35%,color-mix(in srgb, var(--teal) 16%, transparent),transparent 65%),' +
                'radial-gradient(760px at 55% 118%,color-mix(in srgb, var(--gold) 16%, transparent),transparent 65%);' +
                'background-attachment:fixed;background-repeat:no-repeat;',
            swatch: 'background-image:' +
                'radial-gradient(80px at 92% -12%,color-mix(in srgb, var(--accent) 34%, transparent),transparent 65%),' +
                'radial-gradient(70px at -12% 35%,color-mix(in srgb, var(--teal) 28%, transparent),transparent 65%),' +
                'radial-gradient(70px at 55% 118%,color-mix(in srgb, var(--gold) 28%, transparent),transparent 65%);' +
                'background-repeat:no-repeat;'
        },
        {
            id: 'triangles', name: 'Geo Triangles', tagline: 'Scattered outline shapes',
            css: 'background-image:' + svgUrl('width="170" height="170">' +
                '<path d="M30 18 L44 42 L16 42Z" stroke="' + SPARK_BLUE + '" fill="none" stroke-width="1.5" transform="rotate(12 30 30)"/>' +
                '<path d="M120 60 L131 79 L109 79Z" stroke="' + SPARK_GOLD + '" fill="none" stroke-width="1.5" transform="rotate(-20 120 70)"/>' +
                '<path d="M60 120 L70 137 L50 137Z" stroke="' + SPARK_TEAL + '" fill="none" stroke-width="1.5" transform="rotate(30 60 128)"/>' +
                '<circle cx="140" cy="132" r="7" stroke="rgba(150,110,200,.38)" fill="none" stroke-width="1.5"/>' +
                '<rect x="86" y="18" width="12" height="12" rx="2" stroke="' + SPARK_TEAL + '" fill="none" stroke-width="1.5" transform="rotate(18 92 24)"/>') + ';'
        },
        {
            id: 'stars', name: 'Night Stars', tagline: 'A quiet starfield — try it with Midnight',
            css: 'background-image:' + svgUrl('width="210" height="210">' +
                '<circle cx="20" cy="30" r="1.4" fill="rgba(120,160,230,.55)"/>' +
                '<circle cx="70" cy="12" r="1" fill="rgba(212,168,67,.5)"/>' +
                '<circle cx="120" cy="44" r="1.4" fill="rgba(120,160,230,.45)"/>' +
                '<circle cx="180" cy="20" r="1" fill="rgba(120,160,230,.55)"/>' +
                '<circle cx="40" cy="90" r="1" fill="rgba(212,168,67,.45)"/>' +
                '<circle cx="150" cy="105" r="1.4" fill="rgba(120,160,230,.5)"/>' +
                '<circle cx="95" cy="150" r="1" fill="rgba(120,160,230,.5)"/>' +
                '<circle cx="185" cy="170" r="1.4" fill="rgba(212,168,67,.5)"/>' +
                '<circle cx="30" cy="185" r="1" fill="rgba(120,160,230,.45)"/>' +
                '<path d="M100 70 Q101.5 77 107 78.5 Q101.5 80 100 87 Q98.5 80 93 78.5 Q98.5 77 100 70Z" fill="rgba(120,160,230,.5)"/>' +
                '<path d="M55 135 Q56.5 142 62 143.5 Q56.5 145 55 152 Q53.5 145 48 143.5 Q53.5 142 55 135Z" fill="rgba(212,168,67,.5)"/>') + ';'
        },
        {
            id: 'rays', name: 'Sunrays', tagline: 'Soft rays fanning from the corner',
            css: 'background-image:repeating-conic-gradient(from 0deg at 100% 0%,' +
                'color-mix(in srgb, var(--accent) 7%, transparent) 0 5deg,transparent 5deg 12deg);' +
                'background-attachment:fixed;'
        },
        {
            id: 'candy', name: 'Candy Stripe', tagline: 'Wide diagonal bands in the accent',
            css: 'background-image:repeating-linear-gradient(45deg,' +
                'color-mix(in srgb, var(--accent) 9%, transparent) 0 26px,transparent 26px 60px);'
        },
        {
            id: 'doodles', name: 'Doodles', tagline: 'Hand-drawn study scribbles',
            css: 'background-image:' + svgUrl('width="200" height="200">' +
                '<path d="M30 22 V38 M22 30 H38" stroke="rgba(130,120,150,.4)" stroke-width="2" stroke-linecap="round"/>' +
                '<circle cx="120" cy="50" r="9" stroke="' + SPARK_GOLD + '" fill="none" stroke-width="2"/>' +
                '<path d="M170 110 Q172 119 179 121 Q172 123 170 132 Q168 123 161 121 Q168 119 170 110Z" stroke="' + SPARK_BLUE + '" fill="none" stroke-width="1.6"/>' +
                '<path d="M40 150 Q50 140 60 150 T80 150 T100 150" stroke="' + SPARK_TEAL + '" fill="none" stroke-width="2" stroke-linecap="round"/>' +
                '<path d="M140 168 L146 174 L158 160" stroke="rgba(212,168,67,.5)" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M70 80 H95" stroke="rgba(130,120,150,.35)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6"/>') + ';'
        }
    );

    // ── Build the one <style> block: per-theme variable overrides,
    //    per-theme header treatments, and shared fixes that re-route the
    //    few hardcoded backgrounds through variables (only when a
    //    non-default theme is active — classic stays untouched). ──
    function buildCss() {
        var css = '';
        THEMES.forEach(function (t) {
            if (!t.vars) return;
            css += 'html[data-theme="' + t.id + '"]{';
            Object.keys(t.vars).forEach(function (k) {
                css += k + ':' + t.vars[k] + ';';
            });
            css += '}\n';
            if (t.header) {
                // :not(.hero) so this app-shell header treatment never lands
                // on the landing page's <header class="hero"> — that header
                // must stay transparent and show the themed page body.
                css += 'html[data-theme="' + t.id + '"] header:not(.hero){' + t.header + '}\n';
            }
        });
        // Hardcoded near-whites in style.css/business-style.css that a
        // theme (especially midnight) must re-colour:
        css +=
            'html[data-theme] .case-table td{background-color:var(--card-bg);}\n' +
            'html[data-theme] .case-table tr:nth-child(even) td{background-color:var(--cream);}\n' +
            'html[data-theme] .fib-input:focus{background:var(--card-bg);}\n' +
            'html[data-theme] .case-table caption{color:var(--mid);}\n' +
            // td text would otherwise inherit .ep-case\'s hardcoded dark slate
            // — invisible on the themed dark td background
            'html[data-theme] .case-table td{color:var(--ink);}\n';
        // ── Dark-theme fixes, shared by every dark:true theme ──
        // Chrome surfaces (header/tab-bar/sidebar/pills/solid buttons) are
        // handled globally: every `background: var(--ink)` in the sources is
        // now `var(--chrome, var(--ink))` and every chrome-text
        // `color: var(--paper)` is `var(--chrome-text, var(--paper))`, and
        // dark themes define both. What remains here is CONTENT: hardcoded
        // greys/tints that assume a light page.
        THEMES.forEach(function (t) {
            if (!t.dark) return;
            var sel = 'html[data-theme="' + t.id + '"]';
            // qualify a list of selectors with the theme prefix, comma-joined
            var q = function (list) {
                return list.map(function (s) { return sel + ' ' + s; }).join(',');
            };
            css += sel + '{color-scheme:dark;}\n' +
                // color-scheme:dark tells the browser to render NATIVE controls
                // in dark mode — <select> dropdown popups, <input type=date/
                // time/datetime-local> pickers, scrollbars and the default
                // canvas — none of which read our CSS variables. Without this
                // the class dropdown and due-date picker render dark-on-dark.
                sel + ' img{opacity:.94;}\n' +
                // Body copy: style.css/business-style.css hardcode dark slate
                // greys (#3a4a56/#2a3a46) that vanish on dark — re-route to ink
                sel + ' .topic-content li,' + sel + ' .topic-content p,' +
                sel + ' .tip-card p,' + sel + ' .tip-card li,' +
                sel + ' .marks-section p,' + sel + ' .marks-section li' +
                '{color:color-mix(in srgb, var(--ink) 90%, transparent);}\n' +
                // ── Light-tint states whose text is INHERITED ink (light on
                // light = invisible). Re-tint the ground dark, keep the hue. ──
                sel + ' .match-item.selected{background:color-mix(in srgb, var(--gold) 24%, var(--card-bg));}\n' +
                sel + ' .misc-card .wrong-view{background:color-mix(in srgb, var(--wrong) 14%, var(--card-bg));}\n' +
                sel + ' .misc-card .correct-view{background:color-mix(in srgb, var(--success) 14%, var(--card-bg));}\n' +
                sel + ' .ep-opt:hover:not(:disabled){background:color-mix(in srgb, var(--ink) 12%, var(--cream));}\n' +
                sel + ' .cat-zone.ready,' + sel + ' .cat-pool.ready' +
                '{background:color-mix(in srgb, var(--accent) 14%, var(--card-bg));}\n' +
                // exam case study: hardcoded beige island — re-tint to match
                sel + ' .ep-case{background:var(--cream);color:color-mix(in srgb, var(--ink) 90%, transparent);}\n' +
                // ── Quick Check (read-check) uses undefined var(--surface2)/
                // var(--text) tokens on Business → fall back to native grey.
                // Force themed surfaces here (source also patched). ──
                sel + ' .read-check-btn{-webkit-appearance:none;appearance:none;' +
                'background:var(--cream);color:var(--ink);}\n' +
                sel + ' .read-check-btn:hover:not(:disabled){background:var(--card-bg);}\n' +
                sel + ' .read-check-q{color:var(--ink);}\n' +
                sel + ' .read-check-wrap[data-answered]{background:color-mix(in srgb, var(--success) 20%, transparent);}\n' +
                // ── Task-assigned banner (dashboard/hub inline .note-row):
                // hardcodes background:#fff, so light-on-dark text vanished ──
                sel + ' .note-row{background:var(--card-bg);color:var(--ink);}\n' +
                // ── Low-contrast brand-label colours (ui-review findings):
                // hardcoded dark amber (#8f6d19), green (#2d7a4f) and purple
                // (#6a4f8c) sit on tints that darken here — brighten them. ──
                sel + ' .gam-hud-streak,' + sel + ' .gam-nav-xp,' +
                sel + ' .gam-card-prog-xp,' + sel + ' .gam-card-complete-chip,' +
                sel + ' .gam-celeb-bonus,' + sel + ' .gam-topic-nav .celebrate .gam-nav-dir,' +
                sel + ' .chip.late,' + sel + ' .banner.warn,' + sel + ' .qmarks' +
                '{color:color-mix(in srgb, var(--gold) 62%, white);}\n' +
                q(['.gam-hud-daily.goal-met', '.gam-hud-topic-done', '.banner.good',
                    '.pal-btn.answered', '.gcse-tour-example-chip',
                    // teacher pages: green status pills / labels on fixed green tints
                    '.chip.published', '.chip.ontime', '.chip.fresh', '.msg.ok',
                    '.ans-dist-row.correct .ans-dist-label']) +
                '{color:color-mix(in srgb, var(--success) 45%, white);}\n' +
                // teacher pages: purple "pending"/AI labels on fixed purple tints
                q(['.chip.pending', '.ai-badge', '.ai-suggestion-head']) +
                '{color:color-mix(in srgb, #9285f0 62%, white);}\n' +
                // teacher pages: muted "draft" chip → theme mid (light on dark)
                q(['.chip.draft']) + '{color:var(--mid);}\n' +
                // teacher analytics: class-matrix heatmap cells hardcode dark
                // text on fixed low-opacity tints that darken here — brighten
                // each toward its own hue while the tint stays semantic.
                q(['.heat.h0']) + '{color:color-mix(in srgb, var(--wrong) 40%, white);}\n' +
                q(['.heat.h1']) + '{color:#e8a582;}\n' +
                q(['.heat.h2']) + '{color:#e6c78a;}\n' +
                q(['.heat.h3']) + '{color:color-mix(in srgb, var(--success) 45%, white);}\n' +
                // progress rings: per-state dark text fills → one readable fill
                sel + ' .gcse-ring-txt{fill:var(--mid);}\n';
        });
        BGS.forEach(function (b) {
            if (!b.css) return;
            css += 'html[data-bg="' + b.id + '"] body{' + b.css + '}\n';
        });
        // never print the decorative pattern
        css += '@media print{html[data-bg] body{background-image:none !important;}}\n';
        return css;
    }

    function ensureStyles() {
        if (document.getElementById('gcseThemeStyles')) return;
        var s = document.createElement('style');
        s.id = 'gcseThemeStyles';
        s.textContent = buildCss();
        document.head.appendChild(s);
    }

    function currentTheme() {
        var t = null;
        try { t = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
        return THEMES.some(function (x) { return x.id === t; }) ? t : DEFAULT_THEME;
    }

    function applyTheme(id, persist) {
        if (!THEMES.some(function (x) { return x.id === id; })) id = 'classic';
        if (id === 'classic') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', id);
        }
        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
        }
        // refresh the ✓ in the picker if it's open
        var panel = document.getElementById('gcseThemePanel');
        if (panel) {
            panel.querySelectorAll('.gcse-theme-opt').forEach(function (btn) {
                var on = btn.getAttribute('data-theme-id') === id;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
    }
    window.gcseSetTheme = function (id) { applyTheme(id, true); };

    function currentBg() {
        var b = null;
        try { b = localStorage.getItem(BG_STORAGE_KEY); } catch (e) { /* private mode */ }
        return BGS.some(function (x) { return x.id === b; }) ? b : DEFAULT_BG;
    }

    function applyBg(id, persist) {
        if (!BGS.some(function (x) { return x.id === id; })) id = DEFAULT_BG;
        if (id === 'none') {
            document.documentElement.removeAttribute('data-bg');
        } else {
            document.documentElement.setAttribute('data-bg', id);
        }
        if (persist) {
            try { localStorage.setItem(BG_STORAGE_KEY, id); } catch (e) { /* ignore */ }
        }
        var panel = document.getElementById('gcseThemePanel');
        if (panel) {
            panel.querySelectorAll('.gcse-bg-opt').forEach(function (btn) {
                var on = btn.getAttribute('data-bg-id') === id;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
    }
    window.gcseSetBg = function (id) { applyBg(id, true); };

    // ── Floating switcher UI ──
    function swatches(t) {
        var v = t.vars || {
            '--paper': '#f5f0e8', '--cream': '#ede7d9', '--accent': '#7a5c9e',
            '--gold': '#d4a843', '--ink': '#0f1923'
        };
        return ['--paper', '--cream', '--accent', '--gold', '--ink'].map(function (k) {
            return '<span class="gcse-theme-dot" style="background:' + v[k] + '"></span>';
        }).join('');
    }

    function injectSwitcherCss() {
        var s = document.createElement('style');
        s.id = 'gcseThemeSwitcherStyles';
        s.textContent = [
            '#gcseThemeBtn{position:fixed;left:16px;bottom:16px;z-index:9985;width:46px;height:46px;',
            '  border-radius:50%;border:1.5px solid var(--gold,#d4a843);background:var(--chrome, var(--ink,#0f1923));',
            '  color:var(--chrome-text, var(--paper,#f5f0e8));font-size:20px;cursor:pointer;line-height:1;',
            '  box-shadow:0 4px 14px rgba(0,0,0,.25);transition:transform .15s ease;}',
            '#gcseThemeBtn:hover{transform:scale(1.08);}',
            '#gcseThemeBtn:focus-visible{outline:2px solid var(--accent,#7a5c9e);outline-offset:2px;}',
            '#gcseThemePanel{position:fixed;left:16px;bottom:72px;z-index:9985;width:302px;',
            '  max-height:min(70vh,560px);overflow-y:auto;background:var(--card-bg,#fffcf6);',
            '  color:var(--ink,#0f1923);border:1.5px solid var(--border,#c9bfaa);border-radius:14px;',
            '  box-shadow:0 18px 50px rgba(0,0,0,.28);padding:14px;',
            "  font-family:'DM Sans',system-ui,sans-serif;}",
            '#gcseThemePanel[hidden]{display:none;}',
            '#gcseThemePanel .gcse-theme-hd{display:flex;align-items:center;justify-content:space-between;',
            '  margin-bottom:4px;}',
            "#gcseThemePanel h2{font-size:15px;font-family:'Playfair Display',serif;margin:0;}",
            '#gcseThemePanel .gcse-theme-close{border:0;background:transparent;color:inherit;',
            '  font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;}',
            '#gcseThemePanel .gcse-theme-close:hover{background:var(--cream,#ede7d9);}',
            '#gcseThemePanel .gcse-theme-note{font-size:11.5px;color:var(--mid,#5a6e7f);margin:0 0 10px;}',
            '.gcse-theme-opt{display:block;width:100%;text-align:left;border:1.5px solid var(--border,#c9bfaa);',
            '  background:transparent;color:inherit;border-radius:10px;padding:10px 12px;margin-bottom:8px;',
            '  cursor:pointer;transition:border-color .15s ease,background .15s ease;}',
            '.gcse-theme-opt:hover{border-color:var(--accent,#7a5c9e);background:var(--cream,#ede7d9);}',
            '.gcse-theme-opt:focus-visible{outline:2px solid var(--accent,#7a5c9e);outline-offset:2px;}',
            '.gcse-theme-opt.active{border-color:var(--accent,#7a5c9e);box-shadow:inset 0 0 0 1px var(--accent,#7a5c9e);}',
            '.gcse-theme-opt .gcse-theme-row{display:flex;align-items:center;gap:8px;}',
            '.gcse-theme-opt .gcse-theme-name{font-weight:600;font-size:13.5px;flex:1;}',
            '.gcse-theme-opt.active .gcse-theme-name::after{content:" ✓";color:var(--accent,#7a5c9e);}',
            '.gcse-theme-opt .gcse-theme-tag{font-size:11.5px;color:var(--mid,#5a6e7f);margin-top:3px;}',
            '.gcse-theme-dot{width:14px;height:14px;border-radius:50%;display:inline-block;',
            '  border:1px solid rgba(0,0,0,.18);margin-left:-4px;}',
            '.gcse-theme-dots{display:inline-flex;padding-left:4px;}',
            '#gcseThemePanel .gcse-bg-hd{font-size:13px;font-weight:600;margin:14px 0 2px;',
            '  padding-top:12px;border-top:1.5px solid var(--border,#c9bfaa);}',
            '#gcseThemePanel .gcse-bg-note{font-size:11px;color:var(--mid,#5a6e7f);margin:0 0 8px;}',
            '.gcse-bg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
            '.gcse-bg-opt{border:1.5px solid var(--border,#c9bfaa);background:transparent;color:inherit;',
            '  border-radius:10px;padding:6px;cursor:pointer;text-align:left;',
            '  transition:border-color .15s ease;}',
            '.gcse-bg-opt:hover{border-color:var(--accent,#7a5c9e);}',
            '.gcse-bg-opt:focus-visible{outline:2px solid var(--accent,#7a5c9e);outline-offset:2px;}',
            '.gcse-bg-opt.active{border-color:var(--accent,#7a5c9e);box-shadow:inset 0 0 0 1px var(--accent,#7a5c9e);}',
            '.gcse-bg-swatch{height:44px;border-radius:6px;border:1px solid var(--border,#c9bfaa);',
            '  background-color:var(--paper,#f5f0e8);margin-bottom:5px;}',
            '.gcse-bg-name{font-size:12px;font-weight:600;display:block;}',
            '.gcse-bg-opt.active .gcse-bg-name::after{content:" ✓";color:var(--accent,#7a5c9e);}',
            '.gcse-bg-tag{font-size:10.5px;color:var(--mid,#5a6e7f);display:block;margin-top:1px;}',
            '@media (prefers-reduced-motion:reduce){#gcseThemeBtn,.gcse-theme-opt{transition:none;}}',
            '@media print{#gcseThemeBtn,#gcseThemePanel{display:none !important;}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function buildSwitcher() {
        if (document.getElementById('gcseThemeBtn')) return;
        injectSwitcherCss();

        var btn = document.createElement('button');
        btn.id = 'gcseThemeBtn';
        btn.type = 'button';
        btn.textContent = '🎨';
        btn.setAttribute('aria-label', 'Choose colour theme');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'gcseThemePanel');
        btn.title = 'Choose colour theme';

        var panel = document.createElement('div');
        panel.id = 'gcseThemePanel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Site theme picker');

        var active = currentTheme();
        var activeBg = currentBg();
        // Miniature live preview of each pattern: the same CSS at element
        // scale, minus background-attachment:fixed (viewport-relative would
        // render blank in a 44px tile). Var()s inside re-tint with the theme.
        function bgSwatchCss(b) {
            return (b.swatch || b.css).replace('background-attachment:fixed;', '');
        }
        panel.innerHTML =
            '<div class="gcse-theme-hd"><h2>Site theme</h2>' +
            '<button type="button" class="gcse-theme-close" aria-label="Close theme picker">✕</button></div>' +
            '<p class="gcse-theme-note">Saved on this device &middot; applies to every page ' +
            '(student, teacher &amp; landing).</p>' +
            THEMES.map(function (t) {
                return '<button type="button" class="gcse-theme-opt' +
                    (t.id === active ? ' active' : '') + '" data-theme-id="' + t.id + '"' +
                    ' aria-pressed="' + (t.id === active) + '">' +
                    '<span class="gcse-theme-row"><span class="gcse-theme-name">' + t.name + '</span>' +
                    '<span class="gcse-theme-dots">' + swatches(t) + '</span></span>' +
                    '<div class="gcse-theme-tag">' + t.tagline + '</div></button>';
            }).join('') +
            '<h3 class="gcse-bg-hd">Background</h3>' +
            '<p class="gcse-bg-note">Subtle patterns tinted by your theme — never behind the text cards.</p>' +
            '<div class="gcse-bg-grid">' +
            BGS.map(function (b) {
                return '<button type="button" class="gcse-bg-opt' +
                    (b.id === activeBg ? ' active' : '') + '" data-bg-id="' + b.id + '"' +
                    ' aria-pressed="' + (b.id === activeBg) + '">' +
                    '<span class="gcse-bg-swatch" style="' + bgSwatchCss(b) + '"></span>' +
                    '<span class="gcse-bg-name">' + b.name + '</span>' +
                    '<span class="gcse-bg-tag">' + b.tagline + '</span></button>';
            }).join('') +
            '</div>';

        function setOpen(open) {
            panel.hidden = !open;
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                var first = panel.querySelector('.gcse-theme-opt.active') ||
                    panel.querySelector('.gcse-theme-opt');
                if (first) first.focus();
            }
        }

        btn.addEventListener('click', function () { setOpen(panel.hidden); });
        panel.querySelector('.gcse-theme-close').addEventListener('click', function () {
            setOpen(false); btn.focus();
        });
        panel.addEventListener('click', function (e) {
            var opt = e.target.closest('.gcse-theme-opt');
            if (opt) applyTheme(opt.getAttribute('data-theme-id'), true);
            var bgOpt = e.target.closest('.gcse-bg-opt');
            if (bgOpt) applyBg(bgOpt.getAttribute('data-bg-id'), true);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); }
        });
        document.addEventListener('click', function (e) {
            if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) setOpen(false);
        });

        document.body.appendChild(btn);
        document.body.appendChild(panel);
    }

    // Favicon: the page HTMLs carry no <link rel="icon"> tags, and this
    // file already loads on every page — so the tab icon is injected here.
    // Entry pages (index/hub/login/signup/join) also declare the links
    // statically for crawlers; the guard below skips those. Browsers with
    // no icon link still auto-request /favicon.ico as a fallback.
    function ensureFavicon() {
        if (document.querySelector('link[rel~="icon"], link[rel="apple-touch-icon"]')) return;
        [
            { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48 32x32 16x16' },
            { rel: 'apple-touch-icon', href: '/images/apple-touch-icon.png' }
        ].forEach(function (a) {
            var l = document.createElement('link');
            Object.keys(a).forEach(function (k) { l.setAttribute(k, a[k]); });
            document.head.appendChild(l);
        });
    }

    // Other open tabs follow along live
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) applyTheme(currentTheme(), false);
        if (e.key === BG_STORAGE_KEY) applyBg(currentBg(), false);
    });

    ensureFavicon();
    ensureStyles();
    applyTheme(currentTheme(), false);
    applyBg(currentBg(), false);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildSwitcher);
    } else {
        buildSwitcher();
    }
})();
