/**
 * Catalogue repository — archetype list/detail via CORE endpoints.
 */

import { mushroomsAPIService } from "../../services/api/mushrooms.api";
import { coreApi } from "../../services/api/features/core.api";
import { archetypeService } from "../../services/archetype/archetype.service";
import {
  MushroomDetail,
  MushroomListResponse,
} from "../../types/mushrooms.types";

interface GetMineralsParams {
  pageNo?: number;
  pageSize?: number;
}

interface FilterMineralsParams extends GetMineralsParams {
  color?: string[];
  hardness?: string;
  location?: string;
  gemType?: string;
  entryType?: number;
  [key: string]: unknown;
}

class MushroomsRepository {
  async getMushrooms(
    params: GetMineralsParams = {}
  ): Promise<MushroomListResponse> {
    const { pageNo = 0, pageSize = 10 } = params;
    return mushroomsAPIService.getMushroomsList(pageNo, pageSize);
  }

  async getMushroomDetail(mushroomId: string): Promise<MushroomDetail | null> {
    try {
      const response = await mushroomsAPIService.getMushroomDetails(mushroomId);
      return response.error ? null : response.data;
    } catch (error) {
      console.error(`Error fetching archetype detail for ${mushroomId}:`, error);
      return null;
    }
  }

  async searchMushrooms(
    query: string,
    params: GetMineralsParams = {},
    filters?: Record<string, unknown>
  ): Promise<MushroomListResponse> {
    const { pageNo = 0, pageSize = 10 } = params;
    return mushroomsAPIService.searchMushrooms(query, pageNo, pageSize, filters);
  }

  async filterMushrooms(
    filters: FilterMineralsParams = {}
  ): Promise<MushroomListResponse> {
    const { pageNo = 0, pageSize = 10, ...filterParams } = filters;
    const formattedFilters: Record<string, unknown> = {};
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formattedFilters[key] = Array.isArray(value) ? value : [value];
      }
    });
    return mushroomsAPIService.filterMushrooms(
      formattedFilters,
      pageNo,
      pageSize
    );
  }

  async addToCollection(archetypeId: string): Promise<boolean> {
    try {
      const response = await coreApi.addIdentifiedArchetype(archetypeId);
      return !response.error;
    } catch (error) {
      console.error(`Error adding ${archetypeId} to collection:`, error);
      return false;
    }
  }

  /** @deprecated Delete specimen by id via mushroomSpecimenService. */
  async removeFromCollection(_archetypeId: string): Promise<boolean> {
    console.warn(
      "removeFromCollection(archetypeId) is not supported; delete the specimen by id instead."
    );
    return false;
  }

  async toggleFavorite(
    mushroomId: string,
    isCurrentlyFavorite: boolean
  ): Promise<boolean> {
    try {
      if (isCurrentlyFavorite) {
        await archetypeService.removeWishlistArchetype(mushroomId);
      } else {
        await archetypeService.addWishlistArchetype(mushroomId);
      }
      return true;
    } catch (error) {
      console.error(`Error toggling wishlist for ${mushroomId}:`, error);
      return false;
    }
  }
}

export { MushroomsRepository };
export const mushroomsRepository = new MushroomsRepository();
