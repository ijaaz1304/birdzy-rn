/**
 * Explore Near You Service
 * Business logic layer for the Explore map feature.
 */

import { validateExploreList } from "./exploreListValidation";
import { exploreApi } from "./explore.api";
import {
  ExploreNearYouRequestBody,
  ExploreNearYouQueryParams,
  ExploreArchetypeCard,
  ExploreTabsCount,
  ExplorePagination,
  ExploreMapGeoJSON,
} from "./explore.api.types";
import { ApiException, normalizeError } from "@/services/api/errors";
import { abortError } from "@/features/explore/utils/abortableRequest";
import {
  mapQueries,
  mergeMapGeoJSON,
  validateMapGeoJSON,
} from "./exploreGeoJSON";
import { archetypeService } from "@/services/archetype/archetype.service";
import { EXPLORE_MAP_FILTERS } from "@/features/explore/content/explore.config";

class ExploreService {
  private filterItems: ReturnType<
    typeof archetypeService.getFilterItems
  > | null = null;
  private filterItemsAt = 0;
  /** Fetch nearby archetypes for a location, with optional filters/radius in the request body. */
  async fetchExploreNearYou(
    body: ExploreNearYouRequestBody,
    query?: ExploreNearYouQueryParams,
    signal?: AbortSignal
  ): Promise<{
    data: ExploreArchetypeCard[];
    tabs: ExploreTabsCount;
    pagination: ExplorePagination;
  }> {
    try {
      const response = await exploreApi.fetchExploreNearYou(
        body,
        query,
        signal
      );
      if (response?.error) {
        throw new ApiException(
          response.reason || "Failed to fetch nearby birds"
        );
      }
      const validated = validateExploreList(response);
      return {
        data: validated.data,
        tabs: response.tabs,
        pagination: response.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Map data is independent of paginated cards and seasonal list tabs. */
  async fetchExploreMap(
    body: ExploreNearYouRequestBody,
    signal?: AbortSignal
  ): Promise<ExploreMapGeoJSON> {
    const group = new AbortController();
    const cancel = () => group.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) group.abort();
    try {
      // The gate retains Bird's 300ms spacing and caps simultaneous map reads at two.
      const collections = await Promise.all(
        mapQueries(body).map(async (query) => {
          if (group.signal.aborted) throw abortError();
          const response = await exploreApi.fetchMapGeoJSON(
            query,
            group.signal
          );
          if (group.signal.aborted) throw abortError();
          const failure = response as unknown as {
            error?: boolean;
            reason?: unknown;
          } | null;
          if (failure?.error === true)
            throw new ApiException(
              typeof failure.reason === "string"
                ? failure.reason
                : "Unable to load map activity."
            );
          return validateMapGeoJSON(response);
        })
      );
      return mergeMapGeoJSON(collections, body);
    } catch (error) {
      group.abort();
      throw error;
    } finally {
      signal?.removeEventListener("abort", cancel);
    }
  }

  /** Filter category options for the Explore filter sheet — reuses the existing archetype filter-items call, not a new endpoint. */
  async getFilterItems() {
    if (!this.filterItems || Date.now() - this.filterItemsAt > 5 * 60 * 1000) {
      this.filterItemsAt = Date.now();
      this.filterItems = archetypeService.getFilterItems().then((data) => {
        if (
          ![
            data?.birdSize,
            data?.birdType,
            data?.conservationStatus,
            data?.habitat,
          ].some((values) => Array.isArray(values) && values.length > 0)
        )
          throw new Error("Filter options are unavailable.");
        return {
          ...data,
          birdSize: [
            "Very Small",
            "Small",
            "Medium-Small",
            "Medium",
            "Large",
            "Very Large",
          ],
        };
      });
      this.filterItems.catch(() => {
        this.filterItems = null;
      });
    }
    return this.filterItems;
  }

  /** Filter sheet options limited to the traits the map endpoint can filter by. */
  async getExploreFilterOptions(): Promise<Record<string, string[]>> {
    const options = (await this.getFilterItems()) as Record<string, unknown>;
    const scoped = Object.fromEntries(
      EXPLORE_MAP_FILTERS.flatMap((key) => {
        const values = options?.[key];
        return Array.isArray(values) && values.length ? [[key, values]] : [];
      })
    ) as Record<string, string[]>;
    if (!Object.keys(scoped).length)
      throw new Error("Filter options are unavailable.");
    return scoped;
  }
}

export const exploreService = new ExploreService();
