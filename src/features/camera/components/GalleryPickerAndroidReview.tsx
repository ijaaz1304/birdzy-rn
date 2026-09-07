import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { useStrings } from "../../../hooks/useStrings";
import { Text } from "../../../atoms";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";

type GalleryPickerAndroidReviewProps = {
  loading: boolean;
  onChoosePhoto: () => void;
};

export const GalleryPickerAndroidReview = React.memo(
  function GalleryPickerAndroidReview({
    loading,
    onChoosePhoto,
  }: GalleryPickerAndroidReviewProps) {
    const theme = useTheme();
    const strings = useStrings();
    const selected = useGalleryPickerSelectionStore((s) => s.selected);
    const thumbUri = useGalleryPickerSelectionStore((s) => s.thumbUri);

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (selected) {
      const previewUri = thumbUri ?? selected.uri;
      return (
        <View style={styles.previewHost}>
          <View
            style={[
              styles.previewFrame,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <AppImage
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <TouchableOpacity
          style={[
            styles.chooseCard,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={onChoosePhoto}
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
      </View>
    );
  }
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  chooseCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 16,
    width: "100%",
    maxWidth: 280,
  },
  previewHost: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  previewFrame: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
});
