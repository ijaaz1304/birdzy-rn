import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  checkLocationPermission,
  waitForLocationPermissionGranted,
} from "../../services/permissions";
import { resetLocationPermissionDenialCount } from "../../services/permissions/locationPermissionAttempts.service";
import { getCurrentLocation } from "../../utils/locationService";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import {
  IdentificationLocation,
  useIdentificationLocationStore,
} from "./identificationLocation.store";
import {
  hasValidDeviceCoords,
  needsBackgroundGeocode,
  needsInitialDeviceLocationFetch,
} from "./locationToggle.helpers";
import {
  formatCoords,
  resolveLocationAddress,
  shouldResolveLocationName,
} from "./resolveLocationAddress";
import { logLocationError } from "../../utils/locationDebug";

async function fetchDeviceCoords() {
  try {
    return await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10000,
    });
  } catch {
    return getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 120000,
    });
  }
}

const GPS_PERMISSION_DENIED_CODE = 1;

async function fetchDeviceCoordsWithRetry() {
  try {
    return await fetchDeviceCoords();
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== GPS_PERMISSION_DENIED_CODE) throw error;
    await new Promise((resolve) => setTimeout(resolve, 200));
    return fetchDeviceCoords();
  }
}

/** @deprecated Use locationPermissionFlow.service afterCustomPopupDismiss */
export { afterCustomPopupDismiss as runAfterSheetDismiss } from "../../services/permissions/locationPermissionFlow.service";

export function useIdentificationLocation() {
  const location = useIdentificationLocationStore((s) => s.location);
  const permissionGranted = useIdentificationLocationStore(
    (s) => s.permissionGranted
  );
  const setLocation = useIdentificationLocationStore((s) => s.setLocation);
  const setPermissionGranted = useIdentificationLocationStore(
    (s) => s.setPermissionGranted
  );
  const resolvingRef = useRef(false);
  const geocodingRef = useRef(false);
  const gpsRetryCountRef = useRef(0);
  const MAX_GPS_FETCH_RETRIES = 3;
  const GPS_FETCH_RETRY_DELAY_MS = 1500;

  const resolveAddressInBackground = useCallback(
    async (latitude: number, longitude: number) => {
      if (geocodingRef.current) return;
      geocodingRef.current = true;
      try {
        const address = await resolveLocationAddress(latitude, longitude);
        setLocation({ latitude, longitude, address });
      } catch {
        setLocation({
          latitude,
          longitude,
          address: formatCoords(latitude, longitude),
        });
      } finally {
        geocodingRef.current = false;
      }
    },
    [setLocation]
  );

  const geocodeExistingCoords = useCallback(async () => {
    const current = useIdentificationLocationStore.getState().location;
    if (!needsBackgroundGeocode(current) || !current) return;
    await resolveAddressInBackground(current.latitude, current.longitude);
  }, [resolveAddressInBackground]);

  const refreshFromDevice = useCallback(async () => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    try {
      const granted = await waitForLocationPermissionGranted();
      if (granted) {
        setPermissionGranted(true);
      } else if (!useIdentificationLocationStore.getState().permissionGranted) {
        return;
      }

      const existingBeforeFetch =
        useIdentificationLocationStore.getState().location;
      const hasCoords =
        needsInitialDeviceLocationFetch(existingBeforeFetch) === false;
      if (!hasCoords && shouldResolveLocationName(existingBeforeFetch?.address)) {
        setLocation({
          latitude: existingBeforeFetch?.latitude ?? 0,
          longitude: existingBeforeFetch?.longitude ?? 0,
          address: CAMERA_STRINGS.location.detectingLocation,
        });
      }

      const coords = await fetchDeviceCoordsWithRetry();
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: formatCoords(coords.latitude, coords.longitude),
      });
      gpsRetryCountRef.current = 0;
      void resolveAddressInBackground(coords.latitude, coords.longitude);
    } catch (error) {
      logLocationError("refreshFromDevice: failed", error);
      const permissionStillGranted =
        useIdentificationLocationStore.getState().permissionGranted ||
        (await waitForLocationPermissionGranted());

      if (
        permissionStillGranted &&
        gpsRetryCountRef.current < MAX_GPS_FETCH_RETRIES
      ) {
        gpsRetryCountRef.current += 1;
        const existing = useIdentificationLocationStore.getState().location;
        if (!hasValidDeviceCoords(existing)) {
          setLocation({
            latitude: existing?.latitude ?? 0,
            longitude: existing?.longitude ?? 0,
            address: CAMERA_STRINGS.location.detectingLocation,
          });
        }
        resolvingRef.current = false;
        setTimeout(
          () => void refreshFromDevice(),
          GPS_FETCH_RETRY_DELAY_MS * gpsRetryCountRef.current
        );
        return;
      }
      gpsRetryCountRef.current = 0;
    } finally {
      resolvingRef.current = false;
    }
  }, [resolveAddressInBackground, setLocation, setPermissionGranted]);

  const syncPermission = useCallback(async () => {
    let permission = await checkLocationPermission();
    if (!permission.granted) {
      const settled = await waitForLocationPermissionGranted();
      if (settled) {
        permission = { ...permission, granted: true, status: "granted" as any };
      }
    }

    if (permission.granted) {
      setPermissionGranted(true);
      await resetLocationPermissionDenialCount();
      const { location: currentLocation } =
        useIdentificationLocationStore.getState();
      if (needsInitialDeviceLocationFetch(currentLocation)) {
        void refreshFromDevice();
      } else if (needsBackgroundGeocode(currentLocation)) {
        void geocodeExistingCoords();
      }
      return permission;
    }

    const wasGranted =
      useIdentificationLocationStore.getState().permissionGranted;
    if (!wasGranted) {
      setPermissionGranted(false);
      return permission;
    }

    await resetLocationPermissionDenialCount();
    const settledAfterGrant = await waitForLocationPermissionGranted();
    if (settledAfterGrant) {
      setPermissionGranted(true);
      const { location: currentLocation } =
        useIdentificationLocationStore.getState();
      if (needsInitialDeviceLocationFetch(currentLocation)) {
        void refreshFromDevice();
      } else if (needsBackgroundGeocode(currentLocation)) {
        void geocodeExistingCoords();
      }
    } else {
      setPermissionGranted(false);
    }
    return permission;
  }, [geocodeExistingCoords, refreshFromDevice, setPermissionGranted]);

  useEffect(() => {
    void syncPermission();
  }, [syncPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void syncPermission();
    });
    return () => sub.remove();
  }, [syncPermission]);

  const applyManualLocation = useCallback(
    (next: IdentificationLocation) => {
      setPermissionGranted(true);
      setLocation(next);
    },
    [setLocation, setPermissionGranted]
  );

  return {
    location,
    permissionGranted,
    hasLocation: !!location?.address,
    locationLabel: location?.address ?? "",
    refreshFromDevice,
    syncPermission,
    applyManualLocation,
  };
}
