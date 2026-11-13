# Birdzy: backend-managed free scans

Updated: 2026-11-12. Branch: `codex/30-free-scans-from-be`. This is a client implementation based on Rockzy's backend usage contract. Server configuration and device acceptance are still open.

## Policy and API contract

The intended free allowance is **30 scans supplied and enforced by the backend**. The app does not define a replacement 30-scan cap. `GET /auth/me` and identification responses provide these top-level nonnegative integer fields:

- `successCount`: authoritative consumed usage for the displayed scan counter.
- `errorCount`: authoritative failure usage.
- `successThreshold`: total allowance, including values other than 30 or zero.
- `errorThreshold`: backend failure threshold.
- Optional `resetsAtError`: retained metadata. The app does not implement a failure reset timer or calculate a failure charge.

All four required fields must be present and valid before the app treats the snapshot as known. A partial or malformed response does not replace the last valid snapshot. This matches the inspected Rockzy contract; deployment of these fields in this app's backend has not been verified.

Backend quota rejection uses `aiErrorCode: "E004"`. Preserve its payload on HTTP errors and on a successful HTTP response containing a business error. It opens the existing upgrade/scan-limit UI rather than an unsuccessful-identification popup. It must not refresh authentication, log out, or automatically retry a quota rejection.

## Implemented client behavior

- Request sequencing prevents older responses replacing newer usage. Responses are associated with the account and session generation captured before the request; logout/account changes invalidate late results. Automatic JWT refresh within the same session still accepts returned usage.
- Snapshots are memory-only and account-scoped. Logout and account transitions clear cached usage. Profile refreshes are coalesced and a valid snapshot is reused for up to 60 seconds.
- Known exhausted usage blocks a free submission before upload. Unknown usage permits submission so the backend can decide; counters are hidden until known. A failed profile refresh never invents a new free allowance.
- Subscribed/premium and backend rewarded accounts bypass the free precheck. The backend still validates every operation.
- Attempt handles prevent concurrent duplicate submissions. Completing a success, failure, cancellation or showing a popup does not increment or decrement usage locally.
- Old device/guest/account ledgers are neither read nor migrated. Unused legacy keys can remain until storage/session cleanup; they have no effect on backend usage. Clearing local storage cannot grant scans.
- Camera counts use the returned threshold. Static subscription/FAQ copy no longer promises a fixed client allowance or a locally calculated failure grace period.

Photo identification (`POST /core/ai/identify`) and sound identification (`POST /core/ai/identify-sound`, as configured in the existing endpoint constants) update the same account usage snapshot. No client-owned photo/sound buckets remain. Existing multipart payload fields, timeouts and bounded HTTP 401 recovery are preserved. Both error paths route `E004` to limit UI.

## Source map

- `src/services/session/backendAiUsage.ts`: validation, ordered snapshots and E004 classification.
- `src/services/session/backendScanRequest.ts`: account/session guards and request-boundary accounting.
- `src/services/session/scanQuota.ts`: profile refresh, submission precheck and duplicate-attempt handles.
- `src/services/session/scanAllowance.ts`: attempt types/IDs only; no ledger or quota storage helpers.

Historical function names containing `daily`, `Today`, `increment` or `record` remain only where existing callers need compatibility. Identification increment/record helpers do not charge usage. Unrelated daily features retain their own behavior.

## Acceptance still required

Owner: **unassigned** for backend/API and mobile QA acceptance. No simulator, physical-device, signed-build or live backend scan checks were performed for this change, per the user's simulator instruction.

- Confirm all configured environments return the four usage fields on profile, successful identification, no match and E004 rejection; verify free accounts receive `successThreshold: 30` on the server.
- Verify scan 30 is accepted when appropriate and scan 31 is rejected by the server, including two devices on one account and simultaneous requests. Verify the backend's failure charging/reset policy independently.
- Verify guest-to-login, logout/relogin, account switching during a request, app restart, reinstall and clearing device data cannot reset server usage.
- Verify premium, restored purchases and rewarded accounts, then expiry/revocation. Verify E004 does not trigger auth refresh, logout, retry or failure charging in the UI.
- Verify unknown/partial profile usage, offline/timeouts/cancellation, expired JWT recovery and a backend threshold changed from 30. Check counter refresh and upgrade navigation on both platforms.
- Alternate photo and sound scans and verify both display the same returned account usage. Check audio trimming metadata and location still reach the server.


### Validation on 2026-11-12

Whole-app Jest run: 89 suites passed and 1 failed (784 tests passed / 2 failed). The same coreServices suite and its 2 failures were reproduced on an unchanged main archive; they concern the existing step-by-step hardcoded payload and specimen flightPattern behavior. Final scan/photo/sound/API/session/storage regression passed 10 suites / 87 tests.

Changed-file ESLint passed. Handover checker passed: 15 pages / 301 local links, blank/unique templates. `git diff --check` passed.

Automated tests use mocked backend responses; they do not verify backend deployment, the server-configured allowance of 30, simulator/device UX or store builds. Those acceptance items remain open with owner unassigned.

Implementation base commit: `8ef407e5b828d6ad43ffe42d881ba54c4fcb86c9`. Original checkout and responsiveness branch were preserved.

TypeScript: `tsc --noEmit --pretty false` passed.
