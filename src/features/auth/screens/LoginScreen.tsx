import { AppImage } from "@/components/AppImage";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showAlert } from "../../../store/alert.store";
import { AuthButton } from "../components/AuthScreen";
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { Input } from "../../../molecules/Input/Input";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Text } from "../../../atoms/Text/Text";
import { ScreenContainer } from "../../../molecules";
import { useTheme } from "../../../hooks/useTheme";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
  useFocusEffect,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";
import { useFeatureConfig } from "../../../config/context";
import { useAuthStore } from "../auth.store";
import { resetToPostAuthOnboarding } from "../../post-auth-onboarding";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { ONBOARDING_STRINGS } from "../../../config/strings/onboarding.strings";
import { COMMON_STRINGS } from "../../../config/strings/common.strings";
import { SOCIAL_COLORS } from "../../../constants/colorConstants";
import { typography } from "../../../design-system/typography";
import { Images } from "../../../assets";
import { useToast } from "../../../hooks";
import { getRemoteConfigValue } from "../../../services/remoteConfig/remoteConfig.service";
import { isAppleLoginEnabled } from "../appleLoginFeature";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import type { AuthStackParamList } from "../../../navigation/types";

import { Radius } from "../../../design";

import { APP_COLORS } from "../../../config/colors";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { AuthFieldError } from "../components/AuthFieldError";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";
import { FONTS } from "../../../common/typography";

type LoginRouteProp = RouteProp<AuthStackParamList, "Login">;

export const LoginScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<LoginRouteProp>();
  const loginParams = route.params;

  const authConfig = useFeatureConfig("auth");
  const { login } = authConfig;
  const { showToast } = useToast();
  const {
    login: loginUser,
    guestLogin,
    isLoading,
    error,
    setError,
    setGuestId,
    guestId,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordSecure, setPasswordSecure] = useState(true);
  /** Keyboard rule: focused field + Sign in stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();
  const passwordRef = useRef<TextInput>(null);

  // Sync guest params from Settings so store has guestId for social login / SignUp
  useEffect(() => {
    if (loginParams?.guestId) {
      setGuestId(loginParams.guestId);
    }
  }, [loginParams?.guestId, setGuestId]);

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  const effectiveGuestId = loginParams?.guestId ?? guestId ?? null;

  const handleClose = useCallback(() => {
    if (__DEV__) (console as any).time("LoginScreen.goBack");
    const canGoBack = navigation.canGoBack();
    if (canGoBack) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Onboarding", params: { initialPage: -1 } }],
        })
      );
    }
    if (__DEV__) (console as any).timeEnd("LoginScreen.goBack");
    // Do NOT call Keyboard.dismiss() here — it blocks the transition for 5–6s on Android. Screen unmount hides the keyboard.
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(AUTH_STRINGS.alerts.error, AUTH_STRINGS.errors.emailRequired);
      return;
    }

    setError(null);
    try {
      await loginUser(email, password);
      requestAnimationFrame(() => {
        resetToPostAuthOnboarding(navigation as NavigationProp<ParamListBase>);
      });
    } catch (err: any) {
      const message =
        err?.data?.reason ||
        err?.message ||
        AUTH_STRINGS.errors.invalidCredentials;
      showAlert(AUTH_STRINGS.alerts.loginFailed, message);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setError(null);
    useAppLogsStore.getState().info("[AUTH] LoginScreen: social login tapped", {
      provider,
      guestId: effectiveGuestId ?? guestId ?? null,
    });
    try {
      const { socialLoginGoogle, socialLoginApple, guestId } =
        useAuthStore.getState();

      // Get social login service
      const {
        socialLoginService,
      } = require("../../../services/auth/socialLogin.service");

      let socialLoginRequest;

      if (provider === "google") {
        socialLoginRequest = await socialLoginService.signInWithGoogle(
          guestId || undefined
        );
        await socialLoginGoogle(socialLoginRequest, { entryPoint: "login" });
      } else if (provider === "apple") {
        if (!isAppleLoginEnabled()) {
          showAlert(
            AUTH_STRINGS.alerts.loginFailed,
            AUTH_STRINGS.errors.appleLoginUnavailable
          );
          return;
        }
        socialLoginRequest = await socialLoginService.signInWithApple(
          guestId || undefined
        );
        await socialLoginApple(socialLoginRequest, { entryPoint: "login" });
      } else {
        return;
      }

      requestAnimationFrame(() => {
        resetToPostAuthOnboarding(navigation as NavigationProp<ParamListBase>);
      });
    } catch (err: any) {
      // Don't show error for user cancellation
      if (
        err.message?.includes("cancelled") ||
        err.message?.includes("CANCELLED")
      ) {
        return;
      }
      const fallback =
        provider === "google"
          ? AUTH_STRINGS.errors.googleLoginFailed
          : AUTH_STRINGS.errors.appleLoginFailed;
      const message = err?.data?.reason || err?.message || fallback;
      useAppLogsStore
        .getState()
        .error("[AUTH] LoginScreen: social login failed", {
          provider,
          message,
        });
      showAlert(AUTH_STRINGS.alerts.loginFailed, message);
    }
  };

  const handleGuest = async () => {
    setError(null);
    try {
      const rawTimeout = getRemoteConfigValue("guestLoginTimeoutMs");
      const guestLoginTimeout = Math.max(Number(rawTimeout) || 30000, 30000);
      const guestLoginPromise = guestLogin(
        effectiveGuestId ?? guestId ?? undefined
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("GUEST_LOGIN_TIMEOUT")),
          guestLoginTimeout
        )
      );
      await Promise.race([guestLoginPromise, timeoutPromise]);
      const { token: savedToken } = useAuthStore.getState();
      if (!savedToken) {
        setError(
          AUTH_STRINGS.signUpScreen?.sessionNotReady ?? "Session not ready"
        );
        return;
      }
      const rawDelay = getRemoteConfigValue("guestLoginNavigationDelayMs");
      const navigationDelay = Math.max(Number(rawDelay) || 400, 300);
      setTimeout(() => {
        resetToPostAuthOnboarding(navigation as NavigationProp<ParamListBase>);
      }, navigationDelay);
    } catch (err: any) {
      console.error("Guest login error:", err);
      const isTimeout = err?.message === "GUEST_LOGIN_TIMEOUT";
      const message = isTimeout
        ? COMMON_STRINGS.messages.connectionTakingTooLong
        : err?.message ?? COMMON_STRINGS.messages.failedToContinueAsGuest;
      if (isTimeout) {
        showToast(message, "error", 5000);
      } else {
        setError(message);
      }
    }
  };

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const closeIconColor = theme.colors.text;
  const authLinkColor = APP_COLORS.ctaPrimary;
  const footerPromptColor = isDark ? theme.colors.textPrimary : "#111111";

  const socialBg =
    theme.mode === "dark"
      ? theme.colors.surfacePrimary
      : APP_COLORS.modalTextOnPrimary;
  const fieldTextStyle = [
    authFormStyles.fieldText,
    { color: theme.colors.textPrimary },
  ];

  return (
    <ScreenContainer
      showBackground={false}
      edges={[]}
      backgroundColor={isDark ? authBg : APP_COLORS.surfaceAuthLight}
    >
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View
          style={[
            authFormStyles.page,
            styles.layer,
            {
              paddingTop: insets.top,
              paddingBottom: kb.keyboardVisible
                ? 8
                : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Figma Top Navigation Bar — 52pt, × in a 40pt button, 12pt inset */}
          <View style={styles.closeRow}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <AppImage
                source={Images.navCancel}
                style={[styles.closeIcon, { tintColor: closeIconColor }]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            {...kb.scrollViewProps}
            style={authFormStyles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              kb.contentPaddingBottom > 0 && {
                paddingBottom: 8 + kb.contentPaddingBottom,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Figma Title/20px/SemiBold — page title, max 2 lines */}
            <Text
              variant="title"
              size="small"
              numberOfLines={2}
              ellipsizeMode="tail"
              accessibilityRole="header"
              style={[authFormStyles.title, styles.title]}
            >
              {login.title}
            </Text>

            {/* Figma SNS Buttons List — full-width buttons, 16pt apart */}
            <View style={styles.buttonList}>
              {Platform.OS === "ios" && (
                <AuthButton
                  icon="apple"
                  text={login.socialLogin.apple}
                  color={
                    theme.mode === "dark"
                      ? SOCIAL_COLORS.APPLE_DARK
                      : SOCIAL_COLORS.APPLE_LIGHT
                  }
                  onPress={() => handleSocialLogin("apple")}
                  buttonBackgroundColor={socialBg}
                  style={styles.listButton}
                />
              )}
              <AuthButton
                icon="google"
                text={login.socialLogin.google}
                color={SOCIAL_COLORS.GOOGLE}
                onPress={() => handleSocialLogin("google")}
                buttonBackgroundColor={socialBg}
                style={styles.listButton}
              />
              <AuthButton
                showIcon={false}
                text={ONBOARDING_STRINGS.continueAsGuest}
                color={theme.colors.textPrimary}
                disabled={isLoading}
                onPress={handleGuest}
                buttonBackgroundColor={socialBg}
                style={styles.listButton}
              />
            </View>

            {/* Figma 8015:112762 — line · "or" · line, 8pt gap, 16pt above and below */}
            <View style={styles.orDivider}>
              <View
                style={[
                  styles.orLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <Text
                style={[styles.orText, { color: theme.colors.textTertiary }]}
              >
                {login.orText}
              </Text>
              <View
                style={[
                  styles.orLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            {/* Figma: fields 16pt apart, Forgot password 16pt below, Sign in 16pt below that */}
            <View style={styles.fields} onLayout={kb.layout("form")}>
              <View onLayout={kb.layout("email", "form")}>
                <Input
                  testID="login-email-input"
                  onFocus={kb.focus("email")}
                  placeholder={login.emailPlaceholder}
                  value={email}
                  onChangeText={(text: string) => {
                    setEmail(text);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
              </View>
              <View
                style={authFormStyles.fieldGroup}
                onLayout={kb.layout("password", "form")}
              >
                <Input
                  ref={passwordRef}
                  testID="login-password-input"
                  onFocus={kb.focus("password")}
                  placeholder={login.passwordPlaceholder}
                  secure={passwordSecure}
                  toggleSecure={() => setPasswordSecure((prev) => !prev)}
                  value={password}
                  onChangeText={(text: string) => {
                    setPassword(text);
                    setError(null);
                  }}
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={() => {
                    if (email && password && !isLoading) handleLogin();
                  }}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  hasError={!!error}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
                {error ? <AuthFieldError message={error} /> : null}
              </View>
            </View>

            <TouchableOpacity
              testID="login-forgot-password"
              style={styles.forgotPassword}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="button"
              onPress={() => {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: "AuthStack",
                    params: { screen: "ForgotPassword" },
                  })
                );
              }}
            >
              <Text style={[styles.forgotText, { color: authLinkColor }]}>
                {login.forgotPasswordText}
              </Text>
            </TouchableOpacity>

            <View onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="login-submit"
                title={login.signInButtonText}
                onPress={handleLogin}
                loading={isLoading}
                style={{
                  ...authFormStyles.submit,
                  marginTop: 16,
                  backgroundColor: theme.colors.primaryCTA,
                }}
                textStyle={authFormStyles.submitLabel}
                textColor={theme.colors.onPrimary}
              />
            </View>

            {/* Pushes the footer to the bottom when the form is short; scrolls with it when long */}
            <View style={styles.spacer} />

            {/* "New to Birdzy? Sign up" — 44pt row, wraps at larger text sizes */}
            <View style={styles.footer}>
              <Text style={[styles.footerLabel, { color: footerPromptColor }]}>
                {login.signUpPromptText}{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: "AuthStack",
                      params: {
                        screen: "SignUp",
                        params:
                          effectiveGuestId && loginParams?.fromGuest
                            ? { guestId: effectiveGuestId, fromGuest: true }
                            : undefined,
                      },
                    })
                  );
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="link"
              >
                <Text
                  style={[
                    styles.footerLabel,
                    { color: authLinkColor, textDecorationLine: "underline" },
                  ]}
                >
                  {login.signUpLinkText}
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
  layer: {
    zIndex: 1,
  },
  /** Nav bar: 52pt, × button 12pt from the right edge (page already insets 20) */
  closeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 52,
    marginRight: -8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 8,
  },
  /** Figma: 20pt between the title and the buttons */
  title: {
    marginBottom: 20,
  },
  buttonList: {
    gap: 16,
  },
  listButton: {
    marginTop: 0,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  /** Body/16px/Regular, tertiary */
  orText: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  fields: {
    gap: 16,
  },
  /** Figma Forgot password button: 28pt row, 16pt below the fields */
  forgotPassword: {
    marginTop: 16,
    minHeight: 28,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  /** Button/14px Medium, brand */
  forgotText: {
    ...typography.body.mediumMedium,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  /** Button/16px — "New to Birdzy?" + link */
  footerLabel: {
    ...typography.button.large,
    textAlign: "center",
  },
});
