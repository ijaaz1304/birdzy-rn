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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { Text } from "../../../atoms";
import { APP_COLORS } from "../../../config/colors";
import type { CroppedImageObject } from "../cropImageAndReturnObject";
import { CameraImageSlots } from "./CameraImageSlots";
import { MAX_CAMERA_IDENTIFY_IMAGES } from "../utils/identificationLimitDisplay";

const PREVIEW_HORIZONTAL_INSET = 20;
const PREVIEW_SIZE = 335;
const PREVIEW_MIN_SIZE = 160;
const TOAST_DISMISS_MS = 3000;
const TOAST_CLEARANCE = 56;
const SLOT_BLOCK_HEIGHT = 74;
const ACTIONS_BLOCK_HEIGHT = 108;
const ACTIONS_BOTTOM_GAP = 16;
const REVIEW_VERTICAL_CHROME = 16 + SLOT_BLOCK_HEIGHT + ACTIONS_BLOCK_HEIGHT;

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
  topInset = 175,
  onRemove,
  onAddAnother,
  onIdentify,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8) + ACTIONS_BOTTOM_GAP;
  const previewSize = Math.min(
    PREVIEW_SIZE,
    windowWidth - PREVIEW_HORIZONTAL_INSET * 2,
    Math.max(
      PREVIEW_MIN_SIZE,
      windowHeight - topInset - REVIEW_VERTICAL_CHROME - bottomPadding
    )
  );
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
        <View
          style={[styles.toast, { top: Math.max(12, topInset - TOAST_CLEARANCE) }]}
          pointerEvents="none"
        >
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

      <View
        style={[
          styles.content,
          { paddingTop: topInset, paddingBottom: bottomPadding },
        ]}
      >
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
    justifyContent: "space-between",
  },
  previewSection: {
    alignItems: "center",
    gap: 16,
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
    backgroundColor: APP_COLORS.ctaPrimary,
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
