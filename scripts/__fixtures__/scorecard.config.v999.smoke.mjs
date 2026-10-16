#!/usr/bin/env node
// Config-version regression smoke test.
//
// Builds a transient scorecard tree with the v999 fixture as its
// scorecard.config.mjs, runs the parser, and asserts the parser:
//   1. exits non-zero
//   2. prints "configVersion mismatch" to stderr
//
// Guards against regressions where the lockstep guard between
// scorecard.mjs::REQUIRED_CONFIG_VERSION and
// scorecard.config.mjs::configVersion is silently removed.

import { mkdtemp, cp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, "..");
const FIXTURE_CONFIG = join(__dirname, "scorecard.config.v999.mjs");

const tmp = await mkdtemp(join(tmpdir(), "scorecard-regression-"));

try {
  // Mirror scripts/ into tmp, excluding __fixtures__ (not needed) and
  // overwriting scorecard.config.mjs with the v999 fixture.
  await cp(join(SCRIPTS_DIR, "scorecard.mjs"), join(tmp, "scorecard.mjs"));
  await cp(join(SCRIPTS_DIR, "snapshot-check.mjs"), join(tmp, "snapshot-check.mjs"));
  await cp(join(SCRIPTS_DIR, "lib"), join(tmp, "lib"), { recursive: true });
  await writeFile(
    join(tmp, "scorecard.config.mjs"),
    await readFile(FIXTURE_CONFIG, "utf8"),
  );

  const result = spawnSync("node", ["scorecard.mjs", "--out", "/dev/null"], {
    cwd: tmp,
    encoding: "utf8",
  });

  if (result.status === 0) {
    console.error(
      `regression FAIL: parser accepted v999 config (exit=0). Expected non-zero.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
    process.exit(1);
  }

  if (!result.stderr.includes("configVersion mismatch")) {
    console.error(
      `regression FAIL: expected "configVersion mismatch" in stderr, got:\n${result.stderr}`,
    );
    process.exit(1);
  }

  console.log(
    `regression ok — parser bailed with exit=${result.status} + "configVersion mismatch" in stderr`,
  );
} finally {
  await rm(tmp, { recursive: true, force: true });
}
