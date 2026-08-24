/**
 * Catalogue API (archetype list/detail/search/filter).
 * Uses CORE.ARCHETYPE_* endpoints — legacy MUSHROOMS.* constants removed.
 */

import { apiClient } from "./axios";
import {
  MushroomListResponse,
  MushroomDetailResponse,
} from "../../types/mushrooms.types";
import { API_ENDPOINTS } from "../../constants/api";
import {
  normalizeArchetypeListResponse,
  normalizeMushroomDetail,
} from "../../utils/mushroomApiMappers";

class MushroomsAPIService {
  private getAxiosInstance() {
    return apiClient;
  }

  private formatFilterBody(
    filters?: Record<string, unknown>
  ): Record<string, unknown> {
    const filterBody: Record<string, unknown> = {};
    if (!filters) return filterBody;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        const arr = Array.isArray(value) ? value : [value];
        if (arr.length > 0) filterBody[key] = arr;
      }
    });
    return filterBody;
  }

  async getMushroomsList(
    pageNo: number = 0,
    pageSize: number = 10,
    filters?: Record<string, unknown>
  ): Promise<MushroomListResponse> {
    try {
      const filterBody = this.formatFilterBody(filters);
      const response = await this.getAxiosInstance().post<MushroomListResponse>(
        API_ENDPOINTS.CORE.ARCHETYPE_LIST,
        Object.keys(filterBody).length > 0 ? filterBody : {},
        { params: { pageNo, pageSize } }
      );
      return normalizeArchetypeListResponse(response.data);
    } catch (error) {
      console.error("Error fetching catalogue list:", error);
      throw error;
    }
  }

  async getMushroomDetails(
    mushroomId: string
  ): Promise<MushroomDetailResponse> {
    try {
      const response =
        await this.getAxiosInstance().get<MushroomDetailResponse>(
          `${API_ENDPOINTS.CORE.ARCHETYPE_DETAILS}/${mushroomId}`
        );
      if (response.data?.data) {
        return {
          ...response.data,
          data: normalizeMushroomDetail(
            response.data.data as unknown as Record<string, unknown>
          ),
        };
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching archetype details for ${mushroomId}:`, error);
      throw error;
    }
  }

  async searchMushrooms(
    query: string,
    pageNo: number = 0,
    pageSize: number = 10,
    filters?: Record<string, unknown>
  ): Promise<MushroomListResponse> {
    try {
      const searchQuery = (query || "").trim().toLowerCase();
      const filterBody = this.formatFilterBody(filters);
      const params: Record<string, string | number> = { pageNo, pageSize };
      if (searchQuery) params.search = searchQuery;

      const response = await this.getAxiosInstance().post<MushroomListResponse>(
        API_ENDPOINTS.CORE.ARCHETYPE_LIST,
        Object.keys(filterBody).length > 0 ? filterBody : {},
        { params }
      );
      return normalizeArchetypeListResponse(response.data);
    } catch (error) {
      console.error("Error searching catalogue:", error);
      throw error;
    }
  }

  async filterMushrooms(
    filters: Record<string, unknown>,
    pageNo: number = 0,
    pageSize: number = 10
  ): Promise<MushroomListResponse> {
    try {
      const sanitized = this.formatFilterBody(filters);
      const response = await this.getAxiosInstance().post<MushroomListResponse>(
        API_ENDPOINTS.CORE.ARCHETYPE_LIST,
        Object.keys(sanitized).length > 0 ? sanitized : {},
        { params: { pageNo, pageSize } }
      );
      return normalizeArchetypeListResponse(response.data);
    } catch (error: unknown) {
      if (__DEV__) {
        const err = error as { response?: { status?: number; data?: unknown } };
        console.warn(
          "Error filtering catalogue:",
          err?.response?.status,
          err?.response?.data
        );
      }
      throw error;
    }
  }
}

export { MushroomsAPIService };
export const mushroomsAPIService = new MushroomsAPIService();
