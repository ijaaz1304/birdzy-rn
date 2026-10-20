import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Vertical offset from safe-area top to capture frame (below header + location banner). */
export const CAPTURE_FRAME_TOP_OFFSET = 175;
/** Figma capture frame — 335×335, 24px radius, 20px horizontal inset on 375pt width */
export const CAPTURE_FRAME_MAX_SIZE = 335;
export const CAPTURE_FRAME_RADIUS = 24;
export const CAPTURE_FRAME_CORNER_ARM = 48;
export const CAPTURE_FRAME_CORNER_STROKE = 2.5;
export const CAPTURE_FRAME_HORIZONTAL_INSET = 20;
export const CAPTURE_OVERLAY_SCRIM = "rgba(0,0,0,0.6)";

export function buildCaptureFrameCornerPaths(
  left: number,
  top: number,
  size: number,
  radius: number,
  arm: number
): string[] {
  const right = left + size;
  const bottom = top + size;

  return [
    `M ${left + arm} ${top} H ${
      left + radius
    } A ${radius} ${radius} 0 0 0 ${left} ${top + radius} V ${top + arm}`,
    `M ${right - arm} ${top} H ${
      right - radius
    } A ${radius} ${radius} 0 0 1 ${right} ${top + radius} V ${top + arm}`,
    `M ${right} ${bottom - arm} V ${
      bottom - radius
    } A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom} H ${right - arm}`,
    `M ${left} ${bottom - arm} V ${
      bottom - radius
    } A ${radius} ${radius} 0 0 0 ${left + radius} ${bottom} H ${left + arm}`,
  ];
}

/** Figma top nav icon button — back / flash */
export const CAPTURE_TOP_ICON_BUTTON_SIZE = 52;
export const CAPTURE_TOP_ICON_SIZE = 18;
/** Figma bottom gallery / tips buttons */
export const CAPTURE_SIDE_BUTTON_SIZE = 50;
export const CAPTURE_SIDE_ICON_SIZE = 26;
/** Shutter button — outer ring + inner fill with visible gap */
export const CAPTURE_SHUTTER_OUTER_SIZE = 64;
export const CAPTURE_SHUTTER_RING_BORDER = 3;
export const CAPTURE_SHUTTER_INNER_SIZE = 46;
export const CAPTURE_ZOOM_ACCENT = "#725481";
export const CAPTURE_ZOOM_UI_MAX = 5;
export const CAPTURE_ZOOM_UI_MIN = 1;

export type CaptureFrameLayout = {
  screenWidth: number;
  screenHeight: number;
  frameSize: number;
  frameLeft: number;
  frameTop: number;
  frameRadius: number;
};

export function computeCaptureFrameLayout(
  width: number,
  height: number,
  insetTop: number,
  constraints: { minimumTop?: number; bottomInset?: number } = {}
): CaptureFrameLayout {
  const frameTop = Math.max(
    insetTop + CAPTURE_FRAME_TOP_OFFSET,
    constraints.minimumTop ?? 0
  );
  const frameSize = Math.max(
    0,
    Math.min(
      CAPTURE_FRAME_MAX_SIZE,
      width - CAPTURE_FRAME_HORIZONTAL_INSET * 2,
      height - frameTop - (constraints.bottomInset ?? 0)
    )
  );
  return {
    screenWidth: width,
    screenHeight: height,
    frameSize,
    frameLeft: (width - frameSize) / 2,
    frameTop,
    frameRadius: Math.min(CAPTURE_FRAME_RADIUS, frameSize / 2),
  };
}

export function useCaptureFrameLayout(
  constraints: { minimumTop?: number; bottomInset?: number } = {}
): CaptureFrameLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { minimumTop, bottomInset } = constraints;
  return useMemo(
    () =>
      computeCaptureFrameLayout(width, height, insets.top, {
        minimumTop,
        bottomInset,
      }),
    [width, height, insets.top, minimumTop, bottomInset]
  );
}

/** Map UI zoom (1–5×) to the device zoom factor supported by VisionCamera. */
export function uiZoomToDeviceZoom(
  uiZoom: number,
  deviceMin: number,
  deviceMax: number
): number {
  const uiMin = CAPTURE_ZOOM_UI_MIN;
  const uiMax = CAPTURE_ZOOM_UI_MAX;
  const clampedUi = Math.min(uiMax, Math.max(uiMin, uiZoom));
  if (deviceMax <= deviceMin) return deviceMin;
  const t = (clampedUi - uiMin) / (uiMax - uiMin);
  return deviceMin + t * (deviceMax - deviceMin);
}
