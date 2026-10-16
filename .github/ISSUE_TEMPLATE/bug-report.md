---
name: Bug report
about: Report a bug in a skill, agent, installer, or scorecard parser
title: "[bug] "
labels: bug
---

## Which component

- [ ] Skill (which one? `/shiploop-...`)
- [ ] Agent (`agents/expert.md`)
- [ ] `install.sh` / `scripts/init-project.sh`
- [ ] Scorecard parser (`scripts/scorecard.mjs` or `lib/*.mjs`)
- [ ] Docs (README / INSTALL / CONTRIBUTING)

## What you ran

Verbatim invocation or command. If a skill produced an incorrect
classification, paste the message that triggered it and the lane it
landed in.

## Expected vs actual

**Expected:**

**Actual:**

## Environment

- Claude Code version: `claude --version`
- OS: (macOS / Linux + distro / Windows + WSL)
- Shell: (bash / zsh / fish)
- ShipLoop commit: `git -C <path-to-cloned-shiploop> rev-parse HEAD`

## Reproduce

Steps that reliably reproduce the bug. If it's intermittent, say so and
include frequency.

## Logs / output

If applicable, paste stderr / stdout. Trim to the relevant lines.
