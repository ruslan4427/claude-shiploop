// Reader for Claude Code `.jsonl` session logs.
//
// Each assistant message carries a `message.usage` block with
// `input_tokens`, `output_tokens`, `cache_read_input_tokens`,
// `cache_creation_input_tokens`. Total per-session tokens = sum of all
// four across all assistant messages.
//
// Cache-read is included at face value (not discounted to 10% of input
// cost) because this is a RAW TOKEN metric, not a cost derivation.
//
// Model attribution is by `message.model`. Known model IDs normalize
// to `opus` / `sonnet` / `haiku`; everything else lands in `other`.

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";

const MODEL_FAMILY = {
  "claude-opus-4-7": "opus",
  "claude-opus-4": "opus",
  "claude-sonnet-4-6": "sonnet",
  "claude-sonnet-4": "sonnet",
  "claude-haiku-4-5-20251001": "haiku",
  "claude-haiku-4": "haiku",
};

/** @param {string | undefined} model */
function familyOf(model) {
  if (!model) return "other";
  if (MODEL_FAMILY[model]) return MODEL_FAMILY[model];
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "opus";
  if (lower.includes("sonnet")) return "sonnet";
  if (lower.includes("haiku")) return "haiku";
  return "other";
}

function emptyUsage() {
  return { opus: 0, sonnet: 0, haiku: 0, other: 0 };
}

/** @param {Record<string, unknown>} usage */
function sumUsage(usage) {
  const n = (v) => (typeof v === "number" ? v : 0);
  return (
    n(usage.input_tokens) +
    n(usage.output_tokens) +
    n(usage.cache_read_input_tokens) +
    n(usage.cache_creation_input_tokens)
  );
}

/**
 * Stream-parse one `.jsonl` session, summing tokens per model family.
 * @param {string} filePath
 */
async function readOneSession(filePath) {
  const byModel = emptyUsage();
  let firstTs = null;
  let lastTs = null;

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = typeof obj.timestamp === "string" ? obj.timestamp : null;
    if (ts) {
      if (!firstTs || ts < firstTs) firstTs = ts;
      if (!lastTs || ts > lastTs) lastTs = ts;
    }
    if (obj.type !== "assistant") continue;
    const msg = obj.message;
    if (!msg || typeof msg !== "object") continue;
    const usage = msg.usage;
    if (!usage || typeof usage !== "object") continue;
    const family = familyOf(msg.model);
    byModel[family] += sumUsage(usage);
  }

  const total = Object.values(byModel).reduce((a, b) => a + b, 0);
  return { total, byModel, firstTs, lastTs };
}

/**
 * Read every `.jsonl` under a session directory and sum tokens.
 * @param {string | null} logDir
 */
export async function readSessionTokens(logDir) {
  if (!logDir) return null;

  let entries;
  try {
    entries = await readdir(logDir);
  } catch (e) {
    if (e && typeof e === "object" && e.code === "ENOENT") return null;
    throw e;
  }

  const files = [];
  for (const name of entries) {
    if (!name.endsWith(".jsonl")) continue;
    const full = join(logDir, name);
    const s = await stat(full);
    if (s.isFile()) files.push(full);
  }

  if (files.length === 0) {
    return { total: 0, byModel: emptyUsage(), sessionCount: 0, firstTs: null, lastTs: null };
  }

  const byModel = emptyUsage();
  let total = 0;
  let firstTs = null;
  let lastTs = null;

  for (const f of files) {
    const r = await readOneSession(f);
    total += r.total;
    for (const k of Object.keys(byModel)) {
      byModel[k] += r.byModel[k];
    }
    if (r.firstTs && (!firstTs || r.firstTs < firstTs)) firstTs = r.firstTs;
    if (r.lastTs && (!lastTs || r.lastTs > lastTs)) lastTs = r.lastTs;
  }

  return {
    total,
    byModel,
    sessionCount: files.length,
    firstTs,
    lastTs,
  };
}
