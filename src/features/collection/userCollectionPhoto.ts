/**
 * User photo saved with Add to Collection.
 * Storage writes must use posts/images (rules deny other folders without Firebase Auth).
 * PATCH /specimen/update rejects imageUrls. fetchAll may glue the catalogue folder
 * onto a full photo URL; display keeps the inner URL that actually loads.
 */

export const USER_COLLECTION_PHOTO_STORAGE_PATH = "posts/images";

const REMOTE_URL = /^https?:\/\//i;
const FIREBASE_DOWNLOAD_URL =
  /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?#]+)/i;

export function isRemoteImageUrl(uri: string | undefined | null): boolean {
  return REMOTE_URL.test(uri?.trim() ?? "");
}

/** User capture first, then catalogue URLs, with duplicates removed. */
export function imageUrlsWithUserCaptureFirst(
  userCaptureUrl: string | undefined | null,
  catalogueUrls: string[]
): string[] {
  const first = userCaptureUrl?.trim();
  const seen = new Set<string>();
  const rest: string[] = [];
  if (first) seen.add(first);
  for (const url of catalogueUrls) {
    const value = url?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    rest.push(value);
  }
  return first ? [first, ...rest] : rest;
}

/** fetchAll prefixes a catalogue folder onto a stored absolute photo URL. */
export function unwrapEmbeddedImageUrl(uri: string): string {
  const embedded = uri.slice(1).match(/https?:\/\//i);
  if (embedded?.index != null) return uri.slice(embedded.index + 1);
  const encoded = uri.slice(1).match(/https?%3A%2F%2F/i);
  if (encoded?.index == null) return uri;
  const raw = uri.slice(encoded.index + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Token download URLs paint blank. Public storage.googleapis.com URLs match
 * the catalogue photos that already render.
 */
export function toPublicStorageDisplayUrl(uri: string): string {
  const unwrapped = unwrapEmbeddedImageUrl(uri.trim());
  const match = unwrapped.match(FIREBASE_DOWNLOAD_URL);
  if (!match) return unwrapped;
  let objectPath = match[2];
  try {
    objectPath = decodeURIComponent(objectPath);
  } catch {
    // Keep the encoded path when it is not valid percent-encoding.
  }
  return `https://storage.googleapis.com/${match[1]}/${objectPath}`;
}

export function publicUrlForUploadedPath(
  storageBaseUrl: string,
  storagePath: string
): string {
  const base = storageBaseUrl.replace(/\/$/, "");
  const path = storagePath.replace(/^\//, "");
  return `${base}/${path}`;
}

const IMAGE_UPDATE_KEYS = [
  "imageUrls",
  "images",
  "image_urls",
  "userCapturedImages",
] as const;

/** Specimen update allow-lists reject image fields with HTTP 400. */
export function specimenUpdateWithoutImages<T extends Record<string, unknown>>(
  patch: T
): Omit<T, (typeof IMAGE_UPDATE_KEYS)[number]> {
  const next = { ...patch };
  for (const key of IMAGE_UPDATE_KEYS) {
    delete next[key];
  }
  return next;
}
