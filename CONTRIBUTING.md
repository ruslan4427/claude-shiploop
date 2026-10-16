# Contributing to ShipLoop

PRs welcome. Review cadence is weekly — the maintainer (@ruslan4427)
reviews on Fridays. Expect a response within one review cycle; longer
only if the PR is substantial.

---

## Proposing a new skill

A new skill is a directory under `skills/<name>/` with a single
`SKILL.md` file. Use `/shiploop-skill-builder` (installed with ShipLoop)
to scaffold one that passes the frontmatter and structural checks the
`skill-lint` workflow runs on every PR.

### Required frontmatter

```yaml
---
name: <skill-name>              # must match directory
description: <one line, ≤120 chars, user-invocation phrasing>
model: <haiku | sonnet | opus>  # default lane; routable overrides allowed
---
```

### Required sections

Every `SKILL.md` must have, in order:

1. **One-sentence purpose** (bold prose, first body line).
2. **When to use** — concrete triggers.
3. **Steps** — numbered, imperative, each resolving in one Claude turn.
4. **Output format** — what the user sees at the end.

Skill-lint rejects PRs that are missing frontmatter fields or that have
section headers in the wrong order.

---

## Bug reports

Open an issue using `.github/ISSUE_TEMPLATE/bug-report.md`. Include:

- Which skill (`/shiploop-*`).
- What you ran (verbatim invocation).
- Expected vs. actual.
- Claude Code version (`claude --version`).
- OS + shell.

If the bug is "a skill produced the wrong classification," paste the
message that got misclassified and the lane it landed in.

---

## Pull request workflow

1. Fork + branch (`feature/<name>` or `fix/<name>`).
2. For skills, run `/shiploop-skill-builder audit` locally before
   pushing.
3. For scorecard parser changes, run both `npm run scorecard` and
   `npm run scorecard:check` locally; the CI gate runs the same.
4. Fill in the PR template.
5. Push → open PR → wait for weekly review.

Breaking changes (removing a skill, renaming a flag, bumping
`REQUIRED_CONFIG_VERSION`) require a `BREAKING:` prefix in the PR title
and a migration note in the body.

---

## Capsules (`expertise/`)

The `expertise/` directory in the installed tree is where
`/shiploop-expert` caches domain capsules. It is **gitignored by
default** in installed projects because capsules can carry project
context (file paths, naming conventions, past-decision summaries).

If you want to contribute a *public* capsule — a generic domain reference
others can reuse (e.g., `editorial-portfolio-site`, `booking-saas-backend`)
— open a PR adding it to `expertise/` in this repo. Strip project-specific
paths and names before submitting. The maintainer will audit for leaked
context before merging.

---

## Scorecard methodology changes

If you want to change how a metric is computed (e.g., a different time-to-ship
formula), open an issue first with the rationale. The scorecard is designed
to be comparable across projects — unilateral metric changes break that
contract.

Any change that bumps `REQUIRED_CONFIG_VERSION` must land as a lockstep
edit in both `scripts/scorecard.mjs` and `scripts/scorecard.config.mjs`,
or the next CI run on either repo (OSS or a consumer vendoring the
parser) fails.
