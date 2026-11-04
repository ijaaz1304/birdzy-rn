# Birdzy — feature and source catalogue

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

This map is derived from the current source tree. A folder or screen declaration means implementation exists in the checkout, not that it is enabled, fully wired or released. Use the navigator and Remote Config/build behavior to establish product availability.

## Feature folders

- [src/features/app-logs](../../src/features/app-logs) — Feature-local implementation; inspect its entry screens and state before changing.
- [src/features/ask-ai](../../src/features/ask-ai) — Feature-local implementation; inspect its entry screens and state before changing.
- [src/features/auth](../../src/features/auth) — Guest/account bootstrap, login, sign-up, password recovery and session state.
- [src/features/bird-personality](../../src/features/bird-personality) — Bird personality entertainment journey; some filenames remain inherited.
- [src/features/camera](../../src/features/camera) — Permission, capture/gallery, crop, upload and identification state.
- [src/features/catalogue](../../src/features/catalogue) — Public species/specimen browsing, search and filters.
- [src/features/collection](../../src/features/collection) — Personal collections, saving, wishlist, editing and removal.
- [src/features/discount](../../src/features/discount) — Offer timing and discount presentation.
- [src/features/discovery](../../src/features/discovery) — Bird sound library and answer-based discovery.
- `src/features/explore` (local source, not included in this docs-only publication) — Place search, nearby list and geographic activity map.
- [src/features/feed](../../src/features/feed) — Community posts, comments and related notifications.
- `src/features/guides` (local source, not included in this docs-only publication) — Learning and care content.
- [src/features/home](../../src/features/home) — Home entry points, daily content and feature discovery.
- [src/features/location](../../src/features/location) — Location permission and place-selection UI.
- [src/features/notification](../../src/features/notification) — Notification permission/prompt orchestration.
- [src/features/notifications](../../src/features/notifications) — Notification inbox, navigation and delivery-related state.
- [src/features/onboarding](../../src/features/onboarding) — First-use introduction and persisted onboarding progress.
- [src/features/post-auth-onboarding](../../src/features/post-auth-onboarding) — Post-authentication prompts and onboarding decisions.
- [src/features/profile](../../src/features/profile) — User profile presentation and changes.
- [src/features/quiz](../../src/features/quiz) — Interactive knowledge/learning content.
- [src/features/rate-us](../../src/features/rate-us) — Rating request timing and feedback UI.
- [src/features/settings](../../src/features/settings) — Profile, appearance, legal, support and account actions.
- [src/features/subscription](../../src/features/subscription) — Store products, purchase, restore and entitlement state.
- [src/features/theme](../../src/features/theme) — Theme preference, tokens and startup appearance.
- [src/features/version](../../src/features/version) — Version checks and app-update presentation.

## Navigation sources

- [src/navigation/CatalogueStack.tsx](../../src/navigation/CatalogueStack.tsx)
- [src/navigation/CameraStack.tsx](../../src/navigation/CameraStack.tsx)
- [src/navigation/AuthStack.tsx](../../src/navigation/AuthStack.tsx)
- [src/navigation/CustomBottomTabBar.tsx](../../src/navigation/CustomBottomTabBar.tsx)
- [src/navigation/CollectionStack.tsx](../../src/navigation/CollectionStack.tsx)
- [src/navigation/SubscriptionStack.tsx](../../src/navigation/SubscriptionStack.tsx)
- [src/navigation/MainTabs.tsx](../../src/navigation/MainTabs.tsx)
- [src/navigation/AskAIStack.tsx](../../src/navigation/AskAIStack.tsx)
- [src/navigation/MeasuredTabBarButton.tsx](../../src/navigation/MeasuredTabBarButton.tsx)
- [src/navigation/types.ts](../../src/navigation/types.ts)
- [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx)
- [src/navigation/SettingsStack.tsx](../../src/navigation/SettingsStack.tsx)
- [src/navigation/BirdPersonalityStack.tsx](../../src/navigation/BirdPersonalityStack.tsx)
- [src/navigation/HomeStack.tsx](../../src/navigation/HomeStack.tsx)
- [src/navigation/index.ts](../../src/navigation/index.ts)
- [src/navigation/FeedStack.tsx](../../src/navigation/FeedStack.tsx)
- [src/navigation/identifyFlowScreenOptions.ts](../../src/navigation/identifyFlowScreenOptions.ts)
- [src/navigation/ExploreStack.tsx](../../src/navigation/ExploreStack.tsx)
- [src/navigation/deepLinking/deferredDeepLink.ts](../../src/navigation/deepLinking/deferredDeepLink.ts)
- [src/navigation/deepLinking/deepLinkAnalytics.ts](../../src/navigation/deepLinking/deepLinkAnalytics.ts)
- [src/navigation/deepLinking/deepLinkAuthFlow.ts](../../src/navigation/deepLinking/deepLinkAuthFlow.ts)
- [src/navigation/deepLinking/parseDeepLinkUrl.ts](../../src/navigation/deepLinking/parseDeepLinkUrl.ts)
- [src/navigation/deepLinking/deepLink.constants.ts](../../src/navigation/deepLinking/deepLink.constants.ts)
- [src/navigation/deepLinking/deferredDeepLinkParsing.ts](../../src/navigation/deepLinking/deferredDeepLinkParsing.ts)
- [src/navigation/deepLinking/bootstrapDeepLinkSession.ts](../../src/navigation/deepLinking/bootstrapDeepLinkSession.ts)
- [src/navigation/deepLinking/deepLinkManager.ts](../../src/navigation/deepLinking/deepLinkManager.ts)
- [src/navigation/deepLinking/index.ts](../../src/navigation/deepLinking/index.ts)
- [src/navigation/deepLinking/deepLinkNavigation.ts](../../src/navigation/deepLinking/deepLinkNavigation.ts)
- [src/services/navigation/navigationLogger.ts](../../src/services/navigation/navigationLogger.ts)

## Existing documentation by topic

- [docs/ANALYTICS_EVENTS_QA.md](../ANALYTICS_EVENTS_QA.md)
- [docs/API_AUTH.md](../API_AUTH.md)
- [docs/API_CORE.md](../API_CORE.md)
- [docs/API_DOMAIN_MAPPING.md](../API_DOMAIN_MAPPING.md)
- [docs/ASSET_AUDIT.md](../ASSET_AUDIT.md)
- [docs/AUTH_API_COVERAGE.md](../AUTH_API_COVERAGE.md)
- [docs/BRANDING_PLACEHOLDERS.md](../BRANDING_PLACEHOLDERS.md)
- [docs/CI_CD_SETUP.md](../CI_CD_SETUP.md)
- [docs/CREDENTIALS_AUDIT.md](../CREDENTIALS_AUDIT.md)
- [docs/CRM_LINKS.md](../CRM_LINKS.md)
- [docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md](../DEEP_LINKING_PLATFORM_PLAYBOOK.md)
- [docs/DOMAIN_MIGRATION_INVENTORY.md](../DOMAIN_MIGRATION_INVENTORY.md)
- [docs/DeepLinkDoc.md](../DeepLinkDoc.md)
- [docs/ENV_SETUP.md](../ENV_SETUP.md)
- [docs/FIREBASE_SETUP.md](../FIREBASE_SETUP.md)
- [docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md](../GOOGLE_SIGNIN_TROUBLESHOOTING.md)
- [docs/ICONS_REMAINING.md](../ICONS_REMAINING.md)
- [docs/IMAGE_ASSET_AUDIT.md](../IMAGE_ASSET_AUDIT.md)
- [docs/LOCATION_INTEGRATION.md](../LOCATION_INTEGRATION.md)
- [docs/PRODUCT_SPEC_TRACKER.md](../PRODUCT_SPEC_TRACKER.md)
- [docs/REBRAND_CHECKLIST.md](../REBRAND_CHECKLIST.md)
- [docs/REMAINING_CHECKLIST.md](../REMAINING_CHECKLIST.md)
- [docs/THEME_EXPERIMENT_EVENTS.md](../THEME_EXPERIMENT_EVENTS.md)
- [docs/android-embedded-photo-picker-bridge.md](../android-embedded-photo-picker-bridge.md)
- [docs/android-embedded-photo-picker-complete-flow.md](../android-embedded-photo-picker-complete-flow.md)
- [docs/cursor-prompt-android-embedded-photo-picker.md](../cursor-prompt-android-embedded-photo-picker.md)
- [docs/deep-linking-checklist.md](../deep-linking-checklist.md)
- [docs/engineering/developer/13-deep-linking.md](../engineering/developer/13-deep-linking.md)
- [docs/engineering/developer/14-deep-linking-test-urls.md](../engineering/developer/14-deep-linking-test-urls.md)
- [docs/portable-patterns-for-other-apps.md](../portable-patterns-for-other-apps.md)
- [docs/sound-recording-device-qa.md](../sound-recording-device-qa.md)

## Adding a feature

Add its purpose, product entry point, happy/error flows, source ownership, API/provider requirements, permissions/entitlements and acceptance checks to the relevant handover pages. Link deeper feature docs here. A newly created folder must not be recorded as a shipped capability until its route/flag/build is verified.
