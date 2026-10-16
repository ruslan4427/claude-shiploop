---
name: "shiploop-tester"
description: "Full QA pipeline: automated tests, UX heuristics (Nielsen's 10), analytics, prioritized fix tasks, and QA report."
argument-hint: "Optional: 'tests-only', 'ux-only', 'analytics-only', or a specific user story (e.g. 'US4')"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

If `tests-only`: skip UX and analytics.
If `ux-only`: skip test runner and analytics.
If `analytics-only`: skip tests and UX.
Otherwise run all three phases.

---

## Phase 1 — Automated Tests

### 1.1 Detect stack

Check project root for:
- `pubspec.yaml` → Flutter stack
- `package.json` with `vitest` or `jest` → JS/TS stack
- `pyproject.toml` → Python stack

### 1.2 Run tests

**Flutter:**
```bash
flutter analyze 2>&1
flutter test --exclude-tags integration 2>&1
flutter test integration_test/ --device-id <connected-device-id> --dart-define-from-file=.env 2>&1
```

**JS/TS (Next.js / Node):**
```bash
npm run lint 2>&1
npm test 2>&1
npx playwright test 2>&1
```

### 1.3 Parse results

For each suite:
- Count: passed / failed / skipped
- Extract: failed test names + error messages
- Map failures to user stories (from spec.md if available)

---

## Phase 2 — UX Heuristic Analysis

Read the following files to understand the UI:
1. `CLAUDE.md` — architecture, key screens
2. `specs/*/spec.md` — user stories and acceptance criteria
3. Key screen files in `lib/features/` (Flutter) or `pages/` (Next.js)

Apply Nielsen's 10 Heuristics to each screen:

| # | Heuristic | What to check |
|---|-----------|--------------|
| H1 | Visibility of system status | Loading states, progress indicators, feedback on actions |
| H2 | Match with real world | Language matches user's mental model, icons are intuitive |
| H3 | User control and freedom | Undo, cancel, easy exit from flows |
| H4 | Consistency and standards | Consistent components, naming, navigation patterns |
| H5 | Error prevention | Validation before destructive actions, confirmations |
| H6 | Recognition over recall | Options visible, no need to memorize previous steps |
| H7 | Flexibility and efficiency | Shortcuts for power users, bulk actions |
| H8 | Aesthetic and minimalist design | No unnecessary information, clean layout |
| H9 | Error recognition and recovery | Actionable error messages, not raw exception strings |
| H10 | Help and documentation | Empty states guide the user, self-explanatory UI |

For each heuristic output:
- **Status**: PASS (4-5/5) | WARN (3/5) | FAIL (1-2/5)
- **Score**: X/5
- **Finding**: 1-2 sentences
- **Evidence**: specific file:line or screen name
- **Fix** (if WARN/FAIL): concrete recommendation

---

## Phase 3 — Analytics Review

### 3.1 Crash reports

If Firebase Crashlytics configured:
```bash
# Check for recent crash patterns in DEVLOG.md
grep -i "crash\|error\|bug" DEVLOG.md | tail -20
```

Check `specs/qa-reports/` for previous QA reports. Note recurring issues.

### 3.2 Performance signals

Look for known performance patterns in code:
- Sequential loops doing async HTTP calls → suggest bulkInsert
- Missing pagination on lists → suggest lazy loading
- Large images without caching → suggest cached_network_image

---

## Phase 4 — Generate Fix Tasks

For every FAIL or WARN finding:

```
FIX-{N}: {short title}
  Severity: P1 (blocking) | P2 (important) | P3 (minor)
  Source: test failure | heuristic H{N} | analytics
  Description: {what is broken}
  Expected: {what should happen}
  File: {file path and line if known}
  Fix: {concrete change needed}
```

Group fixes by severity:
- **P1**: route immediately to development (mention explicitly to user)
- **P2**: add to next sprint backlog
- **P3**: add to nice-to-have list

---

## Phase 5 — Write QA Report

Write report to `specs/qa-reports/YYYY-MM-DD-qa-report.md`.

Use this structure:
```markdown
# QA Report — {date}

## Summary
| Phase | Status | Issues |
|-------|--------|--------|
| Automated tests | PASS/FAIL | N failed |
| UX heuristics | X/10 pass | N warnings |
| Analytics | OK/ISSUES | N patterns |

## P1 — Blocking Issues
...

## P2 — Important Issues
...

## Fix Tasks (ready for development)
...

## Next Steps
1. Fix P1 issues first
2. Re-run tester after fixes
3. Update DEVLOG.md
```

---

## Phase 6 — Save Memory

Save iteration memory to `memory/qa-iteration-{N}.md`:

```markdown
---
name: QA Iteration {N}
type: project
date: {YYYY-MM-DD}
---

## What was tested
## Key findings
## Decisions made
## P1 fixes assigned
## P2 fixes backlogged
```

---

## Done When

- [ ] Automated tests run (or marked NOT_RUN with reason)
- [ ] All 10 heuristics assessed
- [ ] Analytics patterns checked
- [ ] Fix tasks generated with severity
- [ ] QA report written to specs/qa-reports/
- [ ] Memory entry saved
- [ ] P1 issues explicitly flagged to user
