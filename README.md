# ShipLoop

> Discipline, skills, and measurement for shipping with Claude Code.

ShipLoop is an opinionated workflow for working with Claude Code. It
classifies every incoming request into one of nine lanes (quick question,
bug, small feature, large feature, refactor, test, discovery, memory,
observer), gates all large work behind a `spec → plan → tasks` triple, and
produces a measurable scorecard across every project that adopts it.

Nothing here is an AI add-on. It is a set of **skills** (slash commands)
and **agent** definitions you drop into `<project>/.claude/`. Claude Code
picks them up on its own.

```
curl -sSL https://raw.githubusercontent.com/ruslan4427/claude-shiploop/main/install.sh | bash
```

See [INSTALL.md](./INSTALL.md) for `--dry-run`, `--target`, and manual
install.

---

## Lifecycle

```
Discovery → Spec → Plan → Tasks → Build → QA → Ship → Retro
    ↑                                                     │
    └─────────────────────────────────────────────────────┘
```

Every work session begins at the lane that matches the request. Large
work routes through the full lifecycle; a one-line quick question answers
in one message. Discovery sessions produce the `spec.md + plan.md +
tasks.md` triple that gates the next build.

---

## Skills

| Skill                        | Invoke                            | When to use                                                      |
|------------------------------|-----------------------------------|------------------------------------------------------------------|
| `shiploop-start`             | `/shiploop-start`                 | Single entry point — classifies the request + routes to a phase. |
| `shiploop-router`            | `/shiploop-router`                | Classify an ambiguous request without starting work.             |
| `shiploop-brainstorm`        | `/shiploop-brainstorm stage=<…>`  | Structured discovery / post-spec / post-QA / retrospective.      |
| `shiploop-tester`            | `/shiploop-tester`                | Full QA pipeline — surface critical bugs before ship.            |
| `shiploop-observer`          | `/shiploop-observer`              | Audit chain health, propose workflow optimizations.              |
| `shiploop-expert`            | `/shiploop-expert phase=<…>`      | Consult a domain-expert subagent (pre-ship, in-progress, blind-bug). |
| `shiploop-skill-builder`     | `/shiploop-skill-builder`         | Author or audit a new skill against the ShipLoop skill spec.     |

Each skill lives at `skills/<name>/SKILL.md` and is self-documenting.
Read the SKILL.md to see the exact prompt it loads.

---

## Agent

`agents/expert.md` is a domain-agnostic consultant subagent. Invoked by
`/shiploop-expert`, it loads a cached capsule from
`<project>/.claude/expertise/<domain>.md` if present, or drafts one from
first principles. Capsules are gitignored by default — they can hold
project-sensitive context — but ship-worthy ones can be committed with
intent.

---

## Scorecard

Every project running ShipLoop can produce a 5-metric scorecard:
discipline score, rework ratio, time-to-ship, token spend, expert hit
rate. The parser lives at `scripts/scorecard.mjs`; project config at
`scripts/scorecard.config.mjs`. Run:

```
node scripts/scorecard.mjs --out scorecard.json
```

See [hrekov.dev/tools](https://hrekov.dev/tools) for the methodology aside
and a live cross-project scorecard — the maintainer's own measurement
baseline. The meta case study is at
[hrekov.dev/work/claude-shiploop](https://hrekov.dev/work/claude-shiploop).

The scorecard is deliberately honest: unmeasurable metrics report `null`,
never a fabricated number. Tier assignment (naked / self-spec / ShipLoop)
is a human judgment call, not derived at runtime.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PR cadence: weekly review.

---

## License

MIT — see [LICENSE](./LICENSE).

— Ruslan Hrekov
