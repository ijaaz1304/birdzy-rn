/**
 * Verify Email Screen
 *
 * Used only for the forgot-password OTP flow (ForgotPassword → VerifyEmail →
 * CreateNewPassword). Signup skips this screen and goes straight to CompleteProfile.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
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
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { useTheme } from "../../../hooks/useTheme";
import { SCREEN_COLORS } from "../../../constants/colorConstants";
import { useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { useFeatureConfig } from "../../../config/context";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { AuthFieldError } from "../components/AuthFieldError";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";

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
  /** Keyboard rule: focused field + Verify CTA stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();
  const isDark = theme.mode === "dark";

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

  const textColor = theme.colors.textPrimary;
  const canResend = resendTimer <= 0;

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
            {/* Figma 8015:111087 — title + subtitle, 4pt apart */}
            <View style={styles.header}>
              <Text
                variant="title"
                size="small"
                numberOfLines={2}
                ellipsizeMode="tail"
                accessibilityRole="header"
                style={[authFormStyles.title, { color: textColor }]}
              >
                {screenTitle}
              </Text>
              {/* Body/14 Regular — wraps fully (it holds the email and the change link) */}
              <Text style={[authFormStyles.subtitle, { color: textColor }]}>
                We sent your code to {email || "your email"}, go ahead and enter
                it below.{" "}
                <Text
                  onPress={goChangeEmail}
                  accessibilityRole="link"
                  style={[
                    authFormStyles.subtitle,
                    styles.link,
                    { color: textColor },
                  ]}
                >
                  {vf.changeEmail}.
                </Text>
              </Text>
            </View>

            {/* Figma Textfield with label: label 14/20 Medium, 8pt gap, 48pt field */}
            <View
              style={[authFormStyles.fieldGroup, styles.codeGroup]}
              onLayout={kb.layout("code")}
            >
              <Text
                numberOfLines={2}
                style={[authFormStyles.fieldLabel, { color: textColor }]}
              >
                {vf.verificationCodeLabel}
              </Text>
              <Input
                testID="verify-code-input"
                onFocus={kb.focus("code")}
                placeholder={vf.verificationCodePlaceholder}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => {
                  if (code.length === 6 && !isLoading) onPressVerify();
                }}
                borderRadius={AUTH_TEXT_FIELD_RADIUS}
                hasError={!!error}
                containerStyle={authFormStyles.fieldContainer}
                wrapPlaceholder
                inputStyle={[authFormStyles.fieldText, { color: textColor }]}
              />
              {error ? <AuthFieldError message={error} /> : null}
            </View>

            {/* Figma 8598:32477 — Verify + resend row, 4pt apart */}
            <View style={styles.actions} onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="verify-submit"
                title="Verify"
                onPress={onPressVerify}
                disabled={code.length !== 6 || isLoading}
                loading={isLoading}
                style={{
                  ...authFormStyles.submit,
                  backgroundColor: theme.colors.primaryCTA,
                }}
                textStyle={authFormStyles.submitLabel}
                textColor={theme.colors.onPrimary}
              />

              <TouchableOpacity
                testID="verify-resend"
                onPress={async () => {
                  if (!canResend) return;
                  await handleResend();
                  setResendTimer(60);
                }}
                disabled={isLoading || !canResend}
                style={styles.resendRow}
                activeOpacity={canResend ? 0.7 : 1}
                accessibilityRole="button"
              >
                {/* Button/16 Medium — wraps and the row grows at large text */}
                <Text style={[styles.resendText, { color: textColor }]}>
                  {vf.resendPrefix}
                  <Text
                    style={[
                      styles.resendText,
                      canResend
                        ? [styles.link, { color: theme.colors.primaryCTA }]
                        : { color: theme.colors.textTertiary },
                    ]}
                  >
                    {vf.resend}
                    {canResend ? "" : ` ${resendTimer}s`}
                  </Text>
                </Text>
              </TouchableOpacity>
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
  link: {
    textDecorationLine: "underline",
  },
  /** Figma: 24pt between the header and the field */
  codeGroup: {
    marginTop: 24,
  },
  /** Figma: 16pt between the field and the actions; Verify and resend 4pt apart */
  actions: {
    marginTop: 16,
    gap: 4,
  },
  /** Figma resend row: 44pt minimum, centred, wraps at large text */
  resendRow: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Button/16px Medium 16/24 */
  resendText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
