/**
 * Forgot Password Screen
 */

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showAlert } from "../../../store/alert.store";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { Text, Button, NavBackIcon } from "../../../atoms";
import { ScreenContainer } from "../../../molecules";
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { Input } from "../../../molecules/Input/Input";
import { useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { typography } from "../../../design-system/typography";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { useFeatureConfig } from "../../../config/context";
import { AUTH_TEXT_FIELD_RADIUS, AUTH_BACK_BUTTON_LEFT_OFFSET } from "../constants/authFormLayout";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;
type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, "ForgotPassword">;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const route = useRoute<ForgotPasswordRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const authConfig = useFeatureConfig("auth");
  const fp = authConfig.forgotPassword;
  const submitLabel =
    fp.submitButtonText || AUTH_STRINGS.forgotPassword.sendResetLink;
  const { forgotPassword, isLoading, setError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const pre = route.params?.prefillEmail;
    if (pre && typeof pre === "string") {
      setEmail(pre);
    }
  }, [route.params?.prefillEmail]);

  useFocusEffect(
    useCallback(() => {
      setError(null);
      setMessage("");
    }, [setError])
  );

  const handleResetPassword = async () => {
    if (!email) {
      setMessage(AUTH_STRINGS.messages.pleaseEnterEmail);
      return;
    }

    setError(null);
    setMessage("");
    try {
      await forgotPassword(email);
      navigation.dispatch(
        CommonActions.navigate({
          name: "VerifyEmail",
          params: { email, isPasswordReset: true },
        })
      );
    } catch (err: any) {
      const msg = err.message || AUTH_STRINGS.errors.forgotPasswordFailed;
      showAlert(AUTH_STRINGS.alerts.error, msg);
    }
  };

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const backIconColor = isDark
    ? theme.colors.textPrimary
    : APP_COLORS.surfaceDark;
  const subtitleColor = isDark ? theme.colors.textPrimary : "#111111";

  return (
    <ScreenContainer
      showBackground={false}
      backgroundColor={authBg}
      edges={[]}
    >
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.flex, styles.authFormLayer]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={[styles.page, { paddingTop: insets.top + 32 }]}>
          <View style={styles.body}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <NavBackIcon color={backIconColor} />
            </TouchableOpacity>

            <Text
              variant="title"
              size="large"
              weight="bold"
              style={styles.headerTitle}
            >
              {fp.title || AUTH_STRINGS.forgotPassword.title}
            </Text>

            <View style={styles.content}>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {fp.subtitle || AUTH_STRINGS.forgotPassword.subtitle}
              </Text>

              <Input
                placeholder={
                  fp.emailPlaceholder || AUTH_STRINGS.placeholders.email
                }
                value={email}
                onChangeText={(text: string) => {
                  setEmail(text);
                  setError(null);
                  setMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                borderRadius={AUTH_TEXT_FIELD_RADIUS}
              />

              {message ? (
                <Text
                  variant="body"
                  size="small"
                  color={message.includes("sent") ? "success" : "error"}
                  style={styles.message}
                >
                  {message}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Button
              title={submitLabel}
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={!email || isLoading}
              fullWidth
              style={styles.footerButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  authFormLayer: {
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: AUTH_BACK_BUTTON_LEFT_OFFSET,
  },
  headerTitle: {
    ...typography.title.large,
    fontFamily: FONTS.bold,
    marginTop: 8,
    marginBottom: 8,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
  },
  body: {
    flex: 1,
  },
  content: {
    marginTop: 24,
  },
  subtitle: {
    ...typography.body.medium,
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  message: {
    marginTop: 12,
  },
  footer: {
    paddingTop: 16,
  },
  footerButton: {
    borderRadius: AUTH_TEXT_FIELD_RADIUS,
  },
});
