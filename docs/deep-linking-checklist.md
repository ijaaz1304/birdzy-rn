# Deep Linking — Checklist (Birdzy)

Filled worksheet + audit for Shroom-Ai. See also [`engineering/developer/14-deep-linking-test-urls.md`](./engineering/developer/14-deep-linking-test-urls.md).

**Last updated:** 2026-08-12 — env-scoped schemes/hosts, stack back preservation, no-nav unknown paths, analytics.

---

## Part 0 — Config (Birdzy)

| Key | Production | Staging / Dev |
|-----|------------|---------------|
| App display name | Birdzy | Birdzy Dev |
| URL scheme | `birdzy` | `birdzy-dev` |
| HTTPS primary host | `mushrooms-app-dfdc5.web.app` | `mushrooms-app-dev.web.app` |
| HTTPS alt host | `mushrooms-app-dfdc5.firebaseapp.com` | `mushrooms-app-dev.firebaseapp.com` |
| Android application ID | `com.trackzio.birds` | `com.trackzio.birds.dev` |
| iOS bundle ID | `com.trackzio.birds` | `com.trackzio.birds.dev` |
| Team ID | `FUQBY8BYY3` | same |

### Scenarios N/A

- [x] No deferred links
- [x] No entity/share links
- [ ] Has onboarding (skipped on deep link)
- [ ] Has guest session
- [ ] Has `/subs` conditional route
- [ ] Has reset-password auth link

---

## Quick audit scorecard

| Area | Status |
|------|--------|
| Env-scoped scheme + hosts | ✅ |
| Single parser + queue | ✅ |
| Unknown/empty path = no nav | ✅ |
| Stack routes keep main shell | ✅ |
| Auth links separate | ✅ |
| Cross-env rejection (JS + native) | ✅ |
| AASA + assetlinks in repo | ✅ |
| Analytics deep_link_* events | ✅ |
| Unit tests (27) | ✅ |
| QA matrix on device | ⚠️ Pending |
| Hosting deployed | ⚠️ Verify |

---

## Part 1 — Implementation (summary)

| Item | Status |
|------|--------|
| Custom scheme per flavor | ✅ `birdzy` / `birdzy-dev` |
| HTTPS per flavor | ✅ manifestPlaceholders + entitlements |
| Cross-env fail-safe | ✅ Parser + native isolation |
| Unknown/empty → no navigation | ✅ |
| Stack overlay + MainTabs back stack | ✅ `buildDeepLinkResetState` |
| Guest + skip onboarding | ✅ |
| Atomic reset apply | ✅ |
| Analytics events | ✅ |

---

## Part 2 — Platform (summary)

| Item | Status |
|------|--------|
| Android manifestPlaceholders | ✅ `android/app/build.gradle` |
| iOS `DEEP_LINK_URL_SCHEME` + entitlements | ✅ Prod/Dev split |
| Hosting store fallback | ✅ `hosting/public/index.html` |
| Deploy before QA | ⚠️ Required |

---

## Part 3 — QA (pending device run)

Run DL-01–DL-09 for P0 routes: `home`, `identify`, `collection`, `feed`, `subs`.

```bash
# Prod
adb shell am start -a android.intent.action.VIEW -d "birdzy://collection" com.trackzio.birds

# Dev
adb shell am start -a android.intent.action.VIEW -d "birdzy-dev://feed" com.trackzio.birds.dev
```

Mark N/A: DL-13, DL-14, DL-20.

---

## Part 4 — Sign-off

| Field | Value |
|-------|-------|
| App name | Birdzy |
| Engineering P0 | ✅ Complete |
| Platform config | ✅ In repo; deploy hosting |
| Device QA | ⚠️ Pending |
| Tester / Date | _TBD_ |

---

## Key files

| File | Role |
|------|------|
| `src/navigation/deepLinking/deepLink.constants.ts` | Schemes, hosts, routes |
| `src/navigation/deepLinking/parseDeepLinkUrl.ts` | Parser + env rejection |
| `src/navigation/deepLinking/deepLinkNavigation.ts` | MainTabs + overlay reset |
| `src/navigation/deepLinking/deepLinkManager.ts` | Queue + apply |
| `src/navigation/deepLinking/deepLinkAnalytics.ts` | Firebase events |
| `android/app/build.gradle` | Flavor manifestPlaceholders |
| `ios/Birdzy/BirdzyRelease-Prod.entitlements` | Prod associated domains |
| `ios/Birdzy/BirdzyRelease-Dev.entitlements` | Dev associated domains |

---

*For the full generic checklist template, copy sections from team playbook or extend this doc.*
