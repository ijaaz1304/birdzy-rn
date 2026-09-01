import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { spacing } from "../../../design-system/spacing";

/**
 * Inline “recording limit reached” promo banner (1340×704, text baked in).
 * For list/detail surfaces (e.g. Audio Gallery header) — not upgrade bottom sheets.
 * Bottom sheets use Images.subscriptionPopupIconSoundGallery (full-bleed).
 */
const BANNER_ASPECT_RATIO = 1340 / 704;

type Props = {
  onPress: () => void;
};

export const RecordingLimitBanner: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={styles.wrap}
    accessibilityRole="button"
    accessibilityLabel={HOME_STRINGS.discovery.audioGallery.limitBannerA11y}
  >
    <AppImage
      source={Images.recordingLimitReachedBanner}
      style={styles.image}
      resizeMode="contain"
      preferRNImage
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: spacing[3],
  },
  image: {
    width: "100%",
    aspectRatio: BANNER_ASPECT_RATIO,
  },
});
