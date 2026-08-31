/**
 * Two-image capture slots below the camera viewfinder (Figma 8717:62309).
 */

import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppImage } from "@/components/AppImage";
import type { CroppedImageObject } from "../cropImageAndReturnObject";

const SLOT_ACTIVE_SIZE = 48;
const SLOT_INACTIVE_SIZE = 40;
const SLOT_RADIUS = 8;
const SLOT_GAP = 16;
const ACTIVE_BORDER = "#41EDE9";

type Props = {
  images: CroppedImageObject[];
  maxImages?: number;
  onRemove?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

export const CameraImageSlots: React.FC<Props> = ({
  images,
  maxImages = 2,
  onRemove,
  style,
}) => {
  const slots = Array.from({ length: maxImages }, (_, index) => images[index]);

  return (
    <View style={[styles.row, style]}>
      {slots.map((image, index) => {
        const filled = !!image;
        const size = filled ? SLOT_ACTIVE_SIZE : SLOT_INACTIVE_SIZE;

        return (
          <Pressable
            key={`camera-slot-${index}`}
            onPress={filled ? () => onRemove?.(index) : undefined}
            disabled={!filled}
            accessibilityRole={filled ? "button" : "image"}
            accessibilityLabel={
              filled
                ? `Captured photo ${index + 1}, tap to remove`
                : `Photo slot ${index + 1}, empty`
            }
            style={[
              styles.slot,
              {
                width: size,
                height: size,
                borderWidth: filled ? 2 : 0,
                borderColor: filled ? ACTIVE_BORDER : "transparent",
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
  slot: {
    borderRadius: SLOT_RADIUS,
    backgroundColor: "rgba(246,246,246,0.2)",
    overflow: "hidden",
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
});
