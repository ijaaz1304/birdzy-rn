# Birdzy identification Figma update

Updated 2026-11-13. Implementation branch `codex/birdzy-identification-figma` is based on `feat/responsiveness` at `93f7f5a`, preserving its responsive-layout fixes. The original checkout remains separate. This branch does not merge the backend free-scan branch or change dependencies, endpoints, environment loading or quota policy.

## Design targets

- Top 5 Matches: [light, 9786:87956](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9786-87956), [dark, 9786:88110](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9786-88110).
- Unbadged captured photo: [light, 9762:68477](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9762-68477), [dark, 9765:70767](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9765-70767).
- Reference photo: [light, 9761:32552](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9761-32552), [dark, 9762:66387](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9762-66387).

Context, screenshots and resolved colour variables were read. The Figma contains leftover insect copy and scientific/sample imagery; production uses Choose Your Bird Match and the real bird data. Native status/safe areas remain native; Figma sample photos are not bundled. Eight local SVGs retain their intrinsic dimensions in matching icon slots. The app Text atom, cached/local image pipeline, theme, location flow, wishlist store, navigation and existing responsive carousel are reused.

## Result cards and preserved journeys

Photo identification's OtherPossibleMatchesScreen now presents Top 5 Matches, the supplied location panel/introduction, and up to five photo-left cards. Cards use a 100 px image, 12 px corners, 124 px minimum height, common/scientific names, a separate wishlist star and a View Details pill. Names and CTA copy can wrap. Both the photo and View Details call the existing selected-result handler, retaining all candidate matches and the captured identification image in detail navigation. Existing wishlist guards, removal confirmation, API/store behavior and toasts remain in use.

The same new card and View Details presentation also applies to step-by-step and sound Possible Matches as requested in the follow-up. Those modes retain their full result list and existing screen titles/header content. Sound cards keep recording date/place metadata and independent playback. Catalogue-return alternate-match cards retain their prior presentation.

**Preserved explicitly:** step-by-step and sound not-found sections, pinned short-list sections, report actions, add-manually/edit-answer actions, sound recording save/note actions, audio sample/player behavior and the sound More menu. The photo Top 5 reporting footer stays absent; this does not hide the existing sound/wizard not-found UI.

The scoped top-matches location variant provides the Figma surface/border and existing 40 × 24 Toggle. Existing permission/location-sheet/reanalysis callbacks are unchanged; other banner variants keep their presentation.

## Detail photos

BirdDetails uses the existing CatalogueDetailCarousel with a scoped Figma variant: inset 20 px, height 180 px, 12 px corners, 32 px overlay arrow buttons and 24/6 px dots. Existing measured-parent resize behavior is retained. A changed image identity resets the Figma gallery, while resizing preserves the current image and rejects momentum from an old viewport. Failed images show a neutral No image state and reset when the URI changes. Auto-advance configuration remains in place.

`buildBirdPhotoGallery` normalizes existing storage display URLs, prepends known captured images, removes duplicates and tracks reference status. A current scan capture, known userCapturedImages, local photo URI or existing posts/.../images upload is unbadged, matching these Birdzy frames. Other remote catalogue imagery displays Reference, including a reference-only first photo. No Your birds chip is invented. Generic remote ownership without source metadata cannot be proven and remains an API follow-up.

Resolved colours: light/dark Top 5 CTA `#785284` / `#16B6B4`; reference chip `#01474F` / `#16B6B4`, text white / `#091B21`, border `#E7E7E7` / `#333333`. This styling is scoped to the supplied UI.

## Local diagnostics

The latest 20 photo-identification summaries persist under `birdzy-identification-diagnostics-v1`. Only timestamps, candidate counts and at most five public result names (160 characters each) are saved; no captured photos, URIs, location, account identifiers, tokens or raw API payloads. Storage errors do not block results. Sound and wizard flows do not generate this new photo-summary event.

The existing App Logs view/export/copy and user-initiated email/share composer include these summaries; clear removes both saved summaries and existing session/identify logs. Its existing production availability and logging preferences remain unchanged. No automatic upload or email is sent by this implementation.

## Validation and acceptance

- Focused Jest passed **8 suites / 51 tests**: mounted photo/wizard/sound result screens, preserved capture/all-candidate navigation, full wizard/sound lists, playback/save/report callbacks, both pinned short-list not-found sections, independent card press targets, both CTA themes, missing/replaced images, provenance/deduplication, carousel resize/old-momentum/reset, bounded summary persistence and existing no-match/collection-photo helpers.
- Changed-file ESLint passed with **0 errors**; existing/scoped inline-style, hook-dependency and similar warnings remain (81 warnings across the checked files).
- Native Babel transforms passed for 9 source modules and SVG transforms passed for all 8 local assets. Asset nonemptiness, original dimensions and callsites were checked. First/other result stars are byte-identical by SHA-256 and reused exactly.
- Handover checker passed: 14 pages / 312 local links and blank environment templates; four optional portfolio links depend on sibling checkouts. Whitespace checks passed.

Automated tests use mocked native/network boundaries and do not verify device rendering or backend deployment. Final validation (2026-11-13): `tsc --noEmit --pretty false` passed on the final implementation; the unchanged responsiveness baseline also passed. Production iOS JavaScript bundle passed and copied 292 assets. This verifies JavaScript packaging, not a signed native build or device rendering.

Simulator/device checks were skipped as requested. QA owner remains unassigned: verify light/dark parity, 360/393/430 widths, font/display scaling, long/missing text/photos, location grant/deny/settings/custom location, selected-result/back navigation, wishlist add/remove/retry, capture/reference swiping and resizing, collection save/reopen, and log viewing/clear across restart. Exercise full and short-list sound/wizard not-found sections, report/add manually/edit/save-note/player actions to confirm the preserved journeys. Signed native builds, live providers/backend and release acceptance remain open.
