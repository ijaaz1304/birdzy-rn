/**
 * User Location Map Component
 *
 * Displays a static map with marker at user's current location
 * Automatically fetches user location and displays it on a static map
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { StaticMap, StaticMapProps } from "../../molecules/StaticMap/StaticMap";
import { getCurrentLocation, LocationError } from "../../utils/locationService";
import { ensurePermission } from "../../services/permissions";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms/Text";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { TouchableOpacity } from "react-native";
export interface UserLocationMapProps
  extends Omit<StaticMapProps, "latitude" | "longitude"> {
  onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onError?: (error: LocationError) => void;
  autoFetch?: boolean; // Automatically fetch location on mount
  showRetry?: boolean; // Show retry button on error
}

export const UserLocationMap: React.FC<UserLocationMapProps> = ({
  onLocationUpdate,
  onError,
  autoFetch = true,
  showRetry = true,
  width = 400,
  height = 300,
  ...mapProps
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<LocationError | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check and request location permission first
      const hasPermission = await ensurePermission("location", true);
      if (!hasPermission) {
        const permissionError: LocationError = {
          code: 1, // PERMISSION_DENIED
          message: "Location permission denied",
        };
        setError(permissionError);
        onError?.(permissionError);
        setLoading(false);
        return;
      }

      const currentLocation = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });

      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      setLocation(locationData);
      onLocationUpdate?.(locationData);
    } catch (err) {
      const locationError = err as LocationError;
      setError(locationError);
      onError?.(locationError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <MaterialIcons name="my-location" size={32} color={colors.primary} />
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={{ marginTop: spacing[2] }}
        >
          Getting your location...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing[4],
          },
        ]}
      >
        <MaterialIcons name="location-off" size={32} color={colors.error} />
        <Text
          variant="body"
          size="small"
          color="error"
          style={{ marginTop: spacing[2], textAlign: "center" }}
        >
          {error.message || "Unable to get your location"}
        </Text>
        {showRetry && (
          <TouchableOpacity
            onPress={fetchLocation}
            style={[
              styles.retryButton,
              {
                backgroundColor: colors.primary,
                marginTop: spacing[3],
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                borderRadius: theme.radius.full,
              },
            ]}
          >
            <Text
              variant="body"
              size="small"
              color="onPrimary"
              weight="semibold"
            >
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!location) {
    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text variant="body" size="small" color="textSecondary">
          No location available
        </Text>
      </View>
    );
  }

  return (
    <StaticMap
      latitude={location.latitude}
      longitude={location.longitude}
      width={width}
      height={height}
      {...mapProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
