/**
 * Other Apps Screen
 * Fetches cross-promo apps from PUBLISHED_APPS_URL (list.json).
 * Excludes Birdzy (Play package / mushroom iOS slug), and requires a store URL for the current platform.
 */

import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Linking, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { OVERLAY_COLORS } from "../../../constants/colorConstants";
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

const CARD_GAP = 12;

export const OtherAppsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
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
    <View style={styles.cardWrap}>
      <AppOtherAppCard
        title={item.title || "App"}
        subtitle={item.description || ""}
        image={item.imageUrl ? { uri: item.imageUrl } : Images.appIcon}
        onPress={() => handleGetApp(item)}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: Space[6] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {homeConfig.sections.otherApps.title}
        </Text>
        <View style={styles.placeholder} />
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
          numColumns={2}
          keyExtractor={(item, index) =>
            item.id ?? item.title ?? `app-${index}`
          }
          renderItem={renderItem}
          columnWrapperStyle={[styles.columnWrapper, { gap: CARD_GAP }]}
          contentContainerStyle={[styles.list, { paddingHorizontal: Space[6] }]}
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
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OVERLAY_COLORS.BANNER_CLOSE_BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  placeholder: {
    width: 24,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
    maxWidth: "48%",
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
