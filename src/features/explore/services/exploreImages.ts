import FastImage from "react-native-fast-image";
const scheduled = new Map<string, number>();
const TTL = 3 * 60 * 1000;
const LIMIT = 500;
/** Explore uses only FastImage, so it does not also warm the separate RN Image cache. */
export function prefetchExplorePhotos(
  uris: Array<string | null | undefined>,
  limit = 8
) {
  const batch: {
    uri: string;
    priority: typeof FastImage.priority.low;
    cache: typeof FastImage.cacheControl.immutable;
  }[] = [];
  for (const raw of uris.slice(0, limit)) {
    const uri = raw?.trim();
    if (!uri || !/^https?:\/\//.test(uri)) continue;
    const at = scheduled.get(uri);
    if (at !== undefined && Date.now() - at < TTL) continue;
    scheduled.delete(uri);
    scheduled.set(uri, Date.now());
    if (scheduled.size > LIMIT)
      scheduled.delete(scheduled.keys().next().value!);
    batch.push({
      uri,
      priority: FastImage.priority.low,
      cache: FastImage.cacheControl.immutable,
    });
  }
  if (batch.length) FastImage.preload(batch);
}
export function forgetExplorePhoto(uri: string) {
  scheduled.delete(uri);
}
