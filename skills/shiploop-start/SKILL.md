---
name: "shiploop-start"
description: "Single entry point for the ShipLoop lifecycle. Routes to the right phase: new project discovery, new feature spec, or continue existing work. Always the first command to run."
argument-hint: "new-project | new-feature description=<text> | continue | status"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse mode:
- `new-project` → full project discovery phase
- `new-feature description=<text>` → spec a new feature
- `continue` → resume from last known state
- `status` → show where we are in the lifecycle
- (empty) → auto-detect mode from project state

---

## Purpose

`/shiploop-start` is the single front door to ShipLoop. It:
1. Reads the current project state
2. Determines which lifecycle phase applies
3. Routes to the right skill or action
4. Never lets work begin without a plan

The rule: **nothing gets built without passing through this skill first.**

---

## Step 1 — Read Project State

Read these files (skip if missing):
1. `CLAUDE.md` — project identity and stack
2. `DEVLOG.md` — last 3 entries (what was done recently)
3. `.specify/feature.json` — active feature directory (if any)
4. `memory/` — list all files + dates
5. `specs/` — list feature directories + their contents

Build a one-line state summary:
```
State: {NEW PROJECT | FEATURE IN PROGRESS: <name> | READY FOR BUILD | QA NEEDED | NO ACTIVE WORK}
Last activity: {date and what}
Active spec: {path or none}
```

---

## Step 2 — Route by Mode

### Mode: `new-project`

Full discovery session for a brand new project.

```
1. Run /shiploop-brainstorm stage=discovery
   → Produces: decisions, personas, constraints, action items

2. After brainstorm → run /speckit-specify <project description>
   → Produces: specs/<feature>/spec.md

3. After spec → run /speckit-plan
   → Produces: plan.md, data-model.md, contracts/, research.md

4. After plan → run /speckit-tasks
   → Produces: tasks.md (ready for implementation)

5. Report: "Project is ready. Run /speckit-implement to start building."
```

Output after each step: what was produced + what comes next.
Wait for user confirmation before advancing to next step (they may want to review).

---

### Mode: `new-feature description=<text>`

Spec and plan a single new feature.

```
1. Check: does a spec already exist for this feature?
   - Search specs/ for matching directory
   - If found: show path, ask "use existing spec or create new?"

2. Run /speckit-specify <description>
   → Produces: specs/<N>-<name>/spec.md

3. Ask: "Spec ready. Run /speckit-plan now? (yes/no)"
   If yes → run /speckit-plan
   → Produces: plan.md, data-model.md

4. Ask: "Plan ready. Generate tasks? (yes/no)"
   If yes → run /speckit-tasks
   → Produces: tasks.md

5. Report: "Feature is ready to implement. Run /speckit-implement to start."
```

⚠️ If description is complex (new screen, new service, > 3 files):
Suggest switching to Opus before specifying:
```
This looks like a large feature (L class).
Opus is recommended for better architecture reasoning.
Switch with `/fast` in Claude Code desktop, then re-run.
Proceed with Sonnet anyway? (yes/no)
```

---

### Mode: `continue`

Resume work from last known state.

Read `.specify/feature.json` for active feature directory.
Check what documents exist:

```
If spec.md exists but plan.md missing → suggest /speckit-plan
If plan.md exists but tasks.md missing → suggest /speckit-tasks
If tasks.md exists with incomplete tasks → suggest /speckit-implement
If all tasks complete → suggest /shiploop-tester
```

Output:
```
## Resume Point

Active feature: <name>
Last completed: <phase>
Next step: <command>

Ready to continue? Run: <command>
```

---

### Mode: `status`

Show full lifecycle status without taking any action.

Output:

```
## ShipLoop Status — {date}

### Project
{project name from CLAUDE.md}

### Active Feature
{feature name + spec path, or "none"}

### Lifecycle Position
Discovery → Spec → [→ Plan → Tasks → Build → QA → Ship]
                ↑ current phase

### Recent Activity (last 3 DEVLOG entries)
- {date}: {what}
- {date}: {what}
- {date}: {what}

### Memory Files
- {count} memory files, latest: {date}

### QA Status
- Last QA: {date or "never"}
- Open P1 issues: {count}

### Next Recommended Action
{concrete command to run}
```

---

### Mode: auto-detect (empty arguments)

If no arguments provided, auto-detect mode:

```
No CLAUDE.md → suggest new-project
CLAUDE.md exists, no specs/ → suggest new-feature
Active feature in .specify/feature.json → suggest continue
All tasks complete → suggest /shiploop-tester
```

Show the detected mode and ask: "Is this correct? (yes / tell me what you want)"

---

## Step 3 — Lifecycle Guard

Before any implementation begins, verify:

- [ ] Spec exists for the feature being built
- [ ] Plan exists (or this is a tiny S-class change)
- [ ] Tasks are defined

If any check fails:
```
⛔ Cannot start building yet.
Missing: {what is missing}
Run: {command to generate it}
```

Exception: for S-class (< 3 files, < 1h), ask:
"This is a small change — skip spec and build directly? (yes/no)"

---

## Step 4 — After Each Phase

When a phase completes, always output:

```
✅ Phase complete: {phase name}
   Produced: {file list}
   Next: {command or action}
   
To proceed: {exact command}
To review first: open {key file}
```

---

## Model Guidance

| Situation | Model |
|-----------|-------|
| Status check, memory read | haiku |
| New feature spec (S-class) | sonnet |
| New project discovery, L-class feature | opus (`/fast`) |
| Plan, tasks, implement | sonnet |
| QA | sonnet |

---

## Done When

- [ ] Project state read and summarized
- [ ] Mode detected or parsed from arguments
- [ ] Correct phase/skill invoked or recommended
- [ ] Lifecycle guard passed (spec + plan exist before build)
- [ ] Next step clearly communicated to user
