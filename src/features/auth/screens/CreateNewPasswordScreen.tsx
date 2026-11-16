/**
 * Create new password (forgot-password flow after OTP on VerifyEmail).
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import { ScreenContainer } from "../../../molecules";
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { Input } from "../../../molecules/Input/Input";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Text } from "../../../atoms/Text/Text";
import { NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { useFeatureConfig } from "../../../config/context";
import { APP_COLORS } from "../../../config/colors";
import { SCREEN_COLORS } from "../../../constants/colorConstants";
import { useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";

type CreateNewPasswordNavProp = NativeStackNavigationProp<
  AuthStackParamList,
  "CreateNewPassword"
>;
type CreateNewPasswordRouteProp = RouteProp<
  AuthStackParamList,
  "CreateNewPassword"
>;

export const CreateNewPasswordScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CreateNewPasswordNavProp>();
  const route = useRoute<CreateNewPasswordRouteProp>();
  const authConfig = useFeatureConfig("auth");
  const cnp = authConfig.createNewPassword;
  const { email, code } = route.params;
  const { resetPassword, isLoading, setError } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmHidden, setIsConfirmHidden] = useState(true);
  /** Keyboard rule: focused field + Save stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();
  const confirmRef = useRef<TextInput>(null);
  const isDark = theme.mode === "dark";

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;

  const handleSave = async () => {
    if (!password || !confirm) {
      showAlert(AUTH_STRINGS.alerts.error, AUTH_STRINGS.errors.fieldsRequired);
      return;
    }
    if (password !== confirm) {
      showAlert(
        AUTH_STRINGS.alerts.error,
        AUTH_STRINGS.errors.passwordsMismatch
      );
      return;
    }
    if (password.length < 6) {
      showAlert(
        AUTH_STRINGS.alerts.error,
        AUTH_STRINGS.errors.passwordTooShort
      );
      return;
    }

    setError(null);
    try {
      await resetPassword(code, password, email);
      showAlert(
        AUTH_STRINGS.alerts.success,
        AUTH_STRINGS.messages.passwordResetSuccess,
        {
          onPrimary: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );
          },
        }
      );
    } catch (err: any) {
      showAlert(
        AUTH_STRINGS.alerts.error,
        err.message || AUTH_STRINGS.errors.resetPasswordFailed
      );
    }
  };

  const textColor = theme.colors.textPrimary;
  const fieldTextStyle = [authFormStyles.fieldText, { color: textColor }];

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
              <NavBackIcon
                color={
                  isDark ? SCREEN_COLORS.DARK.text : APP_COLORS.surfaceDark
                }
              />
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
            {/* Figma 8015:114344 — title + subtitle, 4pt apart */}
            <View style={styles.header}>
              <Text
                variant="title"
                size="small"
                numberOfLines={2}
                ellipsizeMode="tail"
                accessibilityRole="header"
                style={[authFormStyles.title, { color: textColor }]}
              >
                {cnp.title || AUTH_STRINGS.createNewPassword.title}
              </Text>
              <Text style={[authFormStyles.subtitle, { color: textColor }]}>
                {cnp.subtitle || AUTH_STRINGS.createNewPassword.subtitle}
              </Text>
            </View>

            {/* Figma 8015:114347 — two 48pt password fields, 16pt apart */}
            <View style={styles.fields} onLayout={kb.layout("fields")}>
              <View onLayout={kb.layout("password", "fields")}>
                <Input
                  key="new-password"
                  testID="new-password-input"
                  onFocus={kb.focus("password")}
                  placeholder={
                    cnp.newPasswordPlaceholder ||
                    AUTH_STRINGS.placeholders.newPassword
                  }
                  value={password}
                  onChangeText={setPassword}
                  secure={isPasswordHidden}
                  toggleSecure={() => setIsPasswordHidden((prev) => !prev)}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
              </View>
              <View onLayout={kb.layout("confirm", "fields")}>
                <Input
                  key="confirm-password"
                  ref={confirmRef}
                  testID="confirm-new-password-input"
                  onFocus={kb.focus("confirm")}
                  placeholder={
                    cnp.reEnterPasswordPlaceholder ||
                    AUTH_STRINGS.placeholders.confirmPassword
                  }
                  value={confirm}
                  onChangeText={setConfirm}
                  secure={isConfirmHidden}
                  toggleSecure={() => setIsConfirmHidden((prev) => !prev)}
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={() => {
                    if (password && confirm && !isLoading) handleSave();
                  }}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
              </View>
            </View>

            {/* Figma: Save 16pt below the fields */}
            <View onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="new-password-save"
                title={
                  cnp.saveButtonText || AUTH_STRINGS.createNewPassword.save
                }
                onPress={handleSave}
                loading={isLoading}
                disabled={!password || !confirm || isLoading}
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
  /** Figma: 24pt below the header; fields 16pt apart */
  fields: {
    marginTop: 24,
    gap: 16,
  },
});
