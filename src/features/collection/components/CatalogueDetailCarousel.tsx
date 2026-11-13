/**
 * Catalogue detail image carousel – free user spec.
 * Height 180px, radius 12px, pagination dots (selected 24×6 #FFF, unselected 6×6 white 0.2),
 * left/right arrow buttons (48pt touch target, radius 24, bg light rgba(255,255,255,0.2) / dark #6D6D6D).
 */

import { Text } from "../../../atoms/Text";
import { FONTS } from "../../../common/typography";
import Previous from "../../../assets/identification/figma/previous.svg";
import Next from "../../../assets/identification/figma/next.svg";
import { AppImage } from "@/components/AppImage";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
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
  images: Array<{ id: string; uri: string | number; isReference?: boolean }>;
  isDark?: boolean;
  figmaDesign?: boolean;
  /** Width as percent of the measured parent (e.g. 90). Default 100. */
  widthPercent?: number;
  /** When true and widthPercent >= 100, use the full parent width. */
  isIdentificationFlow?: boolean;
  /** Auto-advance to next image every N ms. Omit or 0 to disable. */
  autoScrollInterval?: number;
}

export const CatalogueDetailCarousel: React.FC<
  CatalogueDetailCarouselProps
> = ({
  images,
  figmaDesign = false,
  isDark = false,
  widthPercent = 100,
  isIdentificationFlow = false,
  autoScrollInterval = 0,
}) => {
  /** Responsive: re-measures on rotation / split-screen / foldables */
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const availableWidth = containerWidth || SCREEN_WIDTH;
  const [activeIndex, setActiveIndex] = useState(0);
  /** Per-slide: hide spinner after load or on error (avoid blank white while fetching). */
  const [loadedById, setLoadedById] = useState<Record<string, boolean>>({});
  const [failedById, setFailedById] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const imagesKey = images.map((i) => `${i.id}:${i.uri}`).join("|");
  useEffect(() => {
    setLoadedById({});
    setFailedById({});
    if (figmaDesign) {
      activeIndexRef.current = 0;
      setActiveIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [imagesKey, figmaDesign]);
  const slideWidth =
    widthPercent >= 100
      ? isIdentificationFlow
        ? availableWidth
        : Math.max(1, availableWidth - SIDE_MARGIN * 2)
      : Math.max(
          1,
          Math.round((availableWidth * Math.max(0, widthPercent)) / 100)
        );

  const alignCurrentSlide = useCallback(() => {
    const index = Math.max(
      0,
      Math.min(activeIndexRef.current, images.length - 1)
    );
    activeIndexRef.current = index;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * slideWidth, animated: false });
  }, [slideWidth, images.length]);

  useEffect(alignCurrentSlide, [alignCurrentSlide]);

  const arrowBg = figmaDesign ? "#FFFFFF33" : isDark
    ? CATALOGUE_DETAIL.ARROW_BG_DARK
    : CATALOGUE_DETAIL.ARROW_BG_LIGHT;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const viewportWidth = e.nativeEvent.layoutMeasurement?.width;
    if (viewportWidth && Math.abs(viewportWidth - slideWidth) > 1) return;
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.max(
      0,
      Math.min(images.length - 1, Math.round(x / slideWidth))
    );
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const goPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    scrollRef.current?.scrollTo({
      x: next * slideWidth,
      animated: true,
    });
    activeIndexRef.current = next;
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
    activeIndexRef.current = next;
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
      activeIndexRef.current = next;
      setActiveIndex(next);
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

  const imageRadius = isIdentificationFlow && !figmaDesign ? 0 : CATALOGUE_DETAIL.IMAGE_RADIUS;
  const imageHeight = isIdentificationFlow && !figmaDesign
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
    <View
      style={styles.wrapper}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onContentSizeChange={alignCurrentSlide}
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
              {figmaDesign && failedById[img.id] ? (
                <View style={[imageStyle, { alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#091421" : "#F6F6F6" }]}>
                  <Text style={{ color: isDark ? "#D1D1D1" : "#5D5D5D" }}>No image</Text>
                </View>
              ) : isRemote ? (
                <CachedRemoteImage
                  uri={uriStr}
                  style={imageStyle}
                  borderRadius={imageRadius}
                  priority={index === activeIndex ? "high" : "normal"}
                  onLoad={markDone}
                  onError={() => { markDone(); setFailedById((prev) => ({ ...prev, [img.id]: true })); }}
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
                  onError={() => { markDone(); setFailedById((prev) => ({ ...prev, [img.id]: true })); }}
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

      {figmaDesign && images[activeIndex]?.isReference && (
        <View style={[styles.referenceChip, {
          right: Math.max(0, (availableWidth - slideWidth) / 2) + 8,
          backgroundColor: isDark ? "#16B6B4" : "#01474F", borderColor: isDark ? "#333333" : "#E7E7E7",
        }]}><Text style={[styles.referenceText, { color: isDark ? "#091B21" : "#FFFFFF" }]}>Reference</Text></View>
      )}

      {/* Left / Right arrows — only when more than one image */}
      {images.length > 1 && (
        <View
          style={[
            styles.arrowsRow,
            isIdentificationFlow && !figmaDesign && styles.arrowsRowLower,
            {
              paddingHorizontal:
                Math.max(0, (availableWidth - slideWidth) / 2) + ARROW_INSET,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous image"
            onPress={goPrev}
            style={[styles.arrowBtn, figmaDesign && styles.figmaArrow, { backgroundColor: arrowBg }]}
            disabled={activeIndex === 0}
          >
            {figmaDesign ? <View style={styles.figmaIcon}><Previous /></View> : (
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={UI_COLORS.WHITE}
            /> )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next image"
            onPress={goNext}
            style={[styles.arrowBtn, figmaDesign && styles.figmaArrow, { backgroundColor: arrowBg }]}
            disabled={activeIndex === images.length - 1}
          >
            {figmaDesign ? <View style={styles.figmaIcon}><Next /></View> : (
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={UI_COLORS.WHITE}
            /> )}
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
  figmaArrow: { minWidth: 32, minHeight: 32, width: 32, height: 32, paddingHorizontal: 6 },
  figmaIcon: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  referenceChip: { position: "absolute", top: 8, borderRadius: 100, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 4, maxWidth: "80%" },
  referenceText: { fontFamily: FONTS.medium, fontSize: 12, lineHeight: 16 },
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
    minHeight: 48,
    minWidth: 48,
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
