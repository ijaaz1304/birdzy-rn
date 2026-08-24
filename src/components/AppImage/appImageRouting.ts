/**
 * Pure routing rules for AppImage / AppImageBackground.
 * Extracted for unit tests and verify-app-image-routing.js (via duplicated logic in script).
 */

import { Platform, Image, type ImageSourcePropType, type ImageURISource } from "react-native";

export type AppImageRenderer = "fast-image" | "rn-image";

export type AppImagePlatform = "ios" | "android";

/** Runtime options — tintColor requires RN Image (FastImage ignores it). */
export type AppImageResolveOptions = {
  /**
   * Use RN Image so `tintColor` works (bundled WebP needs webp-format on iOS).
   */
  requiresTintColor?: boolean;
  /**
   * Use RN Image for bundled assets that must paint immediately
   * (camera overlay icons). FastImage decodes async and can lag behind VisionCamera.
   */
  preferRNImage?: boolean;
};

export function isRemoteImageSource(
  source: ImageSourcePropType | undefined
): boolean {
  if (!source) return false;
  if (Array.isArray(source)) {
    return source.some((entry) => {
      if (typeof entry === "number") return false;
      return Boolean((entry as ImageURISource)?.uri);
    });
  }
  if (typeof source === "number") return false;
  return Boolean((source as ImageURISource).uri);
}

/** http(s) only — local file/content/ph URIs should use RN Image, not FastImage. */
export function isHttpRemoteUri(uri: string | undefined): boolean {
  if (!uri) return false;
  return uri.startsWith("http://") || uri.startsWith("https://");
}

export function getBundledAssetUri(source: number): string {
  return Image.resolveAssetSource(source)?.uri?.toLowerCase() ?? "";
}

export function isBundledWebpAsset(source: number): boolean {
  return getBundledAssetUri(source).includes(".webp");
}

/** Static check from registry path (used by CI script without loading RN assets). */
export function getExpectedRendererForBundledPath(
  _platform: AppImagePlatform,
  _assetRelativePath: string
): AppImageRenderer {
  // Bundled assets paint via RN Image (first frame). FastImage is http(s) only.
  void _platform;
  void _assetRelativePath;
  return "rn-image";
}

export function getExpectedRendererForRemoteUrl(
  uri: string
): AppImageRenderer {
  return isHttpRemoteUri(uri) ? "fast-image" : "rn-image";
}

/**
 * Returns which native renderer AppImage / AppImageBackground should use.
 * Returns null when source is missing (caller renders nothing).
 */
export function resolveAppImageRenderer(
  source: ImageSourcePropType | undefined,
  platform: AppImagePlatform = Platform.OS as AppImagePlatform,
  options?: AppImageResolveOptions
): AppImageRenderer | null {
  if (source == null) return null;

  if (typeof source === "number") {
    // Bundled PNG/WebP/JPEG: RN Image so they paint on the first frame.
    // FastImage always decodes async (blank then pop-in on Home, onboarding, tabs).
    void platform;
    void options;
    return "rn-image";
  }

  if (isRemoteImageSource(source)) {
    const uri =
      typeof source === "object" && !Array.isArray(source)
        ? String((source as ImageURISource).uri ?? "")
        : "";
    return getExpectedRendererForRemoteUrl(uri);
  }

  return "rn-image";
}

export function shouldUseFastImage(
  source: ImageSourcePropType | undefined,
  platform: AppImagePlatform = Platform.OS as AppImagePlatform,
  options?: AppImageResolveOptions
): boolean {
  const renderer = resolveAppImageRenderer(source, platform, options);
  return renderer === "fast-image";
}

/** AppImageBackground must call the same resolver — enforced in tests. */
export const resolveAppImageBackgroundRenderer = resolveAppImageRenderer;
