import { AppImage } from "@/components/AppImage";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Text as RNText,
  TextInput,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
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
import {
  AUTH_TEXT_FIELD_RADIUS,
  AUTH_BACK_BUTTON_LEFT_OFFSET,
} from "../constants/authFormLayout";

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  /**
   * Keyboard rule (responsiveness doc): keep the focused field AND the Sign up CTA visible.
   * When the keyboard opens (or focus moves), scroll down just enough to reveal the CTA —
   * but never so far that the focused field's top leaves the viewport.
   */
  const scrollRef = useRef<ScrollView>(null);
  const scrollWrapRef = useRef<View>(null);
  /** Scroll height left above the keyboard (0 = whole scroll view visible). */
  const visibleH = useRef(0);
  const [kbOverlap, setKbOverlap] = useState(0);
  /** Keyboard Next → next field; Done on the last field submits (CTA may sit behind the keyboard on Android 15+). */
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const kbVisibleRef = useRef(false);
  const viewportH = useRef(0);
  const scrollY = useRef(0);
  const fieldsY = useRef(0);
  const groupY = useRef<number[]>([0, 0, 0]);
  const ctaBottom = useRef(0);
  const focusedIdx = useRef<number | null>(null);
  const revealCta = useCallback(() => {
    if (
      !kbVisibleRef.current ||
      focusedIdx.current == null ||
      !viewportH.current
    )
      return;
    const focusTop = fieldsY.current + groupY.current[focusedIdx.current];
    const visible =
      visibleH.current > 0
        ? Math.min(viewportH.current, visibleH.current)
        : viewportH.current;
    const target = Math.min(ctaBottom.current + 8 - visible, focusTop - 8);
    if (target > scrollY.current + 1) {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }
  }, []);
  const onFieldFocus = (i: number) => () => {
    focusedIdx.current = i;
    setTimeout(revealCta, 120);
  };

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
    const showSub = Keyboard.addListener(showEvent, (e) => {
      kbVisibleRef.current = true;
      setKeyboardVisible(true);
      if (Platform.OS === "ios") {
        // KeyboardAvoidingView already shrinks the layout on iOS.
        visibleH.current = 0;
        setTimeout(revealCta, 120);
        return;
      }
      // Android 15+ edge-to-edge: the window no longer resizes and RN can report a
      // bogus keyboard height (e.g. -24). Fall back to a conservative estimate.
      const reported = e?.endCoordinates?.height ?? 0;
      if (reported <= 0) {
        // Edge-to-edge: the scroll view runs to the window bottom (minus the 8pt keyboard-open
        // page padding), so the overlap is the estimated keyboard height minus that padding.
        const overlap = Math.max(
          0,
          Dimensions.get("window").height * ANDROID_KEYBOARD_FALLBACK_SHARE - 8
        );
        visibleH.current = Math.max(0, viewportH.current - overlap);
        setKbOverlap(overlap);
        setTimeout(revealCta, 150);
        return;
      }
      const kbTop = e.endCoordinates.screenY;
      scrollWrapRef.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = Math.max(0, y + h - kbTop);
        visibleH.current = overlap > 0 ? Math.max(0, kbTop - y) : 0;
        // Extra bottom room so the form can scroll above the keyboard.
        setKbOverlap(overlap);
        setTimeout(revealCta, 150);
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      kbVisibleRef.current = false;
      visibleH.current = 0;
      setKbOverlap(0);
      setKeyboardVisible(false);
    });
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
    styles.fieldText,
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
            styles.emailPage,
            {
              paddingTop: insets.top,
              paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Figma Top Navigation Bar — 52pt, stays fixed while the form scrolls */}
          <View style={styles.emailNavRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.emailBackButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <NavBackIcon color={backIconColor} />
            </TouchableOpacity>
          </View>
          <View
            ref={scrollWrapRef}
            style={styles.emailBody}
            collapsable={false}
          >
            <ScrollView
              ref={scrollRef}
              onLayout={(e) => {
                viewportH.current = e.nativeEvent.layout.height;
                revealCta();
              }}
              onScroll={(e) => {
                scrollY.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              style={styles.emailBody}
              contentContainerStyle={[
                styles.emailBodyContent,
                kbOverlap > 0 && { paddingBottom: 24 + kbOverlap },
              ]}
              keyboardShouldPersistTaps="handled"
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
                style={[styles.screenHeaderTitle, styles.emailFormTitle]}
              >
                Sign up with email
              </Text>

              {/* Figma: fields 16pt apart; helper/error row 8pt under its field */}
              <View
                style={styles.emailFields}
                onLayout={(e) => {
                  fieldsY.current = e.nativeEvent.layout.y;
                }}
              >
                <View
                  style={styles.fieldGroup}
                  onLayout={(e) => {
                    groupY.current[0] = e.nativeEvent.layout.y;
                  }}
                >
                  <Input
                    testID="signup-email-input"
                    onFocus={onFieldFocus(0)}
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
                    containerStyle={styles.fieldContainer}
                    inputStyle={fieldTextStyle}
                  />
                  {isInvalidEmail && (
                    <SignupFieldError message="Hmm, that doesn’t look like a valid email." />
                  )}
                </View>

                <View
                  style={styles.fieldGroup}
                  onLayout={(e) => {
                    groupY.current[1] = e.nativeEvent.layout.y;
                  }}
                >
                  <Input
                    ref={passwordRef}
                    testID="signup-password-input"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    onFocus={onFieldFocus(1)}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={AUTH_STRINGS.placeholders.password}
                    secure={passwordSecure}
                    toggleSecure={() => setPasswordSecure((prev) => !prev)}
                    borderRadius={AUTH_TEXT_FIELD_RADIUS}
                    hasError={passwordTooWeak}
                    containerStyle={styles.fieldContainer}
                    inputStyle={fieldTextStyle}
                  />
                  {passwordTooWeak && (
                    <SignupFieldError message={SIGNUP_PASSWORD_RULE_MESSAGE} />
                  )}
                </View>

                <View
                  style={styles.fieldGroup}
                  onLayout={(e) => {
                    groupY.current[2] = e.nativeEvent.layout.y;
                  }}
                >
                  <Input
                    ref={confirmRef}
                    testID="signup-confirm-input"
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                    onSubmitEditing={() => {
                      if (isFormValid && !isLoading) handleSignUp();
                    }}
                    onFocus={onFieldFocus(2)}
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder={AUTH_STRINGS.placeholders.confirmPassword}
                    secure={confirmSecure}
                    toggleSecure={() => setConfirmSecure((prev) => !prev)}
                    borderRadius={AUTH_TEXT_FIELD_RADIUS}
                    hasError={confirmMismatch}
                    containerStyle={styles.fieldContainer}
                    inputStyle={fieldTextStyle}
                  />
                  {confirmMismatch && (
                    <SignupFieldError message="Passwords do not match." />
                  )}
                </View>

                {error ? <SignupFieldError message={error} /> : null}
              </View>

              <View
                onLayout={(e) => {
                  const l = e.nativeEvent.layout;
                  ctaBottom.current = l.y + l.height;
                // Errors appearing while typing push the CTA down — keep it revealed.
                revealCta();
                }}
              >
                <PrimaryButton
                  testID="signup-email-submit"
                  title={AUTH_STRINGS.signUpScreen.signUpTitle}
                  style={{
                    ...styles.emailSubmit,
                    backgroundColor: theme.colors.primaryCTA,
                  }}
                  textStyle={styles.emailSubmitLabel}
                  textColor={theme.colors.onPrimary}
                  onPress={handleSignUp}
                  disabled={!isFormValid || isLoading}
                  loading={isLoading}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

/** Share of the window assumed covered by the keyboard when Android reports no usable height
 * (measured Gboard: 37–41% on the test devices; 45% keeps a margin). */
const ANDROID_KEYBOARD_FALLBACK_SHARE = 0.45;

/** Figma 8015:111123 — same rule as Settings › Change password. */
const SIGNUP_PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const SIGNUP_PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include a number, an uppercase and a lowercase letter.";

/** Figma error row: 16pt alert icon + Caption/12px/Regular in error red; wraps and grows (no line cap). */
const SignupFieldError = ({ message }: { message: string }) => {
  const theme = useTheme();
  const color = theme.colors.textError ?? theme.colors.error;
  return (
    <View style={styles.fieldErrorRow} accessibilityRole="alert">
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5.32 9.32C7.73 5.05 8.94 2.92 10.59 2.37a4.5 4.5 0 0 1 2.82 0c1.65.55 2.86 2.68 5.27 6.95 2.41 4.27 3.62 6.41 3.26 8.15a4.6 4.6 0 0 1-1.41 2.49C19.21 21 16.8 21 11.97 21h.06c-4.83 0-7.24 0-8.53-1.04a4.6 4.6 0 0 1-1.41-2.49c-.36-1.74.85-3.88 3.23-8.15Z"
          stroke={color}
          strokeWidth={1.5}
        />
        <Path
          d="M12 13V9"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M11.99 16.5h.01"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
      <RNText style={[styles.fieldErrorText, { color }]}>{message}</RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  authFormLayer: {
    zIndex: 1,
  },
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
  /** Figma Top Navigation Bar: 52pt minimum */
  emailNavRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  emailBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: AUTH_BACK_BUTTON_LEFT_OFFSET,
  },
  /** Figma: title 16pt below the nav bar, 24pt above the fields */
  emailFormTitle: {
    marginTop: 16,
    marginBottom: 24,
  },
  emailFields: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  /** Figma Textfield: 48pt minimum (grows with font size), 12pt gap to the eye icon */
  fieldContainer: {
    minHeight: 48,
    marginTop: 0,
    gap: 12,
  },
  /** Body/16px/Regular */
  fieldText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    letterSpacing: -0.16,
    paddingVertical: 10,
    /** Fill the field's height so the whole pill is tappable */
    alignSelf: "stretch",
    textAlignVertical: "center",
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  /** Caption/12px/Regular — scales with the user font; wraps and expands */
  fieldErrorText: {
    ...typography.caption.regular,
    flex: 1,
  },
  /** Figma Button: 44pt minimum, 16pt below the fields; label wraps and the button grows */
  emailSubmit: {
    marginTop: 16,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 23.789,
  },
  /** Button/16px Medium 16/24 */
  emailSubmitLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
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
