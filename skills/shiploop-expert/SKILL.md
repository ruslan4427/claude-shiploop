---
name: "shiploop-expert"
description: "Consult the domain-expert subagent at a defined review phase. Loads cached expertise capsule (or researches a fresh one, hybrid-approved) and applies both domain patterns and project rules to produce issue → why → fix findings."
argument-hint: "phase=pre-ship | phase=in-progress | phase=blind-bug  [target=<path|slug|symptom>]"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `phase=` and optional `target=` from arguments.

---

## Purpose

Every L-class task (and optionally B/R/S) can be routed through the
domain-expert subagent (`.claude/agents/expert.md`) at a chosen phase:

| Phase | When to run | Input | Output |
|-------|-------------|-------|--------|
| `pre-ship` | After implementation, before commit/push | changed files or diff | findings on code about to ship |
| `in-progress` | Mid-build, before more code lands on current direction | WIP + task description | trajectory check (are we on the right path?) |
| `blind-bug` | Reproducible bug, root cause unknown | symptom only (no fix detail) | ranked root-cause hypotheses |

The expert runs its 5-phase bootstrap protocol (identify domain → check
capsule cache → research if cache miss → load project context → review).
Progress markers are printed before each phase.

---

## Step 1 — Parse arguments

Required: `phase=<pre-ship|in-progress|blind-bug>`

Optional: `target=<something>`
- For `pre-ship`: path to a file, a glob, or `git-diff` to use `git diff
  HEAD` as scope. Default: files changed in the working tree.
- For `in-progress`: path to the WIP spec/plan/branch. Default: current
  conversation's last-touched files.
- For `blind-bug`: a one-paragraph symptom description. Required for this
  phase (expert can't guess what to diagnose).

If required args missing, print the usage and stop:
```
Usage: /shiploop-expert phase=<pre-ship|in-progress|blind-bug> [target=<...>]
```

---

## Step 2 — Prepare the expert brief

Compose a self-contained brief for the subagent. The expert starts with no
memory of this conversation, so include everything it needs:

```
Phase: {phase}
Target: {target-or-"working tree"}

{For pre-ship:}
  Review the following changes before they ship. Scope: {files|diff}.
  Produce findings in the standard format (issue → why → fix) with
  severity-weighted by the capsule's priority weights.

{For in-progress:}
  Mid-build trajectory check. Current state: {wip description}.
  Flag if we're building on sand before more code lands.

{For blind-bug:}
  Symptom: {paragraph provided by user}.
  Do NOT look at recent commits or DEVLOG — propose root-cause
  hypotheses ordered by likelihood, each anchored to a capsule
  dimension or project rule.
```

---

## Step 3 — Dispatch to the subagent

Invoke the `expert` subagent via the Agent tool with `subagent_type="expert"`.
Pass the brief from Step 2 as the prompt.

The subagent will print its own phase markers (🧠 📚 🌐 📋 🎯) as it works
through its protocol. Do not duplicate those markers at the skill level.

**Capsule miss handling:** if the expert enters Phase 3 (research), it will
pause for user approval after proposing reference examples and after drafting
the capsule. Relay those stops to the user verbatim — do not auto-approve.

---

## Step 4 — Relay findings

The expert returns a Finding list + Scope-of-review + Validation signal
block. Pass through to the user without re-summarizing.

If findings include anything at `blocker` or `high` severity, append a
short recommendation line:
```
→ {N} blocker/high finding(s). Recommend addressing before next ship.
```

---

## Step 5 — Post-review hook

- If phase was `pre-ship` and findings existed: offer to open each flagged
  file at the cited line.
- If phase was `blind-bug` and the user later confirms a hypothesis was
  correct: suggest promoting that pattern into the capsule (edit, bump
  `version`, keep `confidence` as-is or promote draft→validated after 3+
  wins).
- If the capsule was researched fresh in Phase 3: remind user to run
  `/shiploop-expert phase=blind-bug` with a known past bug to validate the
  new capsule before relying on it (DECISION-4 pattern: 2/3 pass bar).

---

## Phased rollout (Variant C)

| Week | Status for L-class tasks | Who invokes |
|------|--------------------------|-------------|
| 1 | **opt-in** | User runs `/shiploop-expert` when desired |
| 2 | **recommended** | Assistant suggests consultation at L-class detect |
| 3 | **mandatory** | L-class tasks must pass `pre-ship` before merge |

Current status: **Week 1 (opt-in)** as of 2026-10-03.

---

## Done When

- [ ] `phase=` parsed and valid
- [ ] Expert subagent invoked with self-contained brief
- [ ] Progress markers from the subagent visible to user
- [ ] Findings relayed verbatim
- [ ] Research-mode stops (if any) relayed for approval, not auto-approved
- [ ] Post-review hook offered if applicable
