/**
 * CardImageCarousel – single or multiple images with optional auto-slide.
 * Used in list cards (AppCard, BirdCard). Handles empty, single, multiple, and errors.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, ViewStyle, LayoutChangeEvent } from "react-native";
import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import { Images } from "../../assets";
import { normalizeImageUrls } from "../../utils/mushroomCardUtils";

import { APP_COLORS } from "../../config/colors";

const DEFAULT_AUTO_SLIDE_INTERVAL_MS = 3500;
const PAUSE_AFTER_MANUAL_SCROLL_MS = 4000;

export interface CardImageCarouselProps {
  /** Image URLs (strings) or mixed API shape – normalized via normalizeImageUrls */
  imageUrls: unknown[] | string[] | undefined | null;
  /** Fallback single image source when imageUrls is empty (e.g. { uri } or require()) */
  fallbackImage?: { uri: string } | number | null;
  /** Auto-advance interval in ms when multiple images. 0 disables. */
  autoSlideIntervalMs?: number;
  /** Callback when an image fails to load (optional) */
  onImageError?: (index: number) => void;
  /** Container style (e.g. from parent for aspect ratio) */
  style?: ViewStyle;
  /** Border radius for images */
  borderRadius?: number;
}

export const CardImageCarousel: React.FC<CardImageCarouselProps> = ({
  imageUrls: rawUrls,
  fallbackImage,
  autoSlideIntervalMs = DEFAULT_AUTO_SLIDE_INTERVAL_MS,
  onImageError,
  style,
  borderRadius = 0,
}) => {
  const uris = normalizeImageUrls(rawUrls);
  const hasFallback =
    fallbackImage != null &&
    (typeof fallbackImage === "number" ||
      (typeof fallbackImage === "object" &&
        "uri" in fallbackImage &&
        fallbackImage.uri));
  const effectiveUris = uris.length > 0 ? uris : hasFallback ? [] : [];
  const showFallbackOnly = effectiveUris.length === 0 && hasFallback;
  const displayUris = effectiveUris.length > 0 ? effectiveUris : [];
  const isMulti = displayUris.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseUntilRef = useRef<number>(0);

  const clearAutoSlideTimer = useCallback(() => {
    if (autoSlideTimerRef.current != null) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  }, []);

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      if (containerWidth <= 0 || displayUris.length === 0) return;
      const clamped = Math.max(0, Math.min(index, displayUris.length - 1));
      scrollRef.current?.scrollTo({
        x: clamped * containerWidth,
        animated,
      });
      setActiveIndex(clamped);
    },
    [containerWidth, displayUris.length]
  );

  const startAutoSlide = useCallback(() => {
    if (!isMulti || autoSlideIntervalMs <= 0 || displayUris.length < 2) return;
    clearAutoSlideTimer();
    autoSlideTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now < pauseUntilRef.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % displayUris.length;
        goToIndex(next, true);
        return next;
      });
    }, autoSlideIntervalMs);
  }, [
    isMulti,
    autoSlideIntervalMs,
    displayUris.length,
    clearAutoSlideTimer,
    goToIndex,
  ]);

  useEffect(() => {
    if (isMulti && autoSlideIntervalMs > 0) startAutoSlide();
    return clearAutoSlideTimer;
  }, [isMulti, autoSlideIntervalMs, startAutoSlide, clearAutoSlideTimer]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isMulti || containerWidth <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / containerWidth);
      if (index !== activeIndex) {
        setActiveIndex(index);
        pauseUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL_SCROLL_MS;
      }
    },
    [isMulti, containerWidth, activeIndex]
  );

  const handleImageError = useCallback(
    (index: number) => {
      setErrorIndices((prev) => new Set(prev).add(index));
      onImageError?.(index);
    },
    [onImageError]
  );

  const renderRemoteImage = useCallback(
    (uri: string, onError: () => void) => (
      <CachedRemoteImage
        uri={uri}
        style={styles.image}
        borderRadius={borderRadius}
        priority="high"
        onError={onError}
      />
    ),
    [borderRadius]
  );

  useEffect(() => setErrorIndices(new Set()), [rawUrls]);

  // Single image or fallback only
  if (displayUris.length === 0 && !showFallbackOnly) {
    return (
      <View style={[styles.fill, style]} onLayout={handleLayout}>
        <AppImage
          source={Images.card_image_placeholder}
          style={[styles.image, { borderRadius }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (showFallbackOnly) {
    if (typeof fallbackImage === "number") {
      return (
        <View style={[styles.fill, style]} onLayout={handleLayout}>
          <AppImage
            source={fallbackImage}
            style={[styles.image, { borderRadius }]}
            resizeMode="cover"
          />
        </View>
      );
    }
    const uri = (fallbackImage as { uri: string }).uri;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return (
        <View style={[styles.fill, style]} onLayout={handleLayout}>
          {renderRemoteImage(uri, () => {})}
        </View>
      );
    }
    return (
      <View style={[styles.fill, style]} onLayout={handleLayout}>
        <AppImage
          source={{ uri }}
          style={[styles.image, { borderRadius }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (displayUris.length === 1) {
    const uri = displayUris[0];
    const hasError = errorIndices.has(0);
    return (
      <View style={[styles.fill, style]} onLayout={handleLayout}>
        {hasError ? (
          <AppImage
            source={Images.card_image_placeholder}
            style={[styles.image, { borderRadius }]}
            resizeMode="cover"
          />
        ) : (
          renderRemoteImage(uri, () => handleImageError(0))
        )}
      </View>
    );
  }

  // Multiple images: horizontal paging + dots (wait for layout so width is known)
  if (containerWidth <= 0) {
    return (
      <View style={[styles.fill, style]} onLayout={handleLayout}>
        {renderRemoteImage(displayUris[0], () => handleImageError(0))}
      </View>
    );
  }

  return (
    <View style={[styles.fill, style]} onLayout={handleLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
      >
        {displayUris.map((uri, index) => {
          const hasError = errorIndices.has(index);
          return (
            <View
              key={`${uri}-${index}`}
              style={[styles.slide, { width: containerWidth }]}
            >
              {hasError ? (
                <AppImage
                  source={Images.card_image_placeholder}
                  style={[styles.image, { borderRadius }]}
                  resizeMode="cover"
                />
              ) : (
                renderRemoteImage(uri, () => handleImageError(index))
              )}
            </View>
          );
        })}
      </ScrollView>
      {/* Dots hidden on catalogue/card carousels – see styles.dots below to re-enable */}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  slide: {
    flex: 1,
    height: "100%",
  },
  // Dots (page indicators) – kept for re-enable; currently not rendered on card carousels
  dots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.blurOverlayWhite95,
  },
  dotInactive: {
    backgroundColor: APP_COLORS.blurOverlayWhite40,
  },
});
