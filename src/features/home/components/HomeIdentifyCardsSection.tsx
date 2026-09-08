import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

type Props = {
  onSoundPress: () => void;
  onPhotoPress: () => void;
};

export const HomeIdentifyCardsSection: React.FC<Props> = ({
  onSoundPress,
  onPhotoPress,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = HOME_STRINGS.discovery;
  const cardBg = isDark ? theme.colors.surfaceSecondary : "#EBE4EE";
  const titleColor = theme.colors.textPrimary;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSoundPress}
        style={[styles.card, { backgroundColor: cardBg }]}
      >
        <View style={styles.cardHeader}>
          <AppText
            variant="body14"
            style={[styles.cardTitle, { color: titleColor }]}
          >
            {strings.soundIdentify.title}
          </AppText>
          <MaterialIcons name="chevron-right" size={20} color={titleColor} />
        </View>
        <View style={styles.soundIllustration}>
          <AppImage
            source={Images.homeIdentifyBySound}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPhotoPress}
        style={[styles.card, { backgroundColor: cardBg }]}
      >
        <View style={styles.cardHeader}>
          <AppText
            variant="body14"
            style={[styles.cardTitle, { color: titleColor }]}
          >
            {strings.identifyByPhoto.title}
          </AppText>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={titleColor}
          />
        </View>
        <View style={styles.photoIllustration}>
          <AppImage
            source={Images.homeIdentifyByPhoto}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 20,
    flex: 1,
    paddingRight: 4,
  },
  soundIllustration: {
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIllustration: {
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
});
