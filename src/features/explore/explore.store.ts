import { EXPLORE_MAP_FILTERS } from "./content/explore.config";
import { create } from "zustand";
import { exploreService } from "@/features/explore/services/explore.service";
import {
  ExploreLocation,
  ExploreTab,
  ExploreArchetypeCard,
  ExploreMapGeoJSON,
  EMPTY_EXPLORE_MAP,
  ExploreTabsCount,
  ExplorePagination,
  ExploreNearYouRequestBody,
} from "@/features/explore/services/explore.api.types";
import { FilterState } from "../../organisms/FilterModal/types";
import { EXPLORE } from "@/features/explore/content/explore.config";
import { waitForRequest } from "@/features/explore/utils/abortableRequest";
import { isValidCoordinate } from "@/features/explore/utils/locationCoordinates";

const FIRST_PAGE = 1;
const PAGE_SIZE = 20;
const FILTER_FIELDS = EXPLORE_MAP_FILTERS;

function normalizeFilters(filters: FilterState): FilterState {
  return Object.fromEntries(
    FILTER_FIELDS.flatMap((key) => {
      const values = [...new Set(filters[key] ?? [])].sort();
      return values.length ? [[key, values]] : [];
    })
  );
}

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
  loadMore: () => Promise<void>;
  reset: () => void;
}

const emptyResults = {
  data: [] as ExploreArchetypeCard[],
  tabs: null as ExploreTabsCount | null,
  pagination: null as ExplorePagination | null,
  isLoading: false,
  isLoadingMore: false,
  hasSearched: false,
  error: null as string | null,
};

export const useExploreStore = create<ExploreState>()((set, get) => {
  let generation = 0;
  let controller: AbortController | null = null;
  let queryKey: string | null = null;
  let mapGeneration = 0;
  let mapController: AbortController | null = null;
  let mapKey: string | null = null;
  const mapState = {
    geoJSON: EMPTY_EXPLORE_MAP,
    isMapDataLoading: false,
    mapDataError: null as string | null,
  };
  const refreshMap = async (body: ExploreNearYouRequestBody, force = false) => {
    const key = JSON.stringify(body);
    if (!force && key === mapKey) return;
    mapController?.abort();
    const requestGeneration = ++mapGeneration;
    const request = new AbortController();
    mapController = request;
    mapKey = key;
    set({
      geoJSON: EMPTY_EXPLORE_MAP,
      isMapDataLoading: true,
      mapDataError: null,
    });
    try {
      const geoJSON = await exploreService.fetchExploreMap(
        body,
        request.signal
      );
      if (mapGeneration === requestGeneration)
        set({ geoJSON, isMapDataLoading: false });
    } catch (error) {
      if (mapGeneration !== requestGeneration) return;
      set({
        isMapDataLoading: false,
        mapDataError:
          error instanceof Error
            ? error.message
            : "Unable to load map activity. Please retry.",
      });
    }
  };
  const invalidate = () => {
    generation++;
    controller?.abort();
    controller = null;
  };
  const firstPage = async (delay = 0, force = false) => {
    const state = get();
    if (!state.searchedLocation) return;
    const body: ExploreNearYouRequestBody = {
      location: state.searchedLocation,
      radius: EXPLORE.SEARCH_RADIUS_KM,
    };
    const key = JSON.stringify([body, state.activeTab]);
    if (
      !force &&
      key === queryKey &&
      !state.error &&
      (state.isLoading || state.hasSearched)
    )
      return;
    invalidate();
    const requestGeneration = generation;
    const requestController = new AbortController();
    controller = requestController;
    queryKey = key;
    // Clear old-query data immediately, including during the debounce interval.
    set({ ...emptyResults, radius: body.radius!, isLoading: true });
    refreshMap({ ...body, ...state.filters });
    try {
      await waitForRequest(delay, requestController.signal);
      const result = await exploreService.fetchExploreNearYou(
        body,
        {
          pageNo: FIRST_PAGE,
          pageSize: PAGE_SIZE,
          tab: state.activeTab,
        },
        requestController.signal
      );
      if (generation !== requestGeneration) return;
      set({
        data: result.data,
        tabs: result.tabs,
        pagination: result.pagination,
        isLoading: false,
        hasSearched: true,
      });
    } catch (error) {
      if (generation !== requestGeneration) return;
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
    searchLocation: async (location) => {
      if (!isValidCoordinate(location.lat, location.lng)) return;
      set({ searchedLocation: location });
      await firstPage();
    },
    setTab: async (tab) => {
      if (get().activeTab === tab) return;
      set({ activeTab: tab });
      await firstPage(300);
    },
    applyFilters: async (filters) => {
      const normalized = normalizeFilters(filters);
      if (JSON.stringify(normalized) === JSON.stringify(get().filters)) return;
      set({ filters: normalized });
      const state = get();
      if (state.searchedLocation)
        await refreshMap({
          location: state.searchedLocation,
          radius: state.radius,
          ...normalized,
        });
    },
    retry: () => firstPage(0, true),
    retryMap: async () => {
      const state = get();
      if (state.searchedLocation)
        await refreshMap(
          {
            location: state.searchedLocation,
            radius: state.radius,
            ...state.filters,
          },
          true
        );
    },
    loadMore: async () => {
      const state = get();
      if (
        !state.searchedLocation ||
        !state.pagination ||
        state.isLoading ||
        state.isLoadingMore ||
        state.error ||
        state.data.length >= state.pagination.totalCount
      )
        return;
      const requestGeneration = generation;
      const requestController = new AbortController();
      controller = requestController;
      set({ isLoadingMore: true });
      try {
        const result = await exploreService.fetchExploreNearYou(
          {
            location: state.searchedLocation,
            radius: state.radius,
            ...state.filters,
          },
          {
            pageNo: state.pagination.pageNo + 1,
            pageSize: state.pagination.pageSize,
            tab: state.activeTab,
          },
          requestController.signal
        );
        if (requestGeneration !== generation) return;
        const cards = new Map(
          get().data.map((card) => [card.archetypeId, card])
        );
        result.data.forEach((card) => cards.set(card.archetypeId, card));
        const pagination =
          cards.size === state.data.length ||
          !result.data.length ||
          result.pagination.pageNo <= state.pagination.pageNo
            ? { ...result.pagination, totalCount: cards.size }
            : result.pagination;
        set({ data: [...cards.values()], pagination, isLoadingMore: false });
      } catch (error) {
        if (requestGeneration !== generation) return;
        set({
          isLoadingMore: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load more birds. Please try again.",
        });
      }
    },
    reset: () => {
      invalidate();
      queryKey = null;
      mapGeneration++;
      mapController?.abort();
      mapController = null;
      mapKey = null;
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
