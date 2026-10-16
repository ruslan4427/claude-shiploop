---
name: "shiploop-brainstorm"
description: "Structured brainstorming session at a defined lifecycle stage. Always produces: decisions, open questions, action items, and a memory entry."
argument-hint: "stage=discovery | stage=post-spec | stage=post-qa | stage=retrospective | topic=<custom>"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `stage=` or `topic=` from arguments.

---

## Stage contexts

| Stage | When to run | Context to load | Goal |
|-------|------------|-----------------|------|
| `discovery` | Start of new project/feature | Nothing yet — pure ideation | Define problem, users, constraints |
| `post-spec` | After /speckit-specify | spec.md | Validate spec, spot gaps, align on scope |
| `post-qa` | After /shiploop-tester | QA report | Prioritize fixes, decide what ships |
| `retrospective` | After release | DEVLOG last entries, memory files | What worked, what to change |
| `custom` | Any time | User-defined context | Explore a specific topic |

---

## Step 1 — Load context

Based on stage:
- `discovery`: read CLAUDE.md if exists, recent memory files if any
- `post-spec`: read `specs/*/spec.md`, `specs/*/plan.md`
- `post-qa`: read latest `specs/qa-reports/*.md`
- `retrospective`: read DEVLOG.md last 10 entries, all memory files from this cycle
- `custom`: ask user what context to load

---

## Step 2 — Frame the session

Output a clear framing:

```
## Brainstorm: {stage/topic}
**Goal**: {what we want to decide by end of session}
**Time box**: ~{15/30/45} minutes
**Context loaded**: {list of files read}
```

---

## Step 3 — Structured exploration

Run through these lenses in order, adapting to the stage:

### 🎯 Problem space
- What exact problem are we solving?
- Who has this problem? (users from spec or personas)
- What does "solved" look like?

### 💡 Ideas & options
Generate 3-5 concrete options or approaches. For each:
- One-line description
- Main advantage
- Main risk or cost

### ⚡ Quick wins vs deep work
- What can be done in < 1 day?
- What requires > 1 week?
- What should we NOT do?

### ❓ Open questions
List every assumption or unknown that could invalidate a decision.

### 🔗 Dependencies & risks
- What does this depend on? (tech, people, data)
- What could go wrong?

---

## Step 4 — Converge to decisions

After exploration, force a decision for each open item:

```
DECISION-{N}: {short title}
  Choice: {what was decided}
  Rationale: {why this option}
  Rejected: {what was NOT chosen and why}
  Owner: <Owner> | <Collaborator> | <TBD>
  Next action: {concrete first step}
```

---

## Step 5 — Action items

List all action items in priority order:

```
ACTION-{N} [{priority}]: {what to do}
  Skill/tool: {which skill or command to run next}
  Blocks: {what this unblocks}
```

---

## Step 6 — Save memory

Save to `memory/brainstorm-{stage}-{date}.md`:

```markdown
---
name: Brainstorm — {stage} — {date}
type: project
stage: {stage}
---

## Goal
## Key decisions (DECISION-1, DECISION-2, ...)
## Open questions (still unresolved)
## Action items
## What NOT to do (important scope guards)
```

---

## Done When

- [ ] Context loaded and framed
- [ ] All 5 lenses explored
- [ ] At least 3 decisions documented
- [ ] Action items listed with next skill to run
- [ ] Memory saved to memory/brainstorm-{stage}-{date}.md
- [ ] User confirmed they're ready to proceed
