/**
 * Ask AI Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AskAIStackParamList } from "./types";
import { AskAIScreen } from "../features/ask-ai/screens/AskAIScreen";
import { AskAIImageSourceScreen } from "../features/ask-ai/screens/AskAIImageSourceScreen";

const Stack = createNativeStackNavigator<AskAIStackParamList>();

export const AskAIStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
        keyboardHandlingEnabled: false,
      }}
    >
      <Stack.Screen name="AskAIMain" component={AskAIScreen} />
      <Stack.Screen
        name="AskAIImageSource"
        component={AskAIImageSourceScreen}
      />
    </Stack.Navigator>
  );
};
