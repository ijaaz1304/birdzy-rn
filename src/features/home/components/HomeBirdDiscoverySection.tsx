import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { useTheme } from "../../../hooks/useTheme";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";

type Props = {
  onSoundIdentify: () => void;
  onStepByStep: () => void;
  onAudioGallery: () => void;
};

export const HomeBirdDiscoverySection: React.FC<Props> = ({
  onSoundIdentify,
  onStepByStep,
  onAudioGallery,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const strings = HOME_STRINGS.discovery;

  const cards = [
    {
      key: "sound",
      icon: "mic" as const,
      title: strings.soundIdentify.title,
      description: strings.soundIdentify.description,
      onPress: onSoundIdentify,
    },
    {
      key: "nearby",
      icon: "place" as const,
      title: strings.stepByStep.title,
      description: strings.stepByStep.homeDescription,
      onPress: onStepByStep,
    },
    {
      key: "gallery",
      icon: "library-music" as const,
      title: strings.audioGallery.title,
      description: strings.audioGallery.homeDescription,
      onPress: onAudioGallery,
    },
  ];

  return (
    <View style={styles.section}>
      <AppText
        variant="body16"
        style={{ fontFamily: FONTS.bold, color: colors.textPrimary }}
      >
        {strings.sectionTitle}
      </AppText>
      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.key}
            activeOpacity={0.85}
            onPress={card.onPress}
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialIcons name={card.icon} size={22} color={colors.primary} />
            <AppText
              variant="body14"
              style={{ fontFamily: FONTS.bold, color: colors.textPrimary }}
              numberOfLines={2}
            >
              {card.title}
            </AppText>
            <AppText variant="caption12" color="textSecondary" numberOfLines={2}>
              {card.description}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    gap: spacing[2],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  card: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: spacing[2],
    gap: 4,
  },
});
