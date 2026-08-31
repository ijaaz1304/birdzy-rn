import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { spacing } from "../../../design-system/spacing";

/** Source art is 1340×704. */
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
