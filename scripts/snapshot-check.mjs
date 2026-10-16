#!/usr/bin/env node
// Shape-check: regenerate scorecard, diff STRUCTURE (not values) against
// the committed reference at scripts/__fixtures__/scorecard.expected.json.
//
// Values drift every commit (rework ratio moves, tokens accumulate). The
// shape doesn't. This check guards against:
//   - A project vanishing from the config (bug or malicious removal)
//   - A metric key disappearing from the output (parser regression)
//   - A new metric key appearing without a matching snapshot update
//   - configVersion skew between parser and config
//
// For value-level regressions, re-run `node scripts/scorecard-src/scorecard.mjs
// --out scripts/__fixtures__/scorecard.expected.json` after an intentional
// change and commit the drift.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { argv, exit } from "node:process";

import { SCORECARD_CONFIG } from "./scorecard.config.mjs";

// Hardcoded here (NOT imported from the config) — see scorecard.mjs for the
// same guard; both files must agree with scorecard.config.mjs::configVersion
// and both must bump together when the schema changes.
const REQUIRED_CONFIG_VERSION = 1;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = join(
  __dirname,
  "..",
  "__fixtures__",
  "scorecard.expected.json",
);

const PROJECT_KEYS = ["slug", "name", "tier", "metrics", "context", "details", "notes"];
const METRIC_KEYS = ["disciplineScore", "reworkRatio", "timeToShipDays", "tokens", "expertHitRate"];
const CONTEXT_KEYS = ["complexity", "modelMix", "duration", "tier", "tokenSource"];

function fail(msg) {
  process.stderr.write(`scorecard-snapshot: FAIL — ${msg}\n`);
  exit(1);
}

function ok(msg) {
  process.stderr.write(`scorecard-snapshot: ok — ${msg}\n`);
}

async function main() {
  const regenerate = argv.includes("--regenerate");

  if (SCORECARD_CONFIG.configVersion !== REQUIRED_CONFIG_VERSION) {
    fail(
      `configVersion mismatch — config=${SCORECARD_CONFIG.configVersion}, parser requires ${REQUIRED_CONFIG_VERSION}. Bump both in lockstep.`,
    );
  }
  ok(`configVersion = ${SCORECARD_CONFIG.configVersion}`);

  // Run the parser as a module to get live output without shelling out.
  const { readSessionTokens } = await import("./lib/claude-logs.mjs");
  const { countCommits, reworkRatio } = await import("./lib/git-log.mjs");
  const { scanDevlog, expertHitRate } = await import("./lib/devlog.mjs");
  const { disciplineScore, medianTimeToShip } = await import("./lib/metrics.mjs");

  const projects = [];
  for (const p of SCORECARD_CONFIG.projects) {
    const [tokens, commits, devlog, discipline, tts] = await Promise.all([
      readSessionTokens(p.logPath),
      countCommits(p.repoPath),
      scanDevlog(p.repoPath),
      disciplineScore(p.repoPath),
      medianTimeToShip(p.repoPath),
    ]);
    projects.push({
      slug: p.slug,
      metrics: {
        disciplineScore: discipline ? discipline.score : null,
        reworkRatio: reworkRatio(commits),
        timeToShipDays: tts ? tts.medianDays : null,
        tokens: tokens ? tokens.total : null,
        expertHitRate: expertHitRate(devlog),
      },
    });
  }

  if (regenerate) {
    const { stdout } = await import("node:process");
    stdout.write(
      "scorecard-snapshot: --regenerate acknowledged; re-run `node scripts/scorecard-src/scorecard.mjs --out scripts/__fixtures__/scorecard.expected.json` to refresh the full reference file.\n",
    );
    return;
  }

  let snapshotRaw;
  try {
    snapshotRaw = await readFile(SNAPSHOT_PATH, "utf8");
  } catch (e) {
    fail(`snapshot missing at ${SNAPSHOT_PATH} — generate it with the scorecard main entry.`);
    return;
  }
  const snapshot = JSON.parse(snapshotRaw);
  ok(`loaded snapshot (${snapshot.projects.length} projects)`);

  if (!Array.isArray(snapshot.projects)) fail("snapshot.projects is not an array");

  const snapshotSlugs = snapshot.projects.map((p) => p.slug).sort();
  const liveSlugs = projects.map((p) => p.slug).sort();
  if (snapshotSlugs.join("|") !== liveSlugs.join("|")) {
    fail(
      `project slug set drifted — snapshot=[${snapshotSlugs.join(",")}] live=[${liveSlugs.join(",")}]`,
    );
  }
  ok(`project set matches (${liveSlugs.length} projects)`);

  for (const liveProj of projects) {
    const snapProj = snapshot.projects.find((p) => p.slug === liveProj.slug);
    if (!snapProj) fail(`snapshot missing project ${liveProj.slug}`);

    const snapProjKeys = Object.keys(snapProj).sort();
    for (const k of PROJECT_KEYS) {
      if (!snapProjKeys.includes(k)) {
        fail(`snapshot.${liveProj.slug} missing top-level key "${k}"`);
      }
    }

    const liveMetricKeys = Object.keys(liveProj.metrics).sort();
    if (liveMetricKeys.join("|") !== METRIC_KEYS.slice().sort().join("|")) {
      fail(
        `${liveProj.slug}.metrics key set drifted — live=[${liveMetricKeys.join(",")}] expected=[${METRIC_KEYS.join(",")}]`,
      );
    }

    const snapMetricKeys = Object.keys(snapProj.metrics).sort();
    if (snapMetricKeys.join("|") !== METRIC_KEYS.slice().sort().join("|")) {
      fail(
        `snapshot.${liveProj.slug}.metrics key set drifted — snapshot=[${snapMetricKeys.join(",")}] expected=[${METRIC_KEYS.join(",")}]`,
      );
    }

    const snapContextKeys = Object.keys(snapProj.context).sort();
    if (snapContextKeys.join("|") !== CONTEXT_KEYS.slice().sort().join("|")) {
      fail(
        `snapshot.${liveProj.slug}.context key set drifted — snapshot=[${snapContextKeys.join(",")}] expected=[${CONTEXT_KEYS.join(",")}]`,
      );
    }

    for (const mk of METRIC_KEYS) {
      const v = liveProj.metrics[mk];
      if (v !== null && typeof v !== "number") {
        fail(`${liveProj.slug}.metrics.${mk} = ${JSON.stringify(v)} — expected number|null`);
      }
    }
  }
  ok("all per-project metric + context shapes match");
  ok("snapshot check PASSED");
}

main().catch((err) => {
  process.stderr.write(`scorecard-snapshot: crash — ${err.stack || err.message || err}\n`);
  exit(2);
});
