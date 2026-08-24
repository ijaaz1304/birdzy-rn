/**
 * Camera Permission Gate Screen
 * Location pre-prompt, then camera permission before capture.
 */

import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { CameraStackParamList } from "../../../navigation/types";
import { IdentificationPermissionFlow } from "../IdentificationPermissionFlow";

type CameraPermissionGateScreenRouteProp = RouteProp<
  CameraStackParamList,
  "CameraPermissionGate"
>;
type CameraPermissionGateScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "CameraPermissionGate"
>;

export const CameraPermissionGateScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<CameraPermissionGateScreenNavigationProp>();
  const route = useRoute<CameraPermissionGateScreenRouteProp>();
  const mode = route.params?.mode || "diagnose";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <IdentificationPermissionFlow
        onCameraGranted={() =>
          navigation.replace("CameraCaptureScreen", { mode })
        }
        onCancel={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
