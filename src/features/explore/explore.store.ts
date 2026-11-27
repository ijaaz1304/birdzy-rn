import { create } from "zustand";
import { EXPLORE, EXPLORE_MAP_FILTERS } from "./content/explore.config";
import { exploreService } from "./services/explore.service";
import {
  createExploreCache,
  EXPLORE_CACHE_TTL_MS,
} from "./services/exploreCache";
import { waitForRequest } from "./utils/abortableRequest";
import { isValidCoordinate } from "./utils/locationCoordinates";
import { getAccountSessionVersion } from "../../services/session/accountSession";
import { useWishlistInvalidationStore } from "../collection/wishlistInvalidation.store";
import { recordExploreMetric } from "./exploreDiagnostics";
import type { FilterState } from "../../organisms/FilterModal/types";
import { EMPTY_EXPLORE_MAP } from "./services/explore.api.types";
import type {
  ExploreLocation,
  ExploreTab,
  ExploreArchetypeCard,
  ExploreMapGeoJSON,
  ExploreTabsCount,
  ExplorePagination,
  ExploreNearYouRequestBody,
} from "./services/explore.api.types";

type Result = Awaited<ReturnType<typeof exploreService.fetchExploreNearYou>>;
type Snapshot = Result & { snapshot: number };
const FIRST_PAGE = 1;
const PAGE_SIZE = 20;
const fresh = (at: number | null) =>
  at !== null && Date.now() - at < EXPLORE_CACHE_TTL_MS;
const normalizeFilters = (filters: FilterState): FilterState =>
  Object.fromEntries(
    EXPLORE_MAP_FILTERS.flatMap((key) => {
      const values = [...new Set(filters[key] ?? [])].sort();
      return values.length ? [[key, values]] : [];
    })
  );
interface ExploreState {
  searchedLocation: ExploreLocation | null;
  activeTab: ExploreTab;
  filters: FilterState;
  data: ExploreArchetypeCard[];
  geoJSON: ExploreMapGeoJSON;
  isMapDataLoading: boolean;
  mapDataError: string | null;
  tabs: ExploreTabsCount | null;
  pagination: ExplorePagination | null;
  paginationStalled: boolean;
  radius: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasSearched: boolean;
  error: string | null;
  searchLocation: (location: ExploreLocation) => Promise<void>;
  setTab: (tab: ExploreTab) => Promise<void>;
  applyFilters: (filters: FilterState) => Promise<void>;
  retry: () => Promise<void>;
  retryMap: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  invalidateListCache: () => void;
  setCacheScope: (scope: string) => void;
  reset: (keepMapCache?: boolean) => void;
}
const emptyResults = {
  data: [] as ExploreArchetypeCard[],
  tabs: null as ExploreTabsCount | null,
  pagination: null as ExplorePagination | null,
  paginationStalled: false,
  isLoading: false,
  isLoadingMore: false,
  hasSearched: false,
  error: null as string | null,
};
const mapState = {
  geoJSON: EMPTY_EXPLORE_MAP,
  isMapDataLoading: false,
  mapDataError: null as string | null,
};
export const useExploreStore = create<ExploreState>()((set, get) => {
  let generation = 0;
  let controller: AbortController | null = null;
  let queryKey: string | null = null;
  let queryAt: number | null = null;
  let currentSnapshot = 0;
  let nextSnapshot = 0;
  let mapGeneration = 0;
  let mapController: AbortController | null = null;
  let mapKey: string | null = null;
  let mapAt: number | null = null;
  let listRevision = 0;
  let failedPage = false;
  let scope: string | null = null;
  let session = getAccountSessionVersion();
  const listCache = createExploreCache<Snapshot>();
  const pageCache = createExploreCache<Result>();
  const mapCache = createExploreCache<ExploreMapGeoJSON>();
  const invalidate = () => {
    generation++;
    controller?.abort();
    controller = null;
  };
  const mapBody = (): ExploreNearYouRequestBody | null => {
    const state = get();
    return state.searchedLocation
      ? {
          location: state.searchedLocation,
          radius: state.radius,
          ...state.filters,
        }
      : null;
  };
  const refreshMap = async (
    body: ExploreNearYouRequestBody,
    force = false,
    keep = false
  ) => {
    const key = JSON.stringify(body);
    if (
      !force &&
      key === mapKey &&
      (get().isMapDataLoading || (!get().mapDataError && fresh(mapAt)))
    )
      return;
    mapController?.abort();
    const id = ++mapGeneration;
    const owner = getAccountSessionVersion();
    const request = new AbortController();
    mapController = request;
    mapKey = key;
    const cached = force ? undefined : mapCache.get(key);
    recordExploreMetric(`map-cache-${cached ? "hit" : "miss"}`);
    if (cached) {
      mapAt = cached.at;
      set({
        geoJSON: cached.value,
        isMapDataLoading: false,
        mapDataError: null,
      });
      return;
    }
    const pending = exploreService.fetchExploreMap(body, request.signal);
    set({
      ...(keep ? {} : { geoJSON: EMPTY_EXPLORE_MAP }),
      isMapDataLoading: true,
      mapDataError: null,
    });
    try {
      const geoJSON = await pending;
      if (id !== mapGeneration || owner !== getAccountSessionVersion()) return;
      mapAt = Date.now();
      mapCache.set(key, geoJSON);
      set({ geoJSON, isMapDataLoading: false });
    } catch (error) {
      if (id !== mapGeneration || owner !== getAccountSessionVersion()) return;
      set({
        isMapDataLoading: false,
        mapDataError:
          error instanceof Error
            ? error.message
            : "Unable to load map activity. Please retry.",
      });
    }
  };
  const firstPage = async (delay = 0, force = false, forceMap = false) => {
    const state = get();
    if (!state.searchedLocation) return;
    // Bird's list is location-only; traits and radius belong only to the map contract.
    const body = {
      location: state.searchedLocation,
      radius: EXPLORE.SEARCH_RADIUS_KM,
    };
    const key = JSON.stringify([body.location, state.activeTab]);
    if (
      !force &&
      key === queryKey &&
      !state.error &&
      (state.isLoading || (state.hasSearched && fresh(queryAt)))
    )
      return;
    const keep = state.data.length > 0 && (force || key === queryKey);
    invalidate();
    failedPage = false;
    const id = generation;
    const owner = getAccountSessionVersion();
    const revision = listRevision;
    const request = new AbortController();
    controller = request;
    queryKey = key;
    const cached = force ? undefined : listCache.get(key);
    recordExploreMetric(`list-cache-${cached ? "hit" : "miss"}`);
    if (cached) {
      queryAt = cached.at;
      currentSnapshot = cached.value.snapshot;
      set({
        data: cached.value.data,
        tabs: cached.value.tabs,
        pagination: cached.value.pagination,
        hasSearched: true,
        isLoading: false,
        isLoadingMore: false,
        paginationStalled: false,
        error: null,
      });
      const map = mapBody();
      if (map) void refreshMap(map);
      return;
    }
    const read = () =>
      exploreService.fetchExploreNearYou(
        body,
        { pageNo: FIRST_PAGE, pageSize: PAGE_SIZE, tab: state.activeTab },
        request.signal
      );
    const pending = delay === 0 ? read() : null;
    set({
      ...(keep ? {} : emptyResults),
      isLoading: true,
      isLoadingMore: false,
      paginationStalled: false,
      error: null,
      radius: body.radius,
    });
    const map = { ...body, ...state.filters };
    if (delay === 0) void refreshMap(map, forceMap, keep);
    try {
      if (delay > 0) await waitForRequest(delay, request.signal);
      const resultPromise = pending ?? read();
      if (delay > 0)
        void refreshMap({ ...body, ...get().filters }, forceMap, keep);
      const result = await resultPromise;
      if (id !== generation || owner !== getAccountSessionVersion()) return;
      currentSnapshot = ++nextSnapshot;
      queryAt = revision === listRevision ? Date.now() : null;
      if (revision === listRevision)
        listCache.set(key, { ...result, snapshot: currentSnapshot });
      set({
        ...result,
        isLoading: false,
        hasSearched: true,
        paginationStalled: false,
      });
    } catch (error) {
      if (id !== generation || owner !== getAccountSessionVersion()) return;
      set({
        isLoading: false,
        hasSearched: true,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load nearby birds. Please try again.",
      });
    }
  };
  return {
    ...emptyResults,
    ...mapState,
    searchedLocation: null,
    activeTab: "growingNow",
    filters: {},
    radius: EXPLORE.SEARCH_RADIUS_KM,
    setCacheScope(next) {
      if (scope === next && session === getAccountSessionVersion()) return;
      get().reset();
      scope = next;
      session = getAccountSessionVersion();
    },
    invalidateListCache() {
      listRevision++;
      listCache.clear();
      pageCache.clear();
      queryAt = null;
      queryKey = null;
    },
    async searchLocation(location) {
      if (!isValidCoordinate(location.lat, location.lng)) return;
      set({ searchedLocation: location });
      await firstPage();
    },
    async setTab(tab) {
      if (get().activeTab === tab) return;
      set({ activeTab: tab });
      await firstPage(300);
    },
    async applyFilters(filters) {
      const normalized = normalizeFilters(filters);
      if (JSON.stringify(normalized) === JSON.stringify(get().filters)) return;
      set({ filters: normalized });
      const body = mapBody();
      if (body) await refreshMap(body);
    },
    async retry() {
      if (failedPage) {
        set({ error: null });
        await get().loadMore();
      } else await firstPage(0, true);
    },
    refresh: () => firstPage(0, true, true),
    async retryMap() {
      const body = mapBody();
      if (body) await refreshMap(body, true, true);
    },
    async loadMore() {
      const state = get();
      if (
        !state.searchedLocation ||
        !state.pagination ||
        state.isLoading ||
        state.isLoadingMore ||
        state.paginationStalled ||
        state.error ||
        state.data.length >= state.pagination.totalCount
      )
        return;
      const id = generation;
      const owner = getAccountSessionVersion();
      const revision = listRevision;
      const request = new AbortController();
      controller = request;
      const page = state.pagination.pageNo + 1;
      const key = JSON.stringify([
        state.searchedLocation,
        state.activeTab,
        page,
        state.pagination.pageSize,
        currentSnapshot,
      ]);
      const cached = pageCache.get(key);
      recordExploreMetric(`page-cache-${cached ? "hit" : "miss"}`);
      const pending =
        cached?.value ??
        exploreService.fetchExploreNearYou(
          { location: state.searchedLocation, radius: state.radius },
          {
            pageNo: page,
            pageSize: state.pagination.pageSize,
            tab: state.activeTab,
          },
          request.signal
        );
      set({ isLoadingMore: true, error: null });
      try {
        const result = await pending;
        if (id !== generation || owner !== getAccountSessionVersion()) return;
        const cards = new Map(
          get().data.map((card) => [card.archetypeId, card])
        );
        result.data.forEach((card) => cards.set(card.archetypeId, card));
        if (revision === listRevision && !cached) pageCache.set(key, result);
        failedPage = false;
        set({
          data: [...cards.values()],
          pagination: result.pagination,
          isLoadingMore: false,
          paginationStalled:
            cards.size === state.data.length ||
            !result.data.length ||
            result.pagination.pageNo <= state.pagination.pageNo,
        });
      } catch (error) {
        if (id !== generation || owner !== getAccountSessionVersion()) return;
        failedPage = true;
        set({
          isLoadingMore: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load more birds. Please try again.",
        });
      }
    },
    reset(keepMapCache = false) {
      invalidate();
      get().invalidateListCache();
      if (!keepMapCache || session !== getAccountSessionVersion())
        mapCache.clear();
      session = getAccountSessionVersion();
      queryKey = null;
      queryAt = null;
      mapKey = null;
      mapAt = null;
      failedPage = false;
      mapGeneration++;
      mapController?.abort();
      mapController = null;
      set({
        ...emptyResults,
        ...mapState,
        searchedLocation: null,
        activeTab: "growingNow",
        filters: {},
        radius: EXPLORE.SEARCH_RADIUS_KM,
      });
    },
  };
});
useWishlistInvalidationStore.subscribe((state, previous) => {
  if (state.version !== previous.version)
    useExploreStore.getState().invalidateListCache();
});
