import { Image } from "react-native";
import FastImage from "react-native-fast-image";

const prefetchedUris = new Set<string>();
const prefetchedReadyUris = new Set<string>();

export function isRemoteImageCacheReady(
  uri: string | undefined | null
): boolean {
  const trimmed = uri?.trim();
  return !!trimmed && prefetchedReadyUris.has(trimmed);
}

/** Call from FastImage onLoad — never from FastImage.preload() kickoff. */
export function markRemoteImageCacheReady(
  uri: string | undefined | null
): void {
  const trimmed = uri?.trim();
  if (trimmed) prefetchedReadyUris.add(trimmed);
}

function isPrefetchableUri(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

/**
 * Kick off FastImage disk-cache warming. Does not mark the URI ready:
 * FastImage.preload() is fire-and-forget and has no completion signal.
 */
function loadRemoteImageIntoCache(uri: string): void {
  if (prefetchedUris.has(uri)) return;
  prefetchedUris.add(uri);
  FastImage.preload([
    {
      uri,
      priority: FastImage.priority.high,
      cache: FastImage.cacheControl.immutable,
    },
  ]);
  void Image.prefetch(uri);
}

export async function prefetchRemoteImage(
  uri: string | undefined | null
): Promise<void> {
  const trimmed = uri?.trim();
  if (!trimmed || !isPrefetchableUri(trimmed)) return;
  loadRemoteImageIntoCache(trimmed);
}

/**
 * Warm the FastImage disk cache for catalogue/list thumbnails (deduped per session).
 * Does not skip CachedRemoteImage placeholders — that happens only after onLoad.
 */
export function prefetchRemoteImages(
  uris: Array<string | undefined | null>,
  limit = 40
): void {
  const batch: { uri: string }[] = [];

  for (const raw of uris) {
    if (batch.length >= limit) break;
    const uri = raw?.trim();
    if (!uri || !isPrefetchableUri(uri) || prefetchedUris.has(uri)) {
      continue;
    }
    prefetchedUris.add(uri);
    batch.push({ uri });
  }

  if (batch.length > 0) {
    FastImage.preload(
      batch.map((item) => ({
        uri: item.uri,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable,
      }))
    );
    batch.forEach((item) => {
      void Image.prefetch(item.uri);
    });
  }
}

/**
 * Fire FastImage.preload for result thumbnails before navigation.
 * Caps wait so a slow CDN never blocks the transition indefinitely.
 * Preload has no completion callback, so this only bounds scheduling — not decode.
 */
export async function awaitPrefetchRemoteImages(
  uris: Array<string | undefined | null>,
  limit = 5,
  timeoutMs = 8000
): Promise<void> {
  const unique: string[] = [];
  for (const raw of uris) {
    if (unique.length >= limit) break;
    const uri = raw?.trim();
    if (!uri || !isPrefetchableUri(uri) || unique.includes(uri)) continue;
    unique.push(uri);
  }
  if (unique.length === 0) return;

  unique.forEach((uri) => loadRemoteImageIntoCache(uri));

  // FastImage.preload has no completion callback. Keep the timeout hook so
  // callers can still bound any future wait without blocking navigation.
  void timeoutMs;
}
