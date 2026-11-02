# Trackzio — five-app handover index

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

Scope confirmed by the user: **Birdzy, Shroomzy, Rockzy, Insecto and Plantzy only**. Banknote, RN-BLE, InterviewAssistant and the experts backend repository are not included. Rockzy’s backend dependency is documented as an external ownership requirement.

- [Birdzy](README.md) — `Birdzy`. Help people identify birds from photos or recordings, explore nearby sightings, learn species details, and keep a personal collection.
- [Shroomzy](../../../Shroom-Ai/docs/handover/README.md) — `Shroom-Ai`. Help users identify mushrooms from photographs, browse species information, explore nearby activity, and maintain personal collections.
- [Rockzy](../../../Rocks-and-Minerals-React-Native/docs/handover/README.md) — `Rocks-and-Minerals-React-Native`. Help users identify and learn about rocks and minerals, organize specimens, and request expert appraisals through a separate credits-based journey.
- [Insecto](../../../insecto-react-native/docs/handover/README.md) — `insecto-react-native`. Help people identify insects, inspect detailed matches, manage collections, and use community and insect-question experiences.
- [Plantzy](../../../plant-app/docs/handover/README.md) — `plant-app`. Help users identify plants, organize their collection, access care information and reminders, and use water, light and pot-measurement tools.

These links assume the five repositories are checked out as siblings under the same parent directory, as in the inspected workspace. On a hosted Git viewer, use the corresponding repository’s `docs/handover/README.md` if sibling links cannot cross repositories.

## Shared way of working

Follow each app’s own setup, environment loader, native targets and API contract. Reuse verified patterns, not whole configuration files or domain payloads. Keep per-app product and QA sign-off separate, particularly billing products, identification model fields, provider keys, native modules and deep-link identity.

Use the same 60-day phases in each app, assigning real owners and evidence there. Each repository’s `MAINTENANCE.md`, root agent instructions and always-applied editor rule require relevant documentation updates with future changes.
