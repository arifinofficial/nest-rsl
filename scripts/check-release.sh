#!/usr/bin/env bash
# Guards run by .github/workflows/publish.yml before a release is built and staged.
# Usage: scripts/check-release.sh <tag>   (run from the repository root)
set -euo pipefail

fail() {
  echo "::error::$1"
  exit 1
}

tag="${1:-}"
[ -n "$tag" ] || fail "usage: scripts/check-release.sh <tag>"

# Only stable vX.Y.Z tags: staging a pre-release would move the `latest` dist-tag.
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "tag '$tag' is not a stable vX.Y.Z tag"

version=$(node -p "require('./package.json').version")
[ "$tag" = "v$version" ] || fail "tag '$tag' does not match package.json version '$version'"

git rev-parse --verify --quiet origin/main >/dev/null ||
  fail "origin/main not found; fetch it first (actions/checkout needs fetch-depth: 0)"
git merge-base --is-ancestor HEAD origin/main ||
  fail "tagged commit $(git rev-parse --short HEAD) is not on origin/main"

echo "Release checks passed for $tag"
