import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { OnboardingSlide } from "./slidesData";
import { useTheme } from "../../hooks/useTheme";

import { FONTS } from "../../common/typography";

const { width } = Dimensions.get("window");

type Props = {
  slide: OnboardingSlide;
  onNext: () => void;
  isLast: boolean;
};

const OnboardingSlideComponent = ({ slide, onNext, isLast }: Props) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {slide.image && (
        <AppImage source={slide.image} style={styles.image} resizeMode="contain" />
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {slide.title}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {slide.description}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primaryCTA }]}
        onPress={onNext}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {isLast ? "Get Started" : slide.buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingSlideComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  image: { width: width * 0.7, height: width * 0.7 },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: "center",
    marginTop: 20,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
