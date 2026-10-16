#!/usr/bin/env node
// skill-lint — validates every skill in `skills/` for:
//   1. directory name === frontmatter `name`
//   2. required frontmatter fields present (name, description)
//   3. model lane (if set) is one of haiku | sonnet | opus
//
// Exits non-zero on any failure. CI runs this on every PR touching
// skills/.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, "..", "..", "skills");

const REQUIRED_FM_KEYS = ["name", "description"];
const VALID_MODELS = new Set(["haiku", "sonnet", "opus"]);

const failures = [];

function unquote(v) {
  const trimmed = v.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function fail(skill, msg) {
  failures.push(`[${skill}] ${msg}`);
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = unquote(m[2]);
  }
  return fm;
}

async function lintSkill(dir) {
  const skillName = dir;
  const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
  let raw;
  try {
    raw = await readFile(skillPath, "utf8");
  } catch {
    fail(skillName, "SKILL.md missing");
    return;
  }

  const fm = parseFrontmatter(raw);
  if (!fm) {
    fail(skillName, "frontmatter block missing or malformed (expected --- … ---)");
    return;
  }

  for (const key of REQUIRED_FM_KEYS) {
    if (!fm[key]) fail(skillName, `frontmatter.${key} required`);
  }

  if (fm.name && fm.name !== skillName) {
    fail(skillName, `frontmatter.name "${fm.name}" ≠ directory "${skillName}"`);
  }

  if (fm.model !== undefined && !VALID_MODELS.has(fm.model)) {
    fail(
      skillName,
      `frontmatter.model "${fm.model}" invalid (expected haiku | sonnet | opus)`,
    );
  }

}

async function main() {
  try {
    await stat(SKILLS_DIR);
  } catch {
    console.error(`skill-lint: ${SKILLS_DIR} not found`);
    process.exit(1);
  }

  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (skillDirs.length === 0) {
    console.error("skill-lint: no skills found");
    process.exit(1);
  }

  for (const dir of skillDirs) await lintSkill(dir);

  if (failures.length > 0) {
    console.error("skill-lint: FAIL");
    for (const f of failures) console.error("  " + f);
    process.exit(1);
  }

  console.log(`skill-lint: ok — ${skillDirs.length} skills validated`);
}

main();
