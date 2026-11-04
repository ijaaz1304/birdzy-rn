/**
 * Explore Near You Service
 * Business logic layer for the Explore map feature.
 */

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
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to fetch nearby birds"
        );
      }
      return {
        data: response.data,
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
    const collections: ExploreMapGeoJSON[] = [];
    // Serial bounded reads avoid a request burst for habitat unions/date-line splits.
    for (const query of mapQueries(body)) {
      if (signal?.aborted) throw abortError();
      const response = await exploreApi.fetchMapGeoJSON(query, signal);
      if (signal?.aborted) throw abortError();
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
      collections.push(validateMapGeoJSON(response));
    }
    return mergeMapGeoJSON(collections, body);
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
}

export const exploreService = new ExploreService();
