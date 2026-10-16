---
name: "shiploop-observer"
description: "Analyze the current state of all ShipLoop chains. Check agent efficiency, identify gaps, propose new agents or consolidations. Run after each major phase or when the workflow feels slow."
argument-hint: "Optional: 'phase=discovery', 'phase=build', 'phase=qa', 'phase=ship', or 'full' for complete analysis"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

---

## Purpose

The Observer monitors ShipLoop itself — not the product, but the development process. It answers:

- Are we using the right agents for each task?
- Is any phase taking too long or being skipped?
- Are there repetitive patterns that warrant a new dedicated agent?
- Is the memory system being used? Is context being lost?
- Are we spending tokens on tasks that could be automated?

---

## Step 1 — Read project state

Read in this order:
1. `CLAUDE.md` — project architecture and current team protocol
2. `DEVLOG.md` — last 5 entries (recent activity pattern)
3. `memory/` directory — list all memory files and their dates
4. `specs/qa-reports/` — list all QA reports and their dates
5. `.claude/skills/` — list all installed skills

Build a timeline:
```
{date}: {what happened} → {which skill/agent was used}
```

---

## Step 2 — Analyze each ShipLoop phase

For each phase, assess:

### Discovery (spec + brainstorm)
- Was `/speckit-specify` used for the last feature?
- Was there a brainstorm session? Was it documented?
- Are spec files up to date?
- **Common gap**: Feature added without spec → architecture drift

### Build
- Is DEVLOG.md updated after each feature?
- Were tasks in tasks.md marked complete?
- Are there uncommitted changes sitting around?
- **Common gap**: Coding before spec → rework

### Testing
- When was the last QA report generated?
- Are integration tests passing?
- Are P1/P2 fixes being resolved or accumulating?
- **Common gap**: QA not run → bugs reach users

### Memory
- Are memory files being created at phase boundaries?
- Are memories older than 2 weeks being referenced? (May be stale)
- Is the same question being asked multiple times? (Memory not being used)
- **Common gap**: Context drift → repeated explanations

### Agent efficiency
- List all skills in `.claude/skills/`
- Identify: any skills never used? → candidates for removal
- Identify: any task done manually 3+ times? → candidate for new skill
- Identify: any skill invoked 10+ times per session? → candidate for CLAUDE.md automation

---

## Step 3 — Generate recommendations

Format each recommendation:

```
REC-{N}: {short title}
  Type: new-agent | remove-agent | automate | document | fix-process
  Priority: high | medium | low
  Problem: {what is the inefficiency or gap}
  Proposed solution: {concrete action}
  Effort: {small (< 1h) | medium (1-4h) | large (> 4h)}
```

---

## Step 4 — New agent proposals

For each "new-agent" recommendation, provide a draft SKILL.md outline:

```markdown
## Proposed: /shiploop-{name}

**Purpose**: {one sentence}
**When to invoke**: {trigger condition}
**Inputs**: {what it needs}
**Outputs**: {what it produces}
**Key steps**:
1. ...
2. ...
3. ...
**Estimated value**: {what inefficiency it solves}
```

---

## Step 5 — Observer report

Write report to `specs/observer-reports/YYYY-MM-DD-observer.md`:

```markdown
# ShipLoop Observer Report — {date}

## Chain health summary
| Phase | Status | Last run | Gap detected |
|-------|--------|----------|--------------|
| Discovery | ✅ healthy | {date} | none |
| Build | ⚠️ warning | {date} | DEVLOG not updated |
| Testing | ❌ issue | {date} | No QA in 14 days |
| Memory | ✅ healthy | {date} | none |

## Recommendations
...

## Proposed new agents
...

## Agents to remove/consolidate
...
```

---

## Step 6 — Save memory

Save `memory/observer-{date}.md` with key decisions and recommendations.

---

## Done When

- [ ] Project state timeline built
- [ ] All 4 phases assessed
- [ ] Recommendations generated with priorities
- [ ] New agent proposals drafted (if any)
- [ ] Observer report written
- [ ] Memory saved
- [ ] Top 3 recommendations presented to user
