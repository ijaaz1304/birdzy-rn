/**
 * Free-plan daily photo scan counter + reset countdown (Figma 8717:62309).
 */

import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import { AppImage } from "@/components/AppImage";
import { Images } from "../../../assets";
import { useStrings } from "../../../hooks/useStrings";
import { FONTS } from "../../../common/typography";
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
  style: object;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, styles.maskText]} numberOfLines={1}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={GRADIENT}
        start={GRADIENT_START}
        end={GRADIENT_END}
      >
        <Text style={[style, styles.hiddenText]} numberOfLines={1}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

export const CameraDailyScanBanner: React.FC<Props> = ({
  remaining,
  dailyLimit,
  resetLabel,
  style,
}) => {
  const strings = useStrings();
  const scansLabel = `${remaining}/${dailyLimit}`;

  return (
    <View style={[styles.banner, style]}>
      <AppImage
        source={Images.informationCircle}
        style={styles.icon}
        resizeMode="contain"
      />
      <View style={styles.textRow}>
        <Text style={styles.bodyText}>
          {strings.camera.limits.freeScansLeftPrefix}
        </Text>
        <GradientHighlight style={styles.highlightText}>
          {scansLabel}
        </GradientHighlight>
        <Text style={styles.separator}>{" • "}</Text>
        <Text style={styles.bodyText}>
          {strings.camera.limits.resetInPrefix}
        </Text>
        <GradientHighlight style={styles.highlightText}>
          {resetLabel}
        </GradientHighlight>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: "#E7E7E7",
  },
  textRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
