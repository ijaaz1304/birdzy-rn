# Birdzy Explore optimization audit and fixes

Date: 2026-11-27. Branch: `codex/explore-near-optimization`.
Base: fetched `origin/codex/dark-mode`, `9850d3c`. Work was isolated in a linked worktree; the original Birdzy checkout was not edited or switched. The original dependencies were reused locally for verification, without dependency/version/environment changes.

## Contract and product boundaries

Birdzy is not the Mushroom or Plant Explore flow. Preserve:

- `POST /core/archetypes/explore-near-you` with **location only in the HTTP body**, and page/tab query parameters. Do not replace it with Mushroom v2 or send bbox, radius or traits to this list route.
- Map GeoJSON POST with bbox and scalar Bird trait query parameters. The selected location defines the existing 100 km map radius; panning does not change this query.
- `birdsLifeId`, `isSpottedNow`, `spottedNowCount`, Year-round and existing Bird filters (`birdSize`, `birdType`, `conservationStatus`, `habitat`). No GBIF/fruiting-season/edibility/plant season fields were introduced.
- Filters apply to the map. The dedicated Results resolver reads nearby Year-round cards and matches the filtered map's species, retaining its 15-page/300-card bound. Do not make the location-only list pretend to implement server trait filtering.
- Existing direct wishlist toggle and failure alert, sound/detail navigation, native-map unavailable fallback, fixed selection-circle design and expanded minimize control. No Mushroom confirmation/pin/geodesic-circle or Plant locked-bbox/city-provider flow was ported.

Plantzy's local `a58d758` and the Shroomzy optimization work were used only as implementation-pattern references: early independent dispatch, bounded request queues, coherent caches, shared mutation ownership and stable native source data.

## Findings fixed

### Requests, caching and pagination

The previous store had no completed-result LRU caches and an unchanged successful query could remain fresh indefinitely. Map key suppression also hid recovery/expiry. Added separate bounded first-page, continuation-page and map caches (12 entries each, three-minute original-age TTL). A continuation belongs to its page-one snapshot identity; expired/revalidated first-page data cannot be mixed with a still-fresh older page two. Equivalent tab round trips can reuse fresh data. Map filter changes still do not refetch or reset the unfiltered list.

Failed page two formerly retried page one. Retry now preserves existing cards and repeats the failed continuation page. Duplicate-only, empty and non-advancing pages stop further automatic reads through `paginationStalled`, preserving server totals instead of claiming a smaller complete dataset. An explicit Refresh reloads both endpoints and keeps current cards during replacement; map-only retry stays independent.

Ready list HTTP dispatch starts before map-loading state publication. Request gates retain Bird's existing **300 ms start spacing**, but now bound simultaneous requests to **two per endpoint**. Map bbox/habitat reads can run independently behind that gate; one failure cancels its group. Independent map/list cooldowns and bounded read-only 429/503 recovery remain. Mutations were not given automatic retry behavior.

### Map-filter and filtered-results races

A tab debounce captured old map filters; applying new map-only filters during that wait could later replace the new map with the old filter query. The delayed map start now reads the committed filters. Regression: a new filter during tab debounce results in one filtered map request and the correct tab list, without a third unfiltered map read.

The filtered resolver updated React state on location change but left its imperative `stateRef` pointing at the previous place until rerender. Another effect in the same commit could request page two at the new location and merge old-place cards. Synchronous snapshot publication now resets state/ref together before the next read. Pending ownership blocks duplicate reads; cancellation/session generations reject obsolete results, and non-advancing pages stop the bounded resolver. Its Year-round matching and page cap are unchanged.

### Account/session and wishlist ownership

Pending stars were local to a cell, so duplicate instances or a recycled cell could start the same operation again. The previous completion guard also compared access tokens, losing successful changes after an ordinary token refresh. Operations now belong to account/session/archetype, share pending/optimistic state across instances and remounts, and use an operation token plus session generation for completion. Existing direct-toggle/error-alert behavior remains.

Account cleanup invalidates the session before its awaited storage work, protecting late Explore responses and mutations. Screen scopes reset account caches; only same-account/session geography may survive screen exit. Personal lists/pages always clear on exit. Wishlist events invalidate list/page caches even while no Explore screen is mounted, without triggering repeated full location searches. Invalidated in-flight responses cannot refill those caches.

### Native source, image and search work

Cluster reads already used 200-leaf native batches, but accumulated every full Feature and removed selected observations from the source. They now retain only unique BirdLife IDs across batches and draw selection over a stable source. A memoized native activity source/layer boundary avoids unrelated list/overlay updates rebuilding it. The existing fixed selection-circle geometry, zoom behavior and map presentation controls were preserved; native expand/collapse still remounts the map.

Explore cards/expanded previews use a measured FastImage slot. Visible images retain high priority; a small low-priority visible buffer warms **only FastImage**, avoiding a second RN Image preload for Explore. Lists use small render windows, including the horizontal preview. Existing non-Explore callers retain their two-cache warming behavior; their application URI/readiness hints are now bounded/expiring, with rejected native preload recovery. No new CDN/thumbnail endpoint was assumed.

Compact/expanded fields share a draft. Only the visible focused input may read suggestions; hidden reads and stale blur timers cancel, and late reverse-place labels cannot overwrite typing. Geocoder cache hits update LRU order without extending the original one-minute TTL. The provider, geographic suggestion scope, permission/GPS flows and 50-entry search limit remain. Screen search/camera dependencies use coordinates, so reverse-geocoded name changes do not trigger another search or camera reset.

### Boundary validation and measurement

The list service validates Bird IDs, card/photo types, pagination and counts before results enter rendering/caches. Repeated first-page archetype IDs deduplicate while server totals remain untouched. Valid empty areas remain valid; nonempty maps with no usable coordinates now fail rather than appear as a false successful empty area. No observation IDs are synthesized without an identity contract.

Development-only aggregate counters record actual HTTP dispatch/outcome durations and result-cache hit/miss counts. They retain no location, identifiers, URLs or request/response payloads. Native FPS/memory and real network/CDN performance still require release-device traces; unit tests do not establish numerical gains.

## Validation and remaining acceptance

Baseline before changes: **14 Explore suites / 65 tests passed** (36.206 seconds).
Post-change scoped validation: **20 suites / 101 tests passed** (2.175 seconds), including snapshot expiry, targeted retry, stale-map-filter debounce, filtered-resolver location changes, duplicate/recycled stars, token refresh/logout, stable cluster source, request concurrency, native fallback/minimize and strict Bird HTTP payloads.

Final full-suite/lint/type/doc results are recorded in the dated CHANGELOG implementation entry. No new dependency installation, environment/token change, native build, live backend request or device/FPS/heap validation was performed. The original native-map remount, CDN thumbnail/cache policy, backend page/count/season coverage and supported device performance remain open; owner unassigned. No claim of complete production verification or “perfect” latency is made.

### Executed publication checks

- Scoped Explore + image hints: **20 suites / 101 tests passed**, 2.175 seconds.
- Full optimized checkout: **104 passed / 1 failed suites**, **901 passed / 2 failed tests**. Untouched same-base original checkout: **99 passed / 1 failed suites**, **869 passed / 2 failed tests**. The same camera ThemeProvider fixture fails in both; no new failing suite was introduced. The exact tests are recorded in CHANGELOG.
- Explicit RN lint: **0 errors / 20 warnings**. Global TypeScript reports two unrelated AskAIScreen legacy identification-type errors; no changed Explore production diagnostics reported.
- Handover checker passed: **14 pages / 308 local links** with optional sibling-portfolio notes. Whitespace passed. No native build/device/backend or numerical FPS/latency improvement is claimed.

The complete TypeScript diagnostic output was compared with the untouched same-base original checkout and matched exactly (the two AskAIScreen errors). There are no new type-check failures in this change.

## Requested full-check follow-up

The previously recorded baseline camera/type failures have now been fixed on this branch: camera layout fixtures provide real light/dark theme context, and Ask AI photo fallback consumes normalized `name` and `match.summary`. Full Jest now passes **106 suites / 909 tests**, and standard `tsc --noEmit --pretty false` passes. The earlier failing check totals above remain historical audit evidence. Device/release performance checks still require an available target; ADB had no connected phone and no iOS simulator was booted at inspection. See the latest CHANGELOG entry for actual follow-up checks.
