# Birdzy — documentation maintenance

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Standing rule

Every bug fix, feature, refactor that changes behavior, environment/configuration change, API change and release must update the relevant documentation **in the same change**. Also add a dated entry to [CHANGELOG.md](CHANGELOG.md). Do not leave documentation updates for the end of the 60-day period.

## Which document changes

- Product purpose, availability, plan/permission rules or success criteria → [PRODUCT.md](PRODUCT.md).
- Entry points, happy/error/recovery steps or navigation → [FLOWS.md](FLOWS.md).
- Setup, dependencies, architecture, commands or implementation approach → [DEVELOPMENT.md](DEVELOPMENT.md).
- Environment keys, loader/precedence, provider/native setup or access requirements → [ENVIRONMENT.md](ENVIRONMENT.md) and the blank templates under `env/`.
- Endpoint, payload, auth, identifiers, page numbering, cache/data behavior → [API_AND_DATA.md](API_AND_DATA.md) and the existing detailed API guide.
- New/moved feature or screen/source ownership → [FEATURE_CATALOGUE.md](FEATURE_CATALOGUE.md).
- Build scripts, signing, CI, rollout or rollback behavior → [RELEASE.md](RELEASE.md).
- Regression commands, device acceptance, incident steps or validation evidence → [QA_AND_OPERATIONS.md](QA_AND_OPERATIONS.md).
- Open issue, unverified backend/device behavior or a decision needing an owner → [KNOWN_GAPS.md](KNOWN_GAPS.md).
- Access, ownership, walkthrough or acceptance progress → [HANDOVER_60_DAYS.md](HANDOVER_60_DAYS.md).

## Minimum change entry

Use a dated section in the changelog with: user-visible problem/change, affected flow/source files, relevant docs updated, checks actually run and results, verification not performed, and any next action/owner. Link a commit/issue when available. If a fix has no product/setup/flow impact, say so briefly while still logging its validation.

## Evidence and writing rules

Write for the next developer and a product/QA reader who was not in the chat. Prefer concrete steps, source links and examples; explain the reason for a constraint. Keep a planned behavior separate from implemented source and verified release behavior. Never label a test or build as passing unless it was run on the specified state. Old audit results retain their date and scope.

Do not put environment values, JWTs, receipts, signing material or personal data into docs. Use blank examples and approved-storage/access pointers. Keep existing detailed guides and update their affected sections rather than creating a conflicting second source of truth.

## Review before finishing a change

- [ ] User-visible and technical changes are described in the right pages.
- [ ] Links/source paths and command names still resolve.
- [ ] New/changed environment names appear in both the guide and appropriate blank template.
- [ ] Checks and limitations are recorded accurately, with open follow-up ownership.
- [ ] CHANGELOG.md includes the dated change.

## Check documentation links and examples

Run `python3 docs/handover/check_docs.py` from the repository root after updating this pack. It checks handover links and ensures example environment values remain blank; it does not validate app runtime behavior.
