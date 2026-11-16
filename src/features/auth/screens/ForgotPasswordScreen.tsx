/**
 * Forgot Password Screen
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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
import { Text, NavBackIcon } from "../../../atoms";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { ScreenContainer } from "../../../molecules";
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { Input } from "../../../molecules/Input/Input";
import { useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { APP_COLORS } from "../../../config/colors";
import { useFeatureConfig } from "../../../config/context";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { AuthFieldError } from "../components/AuthFieldError";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";

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
  /** Keyboard rule: focused field + Send reset link stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();

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

  const textColor = theme.colors.textPrimary;
  const isSuccess = message.includes("sent");

  return (
    <ScreenContainer showBackground={false} backgroundColor={authBg} edges={[]}>
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.flex, styles.authFormLayer]}
      >
        <View
          style={[
            authFormStyles.page,
            {
              paddingTop: insets.top,
              paddingBottom: kb.keyboardVisible
                ? 8
                : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Figma Top Navigation Bar — 52pt, stays fixed while the form scrolls */}
          <View style={authFormStyles.navRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={authFormStyles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <NavBackIcon color={backIconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            {...kb.scrollViewProps}
            style={authFormStyles.scroll}
            contentContainerStyle={[
              authFormStyles.scrollContent,
              kb.contentPaddingBottom > 0 && {
                paddingBottom: 24 + kb.contentPaddingBottom,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Figma 8015:114320 — title + subtitle, 4pt apart */}
            <View style={styles.header}>
              <Text
                variant="title"
                size="small"
                numberOfLines={2}
                ellipsizeMode="tail"
                accessibilityRole="header"
                style={[authFormStyles.title, { color: textColor }]}
              >
                {fp.title || AUTH_STRINGS.forgotPassword.title}
              </Text>
              <Text style={[authFormStyles.subtitle, { color: textColor }]}>
                {fp.subtitle || AUTH_STRINGS.forgotPassword.subtitle}
              </Text>
            </View>

            <View
              style={[authFormStyles.fieldGroup, styles.fieldBlock]}
              onLayout={kb.layout("email")}
            >
              <Input
                testID="forgot-email-input"
                onFocus={kb.focus("email")}
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
                returnKeyType="send"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => {
                  if (email && !isLoading) handleResetPassword();
                }}
                borderRadius={AUTH_TEXT_FIELD_RADIUS}
                hasError={!!message && !isSuccess}
                containerStyle={authFormStyles.fieldContainer}
                wrapPlaceholder
                inputStyle={[authFormStyles.fieldText, { color: textColor }]}
              />
              {message ? (
                isSuccess ? (
                  <Text variant="body" size="small" color="success">
                    {message}
                  </Text>
                ) : (
                  <AuthFieldError message={message} />
                )
              ) : null}
            </View>

            {/* Figma: Send reset link 16pt below the field */}
            <View onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="forgot-submit"
                title={submitLabel}
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={!email || isLoading}
                style={{
                  ...authFormStyles.submit,
                  marginTop: 16,
                  backgroundColor: theme.colors.primaryCTA,
                }}
                textStyle={authFormStyles.submitLabel}
                textColor={theme.colors.onPrimary}
              />
            </View>
          </ScrollView>
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
  header: {
    gap: 4,
  },
  /** Figma: 20pt between the header and the field */
  fieldBlock: {
    marginTop: 20,
  },
});
