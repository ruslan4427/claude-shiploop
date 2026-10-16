# `expertise/` — domain capsule store

This directory holds **capsules**: short, prose-first references that
teach the `expert` subagent (`agents/expert.md`) about a specific
domain before it consults on a problem. One capsule per domain.

Capsules live here in the OSS repo as *public* references (generic
domain knowledge — editorial design systems, booking SaaS backends,
etc.). In an installed project (`<project>/.claude/expertise/`), the
same directory holds *project-local* capsules that may carry
project-sensitive context.

**The installer gitignores `expertise/` by default in projects
scaffolded via `scripts/init-project.sh`.** If you set up `.claude/`
by hand, add `expertise/` to your `.gitignore` before committing a
capsule that references internal file paths, naming conventions, or
decisions you don't want public.

---

## How to generate a capsule

The expert subagent is itself the authoring tool. Trigger it with a
blind-bug consult; approve the proposed capsule when the resolution
pattern crystallizes:

```
/shiploop-expert phase=blind-bug
<describe the symptom>
```

The subagent researches, proposes a capsule in draft, and asks for
your approval. Approved capsules save to
`<project>/.claude/expertise/<domain>.md` and are loaded
automatically on subsequent consults in that domain.

Use `phase=pre-ship` or `phase=in-progress` for consults that don't
produce a new capsule — those load existing capsules without writing.

---

## Capsule format

Keep capsules tight. The project layer (`CLAUDE.md`, `AGENTS.md`,
code conventions) usually does the heavy context lifting; the
capsule only needs to add what the project layer doesn't already
teach.

Required sections:

1. **Domain name + one-line scope** (frontmatter `name` + `summary`).
2. **When to load this capsule** — concrete triggers that justify
   its presence over no capsule at all.
3. **Non-obvious patterns** — rules a careful consultant would still
   get wrong without this capsule. Each rule names the reason
   (bug avoided, standard enforced, incident recalled).
4. **References** — links to the authoritative sources (specs, RFCs,
   past incident writeups) the capsule compresses.

Capsules without a `references` section tend to drift — the agent
can't verify a claim against the source and starts hallucinating
updates.

Target length: 1–3 KB of markdown. If a capsule grows past 5 KB,
split it into sub-domains.

---

## Public capsules (shipped in this repo)

New entries land here when a public-ready capsule is contributed via
PR. See `CONTRIBUTING.md` for the leak-audit checklist before
submitting one.

Currently: none. The first public capsule will land after the first
external contributor validates the format against their own domain.

---

## Privacy warning

Before committing *any* capsule to a public repo:

- Strip absolute file paths (`/Users/<name>/…`, `~/<project>/…`).
- Strip real person names unless they're public (open-source
  maintainers already named in referenced repos).
- Strip URLs that leak internal infra (private Grafana boards,
  internal Linear projects, Slack webhook examples).
- Strip business-sensitive numbers (customer counts, revenue,
  internal pricing).

Capsules are prose; `grep` is sufficient to audit a short one before
`git commit`.
