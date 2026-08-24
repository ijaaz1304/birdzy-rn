import { Platform } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

/**
 * Explicit full-screen push for identify-flow routes.
 *
 * iOS may otherwise adopt a sheet-like presentation for a native-stack route
 * when a route is pushed or replaces a modal host. Keep the option limited to
 * navigation presentation; touch handling stays within each screen.
 */
export const IDENTIFY_FULL_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  presentation: "card",
  contentStyle: { flex: 1 },
};

/** The crop host intentionally presents native UI over the current camera page. */
export const IDENTIFY_CROP_HOST_OPTIONS: NativeStackNavigationOptions = {
  presentation:
    Platform.OS === "ios"
      ? Platform.isPad
        ? "fullScreenModal"
        : "transparentModal"
      : "containedModal",
  animation: "none",
  contentStyle: {
    flex: 1,
    backgroundColor: "#111111",
  },
  gestureEnabled: false,
};
