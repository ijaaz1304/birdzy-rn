/**
 * Guides Main Screen
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Card } from "../../../molecules";
import { GuidesStackParamList } from "../../../navigation/types";

import { spacing } from "../../../design-system/spacing";

type GuidesScreenNavigationProp = NativeStackNavigationProp<
  GuidesStackParamList,
  "GuidesMain"
>;

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: keyof GuidesStackParamList;
}

const GUIDES: Guide[] = [
  {
    id: "watering",
    title: "Watering Guide",
    description: "Learn the basics of caring for your collection",
    icon: "water",
    route: "WateringGuide",
  },
  {
    id: "light",
    title: "Light Guide",
    description: "Understand light and display tips",
    icon: "sunny",
    route: "LightGuide",
  },
  {
    id: "soil",
    title: "Soil Guide",
    description: "Storage and display considerations",
    icon: "leaf",
    route: "SoilGuide",
  },
  {
    id: "fertilizer",
    title: "Fertilizer Guide",
    description: "Fertilizing tips and best practices",
    icon: "flask",
    route: "FertilizerGuide",
  },
  {
    id: "repotting",
    title: "Repotting Guide",
    description: "When and how to update your displays",
    icon: "cube",
    route: "RepottingGuide",
  },
];

export const GuidesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<GuidesScreenNavigationProp>();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="display" size="medium" weight="bold">
          Guides
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {GUIDES.map((guide) => (
          <Card
            key={guide.id}
            variant="elevated"
            padding="large"
            style={styles.guideCard}
            onPress={() =>
              navigation.navigate(
                guide.route as
                  | "WateringGuide"
                  | "LightGuide"
                  | "SoilGuide"
                  | "FertilizerGuide"
                  | "RepottingGuide"
              )
            }
          >
            <View style={styles.guideContent}>
              <Icon name={guide.icon} size={32} color={theme.colors.primary} />
              <View style={styles.guideInfo}>
                <Text
                  variant="title"
                  size="medium"
                  weight="semibold"
                  style={styles.guideTitle}
                >
                  {guide.title}
                </Text>
                <Text variant="body" size="small" color="textSecondary">
                  {guide.description}
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={24}
                color={theme.colors.textTertiary}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing[4],
  },
  content: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[4],
  },
  guideCard: {
    marginBottom: 12,
  },
  guideContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideInfo: {
    flex: 1,
    marginLeft: 16,
  },
  guideTitle: {
    marginBottom: 4,
  },
});
