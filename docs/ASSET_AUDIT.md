# Birdzy Asset Audit (final)

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

## PLACEHOLDER assets (keep until Birdzy art ready)

These are Shroomzy/mushroom-themed but **required for the shell to render**:

- `catalogue/icons/species/*` — species placeholder icons
- `home/popup/mushroom/*` — modals (rate us, mushroom of day, etc.)
- `quiz/which_shroom/*` — quiz result images
- `askai/*mushroom*` — Ask AI illustrations
- `onboarding/light|dark/*` — onboarding backgrounds
- `subscription/carousel/*shroom*` — subscription feature carousel

Replace during Bird-specific design phase — do not delete until replacements exist.

## Audit commands

```bash
node scripts/audit-assets.js      # Re-scan used vs unused
node scripts/finalize-assets.js   # Re-run structure migration (idempotent moves only)
```
