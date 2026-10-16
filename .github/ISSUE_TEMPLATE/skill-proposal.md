---
name: Skill proposal
about: Propose a new ShipLoop skill or a substantial change to an existing one
title: "[skill] "
labels: skill-proposal
---

## What the skill does

One or two sentences. User-facing: what does invoking it accomplish?

## Why it belongs in ShipLoop (not just your own repo)

Skills ship to every project that installs ShipLoop. A skill belongs here
if it addresses a workflow that recurs across projects, not a
one-project-specific need.

## Trigger

What user phrasing routes to this skill? (Examples ≥3; the classifier
in `/shiploop-router` is only as good as the trigger phrases.)

## Steps the skill walks

Numbered, one Claude turn each. Keep it tight — if you need more than
~7 steps, consider splitting into two skills.

## Output format

What does the user see at the end? Message, file, both?

## Model lane

- [ ] haiku (quick, deterministic)
- [ ] sonnet (default)
- [ ] opus (planning, large design)

## Relationship to existing skills

Does this overlap with `/shiploop-router`, `/shiploop-start`,
`/shiploop-brainstorm`, `/shiploop-tester`, `/shiploop-observer`,
`/shiploop-expert`, `/shiploop-skill-builder`? If so, explain the
delimitation.

## Draft SKILL.md

If you have a draft file, paste it (or link to a fork). Not required
for the proposal — but required before merge.
