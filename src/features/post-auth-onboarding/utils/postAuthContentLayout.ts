import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { isTabletDevice } from "@/utils/tabletLayout";
import { POST_AUTH_LAYOUT } from "../constants";

/** Max content column width on tablet — keeps phone-proportioned subscription UI. */
export const POST_AUTH_PHONE_MAX_WIDTH = 390;

export type PostAuthContentLayout = {
  windowWidth: number;
  windowHeight: number;
  isWideScreen: boolean;
  /** Inner content width (inside horizontal padding). */
  contentWidth: number;
  horizontalPadding: number;
};

export function getPostAuthContentLayout(
  windowWidth: number,
  windowHeight: number
): PostAuthContentLayout {
  const horizontalPadding = POST_AUTH_LAYOUT.horizontalPadding;
  const phoneContentWidth = Math.max(
    windowWidth - horizontalPadding * 2,
    0
  );
  const isWideScreen = isTabletDevice(windowWidth, windowHeight);
  const contentWidth = isWideScreen
    ? Math.min(POST_AUTH_PHONE_MAX_WIDTH, phoneContentWidth)
    : phoneContentWidth;

  return {
    windowWidth,
    windowHeight,
    isWideScreen,
    contentWidth,
    horizontalPadding,
  };
}

export function usePostAuthContentLayout(): PostAuthContentLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(
    () => getPostAuthContentLayout(width, height),
    [width, height]
  );
}
