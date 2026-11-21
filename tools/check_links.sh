#!/usr/bin/env bash
# Check internal links and anchors of dist/ offline with lychee. Needs `npm run build` first.
# Uses lychee from PATH or ~/.local/bin, and installs the pinned release there when it is missing.
set -euo pipefail

VERSION=0.24.2
SHA256=1f4e0ef7f6554a6ed33dd7ac144fb2e1bbed98598e7af973042fc5cd43951c9a
BIN="$HOME/.local/bin"
export PATH="$BIN:$PATH"

if ! command -v lychee >/dev/null; then
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  curl -fsSL -o "$tmp/lychee.tar.gz" \
    "https://github.com/lycheeverse/lychee/releases/download/lychee-v$VERSION/lychee-x86_64-unknown-linux-gnu.tar.gz"
  echo "$SHA256  $tmp/lychee.tar.gz" | sha256sum -c -
  mkdir -p "$BIN"
  tar -xzf "$tmp/lychee.tar.gz" -C "$BIN" --strip-components=1 lychee-x86_64-unknown-linux-gnu/lychee
fi

# Serve dist under the site's base path so that root-relative links resolve.
site=$(mktemp -d)
trap 'rm -rf "$site"' EXIT
ln -s "$PWD/dist" "$site/bof3-wiki"
lychee --offline --include-fragments --index-files index.html --no-progress \
  --root-dir "$site" --exclude-path 404.html "$site/bof3-wiki"
