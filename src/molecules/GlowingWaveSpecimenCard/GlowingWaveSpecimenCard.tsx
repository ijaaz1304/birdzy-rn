/**
 * Mushroom-of-the-day hero: glowing star (waves) behind outer polaroid card + specimen image.
 */

import { AppImage } from "@/components/AppImage";
import React, { useEffect } from "react";
import { View, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Images } from "../../assets";
import { CachedRemoteImage } from "@/components/AppImage";

const STAR_FRAME_WIDTH = 310;
const STAR_FRAME_ASPECT = 1348 / 1094;
const OUTER_CARD_WIDTH = 280;
const OUTER_CARD_ASPECT = 1014 / 998;
/**
 * Specimen window inside outer_card.webp white square (1014×998).
 * Kept inside the paper edges and below the washi tape.
 */
const SPECIMEN_INSET = {
  left: 0.228,
  top: 0.238,
  right: 0.204,
  bottom: 0.148,
};
/** Fine-tune specimen position inside the polaroid window */
const SPECIMEN_NUDGE_X_RATIO = 0;
const SPECIMEN_NUDGE_Y_RATIO = 0;
/** Fine-tune glowing star position behind outer card */
const STAR_NUDGE_X_RATIO = -0.025;
const STAR_NUDGE_Y_RATIO = 0.02;
/** Star (glow) larger than the 280 polaroid so the wave reads around the card */
const STAR_SCALE = 1.5;
const STAR_SWING_DEG = 7;
const STAR_PULSE_SCALE = 1.12;
const STAR_WAVE_DURATION_MS = 2400;

function resolveRemoteUri(source: ImageSourcePropType): string | null {
  const value = source as string | { uri?: string };
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.uri === "string" &&
    value.uri.trim()
  ) {
    return value.uri.trim();
  }
  return null;
}

export type GlowingWaveSpecimenCardProps = {
  imageSource: ImageSourcePropType;
  width?: number;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  /** Push polaroid card toward bottom of glow frame (mushroom-of-the-day modal). */
  cardVerticalAlign?: "center" | "bottom";
  /** Extra downward nudge for specimen photo inside polaroid (ratio of outer card width). */
  specimenOffsetYRatio?: number;
};

export const GlowingWaveSpecimenCard: React.FC<
  GlowingWaveSpecimenCardProps
> = ({
  imageSource,
  width = STAR_FRAME_WIDTH,
  style,
  animate = true,
  cardVerticalAlign = "center",
  specimenOffsetYRatio = 0,
}) => {
  const starHeight = width / STAR_FRAME_ASPECT;
  const starNudgeX = width * STAR_NUDGE_X_RATIO;
  const starNudgeY = width * STAR_NUDGE_Y_RATIO;
  const starRenderWidth = width * STAR_SCALE;
  const starRenderHeight = starHeight * STAR_SCALE;
  const starOffsetLeft = (width - starRenderWidth) / 2 + starNudgeX;
  const starOffsetTop = (starHeight - starRenderHeight) / 2 + starNudgeY;
  const outerCardWidth = OUTER_CARD_WIDTH * (width / STAR_FRAME_WIDTH);
  const outerCardHeight = outerCardWidth / OUTER_CARD_ASPECT;
  const specimenLeft =
    outerCardWidth * SPECIMEN_INSET.left +
    outerCardWidth * SPECIMEN_NUDGE_X_RATIO;
  const specimenTop =
    outerCardHeight * SPECIMEN_INSET.top +
    outerCardWidth * (SPECIMEN_NUDGE_Y_RATIO + specimenOffsetYRatio);
  const outerCardBottomInset =
    cardVerticalAlign === "bottom" ? starHeight * 0.04 : 0;
  const specimenWidth =
    outerCardWidth * (1 - SPECIMEN_INSET.left - SPECIMEN_INSET.right);
  const specimenHeight =
    outerCardHeight * (1 - SPECIMEN_INSET.top - SPECIMEN_INSET.bottom);
  const remoteSpecimenUri = resolveRemoteUri(imageSource);

  const starWave = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(starWave);
      starWave.value = 0;
      return;
    }
    starWave.value = withRepeat(
      withTiming(1, {
        duration: STAR_WAVE_DURATION_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [animate, starWave]);

  const starWaveStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          starWave.value,
          [0, 1],
          [-STAR_SWING_DEG, STAR_SWING_DEG]
        )}deg`,
      },
      {
        scale: interpolate(
          starWave.value,
          [0, 0.5, 1],
          [1, STAR_PULSE_SCALE, 1]
        ),
      },
    ],
  }));

  return (
    <View style={[styles.root, { width, height: starHeight }, style]}>
      {/* Glowing star — behind outer card, waves only */}
      <View
        pointerEvents="none"
        style={[
          styles.starLayer,
          {
            left: starOffsetLeft,
            top: starOffsetTop,
            width: starRenderWidth,
            height: starRenderHeight,
          },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, starWaveStyle]}>
          <AppImage
            source={Images.mushroomGlowingStar}
            style={{ width: starRenderWidth, height: starRenderHeight }}
            resizeMode="stretch"
          />
        </Animated.View>
      </View>

      {/* Outer polaroid + mushroom image — static */}
      <View
        pointerEvents="none"
        style={[
          styles.outerCardLayer,
          cardVerticalAlign === "bottom"
            ? styles.outerCardLayerBottom
            : null,
          { paddingBottom: outerCardBottomInset },
        ]}
      >
        <View style={{ width: outerCardWidth, height: outerCardHeight }}>
          <AppImage
            source={Images.mushroomOuterCard}
            style={{ width: outerCardWidth, height: outerCardHeight }}
            resizeMode="stretch"
          />
          <View
            style={[
              styles.specimenWindow,
              {
                left: specimenLeft,
                top: specimenTop,
                width: specimenWidth,
                height: specimenHeight,
              },
            ]}
          >
            {remoteSpecimenUri ? (
              <CachedRemoteImage
                uri={remoteSpecimenUri}
                style={{ width: specimenWidth, height: specimenHeight }}
                resizeMode="cover"
                priority="high"
              />
            ) : (
              <AppImage
                source={imageSource}
                style={{ width: specimenWidth, height: specimenHeight }}
                resizeMode="cover"
                preferRNImage
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    alignSelf: "center",
    overflow: "visible",
  },
  starLayer: {
    position: "absolute",
    zIndex: 1,
  },
  outerCardLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  outerCardLayerBottom: {
    justifyContent: "flex-end",
  },
  specimenWindow: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 2,
    zIndex: 3,
  },
});
