/**
 * AI Identifier mineral details layout.
 * Structure: Hero → OtherPossibleMatches (once) → RockTitle → DetailTabs → Tab content.
 * Used for identification, catalogue free, and rock-of-the-day flows.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { Text as AtomText } from "../../../atoms";
import { CatalogueDetailCarousel } from "./CatalogueDetailCarousel";
import { getMushroomDisplayName, getDisplayName as getRecordDisplayName } from "../../../utils/mushroomDisplayUtils";
import { formatTitleCase } from "../../../utils";
import {
  getMushroomImageUrlFromMatch,
  getFirstMushroomImageUrl,
} from "../../../config/mushroomImageUrls.config";
import { Images } from "../../../assets";
import { SubscribeToPremiumCard } from "./SubscribeToPremiumCard";
import { SHEET_COLORS } from "../../../constants";
import { SCREEN_COLORS } from "../../../constants/colorConstants";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import { MushroomSafetyBadge } from "../../../components/mushroom/MushroomSafetyBadge";
import { getMatchImageUrls } from "../../../utils/mushroomApiMappers";

const LAYOUT_MARGIN = 20;
const TEXT_LINE_GAP = 8;
const NAME_ORIGIN_TOP = 16;
const HEADER_TABS_MARGIN_TOP = 24;
const OTHER_MATCHES_CARD_SHADOW = {
  shadowColor: APP_COLORS.mineralShadowOlive,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 6,
};

export interface MushroomDetailsAILayoutRock {
  commonName?: string;
  scientificName?: string;
  canonicalName?: string;
  avgPricePerCarat?: string;
}

export interface MushroomDetailsAILayoutTab {
  id: string;
  label: string;
}

export interface HeroImageProps {
  images: Array<{ id: string; uri: string | number }>;
  isDark?: boolean;
  /** Width as percent of screen (e.g. 90 for identification). Default 100. */
  widthPercent?: number;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  images,
  isDark,
  widthPercent = 100,
}) => (
  <View
    style={[
      localStyles.carouselWrap,
      widthPercent < 100 && {
        width: `${widthPercent}%`,
        alignSelf: "center",
      },
    ]}
  >
    <CatalogueDetailCarousel
      images={images}
      isDark={isDark}
      widthPercent={widthPercent}
    />
  </View>
);

export interface OtherPossibleMatchesProps {
  matches: any[];
  isDark: boolean;
  theme: { colors: any; radius: any };
  nameStyle: object;
  linkStyle: object;
  onSeeAll: () => void;
  onMatchPress: (match: any) => void;
  imageErrors: Set<string>;
  onImageError: (key: string) => void;
  getMushroomDisplayName: (
    common?: string,
    scientific?: string,
    canonical?: string
  ) => string;
}

export const OtherPossibleMatches: React.FC<OtherPossibleMatchesProps> = ({
  matches,
  isDark,
  theme,
  nameStyle,
  linkStyle,
  onSeeAll,
  onMatchPress,
  imageErrors,
  onImageError,
  getMushroomDisplayName: getDisplayName,
}) => {
  if (!matches?.length) return null;
  const slice = matches.slice(0, 8);
  const isSingleMatch = slice.length === 1;
  const singleCardWidth = Dimensions.get("window").width * 0.9;

  return (
    <View
      style={[
        localStyles.otherMatchesContainer,
        {
          backgroundColor: isDark
            ? APP_COLORS.surfaceBrownDark
            : APP_COLORS.surfaceBrownLight,
        },
      ]}
    >
      <View style={localStyles.otherMatchesHeader}>
        <AtomText
          variant="body"
          size="medium"
          weight="semibold"
          style={nameStyle}
        >
          Other Possible Matches ({matches.length})
        </AtomText>
        <TouchableOpacity onPress={onSeeAll}>
          <AtomText
            variant="body"
            size="small"
            weight="medium"
            style={linkStyle}
          >
            See all
          </AtomText>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={localStyles.otherMatchesScroll}
      >
        {slice.map((match: any, index: number) => {
          const matchKey = match.id ?? match._id ?? `match-${index}`;
          const matchPayload = match.match ?? match;
          const imageUrls = getMatchImageUrls(matchPayload);
          const imageUri =
            ((match.image &&
            typeof match.image === "string" &&
            match.image.startsWith("http")
              ? match.image
              : imageUrls[0]) ||
              getMushroomImageUrlFromMatch(
                match.canonicalName,
                match.images?.[0]
              )) ??
            getFirstMushroomImageUrl(match.canonicalName);
          const showPlaceholder =
            !imageUri || imageErrors.has(String(matchKey));
          return (
            <TouchableOpacity
              key={match.id ?? index}
              style={[
                localStyles.otherMatchesCard,
                isSingleMatch && { width: singleCardWidth, marginRight: 0 },
                {
                  backgroundColor: isDark
                    ? theme.colors.surfacePrimary
                    : APP_COLORS.surfaceWhite,
                  borderColor: isDark
                    ? theme.colors.border0
                    : SCREEN_COLORS.LIGHT.border,
                  ...OTHER_MATCHES_CARD_SHADOW,
                },
              ]}
              onPress={() => onMatchPress(match)}
            >
              <View style={localStyles.otherMatchesCardContent}>
                <View>
                  <AtomText
                    variant="body"
                    size="small"
                    weight="semibold"
                    style={[
                      localStyles.altName,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {getRecordDisplayName({
                      commonNames:
                        match.commonNames ?? match.match?.commonNames,
                      genusCommonNames:
                        match.genusCommonNames ??
                        match.match?.genusCommonNames,
                      commonName:
                        match.commonName ?? match.match?.commonName,
                      name: match.name ?? match.match?.name,
                      scientificName:
                        match.scientificName ??
                        match.match?.scientificName ??
                        match.match?.verbatimScientificName,
                      canonicalName:
                        match.canonicalName ?? match.match?.canonicalName,
                      verbatimScientificName:
                        match.match?.verbatimScientificName,
                    }) || "Unknown"}
                  </AtomText>
                  <AtomText variant="body" size="small" color="textSecondary">
                    {match.accuracy != null
                      ? `${match.accuracy}%`
                      : match.similarityScore != null
                      ? `${Math.round(match.similarityScore * 100)}%`
                      : "0%"}{" "}
                    Accuracy
                  </AtomText>
                  <MushroomSafetyBadge
                    edibility={
                      matchPayload.edibility ?? match.characteristics?.edibility
                    }
                    toxicitySeverity={
                      matchPayload.toxicitySeverity ??
                      match.characteristics?.toxicitySeverity
                    }
                    psychoactive={
                      matchPayload.psychoactive ??
                      match.characteristics?.psychoactive
                    }
                    compact
                  />
                </View>
                <AppImage
                  source={
                    showPlaceholder
                      ? Images.card_image_placeholder
                      : { uri: imageUri }
                  }
                  style={[
                    localStyles.otherMatchesImage,
                    { borderRadius: theme.radius.sm },
                  ]}
                  resizeMode="cover"
                  onError={() => onImageError(String(matchKey))}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export interface RockTitleProps {
  rock: MushroomDetailsAILayoutRock;
  nameOrigin?: string | null;
  isDark?: boolean;
  nameHeadingStyle: object;
  synonymStyle: object;
  priceStyle: object;
  nameOriginBg: string;
  subTextSpec: object;
}

export const RockTitle: React.FC<RockTitleProps> = ({
  rock,
  nameOrigin,
  nameHeadingStyle,
  synonymStyle,
  priceStyle,
  nameOriginBg,
  subTextSpec,
}) => {
  const name = getRecordDisplayName(rock);
  return (
    <View style={localStyles.rockTitleContainer}>
      <Text style={nameHeadingStyle}>{formatTitleCase(name)}</Text>
      {rock.scientificName && (
        <Text style={[localStyles.synonym, synonymStyle]}>
          {formatTitleCase(rock.scientificName)}
        </Text>
      )}
      {rock.avgPricePerCarat && (
        <View style={localStyles.priceRow}>
          <Text style={priceStyle}>{rock.avgPricePerCarat}</Text>
          <Text style={[localStyles.unit, synonymStyle]}>/Carat</Text>
        </View>
      )}
      {nameOrigin ? (
        <View
          style={[localStyles.nameOrigin, { backgroundColor: nameOriginBg }]}
        >
          <Text style={subTextSpec}>{nameOrigin}</Text>
        </View>
      ) : null}
    </View>
  );
};

export interface DetailTabsProps {
  tabs: MushroomDetailsAILayoutTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  isDark: boolean;
  tabBarBorderColor: string;
  tabActiveUnderline: string;
  tabActiveTextStyle: object;
  tabInactiveTextStyle: object;
  showPremiumBadgeOnNonOverview?: boolean;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  isDark,
  tabBarBorderColor,
  tabActiveUnderline,
  tabActiveTextStyle,
  tabInactiveTextStyle,
  showPremiumBadgeOnNonOverview = false,
}) => (
  <View
    style={[
      localStyles.tabBar,
      {
        borderBottomColor: tabBarBorderColor,
        backgroundColor: isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT,
      },
    ]}
  >
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={localStyles.tabBarScrollContent}
      style={{
        backgroundColor: isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT,
      }}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onChange(tab.id)}
          style={[
            localStyles.tab,
            localStyles.tabScrollable,
            activeTab === tab.id && {
              borderBottomWidth: 2,
              borderBottomColor: tabActiveUnderline,
            },
          ]}
        >
          <AtomText
            variant="body"
            size="medium"
            weight={activeTab === tab.id ? "bold" : "normal"}
            numberOfLines={1}
            style={[
              localStyles.tabLabel,
              activeTab === tab.id ? tabActiveTextStyle : tabInactiveTextStyle,
            ]}
          >
            {tab.label}
          </AtomText>
          {showPremiumBadgeOnNonOverview && tab.id !== "overview" && (
            <AppImage
              source={Images.mushroomGoPro}
              style={localStyles.tabBadge}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

/** Locked Physical/Chemical tab: Go Premium prompt */
export interface LockedPhysicalPreviewProps {
  onGoPremium: () => void;
  message?: string;
  theme: { radius: any };
  spacing: Record<number, number>;
  isDark: boolean;
}

export const LockedPhysicalPreview: React.FC<LockedPhysicalPreviewProps> = ({
  onGoPremium,
  message = "Go Premium to view Physical & Chemical properties",
  spacing,
  isDark,
}) => (
  <View style={localStyles.lockedPreview}>
    <SubscribeToPremiumCard isDark={isDark} onPress={onGoPremium} />
    <AtomText
      variant="body"
      size="small"
      color="textSecondary"
      style={[localStyles.lockedMessage, { marginTop: spacing[3] }]}
    >
      {message}
    </AtomText>
  </View>
);

export interface MushroomDetailsAILayoutProps {
  /** Hero carousel images */
  images: Array<{ id: string; uri: string | number }>;
  /** Show "Other Possible Matches" block (identification only) */
  showOtherMatches: boolean;
  otherMatches?: any[];
  otherMatchesImageErrors: Set<string>;
  setOtherMatchesImageErrors: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** Rock/mineral data for title and tabs */
  rock: MushroomDetailsAILayoutRock;
  nameOrigin: string | null | undefined;
  /** When from identification: match confidence 0–1 or 0–100. Shown as "X% Accuracy" badge below title. */
  identificationAccuracy?: number;
  /** Tabs and active tab */
  tabs: MushroomDetailsAILayoutTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Theme / spec from parent */
  isDark: boolean;
  theme: { colors: any; radius: any; spacing: Record<number, number> };
  spec: {
    PAGE_BG?: string;
    CARD_BG?: string;
    TAB_DIVIDER?: string;
    TAB_ACTIVE_UNDERLINE?: string;
    TAB_ACTIVE_TEXT?: string;
    TAB_INACTIVE_TEXT?: string;
  };
  nameHeadingStyle: object;
  synonymStyle: object;
  priceStyle: object;
  nameOriginBg: string;
  subTextSpec: object;
  tabBarBorderColor: string;
  /** Navigation for Other Matches */
  onSeeAllMatches: () => void;
  onMatchPress: (match: any) => void;
  /** Tab content (OverviewSection | LockedPhysicalPreview | PhysicalChemicalSection) */
  children: React.ReactNode;
  /** Hero carousel width as percent of screen (e.g. 90 for identification). Default 100. */
  heroWidthPercent?: number;
  /** Optional top margin for hero (e.g. to push down in identification flow). */
  heroMarginTop?: number;
}

export const MushroomDetailsAILayout: React.FC<
  MushroomDetailsAILayoutProps
> = ({
  images,
  showOtherMatches,
  otherMatches = [],
  otherMatchesImageErrors,
  setOtherMatchesImageErrors,
  rock,
  nameOrigin,
  identificationAccuracy: _identificationAccuracy,
  tabs,
  activeTab,
  onTabChange,
  isDark,
  theme,
  spec,
  nameHeadingStyle,
  synonymStyle,
  priceStyle,
  nameOriginBg,
  subTextSpec,
  tabBarBorderColor,
  onSeeAllMatches,
  onMatchPress,
  children,
  heroWidthPercent = 100,
  heroMarginTop = 0,
}) => {
  const sectionCardBg = isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT;
  return (
    <>
      {images.length > 0 && (
        <View
          style={[
            { backgroundColor: sectionCardBg },
            heroMarginTop > 0 && { marginTop: heroMarginTop },
          ]}
        >
          <HeroImage
            images={images}
            isDark={isDark}
            widthPercent={heroWidthPercent}
          />
        </View>
      )}

      {showOtherMatches && otherMatches.length > 0 && (
        <OtherPossibleMatches
          matches={otherMatches}
          isDark={isDark}
          theme={theme}
          nameStyle={{
            color: isDark ? APP_COLORS.surfaceWhite : theme.colors.textPrimary,
          }}
          linkStyle={{
            color: theme.colors.primary,
            textDecorationLine: "underline",
          }}
          onSeeAll={onSeeAllMatches}
          onMatchPress={onMatchPress}
          imageErrors={otherMatchesImageErrors}
          onImageError={(key) =>
            setOtherMatchesImageErrors((prev) => new Set(prev).add(key))
          }
          getMushroomDisplayName={getMushroomDisplayName}
        />
      )}

      <View style={{ backgroundColor: sectionCardBg }}>
        <RockTitle
          rock={rock}
          nameOrigin={nameOrigin}
          isDark={isDark}
          nameHeadingStyle={nameHeadingStyle}
          synonymStyle={synonymStyle}
          priceStyle={priceStyle}
          nameOriginBg={nameOriginBg}
          subTextSpec={subTextSpec}
        />
        <DetailTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={onTabChange}
          isDark={isDark}
          tabBarBorderColor={tabBarBorderColor}
          tabActiveUnderline={spec.TAB_ACTIVE_UNDERLINE ?? theme.colors.primary}
          tabActiveTextStyle={{
            fontSize: 14,
            color: spec.TAB_ACTIVE_TEXT ?? theme.colors.primary,
          }}
          tabInactiveTextStyle={{
            fontSize: 14,
            color: spec.TAB_INACTIVE_TEXT ?? theme.colors.textSecondary,
          }}
          showPremiumBadgeOnNonOverview
        />
      </View>

      <View>{children}</View>
    </>
  );
};

const localStyles = StyleSheet.create({
  carouselWrap: {
    position: "relative",
    width: "100%",
  },
  otherMatchesContainer: {
    width: Dimensions.get("window").width,
    alignSelf: "stretch",
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: spacing[4],
  },
  otherMatchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  otherMatchesScroll: {
    marginBottom: 0,
  },
  otherMatchesCard: {
    width: 268,
    height: 100,
    paddingRight: 12,
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  otherMatchesCardContent: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    paddingLeft: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  otherMatchesImage: {
    width: 72,
    height: 72,
  },
  altName: {
    marginBottom: 4,
    textAlign: "left",
  },
  rockTitleContainer: {
    marginHorizontal: LAYOUT_MARGIN,
    marginTop: 16,
  },
  synonym: {
    marginTop: TEXT_LINE_GAP,
    fontStyle: "italic",
  },
  priceRow: {
    marginTop: TEXT_LINE_GAP,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  unit: {
    marginLeft: 4,
  },
  nameOrigin: {
    marginTop: NAME_ORIGIN_TOP,
    borderRadius: Radius.md,
    padding: 12,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingVertical: 2,
    marginTop: HEADER_TABS_MARGIN_TOP,
    marginHorizontal: LAYOUT_MARGIN,
  },
  tabBarScrollContent: {
    flexGrow: 0,
    alignItems: "center",
  },
  tab: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabScrollable: {
    flex: 0,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 14,
  },
  tabBadge: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  lockedPreview: {
    marginTop: 16,
    marginHorizontal: LAYOUT_MARGIN,
    alignItems: "center",
    paddingVertical: 32,
  },
  goProImage: {
    width: 80,
    height: 80,
  },
  lockedMessage: {
    textAlign: "center",
  },
});
