import { Platform } from "react-native";
import type { Options } from "react-native-image-crop-picker";

/**
 * Android's native cropper (UCrop) has a fixed-width aspect-ratio bar whose labels overlap at
 * large font sizes. Above this font scale the bar is hidden; free-style corner cropping still works.
 * Font scaling itself is not restricted (responsiveness doc).
 */
const CROP_BOTTOM_BAR_MAX_FONT_SCALE = 1.2;

/** Extra native-cropper options for the user's font scale (Android only). */
export function cropperOptionsForFontScale(
  fontScale: number,
  os: typeof Platform.OS = Platform.OS
): Partial<Options> {
  return os === "android" && fontScale > CROP_BOTTOM_BAR_MAX_FONT_SCALE
    ? { hideBottomControls: true }
    : {};
}
