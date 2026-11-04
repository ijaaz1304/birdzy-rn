import type { BirdArchetypeFilterRequest } from "../api/features/bird.api.types";
/**
 * MushroomArchetype Service
 * Business logic layer for archetype (public catalog) operations
 */

import { coreApi } from "../api/features/core.api";
import {
  MushroomArchetype,
  MushroomArchetypeListItem,
  MushroomArchetypeFilterRequest,
  MushroomSpecimen,
  MushroomSpecimenListItem,
  MushroomSpecimenFilterRequest,
} from "../api/features/core.api.types";
import { ApiException, normalizeError } from "../api/errors";
import {
  MushroomArchetypeStats,
  normalizeArchetypeStats,
  normalizeArchetypeListResponse,
  normalizeMushroomDetail,
} from "../../utils/mushroomApiMappers";
import type {
  BirdArchetypeFilterParams,
  BirdStepByStepRequest,
  BirdGalleryAudioResponse,
} from "../api/features/bird.api.types";
import { mushroomSpecimenService } from "../specimen/mushroomSpecimen.service";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";
import { API_ENDPOINTS } from "../../constants/api";
import { BIRD_ARCHETYPE_FILTER_DEFAULTS } from "../../constants/birdFilterDefaults";

const wishlistLog = (
  level: "info" | "warn" | "error",
  message: string,
  metadata?: Record<string, unknown>
) => {
  useAppLogsStore.getState()[level](message, metadata);
};

function summarizeWishlistSpecimen(specimen?: MushroomSpecimen | null) {
  if (!specimen) return null;
  return {
    specimenId: specimen.id ?? specimen._id ?? null,
    archetypeId: specimen._archetype ?? null,
    isWishlisted: specimen.isWishlisted ?? null,
    isIdentified: specimen.isIdentified ?? null,
    collectionId: specimen._collection ?? specimen._collections?.[0] ?? null,
    imageCount: specimen.images?.length ?? 0,
  };
}

function isDuplicateSpecimenError(error: unknown): boolean {
  const message =
    error instanceof ApiException
      ? error.message
      : error instanceof Error
      ? error.message
      : String(error);
  return /E11000|duplicate key/i.test(message);
}

class ArchetypeService {
  /**
   * Get filter items for archetypes
   */
  async getFilterItems(params?: BirdArchetypeFilterParams) {
    try {
      const response = await coreApi.getArchetypeFilterItems(
        params ?? BIRD_ARCHETYPE_FILTER_DEFAULTS
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
   * Fetch all archetypes with filters and pagination
   */
  async fetchAllArchetypes(
    filters?: BirdArchetypeFilterRequest | MushroomArchetypeFilterRequest,
    pagination?: {
      pageNo?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<{
    data: MushroomArchetypeListItem[];
    pagination: {
      pageNo: number;
      pageSize: number;
      totalCount: number;
    };
  }> {
    try {
      const response = await coreApi.fetchAllArchetypes(filters, pagination);
      if (response.error) {
        throw new ApiException(response.reason || "Failed to fetch archetypes");
      }
      return {
        data: normalizeArchetypeListResponse(response).data,
        pagination: response.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get archetype details by ID
   */
  async getArchetypeDetails(id: string): Promise<MushroomArchetype> {
    try {
      const response = await coreApi.getArchetypeDetails(id);
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to get archetype details"
        );
      }
      return normalizeMushroomDetail(
        response.data as unknown as Record<string, unknown>
      ) as unknown as MushroomArchetype;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Add archetype to identified list (creates specimen)
   */
  async addIdentifiedArchetype(id: string): Promise<MushroomSpecimen> {
    try {
      const response = await coreApi.addIdentifiedArchetype(id);
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to add identified archetype"
        );
      }
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Add archetype to wishlist (creates specimen).
   * Preflights existing wishlist rows and recovers when the backend duplicate-key
   * insert fails for an archetype that is already saved as a specimen.
   */
  async addWishlistArchetype(id: string): Promise<MushroomSpecimen> {
    const endpoint = `${API_ENDPOINTS.CORE.WISHLIST_ADD}/${id}`;
    wishlistLog("info", "[Wishlist] add: request", {
      method: "PUT",
      endpoint,
      archetypeId: id,
    });

    try {
      const existingWishlisted = await this.resolveWishlistedSpecimen(id);
      if (existingWishlisted) {
        wishlistLog("info", "[Wishlist] add: skipped (already wishlisted)", {
          archetypeId: id,
          specimen: summarizeWishlistSpecimen(existingWishlisted),
        });
        return existingWishlisted;
      }

      const specimens = await this.findSpecimensForArchetype(id);
      this.assertCanWishlistArchetype(specimens);

      const response = await coreApi.addWishlistArchetype(id);
      wishlistLog("info", "[Wishlist] add: response", {
        archetypeId: id,
        error: response.error ?? false,
        reason: response.reason ?? null,
        specimen: summarizeWishlistSpecimen(response.data),
      });

      if (response.error) {
        if (/already in your wishlist/i.test(response.reason ?? "")) {
          const recovered = await this.resolveWishlistedSpecimen(id);
          if (recovered) {
            wishlistLog("info", "[Wishlist] add: recovered existing specimen", {
              archetypeId: id,
              specimen: summarizeWishlistSpecimen(recovered),
            });
            return recovered;
          }
        }
        wishlistLog("error", "[Wishlist] add: API error response", {
          archetypeId: id,
          reason: response.reason ?? null,
        });
        throw new ApiException(
          response.reason || "Failed to add wishlist archetype"
        );
      }
      return response.data;
    } catch (error) {
      if (isDuplicateSpecimenError(error)) {
        const recovered = await this.resolveWishlistedSpecimen(id);
        if (recovered) {
          wishlistLog("info", "[Wishlist] add: recovered after duplicate key", {
            archetypeId: id,
            specimen: summarizeWishlistSpecimen(recovered),
          });
          return recovered;
        }

        const specimens = await this.findSpecimensForArchetype(id);
        if (specimens.some((s) => s.isIdentified)) {
          wishlistLog("warn", "[Wishlist] add: blocked (already identified)", {
            archetypeId: id,
          });
          throw new ApiException("This is already identified, can't wishlist.");
        }
        if (specimens.length > 0) {
          wishlistLog(
            "warn",
            "[Wishlist] add: blocked (already in collection)",
            {
              archetypeId: id,
              specimenCount: specimens.length,
            }
          );
          throw new ApiException(
            "This bird is already in your collection. The server couldn't add it to wishlist."
          );
        }
      }

      const normalized = normalizeError(error);
      wishlistLog("error", "[Wishlist] add: request failed", {
        archetypeId: id,
        message: normalized.message,
        status: normalized.status ?? null,
      });
      throw normalized;
    }
  }

  private async findSpecimensForArchetype(
    archetypeId: string
  ): Promise<MushroomSpecimenListItem[]> {
    const { data } = await mushroomSpecimenService.fetchAllSpecimens(
      { _archetype: [archetypeId] } as MushroomSpecimenFilterRequest,
      { pageNo: 0, pageSize: 20 }
    );
    return data ?? [];
  }

  private async resolveWishlistedSpecimen(
    archetypeId: string
  ): Promise<MushroomSpecimen | null> {
    const specimens = await this.findSpecimensForArchetype(archetypeId);
    const wishlisted = specimens.find((s) => s.isWishlisted);
    if (!wishlisted?.specimenId) return null;
    return mushroomSpecimenService.getSpecimenDetails(wishlisted.specimenId);
  }

  private assertCanWishlistArchetype(
    specimens: MushroomSpecimenListItem[]
  ): void {
    if (specimens.some((s) => s.isIdentified)) {
      throw new ApiException("This is already identified, can't wishlist.");
    }
  }

  /**
   * Remove archetype from wishlist and clear any stale wishlisted specimen rows
   * so Collection/Wishlist lists (specimen fetchAll isWishlisted) stay in sync.
   */
  async removeWishlistArchetype(id: string): Promise<void> {
    wishlistLog("info", "[Wishlist] remove: request", { archetypeId: id });
    try {
      const response = await coreApi.removeWishlistArchetype(id);
      if (response.error) {
        const notInWishlist = /not found in wishlist/i.test(
          response.reason ?? ""
        );
        if (!notInWishlist) {
          throw new ApiException(
            response.reason || "Failed to remove wishlist archetype"
          );
        }
        wishlistLog(
          "warn",
          "[Wishlist] remove: API not found, clearing specimens",
          {
            archetypeId: id,
            reason: response.reason ?? null,
          }
        );
      }

      await this.clearWishlistedSpecimensForArchetype(id);
      wishlistLog("info", "[Wishlist] remove: success", { archetypeId: id });
    } catch (error) {
      const normalized = normalizeError(error);
      wishlistLog("error", "[Wishlist] remove: request failed", {
        archetypeId: id,
        message: normalized.message,
        status: normalized.status ?? null,
      });
      throw normalized;
    }
  }

  private async clearWishlistedSpecimensForArchetype(
    archetypeId: string
  ): Promise<void> {
    const specimens = await this.findSpecimensForArchetype(archetypeId);
    for (const row of specimens) {
      if (!row.isWishlisted || !row.specimenId) continue;
      const sid = String(row.specimenId);
      try {
        await mushroomSpecimenService.updateSpecimen(sid, {
          isWishlisted: false,
        });
        wishlistLog("info", "[Wishlist] remove: patched specimen", {
          archetypeId,
          specimenId: sid,
        });
      } catch {
        if (!row.isIdentified) {
          try {
            await mushroomSpecimenService.deleteSpecimen(sid);
            wishlistLog(
              "info",
              "[Wishlist] remove: deleted wishlist specimen",
              {
                archetypeId,
                specimenId: sid,
              }
            );
          } catch {
            wishlistLog("warn", "[Wishlist] remove: failed to clear specimen", {
              archetypeId,
              specimenId: sid,
            });
          }
        }
      }
    }
  }

  /**
   * Get archetype statistics
   */
  async getArchetypeStats(): Promise<MushroomArchetypeStats> {
    try {
      const response = await coreApi.getArchetypeStats();
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to get archetype stats"
        );
      }
      return normalizeArchetypeStats(response.data);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get specimens of the day (3 random rare archetypes)
   */
  async getSpecimensOfTheDay(): Promise<MushroomArchetypeListItem[]> {
    try {
      const response = await coreApi.getSpecimensOfTheDay();
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to get specimens of the day"
        );
      }
      return normalizeArchetypeListResponse(response).data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Nearby birds by location and date (POST /core/archetypes/step-by-step).
   */
  async stepByStep(
    body: BirdStepByStepRequest,
    pagination?: { pageNo?: number; pageSize?: number }
  ): Promise<{
    data: MushroomArchetypeListItem[];
    pagination: {
      pageNo: number;
      pageSize: number;
      totalCount: number;
    };
  }> {
    try {
      const response = await coreApi.stepByStep(body, pagination);
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to fetch step-by-step birds"
        );
      }
      return {
        data: normalizeArchetypeListResponse(response).data,
        pagination: response.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Audio gallery: identified recordings and unknown clips (GET /core/gallery/audio).
   */
  async getGalleryAudio(): Promise<BirdGalleryAudioResponse["data"]> {
    try {
      const response = await coreApi.getGalleryAudio();
      if (response.error) {
        throw new ApiException(
          response.reason || "Failed to fetch gallery audio"
        );
      }
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

export const archetypeService = new ArchetypeService();
