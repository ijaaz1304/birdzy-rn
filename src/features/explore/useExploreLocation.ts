import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Alert, Linking, Platform } from "react-native";
import {
  checkLocationPermission,
  ensurePermission,
} from "../../services/permissions/permission.service";
import { getCurrentLocation } from "../../utils/locationService";
import { isValidCoordinate } from "@/features/explore/utils/locationCoordinates";
import type { ExploreSelectedLocation } from "./components/ExploreLocationSearchBar";

type InitialLocation = { lat: number; lng: number; label?: string };
function fromRoute(value?: InitialLocation): ExploreSelectedLocation | null {
  return value && isValidCoordinate(value.lat, value.lng)
    ? {
        latitude: value.lat,
        longitude: value.lng,
        label: value.label ?? "Selected Location",
      }
    : null;
}

export function useExploreLocation(initialLocation?: InitialLocation) {
  const [location, setLocation] = useState(() => fromRoute(initialLocation));
  const [instant, setInstant] = useState(true);
  const [isLocating, setIsLocating] = useState(!location);
  const [error, setError] = useState<string | null>(null);
  const [systemUnavailable, setSystemUnavailable] = useState(false);
  const explicitLocation = useRef(!!location);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const selectLocation = useCallback(
    (value: ExploreSelectedLocation, snap = false) => {
      if (!isValidCoordinate(value.latitude, value.longitude)) return;
      generation.current++;
      explicitLocation.current = true;
      inFlight.current = false;
      setLocation(value);
      setInstant(snap);
      setIsLocating(false);
      setError(null);
      setSystemUnavailable(false);
    },
    []
  );
  const attempt = useCallback(async () => {
    if (inFlight.current || explicitLocation.current) return;
    inFlight.current = true;
    const request = ++generation.current;
    const current = () =>
      mounted.current &&
      generation.current === request &&
      !explicitLocation.current;
    setIsLocating(true);
    setError(null);
    try {
      const permission = await checkLocationPermission();
      if (!current()) return;
      if (!permission.granted)
        throw new Error(
          "Location access is off. Search for a location above or allow access in Settings."
        );
      const device = await getCurrentLocation({
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
      });
      if (!current()) return;
      if (!isValidCoordinate(device.latitude, device.longitude))
        throw new Error("Unable to determine your location.");
      selectLocation(
        {
          latitude: device.latitude,
          longitude: device.longitude,
          label: "Current Location",
        },
        true
      );
    } catch (cause) {
      if (!current()) return;
      setSystemUnavailable((cause as { code?: number })?.code === 2);
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to determine your location. Retry or search for a location above."
      );
    } finally {
      if (mounted.current && generation.current === request) {
        inFlight.current = false;
        setIsLocating(false);
      }
    }
  }, [selectLocation]);
  const cancelPending = useCallback(() => {
    generation.current++;
    inFlight.current = false;
  }, []);
  const routeLat = initialLocation?.lat;
  const routeLng = initialLocation?.lng;
  const routeLabel = initialLocation?.label;
  useEffect(() => {
    if (routeLat == null || routeLng == null) return;
    const value = fromRoute({
      lat: routeLat,
      lng: routeLng,
      label: routeLabel,
    });
    if (value) selectLocation(value, true);
  }, [routeLat, routeLng, routeLabel, selectLocation]);
  useEffect(() => {
    mounted.current = true;
    attempt();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") attempt();
    });
    return () => {
      mounted.current = false;
      cancelPending();
      sub.remove();
    };
  }, [attempt, cancelPending]);
  return {
    location,
    instant,
    isLocating,
    error,
    systemUnavailable,
    dismissSystemUnavailable: () => setSystemUnavailable(false),
    selectLocation,
    retryLocation: async () => {
      if (await ensurePermission("location", true)) {
        if (systemUnavailable) {
          Alert.alert(
            "Device location is off",
            "Turn on device location, then retry, or search for a place above.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  (Platform.OS === "android"
                    ? Linking.sendIntent(
                        "android.settings.LOCATION_SOURCE_SETTINGS"
                      )
                    : Linking.openSettings()
                  ).catch(() => {});
                },
              },
            ]
          );
        } else await attempt();
      }
    },
  };
}
