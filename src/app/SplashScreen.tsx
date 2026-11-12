import React from "react";
import { StatusBar, StyleSheet, View, useWindowDimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppImage } from "@/components/AppImage";
import { RootStackParamList } from "../navigation/types";
import { Images } from "../assets";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

/** Matches splash.webp's white field so native → JS never flashes a second screen. */
export const SPLASH_SCREEN_BACKGROUND = "#FFFFFF";

/**
 * Splash visuals only (no navigation). Used by Splash route and App.tsx bootstrap
 * so cold start never shows a blank white frame before navigation mounts.
 *
 * `splash.webp` is 1500×3248 — size it to the screen with contain so it fits
 * instead of painting at intrinsic pixels (which crops to a huge mint slab).
 */
export const SplashScreenContent: React.FC = () => {
  const window = useWindowDimensions();
  const { width, height } = window;

  return (
    <View style={styles.wrapper}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={SPLASH_SCREEN_BACKGROUND}
      />
      <AppImage
        source={Images.onboardingSplash}
        style={{ width, height }}
        resizeMode="contain"
        preferRNImage
        fadeDuration={0}
      />
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
    backgroundColor: SPLASH_SCREEN_BACKGROUND,
  },
});
