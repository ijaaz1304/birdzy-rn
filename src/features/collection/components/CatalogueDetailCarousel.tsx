/**
 * Catalogue detail image carousel – free user spec.
 * Height 180px, radius 12px, pagination dots (selected 24×6 #FFF, unselected 6×6 white 0.2),
 * left/right arrow buttons (32h, radius 24, bg light rgba(255,255,255,0.2) / dark #6D6D6D).
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { CATALOGUE_DETAIL, UI_COLORS } from "../../../constants/colorConstants";
import { Images } from "../../../assets";
import { CachedRemoteImage } from "@/components/AppImage";

import { Radius } from "../../../design";

/** Figma 807:256509 — photo inset 20pt from each screen edge */
const SIDE_MARGIN = 20;
/** Figma slider — arrow buttons sit 12pt inside the photo edge */
const ARROW_INSET = 12;

export interface CatalogueDetailCarouselProps {
  images: Array<{ id: string; uri: string | number }>;
  isDark?: boolean;
  /** Width as percent of screen (e.g. 90 for identification). Default 100. */
  widthPercent?: number;
  /** When true and widthPercent >= 100, use full SCREEN_WIDTH (identification flow only). */
  isIdentificationFlow?: boolean;
  /** Auto-advance to next image every N ms. Omit or 0 to disable. */
  autoScrollInterval?: number;
}

export const CatalogueDetailCarousel: React.FC<
  CatalogueDetailCarouselProps
> = ({
  images,
  isDark = false,
  widthPercent = 100,
  isIdentificationFlow = false,
  autoScrollInterval = 0,
}) => {
  /** Responsive: re-measures on rotation / split-screen / foldables */
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  /** Per-slide: hide spinner after load or on error (avoid blank white while fetching). */
  const [loadedById, setLoadedById] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const imagesKey = images.map((i) => i.id).join("|");
  useEffect(() => {
    setLoadedById({});
  }, [imagesKey]);
  const slideWidth =
    widthPercent >= 100
      ? isIdentificationFlow
        ? SCREEN_WIDTH
        : SCREEN_WIDTH - SIDE_MARGIN * 2
      : Math.round((SCREEN_WIDTH * widthPercent) / 100);

  const arrowBg = isDark
    ? CATALOGUE_DETAIL.ARROW_BG_DARK
    : CATALOGUE_DETAIL.ARROW_BG_LIGHT;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / slideWidth);
    setActiveIndex(index);
  };

  const goPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    scrollRef.current?.scrollTo({
      x: next * slideWidth,
      animated: true,
    });
    setActiveIndex(next);
  };

  const goNext = () => {
    const next =
      activeIndex >= images.length - 1
        ? 0
        : Math.min(images.length - 1, activeIndex + 1);
    scrollRef.current?.scrollTo({
      x: next * slideWidth,
      animated: true,
    });
    setActiveIndex(next);
  };

  // Auto-scroll when autoScrollInterval > 0, more than one image, and first slide loaded
  useEffect(() => {
    if (!autoScrollInterval || images.length <= 1) return;
    const firstId = images[0]?.id;
    if (firstId && loadedById[firstId] !== true) return;
    const id = setInterval(() => {
      const current = activeIndexRef.current;
      const next = current >= images.length - 1 ? 0 : current + 1;
      scrollRef.current?.scrollTo({
        x: next * slideWidth,
        animated: true,
      });
      setActiveIndex(next);
      activeIndexRef.current = next;
    }, autoScrollInterval);
    return () => clearInterval(id);
  }, [autoScrollInterval, images.length, slideWidth, loadedById, images]);

  const visibleSlideIndexes = useMemo(() => {
    const set = new Set<number>();
    for (let i = activeIndex - 1; i <= activeIndex + 1; i++) {
      if (i >= 0 && i < images.length) set.add(i);
    }
    return set;
  }, [activeIndex, images.length]);

  const imageRadius = isIdentificationFlow ? 0 : CATALOGUE_DETAIL.IMAGE_RADIUS;
  const imageHeight = isIdentificationFlow
    ? 230
    : CATALOGUE_DETAIL.IMAGE_HEIGHT;

  const placeholderBg = isDark
    ? CATALOGUE_DETAIL.ARROW_BG_DARK
    : CATALOGUE_DETAIL.ARROW_BG_LIGHT;

  if (!images || images.length === 0) {
    return (
      <View
        style={[
          styles.card,
          {
            height: imageHeight,
            borderRadius: imageRadius,
            backgroundColor: placeholderBg,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <AppImage
          source={Images.card_image_placeholder}
          style={{ width: "100%", height: "100%", borderRadius: imageRadius }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.scroll, { width: slideWidth, height: imageHeight }]}
      >
        {images.map((img, index) => {
          const uriStr = typeof img.uri === "string" ? img.uri : "";
          const isRemote =
            typeof img.uri === "string" &&
            (uriStr.startsWith("http") ||
              uriStr.startsWith("https") ||
              uriStr.startsWith("file"));
          const showSpinner = isRemote && loadedById[img.id] !== true;
          const imageStyle = [
            styles.image,
            {
              width: slideWidth,
              height: imageHeight,
              borderRadius: imageRadius,
            },
          ];
          const markDone = () =>
            setLoadedById((prev) => ({ ...prev, [img.id]: true }));

          if (!visibleSlideIndexes.has(index)) {
            return (
              <View
                key={img.id}
                style={[
                  styles.slideWrap,
                  {
                    width: slideWidth,
                    height: imageHeight,
                    borderRadius: imageRadius,
                    backgroundColor: placeholderBg,
                  },
                ]}
              />
            );
          }

          return (
            <View
              key={img.id}
              style={[
                styles.slideWrap,
                {
                  width: slideWidth,
                  height: imageHeight,
                  borderRadius: imageRadius,
                  backgroundColor: placeholderBg,
                },
              ]}
            >
              {isRemote ? (
                <CachedRemoteImage
                  uri={uriStr}
                  style={imageStyle}
                  borderRadius={imageRadius}
                  priority={index === activeIndex ? "high" : "normal"}
                  onLoad={markDone}
                  onError={markDone}
                />
              ) : (
                <AppImage
                  source={
                    typeof img.uri === "string"
                      ? { uri: img.uri }
                      : (img.uri as number)
                  }
                  defaultSource={
                    typeof img.uri === "number"
                      ? img.uri
                      : Images.card_image_placeholder
                  }
                  style={imageStyle}
                  resizeMode="cover"
                  onLoadEnd={markDone}
                  onError={markDone}
                />
              )}
              {showSpinner ? (
                <View style={styles.spinnerOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color={UI_COLORS.WHITE} />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Left / Right arrows — only when more than one image */}
      {images.length > 1 && (
        <View
          style={[
            styles.arrowsRow,
            isIdentificationFlow && styles.arrowsRowLower,
            {
              paddingHorizontal:
                Math.max(0, (SCREEN_WIDTH - slideWidth) / 2) + ARROW_INSET,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={goPrev}
            style={[styles.arrowBtn, { backgroundColor: arrowBg }]}
            disabled={activeIndex === 0}
          >
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={UI_COLORS.WHITE}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={[styles.arrowBtn, { backgroundColor: arrowBg }]}
            disabled={activeIndex === images.length - 1}
          >
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={UI_COLORS.WHITE}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Dots: selected 24×6 #FFF, unselected 6×6 white 0.2 — only when more than one image */}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? {
                      width: CATALOGUE_DETAIL.DOT_SELECTED_WIDTH,
                      height: CATALOGUE_DETAIL.DOT_SELECTED_HEIGHT,
                      backgroundColor: CATALOGUE_DETAIL.DOT_SELECTED_COLOR,
                    }
                  : {
                      width: CATALOGUE_DETAIL.DOT_UNSELECTED_SIZE,
                      height: CATALOGUE_DETAIL.DOT_UNSELECTED_SIZE,
                      borderRadius: CATALOGUE_DETAIL.DOT_UNSELECTED_SIZE / 2,
                      backgroundColor: CATALOGUE_DETAIL.ARROW_BG_LIGHT,
                    },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignSelf: "stretch",
  },
  scroll: {
    alignSelf: "center",
    borderRadius: Radius.md,
  },
  card: {
    alignSelf: "stretch",
  },
  slideWrap: {
    position: "relative",
    overflow: "hidden",
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  image: {
    marginHorizontal: 0,
  },
  arrowsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arrowsRowLower: {
    top: 52,
  },
  arrowBtn: {
    height: 32,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  /** Figma pagin: 8pt from the photo bottom, 4pt between dots */
  dots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    borderRadius: 3,
  },
});
