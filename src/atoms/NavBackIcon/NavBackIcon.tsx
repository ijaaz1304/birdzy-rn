import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Images, NAV_BACK_ICON_SIZE } from "../../assets";

/** Standard header back control size — wrapper / hit-target. */
export const NAV_BACK_GLYPH_SIZE = NAV_BACK_ICON_SIZE;

/**
 * `go_back.png` is 160×160 with a ~30×54 chevron. Without this scale the
 * arrow reads as ~8px at a 24pt box, which looks tiny on dark headers.
 */
const NAV_BACK_ASSET_CANVAS = 160;
const NAV_BACK_ASSET_GLYPH_HEIGHT = 54;
const GLYPH_FILL = 0.55;

function imageSizeForWrapper(wrapperSize: number): number {
  const targetGlyphHeight = wrapperSize * GLYPH_FILL;
  return Math.round(
    (targetGlyphHeight * NAV_BACK_ASSET_CANVAS) / NAV_BACK_ASSET_GLYPH_HEIGHT,
  );
}

type Props = {
  color: string;
  size?: number;
};

/**
 * Shared back-navigation glyph for all screen headers.
 * Uses the bundled chevron PNG (`Images.navGoBack`), not Material/Feather vectors.
 */
export const NavBackIcon: React.FC<Props> = ({
  color,
  size = NAV_BACK_GLYPH_SIZE,
}) => {
  const imageSize = imageSizeForWrapper(size);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <AppImage
        source={Images.navGoBack}
        style={{
          width: imageSize,
          height: imageSize,
          tintColor: color,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
