/**
 * Quiz Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QuizStackParamList } from "./types";
import { QuizScreen } from "../features/quiz/screens/QuizScreen";

const Stack = createNativeStackNavigator<QuizStackParamList>();

export const QuizStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="QuizMain" component={QuizScreen} />
    </Stack.Navigator>
  );
};
