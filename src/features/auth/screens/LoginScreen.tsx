import { AppImage } from "@/components/AppImage";
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
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
      useAppLogsStore.getState().error("[AUTH] LoginScreen: social login failed", {
        provider,
        message,
      });
      showAlert(AUTH_STRINGS.alerts.loginFailed, message);
    }
  };

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const closeIconColor = theme.colors.text;
  const authLinkColor = APP_COLORS.ctaPrimary;
  const footerPromptColor = isDark ? theme.colors.textPrimary : "#111111";

  return (
    <ScreenContainer
      showBackground={false}
      edges={[]}
      backgroundColor={isDark ? authBg : APP_COLORS.surfaceAuthLight}
    >
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.closeRow}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppImage
              source={Images.navCancel}
              style={[styles.closeIcon, { tintColor: closeIconColor }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <Text variant="title" size="large" weight="bold" style={styles.title}>
          {login.title}
        </Text>
      </View>
      <View style={styles.container}>
        {/* Apple – iOS only */}
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
            buttonBackgroundColor={
              theme.mode === "dark"
                ? theme.colors.surfacePrimary
                : APP_COLORS.modalTextOnPrimary
            }
          />
        )}

        {/* Google */}
        <AuthButton
          icon="google"
          text={login.socialLogin.google}
          color={SOCIAL_COLORS.GOOGLE}
          onPress={() => handleSocialLogin("google")}
          buttonBackgroundColor={
            theme.mode === "dark"
              ? theme.colors.surfacePrimary
              : APP_COLORS.modalTextOnPrimary
          }
        />

        <AuthButton
          showIcon={false}
          text={ONBOARDING_STRINGS.continueAsGuest}
          color={theme.colors.textPrimary}
          disabled={isLoading}
          onPress={async () => {
            setError(null);
            try {
              const rawTimeout = getRemoteConfigValue("guestLoginTimeoutMs");
              const guestLoginTimeout = Math.max(
                Number(rawTimeout) || 30000,
                30000
              );
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
                  AUTH_STRINGS.signUpScreen?.sessionNotReady ??
                    "Session not ready"
                );
                return;
              }
              const rawDelay = getRemoteConfigValue(
                "guestLoginNavigationDelayMs"
              );
              const navigationDelay = Math.max(Number(rawDelay) || 400, 300);
              setTimeout(() => {
                resetToPostAuthOnboarding(navigation as NavigationProp<ParamListBase>);
              }, navigationDelay);
            } catch (err: any) {
              console.error("Guest login error:", err);
              const isTimeout = err?.message === "GUEST_LOGIN_TIMEOUT";
              const message = isTimeout
                ? COMMON_STRINGS.messages.connectionTakingTooLong
                : err?.message ??
                  COMMON_STRINGS.messages.failedToContinueAsGuest;
              if (isTimeout) {
                showToast(message, "error", 5000);
              } else {
                setError(message);
              }
            }
          }}
          buttonBackgroundColor={
            theme.mode === "dark"
              ? theme.colors.surfacePrimary
              : APP_COLORS.modalTextOnPrimary
          }
        />

        <View style={styles.orDivider}>
          <View
            style={[styles.orLine, { backgroundColor: theme.colors.border }]}
          />
          <Text
            variant="body"
            size="medium"
            color="textTertiary"
            style={styles.orText}
          >
            {login.orText}
          </Text>
          <View
            style={[styles.orLine, { backgroundColor: theme.colors.border }]}
          />
        </View>

        <View>
          <Input
            placeholder={login.emailPlaceholder}
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            borderRadius={AUTH_TEXT_FIELD_RADIUS}
          />
          <Input
            placeholder={login.passwordPlaceholder}
            secure={passwordSecure}
            toggleSecure={() => setPasswordSecure((prev) => !prev)}
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              setError(null);
            }}
            borderRadius={AUTH_TEXT_FIELD_RADIUS}
          />
          {error && (
            <Text
              variant="body"
              size="small"
              color="error"
              style={styles.errorText}
            >
              {error}
            </Text>
          )}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: "AuthStack",
                  params: { screen: "ForgotPassword" },
                })
              );
            }}
          >
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={[styles.forgotText, { color: authLinkColor }]}
            >
              {login.forgotPasswordText}
            </Text>
          </TouchableOpacity>
          <PrimaryButton
            title={login.signInButtonText}
            onPress={handleLogin}
            loading={isLoading}
            style={{
              width: "100%",
              minHeight: 52,
              marginTop: 16,
              backgroundColor: theme.colors.primaryCTA,
              borderRadius: AUTH_TEXT_FIELD_RADIUS,
            }}
            textColor={theme.colors.onPrimary}
          />
        </View>

        <View
          style={[
            styles.footer,
            {
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text
            variant="body"
            size="medium"
            weight="medium"
            style={[styles.footerLabel, { color: footerPromptColor }]}
          >
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
          >
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={[
                styles.footerLink,
                { color: authLinkColor, textDecorationLine: "underline" },
              ]}
            >
              {login.signUpLinkText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    zIndex: 100,
  },
  closeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 32,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  titleBlock: {
    marginBottom: 20,
  },
  titlePrefix: {
    marginBottom: 4,
  },
  appName: {},
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    zIndex: 1,
  },
  title: {
    marginTop: 20,
    marginBottom: 20,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    textAlign: "center",
  },
  forgotPassword: {
    marginTop: 12,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  forgotText: {
    ...typography.body.mediumMedium,
  },
  footer: {
    marginTop: "auto",
    marginBottom: 16,
    paddingBottom: 8,
  },
  /** Button/16px – "New to Birdzy?" (#111, medium) */
  footerLabel: {
    ...typography.button.large,
    textAlign: "center",
  },
  /** Button/16px – brand link */
  footerLink: {
    ...typography.button.large,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
  },
});
