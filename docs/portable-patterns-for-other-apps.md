# Portable Patterns — Shroom-Ai Implementation Guide

Reference for porting Shroom-Ai patterns to other Trackzio React Native apps (Banknote, Rocks, Plants, etc.).

**Last updated from:** Shroom-Ai session work (deep linking, Android gallery, iOS identify navigation, subscription/onboarding alignment).

---

## Table of contents

1. [Overview](#1-overview)
2. [Deep linking (Banknote pattern)](#2-deep-linking-banknote-pattern)
3. [Android embedded photo picker](#3-android-embedded-photo-picker)
4. [iOS identify-flow navigation](#4-ios-identify-flow-navigation)
5. [Subscription & onboarding notes](#5-subscription--onboarding-notes)
6. [QA checklist (deep links)](#6-qa-checklist-deep-links)
7. [Known gaps to fix when porting](#7-known-gaps-to-fix-when-porting)
8. [Porting checklist](#8-porting-checklist)
9. [Related docs in this repo](#9-related-docs-in-this-repo)

---

## 1. Overview

| Pattern | Problem solved | Platforms |
|---------|----------------|-----------|
| **Deep linking + guest auth** | User opens marketing link without login; must land on target screen, not onboarding | iOS + Android |
| **Embedded photo picker** | Gallery access without `READ_MEDIA_IMAGES` (Play compliance) | Android 14+ |
| **Identify full-screen stack** | Camera / analyze screens opening as bottom sheets on iOS | iOS |

These are **independent** — copy only what your app needs.

---

## 2. Deep linking (Banknote pattern)

Standard Trackzio approach documented in `docs/DeepLinkDoc.md`. Shroom-Ai implements the full auth + navigation flow.

### 2.1 Architecture

```
User taps HTTPS or custom-scheme URL
        ↓
Native (Intent / Universal Link) → React Native Linking
        ↓
parseDeepLinkUrl() → deepLinkManager.handle() (queue destination)
        ↓
prepareAppForDeepLinkEntry()     ← skip post-auth onboarding
        ↓
ensureGuestSessionForDeepLink()  ← auto guest login if no session
        ↓
Bootstrap: reset("MainTabs")     ← skip pre-auth onboarding (when link pending)
        ↓
deepLinkManager.applyPendingIfNeeded(navigate)
        ↓
(/subs only) resolve subscription → Home OR paywall
```

**Design principles (from Banknote):**

- No Branch / AppsFlyer / Firebase Dynamic Links — custom scheme + verified HTTPS only.
- Single JS handler for iOS and Android.
- Pending queue until auth + navigator are ready.
- Guest and registered users treated the same for marketing links.
- Password-reset links handled **separately** (not through `parseDeepLinkUrl`).

### 2.2 URL forms

| Type | Shroom example |
|------|----------------|
| Custom scheme | `birdzy://feed` |
| HTTPS (prod) | `https://mushrooms-app-dfdc5.web.app/collection` |
| HTTPS (dev) | `https://mushrooms-app-dev.web.app/identify` |
| Auth (separate) | `birdzy://reset-password?email=…&code=…` |

Replace scheme, hosts, and bundle IDs per app in `deepLink.constants.ts`.

### 2.3 Supported routes (Shroom)

First path segment after host:

| Path | Destination |
|------|-------------|
| `home` | MainTabs → Home |
| `identify`, `camera` | MainTabs → Camera |
| `catalogue`, `catalog` | MainTabs → Catalogue |
| `collection` | MainTabs → Collection |
| `feed` | MainTabs → Feed |
| `subs`, `subscription` | Subscription paywall (or Home if subscribed) |
| `settings` | SettingsStack |
| `ask-ai`, `askai` | AskAIStack |
| `guides` | GuidesStack |
| `quiz` | QuizStack |
| `personality`, `rock-personality` | RockPersonalityStack |

Keep in sync: `deepLink.constants.ts`, `parseDeepLinkUrl.ts`, Firebase `assetlinks.json`, AASA, `hosting/public/index.html`.

### 2.4 Core modules (copy/adapt per app)

| Module | Role |
|--------|------|
| `src/navigation/deepLinking/deepLink.constants.ts` | Scheme, Team ID, bundle IDs, Firebase hosts, route list |
| `src/navigation/deepLinking/parseDeepLinkUrl.ts` | URL → `ResolvedRootNavigation` |
| `src/navigation/deepLinking/deepLinkManager.ts` | Queue, apply, `/subs` resolution |
| `src/navigation/deepLinking/deepLinkAuthFlow.ts` | Guest login + skip post-auth onboarding |
| `src/navigation/RootNavigator.tsx` | Linking bootstrap, splash routing, pipeline |
| `src/features/auth/utils/authDeepLinks.ts` | Password-reset URL parsing |
| `hosting/public/.well-known/` | `assetlinks.json`, `apple-app-site-association` |

### 2.5 Session gate

Marketing deep links require:

```typescript
isAuthenticated && token && user != null
```

Guest sessions count. If missing → `guestLogin()` then retry.

### 2.6 Post-auth onboarding skip

```typescript
// deepLinkAuthFlow.ts
export function prepareAppForDeepLinkEntry(): void {
  usePostAuthOnboardingStore.getState().markCompleted();
}
```

Call as soon as a marketing deep link is parsed (before navigation).

### 2.7 Guest login on deep link

```typescript
export async function ensureGuestSessionForDeepLink(): Promise<boolean> {
  if (hasAppSessionForDeepLink()) {
    useSubscriptionStore.getState().syncFromAuthStore();
    return true;
  }
  await useAuthStore.getState().guestLogin(guestId);
  useSubscriptionStore.getState().syncFromAuthStore();
  return hasAppSessionForDeepLink();
}
```

On failure → fall back to normal onboarding (Banknote TC-10).

### 2.8 `/subs` special handling

At **apply time** (not parse time), after subscription sync:

| User state | Navigation |
|------------|------------|
| Subscribed | MainTabs → Home |
| Not subscribed | SubscriptionStack → SubscriptionMain (`comingFrom: "deepLink"`) |

```typescript
// deepLinkManager.ts — resolveDeepLinkDestinationForApply()
if (selectIsPremium(store)) return mainTabsHome();
return { screen: "SubscriptionStack", params: { screen: "SubscriptionMain", params: { comingFrom: "deepLink" } } };
```

### 2.9 RootNavigator integration

**On URL (cold + warm):**

1. Password reset → separate auth stack flow.
2. Marketing URL → `deepLinkManager.handle(url)`.
3. `prepareAppForDeepLinkEntry()`.
4. `ensureGuestSessionForDeepLink()` (once per session via ref guard).
5. `applyPendingDeepLink()` when navigator ready.

**Bootstrap (after auth store hydrates):**

- If pending deep link + has auth → `reset("MainTabs")`, then apply.
- If pending deep link + no auth → guest login, then `MainTabs` or `Onboarding` on failure.
- Skip provisional onboarding timeout when `getPendingDestination() != null`.

**Apply guard:** Do not apply while active route is `Splash`, `Onboarding`, `PostAuthOnboarding`, or `AuthStack` (except when fixing TC-20 — see gaps).

### 2.10 Native + Firebase setup

| Platform | Config |
|----------|--------|
| **Android** | Custom scheme intent-filter + `android:autoVerify="true"` HTTPS host; remove `READ_MEDIA_*` if using embedded picker only |
| **iOS** | Associated Domains: `applinks:YOUR-DOMAIN.web.app`; `RCTLinkingManager` in AppDelegate + SceneDelegate |
| **Firebase Hosting** | `.well-known/assetlinks.json`, `.well-known/apple-app-site-association`, `open.html` fallback |

See `docs/DeepLinkDoc.md` (Firebase section) and `docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md`.

### 2.11 Tests

```bash
npm test -- --testPathPattern=deepLink
```

Files: `parseDeepLinkUrl.test.ts`, `deepLinkManager.test.ts`.

### 2.12 Manual test (replace package/scheme)

```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "YOURSCHEME://feed" YOUR.PACKAGE.NAME

# iOS Simulator
xcrun simctl openurl booted "YOURSCHEME://feed"
```

---

## 3. Android embedded photo picker

Avoid broad storage permission by embedding Google’s system picker in-app.

### 3.1 What it is

- **Not** on-device ML — it is **Android Embedded Photo Picker** (`androidx.photopicker`).
- User picks one photo → temporary `content://` URI → copy to app cache → upload/crop.

### 3.2 Flow

```
Camera → Gallery (no READ_MEDIA permission on API 33+)
    ↓
isEmbeddedPhotoPickerAvailable()?  (API 34 + SDK ext ≥ 15)
    ↓ YES                          ↓ NO
EmbeddedPhotoPickerView in screen   react-native-image-picker fallback
    ↓
onPhotoSelected(content://) → resolvePreviewImageUri() → cache file://
    ↓
Next → resolveGalleryPhotoUri() → identify / upload
```

### 3.3 Native bridge (4 Kotlin files)

| File | Role |
|------|------|
| `EmbeddedPhotoPickerPackage.kt` | Register module + view manager |
| `EmbeddedPhotoPickerModule.kt` | `isAvailable()` |
| `EmbeddedPhotoPickerAvailability.kt` | API 34 + extension 15 |
| `EmbeddedPhotoPickerViewManager.kt` | Host `EmbeddedPhotoPickerView` |

Register in `MainApplication.kt`: `add(EmbeddedPhotoPickerPackage())`.

**Gradle:**

```gradle
implementation("androidx.photopicker:photopicker:1.0.0-alpha02")
kotlinOptions {
    freeCompilerArgs += "-opt-in=androidx.photopicker.ExperimentalPhotoPickerApi"
}
```

**Manifest:**

- Remove `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` (`tools:node="remove"`).
- Add `<queries>` for embedded picker `EmbeddedService.BIND`.

### 3.4 JavaScript layer

| File | Role |
|------|------|
| `embeddedPhotoPicker.android.ts` | Native `isAvailable()` |
| `embeddedPhotoPicker.ts` | iOS stub → `false` |
| `EmbeddedAndroidPhotoPicker.tsx` | `requireNativeComponent("EmbeddedPhotoPickerView")` |
| `GalleryPickerScreen.tsx` | Platform branch: embedded vs fallback |
| `camera.utils.ts` | `ensureLoadableUri()` — `content://` → cache |

**Critical:** Copy `content://` to cache **immediately** on `onPhotoSelected` while URI permission is valid.

### 3.5 Permissions service

On Android API 33+, `checkStoragePermission()` returns granted (picker grants scoped access).

### 3.6 Full detail

See **`docs/android-embedded-photo-picker-complete-flow.md`** (step-by-step porting guide).

---

## 4. iOS identify-flow navigation

On newer iOS, native-stack routes without explicit presentation can render as sheet-like pages.

### 4.1 Fix

Shared stack options in `src/navigation/identifyFlowScreenOptions.ts`:

```typescript
export const IDENTIFY_FULL_SCREEN_OPTIONS = {
  presentation: "card",
  contentStyle: { flex: 1 },
};

export const IDENTIFY_CROP_HOST_OPTIONS = {
  presentation: Platform.OS === "ios"
    ? Platform.isPad ? "fullScreenModal" : "transparentModal"
    : "containedModal",
  animation: "none",
  gestureEnabled: false,
  // ...
};
```

Apply to: Camera stack screens (analyze, top matches, details), crop host only for crop modal.

### 4.2 Crop return path

When leaving crop modal, use `navigation.popTo("CameraMain", …)` instead of `navigate` + merge — avoids leaving modal presentation on the stack.

### 4.3 Diagnosis exit

`DiagnosisLoadingScreen` → `navigation.popToTop()` before navigating Home so stale analyze routes do not reopen on Camera tab.

**When to port:** Any app with Vision Camera + multi-step identify flow on iOS native stack.

---

## 5. Subscription & onboarding notes

### 5.1 Shared plan card (post-auth + paywall)

`PostAuthHorizontalPlanCard` is used by both post-auth onboarding and subscription paywall.

**Price typography fix:** Use bold 16px for amount; remove `adjustsFontSizeToFit` / dynamic shrink on the main price in narrow 3-card rows (was making ₹ look tiny while `/year` stayed 12px).

### 5.2 IAP currency

Prices come from App Store / Play Store, not hardcoded. Device region validates currency (`getDeviceCurrency`, `formattedPriceMatchesExpectedCurrency`). Hook: `useSubscriptionPlansWithPrices` — refetch when pack switches or cached currency mismatches.

**When porting:** Reuse hook + `iapPriceDisplay.ts`; configure product IDs per app.

---

## 6. QA checklist (deep links)

Use when validating a new app port. Map routes to your app (e.g. `marketplace` → `catalogue`).

| ID | Scenario | Expected |
|----|----------|----------|
| TC-1 | Fresh install, cold start, deep link | Target screen; no onboarding/PostAuth |
| TC-2 | Warm start, deep link | Target screen; no onboarding |
| TC-4 | Back after deep link | Exit app or OS; **not** onboarding |
| TC-5 | Two deep links in sequence | Latest wins; clean back stack via `reset` |
| TC-6 | Kill app, normal reopen after deep link | MainTabs/Home; PostAuth not shown |
| TC-7 | Token expired after deep link | Login (AuthStack), not Onboarding |
| TC-8 | Cold start, fast network | No onboarding flash |
| TC-9 | Cold start, slow network | Longer splash; no onboarding flash |
| TC-10 | Cold start, no network | Guest login fails → onboarding OK |
| TC-11 | `/subs`, not subscribed | Paywall |
| TC-12 | `/subs`, subscribed | Home |
| TC-13 | Back from `/subs` | MainTabs, not onboarding |
| TC-16 | PostAuth funnel | Skipped on deep link entry |
| TC-17 | Invalid path | Home fallback (no crash) |
| TC-18 | Link during bootstrap | Queued until navigator ready |
| TC-19 | Rapid duplicate taps | 500ms debounce + apply mutex |
| TC-20 | On app onboarding, tap link | Reset to target (Onboarding not blocking) |

---

## 7. Known gaps to fix when porting

Fix these in the **next app** (or backport to Shroom) for full Banknote parity:

| Priority | Issue | Fix |
|----------|-------|-----|
| **P0** | Deep link while Onboarding visible — link not applied | On marketing link: `reset("MainTabs")` then apply even if current route is Onboarding |
| **P1** | Sequential deep links stack via `navigate` | `reset` root or pop stacks before each apply |
| **P1** | Rapid duplicate link taps | Debounce / single-flight guard |
| **P2** | Slow `getInitialURL` vs 2s splash timeout | Wait for initial URL before provisional onboarding |
| **P2** | Invalid deep link | Fallback to Home |
| **P2** | Token expiry after deep link | Route to Login, not pre-auth Onboarding; don’t clear “skip post-auth” flag on logout if product requires it |

---

## 8. Porting checklist

### Deep linking

- [ ] Copy/adapt `src/navigation/deepLinking/*`
- [ ] Wire `RootNavigator` Linking + bootstrap + `runDeepLinkEntryPipeline`
- [ ] Configure scheme, Firebase hosts, AASA, assetlinks
- [ ] Android manifest intent filters + iOS Associated Domains
- [ ] Map routes in `parseDeepLinkUrl.ts`
- [ ] Implement guest login API in auth store
- [ ] Post-auth skip store (`markCompleted`)
- [ ] `/subs` resolution + `comingFrom: "deepLink"` on paywall
- [ ] Password-reset links separate from marketing parser
- [ ] Unit tests + manual adb/simctl tests
- [ ] Deploy Firebase hosting verification files

### Android embedded picker

- [ ] Copy 4 Kotlin bridge files + register package
- [ ] Gradle photopicker dependency + opt-in
- [ ] Manifest permissions + queries
- [ ] JS: `EmbeddedAndroidPhotoPicker`, `ensureLoadableUri`
- [ ] ProGuard keeps for photopicker
- [ ] Test API 34+ embedded + fallback on older devices

### iOS identify navigation (if applicable)

- [ ] `IDENTIFY_FULL_SCREEN_OPTIONS` on stack / screens
- [ ] Crop modal isolated with `IDENTIFY_CROP_HOST_OPTIONS`
- [ ] `popTo` after crop; `popToTop` on diagnosis exit

---

## 9. Related docs in this repo

| Document | Contents |
|----------|----------|
| [`docs/DeepLinkDoc.md`](./DeepLinkDoc.md) | Banknote source spec + Firebase hosting guide |
| [`docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md`](./DEEP_LINKING_PLATFORM_PLAYBOOK.md) | Platform playbook |
| [`docs/engineering/developer/13-deep-linking.md`](./engineering/developer/13-deep-linking.md) | Shroom route map + file index |
| [`docs/android-embedded-photo-picker-complete-flow.md`](./android-embedded-photo-picker-complete-flow.md) | Full Android gallery porting guide |
| [`docs/android-embedded-photo-picker-bridge.md`](./android-embedded-photo-picker-bridge.md) | Short native bridge notes |
| [`docs/cursor-prompt-android-embedded-photo-picker.md`](./cursor-prompt-android-embedded-photo-picker.md) | Copy-paste Cursor prompt for bridge |
| [`docs/CRM_LINKS.md`](./CRM_LINKS.md) | Marketing URL list |

---

## Quick mental models

**Deep links:**

```
Old:  User must sign up → onboarding → then maybe reach campaign screen
New:  Link → guest session → skip PostAuth → MainTabs → target (/subs → paywall or Home)
```

**Android gallery:**

```
Old:  READ_MEDIA_IMAGES → scan library
New:  Embedded picker → content:// → cache copy → upload (no broad permission)
```

**iOS identify:**

```
Old:  Default stack presentation → sheet-like analyze screens
New:  presentation: "card" + clean crop modal exit via popTo
```

---

*Use this document as the starting point when spinning up deep links or Android gallery in a new Trackzio React Native app. Copy modules, replace constants, run the porting checklist, then execute the QA table before release.*
