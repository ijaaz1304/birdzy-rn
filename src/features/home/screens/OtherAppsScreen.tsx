import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
import { useWindowDimensions } from "react-native";
/**
 * Other Apps Screen
 * Fetches cross-promo apps from PUBLISHED_APPS_URL (list.json).
 * Excludes Birdzy (Play package / mushroom iOS slug), and requires a store URL for the current platform.
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { usePublishedAppsStore, PublishedApp } from "../publishedApps.store";
import { filterPublishedAppsForCrossPromo } from "../publishedAppsFilter";
import { useFeatureConfig } from "../../../config/context";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { AppOtherAppCard } from "../../../components/shared";
import { NavBackIcon } from "../../../atoms";
import { Images } from "../../../assets";

import { FONTS } from "../../../common/typography";

type OtherAppsScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "OtherApps"
>;

/** Figma 8015:142144: 12pt between columns, 16pt between rows, 20pt side margins */
const CARD_GAP = 12;
const ROW_GAP = 16;
const SIDE_MARGIN = 20;

export const OtherAppsScreen: React.FC = () => {
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const gridColumns = getResponsiveGridColumns(windowWidth, fontScale);
  /** One column's width, so a lone last card stays half-width instead of stretching */
  const columnWidth = (windowWidth - 2 * SIDE_MARGIN - CARD_GAP) / 2;
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<OtherAppsScreenNavigationProp>();
  const homeConfig = useFeatureConfig("home");
  const { result, loading, error, managePublishedApps } =
    usePublishedAppsStore();

  useEffect(() => {
    managePublishedApps();
  }, [managePublishedApps]);

  const filteredApps = filterPublishedAppsForCrossPromo(
    Array.isArray(result) ? result : []
  );

  // Show only filtered apps (no static fallbacks without store URLs)
  const displayApps = filteredApps;

  const handleGetApp = (app: PublishedApp) => {
    analyticsService.logEvent(EVENTS.get_app, {
      app_name: app.title ?? app.id ?? "unknown",
    });
    const url = Platform.OS === "android" ? app.playstoreUrl : app.appstoreUrl;
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: PublishedApp }) => (
    <View
      style={
        gridColumns > 1
          ? [styles.cardWrap, { maxWidth: columnWidth }]
          : styles.cardWrapSingle
      }
    >
      <AppOtherAppCard
        title={item.title || "App"}
        subtitle={item.description || ""}
        image={item.imageUrl ? { uri: item.imageUrl } : Images.appIcon}
        onPress={() => handleGetApp(item)}
        singleColumn={gridColumns === 1}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}
    >
      {/* Figma Top Navigation Bar: 52pt min, back icon (8pt padding), Title/18 Bold left-aligned; 2 lines max */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {homeConfig.sections.otherApps.title}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {error.message || "Unable to load apps"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayApps}
          numColumns={gridColumns}
          key={`adaptive-grid-${gridColumns}`}
          keyExtractor={(item, index) =>
            item.id ?? item.title ?? `app-${index}`
          }
          renderItem={renderItem}
          columnWrapperStyle={
            gridColumns > 1
              ? [styles.columnWrapper, { gap: CARD_GAP }]
              : undefined
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  list: {
    paddingHorizontal: SIDE_MARGIN,
    paddingVertical: 24,
    gap: ROW_GAP,
  },
  columnWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  /** Two equal columns; cards in a row share the taller card's height */
  cardWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardWrapSingle: {
    width: "100%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});
