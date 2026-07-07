#!/usr/bin/env python3
"""Step-4 flip verification.

(a) Serves the repo with http.server and asserts HTTP 200 for:
      - every href in every PAGE_GROUPS_ALL entry,
      - every <script src>/<link href> of 5 sampled topic pages,
      - every <script src>/<link href> + /subjects/... link of every root page.
(b) Syntax-checks (V8 via py_mini_racer, no Node on this machine) every
    shared/generated JS file and every root page's inline scripts.
(c) Asserts no HTML outside subjects/ still references the deleted root
    question-bank.js / section-totals.js, and that every relative asset
    reference inside the moved pages resolves to a real file.

Usage:  python tools/flip_verify.py
"""
import json
import re
import sys
import threading
import urllib.parse
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJ = ROOT / "subjects" / "business"

ROOT_PAGES = [
    "index.html", "login.html", "teacher-signup.html", "dashboard.html",
    "badges.html", "daily-revise.html", "task.html", "manage-account.html",
    "teacher-dashboard.html", "teacher-tasks.html", "teacher-analytics.html",
    "teacher-worksheets.html", "privacy-policy.html", "cookie-policy.html",
    "terms.html", "acceptable-use.html", "childrens-code.html",
    "accessibility.html",
]
SAMPLED_TOPICS = [
    "1_1_role_of_business_enterprise.html",
    "2_4_marketing_mix.html",           # the standalone overview page
    "3_2_organisational_structures.html",  # links into extra/
    "5_4_break_even.html",
    "7_1_final.html",
]
JS_FILES = [
    "script.js", "progress-shared.js", "tasks-shared.js", "topic-guard.js",
    "gamification.js", "badges.js", "daily-revise.js",
    "notifications-shared.js", "onboarding-tour.js", "footer-legal.js",
    "subject-loader.js", "subjects-index.js", "page-groups-all.js",
    "section-totals-all.js",
    "subjects/business/page-groups.js",
    "subjects/business/section-totals.js",
    "subjects/business/question-bank.js",
]

failures = []


def fail(msg):
    failures.append(msg)
    print("FAIL:", msg)


def ok(msg):
    print("ok  :", msg)


# ── (a) served-site link check ──────────────────────────────────

def collect_asset_urls(page_rel):
    """script src / link href / img src / a-href-to-subjects of one page."""
    src = (ROOT / page_rel).read_text(encoding="utf-8")
    urls = set()
    for m in re.finditer(r'<script[^>]+src="([^"]+)"', src):
        urls.add(m.group(1))
    for m in re.finditer(r'<link[^>]+href="([^"]+)"', src):
        urls.add(m.group(1))
    for m in re.finditer(r'<img[^>]+src="([^"]+)"', src):
        urls.add(m.group(1))
    for m in re.finditer(r'<a[^>]+href="(/subjects/[^"]+)"', src):
        urls.add(m.group(1))
    return urls


def resolve(page_rel, url):
    """Resolve url as the browser would from /<page_rel>. None = skip."""
    if url.startswith(("http://", "https://", "data:", "mailto:", "#", "javascript:")):
        return None
    url = url.split("#")[0].split("?")[0]
    if not url:
        return None
    if url.startswith("/"):
        return url
    base = "/" + page_rel.replace("\\", "/")
    basedir = base.rsplit("/", 1)[0]
    parts = (basedir + "/" + url).split("/")
    out = []
    for p in parts:
        if p == "..":
            if out:
                out.pop()
        elif p not in ("", "."):
            out.append(p)
    return "/" + "/".join(out)


class _QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # keep the report readable
        pass


def check_served():
    handler = partial(_QuietHandler, directory=str(ROOT))
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    print(f"serving {ROOT} on 127.0.0.1:{port}")

    to_fetch = {}  # path -> provenance

    pg_all = (ROOT / "page-groups-all.js").read_text(encoding="utf-8")
    hrefs = re.findall(r'"href":\s*"([^"]+)"', pg_all)
    for h in hrefs:
        to_fetch.setdefault(h, "page-groups-all.js")
    print(f"page-groups-all.js: {len(hrefs)} hrefs")

    for page in ROOT_PAGES + [f"subjects/business/{f}" for f in SAMPLED_TOPICS]:
        if not (ROOT / page).exists():
            fail(f"missing page: {page}")
            continue
        to_fetch.setdefault("/" + page.replace("\\", "/"), "page itself")
        for u in collect_asset_urls(page):
            r = resolve(page, u)
            if r:
                to_fetch.setdefault(r, page)

    n_ok = 0
    for path, why in sorted(to_fetch.items()):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}{urllib.parse.quote(path)}") as resp:
                if resp.status == 200:
                    n_ok += 1
                else:
                    fail(f"HTTP {resp.status} for {path} (from {why})")
        except Exception as e:
            fail(f"fetch error for {path} (from {why}): {e}")
    ok(f"served-site check: {n_ok}/{len(to_fetch)} URLs returned 200")
    httpd.shutdown()


# ── (b) JS syntax check via V8 ──────────────────────────────────

def check_js_syntax():
    from py_mini_racer import MiniRacer
    ctx = MiniRacer()

    def compiles(label, code):
        try:
            # new Function() parses without executing anything.
            ctx.eval("new Function(" + json.dumps(code) + "); true")
            return True
        except Exception as e:
            fail(f"JS syntax error in {label}: {str(e)[:300]}")
            return False

    n = 0
    for rel in JS_FILES:
        p = ROOT / rel
        if not p.exists():
            fail(f"missing JS file: {rel}")
            continue
        if compiles(rel, p.read_text(encoding="utf-8")):
            n += 1
    ok(f"external JS syntax: {n}/{len(JS_FILES)} files parse")

    n_inline = 0
    for page in ROOT_PAGES:
        src = (ROOT / page).read_text(encoding="utf-8")
        for i, m in enumerate(re.finditer(
                r'<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>', src)):
            body = m.group(1).strip()
            if not body:
                continue
            if compiles(f"{page} inline #{i + 1}", body):
                n_inline += 1
    ok(f"inline scripts on root pages: {n_inline} parse")


# ── (c) stale references + relative-asset integrity ─────────────

def check_no_stale_refs():
    stale = []
    for p in ROOT.rglob("*.html"):
        rel = p.relative_to(ROOT).as_posix()
        if rel.startswith(("subjects/", "node_modules/", ".netlify/")):
            continue
        s = p.read_text(encoding="utf-8", errors="replace")
        if 'src="question-bank.js"' in s or 'src="section-totals.js"' in s:
            stale.append(rel)
    if stale:
        fail("stale root question-bank.js/section-totals.js reference in: "
             + ", ".join(stale))
    else:
        ok("no HTML outside subjects/ references the deleted root bank/totals")
    for name in ("question-bank.js", "section-totals.js"):
        if (ROOT / name).exists():
            fail(f"legacy root {name} still exists")


def check_moved_pages_assets():
    bad = 0
    n = 0
    for p in SUBJ.rglob("*.html"):
        rel = p.relative_to(ROOT).as_posix()
        s = p.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r'(?:href|src)="([^"]+)"', s):
            r = resolve(rel, m.group(1))
            if r is None:
                continue
            n += 1
            if not (ROOT / r.lstrip("/")).exists():
                fail(f"{rel}: reference {m.group(1)} -> {r} does not exist")
                bad += 1
    ok(f"moved-page asset integrity: {n - bad}/{n} references resolve")


def main():
    check_served()
    check_js_syntax()
    check_no_stale_refs()
    check_moved_pages_assets()
    print()
    if failures:
        print(f"{len(failures)} FAILURE(S)")
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
