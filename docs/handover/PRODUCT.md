# Birdzy — product guide

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Purpose and audience

Help people identify birds from photos or recordings, explore nearby sightings, learn species details, and keep a personal collection.

Primary audience: Birdwatchers, casual observers, and people organizing their own sightings.

## Main product loop

1. Open the app and resolve onboarding/account state.
2. Capture or choose evidence, or browse the catalogue.
3. Review matches and the relevant birds detail screen.
4. Save a useful result, organize it in a collection/wishlist, or continue learning.
5. Return through saved content, Home discovery and notifications.

Account, purchase and permission states affect which actions are available. The exact free allowances, plan offers and prices must be checked against current Remote Config, backend enforcement and store products. Do not copy a numeric limit or price from another app's docs.

## Product areas

- **Home and discovery:** provide understandable entry points and current daily/promotional content. Source: [src/features/home/screens/HomeScreen.tsx](../../src/features/home/screens/HomeScreen.tsx).
- **Identification:** turn a supported capture/upload into candidate matches, detail and a clear recovery state. Source: [src/features/camera/CameraScreen.tsx](../../src/features/camera/CameraScreen.tsx).
- **Details and saving:** distinguish public archetypes/species from the user's saved specimen and its collection membership. Source: [src/features/collection/screens/BirdDetailsScreen.tsx](../../src/features/collection/screens/BirdDetailsScreen.tsx).
- **Premium access:** purchase, restore, pending confirmation and account entitlement must stay consistent. Source: [src/features/subscription](../../src/features/subscription).
- **Account and support:** login/recovery, profile changes, notifications, appearance, legal information and account actions use this app's own routes and configuration.

### Sound identification and audio library

Start sound identification, allow microphone access, record or select audio, choose a crop, and submit. Open a matched bird or the no-match recovery screen; the audio library separates identified and unknown files.

Implementation reference: [src/features/camera/screens/SoundIdentifyScreen.tsx](../../src/features/camera/screens/SoundIdentifyScreen.tsx); [src/features/discovery/screens/AudioGalleryScreen.tsx](../../src/features/discovery/screens/AudioGalleryScreen.tsx).

### Step-by-step identification

Choose observation location, date, and bird size; submit the answers and review nearby species. The current implementation forwards actual answers and uses page 1 for this endpoint.

Implementation reference: [src/features/discovery/screens/StepByStepScreen.tsx](../../src/features/discovery/screens/StepByStepScreen.tsx); [src/features/discovery/utils/runStepByStepAnalysis.ts](../../src/features/discovery/utils/runStepByStepAnalysis.ts).

### Explore Near You

Open Explore from Home, search for a place or use location access, inspect activity on the map, switch Spotted Now / Year-round, select a group, and open bird details. Map filters affect map activity; seasonal tabs affect the nearby list.

Implementation reference: [src/features/explore/screens/ExploreMapScreen.tsx](../../src/features/explore/screens/ExploreMapScreen.tsx); [src/features/explore/README.md](../../src/features/explore/README.md).

## Product decisions still needing a named owner

- Confirm the current store release, supported platforms/OS versions and active rollout/feature flags.
- Approve the exact free/premium boundaries, subscriptions, discounts and any consumable products.
- Confirm the intended onboarding and guest-to-account conversion behavior, including reinstall and logout.
- Confirm support contacts, legal links, content ownership and the escalation path for provider/backend outages.
- Confirm success metrics and their dashboards: identification completion, save completion, repeat use, purchase/restore success and crash-free sessions. These are proposed handover review metrics, not measured numbers in this document.

## Definition of a product change being ready

The expected user behavior, entry point, error/empty states, permission/premium rules, analytics impact and acceptance checks are written down. QA has evidence for the changed flow, and any open limitation has an owner and a follow-up date. A Figma frame alone is not a complete behavior specification.
