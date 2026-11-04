# Birdzy — developer and product handover

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

Repository: `Birdzy`. Snapshot: branch `main`, HEAD `d82a859`; local changes may extend beyond that commit.

Help people identify birds from photos or recordings, explore nearby sightings, learn species details, and keep a personal collection.

## Start here

- **New developer:** [Development](DEVELOPMENT.md) → [Environment setup](ENVIRONMENT.md) → [Flows](FLOWS.md) → [QA and operations](QA_AND_OPERATIONS.md).
- **Product, QA and support:** [Product](PRODUCT.md) → [Flows](FLOWS.md) → [Known gaps](KNOWN_GAPS.md).
- **Incoming owner/release engineer:** [60-day handover](HANDOVER_60_DAYS.md) → [Release guide](RELEASE.md) → [Environment setup](ENVIRONMENT.md).
- **Making a change:** [Documentation maintenance](MAINTENANCE.md) and [Change history](CHANGELOG.md).
- **Finding code:** [Feature catalogue](FEATURE_CATALOGUE.md) and [API/data guide](API_AND_DATA.md).
- **All five apps:** [Portfolio index](PORTFOLIO.md).

## What this pack establishes

This is an implementation-grounded onboarding and handover baseline, not a claim that every source feature is deployed or every checklist item has passed. It preserves existing specialist guides and calls out unresolved access, product and verification work. Remote Config, backend deployment, store products and permissions can change behavior without a screen-file change.

The handover is complete only when an incoming owner can run, explain, test, release and support this app without relying on the outgoing developer's machine. Record actual people, access grants, build links and walkthrough evidence in [the handover checklist](HANDOVER_60_DAYS.md).

## Existing deep dives

- [docs/API_CORE.md](../API_CORE.md)
- [docs/API_DOMAIN_MAPPING.md](../API_DOMAIN_MAPPING.md)
- [docs/sound-recording-device-qa.md](../sound-recording-device-qa.md)
- [src/features/explore/README.md](../../src/features/explore/README.md)

## Documentation freshness

Every feature, bug fix, environment, API or release change must update the affected guide and [CHANGELOG.md](CHANGELOG.md) in the same change. The repository guidance files enforce this as an agent instruction; they do not run a background documentation service.

## Check documentation links and examples

Run `python3 docs/handover/check_docs.py` from the repository root after updating this pack. It checks handover links and ensures example environment values remain blank; it does not validate app runtime behavior.
