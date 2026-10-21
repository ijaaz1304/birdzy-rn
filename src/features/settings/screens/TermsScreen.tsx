import { SettingsHeader } from "../components/SettingsHeader";
/**
 * Terms of Service Screen
 * Opens Birdzy Terms of Service in an in-app WebView.
 */

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../hooks/useTheme";
import { getTermsOfServiceUrl } from "../../../constants/legalUrls";

export const TermsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(true);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Terms of Use"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        <WebView
          source={{ uri: getTermsOfServiceUrl() }}
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
