// ══════════════════════════════════════════════════════════════
// CONTENT GATE (WP-A3) — Netlify Edge Function mounted on /subjects/*
// (see netlify.toml). Course content stops being public: every request
// under /subjects/ needs a valid Supabase session whose account may
// access that subject (supabase/entitlements.sql · edge_gate_check).
//
// How a request is judged:
//   1. Token from the `vidya_at` cookie (set at login by auth-shared.js,
//      refreshed by tasksAuthInit) or an Authorization: Bearer header.
//   2. No token → HTML gets a 302 to login (with ?redirect back here);
//      assets get 401 JSON (a redirect inside a <script src> is useless).
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

type Verdict = { allowContent: boolean; allowBank: boolean; unauth: boolean };
const CACHE = new Map<string, { verdict: Verdict; expires: number }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 500;

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
    verdict = { allowContent: false, allowBank: false, unauth: true };
  } else if (res.ok) {
    let body: { allow_content?: boolean; allow_bank?: boolean } = {};
    try { body = await res.json(); } catch (_e) { /* fall through to deny */ }
    verdict = {
      allowContent: body.allow_content === true,
      allowBank: body.allow_bank === true,
      unauth: false,
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
  if (!match) return undefined;
  const subject = decodeURIComponent(match[1]);

  const isBank = /\/question-bank\.js$/.test(url.pathname);
  // Top-level page navigations want a redirect; script/img/fetch requests
  // want a status code (a 302 inside <script src> just breaks silently).
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  const denyUnauth = (): Response => {
    if (wantsHtml) {
      const back = encodeURIComponent(url.pathname + url.search);
      return Response.redirect(`${url.origin}/login.html?redirect=${back}`, 302);
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

  const verdict = await checkAccess(token, subject);
  if (verdict === "fail-open") return undefined;
  if (verdict.unauth) return denyUnauth();
  if (isBank) return verdict.allowBank ? undefined : denyForbidden("bank_teacher_only");
  if (!verdict.allowContent) return denyForbidden("no_subject_access");
  return undefined; // authorised — serve the file
}
