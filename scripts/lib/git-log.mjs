// Thin wrapper over `git log` for scorecard metrics.
//
// Counts fix/feat/total commits via conventional-commit prefixes.
// A project is treated as "lacking the convention" (returns nulls) when
// zero commits match the convention — not when fewer than N match.
// Even 1 feat commit is signal; the viewer can see the raw counts and
// judge the sample size.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stat } from "node:fs/promises";
import { join } from "node:path";

const exec = promisify(execFile);

const FIX_PREFIX = /^(fix|chore\(fix\))/i;
const FEAT_PREFIX = /^(feat|chore\(add\))/i;

/**
 * @param {string | null} repoPath
 */
export async function countCommits(repoPath) {
  if (!repoPath) return null;
  try {
    const s = await stat(join(repoPath, ".git"));
    if (!s.isDirectory()) return null;
  } catch {
    return null;
  }

  let stdout;
  try {
    const r = await exec("git", ["-C", repoPath, "log", "--format=%s"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout = r.stdout;
  } catch {
    return null;
  }

  const subjects = stdout.split("\n").filter((s) => s.length > 0);
  let fix = 0;
  let feat = 0;
  for (const s of subjects) {
    if (FIX_PREFIX.test(s)) fix += 1;
    else if (FEAT_PREFIX.test(s)) feat += 1;
  }

  return {
    fix,
    feat,
    total: subjects.length,
    conventional: fix + feat,
  };
}

/**
 * @param {{fix: number, feat: number, conventional: number} | null} counts
 */
export function reworkRatio(counts) {
  if (!counts) return null;
  if (counts.conventional === 0) return null;
  if (counts.feat === 0) {
    return counts.fix === 0 ? null : Number.POSITIVE_INFINITY;
  }
  return Number((counts.fix / counts.feat).toFixed(2));
}
