/**
 * Attributes Component
 * Displays characteristics
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { useStrings } from "../../hooks/useStrings";

export interface PlantAttributesProps {
  height?: string;
  careLevel?: string;
  petToxicity?: string;
  floweringHabit?: string;
  medicinalProperty?: string;
  edibility?: string;
  airPurifying?: string;
  fruitBearing?: string;
  poisonLevel?: string;
  trendStatus?: string;
}

export const PlantAttributes: React.FC<PlantAttributesProps> = ({
  height,
  careLevel,
  petToxicity,
  floweringHabit,
  medicinalProperty,
  edibility,
  airPurifying,
  fruitBearing,
  poisonLevel,
  trendStatus,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();

  const attrStrings = strings.collection?.legacyDetailSections?.attributes as
    | Record<string, string | undefined>
    | undefined;
  const attributes = [
    height && {
      label: attrStrings?.height || "Height",
      value: height,
      icon: "height",
      color: colors.primary,
    },
    careLevel && {
      label: attrStrings?.careLevel || "Care Level",
      value: careLevel,
      icon: "star",
      color: colors.warning,
    },
    petToxicity && {
      label: attrStrings?.petToxicity || "Pet Safety",
      value: petToxicity,
      icon: petToxicity.includes("toxic") ? "warning" : "check-circle",
      color: petToxicity.includes("toxic") ? colors.error : colors.success,
    },
    floweringHabit && {
      label: attrStrings?.flowering || "Flowering",
      value: floweringHabit,
      icon: "local-florist",
      color: colors.primary,
    },
    medicinalProperty && {
      label: attrStrings?.medicinal || "Medicinal",
      value: medicinalProperty,
      icon: "healing",
      color:
        medicinalProperty === "yes" ? colors.success : colors.textSecondary,
    },
    edibility && {
      label: attrStrings?.edible || "Edible",
      value: edibility,
      icon: edibility.includes("edible") ? "restaurant" : "block",
      color: edibility.includes("edible")
        ? colors.success
        : colors.textSecondary,
    },
    airPurifying && {
      label: attrStrings?.airPurifying || "Air Purifying",
      value: airPurifying,
      icon: "air",
      color: airPurifying === "high" ? colors.success : colors.textSecondary,
    },
    fruitBearing && {
      label: attrStrings?.fruitBearing || "Fruit Bearing",
      value: fruitBearing,
      icon: "apple",
      color: fruitBearing === "yes" ? colors.success : colors.textSecondary,
    },
    poisonLevel && {
      label: attrStrings?.poisonous || "Poisonous",
      value: poisonLevel,
      icon: "warning",
      color: poisonLevel === "high" ? colors.error : colors.warning,
    },
    trendStatus && {
      label: attrStrings?.trendy || "Trend Status",
      value: trendStatus,
      icon: "trending-up",
      color: trendStatus === "trending" ? colors.warning : colors.textSecondary,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
  }>;

  if (attributes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text
        variant="title"
        size="medium"
        weight="semibold"
        style={styles.title}
      >
        {strings.collection?.legacyDetailSections?.attributes?.title ||
          "Plant Characteristics"}
      </Text>

      <View style={styles.grid}>
        {attributes.map((attr, index) => (
          <View
            key={index}
            style={[
              styles.attributeItem,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.md,
                padding: spacing[3],
              },
            ]}
          >
            <View style={styles.attributeHeader}>
              <MaterialIcons name={attr.icon} size={20} color={attr.color} />
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={styles.attributeLabel}
              >
                {attr.label}
              </Text>
            </View>
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.attributeValue}
            >
              {attr.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attributeItem: {
    width: "48%",
    minHeight: 80,
  },
  attributeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  attributeLabel: {
    flex: 1,
  },
  attributeValue: {
    textTransform: "capitalize",
  },
});
