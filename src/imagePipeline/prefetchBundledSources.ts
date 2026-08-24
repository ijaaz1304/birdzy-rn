import { Image, ImageSourcePropType } from "react-native";
import FastImage from "react-native-fast-image";

function resolveBundledUri(source: ImageSourcePropType): string | null {
  if (typeof source === "number") {
    return Image.resolveAssetSource(source)?.uri ?? null;
  }
  if (Array.isArray(source)) return null;
  const uri = (source as { uri?: string }).uri?.trim();
  return uri || null;
}

/** Warm FastImage + RN Image caches for bundled require() assets and static remote URIs. */
export function prefetchBundledSources(
  sources: ImageSourcePropType[]
): void {
  const uriStrings = sources
    .map(resolveBundledUri)
    .filter((uri): uri is string => !!uri);

  if (uriStrings.length === 0) return;

  FastImage.preload(
    uriStrings.map((uri) => ({ uri, priority: FastImage.priority.high }))
  );
  uriStrings.forEach((uri) => {
    void Image.prefetch(uri);
  });
}

export function prefetchBundledSource(source: ImageSourcePropType): void {
  prefetchBundledSources([source]);
}
