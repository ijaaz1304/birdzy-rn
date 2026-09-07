/**
 * Two-image capture slots (Figma 8890:124162 / 8717:62309).
 * Filled thumbnails are 40px; the next empty slot is 48px with a cyan border.
 */

import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppImage } from "@/components/AppImage";
import type { CroppedImageObject } from "../cropImageAndReturnObject";
import { APP_COLORS } from "../../../config/colors";

const SLOT_FILLED_SIZE = 40;
const SLOT_EMPTY_SIZE = 48;
const SLOT_RADIUS = 8;
const SLOT_GAP = 16;
const ACTIVE_BORDER = "#41EDE9";

type Props = {
  images: CroppedImageObject[];
  maxImages?: number;
  activeIndex?: number;
  onRemove?: (index: number) => void;
  onSlotPress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

export const CameraImageSlots: React.FC<Props> = ({
  images,
  maxImages = 2,
  activeIndex,
  onRemove,
  onSlotPress,
  style,
}) => {
  const slots = Array.from({ length: maxImages }, (_, index) => images[index]);
  const resolvedActiveIndex =
    activeIndex ?? Math.max(0, Math.min(images.length - 1, images.length - 1));

  return (
    <View style={[styles.row, style]}>
      {slots.map((image, index) => {
        const filled = !!image;
        const isNextEmpty = !filled && index === images.length;
        const size = filled
          ? SLOT_FILLED_SIZE
          : isNextEmpty
            ? SLOT_EMPTY_SIZE
            : SLOT_FILLED_SIZE;
        const isActive = filled && index === resolvedActiveIndex;

        return (
          <Pressable
            key={`camera-slot-${index}`}
            onPress={() => {
              if (filled) {
                onSlotPress?.(index);
              }
            }}
            disabled={!filled}
            accessibilityRole={filled ? "button" : "image"}
            accessibilityLabel={
              filled
                ? `Photo ${index + 1}${isActive ? ", selected" : ""}`
                : `Photo slot ${index + 1}, empty`
            }
            style={[
              styles.slotWrap,
              {
                width: size,
                height: isNextEmpty ? SLOT_EMPTY_SIZE : size,
              },
            ]}
          >
            <View
              style={[
                styles.slot,
                {
                  width: size,
                  height: size,
                  borderWidth: isNextEmpty ? 2 : 0,
                  borderColor: isNextEmpty ? ACTIVE_BORDER : "transparent",
                },
              ]}
            >
              {filled ? (
                <AppImage
                  source={{ uri: image.previewUri ?? image.uri }}
                  style={styles.slotImage}
                  resizeMode="cover"
                />
              ) : null}
            </View>
            {filled ? (
              <Pressable
                onPress={() => onRemove?.(index)}
                style={styles.removeBadge}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}
              >
                <MaterialIcons
                  name="close"
                  size={10}
                  color={APP_COLORS.textPrimaryDark}
                />
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SLOT_GAP,
  },
  slotWrap: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  slot: {
    borderRadius: SLOT_RADIUS,
    backgroundColor: "rgba(246,246,246,0.2)",
    overflow: "hidden",
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
  removeBadge: {
    position: "absolute",
    top: -5,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 24,
    backgroundColor: APP_COLORS.surfaceAuthLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
});
