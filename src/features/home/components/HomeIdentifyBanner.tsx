import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Images } from "../../../assets";
import { useIsDark } from "../../../hooks/useTheme";
import { HOME_LAYOUT } from "../../../constants/colorConstants";

type Props = {
  onPress: () => void;
};

/** Full-width identify promo — image asset already includes copy and CTA art. */
export const HomeIdentifyBanner: React.FC<Props> = ({ onPress }) => {
  const isDark = useIsDark();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrap}>
      <AppImage
        source={
          isDark ? Images.homeIdentifyBannerDark : Images.homeIdentifyBanner
        }
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 154,
    borderRadius: HOME_LAYOUT.BANNER_RADIUS,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
