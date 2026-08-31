import React, { useEffect, useRef } from "react";
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

/** Transparent splash bird art — 852×639. */
const SPLASH_BIRD_ASPECT = 852 / 639;

/**
 * Splash visuals only (no navigation). Used by Splash route and App.tsx bootstrap
 * so cold start never shows a blank white frame before navigation mounts.
 */
export const SplashScreenContent: React.FC = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const birdWidth = Math.min(screenWidth * 0.88, 420);
  const birdHeight = birdWidth / SPLASH_BIRD_ASPECT;

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
        { backgroundColor: APP_COLORS.splashBackground, minHeight: screenHeight },
      ]}
    >
      <Animated.View
        style={[
          styles.artContainer,
          {
            width: birdWidth,
            height: birdHeight,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
          },
        ]}
      >
        <AppImage
          source={Images.splashBird}
          style={styles.artImage}
          resizeMode="contain"
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
    alignItems: "center",
    justifyContent: "center",
  },
  artContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  artImage: {
    width: "100%",
    height: "100%",
  },
});
