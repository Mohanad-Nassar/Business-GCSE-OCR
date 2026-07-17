// ══════════════════════════════════════════════════════════════
// CONTENT GATE (WP-A3) — Netlify Edge Function mounted on /subjects/*
// (see netlify.toml). Course content stops being public: every request
// under /subjects/ needs a valid Supabase session whose account may
// access that subject (supabase/entitlements.sql · edge_gate_check).
//
// How a request is judged:
//   1. Token from the `vidya_at` cookie (set at login by auth-shared.js,
//      refreshed by tasksAuthInit) or an Authorization: Bearer header.
//   2. No token → HTML gets a 302 to the landing page (with ?redirect back
//      here, forwarded on to login.html from there); assets get 401 JSON
//      (a redirect inside a <script src> is useless).
//   3. One RPC round trip to edge_gate_check(subject) WITH THE USER'S OWN
//      TOKEN — PostgREST verifies the JWT signature/expiry itself, so the
//      edge needs no JWT secret and no service key. 401/expired → login.
//   4. allow_content=false → 302 to join.html?subject=… (or 403 for
//      assets). question-bank.js additionally needs allow_bank (it embeds
//      answers inline — teacher/owner only, students never fetch it).
//   5. Verdicts cached in-isolate for 60s keyed by token-hash+subject.
//
// FAIL-OPEN on infrastructure errors (Supabase unreachable, unexpected
// 5xx): during the free-for-school year, students being locked out of
// revision by a blip is worse than a brief gate outage. Definitive
// verdicts (invalid token, no membership) always enforce.
//
// Kill switch: set CONTENT_GATE_DISABLED=true in Netlify env vars to
// pass every request through unchanged.
// ══════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://eaohjlyiotyqhvsizcpw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk";

// overrideSlugs (WP-S5): the UNDERSCORED static-file tails this student's school
// has a PUBLISHED override for in THIS subject (from edge_gate_check's
// override_slugs). Server-derived per-school; rides inside the cached Verdict so
// it stays scoped to the requesting token+subject with no extra round trip.
// Empty [] when the s5-edge migration isn't run yet (backward-compatible).
type Verdict = {
  allowContent: boolean;
  allowBank: boolean;
  unauth: boolean;
  overrideSlugs: string[];
};
const CACHE = new Map<string, { verdict: Verdict; expires: number }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 500;

// ── Scrape throttle (WP-A8) ──────────────────────────────────────────────
// A crude per-token rate limiter that lives only in this isolate's memory:
// if one session token pulls more than SCRAPE_LIMIT gated requests within
// SCRAPE_WINDOW_MS, it starts getting 429s. This is a DETERRENT against bulk
// scraping of course content, not a hard quota — the Map resets whenever the
// edge isolate recycles (fail-open by design) and each isolate counts
// independently. EVERY gated request under /subjects/* counts (page
// navigations AND their sub-assets), so if a legitimate page fans out into
// many gated requests, raise SCRAPE_LIMIT rather than lowering it.
//
// Sizing: a single topic page fans out into ~3-5 gated requests (its HTML
// plus page-groups.js/section-totals.js/question-bank.js and any content
// images), so the old limit of 40 tripped after only ~8-10 page views — well
// inside a normal revision session or a few dev reloads (which "look
// automated"). 300 gives a real student huge headroom (~60-100 page views in
// 5 min, impossible to reach by hand) while still catching a bulk scraper
// pulling the whole ~100-page catalogue mid-run.
const SCRAPE_LIMIT = 300;
const SCRAPE_WINDOW_MS = 5 * 60_000;
const SCRAPE_MAX_KEYS = 5_000;
const RATE = new Map<string, { count: number; windowStart: number }>();

// Fixed-window counter keyed by a hash of the token (reuses the same digest
// helper as the verdict cache, with a sentinel "subject" so the key space
// can't collide with a real subject cache key). Returns true once the caller
// has exceeded SCRAPE_LIMIT inside the current window.
async function isRateLimited(token: string): Promise<boolean> {
  const key = await tokenCacheKey(token, " rate");
  const now = Date.now();
  let bucket = RATE.get(key);
  if (!bucket || now - bucket.windowStart >= SCRAPE_WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    RATE.set(key, bucket);
  }
  bucket.count++;
  if (RATE.size > SCRAPE_MAX_KEYS) {
    for (const [k, b] of RATE) {
      if (now - b.windowStart >= SCRAPE_WINDOW_MS) RATE.delete(k);
    }
    if (RATE.size > SCRAPE_MAX_KEYS) RATE.clear(); // hard reset — just resets the deterrent
  }
  return bucket.count > SCRAPE_LIMIT;
}

function tooManyRequests(wantsHtml: boolean): Response {
  if (wantsHtml) {
    const html = `<!doctype html><meta charset="utf-8"><title>Slow down</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;text-align:center">
<h1>Slow down</h1><p>This looks automated. Please wait a minute and try again.</p>`;
    return new Response(html, {
      status: 429,
      headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "60" },
    });
  }
  return new Response(
    JSON.stringify({ error: "rate_limited", message: "slow down — this looks automated" }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
  );
}

function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

async function tokenCacheKey(token: string, subject: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 32) + ":" + subject;
}

async function checkAccess(token: string, subject: string): Promise<Verdict | "fail-open"> {
  const key = await tokenCacheKey(token, subject);
  const hit = CACHE.get(key);
  if (hit && hit.expires > Date.now()) return hit.verdict;

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/edge_gate_check`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_subject: subject }),
    });
  } catch (e) {
    console.log("content-gate: supabase unreachable, failing open", String(e));
    return "fail-open";
  }

  let verdict: Verdict;
  if (res.status === 401 || res.status === 403) {
    verdict = { allowContent: false, allowBank: false, unauth: true, overrideSlugs: [] };
  } else if (res.ok) {
    let body: { allow_content?: boolean; allow_bank?: boolean; override_slugs?: string[] } = {};
    try { body = await res.json(); } catch (_e) { /* fall through to deny */ }
    verdict = {
      allowContent: body.allow_content === true,
      allowBank: body.allow_bank === true,
      unauth: false,
      // Default [] when absent (old gate / pre-migration) — backward-compatible.
      overrideSlugs: Array.isArray(body.override_slugs) ? body.override_slugs : [],
    };
  } else if (res.status === 404) {
    // entitlements.sql not run yet on this database — don't brick the site.
    console.log("content-gate: edge_gate_check missing (run supabase/entitlements.sql) — failing open");
    return "fail-open";
  } else {
    console.log("content-gate: unexpected status, failing open", res.status);
    return "fail-open";
  }

  if (CACHE.size >= CACHE_MAX) CACHE.clear();
  CACHE.set(key, { verdict, expires: Date.now() + CACHE_TTL_MS });
  return verdict;
}

export default async function contentGate(request: Request): Promise<Response | undefined> {
  try {
    if (Deno.env.get("CONTENT_GATE_DISABLED") === "true") return undefined;
  } catch (_e) { /* env unavailable — keep gating */ }

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/subjects\/([^/]+)(\/|$)/);
  // `--legacy` emits an unprefixed question-bank.js to the repo root, and
  // publish = "." would serve it at /question-bank.js — every answer key, to
  // anyone. It is NOT under /subjects/, so without this it takes the !match
  // bail-out below and is served ungated no matter what netlify.toml mounts.
  // The build only ever writes the root bank for business, so gate it as such.
  const isRootBank = url.pathname === "/question-bank.js";
  if (!match && !isRootBank) return undefined;
  const subject = match ? decodeURIComponent(match[1]) : "business";

  const isBank = /\/question-bank\.js$/.test(url.pathname);
  // Top-level page navigations want a redirect; script/img/fetch requests
  // want a status code (a 302 inside <script src> just breaks silently).
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  const denyUnauth = (): Response => {
    if (wantsHtml) {
      // No session at all → the landing page, not straight to the login
      // form (mirrors the client-side guards; see script.js LOGIN_PAGE).
      // The landing page forwards ?redirect= on to login.html.
      const back = encodeURIComponent(url.pathname + url.search);
      return Response.redirect(`${url.origin}/index.html?redirect=${back}`, 302);
    }
    return new Response(JSON.stringify({ error: "auth_required" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  };
  const denyForbidden = (reason: string): Response => {
    if (wantsHtml) {
      return Response.redirect(
        `${url.origin}/join.html?subject=${encodeURIComponent(subject)}`, 302);
    }
    return new Response(JSON.stringify({ error: reason }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  };

  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const token = cookieValue(request.headers.get("cookie"), "vidya_at") || bearer || null;
  if (!token) return denyUnauth();

  // Scrape throttle (WP-A8): deter one token from bulk-pulling content. Runs
  // after the kill switch / non-/subjects bail-outs above, so it never fires
  // when the gate is disabled. Additive only — auth/gating below is unchanged.
  if (await isRateLimited(token)) {
    console.log("content-gate: scrape throttle 429", url.pathname);
    return tooManyRequests(wantsHtml);
  }

  const verdict = await checkAccess(token, subject);
  // Fail-open is deliberate for CONTENT: a gate blip locking students out of
  // revision is worse than briefly serving a topic page too widely.
  // It is NOT acceptable for question-bank.js, which embeds every answer key
  // and which students never fetch (see allowBank below) — nobody's revision
  // breaks if it 503s, so the bank fails CLOSED. Without this, any Supabase
  // blip (or a missing edge_gate_check RPC, which fails open at line ~159 and
  // would leave the gate silently inert) hands the whole answer key to anyone
  // holding a cookie.
  if (verdict === "fail-open") {
    if (isBank) {
      console.log("content-gate: gate unavailable — denying bank (fail-closed)", url.pathname);
      return denyForbidden("bank_unavailable");
    }
    return undefined;
  }
  if (verdict.unauth) return denyUnauth();
  if (isBank) return verdict.allowBank ? undefined : denyForbidden("bank_teacher_only");
  if (!verdict.allowContent) return denyForbidden("no_subject_access");

  // Override-fork redirect (WP-S5): access is already granted above. If this
  // student's school has a PUBLISHED override for the requested topic, 302 to
  // the dynamic renderer (topic.html) instead of the static master. Everyone
  // else — and every non-overridden topic — falls through to the master file.
  //
  // Only real topic HTML pages redirect: a single file directly under
  // /subjects/<subject>/ ending in .html, excluding index.html. The nested-path
  // exclusion means exam_prep/… and other sub-paths (and every js/css/json/img
  // asset) never match, so assets and non-topic pages always serve the master.
  if (verdict.overrideSlugs.length) {
    const topicMatch = url.pathname.match(/^\/subjects\/[^/]+\/([^/]+)\.html$/);
    const fileTail = topicMatch ? decodeURIComponent(topicMatch[1]) : null;
    if (fileTail && fileTail !== "index" && verdict.overrideSlugs.includes(fileTail)) {
      return Response.redirect(
        `${url.origin}/topic.html?s=${encodeURIComponent(subject)}&ov=${encodeURIComponent(fileTail)}`,
        302,
      );
    }
  }

  return undefined; // authorised — serve the master file
}
