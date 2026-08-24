import { AppState, Platform } from "react-native";
import { useAppLogsStore } from "../app-logs/app-logs.store";
import { appendIdentifyFlowLog } from "./identifyFlowBuffer";

/** Production: identify flow logging disabled — dev / settings toggle only. */
export function isIdentifyFlowLoggingEnabled(): boolean {
  if (!__DEV__) return false;
  return useAppLogsStore.getState().cameraUploadLogsEnabled;
}

const flowTag = "[IdentifyFlow]";

/** Milestone logs for camera/gallery identify flows (filter on `[IdentifyFlow]`). Dev only. */
export function identifyFlowLog(
  step: string,
  detail?: Record<string, unknown>
): void {
  if (!__DEV__) return;

  const payload = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    appState: AppState.currentState,
    ...detail,
  };

  if (isIdentifyFlowLoggingEnabled()) {
    console.log(`${flowTag} ${step}`, payload);
    appendIdentifyFlowLog("info", `${flowTag} ${step}`, payload);
  }
}

export function identifyFlowError(
  code: string,
  meaning: string,
  detail?: Record<string, unknown>
): void {
  if (!__DEV__) return;

  const payload = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    appState: AppState.currentState,
    errorCode: code,
    errorMeaning: meaning,
    ...detail,
  };

  if (isIdentifyFlowLoggingEnabled()) {
    console.warn(`${flowTag} error ${code}`, meaning, payload);
    appendIdentifyFlowLog("error", `${flowTag} error ${code}`, payload);
  }
}
