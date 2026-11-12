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
  wrap: {
    marginTop: 8,
    minHeight: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  linkButton: {
    minHeight: 48,
    justifyContent: "center",
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  link: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
