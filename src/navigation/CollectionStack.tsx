/**
 * Collection Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CollectionStackParamList } from "./types";
import { CollectionScreen } from "../features/collection/screens/CollectionScreen";
import { MyBirdsScreen } from "../features/collection/screens/MyBirdsScreen";
import { WishlistScreen } from "../features/collection/screens/WishlistScreen";
import { CreateCollectionScreen } from "../features/collection/screens/CreateCollectionScreen";
import { CollectionDetailsScreen } from "../features/collection/screens/CollectionDetailsScreen";
// Reminders removed - not needed for rocks/minerals app
import { BirdDetailsScreen } from "../features/collection/screens/BirdDetailsScreen";
import { EditBirdDetailsScreen } from "../features/collection/screens/EditBirdDetailsScreen";
import { BirdSoundsScreen } from "../features/collection/screens/BirdSoundsScreen";
import { IDENTIFY_FULL_SCREEN_OPTIONS } from "./identifyFlowScreenOptions";

const Stack = createNativeStackNavigator<CollectionStackParamList>();

export const CollectionStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="CollectionMain" component={CollectionScreen} />
      <Stack.Screen name="MyBirds" component={MyBirdsScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen
        name="CreateCollection"
        component={CreateCollectionScreen}
      />
      <Stack.Screen
        name="CollectionDetails"
        component={CollectionDetailsScreen}
      />
      {/* Reminders removed - not needed for rocks/minerals app */}
      <Stack.Screen
        name="BirdDetails"
        component={BirdDetailsScreen}
        options={IDENTIFY_FULL_SCREEN_OPTIONS}
      />
      <Stack.Screen
        name="EditBirdDetails"
        component={EditBirdDetailsScreen}
      />
      <Stack.Screen name="BirdSounds" component={BirdSoundsScreen} />
    </Stack.Navigator>
  );
};
