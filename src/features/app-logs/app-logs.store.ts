/**
 * App logs store using Zustand
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  clearIdentifyFlowLogs,
  getIdentifyFlowLogs,
} from "../camera/identifyFlowBuffer";

/** Persisted user preference for capturing in-app diagnostic logs. */
export const APP_LOGS_ENABLED_STORAGE_KEY = "app_logs_collection_enabled";

/** Camera capture + gallery upload identify flow logs (`[IdentifyFlow]`). */
export const APP_LOGS_CAMERA_UPLOAD_ENABLED_KEY =
  "app_logs_camera_upload_enabled";

/** Prod builds auto-enable log capture unless the user turned it off in Settings. */
const APP_LOGS_PROD_AUTO_ENABLED_KEY = "app_logs_prod_auto_enabled_v1";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AppLogsState {
  logs: AppLog[];
  maxLogs: number;
  isEnabled: boolean;
  cameraUploadLogsEnabled: boolean;

  // Actions
  log: (
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ) => void;
  debug: (message: string, metadata?: Record<string, any>) => void;
  info: (message: string, metadata?: Record<string, any>) => void;
  warn: (message: string, metadata?: Record<string, any>) => void;
  error: (message: string, metadata?: Record<string, any>) => void;
  clear: () => void;
  setEnabled: (enabled: boolean) => void;
  setCameraUploadLogsEnabled: (enabled: boolean) => void;
  exportLogs: () => string;
  getAllLogsForDisplay: () => AppLog[];
}

/** App Logs available in dev and production (Settings → Diagnostics). */
export function isAppLogsFeatureEnabled(): boolean {
  return true;
}

/** @deprecated Use isIdentifyFlowLoggingEnabled from identifyFlowLog.ts */
export function isCameraUploadLoggingEnabled(): boolean {
  return useAppLogsStore.getState().cameraUploadLogsEnabled;
}

function mergeLogsForExport(storeLogs: AppLog[]): AppLog[] {
  const identify = getIdentifyFlowLogs() as AppLog[];
  return [...storeLogs, ...identify].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp)
  );
}

export const useAppLogsStore = create<AppLogsState>((set, get) => ({
  logs: [],
  maxLogs: 1000,
  isEnabled: false,
  cameraUploadLogsEnabled: __DEV__,

  log: (level: LogLevel, message: string, metadata?: Record<string, any>) => {
    const { isEnabled, maxLogs } = get();
    if (!isAppLogsFeatureEnabled() || !isEnabled) return;

    const logEntry: AppLog = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    set((state) => ({
      logs: [...state.logs, logEntry].slice(-maxLogs),
    }));

    if (__DEV__) {
      const consoleMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : level === "info"
          ? console.info
          : console.log;
      consoleMethod(
        `[AppLogs][${level.toUpperCase()}]`,
        message,
        metadata ?? ""
      );
    } else if (level === "error" || level === "warn") {
      console.warn(`[AppLogs][${level.toUpperCase()}]`, message);
    }
  },

  debug: (message: string, metadata?: Record<string, any>) => {
    get().log("debug", message, metadata);
  },

  info: (message: string, metadata?: Record<string, any>) => {
    get().log("info", message, metadata);
  },

  warn: (message: string, metadata?: Record<string, any>) => {
    get().log("warn", message, metadata);
  },

  error: (message: string, metadata?: Record<string, any>) => {
    get().log("error", message, metadata);
  },

  clear: () => {
    clearIdentifyFlowLogs();
    set({ logs: [] });
  },

  setEnabled: (enabled: boolean) => {
    if (!isAppLogsFeatureEnabled()) {
      set({ isEnabled: false });
      return;
    }
    set({ isEnabled: enabled });
    AsyncStorage.setItem(
      APP_LOGS_ENABLED_STORAGE_KEY,
      enabled ? "true" : "false"
    ).catch(() => {
      /* ignore */
    });
  },

  setCameraUploadLogsEnabled: (enabled: boolean) => {
    set({ cameraUploadLogsEnabled: enabled });
    AsyncStorage.setItem(
      APP_LOGS_CAMERA_UPLOAD_ENABLED_KEY,
      enabled ? "true" : "false"
    ).catch(() => {
      /* ignore */
    });
  },

  exportLogs: () => {
    return JSON.stringify(mergeLogsForExport(get().logs), null, 2);
  },

  getAllLogsForDisplay: () => mergeLogsForExport(get().logs),
}));

/**
 * Apply persisted preferences. Production auto-enables log capture on first launch.
 */
export async function hydrateAppLogsFromStorage(): Promise<void> {
  if (!isAppLogsFeatureEnabled()) {
    useAppLogsStore.setState({
      isEnabled: false,
      cameraUploadLogsEnabled: false,
    });
    return;
  }
  try {
    const [master, cameraUpload, prodAutoEnabled] = await Promise.all([
      AsyncStorage.getItem(APP_LOGS_ENABLED_STORAGE_KEY),
      AsyncStorage.getItem(APP_LOGS_CAMERA_UPLOAD_ENABLED_KEY),
      AsyncStorage.getItem(APP_LOGS_PROD_AUTO_ENABLED_KEY),
    ]);

    const shouldAutoEnableProd = !__DEV__ && prodAutoEnabled !== "true";
    const isEnabled =
      master === "true" || (master !== "false" && shouldAutoEnableProd);

    if (shouldAutoEnableProd && isEnabled) {
      await AsyncStorage.multiSet([
        [APP_LOGS_ENABLED_STORAGE_KEY, "true"],
        [APP_LOGS_PROD_AUTO_ENABLED_KEY, "true"],
      ]);
    }

    useAppLogsStore.setState({
      isEnabled,
      cameraUploadLogsEnabled: cameraUpload !== "false",
    });

    if (isEnabled) {
      useAppLogsStore
        .getState()
        .info("[AppLogs] Diagnostic logging enabled", {
          buildMode: __DEV__ ? "debug" : "release",
          autoEnabledProd: shouldAutoEnableProd,
        });
    }
  } catch {
    useAppLogsStore.setState({
      isEnabled: !__DEV__ ? true : false,
      cameraUploadLogsEnabled: __DEV__,
    });
  }
}

/** Reconcile capture toggle after Remote Config fetch/refresh. */
export async function syncAppLogsWithRemoteConfig(): Promise<void> {
  if (!isAppLogsFeatureEnabled()) return;
  await hydrateAppLogsFromStorage();
}
