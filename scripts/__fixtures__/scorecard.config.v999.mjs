// Regression fixture — intentionally wrong configVersion.
// The parser must exit non-zero with "configVersion mismatch" in stderr
// when loaded against this config. See the smoke script next to this
// file for the assertion.

export const REQUIRED_CONFIG_VERSION = 999;

export const SCORECARD_CONFIG = {
  configVersion: 999,
  generatedAtPlaceholder: "<v999 fixture — never written to disk>",
  projects: [],
};
