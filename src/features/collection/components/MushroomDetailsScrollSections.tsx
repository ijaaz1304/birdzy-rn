/**
 * Mushroom details scroll sections — Figma Mushroom Details (8204:87366).
 * Free: Overview → Safety Guide → Similar species. Premium sections below are blurred.
 */

import { AppImage, AppImageBackground, CachedRemoteImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Linking, StyleProp, ViewStyle, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { InfoRow } from "../../../atoms";
import { MapPreview } from "../../../molecules";
import { BlurOverlay } from "../../../components/BlurOverlay";
import { MushroomSafetyBadge } from "../../../components/mushroom/MushroomSafetyBadge";
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
import {
  EDIBILITY_LABELS,
  MUSHROOM_SAFETY_DISCLAIMER,
  PSYCHOACTIVE_LABELS,
  SAFETY_AI_REFERENCE_DISCLAIMER,
  TOXICITY_SEVERITY_LABELS,
} from "../../../constants/mushroomOptions";
import {
  formatDistributionHotspotsDisplay,
  formatFruitingSeasonDisplay,
  formatMushroomList,
  normalizeMushroomDetail,
} from "../../../utils/mushroomApiMappers";
import { isBirdRecord } from "../../../utils/birdApiMappers";
import {
  BirdSoundsSection,
  BirdRangeMapSection,
  BirdGeographicRangeMap,
  BirdPhysicalTraitsRows,
  BirdHabitatRows,
  BirdRecordSoundCtaNav,
} from "./BirdDetailSections";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import type { MushroomDetail } from "../../../types/mushrooms.types";
import type { LookAlike } from "../../../services/api/features/core.api.types";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
import { FIGMA_TOKENS } from "../../../design-system/colors/figmaTokens";

const LAYOUT_MARGIN = 20;
const SECTION_DIVIDER_BORDER_LIGHT = "#E7E7E7";
const SECTION_DIVIDER_BORDER_DARK = "#333333";
const ROW_DIVIDER = { height: 1, backgroundColor: "#E7E7E7" };

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
  | "safety"
  | "similar"
  | "morphology"
  | "habitat";

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
  // onSafetyGuidePress?: () => void;
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

function MorphologyRows({
  mushroom,
  textPrimary,
  textSecondary,
}: {
  mushroom: ReturnType<typeof normalizeMushroomDetail>;
  textPrimary: string;
  textSecondary: string;
}) {
  const rows = [
    { label: "Cap Shape", value: mushroom.capShape },
    { label: "Cap Surface", value: formatMushroomList(mushroom.capSurface) },
    { label: "Cap Color", value: mushroom.capColor },
    { label: "Underside Type", value: mushroom.undersideType },
    { label: "Stem Presence", value: mushroom.stemPresence },
    { label: "Stem Surface", value: formatMushroomList(mushroom.stemSurface) },
    { label: "Ring Present", value: mushroom.ringPresent },
    { label: "Volva Present", value: mushroom.volvaPresent },
    { label: "Stem Height", value: mushroom.stemHeightRange },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  return (
    <View style={styles.rowsBlock}>
      {rows.map((row, index) => (
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
          {index < rows.length - 1 ? <View style={ROW_DIVIDER} /> : null}
        </View>
      ))}
    </View>
  );
}

function SafetyRows({
  mushroom,
  textPrimary,
  textSecondary,
}: {
  mushroom: ReturnType<typeof normalizeMushroomDetail>;
  textPrimary: string;
  textSecondary: string;
}) {
  const rows = [
    {
      label: "Edibility",
      value: mushroom.edibility
        ? EDIBILITY_LABELS[mushroom.edibility] ?? mushroom.edibility
        : undefined,
    },
    {
      label: "Toxicity Severity",
      value: mushroom.toxicitySeverity
        ? TOXICITY_SEVERITY_LABELS[mushroom.toxicitySeverity] ??
          mushroom.toxicitySeverity
        : undefined,
    },
    {
      label: "Psychoactive",
      value: mushroom.psychoactive
        ? PSYCHOACTIVE_LABELS[mushroom.psychoactive] ?? mushroom.psychoactive
        : undefined,
    },
    { label: "Symptoms if any", value: mushroom.symptoms },
    { label: "Size Range", value: mushroom.capDiameterRange },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  return (
    <View style={styles.rowsBlock}>
      {rows.map((row, index) => (
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
          {index < rows.length - 1 ? <View style={ROW_DIVIDER} /> : null}
        </View>
      ))}
    </View>
  );
}

function SafetyReferenceBanner({
  isDark,
  textPrimary,
}: {
  isDark: boolean;
  textPrimary: string;
}) {
  return (
    <View
      style={[
        styles.safetyReferenceBanner,
        isDark && styles.safetyReferenceBannerDark,
      ]}
    >
      <AppImage
        source={Images.informationCircle}
        style={styles.safetyReferenceIcon}
        resizeMode="contain"
      />
      <Text style={[styles.safetyReferenceText, { color: textPrimary }]}>
        {SAFETY_AI_REFERENCE_DISCLAIMER}
      </Text>
    </View>
  );
}

function HabitatRows({
  mushroom,
  textPrimary,
  textSecondary,
}: {
  mushroom: ReturnType<typeof normalizeMushroomDetail>;
  textPrimary: string;
  textSecondary: string;
}) {
  const rows = [
    {
      label: "Habitat Type",
      value: formatMushroomList(mushroom.habitatType),
    },
    { label: "Growth Pattern", value: mushroom.growthPattern },
    {
      label: "Geographic Distribution",
      value: formatMushroomList(
        mushroom.geographicDistribution?.length
          ? mushroom.geographicDistribution
          : mushroom.commonlyFoundIn
      ),
    },
    {
      label: "Fruiting Season",
      value: formatFruitingSeasonDisplay(mushroom.fruitingSeason),
    },
    {
      label: "Geographic Distribution Hotspots",
      value: formatDistributionHotspotsDisplay(mushroom.distributionHotspots),
    },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  return (
    <View style={styles.rowsBlock}>
      {rows.map((row, index) => (
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
          {index < rows.length - 1 ? <View style={ROW_DIVIDER} /> : null}
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
          const lookAlike = item as LookAlike & {
            edibility?: string | null;
            toxicitySeverity?: string | null;
            psychoactive?: string | null;
          };
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
                <MushroomSafetyBadge
                  edibility={lookAlike.edibility}
                  toxicitySeverity={lookAlike.toxicitySeverity}
                  psychoactive={lookAlike.psychoactive}
                  compact
                />
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
  // onSafetyGuidePress,
  onSectionLayout,
  locationFlow,
  textPrimary,
  textSecondary,
  surfacePrimary,
  surfaceSecondary,
}) => {
  const insets = useSafeAreaInsets();
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
  const isBird = isBirdRecord(
    mushroomData as unknown as Record<string, unknown>
  );
  const birdStrings = COLLECTION_STRINGS.birdDetails;
  const soundUrls = mushroomData.soundUrls ?? [];
  const showBirdSoundsSection = isBird;
  const hasSounds = soundUrls.length > 0;
  const hasRange =
    isBird &&
    Boolean(
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
      {/* Overview */}
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
      </View>

      {showBirdSoundsSection ? (
        <View
          {...registerLayout("sounds")}
          style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
        >
          <PremiumLockedSection
            locked={locked}
            onGetPremium={onNavigatePremium}
            isDark={isDark}
            heading={
              <Text style={[styles.sectionTitlePlain, { color: textPrimary }]}>
                {birdStrings.sections.sounds}
              </Text>
            }
          >
            {hasSounds ? (
              <BirdSoundsSection
                soundUrls={soundUrls}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                surfaceSecondary={surfaceSecondary}
              />
            ) : null}
            <BirdRecordSoundCtaNav
              textPrimary={textPrimary}
              surfaceSecondary={surfaceSecondary}
            />
          </PremiumLockedSection>
        </View>
      ) : null}

      {isBird ? (
        <View
          {...registerLayout("range")}
          style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
        >
          <PremiumLockedSection
            locked={locked}
            onGetPremium={onNavigatePremium}
            isDark={isDark}
            heading={
              <Text style={[styles.sectionTitlePlain, { color: textPrimary }]}>
                {birdStrings.sections.range}
              </Text>
            }
          >
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
      ) : null}

      {/* Mushroom Safety Guide banner — temporarily hidden
      <View style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}>
        <View style={styles.safetyGuideBanner}>
          <AppImage
            source={Images.aiChatCenterImage}
            style={styles.safetyGuideImage}
            resizeMode="contain"
          />
          <View style={styles.safetyGuideCopy}>
            <Text style={[styles.safetyGuideTitle, { color: textPrimary }]}>
              Mushroom Safety Guide
            </Text>
            <Text
              style={[styles.safetyGuideSubtitle, { color: textSecondary }]}
            >
              Learn how AI identification works, understand look-alike risks,
              and follow safe foraging practices.
            </Text>
            <TouchableOpacity
              onPress={onSafetyGuidePress}
              style={styles.safetyGuideButton}
              activeOpacity={0.85}
            >
              <Text style={styles.safetyGuideButtonText}>
                View Safety Guide
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      */}

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
                  title={isBird ? birdStrings.sections.similarBirds : "Similar species"}
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

      {!isBird ? (
      <View
        {...registerLayout("safety")}
        style={[styles.sectionCard, { backgroundColor: surfacePrimary }]}
      >
        <PremiumLockedSection
          locked={locked}
          onGetPremium={onNavigatePremium}
          isDark={isDark}
          heading={
            <SectionTopicHeading
              title="Safety"
              isDark={isDark}
              textPrimary={textPrimary}
              useDividerStyle={locked}
            />
          }
        >
          <SafetyRows
            mushroom={mushroom}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
          <SafetyReferenceBanner isDark={isDark} textPrimary={textPrimary} />
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
              title={
                isBird
                  ? birdStrings.sections.identification
                  : "Physical Traits"
              }
              isDark={isDark}
              textPrimary={textPrimary}
              useDividerStyle={locked}
            />
          }
        >
          {isBird ? (
            <BirdPhysicalTraitsRows
              bird={mushroomData}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          ) : (
            <MorphologyRows
              mushroom={mushroom}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
        </PremiumLockedSection>
      </View>

      <View
        {...registerLayout("habitat")}
        style={[
          styles.sectionCard,
          styles.sectionCardLast,
          {
            backgroundColor: surfacePrimary,
            paddingBottom: 20 + Math.max(insets.bottom, 16),
          },
        ]}
      >
        <PremiumLockedSection
          locked={locked}
          onGetPremium={onNavigatePremium}
          isDark={isDark}
          heading={
            <SectionTopicHeading
              title={
                isBird
                  ? birdStrings.sections.habitat
                  : "Habitat and distribution"
              }
              isDark={isDark}
              textPrimary={textPrimary}
              useDividerStyle={locked}
            />
          }
        >
          {isBird ? (
            <BirdHabitatRows
              bird={mushroomData}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          ) : (
            <HabitatRows
              mushroom={mushroom}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
        </PremiumLockedSection>
        {!locked && !isBird ? (
          <Text style={[styles.disclaimer, { color: textSecondary }]}>
            {MUSHROOM_SAFETY_DISCLAIMER}
          </Text>
        ) : null}
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
  safetyGuideBanner: {
    backgroundColor: "#E9EFD2",
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    minHeight: 140,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  safetyGuideImage: {
    position: "absolute",
    right: -8,
    top: 8,
    width: 140,
    height: 140,
    opacity: 0.9,
  },
  safetyGuideCopy: {
    flex: 1,
    maxWidth: 220,
    gap: 16,
    zIndex: 1,
  },
  safetyGuideTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  safetyGuideSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  safetyGuideButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  safetyGuideButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#111111",
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
  rowsBlock: {
    gap: 12,
    width: "100%",
  },
  safetyReferenceBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: "#FFF9F0",
  },
  safetyReferenceBannerDark: {
    backgroundColor: "#2A2418",
  },
  safetyReferenceIcon: {
    width: 20,
    height: 20,
    marginTop: 2,
  },
  safetyReferenceText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
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
  disclaimer: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 16,
  },
});
