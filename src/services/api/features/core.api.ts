/**
 * Core Module API endpoints
 * Complete implementation matching backend API structure
 * All endpoints use constants - no hardcoded values
 */

import { apiClient } from "../axios";
import { API_ENDPOINTS } from "../../../constants/api";
import { API_BASE_URL, API_TIMEOUT } from "../../../constants/env";
import { useAuthStore } from "../../../features/auth/auth.store";
import { ApiException, NetworkException } from "../errors";
import { BackendApiResponse } from "./auth.api.types";
import type {
  BirdIdentifyResponse,
  BirdArchetypeListResponse,
  BirdStepByStepRequest,
  BirdGalleryAudioResponse,
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
  MushroomArchetypeFilterParams,
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
async function postFormData<T>(
  path: string,
  formData: FormData,
  options?: { timeoutMs?: number }
): Promise<T> {
  const url = buildApiUrl(path);
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeoutMs = options?.timeoutMs ?? API_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = (await res.json().catch(() => ({}))) as T;
    if (!res.ok) {
      throw new ApiException(
        (data as any)?.reason || res.statusText || "Request failed",
        res.status
      );
    }
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiException) throw err;
    if (err?.name === "AbortError") {
      throw new ApiException("Request timeout. Please try again.", 408);
    }
    throw new NetworkException();
  }
}

/**
 * Core API service
 * All endpoints match the backend API documentation
 */
export const coreApi = {
  /**
   * POST /core/ai/identify
   * Identify a mineral from uploaded images using an AI-based CNN identification pipeline
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Body: multipart/form-data
   *   - files (required): Array of image files
   *   - userLocation (optional): JSON array `[latitude, longitude]` when location is enabled
   *
   * Middlewares: AI usage quota check for free plan users
   *
   * Response (200 OK - Identification successful):
   * Same shape as example: data.imageUrls, data.matchesFoundCount, data.matches[]
   * Each match: full mineral object (camelCase) + similarityScore (0–1).
   * {
   *   "error": false,
   *   "data": {
   *     "imageUrls": ["https://..."],
   *     "matchesFoundCount": 5,
   *     "matches": [
   *       {
   *         "_id": "...",
   *         "mindatId": 289,
   *         "canonicalName": "aquamarine",
   *         "commonName": "Aquamarine",
   *         "scientificName": "Aquamarine",
   *         "similarityScore": 0.9342423,
   *         "detailedDescription": "...",
   *         "nameOrigin": "...",
   *         ... // full mineral
   *       }
   *     ]
   *   }
   * }
   *
   * Response (200 OK - No matches):
   * {
   *   "error": false,
   *   "data": {
   *     "imageUrls": [],
   *     "matchesFoundCount": 0,
   *     "matches": []
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "No files were uploaded." }
   * Error (400): { "error": true, "reason": "File must be an image (jpeg, png, gif)" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  identify: async (
    files: any[],
    options?: { userLocation?: [number, number] }
  ): Promise<IdentifyResponse> => {
    if (!files?.length) {
      throw new Error("At least one image file is required for identification");
    }
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

  /**
   * POST /core/ai/identify-sound
   * Identify a bird from a single audio recording.
   */
  identifySound: async (file: {
    uri: string;
    type?: string;
    name?: string;
  }): Promise<BirdIdentifyResponse> => {
    const formData = new FormData();
    formData.append("files", file as unknown as Blob);
    return postFormData<BirdIdentifyResponse>(
      API_ENDPOINTS.CORE.IDENTIFY_SOUND,
      formData,
      { timeoutMs: IDENTIFY_API_TIMEOUT_MS }
    );
  },

  /**
   * POST /got-bitten
   * Bird bite analysis assistant (multipart: message + optional images).
   */
  gotBitten: async (params: {
    message?: string;
    images?: Array<{ uri: string; type?: string; name?: string }>;
  }): Promise<ChatResponse> => {
    const formData = new FormData();
    if (params.message?.trim()) {
      formData.append("message", params.message.trim());
    }
    params.images?.forEach((img) => formData.append("images", img as unknown as Blob));
    return postFormData<ChatResponse>(API_ENDPOINTS.CORE.GOT_BITTEN, formData);
  },

  /**
   * POST /core/archetypes/step-by-step
   * Nearby birds by location, date, and optional size filter.
   */
  stepByStep: async (
    body: BirdStepByStepRequest,
    pagination?: { pageNo?: number; pageSize?: number }
  ): Promise<BirdArchetypeListResponse> => {
    const queryParams: Record<string, number> = {};
    if (pagination?.pageNo !== undefined) queryParams.pageNo = pagination.pageNo;
    if (pagination?.pageSize !== undefined) {
      queryParams.pageSize = pagination.pageSize;
    }
    const response = await apiClient.post<BirdArchetypeListResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_STEP_BY_STEP,
      body,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * GET /core/gallery/audio
   * Audio gallery: identified recordings and unknown clips.
   */
  getGalleryAudio: async (): Promise<BirdGalleryAudioResponse> => {
    const response = await apiClient.get<BirdGalleryAudioResponse>(
      API_ENDPOINTS.CORE.GALLERY_AUDIO
    );
    return response.data;
  },

  /**
   * POST /core/chat
   * Conversational AI chatbot that can identify minerals/rock/gems from uploaded images
   * and answer questions about minerals/rock/gems. Supports multi-turn conversations with context awareness.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Body: Multipart form data with:
   *   - message (text, optional): The user's message or question
   *   - images (file array, optional): Up to 5 image files for mineral identification
   *
   * Validation:
   * - At least one of message or images must be provided
   * - Maximum 5 images per request
   * - Each image must be under 5MB
   * - Only image file types are accepted (jpeg, png, gif, webp, etc.)
   *
   * Features:
   * - Context-aware conversations: Maintains chat history (last 10 messages)
   * - Image identification: Automatically identifies minerals when images are uploaded
   * - Mineral-focused: Gently steers conversations back to mineral topics
   * - Personalized responses: Uses user's first name when appropriate
   * - Intelligent fallback: Uses external CNN identification API; if CNN fails, LLM attempts visual analysis
   * - Confidence-based responses: Adjusts tone based on identification confidence
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "reply": "Hi C S! How can I help you with minerals, rocks, or gems today?"
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Empty message!!!" }
   * Error (400): { "error": true, "reason": "File size exceeds 5MB limit" }
   * Error (400): { "error": true, "reason": "Maximum 5 files allowed" }
   * Error (400): { "error": true, "reason": "Only image files are allowed" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   *
   * Known Issues:
   * - Empty responses on first image upload: Occasionally returns empty reply string
   * - Workaround: Users can resend message/image, subsequent attempts typically work
   */
  chat: async (message?: string, images?: any[]): Promise<ChatResponse> => {
    const hasMessage = typeof message === "string" && message.trim().length > 0;
    const hasImages = images && images.length > 0;
    if (!hasMessage && !hasImages) {
      throw new Error("At least one of message or images must be provided");
    }
    const formData = new FormData();
    if (hasMessage) {
      formData.append("message", message!.trim());
    }
    if (hasImages) {
      // Backend validation: max 5 images, each < 5MB
      const MAX_IMAGES = 5;
      const MAX_BYTES = 5 * 1024 * 1024;
      if (images!.length > MAX_IMAGES) {
        throw new Error("Maximum 5 files allowed");
      }
      images!.forEach((image) => {
        const size = (image as any)?.fileSize ?? (image as any)?.size;
        if (typeof size === "number" && size > MAX_BYTES) {
          throw new Error("File size exceeds 5MB limit");
        }
        formData.append("images", image as any);
      });
    }
    return postFormData<ChatResponse>(API_ENDPOINTS.CORE.CHAT, formData);
  },

  /**
   * GET /core/specimen/filteritems
   * Fetch distinct values for supported specimen fields to build filter/facet options
   * Results are cached in memory for 24 hours based on the requested fields.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters (all optional):
   *   - entryType (number): 0=Mineral, 1=Synonym, 2=Variety, 5=Grouplist, 6=Polytype, 7=Rock
   *   - recordType (array-enum): APPROVED, DISCREDITED, GRANDFATHERED, PENDING_PUBLICATION, QUESTIONABLE
   *   - crystalSystem (array-enum): Amorphous, Hexagonal, Icosahedral, Isometric, Monoclinic, Orthorhombic, Tetragonal, Triclinic, Trigonal
   *   - transparency (array-enum): Opaque, Translucent, Transparent
   *   - lusture (array-enum): Adamantine, Dull, Earthy, Greasy, Metallic, Pearly, Resinous, Silky, Sub-Adamantine, Sub-Metallic, Sub-Vitreous, Vitreous, Waxy
   *   - tenacity (array-enum): brittle, elastic, flexible, fragile, malleable, sectile, very brittle, waxy
   *   - radioactivity (enum): NOT_RADIOACTIVE, VERY_STRONG, STRONG, MILD, WEAK, UNKNOWN
   *   - magnetism (enum): NONMAGNETIC, MAGNETIC, WEAKLY_MAGNETIC, STRONGLY_MAGNETIC, PARAMAGNETIC, MAGNETIC_AFTER_HEATING, UNKNOWN
   *   - durability (enum): EXCELLENT, GOOD, FAIR, POOR, UNKNOWN
   *   - toughness (enum): EXCELLENT, GOOD, FAIR, POOR_FAIR, POOR, UNKNOWN
   *   - stability (special): If provided, returns nested object with lightStability, heatStability, chemicalsStability, waterOrHumidityStability, thermalShockStability
   *   - healthRisks, amplification, metaphysicalQualities, chakra, zodiacSign, commonlyFoundIn (boolean flags)
   *
   * If no valid fields are provided, API defaults to all supported fields.
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "recordType": ["APPROVED", "GRANDFATHERED"],
   *     "stability": {
   *       "lightStability": ["STABLE"],
   *       "heatStability": ["STABLE"],
   *       ...
   *     }
   *   }
   * }
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getFilterItems: async (params?: {
    entryType?: number;
    recordType?: string[];
    crystalSystem?: string[];
    transparency?: string[];
    lusture?: string[];
    tenacity?: string[];
    radioactivity?: string;
    magnetism?: string;
    durability?: string;
    toughness?: string;
    stability?: boolean;
    healthRisks?: boolean;
    amplification?: boolean;
    metaphysicalQualities?: boolean;
    chakra?: boolean;
    zodiacSign?: boolean;
    commonlyFoundIn?: boolean;
  }): Promise<FilterItemsResponse> => {
    const queryParams: Record<string, any> = {};

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            queryParams[key] = value;
          } else {
            queryParams[key] = value;
          }
        }
      });
    }

    const response = await apiClient.get<FilterItemsResponse>(
      API_ENDPOINTS.CORE.FILTER_ITEMS,
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  /**
   * POST /core/specimen/add
   * Add a new mineral specimen to the user's private collection manually
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Body: JSON object with specimen details
   *
   * Required fields:
   *   - scientificName (string) - mandatory and must be non-empty
   *   - canonicalName (string) - mandatory and must be non-empty
   *   - mindatId (number) - mandatory
   *   - imageUrls (array of strings) - at least one URL required
   *
   * Optional fields:
   *   - commonNames, genusCommonNames, detailedDescription, isIdentified (default: false), isWishlisted (default: false)
   *   - userNotes, customLocation, commonlyFoundIn (array of strings), gpsLocation {latitude, longitude}
   *   - wikipediaUrl, avgPricePerCarat, amplification, chakra (array), cleaningTips (object)
   *   - cleavageType, color (array), danaClass, density, durability (enum)
   *   - elementWeights (object), elements (array), entryType (number), formula
   *   - fractureType, gemTreatment (object), geoRegionTags (array), isGem (boolean)
   *   - lusture (array), magnetism (enum), metaphysicalQualities (array)
   *   - mhMax, mhMin, mindatUrl, mineralComposition (array), mohsHardness
   *   - nameOrigin, radioactivity (enum), rarityScore (number), recordType (array)
   *   - revitalizeCharging, revitalizeCleansing, rimax, rimin
   *   - scratchResistance, stability (object), streak, strunzClass
   *   - synonyms (array), tenacity (array), toughness (enum), transparency (array)
   *   - worksWellWith (array), zodiacSign (array), storage (object), healthRisks
   *   - _archetype (string, ObjectId), matchScore (number or ObjectId)
   *   - rating (number, 1-5), comment (string)
   *   - _collection (string, ObjectId) - optional; if omitted, default collection is used
   *
   * Validation:
   * - imageUrls must have at least one element → 400: "At least one image URL must be provided"
   * - scientificName must be non-empty → 400: "`scientificName` is mandatory and cannot be empty"
   * - mindatId must be a number → 400: "`mindatId` is mandatory and cannot be empty"
   * - canonicalName must be non-empty → 400: "`canonicalName` is mandatory and cannot be empty"
   * - rating must be 1-5 if provided → 400: "`rating` must be a number between 1 and 5"
   * - comment must be string if provided → 400: "`comment` must be a string"
   * - _collection must exist and belong to user → 400: "Invalid collection ID or collection doesn't belong to user"
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     "mindatId": 2303,
   *     "canonicalName": "kyanite",
   *     "scientificName": "Kyanite",
   *     ... // Complete specimen object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "At least one image URL must be provided" }
   * Error (400): { "error": true, "reason": "`scientificName` is mandatory and cannot be empty" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  addSpecimen: async (
    data: AddMushroomSpecimenRequest
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.post<MushroomSpecimenDetailResponse>(
      API_ENDPOINTS.CORE.SPECIMEN_ADD,
      data
    );
    return response.data;
  },

  /**
   * POST /core/specimen/fetchAll
   * Fetch all mineral specimens in the user's private collection with optional search filters and pagination
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters (optional):
   *   - pageNo (number, default: 0) - Page number
   *   - pageSize (number, default: 20) - Page size
   *   - search (string, optional) - Full-text search on scientificName, canonicalName, or detailedDescription
   *   - collectionId (string, optional) - Filter specimens by collection ID
   *
   * Body: JSON object with filter fields (all values must be arrays). Only the following fields are accepted:
   *   - entryType (Number[]), isGem (Boolean[]), recordType (String[]), crystalSystem (String[])
   *   - color (String[]), transparency (String[]), lusture (String[]), tenacity (String[])
   *   - radioactivity (String[]), magnetism (String[]), danaClass (String[]), strunzClass (String[])
   *   - durability (String[]), scratchResistance (String[]), toughness (String[])
   *   - lightStability, heatStability, chemicalsStability, waterOrHumidityStability, thermalShockStability (String[])
   *   - amplification (String[]), metaphysicalQualities (String[]), charkra (String[]), zodiacSign (String[])
   *   - _archetype (String[]), isIdentified (Boolean[]), isWishlisted (Boolean[]), _collection (String[])
   *
   * Validation Notes:
   * - All filter fields must be arrays; otherwise 400: "The following query filter fields specified non-array values: ..."
   * - Only allowed filter fields are accepted; invalid fields → 400: "Invalid query filter fields: ..."
   * - collectionId is verified to belong to the user
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": [
   *     {
   *       "specimenId": "...",
   *       "scientificName": "Aquamarine",
   *       "imageUrls": ["..."],
   *       "isIdentified": true,
   *       "isWishlisted": true,
   *       "collection": { "collectionId": "...", "name": "...", "description": "..." },
   *       "entryType": 2,
   *       "isGem": true
   *     }
   *   ],
   *   "pagination": {
   *     "pageNo": 0,
   *     "pageSize": 20,
   *     "totalCount": 4,
   *     "totalPages": 1
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Invalid query filter fields: invalidField" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  fetchAllSpecimens: async (
    filters?: MushroomSpecimenFilterRequest,
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

  /**
   * GET /core/specimen/getDetails/:id
   * Get details of a particular mineral specimen in the user's private collection
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomSpecimen ID
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     "mindatId": 289,
   *     "canonicalName": "aquamarine",
   *     "scientificName": "Aquamarine",
   *     ... // Complete specimen object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect MushroomSpecimen ID" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getSpecimenDetails: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.get<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_DETAILS}/${id}`
    );
    return response.data;
  },

  /**
   * PATCH /core/specimen/update/:id
   * Update a particular mineral specimen in the user's private collection
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomSpecimen ID
   * Body: JSON object with one or more updatable fields:
   *   - commonNames, genusCommonNames, scientificName, canonicalName, detailedDescription
   *   - userNotes, customLocation, isIdentified
   *   - isWishlisted (Boolean) - Cannot be set to true via this endpoint
   *   - _collection (string, ObjectId) - Must belong to authenticated user or be null
   *   - _archetype (string, ObjectId)
   *
   * Important:
   * - Fields other than the above are not updatable → 400: "Invalid update fields: ..."
   * - isWishlisted cannot be set to true → 400: "You cannot wishlist a specimen using this endpoint!"
   * - _collection must belong to authenticated user → 400: "Invalid collection ID or collection doesn't belong to user"
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     ... // Updated specimen object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect MushroomSpecimen ID" }
   * Error (400): { "error": true, "reason": "Invalid update fields: invalidField" }
   * Error (400): { "error": true, "reason": "You cannot wishlist a specimen using this endpoint!" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  updateSpecimen: async (
    id: string,
    data: UpdateMushroomSpecimenRequest
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.patch<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_UPDATE}/${id}`,
      data
    );
    return response.data;
  },

  /**
   * DELETE /core/specimen/delete/:id
   * Delete a particular specimen from the private collection
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomSpecimen ID
   *
   * Response (200 OK):
   * {
   *   "error": false
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect MushroomSpecimen ID" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  deleteSpecimen: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.SPECIMEN_DELETE}/${id}`
    );
    return response.data;
  },

  /**
   * POST /core/collections/add
   * Create a new collection for the authenticated user
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Body: JSON object with collection details
   *   - name (string, required) - must be unique for the user
   *   - description (string, optional)
   *   - imageUrl (string, optional)
   *
   * Validation:
   * - name is required and must be unique for the user
   * - If name is missing or already exists → 400: "A collection with this name already exists"
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "collectionId": "...",
   *     "name": "My Awesome mineral Collection",
   *     "description": "...",
   *     "imageUrl": "...",
   *     "specimenCount": 0,
   *     "createdAt": "...",
   *     "updatedAt": "..."
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "A collection with this name already exists" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  addCollection: async (
    data: AddCollectionRequest
  ): Promise<AddCollectionResponse> => {
    const response = await apiClient.post<AddCollectionResponse>(
      API_ENDPOINTS.CORE.COLLECTION_ADD,
      data
    );
    return response.data;
  },

  /**
   * GET /core/collections/fetchAll
   * Fetch all of the user's collections with pagination and optional search
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters:
   *   - pageNo (number, default: 0) - Page number
   *   - pageSize (number, default: 20) - Page size
   *   - search (string, optional) - Full-text search on name/description
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": [
   *     {
   *       "collectionId": "...",
   *       "name": "My Collection",
   *       "description": "...",
   *       "specimenCount": 0,
   *       "createdAt": "...",
   *       "updatedAt": "..."
   *     }
   *   ],
   *   "pagination": {
   *     "pageNo": 0,
   *     "pageSize": 20,
   *     "totalCount": 2,
   *     "totalPages": 1
   *   }
   * }
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
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

  /**
   * GET /core/collections/getDetails/:id
   * Get details of a specific collection by its ID
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - Collection ID
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "collectionId": "...",
   *     "name": "My Collection",
   *     "description": "...",
   *     "imageUrl": "...",
   *     "specimenCount": 5,
   *     "createdAt": "...",
   *     "updatedAt": "..."
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect Collection ID" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getCollectionDetails: async (
    id: string
  ): Promise<CollectionDetailsResponse> => {
    const response = await apiClient.get<CollectionDetailsResponse>(
      `${API_ENDPOINTS.CORE.COLLECTION_DETAILS}/${id}`
    );
    return response.data;
  },

  /**
   * PATCH /core/collections/update/:id
   * Update a collection's details
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - Collection ID
   * Body: JSON object with one or more of the following fields to update:
   *   - name (string) - must remain unique for the user
   *   - description (string)
   *   - imageUrl (string)
   *
   * Validation:
   * - Only the above fields are updatable → 400: "Invalid update fields: ..."
   * - If name is updated, it must remain unique for the user → 400: "A collection with this name already exists"
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "collectionId": "...",
   *     "name": "My Updated Collection",
   *     ... // Updated collection object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Invalid update fields: invalidField" }
   * Error (400): { "error": true, "reason": "A collection with this name already exists" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
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

  /**
   * DELETE /core/collections/delete/:id
   * Delete a collection by its ID
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - Collection ID
   *
   * Response (200 OK):
   * {
   *   "error": false
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect Collection ID" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  deleteCollection: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.COLLECTION_DELETE}/${id}`
    );
    return response.data;
  },

  /**
   * GET /core/collections/stats
   * Get statistics about the user's collections
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "totalCollections": 5
   *   }
   * }
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getCollectionStats: async (): Promise<CollectionStatsResponse> => {
    const response = await apiClient.get<CollectionStatsResponse>(
      API_ENDPOINTS.CORE.COLLECTION_STATS
    );
    return response.data;
  },

  /**
   * GET /core/archetypes/filteritems
   * Get possible values of archetype properties for filtering in the public catalog
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters: Any subset of the following (case sensitive):
   *   - entryType, recordType, crystalSystem, transparency, lusture, tenacity
   *   - radioactivity, magnetism, durability, toughness, stability
   *   - healthRisks, amplification, metaphysicalQualities, chakra, zodiacSign, commonlyFoundIn
   *
   * NOTE 1: Provide the needed fields as query params, e.g. /core/archetypes/filteritems?crystalSystem&lusture&chakra
   * NOTE 2: Query parameters act as selectors only; values passed are ignored
   * NOTE 3: If no valid fields are provided, all valid fields will be returned
   * NOTE 4: If stability (or any stability sub-field) is provided, it will be returned as a nested object containing:
   *         lightStability, heatStability, chemicalsStability, waterOrHumidityStability, thermalShockStability
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "crystalSystem": ["Hexagonal", "Cubic"],
   *     "lusture": ["Vitreous", "Metallic"],
   *     "chakra": ["Root", "Heart"]
   *   }
   * }
   *
   * Response (200 OK - stability requested):
   * {
   *   "error": false,
   *   "data": {
   *     "stability": {
   *       "lightStability": ["MODERATELY_STABLE", "STABLE", "UNSTABLE"],
   *       "heatStability": ["MODERATELY_STABLE", "STABLE", "UNSTABLE"],
   *       ...
   *     }
   *   }
   * }
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getArchetypeFilterItems: async (
    params?: MushroomArchetypeFilterParams
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

  /**
   * POST /core/archetypes/fetchAll
   * Fetch all archetypes (minerals) in the public catalog with filters and pagination
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Query Parameters:
   *   - pageNo (number, default: 0) - Page number
   *   - pageSize (number, default: 20) - Page size
   *   - search (string, optional) - Full-text search on canonicalName, scientificName, detailedDescription
   *
   * Body: JSON object with filter fields (all values must be arrays):
   *   - entryType (Number[]), isGem (Boolean[]), recordType (String[]), crystalSystem (String[])
   *   - color (String[]), transparency (String[]), lusture (String[]), tenacity (String[])
   *   - radioactivity (String[]), magnetism (String[]), danaClass (String[]), strunzClass (String[])
   *   - durability (String[]), scratchResistance (String[]), toughness (String[])
   *   - lightStability, heatStability, chemicalsStability, waterOrHumidityStability, thermalShockStability (String[])
   *   - amplification (String[]), metaphysicalQualities (String[]), charkra (String[]), zodiacSign (String[])
   *
   * Validation Notes:
   * - All filter fields must be arrays. Non-array values → 400: "The following query filter fields specified non-array values: ..."
   * - Only listed fields are allowed. Invalid fields → 400: "Invalid query filter fields: ..."
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": [
   *     {
   *       "archetypeId": "...",
   *       "entryType": 0,
   *       "commonName": "Bloodstone",
   *       "scientificName": "Bloodstone",
   *       "canonicalName": "bloodstone",
   *       "commonlyFoundIn": ["India", "Australia", ...],
   *       "imageUrls": ["https://..."],
   *       "detailedDescription": "...",
   *       "isIdentified": true,
   *       "isWishlisted": false
   *     }
   *   ],
   *   "pagination": {
   *     "pageNo": 0,
   *     "pageSize": 1,
   *     "totalCount": 13
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Invalid query filter fields: invalidField" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  fetchAllArchetypes: async (
    filters?: MushroomArchetypeFilterRequest,
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

  /**
   * GET /core/archetypes/getDetails/:id
   * Get details of a particular archetype (mineral) in the public collection
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomArchetype ID
   *
   * Response (200 OK):
   * Catalogue detail shape: full mineral (camelCase) + archetypeId, imageUrls, isIdentified, isWishlisted.
   * detailedDescription and nameOrigin may be absent for some minerals.
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     "mindatId": 7620,
   *     "canonicalName": "sceptre_quartz",
   *     "scientificName": "Sceptre Quartz",
   *     "archetypeId": "...",
   *     "imageUrls": ["https://..."],
   *     "isIdentified": false,
   *     "isWishlisted": false,
   *     "nameOrigin": "...",
   *     ... // detailedDescription optional
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "Incorrect MushroomArchetype ID" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getArchetypeDetails: async (
    id: string
  ): Promise<MushroomArchetypeDetailResponse> => {
    const response = await apiClient.get<MushroomArchetypeDetailResponse>(
      `${API_ENDPOINTS.CORE.ARCHETYPE_DETAILS}/${id}`
    );
    return response.data;
  },

  /**
   * PUT /core/archetypes/identified/add/:id
   * Add an archetype (mineral) to the user's identified list. This creates a new specimen in the user's private collection.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomArchetype ID
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     "mindatId": 7616,
   *     "canonicalName": "bloodstone",
   *     "scientificName": "Bloodstone",
   *     "_archetype": "...",
   *     "isIdentified": true,
   *     "isWishlisted": false,
   *     "_collection": "...",
   *     "imageUrls": ["https://..."],
   *     ... // Complete specimen object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "You already have an identified specimen of this archetype" }
   * Error (404): { "error": true, "reason": "MushroomArchetype not found" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  addIdentifiedArchetype: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.put<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.ARCHETYPE_IDENTIFIED_ADD}/${id}`
    );
    return response.data;
  },

  /**
   * PUT /core/archetypes/wishlist/add/:id
   * Add an archetype (mineral) to the user's wishlist. Creates a new specimen in the user's private collection with isWishlisted: true.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomArchetype ID
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": {
   *     "_id": "...",
   *     "mindatId": 7619,
   *     "canonicalName": "apricotine",
   *     "scientificName": "Apricotine",
   *     "_archetype": "...",
   *     "isIdentified": false,
   *     "isWishlisted": true,
   *     "_collection": null,
   *     "imageUrls": ["https://..."],
   *     ... // Complete specimen object
   *   }
   * }
   *
   * Error (400): { "error": true, "reason": "This is already in your wishlist, can't add again." }
   * Error (400): { "error": true, "reason": "This is already identified, can't wishlist." }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  addWishlistArchetype: async (
    id: string
  ): Promise<MushroomSpecimenDetailResponse> => {
    const response = await apiClient.put<MushroomSpecimenDetailResponse>(
      `${API_ENDPOINTS.CORE.WISHLIST_ADD}/${id}`
    );
    return response.data;
  },

  /**
   * DELETE /core/archetypes/wishlist/remove/:id
   * Remove an archetype (mineral) from the user's wishlist
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   * Path Parameters: id (string) - MushroomArchetype ID
   *
   * Response (200 OK):
   * {
   *   "error": false
   * }
   *
   * Error (400): { "error": true, "reason": "MushroomArchetype not found in wishlist" }
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  removeWishlistArchetype: async (id: string): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      `${API_ENDPOINTS.CORE.WISHLIST_REMOVE}/${id}`
    );
    return response.data;
  },

  /**
   * GET /core/archetypes/stats
   * Get aggregated statistics about archetypes in the public catalog, including total counts for all archetypes, gems, minerals, and rocks.
   * Results are cached for 24 hours to improve performance.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": [
   *     {
   *       "all": 8314,
   *       "gems": 28,
   *       "minerals": 6195,
   *       "rocks": 66
   *     }
   *   ]
   * }
   *
   * NOTE:
   * - all: Total number of archetypes in the catalog
   * - gems: Archetypes where isGem = true
   * - minerals: Archetypes with entryType = 0
   * - rocks: Archetypes with entryType = 7
   * - Values are returned as an array due to the aggregation pipeline structure
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getArchetypeStats: async (): Promise<MushroomArchetypeStatsResponse> => {
    const response = await apiClient.get<MushroomArchetypeStatsResponse>(
      API_ENDPOINTS.CORE.ARCHETYPE_STATS
    );
    return response.data;
  },

  /**
   * GET /core/archetypes/specimens-of-the-day
   * Get 3 random rare archetypes which has images that change daily.
   * Results are cached in Redis to ensure consistency throughout the day.
   *
   * Request:
   * Headers: Authorization: Bearer <token>
   *
   * Response (200 OK):
   * {
   *   "error": false,
   *   "data": [
   *     {
   *       "_id": "...",
   *       "mindatId": 2625,
   *       "canonicalName": "medenbachite",
   *       "scientificName": "Medenbachite",
   *       "archetypeId": "...",
   *       "imageUrls": ["https://..."],
   *       "isIdentified": false,
   *       "isWishlisted": false,
   *       ... // Complete archetype object
   *     }
   *   ]
   * }
   *
   * NOTE:
   * - Archetypes are selected where non_specified_percentage <= 30 and at least one image is available
   * - isIdentified and isWishlisted are computed per authenticated user
   *
   * Error (500): { "error": true, "reason": "Internal Server Error" }
   */
  getSpecimensOfTheDay: async (): Promise<MushroomArchetypeListResponse> => {
    const response = await apiClient.get<MushroomArchetypeListResponse>(
      API_ENDPOINTS.CORE.SPECIMENS_OF_THE_DAY
    );
    return response.data;
  },
};
