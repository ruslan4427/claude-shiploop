#!/usr/bin/env bash
# ShipLoop installer — copies skills, agents, templates, expertise/ into
# <target>/.claude/
#
# Usage:
#   install.sh [--target <path>] [--dry-run] [--help]

set -eu

REPO_URL="https://github.com/ruslan4427/claude-shiploop.git"
REPO_BRANCH="main"
CACHE_TTL_SECONDS=3600

TARGET="$PWD"
DRY_RUN=0

print_help() {
  cat <<EOF
ShipLoop installer

Usage:
  install.sh [--target <path>] [--dry-run] [--help]

Flags:
  --target <path>   Install into <path>/.claude/ (default: current directory)
  --dry-run         Print the cp operations without executing them
  --help            Show this help

The installer clones $REPO_URL to a cache dir and copies:
  skills/      → <target>/.claude/skills/
  agents/      → <target>/.claude/agents/
  templates/   → <target>/.claude/templates/
  expertise/   → <target>/.claude/expertise/      (empty — fills from /shiploop-expert)

Existing <target>/.claude/ files are overwritten. Back up custom skills
or agents before running.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --target)
      if [ $# -lt 2 ]; then
        echo "install.sh: --target requires a path argument" >&2
        exit 2
      fi
      TARGET="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      echo "install.sh: unknown flag: $1" >&2
      print_help >&2
      exit 2
      ;;
  esac
done

# ── Validate target ───────────────────────────────────────────────────────
if [ ! -d "$TARGET" ]; then
  echo "install.sh: target directory does not exist: $TARGET" >&2
  exit 1
fi

# Resolve to absolute path (portable — no realpath dependency).
TARGET="$(cd "$TARGET" && pwd)"

# ── Resolve source tree ───────────────────────────────────────────────────
# Prefer the directory the script lives in (local checkout) — fall back to
# cloning the repo if the script was piped in via curl.
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")"

if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/skills" ]; then
  SOURCE="$SCRIPT_DIR"
else
  CACHE_BASE="${TMPDIR:-/tmp}"
  # Reuse a recent clone if present, else fresh clone with timestamp.
  CACHE_DIR=""
  for existing in "$CACHE_BASE"/claude-shiploop-*; do
    [ -d "$existing" ] || continue
    age_s=$(( $(date +%s) - $(stat -f %m "$existing" 2>/dev/null || stat -c %Y "$existing" 2>/dev/null || echo 0) ))
    if [ "$age_s" -lt "$CACHE_TTL_SECONDS" ] && [ -d "$existing/skills" ]; then
      CACHE_DIR="$existing"
      break
    fi
  done
  if [ -z "$CACHE_DIR" ]; then
    CACHE_DIR="$CACHE_BASE/claude-shiploop-$(date +%s)"
    echo "cloning $REPO_URL → $CACHE_DIR ..."
    if [ "$DRY_RUN" = "0" ]; then
      git clone --quiet --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$CACHE_DIR"
    else
      echo "  [dry-run] git clone --depth 1 $REPO_URL $CACHE_DIR"
      # Fabricate a fake source tree listing for dry-run output.
      SOURCE="$CACHE_BASE/dry-run-placeholder"
      mkdir -p "$SOURCE"/{skills,agents,templates,expertise}
      touch "$SOURCE"/skills/.keep
    fi
  fi
  [ -z "${SOURCE:-}" ] && SOURCE="$CACHE_DIR"
fi

if [ ! -d "$SOURCE/skills" ]; then
  echo "install.sh: source tree missing skills/ at: $SOURCE" >&2
  exit 1
fi

# ── Copy ──────────────────────────────────────────────────────────────────
DEST="$TARGET/.claude"
if [ "$DRY_RUN" = "1" ]; then
  echo "  [dry-run] mkdir -p $DEST"
else
  mkdir -p "$DEST"
fi

copy_tree() {
  src="$1"
  dst="$2"
  if [ ! -d "$src" ]; then
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    echo "  [dry-run] cp -R $src $dst"
  else
    cp -R "$src" "$dst"
  fi
}

for dir in skills agents templates; do
  copy_tree "$SOURCE/$dir" "$DEST/"
done

# expertise/ always lands empty unless the source actually has public capsules.
if [ "$DRY_RUN" = "1" ]; then
  echo "  [dry-run] mkdir -p $DEST/expertise"
else
  mkdir -p "$DEST/expertise"
  if [ -d "$SOURCE/expertise" ]; then
    # Copy README + any shipped public capsules; skip project-local ones.
    for item in "$SOURCE/expertise"/*; do
      [ -e "$item" ] || continue
      cp -R "$item" "$DEST/expertise/"
    done
  fi
fi

# ── What next ─────────────────────────────────────────────────────────────
if [ "$DRY_RUN" = "1" ]; then
  echo ""
  echo "dry-run complete. Run without --dry-run to install."
  exit 0
fi

cat <<EOF

ShipLoop installed into: $DEST

What next:
  1. Open the project in Claude Code: claude $TARGET
  2. Classify a request:  /shiploop-router
  3. Start a session:     /shiploop-start
  4. Read the full lane table in $DEST/skills/shiploop-start/SKILL.md

Scorecard parser (optional, separate from skills):
  curl -sSL https://raw.githubusercontent.com/ruslan4427/claude-shiploop/main/scripts/scorecard.mjs > scripts/scorecard.mjs
  (See repo README for the full parser install.)

Note: expertise/ is empty — it fills as you run /shiploop-expert. The
installer gitignores it in init-project.sh scaffolds; if you set up
.claude/ by hand, add 'expertise/' to your .gitignore before committing.
EOF
