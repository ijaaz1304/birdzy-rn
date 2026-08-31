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
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FONTS } from "../../../common/typography";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourMushroomBackground";
import { SoundSpectrogramView } from "../components/SoundSpectrogramView";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { formatSoundHms, formatSoundStamp } from "../utils/soundCrop";
import {
  checkMicrophonePermission,
  openDeviceSettings,
  requestMicrophonePermission,
  showPermissionAlert,
} from "../../../services/permissions";
import { shouldSkipMicrophonePermissionPrompt } from "../../../services/permissions/permissionPromptSkip";
import { MicrophonePermissionPopup } from "../../../molecules/Modal";

type Nav = NativeStackNavigationProp<CameraStackParamList, "SoundIdentify">;

type LiveStatus = "listening" | "searching" | "noise" | "noMatch";
type Phase = "entry" | "recording";

const copy = CAMERA_STRINGS.sound;

function statusCopy(status: LiveStatus): string {
  switch (status) {
    case "noise":
      return copy.statusNoise;
    case "noMatch":
      return copy.statusNoMatch;
    case "searching":
      return copy.statusSearching;
    default:
      return copy.statusListening;
  }
}

export const SoundIdentifyScreen: React.FC = () => {
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

  const [phase, setPhase] = useState<Phase>("entry");
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [micLoading, setMicLoading] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [metering, setMetering] = useState(0);
  const [recordedAt] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppingRef = useRef(false);
  const spin = useRef(new Animated.Value(0)).current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goToCrop = useCallback(
    (uri: string, durationSec: number) => {
      navigation.replace("SoundCrop", {
        audioUri: uri,
        durationSec: Math.max(1, Math.round(durationSec)),
        recordedAt,
      });
    },
    [navigation, recordedAt]
  );

  const stopAndCrop = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
    try {
      setBusy(true);
      const duration = soundRecordingService.elapsedRecordingSeconds();
      const uri = await soundRecordingService.stopRecording();
      goToCrop(uri, duration || elapsedSec);
    } catch {
      stoppingRef.current = false;
    } finally {
      setBusy(false);
    }
  }, [clearTimer, elapsedSec, goToCrop]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      const next = Math.floor(soundRecordingService.elapsedRecordingSeconds());
      setElapsedSec(next);
      if (next >= soundRecordingService.maxRecordingSeconds) {
        void stopAndCrop();
      }
    }, 250);
  }, [clearTimer, stopAndCrop]);

  const beginRecording = useCallback(async () => {
    try {
      setBusy(true);
      setElapsedSec(0);
      await soundRecordingService.startRecording((db) => setMetering(db));
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start recording.";
      if (/permission/i.test(message)) {
        showPermissionAlert(
          "Microphone access needed",
          "Allow microphone access to record bird sounds for identification.",
          openDeviceSettings
        );
      }
      setPhase("entry");
    } finally {
      setBusy(false);
    }
  }, [startTimer]);

  const tryStartRecording = useCallback(async () => {
    if (busy || isRecording) return;

    if (await shouldSkipMicrophonePermissionPrompt()) {
      await beginRecording();
      return;
    }

    const microphone = await checkMicrophonePermission();
    if (microphone.granted) {
      await beginRecording();
      return;
    }

    setMicBlocked(!!microphone.blocked);
    setShowMicPopup(true);
  }, [beginRecording, busy, isRecording]);

  const handleEntryRecordPress = useCallback(() => {
    setPhase("recording");
  }, []);

  const handleMicPopupClose = useCallback(() => {
    setShowMicPopup(false);
    if (!isRecording) {
      setPhase("entry");
    }
  }, [isRecording]);

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
          await beginRecording();
        }
      } finally {
        setMicLoading(false);
      }
    })();
  }, [beginRecording, micBlocked]);

  const recordingInitRef = useRef(false);

  useEffect(() => {
    if (phase !== "recording") {
      recordingInitRef.current = false;
      return;
    }
    if (recordingInitRef.current || isRecording) return;
    recordingInitRef.current = true;
    void tryStartRecording();
  }, [phase, isRecording, tryStartRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      void soundRecordingService.stopRecording().catch(() => undefined);
    };
  }, [clearTimer]);

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
    void soundRecordingService.stopRecording().catch(() => undefined);
    clearTimer();
    if (phase === "recording" && !isRecording) {
      setPhase("entry");
      return;
    }
    navigation.goBack();
  };

  const togglePause = async () => {
    if (!isRecording || busy) return;
    try {
      if (isPaused) {
        await soundRecordingService.resumeRecording();
        setIsPaused(false);
        startTimer();
      } else {
        await soundRecordingService.pauseRecording();
        clearTimer();
        setIsPaused(true);
      }
    } catch {
      void stopAndCrop();
    }
  };

  const liveStatus: LiveStatus = (() => {
    if (metering > -12) return "noise";
    if (elapsedSec >= 10 && metering < -45) return "noMatch";
    if (elapsedSec >= 5) return "searching";
    return "listening";
  })();

  const stamp = formatSoundStamp(new Date(recordedAt));
  const place =
    locationOn && locationLabel?.trim()
      ? locationLabel.trim()
      : copy.noLocation;
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
          <View style={styles.topBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {copy.recording}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {copy.minLength}
            </Text>
            <View
              style={[styles.timerPill, { backgroundColor: colors.primaryCTA }]}
            >
              <Text style={styles.timerText}>{formatSoundHms(elapsedSec)}</Text>
            </View>

            <SoundSpectrogramView
              live={isRecording && !isPaused}
              liveColor={colors.primaryCTA}
              playheadRatio={0.5}
            />

            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {stamp}  •  {place}
            </Text>

            {locationCard}
          </View>

          <View style={styles.statusBlock}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <AppImage
                source={Images.soundListeningSpinner}
                style={styles.spinner}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {statusCopy(liveStatus)}
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.recordHalo}>
              <TouchableOpacity
                onPress={() => void stopAndCrop()}
                disabled={busy}
                style={[styles.stopBtn, { opacity: busy ? 0.6 : 1 }]}
                accessibilityLabel={copy.stopRecording}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.stopSquare} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => void togglePause()}
              disabled={busy || !isRecording}
              style={[
                styles.pauseBtn,
                {
                  borderColor: colors.border0,
                  backgroundColor: colors.surfacePrimary,
                },
              ]}
              accessibilityLabel={
                isPaused ? copy.resumeRecording : copy.pauseRecording
              }
            >
              <AppImage
                source={isPaused ? Images.soundPlay : Images.soundPause}
                style={styles.pauseIcon}
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
  topBlock: {
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
  recordHalo: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(17,17,17,0.05)",
  },
  stopBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  stopSquare: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  pauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIcon: { width: 24, height: 24 },
});
