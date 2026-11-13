import { toPublicStorageDisplayUrl } from "./userCollectionPhoto";
export type BirdPhoto = { id: string; uri: string; isReference: boolean };
/** User captures are unbadged in the Birdzy design; only catalogue photos say Reference. */
export function buildBirdPhotoGallery(
  referenceUris: string[],
  captures: string[] = []
): BirdPhoto[] {
  const normalize = (value: string) => {
    const uri = toPublicStorageDisplayUrl(value.trim());
    return uri.startsWith("/") ? `file://${uri}` : uri;
  };
  const known = new Set(captures.filter(Boolean).map(normalize));
  const seen = new Set<string>();
  const photos: BirdPhoto[] = [];
  for (const value of [...captures, ...referenceUris]) {
    if (typeof value !== "string" || !value.trim()) continue;
    const uri = normalize(value);
    if (
      !/^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/|assets-library:\/\/)/i.test(
        uri
      ) ||
      seen.has(uri)
    )
      continue;
    seen.add(uri);
    const isUser =
      known.has(uri) ||
      !/^https?:\/\//i.test(uri) ||
      /\/posts\/(?:[^/?]+\/)*images\//i.test(uri);
    photos.push({ id: `photo-${photos.length}`, uri, isReference: !isUser });
  }
  return photos;
}
