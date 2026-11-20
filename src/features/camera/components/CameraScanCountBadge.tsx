/**
 * Free-plan remaining scans circle beside the shutter.
 * Count + "Left" (e.g. 30 / Left).
 */

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  FONTS,
  getAccessibilityFontScale,
  scaleFigmaFontSize,
} from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { CAPTURE_SIDE_BUTTON_SIZE } from "../captureFrameLayout";

type Props = {
  remaining: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const CameraScanCountBadge: React.FC<Props> = ({
  remaining,
  onPress,
  style,
  disabled,
}) => {
  const { fontScale } = useWindowDimensions();
  const typeScale = getAccessibilityFontScale(fontScale);
  const labelSize = scaleFigmaFontSize(12, typeScale);
  const labelLine = scaleFigmaFontSize(14, typeScale);
  const badgeSize = Math.max(CAPTURE_SIDE_BUTTON_SIZE, labelLine * 2 + 8);
  const a11y = CAMERA_STRINGS.limits.scansRemainingA11y.replace(
    "{count}",
    String(remaining)
  );

  const content = (
    <View style={styles.labelStack}>
      <Text
        style={[styles.remaining, { fontSize: labelSize, lineHeight: labelLine }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {remaining}
      </Text>
      <Text
        style={[styles.leftLabel, { fontSize: labelSize, lineHeight: labelLine }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {CAMERA_STRINGS.limits.leftLabel}
      </Text>
    </View>
  );

  const badgeStyle = [
    styles.circle,
    {
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View
        style={badgeStyle}
        accessibilityRole="text"
        accessibilityLabel={a11y}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      hitSlop={HIT_SLOP.CLOSE}
      style={badgeStyle}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled }}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
    borderRadius: CAPTURE_SIDE_BUTTON_SIZE / 2,
    backgroundColor: APP_COLORS.brandLight,
    borderWidth: 1,
    borderColor: APP_COLORS.brandPrimaryDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  labelStack: {
    alignItems: "center",
    justifyContent: "center",
  },
  remaining: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 14,
    color: APP_COLORS.brandPrimaryDark,
    textAlign: "center",
  },
  leftLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 14,
    color: APP_COLORS.brandPrimaryDark,
    textAlign: "center",
  },
});
