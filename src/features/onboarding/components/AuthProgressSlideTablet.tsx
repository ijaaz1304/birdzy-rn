import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { FONTS } from "../../../common/typography";
import {
  CARD_COLORS,
  SCREEN_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import {
  getTabletAuthCtaBottom,
  getTabletAuthCtaLayout,
  getTabletAuthTextTopPadding,
} from "../onboardingTabletLayout";
import { OnboardingSlideBackground } from "./OnboardingSlideBackground";

const SHOW_SLIDE_COPY_ON_TABLET = Platform.OS === "ios";

type Props = {
  width: number;
  height: number;
  title: string;
  description: string;
  backgroundImage?: ImageSourcePropType;
  onSignUp?: () => void;
  onLogIn?: () => void;
  onContinueAsGuest?: () => void;
};

export const AuthProgressSlideTablet: React.FC<Props> = ({
  width,
  height,
  title,
  description,
  backgroundImage,
  onSignUp,
  onLogIn,
  onContinueAsGuest,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ctaLayout = getTabletAuthCtaLayout(width);
  const ctaBottom = getTabletAuthCtaBottom(insets.bottom);

  if (!backgroundImage) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { width, height, backgroundColor: theme.colors.background },
      ]}
    >
      <OnboardingSlideBackground
        source={backgroundImage}
        screenWidth={width}
        screenHeight={height}
        backgroundColor={theme.colors.background}
      />

      <View
        style={[
          styles.authContent,
          { paddingTop: getTabletAuthTextTopPadding(insets.top) },
        ]}
        pointerEvents="box-none"
      >
        {SHOW_SLIDE_COPY_ON_TABLET ? (
          <View style={[styles.authTextSection, styles.authTextSectionLifted]}>
            <View style={styles.onboardingTextPairCentered}>
              <Text
                variant="title"
                size="large"
                weight="bold"
                style={[styles.authProgressTitle, { color: theme.colors.text }]}
              >
                {title}
              </Text>
              <Text
                variant="body"
                size="medium"
                style={[
                  styles.authDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {description}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.authSpacer} pointerEvents="none" />
      </View>

      <View
        style={[
          styles.authButtonsSection,
          {
            bottom: ctaBottom,
            left: ctaLayout.left,
            width: ctaLayout.width,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onSignUp}
          style={[
            styles.signUpButton,
            styles.authButtonCta,
            { backgroundColor: theme.colors.primaryCTA },
          ]}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={{ color: theme.colors.onPrimary }}
          >
            Sign up
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLogIn}
          style={[
            styles.logInButton,
            styles.authButtonCta,
            theme.mode === "dark"
              ? {
                  backgroundColor: theme.colors.loginButton,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }
              : {
                  backgroundColor: SUBSCRIPTION_COLORS.COMPARISON_LIGHT.BASE_BG,
                  borderWidth: 1,
                  borderColor: CARD_COLORS.LIGHT.border,
                },
          ]}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={{
              color:
                theme.mode === "dark"
                  ? SCREEN_COLORS.DARK.text
                  : theme.colors.text,
            }}
          >
            Log in
          </Text>
        </TouchableOpacity>
        {onContinueAsGuest ? (
          <TouchableOpacity
            onPress={onContinueAsGuest}
            style={styles.guestLink}
            activeOpacity={0.7}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={{ color: SCREEN_COLORS.LIGHT.text }}
            >
              Continue as guest
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  authContent: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  authTextSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 6,
  },
  authTextSectionLifted: {
    transform: [{ translateY: -12 }],
  },
  onboardingTextPairCentered: {
    alignItems: "center",
    gap: 16,
  },
  authProgressTitle: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  authDescription: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  authSpacer: {
    flex: 1,
    minHeight: 8,
  },
  authButtonsSection: {
    position: "absolute",
    gap: 12,
    zIndex: 2,
  },
  authButtonCta: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  signUpButton: {
    marginBottom: 0,
  },
  logInButton: {
    marginBottom: 0,
  },
  guestLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
