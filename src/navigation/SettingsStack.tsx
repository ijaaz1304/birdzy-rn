import { LoginSecurityScreen } from "../features/settings/screens/LoginSecurityScreen";
import { ChangePasswordScreen } from "../features/settings/screens/ChangePasswordScreen";
import { CreatePasswordScreen } from "../features/settings/screens/CreatePasswordScreen";
import { ContactUsScreen } from "../features/settings/screens/ContactUsScreen";
/**
 * Settings Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsStackParamList } from "./types";
import { SettingsScreen } from "../features/settings/screens/SettingsScreen";
import { ProfileSettingsScreen } from "../features/settings/screens/ProfileSettingsScreen";
import { AccountActionsScreen } from "../features/settings/screens/AccountActionsScreen";
import { NotificationsScreen } from "../features/settings/screens/NotificationsScreen";
import { BirdRegionScreen } from "../features/settings/screens/BirdRegionScreen";
import { PrivacyScreen } from "../features/settings/screens/PrivacyScreen";
import { TermsScreen } from "../features/settings/screens/TermsScreen";
import { RateUsScreen } from "../features/settings/screens/RateUsScreen";
import { FAQScreen } from "../features/settings/screens/FAQScreen";
import { AppearanceScreen } from "../features/settings/screens/AppearanceScreen";
import { AppLogsScreen } from "../features/settings/screens/AppLogsScreen";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="AccountActions" component={AccountActionsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BirdRegion" component={BirdRegionScreen} />
      <Stack.Screen name="RateUs" component={RateUsScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="AppLogs" component={AppLogsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="LoginSecurity" component={LoginSecurityScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    </Stack.Navigator>
  );
};
