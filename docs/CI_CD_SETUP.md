# CI/CD Pipeline Setup

## Branch triggers

| Branch        | Trigger | Build flavor | Destination                                                | Output                    |
| ------------- | ------- | ------------ | ---------------------------------------------------------- | ------------------------- |
| `development` | Push    | Dev          | **Open testing (Android)** / **TestFlight external (iOS)** | Dev Android AAB, iOS IPA  |
| `main`        | Push    | Prod         | **Internal testing**                                       | Prod Android AAB, iOS IPA |
| `release`     | Push    | Prod         | **Internal testing**                                       | Prod Android AAB, iOS IPA |

- **Push to `development`** → build **dev** → uploads to **Google Play Open testing** (API track `beta`) and **TestFlight** (use an External testing group/public link).
- **Push to `main` or `release`** → build **prod** → uploads to **Play Internal testing** and **TestFlight** (use an Internal testing group).

---

## Signing: do you need a key for dev?

**No separate signing key for dev.**

- **Android**: One upload keystore is used for **both** dev and prod.

  - Dev app id: `com.trackzio.minerals.dev`
  - Prod app id: `com.trackzio.minerals`  
    The same JKS file signs both; the build flavor only changes `applicationId`.  
    So you only need **one** Android keystore in CI (same for stage and prod).

- **iOS**: Same Apple Developer account for both.
  - Stage: scheme `Birdzy-Dev`, config `Release-Dev`.
  - Prod: scheme `Birdzy`, config `Release`.  
    You can use one distribution certificate and different provisioning profiles (or the same profile if bundle IDs are set up), or separate certs if you prefer.

---

## What you need for CI/CD

### 1. GitHub repository

- Repo with branches: `development`, `main`, and optionally `release`.

### 2. GitHub Actions secrets

Add under **Settings → Secrets and variables → Actions**.

#### Android (same for stage and prod)

| Secret                      | Description                                              | Example / note                                |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64 of `android/app/src/prod/minerals-upload-key.jks` | `base64 -i minerals-upload-key.jks \| pbcopy` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password                                        | From `keystore.properties`                    |
| `ANDROID_KEY_ALIAS`         | Key alias                                                | `upload`                                      |
| `ANDROID_KEY_PASSWORD`      | Key password                                             | From `keystore.properties`                    |

One keystore is enough for both dev and prod builds.

#### Android uploads (Play Console)

| Secret                              | Description                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `ANDROID_PLAY_SERVICE_ACCOUNT_JSON` | The **raw JSON** of a Google Play service account key with access to upload releases |

#### iOS (for TestFlight / App Store)

The iOS workflow jobs build + export an **IPA** and upload to **TestFlight**. They need code signing:

| Secret                    | Description                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `IOS_CERT_P12_BASE64`     | Distribution certificate (.p12) as base64                                                     |
| `IOS_CERT_P12_PASSWORD`   | .p12 password                                                                                 |
| `IOS_PROFILE_DEV_BASE64`  | Dev provisioning profile (.mobileprovision) as base64 (bundle id `com.trackzio.minerals.dev`) |
| `IOS_PROFILE_PROD_BASE64` | Prod provisioning profile (.mobileprovision) as base64 (bundle id `com.trackzio.minerals`)    |
| `IOS_KEYCHAIN_PASSWORD`   | Any random password for the temporary CI keychain                                             |

Or use **Fastlane match** later if you want to centralize signing.

Without these, the iOS job will fail.

#### iOS uploads (App Store Connect API)

| Secret                     | Description                               |
| -------------------------- | ----------------------------------------- |
| `APPSTORE_ISSUER_ID`       | App Store Connect API Issuer ID           |
| `APPSTORE_API_KEY_ID`      | App Store Connect API Key ID              |
| `APPSTORE_API_PRIVATE_KEY` | The **contents** of the `.p8` private key |

#### Optional (for uploads)

| Secret                          | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | For Firebase / Crashlytics if used in CI               |
| `APP_STORE_CONNECT_API_KEY_*`   | For automated TestFlight/App Store upload via Fastlane |

### 3. Local setup to export Android keystore for CI

```bash
# From project root
cd android/app/src/prod
base64 -i minerals-upload-key.jks | pbcopy   # macOS; paste into ANDROID_KEYSTORE_BASE64
```

Never commit the `.jks` file or `keystore.properties` with real passwords. Use CI secrets only.

---

## Workflows in this repo

| File              | When it runs                | Destination                            | What it does                |
| ----------------- | --------------------------- | -------------------------------------- | --------------------------- |
| `ci.yml`          | Push / PR to any branch     | —                                      | Lint + unit tests           |
| `build-stage.yml` | Push to `development`       | **Open testing / TestFlight external** | Build + upload dev AAB/IPA  |
| `build-prod.yml`  | Push to `main` or `release` | **Internal testing**                   | Build + upload prod AAB/IPA |

Artifacts are also uploaded to the Actions run for debugging.

---

## Quick reference: npm scripts used in CI

| Destination          | Android (dev)           | Android (prod)           | iOS (dev)       | iOS (prod)       |
| -------------------- | ----------------------- | ------------------------ | --------------- | ---------------- |
| **Stage**            | `android:build:dev:aab` | —                        | `ios:build:dev` | —                |
| **Internal testing** | —                       | `android:build:prod:aab` | —               | `ios:build:prod` |

Environment is switched by the scripts (`env:dev` / `env:prod`).
