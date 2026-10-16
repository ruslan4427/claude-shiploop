// DEVLOG scanner for expert hit rate.
//
// Convention: an "expert consulted" line in DEVLOG is followed (within
// a few non-blank lines) by a "plan changed: yes" or "plan changed: no"
// sibling. Hit rate = yes / (yes + no).
//
// Current state (2026-10-14): the structured convention is NOT yet
// enforced in portfolio DEVLOG — free-text mentions of
// `/shiploop-expert` exist but without the paired marker. Parser
// returns null until the convention is adopted. Null is honest signal:
// the measurement framework exists, instrumentation of past work does
// not, and we don't retrofit fake data.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CONSULTED_RE = /expert\s+consulted/i;
const PLAN_CHANGED_RE = /plan\s+changed:\s*(yes|no)/i;

/**
 * @param {string | null} repoPath
 */
export async function scanDevlog(repoPath) {
  if (!repoPath) return null;
  let text;
  try {
    text = await readFile(join(repoPath, "DEVLOG.md"), "utf8");
  } catch (e) {
    if (e && typeof e === "object" && e.code === "ENOENT") return null;
    throw e;
  }

  const lines = text.split("\n");
  let consulted = 0;
  let planChangedYes = 0;
  let planChangedNo = 0;

  for (let i = 0; i < lines.length; i += 1) {
    if (!CONSULTED_RE.test(lines[i])) continue;
    consulted += 1;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
      const m = PLAN_CHANGED_RE.exec(lines[j]);
      if (m) {
        if (m[1].toLowerCase() === "yes") planChangedYes += 1;
        else planChangedNo += 1;
        break;
      }
    }
  }

  return { consulted, planChangedYes, planChangedNo };
}

/**
 * @param {{consulted: number, planChangedYes: number, planChangedNo: number} | null} stats
 */
export function expertHitRate(stats) {
  if (!stats) return null;
  const total = stats.planChangedYes + stats.planChangedNo;
  if (total === 0) return null;
  return Number((stats.planChangedYes / total).toFixed(2));
}
