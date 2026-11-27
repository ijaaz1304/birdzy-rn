import React, { useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import FastImage from "react-native-fast-image";
import { forgetExplorePhoto } from "../services/exploreImages";

type Props = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Paint at this size when the parent already knows it. */
  width?: number;
  height?: number;
};

/**
 * Bird photo for the scrollable cards under the map.
 * Uses the native FastImage cache, with a pixel size so the image
 * paints inside a list cell (percentage sizes often stay blank).
 */
export function ExploreFastPhoto({ uri, style, width, height }: Props) {
  const fixed = width && height ? { width, height } : null;
  const [measured, setMeasured] = useState(fixed);
  const onLayout = (event: LayoutChangeEvent) => {
    if (fixed) return;
    const next = event.nativeEvent.layout;
    if (next.width <= 0 || next.height <= 0) return;
    setMeasured((prev) =>
      prev &&
      Math.abs(prev.width - next.width) < 1 &&
      Math.abs(prev.height - next.height) < 1
        ? prev
        : { width: next.width, height: next.height }
    );
  };
  const trimmed = uri?.trim();
  const remote =
    !!trimmed &&
    (trimmed.startsWith("http://") || trimmed.startsWith("https://"));

  return (
    <View style={[styles.fill, style]} onLayout={onLayout}>
      {remote && measured ? (
        <FastImage
          source={{
            uri: trimmed,
            cache: FastImage.cacheControl.immutable,
            priority: FastImage.priority.high,
          }}
          onError={() => forgetExplorePhoto(trimmed)}
          resizeMode={FastImage.resizeMode.cover}
          style={measured}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
});
