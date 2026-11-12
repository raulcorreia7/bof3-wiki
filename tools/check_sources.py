#!/usr/bin/env python3
"""Check every ``Source:`` link against a decompilation checkout.

Run from the repository root:

    python3 tools/check_sources.py ../bof3-decomp

The wiki links each record block to the header that owns it in
https://github.com/raulcorreia7/bof3-decomp/blob/main/. The wiki checkout does
not include that repository, so this check is not part of the site build. Pass
the path to a decompilation checkout and, when its tracking branch is not
``origin/main``, the ref:

    python3 tools/check_sources.py ../bof3-decomp --ref public/main

Exit status 1 when a path is missing.
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "src" / "content" / "docs"
SOURCE = re.compile(
    r"Source: \[`[^`]+`\]\(https://github\.com/raulcorreia7/bof3-decomp/blob/main/([^)]+)\)"
)


def source_paths():
    """Return {(header path, page:line)} for every Source link."""
    found = {}
    for page in sorted(DOCS.rglob("*.md")):
        for number, line in enumerate(page.read_text(encoding="utf-8").splitlines(), 1):
            match = SOURCE.search(line)
            if match:
                found.setdefault(match.group(1), []).append(
                    f"{page.relative_to(ROOT)}:{number}"
                )
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("decomp", type=Path, help="path to a bof3-decomp checkout")
    parser.add_argument(
        "--ref",
        default="origin/main",
        help="decompilation ref the Source URLs name (default: origin/main)",
    )
    args = parser.parse_args()

    if not (args.decomp / ".git").exists():
        print(f"not a git checkout: {args.decomp}", file=sys.stderr)
        return 2

    found = source_paths()
    if not found:
        print("no Source links found", file=sys.stderr)
        return 1

    missing = {}
    for path, sites in sorted(found.items()):
        result = subprocess.run(
            ["git", "-C", str(args.decomp), "cat-file", "-e", f"{args.ref}:{path}"],
            capture_output=True,
        )
        if result.returncode:
            missing[path] = sites

    for path, sites in missing.items():
        print(f"{path}: {', '.join(sites)}")
    print(
        f"{len(found)} Source paths checked at {args.ref}; {len(missing)} missing",
        file=sys.stderr,
    )
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
