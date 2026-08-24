import React, { useCallback } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { useStrings } from "../../../hooks/useStrings";
import { Text } from "../../../atoms";
import { EmbeddedAndroidPhotoPicker } from "./EmbeddedAndroidPhotoPicker";
import { GalleryPhotoGrid } from "./GalleryPhotoGrid";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import type { GalleryPhoto } from "../galleryPhoto.types";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { pickImageFromGallery, resolvePreviewImageUri } from "../camera.utils";

const isIos = Platform.OS === "ios";

type SharedGridProps = {
  permissionReady: boolean;
  androidEmbeddedAvailable: boolean | null;
  androidPickerLoading: boolean;
  onOpenAndroidSystemPicker: () => void;
  accentColor?: number;
  photos: GalleryPhoto[];
  loading: boolean;
  loadingMore: boolean;
  loadMore: () => void;
};

const AndroidEmbeddedGrid = React.memo(function AndroidEmbeddedGrid({
  accentColor,
}: {
  accentColor?: number;
}) {
  const handlePhotoSelected = useCallback(
    (event: { nativeEvent: { uri: string } }) => {
      const uri = event.nativeEvent.uri;
      analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });
      // Copy content:// while picker URI permission is still valid.
      void resolvePreviewImageUri(uri)
        .then((previewUri) => {
          useGalleryPickerSelectionStore.getState().setSelected({
            id: uri,
            uri: previewUri,
          });
        })
        .catch(() => {
          useGalleryPickerSelectionStore.getState().setSelected({ id: uri, uri });
        });
    },
    []
  );

  const handlePhotoDeselected = useCallback((event: { nativeEvent: { uri: string } }) => {
    const uri = event.nativeEvent.uri;
    const current = useGalleryPickerSelectionStore.getState().selected;
    if (current?.id === uri) {
      useGalleryPickerSelectionStore.getState().setSelected(null);
    }
  }, []);

  const handleSessionError = useCallback(() => {
    // Parent handles fallback via availability state.
  }, []);

  return (
    <View style={styles.embeddedHost} pointerEvents="box-none">
      <EmbeddedAndroidPhotoPicker
        maxSelectable={1}
        accentColor={accentColor}
        onPhotoSelected={handlePhotoSelected}
        onPhotoDeselected={handlePhotoDeselected}
        onSessionError={handleSessionError}
      />
    </View>
  );
});

const GalleryPickerAndroidGrid = React.memo(function GalleryPickerAndroidGrid({
  androidEmbeddedAvailable,
  androidPickerLoading,
  onOpenAndroidSystemPicker,
  accentColor,
}: SharedGridProps) {
  const theme = useTheme();
  const strings = useStrings();

  if (androidEmbeddedAvailable === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (androidEmbeddedAvailable) {
    return <AndroidEmbeddedGrid accentColor={accentColor} />;
  }

  return (
    <View style={styles.centered}>
      {androidPickerLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <TouchableOpacity
          style={[styles.choosePhotoCard, { backgroundColor: theme.colors.surface }]}
          onPress={onOpenAndroidSystemPicker}
          activeOpacity={0.85}
        >
          <MaterialIcons
            name="photo-library"
            size={32}
            color={theme.colors.primary}
          />
          <Text variant="body" size="medium" weight="medium">
            {strings.camera.buttons.chooseFromGallery}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const GalleryPickerIosGrid = React.memo(function GalleryPickerIosGrid({
  permissionReady,
  photos,
  loading,
  loadingMore,
  loadMore,
}: SharedGridProps) {
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

export const GalleryPickerGrid = React.memo(function GalleryPickerGrid(
  props: SharedGridProps
) {
  if (isIos) {
    return <GalleryPickerIosGrid {...props} />;
  }
  return (
    <View style={styles.androidGridHost}>
      <GalleryPickerAndroidGrid {...props} />
    </View>
  );
});

export async function applyAndroidSystemPickerSelection() {
  const response = await pickImageFromGallery();
  const asset = response.assets?.[0];
  if (!asset?.uri) return;
  analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });
  const previewUri = await resolvePreviewImageUri(asset.uri);
  useGalleryPickerSelectionStore.getState().setSelected({
    id: asset.uri,
    uri: previewUri,
    width: asset.width,
    height: asset.height,
    filename: asset.fileName ?? undefined,
  });
}

const styles = StyleSheet.create({
  androidGridHost: {
    flex: 1,
    minHeight: 0,
  },
  embeddedHost: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  choosePhotoCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 16,
    width: "100%",
    maxWidth: 280,
  },
});
