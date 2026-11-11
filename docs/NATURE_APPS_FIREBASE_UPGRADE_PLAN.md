# eMudhra security update: product and release brief

Reviewed: 4 November 2026.
Audience: product, engineering, QA and release teams. Reusable for any app; applicability must be confirmed for the app's platform and technology.

## The issue

Some app components continued trusting certificates connected to the compromised eMudhra certificate authority. An attacker in a position to intercept network traffic could use that trust to impersonate a service and potentially read or alter traffic.

This is a security exposure, not evidence that an app or its users have been compromised. Confirm whether the affected components are present in the version currently available to users.

## Where the issue is located

### Apple apps using Firebase Cloud Firestore

The affected area is the app's connection to Cloud Firestore, which supports cloud data features. The problem is in the affected Firestore client component included in the app, rather than the Firestore backend.

### Native Android release tooling using Firebase App Distribution

The affected area is the App Distribution Gradle plugin used by the build/release pipeline, if present. This finding does not mean every Firebase Android component needs upgrading.

### Other app technologies

Flutter/Dart, Unity and C++ apps can have additional affected platforms or components. Check the official advisory for the actual technology in use; do not assume the native Android finding covers every Android app.

## What needs to change

- **Affected Apple Firestore apps:** replace the affected Firestore component with a patched, compatible version. Firebase lists **12.19.3** as the older-line fix and **13.1.1 or later** on the newer line. Validate compatibility, then rebuild and publish the app.
- **Affected App Distribution tooling:** update the plugin to a patched version on the appropriate release line: **5.3.1 or later**, **4.2.1**, or **3.2.1**. Update and verify the pipeline; this plugin-only fix does not require a new app release.
- **Other affected technologies:** use the component-specific patched versions and delivery steps in the advisory.

Choose the smallest compatible security update. A full app-framework upgrade, new features or a redesign is not automatically required.

For affected installed app components, a server-side change alone does not replace the vulnerable component already on users' devices. Users must receive and install the patched app release.

Official reference: [Firebase eMudhra advisory](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca?hl=en).

## What the team needs to do

1. **Confirm applicability.** Identify the app technology, affected platform and component, including any external release tooling.
2. **Confirm the live version.** Check what was included in the app currently distributed to users. A prepared development update does not prove the live app is fixed.
3. **Review the security update.** Confirm the selected replacement is patched and compatible, and keep unrelated work separate.
4. **Validate core journeys.** Test launch, sign-in, cloud data access, uploads, notifications and other features that depend on the updated components. Confirm production configuration and monitoring work correctly.
5. **Approve delivery.** Assign an engineering owner, QA owner and release owner. Record the validation results and any blockers.
6. **Release where required.** Validate an app update through the appropriate testing channel before production publication. Tooling-only fixes should be verified in the pipeline.
7. **Track completion.** Record the released version, publication date and user adoption. Encourage users to update when their installed app needs the fix.

## When the issue can be marked complete

- Applicability and the version currently in use are confirmed.
- The affected component has been replaced with a patched version.
- Compatibility and affected user journeys have passed validation.
- The patched app is published where an app release is required, or the patched tooling is active where only a pipeline update is required.
- User update adoption is tracked for affected installed apps.
- Remaining exceptions and owners are recorded explicitly.

This brief does not certify that a particular app has been patched, tested or released. Record evidence separately for each app being reviewed.

## Copy-ready Cursor prompt

Use this in Cursor with the relevant app available. The expected output is a product-level assessment and action plan, not code changes.

```text
Assess the app in this workspace against Firebase's eMudhra certificate-compromise advisory:
https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca?hl=en

Give a plain-language product and release brief covering:
1. What the issue is and whether this app is affected.
2. Where it applies: platform, customer-facing service or release tooling—not source-code locations.
3. What component needs upgrading and the compatible patched version.
4. What is already prepared versus what still needs validation or delivery.
5. Which user journeys need testing and whether an app release or only a pipeline update is required.
6. Owners, blockers and evidence needed to close the issue.

Check the actual app technology and current production version where evidence is available. Distinguish affected Apple Firestore clients, native Android App Distribution tooling, and other technologies covered by the advisory. Do not assume all platforms need the same fix.

Do not include code paths, commands, implementation snippets, branch names or commit IDs in the brief. Do not claim a breach, successful testing or a completed rollout without evidence. Keep unavailable production information explicitly unverified.

Make no edits, upgrades, builds, pushes or releases. Return the assessment and recommended next actions for review. A broader framework upgrade is separate from the focused security remediation unless compatibility requires it.
```

## Copy-ready Claude / Claude Code prompt

Use this with the app's platform, component-version information and release status. Claude Code may inspect an available workspace; Claude without access should identify missing evidence rather than claim verification.

```text
Prepare a generic, product-level security update brief for the app being reviewed, using Firebase's official eMudhra advisory:
https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca?hl=en

Explain the issue, its location within the product or release process, what needs upgrading, the compatible patched version, required validation and the remaining release actions. Use plain language suitable for product, QA and release teams. Do not include code locations, commands, source changes, branch names or commit references.

Determine applicability from the actual platform and technology. Apple Firestore client updates, native Android App Distribution plugin updates and other affected technologies have different remediation requirements. Do not recommend every SDK be upgraded by default.

Separate confirmed facts from assumptions. Confirm the component in the app currently available to users before calling production affected or fixed. If production evidence or external pipeline access is missing, mark it unverified and state what evidence is needed.

Recommend the smallest compatible security update. Include the affected user journeys to test, whether users need a new app release, responsible roles and clear completion criteria. Explain that exposure does not itself establish a data breach.

Do not edit, upgrade, build, push or release anything. If you cannot inspect the app, provide a conditional action plan and the missing-information checklist. Deliver a concise assessment that another app team can reuse without app-specific names or repository details.
```
