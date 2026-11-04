# Birdzy repository guidance

<!-- trackzio-docs-maintenance:start -->
## Keep documentation current

Before changing this app, read `docs/handover/README.md` and `docs/handover/MAINTENANCE.md`.
For every feature, bug fix, behavior-changing refactor, configuration/environment/API change or release:
- Update the relevant product, flow, development, API, environment, QA or release document in the same change.
- Append a dated entry to `docs/handover/CHANGELOG.md` with the change, actual validation and unresolved follow-up.
- Update environment documentation and blank examples when variable names or loading behavior change; never include secret values.
- Keep implemented, planned and verified behavior distinct. Do not claim checks/builds/device tests passed unless run.
- Preserve existing specialist docs and keep their affected sections/links consistent; document this app rather than copying another app's assumptions.
- Record owner/access/acceptance progress in `docs/handover/HANDOVER_60_DAYS.md`; leave unknown owners and unverified tasks explicitly open.
<!-- trackzio-docs-maintenance:end -->
