import ScanInfoFigma from "../../../assets/scanInfoFigma.svg";
/**
 * Free-plan lifetime photo and sound scan counter (Figma 8717:62309).
 */

import React from "react";
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import { useStrings } from "../../../hooks/useStrings";
import {
  FONTS,
  getAccessibilityFontScale,
  scaleFigmaFontSize,
} from "../../../common/typography";
import { HOME_COLORS } from "../../../constants/colorConstants";

const GRADIENT = [...HOME_COLORS.DISCOUNT_BANNER.GRADIENT_LIGHT] as string[];
const GRADIENT_START = { x: 0, y: 0.5 };
const GRADIENT_END = { x: 1, y: 0.5 };

type Props = {
  remaining: number;
  dailyLimit: number;
  resetLabel: string;
  style?: StyleProp<ViewStyle>;
};

function GradientHighlight({
  children,
  style,
}: {
  children: string;
  style: TextStyle;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, styles.maskText]} numberOfLines={1} allowFontScaling={false}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={GRADIENT}
        start={GRADIENT_START}
        end={GRADIENT_END}
      >
        <Text style={[style, styles.hiddenText]} numberOfLines={1} allowFontScaling={false}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

export const CameraDailyScanBanner: React.FC<Props> = ({
  remaining,
  dailyLimit,
  style,
}) => {
  const strings = useStrings();
  const { fontScale } = useWindowDimensions();
  const typeScale = getAccessibilityFontScale(fontScale);
  const scansLabel = `${remaining}/${dailyLimit}`;
  const copyStyle: TextStyle = {
    fontSize: scaleFigmaFontSize(14, typeScale),
    lineHeight: scaleFigmaFontSize(20, typeScale),
  };

  return (
    <View style={[styles.banner, style]}>
      <View style={styles.icon}>
        <ScanInfoFigma />
      </View>
      <View style={styles.textRow}>
        <Text style={[styles.bodyText, copyStyle]} allowFontScaling={false}>
          {strings.camera.limits.freeScansLeftPrefix}
        </Text>
        <GradientHighlight style={{ ...styles.highlightText, ...copyStyle }}>
          {scansLabel}
        </GradientHighlight>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#E7E7E7",
  },
  highlightText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  maskText: {
    backgroundColor: "transparent",
    color: "#000000",
  },
  hiddenText: {
    opacity: 0,
  },
  separator: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#E7E7E7",
  },
});
