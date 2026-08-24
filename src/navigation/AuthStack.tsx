/**
 * Authentication Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { SignUpScreen } from "../features/auth/screens/SignUpScreen";
import { RegisterScreen } from "../features/auth/screens/RegisterScreen";
import { ForgotPasswordScreen } from "../features/auth/screens/ForgotPasswordScreen";
import { VerifyEmailScreen } from "../features/auth/screens/VerifyEmailScreen";
import { CreateNewPasswordScreen } from "../features/auth/screens/CreateNewPasswordScreen";
import { CompleteProfileScreen } from "../features/auth/screens/CompleteProfileScreen";
import { AuthLegalWebViewScreen } from "../features/auth/screens/AuthLegalWebViewScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      {/* VerifyEmail: forgot-password OTP only (signup uses CompleteProfile) */}
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen
        name="CreateNewPassword"
        component={CreateNewPasswordScreen}
      />
      <Stack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ keyboardHandlingEnabled: false }}
      />
      <Stack.Screen name="LegalWebView" component={AuthLegalWebViewScreen} />
    </Stack.Navigator>
  );
};
