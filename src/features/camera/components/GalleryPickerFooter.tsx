import { AppImage } from "@/components/AppImage";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { IdentificationLocationBanner } from "./IdentificationLocationBanner";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import { resolvePreviewImageUri } from "../camera.utils";

type GalleryPickerFooterProps = {
  bottomInset: number;
  submitting: boolean;
  onNext: () => void;
  layout?: "overlay" | "stacked";
};

export const GalleryPickerFooter = React.memo(function GalleryPickerFooter({
  bottomInset,
  submitting,
  onNext,
  layout = "overlay",
}: GalleryPickerFooterProps) {
  const theme = useTheme();
  const selected = useGalleryPickerSelectionStore((s) => s.selected);
  const thumbUri = useGalleryPickerSelectionStore((s) => s.thumbUri);
  const setSelected = useGalleryPickerSelectionStore((s) => s.setSelected);
  const setThumbUri = useGalleryPickerSelectionStore((s) => s.setThumbUri);

  const {
    location,
    permissionGranted: locationPermissionGranted,
    locationLabel,
    openCustomLocationSheet,
    promptForLocation,
    refreshFromDevice,
    hasExistingLocation,
  } = useLocationToggleFlow();

  useEffect(() => {
    if (!selected?.uri) {
      setThumbUri(null);
      return;
    }
    if (selected.uri.startsWith("file://")) {
      setThumbUri(selected.uri);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void resolvePreviewImageUri(selected.uri)
        .then((uri) => {
          if (!cancelled) setThumbUri(uri);
        })
        .catch(() => {
          if (!cancelled) setThumbUri(selected.uri);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selected?.id, selected?.uri, setThumbUri]);

  const handleLocationToggle = (enabled: boolean) => {
    if (!enabled) return;
    if (Platform.OS === "ios") {
      openCustomLocationSheet();
      return;
    }
    if (locationPermissionGranted) {
      void refreshFromDevice();
      return;
    }
    void promptForLocation();
  };

  const handlePressLocation = () => {
    if (Platform.OS === "ios") {
      openCustomLocationSheet();
      return;
    }
    if (locationPermissionGranted || hasExistingLocation) {
      openCustomLocationSheet();
      return;
    }
    void promptForLocation();
  };

  const bannerGranted =
    Platform.OS === "android"
      ? shouldShowLocationBannerAsGranted(
          locationPermissionGranted,
          location
        )
      : locationPermissionGranted;

  const isStacked = layout === "stacked";

  return (
    <View
      style={[
        styles.footer,
        isStacked ? styles.footerStacked : styles.footerOverlay,
        {
          backgroundColor: theme.colors.surfacePrimary,
          paddingBottom: bottomInset,
        },
      ]}
      pointerEvents="box-none"
    >
      <IdentificationLocationBanner
        variant="gallery"
        permissionGranted={bannerGranted}
        locationLabel={locationLabel}
        onToggleLocation={handleLocationToggle}
        onPressLocation={handlePressLocation}
      />

      {selected ? (
        <View style={styles.footerActions}>
          <View style={styles.thumbWrap}>
            <View style={styles.thumbImageClip}>
              <AppImage
                source={{ uri: thumbUri ?? selected.uri }}
                style={styles.thumbImage}
              />
            </View>
            <TouchableOpacity
              style={styles.thumbRemove}
              onPress={() => setSelected(null)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialIcons name="close" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={onNext}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={styles.nextText}
              >
                Next
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
});

/** Space reserved above home indicator for the overlay footer. */
export const GALLERY_FOOTER_RESERVE = 118;

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  footerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    elevation: 12,
  },
  footerStacked: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    overflow: "visible",
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "visible",
  },
  thumbImageClip: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbRemove: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(17,17,17,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    width: 100,
    height: 32,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  nextText: {
    color: "#FFFFFF",
  },
});
