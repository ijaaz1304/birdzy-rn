/**
 * Identification / diagnosis loading scanner preview with animated scan beam.
 */

import { AppImage } from "@/components/AppImage";
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Images } from "../../../assets";
import { LoadingImage } from "../../../components/LoadingImage";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";
import { APP_COLORS } from "../../../config/colors";

const FRAME_SIZE = 280;
const INNER_SIZE = 240;
const SCAN_BEAM_HEIGHT = 64;

export type IdentificationScannerFrameProps = {
  imageUri?: string;
  fallbackImage?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

export const IdentificationScannerFrame: React.FC<
  IdentificationScannerFrameProps
> = ({ imageUri, fallbackImage = Images.mineralSample, style }) => {
  const theme = useTheme();
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanProgress]);

  const beamTranslateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_BEAM_HEIGHT, INNER_SIZE],
  });

  const primary = theme.colors.primary;
  const trailColors = [`${primary}99`, `${primary}33`, `${primary}00`];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.innerImage}>
        {imageUri ? (
          <LoadingImage
            uri={imageUri}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <AppImage
            source={fallbackImage}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.scanBeam,
            { transform: [{ translateY: beamTranslateY }] },
          ]}
        >
          <View style={[styles.scanLine, { backgroundColor: primary }]} />
          <LinearGradient
            colors={trailColors}
            style={styles.scanTrail}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </View>

      <AppImage
        source={Images.askAiScan}
        style={styles.cornerOverlay}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  innerImage: {
    position: "absolute",
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: APP_COLORS.surfaceDarkMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  scanBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCAN_BEAM_HEIGHT,
  },
  scanLine: {
    height: 2,
    width: "100%",
    borderRadius: 1,
    shadowColor: APP_COLORS.shadowBlack,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  scanTrail: {
    flex: 1,
    width: "100%",
  },
  cornerOverlay: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "absolute",
  },
});
