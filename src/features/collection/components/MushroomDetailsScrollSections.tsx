/**
 * Bird details scroll sections.
 */

import { AppImage, AppImageBackground, CachedRemoteImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Linking, StyleProp, ViewStyle, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { InfoRow } from "../../../atoms";
import { MapPreview } from "../../../molecules";
import { BlurOverlay } from "../../../components/BlurOverlay";
import { Images } from "../../../assets";
import { SubscribeToPremiumCard } from "./SubscribeToPremiumCard";
import { APP_COLORS } from "../../../config/colors";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { spacing } from "../../../design-system/spacing";
import {
  checkLocationPermission,
  openDeviceSettings,
  waitForLocationPermissionGranted,
} from "../../../services/permissions";
import {
  completeCustomThenNativeFlow,
  getLocationPermissionEntryAction,
} from "../../../services/permissions/locationPermissionFlow.service";
import { resetLocationPermissionDenialCount } from "../../../services/permissions/locationPermissionAttempts.service";
import { getCurrentLocation } from "../../../utils/locationService";
import { COUNTRY_MAP_ZOOM_LEVEL } from "../../../utils/countryCoordinates";
import type { IdentificationLocation } from "../../camera/identificationLocation.store";
import { normalizeMushroomDetail } from "../../../utils/mushroomApiMappers";
import {
  BirdSoundsSection,
  BIRD_SOUND_PREVIEW_COUNT,
  BirdRangeMapSection,
  BirdGeographicRangeMap,
  BirdCharacteristicsSection,
  BirdBehaviorSection,
  BirdHabitatRows,
  BirdFeedingDietSection,
  BirdBreedingSection,
  BirdMigrationNotes,
  BirdOverviewExtras,
  BirdRecordSoundCtaNav,
} from "./BirdDetailSections";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import type { BirdSoundsScreenParams } from "../../../navigation/types";
import { buildBirdSoundListItems } from "../utils/birdSoundListItems";
import type { MushroomDetail } from "../../../types/mushrooms.types";
import type { LookAlike } from "../../../services/api/features/core.api.types";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
import { FIGMA_TOKENS } from "../../../design-system/colors/figmaTokens";

const LAYOUT_MARGIN = 20;
const SECTION_DIVIDER_BORDER_LIGHT = "#E7E7E7";
const SECTION_DIVIDER_BORDER_DARK = "#333333";

function formatSimilarityAccuracy(score?: number | null): string | null {
  if (score == null || Number.isNaN(score)) return null;
  const percent = Math.round(score <= 1 ? score * 100 : score);
  return `${percent}%`;
}

/** Figma 9170:26307 — centered label with horizontal divider lines (non-premium) */
function SectionDividerHeading({
  title,
  isDark,
  style,
}: {
  title: string;
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const dividerColor = isDark
    ? SECTION_DIVIDER_BORDER_DARK
    : SECTION_DIVIDER_BORDER_LIGHT;

  return (
    <View style={[styles.sectionDividerHeading, style]}>
      <View
        style={[styles.sectionDividerLine, { backgroundColor: dividerColor }]}
      />
      <Text style={styles.sectionDividerLabel}>{title}</Text>
      <View
        style={[styles.sectionDividerLine, { backgroundColor: dividerColor }]}
      />
    </View>
  );
}

function SectionTopicHeading({
  title,
  isDark,
  textPrimary,
  useDividerStyle,
  style,
}: {
  title: string;
  isDark: boolean;
  textPrimary: string;
  useDividerStyle: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (useDividerStyle) {
    return (
      <SectionDividerHeading title={title} isDark={isDark} style={style} />
    );
  }

  return (
    <Text style={[styles.sectionTitlePlain, { color: textPrimary }, style]}>
      {title}
    </Text>
  );
}

export type MushroomScrollSectionId =
  | "overview"
  | "sounds"
  | "range"
  | "similar"
  | "morphology"
  | "habitat"
  | "behavior"
  | "feeding"
  | "breeding";

type Props = {
  mushroomData: MushroomDetail;
  detailedDescription?: string;
  isDark: boolean;
  isPremium: boolean;
  isMushroomOfTheDay?: boolean;
  customLocation?: string;
  countryMapLoading?: boolean;
  onNavigatePremium: () => void;
  onLookAlikePress?: (lookAlike: Record<string, unknown>) => void;
  onSeeAllSimilarPress?: () => void;
  onSectionLayout?: (sectionId: MushroomScrollSectionId, y: number) => void;
  locationFlow: CustomLocationSectionFlow;
  textPrimary: string;
  textSecondary: string;
  surfacePrimary: string;
  surfaceSecondary: string;
};

function TaxonomyRows({
  classification,
  textPrimary,
  textSecondary,
  isDark,
}: {
  classification: NonNullable<
    ReturnType<typeof normalizeMushroomDetail>["scientificClassification"]
  >;
  textPrimary: string;
  textSecondary: string;
  isDark: boolean;
}) {
  const rowDivider = {
    height: 1,
    backgroundColor: isDark ? "#333333" : "#E7E7E7",
  };
  const [expanded, setExpanded] = useState(false);
  const rows = [
    { label: "Kingdom", value: classification.kingdom },
    { label: "Phylum", value: classification.phylum },
    { label: "Class", value: classification.class },
    { label: "Order", value: classification.order },
    { label: "Family", value: classification.family },
    { label: "Genus", value: classification.genus },
    { label: "Species", value: classification.species },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  const visibleRows = expanded ? rows : rows.slice(0, 3);
  const hasMore = rows.length > 3;

  const heading = (
    <Text
      style={[
        styles.sectionTitlePlain,
        { color: textPrimary },
        hasMore ? styles.sectionTitlePlainCompact : undefined,
      ]}
    >
      Scientific Classification (Taxonomy)
    </Text>
  );

  return (
    <View style={styles.taxonomyBlock}>
      {hasMore ? (
        <TouchableOpacity
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.taxonomyHeadingRow}
          activeOpacity={0.8}
        >
          {heading}
          <MaterialIcons
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color={textPrimary}
          />
        </TouchableOpacity>
      ) : (
        heading
      )}
      {visibleRows.map((row, index) => (
        <View key={row.label}>
          <InfoRow
            label={row.label}
            value={row.value!}
            labelColor={textSecondary}
            valueColor={textPrimary}
            rowPaddingVertical={2}
            labelStyle={styles.infoRowLabel}
            valueStyle={styles.infoRowValue}
          />
          {index < visibleRows.length - 1 ? <View style={rowDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function LocationLockedPrompt({
  onEnable,
  textPrimary,
}: {
  onEnable: () => void;
  textPrimary: string;
}) {
  return (
    <View style={styles.locationLockedCard}>
      <AppImageBackground
        source={Images.mushroomBlurredLocation}
        style={styles.locationLockedBackground}
        imageStyle={styles.locationLockedBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.locationLockedContent}>
          <View style={styles.locationLockedTop}>
            <AppImage
              source={Images.mushroomLocationLock}
              style={styles.locationLockedIcon}
              resizeMode="contain"
            />
            <Text
              style={[styles.locationLockedMessage, { color: textPrimary }]}
            >
              Enable location to see findings
            </Text>
          </View>
          <TouchableOpacity
            onPress={onEnable}
            style={styles.locationLockedButton}
            activeOpacity={0.85}
          >
            <Text style={styles.locationLockedButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </AppImageBackground>
    </View>
  );
}

function useCustomLocationSectionFlow(
  mapCoords?: { lat: number; lng: number } | null,
  hasSpecimenGps = false
) {
  const [localCoords, setLocalCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  /** User picked a place via Custom Location sheet (no device GPS required). */
  const [hasCustomLocationOverride, setHasCustomLocationOverride] =
    useState(false);
  const [appliedCustomLocationAddress, setAppliedCustomLocationAddress] =
    useState<string | null>(null);
  const [isFetchingDeviceCoords, setIsFetchingDeviceCoords] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [showChangeLocationSheet, setShowChangeLocationSheet] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const refreshDeviceCoordsIfNeeded = useCallback(async () => {
    if (mapCoords) return;

    setIsFetchingDeviceCoords(true);
    const GPS_PERMISSION_DENIED_CODE = 1;
    const GPS_POST_GRANT_RETRY_DELAY_MS = 400;

    const tryFetch = async () =>
      getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });

    try {
      let currentLocation;
      try {
        currentLocation = await tryFetch();
      } catch (firstError) {
        const code = (firstError as { code?: number })?.code;
        if (code === GPS_PERMISSION_DENIED_CODE) {
          await new Promise<void>((resolve) =>
            setTimeout(() => resolve(), GPS_POST_GRANT_RETRY_DELAY_MS)
          );
          currentLocation = await tryFetch();
        } else {
          currentLocation = await getCurrentLocation({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 120000,
          });
        }
      }

      setLocalCoords({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    } catch {
      try {
        const currentLocation = await getCurrentLocation({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 120000,
        });
        setLocalCoords({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        });
      } catch {
        // Keep loading / locked state if device location is unavailable.
      }
    } finally {
      setIsFetchingDeviceCoords(false);
    }
  }, [mapCoords]);

  const applyGrantedLocationState = useCallback(async () => {
    setHasLocationPermission(true);
    await resetLocationPermissionDenialCount();
    await refreshDeviceCoordsIfNeeded();
  }, [refreshDeviceCoordsIfNeeded]);

  const syncPermission = useCallback(async () => {
    let granted = (await checkLocationPermission()).granted;
    if (!granted) {
      granted = await waitForLocationPermissionGranted();
    }

    setHasLocationPermission(granted);
    if (granted) {
      await resetLocationPermissionDenialCount();
      await refreshDeviceCoordsIfNeeded();
    }
    return granted;
  }, [refreshDeviceCoordsIfNeeded]);

  useEffect(() => {
    void syncPermission();
  }, [syncPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncPermission();
      }
    });
    return () => sub.remove();
  }, [syncPermission]);

  const displayCoords = mapCoords ?? localCoords;
  const showMap =
    !!displayCoords &&
    (hasLocationPermission || hasCustomLocationOverride || !!mapCoords);
  const showMapLoading =
    hasLocationPermission &&
    !hasCustomLocationOverride &&
    !displayCoords &&
    isFetchingDeviceCoords;
  const isCountryBasedMap = !!mapCoords && !hasSpecimenGps;
  const sectionTitle = hasSpecimenGps ? "Location" : "Custom Location";

  const handlePermissionGranted = useCallback(async () => {
    setHasLocationPermission(true);
    await applyGrantedLocationState();

    const granted = await waitForLocationPermissionGranted();
    if (granted) {
      setHasLocationPermission(true);
      if (!mapCoords) {
        await refreshDeviceCoordsIfNeeded();
      }
      return;
    }

    const latest = await checkLocationPermission();
    if (latest.granted) {
      setHasLocationPermission(true);
      if (!mapCoords) {
        await refreshDeviceCoordsIfNeeded();
      }
    }
  }, [applyGrantedLocationState, mapCoords, refreshDeviceCoordsIfNeeded]);

  const openLocationPopup = useCallback(() => {
    setShowManagePopup(false);
    setShowChangeLocationSheet(false);
    setLocationLoading(false);
    setShowLocationPopup(true);
  }, []);

  const closeLocationPopups = useCallback(() => {
    setShowLocationPopup(false);
    setShowManagePopup(false);
    setLocationLoading(false);
  }, []);

  const openCustomLocationSheet = useCallback(() => {
    setShowLocationPopup(false);
    setShowManagePopup(false);
    setLocationLoading(false);
    setShowChangeLocationSheet(true);
  }, []);

  const closeChangeLocationSheet = useCallback(() => {
    setShowChangeLocationSheet(false);
  }, []);

  const applyCustomLocation = useCallback((location: IdentificationLocation) => {
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setLocalCoords({ lat, lng });
    }
    const address = location.address?.trim();
    if (address) {
      setAppliedCustomLocationAddress(address);
    }
    setHasCustomLocationOverride(true);
    setShowChangeLocationSheet(false);
    setShowLocationPopup(false);
    setShowManagePopup(false);
  }, []);

  const handleAllowLocation = useCallback(async () => {
    if (locationLoading) return;

    const entry = await getLocationPermissionEntryAction();
    if (entry === "granted") {
      closeLocationPopups();
      await handlePermissionGranted();
      return;
    }
    if (entry === "manage_settings") {
      setShowLocationPopup(false);
      setShowManagePopup(true);
      return;
    }

    setLocationLoading(true);
    setShowLocationPopup(false);

    try {
      const outcome = await completeCustomThenNativeFlow();

      if (outcome.granted) {
        closeLocationPopups();
        await handlePermissionGranted();
        return;
      }

      const settled = await waitForLocationPermissionGranted();
      if (settled) {
        closeLocationPopups();
        await handlePermissionGranted();
        return;
      }

      if (outcome.showManageSettings) {
        setShowManagePopup(true);
      }
    } finally {
      setLocationLoading(false);
    }
  }, [closeLocationPopups, handlePermissionGranted, locationLoading]);

  const handleOpenSettings = useCallback(() => {
    void openDeviceSettings();
    closeLocationPopups();
  }, [closeLocationPopups]);

  return {
    showLocationPopup,
    showManagePopup,
    showChangeLocationSheet,
    locationLoading,
    closeLocationPopups,
    openCustomLocationSheet,
    closeChangeLocationSheet,
    applyCustomLocation,
    handleAllowLocation,
    handleOpenSettings,
    openLocationPopup,
    hasSpecimenGps,
    displayCoords,
    showMap,
    showMapLoading,
    isCountryBasedMap,
    sectionTitle,
    appliedCustomLocationAddress,
  };
}

export type CustomLocationSectionFlow = ReturnType<
  typeof useCustomLocationSectionFlow
>;

export { useCustomLocationSectionFlow };

function CustomLocationSection({
  flow,
  customLocation,
  countryMapLoading,
  textPrimary,
  textSecondary,
}: {
  flow: CustomLocationSectionFlow;
  customLocation?: string;
  countryMapLoading?: boolean;
  textPrimary: string;
  textSecondary: string;
}) {
  const {
    hasSpecimenGps,
    displayCoords,
    showMap,
    showMapLoading,
    isCountryBasedMap,
    sectionTitle,
    openLocationPopup,
    appliedCustomLocationAddress,
  } = flow;

  const locationLabel =
    appliedCustomLocationAddress?.trim() || customLocation?.trim() || "";

  return (
    <View style={styles.locationBlock}>
      {!hasSpecimenGps && locationLabel ? (
        <Text style={[styles.locationText, { color: textSecondary }]}>
          {locationLabel}
        </Text>
      ) : null}
      <Text style={[styles.sectionTitlePlain, { color: textPrimary }]}>
        {sectionTitle}
      </Text>
      {countryMapLoading || showMapLoading ? (
        <View style={styles.mapLoading}>
          <MaterialIcons name="location-on" size={40} color={textSecondary} />
          <Text style={{ color: textSecondary, marginTop: 8 }}>
            Loading location…
          </Text>
        </View>
      ) : showMap ? (
        <View style={styles.mapWrap}>
          <MapPreview
            latitude={displayCoords!.lat}
            longitude={displayCoords!.lng}
            hasLocationPermission
            isUserPlant={false}
            zoom={isCountryBasedMap ? COUNTRY_MAP_ZOOM_LEVEL : undefined}
            singleMarkerOnly={isCountryBasedMap}
          />
        </View>
      ) : (
        <LocationLockedPrompt
          onEnable={openLocationPopup}
          textPrimary={textPrimary}
        />
      )}
    </View>
  );
}

function PremiumLockedSection({
  locked,
  heading,
  children,
  onGetPremium,
  isDark,
  style,
}: {
  locked: boolean;
  heading?: React.ReactNode;
  children: React.ReactNode;
  onGetPremium: () => void;
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {heading}
      <View
        style={[
          styles.premiumContentWrap,
          locked && styles.premiumContentLocked,
        ]}
      >
        {children}
        {locked ? (
          <>
            <BlurOverlay
              variant="premiumGate"
              pointerEvents="none"
              style={StyleSheet.absoluteFillObject}
            />
            {!isDark ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.premiumGateBorder]}
              />
            ) : null}
            <View style={styles.premiumCardWrap} pointerEvents="box-none">
              <SubscribeToPremiumCard isDark={isDark} onPress={onGetPremium} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function SimilarSpeciesCards({
  lookAlikes,
  onLookAlikePress,
  textPrimary,
  textSecondary,
  cardBackground,
  cardBorderColor,
}: {
  lookAlikes: NonNullable<
    ReturnType<typeof normalizeMushroomDetail>["lookAlikes"]
  >;
  onLookAlikePress?: (item: Record<string, unknown>) => void;
  textPrimary: string;
  textSecondary: string;
  cardBackground: string;
  cardBorderColor: string;
}) {
  if (!lookAlikes.length) return null;

  return (
    <View style={styles.similarSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.similarScroll}
      >
        {lookAlikes.map((item, index) => {
          const uri = item.imageUrls?.[0];
          const score = formatSimilarityAccuracy(item.similarityScore);
          return (
            <TouchableOpacity
              key={item.speciesId ?? item.scientificName ?? index}
              style={[
                styles.similarCard,
                {
                  backgroundColor: cardBackground,
                  borderColor: cardBorderColor,
                },
              ]}
              onPress={() =>
                onLookAlikePress?.(item as unknown as Record<string, unknown>)
              }
              disabled={!onLookAlikePress}
              activeOpacity={0.9}
            >
              <View style={styles.similarCardBody}>
                <Text
                  style={[styles.similarCardName, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {getDisplayName(item) || item.scientificName}
                </Text>
                {score ? (
                  <Text
                    style={[styles.similarCardScore, { color: textSecondary }]}
                  >
                    {score} Accuracy
                  </Text>
                ) : null}
                {item.scientificName ? (
                  <Text
                    style={[
                      styles.similarCardScientific,
                      { color: textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.scientificName}
                  </Text>
                ) : null}
              </View>
              {uri ? (
                <CachedRemoteImage
                  uri={uri}
                  style={styles.similarCardImage}
                  borderRadius={Radius.sm}
                  resizeMode="cover"
                />
              ) : (
                <AppImage
                  source={Images.card_image_placeholder}
                  style={styles.similarCardImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const MushroomDetailsScrollSections: React.FC<Props> = ({
  mushroomData,
  detailedDescription,
  isDark,
  isPremium,
  isMushroomOfTheDay = false,
  customLocation,
  countryMapLoading,
  onNavigatePremium,
  onLookAlikePress,
  onSeeAllSimilarPress,
  onSectionLayout,
  locationFlow,
  textPrimary,
  textSecondary,
  surfacePrimary,
  surfaceSecondary,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<{ BirdSounds: BirdSoundsScreenParams }>>();
  const mushroom = useMemo(
    () =>
      normalizeMushroomDetail(
        mushroomData as unknown as Record<string, unknown>
      ),
    [mushroomData]
  );
  const classification = mushroom.scientificClassification;
  const lookAlikes = mushroom.lookAlikes ?? [];
  const locked = !isPremium && !isMushroomOfTheDay;
  const birdStrings = COLLECTION_STRINGS.birdDetails;
  const soundUrls = mushroomData.soundUrls ?? [];
  const userCapturedSounds = (
    mushroomData as MushroomDetail & { userCapturedSounds?: string[] }
  ).userCapturedSounds;
  const specimenTimestamps = mushroomData as MushroomDetail & {
    createdAt?: string;
    updatedAt?: string;
  };
  const hasSounds = soundUrls.length > 0 || (userCapturedSounds?.length ?? 0) > 0;
  const totalSoundCount =
    buildBirdSoundListItems({
      soundUrls,
      userCapturedSounds,
    }).length;

  const openBirdSounds = useCallback(() => {
    navigation.navigate("BirdSounds", {
      soundUrls,
      userCapturedSounds,
      customLocation: mushroomData.customLocation,
      createdAt: specimenTimestamps.createdAt,
      updatedAt: specimenTimestamps.updatedAt,
    });
  }, [
    navigation,
    soundUrls,
    userCapturedSounds,
    mushroomData.customLocation,
    specimenTimestamps.createdAt,
    specimenTimestamps.updatedAt,
  ]);
  const lastSectionPad = {
    paddingBottom: 20 + Math.max(insets.bottom, 16),
  };
  const hasRange = Boolean(
    mushroomData.rangeDetails &&
      (mushroomData.rangeDetails.yearRound ||
        mushroomData.rangeDetails.breeding ||
        mushroomData.rangeDetails.migration ||
        mushroomData.rangeDetails.nonBreeding)
  );

  const wikipediaUrl =
    mushroomData.wikipediaUrl ||
    mushroom.wikipediaLink ||
    mushroom.wikipediaUrl;

  const registerLayout = (sectionId: MushroomScrollSectionId) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      onSectionLayout?.(sectionId, e.nativeEvent.layout.y);
    },
  });

  return (
    <View style={styles.root}>
      <View
          {...registerLayout("sounds")}
          style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
        >
          <View style={styles.soundsHeader}>
            <Text
              style={[
                styles.sectionTitlePlain,
                styles.sectionTitlePlainCompact,
                { color: textPrimary },
              ]}
            >
              {hasSounds
                ? `${birdStrings.sections.sounds} (${totalSoundCount})`
                : birdStrings.sections.sounds}
            </Text>
            {hasSounds && totalSoundCount > BIRD_SOUND_PREVIEW_COUNT ? (
              <TouchableOpacity
                onPress={openBirdSounds}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.soundsViewAll, { color: textPrimary }]}>
                  {birdStrings.sounds.viewAll}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {hasSounds ? (
            <BirdSoundsSection
              soundUrls={soundUrls}
              userCapturedSounds={userCapturedSounds}
              customLocation={mushroomData.customLocation}
              createdAt={specimenTimestamps.createdAt}
              updatedAt={specimenTimestamps.updatedAt}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              surfaceSecondary={surfaceSecondary}
            />
          ) : null}
          <BirdRecordSoundCtaNav
            textPrimary={textPrimary}
            surfaceSecondary={surfaceSecondary}
          />
        </View>

      <View
        {...registerLayout("overview")}
        style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
      >
        <Text style={[styles.sectionTitlePlain, { color: textPrimary }]}>
          Overview
        </Text>
        <View
          style={[
            styles.descriptionCard,
            { backgroundColor: surfaceSecondary },
          ]}
        >
          {detailedDescription ? (
            <Text style={[styles.descriptionText, { color: textSecondary }]}>
              {detailedDescription}
            </Text>
          ) : null}
          {wikipediaUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(wikipediaUrl)}>
              <Text style={styles.wikipediaLink}>Wikipedia</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {classification ? (
          <TaxonomyRows
            classification={classification}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            isDark={isDark}
          />
        ) : null}

        <CustomLocationSection
          flow={locationFlow}
          customLocation={customLocation}
          countryMapLoading={countryMapLoading}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <BirdOverviewExtras
          bird={mushroomData}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          isDark={isDark}
        />
      </View>


      {lookAlikes.length > 0 ? (
        <View
          {...registerLayout("similar")}
          style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
        >
          <PremiumLockedSection
            locked={locked}
            onGetPremium={onNavigatePremium}
            isDark={isDark}
            heading={
              <View style={styles.similarHeaderWrap}>
                <SectionTopicHeading
                  title={birdStrings.sections.similarBirds}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
                {onSeeAllSimilarPress && !locked ? (
                  <TouchableOpacity
                    onPress={onSeeAllSimilarPress}
                    activeOpacity={0.8}
                    style={styles.similarSeeAllWrap}
                  >
                    <Text style={styles.similarSeeAll}>See all</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          >
            <SimilarSpeciesCards
              lookAlikes={lookAlikes}
              onLookAlikePress={onLookAlikePress}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              cardBackground={isDark ? surfacePrimary : "#FFFFFF"}
              cardBorderColor={isDark ? "#333333" : "#E7E7E7"}
            />
          </PremiumLockedSection>
        </View>
      ) : null}

      <View
            {...registerLayout("morphology")}
            style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.characteristics}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdCharacteristicsSection
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
            </PremiumLockedSection>
          </View>

          <View
            {...registerLayout("behavior")}
            style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.behavior}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdBehaviorSection
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
            </PremiumLockedSection>
          </View>

          <View
            {...registerLayout("habitat")}
            style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.habitat}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdHabitatRows
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
            </PremiumLockedSection>
          </View>

          <View
            {...registerLayout("feeding")}
            style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.feeding}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdFeedingDietSection
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
            </PremiumLockedSection>
          </View>

          <View
            {...registerLayout("breeding")}
            style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.breeding}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdBreedingSection
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
            </PremiumLockedSection>
          </View>

          <View
            {...registerLayout("range")}
            style={[
              styles.sectionCard,
              styles.sectionCardLast,
              { backgroundColor: surfacePrimary, ...lastSectionPad },
            ]}
          >
            <PremiumLockedSection
              locked={locked}
              onGetPremium={onNavigatePremium}
              isDark={isDark}
              heading={
                <SectionTopicHeading
                  title={birdStrings.sections.migration}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  useDividerStyle={locked}
                />
              }
            >
              <BirdMigrationNotes
                bird={mushroomData}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
              <BirdGeographicRangeMap
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                surfaceSecondary={surfaceSecondary}
                locked={locked}
                rangeDetails={mushroomData.rangeDetails}
                customLocation={mushroomData.customLocation}
              />
              {hasRange ? (
                <BirdRangeMapSection
                  rangeDetails={mushroomData.rangeDetails}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                />
              ) : null}
            </PremiumLockedSection>
          </View>

    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 12,
  },
  sectionCard: {
    paddingHorizontal: LAYOUT_MARGIN,
    paddingVertical: 20,
    width: "100%",
  },
  sectionCardLast: {
    marginBottom: 0,
  },
  sectionDividerHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  sectionDividerHeadingCompact: {
    marginBottom: 0,
    flex: 1,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    minWidth: 1,
  },
  sectionDividerLabel: {
    flexShrink: 0,
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: "700",
    lineHeight: 20,
    color: FIGMA_TOKENS.text.tertiary,
    textAlign: "center",
  },
  sectionTitlePlain: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitlePlainCompact: {
    flex: 1,
    marginBottom: 0,
  },
  descriptionCard: {
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  descriptionText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  wikipediaLink: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: APP_COLORS.linkBlue,
    textDecorationLine: "underline",
  },
  taxonomyBlock: {
    marginTop: 20,
    gap: 12,
  },
  taxonomyHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  infoRowLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    flex: 0,
    maxWidth: 120,
  },
  infoRowValue: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    textAlign: "right",
  },
  locationBlock: {
    marginTop: 20,
    gap: 12,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  mapWrap: {
    minHeight: 200,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  locationLockedCard: {
    minHeight: 220,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  locationLockedBackground: {
    minHeight: 220,
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationLockedBackgroundImage: {
    borderRadius: Radius.md,
  },
  locationLockedContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    zIndex: 1,
  },
  locationLockedTop: {
    alignItems: "center",
    gap: 16,
  },
  locationLockedIcon: {
    width: 56,
    height: 56,
  },
  locationLockedMessage: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  locationLockedButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    zIndex: 2,
  },
  locationLockedButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#111111",
  },
  mapLoading: {
    minHeight: 200,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
  },
  similarSection: {
    gap: 8,
    width: "100%",
  },
  similarHeaderWrap: {
    width: "100%",
  },
  similarSeeAllWrap: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 8,
  },
  similarSeeAll: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.brandPrimaryDark,
    textDecorationLine: "underline",
  },
  soundsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    width: "100%",
  },
  soundsViewAll: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  similarScroll: {
    gap: 20,
    paddingTop: 4,
  },
  similarCard: {
    width: 268,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingRight: 12,
  },
  similarCardBody: {
    flex: 1,
    padding: 12,
    gap: 4,
    minWidth: 0,
  },
  similarCardName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  similarCardScore: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  similarCardScientific: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  similarCardImage: {
    width: 76,
    height: 76,
    borderRadius: Radius.sm,
  },
  premiumContentWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: Radius.sm,
  },
  premiumContentLocked: {
    minHeight: 260,
  },
  premiumGateBorder: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    borderColor: APP_COLORS.blurOverlayBorder,
  },
  premiumCardWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
