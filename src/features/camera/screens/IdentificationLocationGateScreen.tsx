/**
 * Legacy location gate — permissions now run on Home via IdentificationEntryProvider.
 */

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { INTERACTIVE_COLORS } from "../../../constants/colorConstants";
import { CameraStackParamList } from "../../../navigation/types";

type NavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "IdentificationLocationGate"
>;

const GATE_BG = INTERACTIVE_COLORS.CAMERA_BG_FALLBACK;

export const IdentificationLocationGateScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    navigation.replace("CameraMain");
  }, [navigation]);

  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GATE_BG,
  },
});
