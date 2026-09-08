/**
 * Rock Personality Result Screen
 * Shows quiz result: rock name, one-liner, 4 trait boxes (2x2 grid), quiz image, share text.
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Share, Platform, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText } from "../../../components/shared";
import { Images, CancelIconLight, CancelIconDark } from "../../../assets";
import { getQuizResultDisplaySource } from "../../quiz/data/quizImageMap";
import { BirdPersonalityStackParamList } from "../../../navigation/types";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { logQuizShare, logQuizViewMushroomDetails } from "../quizAnalytics";
import { getAppStoreUrl } from "../../../utils/shareUtils";
import { AI_CHAT_COLORS } from "../../../constants/colorConstants";
import { DualLineSvg } from "../../../assets";
import Ionicons from "react-native-vector-icons/Ionicons";

import { FONTS } from "../../../common/typography";

import { WhichBirdResultBackground } from "../components/WhichBirdResultBackground";
import { APP_COLORS } from "../../../config/colors";

/** Circle sizes: pixel-safe radii; INNER_RADIUS = OUTER_RADIUS - BORDER - 0.5 to remove anti-aliasing bleed */
const AVATAR_BORDER_THICKNESS = 2;
const AVATAR_OUTER_SIZE = 100;
const CIRCLE_RADIUS_OUTER = AVATAR_OUTER_SIZE / 2; // 50
const CIRCLE_RADIUS_INNER = CIRCLE_RADIUS_OUTER - AVATAR_BORDER_THICKNESS - 0.5; // 47.5
/** Figma connector asset (dual_line.svg) — 25×8 native */
const CONNECTOR_WIDTH = 32;
const CONNECTOR_HEIGHT = 10;
const CONNECTOR_COLOR_LIGHT = "#6D6D6D";
const CONNECTOR_COLOR_DARK = "#B0B0B0";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "Result"
>;
type RouteProp = {
  key: string;
  name: "Result";
  params: {
    mushroomId: string;
    mushroomName: string;
    traits: string[];
    oneLiner?: string;
    shareText?: string;
    mushroomImageUri?: string;
    photoUri?: string;
  };
};

export const BirdPersonalityResultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const Radius = theme.radius;
  const isDark = useIsDark();

  const {
    mushroomId,
    mushroomName,
    traits,
    oneLiner,
    shareText,
    mushroomImageUri,
    photoUri,
  } = route.params;
  const [mushroomImageError, setMushroomImageError] = useState(false);
  const displayOneLiner = oneLiner ?? traits?.[0] ?? "";
  const displayShareText = shareText ?? `I discovered I'm ${mushroomName}!`;
  const mushroomImageSource =
    getQuizResultDisplaySource(mushroomId) ??
    (mushroomImageUri?.trim() ? { uri: mushroomImageUri.trim() } : undefined);
  const showMushroomImage = Boolean(mushroomImageSource) && !mushroomImageError;
  const connectorColor = isDark ? CONNECTOR_COLOR_DARK : CONNECTOR_COLOR_LIGHT;

  const traitList =
    Array.isArray(traits) && traits.length >= 4
      ? traits.slice(0, 4)
      : traits?.length
      ? [traits[0], traits[0], traits[0], traits[0]]
      : [displayOneLiner, displayOneLiner, displayOneLiner, displayOneLiner];

  const handleAskAboutBird = () => {
    logQuizViewMushroomDetails(mushroomId);
    navigation.getParent()?.navigate("AskAIStack", {
      screen: "AskAIMain",
      params: {
        initialMessage: `Tell me about the ${mushroomName} — habitat, behavior, and how to identify it in the field.`,
      },
    });
  };

  const handleShare = async () => {
    try {
      const messageWithAppLink = `${displayShareText}\n\n${getAppStoreUrl()}`;
      const result = await Share.share({
        message: messageWithAppLink,
        title: `My Bird: ${mushroomName}`,
        ...(mushroomImageUri && { url: mushroomImageUri }),
      });
      if (result.action === Share.sharedAction) {
        analyticsService.logEvent(EVENTS.content_share_success, {
          content_type: "mushroom_personality",
          platform: Platform.OS,
        });
        logQuizShare(mushroomId, mushroomName);
      } else if (result.action === Share.dismissedAction) {
        analyticsService.logEvent(EVENTS.content_share_cancelled, {
          content_type: "mushroom_personality",
          platform: Platform.OS,
        });
      }
    } catch (error) {
      analyticsService.logEvent(EVENTS.content_share_cancelled, {
        content_type: "mushroom_personality",
        platform: Platform.OS,
      });
      console.error("Error sharing:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WhichBirdResultBackground isDark={isDark} />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Close — top-right header row (matches Find Your Mushroom flow) */}
        <View
          style={[
            styles.header,
            { paddingHorizontal: Space[6], paddingTop: Space[4] },
          ]}
        >
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={() => navigation.getParent()?.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            {isDark ? (
              <CancelIconDark width={24} height={24} />
            ) : (
              <CancelIconLight width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: Space[6],
              paddingTop: Space[10],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Two Circles: Avatar <-> Rock Image */}
        <View style={[styles.circlesContainer, { marginBottom: Space[8] }]}>
          {/* Avatar Circle: strict clip — wrapper → gradient (overflow) → inner (overflow) */}
          <View
            style={[
              styles.circleWrapper,
              {
                width: AVATAR_OUTER_SIZE,
                height: AVATAR_OUTER_SIZE,
                borderRadius: CIRCLE_RADIUS_OUTER,
                overflow: "hidden",
              },
            ]}
          >
            <LinearGradient
              colors={[
                AI_CHAT_COLORS.AVATAR_GRADIENT_START,
                AI_CHAT_COLORS.AVATAR_GRADIENT_MID,
                AI_CHAT_COLORS.AVATAR_GRADIENT_END,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0.0905, 0.2663, 0.847]}
              angle={123}
              style={[
                styles.gradientBorder,
                {
                  width: AVATAR_OUTER_SIZE,
                  height: AVATAR_OUTER_SIZE,
                  borderRadius: CIRCLE_RADIUS_OUTER,
                  padding: AVATAR_BORDER_THICKNESS,
                  backgroundColor: AI_CHAT_COLORS.AVATAR_GRADIENT_END,
                  overflow: "hidden",
                },
              ]}
            >
              <View
                style={[
                  styles.circleInnerClip,
                  {
                    borderRadius: CIRCLE_RADIUS_INNER,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <AppImage
                  source={
                    photoUri?.trim()
                      ? { uri: photoUri.trim() }
                      : Images.avatarHome
                  }
                  style={[
                    styles.circleImage,
                    { borderRadius: CIRCLE_RADIUS_INNER },
                  ]}
                  resizeMode="cover"
                  preferRNImage
                  fadeDuration={0}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Dual line between avatar and rock */}
          <View style={styles.connector}>
            <DualLineSvg
              width={CONNECTOR_WIDTH}
              height={CONNECTOR_HEIGHT}
              color={connectorColor}
            />
          </View>

          {/* Rock Image Circle: strict clip — wrapper → gradient (overflow) → inner (overflow) + image borderRadius */}
          <View
            style={[
              styles.circleWrapper,
              {
                width: AVATAR_OUTER_SIZE,
                height: AVATAR_OUTER_SIZE,
                borderRadius: CIRCLE_RADIUS_OUTER,
                overflow: "hidden",
              },
            ]}
          >
            <LinearGradient
              colors={[
                AI_CHAT_COLORS.AVATAR_GRADIENT_START,
                AI_CHAT_COLORS.AVATAR_GRADIENT_MID,
                AI_CHAT_COLORS.AVATAR_GRADIENT_END,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0.0905, 0.2663, 0.847]}
              angle={123}
              style={[
                styles.gradientBorder,
                {
                  width: AVATAR_OUTER_SIZE,
                  height: AVATAR_OUTER_SIZE,
                  borderRadius: CIRCLE_RADIUS_OUTER,
                  padding: AVATAR_BORDER_THICKNESS,
                  backgroundColor: AI_CHAT_COLORS.AVATAR_GRADIENT_END,
                  overflow: "hidden",
                },
              ]}
            >
              <View
                style={[
                  styles.circleInnerClip,
                  {
                    borderRadius: CIRCLE_RADIUS_INNER,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <AppImage
                  source={
                    showMushroomImage && mushroomImageSource
                      ? mushroomImageSource
                      : Images.mineralSample
                  }
                  style={[
                    styles.circleImage,
                    { borderRadius: CIRCLE_RADIUS_INNER },
                  ]}
                  resizeMode="cover"
                  preferRNImage
                  fadeDuration={0}
                  onError={() => setMushroomImageError(true)}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        <AppText
          variant="title20"
          color={colors.textSecondary}
          style={[styles.youAre, { marginBottom: Space[2] }]}
        >
          You are:
        </AppText>

        <AppText
          variant="title28"
          color={colors.textPrimary}
          onPress={handleAskAboutBird}
          style={[
            styles.rockName,
            {
              marginBottom: Space[4],
              fontSize: 32,
              lineHeight: 40,
              fontFamily: FONTS.bold,
            },
          ]}
        >
          {mushroomName}
        </AppText>

        {/* One-liner tagline */}
        {displayOneLiner ? (
          <AppText
            variant="body16"
            color={colors.textSecondary}
            style={[
              styles.oneLiner,
              { marginBottom: Space[6], textAlign: "center" },
            ]}
          >
            {displayOneLiner}
          </AppText>
        ) : null}

        {/* 4-box grid of personality traits (2 per row, 2 rows) */}
        <View style={[styles.traitsGrid, { marginBottom: Space[8] }]}>
          {/* Row 1: traits 0 and 1 */}
          <View style={[styles.traitsRow, { marginBottom: Space[3] }]}>
            {traitList.slice(0, 2).map((trait, index) => (
              <View
                key={index}
                style={[
                  styles.traitCard,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? APP_COLORS.surfaceAuthDark
                        : APP_COLORS.surfaceAuthLight,
                    borderRadius: Radius.lg,
                    padding: Space[4],
                    marginHorizontal: Space[2],
                  },
                ]}
              >
                <View
                  style={[
                    styles.traitNumberCircle,
                    {
                      backgroundColor:
                        theme.mode === "dark" ? "#FCB182" : "#725481",
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      marginBottom: Space[2],
                    },
                  ]}
                >
                  <AppText
                    variant="body14"
                    style={[
                      styles.traitNumberText,
                      {
                        color: theme.mode === "dark" ? "#111111" : "#FFFFFF",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {index + 1}
                  </AppText>
                </View>
                <AppText
                  variant="body14"
                  color={colors.textSecondary}
                  style={styles.traitText}
                  numberOfLines={3}
                >
                  {trait}
                </AppText>
              </View>
            ))}
          </View>
          {/* Row 2: traits 2 and 3 */}
          <View style={styles.traitsRow}>
            {traitList.slice(2, 4).map((trait, index) => (
              <View
                key={index + 2}
                style={[
                  styles.traitCard,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? APP_COLORS.surfaceAuthDark
                        : APP_COLORS.surfaceAuthLight,
                    borderRadius: Radius.lg,
                    padding: Space[4],
                    marginHorizontal: Space[2],
                  },
                ]}
              >
                <View
                  style={[
                    styles.traitNumberCircle,
                    {
                      backgroundColor:
                        theme.mode === "dark" ? "#FCB182" : "#725481",
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      marginBottom: Space[2],
                    },
                  ]}
                >
                  <AppText
                    variant="body14"
                    style={[
                      styles.traitNumberText,
                      {
                        color: theme.mode === "dark" ? "#111111" : "#FFFFFF",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {index + 3}
                  </AppText>
                </View>
                <AppText
                  variant="body14"
                  color={colors.textSecondary}
                  style={styles.traitText}
                  numberOfLines={3}
                >
                  {trait}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          {
            paddingHorizontal: Space[6],
            paddingBottom: Math.max(Space[6], insets.bottom),
            gap: Space[3],
          },
        ]}
      >
        {/* <TouchableOpacity
          onPress={handleAskAboutBird}
          activeOpacity={0.8}
          style={[
            styles.resultButton,
            styles.outlineButton,
            {
              borderColor: colors.primary,
              borderRadius: Radius["2xl"],
              paddingVertical: Space[3],
            },
          ]}
        >
          <AppText
            variant="body16"
            color={colors.primary}
            style={{ fontFamily: FONTS.bold }}
          >
            {COLLECTION_STRINGS.legacyDetailSections.actions.seeMoreDetails}
          </AppText>
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={[
            styles.resultButton,
            {
              backgroundColor: colors.primary,
              borderRadius: Radius["2xl"],
              paddingVertical: Space[3],
            },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color={colors.onPrimary}
            style={{ marginRight: 8 }}
          />
          <AppText
            variant="body16"
            color={colors.onPrimary}
            style={{ fontFamily: FONTS.bold }}
          >
            {COLLECTION_STRINGS.legacyDetailSections.actions.share}
          </AppText>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
  },
  circlesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  circleWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  gradientBorder: {
    justifyContent: "center",
    alignItems: "center",
  },
  circleInnerClip: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  connector: {
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  circleImage: {
    ...StyleSheet.absoluteFillObject,
  },
  youAre: {
    textAlign: "center",
  },
  rockName: {
    fontFamily: FONTS.bold,
    textAlign: "center",
    alignSelf: "stretch",
    width: "100%",
    paddingBottom: 2,
  },
  oneLiner: {
    lineHeight: 22,
  },
  traitsGrid: {
    width: "100%",
    alignSelf: "stretch",
  },
  traitsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  traitCard: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  traitNumberCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  traitNumberText: {
    fontFamily: FONTS.bold,
  },
  traitText: {
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    width: "100%",
  },
  resultButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonContainer: {
    paddingTop: 16,
  },
});
