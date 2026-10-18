// Scorecard parser configuration — EXAMPLE / STARTER.
//
// This file is a template. Replace the `projects` array with your own
// projects before running `node scripts/scorecard.mjs`.
//
// WHEN UPDATING `configVersion`: bump BOTH this file and
// `scorecard.mjs::REQUIRED_CONFIG_VERSION` in lockstep. The parser
// validates the version on startup and exits non-zero if they drift.
//
// Projects where `logPath: null` have `tokens: null` in the final
// scorecard (Tier 0 bail-out — "null is honest" rule). Other metrics
// (discipline, rework, time-to-ship, expert hit rate) still compute
// from the repo.
//
// `modelMix` and `duration` fields on each project are FALLBACKS. The
// parser overrides them with measured values when the log directory is
// readable. The fallback is used only when `logPath: null` (no
// telemetry to override from).
//
// `archetype` is required (added in configVersion 2). One of:
//   `saas-app | automation | llm-skill | design-tool`
// This tags the project kind so the scorecard can filter hygiene checks
// to the ones that make sense (e.g. GitHub workflows for a repo-backed
// project vs. an installer-shipped CLI).
//
// `githubRepo` is `{ owner, repo } | null` (added in configVersion 2).
// When non-null, the parser probes GitHub via the `gh` CLI for workflow
// health + secret-scanning alerts and emits `metrics.hygiene`. `null`
// (private repo, not on GitHub, or `gh` not installed) → both hygiene
// fields are `null` in the output. Nothing is estimated.

import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const CLAUDE_PROJECTS = join(HOME, ".claude/projects");

export const SCORECARD_CONFIG = {
  configVersion: 2,
  generatedAtPlaceholder: "<overridden by parser at write time>",
  projects: [
    // Example project — delete this and add your own.
    {
      slug: "example-project",
      name: "Example Project",
      tier: 1, // 0=naked | 1=self-spec | 2=ShipLoop
      archetype: "saas-app", // saas-app | automation | llm-skill | design-tool
      repoPath: join(HOME, "example-project"),
      githubRepo: null, // { owner: "you", repo: "example-project" } to enable hygiene probes
      logPath: join(CLAUDE_PROJECTS, "-Users-you-example-project"),
      startDate: "2026-01-01",
      shipDate: null, // null = ongoing
      complexity: "M", // S | M | L
      modelMix: { sonnet: 80, opus: 20 },
      duration: "ongoing",
      notes:
        "Replace this project with your own entries. See the OSS README + hrekov.dev/tools for the methodology aside.",
    },
  ],
};
