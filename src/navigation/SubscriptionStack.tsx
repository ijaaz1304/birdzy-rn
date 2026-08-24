/**
 * Subscription Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SubscriptionStackParamList } from "./types";
import { SubscriptionMainScreen } from "../features/subscription/screens/SubscriptionMainScreen";
import { SubscriptionIntroScreen } from "../features/subscription/screens/SubscriptionIntroScreen";
import { SubscriptionStatusScreen } from "../features/subscription/screens/SubscriptionStatusScreen";
import { DiscountModalScreen } from "../features/subscription/screens/DiscountModalScreen";
import { LegalWebViewScreen } from "../features/subscription/screens/LegalWebViewScreen";

const Stack = createNativeStackNavigator<SubscriptionStackParamList>();

export const SubscriptionStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="SubscriptionMain"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="SubscriptionMain"
        component={SubscriptionMainScreen}
      />
      <Stack.Screen
        name="SubscriptionStatus"
        component={SubscriptionStatusScreen}
      />
      <Stack.Screen
        name="SubscriptionIntro"
        component={SubscriptionIntroScreen}
      />
      <Stack.Screen name="DiscountModal" component={DiscountModalScreen} />
      <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
    </Stack.Navigator>
  );
};
