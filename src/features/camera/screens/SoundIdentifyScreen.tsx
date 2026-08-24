/**
 * Record a bird sound and submit to identify-sound API.
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Images } from "../../../assets";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon, Button } from "../../../atoms";
import { CameraStackParamList } from "../../../navigation/types";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { canIdentifySound } from "../../../services/session/usageLimit.service";
import { canAddAudioGalleryClip } from "../../../services/session/audioGalleryLimit.service";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { SoundWaveformBars } from "../components/SoundWaveformBars";
import {
  NoBirdDetectedModal,
  NoiseTooHighModal,
} from "../components/BirdSoundErrorModals";
import { showPermissionAlert, openDeviceSettings } from "../../../services/permissions";

type Nav = NativeStackNavigationProp<CameraStackParamList, "SoundIdentify">;

export const SoundIdentifyScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isPremium = useSubscriptionStore(selectIsPremium);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showGalleryLimitSheet, setShowGalleryLimitSheet] = useState(false);
  const [showNoBirdModal, setShowNoBirdModal] = useState(false);
  const [showNoiseModal, setShowNoiseModal] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleBack = () => {
    if (isRecording) {
      void soundRecordingService.stopRecording().catch(() => undefined);
    }
    clearTimer();
    navigation.goBack();
  };

  const startRecording = async () => {
    try {
      setBusy(true);
      setRecordedUri(null);
      setElapsedSec(0);
      setLiveSuggestions([]);
      await soundRecordingService.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => {
          const next = s + 1;
          if (next >= 4) {
            setLiveSuggestions((prev) =>
              prev.length
                ? prev
                : ["American Robin", "Northern Cardinal", "Song Sparrow"]
            );
          }
          if (next >= soundRecordingService.maxRecordingSeconds) {
            void stopRecording();
          }
          return next;
        });
      }, 1000);
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
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    clearTimer();
    setIsRecording(false);
    try {
      setBusy(true);
      const uri = await soundRecordingService.stopRecording();
      setRecordedUri(uri);
    } catch {
      setRecordedUri(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const submitRecording = async () => {
    if (!recordedUri) return;

    if (!isPremium) {
      const [allowedId, allowedGallery] = await Promise.all([
        canIdentifySound(),
        canAddAudioGalleryClip(),
      ]);
      if (!allowedId) {
        setShowUpgradeSheet(true);
        return;
      }
      if (!allowedGallery) {
        setShowGalleryLimitSheet(true);
        return;
      }
    }

    analyticsService.logEvent(EVENTS.photo_submitted, { source: "sound_identify" });
    navigation.replace("DiagnosisLoading", {
      identifyMode: "sound",
      audioUri: recordedUri,
    });
  };

  const timerLabel = soundRecordingService.mmss(elapsedSec);
  const maxLabel = soundRecordingService.mmss(
    soundRecordingService.maxRecordingSeconds
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { top: insets.top + 12 }]}
          hitSlop={HIT_SLOP.CLOSE}
        >
          <NavBackIcon color={colors.textPrimary} size={24} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text variant="headline" size="large" weight="bold" style={styles.title}>
            {CAMERA_STRINGS.sound.title}
          </Text>
          <Text variant="body" size="medium" color="textSecondary" style={styles.subtitle}>
            {CAMERA_STRINGS.sound.subtitle}
          </Text>

          <SoundWaveformBars
            active={isRecording}
            color={colors.primary}
            height={40}
          />

          {isRecording && liveSuggestions.length > 0 ? (
            <View style={styles.suggestionsWrap}>
              <Text variant="caption" size="small" color="textSecondary">
                {CAMERA_STRINGS.sound.liveSuggestions}
              </Text>
              <View style={styles.suggestionRow}>
                {liveSuggestions.map((name) => (
                  <View
                    key={name}
                    style={[
                      styles.suggestionChip,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <Text variant="caption" size="small" weight="medium">
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.recordCircle,
              {
                borderColor: isRecording ? colors.error : colors.primary,
                backgroundColor: `${colors.primary}14`,
              },
            ]}
          >
            {busy && !isRecording ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <AppImage
                source={
                  isRecording ? Images.soundRecordStop : Images.soundRecord
                }
                style={styles.recordIcon}
                resizeMode="contain"
              />
            )}
          </View>

          <Text variant="body" size="medium" weight="semibold">
            {isRecording ? CAMERA_STRINGS.sound.recording : CAMERA_STRINGS.sound.tapToRecord}
          </Text>
          <Text variant="caption" size="small" color="textSecondary">
            {timerLabel} / {maxLabel}
          </Text>

          <TouchableOpacity
            onPress={toggleRecording}
            disabled={busy}
            style={[
              styles.recordBtn,
              {
                backgroundColor: isRecording ? colors.error : colors.primary,
                opacity: busy ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text variant="body" size="medium" weight="semibold" color="surface">
              {isRecording
                ? CAMERA_STRINGS.sound.stopRecording
                : CAMERA_STRINGS.sound.startRecording}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title={CAMERA_STRINGS.sound.identifySound}
            variant="primary"
            size="large"
            fullWidth
            disabled={!recordedUri || isRecording || busy}
            onPress={() => void submitRecording()}
          />
        </View>
      </SafeAreaView>

      <LimitReachedBottomSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        onUpgrade={() => {
          setShowUpgradeSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="soundIdentification"
      />
      <LimitReachedBottomSheet
        visible={showGalleryLimitSheet}
        onClose={() => setShowGalleryLimitSheet(false)}
        onUpgrade={() => {
          setShowGalleryLimitSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="soundGallery"
      />
      <NoBirdDetectedModal
        visible={showNoBirdModal}
        onClose={() => setShowNoBirdModal(false)}
        onRetry={() => {
          setShowNoBirdModal(false);
          setRecordedUri(null);
        }}
      />
      <NoiseTooHighModal
        visible={showNoiseModal}
        onClose={() => setShowNoiseModal(false)}
        onRetry={() => {
          setShowNoiseModal(false);
          setRecordedUri(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  backBtn: {
    position: "absolute",
    left: spacing[4],
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  title: { textAlign: "center", marginBottom: spacing[1] },
  subtitle: { textAlign: "center", marginBottom: spacing[6] },
  recordCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[6],
  },
  recordIcon: {
    width: 72,
    height: 72,
  },
  recordBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
    borderRadius: Radius.full,
  },
  suggestionsWrap: {
    width: "100%",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
    justifyContent: "center",
  },
  suggestionChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 999,
  },
  footer: {
    paddingHorizontal: spacing[6],
  },
});
