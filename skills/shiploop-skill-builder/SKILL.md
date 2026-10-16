---
name: "shiploop-skill-builder"
description: "Meta-skill for creating and auditing ShipLoop skills. Produces a valid SKILL.md for a new agent, or audits existing skills for structural compliance and quality."
argument-hint: "create name=<skill-name> purpose=<one-line purpose> | audit | audit name=<skill-name>"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse mode from arguments:
- `create ...` → create a new skill
- `audit` → audit all skills in `.claude/skills/` and `~/shiploop/skills/`
- `audit name=<skill-name>` → audit one specific skill

---

## ShipLoop Skill Standard

Every ShipLoop skill MUST conform to this standard. Use it as the reference for both creation and auditing.

### 1. File location & naming

```
~/.claude/skills/<skill-name>/SKILL.md         ← user-global source
<project>/.claude/skills/<skill-name>/SKILL.md ← project copy (synced via cp -r)
```

Skill directory name = skill invocation name (e.g., `shiploop-tester` → `/shiploop-tester`).

### 2. Required frontmatter

```yaml
---
name: "skill-name"              # REQUIRED. Matches directory name exactly.
description: "..."              # REQUIRED. One sentence. What the skill does + when to use it.
argument-hint: "..."            # REQUIRED. Shows valid argument patterns. Example: "stage=discovery | topic=<custom>"
user-invocable: true            # REQUIRED. Always true for ShipLoop skills.
---
```

Rules:
- `name` must be kebab-case, must match directory name
- `description` must be ≤ 150 chars, must answer "what" and "when"
- `argument-hint` must list all valid argument forms with `|` separators
- No extra frontmatter keys unless explicitly needed

### 3. User Input section

MUST appear immediately after frontmatter:

```markdown
## User Input

` ``text
$ARGUMENTS
` ``

[brief instruction on how to parse the arguments]
```

### 4. Phases / Steps

Each skill must have clear numbered phases or steps:
- Each phase has a `## Phase N — Name` or `## Step N — Name` heading
- Each phase has a clear **goal** stated in first sentence
- Complex phases break into numbered sub-steps
- No phase longer than ~50 lines — split if needed

### 5. Output format contracts

If the skill produces structured output (reports, decisions, etc.), define the exact format:
- Use fenced code blocks with markdown content inside
- Include field names with descriptions
- Label optional vs required fields

### 6. File outputs

If the skill writes files, specify:
- Exact path (with `{date}`, `{N}` placeholders where dynamic)
- File contents structure
- Whether to create directory if missing

### 7. Done When checklist

MUST be the last section:

```markdown
## Done When

- [ ] Item 1 (concrete, verifiable)
- [ ] Item 2
- [ ] Item 3
```

Rules:
- 3–8 items
- Each item must be objectively checkable (not "user is happy")
- Covers: execution, output, memory/report saved (if applicable)

### 8. Quality checks

| Check | Rule |
|-------|------|
| Single responsibility | Skill does one thing. Not "analyze AND fix AND deploy." |
| Clear trigger | When exactly should user invoke this? Must be unambiguous. |
| Memory output | If skill generates knowledge → it MUST save to memory/ or specs/ |
| Idempotent | Running the skill twice should not break anything |
| Model hint | If skill needs Opus → mention it. Otherwise sonnet is default. |
| No hardcoded paths | Use relative paths or config. Exception: `~/shiploop/` is canonical. |

---

## Mode A — Create New Skill

### Step 1 — Extract parameters

From arguments, extract:
- `name` — skill name (kebab-case)
- `purpose` — one sentence describing what it does
- Any other args as context

If name or purpose missing: ask user before proceeding.

### Step 2 — Interview (if needed)

If purpose is vague, ask these questions (all at once, not one at a time):

1. What exact problem does this skill solve?
2. What are the 3-5 main steps the skill should execute?
3. What does the skill OUTPUT? (report file, memory entry, code changes, etc.)
4. What arguments should users pass?
5. Does it need Opus? (complex planning/design) or Sonnet is fine?

Wait for answers before writing the skill.

### Step 3 — Draft SKILL.md

Write the new skill following the ShipLoop Skill Standard exactly:

```
~/shiploop/skills/<name>/SKILL.md
```

### Step 4 — Self-audit

Run the audit checklist (Mode B) on the newly created skill.
If any FAIL found → fix before reporting done.

### Step 5 — Install

Copy to project:
```bash
cp -r ~/shiploop/skills/<name> .claude/skills/
```

Report: skill location + how to invoke it.

---

## Mode B — Audit Skills

### Step 1 — Discover skills

If `audit` (all): list all SKILL.md files in:
- `~/shiploop/skills/*/SKILL.md`
- `.claude/skills/*/SKILL.md`

Deduplicate by name. Use shiploop/ version as canonical.

If `audit name=<x>`: find that one skill only.

### Step 2 — Apply compliance checklist

For each skill, check every item:

```
SKILL: /shiploop-{name}
─────────────────────────────────────────────
Frontmatter:
  [ ] name field present and matches directory
  [ ] description ≤ 150 chars, answers what+when
  [ ] argument-hint present with valid examples
  [ ] user-invocable: true

Structure:
  [ ] ## User Input section with $ARGUMENTS block
  [ ] Phases/steps have clear numbered headings
  [ ] Done When checklist present (3-8 items)
  [ ] Done When items are objectively verifiable

Quality:
  [ ] Single responsibility (does one thing)
  [ ] Clear trigger condition documented
  [ ] Memory/report output defined (if applicable)
  [ ] No hardcoded project-specific paths
  [ ] Idempotent (safe to run twice)

Scoring: X/13
Status: PASS (13/13) | WARN (10-12/13) | FAIL (<10/13)
```

### Step 3 — Generate findings

For each FAIL or WARN item, generate a fix:

```
FINDING-{N}: {skill-name} — {item that failed}
  Severity: FAIL | WARN
  Current: {what it has now}
  Required: {what it should have}
  Fix: {exact change to make}
```

### Step 4 — Apply fixes (if user confirmed)

For each FAIL finding:
- Edit the skill file directly
- Apply the minimum change needed
- Re-run the checklist item to verify

### Step 5 — Audit report

Output summary:

```
## ShipLoop Skill Audit — {date}

| Skill | Score | Status | Issues |
|-------|-------|--------|--------|
| /shiploop-router   | 13/13 | PASS | none |
| /shiploop-tester   | 11/13 | WARN | 2 items |
| ...

Total skills audited: N
PASS: N | WARN: N | FAIL: N

Fixes applied: N
```

---

## Done When

- [ ] Mode parsed from arguments (create or audit)
- [ ] For CREATE: SKILL.md written, self-audited, installed to .claude/skills/
- [ ] For AUDIT: all target skills scored against 13-point checklist
- [ ] All FAIL findings listed with concrete fixes
- [ ] Fixes applied (or user informed of pending fixes)
- [ ] Audit summary output to user
