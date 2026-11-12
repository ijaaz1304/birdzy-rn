import { AppImage } from "@/components/AppImage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../../theme/colors";
import { PostAuthPaginationDots } from "./PostAuthPaginationDots";
import { type PostAuthOnboardingColors } from "../constants";
import {
  getPostAuthSubscriptionFeatures,
  type PostAuthSubscriptionFeature,
} from "../constants/subscriptionFeatures";
import { usePostAuthContentLayout } from "../utils/postAuthContentLayout";
import { usePostAuthLayoutMetrics } from "../utils/postAuthLayout";

const AUTO_SCROLL_INTERVAL_MS = 1500;
const PAUSE_AFTER_MANUAL_SCROLL_MS = 5000;

type Props = {
  isDark: boolean;
  colors: PostAuthOnboardingColors;
};

export const PostAuthSubscriptionFeatureCarousel: React.FC<Props> = ({
  isDark,
  colors,
}) => {
  const { contentWidth } = usePostAuthContentLayout();
  const layout = usePostAuthLayoutMetrics();
  const [carouselWidth, setCarouselWidth] = useState(contentWidth);
  const featureCarouselWidth = carouselWidth > 0 ? carouselWidth : contentWidth;
  const features = useMemo(
    () => getPostAuthSubscriptionFeatures(isDark),
    [isDark]
  );
  const featureCount = features.length;
  const [featureIndex, setFeatureIndex] = useState(0);
  const listRef = useRef<FlatList<PostAuthSubscriptionFeature>>(null);
  const featureIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const nextWidth = Math.round(event.nativeEvent.layout.width);
      if (nextWidth > 0 && nextWidth !== carouselWidth) {
        setCarouselWidth(nextWidth);
      }
    },
    [carouselWidth]
  );

  const clearAutoScrollTimer = useCallback(() => {
    if (autoScrollTimerRef.current != null) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  }, []);

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.max(0, Math.min(index, featureCount - 1));
      listRef.current?.scrollToOffset({
        offset: clamped * featureCarouselWidth,
        animated,
      });
      featureIndexRef.current = clamped;
      setFeatureIndex(clamped);
    },
    [featureCount, featureCarouselWidth]
  );

  const handleFeatureScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / featureCarouselWidth
      );
      if (index >= 0 && index < featureCount) {
        featureIndexRef.current = index;
        setFeatureIndex(index);
      }
    },
    [featureCount, featureCarouselWidth]
  );

  const handleScrollBeginDrag = useCallback(() => {
    pauseUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL_SCROLL_MS;
  }, []);

  useEffect(() => {
    goToIndex(featureIndexRef.current, false);
  }, [goToIndex, isDark]);

  useEffect(() => {
    if (featureCount < 2) return;

    clearAutoScrollTimer();
    autoScrollTimerRef.current = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const next = featureIndexRef.current + 1;
      const wraps = next >= featureCount;
      goToIndex(wraps ? 0 : next, !wraps);
    }, AUTO_SCROLL_INTERVAL_MS);

    return clearAutoScrollTimer;
  }, [clearAutoScrollTimer, featureCount, goToIndex]);

  return (
    <View
      style={[
        styles.wrapper,
        { marginTop: layout.subscriptionCarouselMarginTop },
      ]}
      onLayout={handleLayout}
    >
      <FlatList
        onContentSizeChange={() => goToIndex(featureIndexRef.current, false)}
        ref={listRef}
        data={features}
        extraData={`${isDark}-${featureCarouselWidth}-${featureCount}`}
        keyExtractor={(_, index) => `${isDark ? "dark" : "light"}-${index}`}
        horizontal
        pagingEnabled
        initialNumToRender={7}
        windowSize={8}
        showsHorizontalScrollIndicator={false}
        snapToInterval={featureCarouselWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleFeatureScroll}
        onScrollEndDrag={handleFeatureScroll}
        style={[styles.carousel, { width: featureCarouselWidth }]}
        getItemLayout={(_, index) => ({
          length: featureCarouselWidth,
          offset: featureCarouselWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: featureCarouselWidth }]}>
            <AppImage
              source={isDark ? item.iconDark : item.iconLight}
              style={[
                styles.icon,
                {
                  width: layout.subscriptionCarouselIconSize,
                  height: layout.subscriptionCarouselIconSize,
                  marginBottom: layout.subscriptionCarouselIconMarginBottom,
                },
              ]}
              resizeMode="contain"
              preferRNImage={isDark}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textPrimary }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />
      <PostAuthPaginationDots
        total={featureCount}
        activeIndex={featureIndex}
        inactiveColor={
          isDark
            ? "rgba(255, 255, 255, 0.25)"
            : APP_COLORS.paginationDotUnselectedLight
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },
  carousel: {
    flexGrow: 0,
    marginTop: 0,
    marginBottom: 8,
  },
  slide: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
