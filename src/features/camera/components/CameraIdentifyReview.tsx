/**
 * Post-capture review UI for multi-photo identify (Figma 8890:124151 — 1 photo).
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { AppImage } from "@/components/AppImage";
import { Text } from "../../../atoms";
import { APP_COLORS } from "../../../config/colors";
import type { CroppedImageObject } from "../cropImageAndReturnObject";
import { CameraImageSlots } from "./CameraImageSlots";
import { MAX_CAMERA_IDENTIFY_IMAGES } from "../utils/identificationLimitDisplay";

const PREVIEW_HORIZONTAL_INSET = 20;
const PREVIEW_SIZE = 335;
const TOAST_DISMISS_MS = 3000;

type Props = {
  images: CroppedImageObject[];
  maxImages?: number;
  addAnotherLabel: string;
  identifyLabel: string;
  imageCounterLabel: (current: number, max: number) => string;
  submitToastLabel: (count: number) => string;
  isProcessing?: boolean;
  topInset?: number;
  onRemove: (index: number) => void;
  onAddAnother: () => void;
  onIdentify: () => void;
};

export const CameraIdentifyReview: React.FC<Props> = ({
  images,
  maxImages = MAX_CAMERA_IDENTIFY_IMAGES,
  addAnotherLabel,
  identifyLabel,
  imageCounterLabel,
  submitToastLabel,
  isProcessing = false,
  topInset = 122,
  onRemove,
  onAddAnother,
  onIdentify,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const previewSize = Math.min(PREVIEW_SIZE, windowWidth - PREVIEW_HORIZONTAL_INSET * 2);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, images.length - 1));
  const [showToast, setShowToast] = useState(true);

  const activeImage = images[activeIndex] ?? images[images.length - 1];

  useEffect(() => {
    setActiveIndex(Math.max(0, images.length - 1));
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), TOAST_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [images.length]);

  const canAddAnother = images.length < maxImages;

  const toastText = useMemo(
    () => submitToastLabel(images.length),
    [images.length, submitToastLabel]
  );

  if (!activeImage) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {showToast ? (
        <View style={[styles.toast, { top: topInset }]} pointerEvents="none">
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={styles.toastText}
          >
            {toastText}
          </Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.previewSection}>
          <View style={[styles.previewFrame, { width: previewSize, height: previewSize }]}>
            <AppImage
              source={{ uri: activeImage.previewUri ?? activeImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
              preferRNImage
            />
            <View style={styles.previewScrim} pointerEvents="none" />
          </View>

          <View style={styles.slotsSection}>
            <CameraImageSlots
              images={images}
              maxImages={maxImages}
              activeIndex={activeIndex}
              onRemove={onRemove}
              onSlotPress={setActiveIndex}
            />
            <Text variant="body" size="small" style={styles.counterText}>
              {imageCounterLabel(images.length, maxImages)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {canAddAnother ? (
            <Pressable
              onPress={onAddAnother}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={addAnotherLabel}
            >
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={styles.secondaryButtonText}
              >
                {addAnotherLabel}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onIdentify}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isProcessing) && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={identifyLabel}
          >
            {isProcessing ? (
              <ActivityIndicator color={APP_COLORS.modalTextOnPrimary} />
            ) : (
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={styles.primaryButtonText}
              >
                {identifyLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    backgroundColor: APP_COLORS.surfaceDark,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 20,
    backgroundColor: "#EBFFF2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  toastText: {
    color: "#22C55E",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: PREVIEW_HORIZONTAL_INSET,
    paddingTop: 72,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  previewSection: {
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
  },
  previewFrame: {
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: APP_COLORS.surfacePlaceholder,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  slotsSection: {
    alignItems: "center",
    gap: 8,
  },
  counterText: {
    color: "#888888",
  },
  actions: {
    width: "100%",
    maxWidth: PREVIEW_SIZE,
    alignSelf: "center",
    gap: 12,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APP_COLORS.cancelSecondaryBorderLight,
    backgroundColor: APP_COLORS.surfaceWhite,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: APP_COLORS.surfaceDark,
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: APP_COLORS.createButtonFg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: APP_COLORS.modalTextOnPrimary,
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
