import React, { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { GalleryPhotoGrid } from "./GalleryPhotoGrid";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import type { GalleryPhoto } from "../galleryPhoto.types";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";

type GalleryPickerGridProps = {
  permissionReady: boolean;
  permissionResolving?: boolean;
  photos: GalleryPhoto[];
  loading: boolean;
  loadingMore: boolean;
  loadMore: () => void;
};

export const GalleryPickerGrid = React.memo(function GalleryPickerGrid({
  permissionReady,
  photos,
  loading,
  loadingMore,
  loadMore,
}: GalleryPickerGridProps) {
  const theme = useTheme();
  const selectedId = useGalleryPickerSelectionStore(
    (s) => s.selected?.id ?? null
  );
  const setSelected = useGalleryPickerSelectionStore((s) => s.setSelected);

  const handleSelectPhoto = useCallback(
    (photo: GalleryPhoto) => {
      const current = useGalleryPickerSelectionStore.getState().selected;
      const next = current?.id === photo.id ? null : photo;
      analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });
      setSelected(next);
    },
    [setSelected]
  );

  if (!permissionReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GalleryPhotoGrid
      photos={photos}
      selectedId={selectedId}
      onSelect={handleSelectPhoto}
      onEndReached={loadMore}
      loading={loading}
      loadingMore={loadingMore}
    />
  );
});

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
