/**
 * Create new password (forgot-password flow after OTP on VerifyEmail).
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from "react-native";
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
import { AUTH_TEXT_FIELD_RADIUS, AUTH_BACK_BUTTON_LEFT_OFFSET } from "../constants/authFormLayout";
import { typography } from "../../../design-system/typography";
import { FONTS } from "../../../common/typography";

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
  const isDark = theme.mode === "dark";

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const bodyTextColor = isDark
    ? SCREEN_COLORS.DARK.text
    : APP_COLORS.surfaceDark;
  const subtitleColor = isDark
    ? SCREEN_COLORS.DARK.textSecondary
    : SCREEN_COLORS.LIGHT.textSecondary;

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

  return (
    <ScreenContainer showBackground={false} backgroundColor={authBg} edges={[]}>
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      <View style={[styles.backRow, styles.authFormLayer, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <NavBackIcon
            color={isDark ? SCREEN_COLORS.DARK.text : APP_COLORS.surfaceDark}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.flex, styles.authFormLayer]}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="title"
            size="large"
            weight="bold"
            style={[styles.title, { color: bodyTextColor }]}
          >
            {cnp.title || AUTH_STRINGS.createNewPassword.title}
          </Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {cnp.subtitle || AUTH_STRINGS.createNewPassword.subtitle}
          </Text>

          <Input
            key="new-password"
            placeholder={
              cnp.newPasswordPlaceholder ||
              AUTH_STRINGS.placeholders.newPassword
            }
            value={password}
            onChangeText={setPassword}
            secure={isPasswordHidden}
            toggleSecure={() => setIsPasswordHidden((prev) => !prev)}
            borderRadius={AUTH_TEXT_FIELD_RADIUS}
          />
          <Input
            key="confirm-password"
            placeholder={
              cnp.reEnterPasswordPlaceholder ||
              AUTH_STRINGS.placeholders.confirmPassword
            }
            value={confirm}
            onChangeText={setConfirm}
            secure={isConfirmHidden}
            toggleSecure={() => setIsConfirmHidden((prev) => !prev)}
            borderRadius={AUTH_TEXT_FIELD_RADIUS}
          />

          <PrimaryButton
            title={cnp.saveButtonText || AUTH_STRINGS.createNewPassword.save}
            onPress={handleSave}
            loading={isLoading}
            disabled={!password || !confirm || isLoading}
            style={{
              backgroundColor: theme.colors.primaryCTA,
              borderRadius: AUTH_TEXT_FIELD_RADIUS,
              marginTop: 16,
            }}
            textColor={theme.colors.onPrimary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  authFormLayer: {
    zIndex: 1,
  },
  backRow: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: AUTH_BACK_BUTTON_LEFT_OFFSET,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    ...typography.title.large,
    fontFamily: FONTS.bold,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body.mediumMedium,
    lineHeight: 20,
    marginBottom: 12,
  },
});
