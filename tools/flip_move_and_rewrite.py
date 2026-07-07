#!/usr/bin/env python3
"""Rollout step 4 ("the big flip") — mechanical move + rewrite.

Moves the 38 Business topic pages plus Extra/ and exam_prep/ under
subjects/business/, rewrites asset references, wires the generated
subject files into every root page, appends the netlify.toml redirects
and finally deletes the legacy root question-bank.js / section-totals.js.

Deliberately re-runnable: every step checks whether it has already been
applied before doing anything. Hand-crafted JS edits (getPageId()
prefixing, RPC p_subject params, progress-shared.js PAGE_GROUPS removal)
are NOT here — they are one-off surgical edits reviewed in the diff.

Usage:  python tools/flip_move_and_rewrite.py
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJ_REL = "subjects/business"
SUBJ = ROOT / "subjects" / "business"

# Shared assets that stay at the repo root — topic pages must reference
# them root-absolutely once they live one directory down.
# section-totals.js is deliberately NOT in this list: topic pages keep that
# include relative so it resolves to the per-subject generated copy
# (subjects/business/section-totals.js, with business:-prefixed ids).
SHARED_ASSETS = [
    "style.css", "script.js", "progress-shared.js", "gamification.js",
    "topic-guard.js", "notifications-shared.js", "onboarding-tour.js",
    "footer-legal.js",
]

# Root pages that render topic trees / progress and therefore need the
# generated registry files + subject-loader BEFORE progress-shared.js.
# badges.html is the one cross-subject page (merged view).
LOADER_MODES = {
    "index.html": "single",
    "dashboard.html": "single",
    "badges.html": "all",
    "daily-revise.html": "single",
    "teacher-dashboard.html": "single",
    "teacher-analytics.html": "single",
    "teacher-tasks.html": "single",
    "teacher-worksheets.html": "single",
}
TEACHER_PAGES = {"teacher-dashboard.html", "teacher-analytics.html",
                 "teacher-tasks.html", "teacher-worksheets.html"}

NETLIFY_MARKER = "# -- step-4 restructure redirects (old root topic URLs) --"


def log(msg):
    print(msg)


def run_git(*args, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed:\n{r.stderr}")
    return r


def read(path):
    return path.read_text(encoding="utf-8")


def write(path, text):
    # OneDrive can transiently lock files — retry briefly.
    for attempt in range(5):
        try:
            path.write_text(text, encoding="utf-8")
            return
        except PermissionError:
            if attempt == 4:
                raise
            time.sleep(0.5 * (attempt + 1))


def manifest_files():
    m = json.loads(read(SUBJ / "subject.json"))
    out = []

    def walk(pages):
        for p in pages:
            out.append(p["file"])
            if p.get("children"):
                walk(p["children"])

    for g in m["groups"]:
        walk(g["pages"])
    return out


def git_mv(src_rel, dst_rel):
    src, dst = ROOT / src_rel, ROOT / dst_rel
    if not src.exists():
        if dst.exists():
            return False  # already moved on a previous run
        raise SystemExit(f"neither {src_rel} nor {dst_rel} exists — aborting")
    if dst.exists():
        raise SystemExit(f"both {src_rel} and {dst_rel} exist — resolve by hand")
    run_git("mv", src_rel, dst_rel)
    log(f"moved  {src_rel} -> {dst_rel}")
    return True


# ── 1. Move content ─────────────────────────────────────────────

def move_content(topic_files):
    for f in topic_files:
        git_mv(f, f"{SUBJ_REL}/{f}")
    git_mv("Extra", f"{SUBJ_REL}/extra")
    git_mv("exam_prep", f"{SUBJ_REL}/exam_prep")


# ── 2. Rewrite the moved topic pages ────────────────────────────

def rewrite_topic_pages(topic_files):
    for f in topic_files:
        path = SUBJ / f
        src = read(path)
        orig = src

        # Shared root assets become root-absolute.
        for a in SHARED_ASSETS:
            src = src.replace(f'src="{a}"', f'src="/{a}"')
            src = src.replace(f'href="{a}"', f'href="/{a}"')

        # The page's subject identity: generated page-groups.js (relative —
        # resolves inside subjects/business/), inserted immediately before
        # the progress-shared.js include.
        if '<script src="page-groups.js"></script>' not in src:
            needle = '<script src="/progress-shared.js"></script>'
            if needle in src:
                src = src.replace(
                    needle,
                    '<script src="page-groups.js"></script>\n' + needle, 1)

        # Root pages are one level up now.
        src = src.replace('href="index.html"', 'href="/index.html"')
        src = src.replace('href="index.html#', 'href="/index.html#')
        src = src.replace('href="dashboard.html"', 'href="/dashboard.html"')

        # Extra/ moved along with the topic pages, lowercase.
        src = src.replace('href="Extra/', 'href="extra/')

        if src != orig:
            write(path, src)
            log(f"rewrote {SUBJ_REL}/{f}")


# ── 3. Rewrite the moved extra/exam_prep pages ──────────────────

def rewrite_moved_aux():
    # exam_prep pages pointed back up at root assets with ../ chains
    # (../index.html, ../../index.html, ../..//style.css, ../..//script.js).
    # All of those root files stay at root — root-absolute now.
    pat = re.compile(r'(href|src)="(?:\.\./)+/?(index\.html|style\.css|script\.js)"')
    for path in (SUBJ / "exam_prep").rglob("*.html"):
        src = read(path)
        orig = src
        src = pat.sub(lambda m: f'{m.group(1)}="/{m.group(2)}"', src)
        # exam_prep/Other_Subjects/history.html linked "index.html" meaning
        # the site home (there is no index.html beside it).
        if path.name == "history.html":
            src = src.replace('href="index.html"', 'href="/index.html"')
        if src != orig:
            write(path, src)
            log(f"rewrote {path.relative_to(ROOT)}")


# ── 4. index.html topic cards → /subjects/business/… ────────────

def rewrite_index_cards(topic_files):
    path = ROOT / "index.html"
    src = read(path)
    orig = src
    for f in topic_files:
        src = src.replace(f'href="{f}"', f'href="/{SUBJ_REL}/{f}"')
    src = src.replace('href="exam_prep/', f'href="/{SUBJ_REL}/exam_prep/')
    if src != orig:
        write(path, src)
        log("rewrote index.html topic/exam-prep card links")


# ── 5. Root pages: generated registries + subject-loader ────────

def loader_block(mode, teacher):
    todo = ('\n<!-- TODO(step-5): resolve the subject from the selected class '
            '(per-class subject picker) instead of defaulting to business -->'
            if teacher else '')
    return (f'<script src="/subjects-index.js"></script>\n'
            f'<script src="/page-groups-all.js"></script>\n'
            f'<script src="/section-totals-all.js"></script>\n'
            f'<script src="/subject-loader.js"></script>{todo}\n'
            f'<script>subjectLoaderInit({{ mode: \'{mode}\' }});</script>')


def wire_root_pages():
    for name, mode in LOADER_MODES.items():
        path = ROOT / name
        src = read(path)
        orig = src
        block = loader_block(mode, name in TEACHER_PAGES)

        if "subject-loader.js" not in src:
            if '<script src="section-totals.js"></script>' in src:
                # replaces the legacy root section-totals.js include
                src = src.replace('<script src="section-totals.js"></script>',
                                  block, 1)
            elif '<script src="progress-shared.js"></script>' in src:
                src = src.replace('<script src="progress-shared.js"></script>',
                                  block + '\n<script src="progress-shared.js"></script>',
                                  1)
            else:
                raise SystemExit(f"{name}: found no anchor to insert the "
                                 "subject-loader block before progress-shared.js")

        # Teacher banks: the generated per-subject bank replaces the legacy
        # root question-bank.js.
        src = src.replace(
            '<script src="question-bank.js"></script>',
            '<script src="/subjects/business/question-bank.js"></script>'
            '<!-- TODO(step-5): load /subjects/<slug>/question-bank.js for the'
            ' selected class\'s subject dynamically -->')

        if src != orig:
            write(path, src)
            log(f"wired  {name} ({mode})")


# ── 6. netlify.toml 301s for every old root URL ─────────────────

def netlify_redirects(topic_files):
    path = ROOT / "netlify.toml"
    src = read(path)
    if NETLIFY_MARKER in src:
        return
    lines = ["", NETLIFY_MARKER,
             "# Pre-launch nicety: any bookmarked/emailed old root topic URL",
             "# lands on the same page in its new home."]
    for f in topic_files:
        lines += ["", "[[redirects]]",
                  f'  from = "/{f}"',
                  f'  to = "/{SUBJ_REL}/{f}"',
                  "  status = 301"]
    for old, new in (("Extra", "extra"), ("exam_prep", "exam_prep")):
        lines += ["", "[[redirects]]",
                  f'  from = "/{old}/*"',
                  f'  to = "/{SUBJ_REL}/{new}/:splat"',
                  "  status = 301"]
    write(path, src.rstrip() + "\n" + "\n".join(lines) + "\n")
    log("appended netlify.toml redirects")


# ── 7. .gitignore + untrack tools/__pycache__ ───────────────────

def gitignore_pycache():
    path = ROOT / ".gitignore"
    src = read(path)
    if "tools/__pycache__/" not in src:
        write(path, src.rstrip() + "\ntools/__pycache__/\n")
        log("added tools/__pycache__/ to .gitignore")
    # -f because the staged .pyc can differ from HEAD; --cached keeps the
    # working-tree files, .gitignore hides them from now on.
    r = run_git("rm", "-r", "-f", "--cached", "--ignore-unmatch", "-q", "tools/__pycache__")
    if r.stdout.strip():
        log("untracked tools/__pycache__")


# ── 8. Delete the legacy root bank/totals (data-corruption trap) ─

def delete_legacy_generated():
    # A stale root question-bank.js/section-totals.js with UNPREFIXED ids
    # must not survive the flip — verify nothing outside subjects/ still
    # references them, then remove.
    offenders = []
    for p in ROOT.glob("*.html"):
        s = read(p)
        if 'src="question-bank.js"' in s or 'src="section-totals.js"' in s:
            offenders.append(p.name)
    if offenders:
        raise SystemExit("still referencing legacy root generated files: "
                         + ", ".join(offenders))
    for name in ("question-bank.js", "section-totals.js"):
        if (ROOT / name).exists():
            run_git("rm", "-f", "-q", name)
            log(f"deleted legacy root {name}")


def main():
    topic_files = manifest_files()
    assert len(topic_files) == 38, f"expected 38 topic pages, got {len(topic_files)}"
    move_content(topic_files)
    rewrite_topic_pages(topic_files)
    rewrite_moved_aux()
    rewrite_index_cards(topic_files)
    wire_root_pages()
    netlify_redirects(topic_files)
    gitignore_pycache()
    delete_legacy_generated()
    log("flip complete")


if __name__ == "__main__":
    sys.exit(main())
