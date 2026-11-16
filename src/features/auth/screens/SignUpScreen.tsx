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
import { AuthFieldError } from "../components/AuthFieldError";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";
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
  const authLinkColor = APP_COLORS.ctaPrimary;
  const legalLinkColor = isDark
    ? theme.colors.textPrimary
    : APP_COLORS.surfaceDark;

  const signUpContent = (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Figma 8015:111036 — 52pt nav bar, × in a 40pt button, 12pt inset */}
        <View style={styles.closeRow}>
          <TouchableOpacity
            onPress={handleCloseToOnboardingLastPage}
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
        {/* Figma Title/20px/SemiBold — 20/28, page title wraps to max 2 lines */}
        <Text
          variant="title"
          size="small"
          numberOfLines={2}
          ellipsizeMode="tail"
          accessibilityRole="header"
          style={[styles.title, styles.screenHeaderTitle]}
        >
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
          <View style={styles.buttonList}>
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
                style={styles.listButton}
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
              style={styles.listButton}
              buttonBackgroundColor={
                theme.mode === "dark"
                  ? APP_COLORS.surfaceDark
                  : APP_COLORS.modalTextOnPrimary
              }
            />

            <View style={styles.orDivider}>
              <View
                style={[
                  styles.orLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <Text
                variant="body"
                size="medium"
                style={[styles.orText, { color: theme.colors.textTertiary }]}
              >
                {AUTH_STRINGS.signUp.or}
              </Text>
              <View
                style={[
                  styles.orLine,
                  { backgroundColor: theme.colors.border },
                ]}
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
              style={styles.listButton}
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
                  const rawTimeout = getRemoteConfigValue(
                    "guestLoginTimeoutMs"
                  );
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
                    : err?.message ||
                      COMMON_STRINGS.messages.somethingWentWrong;
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
              style={styles.listButton}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footerSection,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
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
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              accessibilityRole="link"
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
  /** Keyboard rule: focused field + Sign up CTA stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();
  /** Keyboard Next → next field; Done on the last field submits. */
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      setError(null);
    }, [setError])
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordSecure, setPasswordSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const isInvalidEmail = email.length > 0 && !email.includes("@");
  const passwordsMatch = password === confirm;
  const isFormValid =
    email &&
    password &&
    confirm &&
    passwordsMatch &&
    !isInvalidEmail &&
    SIGNUP_PASSWORD_RULE.test(password);

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const backIconColor = isDark
    ? SCREEN_COLORS.DARK.text
    : APP_COLORS.surfaceDark;

  const handleSignUp = async () => {
    if (!isFormValid) {
      showAlert(AUTH_STRINGS.alerts.error, AUTH_STRINGS.errors.fieldsRequired);
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
      navigation.dispatch(CommonActions.navigate({ name: "CompleteProfile" }));
    } catch (err: any) {
      showAlert(
        AUTH_STRINGS.alerts.signupFailed,
        err.message || AUTH_STRINGS.errors.signupFailed
      );
    }
  };

  const passwordTooWeak =
    password.length > 0 && !SIGNUP_PASSWORD_RULE.test(password);
  const confirmMismatch = confirm.length > 0 && !passwordsMatch;
  const fieldTextStyle = [
    authFormStyles.fieldText,
    { color: theme.colors.textPrimary },
  ];

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
            {/* Figma Title/20px/SemiBold — page title, max 2 lines */}
            <Text
              variant="title"
              size="small"
              numberOfLines={2}
              ellipsizeMode="tail"
              accessibilityRole="header"
              style={[authFormStyles.title, styles.emailFormTitle]}
            >
              Sign up with email
            </Text>

            {/* Figma: fields 16pt apart; helper/error row 8pt under its field */}
            <View style={styles.emailFields} onLayout={kb.layout("fields")}>
              <View
                style={authFormStyles.fieldGroup}
                onLayout={kb.layout("email", "fields")}
              >
                <Input
                  testID="signup-email-input"
                  onFocus={kb.focus("email")}
                  value={email}
                  onChangeText={(text: string) => {
                    setEmail(text);
                    setError(null);
                  }}
                  placeholder={AUTH_STRINGS.placeholders.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  hasError={isInvalidEmail}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
                {isInvalidEmail && (
                  <AuthFieldError message="Hmm, that doesn’t look like a valid email." />
                )}
              </View>

              <View
                style={authFormStyles.fieldGroup}
                onLayout={kb.layout("password", "fields")}
              >
                <Input
                  ref={passwordRef}
                  testID="signup-password-input"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  onFocus={kb.focus("password")}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={AUTH_STRINGS.placeholders.password}
                  secure={passwordSecure}
                  toggleSecure={() => setPasswordSecure((prev) => !prev)}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  hasError={passwordTooWeak}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
                {passwordTooWeak && (
                  <AuthFieldError message={SIGNUP_PASSWORD_RULE_MESSAGE} />
                )}
              </View>

              <View
                style={authFormStyles.fieldGroup}
                onLayout={kb.layout("confirm", "fields")}
              >
                <Input
                  ref={confirmRef}
                  testID="signup-confirm-input"
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={() => {
                    if (isFormValid && !isLoading) handleSignUp();
                  }}
                  onFocus={kb.focus("confirm")}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder={AUTH_STRINGS.placeholders.confirmPassword}
                  secure={confirmSecure}
                  toggleSecure={() => setConfirmSecure((prev) => !prev)}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  hasError={confirmMismatch}
                  containerStyle={authFormStyles.fieldContainer}
                  wrapPlaceholder
                  inputStyle={fieldTextStyle}
                />
                {confirmMismatch && (
                  <AuthFieldError message="Passwords do not match." />
                )}
              </View>

              {error ? <AuthFieldError message={error} /> : null}
            </View>

            <View onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="signup-email-submit"
                title={AUTH_STRINGS.signUpScreen.signUpTitle}
                style={{
                  ...authFormStyles.submit,
                  marginTop: 16,
                  backgroundColor: theme.colors.primaryCTA,
                }}
                textStyle={authFormStyles.submitLabel}
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

/** Figma 8015:111123 — same rule as Settings › Change password. */
const SIGNUP_PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const SIGNUP_PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include a number, an uppercase and a lowercase letter.";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  authFormLayer: {
    zIndex: 1,
  },
  /** Figma: title 16pt below the nav bar, 24pt above the fields */
  emailFormTitle: {
    marginTop: 16,
    marginBottom: 24,
  },
  emailFields: {
    gap: 16,
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
  /** Nav bar: 52pt, × button 12pt from the right edge (header already insets 20) */
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
  /** Figma: title 16pt below the nav bar, buttons 20pt below the title */
  title: {
    marginTop: 16,
    marginBottom: 20,
  },
  /** Figma SNS Buttons List: full-width buttons, 16pt apart */
  buttonList: {
    gap: 16,
  },
  listButton: {
    marginTop: 0,
  },
  /** Figma 8015:111044 — line · "or" · line, 8pt gap */
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  /** Body/16px/Regular, #888 */
  orText: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  /** "Already have an account? Log in" — 44pt row, wraps at larger text sizes */
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
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
    marginTop: 8,
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
});
