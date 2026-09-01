/**
 * Guides Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GuidesStackParamList } from "./types";
import { GuidesScreen } from "../features/guides/screens/GuidesScreen";
import { BirdGuideScreen } from "../features/guides/screens/BirdGuideScreen";
import { WateringGuideScreen } from "../features/guides/screens/WateringGuideScreen";
import { LightGuideScreen } from "../features/guides/screens/LightGuideScreen";
import { SoilGuideScreen } from "../features/guides/screens/SoilGuideScreen";
import { FertilizerGuideScreen } from "../features/guides/screens/FertilizerGuideScreen";
import { RepottingGuideScreen } from "../features/guides/screens/RepottingGuideScreen";

const Stack = createNativeStackNavigator<GuidesStackParamList>();

export const GuidesStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="GuidesMain" component={GuidesScreen} />
      <Stack.Screen name="BirdGuide" component={BirdGuideScreen} />
      <Stack.Screen name="WateringGuide" component={WateringGuideScreen} />
      <Stack.Screen name="LightGuide" component={LightGuideScreen} />
      <Stack.Screen name="SoilGuide" component={SoilGuideScreen} />
      <Stack.Screen name="FertilizerGuide" component={FertilizerGuideScreen} />
      <Stack.Screen name="RepottingGuide" component={RepottingGuideScreen} />
    </Stack.Navigator>
  );
};
