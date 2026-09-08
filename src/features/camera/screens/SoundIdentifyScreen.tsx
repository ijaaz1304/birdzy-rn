/**
 * Identify by sound — entry (Figma 8890:125339) then live recording (8890:125340 / 8890:125341).
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { Images } from "../../../assets";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon, Toggle } from "../../../atoms";
import { CameraStackParamList } from "../../../navigation/types";
import { RecordingSpectrogramPanel } from "../components/RecordingSpectrogramPanel";
import { RecordingTimer } from "../components/RecordingTimer";
import { RecordingNoiseStatus } from "../components/RecordingNoiseStatus";
import { RecordingControls } from "../components/RecordingControls";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { formatSoundStamp } from "../utils/soundCrop";
import {
  checkMicrophonePermission,
  openDeviceSettings,
  requestMicrophonePermission,
  showPermissionAlert,
} from "../../../services/permissions";
import { shouldSkipMicrophonePermissionPrompt } from "../../../services/permissions/permissionPromptSkip";
import { MicrophonePermissionPopup } from "../../../molecules/Modal";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FONTS } from "../../../common/typography";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { useBirdRecording } from "../hooks/useBirdRecording";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import { formatMinRecordingLengthMessage } from "../constants/soundRecording.constants";
import { logSoundRecord, logSoundRenderCount } from "../utils/soundRecordLog";
import {
  SoundRecordingCropContent,
  type SoundCropSession,
} from "../components/SoundRecordingCropContent";
import { useSoundRecordingSpectrogramStore } from "../soundRecordingSpectrogram.store";

type Nav = NativeStackNavigationProp<CameraStackParamList>;

type ScreenPhase = "entry" | "recording" | "crop";

const copy = CAMERA_STRINGS.sound;

export const SoundIdentifyScreen: React.FC = () => {
  logSoundRenderCount("SoundIdentifyScreen");
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<Nav>();
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

  const [phase, setPhase] = useState<ScreenPhase>("entry");
  const [cropSession, setCropSession] = useState<SoundCropSession | null>(null);
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [micLoading, setMicLoading] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [recordedAt] = useState(() => Date.now());
  const spin = useRef(new Animated.Value(0)).current;

  const goToCrop = useCallback(
    (uri: string, durationSec: number, spectrogramColumns: number[][]) => {
      logSoundRecord("recording complete — crop phase", {
        durationSec,
        columnCount: spectrogramColumns.length,
        uri,
      });
      useSoundRecordingSpectrogramStore.getState().setColumns(spectrogramColumns);
      setCropSession({
        audioUri: uri,
        durationSec: Math.max(1, Math.round(durationSec)),
        recordedAt,
      });
      setPhase("crop");
    },
    [recordedAt]
  );

  const recording = useBirdRecording({
    onRecordingComplete: goToCrop,
    onPermissionDenied: () => {
      showPermissionAlert(
        "Microphone access needed",
        "Allow microphone access to record bird sounds for identification.",
        openDeviceSettings
      );
      setPhase("entry");
    },
    onError: () => {
      setPhase("entry");
    },
  });

  const tryStartRecording = useCallback(async () => {
    if (recording.busy || recording.isRecording || recording.isPaused) return;

    if (await shouldSkipMicrophonePermissionPrompt()) {
      await recording.beginRecording();
      return;
    }

    const microphone = await checkMicrophonePermission();
    if (microphone.granted) {
      await recording.beginRecording();
      return;
    }

    setMicBlocked(!!microphone.blocked);
    setShowMicPopup(true);
  }, [
    recording.beginRecording,
    recording.busy,
    recording.isPaused,
    recording.isRecording,
  ]);

  const handleEntryRecordPress = useCallback(() => {
    setPhase("recording");
  }, []);

  const handleMicPopupClose = useCallback(() => {
    setShowMicPopup(false);
    if (!recording.isRecording && !recording.isPaused) {
      setPhase("entry");
    }
  }, [recording.isPaused, recording.isRecording]);

  const handleAllowMicrophone = useCallback(() => {
    if (micBlocked) {
      void openDeviceSettings();
      return;
    }

    setMicLoading(true);
    void (async () => {
      try {
        const result = await requestMicrophonePermission();
        setMicBlocked(!!result.blocked);
        if (result.granted) {
          setShowMicPopup(false);
          await recording.beginRecording();
        }
      } finally {
        setMicLoading(false);
      }
    })();
  }, [micBlocked, recording]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (
      recording.busy ||
      recording.isRecording ||
      recording.isPaused ||
      soundIdentifyRecordingService.isSessionActive()
    ) {
      return;
    }
    void tryStartRecording();
  }, [
    phase,
    recording.busy,
    recording.isPaused,
    recording.isRecording,
    tryStartRecording,
  ]);

  useEffect(() => {
    if (phase !== "recording") return undefined;

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [phase, spin]);

  const handleBack = () => {
    if (phase === "crop") {
      useSoundRecordingSpectrogramStore.getState().clear();
      setCropSession(null);
      setPhase("entry");
      return;
    }
    void recording.cancelRecording();
    if (phase === "recording" && recording.state === "idle") {
      setPhase("entry");
      return;
    }
    navigation.goBack();
  };

  const handleCropRetry = useCallback(() => {
    useSoundRecordingSpectrogramStore.getState().clear();
    setCropSession(null);
    setPhase("entry");
  }, []);

  const stamp = formatSoundStamp(new Date(recordedAt));
  const place =
    locationOn && locationLabel?.trim()
      ? locationLabel.trim()
      : copy.noLocation;
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const minLengthCopy = formatMinRecordingLengthMessage(
    recording.minRecordingSeconds
  );

  const locationCard = !locationOn ? (
    <View
      style={[styles.locationCard, { backgroundColor: colors.surfaceSecondary }]}
    >
      <Text style={[styles.locationCopy, { color: colors.textPrimary }]}>
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
      style={[styles.locationCard, { backgroundColor: colors.surfaceSecondary }]}
      onPress={() => openCustomLocationSheet()}
      activeOpacity={0.85}
    >
      <Text style={[styles.locationCopy, { color: colors.textPrimary }]}>
        {copy.locationSpottedPrefix}
        <Text style={styles.locationLink}>{place}</Text>
      </Text>
    </TouchableOpacity>
  );

  if (phase === "entry") {
    return (
      <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
        <FindYourBirdBackground />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerBtn}
              hitSlop={HIT_SLOP.CLOSE}
            >
              <NavBackIcon color={colors.textPrimary} size={24} />
            </TouchableOpacity>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.entryBody}>
            <View style={styles.entryMiddle}>
              <AppImage
                source={Images.soundIdentifyHero}
                style={styles.hero}
                resizeMode="contain"
              />
              <View style={styles.entryCopy}>
                <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                  {copy.title}
                </Text>
                <Text
                  style={[styles.entrySubtitle, { color: colors.textSecondary }]}
                >
                  {copy.subtitle}
                </Text>
                <Text
                  style={[styles.entryNote, { color: colors.textTertiary }]}
                >
                  {copy.noPhotoRequired}
                </Text>
              </View>
              {locationCard}
            </View>

            <View style={styles.entryControls}>
              <TouchableOpacity
                onPress={handleEntryRecordPress}
                style={styles.entryRecordBtn}
                accessibilityLabel={copy.startRecording}
                activeOpacity={0.85}
              >
                <AppImage
                  source={Images.soundRecord}
                  style={styles.entryRecordImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <MicrophonePermissionPopup
          visible={showMicPopup}
          onClose={handleMicPopupClose}
          onAllowMicrophone={handleAllowMicrophone}
          loading={micLoading}
          openSettings={micBlocked}
        />
      </View>
    );
  }

  if (phase === "crop" && cropSession) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
        <FindYourBirdBackground />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <SoundRecordingCropContent
            session={cropSession}
            navigation={navigation}
            onBack={handleBack}
            onRetrySound={handleCropRetry}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <FindYourBirdBackground />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerBtn}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <NavBackIcon color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.body}>
          <View style={styles.recordingTop}>
            <View style={styles.recordingHeader}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {copy.recording}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {minLengthCopy}
              </Text>
              <RecordingTimer />
            </View>

            <RecordingSpectrogramPanel
              active={recording.spectrogramActive}
              fallback={recording.usesFallbackRecorder}
            />

            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {stamp}
              </Text>
              <View style={styles.metaDot} />
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {place}
              </Text>
            </View>

            {locationCard}
          </View>

          <RecordingNoiseStatus
            rotate={rotate}
            processing={recording.state === "processing"}
          />

          <RecordingControls
            busy={recording.busy}
            isRecording={recording.isRecording}
            isPaused={recording.isPaused}
            onStop={() => void recording.stopAndFinalize()}
            onPause={() => void recording.pauseRecording()}
            onResume={() => void recording.resumeRecording()}
          />
        </View>
      </SafeAreaView>

      {recording.state === "processing" ? (
        <View style={styles.processingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingTitle}>{copy.finalizingRecording}</Text>
          <Text style={styles.processingSubtitle}>{copy.finalizingAudio}</Text>
        </View>
      ) : null}

      <MicrophonePermissionPopup
        visible={showMicPopup}
        onClose={handleMicPopupClose}
        onAllowMicrophone={handleAllowMicrophone}
        loading={micLoading}
        openSettings={micBlocked}
      />
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
  entryBody: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  entryMiddle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    width: "100%",
  },
  hero: {
    width: 219,
    height: 168,
  },
  entryCopy: {
    gap: 8,
    width: "100%",
    alignItems: "center",
  },
  entryTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  entrySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    textAlign: "center",
  },
  entryNote: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
  },
  entryControls: {
    alignItems: "center",
    paddingBottom: 8,
  },
  entryRecordBtn: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  entryRecordImage: {
    width: 72,
    height: 72,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  recordingTop: {
    gap: 24,
    width: "100%",
  },
  recordingHeader: {
    gap: 8,
    alignItems: "center",
    width: "100%",
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
  timerPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  timerText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: "#FFFFFF",
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#5D5D5D",
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
  statusBlock: {
    alignItems: "center",
    gap: 8,
  },
  spinner: { width: 40, height: 40 },
  statusText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 224,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 60,
    gap: 12,
    paddingBottom: 8,
  },
  stopRecordBtn: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
  },
  stopRecordImage: {
    width: 72,
    height: 72,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  pauseBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIcon: { width: 48, height: 48 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  processingTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 26,
    color: "#FFFFFF",
    textAlign: "center",
  },
  processingSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
