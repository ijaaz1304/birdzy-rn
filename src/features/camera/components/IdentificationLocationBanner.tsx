import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { Text, Toggle } from "../../../atoms";
import { APP_COLORS } from "../../../config/colors";
import { useStrings } from "../../../hooks/useStrings";
import { useIsDark, useTheme } from "../../../hooks/useTheme";
import { looksLikeCoordLabel } from "../resolveLocationAddress";

const LINK_COLOR = "#007AFF";
const CAMERA_PROMPT_LIGHT = "#E7E7E7";

export interface IdentificationLocationBannerProps {
  variant: "camera" | "gallery" | "results";
  permissionGranted: boolean;
  locationLabel?: string;
  onToggleLocation?: (enabled: boolean) => void;
  onPressLocation?: () => void;
  /** When true, shows status only — no toggle or sheet triggers. */
  readOnly?: boolean;
  /** Override the off-state prompt (e.g. sound identify copy). */
  prompt?: string;
  style?: ViewStyle;
}

export const IdentificationLocationBanner: React.FC<
  IdentificationLocationBannerProps
> = ({
  variant,
  permissionGranted,
  locationLabel,
  onToggleLocation,
  onPressLocation,
  readOnly = false,
  prompt: promptOverride,
  style,
}) => {
  const strings = useStrings();
  const theme = useTheme();
  const isDark = useIsDark();
  const copy = strings.camera.location;
  const offPrompt = promptOverride ?? copy.turnOnPrompt;
  const isCamera = variant === "camera";
  const isResults = variant === "results";
  const textSize = isCamera ? "medium" : "small";
  const promptTextStyle = useMemo(() => {
    if (isCamera && !isDark) return { color: CAMERA_PROMPT_LIGHT };
    return {
      color: isDark ? "#FFFFFF" : "#111111",
    };
  }, [isCamera, isDark]);
  const containerStyle = useMemo(() => {
    if (isCamera) return styles.cameraContainer;
    if (isResults) return styles.resultsContainer;
    return styles.galleryContainer;
  }, [isCamera, isResults]);

  if (!permissionGranted) {
    const prompt = (
      <Text
        variant="body"
        size={textSize}
        style={[
          styles.promptText,
          promptTextStyle,
          isCamera && styles.cameraPromptSize,
          variant === "gallery" && styles.galleryPromptPressableText,
        ]}
      >
        {offPrompt}
      </Text>
    );

    if (variant === "gallery") {
      return (
        <View style={[styles.row, containerStyle, style]}>
          {!readOnly && onPressLocation ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPressLocation}
              style={styles.galleryPromptPressable}
            >
              {prompt}
            </TouchableOpacity>
          ) : (
            prompt
          )}
          {!readOnly && onToggleLocation ? (
            <Toggle
              value={false}
              onToggle={onToggleLocation}
              size="medium"
            />
          ) : null}
        </View>
      );
    }

    const Container = readOnly ? View : TouchableOpacity;
    const containerProps = readOnly
      ? {}
      : {
          activeOpacity: 0.85 as const,
          onPress: () => {
            if (onPressLocation) {
              onPressLocation();
              return;
            }
            onToggleLocation?.(true);
          },
        };

    return (
      <Container
        {...containerProps}
        style={[styles.row, containerStyle, style]}
      >
        {prompt}
        {!readOnly && onToggleLocation ? (
          <Toggle
            value={false}
            onToggle={onToggleLocation}
            size="medium"
            trackColor={{
              inactive: isCamera ? "#B0B0B0" : undefined,
              active: undefined,
            }}
          />
        ) : null}
      </Container>
    );
  }

  const trimmedLabel = locationLabel?.trim();
  const isFallbackLabel = trimmedLabel === copy.setLocationFallback;
  const isCoordLabel = looksLikeCoordLabel(trimmedLabel);
  const isResolvingName =
    !trimmedLabel ||
    trimmedLabel === copy.detectingLocation ||
    isFallbackLabel;
  const displayLabel = isResolvingName ? copy.detectingLocation : trimmedLabel;

  const pendingLocationStyle = [
    styles.pendingLocation,
    { color: isDark ? theme.colors.textPrimary : LINK_COLOR },
  ];
  const locationNameStyle = [
    isResolvingName || isCoordLabel
      ? pendingLocationStyle
      : styles.locationLink,
    isCamera && styles.cameraPromptSize,
  ];

  const canPressLocation = !readOnly && !!onPressLocation;
  const locationText = (
    <Text variant="body" size={textSize} style={locationNameStyle}>
      {displayLabel}
    </Text>
  );

  return (
    <View
      style={[styles.grantedRow, styles.grantedRowLayout, containerStyle, style]}
    >
      <Text
        variant="body"
        size={textSize}
        style={[
          styles.grantedPrefix,
          promptTextStyle,
          isCamera && styles.cameraPromptSize,
        ]}
      >
        {copy.foundAtPrefix}
      </Text>
      {canPressLocation ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressLocation}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel={displayLabel}
        >
          {locationText}
        </TouchableOpacity>
      ) : (
        locationText
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  grantedRow: {
    padding: 12,
    borderRadius: 8,
  },
  grantedRowLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
  },
  grantedPrefix: {
    lineHeight: 20,
  },
  cameraContainer: {
    backgroundColor: APP_COLORS.blurOverlayWhite10,
  },
  galleryContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  resultsContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  promptText: {
    flex: 1,
    lineHeight: 20,
  },
  cameraPromptSize: {
    fontSize: 15,
    lineHeight: 22,
  },
  galleryPromptPressable: {
    flex: 1,
    flexShrink: 1,
  },
  galleryPromptPressableText: {
    flex: 0,
  },
  locationLink: {
    color: LINK_COLOR,
    textDecorationLine: "underline",
  },
  pendingLocation: {
    fontStyle: "italic",
  },
});
