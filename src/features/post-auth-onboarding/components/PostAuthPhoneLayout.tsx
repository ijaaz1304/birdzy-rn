import React from "react";
import { StyleSheet, View, ScrollView, type ViewStyle } from "react-native";
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
    <View style={[styles.outer, isWideScreen ? styles.outerWide : null, style]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        style={[
          styles.inner,
          { width: isWideScreen ? contentWidth : "100%" },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
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
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  inner: {
    flex: 1,
    maxWidth: "100%",
  },
});
