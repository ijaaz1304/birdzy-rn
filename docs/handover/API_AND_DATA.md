# Birdzy — APIs, data and integrations

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Request ownership

App API entry/reference: [src/services/api/features/core.api.ts](../../src/services/api/features/core.api.ts). Environment resolution: [src/constants/env.ts](../../src/constants/env.ts). Account/session entry: [src/features/auth/auth.store.ts](../../src/features/auth/auth.store.ts).

Trace the actual client for authorization, refresh, multipart boundaries, timeouts and error normalization. Do not assume every feature uses one transport: provider lookups, Firebase operations and separate appraisal services can differ. An API method existing in source is not proof the endpoint is available on the deployed host.

## Data identities and boundaries

- **Public record/archetype:** the catalogue identity returned by the domain backend.
- **Saved specimen:** the account’s editable saved record, with its own identity and collection membership.
- **Collection:** the grouping identity; do not pass a display name where an object ID is required.
- **Account/guest:** owns private records and entitlements. Clear or invalidate private caches and in-flight work on account changes.
- **Store transaction:** purchase identity used for durable verification/recovery; not interchangeable with a UI offer label.
- **Media:** local preview/capture versus uploaded URL. Preserve the selected media through crop/upload, and do not persist temporary provider URLs as bundled assets.

Birdzy map observations carry a separate observation ID; match list species through `birdsLifeId`, then navigate/save with the archetype or specimen ID required by the target screen.

## API path discovery

These are path declarations found in source, intended as navigation aids for a developer. They are **not** a live availability matrix and may include compatibility helpers. Parameterized URLs and paths assembled dynamically must be checked in the linked source; generated lists alone are not an API contract.

- `/auth/forgot-password` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/guest-login` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/login` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/me` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/parse-google-purchasetoken` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/referrals` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/refresh-auth-token` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/resend-verification-mail` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/reset-password` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/signup` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/social-login/apple` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/social-login/google` — [src/services/api/axios.ts](../../src/services/api/axios.ts)
- `/auth/subscribe/apple` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/subscribe/google` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/unsubscribe/apple` — [src/constants/api.ts](../../src/constants/api.ts)
- `/auth/unsubscribe/google` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/ai/identify` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/ai/identify-sound` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/explore-map-geojson` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/explore-near-you` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/fetchAll` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/filteritems` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/getDetails` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/identified/add` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/specimens-of-the-day` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/stats` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/step-by-step` — [src/constants/api.ts](../../src/constants/api.ts). **Temporary (testing):** [src/services/archetype/archetype.service.ts](../../src/services/archetype/archetype.service.ts) currently ignores the caller body and always posts `STEP_BY_STEP_TEST_REQUEST` (`location` 3.7/101.7, `seenDate` `2026-06-26T10:00:00Z`, `birdSize` `["Small","Medium-Small"]`). Affects wizard DiagnosisLoading, Near You catalogue, and collection preview. Remove before shipping real wizard answers.
- `/core/archetypes/wishlist/add` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/archetypes/wishlist/remove` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/chat` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/add` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/delete` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/fetchAll` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/getDetails` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/stats` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/collections/update` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/gallery/audio` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/add` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/delete` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/fetchAll` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/filteritems` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/getDetails` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/stats` — [src/constants/api.ts](../../src/constants/api.ts)
- `/core/specimen/update` — [src/constants/api.ts](../../src/constants/api.ts)
- `/device` — [src/constants/api.ts](../../src/constants/api.ts)
- `/gallery/audio` — [src/constants/api.ts](../../src/constants/api.ts)
- `/got-bitten` — [src/constants/api.ts](../../src/constants/api.ts)
- `/maps/geocode` — [src/constants/api.ts](../../src/constants/api.ts)
- `/maps/places/search` — [src/constants/api.ts](../../src/constants/api.ts)
- `/maps/reverse-geocode` — [src/constants/api.ts](../../src/constants/api.ts)
- `/maps/static` — [src/constants/api.ts](../../src/constants/api.ts)

## External service configuration

- Core/domain API: resolve this app’s origin from [src/constants/env.ts](../../src/constants/env.ts).
- Firebase: review tracked native configuration, rules/indexes and Firebase initialization before changes to feeds, notifications or media.
- Billing: [src/features/subscription](../../src/features/subscription) owns the client purchase/restore path; store product setup and backend confirmation still need console/backend ownership.
- [src/features/explore/services/explore.api.ts](../../src/features/explore/services/explore.api.ts)
- [src/services/ai/ai.service.ts](../../src/services/ai/ai.service.ts)

## Change approach for an API contract

1. Capture an approved example of the request/response, keeping credentials and personal data out of the document.
2. Confirm method, route, base URL, auth, query/body fields, identifier type and page-index convention.
3. Update request/response types, transport, mapper, state lifecycle and every affected screen call site together.
4. Distinguish completed-empty, permission/limit, server/network failure and malformed data; keep retry behavior appropriate to read versus mutation semantics.
5. Test stale response/account switching, pagination duplicates and rollback after failed optimism.
6. Update this guide, the relevant specialist API doc and [CHANGELOG.md](CHANGELOG.md), including any required backend deployment coordination.

## Identification photo on specimen add — 2026-11-06

`POST /core/specimen/add` receives `imageUrls` with the user photo first, then catalogue URLs, plus `userCapturedImages` for that same photo. The stored URL is `https://storage.googleapis.com/{bucket}/posts/images/...`, not a token download URL. `PATCH /core/specimen/update` must not include `imageUrls`, `images`, `image_urls`, or `userCapturedImages`. No new Storage rule is required. `fetchAll` may prefix a catalogue folder onto the stored URL; the client displays the inner `https://` URL. Live backend acceptance of this payload is not yet recorded.

## Explore map method correction — 2026-11-04

Explore uses `POST /core/archetypes/explore-map-geojson` with no request body; explicit `bbox` and scalar trait filters remain query parameters. This matches the Shroomzy client in `Shroom-Ai/src/services/api/features/explore.api.ts`. The previously implemented GET returned a user-reported 404 from the Bird API. The client still expects a raw GeoJSON FeatureCollection and preserves authentication, cancellation and independent map rate limiting. A successful authenticated POST against the deployed Bird backend remains to be verified; the method change is verified by mocked client tests, not a live response.

## Audit corrections — 2026-11-04

`flattenBirdSpecimenUpdate` now preserves explicit empty arrays for editable list fields, instead of silently discarding clearing requests. Unknown/immutable fields remain excluded. Mock contract regressions cover this; live clearing semantics still require backend acceptance.

Notification-list refresh uses `feedService.fetchFeedNotificationDocuments` and the existing Firestore subscription remains active. Refresh results are scoped to the current owner/generation; stale responses cannot repopulate a different account's state. No new HTTP endpoint was invented.
