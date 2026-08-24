import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { usePostAuthContentLayout } from "../utils/postAuthContentLayout";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/** Centers subscription / post-auth content on iPad while leaving phone layouts unchanged. */
export const PostAuthPhoneLayout: React.FC<Props> = ({
  children,
  style,
  contentStyle,
}) => {
  const { isWideScreen, contentWidth } = usePostAuthContentLayout();

  return (
    <View
      style={[
        styles.outer,
        isWideScreen ? styles.outerWide : null,
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          { width: isWideScreen ? contentWidth : "100%" },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: "100%",
  },
  outerWide: {
    alignItems: "center",
  },
  inner: {
    flex: 1,
    maxWidth: "100%",
  },
});
