/**
 * Mushroom specimen service
 * Business logic layer for specimen operations
 */

import { coreApi } from "../api/features/core.api";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";
import {
  MushroomSpecimen,
  MushroomSpecimenListItem,
  MushroomSpecimenFilterRequest,
  AddMushroomSpecimenRequest,
  UpdateMushroomSpecimenRequest,
  MushroomArchetypeFilterParams,
} from "../api/features/core.api.types";
import { normalizeSpecimenListItem, normalizeMushroomDetail } from "../../utils/mushroomApiMappers";
import { ApiException, normalizeError } from "../api/errors";
import { BIRD_ARCHETYPE_FILTER_DEFAULTS } from "../../constants/birdFilterDefaults";
import type { BirdArchetypeFilterParams } from "../api/features/bird.api.types";

class MushroomSpecimenService {
  /**
   * Distinct filter values for catalogue/specimen edit UI.
   * Uses GET /core/archetypes/filteritems (specimen/filteritems is broken on Bird backend).
   */
  async getFilterItems(params?: BirdArchetypeFilterParams) {
    try {
      const response = await coreApi.getArchetypeFilterItems(
        (params ?? BIRD_ARCHETYPE_FILTER_DEFAULTS) as MushroomArchetypeFilterParams
      );
      if (response.error) {
        throw new ApiException(response.reason || "Failed to get filter items");
      }
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Add a new specimen to collection
   */
  async addSpecimen(
    data: AddMushroomSpecimenRequest
  ): Promise<MushroomSpecimen> {
    try {
      const response = await coreApi.addSpecimen(data);
      if (response.error) {
        throw new ApiException(response.reason || "Failed to add specimen");
      }
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Fetch all specimens with filters and pagination
   */
  async fetchAllSpecimens(
    filters?: MushroomSpecimenFilterRequest,
    pagination?: {
      pageNo?: number;
      pageSize?: number;
      search?: string;
      collectionId?: string;
    }
  ): Promise<{
    data: MushroomSpecimenListItem[];
    pagination: {
      pageNo: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await coreApi.fetchAllSpecimens(filters, pagination);
      if (response.error) {
        throw new ApiException(response.reason || "Failed to fetch specimens");
      }
      return {
        data: (response.data ?? []).map((item) =>
          normalizeSpecimenListItem(
            item && typeof item === "object"
              ? (item as unknown as Record<string, unknown>)
              : {}
          )
        ),
        pagination: response.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get specimen details by ID
   */
  async getSpecimenDetails(id: string): Promise<MushroomSpecimen> {
    try {
      const response = await coreApi.getSpecimenDetails(id);
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to get specimen details"
        );
      }
      return normalizeMushroomDetail(
        response.data as unknown as Record<string, unknown>
      ) as unknown as MushroomSpecimen;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Update specimen
   */
  async updateSpecimen(
    id: string,
    data: UpdateMushroomSpecimenRequest
  ): Promise<MushroomSpecimen> {
    const log = useAppLogsStore.getState();
    log.info("[MushroomSpecimen] updateSpecimen called", {
      id,
      payloadKeys: Object.keys(data),
    });
    try {
      const response = await coreApi.updateSpecimen(id, data);
      log.info("[MushroomSpecimen] updateSpecimen API response", {
        error: response.error,
        hasData: !!response.data,
      });
      if (response.error) {
        throw new ApiException(response.reason || "Failed to update specimen");
      }
      return normalizeMushroomDetail(
        response.data as unknown as Record<string, unknown>
      ) as unknown as MushroomSpecimen;
    } catch (error) {
      log.warn("[MushroomSpecimen] updateSpecimen failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error);
    }
  }

  /**
   * Delete specimen
   */
  async deleteSpecimen(id: string): Promise<void> {
    try {
      const response = await coreApi.deleteSpecimen(id);
      if (response.error) {
        throw new ApiException(response.reason || "Failed to delete specimen");
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

export const mushroomSpecimenService = new MushroomSpecimenService();
