# Birdzy — responsive layout and accessibility audit

Date: 2026-11-11 (Asia/Kolkata). Portfolio audit 5/5.

Repository: `Birdzy`. Audited local HEAD: `ca25598d8df142465d0c84ee4585dfd7137816b8`. Working tree was clean when scanned. Evidence is local source at this snapshot; deployed builds and remote variants were not verified.

## Executive assessment

9 prioritized findings below combine confirmed source constraints with explicitly labeled runtime risks. P1 means a high-priority accessibility or potential task-completion problem; P2 means a layout/resize risk needing planned remediation; P3 means visual consistency. These are audit priorities, not measured production incident severities. No visual failure is marked device-reproduced.

The scan inventoried **954 source files** and **74 screen-named/path files**. All were included in a rule-based scan; selected shared primitives and app-specific high-risk paths were manually inspected. This is not a claim of a line-by-line manual review of every file. The inventories below preserve candidate locations and remaining QA scope.

Only documentation was created/updated. This app-local copy was added on 2026-11-12 from the original five-app audit collected in Rockzy. Source links now resolve within this repository. The findings retain their 2026-11-11 audit snapshot; copying the report does not establish fresh source or device verification.

## Prioritized findings and fix suggestions

### BIRDZY-R01 · P1 · Text scaling is disabled across core discovery and detail content

- **Evidence:** [src/features/collection/components/BirdDetailSections.tsx:142](../../../src/features/collection/components/BirdDetailSections.tsx#L142).
- **Assessment:** Source-confirmed opt-outs on bird facts and explanatory body blocks. Additional opt-outs exist in home, filters, search, post creation and onboarding. This is an accessibility restriction independent of whether the default layout looks correct.
- **Reproduce/validate:** Set maximum text and inspect bird facts, species descriptions, home sections, search/filter labels and create-post controls.
- **Suggested fix:** Restore scalable semantic text in stages; use intrinsic section height, wrapping rows and adaptive card columns. Track intentional decorative exceptions separately.
- **Acceptance:** Important facts and controls enlarge consistently with OS settings.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R02 · P1 · Sound rows keep title, badge, metadata and timer unscaled

- **Evidence:** [src/features/collection/components/BirdSoundRow.tsx:74](../../../src/features/collection/components/BirdSoundRow.tsx#L74).
- **Assessment:** Source-confirmed unscaled sound labels; title/metadata are one-line. The row already uses flexible text width and minHeight 60, which are useful mitigations. A recording badge and timer further reduce title space.
- **Reproduce/validate:** Use long recording/species names, the My recording badge, long metadata and loading/playing timers on 320-width screens with large text.
- **Suggested fix:** Let the title wrap and move metadata/badge/timer to a second row when needed. Keep play/pause target stable while text grows.
- **Acceptance:** Recording identity and state remain readable without colliding with playback controls.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R03 · P1 · Shared Button forces single-line labels with shrink-to-fit

- **Evidence:** [src/atoms/Button/Button.tsx:114](../../../src/atoms/Button/Button.tsx#L114).
- **Assessment:** Source-confirmed label line limit and adjustsFontSizeToFit when scaling is enabled. Default allowFontScaling=true is helpful but does not guarantee readable large text if the label is subsequently shrunk.
- **Reproduce/validate:** Use long localized button labels, loading transitions and 200% text on narrow content and nested modals.
- **Suggested fix:** Allow multiline scalable labels with intrinsic/minimum button height; stack adjacent actions. Reserve shrink-to-fit for a specifically reviewed exception.
- **Acceptance:** Primary actions retain legibility at the requested text setting and full meaning remains visible.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R04 · P1 · Purchase and legal components explicitly suppress larger text

- **Evidence:** [src/features/post-auth-onboarding/components/PostAuthSubscriptionDisclosure.tsx:33](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionDisclosure.tsx#L33).
- **Assessment:** Source-confirmed unscaled subscription disclosure. Plan cards, feature carousel, legal footer and paywall header also opt out.
- **Reproduce/validate:** Test all trial/discount plan permutations, long store prices, loading/failure states and legal disclosures at largest text and 320/360 width.
- **Suggested fix:** Use stacked plans and scrollable intrinsic disclosure/legal sections; preserve complete amounts, billing periods and renewal conditions.
- **Acceptance:** No essential financial or legal copy is hidden, ellipsized or locked to the design font size.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R05 · P1 · Permission inline explanations ignore text preferences

- **Evidence:** [src/features/camera/components/CameraPermissionInlineState.tsx:54](../../../src/features/camera/components/CameraPermissionInlineState.tsx#L54).
- **Assessment:** Source-confirmed camera permission title/body/action opt-outs. Location and post-auth permission components contain similar restrictions.
- **Reproduce/validate:** Trigger denied/restricted states for camera, microphone, photos and location; return from system settings at large text and display zoom.
- **Suggested fix:** Use scalable permission copy in a bounded scroll body and adapt artwork/header space first. Verify each capability-specific error independently.
- **Acceptance:** Explanation and allow/settings/skip actions remain readable and reachable.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R06 · P2 · Sound identification screens need short-height and state-transition coverage

- **Evidence:** [src/features/camera/screens/SoundIdentifyScreen.tsx:460](../../../src/features/camera/screens/SoundIdentifyScreen.tsx#L460).
- **Assessment:** Source-confirmed fixed 219×168 empty-state art and multiple fixed-size controls. The existence of fixed artwork is not a defect; state-dependent vertical fit is unverified. SoundNoMatch and AudioGallery have similar art/action patterns.
- **Reproduce/validate:** Exercise microphone denied, idle, recording, processing, no-match, retry, uploaded audio and empty gallery on 320×568 and large text.
- **Suggested fix:** Bound decorative art by remaining space, scroll explanatory content and preserve recording/stop/retry/import access; keep keyboard/import UI outside recording controls.
- **Acceptance:** All audio states can be completed with a visible or reachable exit and primary action.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R07 · P1 · Modal and onboarding metrics capture startup window/screen dimensions

- **Evidence:** [src/components/AppModal/AppModal.tsx:33](../../../src/components/AppModal/AppModal.tsx#L33).
- **Assessment:** Source-confirmed module-level window metrics; AppSheet, shared sheets, auth/personality backgrounds and onboarding also snapshot window or physical screen dimensions. Existing live/centered layout helpers do not update every consumer automatically.
- **Reproduce/validate:** Open each modal and onboarding slide, resize without restart, change display zoom, then inspect short-window actions and artwork.
- **Suggested fix:** Use live window bounds for overlays and parent layout for content; keep background crop independent of functional layout.
- **Acceptance:** Modal panels/actions fit the active window and do not retain stale full-screen geometry.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R08 · P2 · Match and image carousels assume startup viewport width

- **Evidence:** [src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx:17](../../../src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx#L17).
- **Assessment:** Source-confirmed module snapshot; ImageCarousel and PhotoPickerRow have the same source pattern.
- **Reproduce/validate:** Swipe species matches and detail images in a resized window or tablet content column, including failed images and multi-image posts.
- **Suggested fix:** Measure parent width and derive all page widths/offsets/snaps from it; reconcile current index after resize.
- **Acceptance:** Pages and dots stay aligned and no image pushes the surrounding layout horizontally.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

### BIRDZY-R09 · P1 · Bottom-tab labels explicitly remain unscaled

- **Evidence:** [src/navigation/CustomBottomTabBar.tsx:215](../../../src/navigation/CustomBottomTabBar.tsx#L215).
- **Assessment:** Source-confirmed tab-label opt-out. The center identification control and four labels need shared width/height rules at narrow display sizes.
- **Reproduce/validate:** Visit all tabs at 320 width, largest text and display zoom; inspect central identify action and collection label.
- **Suggested fix:** Provide a scalable navigation arrangement with measured bar height and responsive label treatment; preserve accessibility labels and adequate targets.
- **Acceptance:** All tabs remain readable, tappable and clear about selection.
- **Status/ownership:** Open; named Design/Development/QA owners unassigned; device reproduction and fix verification pending.

## Native configuration finding: large-window assumptions

[android/build.gradle](../../../android/build.gradle) declares target SDK 36. [android/app/src/main/AndroidManifest.xml](../../../android/app/src/main/AndroidManifest.xml) declares `adjustResize`. The main Android manifest declares portrait orientation. The inspected iOS app Info.plist declares portrait orientation. Those declarations do not prove every effective build/window is portrait-only. API 36 Android large-screen behavior can override orientation/resizability restrictions; inspect merged manifests, compatibility properties and actual runtime behavior before closing landscape/tablet cases. **P1 validation gap:** resize and large-screen acceptance remain open. Suggested fix is a layout that survives current available-window changes, with explicit product decisions for tablet presentation.

## Design-frame decision and responsive contract (proposed)

The supplied Design team report recommends **393 × 852** as the primary Figma frame, with **360 × 800** and **430 × 932** validation frames. Adopt these as team reference canvases, subject to product/design acceptance. They are not evidence of this portfolio’s actual device distribution. No analytics or Figma files were supplied; no live Figma Auto Layout, constraints, components or token bindings were inspected. The claim that one width represents most current users therefore remains unverified.

Treat those dimensions as logical layout units: Figma design units mapped deliberately to iOS points and Android dp in React Native, not raw screenshot pixels. Text follows platform font sizing. Safe areas, system bars, keyboard and app navigation reduce usable content height. Do not add a 393-wide fixed root or globally scale all spacing/type by `windowWidth / 393`.

Retain 375 × 812 as a regression case; it remains a valid viewport. Add **320 × 568** and **360 × 640** to expose short-height problems that 360 × 800 misses. Height and width must vary independently. A wide device can still have a short app window.

Suggested component rules for Design and Development to approve:

- Page shells fill the active window; content uses parent width, safe-area-aware gutters and an explicitly agreed maximum width on large windows. Centering a phone column is an interim layout choice, not proof of a tablet experience.
- In Figma, use Auto Layout for functional text/action stacks; use Fill container on expanding sections, Hug contents on text-bearing heights and explicit min/max constraints for art. Create small/standard/large and enlarged-text examples for each shared component.
- Start with a proposed 16-point page gutter and an 8-point base spacing rhythm with 4-point subdivisions; reconcile existing app tokens before implementation. These are proposals, not measured inconsistencies or mandated platform values.
- Preserve semantic typography levels. Allow multiline content and intrinsic growth. Avoid forced line breaks for a single frame, fixed text heights, broad font caps and shrink-to-fit for essential copy.
- Set a minimum readable card width, derive grid count from available parent width, and allow a single column for large text. Two columns at every font setting is not the acceptance criterion.
- Set explicit long-content behavior: names may wrap; noncritical previews may truncate if full content is available; prices, safety guidance, permission explanations, validation and purchase terms must remain complete.
- Sheets use current safe usable height, a bounded scrolling body and a reachable close/action area. Short windows may require a full-screen sheet. Account for keyboard intersection exactly once.
- Headers, tabs and footers may grow. Reserve their measured height in scroll content. Sticky CTAs must not cover the final field/card, and expanded labels must not reduce tappable areas.
- Use image aspect ratio and bounded artwork sizes; functional content must not rely on rasterized text in a banner. Test image crop/focal point and missing-image fallback independently.
- Define compact-height behavior before compressing type: reduce/collapse decoration, stack rows and enable scrolling. Avoid a baseline-specific absolute y-coordinate for functional copy.
- Proposed hit-area acceptance: at least 44 × 44 logical points on iOS and 48 × 48 dp on Android; small visible glyphs can sit inside larger non-overlapping hit regions. Measure actual targets, including hitSlop and parent clipping.

## Additional risks to validate across every flow

These are test obligations and conditional remediation suggestions, not newly reproduced bugs. A fixed size, `position: absolute`, `numberOfLines` or a missing hook by itself is not enough to establish a defect.

1. **P1 — Safe areas and edge-to-edge:** notch/cutout, home indicator, gesture and three-button navigation, modal status/navigation bars, and nested wrappers may cause doubled padding or covered content. Assign one inset owner per edge, reserve measured app chrome, and keep only decorative backgrounds full bleed.
2. **P1 — Keyboard and forms:** auth, profile, feedback, collections, comments, chat and domain-tool forms need last-field/error/submit access. Check multiline, autofill, predictive rows, floating and hardware keyboards. Use measured keyboard intersection and focus scrolling; do not add competing generic offsets.
3. **P1 — Financial and safety content:** long prices/currency, billing periods, trials, credits, quota errors and identification warnings must remain complete. Use wrapping/stacking and scroll fallbacks, never hide essential conditions to meet a frame.
4. **P2 — Localization and data growth:** test long scientific names, two-line titles, 30–50% pseudo-localized expansion, RTL if supported, long email addresses, URLs, emoji and 3/4-digit counters. Use flexible text columns and deliberate wrapping. These locale cases are proposed coverage, not a claim that each language is shipped.
5. **P2 — Overlays and anchors:** menus, filter popovers, tooltips, toasts and tutorial spotlights need live anchor measurements and viewport clamping after scroll/resize/font change. Avoid occluding an essential action; provide a reachable dismissal path.
6. **P2 — Lists and paging:** dynamic row heights invalidate fixed `getItemLayout`/offset assumptions; column changes need correct keys and scroll restoration. Verify first/last rows, pagination, refresh, empty/error/skeleton and very long content.
7. **P2 — Media geometry:** camera overlays, crop bounds, transformed photos, maps and embedded web/legal content use different coordinate spaces. Share measured preview/content bounds, preserve aspect and verify crop accuracy. Output bitmap/camera resolution constants are not UI widths.
8. **P2 — Large windows:** verify actual iPad presentation mode, Android tablets, foldables and split-window resizing. Hardware identity alone cannot represent the available app window. Define maximum widths and pane behavior; validate zoom/text with the same policy.
9. **P2 — Touch and focus:** close/back/menu icons, sliders, chips, date controls and tiny inline links need non-overlapping target regions. Screen-reader focus must reach content after it expands; verify focus remains visible while scrolling and after opening a sheet.
10. **P3 — Visual consistency:** verify light/dark backgrounds, separators, borders, text baselines, badge alignment, card spacing and artwork cropping at intermediate widths. Consolidate proven repeated values into existing tokens after an actual design comparison.

## QA execution plan and acceptance record

**Execution status: not run.** No simulator/device layout test, screenshot comparison, accessibility inspection, build or app unit test was performed for this documentation-only audit. Source scanning and selected code-path inspection cannot prove visual correctness or exhaust every possible issue. Every device case below remains open.

Use each app’s existing setup and feature availability; record build/version, commit plus local diff, platform/OS, model, logical app-window size, insets, font setting, display setting, locale, account tier and relevant remote-config variant. Capture before/after screenshots with settings visible and a short reproduction video for resize/keyboard/crop defects. Do not infer a test pass from a regex match or from another app’s behavior.

Minimum matrix:

- Default text/display on 320 × 568, 360 × 640, 360 × 800, 375 × 812, 393 × 852 and 430 × 932 logical viewports. These are viewport targets, not claims that a named physical device reports exactly these app-window dimensions.
- On small/short and standard viewports: default, intermediate (~1.3×), 200% where available, and maximum OS accessibility text. Record the real OS category or measured scale; platform categories do not have identical multipliers.
- Small/short and standard viewports: default and largest supported display size/Display Zoom, first independently and then combined with maximum text. Re-record effective logical window size after changing display settings.
- iOS notch/home-indicator and older short-phone shapes; Android cutout with gesture and three-button navigation; portrait and every reachable landscape configuration.
- iPad actual shipped compatibility/full-screen mode; Android API 36 large screen at/above sw600dp, portrait/landscape and split windows. Resize across compact/medium/expanded boundaries while screens and sheets remain mounted; preserve entered data and selected items.
- Default locale, longest available translated strings, pseudo-localized expansion, RTL only where supported, long domain/user data and localized store pricing.
- Keyboard hidden/visible, portrait/landscape where reachable, multiline entry, validation errors, permission denied/settings return, network loading/empty/error/offline, purchase pending/failure/success and free/premium gating.

Execute the core paths below first on each default viewport, then stress high-risk paths with text/display/keyboard combinations. Pairwise coverage can reduce routine combinations, but do not omit small/short + maximum text + display enlargement + keyboard on input and purchase flows.

Acceptance gates:

- [ ] No unintended horizontal page scrolling, clipped functional text or overlap of unrelated content.
- [ ] Every primary and secondary action, last field, error and last list row is visible or scroll-reachable.
- [ ] Essential labels respect larger-text settings; intended truncation has a complete alternative.
- [ ] Touch regions meet the agreed platform minimum and do not overlap neighboring actions.
- [ ] Safe areas and keyboard are applied once; focused fields and dismiss actions remain reachable.
- [ ] Grid/carousel/image/camera/map geometry updates after resize without losing user progress.
- [ ] Purchase terms, identification guidance and domain-specific units remain complete.
- [ ] Loading/error/empty and permission branches meet the same rules as the happy path.
- [ ] Design, Development and QA record separate acceptance with screenshot/build evidence.

For each finding create a ticket with report ID, exact source snapshot, viewport/settings, content, steps, actual/expected result, screenshot/video, proposed fix and retest evidence. Suggested accountable roles: Design for component contracts, Development for implementation, QA for reproduction/regression. **Named owners, access grants, deadlines and acceptance are unassigned/open.**

Suggested implementation order (future work only): reproduce P1 findings → approve shared text/sheet/navigation contracts → repair common primitives → repair app-specific geometry → run all flow states → compare approved Figma variants → sign off per platform. None of these fixes is implemented by this audit.

## Research sources checked on 2026-11-11

- [React Native useWindowDimensions](https://reactnative.dev/docs/useWindowDimensions): reactive window and font-scale information; useful for current-window decisions.
- [React Native Dimensions](https://reactnative.dev/docs/dimensions): distinguishes screen/window metrics and recommends the hook in components. Parent measurements are still needed for nested layouts.
- [React Native Text](https://reactnative.dev/docs/text): scaling, line limits and fitting props; use documentation matching the installed RN version before implementation.
- [Apple Dynamic Type session](https://developer.apple.com/videos/play/wwdc2024/10074/): adapt layout as text grows.
- [Android touch targets](https://support.google.com/accessibility/android/answer/7101858?hl=en): 48 dp target guidance.
- [Android window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes): classify the available window rather than just device type. Native Compose APIs in this guide are conceptual references, not drop-in React Native code.
- [Android orientation/aspect/resizability](https://developer.android.com/develop/adaptive-apps/guides/app-orientation-aspect-ratio-resizability): API 36 large-screen overrides matter when evaluating portrait assumptions. Exceptions and compatibility properties must be checked in the effective build.

The Design team report pasted into the request is the source for the three proposed Figma frames. No source inspected establishes that 393 × 852 is a universal industry requirement or that 375 × 812 should stop being supported.

## App-specific journey checklist

Launch/phone/tablet onboarding and post-auth; auth/reset/profile; home/bird corner; catalogue/search/filter; photo camera/gallery/crop/identify matches; sound microphone/record/process/matches/no-match/retry/import/audio gallery; bird details/facts/maps/range/sound library/user recordings; nearby explore/location/maps/results; collections/wishlist/create/edit; feed/post/create/comment/report; Ask AI; bird personality and discovery experiences; subscription/discount/restore/legal; settings/feedback/notifications/logout/delete.

Every journey needs happy, loading, empty, error, denied permission and free/premium variants where applicable. Features listed from source may be gated, legacy or unreachable in the shipped build; confirm navigation and remote configuration before claiming product coverage. Shared component tests do not replace a screen-level pass.

## Screen inventory and assigned QA focus

These files were inventoried/scanned; **device verification is pending for every entry**, including entries with no scan hits. The focus is derived from path and is a suggested test category, not a confirmed issue. Non-screen-named composed views remain covered by the source candidate appendix.

- [ ] [src/app/SplashScreen.tsx](../../../src/app/SplashScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/ask-ai/screens/AskAIImageSourceScreen.tsx](../../../src/features/ask-ai/screens/AskAIImageSourceScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/ask-ai/screens/AskAIScreen.tsx](../../../src/features/ask-ai/screens/AskAIScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/components/AuthScreen.tsx](../../../src/features/auth/components/AuthScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/AuthLegalWebViewScreen.tsx](../../../src/features/auth/screens/AuthLegalWebViewScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/CompleteProfileScreen.tsx](../../../src/features/auth/screens/CompleteProfileScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/CreateNewPasswordScreen.tsx](../../../src/features/auth/screens/CreateNewPasswordScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/ForgotPasswordScreen.tsx](../../../src/features/auth/screens/ForgotPasswordScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/LoginScreen.tsx](../../../src/features/auth/screens/LoginScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/RegisterScreen.tsx](../../../src/features/auth/screens/RegisterScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/SignUpScreen.tsx](../../../src/features/auth/screens/SignUpScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/auth/screens/VerifyEmailScreen.tsx](../../../src/features/auth/screens/VerifyEmailScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/bird-personality/screens/PhotoSelectionScreen.tsx](../../../src/features/bird-personality/screens/PhotoSelectionScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/bird-personality/screens/RockPersonalityAnalysisScreen.tsx](../../../src/features/bird-personality/screens/RockPersonalityAnalysisScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/bird-personality/screens/RockPersonalityIntroScreen.tsx](../../../src/features/bird-personality/screens/RockPersonalityIntroScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx](../../../src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/bird-personality/screens/RockPersonalityResultScreen.tsx](../../../src/features/bird-personality/screens/RockPersonalityResultScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/camera/CameraScreen.tsx](../../../src/features/camera/CameraScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/DiagnosisLoadingScreen.tsx](../../../src/features/camera/screens/DiagnosisLoadingScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/GalleryPickerScreen.tsx](../../../src/features/camera/screens/GalleryPickerScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/IdentificationLocationGateScreen.tsx](../../../src/features/camera/screens/IdentificationLocationGateScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/IdentifyHubScreen.tsx](../../../src/features/camera/screens/IdentifyHubScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/IdentifyImageCropScreen.tsx](../../../src/features/camera/screens/IdentifyImageCropScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/OtherPossibleMatchesScreen.tsx](../../../src/features/camera/screens/OtherPossibleMatchesScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/SoundCropScreen.tsx](../../../src/features/camera/screens/SoundCropScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/SoundIdentifyScreen.tsx](../../../src/features/camera/screens/SoundIdentifyScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/camera/screens/SoundNoMatchScreen.tsx](../../../src/features/camera/screens/SoundNoMatchScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/catalogue/screens/CatalogueScreen.tsx](../../../src/features/catalogue/screens/CatalogueScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/catalogue/screens/SearchScreen.tsx](../../../src/features/catalogue/screens/SearchScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/BirdDetailsScreen.tsx](../../../src/features/collection/screens/BirdDetailsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/BirdSoundsScreen.tsx](../../../src/features/collection/screens/BirdSoundsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/CollectionDetailsScreen.tsx](../../../src/features/collection/screens/CollectionDetailsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/CollectionScreen.tsx](../../../src/features/collection/screens/CollectionScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/CreateCollectionScreen.tsx](../../../src/features/collection/screens/CreateCollectionScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/collection/screens/EditBirdDetailsScreen.tsx](../../../src/features/collection/screens/EditBirdDetailsScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/collection/screens/MyBirdsScreen.tsx](../../../src/features/collection/screens/MyBirdsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/collection/screens/WishlistScreen.tsx](../../../src/features/collection/screens/WishlistScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/discovery/screens/AudioGalleryScreen.tsx](../../../src/features/discovery/screens/AudioGalleryScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/discovery/screens/StepByStepScreen.tsx](../../../src/features/discovery/screens/StepByStepScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/explore/screens/ExploreMapScreen.tsx](../../../src/features/explore/screens/ExploreMapScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/feed/screens/CreatePostScreen.tsx](../../../src/features/feed/screens/CreatePostScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/feed/screens/CropImageScreen.tsx](../../../src/features/feed/screens/CropImageScreen.tsx) — camera/preview/crop alignment, safe controls, denied/loading states.
- [ ] [src/features/feed/screens/FeedScreen.tsx](../../../src/features/feed/screens/FeedScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/feed/screens/NotificationCenterScreen.tsx](../../../src/features/feed/screens/NotificationCenterScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/feed/screens/PostDetailsScreen.tsx](../../../src/features/feed/screens/PostDetailsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/home/screens/HomeScreen.tsx](../../../src/features/home/screens/HomeScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/home/screens/OtherAppsScreen.tsx](../../../src/features/home/screens/OtherAppsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/onboarding/screens/OnboardingScreen.tsx](../../../src/features/onboarding/screens/OnboardingScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/onboarding/screens/OnboardingScreenPhone.tsx](../../../src/features/onboarding/screens/OnboardingScreenPhone.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/onboarding/screens/OnboardingScreenTablet.tsx](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/AccountActionsScreen.tsx](../../../src/features/settings/screens/AccountActionsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/AppLogsScreen.tsx](../../../src/features/settings/screens/AppLogsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/AppearanceScreen.tsx](../../../src/features/settings/screens/AppearanceScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/BirdRegionScreen.tsx](../../../src/features/settings/screens/BirdRegionScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/ChangePasswordScreen.tsx](../../../src/features/settings/screens/ChangePasswordScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/settings/screens/ContactUsScreen.tsx](../../../src/features/settings/screens/ContactUsScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/settings/screens/CreatePasswordScreen.tsx](../../../src/features/settings/screens/CreatePasswordScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/settings/screens/FAQScreen.tsx](../../../src/features/settings/screens/FAQScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/LoginSecurityScreen.tsx](../../../src/features/settings/screens/LoginSecurityScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/NotificationsScreen.tsx](../../../src/features/settings/screens/NotificationsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/PasswordOverviewScreen.tsx](../../../src/features/settings/screens/PasswordOverviewScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/settings/screens/PrivacyScreen.tsx](../../../src/features/settings/screens/PrivacyScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/ProfileSettingsScreen.tsx](../../../src/features/settings/screens/ProfileSettingsScreen.tsx) — keyboard, validation, long copy, focused-field/action access.
- [ ] [src/features/settings/screens/RateUsScreen.tsx](../../../src/features/settings/screens/RateUsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/SettingsScreen.tsx](../../../src/features/settings/screens/SettingsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/settings/screens/TermsScreen.tsx](../../../src/features/settings/screens/TermsScreen.tsx) — font/display growth, safe areas, long data, first/last action and resize.
- [ ] [src/features/subscription/screens/DiscountModalScreen.tsx](../../../src/features/subscription/screens/DiscountModalScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/features/subscription/screens/LegalWebViewScreen.tsx](../../../src/features/subscription/screens/LegalWebViewScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/features/subscription/screens/SubscriptionIntroScreen.tsx](../../../src/features/subscription/screens/SubscriptionIntroScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/features/subscription/screens/SubscriptionMainScreen.tsx](../../../src/features/subscription/screens/SubscriptionMainScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/features/subscription/screens/SubscriptionPaywallScreen.tsx](../../../src/features/subscription/screens/SubscriptionPaywallScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/features/subscription/screens/SubscriptionStatusScreen.tsx](../../../src/features/subscription/screens/SubscriptionStatusScreen.tsx) — price/terms completeness, scalable plans, short-height scroll.
- [ ] [src/screens/onboarding/OnboardingSlide.tsx](../../../src/screens/onboarding/OnboardingSlide.tsx) — font/display growth, safe areas, long data, first/last action and resize.

## Source candidate appendix

This is a rule-based location index, **not a bug count**. Lines can be comments, intentional image/output resolutions, inactive styles, test fixtures or code already constrained by a parent. A file may appear in multiple groups. Runtime checks, call-site/reachability tracing and parent constraints determine whether a candidate needs a fix. `Dimensions.get` inside a handler can be current; module snapshots and empty-dependency memoization are the stronger risks. Numeric height/width by itself is not a responsiveness defect.

### Dimension reads (check capture scope and coordinate space)

35 matching lines across 33 non-test files. Matches include comments and need contextual triage.

- [src/app/SplashScreen.tsx:28](../../../src/app/SplashScreen.tsx#L28) — lines 28.
- [src/components/AppModal/AppModal.tsx:33](../../../src/components/AppModal/AppModal.tsx#L33) — lines 33.
- [src/components/AppSheet/AppSheet.tsx:133](../../../src/components/AppSheet/AppSheet.tsx#L133) — lines 133.
- [src/components/bottomSheet/BottomSheet.tsx:16](../../../src/components/bottomSheet/BottomSheet.tsx#L16) — lines 16.
- [src/features/ask-ai/components/AskAIScreenBackground.tsx:8](../../../src/features/ask-ai/components/AskAIScreenBackground.tsx#L8) — lines 8.
- [src/features/ask-ai/screens/AskAIScreen.tsx:169](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L169) — lines 169.
- [src/features/auth/components/AuthScreenBackground.tsx:6](../../../src/features/auth/components/AuthScreenBackground.tsx#L6) — lines 6.
- [src/features/auth/screens/CompleteProfileScreen.tsx:69](../../../src/features/auth/screens/CompleteProfileScreen.tsx#L69) — lines 69.
- [src/features/bird-personality/components/FindYourBirdBackground.tsx:7](../../../src/features/bird-personality/components/FindYourBirdBackground.tsx#L7) — lines 7.
- [src/features/bird-personality/components/WhichBirdAreYouBackground.tsx:7](../../../src/features/bird-personality/components/WhichBirdAreYouBackground.tsx#L7) — lines 7.
- [src/features/bird-personality/components/WhichBirdResultBackground.tsx:7](../../../src/features/bird-personality/components/WhichBirdResultBackground.tsx#L7) — lines 7.
- [src/features/collection/components/EmptyCollectionContent.tsx:41](../../../src/features/collection/components/EmptyCollectionContent.tsx#L41) — lines 41.
- [src/features/feed/screens/FeedScreen.tsx:44](../../../src/features/feed/screens/FeedScreen.tsx#L44) — lines 44.
- [src/features/onboarding/components/ChatInterface.tsx:19](../../../src/features/onboarding/components/ChatInterface.tsx#L19) — lines 19.
- [src/features/onboarding/components/OnboardingPage.tsx:39](../../../src/features/onboarding/components/OnboardingPage.tsx#L39) — lines 39.
- [src/features/onboarding/screens/OnboardingScreenPhone.tsx:43](../../../src/features/onboarding/screens/OnboardingScreenPhone.tsx#L43) — lines 43.
- [src/features/post-auth-onboarding/utils/background.tsx:14](../../../src/features/post-auth-onboarding/utils/background.tsx#L14) — lines 14, 21.
- [src/molecules/CustomLocationInput/CustomLocationInput.tsx:315](../../../src/molecules/CustomLocationInput/CustomLocationInput.tsx#L315) — lines 315.
- [src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx:25](../../../src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx#L25) — lines 25.
- [src/molecules/ImageCarousel/ImageCarousel.tsx:13](../../../src/molecules/ImageCarousel/ImageCarousel.tsx#L13) — lines 13.
- [src/molecules/MapPreview/MapPreview.tsx:141](../../../src/molecules/MapPreview/MapPreview.tsx#L141) — lines 141.
- [src/molecules/Modal/AIErrorModal.tsx:19](../../../src/molecules/Modal/AIErrorModal.tsx#L19) — lines 19.
- [src/molecules/Modal/AppPopup.tsx:17](../../../src/molecules/Modal/AppPopup.tsx#L17) — lines 17.
- [src/molecules/Modal/BottomSheetWithHeader.tsx:33](../../../src/molecules/Modal/BottomSheetWithHeader.tsx#L33) — lines 33.
- [src/molecules/Modal/CameraTipsModal.tsx:211](../../../src/molecules/Modal/CameraTipsModal.tsx#L211) — lines 211.
- [src/molecules/Modal/SubscriptionSuccessModal.tsx:14](../../../src/molecules/Modal/SubscriptionSuccessModal.tsx#L14) — lines 14.
- [src/molecules/PhotoPickerRow/PhotoPickerRow.tsx:30](../../../src/molecules/PhotoPickerRow/PhotoPickerRow.tsx#L30) — lines 30.
- [src/molecules/ScreenContainer/ScreenContainer.tsx:18](../../../src/molecules/ScreenContainer/ScreenContainer.tsx#L18) — lines 18.
- [src/molecules/Tooltip/Tooltip.tsx:112](../../../src/molecules/Tooltip/Tooltip.tsx#L112) — lines 112.
- [src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx:17](../../../src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx#L17) — lines 17.
- [src/organisms/FilterModal/FilterModal.tsx:101](../../../src/organisms/FilterModal/FilterModal.tsx#L101) — lines 101.
- [src/screens/onboarding/OnboardingSlide.tsx:9](../../../src/screens/onboarding/OnboardingSlide.tsx#L9) — lines 9.
- [src/utils/svgUtils.tsx:3](../../../src/utils/svgUtils.tsx#L3) — lines 3, 11.
### Font scaling restrictions/caps

182 matching lines across 42 non-test files. Matches include comments and need contextual triage.

- [src/atoms/Button/Button.tsx:116](../../../src/atoms/Button/Button.tsx#L116) — lines 116.
- [src/atoms/FloatingActionButton/FloatingActionButton.tsx:253](../../../src/atoms/FloatingActionButton/FloatingActionButton.tsx#L253) — lines 253.
- [src/atoms/InfoRow/InfoRow.tsx:34](../../../src/atoms/InfoRow/InfoRow.tsx#L34) — lines 34, 41.
- [src/components/AppSheet/AppSheet.tsx:974](../../../src/components/AppSheet/AppSheet.tsx#L974) — lines 974, 2219, 2229, 2239, 2252, 2267, 2296.
- [src/components/customui/DiscountBanner.tsx:51](../../../src/components/customui/DiscountBanner.tsx#L51) — lines 51, 263, 276, 298, 312, 338, 423.
- [src/components/customui/DiscountCountdownBanner.tsx:120](../../../src/components/customui/DiscountCountdownBanner.tsx#L120) — lines 120, 162, 175, 185, 187.
- [src/components/shared/AppOtherAppCard.tsx:87](../../../src/components/shared/AppOtherAppCard.tsx#L87) — lines 87, 95, 111, 151, 159, 179.
- [src/features/camera/components/CameraPermissionInlineState.tsx:54](../../../src/features/camera/components/CameraPermissionInlineState.tsx#L54) — lines 54, 60, 79.
- [src/features/catalogue/screens/SearchScreen.tsx:620](../../../src/features/catalogue/screens/SearchScreen.tsx#L620) — lines 620.
- [src/features/collection/components/BirdDetailSections.tsx:142](../../../src/features/collection/components/BirdDetailSections.tsx#L142) — lines 142, 157, 257, 395, 396, 422, 426, 434, 461, 494, 497, 904, 911, 919, 953, 956.
- [src/features/collection/components/BirdDetailsScrollSections.tsx:89](../../../src/features/collection/components/BirdDetailsScrollSections.tsx#L89) — lines 89, 122, 192, 261, 272, 569, 573, 579, 692, 699, 706, 830, 846, 874, 890, 901, 955.
- [src/features/collection/components/BirdSoundRow.tsx:74](../../../src/features/collection/components/BirdSoundRow.tsx#L74) — lines 74, 82, 87, 91, 97.
- [src/features/collection/components/GoProGateButton.tsx:56](../../../src/features/collection/components/GoProGateButton.tsx#L56) — lines 56.
- [src/features/collection/screens/BirdDetailsScreen.tsx:1855](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L1855) — lines 1855, 1867, 1968, 1979, 1987, 2032, 2109, 2291, 2368, 2436, 2468, 2494, 2520, 2551, 2572, 2593, 2620, 3419, 3432, 3506, 3553, 3649, 3718, 3785.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:264](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L264) — lines 264, 279, 297, 343.
- [src/features/feed/screens/CreatePostScreen.tsx:566](../../../src/features/feed/screens/CreatePostScreen.tsx#L566) — lines 566, 582, 615, 634, 649, 698, 736, 807.
- [src/features/feed/screens/FeedScreen.tsx:527](../../../src/features/feed/screens/FeedScreen.tsx#L527) — lines 527, 621, 633.
- [src/features/home/components/HomeBirdCornerSection.tsx:45](../../../src/features/home/components/HomeBirdCornerSection.tsx#L45) — lines 45, 52, 85, 123, 129.
- [src/features/home/components/HomeBirdDiscoverySection.tsx:52](../../../src/features/home/components/HomeBirdDiscoverySection.tsx#L52) — lines 52, 73, 80.
- [src/features/home/components/HomeIdentifyCardsSection.tsx:58](../../../src/features/home/components/HomeIdentifyCardsSection.tsx#L58) — lines 58, 85.
- [src/features/home/components/HomeWizardBanner.tsx:50](../../../src/features/home/components/HomeWizardBanner.tsx#L50) — lines 50.
- [src/features/home/components/ToolCard.tsx:36](../../../src/features/home/components/ToolCard.tsx#L36) — lines 36.
- [src/features/home/screens/HomeScreen.tsx:747](../../../src/features/home/screens/HomeScreen.tsx#L747) — lines 747, 914, 928.
- [src/features/onboarding/components/OnboardingPage.tsx:318](../../../src/features/onboarding/components/OnboardingPage.tsx#L318) — lines 318, 333, 420, 434, 507, 537, 560.
- [src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx:72](../../../src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx#L72) — lines 72, 81, 87, 92, 99.
- [src/features/post-auth-onboarding/components/PostAuthDiscountTimerPill.tsx:29](../../../src/features/post-auth-onboarding/components/PostAuthDiscountTimerPill.tsx#L29) — lines 29.
- [src/features/post-auth-onboarding/components/PostAuthGradientButton.tsx:31](../../../src/features/post-auth-onboarding/components/PostAuthGradientButton.tsx#L31) — lines 31.
- [src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx:159](../../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx#L159) — lines 159, 178, 186, 194, 207, 219, 223, 224.
- [src/features/post-auth-onboarding/components/PostAuthLegalFooter.tsx:29](../../../src/features/post-auth-onboarding/components/PostAuthLegalFooter.tsx#L29) — lines 29, 34, 43.
- [src/features/post-auth-onboarding/components/PostAuthLegalModal.tsx:35](../../../src/features/post-auth-onboarding/components/PostAuthLegalModal.tsx#L35) — lines 35.
- [src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx:142](../../../src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx#L142) — lines 142, 152, 208, 225.
- [src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx:73](../../../src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx#L73) — lines 73, 82, 87.
- [src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx:21](../../../src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx#L21) — lines 21.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionDisclosure.tsx:33](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionDisclosure.tsx#L33) — lines 33.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx:152](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx#L152) — lines 152, 155.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionPaywallHeader.tsx:17](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionPaywallHeader.tsx#L17) — lines 17, 20.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:452](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L452) — lines 452, 539, 671.
- [src/features/subscription/screens/SubscriptionPaywallScreen.tsx:342](../../../src/features/subscription/screens/SubscriptionPaywallScreen.tsx#L342) — lines 342, 385, 406.
- [src/molecules/SearchBar/SearchBar.tsx:176](../../../src/molecules/SearchBar/SearchBar.tsx#L176) — lines 176, 193, 231.
- [src/molecules/Tab/Tab.tsx:88](../../../src/molecules/Tab/Tab.tsx#L88) — lines 88.
- [src/navigation/CustomBottomTabBar.tsx:215](../../../src/navigation/CustomBottomTabBar.tsx#L215) — lines 215.
- [src/organisms/FilterModal/FilterModal.tsx:508](../../../src/organisms/FilterModal/FilterModal.tsx#L508) — lines 508, 516, 573, 600, 660, 681.
### Large fixed/minimum widths (includes intentional media/output sizes)

27 matching lines across 21 non-test files. Matches include comments and need contextual triage.

- [src/components/ui/AppAccordion.tsx:110](../../../src/components/ui/AppAccordion.tsx#L110) — lines 110.
- [src/components/ui/AppListItem.tsx:76](../../../src/components/ui/AppListItem.tsx#L76) — lines 76.
- [src/features/ask-ai/screens/AskAIScreen.tsx:943](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L943) — lines 943.
- [src/features/bird-personality/screens/PhotoSelectionScreen.tsx:47](../../../src/features/bird-personality/screens/PhotoSelectionScreen.tsx#L47) — lines 47, 100, 372.
- [src/features/camera/CameraScreen.tsx:1972](../../../src/features/camera/CameraScreen.tsx#L1972) — lines 1972.
- [src/features/camera/camera.styles.ts:73](../../../src/features/camera/camera.styles.ts#L73) — lines 73.
- [src/features/camera/cropImageAndReturnObject.ts:172](../../../src/features/camera/cropImageAndReturnObject.ts#L172) — lines 172.
- [src/features/camera/screens/DiagnosisLoadingScreen.tsx:668](../../../src/features/camera/screens/DiagnosisLoadingScreen.tsx#L668) — lines 668.
- [src/features/camera/screens/SoundIdentifyScreen.tsx:460](../../../src/features/camera/screens/SoundIdentifyScreen.tsx#L460) — lines 460.
- [src/features/camera/screens/SoundNoMatchScreen.tsx:513](../../../src/features/camera/screens/SoundNoMatchScreen.tsx#L513) — lines 513.
- [src/features/collection/components/BirdDetailsScrollSections.tsx:1349](../../../src/features/collection/components/BirdDetailsScrollSections.tsx#L1349) — lines 1349.
- [src/features/collection/screens/BirdDetailsScreen.tsx:3998](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L3998) — lines 3998.
- [src/features/discovery/screens/AudioGalleryScreen.tsx:548](../../../src/features/discovery/screens/AudioGalleryScreen.tsx#L548) — lines 548.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:43](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L43) — lines 43.
- [src/features/feed/screens/CropImageScreen.tsx:75](../../../src/features/feed/screens/CropImageScreen.tsx#L75) — lines 75.
- [src/features/onboarding/components/ChatInterface.tsx:185](../../../src/features/onboarding/components/ChatInterface.tsx#L185) — lines 185.
- [src/features/onboarding/components/OnboardingPage.tsx:984](../../../src/features/onboarding/components/OnboardingPage.tsx#L984) — lines 984.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:98](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L98) — lines 98, 103, 931, 938, 945.
- [src/features/settings/components/SettingsAccountDialog.tsx:156](../../../src/features/settings/components/SettingsAccountDialog.tsx#L156) — lines 156.
- [src/molecules/EmptyState/EmptyState.tsx:110](../../../src/molecules/EmptyState/EmptyState.tsx#L110) — lines 110.
- [src/molecules/Modal/birdOfTheDayModal.config.ts:9](../../../src/molecules/Modal/birdOfTheDayModal.config.ts#L9) — lines 9.
### Fixed/max heights of 100+ units (includes intentional art)

71 matching lines across 54 non-test files. Matches include comments and need contextual triage.

- [src/components/AlertModal.tsx:139](../../../src/components/AlertModal.tsx#L139) — lines 139.
- [src/components/AppModal/AppModal.tsx:1073](../../../src/components/AppModal/AppModal.tsx#L1073) — lines 1073, 1142.
- [src/components/AppSheet/AppSheet.tsx:4209](../../../src/components/AppSheet/AppSheet.tsx#L4209) — lines 4209.
- [src/components/banners/RockOfDayBanner.tsx:158](../../../src/components/banners/RockOfDayBanner.tsx#L158) — lines 158, 169.
- [src/components/shared/AppPromoCard.tsx:218](../../../src/components/shared/AppPromoCard.tsx#L218) — lines 218, 226.
- [src/components/shared/AppPromoCardAskAI.tsx:59](../../../src/components/shared/AppPromoCardAskAI.tsx#L59) — lines 59.
- [src/features/ask-ai/components/AskAIScreenBackground.tsx:95](../../../src/features/ask-ai/components/AskAIScreenBackground.tsx#L95) — lines 95.
- [src/features/ask-ai/screens/AskAIScreen.tsx:944](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L944) — lines 944, 987.
- [src/features/bird-personality/screens/PhotoSelectionScreen.tsx:48](../../../src/features/bird-personality/screens/PhotoSelectionScreen.tsx#L48) — lines 48, 101.
- [src/features/camera/camera.styles.ts:74](../../../src/features/camera/camera.styles.ts#L74) — lines 74.
- [src/features/camera/camera.utils.ts:148](../../../src/features/camera/camera.utils.ts#L148) — lines 148.
- [src/features/camera/cropImageAndReturnObject.ts:172](../../../src/features/camera/cropImageAndReturnObject.ts#L172) — lines 172.
- [src/features/camera/iosGallerySelection.ts:27](../../../src/features/camera/iosGallerySelection.ts#L27) — lines 27.
- [src/features/camera/screens/DiagnosisLoadingScreen.tsx:669](../../../src/features/camera/screens/DiagnosisLoadingScreen.tsx#L669) — lines 669.
- [src/features/camera/screens/SoundIdentifyScreen.tsx:461](../../../src/features/camera/screens/SoundIdentifyScreen.tsx#L461) — lines 461.
- [src/features/camera/screens/SoundNoMatchScreen.tsx:514](../../../src/features/camera/screens/SoundNoMatchScreen.tsx#L514) — lines 514.
- [src/features/collection/components/BirdDetailSections.tsx:1181](../../../src/features/collection/components/BirdDetailSections.tsx#L1181) — lines 1181.
- [src/features/collection/components/BirdDetailsScrollSections.tsx:1350](../../../src/features/collection/components/BirdDetailsScrollSections.tsx#L1350) — lines 1350.
- [src/features/collection/components/EmptyCollections.tsx:47](../../../src/features/collection/components/EmptyCollections.tsx#L47) — lines 47.
- [src/features/collection/screens/BirdDetailsScreen.tsx:3999](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L3999) — lines 3999.
- [src/features/discovery/screens/AudioGalleryScreen.tsx:549](../../../src/features/discovery/screens/AudioGalleryScreen.tsx#L549) — lines 549.
- [src/features/discovery/screens/StepByStepScreen.tsx:512](../../../src/features/discovery/screens/StepByStepScreen.tsx#L512) — lines 512.
- [src/features/explore/components/ExploreLocationSearchBar.tsx:245](../../../src/features/explore/components/ExploreLocationSearchBar.tsx#L245) — lines 245.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:43](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L43) — lines 43.
- [src/features/explore/screens/ExploreMapScreen.tsx:426](../../../src/features/explore/screens/ExploreMapScreen.tsx#L426) — lines 426, 445.
- [src/features/feed/screens/CropImageScreen.tsx:76](../../../src/features/feed/screens/CropImageScreen.tsx#L76) — lines 76.
- [src/features/feed/screens/PostDetailsScreen.tsx:659](../../../src/features/feed/screens/PostDetailsScreen.tsx#L659) — lines 659.
- [src/features/feed/styles/commonStyles.ts:125](../../../src/features/feed/styles/commonStyles.ts#L125) — lines 125, 136, 142.
- [src/features/home/components/HomeBirdCornerSection.tsx:151](../../../src/features/home/components/HomeBirdCornerSection.tsx#L151) — lines 151.
- [src/features/home/components/HomeIdentifyBanner.tsx:32](../../../src/features/home/components/HomeIdentifyBanner.tsx#L32) — lines 32.
- [src/features/home/screens/HomeScreen.tsx:1235](../../../src/features/home/screens/HomeScreen.tsx#L1235) — lines 1235.
- [src/features/onboarding/components/ChatInterface.tsx:186](../../../src/features/onboarding/components/ChatInterface.tsx#L186) — lines 186.
- [src/features/onboarding/components/OnboardingPage.tsx:741](../../../src/features/onboarding/components/OnboardingPage.tsx#L741) — lines 741, 748, 875, 985, 1006.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:98](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L98) — lines 98, 103.
- [src/features/post-auth-onboarding/utils/background.tsx:144](../../../src/features/post-auth-onboarding/utils/background.tsx#L144) — lines 144.
- [src/features/settings/components/SettingsFormFields.tsx:258](../../../src/features/settings/components/SettingsFormFields.tsx#L258) — lines 258.
- [src/features/subscription/components/SubscriptionSheetContent.tsx:276](../../../src/features/subscription/components/SubscriptionSheetContent.tsx#L276) — lines 276.
- [src/features/subscription/screens/SubscriptionIntroScreen.tsx:433](../../../src/features/subscription/screens/SubscriptionIntroScreen.tsx#L433) — lines 433.
- [src/molecules/DiscountBanner/DiscountBanner.tsx:94](../../../src/molecules/DiscountBanner/DiscountBanner.tsx#L94) — lines 94.
- [src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx:324](../../../src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx#L324) — lines 324.
- [src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx:187](../../../src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx#L187) — lines 187.
- [src/molecules/DiscountPopup/DiscountPopup.tsx:328](../../../src/molecules/DiscountPopup/DiscountPopup.tsx#L328) — lines 328, 338.
- [src/molecules/EmptyState/EmptyState.tsx:111](../../../src/molecules/EmptyState/EmptyState.tsx#L111) — lines 111.
- [src/molecules/MapPreview/MapPreview.tsx:229](../../../src/molecules/MapPreview/MapPreview.tsx#L229) — lines 229.
- [src/molecules/Modal/AddToCollectionModal.tsx:185](../../../src/molecules/Modal/AddToCollectionModal.tsx#L185) — lines 185.
- [src/molecules/Modal/DynamicModal.tsx:169](../../../src/molecules/Modal/DynamicModal.tsx#L169) — lines 169.
- [src/molecules/Modal/EditResultModal.tsx:246](../../../src/molecules/Modal/EditResultModal.tsx#L246) — lines 246.
- [src/molecules/Modal/RemoveFromCollectionModal.tsx:899](../../../src/molecules/Modal/RemoveFromCollectionModal.tsx#L899) — lines 899.
- [src/molecules/Modal/SubscriptionErrorModal.tsx:158](../../../src/molecules/Modal/SubscriptionErrorModal.tsx#L158) — lines 158.
- [src/molecules/Modal/VersionUpdateModal.tsx:202](../../../src/molecules/Modal/VersionUpdateModal.tsx#L202) — lines 202.
- [src/molecules/Modal/birdOfTheDayModal.config.ts:10](../../../src/molecules/Modal/birdOfTheDayModal.config.ts#L10) — lines 10.
- [src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx:203](../../../src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx#L203) — lines 203, 222, 227.
- [src/organisms/BirdCard/BirdCard.tsx:316](../../../src/organisms/BirdCard/BirdCard.tsx#L316) — lines 316.
- [src/utils/imageProcessing/imagePreprocessor.ts:57](../../../src/utils/imageProcessing/imagePreprocessor.ts#L57) — lines 57, 67.
### Absolute positioning

237 matching lines across 138 non-test files. Matches include comments and need contextual triage.

- [src/atoms/FloatingActionButton/FloatingActionButton.tsx:153](../../../src/atoms/FloatingActionButton/FloatingActionButton.tsx#L153) — lines 153.
- [src/atoms/Loader/Loader.tsx:63](../../../src/atoms/Loader/Loader.tsx#L63) — lines 63.
- [src/atoms/Toggle/Toggle.tsx:126](../../../src/atoms/Toggle/Toggle.tsx#L126) — lines 126.
- [src/components/AppImage/HiddenRemoteImagePrefetcher.tsx:74](../../../src/components/AppImage/HiddenRemoteImagePrefetcher.tsx#L74) — lines 74, 90.
- [src/components/AppLogsTooltip/AppLogsTooltip.tsx:346](../../../src/components/AppLogsTooltip/AppLogsTooltip.tsx#L346) — lines 346, 354, 361, 369.
- [src/components/AppModal/AppModal.tsx:1045](../../../src/components/AppModal/AppModal.tsx#L1045) — lines 1045, 1059.
- [src/components/AppSheet/AppSheet.tsx:465](../../../src/components/AppSheet/AppSheet.tsx#L465) — lines 465, 3661, 3715, 4156, 4288.
- [src/components/CameraAccessPopup/CameraAccessPopup.tsx:167](../../../src/components/CameraAccessPopup/CameraAccessPopup.tsx#L167) — lines 167.
- [src/components/DeleteCollectionConfirmation.tsx:141](../../../src/components/DeleteCollectionConfirmation.tsx#L141) — lines 141.
- [src/components/RemoveFromWishlistConfirmation.tsx:140](../../../src/components/RemoveFromWishlistConfirmation.tsx#L140) — lines 140.
- [src/components/banners/RockOfDayBanner.tsx:165](../../../src/components/banners/RockOfDayBanner.tsx#L165) — lines 165, 181, 228.
- [src/components/bottomSheet/AppBottomSheet.tsx:121](../../../src/components/bottomSheet/AppBottomSheet.tsx#L121) — lines 121.
- [src/components/bottomSheet/BottomSheet.tsx:179](../../../src/components/bottomSheet/BottomSheet.tsx#L179) — lines 179.
- [src/components/customui/BannerCard.tsx:263](../../../src/components/customui/BannerCard.tsx#L263) — lines 263, 273, 292.
- [src/components/customui/DiscountBanner.tsx:619](../../../src/components/customui/DiscountBanner.tsx#L619) — lines 619.
- [src/components/customui/DiscountCountdownBanner.tsx:320](../../../src/components/customui/DiscountCountdownBanner.tsx#L320) — lines 320, 366, 374.
- [src/components/shared/AppCard.tsx:296](../../../src/components/shared/AppCard.tsx#L296) — lines 296, 321.
- [src/components/shared/AppPromoCard.tsx:217](../../../src/components/shared/AppPromoCard.tsx#L217) — lines 217, 230.
- [src/components/shared/AppPromoCardAskAI.tsx:85](../../../src/components/shared/AppPromoCardAskAI.tsx#L85) — lines 85.
- [src/components/shared/AppText.tsx:83](../../../src/components/shared/AppText.tsx#L83) — lines 83, 92.
- [src/components/shared/FreeScanLimitDialog.tsx:200](../../../src/components/shared/FreeScanLimitDialog.tsx#L200) — lines 200.
- [src/components/skeleton/CardSkeleton.tsx:97](../../../src/components/skeleton/CardSkeleton.tsx#L97) — lines 97.
- [src/components/subscription/PlanCard.tsx:185](../../../src/components/subscription/PlanCard.tsx#L185) — lines 185.
- [src/components/ui/AppBottomNavBar.tsx:196](../../../src/components/ui/AppBottomNavBar.tsx#L196) — lines 196.
- [src/components/ui/AppToggle.tsx:97](../../../src/components/ui/AppToggle.tsx#L97) — lines 97.
- [src/features/ask-ai/components/AskAIScreenBackground.tsx:76](../../../src/features/ask-ai/components/AskAIScreenBackground.tsx#L76) — lines 76, 84, 91.
- [src/features/auth/components/AuthScreenBackground.tsx:39](../../../src/features/auth/components/AuthScreenBackground.tsx#L39) — lines 39.
- [src/features/auth/screens/AuthLegalWebViewScreen.tsx:81](../../../src/features/auth/screens/AuthLegalWebViewScreen.tsx#L81) — lines 81.
- [src/features/auth/screens/CompleteProfileScreen.tsx:282](../../../src/features/auth/screens/CompleteProfileScreen.tsx#L282) — lines 282.
- [src/features/bird-personality/components/FindYourBirdBackground.tsx:43](../../../src/features/bird-personality/components/FindYourBirdBackground.tsx#L43) — lines 43.
- [src/features/bird-personality/components/WhichBirdAreYouBackground.tsx:47](../../../src/features/bird-personality/components/WhichBirdAreYouBackground.tsx#L47) — lines 47.
- [src/features/bird-personality/components/WhichBirdResultBackground.tsx:47](../../../src/features/bird-personality/components/WhichBirdResultBackground.tsx#L47) — lines 47.
- [src/features/camera/CameraScreen.tsx:1720](../../../src/features/camera/CameraScreen.tsx#L1720) — lines 1720, 1738, 1762, 1772, 1800, 1835, 1915, 1955.
- [src/features/camera/CameraZoomControls.tsx:194](../../../src/features/camera/CameraZoomControls.tsx#L194) — lines 194, 201.
- [src/features/camera/camera.styles.ts:64](../../../src/features/camera/camera.styles.ts#L64) — lines 64, 81, 104, 149.
- [src/features/camera/components/CameraIdentifyReview.tsx:197](../../../src/features/camera/components/CameraIdentifyReview.tsx#L197) — lines 197.
- [src/features/camera/components/CameraImageSlots.tsx:144](../../../src/features/camera/components/CameraImageSlots.tsx#L144) — lines 144.
- [src/features/camera/components/CameraPermissionGateChrome.tsx:147](../../../src/features/camera/components/CameraPermissionGateChrome.tsx#L147) — lines 147, 170.
- [src/features/camera/components/GalleryPickerFooter.tsx:181](../../../src/features/camera/components/GalleryPickerFooter.tsx#L181) — lines 181, 216.
- [src/features/camera/components/IdentificationScannerFrame.tsx:109](../../../src/features/camera/components/IdentificationScannerFrame.tsx#L109) — lines 109, 121, 143.
- [src/features/camera/components/LiveSpectrogramCropOverlay.tsx:59](../../../src/features/camera/components/LiveSpectrogramCropOverlay.tsx#L59) — lines 59, 71, 79.
- [src/features/camera/components/RecordedSoundPreview.tsx:311](../../../src/features/camera/components/RecordedSoundPreview.tsx#L311) — lines 311, 317, 343.
- [src/features/camera/components/SoundSpectrogramView.tsx:44](../../../src/features/camera/components/SoundSpectrogramView.tsx#L44) — lines 44, 57, 204, 208, 214, 220, 228, 243, 251.
- [src/features/camera/screens/OtherPossibleMatchesScreen.tsx:1078](../../../src/features/camera/screens/OtherPossibleMatchesScreen.tsx#L1078) — lines 1078, 1139, 1225.
- [src/features/camera/screens/SoundNoMatchScreen.tsx:462](../../../src/features/camera/screens/SoundNoMatchScreen.tsx#L462) — lines 462.
- [src/features/catalogue/screens/CatalogueScreen.tsx:1291](../../../src/features/catalogue/screens/CatalogueScreen.tsx#L1291) — lines 1291.
- [src/features/catalogue/screens/SearchScreen.tsx:707](../../../src/features/catalogue/screens/SearchScreen.tsx#L707) — lines 707.
- [src/features/collection/components/CatalogueDetailCarousel.tsx:341](../../../src/features/collection/components/CatalogueDetailCarousel.tsx#L341) — lines 341, 362.
- [src/features/collection/components/CollectionCard.tsx:234](../../../src/features/collection/components/CollectionCard.tsx#L234) — lines 234.
- [src/features/collection/components/GoProGateButton.tsx:97](../../../src/features/collection/components/GoProGateButton.tsx#L97) — lines 97, 103.
- [src/features/collection/screens/BirdDetailsScreen.tsx:3900](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L3900) — lines 3900, 3953, 4099, 4112, 4131, 4197.
- [src/features/collection/screens/CollectionDetailsScreen.tsx:801](../../../src/features/collection/screens/CollectionDetailsScreen.tsx#L801) — lines 801.
- [src/features/collection/screens/CreateCollectionScreen.tsx:162](../../../src/features/collection/screens/CreateCollectionScreen.tsx#L162) — lines 162.
- [src/features/explore/components/ExploreMapView.nativeMap.tsx:540](../../../src/features/explore/components/ExploreMapView.nativeMap.tsx#L540) — lines 540, 541, 543, 551.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:372](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L372) — lines 372, 380, 384, 388.
- [src/features/explore/screens/ExploreMapScreen.tsx:428](../../../src/features/explore/screens/ExploreMapScreen.tsx#L428) — lines 428.
- [src/features/feed/components/NotificationsList.tsx:351](../../../src/features/feed/components/NotificationsList.tsx#L351) — lines 351.
- [src/features/feed/screens/CreatePostScreen.tsx:937](../../../src/features/feed/screens/CreatePostScreen.tsx#L937) — lines 937, 954.
- [src/features/feed/screens/FeedScreen.tsx:790](../../../src/features/feed/screens/FeedScreen.tsx#L790) — lines 790.
- [src/features/feed/styles/commonStyles.ts:147](../../../src/features/feed/styles/commonStyles.ts#L147) — lines 147, 161.
- [src/features/home/components/HomeIdentifyCardsSection.tsx:155](../../../src/features/home/components/HomeIdentifyCardsSection.tsx#L155) — lines 155, 160.
- [src/features/home/components/HomeWizardBanner.tsx:81](../../../src/features/home/components/HomeWizardBanner.tsx#L81) — lines 81.
- [src/features/home/components/ToolCard.tsx:56](../../../src/features/home/components/ToolCard.tsx#L56) — lines 56.
- [src/features/home/screens/HomeScreen.tsx:1141](../../../src/features/home/screens/HomeScreen.tsx#L1141) — lines 1141, 1170, 1246.
- [src/features/onboarding/components/AuthProgressSlideTablet.tsx:235](../../../src/features/onboarding/components/AuthProgressSlideTablet.tsx#L235) — lines 235.
- [src/features/onboarding/components/OnboardingPage.tsx:140](../../../src/features/onboarding/components/OnboardingPage.tsx#L140) — lines 140, 821, 835, 893, 1036.
- [src/features/onboarding/components/OnboardingPageTablet.tsx:134](../../../src/features/onboarding/components/OnboardingPageTablet.tsx#L134) — lines 134.
- [src/features/onboarding/components/OnboardingSlideBackground.tsx:32](../../../src/features/onboarding/components/OnboardingSlideBackground.tsx#L32) — lines 32.
- [src/features/onboarding/screens/OnboardingScreenPhone.tsx:522](../../../src/features/onboarding/screens/OnboardingScreenPhone.tsx#L522) — lines 522, 560.
- [src/features/onboarding/screens/OnboardingScreenTablet.tsx:562](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx#L562) — lines 562, 600.
- [src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx:277](../../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx#L277) — lines 277.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:857](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L857) — lines 857.
- [src/features/post-auth-onboarding/utils/background.tsx:114](../../../src/features/post-auth-onboarding/utils/background.tsx#L114) — lines 114, 125, 133, 140.
- [src/features/settings/components/SettingsAccountDialog.tsx:173](../../../src/features/settings/components/SettingsAccountDialog.tsx#L173) — lines 173.
- [src/features/settings/components/SettingsHeader.tsx:63](../../../src/features/settings/components/SettingsHeader.tsx#L63) — lines 63.
- [src/features/settings/components/SettingsIcon.tsx:81](../../../src/features/settings/components/SettingsIcon.tsx#L81) — lines 81.
- [src/features/settings/screens/PrivacyScreen.tsx:62](../../../src/features/settings/screens/PrivacyScreen.tsx#L62) — lines 62.
- [src/features/settings/screens/TermsScreen.tsx:62](../../../src/features/settings/screens/TermsScreen.tsx#L62) — lines 62.
- [src/features/subscription/components/SubscriptionSheetContent.tsx:845](../../../src/features/subscription/components/SubscriptionSheetContent.tsx#L845) — lines 845.
- [src/features/subscription/screens/LegalWebViewScreen.tsx:85](../../../src/features/subscription/screens/LegalWebViewScreen.tsx#L85) — lines 85.
- [src/features/subscription/screens/SubscriptionIntroScreen.tsx:436](../../../src/features/subscription/screens/SubscriptionIntroScreen.tsx#L436) — lines 436, 470.
- [src/features/subscription/screens/SubscriptionPaywallScreen.tsx:531](../../../src/features/subscription/screens/SubscriptionPaywallScreen.tsx#L531) — lines 531.
- [src/molecules/ActiveFilterChips/ActiveFilterChips.tsx:264](../../../src/molecules/ActiveFilterChips/ActiveFilterChips.tsx#L264) — lines 264.
- [src/molecules/CardImageCarousel/CardImageCarousel.tsx:290](../../../src/molecules/CardImageCarousel/CardImageCarousel.tsx#L290) — lines 290.
- [src/molecules/CustomLocationInput/CustomLocationInput.tsx:355](../../../src/molecules/CustomLocationInput/CustomLocationInput.tsx#L355) — lines 355, 387, 468.
- [src/molecules/DiscountBanner/DiscountBanner.tsx:101](../../../src/molecules/DiscountBanner/DiscountBanner.tsx#L101) — lines 101.
- [src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx:302](../../../src/molecules/DiscountBottomSheet/Discount50BottomSheet.tsx#L302) — lines 302, 310.
- [src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx:283](../../../src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx#L283) — lines 283, 287.
- [src/molecules/DiscountPopup/DiscountPopup.tsx:304](../../../src/molecules/DiscountPopup/DiscountPopup.tsx#L304) — lines 304, 319.
- [src/molecules/GlowingWaveSpecimenCard/GlowingWaveSpecimenCard.tsx:242](../../../src/molecules/GlowingWaveSpecimenCard/GlowingWaveSpecimenCard.tsx#L242) — lines 242, 255.
- [src/molecules/ImageCarousel/ImageCarousel.tsx:246](../../../src/molecules/ImageCarousel/ImageCarousel.tsx#L246) — lines 246, 267.
- [src/molecules/InputField/InputField.tsx:181](../../../src/molecules/InputField/InputField.tsx#L181) — lines 181, 188.
- [src/molecules/Modal/AIErrorModal.tsx:182](../../../src/molecules/Modal/AIErrorModal.tsx#L182) — lines 182.
- [src/molecules/Modal/AlreadySubscribedModal.tsx:151](../../../src/molecules/Modal/AlreadySubscribedModal.tsx#L151) — lines 151.
- [src/molecules/Modal/AppPopup.tsx:186](../../../src/molecules/Modal/AppPopup.tsx#L186) — lines 186.
- [src/molecules/Modal/BirdOfTheDayModal.tsx:387](../../../src/molecules/Modal/BirdOfTheDayModal.tsx#L387) — lines 387, 403, 410.
- [src/molecules/Modal/BirdOfTheDayRefreshModal.tsx:106](../../../src/molecules/Modal/BirdOfTheDayRefreshModal.tsx#L106) — lines 106.
- [src/molecules/Modal/BottomSheetWithHeader.tsx:287](../../../src/molecules/Modal/BottomSheetWithHeader.tsx#L287) — lines 287.
- [src/molecules/Modal/CameraPermissionPopup.tsx:183](../../../src/molecules/Modal/CameraPermissionPopup.tsx#L183) — lines 183.
- [src/molecules/Modal/CameraTipsModal.tsx:268](../../../src/molecules/Modal/CameraTipsModal.tsx#L268) — lines 268.
- [src/molecules/Modal/ChooseMethodPopup.tsx:210](../../../src/molecules/Modal/ChooseMethodPopup.tsx#L210) — lines 210.
- [src/molecules/Modal/ConfirmationModal.tsx:149](../../../src/molecules/Modal/ConfirmationModal.tsx#L149) — lines 149.
- [src/molecules/Modal/DynamicModal.tsx:143](../../../src/molecules/Modal/DynamicModal.tsx#L143) — lines 143.
- [src/molecules/Modal/EditResultModal.tsx:229](../../../src/molecules/Modal/EditResultModal.tsx#L229) — lines 229.
- [src/molecules/Modal/IconPopupModal.tsx:225](../../../src/molecules/Modal/IconPopupModal.tsx#L225) — lines 225.
- [src/molecules/Modal/IdentificationFeedbackModal.tsx:275](../../../src/molecules/Modal/IdentificationFeedbackModal.tsx#L275) — lines 275.
- [src/molecules/Modal/IdentificationWarningPopup.tsx:144](../../../src/molecules/Modal/IdentificationWarningPopup.tsx#L144) — lines 144.
- [src/molecules/Modal/LocationManageAccessPopup.tsx:190](../../../src/molecules/Modal/LocationManageAccessPopup.tsx#L190) — lines 190.
- [src/molecules/Modal/LocationPermissionPopup.tsx:190](../../../src/molecules/Modal/LocationPermissionPopup.tsx#L190) — lines 190.
- [src/molecules/Modal/MicrophonePermissionPopup.tsx:197](../../../src/molecules/Modal/MicrophonePermissionPopup.tsx#L197) — lines 197.
- [src/molecules/Modal/ModalCard.tsx:86](../../../src/molecules/Modal/ModalCard.tsx#L86) — lines 86.
- [src/molecules/Modal/PermissionModal.tsx:173](../../../src/molecules/Modal/PermissionModal.tsx#L173) — lines 173.
- [src/molecules/Modal/RemoveFromCollectionModal.tsx:864](../../../src/molecules/Modal/RemoveFromCollectionModal.tsx#L864) — lines 864.
- [src/molecules/Modal/SmallDiscountModal.tsx:121](../../../src/molecules/Modal/SmallDiscountModal.tsx#L121) — lines 121, 134.
- [src/molecules/Modal/SoundCollectionNoteModal.tsx:93](../../../src/molecules/Modal/SoundCollectionNoteModal.tsx#L93) — lines 93.
- [src/molecules/Modal/SubscriptionErrorModal.tsx:141](../../../src/molecules/Modal/SubscriptionErrorModal.tsx#L141) — lines 141.
- [src/molecules/Modal/SuccessToast.tsx:110](../../../src/molecules/Modal/SuccessToast.tsx#L110) — lines 110.
- [src/molecules/Modal/TipSampleImage.tsx:79](../../../src/molecules/Modal/TipSampleImage.tsx#L79) — lines 79.
- [src/molecules/MohsHardnessBar/MohsHardnessBar.tsx:146](../../../src/molecules/MohsHardnessBar/MohsHardnessBar.tsx#L146) — lines 146, 181, 189.
- [src/molecules/PhotoPickerRow/PhotoPickerRow.tsx:299](../../../src/molecules/PhotoPickerRow/PhotoPickerRow.tsx#L299) — lines 299.
- [src/molecules/PlanSelectorSheet/PlanSelectorSheet.tsx:189](../../../src/molecules/PlanSelectorSheet/PlanSelectorSheet.tsx#L189) — lines 189.
- [src/molecules/RangeBar/RangeBar.tsx:128](../../../src/molecules/RangeBar/RangeBar.tsx#L128) — lines 128, 134.
- [src/molecules/RemoveFromWishlistModal/RemoveFromWishlistModal.tsx:138](../../../src/molecules/RemoveFromWishlistModal/RemoveFromWishlistModal.tsx#L138) — lines 138, 159.
- [src/molecules/ReportModal/ReportModal.tsx:230](../../../src/molecules/ReportModal/ReportModal.tsx#L230) — lines 230.
- [src/molecules/ScreenContainer/ScreenContainer.tsx:91](../../../src/molecules/ScreenContainer/ScreenContainer.tsx#L91) — lines 91.
- [src/molecules/SearchBar/SearchBar.tsx:354](../../../src/molecules/SearchBar/SearchBar.tsx#L354) — lines 354.
- [src/molecules/Slider/Slider.tsx:155](../../../src/molecules/Slider/Slider.tsx#L155) — lines 155.
- [src/molecules/Toast/Toast.tsx:104](../../../src/molecules/Toast/Toast.tsx#L104) — lines 104.
- [src/molecules/Tooltip/Tooltip.tsx:120](../../../src/molecules/Tooltip/Tooltip.tsx#L120) — lines 120, 152, 158, 187, 203, 297, 316.
- [src/molecules/VerticalMeter/VerticalMeter.tsx:89](../../../src/molecules/VerticalMeter/VerticalMeter.tsx#L89) — lines 89.
- [src/navigation/CustomBottomTabBar.tsx:308](../../../src/navigation/CustomBottomTabBar.tsx#L308) — lines 308.
- [src/organisms/BirdCard/BirdCard.tsx:334](../../../src/organisms/BirdCard/BirdCard.tsx#L334) — lines 334, 351.
- [src/organisms/BottomNavBar/BottomNavBar.tsx:208](../../../src/organisms/BottomNavBar/BottomNavBar.tsx#L208) — lines 208.
- [src/organisms/FilterModal/FilterModal.tsx:704](../../../src/organisms/FilterModal/FilterModal.tsx#L704) — lines 704.
- [src/organisms/SubscriptionCard/SubscriptionCard.tsx:273](../../../src/organisms/SubscriptionCard/SubscriptionCard.tsx#L273) — lines 273.
- [src/styles/common/formStyles.ts:123](../../../src/styles/common/formStyles.ts#L123) — lines 123.
- [src/styles/common/layoutStyles.ts:116](../../../src/styles/common/layoutStyles.ts#L116) — lines 116.
- [src/utils/svgUtils.tsx:47](../../../src/utils/svgUtils.tsx#L47) — lines 47.
### Text line limits / hidden overflow

325 matching lines across 167 non-test files. Matches include comments and need contextual triage.

- [src/app/SplashScreen.tsx:58](../../../src/app/SplashScreen.tsx#L58) — lines 58.
- [src/atoms/Avatar/Avatar.tsx:88](../../../src/atoms/Avatar/Avatar.tsx#L88) — lines 88.
- [src/atoms/Button/Button.tsx:114](../../../src/atoms/Button/Button.tsx#L114) — lines 114.
- [src/atoms/Chip/Chip.tsx:201](../../../src/atoms/Chip/Chip.tsx#L201) — lines 201.
- [src/atoms/NavBackIcon/NavBackIcon.tsx:56](../../../src/atoms/NavBackIcon/NavBackIcon.tsx#L56) — lines 56.
- [src/components/AppImage/AppImage.tsx:387](../../../src/components/AppImage/AppImage.tsx#L387) — lines 387.
- [src/components/AppImage/HiddenRemoteImagePrefetcher.tsx:93](../../../src/components/AppImage/HiddenRemoteImagePrefetcher.tsx#L93) — lines 93.
- [src/components/AppLogsTooltip/AppLogsTooltip.tsx:283](../../../src/components/AppLogsTooltip/AppLogsTooltip.tsx#L283) — lines 283.
- [src/components/AppModal/AppModal.tsx:1042](../../../src/components/AppModal/AppModal.tsx#L1042) — lines 1042.
- [src/components/AppSheet/AppSheet.tsx:975](../../../src/components/AppSheet/AppSheet.tsx#L975) — lines 975, 1295, 1791, 1800, 2137, 2375, 2451, 2481, 2706, 3291, 3307, 3323, 3616, 3727, 3799, 3820, 4147.
- [src/components/DeleteCollectionConfirmation.tsx:133](../../../src/components/DeleteCollectionConfirmation.tsx#L133) — lines 133.
- [src/components/LoadingImage.tsx:54](../../../src/components/LoadingImage.tsx#L54) — lines 54.
- [src/components/SearchSuggestions.tsx:87](../../../src/components/SearchSuggestions.tsx#L87) — lines 87, 96, 155.
- [src/components/UserLocationMap/UserLocationMap.tsx:215](../../../src/components/UserLocationMap/UserLocationMap.tsx#L215) — lines 215.
- [src/components/banners/RockOfDayBanner.tsx:111](../../../src/components/banners/RockOfDayBanner.tsx#L111) — lines 111, 118, 172.
- [src/components/bottomSheet/AppBottomSheet.tsx:115](../../../src/components/bottomSheet/AppBottomSheet.tsx#L115) — lines 115.
- [src/components/bottomSheet/BottomSheet.tsx:171](../../../src/components/bottomSheet/BottomSheet.tsx#L171) — lines 171.
- [src/components/customui/BannerCard.tsx:150](../../../src/components/customui/BannerCard.tsx#L150) — lines 150, 259.
- [src/components/customui/DiscountBanner.tsx:348](../../../src/components/customui/DiscountBanner.tsx#L348) — lines 348, 422, 470, 576, 632.
- [src/components/customui/DiscountCountdownBanner.tsx:161](../../../src/components/customui/DiscountCountdownBanner.tsx#L161) — lines 161, 177, 309, 430, 433.
- [src/components/shared/AppCard.tsx:193](../../../src/components/shared/AppCard.tsx#L193) — lines 193, 204, 266, 274, 288.
- [src/components/shared/AppOtherAppCard.tsx:91](../../../src/components/shared/AppOtherAppCard.tsx#L91) — lines 91, 98, 117, 155, 163, 186, 204, 215, 249, 255.
- [src/components/shared/AppPromoCard.tsx:194](../../../src/components/shared/AppPromoCard.tsx#L194) — lines 194.
- [src/components/shared/AppPromoCardAskAI.tsx:58](../../../src/components/shared/AppPromoCardAskAI.tsx#L58) — lines 58.
- [src/components/shared/CloseIcon.tsx:80](../../../src/components/shared/CloseIcon.tsx#L80) — lines 80.
- [src/components/shared/FreeScanLimitDialog.tsx:179](../../../src/components/shared/FreeScanLimitDialog.tsx#L179) — lines 179.
- [src/components/skeleton/CardSkeleton.tsx:93](../../../src/components/skeleton/CardSkeleton.tsx#L93) — lines 93.
- [src/components/skeleton/RoundSkeleton.tsx:65](../../../src/components/skeleton/RoundSkeleton.tsx#L65) — lines 65.
- [src/components/ui/AppTextArea.tsx:39](../../../src/components/ui/AppTextArea.tsx#L39) — lines 39, 83.
- [src/features/ask-ai/components/AskAIScreenBackground.tsx:73](../../../src/features/ask-ai/components/AskAIScreenBackground.tsx#L73) — lines 73.
- [src/features/ask-ai/components/AskAISuggestedQuestionCard.tsx:49](../../../src/features/ask-ai/components/AskAISuggestedQuestionCard.tsx#L49) — lines 49.
- [src/features/ask-ai/screens/AskAIScreen.tsx:946](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L946) — lines 946.
- [src/features/auth/screens/AuthLegalWebViewScreen.tsx:34](../../../src/features/auth/screens/AuthLegalWebViewScreen.tsx#L34) — lines 34.
- [src/features/bird-personality/components/FindYourBirdBackground.tsx:40](../../../src/features/bird-personality/components/FindYourBirdBackground.tsx#L40) — lines 40.
- [src/features/bird-personality/components/WhichBirdAreYouBackground.tsx:44](../../../src/features/bird-personality/components/WhichBirdAreYouBackground.tsx#L44) — lines 44.
- [src/features/bird-personality/components/WhichBirdResultBackground.tsx:53](../../../src/features/bird-personality/components/WhichBirdResultBackground.tsx#L53) — lines 53.
- [src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx:321](../../../src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx#L321) — lines 321.
- [src/features/bird-personality/screens/RockPersonalityResultScreen.tsx:184](../../../src/features/bird-personality/screens/RockPersonalityResultScreen.tsx#L184) — lines 184, 206, 254, 276, 398, 453, 573.
- [src/features/camera/CameraScreen.tsx:1943](../../../src/features/camera/CameraScreen.tsx#L1943) — lines 1943.
- [src/features/camera/components/CameraDailyScanBanner.tsx:41](../../../src/features/camera/components/CameraDailyScanBanner.tsx#L41) — lines 41, 51.
- [src/features/camera/components/CameraIdentifyReview.tsx:221](../../../src/features/camera/components/CameraIdentifyReview.tsx#L221) — lines 221.
- [src/features/camera/components/CameraImageSlots.tsx:137](../../../src/features/camera/components/CameraImageSlots.tsx#L137) — lines 137.
- [src/features/camera/components/CameraPermissionInlineState.tsx:80](../../../src/features/camera/components/CameraPermissionInlineState.tsx#L80) — lines 80, 98.
- [src/features/camera/components/CameraScanCountBadge.tsx:43](../../../src/features/camera/components/CameraScanCountBadge.tsx#L43) — lines 43, 49.
- [src/features/camera/components/GalleryPickerAndroidReview.tsx:108](../../../src/features/camera/components/GalleryPickerAndroidReview.tsx#L108) — lines 108.
- [src/features/camera/components/GalleryPickerFooter.tsx:209](../../../src/features/camera/components/GalleryPickerFooter.tsx#L209) — lines 209.
- [src/features/camera/components/IdentificationScannerFrame.tsx:113](../../../src/features/camera/components/IdentificationScannerFrame.tsx#L113) — lines 113.
- [src/features/camera/components/LiveSpectrogramView.tsx:256](../../../src/features/camera/components/LiveSpectrogramView.tsx#L256) — lines 256.
- [src/features/camera/components/RecordedSoundPreview.tsx:290](../../../src/features/camera/components/RecordedSoundPreview.tsx#L290) — lines 290, 314.
- [src/features/camera/components/SoundPlayButton.tsx:35](../../../src/features/camera/components/SoundPlayButton.tsx#L35) — lines 35.
- [src/features/camera/components/SoundSampleCard.tsx:59](../../../src/features/camera/components/SoundSampleCard.tsx#L59) — lines 59, 69, 83.
- [src/features/camera/components/SoundSpectrogramView.tsx:193](../../../src/features/camera/components/SoundSpectrogramView.tsx#L193) — lines 193, 198, 211.
- [src/features/camera/screens/DiagnosisLoadingScreen.tsx:638](../../../src/features/camera/screens/DiagnosisLoadingScreen.tsx#L638) — lines 638.
- [src/features/camera/screens/GalleryPickerScreen.tsx:385](../../../src/features/camera/screens/GalleryPickerScreen.tsx#L385) — lines 385.
- [src/features/camera/screens/OtherPossibleMatchesScreen.tsx:565](../../../src/features/camera/screens/OtherPossibleMatchesScreen.tsx#L565) — lines 565, 572, 579, 632, 1029, 1112, 1130, 1197.
- [src/features/camera/screens/SoundNoMatchScreen.tsx:437](../../../src/features/camera/screens/SoundNoMatchScreen.tsx#L437) — lines 437.
- [src/features/catalogue/screens/CatalogueScreen.tsx:978](../../../src/features/catalogue/screens/CatalogueScreen.tsx#L978) — lines 978.
- [src/features/collection/components/BirdDetailSections.tsx:144](../../../src/features/collection/components/BirdDetailSections.tsx#L144) — lines 144, 1187.
- [src/features/collection/components/BirdDetailsScrollSections.tsx:694](../../../src/features/collection/components/BirdDetailsScrollSections.tsx#L694) — lines 694, 711, 1250, 1255, 1355, 1386.
- [src/features/collection/components/BirdSoundRow.tsx:76](../../../src/features/collection/components/BirdSoundRow.tsx#L76) — lines 76, 99, 130.
- [src/features/collection/components/CatalogueDetailCarousel.tsx:329](../../../src/features/collection/components/CatalogueDetailCarousel.tsx#L329) — lines 329.
- [src/features/collection/components/CollectionCard.tsx:166](../../../src/features/collection/components/CollectionCard.tsx#L166) — lines 166, 179, 213, 226.
- [src/features/collection/components/CollectionIconCard.tsx:63](../../../src/features/collection/components/CollectionIconCard.tsx#L63) — lines 63, 72.
- [src/features/collection/components/DetailsTabPremiumBadge.tsx:29](../../../src/features/collection/components/DetailsTabPremiumBadge.tsx#L29) — lines 29.
- [src/features/collection/components/GoProGateButton.tsx:56](../../../src/features/collection/components/GoProGateButton.tsx#L56) — lines 56, 82.
- [src/features/collection/screens/BirdDetailsScreen.tsx:3557](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L3557) — lines 3557, 3950, 3961, 4117.
- [src/features/collection/screens/BirdSoundsScreen.tsx:115](../../../src/features/collection/screens/BirdSoundsScreen.tsx#L115) — lines 115.
- [src/features/collection/screens/CreateCollectionScreen.tsx:124](../../../src/features/collection/screens/CreateCollectionScreen.tsx#L124) — lines 124.
- [src/features/collection/screens/EditBirdDetailsScreen.tsx:586](../../../src/features/collection/screens/EditBirdDetailsScreen.tsx#L586) — lines 586, 694, 731.
- [src/features/discount/DiscountTimerPill.tsx:64](../../../src/features/discount/DiscountTimerPill.tsx#L64) — lines 64.
- [src/features/discovery/components/AudioGalleryCard.tsx:148](../../../src/features/discovery/components/AudioGalleryCard.tsx#L148) — lines 148, 158, 171, 180, 192, 317, 383.
- [src/features/discovery/components/WizardAnswersFooter.tsx:165](../../../src/features/discovery/components/WizardAnswersFooter.tsx#L165) — lines 165.
- [src/features/discovery/components/WizardProgressHeader.tsx:73](../../../src/features/discovery/components/WizardProgressHeader.tsx#L73) — lines 73.
- [src/features/discovery/screens/AudioGalleryScreen.tsx:474](../../../src/features/discovery/screens/AudioGalleryScreen.tsx#L474) — lines 474.
- [src/features/discovery/screens/StepByStepScreen.tsx:260](../../../src/features/discovery/screens/StepByStepScreen.tsx#L260) — lines 260, 318, 371.
- [src/features/explore/components/ExploreEntryButton.tsx:30](../../../src/features/explore/components/ExploreEntryButton.tsx#L30) — lines 30.
- [src/features/explore/components/ExploreLocationSearchBar.tsx:108](../../../src/features/explore/components/ExploreLocationSearchBar.tsx#L108) — lines 108, 248.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:299](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L299) — lines 299, 361, 367.
- [src/features/explore/screens/ExploreMapScreen.tsx:284](../../../src/features/explore/screens/ExploreMapScreen.tsx#L284) — lines 284.
- [src/features/feed/components/FeedCard.tsx:294](../../../src/features/feed/components/FeedCard.tsx#L294) — lines 294.
- [src/features/feed/components/NotificationsList.tsx:104](../../../src/features/feed/components/NotificationsList.tsx#L104) — lines 104, 119, 132.
- [src/features/feed/components/PostActionSheet.tsx:194](../../../src/features/feed/components/PostActionSheet.tsx#L194) — lines 194.
- [src/features/feed/screens/CreatePostScreen.tsx:586](../../../src/features/feed/screens/CreatePostScreen.tsx#L586) — lines 586, 619, 929.
- [src/features/feed/screens/FeedScreen.tsx:528](../../../src/features/feed/screens/FeedScreen.tsx#L528) — lines 528, 622, 794.
- [src/features/feed/styles/commonStyles.ts:116](../../../src/features/feed/styles/commonStyles.ts#L116) — lines 116, 132.
- [src/features/home/components/HomeBirdCornerSection.tsx:48](../../../src/features/home/components/HomeBirdCornerSection.tsx#L48) — lines 48, 55, 161, 187.
- [src/features/home/components/HomeBirdDiscoverySection.tsx:76](../../../src/features/home/components/HomeBirdDiscoverySection.tsx#L76) — lines 76, 80.
- [src/features/home/components/HomeIdentifyBanner.tsx:34](../../../src/features/home/components/HomeIdentifyBanner.tsx#L34) — lines 34.
- [src/features/home/components/HomeIdentifyCardsSection.tsx:60](../../../src/features/home/components/HomeIdentifyCardsSection.tsx#L60) — lines 60, 87, 126, 151, 170, 192.
- [src/features/home/components/HomeWizardBanner.tsx:70](../../../src/features/home/components/HomeWizardBanner.tsx#L70) — lines 70.
- [src/features/home/components/ToolCard.tsx:53](../../../src/features/home/components/ToolCard.tsx#L53) — lines 53.
- [src/features/home/screens/HomeScreen.tsx:749](../../../src/features/home/screens/HomeScreen.tsx#L749) — lines 749, 1237.
- [src/features/onboarding/components/ChatInterface.tsx:188](../../../src/features/onboarding/components/ChatInterface.tsx#L188) — lines 188.
- [src/features/onboarding/components/OnboardingSlideBackground.tsx:49](../../../src/features/onboarding/components/OnboardingSlideBackground.tsx#L49) — lines 49.
- [src/features/onboarding/screens/OnboardingScreenTablet.tsx:587](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx#L587) — lines 587, 597.
- [src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx:74](../../../src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx#L74) — lines 74, 94, 104, 123.
- [src/features/post-auth-onboarding/components/PostAuthDiscountTimerPill.tsx:29](../../../src/features/post-auth-onboarding/components/PostAuthDiscountTimerPill.tsx#L29) — lines 29, 44.
- [src/features/post-auth-onboarding/components/PostAuthGradientButton.tsx:73](../../../src/features/post-auth-onboarding/components/PostAuthGradientButton.tsx#L73) — lines 73.
- [src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx:161](../../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx#L161) — lines 161, 177, 185, 200, 209, 221, 253, 262, 274.
- [src/features/post-auth-onboarding/components/PostAuthLegalModal.tsx:39](../../../src/features/post-auth-onboarding/components/PostAuthLegalModal.tsx#L39) — lines 39.
- [src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx:209](../../../src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx#L209) — lines 209, 226.
- [src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx:75](../../../src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx#L75) — lines 75, 92, 109.
- [src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx:22](../../../src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx#L22) — lines 22.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:916](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L916) — lines 916.
- [src/features/post-auth-onboarding/utils/background.tsx:121](../../../src/features/post-auth-onboarding/utils/background.tsx#L121) — lines 121.
- [src/features/settings/components/PasswordSheet.tsx:194](../../../src/features/settings/components/PasswordSheet.tsx#L194) — lines 194.
- [src/features/settings/components/SettingsAccountDialog.tsx:156](../../../src/features/settings/components/SettingsAccountDialog.tsx#L156) — lines 156.
- [src/features/settings/components/SettingsAccountRow.tsx:63](../../../src/features/settings/components/SettingsAccountRow.tsx#L63) — lines 63, 67, 95, 125.
- [src/features/settings/components/SettingsFormFields.tsx:230](../../../src/features/settings/components/SettingsFormFields.tsx#L230) — lines 230.
- [src/features/settings/components/SettingsHeader.tsx:29](../../../src/features/settings/components/SettingsHeader.tsx#L29) — lines 29.
- [src/features/settings/components/SettingsIcon.tsx:78](../../../src/features/settings/components/SettingsIcon.tsx#L78) — lines 78.
- [src/features/settings/components/SettingsItem.tsx:67](../../../src/features/settings/components/SettingsItem.tsx#L67) — lines 67, 74.
- [src/features/settings/components/SettingsSection.tsx:70](../../../src/features/settings/components/SettingsSection.tsx#L70) — lines 70.
- [src/features/settings/screens/AppLogsScreen.tsx:211](../../../src/features/settings/screens/AppLogsScreen.tsx#L211) — lines 211.
- [src/features/subscription/components/RenewalCountdownPills.tsx:19](../../../src/features/subscription/components/RenewalCountdownPills.tsx#L19) — lines 19.
- [src/features/subscription/components/SubscriptionBenefitsCard.tsx:45](../../../src/features/subscription/components/SubscriptionBenefitsCard.tsx#L45) — lines 45.
- [src/features/subscription/components/SubscriptionSheetContent.tsx:181](../../../src/features/subscription/components/SubscriptionSheetContent.tsx#L181) — lines 181, 188, 271, 281.
- [src/features/subscription/components/SwitchPlanBottomSheet.tsx:251](../../../src/features/subscription/components/SwitchPlanBottomSheet.tsx#L251) — lines 251.
- [src/features/subscription/screens/LegalWebViewScreen.tsx:38](../../../src/features/subscription/screens/LegalWebViewScreen.tsx#L38) — lines 38.
- [src/features/subscription/screens/SubscriptionPaywallScreen.tsx:557](../../../src/features/subscription/screens/SubscriptionPaywallScreen.tsx#L557) — lines 557.
- [src/molecules/Accordion/Accordion.tsx:150](../../../src/molecules/Accordion/Accordion.tsx#L150) — lines 150.
- [src/molecules/ActiveFilterChips/ActiveFilterChips.tsx:111](../../../src/molecules/ActiveFilterChips/ActiveFilterChips.tsx#L111) — lines 111.
- [src/molecules/BackgroundHeader/BackgroundHeader.tsx:82](../../../src/molecules/BackgroundHeader/BackgroundHeader.tsx#L82) — lines 82.
- [src/molecules/CustomLocationInput/CustomLocationInput.tsx:461](../../../src/molecules/CustomLocationInput/CustomLocationInput.tsx#L461) — lines 461.
- [src/molecules/DiscountBanner/DiscountBanner.tsx:39](../../../src/molecules/DiscountBanner/DiscountBanner.tsx#L39) — lines 39.
- [src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx:275](../../../src/molecules/DiscountBottomSheet/DiscountBottomSheet.tsx#L275) — lines 275.
- [src/molecules/DiscountPopup/DiscountPopup.tsx:299](../../../src/molecules/DiscountPopup/DiscountPopup.tsx#L299) — lines 299.
- [src/molecules/Dropdown/Dropdown.tsx:176](../../../src/molecules/Dropdown/Dropdown.tsx#L176) — lines 176, 345.
- [src/molecules/EmptyState/EmptyState.tsx:72](../../../src/molecules/EmptyState/EmptyState.tsx#L72) — lines 72.
- [src/molecules/GlowingWaveSpecimenCard/GlowingWaveSpecimenCard.tsx:256](../../../src/molecules/GlowingWaveSpecimenCard/GlowingWaveSpecimenCard.tsx#L256) — lines 256.
- [src/molecules/ImageCarousel/ImageCarousel.tsx:232](../../../src/molecules/ImageCarousel/ImageCarousel.tsx#L232) — lines 232, 237.
- [src/molecules/Input/Input.tsx:42](../../../src/molecules/Input/Input.tsx#L42) — lines 42.
- [src/molecules/MapPreview/MapPreview.tsx:150](../../../src/molecules/MapPreview/MapPreview.tsx#L150) — lines 150.
- [src/molecules/Modal/AIErrorModal.tsx:179](../../../src/molecules/Modal/AIErrorModal.tsx#L179) — lines 179.
- [src/molecules/Modal/AlreadySubscribedModal.tsx:148](../../../src/molecules/Modal/AlreadySubscribedModal.tsx#L148) — lines 148.
- [src/molecules/Modal/AppPopup.tsx:183](../../../src/molecules/Modal/AppPopup.tsx#L183) — lines 183.
- [src/molecules/Modal/BirdOfTheDayModal.tsx:270](../../../src/molecules/Modal/BirdOfTheDayModal.tsx#L270) — lines 270, 280, 326, 361, 400.
- [src/molecules/Modal/BirdOfTheDayRefreshModal.tsx:103](../../../src/molecules/Modal/BirdOfTheDayRefreshModal.tsx#L103) — lines 103.
- [src/molecules/Modal/BottomSheetWithHeader.tsx:150](../../../src/molecules/Modal/BottomSheetWithHeader.tsx#L150) — lines 150, 197, 280.
- [src/molecules/Modal/ChangeLocationBottomSheet.tsx:345](../../../src/molecules/Modal/ChangeLocationBottomSheet.tsx#L345) — lines 345.
- [src/molecules/Modal/ConfirmationModal.tsx:146](../../../src/molecules/Modal/ConfirmationModal.tsx#L146) — lines 146.
- [src/molecules/Modal/EditResultModal.tsx:226](../../../src/molecules/Modal/EditResultModal.tsx#L226) — lines 226.
- [src/molecules/Modal/IdentificationFeedbackModal.tsx:272](../../../src/molecules/Modal/IdentificationFeedbackModal.tsx#L272) — lines 272.
- [src/molecules/Modal/IdentificationWarningPopup.tsx:134](../../../src/molecules/Modal/IdentificationWarningPopup.tsx#L134) — lines 134.
- [src/molecules/Modal/ModalCard.tsx:82](../../../src/molecules/Modal/ModalCard.tsx#L82) — lines 82.
- [src/molecules/Modal/PermissionModal.tsx:170](../../../src/molecules/Modal/PermissionModal.tsx#L170) — lines 170.
- [src/molecules/Modal/PoorResultsWarningModal.tsx:119](../../../src/molecules/Modal/PoorResultsWarningModal.tsx#L119) — lines 119.
- [src/molecules/Modal/RemoveFromCollectionModal.tsx:657](../../../src/molecules/Modal/RemoveFromCollectionModal.tsx#L657) — lines 657, 861, 912, 939.
- [src/molecules/Modal/SmallDiscountModal.tsx:118](../../../src/molecules/Modal/SmallDiscountModal.tsx#L118) — lines 118.
- [src/molecules/Modal/SubscriptionErrorModal.tsx:138](../../../src/molecules/Modal/SubscriptionErrorModal.tsx#L138) — lines 138.
- [src/molecules/Modal/TipSampleImage.tsx:70](../../../src/molecules/Modal/TipSampleImage.tsx#L70) — lines 70.
- [src/molecules/MultiSelectDropdown/MultiSelectDropdown.tsx:238](../../../src/molecules/MultiSelectDropdown/MultiSelectDropdown.tsx#L238) — lines 238.
- [src/molecules/MultiValueChipInput/MultiValueChipInput.tsx:119](../../../src/molecules/MultiValueChipInput/MultiValueChipInput.tsx#L119) — lines 119.
- [src/molecules/PlantHealthIndicator/PlantHealthIndicator.tsx:197](../../../src/molecules/PlantHealthIndicator/PlantHealthIndicator.tsx#L197) — lines 197.
- [src/molecules/RangeBar/RangeBar.tsx:120](../../../src/molecules/RangeBar/RangeBar.tsx#L120) — lines 120.
- [src/molecules/ReportModal/ReportModal.tsx:186](../../../src/molecules/ReportModal/ReportModal.tsx#L186) — lines 186.
- [src/molecules/SearchBar/SearchBar.tsx:177](../../../src/molecules/SearchBar/SearchBar.tsx#L177) — lines 177, 230, 307.
- [src/molecules/StaticMap/StaticMap.tsx:348](../../../src/molecules/StaticMap/StaticMap.tsx#L348) — lines 348.
- [src/molecules/Tab/Tab.tsx:97](../../../src/molecules/Tab/Tab.tsx#L97) — lines 97.
- [src/molecules/TextArea/TextArea.tsx:52](../../../src/molecules/TextArea/TextArea.tsx#L52) — lines 52, 114.
- [src/molecules/VerticalMeter/VerticalMeter.tsx:102](../../../src/molecules/VerticalMeter/VerticalMeter.tsx#L102) — lines 102.
- [src/navigation/CustomBottomTabBar.tsx:212](../../../src/navigation/CustomBottomTabBar.tsx#L212) — lines 212.
- [src/organisms/BirdCard/BirdCard.tsx:136](../../../src/organisms/BirdCard/BirdCard.tsx#L136) — lines 136, 146, 240, 251, 264, 308, 317, 403.
- [src/organisms/FilterModal/FilterModal.tsx:509](../../../src/organisms/FilterModal/FilterModal.tsx#L509) — lines 509, 717, 818.
- [src/organisms/Header/Header.tsx:129](../../../src/organisms/Header/Header.tsx#L129) — lines 129, 139.
- [src/styles/common/cardStyles.ts:43](../../../src/styles/common/cardStyles.ts#L43) — lines 43, 47.
- [src/styles/common/formStyles.ts:108](../../../src/styles/common/formStyles.ts#L108) — lines 108.
### Grid and paging assumptions

22 matching lines across 15 non-test files. Matches include comments and need contextual triage.

- [src/features/catalogue/screens/CatalogueScreen.tsx:1051](../../../src/features/catalogue/screens/CatalogueScreen.tsx#L1051) — lines 1051.
- [src/features/catalogue/screens/SearchScreen.tsx:579](../../../src/features/catalogue/screens/SearchScreen.tsx#L579) — lines 579.
- [src/features/collection/components/CatalogueDetailCarousel.tsx:156](../../../src/features/collection/components/CatalogueDetailCarousel.tsx#L156) — lines 156.
- [src/features/collection/screens/CollectionDetailsScreen.tsx:721](../../../src/features/collection/screens/CollectionDetailsScreen.tsx#L721) — lines 721.
- [src/features/collection/screens/CollectionScreen.tsx:834](../../../src/features/collection/screens/CollectionScreen.tsx#L834) — lines 834.
- [src/features/collection/screens/MyBirdsScreen.tsx:98](../../../src/features/collection/screens/MyBirdsScreen.tsx#L98) — lines 98.
- [src/features/collection/screens/WishlistScreen.tsx:410](../../../src/features/collection/screens/WishlistScreen.tsx#L410) — lines 410.
- [src/features/explore/components/ExploreResultList.tsx:128](../../../src/features/explore/components/ExploreResultList.tsx#L128) — lines 128.
- [src/features/home/screens/OtherAppsScreen.tsx:102](../../../src/features/home/screens/OtherAppsScreen.tsx#L102) — lines 102.
- [src/features/onboarding/screens/OnboardingScreenPhone.tsx:440](../../../src/features/onboarding/screens/OnboardingScreenPhone.tsx#L440) — lines 440, 449.
- [src/features/onboarding/screens/OnboardingScreenTablet.tsx:220](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx#L220) — lines 220, 488, 489, 501.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx:120](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx#L120) — lines 120, 124, 132.
- [src/molecules/CardImageCarousel/CardImageCarousel.tsx:239](../../../src/molecules/CardImageCarousel/CardImageCarousel.tsx#L239) — lines 239.
- [src/molecules/ImageCarousel/ImageCarousel.tsx:104](../../../src/molecules/ImageCarousel/ImageCarousel.tsx#L104) — lines 104.
- [src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx:159](../../../src/molecules/TopMatchesCarousel/TopMatchesCarousel.tsx#L159) — lines 159, 160.
### Keyboard handling present

97 matching lines across 31 non-test files. Matches include comments and need contextual triage.

- [src/components/AppSheet/AppSheet.tsx:35](../../../src/components/AppSheet/AppSheet.tsx#L35) — lines 35, 648, 1103, 1228, 1360, 1363, 1366, 1750, 2104.
- [src/components/SearchSuggestions.tsx:125](../../../src/components/SearchSuggestions.tsx#L125) — lines 125.
- [src/components/bottomSheet/AppBottomSheet.tsx:9](../../../src/components/bottomSheet/AppBottomSheet.tsx#L9) — lines 9, 64, 92, 95, 98.
- [src/features/ask-ai/components/AskAIEmptyState.tsx:46](../../../src/features/ask-ai/components/AskAIEmptyState.tsx#L46) — lines 46.
- [src/features/ask-ai/screens/AskAIScreen.tsx:624](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L624) — lines 624.
- [src/features/auth/screens/CompleteProfileScreen.tsx:160](../../../src/features/auth/screens/CompleteProfileScreen.tsx#L160) — lines 160.
- [src/features/auth/screens/CreateNewPasswordScreen.tsx:6](../../../src/features/auth/screens/CreateNewPasswordScreen.tsx#L6) — lines 6, 138, 141, 149, 202.
- [src/features/auth/screens/ForgotPasswordScreen.tsx:6](../../../src/features/auth/screens/ForgotPasswordScreen.tsx#L6) — lines 6, 106, 109, 179.
- [src/features/auth/screens/SignUpScreen.tsx:3](../../../src/features/auth/screens/SignUpScreen.tsx#L3) — lines 3, 183, 499, 517, 616.
- [src/features/auth/screens/VerifyEmailScreen.tsx:8](../../../src/features/auth/screens/VerifyEmailScreen.tsx#L8) — lines 8, 185, 188, 196, 289.
- [src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx:224](../../../src/features/bird-personality/screens/RockPersonalityQuestionnaireScreen.tsx#L224) — lines 224.
- [src/features/catalogue/screens/CatalogueScreen.tsx:21](../../../src/features/catalogue/screens/CatalogueScreen.tsx#L21) — lines 21, 765, 768, 871, 1100.
- [src/features/catalogue/screens/SearchScreen.tsx:12](../../../src/features/catalogue/screens/SearchScreen.tsx#L12) — lines 12, 437, 440, 628.
- [src/features/collection/screens/BirdDetailsScreen.tsx:17](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L17) — lines 17, 480, 3370, 3374, 3388, 3677.
- [src/features/collection/screens/EditBirdDetailsScreen.tsx:758](../../../src/features/collection/screens/EditBirdDetailsScreen.tsx#L758) — lines 758.
- [src/features/discovery/screens/AudioGalleryScreen.tsx:428](../../../src/features/discovery/screens/AudioGalleryScreen.tsx#L428) — lines 428.
- [src/features/discovery/screens/StepByStepScreen.tsx:429](../../../src/features/discovery/screens/StepByStepScreen.tsx#L429) — lines 429.
- [src/features/explore/components/ExploreLocationSearchBar.tsx:200](../../../src/features/explore/components/ExploreLocationSearchBar.tsx#L200) — lines 200.
- [src/features/feed/screens/CreatePostScreen.tsx:8](../../../src/features/feed/screens/CreatePostScreen.tsx#L8) — lines 8, 575, 578, 630, 831.
- [src/features/feed/screens/PostDetailsScreen.tsx:13](../../../src/features/feed/screens/PostDetailsScreen.tsx#L13) — lines 13, 348, 351, 359, 561.
- [src/features/home/screens/HomeScreen.tsx:676](../../../src/features/home/screens/HomeScreen.tsx#L676) — lines 676.
- [src/features/onboarding/screens/OnboardingScreenTablet.tsx:511](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx#L511) — lines 511.
- [src/features/settings/components/PasswordSheet.tsx:14](../../../src/features/settings/components/PasswordSheet.tsx#L14) — lines 14, 106, 128, 175.
- [src/features/settings/screens/ContactUsScreen.tsx:11](../../../src/features/settings/screens/ContactUsScreen.tsx#L11) — lines 11, 69, 76, 108.
- [src/features/settings/screens/ProfileSettingsScreen.tsx:12](../../../src/features/settings/screens/ProfileSettingsScreen.tsx#L12) — lines 12, 90, 96, 156.
- [src/molecules/BottomSheet/FeedbackBottomSheet.tsx:6](../../../src/molecules/BottomSheet/FeedbackBottomSheet.tsx#L6) — lines 6, 58, 61, 197.
- [src/molecules/Modal/AddSoundNotePopup.tsx:8](../../../src/molecules/Modal/AddSoundNotePopup.tsx#L8) — lines 8, 62, 65, 125.
- [src/molecules/Modal/BottomSheetWithHeader.tsx:9](../../../src/molecules/Modal/BottomSheetWithHeader.tsx#L9) — lines 9, 211, 257, 260, 263.
- [src/molecules/Modal/ChangeLocationBottomSheet.tsx:197](../../../src/molecules/Modal/ChangeLocationBottomSheet.tsx#L197) — lines 197.
- [src/molecules/Modal/RemoveFromCollectionModal.tsx:633](../../../src/molecules/Modal/RemoveFromCollectionModal.tsx#L633) — lines 633.
- [src/molecules/ReportModal/ReportModal.tsx:19](../../../src/molecules/ReportModal/ReportModal.tsx#L19) — lines 19.
### Adaptive mechanisms present

311 matching lines across 142 non-test files. Matches include comments and need contextual triage.

- [src/app/SplashScreen.tsx:7](../../../src/app/SplashScreen.tsx#L7) — lines 7, 27.
- [src/atoms/InfoText/InfoText.tsx:67](../../../src/atoms/InfoText/InfoText.tsx#L67) — lines 67.
- [src/components/AlertModal.tsx:131](../../../src/components/AlertModal.tsx#L131) — lines 131.
- [src/components/AppLogsTooltip/AppLogsTooltip.tsx:8](../../../src/components/AppLogsTooltip/AppLogsTooltip.tsx#L8) — lines 8, 107.
- [src/components/AppSheet/AppSheet.tsx:3959](../../../src/components/AppSheet/AppSheet.tsx#L3959) — lines 3959, 4031, 4063, 4072, 4134, 4139, 4146, 4341.
- [src/components/CameraAccessPopup/CameraAccessPopup.tsx:161](../../../src/components/CameraAccessPopup/CameraAccessPopup.tsx#L161) — lines 161.
- [src/components/DeleteCollectionConfirmation.tsx:132](../../../src/components/DeleteCollectionConfirmation.tsx#L132) — lines 132.
- [src/components/GalleryAccessPopup/GalleryAccessPopup.tsx:137](../../../src/components/GalleryAccessPopup/GalleryAccessPopup.tsx#L137) — lines 137.
- [src/components/RemoveFromWishlistConfirmation.tsx:132](../../../src/components/RemoveFromWishlistConfirmation.tsx#L132) — lines 132.
- [src/components/banners/RockOfDayBanner.tsx:8](../../../src/components/banners/RockOfDayBanner.tsx#L8) — lines 8, 45, 219, 224.
- [src/components/customui/BannerCard.tsx:155](../../../src/components/customui/BannerCard.tsx#L155) — lines 155.
- [src/components/customui/DiscountBanner.tsx:197](../../../src/components/customui/DiscountBanner.tsx#L197) — lines 197, 488, 493, 507, 521, 558, 567, 572, 577, 584, 588, 594.
- [src/components/customui/DiscountCountdownBanner.tsx:9](../../../src/components/customui/DiscountCountdownBanner.tsx#L9) — lines 9, 46, 402, 409.
- [src/components/shared/AppCard.tsx:340](../../../src/components/shared/AppCard.tsx#L340) — lines 340.
- [src/components/shared/FreeScanLimitDialog.tsx:177](../../../src/components/shared/FreeScanLimitDialog.tsx#L177) — lines 177.
- [src/components/ui/AppBottomNavBar.tsx:74](../../../src/components/ui/AppBottomNavBar.tsx#L74) — lines 74.
- [src/design-system/modalTokens.ts:13](../../../src/design-system/modalTokens.ts#L13) — lines 13.
- [src/features/ask-ai/components/AskAIEmptyState.tsx:104](../../../src/features/ask-ai/components/AskAIEmptyState.tsx#L104) — lines 104.
- [src/features/ask-ai/components/AskAISuggestedQuestionCard.tsx:73](../../../src/features/ask-ai/components/AskAISuggestedQuestionCard.tsx#L73) — lines 73.
- [src/features/ask-ai/screens/AskAIScreen.tsx:884](../../../src/features/ask-ai/screens/AskAIScreen.tsx#L884) — lines 884, 914.
- [src/features/auth/screens/LoginScreen.tsx:401](../../../src/features/auth/screens/LoginScreen.tsx#L401) — lines 401.
- [src/features/auth/screens/SignUpScreen.tsx:707](../../../src/features/auth/screens/SignUpScreen.tsx#L707) — lines 707.
- [src/features/bird-personality/screens/RockPersonalityIntroScreen.tsx:9](../../../src/features/bird-personality/screens/RockPersonalityIntroScreen.tsx#L9) — lines 9, 39, 195, 214.
- [src/features/camera/CameraScreen.tsx:1008](../../../src/features/camera/CameraScreen.tsx#L1008) — lines 1008, 1070, 1407, 1506, 1595, 1883.
- [src/features/camera/CameraZoomControls.tsx:127](../../../src/features/camera/CameraZoomControls.tsx#L127) — lines 127, 172.
- [src/features/camera/camera.styles.ts:21](../../../src/features/camera/camera.styles.ts#L21) — lines 21, 131.
- [src/features/camera/camera.utils.ts:147](../../../src/features/camera/camera.utils.ts#L147) — lines 147.
- [src/features/camera/captureFrameLayout.ts:2](../../../src/features/camera/captureFrameLayout.ts#L2) — lines 2, 95.
- [src/features/camera/components/CameraDailyScanBanner.tsx:103](../../../src/features/camera/components/CameraDailyScanBanner.tsx#L103) — lines 103.
- [src/features/camera/components/CameraIdentifyReview.tsx:11](../../../src/features/camera/components/CameraIdentifyReview.tsx#L11) — lines 11, 58, 241.
- [src/features/camera/components/CameraPermissionInlineState.tsx:95](../../../src/features/camera/components/CameraPermissionInlineState.tsx#L95) — lines 95.
- [src/features/camera/components/GalleryPickerAndroidReview.tsx:97](../../../src/features/camera/components/GalleryPickerAndroidReview.tsx#L97) — lines 97.
- [src/features/camera/components/IdentificationLocationBanner.tsx:206](../../../src/features/camera/components/IdentificationLocationBanner.tsx#L206) — lines 206, 236.
- [src/features/camera/components/LiveSpectrogramView.tsx:73](../../../src/features/camera/components/LiveSpectrogramView.tsx#L73) — lines 73, 196.
- [src/features/camera/components/RecordedSoundPreview.tsx:150](../../../src/features/camera/components/RecordedSoundPreview.tsx#L150) — lines 150.
- [src/features/camera/components/RecordingNoiseStatus.tsx:73](../../../src/features/camera/components/RecordingNoiseStatus.tsx#L73) — lines 73.
- [src/features/camera/components/SoundPlayButton.tsx:63](../../../src/features/camera/components/SoundPlayButton.tsx#L63) — lines 63.
- [src/features/camera/components/SoundSpectrogramView.tsx:79](../../../src/features/camera/components/SoundSpectrogramView.tsx#L79) — lines 79, 111.
- [src/features/camera/iosGallerySelection.ts:26](../../../src/features/camera/iosGallerySelection.ts#L26) — lines 26, 84.
- [src/features/camera/screens/DiagnosisLoadingScreen.tsx:568](../../../src/features/camera/screens/DiagnosisLoadingScreen.tsx#L568) — lines 568, 662, 684.
- [src/features/camera/screens/SoundIdentifyScreen.tsx:589](../../../src/features/camera/screens/SoundIdentifyScreen.tsx#L589) — lines 589.
- [src/features/catalogue/screens/CatalogueScreen.tsx:24](../../../src/features/catalogue/screens/CatalogueScreen.tsx#L24) — lines 24, 140, 905, 911, 1168, 1172, 1188, 1204, 1216, 1270.
- [src/features/catalogue/screens/SearchScreen.tsx:12](../../../src/features/catalogue/screens/SearchScreen.tsx#L12) — lines 12, 76, 740, 755.
- [src/features/collection/components/BirdDetailSections.tsx:1037](../../../src/features/collection/components/BirdDetailSections.tsx#L1037) — lines 1037, 1125.
- [src/features/collection/components/BirdDetailsScrollSections.tsx:1178](../../../src/features/collection/components/BirdDetailsScrollSections.tsx#L1178) — lines 1178, 1230.
- [src/features/collection/components/BirdSoundRow.tsx:129](../../../src/features/collection/components/BirdSoundRow.tsx#L129) — lines 129, 162, 172, 184.
- [src/features/collection/components/CatalogueDetailCarousel.tsx:9](../../../src/features/collection/components/CatalogueDetailCarousel.tsx#L9) — lines 9, 43.
- [src/features/collection/components/CollectionCard.tsx:219](../../../src/features/collection/components/CollectionCard.tsx#L219) — lines 219.
- [src/features/collection/components/EmptyCollectionContent.tsx:118](../../../src/features/collection/components/EmptyCollectionContent.tsx#L118) — lines 118.
- [src/features/collection/screens/BirdDetailsScreen.tsx:2136](../../../src/features/collection/screens/BirdDetailsScreen.tsx#L2136) — lines 2136, 2231, 3945, 3974, 4179, 4228.
- [src/features/collection/screens/CollectionDetailsScreen.tsx:768](../../../src/features/collection/screens/CollectionDetailsScreen.tsx#L768) — lines 768, 788.
- [src/features/collection/screens/CollectionScreen.tsx:989](../../../src/features/collection/screens/CollectionScreen.tsx#L989) — lines 989, 1010, 1072.
- [src/features/collection/screens/EditBirdDetailsScreen.tsx:495](../../../src/features/collection/screens/EditBirdDetailsScreen.tsx#L495) — lines 495.
- [src/features/collection/screens/MyBirdsScreen.tsx:161](../../../src/features/collection/screens/MyBirdsScreen.tsx#L161) — lines 161, 175.
- [src/features/collection/screens/WishlistScreen.tsx:502](../../../src/features/collection/screens/WishlistScreen.tsx#L502) — lines 502, 521.
- [src/features/discovery/components/AudioGalleryCard.tsx:346](../../../src/features/discovery/components/AudioGalleryCard.tsx#L346) — lines 346, 351, 382.
- [src/features/discovery/components/WizardCalendar.tsx:200](../../../src/features/discovery/components/WizardCalendar.tsx#L200) — lines 200.
- [src/features/discovery/components/WizardColorGrid.tsx:73](../../../src/features/discovery/components/WizardColorGrid.tsx#L73) — lines 73, 79.
- [src/features/explore/components/ExploreEntryButton.tsx:46](../../../src/features/explore/components/ExploreEntryButton.tsx#L46) — lines 46.
- [src/features/explore/components/HomeExploreNearYouSection.tsx:7](../../../src/features/explore/components/HomeExploreNearYouSection.tsx#L7) — lines 7, 95, 158.
- [src/features/explore/screens/ExploreMapScreen.tsx:449](../../../src/features/explore/screens/ExploreMapScreen.tsx#L449) — lines 449, 466.
- [src/features/feed/screens/CreatePostScreen.tsx:8](../../../src/features/feed/screens/CreatePostScreen.tsx#L8) — lines 8, 90, 889.
- [src/features/feed/screens/FeedScreen.tsx:14](../../../src/features/feed/screens/FeedScreen.tsx#L14) — lines 14, 444.
- [src/features/feed/styles/commonStyles.ts:25](../../../src/features/feed/styles/commonStyles.ts#L25) — lines 25.
- [src/features/home/components/HomeBirdDiscoverySection.tsx:97](../../../src/features/home/components/HomeBirdDiscoverySection.tsx#L97) — lines 97.
- [src/features/home/components/HomeIdentifyCardsSection.tsx:7](../../../src/features/home/components/HomeIdentifyCardsSection.tsx#L7) — lines 7, 45.
- [src/features/home/components/HomeWizardBanner.tsx:96](../../../src/features/home/components/HomeWizardBanner.tsx#L96) — lines 96.
- [src/features/home/screens/HomeScreen.tsx:1098](../../../src/features/home/screens/HomeScreen.tsx#L1098) — lines 1098, 1230.
- [src/features/home/screens/OtherAppsScreen.tsx:147](../../../src/features/home/screens/OtherAppsScreen.tsx#L147) — lines 147.
- [src/features/onboarding/components/ChatInterface.tsx:160](../../../src/features/onboarding/components/ChatInterface.tsx#L160) — lines 160.
- [src/features/onboarding/components/OnboardingPage.tsx:411](../../../src/features/onboarding/components/OnboardingPage.tsx#L411) — lines 411, 424, 438, 455, 624, 801, 1023, 1084.
- [src/features/onboarding/onboardingTabletLayout.ts:2](../../../src/features/onboarding/onboardingTabletLayout.ts#L2) — lines 2, 174.
- [src/features/onboarding/screens/OnboardingScreen.tsx:6](../../../src/features/onboarding/screens/OnboardingScreen.tsx#L6) — lines 6, 14.
- [src/features/onboarding/screens/OnboardingScreenPhone.tsx:6](../../../src/features/onboarding/screens/OnboardingScreenPhone.tsx#L6) — lines 6, 119.
- [src/features/onboarding/screens/OnboardingScreenTablet.tsx:433](../../../src/features/onboarding/screens/OnboardingScreenTablet.tsx#L433) — lines 433, 516, 611.
- [src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx:139](../../../src/features/post-auth-onboarding/components/PostAuthDiscountPlanCard.tsx#L139) — lines 139, 142, 154, 157, 171.
- [src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx:305](../../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard.tsx#L305) — lines 305, 315, 323.
- [src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx:13](../../../src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide.tsx#L13) — lines 13, 82, 164, 263, 264, 275, 306, 307, 316, 347.
- [src/features/post-auth-onboarding/components/PostAuthPhoneLayout.tsx:50](../../../src/features/post-auth-onboarding/components/PostAuthPhoneLayout.tsx#L50) — lines 50.
- [src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx:125](../../../src/features/post-auth-onboarding/components/PostAuthPlanCard.tsx#L125) — lines 125, 128, 140, 143.
- [src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx:33](../../../src/features/post-auth-onboarding/components/PostAuthPopularBadge.tsx#L33) — lines 33.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx:112](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel.tsx#L112) — lines 112.
- [src/features/post-auth-onboarding/components/PostAuthSubscriptionPaywallHeader.tsx:30](../../../src/features/post-auth-onboarding/components/PostAuthSubscriptionPaywallHeader.tsx#L30) — lines 30.
- [src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx:15](../../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen.tsx#L15) — lines 15, 120, 877, 878, 896, 898, 923, 932, 933, 939, 946, 947, 952, 975, 980, 999.
- [src/features/post-auth-onboarding/utils/background.tsx:3](../../../src/features/post-auth-onboarding/utils/background.tsx#L3) — lines 3, 53.
- [src/features/post-auth-onboarding/utils/postAuthContentLayout.ts:2](../../../src/features/post-auth-onboarding/utils/postAuthContentLayout.ts#L2) — lines 2, 42.
- [src/features/post-auth-onboarding/utils/postAuthLayout.ts:2](../../../src/features/post-auth-onboarding/utils/postAuthLayout.ts#L2) — lines 2, 84.
- [src/features/settings/components/SettingsAccountDialog.tsx:156](../../../src/features/settings/components/SettingsAccountDialog.tsx#L156) — lines 156.
- [src/features/subscription/components/RenewalCountdownPills.tsx:85](../../../src/features/subscription/components/RenewalCountdownPills.tsx#L85) — lines 85, 98.
- [src/features/subscription/components/SubscriptionSheetContent.tsx:328](../../../src/features/subscription/components/SubscriptionSheetContent.tsx#L328) — lines 328.
- [src/features/subscription/screens/SubscriptionPaywallScreen.tsx:14](../../../src/features/subscription/screens/SubscriptionPaywallScreen.tsx#L14) — lines 14, 309, 546, 551, 579.
- [src/features/subscription/screens/SubscriptionStatusScreen.tsx:386](../../../src/features/subscription/screens/SubscriptionStatusScreen.tsx#L386) — lines 386.
- [src/molecules/ActiveFilterChips/ActiveFilterChips.tsx:223](../../../src/molecules/ActiveFilterChips/ActiveFilterChips.tsx#L223) — lines 223, 227, 243.
- [src/molecules/CardImageCarousel/CardImageCarousel.tsx:153](../../../src/molecules/CardImageCarousel/CardImageCarousel.tsx#L153) — lines 153, 166, 183, 197, 211, 228, 235.
- [src/molecules/ChipGroup/ChipGroup.tsx:67](../../../src/molecules/ChipGroup/ChipGroup.tsx#L67) — lines 67.
- [src/molecules/DiscountPopup/DiscountPopup.tsx:283](../../../src/molecules/DiscountPopup/DiscountPopup.tsx#L283) — lines 283, 297.
- [src/molecules/Dropdown/Dropdown.tsx:342](../../../src/molecules/Dropdown/Dropdown.tsx#L342) — lines 342.
- [src/molecules/EmptyState/EmptyState.tsx:126](../../../src/molecules/EmptyState/EmptyState.tsx#L126) — lines 126, 131.
- [src/molecules/Modal/AddSoundNotePopup.tsx:140](../../../src/molecules/Modal/AddSoundNotePopup.tsx#L140) — lines 140.
- [src/molecules/Modal/AddToCollectionModal.tsx:175](../../../src/molecules/Modal/AddToCollectionModal.tsx#L175) — lines 175.
- [src/molecules/Modal/AlreadySubscribedModal.tsx:144](../../../src/molecules/Modal/AlreadySubscribedModal.tsx#L144) — lines 144.
- [src/molecules/Modal/AppPopup.tsx:82](../../../src/molecules/Modal/AppPopup.tsx#L82) — lines 82.
- [src/molecules/Modal/BirdOfTheDayModal.tsx:12](../../../src/molecules/Modal/BirdOfTheDayModal.tsx#L12) — lines 12, 74, 261, 397, 420, 439, 458.
- [src/molecules/Modal/BirdOfTheDayRefreshModal.tsx:99](../../../src/molecules/Modal/BirdOfTheDayRefreshModal.tsx#L99) — lines 99.
- [src/molecules/Modal/BottomSheetWithHeader.tsx:178](../../../src/molecules/Modal/BottomSheetWithHeader.tsx#L178) — lines 178.
- [src/molecules/Modal/CameraPermissionPopup.tsx:175](../../../src/molecules/Modal/CameraPermissionPopup.tsx#L175) — lines 175.
- [src/molecules/Modal/CameraTipsModal.tsx:18](../../../src/molecules/Modal/CameraTipsModal.tsx#L18) — lines 18, 58, 107, 224, 250, 265, 291.
- [src/molecules/Modal/ChangeLocationBottomSheet.tsx:2](../../../src/molecules/Modal/ChangeLocationBottomSheet.tsx#L2) — lines 2, 53.
- [src/molecules/Modal/ChooseMethodPopup.tsx:202](../../../src/molecules/Modal/ChooseMethodPopup.tsx#L202) — lines 202.
- [src/molecules/Modal/ConfirmationModal.tsx:142](../../../src/molecules/Modal/ConfirmationModal.tsx#L142) — lines 142.
- [src/molecules/Modal/EditResultModal.tsx:221](../../../src/molecules/Modal/EditResultModal.tsx#L221) — lines 221.
- [src/molecules/Modal/IconPopupModal.tsx:220](../../../src/molecules/Modal/IconPopupModal.tsx#L220) — lines 220.
- [src/molecules/Modal/IdentificationWarningPopup.tsx:133](../../../src/molecules/Modal/IdentificationWarningPopup.tsx#L133) — lines 133.
- [src/molecules/Modal/LocationManageAccessPopup.tsx:181](../../../src/molecules/Modal/LocationManageAccessPopup.tsx#L181) — lines 181.
- [src/molecules/Modal/LocationPermissionPopup.tsx:181](../../../src/molecules/Modal/LocationPermissionPopup.tsx#L181) — lines 181.
- [src/molecules/Modal/MicrophonePermissionPopup.tsx:189](../../../src/molecules/Modal/MicrophonePermissionPopup.tsx#L189) — lines 189.
- [src/molecules/Modal/Modal.tsx:171](../../../src/molecules/Modal/Modal.tsx#L171) — lines 171.
- [src/molecules/Modal/ModalCard.tsx:81](../../../src/molecules/Modal/ModalCard.tsx#L81) — lines 81.
- [src/molecules/Modal/PermissionModal.tsx:166](../../../src/molecules/Modal/PermissionModal.tsx#L166) — lines 166.
- [src/molecules/Modal/PoorResultsWarningModal.tsx:110](../../../src/molecules/Modal/PoorResultsWarningModal.tsx#L110) — lines 110.
- [src/molecules/Modal/RemoveFromCollectionModal.tsx:855](../../../src/molecules/Modal/RemoveFromCollectionModal.tsx#L855) — lines 855, 934.
- [src/molecules/Modal/SmallDiscountModal.tsx:114](../../../src/molecules/Modal/SmallDiscountModal.tsx#L114) — lines 114.
- [src/molecules/Modal/SoundCollectionNoteModal.tsx:84](../../../src/molecules/Modal/SoundCollectionNoteModal.tsx#L84) — lines 84.
- [src/molecules/Modal/SubscriptionErrorModal.tsx:134](../../../src/molecules/Modal/SubscriptionErrorModal.tsx#L134) — lines 134.
- [src/molecules/MultiSelectDropdown/MultiSelectDropdown.tsx:225](../../../src/molecules/MultiSelectDropdown/MultiSelectDropdown.tsx#L225) — lines 225.
- [src/molecules/MultiValueChipInput/MultiValueChipInput.tsx:280](../../../src/molecules/MultiValueChipInput/MultiValueChipInput.tsx#L280) — lines 280.
- [src/molecules/PhotoPickerRow/PhotoPickerRow.tsx:289](../../../src/molecules/PhotoPickerRow/PhotoPickerRow.tsx#L289) — lines 289.
- [src/molecules/PlantAttributes/PlantAttributes.tsx:182](../../../src/molecules/PlantAttributes/PlantAttributes.tsx#L182) — lines 182.
- [src/molecules/RemoveFromWishlistModal/RemoveFromWishlistModal.tsx:147](../../../src/molecules/RemoveFromWishlistModal/RemoveFromWishlistModal.tsx#L147) — lines 147.
- [src/molecules/ReportModal/ReportModal.tsx:221](../../../src/molecules/ReportModal/ReportModal.tsx#L221) — lines 221.
- [src/molecules/Slider/Slider.tsx:103](../../../src/molecules/Slider/Slider.tsx#L103) — lines 103.
- [src/molecules/Tooltip/Tooltip.tsx:222](../../../src/molecules/Tooltip/Tooltip.tsx#L222) — lines 222, 241, 294, 307.
- [src/navigation/CustomBottomTabBar.tsx:91](../../../src/navigation/CustomBottomTabBar.tsx#L91) — lines 91.
- [src/navigation/MeasuredTabBarButton.tsx:51](../../../src/navigation/MeasuredTabBarButton.tsx#L51) — lines 51.
- [src/organisms/BirdCard/BirdCard.tsx:383](../../../src/organisms/BirdCard/BirdCard.tsx#L383) — lines 383.
- [src/organisms/BottomNavBar/BottomNavBar.tsx:84](../../../src/organisms/BottomNavBar/BottomNavBar.tsx#L84) — lines 84.
- [src/organisms/FilterModal/FilterModal.tsx:733](../../../src/organisms/FilterModal/FilterModal.tsx#L733) — lines 733, 745.
- [src/organisms/Footer/Footer.tsx:152](../../../src/organisms/Footer/Footer.tsx#L152) — lines 152.
- [src/services/camera/camera.service.ts:55](../../../src/services/camera/camera.service.ts#L55) — lines 55, 95.
- [src/utils/googleMapsApi.ts:493](../../../src/utils/googleMapsApi.ts#L493) — lines 493.
- [src/utils/imageProcessing/imagePreprocessor.ts:48](../../../src/utils/imageProcessing/imagePreprocessor.ts#L48) — lines 48, 56, 66.
- [src/utils/tabletLayout.ts:18](../../../src/utils/tabletLayout.ts#L18) — lines 18.

## Closure record

- Static source inventory and selected high-risk implementation review: completed on the snapshot above.
- Report source-link and cited-line checks: completed by generation assertions; independent post-generation link check recorded in Rockzy handover changelog.
- Figma file/component audit: not performed; no Figma source supplied.
- Build, simulator/device, screen-reader and font/display/keyboard matrix: not run.
- Fixes: proposed only; no application code changed.
- Named owners, target release and Design/Development/QA sign-off: open.
- Follow-up: reproduce prioritized findings, trace shared-component callers, inspect effective native configuration, then implement and retest in a separately authorized change.
