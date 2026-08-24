import { AppImage } from "@/components/AppImage";
import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms/Text";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { OVERLAY_COLORS } from "../../constants/colorConstants";

import { APP_COLORS } from "../../config/colors";
import { Images } from "../../assets";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ARROW_BG_LIGHT = OVERLAY_COLORS.SURFACE_OVERLAY_WHITE_20;
const ARROW_BG_DARK = APP_COLORS.iconBgDark;

export interface ImageCarouselProps {
  images: Array<{ id: string; uri: string | number }>;
  height?: number;
  /** Width as percent of screen (e.g. 90 for 90%). When set, carousel is centered and has this width. */
  widthPercent?: number;
  /** Border radius for the carousel and images */
  borderRadius?: number;
  /** When true (default when widthPercent is set), show left/right arrow buttons. */
  showArrows?: boolean;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 300,
  widthPercent,
  borderRadius,
  showArrows = !!widthPercent,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedById, setLoadedById] = useState<Record<string, boolean>>({});

  const imagesKey = images.map((i) => i.id).join("|");
  useEffect(() => {
    setLoadedById({});
  }, [imagesKey]);

  const carouselWidth =
    widthPercent != null ? (SCREEN_WIDTH * widthPercent) / 100 : SCREEN_WIDTH;
  const arrowBg = isDark ? ARROW_BG_DARK : ARROW_BG_LIGHT;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / carouselWidth);
    setActiveIndex(index);
  };

  const goPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    scrollRef.current?.scrollTo({
      x: next * carouselWidth,
      animated: true,
    });
    setActiveIndex(next);
  };

  const goNext = () => {
    const next = Math.min(images.length - 1, activeIndex + 1);
    scrollRef.current?.scrollTo({
      x: next * carouselWidth,
      animated: true,
    });
    setActiveIndex(next);
  };

  if (!images || images.length === 0) {
    return (
      <View
        style={[
          styles.wrapper,
          {
            height,
            width: widthPercent != null ? carouselWidth : SCREEN_WIDTH,
            borderRadius: borderRadius ?? 0,
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <Text color="textSecondary">No images available</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        widthPercent != null && { width: carouselWidth, alignSelf: "center" },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[
          styles.carousel,
          {
            height,
            width: carouselWidth,
            borderRadius: borderRadius ?? 0,
          },
        ]}
      >
        {images.map((image) => {
          const uriStr = typeof image.uri === "string" ? image.uri : "";
          const isRemote =
            typeof image.uri === "string" &&
            (uriStr.startsWith("http") ||
              uriStr.startsWith("https") ||
              uriStr.startsWith("file"));
          const showSpinner = isRemote && loadedById[image.id] !== true;
          const imageStyle = [
            styles.image,
            {
              width: carouselWidth,
              height,
              borderRadius: borderRadius ?? 0,
            },
          ];
          const markDone = () =>
            setLoadedById((prev) => ({ ...prev, [image.id]: true }));

          return (
            <View
              key={image.id}
              style={[
                styles.slideWrap,
                {
                  width: carouselWidth,
                  height,
                  borderRadius: borderRadius ?? 0,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <AppImage
                source={
                  typeof image.uri === "string" ? { uri: image.uri } : image.uri
                }
                style={imageStyle}
                resizeMode="cover"
                fadeDuration={0}
                defaultSource={
                  typeof image.uri === "number"
                    ? image.uri
                    : Images.card_image_placeholder
                }
                onLoadEnd={markDone}
                onError={markDone}
              />
              {showSpinner ? (
                <View style={styles.spinnerOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Left / Right arrows when multiple images and showArrows */}
      {images.length > 1 && showArrows && (
        <View style={styles.arrowsRow} pointerEvents="box-none">
          <TouchableOpacity
            onPress={goPrev}
            style={[styles.arrowBtn, { backgroundColor: arrowBg }]}
            disabled={activeIndex === 0}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={APP_COLORS.surfaceWhite}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={[styles.arrowBtn, { backgroundColor: arrowBg }]}
            disabled={activeIndex === images.length - 1}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={APP_COLORS.surfaceWhite}
            />
          </TouchableOpacity>
        </View>
      )}

      {images.length > 1 && (
        <View style={styles.indicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === activeIndex
                      ? colors.surfacePrimary
                      : colors.surfacePrimary + "80",
                  width: index === activeIndex ? 24 : 8,
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
  },
  carousel: {
    overflow: "hidden",
  },
  image: {},
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
  arrowsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  arrowBtn: {
    height: 32,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});
