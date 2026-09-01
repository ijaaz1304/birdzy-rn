import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { soundIdentifyRecordingService } from "../../../services/audio/soundIdentifyRecording.service";
import {
  MAX_SOUND_RECORDING_SECONDS,
  MIN_SOUND_RECORDING_SECONDS,
  RECORDING_TIMER_INTERVAL_MS,
  meetsMinRecordingDuration,
} from "../constants/soundRecording.constants";
import { logSoundRecord } from "../utils/soundRecordLog";

export type BirdRecordingState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "paused"
  | "processing"
  | "error";

type UseBirdRecordingOptions = {
  onRecordingComplete: (
    uri: string,
    durationSec: number,
    spectrogramColumns: number[][]
  ) => void;
  onPermissionDenied?: () => void;
  onError?: (message: string) => void;
};

export function useBirdRecording({
  onRecordingComplete,
  onPermissionDenied,
  onError,
}: UseBirdRecordingOptions) {
  const [state, setState] = useState<BirdRecordingState>("idle");
  const [busy, setBusy] = useState(false);
  const [usesFallbackRecorder, setUsesFallbackRecorder] = useState(false);

  const maxDurationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const stoppingRef = useRef(false);
  const stateRef = useRef<BirdRecordingState>("idle");

  useEffect(() => {
    stateRef.current = state;
    logSoundRecord("hook state", { state });
  }, [state]);

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearInterval(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const cleanupRecording = useCallback(async () => {
    clearMaxDurationTimer();
    stoppingRef.current = false;
    if (!soundIdentifyRecordingService.isSessionActive()) {
      setUsesFallbackRecorder(false);
      return;
    }
    try {
      await soundIdentifyRecordingService.stopRecording();
    } catch {
      // best-effort release
    }
    setUsesFallbackRecorder(false);
  }, [clearMaxDurationTimer]);

  useEffect(() => {
    return () => {
      void cleanupRecording();
    };
  }, [cleanupRecording]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        const current = stateRef.current;
        if (current === "recording" || current === "paused") {
          logSoundRecord("app background — cancel recording", {
            appState: nextState,
          });
          void cleanupRecording();
          setState("idle");
        }
      }
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [cleanupRecording]);

  const startMaxDurationTimer = useCallback(
    (stopAndFinalize: () => Promise<void>) => {
      clearMaxDurationTimer();
      maxDurationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          soundIdentifyRecordingService.elapsedRecordingSeconds()
        );
        if (elapsed >= MAX_SOUND_RECORDING_SECONDS) {
          void stopAndFinalize();
        }
      }, RECORDING_TIMER_INTERVAL_MS);
    },
    [clearMaxDurationTimer]
  );

  useEffect(() => {
    if (!soundIdentifyRecordingService.isSessionActive()) return;
    logSoundRecord("hook resync — active service session");
    setUsesFallbackRecorder(
      soundIdentifyRecordingService.isFallbackRecorderActive()
    );
    if (soundIdentifyRecordingService.isPaused()) {
      setState("paused");
      return;
    }
    setState("recording");
  }, []);

  const stopAndFinalize = useCallback(async () => {
    if (stoppingRef.current) return;
    const currentElapsed = Math.floor(
      soundIdentifyRecordingService.elapsedRecordingSeconds()
    );
    if (!meetsMinRecordingDuration(currentElapsed)) {
      logSoundRecord("stop blocked — below minimum", {
        elapsedSec: currentElapsed,
      });
      return;
    }

    logSoundRecord("stopAndFinalize", { elapsedSec: currentElapsed });
    stoppingRef.current = true;
    clearMaxDurationTimer();
    setState("processing");
    setBusy(true);

    try {
      const duration = Math.round(
        soundIdentifyRecordingService.elapsedRecordingSeconds()
      );
      const spectrogramColumns =
        soundIdentifyRecordingService.getSpectrogramColumns();
      await soundIdentifyRecordingService.stopNativeCapture();
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });
      const uri = await soundIdentifyRecordingService.finalizeRecordingFile();
      onRecordingComplete(
        uri,
        Math.max(MIN_SOUND_RECORDING_SECONDS, duration),
        spectrogramColumns
      );
    } catch (error) {
      stoppingRef.current = false;
      setState("error");
      const message =
        error instanceof Error ? error.message : "Could not save recording.";
      onError?.(message);
    } finally {
      setBusy(false);
      setUsesFallbackRecorder(false);
    }
  }, [clearMaxDurationTimer, onError, onRecordingComplete]);

  useEffect(() => {
    if (state !== "recording") {
      clearMaxDurationTimer();
      return undefined;
    }
    startMaxDurationTimer(stopAndFinalize);
    return () => clearMaxDurationTimer();
  }, [clearMaxDurationTimer, startMaxDurationTimer, state, stopAndFinalize]);

  const beginRecording = useCallback(async () => {
    setState("requesting_permission");
    setBusy(true);

    try {
      await soundIdentifyRecordingService.startRecording();
      setUsesFallbackRecorder(
        soundIdentifyRecordingService.isFallbackRecorderActive()
      );
      setState("recording");
    } catch (error) {
      await soundIdentifyRecordingService.stopRecording().catch(() => undefined);
      const message =
        error instanceof Error ? error.message : "Could not start recording.";
      if (/permission/i.test(message)) {
        setState("idle");
        onPermissionDenied?.();
      } else {
        setState("error");
        onError?.(message);
      }
    } finally {
      setBusy(false);
    }
  }, [onError, onPermissionDenied]);

  const pauseRecording = useCallback(async () => {
    if (state !== "recording" || busy) return;
    try {
      await soundIdentifyRecordingService.pauseRecording();
      clearMaxDurationTimer();
      setState("paused");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not pause recording.";
      onError?.(message);
      void stopAndFinalize();
    }
  }, [busy, clearMaxDurationTimer, onError, state, stopAndFinalize]);

  const resumeRecording = useCallback(async () => {
    if (state !== "paused" || busy) return;
    try {
      await soundIdentifyRecordingService.resumeRecording();
      setState("recording");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not resume recording.";
      onError?.(message);
      void stopAndFinalize();
    }
  }, [busy, onError, state, stopAndFinalize]);

  const cancelRecording = useCallback(async () => {
    clearMaxDurationTimer();
    stoppingRef.current = false;
    setState("idle");
    setUsesFallbackRecorder(false);
    await cleanupRecording();
  }, [cleanupRecording, clearMaxDurationTimer]);

  const spectrogramActive =
    state === "recording" ||
    state === "paused" ||
    (state !== "processing" && soundIdentifyRecordingService.isSessionActive());

  return {
    state,
    busy,
    spectrogramActive,
    usesFallbackRecorder,
    minRecordingSeconds: MIN_SOUND_RECORDING_SECONDS,
    maxRecordingSeconds: MAX_SOUND_RECORDING_SECONDS,
    beginRecording,
    pauseRecording,
    resumeRecording,
    stopAndFinalize,
    cancelRecording,
    isRecording: state === "recording",
    isPaused: state === "paused",
  };
}
