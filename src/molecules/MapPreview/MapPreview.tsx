import { useWindowDimensions } from "react-native";
/**
 * MapPreview Component
 *
 * SECURITY: Replaced MapView (react-native-maps) with StaticMap.
 *
 * WHY: Google Maps SDK (MapView) is FORBIDDEN for this use case.
 * - Requires native SDK setup
 * - Higher billing costs
 * - Interactive maps not needed
 *
 * SOLUTION: Use Google Static Maps API (non-interactive image)
 * - Called directly from frontend
 * - Lower cost
 * - Simpler implementation
 * - Non-interactive (as required)
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, AppState } from "react-native";
import { MapPreviewProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import { useTheme } from "../../hooks/useTheme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { StaticMap } from "../StaticMap/StaticMap";
import {
  checkLocationPermission,
  ensurePermission,
  waitForLocationPermissionGranted,
} from "../../services/permissions";
import { getCurrentLocation } from "../../utils/locationService";
import { logLocation, logLocationError } from "../../utils/locationDebug";
import { StaticMapMarker } from "../../utils/staticMapApi";

export const MapPreview: React.FC<MapPreviewProps> = ({
  latitude,
  longitude,
  hasLocationPermission: hasLocationPermissionProp = true,
  isUserPlant = false,
  onRequestLocationPermission,
  zoom: zoomProp,
  singleMarkerOnly = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  /** Country-level map: single marker, no user location. Use zoom 3–5. */
  const isCountryMap =
    singleMarkerOnly || (zoomProp != null && zoomProp >= 3 && zoomProp <= 5);
  const effectiveZoom = zoomProp ?? 15;

  const [parentWidth, setParentWidth] = useState(0);
  const [hasLocationPermission, setHasLocationPermission] = useState(
    hasLocationPermissionProp
  );
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const checkAndGetUserLocation = useCallback(async () => {
    logLocation("MapPreview: checkAndGetUserLocation start", {
      latitude,
      longitude,
      isCountryMap,
    });
    try {
      let permissionResult = await checkLocationPermission();
      if (!permissionResult.granted) {
        const settled = await waitForLocationPermissionGranted();
        if (settled) {
          permissionResult = { ...permissionResult, granted: true };
        }
      }
      const hasPermission =
        permissionResult.granted || hasLocationPermissionProp;
      logLocation("MapPreview: permission", {
        granted: permissionResult.granted,
        status: permissionResult.status,
        hasPermission,
      });
      setHasLocationPermission(hasPermission);

      if (hasPermission) {
        try {
          const currentLocation = await getCurrentLocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          });
          logLocation("MapPreview: user location", {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
          setUserLocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
        } catch (error) {
          logLocationError("MapPreview: could not get current location", error);
        }
      }
    } catch (error) {
      logLocationError("MapPreview: permission check failed", error);
      setHasLocationPermission(hasLocationPermissionProp);
    }
  }, [hasLocationPermissionProp, isCountryMap, latitude, longitude]);

  // Check location permission and get current location only when not country map
  useEffect(() => {
    if (!isCountryMap) {
      void checkAndGetUserLocation();
    }
  }, [checkAndGetUserLocation, isCountryMap, hasLocationPermissionProp]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && !isCountryMap) {
        void checkAndGetUserLocation();
      }
    });
    return () => sub.remove();
  }, [checkAndGetUserLocation, isCountryMap]);

  const handleRequestLocationPermission = async () => {
    const granted = await ensurePermission("location", true);
    if (granted) {
      setHasLocationPermission(true);
      await checkAndGetUserLocation();
      if (onRequestLocationPermission) {
        onRequestLocationPermission();
      }
    }
  };

  // Show permission prompt only for user's own items (not for country maps)
  const showPermissionPrompt =
    !isCountryMap && isUserPlant && !hasLocationPermission;

  // Calculate responsive width (full width minus padding); ensure minimum so map always has visible size
  const screenWidth = useWindowDimensions().width;
  const mapWidth = Math.max(1, parentWidth || screenWidth - 40);

  return (
    <View
      onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}
      style={[
        styles.container,
        {
          borderColor: colors.border,
          overflow: "hidden",
        },
      ]}
    >
      <StaticMap
        latitude={latitude}
        longitude={longitude}
        width={mapWidth}
        height={200}
        zoom={effectiveZoom}
        markers={
          isCountryMap
            ? [
                {
                  latitude,
                  longitude,
                  color: "red",
                  label: undefined,
                } as StaticMapMarker,
              ]
            : [
                {
                  latitude,
                  longitude,
                  color: "red",
                  label: "P",
                } as StaticMapMarker,
                ...(userLocation
                  ? [
                      {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        color: "blue",
                        label: "U",
                      } as StaticMapMarker,
                    ]
                  : []),
              ]
        }
        style={showPermissionPrompt ? { opacity: 0.3 } : undefined}
      />

      {showPermissionPrompt && (
        <View style={[styles.overlay, StyleSheet.absoluteFill]}>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
              },
            ]}
            onPress={handleRequestLocationPermission}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="location-on"
              size={20}
              color={colors.onPrimary}
            />
            <Text
              weight="semibold"
              color="onPrimary"
              style={{ marginLeft: spacing[2] }}
            >
              Share your location
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
