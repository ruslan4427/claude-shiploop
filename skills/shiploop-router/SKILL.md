---
name: "shiploop-router"
description: "Classify any incoming request and route it to the right action, skill, or model. Add its logic to CLAUDE.md for automatic routing."
argument-hint: "The user's request text (or leave empty to classify the last message)"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

## Purpose

Every request in ShipLoop must be classified before execution. This skill:
1. Reads the request (from arguments or last user message)
2. Classifies it into one of 8 types
3. Reports: class, recommended model, recommended action
4. Optionally executes the action

---

## Classification Table

| Class | Code | Signal words | Action | Model |
|-------|------|-------------|--------|-------|
| Quick question | Q | what, how does, explain, why, show me, where is | Answer directly | haiku |
| Bug fix | B | error, crash, doesn't work, fix, broke, exception, fails | Diagnose → fix → verify | sonnet |
| Small feature | S | add, implement (< 3 files, simple change) | Check spec → implement | sonnet |
| Large feature | L | new screen, new service, full flow, architecture | Full speckit cycle | **opus** |
| Refactor | R | refactor, extract, clean, reorganize, optimize code | Analyze → propose → implement | sonnet |
| Testing/QA | T | test, QA, heuristics, UX analysis, analyze app | /shiploop-tester | sonnet |
| Discovery/Design | D | brainstorm, design, ideas, how should we, architecture | /shiploop-brainstorm | **opus** |
| Memory/Status | M | remember, what did we, context, where are we, status | Read memories → answer | haiku |
| Observer | O | optimize agents, check workflow, improve shiploop | /shiploop-observer | sonnet |

---

## Execution

### Step 1 — Classify

Read the request. Apply the classification table. If ambiguous between two classes, pick the higher-complexity one (e.g., S vs L → pick L).

### Step 2 — Report classification

Output in this format:

```
**Request class**: [CODE] — [Name]
**Recommended model**: [haiku / sonnet / opus]
**Action**: [what will happen next]
```

If class is **L** or **D**, add:
```
⚠️ Complex task detected. Consider switching to Opus (`/fast` in Claude Code desktop) for better results.
```

### Step 3 — Execute or confirm

- For **Q** and **M**: proceed immediately without asking
- For **B**, **S**, **R**, **T**: proceed immediately
- For **L** and **D**: state the plan first, wait for user confirmation before starting
- For **O**: proceed with observer analysis

### Step 4 — After execution

- If class was **B** or **S**: offer to update DEVLOG.md
- If class was **L** or **D**: save brainstorm/spec conclusions to memory
- If class was **T**: the tester skill handles its own memory

---

## Done When

- [ ] Request classified with code + name
- [ ] Model recommendation stated
- [ ] Action completed or confirmed
