import { AppImage } from "@/components/AppImage";
import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View, processColor } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { IdentificationLocationBanner } from "./IdentificationLocationBanner";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import { resolvePreviewImageUri } from "../camera.utils";

type GalleryPickerFooterProps = {
  bottomInset: number;
  showAndroidSystemFallback: boolean;
  androidPickerLoading: boolean;
  submitting: boolean;
  onOpenAndroidSystemPicker: () => void;
  onNext: () => void;
  /** Android embedded picker: footer below grid (not overlaid). iOS keeps overlay. */
  layout?: "overlay" | "stacked";
};

export function useGalleryAccentColor() {
  const theme = useTheme();
  return useMemo(() => {
    const value = processColor(theme.colors.primary);
    return typeof value === "number" ? value : undefined;
  }, [theme.colors.primary]);
}

export const GalleryPickerFooter = React.memo(function GalleryPickerFooter({
  bottomInset,
  showAndroidSystemFallback,
  androidPickerLoading,
  submitting,
  onOpenAndroidSystemPicker,
  onNext,
  layout = Platform.OS === "ios" ? "overlay" : "stacked",
}: GalleryPickerFooterProps) {
  const theme = useTheme();
  const selected = useGalleryPickerSelectionStore((s) => s.selected);
  const thumbUri = useGalleryPickerSelectionStore((s) => s.thumbUri);
  const setSelected = useGalleryPickerSelectionStore((s) => s.setSelected);
  const setThumbUri = useGalleryPickerSelectionStore((s) => s.setThumbUri);

  const {
    permissionGranted: locationPermissionGranted,
    locationLabel,
    openCustomLocationSheet,
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
    openCustomLocationSheet();
  };

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
        permissionGranted={locationPermissionGranted}
        locationLabel={locationLabel}
        onToggleLocation={handleLocationToggle}
        onPressLocation={openCustomLocationSheet}
      />

      {selected ? (
        <View style={styles.footerActions}>
          <View style={styles.thumbWrap}>
            <AppImage
              source={{ uri: thumbUri ?? selected.uri }}
              style={styles.thumbImage}
            />
            <TouchableOpacity
              style={styles.thumbRemove}
              onPress={() => setSelected(null)}
            >
              <MaterialIcons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {showAndroidSystemFallback ? (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={onOpenAndroidSystemPicker}
              disabled={androidPickerLoading}
            >
              <Text variant="body" size="small" color="textSecondary">
                Change photo
              </Text>
            </TouchableOpacity>
          ) : null}

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
      ) : layout === "overlay" ? (
        <View style={styles.footerSpacer} />
      ) : null}
    </View>
  );
});

/** Space reserved above home indicator for the overlay footer. */
export const GALLERY_FOOTER_RESERVE = Platform.OS === "android" ? 168 : 176;

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  footerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: GALLERY_FOOTER_RESERVE,
    zIndex: 4,
    elevation: 8,
  },
  footerStacked: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  footerSpacer: {
    height: 52,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  changePhotoButton: {
    marginLeft: "auto",
    marginRight: 4,
  },
  thumbWrap: {
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbRemove: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.3)",
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
