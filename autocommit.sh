#!/usr/bin/env bash
#
# autocommit.sh — watch the repo and auto-commit (and optionally push) any changes.
#
# Usage:
#   ./autocommit.sh                 # watch current dir, commit + push every 10s when something changes
#   INTERVAL=30 ./autocommit.sh     # check every 30 seconds instead
#   PUSH=false ./autocommit.sh      # commit locally only, never push
#   BRANCH=main ./autocommit.sh     # force-checkout/use a specific branch
#   ./autocommit.sh /path/to/repo   # watch a different repo directory
#
# Stop it anytime with Ctrl+C.

set -euo pipefail

# ── Config (override via env vars) ──
REPO_DIR="${1:-$(pwd)}"          # repo to watch (defaults to current directory)
INTERVAL="${INTERVAL:-10}"       # seconds between checks
PUSH="${PUSH:-true}"            # set to "false" to disable pushing
REMOTE="${REMOTE:-origin}"      # git remote to push to
BRANCH="${BRANCH:-}"           # branch to push (empty = current branch)

cd "$REPO_DIR"

# ── Sanity checks ──
if ! command -v git >/dev/null 2>&1; then
  echo "error: git is not installed or not on PATH." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: '$REPO_DIR' is not a git repository." >&2
  exit 1
fi

# Resolve the branch to use if one wasn't given.
if [ -z "$BRANCH" ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

echo "▶ autocommit watching: $(pwd)"
echo "  branch:   $BRANCH"
echo "  interval: ${INTERVAL}s"
echo "  push:     $PUSH (remote: $REMOTE)"
echo "  (press Ctrl+C to stop)"
echo

# Graceful shutdown.
trap 'echo; echo "■ autocommit stopped."; exit 0' INT TERM

# ── Main loop ──
while true; do
  # Any tracked changes, staged changes, OR untracked files?
  if [ -n "$(git status --porcelain)" ]; then
    git add -A

    # Only commit if staging actually produced something to commit.
    if ! git diff --cached --quiet; then
      TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
      MESSAGE="chore: auto-commit $TIMESTAMP"

      git commit -m "$MESSAGE" >/dev/null
      echo "✔ committed: $MESSAGE"

      if [ "$PUSH" = "true" ]; then
        if git push "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
          echo "  ↳ pushed to $REMOTE/$BRANCH"
        else
          echo "  ! push failed (will retry on next change)" >&2
        fi
      fi
    fi
  fi

  sleep "$INTERVAL"
done
