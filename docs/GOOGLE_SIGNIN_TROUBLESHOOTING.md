# Google Sign-In troubleshooting (Android APK / release)

Google Sign-In works in **dev debug** builds but often fails in **release APK / Play Store** builds because Android validates the app’s **package name + signing certificate SHA-1** against Firebase / Google Cloud. Dev and prod use different setups in this repo.

## How this project is configured

| Build | Package | Keystore | Firebase project | `google-services.json` |
|-------|---------|----------|------------------|------------------------|
| Dev debug (`npm run android`) | `com.trackzio.birds.dev` | Debug | `mushrooms-app-dev` | `android/app/src/dev/` |
| Dev release APK (`npm run android:build:dev:apk`) | `com.trackzio.birds.dev` | Debug (always) | `mushrooms-app-dev` | `android/app/src/dev/` |
| Prod release APK (`npm run android:build:prod:apk`) | `com.trackzio.birds` | Upload / release | `mushrooms-app-dfdc5` | `android/app/src/prod/` |

`GOOGLE_WEB_CLIENT_ID` must match the **Web** OAuth client for the same Firebase project:

| Flavor | Web client ID must start with |
|--------|-------------------------------|
| Dev (`.dev` package) | `511567649411-` |
| Prod | `921492151587-` |

Run `npm run env:dev` or `npm run env:prod` **immediately before** `./gradlew` — release APKs embed `.env` at bundle time, unlike debug Metro builds.

## Most common reasons dev APK fails (while debug works)

### A. Wrong `GOOGLE_WEB_CLIENT_ID` baked into the APK

Debug (`npm run android`) loads JS from Metro with whatever `.env` is active. A dev APK built after `npm run env:prod` (or `./gradlew` without `env:dev`) bundles the **prod** web client into a **dev** package → `DEVELOPER_ERROR`.

**Fix:**

```bash
npm run android:build:dev:apk
```

This runs `env:dev` + pre-checks automatically. In App Logs, `webClientIdMismatch` should be empty and the client hint should start with `511567649411-`.

### B. Dev release was signed with upload keystore (fixed in Gradle)

`devRelease` now **always** uses the debug keystore so SHA-1 matches `mushrooms-app-dev` Firebase. Rebuild after pulling latest `android/app/build.gradle`.

## Most common reasons prod APK fails

### 0. Release keystore missing locally (very common)

`android/app/src/prod/minerals-upload-key.jks` is **gitignored**. If it is not on your machine, Gradle used to **silently sign prodRelease with the debug keystore**. Debug SHA is registered only for **dev** Firebase (`com.trackzio.birds.dev`), not prod — so Google Sign-In fails with `DEVELOPER_ERROR` (code 10).

**Fix (pick one):**

1. **Recommended:** Copy `minerals-upload-key.jks` to `android/app/src/prod/` (see `docs/CI_CD_SETUP.md`), ensure `android/app/keystore.properties` exists, then `npm run android:build:prod:apk`.
2. **Local testing only:** Firebase → **mushrooms-app-dfdc5** → Android app `com.trackzio.birds` → add debug SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`, download new `google-services.json`, rebuild.

`npm run android:check:dev` / `android:check:prod` run before APK/AAB builds and fail early on wrong `.env` or missing keystore.

### 1. APK installed from Google Play (internal / open / production testing)

Play Console **re-signs** the app with the **App signing key**. That SHA-1 is **different** from your upload keystore.

**Fix:**

1. Play Console → **Test and release** → **Setup** → **App integrity** → **App signing key certificate**
2. Copy **SHA-1** (and SHA-256 if shown)
3. Firebase → **mushrooms-app-dfdc5** → Project settings → Your Android app (`com.trackzio.birds`) → **Add fingerprint**
4. Download an updated `google-services.json` and replace `android/app/src/prod/google-services.json`
5. Rebuild and upload a new release

### 2. Wrong build variant

| Command | Google Sign-In |
|---------|----------------|
| `npm run android` (devDebug) | Works (debug SHA registered for `.dev`) |
| `npm run android:prod` (prodDebug) | **Fails** unless debug SHA-1 is added to **prod** Firebase (`mushrooms-app-dfdc5`) |
| `npm run android:build:prod:apk` (prodRelease) | Should work if upload SHA is in Firebase |
| `npm run android:build:dev:apk` (devRelease) | Should work — debug SHA + dev web client ID |

Always test prod Google Sign-In with **`npm run android:build:prod:apk`**, not `android:prod`.

### prodDebug (`npm run android:prod`) — your current error

Logs like `bundleId: com.trackzio.birds`, `buildMode: debug`, `webClientIdMismatch: null` mean the OAuth client ID is correct but the app is signed with the **debug keystore**. Prod Firebase only has the **upload** SHA-1.

**Fix (pick one):**

1. **Keep using prodDebug locally** — Firebase → **mushrooms-app-dfdc5** → Android app `com.trackzio.birds` → **Add fingerprint**:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
   Download updated `google-services.json` → `android/app/src/prod/google-services.json` → rebuild.

2. **Use dev for Google Sign-In testing** — `npm run android` (devDebug, already works).

3. **Test prod release** — `npm run android:build:prod:apk` with upload keystore.

### 3. Missing `GOOGLE_WEB_CLIENT_ID` in the release JS bundle

Release builds embed env at **bundle time**. CI or local builds must run `npm run env:prod` (copies `.env.prod` → `.env`) before `./gradlew assembleProdRelease`.

Check in the app: **Settings → App Logs** and look for `[AUTH] Google signIn: env check` — `GOOGLE_WEB_CLIENT_ID_set` should be `true` and length > 0.

### 4. OAuth consent screen (prod Google Cloud project)

If the prod OAuth consent screen is in **Testing** mode, only listed test users can sign in. Publish the app or add the tester’s Google account under OAuth consent screen → Test users.

## Verify fingerprints locally

```bash
# Debug keystore (dev debug builds)
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release / upload keystore (prod release APK)
keytool -list -v -keystore android/app/src/prod/minerals-upload-key.jks -alias upload

# All Gradle variants
cd android && ./gradlew signingReport
```

Compare SHA-1 values with Firebase → Project settings → Android app → SHA certificate fingerprints.

## Verify the APK you are testing

```bash
# Replace with path to your APK
$ANDROID_HOME/build-tools/*/apksigner verify --print-certs app-prod-release.apk
```

The printed SHA-1 must exist in Firebase for `com.trackzio.birds`.

## Typical error

`DEVELOPER_ERROR` / code `10` → configuration mismatch (SHA-1, package name, or wrong `GOOGLE_WEB_CLIENT_ID`). Not a React Native bug.

## Prod reference values (upload key)

These should already be in `android/app/src/prod/google-services.json`:

- Package: `com.trackzio.birds`
- Upload keystore SHA-1: `1f3b34f1f01896477718fd1ada485be95317599c`
- Web client ID: `921492151587-ciqc901kpqj5tcj5pj2jdh9obhpnmr10.apps.googleusercontent.com`

If the APK comes from Play Store, you still need the **App signing key** SHA-1 from Play Console (step 1 above).
