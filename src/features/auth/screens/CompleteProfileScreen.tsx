import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
  Easing,
  Platform,
  type KeyboardEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resetToPostAuthOnboarding } from "../../post-auth-onboarding";
import { AuthStackParamList } from "../../../navigation/types";
import { Input } from "../../../molecules/Input/Input";
import { Dropdown } from "../../../molecules/Dropdown/Dropdown";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Text } from "../../../atoms/Text/Text";
import { ScreenContainer } from "../../../molecules/ScreenContainer/ScreenContainer";
import { useTheme } from "../../../hooks/useTheme";
import { useFeatureConfig } from "../../../config/context";
import { typography } from "../../../design-system/typography";
import { spacing } from "../../../design-system/spacing";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { SCREEN_COLORS } from "../../../constants/colorConstants";

import { APP_COLORS } from "../../../config/colors";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { useCountriesStore } from "../../../data/countries.store";

type CompleteProfileScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "CompleteProfile"
>;

export const CompleteProfileScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CompleteProfileScreenNavigationProp>();
  const authConfig = useFeatureConfig("auth");
  const completeProfileConfig = authConfig.completeProfile;

  const [gender, setGender] = React.useState<string>("");
  const [country, setCountry] = React.useState<string>("");
  const {
    dropdownOptions,
    loading: countriesLoading,
    loadCountries,
  } = useCountriesStore();

  React.useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const footerTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const coveredByKeyboard = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get("window").height;
      const overlap = windowHeight - event.endCoordinates.screenY;
      return overlap > 0 ? overlap : event.endCoordinates.height;
    };

    const animateFooter = (toValue: number, event: KeyboardEvent) => {
      Animated.timing(footerTranslateY, {
        toValue,
        duration: event.duration > 0 ? event.duration : 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const onShow = (event: KeyboardEvent) => {
      const height = coveredByKeyboard(event);
      setKeyboardHeight(height);
      animateFooter(-height, event);
    };
    const onHide = (event: KeyboardEvent) => {
      setKeyboardHeight(0);
      animateFooter(0, event);
    };
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [footerTranslateY]);

  const keyboardOpen = keyboardHeight > 0;
  const footerPaddingBottom = keyboardOpen
    ? spacing[4]
    : Math.max(insets.bottom, spacing[4]);
  const scrollBottomInset =
    spacing[4] + 44 + footerPaddingBottom + spacing[2];

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const subtitleColor = isDark
    ? SCREEN_COLORS.DARK.textSecondary
    : SCREEN_COLORS.LIGHT.textSecondary;

  const finishOnboarding = useCallback(() => {
    const root = navigation.getParent();
    resetToPostAuthOnboarding(root ?? navigation);
  }, [navigation]);

  return (
    <ScreenContainer showBackground={false} backgroundColor={authBg} edges={[]}>
      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.topBarContent}>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity
            onPress={finishOnboarding}
            style={styles.skipButton}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <Text
              style={[
                styles.skipText,
                {
                  color: isDark
                    ? SCREEN_COLORS.DARK.text
                    : theme.colors.text,
                },
              ]}
            >
              {completeProfileConfig.skipText}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: scrollBottomInset },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
          automaticallyAdjustKeyboardInsets={false}
        >
          <Text
            variant="title"
            size="small"
            weight="bold"
            style={[styles.title, { color: theme.colors.textPrimary }]}
          >
            {completeProfileConfig.title}
          </Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {completeProfileConfig.subtitle}
          </Text>

          <View style={styles.inputsContainer}>
            <Input
              placeholder={completeProfileConfig.namePlaceholder}
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
            />
            <Input
              placeholder={completeProfileConfig.agePlaceholder}
              keyboardType="numeric"
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
            />
            <Dropdown
              placeholder={completeProfileConfig.genderPlaceholder}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
              value={gender}
              onSelect={setGender}
              size="large"
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
              style={styles.fieldSpacing}
              buttonBackgroundColor={
                isDark ? APP_COLORS.surfaceDark : theme.colors.surface
              }
            />
            <Dropdown
              placeholder={
                countriesLoading
                  ? "Loading countries..."
                  : completeProfileConfig.countryPlaceholder
              }
              options={dropdownOptions}
              value={country}
              onSelect={setCountry}
              disabled={countriesLoading}
              size="large"
              borderRadius={AUTH_TEXT_FIELD_RADIUS}
              style={styles.fieldSpacing}
              buttonBackgroundColor={
                isDark ? APP_COLORS.surfaceDark : theme.colors.surface
              }
            />
          </View>
        </ScrollView>

        <Animated.View
          style={[
            styles.footer,
            {
              paddingBottom: footerPaddingBottom,
              backgroundColor: authBg,
              transform: [{ translateY: footerTranslateY }],
            },
          ]}
        >
          <PrimaryButton
            title={completeProfileConfig.submitButtonText}
            onPress={finishOnboarding}
            style={{
              backgroundColor: theme.colors.primaryCTA,
              borderRadius: AUTH_TEXT_FIELD_RADIUS,
              marginTop: 0,
              height: 44,
              minHeight: 44,
              width: "82%",
              alignSelf: "center",
            }}
            textColor={theme.colors.onPrimary}
          />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 52,
    paddingVertical: 12,
  },
  topBarSpacer: {
    flex: 1,
  },
  skipButton: {
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  skipText: {
    ...typography.button.medium,
  },
  bodyContent: {
    paddingTop: spacing[4],
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing[4],
    zIndex: 2,
    alignItems: "center",
  },
  title: {
    ...typography.title.small,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body.medium,
    marginBottom: spacing[6],
  },
  inputsContainer: {
    width: "100%",
  },
  fieldSpacing: {
    marginTop: spacing[4],
  },
});
