/**
 * Static Map Component
 *
 * Displays a static map image with a marker at the specified location
 * Uses Google Maps Static API
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import {
  getStaticMapUrl,
  StaticMapMarker,
} from "../../utils/staticMapApi";
import { useTheme } from "../../hooks/useTheme";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { Text } from "../../atoms/Text";
import { Images } from "../../assets";
import { GOOGLE_MAPS_API_KEY } from "../../constants/env";

import { spacing } from "../../design-system/spacing";

export interface StaticMapProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "terrain" | "hybrid";
  markerColor?: string;
  markerLabel?: string;
  markers?: StaticMapMarker[]; // Multiple markers support
  onPress?: () => void;
  showError?: boolean;
  errorMessage?: string;
  style?: any;
}

export const StaticMap: React.FC<StaticMapProps> = ({
  latitude,
  longitude,
  width = 400,
  height = 300,
  zoom = 15,
  mapType = "roadmap",
  markerColor = "red",
  markerLabel,
  markers,
  onPress,
  showError = false,
  errorMessage = "Failed to load map",
  style,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentErrorMessage, setCurrentErrorMessage] =
    useState("Failed to load map");
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // Ensure dimensions are always visible (avoid 0 width/height which can hide the map)
  const effectiveWidth = Math.max(width ?? 400, 200);
  const effectiveHeight = Math.max(height ?? 300, 150);

  // Sync error message state with prop when it changes
  useEffect(() => {
    setCurrentErrorMessage(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === "") {
      setError(true);
      setCurrentErrorMessage("Google Maps API key not configured");
      setLoading(false);
      if (__DEV__) {
        console.warn(
          "⚠️ GOOGLE_MAPS_API_KEY is missing. Please add it to .env file"
        );
        console.warn(
          "   Current value:",
          GOOGLE_MAPS_API_KEY ? "Set (but empty)" : "Not set"
        );
      }
      return;
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      setError(true);
      setCurrentErrorMessage("Invalid location coordinates");
      setLoading(false);
      return;
    }

    // Reset error state when props change
    setError(false);
    setLoading(true);
    retryCountRef.current = 0;

    try {
      const url = getStaticMapUrl({
        latitude,
        longitude,
        width: effectiveWidth,
        height: effectiveHeight,
        zoom,
        mapType,
        markerColor,
        markerLabel,
        markers,
      });

      if (__DEV__) {
        console.log(
          "Generated map URL (key hidden):",
          url.replace(/key=[^&]+/, "key=***")
        );
        // Test the URL in dev mode to get better error info
        fetch(url)
          .then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                console.error("Map URL test failed:", response.status, text);
                if (text.includes("REQUEST_DENIED")) {
                  console.error(
                    "❌ API key issue: REQUEST_DENIED - Check API key and enable Static Maps API"
                  );
                } else if (text.includes("OVER_QUERY_LIMIT")) {
                  console.error("❌ API quota exceeded");
                }
              });
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.startsWith("image/")) {
              console.log("✅ Map URL is valid and returns an image");
            }
            return undefined;
          })
          .catch((err) => {
            console.error("Error testing map URL:", err);
          });
      }

      setMapUrl(url);
      // Stop loading so the Image is visible; onLoad/onError will update state
      setLoading(false);
    } catch (err: any) {
      console.error("Error generating static map URL:", err);
      setError(true);
      setCurrentErrorMessage(err?.message || "Failed to generate map URL");
      setLoading(false);
    }
  }, [
    latitude,
    longitude,
    width,
    height,
    zoom,
    mapType,
    markerColor,
    markerLabel,
    markers,
  ]);

  const handleImageError = async (error: any) => {
    console.error("Image load error:", error);

    // Try to fetch the URL to get the actual error response from Google
    if (__DEV__ && mapUrl && retryCountRef.current === 0) {
      try {
        const response = await fetch(mapUrl);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Google Maps API Error Response:", errorText);
          // Parse common error messages
          if (
            errorText.includes("REQUEST_DENIED") ||
            errorText.includes("invalid") ||
            errorText.includes("rejected")
          ) {
            console.error("❌ API key is INVALID");
            console.error("   The API key in .env file is not valid");
            console.error("   Steps to fix:");
            console.error(
              "   1. Go to: https://console.cloud.google.com/google/maps-apis/credentials"
            );
            console.error(
              "   2. Create a new API key or use an existing valid key"
            );
            console.error('   3. Enable "Maps Static API" for the key');
            console.error("   4. Update GOOGLE_MAPS_API_KEY in .env file");
            console.error(
              "   5. Restart Metro bundler with: npx react-native start --reset-cache"
            );
          } else if (errorText.includes("OVER_QUERY_LIMIT")) {
            console.error("❌ API quota exceeded");
          } else if (errorText.includes("INVALID_REQUEST")) {
            console.error("❌ Invalid request parameters");
          }
        }
      } catch (fetchError) {
        console.error("Error fetching map URL:", fetchError);
      }
    }

    // Retry logic - reload the same URL
    if (retryCountRef.current < maxRetries && mapUrl) {
      retryCountRef.current += 1;
      console.log(
        `Retrying map load (attempt ${retryCountRef.current}/${maxRetries})...`
      );
      // Retry after a short delay by forcing a re-render
      setTimeout(() => {
        setLoading(true);
        setError(false);
        // Force image reload by updating the key
        setMapUrl((prev) => (prev ? `${prev}` : null));
      }, 1000 * retryCountRef.current); // Exponential backoff
    } else {
      setError(true);
      setLoading(false);
      // Provide helpful error message
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === "") {
        setCurrentErrorMessage("API key not configured");
      } else {
        // Most common issue: Invalid API key
        setCurrentErrorMessage(
          "Invalid API key. Update .env file with a valid key."
        );
      }

      if (__DEV__ && mapUrl) {
        console.error(
          "Map URL (key hidden):",
          mapUrl.replace(/key=[^&]+/, "key=***")
        );
        console.error(
          "API Key (first 10 chars):",
          GOOGLE_MAPS_API_KEY?.substring(0, 10) + "..."
        );
        console.error("Common fixes:");
        console.error('1. Enable "Maps Static API" in Google Cloud Console');
        console.error(
          "2. Check API key restrictions (HTTP referrers, IP restrictions)"
        );
        console.error("3. Verify network connection");
        console.error("4. Check API key billing/quota status");
      }
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
    retryCountRef.current = 0; // Reset retry count on success
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSecondary,
          width: effectiveWidth,
          height: effectiveHeight,
        },
        style,
      ]}
    >
      {loading && (
        <View style={[styles.overlay, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error || showError ? (
        <View style={[styles.overlay, styles.centerContent]}>
          <AppImage
            source={
              theme.mode === "dark"
                ? Images.aiScanErrorDark
                : Images.aiScanError
            }
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="small"
            color="error"
            style={{
              marginTop: 8,
              textAlign: "center",
              paddingHorizontal: spacing[4],
            }}
          >
            {showError ? errorMessage : currentErrorMessage}
          </Text>
          {__DEV__ && (
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={{
                marginTop: 8,
                textAlign: "center",
                paddingHorizontal: spacing[4],
              }}
            >
              {!GOOGLE_MAPS_API_KEY
                ? "Add GOOGLE_MAPS_API_KEY to .env file"
                : "Check API key permissions in Google Cloud Console"}
            </Text>
          )}
        </View>
      ) : mapUrl ? (
        <AppImage
          key={`${mapUrl}-${retryCountRef.current}`} // Force re-render on retry
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_COLORS.OVERLAY_05,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});
