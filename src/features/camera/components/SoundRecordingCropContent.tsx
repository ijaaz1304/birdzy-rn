import { useIsFocused } from "@react-navigation/native";
import { useFreeScanPromptSurface } from "../../../hooks/useFreeScanPromptSurface";
/**
 * Recorded-sound crop + identify UI (shared by SoundIdentify crop phase and SoundCrop route).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, NavBackIcon, Toggle } from "../../../atoms";
import { HiddenRemoteImagePrefetcher } from "../../../components/AppImage/HiddenRemoteImagePrefetcher";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import { FONTS } from "../../../common/typography";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { useTheme } from "../../../hooks/useTheme";
import { CameraStackParamList } from "../../../navigation/types";
import {
  NoBirdDetectedModal,
  NoiseTooHighModal,
} from "../components/BirdSoundErrorModals";
import { RecordedSoundPreview } from "../components/RecordedSoundPreview";
// import { waveformPeaksFromColumns } from "../utils/waveformPeaks";
import { meetsMinRecordingDuration } from "../constants/soundRecording.constants";
import { useSoundIdentificationFlow } from "../hooks/useSoundIdentificationFlow";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { useSoundRecordingSpectrogramStore } from "../soundRecordingSpectrogram.store";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { soundPerfRender } from "../utils/soundPerf";
import {
  SOUND_CROP_DURATIONS,
  clampSoundCropStart,
  defaultSoundCropChip,
  formatSoundCropActionLabel,
  formatSoundStamp,
  isFullSoundCrop,
  isSoundCropChipAvailable,
  resolveSoundCropWindow,
  type SoundCropDuration,
} from "../utils/soundCrop";

export type SoundCropSession = {
  audioUri: string;
  durationSec: number;
  recordedAt: number;
};

type Nav = NativeStackNavigationProp<CameraStackParamList>;

type Props = {
  session: SoundCropSession;
  navigation: Nav;
  onBack: () => void;
  onRetrySound?: () => void;
};

const copy = CAMERA_STRINGS.sound;

export function SoundRecordingCropContent({
  session,
  navigation,
  onBack,
  onRetrySound,
}: Props) {
  soundPerfRender("SoundRecordingCropContent");
  const { audioUri, durationSec, recordedAt } = session;
  useFreeScanPromptSurface(useIsFocused());
  const theme = useTheme();
  const colors = theme.colors;
  const spectrogramColumns = useSoundRecordingSpectrogramStore(
    (s) => s.columns
  );

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

  const {
    isAnalyzing,
    loadingPhase,
    soundError,
    showUpgradeSheet,
    thumbPrefetchUris,
    thumbPrefetchDecodeWidth,
    thumbPrefetchDecodeHeight,
    handleThumbPrefetchSettled,
    startIdentification,
    retryFromStart,
    closeUpgradeSheet,
    openUpgrade,
  } = useSoundIdentificationFlow(navigation, { onRetrySound });

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

  const selectChip = (next: SoundCropDuration) => {
    if (isAnalyzing || !isSoundCropChipAvailable(next, durationSec)) return;
    setChip(next);
    setStartSec(0);
  };

  const canIdentify = meetsMinRecordingDuration(durationSec);

  const goIdentify = () => {
    if (!canIdentify || isAnalyzing) return;
    void soundRecordingService.stopPlayback();
    setPreviewing(false);
    const usingFull = !chip || isFullSoundCrop(windowSec, durationSec);
    void startIdentification({
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
  // const peaks = useMemo(
  //   () => waveformPeaksFromColumns(spectrogramColumns),
  //   [spectrogramColumns]
  // );
  const [previewing, setPreviewing] = useState(false);
  const selectionKey = `${audioUri}:${clampedStart.toFixed(
    2
  )}:${windowSec.toFixed(2)}`;
  const selectionKeyRef = useRef(selectionKey);

  useEffect(() => {
    return () => {
      void soundRecordingService.stopPlayback();
    };
  }, []);

  useEffect(() => {
    if (selectionKeyRef.current === selectionKey) return;
    selectionKeyRef.current = selectionKey;
    setPreviewing(false);
    void soundRecordingService.stopPlayback();
  }, [selectionKey]);

  const togglePreview = () => {
    if (isAnalyzing) return;
    if (previewing) {
      setPreviewing(false);
      void soundRecordingService.stopPlayback();
      return;
    }
    const endSec = Math.min(durationSec, clampedStart + windowSec);
    setPreviewing(true);
    void soundRecordingService
      .play(audioUri, {
        startSec: clampedStart,
        endSec,
        onEnd: () => setPreviewing(false),
      })
      .catch(() => setPreviewing(false));
  };

  const actionLabel = isAnalyzing
    ? loadingPhase === "preparing"
      ? copy.preparingMatches
      : copy.analysing
    : formatSoundCropActionLabel(
        windowSec,
        durationSec,
        copy.useFullRecording,
        copy.useCroppedRecording
      );

  return (
    <>
      <HiddenRemoteImagePrefetcher
        uris={thumbPrefetchUris}
        decodeWidth={thumbPrefetchDecodeWidth}
        decodeHeight={thumbPrefetchDecodeHeight}
        onAllSettled={handleThumbPrefetchSettled}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBtn}
          hitSlop={HIT_SLOP.CLOSE}
          disabled={isAnalyzing}
        >
          <NavBackIcon color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {copy.recordedSound}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {copy.cropBody}
          </Text>
          <Text style={[styles.noPhotoNote, { color: colors.textTertiary }]}>
            {copy.noPhotoRequired}
          </Text>

          <View style={styles.chips}>
            {SOUND_CROP_DURATIONS.filter((item) =>
              isSoundCropChipAvailable(item, durationSec)
            ).map((item) => {
              const selected = chip === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => selectChip(item)}
                  disabled={isAnalyzing}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected
                        ? colors.primaryCTA
                        : colors.border0,
                      backgroundColor: selected
                        ? colors.primaryCTA
                        : "transparent",
                      opacity: isAnalyzing ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      {
                        color: selected ? colors.onPrimary : colors.textPrimary,
                      },
                    ]}
                  >
                    {item}s
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <RecordedSoundPreview
            columns={spectrogramColumns}
            durationSec={durationSec}
            windowSec={windowSec}
            selectionStartSec={clampedStart}
            isPlaying={previewing}
            disabled={isAnalyzing}
            onTogglePlay={togglePreview}
            onSelectionStartChange={setStartSec}
          />

          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {stamp} • {place}
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
              disabled={isAnalyzing}
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
          {isAnalyzing ? (
            <View style={styles.analysingRow}>
              <ActivityIndicator color={colors.primaryCTA} />
              <Text
                style={[styles.analysingText, { color: colors.textPrimary }]}
              >
                {actionLabel}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.cta,
                { backgroundColor: colors.primaryCTA },
                !canIdentify && styles.ctaDisabled,
              ]}
              onPress={goIdentify}
              disabled={!canIdentify}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>
                {copy.identifyBird}
              </Text>
            </TouchableOpacity>
          )}
          {!isAnalyzing ? (
            <Text style={[styles.subCta, { color: colors.textSecondary }]}>
              {actionLabel}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <LimitReachedBottomSheet
        visible={showUpgradeSheet}
        onClose={closeUpgradeSheet}
        onUpgrade={openUpgrade}
        limitType="soundIdentification"
      />
      <NoBirdDetectedModal
        visible={soundError === "noBird"}
        onClose={retryFromStart}
        onRetry={retryFromStart}
      />
      <NoiseTooHighModal
        visible={soundError === "noise"}
        onClose={retryFromStart}
        onRetry={retryFromStart}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    flexGrow: 1,
    flexShrink: 0,
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
  noPhotoNote: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
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
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaLabel: {
    flexShrink: 1,
    textAlign: "center",
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
  analysingRow: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  analysingText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
