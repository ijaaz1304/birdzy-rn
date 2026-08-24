import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { ActivityIndicator, ImageResizeMode, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
};

/**
 * LoadingImage — spinner overlay until image renders.
 */
export const LoadingImage: React.FC<Props> = ({
  uri,
  style,
  containerStyle,
  resizeMode = "cover",
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const [loading, setLoading] = useState(true);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceVariant },
        containerStyle,
      ]}
    >
      <AppImage
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
