/**
 * Crop a live recording before sound identification.
 * Figma 8908:90380 / 8908:90466 — fixed 9/18/27s window, drag to move.
 */

import React, { useMemo, useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, NavBackIcon, Toggle } from "../../../atoms";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourMushroomBackground";
import { SoundSpectrogramView } from "../components/SoundSpectrogramView";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { CameraStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FONTS } from "../../../common/typography";
import {
  SOUND_CROP_DURATIONS,
  clampSoundCropStart,
  defaultSoundCropChip,
  formatSoundClipLabel,
  formatSoundCropActionLabel,
  formatSoundStamp,
  isFullSoundCrop,
  isSoundCropChipAvailable,
  resolveSoundCropWindow,
  type SoundCropDuration,
} from "../utils/soundCrop";

type Nav = NativeStackNavigationProp<CameraStackParamList, "SoundCrop">;
type ScreenRoute = RouteProp<CameraStackParamList, "SoundCrop">;

const copy = CAMERA_STRINGS.sound;

export const SoundCropScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<Nav>();
  const { audioUri, durationSec, recordedAt } = useRoute<ScreenRoute>().params;
  const {
    location,
    locationLabel,
    permissionGranted,
    handleToggleOn,
    openCustomLocationSheet,
  } = useLocationToggleFlow();
  const locationOn = shouldShowLocationBannerAsGranted(
    permissionGranted,
    location
  );

  const [chip, setChip] = useState<SoundCropDuration | null>(() =>
    defaultSoundCropChip(durationSec)
  );
  const [startSec, setStartSec] = useState(0);

  const windowSec = useMemo(() => {
    if (!chip) return durationSec;
    return resolveSoundCropWindow(chip, durationSec, startSec).windowSec;
  }, [chip, durationSec, startSec]);

  const clampedStart = useMemo(
    () => clampSoundCropStart(startSec, windowSec, durationSec),
    [startSec, windowSec, durationSec]
  );

  const startSecRef = useRef(clampedStart);
  const windowSecRef = useRef(windowSec);
  startSecRef.current = clampedStart;
  windowSecRef.current = windowSec;
  const trackWidthRef = useRef(1);
  const dragOriginRef = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragOriginRef.current = startSecRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const width = Math.max(trackWidthRef.current, 1);
        const deltaSec = (gesture.dx / width) * durationSec;
        setStartSec(
          clampSoundCropStart(
            dragOriginRef.current + deltaSec,
            windowSecRef.current,
            durationSec
          )
        );
      },
    })
  ).current;

  const selectChip = (next: SoundCropDuration) => {
    if (!isSoundCropChipAvailable(next, durationSec)) return;
    setChip(next);
    setStartSec(0);
  };

  const goIdentify = () => {
    const usingFull = !chip || isFullSoundCrop(windowSec, durationSec);
    navigation.navigate("DiagnosisLoading", {
      identifyMode: "sound",
      audioUri,
      audioDurationSec: usingFull ? durationSec : windowSec,
      recordedAt,
      cropStartSec: usingFull ? undefined : clampedStart,
      cropDurationSec: usingFull ? undefined : windowSec,
    });
  };

  const stamp = formatSoundStamp(new Date(recordedAt));
  const place =
    locationOn && locationLabel?.trim()
      ? locationLabel.trim()
      : copy.noLocation;
  const startRatio = durationSec > 0 ? clampedStart / durationSec : 0;
  const endRatio =
    durationSec > 0 ? (clampedStart + windowSec) / durationSec : 1;
  const actionLabel = formatSoundCropActionLabel(
    windowSec,
    durationSec,
    copy.useFullRecording,
    copy.useCroppedRecording
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <FindYourBirdBackground />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <NavBackIcon color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {copy.recording}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {copy.cropBody}
          </Text>

          <View style={styles.chips}>
            {SOUND_CROP_DURATIONS.map((item) => {
              const available = isSoundCropChipAvailable(item, durationSec);
              const selected = chip === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => selectChip(item)}
                  disabled={!available}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected
                        ? colors.primaryCTA
                        : colors.border0,
                      backgroundColor: selected
                        ? colors.primaryCTA
                        : "transparent",
                      opacity: available ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      {
                        color: selected
                          ? colors.onPrimary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {item}s
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            onLayout={(e) => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...pan.panHandlers}
          >
            <SoundSpectrogramView
              windowStartRatio={startRatio}
              windowEndRatio={endRatio}
            />
          </View>
          <View style={styles.stamps}>
            <Text style={[styles.stamp, { color: colors.primaryCTA }]}>
              {formatSoundClipLabel(0)}
            </Text>
            <Text style={[styles.stamp, { color: colors.primaryCTA }]}>
              {formatSoundClipLabel(durationSec)}
            </Text>
          </View>

          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {stamp}  •  {place}
          </Text>

          {!locationOn ? (
            <View
              style={[
                styles.locationCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Text
                style={[styles.locationCopy, { color: colors.textPrimary }]}
              >
                {copy.enableLocation}
              </Text>
              <Toggle
                value={false}
                onToggle={(on) => {
                  if (on) handleToggleOn();
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.locationCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => openCustomLocationSheet()}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.locationCopy, { color: colors.textPrimary }]}
              >
                {copy.locationSpottedPrefix}
                <Text style={styles.locationLink}>{place}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primaryCTA }]}
            onPress={goIdentify}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>
              {copy.identifyBird}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.subCta, { color: colors.textSecondary }]}>
            {actionLabel}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    minHeight: 52,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    textAlign: "center",
  },
  chips: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  stamps: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stamp: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  locationCard: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationCopy: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  locationLink: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  cta: {
    width: "100%",
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  subCta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
