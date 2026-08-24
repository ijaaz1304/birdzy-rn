import React from "react";
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { WebView } from "react-native-webview";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
};

export const PostAuthLegalModal: React.FC<Props> = ({
  visible,
  url,
  title,
  onClose,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text
            variant="title"
            size="small"
            weight="semibold"
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.backButton} />
        </View>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}
        <WebView
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});
