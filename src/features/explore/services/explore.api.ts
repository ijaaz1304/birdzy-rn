/**
 * Explore Near You API
 * Bird API contract: https://birds-api.trackzio.com/docs/core-module
 */

import { apiClient } from "@/services/api/axios";
import { createRequestGate } from "@/features/explore/utils/abortableRequest";
import { API_ENDPOINTS } from "@/features/explore/content/explore.config";
import {
  ExploreNearYouRequestBody,
  ExploreNearYouQueryParams,
  ExploreNearYouResponse,
  ExploreMapGeoJSON,
  ExploreMapQueryParams,
} from "./explore.api.types";

const requestExplore = createRequestGate(300);
const requestExploreMap = createRequestGate(300);

export const exploreApi = {
  /** POST returns a raw FeatureCollection; always bound requests to a bbox. */
  fetchMapGeoJSON: async (
    params: ExploreMapQueryParams,
    signal?: AbortSignal
  ): Promise<ExploreMapGeoJSON> => {
    if (!params.bbox) throw new Error("Map bounds are required.");
    const response = await requestExploreMap(
      () =>
        apiClient.post<ExploreMapGeoJSON>(
          API_ENDPOINTS.CORE.EXPLORE_MAP_GEOJSON,
          undefined,
          { params, signal }
        ),
      signal
    );
    return response.data;
  },
  /**
   * POST /core/archetypes/explore-near-you
   * Explore nearby bird archetypes based on a user's geographic
   * location, with optional filters for the current tab. Uses geospatial
   * indexing to return the closest matches.
   *
   * Matches the official deployed contract:
   * https://birds-api.trackzio.com/docs/core-module#explore-near-you
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters:
   *   - pageNo (number, default: 1)
   *   - pageSize (number, default: 20)
   *   - tab ("growingNow" | "yearRound")
   * Body: { location }. Trait filters apply only to map activity.
   *
   * Response (200 OK):
   * { error: false, data: [...], mapClusters: [...], tabs: {...}, pagination: {...} }
   */
  fetchExploreNearYou: async (
    body: ExploreNearYouRequestBody,
    query?: ExploreNearYouQueryParams,
    signal?: AbortSignal
  ): Promise<ExploreNearYouResponse> => {
    const queryParams: Record<string, unknown> = {
      pageNo: query?.pageNo ?? 1,
      pageSize: query?.pageSize ?? 20,
    };
    if (query?.tab) queryParams.tab = query.tab;

    const response = await requestExplore(
      () =>
        apiClient.post<ExploreNearYouResponse>(
          API_ENDPOINTS.CORE.EXPLORE_NEAR_YOU,
          { location: body.location },
          { params: queryParams, signal }
        ),
      signal
    );
    return response.data;
  },
};
