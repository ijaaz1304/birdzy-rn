import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Images } from "../../../assets";
import { AppText } from "../../../components/shared";
import { useTheme } from "../../../hooks/useTheme";
import { useStrings } from "../../../hooks/useStrings";
import { HOME_LAYOUT } from "../../../constants/colorConstants";

type Props = { onPress: () => void };

/** Native copy avoids the mushroom text baked into the former banner bitmap. */
export const HomeIdentifyBanner: React.FC<Props> = ({ onPress }) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const copy = useStrings().home.banners.identify;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.buttonText}`}
      style={[styles.wrap, { backgroundColor: theme.colors.surfaceSecondary }]}
    >
      <View style={styles.copy}>
        <AppText variant="body16" style={{ color: theme.colors.textPrimary }}>
          {copy.title}
        </AppText>
        <AppText
          variant="caption12"
          style={{ color: theme.colors.textSecondary }}
        >
          {copy.description}
        </AppText>
        <AppText variant="body14" style={{ color: theme.colors.primary }}>
          {copy.buttonText}
        </AppText>
      </View>
      <AppImage
        source={
          isDark
            ? Images.subscriptionListFeedDark
            : Images.subscriptionCarousel0
        }
        style={styles.image}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    minHeight: 154,
    borderRadius: HOME_LAYOUT.BANNER_RADIUS,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  copy: { flex: 1, gap: 8 },
  image: { width: 88, height: 96 },
});
