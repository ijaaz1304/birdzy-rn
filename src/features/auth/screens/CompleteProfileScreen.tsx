import React, { useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { HIT_SLOP } from "../../../constants/uiConstants";
import { SCREEN_COLORS } from "../../../constants/colorConstants";

import { APP_COLORS } from "../../../config/colors";
import { AUTH_TEXT_FIELD_RADIUS } from "../constants/authFormLayout";
import { authFormStyles } from "../components/authFormStyles";
import { useKeyboardAwareForm } from "../../../hooks/useKeyboardAwareForm";
import { FONTS } from "../../../common/typography";
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

  /** Keyboard rule: focused field + Continue stay visible (shared auth-form hook). */
  const kb = useKeyboardAwareForm();
  const ageRef = useRef<TextInput>(null);

  const isDark = theme.mode === "dark";
  const authBg = isDark
    ? APP_COLORS.surfaceAuthDark
    : APP_COLORS.surfaceAuthLight;
  const textColor = theme.colors.textPrimary;
  const fieldTextStyle = [authFormStyles.fieldText, { color: textColor }];
  const dropdownBg = isDark ? APP_COLORS.surfaceDark : theme.colors.surface;

  const finishOnboarding = useCallback(() => {
    const root = navigation.getParent();
    resetToPostAuthOnboarding(root ?? navigation);
  }, [navigation]);

  return (
    <ScreenContainer showBackground={false} backgroundColor={authBg} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
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
          {/* Figma Top Navigation Bar — 52pt, Skip on the right (16pt inset) */}
          <View style={[authFormStyles.navRow, styles.navRow]}>
            <TouchableOpacity
              testID="complete-profile-skip"
              onPress={finishOnboarding}
              style={styles.skipButton}
              activeOpacity={0.8}
              hitSlop={HIT_SLOP.CLOSE}
              accessibilityRole="button"
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.skipText,
                  { color: isDark ? SCREEN_COLORS.DARK.text : textColor },
                ]}
              >
                {completeProfileConfig.skipText}
              </Text>
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
            {/* Figma 8015:111165 — title + subtitle, 4pt apart */}
            <View style={styles.header}>
              <Text
                variant="title"
                size="small"
                numberOfLines={2}
                ellipsizeMode="tail"
                accessibilityRole="header"
                style={[authFormStyles.title, { color: textColor }]}
              >
                {completeProfileConfig.title}
              </Text>
              <Text style={[authFormStyles.subtitle, { color: textColor }]}>
                {completeProfileConfig.subtitle}
              </Text>
            </View>

            {/* Figma 8015:111168 — 48pt fields, 16pt apart */}
            <View style={styles.fields} onLayout={kb.layout("fields")}>
              <View onLayout={kb.layout("name", "fields")}>
                <Input
                  testID="complete-profile-name"
                  onFocus={kb.focus("name")}
                  placeholder={completeProfileConfig.namePlaceholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => ageRef.current?.focus()}
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  containerStyle={authFormStyles.fieldContainer}
                  inputStyle={fieldTextStyle}
                />
              </View>
              <View onLayout={kb.layout("age", "fields")}>
                <Input
                  ref={ageRef}
                  testID="complete-profile-age"
                  onFocus={kb.focus("age")}
                  placeholder={completeProfileConfig.agePlaceholder}
                  keyboardType="numeric"
                  returnKeyType="done"
                  borderRadius={AUTH_TEXT_FIELD_RADIUS}
                  containerStyle={authFormStyles.fieldContainer}
                  inputStyle={fieldTextStyle}
                />
              </View>
              <Dropdown
                testID="complete-profile-gender"
                placeholder={completeProfileConfig.genderPlaceholder}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                value={gender}
                onSelect={setGender}
                size="medium"
                borderRadius={AUTH_TEXT_FIELD_RADIUS}
                buttonBackgroundColor={dropdownBg}
                buttonStyle={styles.dropdownButton}
                textStyle={styles.dropdownText}
                valueNumberOfLines={2}
              />
              <Dropdown
                testID="complete-profile-country"
                placeholder={
                  countriesLoading
                    ? "Loading countries..."
                    : completeProfileConfig.countryPlaceholder
                }
                options={dropdownOptions}
                value={country}
                onSelect={setCountry}
                disabled={countriesLoading}
                size="medium"
                borderRadius={AUTH_TEXT_FIELD_RADIUS}
                buttonBackgroundColor={dropdownBg}
                buttonStyle={styles.dropdownButton}
                textStyle={styles.dropdownText}
                valueNumberOfLines={2}
              />
            </View>

            {/* Figma 8015:111187 — Continue 16pt below the fields (full width) */}
            <View onLayout={kb.layout("cta")}>
              <PrimaryButton
                testID="complete-profile-continue"
                title={completeProfileConfig.submitButtonText}
                onPress={finishOnboarding}
                style={{
                  ...authFormStyles.submit,
                  marginTop: 16,
                  backgroundColor: theme.colors.primaryCTA,
                }}
                textStyle={authFormStyles.submitLabel}
                textColor={theme.colors.onPrimary}
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
  /** Skip sits 16pt from the edge (page margin is 20) */
  navRow: {
    justifyContent: "flex-end",
    marginRight: -4,
  },
  /** Figma Skip button: 32pt min height, 12pt side padding, pill */
  skipButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  /** Button/14px Medium 14/20 */
  skipText: {
    ...typography.button.medium,
  },
  header: {
    gap: 4,
    marginBottom: 24,
  },
  fields: {
    gap: 16,
  },
  /** Figma select field: 48pt minimum, 16pt side padding, 12pt to the arrow */
  dropdownButton: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  /** Body/16px/Regular; may wrap to 2 lines for long values (country names) */
  dropdownText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
});
