#!/usr/bin/env bash
# ShipLoop v2.0 — init-project.sh
# Bootstraps a NEW project directory with the full ShipLoop environment.
# For adding ShipLoop to an EXISTING project, use install.sh instead.
#
# Usage:
#   scripts/init-project.sh <project-name> <stack> [target-dir]
#   scripts/init-project.sh my-app flutter
#   scripts/init-project.sh my-api nextjs
#   scripts/init-project.sh my-service python

set -e

SHIPLOOP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${1:?Usage: init-project.sh <name> <stack> [target-dir]}"
STACK="${2:?Usage: init-project.sh <name> <stack> [target-dir]}"
TARGET_DIR="${3:-$PWD/$PROJECT_NAME}"

echo "ShipLoop v2.0 — initializing: $PROJECT_NAME ($STACK)"
echo "  target: $TARGET_DIR"
echo ""

# ── Create project directory ──────────────────────────────────────────────
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# ── Install ShipLoop into .claude/ ────────────────────────────────────────
echo "installing skills + agents + templates into .claude/ ..."
bash "$SHIPLOOP_DIR/install.sh" --target "$TARGET_DIR"

# ── Copy speckit skills if available (optional, user-global) ──────────────
SPECKIT_SKILLS=(speckit-specify speckit-plan speckit-tasks speckit-implement speckit-qa speckit-constitution)
for skill in "${SPECKIT_SKILLS[@]}"; do
  if [ -d "$HOME/.claude/skills/$skill" ]; then
    cp -R "$HOME/.claude/skills/$skill" .claude/skills/
    echo "  + speckit skill: $skill"
  fi
done

# ── Author CLAUDE.md from template ────────────────────────────────────────
echo "creating CLAUDE.md ..."
cp .claude/templates/CLAUDE.md.template CLAUDE.md
# sed -i on macOS requires ''; GNU sed differs — handle both.
if sed --version >/dev/null 2>&1; then
  sed -i "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" CLAUDE.md
  sed -i "s/{{STACK}}/$STACK/g" CLAUDE.md
else
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" CLAUDE.md
  sed -i '' "s/{{STACK}}/$STACK/g" CLAUDE.md
fi

# ── DEVLOG.md ─────────────────────────────────────────────────────────────
echo "creating DEVLOG.md ..."
cp .claude/templates/DEVLOG.md.template DEVLOG.md
if sed --version >/dev/null 2>&1; then
  sed -i "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" DEVLOG.md
  sed -i "s/{{STACK}}/$STACK/g" DEVLOG.md
  sed -i "s/{{DATE}}/$(date +%Y-%m-%d)/g" DEVLOG.md
else
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" DEVLOG.md
  sed -i '' "s/{{STACK}}/$STACK/g" DEVLOG.md
  sed -i '' "s/{{DATE}}/$(date +%Y-%m-%d)/g" DEVLOG.md
fi

# ── Memory + specs scaffolding ────────────────────────────────────────────
mkdir -p memory specs/qa-reports specs/observer-reports

# ── Git init + gitignore ──────────────────────────────────────────────────
if [ ! -d .git ]; then
  echo "initializing git ..."
  git init -q
  cat > .gitignore << 'EOF'
.env
.env.*
*.env
node_modules/
.dart_tool/
build/
.flutter-plugins
.flutter-plugins-dependencies
ios/Pods/
*.xcworkspace
.DS_Store

# Expertise capsules may hold project-sensitive context — gitignore by default.
.claude/expertise/
EOF
fi

# ── Stack-specific CI scaffolding ─────────────────────────────────────────
mkdir -p .github/workflows
case "$STACK" in
  flutter)
    mkdir -p integration_test/helpers
    cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
EOF
    ;;
  nextjs|react)
    mkdir -p __tests__ e2e
    cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
EOF
    ;;
  python)
    mkdir -p tests
    cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pytest
EOF
    ;;
esac

echo ""
echo "ShipLoop v2.0 initialized at: $TARGET_DIR"
echo ""
echo "next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. open in Claude Code: claude ."
echo "  3. run: /shiploop-brainstorm stage=discovery"
echo ""
