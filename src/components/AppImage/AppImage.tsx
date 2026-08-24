/**
 * AppImage — single image pipeline for the app.
 *
 * Use AppImage / AppImageBackground instead of react-native Image / ImageBackground.
 *
 * - Bundled PNG/JPEG/WebP: RN Image (first-frame paint; fadeDuration 0)
 * - Bundled + tintColor: RN Image (FastImage ignores tintColor)
 * - Remote http(s) URLs: FastImage (disk cache)
 * - Local file/content/ph URIs: RN Image (gallery/camera previews)
 *
 * CachedRemoteImage and LoadingImage delegate here.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  ImageBackgroundProps,
  ImageProps,
  ImageResizeMode,
  ImageSourcePropType,
  ImageURISource,
  ImageStyle,
  Platform,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import FastImage, {
  type ImageStyle as FastImageStyle,
  type ResizeMode as FastResizeMode,
} from "react-native-fast-image";
import { Images } from "../../assets";
import { useTheme } from "../../hooks/useTheme";
import {
  isRemoteImageCacheReady,
  markRemoteImageCacheReady,
} from "../../utils/prefetchImages";
import { shouldUseFastImage, type AppImageResolveOptions } from "./appImageRouting";

export type { ImageProps, ImageBackgroundProps, ImageSourcePropType };
export {
  resolveAppImageRenderer,
  resolveAppImageBackgroundRenderer,
  getExpectedRendererForBundledPath,
} from "./appImageRouting";

function toFastResizeMode(mode?: ImageResizeMode): FastResizeMode {
  switch (mode) {
    case "contain":
      return FastImage.resizeMode.contain;
    case "stretch":
      return FastImage.resizeMode.stretch;
    case "center":
      return FastImage.resizeMode.center;
    case "repeat":
      return FastImage.resizeMode.cover;
    default:
      return FastImage.resizeMode.cover;
  }
}

function isCacheableRemoteUri(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

function normalizeFastImageSource(
  source: ImageSourcePropType
): React.ComponentProps<typeof FastImage>["source"] {
  if (typeof source === "number") return source;
  if (Array.isArray(source)) return source as React.ComponentProps<typeof FastImage>["source"];
  const uri = (source as ImageURISource).uri ?? "";
  if (!isCacheableRemoteUri(uri)) return source as { uri: string };
  return {
    uri,
    cache: FastImage.cacheControl.immutable,
    priority: FastImage.priority.high,
  };
}

export type AppImageProps = ImageProps & {
  /** When true, show card placeholder on load error (remote/bundled). */
  fallbackToPlaceholder?: boolean;
  /** Skip FastImage so bundled overlay icons paint immediately. */
  preferRNImage?: boolean;
  pointerEvents?: ViewProps["pointerEvents"];
};

/** FastImage needs explicit % sizing when filling a positioned parent (sheet/modal bgs). */
export const fullBleedImageStyle = {
  ...StyleSheet.absoluteFillObject,
  width: "100%",
  height: "100%",
} as const;

function getResolveOptions(
  style: ImageProps["style"],
  preferRNImage?: boolean
): AppImageResolveOptions | undefined {
  const flat = StyleSheet.flatten(style) as ImageStyle | undefined;
  if (flat?.tintColor != null && preferRNImage) {
    return { requiresTintColor: true, preferRNImage: true };
  }
  if (flat?.tintColor != null) return { requiresTintColor: true };
  if (preferRNImage) return { preferRNImage: true };
  return undefined;
}

/**
 * Only force width/height 100% when absolutely positioned WITHOUT edge fill
 * and without explicit numeric size (icons must keep their px size).
 * StyleSheet.absoluteFillObject already sizes via top/left/right/bottom — adding %
 * can collapse RN Image to 0×0 on Android/sheet layouts (white popup backgrounds).
 */
function shouldApplyFullBleed(style: ImageProps["style"]): boolean {
  const flat = StyleSheet.flatten(style) as ImageStyle | undefined;
  if (!flat) return false;
  if (typeof flat.width === "number" && typeof flat.height === "number") {
    return false;
  }
  if (flat.position !== "absolute") return false;
  const hasEdgeFill =
    flat.top === 0 &&
    flat.left === 0 &&
    flat.right === 0 &&
    flat.bottom === 0;
  if (hasEdgeFill) return false;
  return flat.width !== "100%" || flat.height !== "100%";
}

/** Match RN ImageBackground: absoluteFill in flex/minHeight containers; % sizing only for absolute parents (sheets). */
function getAppImageBackgroundLayerStyle(
  containerStyle: ImageBackgroundProps["style"],
  imageStyle: ImageBackgroundProps["imageStyle"]
): FastImageStyle {
  const flat = StyleSheet.flatten(containerStyle) as ImageStyle | undefined;
  const fillStyle =
    flat?.position === "absolute" ? fullBleedImageStyle : StyleSheet.absoluteFillObject;
  return [fillStyle, imageStyle as FastImageStyle] as FastImageStyle;
}

export function AppImage({
  source,
  style,
  resizeMode,
  fallbackToPlaceholder = false,
  preferRNImage = false,
  onError,
  fadeDuration,
  ...rest
}: AppImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [source]);

  const handleError: NonNullable<ImageProps["onError"]> = (event) => {
    setFailed(true);
    onError?.(event);
  };

  if (fallbackToPlaceholder && failed) {
    return (
      <Image
        source={Images.card_image_placeholder}
        style={style}
        resizeMode={resizeMode ?? "cover"}
        fadeDuration={0}
      />
    );
  }

  const resolveOptions = getResolveOptions(style, preferRNImage);
  const useFullBleed = shouldApplyFullBleed(style);

  if (shouldUseFastImage(source, Platform.OS as "ios" | "android", resolveOptions)) {
    return (
      <FastImage
        source={normalizeFastImageSource(source!)}
        style={
          (useFullBleed
            ? [fullBleedImageStyle, style]
            : style) as FastImageStyle
        }
        resizeMode={toFastResizeMode(resizeMode)}
        onError={() => {
          setFailed(true);
          onError?.({} as Parameters<NonNullable<ImageProps["onError"]>>[0]);
        }}
        {...(rest as object)}
      />
    );
  }

  return (
    <Image
      source={source}
      style={useFullBleed ? [fullBleedImageStyle, style] : style}
      resizeMode={resizeMode}
      fadeDuration={fadeDuration ?? 0}
      onError={handleError}
      {...rest}
    />
  );
}

export type AppImageBackgroundProps = ImageBackgroundProps & {
  /** Skip FastImage so first-screen bundled art paints immediately. */
  preferRNImage?: boolean;
  pointerEvents?: ViewProps["pointerEvents"];
};

export function AppImageBackground({
  source,
  style,
  imageStyle,
  resizeMode,
  children,
  preferRNImage = false,
  ...rest
}: AppImageBackgroundProps) {
  if (shouldUseFastImage(
    source,
    Platform.OS as "ios" | "android",
    preferRNImage ? { preferRNImage: true } : undefined
  )) {
    return (
      <View style={style} {...rest}>
        <FastImage
          source={normalizeFastImageSource(source!)}
          style={getAppImageBackgroundLayerStyle(style, imageStyle)}
          resizeMode={toFastResizeMode(resizeMode)}
          pointerEvents="none"
        />
        {children}
      </View>
    );
  }
  return (
    <ImageBackground
      source={source}
      style={style}
      imageStyle={imageStyle}
      resizeMode={resizeMode}
      fadeDuration={0}
      {...rest}
    >
      {children}
    </ImageBackground>
  );
}

export type CachedRemoteImageProps = {
  uri: string;
  style?: ImageProps["style"];
  containerStyle?: ImageProps["style"];
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  priority?: "low" | "normal" | "high";
  onError?: () => void;
  onLoad?: () => void;
};

const PRIORITY_MAP = {
  low: FastImage.priority.low,
  normal: FastImage.priority.normal,
  high: FastImage.priority.high,
} as const;

/** Remote http(s) image with placeholder until FastImage onLoad. */
export function CachedRemoteImage({
  uri,
  style,
  containerStyle,
  borderRadius = 0,
  resizeMode = "cover",
  priority = "normal",
  onError,
  onLoad,
}: CachedRemoteImageProps) {
  const theme = useTheme();
  const [loaded, setLoaded] = useState(() => isRemoteImageCacheReady(uri));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(isRemoteImageCacheReady(uri));
  }, [uri]);

  const fastSource = useMemo(
    () =>
      uri
        ? {
            uri,
            priority: PRIORITY_MAP[priority],
            cache: FastImage.cacheControl.immutable,
          }
        : null,
    [uri, priority]
  );

  if (!uri) return null;

  const flatStyle = StyleSheet.flatten([style, containerStyle]) as
    | ImageStyle
    | undefined;
  const hasPixelSize =
    typeof flatStyle?.width === "number" &&
    typeof flatStyle?.height === "number";
  const imageFillStyle = [
    cachedStyles.fill,
    { borderRadius },
    hasPixelSize
      ? { width: flatStyle.width, height: flatStyle.height }
      : null,
  ];

  if (failed) {
    return (
      <View
        style={[
          cachedStyles.container,
          { backgroundColor: theme.colors.surfaceVariant, borderRadius },
          style,
          containerStyle,
        ]}
      >
        <AppImage
          source={Images.card_image_placeholder}
          style={imageFillStyle}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!isCacheableRemoteUri(uri)) {
    return (
      <AppImage
        source={{ uri }}
        style={[style, { borderRadius }]}
        resizeMode="cover"
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
    );
  }

  return (
    <View
      style={[
        cachedStyles.container,
        { backgroundColor: theme.colors.surfaceVariant, borderRadius },
        style,
        containerStyle,
      ]}
    >
      <FastImage
        source={fastSource!}
        style={imageFillStyle as FastImageStyle}
        resizeMode={toFastResizeMode(resizeMode)}
        onLoad={() => {
          markRemoteImageCacheReady(uri);
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
      {!loaded ? (
        <View style={cachedStyles.placeholder} pointerEvents="none" />
      ) : null}
    </View>
  );
}

const cachedStyles = StyleSheet.create({
  container: { overflow: "hidden", position: "relative" },
  fill: { ...StyleSheet.absoluteFillObject },
  placeholder: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
});
