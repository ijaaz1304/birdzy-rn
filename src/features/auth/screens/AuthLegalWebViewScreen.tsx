/**
 * Auth Legal WebView Screen
 * Opens Privacy Policy or Terms of Service in an in-app WebView during auth flow.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import type { AuthStackParamList } from "../../../navigation/types";
import { spacing } from "../../../design-system/spacing";

type AuthLegalWebViewRouteProp = RouteProp<AuthStackParamList, "LegalWebView">;

export const AuthLegalWebViewScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AuthLegalWebViewRouteProp>();
  const { url, title } = route.params;
  const [loading, setLoading] = React.useState(true);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        <WebView
          source={{ uri: url }}
          style={[styles.webView, { backgroundColor: theme.colors.background }]}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
          scalesPageToFit
          javaScriptEnabled
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: {
    width: 24,
  },
  webViewContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  loadingWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
