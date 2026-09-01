/**
 * Diagnosis Loading Screen
 * Shows image preview while analyzing with scanning animation
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Text, Button } from "../../../atoms";
import { Images } from "../../../assets";
import { aiService } from "../../../services";
import { CameraStackParamList } from "../../../navigation/types";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { AskAIScreenBackground } from "../../ask-ai/components/AskAIScreenBackground";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import {
  canIdentifyByMode,
  incrementPhotoIdentificationUsage,
  incrementSoundIdentificationUsage,
} from "../../../services/session/usageLimit.service";
import {
  incrementLifetimeIdentificationCount,
  isIdentificationMilestone,
} from "../../../services/session/identificationMilestone.service";
import { setPendingIdentificationMilestone } from "../../../services/session/identificationMilestonePending.service";
import {
  mapIdentificationToPossibleMatch,
  getPossibleMatchThumbnailUri,
  POSSIBLE_MATCH_THUMBNAIL_WIDTH,
  POSSIBLE_MATCH_THUMBNAIL_HEIGHT,
} from "../../../utils/mushroomApiMappers";
import { awaitPrefetchRemoteImages } from "../../../utils/prefetchImages";
import { HiddenRemoteImagePrefetcher } from "../../../components/AppImage/HiddenRemoteImagePrefetcher";
import { getIdentificationUserLocationForApi } from "../locationToggle.helpers";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { performanceService } from "../../../services/performance/performance.service";
import {
  LimitReachedBottomSheet,
  AIErrorModal,
} from "../../../molecules/Modal";
import {
  NoBirdDetectedModal,
  NoiseTooHighModal,
} from "../components/BirdSoundErrorModals";
import { IdentificationScannerFrame } from "../components/IdentificationScannerFrame";
import { rescheduleInactivityNotifications } from "../../../services/notifications/scheduledNotifications.service";
import { spacing } from "../../../design-system/spacing";
import { useIdentificationEntryStore } from "../identificationEntry.store";
import { useIdentificationResultsStore } from "../identificationResults.store";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { fetchStepByStepMatches } from "../../discovery/utils/runStepByStepAnalysis";

const navigateHomeFromDiagnosis = (
  navigation: NativeStackNavigationProp<CameraStackParamList, "DiagnosisLoading">,
  isStepByStep = false
) => {
  useIdentificationEntryStore.getState().setSuppressFtueAutoNavigation(true);
  if (isStepByStep) {
    navigation.getParent()?.navigate("Home", { screen: "StepByStep" });
    return;
  }
  // Keep a completed/cancelled analysis from reopening as the active Camera tab
  // route after the user has returned Home.
  if (typeof navigation.popToTop === "function") {
    navigation.popToTop();
  }
  navigation.getParent()?.navigate("Home", { screen: "HomeMain" });
};

const BIRD_IDENTIFICATION_TRACE = "bird_identification";

function classifySoundIdentifyError(error?: unknown): "noBird" | "noise" {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /noise|ambient|signal|snr|too loud/i.test(message) ? "noise" : "noBird";
}

type DiagnosisLoadingScreenRouteProp = RouteProp<
  CameraStackParamList,
  "DiagnosisLoading"
>;
type DiagnosisLoadingScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "DiagnosisLoading"
>;

export const DiagnosisLoadingScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DiagnosisLoadingScreenNavigationProp>();
  const route = useRoute<DiagnosisLoadingScreenRouteProp>();
  const { image, displayImage, images, audioUri, identifyMode, cropStartSec, cropDurationSec, audioDurationSec, recordedAt } =
    route.params || ({} as CameraStackParamList["DiagnosisLoading"]);
  const isSoundMode = identifyMode === "sound" || !!audioUri;
  const isStepByStepMode = identifyMode === "stepByStep";
  const uploadImages =
    images?.length && images[0]?.uri ? images : image?.uri ? [image] : [];
  const previewImage = displayImage?.uri
    ? displayImage
    : uploadImages[0] ?? image;
  const primaryImage = isSoundMode ? undefined : previewImage;

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [soundError, setSoundError] = useState<"noBird" | "noise" | null>(null);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"analyzing" | "preparing">(
    "analyzing"
  );
  const isPremium = useSubscriptionStore(selectIsPremium);
  const isMountedRef = useRef(true);
  const thumbPrefetchDoneRef = useRef<(() => void) | null>(null);
  const [thumbPrefetchUris, setThumbPrefetchUris] = useState<string[]>([]);

  const showIdentifyFailure = (error?: unknown) => {
    if (isSoundMode) {
      setSoundError(classifySoundIdentifyError(error));
      return;
    }
    setShowErrorModal(true);
  };

  const retrySoundIdentify = () => {
    setSoundError(null);
    navigation.replace("SoundIdentify");
  };

  const handleThumbPrefetchSettled = useCallback(() => {
    thumbPrefetchDoneRef.current?.();
    thumbPrefetchDoneRef.current = null;
  }, []);

  const navigateToPossibleMatches = (
    possibleMatches: ReturnType<typeof mapIdentificationToPossibleMatch>[],
    fromStepByStep = false,
    uploadedSoundUrls?: string[]
  ) => {
    const identificationImage = primaryImage?.uri
      ? { uri: primaryImage.uri }
      : undefined;
    // Persist before navigate so Possible Matches can paint immediately from store + params.
    useIdentificationResultsStore
      .getState()
      .setResults(possibleMatches, identificationImage, {
        uploadedSoundUrls,
      });
    const params = {
      title: CAMERA_STRINGS.results.possibleMatchesHeading,
      matches: possibleMatches,
      identificationImage,
      fromStepByStep,
      ...(isSoundMode
        ? {
            fromSound: true as const,
            audioUri,
            audioDurationSec,
            recordedAt,
          }
        : {}),
    };
    if (fromStepByStep) {
      navigation.reset({
        index: 0,
        routes: [{ name: "OtherPossibleMatches", params }],
      });
      return;
    }
    navigation.replace("OtherPossibleMatches", params);
  };

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const runDiagnosis = async () => {
      void performanceService.startTrace(BIRD_IDENTIFICATION_TRACE);
      const stopIdentificationTrace = async (
        outcome: "success" | "failure" | "limit" | "invalid_input"
      ) => {
        await performanceService.addAttribute(
          BIRD_IDENTIFICATION_TRACE,
          "outcome",
          outcome
        );
        await performanceService.stopTrace(BIRD_IDENTIFICATION_TRACE);
      };

      if (isStepByStepMode) {
        try {
          const possibleMatches = await fetchStepByStepMatches();
          if (cancelled || !isMountedRef.current) return;

          if (possibleMatches.length === 0) {
            analyticsService.logEvent(EVENTS.identify_result_fail);
            analyticsService.logEvent(EVENTS.identification_done_failure);
            analyticsService.logEvent(EVENTS.identify_result, { result: "fail" });
            await stopIdentificationTrace("failure");
            if (!cancelled && isMountedRef.current) {
              setShowErrorModal(true);
            }
            return;
          }

          const thumbnailUris = possibleMatches
            .map((match) => getPossibleMatchThumbnailUri(match))
            .filter((uri): uri is string => !!uri);

          setLoadingPhase("preparing");
          void awaitPrefetchRemoteImages(thumbnailUris, thumbnailUris.length, 0);
          if (thumbnailUris.length > 0 && !cancelled && isMountedRef.current) {
            const waitForDecode = new Promise<void>((resolve) => {
              thumbPrefetchDoneRef.current = resolve;
            });
            setThumbPrefetchUris(thumbnailUris.slice(0, 5));
            await Promise.race([
              waitForDecode,
              new Promise<void>((resolve) => setTimeout(resolve, 5000)),
            ]);
          }

          if (cancelled || !isMountedRef.current) return;
          void stopIdentificationTrace("success");
          navigateToPossibleMatches(possibleMatches, true);
        } catch (error) {
          console.error("Step-by-step diagnosis error:", error);
          await stopIdentificationTrace("failure");
          if (!cancelled && isMountedRef.current) setShowErrorModal(true);
        }
        return;
      }

      if (isSoundMode) {
        if (!audioUri) {
          analyticsService.logEvent(EVENTS.identify_result_fail);
          await stopIdentificationTrace("invalid_input");
          if (!cancelled && isMountedRef.current) showIdentifyFailure();
          return;
        }
      } else if (!uploadImages.length || !uploadImages[0]?.uri) {
        analyticsService.logEvent(EVENTS.identify_result_fail);
        analyticsService.logEvent(EVENTS.identification_done_failure);
        analyticsService.logEvent(EVENTS.identify_result, {
          result: "fail",
        });
        await stopIdentificationTrace("invalid_input");
        if (!cancelled && isMountedRef.current) setShowErrorModal(true);
        return;
      }
      if (!isPremium) {
        const allowed = await canIdentifyByMode(isSoundMode ? "sound" : "photo");
        if (cancelled) return;
        if (!allowed) {
          analyticsService.logEvent(EVENTS.identification_limit_reached, {
            source: "diagnosis_loading",
          });
          analyticsService.logEvent(EVENTS.identification_limit_exceeded);
          await stopIdentificationTrace("limit");
          if (!cancelled && isMountedRef.current) setShowUpgradeSheet(true);
          return;
        }
      }
      try {
        let matches;
        let matchesFoundCount;
        let uploadedSoundUrls: string[] | undefined;

        if (isSoundMode && audioUri) {
          const crop =
            cropStartSec != null && cropDurationSec != null
              ? { startSec: cropStartSec, durationSec: cropDurationSec }
              : undefined;
          const userLocation = getIdentificationUserLocationForApi();
          const soundResult = await aiService.identifyBirdSound(
            audioUri,
            crop,
            userLocation
          );
          matches = soundResult.matches;
          matchesFoundCount = soundResult.matchesFoundCount;
          uploadedSoundUrls = soundResult.soundUrls;
        } else {
          const uploadUris = uploadImages
            .map((i) => i.uri)
            .filter(Boolean)
            .slice(0, 2);

          const userLocation = getIdentificationUserLocationForApi();
          const imageResult = await aiService.identifyMushroom(
            uploadUris,
            userLocation
          );
          matches = imageResult.matches;
          matchesFoundCount = imageResult.matchesFoundCount;
        }

        if (cancelled || !isMountedRef.current) return;

        if (matchesFoundCount === 0 || !matches?.length) {
          analyticsService.logEvent(EVENTS.identify_result_fail);
          analyticsService.logEvent(EVENTS.identification_done_failure);
          analyticsService.logEvent(EVENTS.identify_result, {
            result: "fail",
          });
          await stopIdentificationTrace("failure");
          if (!cancelled && isMountedRef.current) showIdentifyFailure();
          return;
        }
        analyticsService.logEvent(EVENTS.identify_result_success);
        analyticsService.logEvent(EVENTS.identification_done_success);
        analyticsService.logEvent(EVENTS.identify_result, {
          result: "success",
        });
        void stopIdentificationTrace("success");

        const possibleMatches = matches.map(mapIdentificationToPossibleMatch);
        const thumbnailUris = possibleMatches
          .map((match) => getPossibleMatchThumbnailUri(match))
          .filter((uri): uri is string => !!uri);

        setLoadingPhase("preparing");

        // Kick HTTP/FastImage download immediately, then wait for off-screen
        // FastImage views to decode at list-thumb size (preload has no onLoad).
        void awaitPrefetchRemoteImages(thumbnailUris, thumbnailUris.length, 0);
        if (thumbnailUris.length > 0 && !cancelled && isMountedRef.current) {
          const waitForDecode = new Promise<void>((resolve) => {
            thumbPrefetchDoneRef.current = resolve;
          });
          setThumbPrefetchUris(thumbnailUris.slice(0, 5));
          await Promise.race([
            waitForDecode,
            new Promise<void>((resolve) => setTimeout(resolve, 5000)),
          ]);
        }

        if (cancelled || !isMountedRef.current) return;

        navigateToPossibleMatches(possibleMatches, false, uploadedSoundUrls);

        void (async () => {
          rescheduleInactivityNotifications().catch(() => {
            // Non-blocking; permission or channel errors are logged inside the service
          });

          const isPremiumNow = selectIsPremium(useSubscriptionStore.getState());
          if (!isPremiumNow) {
            if (isSoundMode) {
              await incrementSoundIdentificationUsage();
            } else {
              await incrementPhotoIdentificationUsage();
            }
          }

          const lifetimeCount = await incrementLifetimeIdentificationCount();
          if (isIdentificationMilestone(lifetimeCount)) {
            await setPendingIdentificationMilestone(lifetimeCount);
          }
        })();
      } catch (error) {
        console.error("Diagnosis error:", error);
        analyticsService.logEvent(EVENTS.identify_result_fail);
        analyticsService.logEvent(EVENTS.identification_done_failure);
        analyticsService.logEvent(EVENTS.identify_result, {
          result: "fail",
        });
        await stopIdentificationTrace("failure");
        if (!cancelled && isMountedRef.current) showIdentifyFailure(error);
      }
    };

    runDiagnosis();
    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per diagnosis entry
  }, [isPremium]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfacePrimary }]}
    >
      {/* Hide loading UI when error or limit sheet is visible */}
      {!showErrorModal && !soundError && !showUpgradeSheet && (
        <>
          {isDark ? <AskAIScreenBackground /> : <FindYourBirdBackground />}
          <HiddenRemoteImagePrefetcher
            uris={thumbPrefetchUris}
            decodeWidth={POSSIBLE_MATCH_THUMBNAIL_WIDTH}
            decodeHeight={POSSIBLE_MATCH_THUMBNAIL_HEIGHT}
            onAllSettled={handleThumbPrefetchSettled}
          />
          {/* Top inset only — bottom bg stays edge-to-edge; CTA pads for home indicator */}
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.mainColumn}>
              <View style={styles.content}>
                {isSoundMode ? (
                  <View
                    style={[
                      styles.soundPreview,
                      { backgroundColor: `${colors.primaryCTA}14` },
                    ]}
                  >
                    <MaterialIcons name="graphic-eq" size={72} color={colors.primaryCTA} />
                  </View>
                ) : (
                  <IdentificationScannerFrame
                    imageUri={primaryImage?.uri}
                    fallbackImage={
                      isStepByStepMode ? Images.wizardFindYourBird : undefined
                    }
                    style={styles.scannerFrameWrapper}
                  />
                )}
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={colors.primaryCTA} />
                </View>
                <Text
                  variant="body"
                  size="medium"
                  color="textSecondary"
                  style={styles.text}
                >
                  {loadingPhase === "preparing"
                    ? "Preparing your top matches..."
                    : "Analyzing your data... almost there, stay tuned for the final result!"}
                </Text>
              </View>
              <View
                style={[
                  styles.bottomCtaWrap,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                <Button
                  title={CAMERA_STRINGS.buttons.goBack}
                  variant="primary"
                  size="large"
                  fullWidth
                  onPress={() => navigateHomeFromDiagnosis(navigation, isStepByStepMode)}
                  textStyle={{ flexShrink: 0 }}
                />
              </View>
            </View>
          </SafeAreaView>
        </>
      )}

      {/* Identify error – AIErrorModal (AppPopup-style: Chat with AI | Re-take photo) */}
      <AIErrorModal
        visible={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          navigateHomeFromDiagnosis(navigation, isStepByStepMode);
        }}
        onRetry={() => {
          setShowErrorModal(false);
          navigateHomeFromDiagnosis(navigation, isStepByStepMode);
        }}
        onChatWithAI={() => {
          setShowErrorModal(false);
          analyticsService.logEvent(EVENTS.ask_ai_banner_clicked, {
            source: "diagnosis",
          });
          navigation.getParent()?.getParent()?.navigate("AskAIStack", {
            screen: "AskAIMain",
          });
        }}
        retryLabel={
          isStepByStepMode ? CAMERA_STRINGS.buttons.tryAgain : undefined
        }
        errorMessage={undefined}
      />

      <LimitReachedBottomSheet
        visible={showUpgradeSheet}
        onClose={() => {
          setShowUpgradeSheet(false);
          navigateHomeFromDiagnosis(navigation);
        }}
        onUpgrade={() => {
          analyticsService.logEvent(EVENTS.identification_limit_upgrade_click, {
            source: "diagnosis_loading",
          });
          setShowUpgradeSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType={isSoundMode ? "soundIdentification" : "identification"}
      />

      <NoBirdDetectedModal
        visible={soundError === "noBird"}
        onClose={retrySoundIdentify}
        onRetry={retrySoundIdentify}
      />
      <NoiseTooHighModal
        visible={soundError === "noise"}
        onClose={retrySoundIdentify}
        onRetry={retrySoundIdentify}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  mainColumn: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    minHeight: 0,
  },
  bottomCtaWrap: {
    alignSelf: "stretch",
    width: "100%",
    paddingHorizontal: spacing[6],
    paddingTop: 8,
    flexShrink: 0,
  },
  scannerFrameWrapper: {
    marginBottom: 24,
  },
  soundPreview: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loaderContainer: {
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
    maxWidth: 320,
  },
  promoTitle: {
    marginBottom: 8,
  },
  promoSubtitle: {
    marginBottom: 24,
    lineHeight: 22,
  },
  promoButton: {
    width: "100%",
    marginBottom: 12,
  },
  promoButtonSecondary: {
    width: "100%",
  },
});
