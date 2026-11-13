import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import { POST_AUTH_LAYOUT, type PostAuthOnboardingColors } from "../constants";
import { useDrawnTextHeight } from "../../../hooks/useDrawnTextHeight";

type Props = {
  colors: PostAuthOnboardingColors;
};

/** Figma 8327:72660 — Title/28px/Bold + Body/14px/Regular, 8pt gap, 32pt above the carousel. */
export const PostAuthSubscriptionPaywallHeader: React.FC<Props> = ({
  colors,
}) => {
  const drawnTitle = useDrawnTextHeight();
  const drawnSubtitle = useDrawnTextHeight();
  return (
    <View style={styles.wrap}>
      <Text
        style={[styles.title, { color: colors.textPrimary }, drawnTitle.style]}
        onTextLayout={drawnTitle.onTextLayout}
      >
        Especially for you!
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: colors.textPrimary },
          drawnSubtitle.style,
        ]}
        onTextLayout={drawnSubtitle.onTextLayout}
      >
        Unlock unlimited scans, explore detailed insights and featured birds of
        the day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: POST_AUTH_LAYOUT.contentWidth,
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    width: "100%",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
});
