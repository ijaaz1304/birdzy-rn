import {
  beginFreeScanAttempt,
  completeFreeScanAttempt,
  cancelFreeScanAttempt,
} from "../../../services/session/scanQuota";
import type { ScanAttempt } from "../../../services/session/scanAllowance";
import { requestFreeScanLimitPrompt } from "../../../services/freeScanLimitPrompt";
import { useCallback, useEffect, useRef, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { aiService } from "../../../services";
import { CameraStackParamList } from "../../../navigation/types";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { canIdentifyByMode } from "../../../services/session/usageLimit.service";
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
import { getIdentificationUserLocationForApi } from "../locationToggle.helpers";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { performanceService } from "../../../services/performance/performance.service";
import { rescheduleInactivityNotifications } from "../../../services/notifications/scheduledNotifications.service";
import { useIdentificationResultsStore } from "../identificationResults.store";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import {
  getDevIdentificationSampleMatches,
  getDevSoundIdentificationExtras,
  shouldUseIdentificationDevSamples,
} from "../identificationDevSamples";

const BIRD_IDENTIFICATION_TRACE = "bird_identification";

export type SoundIdentificationInput = {
  audioUri: string;
  audioDurationSec: number;
  recordedAt: number;
  cropStartSec?: number;
  cropDurationSec?: number;
};

function classifySoundIdentifyError(error?: unknown): "noBird" | "noise" {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";
  return /noise|ambient|signal|snr|too loud/i.test(message)
    ? "noise"
    : "noBird";
}

export function useSoundIdentificationFlow(
  navigation: NativeStackNavigationProp<CameraStackParamList>,
  options?: { onRetrySound?: () => void }
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"analyzing" | "preparing">(
    "analyzing"
  );
  const [soundError, setSoundError] = useState<"noBird" | "noise" | null>(null);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [thumbPrefetchUris, setThumbPrefetchUris] = useState<string[]>([]);
  const thumbPrefetchDoneRef = useRef<(() => void) | null>(null);
  const runIdRef = useRef(0);
  const activeAttempt = useRef<ScanAttempt | null>(null);
  const startingRef = useRef(false);
  useEffect(
    () => () => {
      runIdRef.current += 1;
      if (activeAttempt.current) cancelFreeScanAttempt(activeAttempt.current);
      thumbPrefetchDoneRef.current?.();
    },
    []
  );

  const handleThumbPrefetchSettled = useCallback(() => {
    thumbPrefetchDoneRef.current?.();
    thumbPrefetchDoneRef.current = null;
  }, []);

  const navigateToSoundNoMatch = useCallback(
    (
      input: SoundIdentificationInput,
      extras?: { uploadedSoundUrls?: string[]; uploadedImageUrls?: string[] }
    ) => {
      useIdentificationResultsStore.getState().setResults([], undefined, {
        uploadedSoundUrls: extras?.uploadedSoundUrls,
        uploadedImageUrls: extras?.uploadedImageUrls,
      });
      navigation.replace("SoundNoMatch", {
        audioUri: input.audioUri,
        audioDurationSec: input.audioDurationSec,
        recordedAt: input.recordedAt,
        uploadedSoundUrls: extras?.uploadedSoundUrls,
        uploadedImageUrls: extras?.uploadedImageUrls,
        cropStartSec: input.cropStartSec,
        cropDurationSec: input.cropDurationSec,
      });
    },
    [navigation]
  );

  const navigateToPossibleMatches = useCallback(
    (
      input: SoundIdentificationInput,
      possibleMatches: ReturnType<typeof mapIdentificationToPossibleMatch>[],
      extras?: { uploadedSoundUrls?: string[]; uploadedImageUrls?: string[] }
    ) => {
      useIdentificationResultsStore
        .getState()
        .setResults(possibleMatches, undefined, {
          uploadedSoundUrls: extras?.uploadedSoundUrls,
          uploadedImageUrls: extras?.uploadedImageUrls,
        });
      navigation.replace("OtherPossibleMatches", {
        title: CAMERA_STRINGS.results.possibleMatchesHeading,
        matches: possibleMatches,
        fromSound: true,
        audioUri: input.audioUri,
        audioDurationSec: input.audioDurationSec,
        recordedAt: input.recordedAt,
      });
    },
    [navigation]
  );

  const startIdentification = useCallback(
    async (input: SoundIdentificationInput) => {
      if (startingRef.current) return;
      startingRef.current = true;
      const runId = ++runIdRef.current;
      const isStale = () => runIdRef.current !== runId;
      try {
        setSoundError(null);
        setShowUpgradeSheet(false);
        setLoadingPhase("analyzing");
        setIsAnalyzing(true);
        setThumbPrefetchUris([]);

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

        if (!input.audioUri) {
          analyticsService.logEvent(EVENTS.identify_result_fail);
          await stopIdentificationTrace("invalid_input");
          if (!isStale()) {
            setIsAnalyzing(false);
            setSoundError("noBird");
          }
          return;
        }

        const isPremium = selectIsPremium(useSubscriptionStore.getState());
        if (!isPremium) {
          const allowed = await canIdentifyByMode("sound");
          if (isStale()) return;
          if (!allowed) {
            analyticsService.logEvent(EVENTS.identification_limit_reached, {
              source: "sound_crop",
            });
            analyticsService.logEvent(EVENTS.identification_limit_exceeded);
            await stopIdentificationTrace("limit");
            if (!isStale()) {
              setIsAnalyzing(false);
              requestFreeScanLimitPrompt();
            }
            return;
          }
        }

        try {
          const start = await beginFreeScanAttempt();
          if (start.status !== "ready") {
            setIsAnalyzing(false);
            if (start.status === "blocked") requestFreeScanLimitPrompt();
            return;
          }
          activeAttempt.current = start.attempt;
          if (isStale()) return;
          let possibleMatches: ReturnType<
            typeof mapIdentificationToPossibleMatch
          >[];
          let uploadedSoundUrls: string[] | undefined;
          let uploadedImageUrls: string[] | undefined;

          try {
            const crop =
              input.cropStartSec != null && input.cropDurationSec != null
                ? {
                    startSec: input.cropStartSec,
                    durationSec: input.cropDurationSec,
                  }
                : undefined;
            const userLocation = getIdentificationUserLocationForApi();
            const soundResult = await aiService.identifyBirdSound(
              input.audioUri,
              crop,
              userLocation
            );

            if (isStale()) return;

            if (
              soundResult.matchesFoundCount === 0 ||
              !soundResult.matches?.length
            ) {
              if (!shouldUseIdentificationDevSamples()) {
                analyticsService.logEvent(EVENTS.identify_result_fail);
                analyticsService.logEvent(EVENTS.identification_done_failure);
                analyticsService.logEvent(EVENTS.identify_result, {
                  result: "fail",
                });
                await stopIdentificationTrace("failure");
                const allowance = await completeFreeScanAttempt(
                  start.attempt,
                  "failure"
                );
                if (isStale()) return;
                setIsAnalyzing(false);
                if (allowance.remaining === 0) {
                  requestFreeScanLimitPrompt();
                  return;
                }
                navigateToSoundNoMatch(input, {
                  uploadedSoundUrls: soundResult.soundUrls,
                  uploadedImageUrls: soundResult.imageUrls,
                });
                return;
              }
              console.warn(
                "[SoundIdentify] API returned no matches — using dev sample results"
              );
              possibleMatches = getDevIdentificationSampleMatches();
              const devExtras = getDevSoundIdentificationExtras();
              uploadedSoundUrls = devExtras.soundUrls;
              uploadedImageUrls = devExtras.imageUrls;
            } else {
              possibleMatches = soundResult.matches.map(
                mapIdentificationToPossibleMatch
              );
              uploadedSoundUrls = soundResult.soundUrls;
              uploadedImageUrls = soundResult.imageUrls;
            }
          } catch (apiError) {
            if (!shouldUseIdentificationDevSamples()) throw apiError;
            console.warn(
              "[SoundIdentify] API failed — using dev sample results",
              (apiError as Error)?.message ?? apiError
            );
            possibleMatches = getDevIdentificationSampleMatches();
            const devExtras = getDevSoundIdentificationExtras();
            uploadedSoundUrls = devExtras.soundUrls;
            uploadedImageUrls = devExtras.imageUrls;
          }

          analyticsService.logEvent(EVENTS.identify_result_success);
          analyticsService.logEvent(EVENTS.identification_done_success);
          analyticsService.logEvent(EVENTS.identify_result, {
            result: "success",
          });
          void stopIdentificationTrace("success");

          const thumbnailUris = possibleMatches
            .map((match) => getPossibleMatchThumbnailUri(match))
            .filter((uri): uri is string => !!uri);

          setLoadingPhase("preparing");
          void awaitPrefetchRemoteImages(
            thumbnailUris,
            thumbnailUris.length,
            0
          );
          if (thumbnailUris.length > 0 && !isStale()) {
            const waitForDecode = new Promise<void>((resolve) => {
              thumbPrefetchDoneRef.current = resolve;
            });
            setThumbPrefetchUris(thumbnailUris.slice(0, 5));
            await Promise.race([
              waitForDecode,
              new Promise<void>((resolve) => setTimeout(resolve, 5000)),
            ]);
          }

          if (isStale()) return;

          await completeFreeScanAttempt(start.attempt, "success");
          if (isStale()) return;
          setIsAnalyzing(false);

          navigateToPossibleMatches(input, possibleMatches, {
            uploadedSoundUrls,
            uploadedImageUrls,
          });

          void (async () => {
            rescheduleInactivityNotifications().catch(() => undefined);
            const lifetimeCount = await incrementLifetimeIdentificationCount();
            if (isIdentificationMilestone(lifetimeCount)) {
              await setPendingIdentificationMilestone(lifetimeCount);
            }
          })();
        } catch (error) {
          console.error("Sound identification error:", error);
          analyticsService.logEvent(EVENTS.identify_result_fail);
          analyticsService.logEvent(EVENTS.identification_done_failure);
          analyticsService.logEvent(EVENTS.identify_result, { result: "fail" });
          await stopIdentificationTrace("failure");
          if (!isStale()) {
            setIsAnalyzing(false);
            setSoundError(classifySoundIdentifyError(error));
          }
        }
      } catch (error) {
        if (!isStale()) {
          setIsAnalyzing(false);
          setSoundError(classifySoundIdentifyError(error));
        }
      } finally {
        startingRef.current = false;
        if (activeAttempt.current) cancelFreeScanAttempt(activeAttempt.current);
        activeAttempt.current = null;
      }
    },
    [navigateToPossibleMatches, navigateToSoundNoMatch]
  );

  const cancelAnalysis = useCallback(() => {
    runIdRef.current += 1;
    setIsAnalyzing(false);
    setLoadingPhase("analyzing");
    setThumbPrefetchUris([]);
  }, []);

  const retryFromStart = useCallback(() => {
    setSoundError(null);
    if (options?.onRetrySound) {
      options.onRetrySound();
      return;
    }
    navigation.replace("SoundIdentify");
  }, [navigation, options?.onRetrySound]);

  return {
    isAnalyzing,
    loadingPhase,
    soundError,
    showUpgradeSheet,
    thumbPrefetchUris,
    thumbPrefetchDecodeWidth: POSSIBLE_MATCH_THUMBNAIL_WIDTH,
    thumbPrefetchDecodeHeight: POSSIBLE_MATCH_THUMBNAIL_HEIGHT,
    handleThumbPrefetchSettled,
    startIdentification,
    cancelAnalysis,
    retryFromStart,
    closeUpgradeSheet: () => setShowUpgradeSheet(false),
    openUpgrade: () => {
      analyticsService.logEvent(EVENTS.identification_limit_upgrade_click, {
        source: "sound_crop",
      });
      setShowUpgradeSheet(false);
      navigateToSubscriptionMain();
    },
  };
}
