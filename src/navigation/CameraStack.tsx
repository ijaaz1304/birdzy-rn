/**
 * Camera Stack Navigator
 * Screens are eager-loaded to avoid Metro chunk loading (spinner) when navigating.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CameraStackParamList } from "./types";
import { CameraScreen } from "../features/camera/CameraScreen";
import { GalleryPickerScreen } from "../features/camera/screens/GalleryPickerScreen";
import { DiagnosisLoadingScreen } from "../features/camera/screens/DiagnosisLoadingScreen";
import { SoundIdentifyScreen } from "../features/camera/screens/SoundIdentifyScreen";
import { SoundCropScreen } from "../features/camera/screens/SoundCropScreen";
import { IdentifyHubScreen } from "../features/camera/screens/IdentifyHubScreen";
import { IdentifyImageCropScreen } from "../features/camera/screens/IdentifyImageCropScreen";
import { OtherPossibleMatchesScreen } from "../features/camera/screens/OtherPossibleMatchesScreen";
import { IdentificationLocationGateScreen } from "../features/camera/screens/IdentificationLocationGateScreen";
import {
  IDENTIFY_CROP_HOST_OPTIONS,
  IDENTIFY_FULL_SCREEN_OPTIONS,
} from "./identifyFlowScreenOptions";

const Stack = createNativeStackNavigator<CameraStackParamList>();

export const CameraStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
        ...IDENTIFY_FULL_SCREEN_OPTIONS,
      }}
    >
      <Stack.Screen
        name="IdentificationLocationGate"
        component={IdentificationLocationGateScreen}
      />
      <Stack.Screen
        name="CameraMain"
        component={CameraScreen}
        options={{ contentStyle: { flex: 1, backgroundColor: "#111111" } }}
      />
      <Stack.Screen name="GalleryPicker" component={GalleryPickerScreen} />
      <Stack.Screen
        name="IdentifyImageCrop"
        component={IdentifyImageCropScreen}
        options={IDENTIFY_CROP_HOST_OPTIONS}
      />
      <Stack.Screen
        name="DiagnosisLoading"
        component={DiagnosisLoadingScreen}
      />
      <Stack.Screen name="IdentifyHub" component={IdentifyHubScreen} />
      <Stack.Screen name="SoundIdentify" component={SoundIdentifyScreen} />
      <Stack.Screen name="SoundCrop" component={SoundCropScreen} />
      <Stack.Screen
        name="OtherPossibleMatches"
        component={OtherPossibleMatchesScreen}
        options={{
          animation: "fade",
          animationDuration: 120,
        }}
      />
    </Stack.Navigator>
  );
};
