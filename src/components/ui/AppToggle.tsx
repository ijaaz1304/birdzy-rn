import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "../../design/theme";
import { Radius } from "../../design";

type Props = {
  value: boolean;
  onToggle?: (val: boolean) => void;
  disabled?: boolean;
  size?: "small" | "medium";
};

// TODO : Disabled state Bg color

const AppToggle: React.FC<Props> = ({
  value,
  onToggle,
  disabled = false,
  size = "medium",
}) => {
  const { colors } = useTheme();
  const thumbAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(thumbAnim, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.circle),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackWidth = size === "small" ? 32 : 40;
  const trackHeight = size === "small" ? 18 : 24;
  const thumbSize = size === "small" ? 14 : 20;
  const thumbTranslate = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, trackWidth - thumbSize - 2],
  });

  const _trackColor = disabled
    ? colors.surfaceTertiary
    : value
    ? colors.borderBrand
    : colors.borderPrimary;

  const thumbColor = disabled ? colors.textTertiary : colors.surfacePrimary;

  const backgroundColor = disabled
    ? colors.surfacePrimary
    : value
    ? colors.borderBrand
    : colors.surfaceTertiary;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={() => !disabled && onToggle?.(!value)}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: Radius.full,
            backgroundColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslate }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default AppToggle;

const styles = StyleSheet.create({
  track: {
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    position: "absolute",
    top: 2,
  },
});
