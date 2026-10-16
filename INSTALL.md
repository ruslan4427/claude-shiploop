# Install

ShipLoop installs into `<project>/.claude/`, picking up skills + agents
that Claude Code reads from that directory. Nothing is installed globally.

---

## One-liner (recommended)

```bash
curl -sSL https://raw.githubusercontent.com/ruslan4427/claude-shiploop/main/install.sh | bash
```

Installs into the current directory. For a specific project:

```bash
cd /path/to/your/project
curl -sSL https://raw.githubusercontent.com/ruslan4427/claude-shiploop/main/install.sh | bash
```

---

## Flags

```
install.sh [--target <path>] [--dry-run] [--help]
```

- `--target <path>` — install into `<path>/.claude/` instead of `./.claude/`.
- `--dry-run` — print every `cp` the installer would run, then exit 0
  without touching the filesystem.
- `--help` — print flag reference.

---

## Manual install

```bash
git clone https://github.com/ruslan4427/claude-shiploop.git /tmp/shiploop
mkdir -p ./.claude
cp -R /tmp/shiploop/skills ./.claude/
cp -R /tmp/shiploop/agents ./.claude/
cp -R /tmp/shiploop/templates ./.claude/
mkdir -p ./.claude/expertise                  # capsule store; gitignore it
```

The install script does the same thing + prints a one-screen "what next"
message pointing at `/shiploop-start`.

---

## What you get

```
<project>/.claude/
  skills/
    shiploop-start/          # /shiploop-start
    shiploop-router/         # /shiploop-router
    shiploop-brainstorm/     # /shiploop-brainstorm stage=<…>
    shiploop-tester/         # /shiploop-tester
    shiploop-observer/       # /shiploop-observer
    shiploop-expert/         # /shiploop-expert phase=<…>
    shiploop-skill-builder/  # /shiploop-skill-builder
  agents/
    expert.md                # domain-agnostic consultant subagent
  templates/
    CLAUDE.md.template       # starter CLAUDE.md with the lane table
    DEVLOG.md.template       # Problem · Decision · Result · Lesson skeleton
    spec.md.template         # spec triple starter
  expertise/                 # empty — fills as you run /shiploop-expert
```

---

## Scorecard parser (optional)

The scorecard parser is separate from the skill install — it's a Node
script you run against your own project to produce `scorecard.json`. See
`scripts/scorecard.mjs` in the repo. Pattern:

```bash
cp -R scripts/* ./scripts/
# edit ./scripts/scorecard.config.mjs with your project's slug + paths
node scripts/scorecard.mjs --out scorecard.json
```

---

## Uninstall

```bash
rm -rf <project>/.claude/
```

Removes everything ShipLoop installed. Any custom skills, agents, or
`expertise/*` capsules you added also go — back those up first if they
matter.

---

## Caveat — speckit NOT included

Several skills reference a `spec.md + plan.md + tasks.md` triple in
`specs/<N>-<slug>/`. ShipLoop does not install a spec authoring tool;
author those files manually following the format in
`skills/shiploop-start/SKILL.md`. If you later install a speckit-style
tool, ShipLoop's skills work with its output without reconfiguration.
