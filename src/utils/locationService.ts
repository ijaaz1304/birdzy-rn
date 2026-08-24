/**
 * Location Service
 *
 * Utilities for getting user's current location.
 * Requires @react-native-community/geolocation (polyfilled in index.js).
 */

import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from "@react-native-community/geolocation";
import { logLocation, logLocationError } from "./locationDebug";

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationError {
  code: number;
  message: string;
}

const GEO_ERROR_LABELS: Record<number, string> = {
  1: "PERMISSION_DENIED",
  2: "POSITION_UNAVAILABLE",
  3: "TIMEOUT",
};

/**
 * Check if location services are enabled
 */
export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    logLocation("isLocationEnabled: stub returns true (no native check wired)");
    return true;
  } catch (error) {
    logLocationError("isLocationEnabled failed", error);
    return false;
  }
};

/**
 * Request location permission
 * Returns true if permission is granted
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    logLocation(
      "requestLocationPermission: use services/permissions — Geolocation has no direct API"
    );
    return true;
  } catch (error) {
    logLocationError("requestLocationPermission failed", error);
    return false;
  }
};

/**
 * Get current user location
 * @param options - Geolocation options
 * @returns Promise with location coordinates
 */
export const getCurrentLocation = async (
  options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  } = {}
): Promise<Location> => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
  } = options;

  logLocation("getCurrentLocation: start", {
    enableHighAccuracy,
    timeout,
    maximumAge,
    geolocationAvailable: !!Geolocation,
  });

  return new Promise((resolve, reject) => {
    if (!Geolocation) {
      const err = new Error("Geolocation is not supported by this device");
      logLocationError(
        "getCurrentLocation: Geolocation module missing",
        err,
        {
          hint: "Install @react-native-community/geolocation and polyfill in index.js",
        }
      );
      reject(err);
      return;
    }

    Geolocation.getCurrentPosition(
      (position: GeolocationResponse) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };
        logLocation("getCurrentLocation: success", {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          timestamp: position.timestamp,
        });
        resolve(location);
      },
      (error: GeolocationError) => {
        const locationError: LocationError = {
          code: error.code,
          message: error.message,
        };
        logLocationError("getCurrentLocation: failed", locationError, {
          codeLabel: GEO_ERROR_LABELS[error.code] ?? "UNKNOWN",
          enableHighAccuracy,
          timeout,
        });
        reject(locationError);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
};

/**
 * Watch user location (for real-time tracking)
 * Returns a watchId that can be used with clearWatch
 */
export const watchLocation = (
  onSuccess: (location: Location) => void,
  onError?: (error: LocationError) => void,
  options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    distanceFilter?: number;
  } = {}
): number => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    distanceFilter = 10,
  } = options;

  if (!Geolocation) {
    logLocationError("watchLocation: Geolocation module missing", {
      message: "Geolocation is not supported by this device",
    });
    if (onError) {
      onError({
        code: 0,
        message: "Geolocation is not supported by this device",
      });
    }
    return -1;
  }

  logLocation("watchLocation: start", {
    enableHighAccuracy,
    timeout,
    maximumAge,
    distanceFilter,
  });

  const watchId = Geolocation.watchPosition(
    (position: GeolocationResponse) => {
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
      };
      logLocation("watchLocation: update", {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
      onSuccess(location);
    },
    (error: GeolocationError) => {
      const locationError: LocationError = {
        code: error.code,
        message: error.message,
      };
      logLocationError("watchLocation: error", locationError, {
        codeLabel: GEO_ERROR_LABELS[error.code] ?? "UNKNOWN",
      });
      if (onError) {
        onError(locationError);
      }
    },
    {
      enableHighAccuracy,
      timeout,
      maximumAge,
      distanceFilter,
    }
  );

  return watchId;
};

/**
 * Stop watching location
 */
export const clearLocationWatch = (watchId: number): void => {
  if (Geolocation && watchId !== -1) {
    logLocation("clearLocationWatch", { watchId });
    Geolocation.clearWatch(watchId);
  }
};
