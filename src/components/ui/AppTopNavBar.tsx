import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import AppText from "./AppText";
import { useTheme } from "../../design/theme";
import Feather from "react-native-vector-icons/Feather";
import { NavBackIcon } from "../../atoms";

import { FONTS } from "../../common/typography";

type Props = {
  label?: string;
  showTitle?: boolean;
  iconLeft?: boolean;
  iconRight?: boolean;
  iconLeftName?: string;
  iconRightName?: string;
  buttonLeftText?: string;
  buttonRightText?: string;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  containerStyle?: ViewStyle;
};

//TODO : Top Navigation Bar Component add an option to show icon
//TODO : Also make the style customizable via props

const AppTopNavBar: React.FC<Props> = ({
  label = "",
  showTitle = true,
  iconLeft = true,
  iconRight = true,
  iconLeftName = "arrow-left",
  iconRightName = "chevron-right",
  buttonLeftText,
  buttonRightText,
  onPressLeft,
  onPressRight,
  containerStyle,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfacePrimary },
        containerStyle,
      ]}
    >
      {/* Left side */}
      {(iconLeft || buttonLeftText) && (
        <TouchableOpacity
          onPress={onPressLeft}
          style={styles.sideButton}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {buttonLeftText ? (
            <AppText
              variant="body14"
              color={colors.textPrimary}
              style={{ fontFamily: FONTS.bold }}
            >
              {buttonLeftText}
            </AppText>
          ) : iconLeftName === "arrow-left" ||
            iconLeftName === "chevron-left" ||
            iconLeftName === "chevron-back" ? (
            <NavBackIcon color={colors.textPrimary} />
          ) : (
            <Feather name={iconLeftName} size={24} color={colors.textPrimary} />
          )}
        </TouchableOpacity>
      )}

      {/* Title */}
      {showTitle && (
        <AppText
          variant="title18"
          color={colors.textPrimary}
          style={styles.title}
        >
          {label}
        </AppText>
      )}

      {/* Right side */}
      {(iconRight || buttonRightText) && (
        <TouchableOpacity
          onPress={onPressRight}
          style={[styles.sideButton, { alignItems: "flex-end" }]}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {buttonRightText ? (
            <AppText
              variant="button14"
              color={colors.textPrimary}
              style={{ fontFamily: FONTS.bold }}
            >
              {buttonRightText}
            </AppText>
          ) : (
            <Feather
              name={iconRightName}
              size={20}
              color={colors.textPrimary}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AppTopNavBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // ✅ aligns left title & right items correctly
    width: "100%",
    paddingHorizontal: 24,
    height: 48,
  },
  sideButton: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%", // ✅ makes the whole nav height clickable
    minWidth: 44,
  },
  title: {
    flex: 1,
    textAlign: "left",
    marginHorizontal: 12,
  },
});
