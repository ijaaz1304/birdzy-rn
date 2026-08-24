/**
 * Bird Personality Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BirdPersonalityStackParamList } from "./types";
import { BirdPersonalityIntroScreen } from "../features/bird-personality/screens/RockPersonalityIntroScreen";
import { PhotoSelectionScreen } from "../features/bird-personality/screens/PhotoSelectionScreen";
import { BirdPersonalityQuestionnaireScreen } from "../features/bird-personality/screens/RockPersonalityQuestionnaireScreen";
import { BirdPersonalityAnalysisScreen } from "../features/bird-personality/screens/RockPersonalityAnalysisScreen";
import { BirdPersonalityResultScreen } from "../features/bird-personality/screens/RockPersonalityResultScreen";

const Stack = createNativeStackNavigator<BirdPersonalityStackParamList>();

export const BirdPersonalityStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="BirdPersonalityIntro"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="BirdPersonalityIntro"
        component={BirdPersonalityIntroScreen}
      />
      <Stack.Screen name="PhotoSelection" component={PhotoSelectionScreen} />
      <Stack.Screen
        name="Questionnaire"
        component={BirdPersonalityQuestionnaireScreen}
      />
      <Stack.Screen name="Analysis" component={BirdPersonalityAnalysisScreen} />
      <Stack.Screen name="Result" component={BirdPersonalityResultScreen} />
    </Stack.Navigator>
  );
};
