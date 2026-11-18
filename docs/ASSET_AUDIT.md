# Birdzy Asset Audit

## Current cleanup — 18 November 2026

Reviewed 308 bundled PNG/WebP files using contact sheets and targeted full-size inspection. Removed 46 identified mushroom or obsolete assets (44 raster files and two legacy subscription SVG backgrounds). See [the removal manifest](dark-assets-manifest.json) for the exact paths and [handover development guidance](handover/DEVELOPMENT.md#dark-asset-selection--18-november-2026) for the replacement strategy.

Dark registry aliases now point to supplied dark-folder or `_dark` resources. Native banner copy, bird feature illustrations and neutral dark backgrounds replace baked-in mushroom artwork. Generic bird artwork replaces inherited quiz photos, while legacy quiz IDs stay compatible with existing data. Simple SVG icons remain; full SVG preview and native device fidelity have not been verified.

Run `npm run verify:dark-assets` to check source references, dark routes and deleted paths. Run `node scripts/verify-app-image-routing.js` to check bundled image routing. Neither command classifies image content or replaces device QA. The migration commands and placeholder inventory below describe the old clone-cleanup snapshot; do not use them as the current asset inventory.

## Historical clone-cleanup snapshot

**Date:** Clone cleanup pass  
**Total files:** 274 (273 referenced + 0 unused after cleanup)

## Structure

```
src/assets/
├── askai/              # Ask AI feature images
├── branding/
│   ├── app-icon/       # In-app app icon reference
│   ├── logo/           # (empty — add Birdzy logo)
│   └── splash/background/
├── catalogue/icons/species/  # PLACEHOLDER mushroom species icons
├── collection/details/   # Detail screen assets + rateMatch SVGs
├── collection/icons/   # Collection empty states
├── common/
│   ├── bottomTab/      # Tab bar icons
│   ├── emptystate/     # Generic empty states
│   ├── fonts/          # Satoshi font files
│   ├── iconfix/        # Generic UI icons (close, search, stars, etc.)
│   ├── icons/          # cancel, upload, notification SVGs
│   ├── modal/
│   ├── navigation/
│   └── social/         # OAuth provider icons
├── feed/               # Feed feature assets
├── home/
│   ├── images/banner/  # Home banners (identify, discount)
│   └── popup/mushroom/ # PLACEHOLDER popup modals
├── identification/camera/
├── onboarding/         # Onboarding + auth backgrounds
├── quiz/which_shroom/  # PLACEHOLDER quiz archetype images
└── subscription/       # Paywall carousel, backgrounds, discount
```

## Deleted (33 unused)

See `docs/asset-audit.json` → `unused` array (historical; all deleted).

## Historical placeholder inventory (superseded above)

At the clone-cleanup snapshot, these were Shroomzy/mushroom placeholders:

- `catalogue/icons/species/*` — species placeholder icons
- `home/popup/mushroom/*` — modals (rate us, mushroom of day, etc.)
- `quiz/which_shroom/*` — quiz result images
- `askai/*mushroom*` — Ask AI illustrations
- `onboarding/light|dark/*` — onboarding backgrounds
- `subscription/carousel/*shroom*` — subscription feature carousel

The 18 November cleanup above removes identified mushroom resources after updating their consumers. This historical list is not a requirement to retain those files.

## Audit commands

```bash
node scripts/audit-assets.js      # Re-scan used vs unused
node scripts/finalize-assets.js   # Re-run structure migration (idempotent moves only)
```
