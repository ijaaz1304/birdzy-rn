import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../../theme/colors";

const SKY_HEIGHT = 320;

type Props = {
  isDark?: boolean;
};

export function AskAIScreenBackground({ isDark = false }: Props) {
  if (isDark) {
    return (
      <View
        style={[
          styles.backgroundHost,
          { backgroundColor: APP_COLORS.surfaceAuthDark },
        ]}
        pointerEvents="none"
      >
        <AppImage
          source={Images.analyseAiDark}
          style={styles.darkBackground}
          resizeMode="cover"
          preferRNImage
          fadeDuration={0}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", APP_COLORS.surfaceAuthDark]}
          locations={[0.45, 1]}
          style={styles.darkFade}
          pointerEvents="none"
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.backgroundHost, { backgroundColor: "#FFFFFF" }]}
      pointerEvents="none"
    >
      <AppImage
        source={Images.askAiSkyBg}
        style={styles.skyImage}
        resizeMode="cover"
        preferRNImage
        fadeDuration={0}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(239,251,251,0.3)", "#FFFFFF"]}
        locations={[0.034, 0.655]}
        style={styles.skyTint}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(255,255,255,0)", "#FFFFFF"]}
        locations={[0, 0.691]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  skyImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: SKY_HEIGHT,
    opacity: 0.8,
  },
  skyTint: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: SKY_HEIGHT,
  },
  bottomFade: {
    position: "absolute",
    top: 194,
    left: 0,
    width: "100%",
    height: 236,
  },
  darkBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  darkFade: {
    ...StyleSheet.absoluteFillObject,
  },
});
