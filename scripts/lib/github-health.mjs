// GitHub health probe for the scorecard.
//
// Returns `{ workflowsHealthy, secretScanPass }` for a `{ owner, repo }`
// pair. Each field is `true | false | null`. `null` means "unmeasurable"
// (gh CLI missing, repo private without scope, 404/403, no runs, etc.) —
// never guess. This matches the null-is-honest contract the rest of the
// scorecard follows (spec §10.1).
//
// gh CLI is detected once at module load. Absent → every call short-
// circuits to all-null and logs one line to stderr. Each sub-probe runs
// in its own try/catch so one failed probe doesn't null the other.
//
// No caching between calls: the full scorecard regen is one-shot and
// cache would mask stale data on a re-run.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const GH_AVAILABLE = await detectGh();

async function detectGh() {
  try {
    await exec("gh", ["--version"], { timeout: 5000 });
    return true;
  } catch {
    process.stderr.write("github-health: gh CLI not available — hygiene fields will be null\n");
    return false;
  }
}

/**
 * @param {{ owner: string, repo: string } | null | undefined} repoRef
 * @returns {Promise<{ workflowsHealthy: boolean | null, secretScanPass: boolean | null }>}
 */
export async function probeGitHubHealth(repoRef) {
  if (!GH_AVAILABLE || !repoRef || !repoRef.owner || !repoRef.repo) {
    return { workflowsHealthy: null, secretScanPass: null };
  }

  const [workflowsHealthy, secretScanPass] = await Promise.all([
    probeWorkflows(repoRef),
    probeSecretScanning(repoRef),
  ]);

  return { workflowsHealthy, secretScanPass };
}

/** @param {{ owner: string, repo: string }} ref */
async function probeWorkflows({ owner, repo }) {
  try {
    const { stdout } = await exec(
      "gh",
      [
        "run",
        "list",
        "--repo",
        `${owner}/${repo}`,
        "--branch",
        "main",
        "--limit",
        "50",
        "--json",
        "workflowName,conclusion,status",
      ],
      { timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
    );
    const runs = JSON.parse(stdout);
    if (!Array.isArray(runs) || runs.length === 0) return null;

    const latestByWorkflow = new Map();
    for (const run of runs) {
      if (!run.workflowName || run.status !== "completed") continue;
      if (!latestByWorkflow.has(run.workflowName)) {
        latestByWorkflow.set(run.workflowName, run.conclusion);
      }
    }
    if (latestByWorkflow.size === 0) return null;

    for (const conclusion of latestByWorkflow.values()) {
      if (conclusion !== "success") return false;
    }
    return true;
  } catch {
    return null;
  }
}

/** @param {{ owner: string, repo: string }} ref */
async function probeSecretScanning({ owner, repo }) {
  try {
    const { stdout } = await exec(
      "gh",
      [
        "api",
        `/repos/${owner}/${repo}/secret-scanning/alerts`,
        "--jq",
        "length == 0",
      ],
      { timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
    );
    const trimmed = stdout.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    return null;
  } catch {
    return null;
  }
}
