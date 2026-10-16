## Summary

<!-- 1–3 bullets. What changed and why. -->

## Type of change

- [ ] New skill
- [ ] Skill fix / enhancement
- [ ] Agent change
- [ ] Installer / init-project script
- [ ] Scorecard parser
- [ ] Docs
- [ ] CI / tooling

## Checklist

- [ ] For skill changes: `/shiploop-skill-builder audit` passes locally.
- [ ] For scorecard changes: `node scripts/scorecard.mjs` + `node scripts/snapshot-check.mjs` both pass.
- [ ] Breaking changes have `BREAKING:` in the title and a migration note below.
- [ ] If `REQUIRED_CONFIG_VERSION` bumped: BOTH `scripts/scorecard.mjs` AND `scripts/scorecard.config.mjs` edited in this PR.
- [ ] Capsule contributions: ran leak-audit per `CONTRIBUTING.md § capsules`.
- [ ] Docs updated if user-visible behavior changed (README / INSTALL / CONTRIBUTING).

## Migration notes (if BREAKING)

<!-- What consumers need to do when they upgrade. -->
