/**
 * Guide Section Renderer
 * Renders different section types based on section.type
 */

import { CachedRemoteImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Text, Button } from "../../../atoms";
import { Card } from "../../../molecules";
import {
  GuideSection,
  TextSection,
  ImageSection,
  ImageCardSection,
  TableSection,
  ListSection,
  TipSection,
  MeterSection,
} from "../../../types/guide.types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";

type GuideSectionRendererProps = {
  section: GuideSection;
};

type NavigationProp = NativeStackNavigationProp<any>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GuideSectionRenderer: React.FC<GuideSectionRendererProps> = ({
  section,
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const _spacing = theme.spacing;
  const _radius = theme.radius;
  const navigation = useNavigation<NavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const handleMeterAction = (action: string) => {
    // Navigate to appropriate meter screen
    switch (action) {
      case "OPEN_LIGHT_METER":
        (rootNavigation.navigate as (screen: string, params?: object) => void)(
          "LightMeterStack",
          { screen: "LightMeterMain" }
        );
        break;
      case "OPEN_HUMIDITY_METER":
        navigation.navigate("HumidityMeter" as never);
        break;
      case "OPEN_TEMPERATURE_METER":
        navigation.navigate("TemperatureMeter" as never);
        break;
    }
  };

  switch (section.type) {
    case "text":
      return <TextSectionComponent section={section as TextSection} />;
    case "image":
      return <ImageSectionComponent section={section as ImageSection} />;
    case "image-card":
      return (
        <ImageCardSectionComponent section={section as ImageCardSection} />
      );
    case "table":
      return <TableSectionComponent section={section as TableSection} />;
    case "list":
      return <ListSectionComponent section={section as ListSection} />;
    case "tip":
      return <TipSectionComponent section={section as TipSection} />;
    case "meter":
      return (
        <MeterSectionComponent
          section={section as MeterSection}
          onAction={handleMeterAction}
        />
      );
    default:
      return null;
  }
};

// Text Section
const TextSectionComponent: React.FC<{ section: TextSection }> = ({
  section,
}) => {
  const _theme = useTheme();
  return (
    <View style={styles.section}>
      {section.title && (
        <Text
          variant="title"
          size="medium"
          weight="semibold"
          style={styles.sectionTitle}
        >
          {section.title}
        </Text>
      )}
      <Text
        variant="body"
        size="medium"
        color="textSecondary"
        style={styles.textBody}
      >
        {section.body}
      </Text>
    </View>
  );
};

// Image Section
const ImageSectionComponent: React.FC<{ section: ImageSection }> = ({
  section,
}) => {
  const _theme = useTheme();
  return (
    <View style={styles.section}>
      <CachedRemoteImage
        uri={section.image}
        style={styles.fullImage}
        borderRadius={Radius.md}
        resizeMode="cover"
      />
      {section.caption && (
        <Text
          variant="body"
          size="small"
          color="textTertiary"
          style={styles.caption}
        >
          {section.caption}
        </Text>
      )}
    </View>
  );
};

// Image Card Section
const ImageCardSectionComponent: React.FC<{ section: ImageCardSection }> = ({
  section,
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const radius = theme.radius;
  return (
    <Card variant="elevated" padding="medium" style={styles.section}>
      <View style={styles.imageCardContent}>
        <View style={styles.imageCardText}>
          <Text
            variant="title"
            size="small"
            weight="semibold"
            style={styles.imageCardTitle}
          >
            {section.title}
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.imageCardDescription}
          >
            {section.description}
          </Text>
        </View>
        <CachedRemoteImage
          uri={section.image}
          style={[styles.imageCardImage, { borderRadius: radius.md }]}
          borderRadius={radius.md}
          resizeMode="cover"
        />
      </View>
    </Card>
  );
};

// Table Section
const TableSectionComponent: React.FC<{ section: TableSection }> = ({
  section,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  return (
    <View style={styles.section}>
      <Text
        variant="title"
        size="medium"
        weight="semibold"
        style={styles.sectionTitle}
      >
        {section.title}
      </Text>
      <View style={[styles.table, { borderColor: colors.border }]}>
        {section.rows.map((row, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              { borderBottomColor: colors.border },
              index === section.rows.length - 1 && styles.tableRowLast,
            ]}
          >
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={styles.tableLeft}
            >
              {row.left}
            </Text>
            <View style={styles.tableRight}>
              <Text variant="body" size="medium" color="textSecondary">
                {row.right}
              </Text>
              {row.note && (
                <Text
                  variant="body"
                  size="small"
                  color="textTertiary"
                  style={styles.tableNote}
                >
                  {row.note}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// List Section
const ListSectionComponent: React.FC<{ section: ListSection }> = ({
  section,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  return (
    <View style={styles.section}>
      <Text
        variant="title"
        size="medium"
        weight="semibold"
        style={styles.sectionTitle}
      >
        {section.title}
      </Text>
      {section.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.listText}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Tip Section
const TipSectionComponent: React.FC<{ section: TipSection }> = ({
  section,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  return (
    <View
      style={[
        styles.section,
        styles.tipContainer,
        { backgroundColor: colors.success + "15" },
      ]}
    >
      <MaterialIcons name="lightbulb" size={24} color={colors.success} />
      <Text
        variant="body"
        size="medium"
        style={[styles.tipText, { color: colors.success }]}
      >
        {section.text}
      </Text>
    </View>
  );
};

// Meter Section
const MeterSectionComponent: React.FC<{
  section: MeterSection;
  onAction: (action: string) => void;
}> = ({ section, onAction }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();

  // Get meter color based on meterType (matching details page)
  // Light meter: warning (yellow/orange)
  // Humidity meter: info accent — theme-driven meter colors
  // Temperature meter: blue from temperature range (#0066FF)
  const getMeterColor = () => {
    switch (section.meterType) {
      case "light":
        return colors.warning; // Yellow/orange for light meter
      case "humidity":
        return colors.info; // Blue for humidity meter
      case "temperature":
        return colors.info; // Blue from temperature range
      default:
        return colors.primary;
    }
  };

  const meterColor = getMeterColor();

  // Convert hex color to rgba for background opacity
  const hexToRgba = (hex: string, opacity: number) => {
    // Theme colors are already hex strings (e.g., '#f59e0b')
    const hexValue = hex.startsWith("#") ? hex : APP_COLORS.guideGreenDefault;
    const r = parseInt(hexValue.slice(1, 3), 16);
    const g = parseInt(hexValue.slice(3, 5), 16);
    const b = parseInt(hexValue.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Use #21190B for dark mode background for meter cards
  const cardBackgroundColor = isDark
    ? APP_COLORS.guideCardDark
    : hexToRgba(meterColor, 0.1);

  return (
    <Card
      variant="elevated"
      padding="medium"
      style={[
        styles.section,
        styles.meterCard,
        {
          borderLeftWidth: 4,
          borderLeftColor: meterColor,
          backgroundColor: cardBackgroundColor,
        },
      ]}
    >
      <Text
        variant="title"
        size="medium"
        weight="semibold"
        style={styles.meterTitle}
      >
        {section.title}
      </Text>
      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={styles.meterDescription}
      >
        {section.description}
      </Text>
      <Button
        title={section.buttonText}
        variant="primary"
        size="large"
        fullWidth
        onPress={() => onAction(section.action)}
        style={styles.meterButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  textBody: {
    lineHeight: 24,
  },
  fullImage: {
    width: "100%",
    height: 200,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  caption: {
    marginTop: 4,
    fontStyle: "italic",
  },
  imageCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  imageCardText: {
    flex: 1,
  },
  imageCardTitle: {
    marginBottom: 8,
  },
  imageCardDescription: {
    lineHeight: 20,
  },
  imageCardImage: {
    width: 100,
    height: 100,
  },
  table: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginTop: 12,
  },
  tableRow: {
    flexDirection: "row",
    padding: spacing[4],
    borderBottomWidth: 1,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLeft: {
    flex: 1,
  },
  tableRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  tableNote: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    lineHeight: 22,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing[4],
    borderRadius: Radius.md,
    gap: 12,
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
  meterCard: {
    // Meter card specific styling
  },
  meterTitle: {
    marginBottom: 8,
  },
  meterDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  meterButton: {
    marginTop: 0,
  },
});
