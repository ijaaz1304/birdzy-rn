/**
 * Camera chrome shown while camera permission is missing (Allow access / Go to settings).
 * Figma 8558:25313 / 8558:25342 — back + flash on top; gallery, disabled shutter
 * and flip camera at the bottom. Only back and gallery are interactive.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Images } from "../../../assets";
import { APP_COLORS } from "../../../config/colors";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { NavBackIcon } from "../../../atoms";

const TOP_BUTTON_SIZE = 40;
const TOP_BAR_OFFSET = 20;
const ICON_SIZE = 24;
const SIDE_BUTTON_SIZE = 48;
const SHUTTER_SIZE = 60;
const SHUTTER_RING_WIDTH = 2;
const SHUTTER_INNER_SIZE = 44;

const BOTTOM_BAR_PADDING_TOP = 16;
const CONTROLS_PADDING_TOP = 16;
const CONTROLS_PADDING_BOTTOM = 32;
const MIN_BOTTOM_PADDING = 8;

const bottomBarPaddingBottom = (bottomInset: number) =>
  Math.max(MIN_BOTTOM_PADDING, bottomInset);

/** Bounds of the interactive chrome; use these as scrolling viewport insets. */
export const getCameraPermissionGateContentInsets = (
  topInset: number,
  bottomInset: number
) => ({
  top: topInset + TOP_BAR_OFFSET + TOP_BUTTON_SIZE,
  bottom:
    BOTTOM_BAR_PADDING_TOP +
    CONTROLS_PADDING_TOP +
    SHUTTER_SIZE +
    CONTROLS_PADDING_BOTTOM +
    bottomBarPaddingBottom(bottomInset),
});

type CameraPermissionGateChromeProps = {
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onGallery: () => void;
  galleryDisabled?: boolean;
};

export const CameraPermissionGateChrome: React.FC<
  CameraPermissionGateChromeProps
> = ({ topInset, bottomInset, onBack, onGallery, galleryDisabled = false }) => (
  <>
    <View
      style={[styles.topBar, { top: topInset + TOP_BAR_OFFSET }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.topButton}
        activeOpacity={0.8}
        hitSlop={HIT_SLOP.CLOSE}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <NavBackIcon color={APP_COLORS.surfaceWhite} size={ICON_SIZE} />
      </TouchableOpacity>

      <View
        style={styles.topButton}
        accessibilityRole="button"
        accessibilityLabel="Flash"
        accessibilityState={{ disabled: true }}
      >
        <AppImage
          source={Images.iconfixFlash}
          style={styles.icon}
          resizeMode="contain"
          preferRNImage
        />
      </View>
    </View>

    <View
      style={[
        styles.bottomBar,
        { paddingBottom: bottomBarPaddingBottom(bottomInset) },
      ]}
    >
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onGallery}
          disabled={galleryDisabled}
          style={galleryDisabled && styles.disabled}
          activeOpacity={0.8}
          hitSlop={HIT_SLOP.CLOSE}
          accessibilityRole="button"
          accessibilityLabel="Upload from gallery"
          accessibilityState={{ disabled: galleryDisabled }}
        >
          {/* Upload asset includes its own 10% white circle. */}
          <AppImage
            source={Images.iconfixUpload}
            style={styles.galleryIcon}
            resizeMode="contain"
            preferRNImage
          />
        </TouchableOpacity>

        <View
          style={styles.shutterRing}
          accessibilityRole="button"
          accessibilityLabel="Capture photo"
          accessibilityState={{ disabled: true }}
        >
          <View style={styles.shutterFill} />
        </View>

        <View
          style={styles.sideButton}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
          accessibilityState={{ disabled: true }}
        >
          <AppImage
            source={Images.iconfixCameraRepeat}
            style={styles.icon}
            resizeMode="contain"
            preferRNImage
          />
        </View>
      </View>
    </View>
  </>
);

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
  },
  topButton: {
    width: TOP_BUTTON_SIZE,
    height: TOP_BUTTON_SIZE,
    borderRadius: TOP_BUTTON_SIZE / 2,
    backgroundColor: APP_COLORS.blurOverlayWhite10,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    tintColor: APP_COLORS.surfaceWhite,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: BOTTOM_BAR_PADDING_TOP,
    backgroundColor: APP_COLORS.cameraPermissionSurface,
    zIndex: 20,
    elevation: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: CONTROLS_PADDING_TOP,
    paddingBottom: CONTROLS_PADDING_BOTTOM,
    paddingHorizontal: 20,
  },
  galleryIcon: {
    width: SIDE_BUTTON_SIZE,
    height: SIDE_BUTTON_SIZE,
  },
  sideButton: {
    width: SIDE_BUTTON_SIZE,
    height: SIDE_BUTTON_SIZE,
    borderRadius: SIDE_BUTTON_SIZE / 2,
    backgroundColor: APP_COLORS.blurOverlayWhite10,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterRing: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: SHUTTER_RING_WIDTH,
    borderColor: APP_COLORS.borderGray,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterFill: {
    width: SHUTTER_INNER_SIZE,
    height: SHUTTER_INNER_SIZE,
    borderRadius: SHUTTER_INNER_SIZE / 2,
    backgroundColor: APP_COLORS.borderGray,
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
