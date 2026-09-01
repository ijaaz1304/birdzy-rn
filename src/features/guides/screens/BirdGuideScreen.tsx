/**
 * Mushroom Guide Screen
 * Reusable screen that renders guide content based on backend data
 */

import { CachedRemoteImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { GuideSectionRenderer } from "../components/GuideSectionRenderer";
import { BirdGuide, GuideType } from "../../../types/guide.types";
import { GuidesStackParamList } from "../../../navigation/types";

import { spacing } from "../../../design-system/spacing";

type BirdGuideScreenRouteProp = RouteProp<
  GuidesStackParamList,
  "BirdGuide"
>;
type BirdGuideScreenNavigationProp = NativeStackNavigationProp<
  GuidesStackParamList,
  "BirdGuide"
>;

export const BirdGuideScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const navigation = useNavigation<BirdGuideScreenNavigationProp>();
  const route = useRoute<BirdGuideScreenRouteProp>();
  const { guideType, mushroomName } = route.params;

  // Create guide with fallback data
  // In production, this would come from API
  const displayGuide: BirdGuide = {
    id: `guide-${guideType}`,
    guideType: guideType as GuideType,
    mushroomName: mushroomName || "Bird",
    hero: {
      image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
      title: `${guideType.charAt(0).toUpperCase() + guideType.slice(1)} Guide`,
      subtitle: mushroomName || "Bird",
      description: `Learn how to properly care for your ${
        mushroomName || "bird"
      } with this ${guideType} guide.`,
    },
    sections: [
      {
        type: "text",
        title: "Coming Soon",
        body: `Detailed ${guideType} guide content will be available soon.`,
      },
    ],
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          {displayGuide.hero.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <CachedRemoteImage
            uri={displayGuide.hero.image}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.heroOverlay,
              { backgroundColor: colors.surfacePrimary },
            ]}
          >
            <Text
              variant="display"
              size="large"
              weight="bold"
              style={styles.heroTitle}
            >
              {displayGuide.hero.title}
            </Text>
            <Text
              variant="title"
              size="medium"
              weight="semibold"
              style={styles.heroSubtitle}
            >
              {displayGuide.hero.subtitle}
            </Text>
            <Text
              variant="body"
              size="medium"
              color="textSecondary"
              style={styles.heroDescription}
            >
              {displayGuide.hero.description}
            </Text>
          </View>
        </View>

        {/* Guide Sections */}
        <View style={styles.sectionsContainer}>
          {displayGuide.sections.map((section, index) => (
            <GuideSectionRenderer key={index} section={section} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    position: "relative",
    height: 300,
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroTitle: {
    marginBottom: 8,
  },
  heroSubtitle: {
    marginBottom: 12,
  },
  heroDescription: {
    lineHeight: 22,
  },
  sectionsContainer: {
    paddingHorizontal: spacing[4],
    gap: 24,
  },
});
