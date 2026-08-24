/**
 * PestsAndDiseasesCard molecule component
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../atoms/Text";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";

import { spacing } from "../../design-system/spacing";

export interface PestsAndDiseasesCardProps {
  pests: string[];
  diseases: string[];
  onPress?: () => void;
  onDiagnosePress?: () => void;
}

export const PestsAndDiseasesCard: React.FC<PestsAndDiseasesCardProps> = ({
  pests,
  diseases,
  onPress,
  onDiagnosePress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();

  // Use #21190B for dark mode background for pests and disease cards
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? colors.surfacePrimary
            : colors.surfacePrimary,
          borderRadius: radius.lg,
          padding: spacing[4],
          gap: spacing[4],
        },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                padding: 8,
              },
            ]}
          >
            <AppImage
              source={Images.modalNotification}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </View>
          <Text variant="title" size="medium" weight="semibold">
            Pests and diseases
          </Text>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Pests */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            padding: spacing[2],
          },
        ]}
      >
        <View style={styles.row}>
          <AppImage
            source={Images.modalNotification}
            style={{ width: 16, height: 16 }}
            resizeMode="contain"
          />
          <Text
            variant="label"
            size="small"
            weight="semibold"
            style={styles.label}
          >
            Pests
          </Text>
        </View>
        <Text variant="body" size="small" color="textSecondary">
          {pests.length > 0 ? pests.join(", ") + "." : "No pests listed."}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Diseases */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            padding: spacing[2],
          },
        ]}
      >
        <View style={styles.row}>
          <AppImage
            source={Images.modalNotification}
            style={{ width: 16, height: 16, tintColor: colors.onPrimary }}
            resizeMode="contain"
          />
          <Text
            variant="label"
            size="small"
            weight="semibold"
            style={[styles.label, { color: colors.onPrimary }]}
          >
            Diseases
          </Text>
        </View>
        <Text
          variant="body"
          size="small"
          style={{ color: colors.onPrimary, opacity: 0.9 }}
        >
          {diseases.length > 0
            ? diseases.join(", ") + "."
            : "No diseases listed."}
        </Text>
      </View>

      {/* Diagnose Card */}
      <View
        style={[
          styles.ctaCard,
          {
            backgroundColor: isDark
              ? colors.surfaceBrand2Light
              : colors.surfaceBrand2Accent,
            borderRadius: radius.lg,
            padding: spacing[4],
            gap: spacing[4],
            marginTop: spacing[3],
          },
        ]}
      >
        <View style={styles.ctaRow}>
          <View
            style={[
              styles.ctaIcon,
              {
                backgroundColor: colors.surfaceBrand2Accent,
                borderRadius: radius.full,
              },
            ]}
          >
            <AppImage
              source={Images.detailOverview}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.ctaText}>
            <Text variant="body" size="medium" weight="semibold">
              Identify from photos
            </Text>
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={{ marginTop: spacing[1] }}
            >
              Tap to scan your photos and let the Identifier suggest possible
              matches.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onDiagnosePress}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.reminderFertilising,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={[styles.ctaButtonText, { color: colors.onPrimary }]}
          >
            Identify
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    gap: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  label: {
    marginLeft: 0,
  },

  divider: {
    height: 1,
  },

  ctaCard: {
    gap: spacing[4],
  },

  ctaRow: {
    flexDirection: "row",
    gap: 12,
  },

  ctaIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    flex: 1,
  },

  ctaButton: {
    paddingVertical: 12,
    alignItems: "center",
  },

  ctaButtonText: {
    // Color set inline with theme.colors.onPrimary
  },
});
