#!/usr/bin/env python3
"""Post-reset smoke test for the multi-subject Supabase rebuild.

Run AFTER resetting the Supabase project and re-running every SQL file in the
order documented in SETUP.md (and seeding the question bank). It verifies,
over plain PostgREST/GoTrue REST calls (stdlib only, no dependencies):

  1. `subjects` is seeded with the 3 launch rows (business / computer-science
     / economics).
  2. The changed RPC signatures exist and are callable:
       get_my_subjects()
       get_my_topic_settings(p_subject => 'business')
       get_daily_revise_settings(p_subject => 'business')
       get_daily_revise_queue(p_limit => 1, p_subject => 'business')
     With only the service-role key these raise 'not authenticated'
     (auth.uid() is null inside SECURITY DEFINER functions) — that outcome
     still PASSES the signature check (a missing/old function 404s instead).
     Set TEST_STUDENT_USERNAME (or TEST_STUDENT_EMAIL) + TEST_STUDENT_PASSWORD
     in .env to also exercise them end-to-end as a real student.
  3. The answer-key invariant: selecting `bank_questions` directly with the
     anon key (and with a student token, if available) returns ZERO rows —
     the table carries no RLS policies at all, so answers are only reachable
     through the SECURITY DEFINER functions whose return columns omit
     answer_key.
  4. Per-subject bank counts: rows in `bank_questions` for each subject slug
     (business must be > 0 once seeded; placeholder subjects may be 0).

Read-only and idempotent: it never inserts/updates/deletes anything. The only
non-SELECT calls are the RPCs above, which are themselves read-only
(get_daily_revise_queue etc. write nothing).

Usage:
    python tools/smoke_test_supabase.py

Credentials come from .env at the repo root (SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY; optional SUPABASE_ANON_KEY — if absent, the anon
key is scraped from script.js's SUPABASE_ANON_KEY constant).

Exit code: 0 if every hard check passed, 1 otherwise.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPECTED_SUBJECTS = {"business", "computer-science", "economics"}

PASS, FAIL, SKIP = "PASS", "FAIL", "SKIP"
_results: list[tuple[str, str, str]] = []


def record(status: str, name: str, detail: str = "") -> None:
    _results.append((status, name, detail))
    pad = {"PASS": "  ok ", "FAIL": " FAIL", "SKIP": " skip"}[status]
    print(f"[{pad}] {name}" + (f" — {detail}" if detail else ""))


# ── credentials ──────────────────────────────────────────────────


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip("'\"")
    return env


def find_anon_key(env: dict[str, str]) -> str | None:
    """SUPABASE_ANON_KEY from .env, else the constant embedded in script.js."""
    if env.get("SUPABASE_ANON_KEY"):
        return env["SUPABASE_ANON_KEY"]
    script_js = REPO_ROOT / "script.js"
    if script_js.exists():
        m = re.search(r"SUPABASE_ANON_KEY\s*=\s*['\"]([^'\"]+)['\"]",
                      script_js.read_text(encoding="utf-8", errors="replace"))
        if m:
            return m.group(1)
    return None


# ── tiny REST client ─────────────────────────────────────────────


def call(url: str, key: str, *, token: str | None = None, method: str = "GET",
         body: dict | None = None, headers: dict[str, str] | None = None):
    """Returns (http_status, parsed_json_or_text, response_headers)."""
    req_headers = {
        "apikey": key,
        "Authorization": f"Bearer {token or key}",
        "Content-Type": "application/json",
    }
    if headers:
        req_headers.update(headers)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            hdrs = dict(resp.headers.items())
            status = resp.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        hdrs = dict(e.headers.items()) if e.headers else {}
        status = e.code
    except (urllib.error.URLError, TimeoutError) as e:
        return None, f"network error: {e}", {}
    try:
        parsed = json.loads(raw) if raw else None
    except ValueError:
        parsed = raw
    return status, parsed, hdrs


def rpc(base: str, key: str, fn: str, args: dict, token: str | None = None):
    return call(f"{base}/rest/v1/rpc/{fn}", key, token=token, method="POST", body=args)


def is_not_authenticated(payload) -> bool:
    return isinstance(payload, dict) and "not authenticated" in str(payload.get("message", ""))


# ── checks ───────────────────────────────────────────────────────


def check_subjects_seeded(base: str, service_key: str) -> None:
    status, payload, _ = call(
        f"{base}/rest/v1/subjects?select=slug,name,exam_date&order=sort_order", service_key)
    if status != 200 or not isinstance(payload, list):
        record(FAIL, "subjects seeded", f"HTTP {status}: {payload}")
        return
    slugs = {row.get("slug") for row in payload}
    if EXPECTED_SUBJECTS <= slugs and len(payload) >= 3:
        record(PASS, "subjects seeded",
               ", ".join(f"{r['slug']} (exam {r.get('exam_date')})" for r in payload))
    else:
        record(FAIL, "subjects seeded",
               f"expected {sorted(EXPECTED_SUBJECTS)}, got {sorted(slugs)}")


def check_rpc_signature(base: str, service_key: str, fn: str, args: dict,
                        token: str | None) -> None:
    """With a student token: expect 200. Service-role only: 'not authenticated'
    also passes (proves the function + parameter names resolve); 404 fails."""
    label = f"rpc {fn}({', '.join(args) or ''})"
    status, payload, _ = rpc(base, service_key, fn, args, token=token)
    if status is None:
        record(FAIL, label, str(payload))
    elif status == 200:
        record(PASS, label, "callable" + (" (as student)" if token else " (service role)"))
    elif status in (400, 401, 403) and is_not_authenticated(payload):
        if token:
            record(FAIL, label, "student token rejected as 'not authenticated'")
        else:
            record(PASS, label,
                   "signature resolves; 'not authenticated' is expected without a user token")
    elif status == 404:
        code = payload.get("code") if isinstance(payload, dict) else None
        record(FAIL, label, f"function/signature not found (HTTP 404, code {code}) — "
                            "was the SQL file re-run and the old overload dropped?")
    else:
        record(FAIL, label, f"HTTP {status}: {payload}")


def check_bank_invariant(base: str, key: str, who: str, token: str | None = None) -> None:
    label = f"bank_questions unreadable by {who}"
    status, payload, _ = call(
        f"{base}/rest/v1/bank_questions?select=question_key&limit=5", key, token=token)
    if status == 200 and payload == []:
        record(PASS, label, "SELECT returned 0 rows (RLS: no policies)")
    elif status in (401, 403):
        record(PASS, label, f"SELECT rejected outright (HTTP {status})")
    elif status == 200:
        record(FAIL, label,
               f"ANSWER-KEY INVARIANT BROKEN: {who} can read {len(payload)} bank_questions rows")
    else:
        record(FAIL, label, f"HTTP {status}: {payload}")


def check_bank_counts(base: str, service_key: str, slugs: list[str]) -> None:
    for slug in slugs:
        status, payload, hdrs = call(
            f"{base}/rest/v1/bank_questions?select=question_key&subject_slug=eq.{slug}&limit=1",
            service_key, headers={"Prefer": "count=exact"})
        if status not in (200, 206):
            record(FAIL, f"bank count [{slug}]", f"HTTP {status}: {payload}")
            continue
        total = (hdrs.get("Content-Range") or "/?").split("/")[-1]
        if slug == "business" and total in ("0", "*", "?"):
            record(FAIL, f"bank count [{slug}]",
                   f"{total} rows — business bank not seeded? Run the seed (SETUP.md step 18)")
        else:
            note = "" if slug == "business" else " (placeholder subject — 0 is fine)"
            record(PASS, f"bank count [{slug}]", f"{total} rows{note}")


def sign_in_test_student(base: str, anon_key: str, env: dict[str, str]) -> str | None:
    email = env.get("TEST_STUDENT_EMAIL")
    if not email and env.get("TEST_STUDENT_USERNAME"):
        email = f"{env['TEST_STUDENT_USERNAME']}@students.local"
    password = env.get("TEST_STUDENT_PASSWORD")
    if not email or not password:
        print("       (set TEST_STUDENT_USERNAME/-EMAIL + TEST_STUDENT_PASSWORD in .env "
              "to run the RPC checks as a real student)")
        return None
    status, payload, _ = call(f"{base}/auth/v1/token?grant_type=password", anon_key,
                              method="POST", body={"email": email, "password": password})
    if status == 200 and isinstance(payload, dict) and payload.get("access_token"):
        record(PASS, "test student sign-in", email)
        return payload["access_token"]
    record(SKIP, "test student sign-in", f"HTTP {status} — continuing with service role only")
    return None


# ── main ─────────────────────────────────────────────────────────


def main() -> int:
    env = load_env(REPO_ROOT / ".env")
    base = (env.get("SUPABASE_URL") or "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not service_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env "
              "(see .env.example). Nothing was checked.")
        return 1

    print(f"Smoke-testing {base}\n")

    # 1 · subjects seeded
    check_subjects_seeded(base, service_key)

    # optional student token (needs the anon key for GoTrue)
    anon_key = find_anon_key(env)
    student_token = sign_in_test_student(base, anon_key, env) if anon_key else None
    if not anon_key:
        print("       (no anon key found in .env or script.js — anon/student checks will be skipped)")

    # 2 · RPC signatures (new multi-subject parameter names must all resolve)
    check_rpc_signature(base, service_key, "get_my_subjects", {}, student_token)
    check_rpc_signature(base, service_key, "get_my_topic_settings",
                        {"p_subject": "business"}, student_token)
    check_rpc_signature(base, service_key, "get_daily_revise_settings",
                        {"p_subject": "business"}, student_token)
    check_rpc_signature(base, service_key, "get_daily_revise_queue",
                        {"p_limit": 1, "p_subject": "business"}, student_token)

    # 3 · answer-key invariant: direct bank_questions SELECT must yield nothing
    if anon_key:
        check_bank_invariant(base, anon_key, "anon key")
        if student_token:
            check_bank_invariant(base, anon_key, "student token", token=student_token)
        else:
            record(SKIP, "bank_questions unreadable by student", "no test student credentials")
    else:
        record(SKIP, "bank_questions unreadable by anon/student", "no anon key available")

    # 4 · per-subject bank counts
    check_bank_counts(base, service_key, sorted(EXPECTED_SUBJECTS))

    fails = [r for r in _results if r[0] == FAIL]
    skips = [r for r in _results if r[0] == SKIP]
    print(f"\n{len(_results) - len(fails) - len(skips)} passed, "
          f"{len(fails)} failed, {len(skips)} skipped.")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
