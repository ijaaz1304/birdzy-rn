import { flattenBirdSpecimenUpdate } from "./birdSpecimenUpdate";
/** Bird core API transport. Legacy response types remain for the shared UI adapters. */

import { apiClient } from "../axios";
import { API_ENDPOINTS } from "../../../constants/api";
import { API_BASE_URL, API_TIMEOUT } from "../../../constants/env";
import { useAuthStore } from "../../../features/auth/auth.store";
import { waitForAuthentication } from "../../../utils/authUtils";
import { ApiException, NetworkException } from "../errors";
import { BackendApiResponse } from "./auth.api.types";
import type {
  BirdArchetypeFilterParams,
  BirdArchetypeFilterRequest,
  BirdSpecimenFilterRequest,
  AddBirdSpecimenRequest,
  BirdIdentifyResponse,
  BirdArchetypeListResponse,
  BirdStepByStepRequest,
  BirdGalleryAudioResponse,
  UpdateBirdSpecimenRequest,
} from "./bird.api.types";
import {
  IdentifyResponse,
  ChatResponse,
  FilterItemsResponse,
  MushroomSpecimenListResponse,
  MushroomSpecimenDetailResponse,
  MushroomSpecimenFilterRequest,
  AddMushroomSpecimenRequest,
  UpdateMushroomSpecimenRequest,
  AddCollectionRequest,
  AddCollectionResponse,
  CollectionListResponse,
  CollectionDetailsResponse,
  UpdateCollectionRequest,
  CollectionStatsResponse,
  MushroomArchetypeFilterRequest,
  MushroomArchetypeListResponse,
  MushroomArchetypeDetailResponse,
  MushroomArchetypeStatsResponse,
} from "./core.api.types";

/** Build full URL from path (no double slashes) */
function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

const IDENTIFY_API_TIMEOUT_MS = 30000;

/**
 * POST with FormData via fetch (avoids Android "Network Error" with axios multipart).
 * Do not set Content-Type so the runtime sets multipart boundary.
 * @param options.timeoutMs - Override default API timeout (e.g. 30000 for identify only).
 */
let multipartRefresh: Promise<string> | null = null;

/** Multipart uses fetch for Android compatibility, with the same JWT recovery as JSON calls. */
async function postFormData<T>(
  path: string,
  formData: FormData,
  options?: { timeoutMs?: number }
): Promise<T> {
  await waitForAuthentication(2000);
  const account = useAuthStore.getState().user?.id;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = useAuthStore.getState().token;
    if (!token || useAuthStore.getState().user?.id !== account) {
      throw new ApiException("Session expired. Please sign in again.", 401);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? API_TIMEOUT
    );
    try {
      const res = await fetch(buildApiUrl(path), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });
      let data: T;
      try {
        data = await res.json();
      } catch {
        if (res.ok)
          throw new ApiException(
            "Unable to read the server response. Please try again.",
            502
          );
        data = {} as T;
      }
      if (
        res.ok &&
        (!data ||
          typeof data !== "object" ||
          typeof (data as { error?: unknown }).error !== "boolean")
      ) {
        throw new ApiException(
          "Invalid server response. Please try again.",
          502
        );
      }
      // A rejected JWT has not consumed the operation; retry once after refresh.
      // Never retry quota/business 403 responses or ambiguous network failures.
      if (
        res.status === 401 &&
        attempt === 0 &&
        useAuthStore.getState().token &&
        useAuthStore.getState().user?.id === account
      ) {
        clearTimeout(timeoutId);
        if (useAuthStore.getState().token !== token) continue;
        if (!multipartRefresh)
          multipartRefresh = useAuthStore
            .getState()
            .refreshAuthToken()
            .finally(() => {
              multipartRefresh = null;
            });
        await multipartRefresh;
        continue;
      }
      if (!res.ok) {
        throw new ApiException(
          (data as { reason?: string; message?: string })?.reason ||
            (data as { message?: string })?.message ||
            res.statusText ||
            "Request failed",
          res.status,
          undefined,
          data
        );
      }
      return data;
    } catch (error) {
      if (controller.signal.aborted)
        throw new ApiException("Request timeout. Please try again.", 408);
      if (error instanceof ApiException) throw error;
      throw new NetworkException();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new ApiException("Session expired. Please sign in again.", 401);
}

function validateChatInput(
  message?: string,
  images?: Array<{
    uri?: string;
    type?: string;
    fileSize?: number;
    size?: number;
  }>
) {
  if (!message?.trim() && !images?.length)
    throw new Error("At least one of message or images must be provided");
  if ((images?.length ?? 0) > 5) throw new Error("Maximum 5 files allowed");
  for (const image of images ?? []) {
    if (!image.uri?.trim()) throw new Error("A valid image file is required");
    if ((image.fileSize ?? image.size ?? 0) >= 5 * 1024 * 1024)
      throw new Error("File size must be under 5MB");
    if (
      image.type &&
      !/^image\/(jpeg|jpg|png|gif|webp|heic|heif)$/i.test(image.type)
    )
      throw new Error("Only image files are allowed");
  }
}

/**
 * Core API service
 * All endpoints match the backend API documentation
 */
export const coreApi = {
  /** POST /core/ai/identify */
  identify: async (
    files: any[],
    options?: { userLocation?: [number, number] }
  ): Promise<IdentifyResponse> => {
    if (!files?.length) {
      throw new Error("At least one image file is required for identification");
    }
    if (files.length > 2)
      throw new Error("Maximum 2 image files allowed for identification");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file as any));
    if (options?.userLocation?.length === 2) {
      formData.append("userLocation", JSON.stringify(options.userLocation));
    }
    return postFormData<IdentifyResponse>(
      API_ENDPOINTS.CORE.IDENTIFY,
      formData,
      { timeoutMs: IDENTIFY_API_TIMEOUT_MS }
    );
  },

  /** POST /core/ai/identify-sound */
  identifySound: async (file: {
    uri: string;
    type?: string;
    name?: string;
    startTime?: number;
    duration?: number;
    userLocation?: [number, number];
  }): Promise<BirdIdentifyResponse> => {
    const formData = new FormData();
    formData.append("files", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as unknown as Blob);
    if (file.startTime != null) {
      formData.append("startTime", String(file.startTime));
    }
    if (file.duration != null) {
      formData.append("duration", String(file.duration));
    }
    if (file.userLocation?.length === 2) {
      formData.append("userLocation", JSON.stringify(file.userLocation));
    }
    return postFormData<BirdIdentifyResponse>(
      API_ENDPOINTS.CORE.IDENTIFY_SOUND,
      formData,
      { timeoutMs: IDENTIFY_API_TIMEOUT_MS }
    );
  },

  /** POST /got-bitten */
  gotBitten: async (params: {
    message?: string;
    images?: Array<{ uri: string; type?: string; name?: string }>;
  }): Promise<ChatResponse> => {
    validateChatInput(params.message, params.images);
    const formData = new FormData();
    if (params.message?.trim()) {
      formData.append("message", params.message.trim());
    }
    params.images?.forEach((img) =>
      formData.append("images", img as unknown as Blob)
    );
    return postFormData<ChatResponse>(API_ENDPOINTS.CORE.GOT_BITTEN, formData);
  },

  /** POST /core/archetypes/step-by-step */
  stepByStep: async (
    body: BirdStepByStepRequest,
    pagination?: { pageNo?: number; pageSize?: number }
  ): Promise<BirdArchetypeListResponse> => {
    const response = await apiClient.post<BirdArchetypeListResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_STEP_BY_STEP,
      {
        location: body.location,
        ...(body.seenDate ? { seenDate: body.seenDate } : {}),
        ...(body.birdSize ? { birdSize: body.birdSize } : {}),
      },
      {
        params: {
          pageNo: pagination?.pageNo ?? 1,
          pageSize: pagination?.pageSize ?? 20,
        },
      }
    );
    return response.data;
  },

  /** GET /core/gallery/audio */
  getGalleryAudio: async (): Promise<BirdGalleryAudioResponse> => {
    try {
      const response = await apiClient.get<BirdGalleryAudioResponse>(
        API_ENDPOINTS.CORE.GALLERY_AUDIO
      );
      return response.data;
    } catch (error) {
      const status =
        (error as { status?: number; response?: { status?: number } }).status ??
        (error as { response?: { status?: number } }).response?.status;
      if (status !== 404) throw error;
      // Existing deployed Bird hosts use /core/gallery/audio; the supplied contract also documents /gallery/audio.
      const response = await apiClient.get<BirdGalleryAudioResponse>(
        API_ENDPOINTS.CORE.GALLERY_AUDIO_DOCUMENTED
      );
      return response.data;
    }
  },

  /** POST /core/chat */
  chat: async (message?: string, images?: any[]): Promise<ChatResponse> => {
    validateChatInput(message, images);
    const formData = new FormData();
    if (message?.trim()) formData.append("message", message.trim());
    images?.forEach((image) => formData.append("images", image as Blob));
    return postFormData<ChatResponse>(API_ENDPOINTS.CORE.CHAT, formData);
  },

  /** Compatibility alias: Bird filter options come from archetypes/filteritems. */
  getFilterItems: async (
    params?: BirdArchetypeFilterParams
  ): Promise<FilterItemsResponse> => {
    return coreApi.getArchetypeFilterItems(params);
  },

  /** POST /core/specimen/add */
  addSpecimen: async (
    data: AddBirdSpecimenRequest | AddMushroomSpecimenRequest
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.post<MushroomSpecimenDetailResponse>(
      API_ENDPOINTS.CORE.SPECIMEN_ADD,
      data
    );
    return response.data;
  },

  /** POST /core/specimen/fetchAll */
  fetchAllSpecimens: async (
    filters?: BirdSpecimenFilterRequest | MushroomSpecimenFilterRequest,
    pagination?: {
      pageNo?: number;
      pageSize?: number;
      search?: string;
      collectionId?: string;
    }
  ): Promise<MushroomSpecimenListResponse> => {
    if (__DEV__) {
      console.log(
        "[core.api] specimen fetchAll (POST /core/specimen/fetchAll)",
        {
          filters: filters ?? {},
          pagination: pagination ?? {},
        }
      );
    }
    const queryParams: Record<string, any> = {};

    if (pagination) {
      if (pagination.pageNo !== undefined)
        queryParams.pageNo = pagination.pageNo;
      if (pagination.pageSize !== undefined)
        queryParams.pageSize = pagination.pageSize;
      if (pagination.search) queryParams.search = pagination.search;
      if (pagination.collectionId)
        queryParams.collectionId = pagination.collectionId;
    }

    const response = await apiClient.post<MushroomSpecimenListResponse>(
      API_ENDPOINTS.CORE.SPECIMEN_FETCH_ALL,
      filters || {},
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /** GET /core/specimen/getDetails/:id */
  getSpecimenDetails: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.get<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_DETAILS}/${id}`
    );
    return response.data;
  },

  /** PATCH /core/specimen/update/:id */
  updateSpecimen: async (
    id: string,
    data: UpdateBirdSpecimenRequest | UpdateMushroomSpecimenRequest
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.patch<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_UPDATE}/${id}`,
      flattenBirdSpecimenUpdate(data as Record<string, unknown>)
    );
    return response.data;
  },

  /** DELETE /core/specimen/delete/:id */
  deleteSpecimen: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_DELETE}/${id}`
    );
    return response.data;
  },

  /** POST /core/collections/add */
  addCollection: async (
    data: AddCollectionRequest
  ): Promise<AddCollectionResponse> => {
    const response = await apiClient.post<AddCollectionResponse>(
      API_ENDPOINTS.CORE.COLLECTION_ADD,
      data
    );
    return response.data;
  },

  /** GET /core/collections/fetchAll */
  fetchAllCollections: async (params?: {
    pageNo?: number;
    pageSize?: number;
    search?: string;
  }): Promise<CollectionListResponse> => {
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.pageNo !== undefined) queryParams.pageNo = params.pageNo;
      if (params.pageSize !== undefined) queryParams.pageSize = params.pageSize;
      if (params.search) queryParams.search = params.search;
    }
    const response = await apiClient.get<CollectionListResponse>(
      API_ENDPOINTS.CORE.COLLECTION_LIST,
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /** GET /core/collections/getDetails/:id */
  getCollectionDetails: async (
    id: string
  ): Promise<CollectionDetailsResponse> => {
    const response = await apiClient.get<CollectionDetailsResponse>(
      `${API_ENDPOINTS.CORE.COLLECTION_DETAILS}/${id}`
    );
    return response.data;
  },

  /** PATCH /core/collections/update/:id */
  updateCollection: async (
    id: string,
    data: UpdateCollectionRequest
  ): Promise<CollectionDetailsResponse> => {
    const response = await apiClient.patch<CollectionDetailsResponse>(
      `${API_ENDPOINTS.CORE.COLLECTION_UPDATE}/${id}`,
      data
    );
    return response.data;
  },

  /** DELETE /core/collections/delete/:id */
  deleteCollection: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.COLLECTION_DELETE}/${id}`
    );
    return response.data;
  },

  /** GET /core/collections/stats */
  getCollectionStats: async (): Promise<CollectionStatsResponse> => {
    const response = await apiClient.get<CollectionStatsResponse>(
      API_ENDPOINTS.CORE.COLLECTION_STATS
    );
    return response.data;
  },

  /** GET /core/archetypes/filteritems */
  getArchetypeFilterItems: async (
    params?: BirdArchetypeFilterParams
  ): Promise<FilterItemsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = value;
        }
      });
    }
    const response = await apiClient.get<FilterItemsResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_FILTER_ITEMS,
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /** POST /core/archetypes/fetchAll */
  fetchAllArchetypes: async (
    filters?: BirdArchetypeFilterRequest | MushroomArchetypeFilterRequest,
    pagination?: {
      pageNo?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<MushroomArchetypeListResponse> => {
    if (__DEV__) {
      console.log(
        "[core.api] archetype fetchAll (POST /core/archetypes/fetchAll)",
        {
          filters: filters ?? {},
          pagination: pagination ?? {},
        }
      );
    }
    const queryParams: Record<string, any> = {};
    if (pagination) {
      if (pagination.pageNo !== undefined)
        queryParams.pageNo = pagination.pageNo;
      if (pagination.pageSize !== undefined)
        queryParams.pageSize = pagination.pageSize;
      if (pagination.search) queryParams.search = pagination.search;
    }
    const response = await apiClient.post<MushroomArchetypeListResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_LIST,
      filters || {},
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /** GET /core/archetypes/getDetails/:id */
  getArchetypeDetails: async (
    id: string
  ): Promise<MushroomArchetypeDetailResponse> => {
    const response = await apiClient.get<MushroomArchetypeDetailResponse>(
      `${API_ENDPOINTS.CORE.ARCHETYPE_DETAILS}/${id}`
    );
    return response.data;
  },

  /** PUT /core/archetypes/identified/add/:id */
  addIdentifiedArchetype: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.put<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.ARCHETYPE_IDENTIFIED_ADD}/${id}`
    );
    return response.data;
  },

  /** PUT /core/archetypes/wishlist/add/:id */
  addWishlistArchetype: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.put<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.WISHLIST_ADD}/${id}`
    );
    return response.data;
  },

  /** DELETE /core/archetypes/wishlist/remove/:id */
  removeWishlistArchetype: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.WISHLIST_REMOVE}/${id}`
    );
    return response.data;
  },

  /** GET /core/archetypes/stats */
  getArchetypeStats: async (): Promise<MushroomArchetypeStatsResponse> => {
    const response = await apiClient.get<MushroomArchetypeStatsResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_STATS
    );
    return response.data;
  },

  /** GET /core/archetypes/specimens-of-the-day */
  getSpecimensOfTheDay: async (): Promise<MushroomArchetypeListResponse> => {
    const response = await apiClient.get<MushroomArchetypeListResponse>(
      API_ENDPOINTS.CORE.SPECIMENS_OF_THE_DAY
    );
    return response.data;
  },
};
