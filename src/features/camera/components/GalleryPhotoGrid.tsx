import React, { memo, useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { AppImage } from "@/components/AppImage";
import { Text } from "../../../atoms";
import type { GalleryPhoto } from "../galleryPhoto.types";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";

const COLUMNS = 3;
const GAP = 2;
const SELECTED_BORDER = "#402122";

type GalleryPhotoGridProps = {
  photos: GalleryPhoto[];
  selectedId: string | null;
  onSelect: (photo: GalleryPhoto) => void;
  onEndReached: () => void;
  loading: boolean;
  loadingMore: boolean;
};

type GalleryPhotoCellProps = {
  item: GalleryPhoto;
  itemSize: number;
  onSelect: (photo: GalleryPhoto) => void;
};

const GalleryPhotoCell = memo(function GalleryPhotoCell({
  item,
  itemSize,
  onSelect,
}: GalleryPhotoCellProps) {
  const selected = useGalleryPickerSelectionStore(
    (s) => s.selected?.id === item.id
  );
  const imageSource = useMemo(
    () => ({
      uri: item.uri,
      width: itemSize,
      height: itemSize,
    }),
    [item.uri, itemSize]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(item)}
      style={[
        styles.cell,
        {
          width: itemSize,
          height: itemSize,
          marginBottom: GAP,
        },
        selected && styles.cellSelected,
      ]}
    >
      <AppImage
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
        preferRNImage
      />
      {!selected ? <View style={styles.dimOverlay} /> : null}
      <View
        style={[
          styles.badge,
          selected ? styles.badgeSelected : styles.badgeEmpty,
        ]}
      >
        {selected ? (
          <Text variant="label" size="small" style={styles.badgeText}>
            1
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

export const GalleryPhotoGrid: React.FC<GalleryPhotoGridProps> = ({
  photos,
  onSelect,
  onEndReached,
  loading,
  loadingMore,
}) => {
  const { width } = useWindowDimensions();
  const itemSize = useMemo(
    () => Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS),
    [width]
  );
  const rowHeight = itemSize + GAP;

  const renderItem = useCallback(
    ({ item }: { item: GalleryPhoto }) => (
      <GalleryPhotoCell item={item} itemSize={itemSize} onSelect={onSelect} />
    ),
    [itemSize, onSelect]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => {
      const row = Math.floor(index / COLUMNS);
      return {
        length: rowHeight,
        offset: rowHeight * row,
        index,
      };
    },
    [rowHeight]
  );

  if (loading && photos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="body" size="medium" color="textSecondary">
          No photos found
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      renderItem={renderItem}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      removeClippedSubviews={Platform.OS === "android"}
      initialNumToRender={21}
      maxToRenderPerBatch={9}
      windowSize={9}
      updateCellsBatchingPeriod={50}
      getItemLayout={getItemLayout}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 8,
  },
  row: {
    gap: GAP,
  },
  cell: {
    overflow: "hidden",
    position: "relative",
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: SELECTED_BORDER,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,17,17,0.3)",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSelected: {
    backgroundColor: SELECTED_BORDER,
  },
  badgeEmpty: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
