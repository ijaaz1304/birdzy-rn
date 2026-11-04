import React from "react";
import { NativeModules, StyleSheet, View } from "react-native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import type { ExploreMapViewProps } from "./ExploreMapView.nativeMap";

// The SDK throws during import when an older installed binary lacks Mapbox.
// Keep the import behind the same native-module check used by the SDK itself.
export const ExploreMapView: React.FC<ExploreMapViewProps> = (props) => {
  const theme = useTheme();
  if (NativeModules.RNMBXModule == null) {
    return (
      <View
        style={[
          styles.unavailable,
          { backgroundColor: theme.colors.surfacePrimary },
        ]}
      >
        <Text weight="semibold">Map unavailable in this app version</Text>
        <Text>
          Please update the app to view the interactive map. You can still
          search locations and browse nearby birds below.
        </Text>
      </View>
    );
  }
  const NativeMap = (
    require("./ExploreMapView.nativeMap") as typeof import("./ExploreMapView.nativeMap")
  ).ExploreMapView;
  return <NativeMap {...props} />;
};

const styles = StyleSheet.create({
  unavailable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
});
