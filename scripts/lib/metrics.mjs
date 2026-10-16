// Discipline score + time-to-ship aggregators.
//
// Discipline score counts four binary criteria out of four. "Didn't have
// the convention yet" ≠ "failed the convention" — but at the discipline
// metric level we treat absence as 0, because adopters viewing the
// scorecard are asking "does this project operate under the discipline?",
// not "did this project fail an aspirational standard?". The tier
// label + case-study narrative carries the nuance.
//
// Time-to-ship = median(merge_date - spec_frontmatter_date) in days,
// computed per spec file that has a parseable Date / Created /
// "Feature Branch created" header. Returns null if no spec has a
// parseable date.

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/** @param {string} path */
async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

/** @param {string} path */
async function dirExists(path) {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/** @param {string} repoPath @param {string} filename */
async function anySpecHas(repoPath, filename) {
  const specsDir = join(repoPath, "specs");
  if (!(await dirExists(specsDir))) return false;
  const entries = await readdir(specsDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (await fileExists(join(specsDir, e.name, filename))) return true;
  }
  return false;
}

/**
 * @param {string | null} repoPath
 */
export async function disciplineScore(repoPath) {
  if (!repoPath) return null;
  if (!(await dirExists(repoPath))) return null;

  const hasSpec = await anySpecHas(repoPath, "spec.md");
  const hasPlan = await anySpecHas(repoPath, "plan.md");
  const hasTasks = await anySpecHas(repoPath, "tasks.md");
  const hasDevlog = await fileExists(join(repoPath, "DEVLOG.md"));

  const criteria = {
    hasSpec,
    hasPlan,
    hasTasks,
    hasDevlog,
  };
  const score =
    (hasSpec ? 1 : 0) +
    (hasPlan ? 1 : 0) +
    (hasTasks ? 1 : 0) +
    (hasDevlog ? 1 : 0);
  return { score: Number((score / 4).toFixed(2)), criteria };
}

// Matches both `**Date**: YYYY-MM-DD` and `**Date.** YYYY-MM-DD` (portfolio's
// in-bold-period variant). The separator can be `:` or whitespace.
const DATE_LINE_RE = /\*\*(?:Created|Date|Feature Branch Created)\.?\*\*[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i;
const FRONTMATTER_DATE_RE = /^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/im;

/** @param {string} content */
function extractSpecDate(content) {
  let m = DATE_LINE_RE.exec(content);
  if (m) return m[1];
  m = FRONTMATTER_DATE_RE.exec(content);
  if (m) return m[1];
  return null;
}

/** @param {string} repoPath @param {string} specDirName */
async function lastModifiedCommitDate(repoPath, specDirName) {
  try {
    const r = await exec(
      "git",
      [
        "-C",
        repoPath,
        "log",
        "-1",
        "--format=%ad",
        "--date=short",
        "--",
        `specs/${specDirName}`,
      ],
      { maxBuffer: 1024 * 1024 },
    );
    const d = r.stdout.trim();
    return d || null;
  } catch {
    return null;
  }
}

/** @param {number[]} xs */
function median(xs) {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** @param {string} a @param {string} b */
function daysBetween(a, b) {
  const ta = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  );
  const tb = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  );
  return Math.round((tb - ta) / (1000 * 60 * 60 * 24));
}

/**
 * @param {string | null} repoPath
 */
export async function medianTimeToShip(repoPath) {
  if (!repoPath) return null;
  const specsDir = join(repoPath, "specs");
  if (!(await dirExists(specsDir))) return null;
  const entries = await readdir(specsDir, { withFileTypes: true });

  const diffs = [];
  const perSpec = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const specPath = join(specsDir, e.name, "spec.md");
    if (!(await fileExists(specPath))) continue;
    const content = await readFile(specPath, "utf8");
    const specDate = extractSpecDate(content);
    if (!specDate) continue;
    const shipDate = await lastModifiedCommitDate(repoPath, e.name);
    if (!shipDate) continue;
    const diff = daysBetween(specDate, shipDate);
    if (diff < 0) continue;
    diffs.push(diff);
    perSpec.push({ spec: e.name, specDate, shipDate, days: diff });
  }

  if (diffs.length === 0) return null;
  return { medianDays: median(diffs), count: diffs.length, perSpec };
}
