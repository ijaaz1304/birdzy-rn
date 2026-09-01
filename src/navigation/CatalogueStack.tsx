/**
 * Catalogue Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CatalogueStackParamList } from "./types";
import { CatalogueScreen } from "../features/catalogue/screens/CatalogueScreen";
import { SearchScreen } from "../features/catalogue/screens/SearchScreen";
import { BirdDetailsScreen } from "../features/collection/screens/BirdDetailsScreen";
import { BirdSoundsScreen } from "../features/collection/screens/BirdSoundsScreen";
import { IDENTIFY_FULL_SCREEN_OPTIONS } from "./identifyFlowScreenOptions";

const Stack = createNativeStackNavigator<CatalogueStackParamList>();

export const CatalogueStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="CatalogueMain" component={CatalogueScreen} />
      <Stack.Screen
        name="BirdDetails"
        component={BirdDetailsScreen}
        options={IDENTIFY_FULL_SCREEN_OPTIONS}
      />
      <Stack.Screen name="SearchFilter" component={SearchScreen} />
      <Stack.Screen name="BirdSounds" component={BirdSoundsScreen} />
    </Stack.Navigator>
  );
};
