import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppImage } from "@/components/AppImage";
import { RootStackParamList } from "../navigation/types";
import { APP_COLORS } from "../../theme/colors";
import { Images } from "../assets";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

/** Onboarding splash art — 1500×3248, anchored to bottom like onboarding slides. */
const SPLASH_ART_ASPECT = 3248 / 1500;

/**
 * Splash visuals only (no navigation). Used by Splash route and App.tsx bootstrap
 * so cold start never shows a blank white frame before navigation mounts.
 */
export const SplashScreenContent: React.FC = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const splashArtHeight = useMemo(
    () => Math.max(screenHeight, screenWidth * SPLASH_ART_ASPECT),
    [screenHeight, screenWidth]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -6,
            duration: 1800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatAnim, {
            toValue: 6,
            duration: 1800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    });
  }, [fadeAnim, scaleAnim, floatAnim]);

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: APP_COLORS.splashBackground },
      ]}
    >
      <Animated.View
        style={[
          styles.artContainer,
          {
            width: screenWidth,
            height: splashArtHeight,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
          },
        ]}
      >
        <AppImage
          source={Images.onboardingSplash}
          style={styles.artImage}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

/**
 * Splash screen: display only. Navigation to Onboarding / AuthStack / MainTabs
 * is handled at root level (RootNavigator).
 */
export const SplashScreen = (_props: Props) => <SplashScreenContent />;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
  },
  artContainer: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  artImage: {
    width: "100%",
    height: "100%",
  },
});
