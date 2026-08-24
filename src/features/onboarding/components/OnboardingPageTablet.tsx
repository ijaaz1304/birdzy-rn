import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import type { OnboardingPageData } from "../screens/OnboardingScreenPhone";
import { FONTS } from "../../../common/typography";
import {
  TABLET_MARKETING_BODY,
  TABLET_MARKETING_TEXT_HORIZONTAL_PADDING,
  TABLET_MARKETING_TITLE,
  getTabletMarketingTextSectionBottom,
} from "../onboardingTabletLayout";
import { AuthProgressSlideTablet } from "./AuthProgressSlideTablet";
import { OnboardingSlideBackground } from "./OnboardingSlideBackground";

const SHOW_SLIDE_COPY_ON_TABLET = Platform.OS === "ios";

export interface OnboardingPageTabletProps {
  data: OnboardingPageData;
  width: number;
  height: number;
  pageIndex: number;
  bottomChromeHeight: number;
  onSignUp?: () => void;
  onLogIn?: () => void;
  onContinueAsGuest?: () => void;
}

export const OnboardingPageTablet: React.FC<OnboardingPageTabletProps> =
  React.memo(
    ({
      data,
      width,
      height,
      pageIndex: _pageIndex,
      bottomChromeHeight,
      onSignUp,
      onLogIn,
      onContinueAsGuest,
    }) => {
      const theme = useTheme();
      const isAuthSlide = data.illustration === "authProgress";

      if (isAuthSlide) {
        return (
          <AuthProgressSlideTablet
            width={width}
            height={height}
            title={data.title}
            description={data.description}
            backgroundImage={data.backgroundImage}
            onSignUp={onSignUp}
            onLogIn={onLogIn}
            onContinueAsGuest={onContinueAsGuest}
          />
        );
      }

      const textBottom =
        getTabletMarketingTextSectionBottom(bottomChromeHeight);

      return (
        <View
          style={[
            styles.container,
            { width, height, backgroundColor: theme.colors.background },
          ]}
        >
          {data.backgroundImage != null ? (
            <OnboardingSlideBackground
              source={data.backgroundImage}
              screenWidth={width}
              screenHeight={height}
              backgroundColor={theme.colors.background}
            />
          ) : null}

          {SHOW_SLIDE_COPY_ON_TABLET ? (
            <View
              style={[
                styles.textSection,
                {
                  bottom: textBottom,
                  paddingHorizontal: TABLET_MARKETING_TEXT_HORIZONTAL_PADDING,
                },
              ]}
              pointerEvents="none"
            >
              <Text
                style={[
                  styles.onboardingTitle,
                  styles.title,
                  { color: theme.colors.text },
                ]}
              >
                {data.title}
              </Text>
              <Text
                style={[
                  styles.onboardingBody,
                  styles.description,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {data.description}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }
  );

OnboardingPageTablet.displayName = "OnboardingPageTablet";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  textSection: {
    position: "absolute",
    left: 0,
    right: 0,
    gap: 12,
    alignItems: "flex-start",
  },
  onboardingTitle: {
    ...TABLET_MARKETING_TITLE,
    fontFamily: FONTS.bold,
  },
  onboardingBody: {
    ...TABLET_MARKETING_BODY,
    fontFamily: FONTS.regular,
  },
  title: {
    textAlign: "left",
    marginBottom: 0,
  },
  description: {
    textAlign: "left",
  },
});
