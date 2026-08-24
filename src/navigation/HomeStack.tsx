/**
 * Home Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "./types";
import { HomeScreen } from "../features/home/screens/HomeScreen";
import { MushroomDetailsScreen } from "../features/collection/screens/MushroomDetailsScreen";
// Weather removed - not needed for rocks/minerals app
import { OtherAppsScreen } from "../features/home/screens/OtherAppsScreen";
import { StepByStepScreen } from "../features/discovery/screens/StepByStepScreen";
import { AudioGalleryScreen } from "../features/discovery/screens/AudioGalleryScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="BirdDetails" component={MushroomDetailsScreen} />
      {/* Weather removed - not needed for rocks/minerals app */}
      <Stack.Screen name="OtherApps" component={OtherAppsScreen} />
      <Stack.Screen name="StepByStep" component={StepByStepScreen} />
      <Stack.Screen name="AudioGallery" component={AudioGalleryScreen} />
    </Stack.Navigator>
  );
};
