import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  type PostAuthOnboardingColors,
} from "../constants";

type Props = {
  onTerms: () => void;
  onPrivacy: () => void;
  onRestore: () => void;
  isRestoring?: boolean;
  colors?: PostAuthOnboardingColors;
};

export const PostAuthLegalFooter: React.FC<Props> = ({
  onTerms,
  onPrivacy,
  onRestore,
  isRestoring = false,
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
}) => {
  const linkColor =
    colors.textPrimary === "#FFFFFF" ? colors.textPrimary : "#111111";

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onTerms} style={styles.linkButton}>
        <Text style={[styles.link, { color: linkColor }]}>
          Terms of Service
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPrivacy} style={styles.linkButton}>
        <Text style={[styles.link, { color: linkColor }]}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRestore}
        disabled={isRestoring}
        style={styles.linkButton}
      >
        <Text style={[styles.link, { color: linkColor }]}>
          {isRestoring ? "Restoring…" : "Restore Purchase"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  /**
   * Figma 8327:72650: three links share one row (gap 4). They grow to equal
   * shares when they fit and wrap onto further rows at larger text sizes.
   */
  wrap: {
    marginTop: 8,
    minHeight: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  /** 48pt touch target around Figma's 24pt (4/12 padding) text button */
  linkButton: {
    flexGrow: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  /** Figma Caption/12px/SemiBold — Satoshi Bold 12/16, underlined */
  link: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
