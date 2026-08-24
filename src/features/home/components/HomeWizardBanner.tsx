import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

const BANNER_BG = "#E9EFD2";

type Props = {
  onPress: () => void;
};

/** Step-by-step wizard entry — Figma banner op2. */
export const HomeWizardBanner: React.FC<Props> = ({ onPress }) => {
  const theme = useTheme();
  const title = HOME_STRINGS.discovery.wizardBanner.title;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.banner, { backgroundColor: BANNER_BG }]}
    >
      <AppImage
        source={Images.homeWizardBanner}
        style={styles.wizardArt}
        resizeMode="contain"
      />
      <View style={styles.copyRow}>
        <AppText
          variant="body14"
          style={[styles.title, { color: theme.colors.textPrimary }]}
        >
          {title}
        </AppText>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.colors.textPrimary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    minHeight: 64,
    borderRadius: Radius.sm,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wizardArt: {
    width: 72,
    height: 56,
    marginRight: 8,
  },
  copyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
});
