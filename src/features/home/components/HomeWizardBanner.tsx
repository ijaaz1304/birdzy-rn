import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";

/** Have no photos banner — rgba(222, 229, 230, 1) */
const BANNER_BG = "#DEE5E6";
/**
 * Figma text-icon-primary (#091B21). The banner background is a fixed light
 * colour in both themes, so the copy stays dark in dark mode too.
 */
const BANNER_TEXT_COLOR = "#091B21";

type Props = {
  onPress: () => void;
};

/**
 * Step-by-step wizard entry — Figma 8016:33111 "Banner op2".
 * 335×64 at a 375pt screen: bird art 72×56 on the left, copy + 20pt chevron
 * (12pt gap) filling the rest with 16pt right padding.
 * Responsive: full width of its parent, and min-height (not fixed height) so
 * the copy can wrap to more lines on narrow screens instead of being clipped.
 */
export const HomeWizardBanner: React.FC<Props> = ({ onPress }) => {
  const title = HOME_STRINGS.discovery.wizardBanner.title;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.banner, { backgroundColor: BANNER_BG }]}
    >
      <AppImage
        source={Images.homeWizardBanner}
        style={styles.wizardArt}
        resizeMode="contain"
      />
      <View style={styles.copyRow}>
        {/* Figma Body/14px/SemiBold — Satoshi 700, 14/20, flex: 1 0 0 */}
        <AppText
          variant="body14"
          allowFontScaling={false}
          style={styles.title}
        >
          {title}
        </AppText>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={BANNER_TEXT_COLOR}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    minHeight: 64,
    borderRadius: Radius.sm,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 12,
    paddingRight: 16,
    /** Room for the 72pt bird art on the left */
    paddingLeft: 72,
  },
  /** Figma: 72×56, flush left, sits 1pt past the bottom edge */
  wizardArt: {
    position: "absolute",
    left: 0,
    bottom: -1,
    width: 72,
    height: 56,
  },
  copyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  /** Body/14px/SemiBold: flex 1 0 0 so the text takes the remaining width */
  title: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    fontFamily: FONTS.bold,
    fontStyle: "normal",
    fontSize: 14,
    lineHeight: 20,
    color: BANNER_TEXT_COLOR,
  },
});
