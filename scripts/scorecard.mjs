#!/usr/bin/env node
// Scorecard parser — Portfolio copy.
//
// Reads SCORECARD_CONFIG, walks every project, composes a per-project
// `{slug, name, tier, metrics, context, notes}` block, and writes a
// top-level JSON `{generatedAt, projects}` to stdout or `--out <path>`.
//
// configVersion is validated against REQUIRED_CONFIG_VERSION at startup.
// Mismatch exits non-zero — the OSS canonical parser and this vendored
// copy must bump in lockstep so the snapshot CI diff can't drift silently.
//
// `metrics` fields that genuinely don't apply return null + a `notes`
// sentence from the config. Not zero. Null is honest.

import { writeFile } from "node:fs/promises";
import { argv, exit, stdout } from "node:process";

import { SCORECARD_CONFIG } from "./scorecard.config.mjs";
import { readSessionTokens } from "./lib/claude-logs.mjs";

// Hardcoded in the parser (NOT imported from the config) so the lockstep
// guard works: bumping configVersion requires editing this constant in a
// separate file, which the diff makes obvious at review time.
const REQUIRED_CONFIG_VERSION = 1;
import { countCommits, commitsByDate, reworkRatio } from "./lib/git-log.mjs";
import { scanDevlog, expertHitRate } from "./lib/devlog.mjs";
import { disciplineScore, medianTimeToShip } from "./lib/metrics.mjs";

/** @param {string[]} args */
function parseArgs(args) {
  const parsed = { out: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--out" && i + 1 < args.length) {
      parsed.out = args[i + 1];
      i += 1;
    }
  }
  return parsed;
}

/** @param {{opus: number, sonnet: number, haiku: number, other: number}} byModel */
function modelMixFromMeasured(byModel) {
  const total = byModel.opus + byModel.sonnet + byModel.haiku + byModel.other;
  if (total === 0) return null;
  const pct = (n) => Math.round((n / total) * 100);
  const mix = {};
  if (byModel.opus > 0) mix.opus = pct(byModel.opus);
  if (byModel.sonnet > 0) mix.sonnet = pct(byModel.sonnet);
  if (byModel.haiku > 0) mix.haiku = pct(byModel.haiku);
  if (byModel.other > 0) mix.other = pct(byModel.other);
  const sum = Object.values(mix).reduce((a, b) => a + b, 0);
  if (sum !== 100 && Object.keys(mix).length > 0) {
    const largest = Object.keys(mix).reduce((a, b) => (mix[a] >= mix[b] ? a : b));
    mix[largest] += 100 - sum;
  }
  return mix;
}

/**
 * Zip token-by-date map with commit-by-date map into a sorted daily array.
 * Returns null when both inputs are empty/missing (no signal at all).
 *
 * @param {Map<string, number> | null | undefined} tokensByDate
 * @param {Map<string, number> | null | undefined} commitsByDateMap
 */
function buildDaily(tokensByDate, commitsByDateMap) {
  const dates = new Set();
  if (tokensByDate) for (const d of tokensByDate.keys()) dates.add(d);
  if (commitsByDateMap) for (const d of commitsByDateMap.keys()) dates.add(d);
  if (dates.size === 0) return null;
  return [...dates]
    .sort()
    .map((date) => ({
      date,
      tokens: tokensByDate?.get(date) ?? 0,
      commits: commitsByDateMap?.get(date) ?? 0,
    }));
}

/** @param {string | null} firstTs @param {string | null} lastTs */
function durationFromTimestamps(firstTs, lastTs) {
  if (!firstTs || !lastTs) return null;
  const a = Date.parse(firstTs);
  const b = Date.parse(lastTs);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const days = Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? "" : "s"} active`;
}

/** @param {typeof SCORECARD_CONFIG.projects[number]} project */
async function scoreProject(project) {
  const [tokens, commits, devlog, discipline, tts, commitsByDay] = await Promise.all([
    readSessionTokens(project.logPath),
    countCommits(project.repoPath),
    scanDevlog(project.repoPath),
    disciplineScore(project.repoPath),
    medianTimeToShip(project.repoPath),
    commitsByDate(project.repoPath),
  ]);

  const measuredMix = tokens ? modelMixFromMeasured(tokens.byModel) : null;
  const measuredDuration = tokens ? durationFromTimestamps(tokens.firstTs, tokens.lastTs) : null;

  const tokenSource = project.logPath === null
    ? "unmeasurable"
    : (tokens && tokens.total > 0 ? "dedicated-session-log" : "empty-session-log");

  const daily = buildDaily(tokens?.tokensByDate, commitsByDay);

  return {
    slug: project.slug,
    name: project.name,
    tier: project.tier,
    pending: project.pending === true ? true : undefined,
    metrics: {
      disciplineScore: discipline ? discipline.score : null,
      reworkRatio: reworkRatio(commits),
      timeToShipDays: tts ? tts.medianDays : null,
      tokens: tokens ? tokens.total : null,
      expertHitRate: expertHitRate(devlog),
    },
    context: {
      complexity: project.complexity,
      modelMix: measuredMix ?? project.modelMix,
      duration: measuredDuration ?? project.duration,
      tier: project.tier,
      tokenSource,
    },
    daily,
    details: {
      disciplineCriteria: discipline ? discipline.criteria : null,
      commitCounts: commits,
      sessionCount: tokens ? tokens.sessionCount : null,
      tokensByModel: tokens ? tokens.byModel : null,
      specsCounted: tts ? tts.count : null,
      devlogExpertStats: devlog,
      startDate: project.startDate ?? null,
      shipDate: project.shipDate ?? null,
    },
    notes: project.notes,
  };
}

async function main() {
  if (SCORECARD_CONFIG.configVersion !== REQUIRED_CONFIG_VERSION) {
    stdout.write("");
    process.stderr.write(
      `scorecard: configVersion mismatch — config=${SCORECARD_CONFIG.configVersion}, parser requires ${REQUIRED_CONFIG_VERSION}\n`,
    );
    exit(2);
  }

  const { out } = parseArgs(argv.slice(2));
  const projects = [];
  for (const p of SCORECARD_CONFIG.projects) {
    projects.push(await scoreProject(p));
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    configVersion: SCORECARD_CONFIG.configVersion,
    projects,
  };

  const json = JSON.stringify(payload, null, 2);
  if (out) {
    await writeFile(out, `${json}\n`, "utf8");
    process.stderr.write(`scorecard: wrote ${out}\n`);
  } else {
    stdout.write(`${json}\n`);
  }
}

// Only run when invoked directly (not when imported for shape checks).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`scorecard: ${err.stack || err.message || err}\n`);
    exit(1);
  });
}

export { scoreProject, main };
