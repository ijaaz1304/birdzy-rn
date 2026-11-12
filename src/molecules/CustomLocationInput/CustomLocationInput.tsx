/**
 * Custom Location Input
 * Editable location input with map preview
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Images } from "../../assets";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";
import { Text } from "../../atoms";
import { StaticMap } from "../StaticMap/StaticMap";
import { useStrings } from "../../hooks/useStrings";
import {
  checkLocationPermission,
  ensurePermission,
} from "../../services/permissions";
import { getCurrentLocation } from "../../utils/locationService";
import { StaticMapMarker } from "../../utils/staticMapApi";

import { SCREEN_COLORS } from "../../constants/colorConstants";

import { spacing } from "../../design-system/spacing";

import { APP_COLORS } from "../../config/colors";

export interface CustomLocationInputProps {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  onEdit?: () => void;
  editable?: boolean;
  /** When false, only the address input is shown (no static map). Default true. */
  showMap?: boolean;
}

export const CustomLocationInput: React.FC<CustomLocationInputProps> = ({
  location,
  onLocationChange,
  onEdit,
  editable = true,
  showMap = true,
}) => {
  const [mapWidth, setMapWidth] = React.useState(0);
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const isDark = theme.mode === "dark";
  /** Input bg: #FFF light / #111 dark to match Edit screen */
  const inputBg = isDark
    ? APP_COLORS.surfaceDark
    : APP_COLORS.modalTextOnPrimary;
  const inputBorderColor = isDark
    ? SCREEN_COLORS.DARK.border
    : SCREEN_COLORS.LIGHT.border;

  const [address, setAddress] = useState(location?.address || "");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(location || null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Update address when location prop changes
  useEffect(() => {
    if (location?.address) {
      setAddress(location.address);
    }
    if (location) {
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location]);

  // Check location permission and get current location
  useEffect(() => {
    checkAndGetUserLocation();
  }, []);

  const checkAndGetUserLocation = async () => {
    try {
      const permissionResult = await checkLocationPermission();
      setHasLocationPermission(permissionResult.granted);

      if (permissionResult.granted) {
        try {
          const currentLocation = await getCurrentLocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          });
          setUserLocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
        } catch (error) {
          console.log("Could not get current location:", error);
        }
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const handleRequestLocationPermission = async () => {
    const granted = await ensurePermission("location", true);
    if (granted) {
      setHasLocationPermission(true);
      await checkAndGetUserLocation();
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const permissionResult = await checkLocationPermission();
      if (!permissionResult.granted) {
        const granted = await ensurePermission("location", true);
        if (!granted) return;
      }

      const currentLoc = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });

      setCurrentLocation({
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
      });
      setUserLocation({
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
      });

      // Update parent component
      if (onLocationChange) {
        onLocationChange({
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          address:
            address ||
            `Lat: ${currentLoc.latitude.toFixed(
              4
            )}, Lng: ${currentLoc.longitude.toFixed(4)}`,
        });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  if (!location) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.md,
            padding: spacing[4],
          },
        ]}
      >
        <MaterialIcons
          name="location-off"
          size={32}
          color={colors.textTertiary}
        />
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.emptyText}
        >
          {strings.collection?.legacyDetailSections?.location?.noLocation ||
            "No location set"}
        </Text>
        {editable && (
          <TouchableOpacity
            onPress={onEdit}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                padding: spacing[2],
                marginTop: spacing[2],
              },
            ]}
          >
            <Text
              variant="body"
              size="small"
              weight="semibold"
              style={{ color: colors.onPrimary }}
            >
              {strings.collection?.legacyDetailSections?.location
                ?.addLocation || "Add Location"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          variant="label"
          size="small"
          style={{ color: colors.textSecondary }}
        >
          {strings.collection?.legacyDetailSections?.location?.title ||
            "Custom Location"}
        </Text>
        {editable && (
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          />
        )}
      </View>

      {editable ? (
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: inputBg,
              borderRadius: INPUT_BORDER_RADIUS,
              borderColor: inputBorderColor,
              borderWidth: 1,
              marginBottom: spacing[2],
              paddingLeft: spacing[3],
            },
          ]}
        >
          <AppImage
            source={Images.locationEdit}
            style={styles.locationEditIcon}
            resizeMode="contain"
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "transparent",
                color: colors.textPrimary,
                paddingVertical: spacing[3],
                flex: 1,
              },
            ]}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (onLocationChange && location) {
                onLocationChange({
                  ...location,
                  address: text,
                });
              }
            }}
            onSubmitEditing={() => {
              if (onLocationChange && location) {
                onLocationChange({
                  ...location,
                  address: address,
                });
              }
            }}
            placeholder={
              strings.collection?.legacyDetailSections?.location?.placeholder ||
              "Enter location address"
            }
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      ) : (
        address && (
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.addressText}
          >
            {address}
          </Text>
        )
      )}

      {showMap && (
        <View
          style={styles.mapContainer}
          onLayout={(event) =>
            setMapWidth(Math.max(1, event.nativeEvent.layout.width))
          }
        >
          {mapWidth > 0 && (
            <StaticMap
              latitude={currentLocation?.latitude || location.latitude}
              longitude={currentLocation?.longitude || location.longitude}
              width={mapWidth}
              height={200}
              zoom={15}
              markers={[
                // Location marker (red)
                {
                  latitude: currentLocation?.latitude || location.latitude,
                  longitude: currentLocation?.longitude || location.longitude,
                  color: "red",
                  label: "M",
                },
                // User current location marker (blue) - if available and different
                ...(userLocation &&
                (userLocation.latitude !==
                  (currentLocation?.latitude || location.latitude) ||
                  userLocation.longitude !==
                    (currentLocation?.longitude || location.longitude))
                  ? [
                      {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        color: "blue",
                        label: "U",
                      } as StaticMapMarker,
                    ]
                  : []),
              ]}
              style={styles.map}
            />
          )}

          {/* Button in top right to use current location */}
          {editable && (
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              style={[
                styles.locationButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  position: "absolute",
                  top: 12,
                  right: 12,
                },
              ]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="my-location"
                size={16}
                color={colors.onPrimary}
              />
              <Text
                variant="body"
                size="small"
                weight="semibold"
                style={{ color: colors.onPrimary, marginLeft: spacing[1] }}
              >
                Use Current Location
              </Text>
            </TouchableOpacity>
          )}
          {!hasLocationPermission && !editable && (
            <TouchableOpacity
              onPress={handleRequestLocationPermission}
              style={[
                styles.locationButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                },
              ]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="my-location"
                size={16}
                color={colors.onPrimary}
              />
              <Text
                variant="body"
                size="small"
                weight="semibold"
                style={{ color: colors.onPrimary, marginLeft: spacing[1] }}
              >
                Show my location
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

/** Single-line input border radius to match Edit screen */
const INPUT_BORDER_RADIUS = 30;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  editButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationEditIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    fontSize: 14,
  },
  addressText: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  emptyText: {
    marginTop: 12,
    textAlign: "center",
  },
  addButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: 8,
  },
  mapContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  map: {
    width: "100%",
  },
  locationButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
