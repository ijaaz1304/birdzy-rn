# Deep linking (Shroom AI / Birdzy)

Shroom AI uses the Trackzio deep-link stack: Firebase Hosting Universal Links / App Links, custom schemes `birdzy://` (prod) / `birdzy-dev://` (dev), and JS `deepLinkManager` to navigate after auth session is ready.

## URL forms

| Form | Example |
|------|---------|
| HTTPS (prod) | `https://mushrooms-app-dfdc5.web.app/collection` |
| HTTPS (prod alt) | `https://mushrooms-app-dfdc5.firebaseapp.com/identify` |
| HTTPS (dev) | `https://mushrooms-app-dev.web.app/identify` |
| HTTPS (dev alt) | `https://mushrooms-app-dev.firebaseapp.com/feed` |
| Custom scheme | `birdzy://subs` |
| Auth (existing) | `birdzy://reset-password?email=…&code=…` |

Password-reset links are handled separately in `authDeepLinks.ts` and are not routed through `parseDeepLinkUrl`.

## Route map

First path segment after the host (query strings ignored):

| Path | Navigation |
|------|------------|
| `home` | MainTabs → Home → HomeMain |
| `identify`, `camera` | MainTabs → Camera |
| `catalogue`, `catalog` | MainTabs → Catalogue |
| `collection` | MainTabs → Collection |
| `feed` | MainTabs → Feed |
| `subs`, `subscription` | SubscriptionStack → SubscriptionMain (paywall; Home if already subscribed) |
| `settings` | SettingsStack → SettingsMain |
| `ask-ai`, `askai` | AskAIStack → AskAIMain |
| `guides` | GuidesStack → GuidesMain |
| `quiz` | QuizStack → QuizMain |
| `personality`, `rock-personality` | RockPersonalityStack → RockPersonalityIntro |

## Key files

| Path | Role |
|------|------|
| `hosting/public/` | AASA, assetlinks, web fallback `index.html` |
| `src/navigation/deepLinking/deepLinkAuthFlow.ts` | Guest login + skip onboarding for deep-link entry |
| `src/navigation/deepLinking/deepLinkManager.ts` | Queue, subscription resolution, apply |
| `src/navigation/RootNavigator.tsx` | `Linking` bootstrap, apply when past Splash/Auth |
| `src/services/notifications/notificationRouting.ts` | `ResolvedRootNavigation` type |
| `ios/Birdzy/AppDelegate.swift` | `RCTLinkingManager` for Universal Links + custom scheme (with Google Sign-In) |
| `ios/Birdzy/SceneDelegate.swift` | UIScene URL / `continueUserActivity` → `RCTLinkingManager` |
| `ios/Birdzy/BirdzyRelease-Dev.entitlements` | Associated Domains |
| `android/app/src/main/AndroidManifest.xml` | Scheme + HTTPS intent filters |

## Session gate (Banknote pattern)

Marketing deep links use the Trackzio / Banknote auth flow:

1. Parse URL and queue the destination in `deepLinkManager`.
2. **Skip** onboarding and post-auth onboarding (`prepareAppForDeepLinkEntry`).
3. If no session exists, **auto guest login** (`ensureGuestSessionForDeepLink`).
4. Bootstrap routes to **MainTabs** (not Onboarding/PostAuthOnboarding) when a link is pending.
5. Apply the queued destination once navigation is past Splash/Auth.

`/subs` and `/subscription` links check subscription status at apply time:

- **Subscribed** → MainTabs → Home
- **Not subscribed** → SubscriptionStack → SubscriptionMain (`comingFrom: "deepLink"` → paywall)

Password-reset links (`birdzy://reset-password?...`) are handled separately in `authDeepLinks.ts`.

Guest and registered users are treated the same for marketing deep links — login is never required first.

## Deploy hosting

```bash
npm run firebase:deploy:prod   # mushrooms-app-dfdc5
npm run firebase:deploy:dev    # mushrooms-app-dev
```

Or hosting only:

```bash
npx -y firebase-tools@latest use prod && npx -y firebase-tools@latest deploy --only hosting
npx -y firebase-tools@latest use dev && npx -y firebase-tools@latest deploy --only hosting
```

Before Android App Links verify, replace placeholders in `hosting/public/.well-known/assetlinks.json` with release/dev SHA-256 fingerprints from:

```bash
keytool -list -v -keystore your-release.keystore -alias your-alias
```

## Tests

```bash
npm test -- --testPathPattern=deepLink
```

Manual QA URLs: [`14-deep-linking-test-urls.md`](./14-deep-linking-test-urls.md)

## Adding a route

Keep in sync:

1. `hosting/public/index.html` → `SUPPORTED_ROUTES`
2. Both `apple-app-site-association` files → `paths`
3. `deepLink.constants.ts` → `DEEP_LINK_SUPPORTED_ROUTE_NAMES`
4. `parseDeepLinkUrl.ts` → switch case

Then redeploy hosting and ship a new app binary if native paths change.
