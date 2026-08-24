/**
 * PhotoPickerRow molecule component
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ImageSourcePropType, Modal, Dimensions, ScrollView } from "react-native";
import {
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { OVERLAY_COLORS, UI_COLORS } from "../../constants/colorConstants";
import { MushroomPhoto } from "../../types/mushroom-media.types";
import { Text } from "../../atoms/Text";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface PhotoPickerRowProps {
  photos: MushroomPhoto[];
  onChange: (photos: MushroomPhoto[]) => void;
  maxPhotos?: number;
  imageSize?: number;
  onPhotoPress?: (photo: MushroomPhoto, index: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const PhotoPickerRow: React.FC<PhotoPickerRowProps> = ({
  photos,
  onChange,
  maxPhotos = 10,
  imageSize = 72,
  onPhotoPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  const addPhoto = async () => {
    const res = await launchImageLibrary({
      mediaType: "photo" as MediaType,
      selectionLimit: 1,
      quality: 0.8,
    });

    if (res.assets?.length && res.assets[0].uri) {
      const newPhotos = [
        ...photos.filter((p) => !p.isDeleted),
        {
          uri: res.assets[0].uri,
          isNew: true,
        },
      ];

      if (newPhotos.length <= maxPhotos) {
        onChange(newPhotos);
      }
    }
  };

  const removePhoto = (index: number) => {
    const visiblePhotos = photos.filter((p) => !p.isDeleted);
    const photoToRemove = visiblePhotos[index];

    if (!photoToRemove) return;

    const updated = photos
      .map((p) => {
        if (p === photoToRemove) {
          if (p.id) {
            return { ...p, isDeleted: true };
          }
          return null; // Mark for removal if no id
        }
        return p;
      })
      .filter((p) => p !== null) as MushroomPhoto[];

    onChange(updated);
  };

  const visiblePhotos = photos.filter((p) => !p.isDeleted);
  const canAddMore = visiblePhotos.length < maxPhotos;

  const handlePhotoPress = (photo: MushroomPhoto, index: number) => {
    if (onPhotoPress) {
      onPhotoPress(photo, index);
    } else {
      setSelectedPhotoIndex(index);
    }
  };

  const replacePhoto = async (index: number) => {
    const res = await launchImageLibrary({
      mediaType: "photo" as MediaType,
      selectionLimit: 1,
      quality: 0.8,
    });

    if (res.assets?.length && res.assets[0].uri) {
      const visiblePhotos = photos.filter((p) => !p.isDeleted);
      const photoToReplace = visiblePhotos[index];

      const updated = photos.map((p) => {
        if (p === photoToReplace) {
          return {
            ...p,
            uri: res.assets![0].uri!,
            isNew: true,
          };
        }
        return p;
      });

      onChange(updated);
      setSelectedPhotoIndex(null);
    }
  };

  const selectedPhoto =
    selectedPhotoIndex !== null ? visiblePhotos[selectedPhotoIndex] : null;
  const selectedImageSource: ImageSourcePropType | null = selectedPhoto
    ? typeof selectedPhoto.uri === "string"
      ? { uri: selectedPhoto.uri }
      : selectedPhoto.uri
    : null;

  return (
    <>
      <View style={[styles.row, { gap: spacing[3] }]}>
        {visiblePhotos.map((photo, i) => {
          // Handle both string URIs and require() results
          const imageSource: ImageSourcePropType =
            typeof photo.uri === "string" ? { uri: photo.uri } : photo.uri;

          return (
            <View key={photo.id || i} style={styles.imageWrap}>
              <TouchableOpacity
                onPress={() => handlePhotoPress(photo, i)}
                activeOpacity={0.8}
              >
                <AppImage
                  source={imageSource}
                  style={[
                    styles.image,
                    {
                      width: imageSize,
                      height: imageSize,
                      borderRadius: radius.md,
                    },
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.remove,
                  {
                    backgroundColor: colors.error || UI_COLORS.BLACK,
                    borderRadius: radius.full,
                  },
                ]}
                onPress={() => removePhoto(i)}
              >
                <MaterialIcons name="close" size={16} color={UI_COLORS.WHITE} />
              </TouchableOpacity>
            </View>
          );
        })}

        {canAddMore && (
          <TouchableOpacity
            style={[
              styles.add,
              {
                width: imageSize,
                height: imageSize,
                borderRadius: radius.md,
                borderColor: colors.border,
              },
            ]}
            onPress={addPhoto}
          >
            <MaterialIcons name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Full Screen Image Modal */}
      {selectedPhotoIndex !== null && selectedImageSource && (
        <Modal
          visible={selectedPhotoIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhotoIndex(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedPhotoIndex(null)}
                style={styles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedPhotoIndex !== null) {
                      replacePhoto(selectedPhotoIndex);
                    }
                  }}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <MaterialIcons
                    name="edit"
                    size={20}
                    color={colors.onPrimary}
                  />
                  <Text
                    variant="body"
                    size="small"
                    style={{ color: colors.onPrimary, marginLeft: spacing[1] }}
                  >
                    Replace
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedPhotoIndex !== null) {
                      removePhoto(selectedPhotoIndex);
                      setSelectedPhotoIndex(null);
                    }
                  }}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.error },
                  ]}
                >
                  <MaterialIcons
                    name="delete"
                    size={20}
                    color={UI_COLORS.WHITE}
                  />
                  <Text
                    variant="body"
                    size="small"
                    style={{ color: UI_COLORS.WHITE, marginLeft: spacing[1] }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={styles.imageContainer}
            >
              <AppImage
                source={selectedImageSource}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    resizeMode: "cover",
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    padding: 2,
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  add: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.OVERLAY_95,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
});
