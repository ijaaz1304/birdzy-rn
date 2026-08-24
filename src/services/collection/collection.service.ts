/**
 * Collection Service
 * Business logic layer for collection operations
 */

import { coreApi } from "../api/features/core.api";
import {
  Collection,
  CollectionListResponse,
  AddCollectionRequest,
  AddCollectionResponse,
  UpdateCollectionRequest,
} from "../api/features/core.api.types";
import { ApiException, normalizeError, isPaywallOrLimitReason } from "../api/errors";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";
import { useAuthStore } from "../../features/auth/auth.store";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import { getCollectionLimitPremiumSnapshot } from "../session/collectionLimit.service";
import { API_ENDPOINTS } from "../../constants/api";

const LOG = "[Collections]";
const CREATE_COLLECTION_ENDPOINT = API_ENDPOINTS.CORE.COLLECTION_ADD;

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function logAddCollectionRequest(
  data: AddCollectionRequest,
  meta?: Record<string, unknown>
): void {
  useAppLogsStore.getState().info(`${LOG} create_collection API request`, {
    endpoint: CREATE_COLLECTION_ENDPOINT,
    method: "POST",
    requestBody: {
      name: data.name,
      description: data.description?.trim() || undefined,
      imageUrl: data.imageUrl?.trim() || undefined,
    },
    ...getCollectionLimitPremiumSnapshot(),
    ...meta,
  });
}

function summarizeAddCollectionResponseData(
  data: Collection | undefined
): Record<string, unknown> | null {
  if (!data) return null;
  return {
    collectionId: data.collectionId,
    collectionIdSuffix: data.collectionId?.slice(-8),
    name: data.name,
    description: data.description ?? null,
    specimenCount: data.specimenCount,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function logAddCollectionResponse(
  response: AddCollectionResponse,
  meta?: Record<string, unknown>
): void {
  useAppLogsStore.getState().info(`${LOG} create_collection API response`, {
    endpoint: CREATE_COLLECTION_ENDPOINT,
    method: "POST",
    error: response.error,
    reason: response.reason ?? null,
    data: summarizeAddCollectionResponseData(response.data),
    ...meta,
  });
}

function logAddCollectionHttpError(
  error: unknown,
  meta?: Record<string, unknown>
): void {
  const err = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    reason?: string;
    response?: { status?: number; data?: unknown };
  };
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;
  const responseData = err?.response?.data;
  useAppLogsStore.getState().warn(`${LOG} create_collection API error response`, {
    endpoint: CREATE_COLLECTION_ENDPOINT,
    method: "POST",
    httpStatus: status ?? null,
    message: err?.message ?? errMsg(error),
    reason: err?.reason ?? null,
    responseBody:
      responseData && typeof responseData === "object"
        ? responseData
        : responseData ?? null,
    ...getCollectionLimitPremiumSnapshot(),
    ...meta,
  });
}

/** Describe API list `data` shape without logging full payloads (support/debug). */
function describeListDataShape(body: CollectionListResponse): string {
  const raw = body.data as unknown;
  if (raw == null) return "data:null";
  if (Array.isArray(raw)) return `data:array(len=${raw.length})`;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.collections))
      return `data.collections(len=${o.collections.length})`;
    if (Array.isArray(o.items)) return `data.items(len=${o.items.length})`;
    if (Array.isArray(o.results))
      return `data.results(len=${o.results.length})`;
    if (Array.isArray(o.rows)) return `data.rows(len=${o.rows.length})`;
    return `data:object(keys=${Object.keys(o).slice(0, 8).join(",")})`;
  }
  return `data:${typeof raw}`;
}

/** Backend may return camelCase or snake_case; list `data` may be an array or nested. */
function normalizeCollection(raw: unknown): Collection {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") {
    return {
      collectionId: "",
      name: "",
      specimenCount: 0,
      createdAt: "",
      updatedAt: "",
    };
  }
  const id = r.collectionId ?? r.collection_id ?? r._id ?? r.id ?? "";
  const representImage = (r.representImage ??
    r.represent_image ??
    r.representImageUrl ??
    r.represent_image_url) as string | undefined;
  const imageUrl = (r.imageUrl ?? r.image_url) as string | undefined;
  const representativeImagesRaw =
    r.representativeImages ?? r.representative_images;
  const representativeImages = Array.isArray(representativeImagesRaw)
    ? representativeImagesRaw.filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      )
    : undefined;
  return {
    collectionId: typeof id === "string" ? id : String(id),
    name: String(r.name ?? ""),
    description: (r.description as string) ?? undefined,
    imageUrl,
    representImage: representImage?.trim() || undefined,
    representativeImages,
    specimenCount: Number(r.specimenCount ?? r.specimen_count ?? 0),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    specimens: r.specimens as Collection["specimens"],
  };
}

function extractCollectionsFromListBody(
  body: CollectionListResponse
): Collection[] {
  const raw = body.data as unknown;
  if (Array.isArray(raw)) {
    return raw.map(normalizeCollection);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const nested = o.collections ?? o.items ?? o.results ?? o.rows;
    if (Array.isArray(nested)) {
      return nested.map(normalizeCollection);
    }
  }
  return [];
}

function pickUrlList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const urls = raw.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0
  );
  return urls.length > 0 ? urls : undefined;
}

function extractListPreviewExtras(body: CollectionListResponse): {
  identifiedImageUrls?: string[];
  wishlistedImageUrls?: string[];
  ownedImageUrls?: string[];
  identifiedCount?: number;
  wishlistedCount?: number;
  ownedCount?: number;
} {
  const b = body as Record<string, unknown>;
  const countOrUndef = (key: string, snake: string) => {
    const n = Number(b[key] ?? b[snake]);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    identifiedImageUrls: pickUrlList(
      b.identifiedImageUrls ?? b.identified_image_urls
    ),
    wishlistedImageUrls: pickUrlList(
      b.wishlistedImageUrls ?? b.wishlisted_image_urls
    ),
    ownedImageUrls: pickUrlList(b.ownedImageUrls ?? b.owned_image_urls),
    identifiedCount: countOrUndef("identifiedCount", "identified_count"),
    wishlistedCount: countOrUndef("wishlistedCount", "wishlisted_count"),
    ownedCount: countOrUndef("ownedCount", "owned_count"),
  };
}

function normalizePagination(
  p: CollectionListResponse["pagination"] | undefined,
  fallback: { pageNo: number; pageSize: number; totalCount: number }
): CollectionListResponse["pagination"] {
  if (!p || typeof p !== "object") {
    const totalPages = Math.max(
      1,
      Math.ceil(fallback.totalCount / Math.max(1, fallback.pageSize))
    );
    return {
      pageNo: fallback.pageNo,
      pageSize: fallback.pageSize,
      totalCount: fallback.totalCount,
      totalPages,
    };
  }
  const po = p as Record<string, unknown>;
  return {
    pageNo: Number(po.pageNo ?? po.page_no ?? fallback.pageNo),
    pageSize: Number(po.pageSize ?? po.page_size ?? fallback.pageSize),
    totalCount: Number(po.totalCount ?? po.total_count ?? fallback.totalCount),
    totalPages: Number(po.totalPages ?? po.total_pages ?? 1),
  };
}

class CollectionService {
  /**
   * Create a new collection
   */
  async addCollection(data: AddCollectionRequest): Promise<Collection> {
    const log = useAppLogsStore.getState();
    logAddCollectionRequest(data, { attempt: "initial" });
    try {
      const response = await coreApi.addCollection(data);
      logAddCollectionResponse(response, { attempt: "initial" });
      if (response.error) {
        log.warn(`${LOG} addCollection API error flag`, {
          reason: response.reason,
        });
        const reason = response.reason || "Failed to create collection";
        throw new ApiException(
          reason,
          isPaywallOrLimitReason(reason) ? 403 : undefined,
          undefined,
          { error: true, reason }
        );
      }
      const c = normalizeCollection(response.data);
      log.info(`${LOG} addCollection success`, {
        collectionIdSuffix: c.collectionId?.slice(-8),
        name: c.name,
        specimenCount: c.specimenCount,
      });
      return c;
    } catch (error) {
      logAddCollectionHttpError(error, { attempt: "initial" });
      const status =
        (error as any)?.status ??
        (error as any)?.statusCode ??
        (error as any)?.response?.status;
      const reason = String(
        (error as any)?.reason ??
          (error as any)?.response?.data?.reason ??
          (error as any)?.message ??
          ""
      ).toLowerCase();
      const looksLikeCollectionGate =
        status === 403 ||
        /subscription|premium|limit|upgrade|plan|forbidden|purchase.*plan|add more than.*collection/.test(
          reason
        );
      const premiumNow = selectIsPremium(useSubscriptionStore.getState());

      // Collection-only recovery: if user is premium but create is forbidden, refresh session once and retry.
      if (looksLikeCollectionGate && premiumNow) {
        log.warn(
          `${LOG} addCollection premium forbidden - retry with refresh`,
          {
            status,
            reason,
          }
        );
        try {
          await useAuthStore.getState().refreshAuthToken();
          await useSubscriptionStore.getState().fetchSubscription();
          useSubscriptionStore.getState().syncFromAuthStore();
          logAddCollectionRequest(data, { attempt: "premium_retry" });
          const retried = await coreApi.addCollection(data);
          logAddCollectionResponse(retried, { attempt: "premium_retry" });
          if (retried.error) {
            throw new ApiException(
              retried.reason || "Failed to create collection"
            );
          }
          const c = normalizeCollection(retried.data);
          log.info(`${LOG} addCollection success after refresh retry`, {
            collectionIdSuffix: c.collectionId?.slice(-8),
            name: c.name,
            specimenCount: c.specimenCount,
          });
          return c;
        } catch (retryError) {
          logAddCollectionHttpError(retryError, { attempt: "premium_retry" });
          log.warn(`${LOG} addCollection retry after refresh failed`, {
            message: errMsg(retryError),
          });
        }
      }
      log.error(`${LOG} addCollection failed`, { message: errMsg(error) });
      throw normalizeError(error);
    }
  }

  /**
   * Fetch all collections with pagination and optional search
   */
  async fetchAllCollections(params?: {
    pageNo?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{
    data: Collection[];
    pagination: {
      pageNo: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
    previewExtras: ReturnType<typeof extractListPreviewExtras>;
  }> {
    const log = useAppLogsStore.getState();
    log.info(`${LOG} fetchAllCollections start`, {
      pageNo: params?.pageNo ?? 0,
      pageSize: params?.pageSize ?? 20,
      search: params?.search,
    });
    try {
      const response = await coreApi.fetchAllCollections(params);
      log.info(`${LOG} fetchAllCollections raw response`, {
        apiError: response.error,
        shape: describeListDataShape(response),
        hasPagination: !!response.pagination,
      });
      if (response.error) {
        log.warn(`${LOG} fetchAllCollections API error flag`, {
          reason: response.reason,
        });
        throw new ApiException(
          response.reason || "Failed to fetch collections"
        );
      }
      const data = extractCollectionsFromListBody(response);
      const pageNo = params?.pageNo ?? 0;
      const pageSize = params?.pageSize ?? 20;
      const pRaw = response.pagination as Record<string, unknown> | undefined;
      const totalCount = Number(
        pRaw?.totalCount ?? pRaw?.total_count ?? data.length
      );
      const previewExtras = extractListPreviewExtras(response);
      const normalized = {
        data,
        pagination: normalizePagination(response.pagination, {
          pageNo,
          pageSize,
          totalCount: Number.isFinite(totalCount) ? totalCount : data.length,
        }),
        previewExtras,
      };
      const idsMissing = data.filter((d) => !d.collectionId?.trim()).length;
      log.info(`${LOG} fetchAllCollections normalized`, {
        count: data.length,
        idsMissing,
        pagination: normalized.pagination,
        namesSample: data.slice(0, 5).map((c) => c.name),
      });
      return normalized;
    } catch (error) {
      log.error(`${LOG} fetchAllCollections failed`, {
        message: errMsg(error),
      });
      throw normalizeError(error);
    }
  }

  /**
   * Get collection details by ID
   */
  async getCollectionDetails(id: string): Promise<Collection> {
    const log = useAppLogsStore.getState();
    log.info(`${LOG} getCollectionDetails start`, {
      idSuffix: id?.slice(-8),
    });
    try {
      const response = await coreApi.getCollectionDetails(id);
      if (response.error) {
        log.warn(`${LOG} getCollectionDetails API error flag`, {
          reason: response.reason,
          idSuffix: id?.slice(-8),
        });
        throw new ApiException(
          response.reason || "Failed to get collection details"
        );
      }
      const c = normalizeCollection(response.data);
      log.info(`${LOG} getCollectionDetails success`, {
        collectionIdSuffix: c.collectionId?.slice(-8),
        name: c.name,
        specimenCount: c.specimenCount,
        hasSpecimensArray: Array.isArray(c.specimens),
      });
      return c;
    } catch (error) {
      log.error(`${LOG} getCollectionDetails failed`, {
        idSuffix: id?.slice(-8),
        message: errMsg(error),
      });
      throw normalizeError(error);
    }
  }

  /**
   * Update collection
   */
  async updateCollection(
    id: string,
    data: UpdateCollectionRequest
  ): Promise<Collection> {
    const log = useAppLogsStore.getState();
    log.info(`${LOG} updateCollection`, {
      idSuffix: id?.slice(-8),
      keys: Object.keys(data),
    });
    try {
      const response = await coreApi.updateCollection(id, data);
      if (response.error) {
        log.warn(`${LOG} updateCollection API error`, {
          reason: response.reason,
        });
        throw new ApiException(
          response.reason || "Failed to update collection"
        );
      }
      return normalizeCollection(response.data);
    } catch (error) {
      log.error(`${LOG} updateCollection failed`, { message: errMsg(error) });
      throw normalizeError(error);
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: string): Promise<void> {
    const log = useAppLogsStore.getState();
    log.info(`${LOG} deleteCollection`, { idSuffix: id?.slice(-8) });
    try {
      const response = await coreApi.deleteCollection(id);
      if (response.error) {
        log.warn(`${LOG} deleteCollection API error`, {
          reason: response.reason,
        });
        throw new ApiException(
          response.reason || "Failed to delete collection"
        );
      }
      log.info(`${LOG} deleteCollection success`, { idSuffix: id?.slice(-8) });
    } catch (error) {
      log.error(`${LOG} deleteCollection failed`, { message: errMsg(error) });
      throw normalizeError(error);
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<{ totalCollections: number }> {
    const log = useAppLogsStore.getState();
    log.debug(`${LOG} getCollectionStats start`);
    try {
      const response = await coreApi.getCollectionStats();
      if (response.error) {
        log.warn(`${LOG} getCollectionStats API error flag`, {
          reason: response.reason,
        });
        throw new ApiException(
          response.reason || "Failed to get collection stats"
        );
      }
      const d = response.data as Record<string, unknown> | undefined;
      const total = Number(d?.totalCollections ?? d?.total_collections ?? 0);
      log.info(`${LOG} getCollectionStats`, { totalCollections: total });
      return { totalCollections: total };
    } catch (error) {
      log.error(`${LOG} getCollectionStats failed`, { message: errMsg(error) });
      throw normalizeError(error);
    }
  }
}

export const collectionService = new CollectionService();
