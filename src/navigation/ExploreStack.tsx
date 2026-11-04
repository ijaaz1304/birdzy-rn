/**
 * Explore Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ExploreStackParamList } from "./types";
import { ExploreMapScreen } from "../features/explore/screens/ExploreMapScreen";
import { BirdDetailsScreen } from "../features/collection/screens/BirdDetailsScreen";

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export const ExploreStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="ExploreMap" component={ExploreMapScreen} />
      <Stack.Screen name="BirdDetails" component={BirdDetailsScreen} />
    </Stack.Navigator>
  );
};
