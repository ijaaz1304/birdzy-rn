# Birdzy: eMudhra Firestore remediation

Date: 2026-11-04. This is a dependency security patch; release/device acceptance is still required.

## Scope and reason

The prior local iOS lock contained FirebaseFirestore 12.8.0. Firebase identifies Apple Firestore SDKs before 12.19.3 as affected by the compromised eMudhra intermediate certificate authority trust issue. This does not establish that this app's users were attacked. See the [official advisory](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca?hl=en).

## Dependency approach

The Podfile uses `$FirebaseSDKVersion = '12.19.0'` as the compatible Firebase 12.19 base for the existing React Native Firebase modules, plus the explicit `pod 'FirebaseFirestore', '12.19.3'` requirement in the app target. The actual security requirement is the resolved **FirebaseFirestore and FirebaseFirestoreInternal 12.19.3** pods; the Firebase umbrella/Analytics pod does not need to report 12.19.3. A global 12.19.3 override alone cannot resolve because FirebaseAnalytics/IdentitySupport is published as 12.19.0.

This is a temporary native SDK override outside the wrapper's original tested defaults. It avoids an unrelated modular-JavaScript/SPM major migration; compatibility must be checked in release builds and on devices. Keep the explicit Firestore patch pin until a reviewed React Native Firebase upgrade supplies a patched SDK by default. Do not remove it simply because another Firebase component has a different patch number.

No JavaScript Firebase package, application logic, Android dependency, Firebase project, credentials or environment variables are changed for this patch. `$FirebaseSDKVersion` is a Ruby Podfile setting, not an environment variable. Blank environment examples are unchanged.

## Android finding

No Firebase App Distribution Gradle plugin reference was found in this app's Android build configuration. That plugin is the native Android component identified in this specific advisory. Its presence in a React Native Firebase package's SDK-default metadata is not evidence that the plugin is applied. If CI later uses the plugin, require patched version 5.3.1+ (or the advisory's patched older-major alternatives). No Android dependency changes are needed for the identified Apple Firestore issue.

## Install and verify before releasing

1. Install from the committed Podfile/lockfile with the repository's Ruby/CocoaPods setup. Do not delete the lockfile or run a general unscoped dependency upgrade for release preparation.
2. Check `ios/Podfile.lock` and, after installation, `ios/Pods/Manifest.lock`: FirebaseFirestore and FirebaseFirestoreInternal must be 12.19.3. Review any different resolved version against the advisory before proceeding.
3. Build and archive the production iOS scheme using [the release guide](handover/RELEASE.md); verify the production bundle identifier, Firebase plist, signing and a fresh store build number.
4. On a real device, test Firebase initialization, Firestore reads/writes/listeners, feed updates, uploads, sign-in, Remote Config and push registration. Verify Crashlytics symbols and one controlled test report in the appropriate non-production test channel. Check Analytics consent behavior remains correct.
5. Test through TestFlight, publish the security update, and encourage installed users to update. Server changes or an OS update alone do not patch the old app's embedded Firestore certificate bundle.

## Evidence and acceptance

Dependency resolution/check results are recorded in [the handover changelog](handover/CHANGELOG.md). No app builds, device tests, store uploads or rollouts are performed as part of this patch; the user will run builds. Mobile/release owner and QA acceptance remain unassigned/open in [the handover checklist](handover/HANDOVER_60_DAYS.md). An updated local dependency is not a remediated installed user build.

## Review branch

Security branch: `codex/emudhra-firestore-security`. Source: `main` at `1ca722a82760236f7b397ad74c33ee2f5bcfb15c`. All remote heads were fetched before selecting the newest remote commit. No existing branch is pushed by this patch.
