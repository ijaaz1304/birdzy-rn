import { AppImage } from "@/components/AppImage";
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard } from "react-native";
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
import type { AuthStackParamList } from "../../../navigation/types";
import { AuthButton } from "../components/AuthScreen";
import {
  AuthScreenBackground,
  AuthScreenStatusBar,
} from "../components/AuthScreenBackground";
import { Input } from "../../../molecules/Input/Input";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Text, NavBackIcon } from "../../../atoms";
import { ScreenContainer } from "../../../molecules";
import { useTheme } from "../../../hooks/useTheme";
import { useAuthStore } from "../auth.store";
import { resetToPostAuthOnboarding } from "../../post-auth-onboarding";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { ONBOARDING_STRINGS } from "../../../config/strings/onboarding.strings";
import { getRemoteConfigValue } from "../../../services/remoteConfig/remoteConfig.service";
import { isAppleLoginEnabled } from "../appleLoginFeature";
import {
  SOCIAL_COLORS,
  SCREEN_COLORS,
} from "../../../constants/colorConstants";
import { COMMON_STRINGS } from "../../../config/strings/common.strings";
import { Images } from "../../../assets";
import { useToast } from "../../../hooks";
import {
  getPrivacyPolicyUrl,
  getTermsOfServiceUrl,
} from "../../../constants/legalUrls";
import { typography } from "../../../design-system/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

import { APP_COLORS } from "../../../config/colors";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";

type SignUpRouteProp = RouteProp<AuthStackParamList, "SignUp">;
type SignUpNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "SignUp"
>;

export const SignUpScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpNavigationProp>();
  const route = useRoute<SignUpRouteProp>();
  const { showToast } = useToast();
  const { guestLogin, guestId, isLoading, setError, setGuestId } =
    useAuthStore();

  // Sync guest params when navigating from Login (guest upgrade flow)
  useEffect(() => {
    if (route.params?.guestId) {
      setGuestId(route.params.guestId);
    }
  }, [route.params?.guestId, setGuestId]);

  const handleSocialLogin = useCallback(
    async (provider: "google" | "apple") => {
      setError(null);
      try {
        const { socialLoginGoogle, socialLoginApple } = useAuthStore.getState();
        const {
          socialLoginService,
        } = require("../../../services/auth/socialLogin.service");
        let socialLoginRequest;
        if (provider === "google") {
          socialLoginRequest = await socialLoginService.signInWithGoogle(
            guestId || undefined
          );
          await socialLoginGoogle(socialLoginRequest, { entryPoint: "signup" });
        } else {
          if (!isAppleLoginEnabled()) {
            showAlert(
              AUTH_STRINGS.alerts.signupFailed,
              AUTH_STRINGS.errors.appleLoginUnavailable
            );
            return;
          }
          socialLoginRequest = await socialLoginService.signInWithApple(
            guestId || undefined
          );
          await socialLoginApple(socialLoginRequest, { entryPoint: "signup" });
        }
        await AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");
        requestAnimationFrame(() => {
          navigation.dispatch(
            CommonActions.navigate({ name: "CompleteProfile" })
          );
        });
      } catch (err: any) {
        if (
          err.message?.includes("cancelled") ||
          err.message?.includes("CANCELLED")
        )
          return;
        const fallback =
          provider === "google"
            ? AUTH_STRINGS.errors.googleLoginFailed
            : AUTH_STRINGS.errors.appleLoginFailed;
        const message = err?.data?.reason ?? err?.message ?? fallback;
        showAlert(AUTH_STRINGS.alerts.signupFailed, message);
      }
    },
    [guestId, navigation, setError]
  );

  const handleCloseToOnboardingLastPage = useCallback(() => {
    if (__DEV__) (console as any).time("SignUpScreen.goBack");
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
    if (__DEV__) (console as any).timeEnd("SignUpScreen.goBack");
    // Do NOT call Keyboard.dismiss() here — it blocks the transition for 5–6s on Android. Screen unmount hides the keyboard.
  }, [navigation]);

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const closeIconColor = theme.colors.text;
  const emailIconColor = isDark
    ? APP_COLORS.modalTextOnPrimary
    : APP_COLORS.surfaceDark;
  const legalLinkColor = isDark
    ? theme.colors.textPrimary
    : APP_COLORS.surfaceDark;

  const signUpContent = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.closeRow}>
          <TouchableOpacity
            onPress={handleCloseToOnboardingLastPage}
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
          {AUTH_STRINGS.signUp.title}
        </Text>
      </View>
      <View style={styles.scroll}>
        <ScrollView
          style={styles.scrollInner}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Apple – iOS only */}
          {Platform.OS === "ios" && (
            <AuthButton
              icon="apple"
              text={AUTH_STRINGS.signUpScreen.continueWithApple}
              color={
                theme.mode === "dark"
                  ? SOCIAL_COLORS.APPLE_DARK
                  : SOCIAL_COLORS.APPLE_LIGHT
              }
              onPress={() => handleSocialLogin("apple")}
              buttonBackgroundColor={
                theme.mode === "dark"
                  ? APP_COLORS.surfaceDark
                  : APP_COLORS.modalTextOnPrimary
              }
            />
          )}

          {/* Google */}
          <AuthButton
            icon="google"
            text={AUTH_STRINGS.signUpScreen.continueWithGoogle}
            color={SOCIAL_COLORS.GOOGLE}
            onPress={() => handleSocialLogin("google")}
            buttonBackgroundColor={
              theme.mode === "dark"
                ? APP_COLORS.surfaceDark
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
              {AUTH_STRINGS.signUp.or}
            </Text>
            <View
              style={[styles.orLine, { backgroundColor: theme.colors.border }]}
            />
          </View>

          <AuthButton
            icon="email"
            text={AUTH_STRINGS.signUpScreen.continueWithEmail}
            color={emailIconColor}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: "AuthStack",
                  params: { screen: "Register" },
                })
              );
            }}
            buttonBackgroundColor={
              theme.mode === "dark"
                ? APP_COLORS.surfaceDark
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

                const guestLoginPromise = guestLogin(guestId || undefined);
                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(
                    () => reject(new Error("GUEST_LOGIN_TIMEOUT")),
                    guestLoginTimeout
                  )
                );

                await Promise.race([guestLoginPromise, timeoutPromise]);

                const { token: savedToken } = useAuthStore.getState();
                if (!savedToken) {
                  setError(AUTH_STRINGS.signUpScreen.sessionNotReady);
                  return;
                }

                const navigationDelay = Math.max(
                  getRemoteConfigValue("guestLoginNavigationDelayMs") ?? 400,
                  300
                );
                setTimeout(() => {
                  resetToPostAuthOnboarding(navigation);
                }, navigationDelay);
              } catch (err: any) {
                console.error("Guest login error:", err);
                const isTimeout = err?.message === "GUEST_LOGIN_TIMEOUT";
                const message = isTimeout
                  ? COMMON_STRINGS.messages.connectionTakingTooLong
                  : err?.message || COMMON_STRINGS.messages.somethingWentWrong;
                if (isTimeout) {
                  showToast(message, "error", 5000);
                } else {
                  setError(message);
                }
              }
            }}
            buttonBackgroundColor={
              theme.mode === "dark"
                ? APP_COLORS.surfaceDark
                : APP_COLORS.modalTextOnPrimary
            }
          />
        </ScrollView>

        <View
          style={[
            styles.footerSection,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
        >
          <View style={styles.footer}>
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={[
                styles.footerLabel,
                {
                  color: isDark ? theme.colors.textPrimary : "#111111",
                },
              ]}
            >
              {AUTH_STRINGS.signUp.hasAccount}{" "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: "AuthStack",
                    params: { screen: "Login" },
                  })
                );
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                variant="body"
                size="medium"
                color="primary"
                style={[styles.footerLink, { textDecorationLine: "underline" }]}
              >
                Log in
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.termsCaption}
          >
            By creating an account, you agree to our{" "}
            <Text
              variant="body"
              size="small"
              style={[
                styles.termsLink,
                { color: legalLinkColor, textDecorationLine: "underline" },
              ]}
              onPress={() =>
                navigation.navigate("LegalWebView", {
                  url: getPrivacyPolicyUrl(),
                  title: "Privacy Policy",
                })
              }
            >
              {AUTH_STRINGS.signUpScreen.privacyPolicy}
            </Text>{" "}
            and{" "}
            <Text
              variant="body"
              size="small"
              style={[
                styles.termsLink,
                { color: legalLinkColor, textDecorationLine: "underline" },
              ]}
              onPress={() =>
                navigation.navigate("LegalWebView", {
                  url: getTermsOfServiceUrl(),
                  title: AUTH_STRINGS.signUpScreen.termsOfConditionsTitle,
                })
              }
            >
              {AUTH_STRINGS.signUpScreen.termsOfConditions}
            </Text>
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <ScreenContainer
      showBackground={false}
      edges={[]}
      backgroundColor={isDark ? authBg : APP_COLORS.surfaceAuthLight}
    >
      <AuthScreenStatusBar isDark={isDark} />
      <AuthScreenBackground isDark={isDark} />
      {signUpContent}
    </ScreenContainer>
  );
};

export const SignupEmailScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signup, guestId, isLoading, error, setError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordSecure, setPasswordSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const isInvalidEmail = email.length > 0 && !email.includes("@");
  const passwordsMatch = password === confirm;
  const isFormValid =
    email && password && confirm && passwordsMatch && !isInvalidEmail;

  const formScreenColors =
    theme.mode === "dark" ? SCREEN_COLORS.DARK : SCREEN_COLORS.LIGHT;
  const isDark = theme.mode === "dark";
  const backIconColor = isDark
    ? SCREEN_COLORS.DARK.text
    : APP_COLORS.surfaceDark;

  const handleSignUp = async () => {
    if (!isFormValid) {
      showAlert(
        AUTH_STRINGS.alerts.error,
        AUTH_STRINGS.errors.fieldsRequired
      );
      return;
    }

    setError(null);
    try {
      await signup({
        email,
        password,
        guestId: guestId || undefined,
      });
      await AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");
      navigation.dispatch(
        CommonActions.navigate({ name: "CompleteProfile" })
      );
    } catch (err: any) {
      showAlert(
        AUTH_STRINGS.alerts.signupFailed,
        err.message || AUTH_STRINGS.errors.signupFailed
      );
    }
  };

  return (
    <ScreenContainer
      showBackground={false}
      backgroundColor={formScreenColors.background}
      edges={[]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View
          style={[
            styles.emailPage,
            {
              paddingTop: insets.top + 28,
              paddingBottom: keyboardVisible
                ? 8
                : Math.max(insets.bottom, 16),
            },
          ]}
        >
          <ScrollView
            style={styles.emailBody}
            contentContainerStyle={styles.emailBodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.emailBackButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <NavBackIcon color={backIconColor} />
            </TouchableOpacity>

            <Text
              variant="title"
              size="small"
              weight="bold"
              style={[styles.screenHeaderTitle, styles.emailFormTitle]}
            >
              Sign up with email
            </Text>

            <Input
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                setError(null);
              }}
              placeholder={AUTH_STRINGS.placeholders.email}
              keyboardType="email-address"
              autoCapitalize="none"
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
            />

            {isInvalidEmail && (
              <Text
                variant="body"
                size="small"
                color="error"
                style={styles.error}
              >
                Hmm, that doesn't look like a valid email.
              </Text>
            )}

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={AUTH_STRINGS.placeholders.password}
              secure={passwordSecure}
              toggleSecure={() => setPasswordSecure((prev) => !prev)}
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
            />

            <Input
              value={confirm}
              onChangeText={setConfirm}
              placeholder={AUTH_STRINGS.placeholders.confirmPassword}
              secure={confirmSecure}
              toggleSecure={() => setConfirmSecure((prev) => !prev)}
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
            />

            {confirm && !passwordsMatch && (
              <Text
                variant="body"
                size="small"
                color="error"
                style={styles.error}
              >
                Passwords do not match.
              </Text>
            )}

            {error && (
              <Text
                variant="body"
                size="small"
                color="error"
                style={styles.error}
              >
                {error}
              </Text>
            )}

            <View style={styles.emailFooter}>
              <PrimaryButton
                title={AUTH_STRINGS.signUpScreen.signUpTitle}
                style={{
                  backgroundColor: theme.colors.primaryCTA,
                  borderRadius: AUTH_TEXT_FIELD_RADIUS,
                }}
                textColor={theme.colors.onPrimary}
                onPress={handleSignUp}
                disabled={!isFormValid || isLoading}
                loading={isLoading}
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
  emailPage: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emailBody: {
    flex: 1,
  },
  emailBodyContent: {
    paddingBottom: 24,
  },
  emailBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: -10,
  },
  emailFooter: {
    paddingTop: 20,
  },
  emailFormTitle: {
    marginTop: 16,
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollInner: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 0,
  },
  footerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
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
  title: {
    marginTop: 32,
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
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },
  /** Button/16px – "Already have an account?" (#111, medium 500) */
  footerLabel: {
    ...typography.button.large,
    textAlign: "center",
  },
  /** Button/16px – brand link */
  footerLink: {
    ...typography.button.large,
  },
  /** Caption/12px/Regular – secondary (#5D5D5D), center (By creating...) */
  termsCaption: {
    ...typography.caption.regular,
    marginTop: 16,
    marginBottom: 0,
    textAlign: "center",
  },
  /** Caption/12px/Regular – brand primary, underline (privacy / terms links) */
  termsLink: {
    ...typography.caption.regular,
  },
  /** Title/20px/SemiBold – header for sign up with email, verify, etc. */
  screenHeaderTitle: {
    ...typography.title.small,
    fontFamily: FONTS.bold,
  },
  error: {
    marginTop: 6,
  },
});
