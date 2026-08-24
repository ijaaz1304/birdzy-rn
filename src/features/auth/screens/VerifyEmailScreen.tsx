/**
 * Verify Email Screen
 *
 * Used only for the forgot-password OTP flow (ForgotPassword → VerifyEmail →
 * CreateNewPassword). Signup skips this screen and goes straight to CompleteProfile.
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showAlert } from "../../../store/alert.store";
import {
  useNavigation,
  CommonActions,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../navigation/types";
import { Input } from "../../../molecules/Input/Input";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Text } from "../../../atoms/Text/Text";
import { NavBackIcon } from "../../../atoms";
import { ScreenContainer } from "../../../molecules";
import { useTheme } from "../../../hooks/useTheme";
import { SCREEN_COLORS } from "../../../constants/colorConstants";
import { useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { typography } from "../../../design-system/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { useFeatureConfig } from "../../../config/context";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "VerifyEmail"
>;
type VerifyEmailScreenRouteProp = RouteProp<AuthStackParamList, "VerifyEmail">;

export const VerifyEmailScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const authConfig = useFeatureConfig("auth");
  const ve = authConfig.verifyEmail;
  const vf = AUTH_STRINGS.verifyEmailFlow;
  const { resendVerificationEmail, isLoading, error, setError } =
    useAuthStore();
  const email = route.params?.email || "";
  const isPasswordReset = route.params?.isPasswordReset || false;
  const initialOtp = route.params?.initialOtp;
  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const isDark = theme.mode === "dark";
  const bodyTextColor = isDark
    ? SCREEN_COLORS.DARK.text
    : APP_COLORS.surfaceDark;
  const subtitleColor = isDark
    ? SCREEN_COLORS.DARK.textSecondary
    : SCREEN_COLORS.LIGHT.textSecondary;
  const linkColor = isDark
    ? SCREEN_COLORS.DARK.text
    : APP_COLORS.brandPrimaryDark;

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  useEffect(() => {
    if (!initialOtp || typeof initialOtp !== "string") return;
    const digits = initialOtp.replace(/[^0-9]/g, "").slice(0, 6);
    if (digits.length > 0) {
      setCode(digits);
    }
  }, [initialOtp]);

  const handleVerifySignup = useCallback(async () => {
    await AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");
    navigation.dispatch(
      CommonActions.navigate({
        name: "CompleteProfile",
      })
    );
  }, [navigation]);

  const onPressVerify = () => {
    if (isPasswordReset) {
      if (code.length !== 6) {
        showAlert(
          AUTH_STRINGS.alerts.error,
          AUTH_STRINGS.errors.verificationCodeRequired
        );
        return;
      }
      navigation.navigate("CreateNewPassword", { email, code });
      return;
    }
    handleVerifySignup().catch(() => {});
  };

  const handleResend = async () => {
    setError(null);
    try {
      if (isPasswordReset) {
        const { forgotPassword } = useAuthStore.getState();
        await forgotPassword(email);
        showAlert(
          AUTH_STRINGS.alerts.success,
          AUTH_STRINGS.messages.passwordResetEmailSent
        );
      } else {
        await resendVerificationEmail();
        showAlert(
          AUTH_STRINGS.alerts.success,
          AUTH_STRINGS.messages.verificationEmailSent
        );
      }
    } catch (err: any) {
      showAlert(
        AUTH_STRINGS.alerts.error,
        err.message || AUTH_STRINGS.errors.resendVerificationFailed
      );
    }
  };

  const handleCodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setCode(numericText.slice(0, 6));
  };

  useEffect(() => {
    if (code.length === 6 && !isPasswordReset) {
      const timer = setTimeout(() => {
        handleVerifySignup().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [code, isPasswordReset, handleVerifySignup]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;

  const screenTitle = ve.title || vf.verifyTitle;

  const goChangeEmail = () => {
    if (isPasswordReset) {
      navigation.navigate("ForgotPassword", { prefillEmail: email });
    } else {
      navigation.navigate("Register");
    }
  };

  return (
    <ScreenContainer showBackground={false} backgroundColor={authBg}>
      <View style={[styles.backRow, { paddingTop: insets.top + 8 }]}>
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
        style={styles.flex}
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
            style={[styles.screenTitle, { color: bodyTextColor }]}
          >
            {screenTitle}
          </Text>

          <Text style={[styles.desc, { color: subtitleColor }]}>
            We sent your code to{" "}
            <Text style={[styles.descEmail, { color: bodyTextColor }]}>
              {email || "your email"}
            </Text>
            , go ahead and enter it below.{" "}
            <Text
              onPress={goChangeEmail}
              style={[styles.changeEmailLink, { color: linkColor }]}
            >
              {vf.changeEmail}
            </Text>
          </Text>

          <Text style={[styles.codeLabel, { color: bodyTextColor }]}>
            {vf.verificationCodeLabel}
          </Text>

          <Input
            placeholder={vf.verificationCodePlaceholder}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            borderRadius={AUTH_TEXT_FIELD_RADIUS}
          />

          {error ? (
            <Text
              variant="body"
              size="small"
              color="error"
              style={styles.error}
            >
              {error}
            </Text>
          ) : null}

          <PrimaryButton
            title="Verify"
            onPress={onPressVerify}
            disabled={code.length !== 6 || isLoading}
            loading={isLoading}
            style={[
              styles.verifyButton,
              {
                backgroundColor: theme.colors.primaryCTA,
                borderRadius: AUTH_TEXT_FIELD_RADIUS,
              },
            ] as unknown as ViewStyle}
            textColor={theme.colors.onPrimary}
          />

          <TouchableOpacity
            onPress={async () => {
              if (resendTimer > 0) return;
              await handleResend();
              setResendTimer(60);
            }}
            disabled={isLoading || resendTimer > 0}
            style={styles.resendWrap}
            activeOpacity={resendTimer > 0 ? 1 : 0.7}
          >
            <Text style={[styles.resendPrefix, { color: bodyTextColor }]}>
              {vf.resendPrefix}
              <Text
                style={[
                  styles.resendAction,
                  {
                    color:
                      resendTimer > 0 ? theme.colors.resendTimer : linkColor,
                    textDecorationLine: resendTimer > 0 ? "none" : "underline",
                  },
                ]}
              >
                {vf.resend}
                {resendTimer > 0 ? ` ${resendTimer}s` : ""}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backRow: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  screenTitle: {
    ...typography.title.large,
    fontFamily: FONTS.bold,
    marginBottom: 12,
  },
  desc: {
    ...typography.body.medium,
    lineHeight: 20,
    marginBottom: 8,
  },
  descEmail: {
    ...typography.body.mediumSemibold,
    lineHeight: 20,
  },
  changeEmailLink: {
    ...typography.body.mediumSemibold,
    lineHeight: 20,
    textDecorationLine: "underline",
  },
  codeLabel: {
    ...typography.body.mediumSemibold,
    marginTop: 8,
    marginBottom: 4,
  },
  verifyButton: {
    marginTop: 12,
  },
  resendWrap: {
    alignSelf: "center",
    marginTop: 20,
  },
  resendPrefix: {
    ...typography.body.mediumMedium,
    textAlign: "center",
    lineHeight: 20,
  },
  resendAction: {
    ...typography.body.mediumSemibold,
    lineHeight: 20,
  },
  error: {
    marginTop: 8,
    marginBottom: 4,
  },
});
