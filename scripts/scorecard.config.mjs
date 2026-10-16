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

import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const CLAUDE_PROJECTS = join(HOME, ".claude/projects");

export const SCORECARD_CONFIG = {
  configVersion: 1,
  generatedAtPlaceholder: "<overridden by parser at write time>",
  projects: [
    // Example project — delete this and add your own.
    {
      slug: "example-project",
      name: "Example Project",
      tier: 1, // 0=naked | 1=self-spec | 2=ShipLoop
      repoPath: join(HOME, "example-project"),
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
