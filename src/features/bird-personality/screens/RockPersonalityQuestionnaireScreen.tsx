/**
 * Rock Personality Questionnaire Screen
 * Shows 4 questions with 4 answer options each
 * Optimized with memoization for performance
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ViewStyle } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText, AppButton } from "../../../components/shared";
import { NavBackIcon } from "../../../atoms";
import { BirdPersonalityStackParamList } from "../../../navigation/types";
import { QUESTIONNAIRE_QUESTIONS } from "../data/questionnaireData";
import { AI_CHAT_COLORS } from "../../../constants/colorConstants";
import { FIGMA_TOKENS } from "../../../design-system/colors/figmaTokens";

import { FindYourMushroomBackground } from "../components/FindYourMushroomBackground";
import { AskAIScreenBackground } from "../../ask-ai/components/AskAIScreenBackground";

import { FONTS } from "../../../common/typography";

import { spacing } from "../../../design-system/spacing";
import { useBackHandler } from "../../../utils/backHandler";
import { logQuizAbandoned, logQuizAnswer, logQuizScreenView } from "../quizAnalytics";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "Questionnaire"
>;
type RouteProp = {
  key: string;
  name: "Questionnaire";
  params?: { photoUri?: string };
};

export const BirdPersonalityQuestionnaireScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const Radius = theme.radius;
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const completedRef = useRef(false);
  const questionIndexRef = useRef(0);

  const photoUri = route.params?.photoUri;
  questionIndexRef.current = currentQuestionIndex;

  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        logQuizAbandoned(
          questionIndexRef.current + 1,
          QUESTIONNAIRE_QUESTIONS.length
        );
      }
    };
  }, []);

  useEffect(() => {
    logQuizScreenView(currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Memoize current question to avoid recalculation
  const currentQuestion = useMemo(
    () => QUESTIONNAIRE_QUESTIONS[currentQuestionIndex],
    [currentQuestionIndex]
  );

  // Memoize progress calculation
  const progress = useMemo(
    () => ((currentQuestionIndex + 1) / QUESTIONNAIRE_QUESTIONS.length) * 100,
    [currentQuestionIndex]
  );

  useEffect(() => {
    // Reset selected option when question changes
    setSelectedOption(answers[currentQuestion.id] || null);
  }, [currentQuestionIndex, currentQuestion.id, answers]);

  // Memoize option select handler
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      setSelectedOption(optionId);
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionId,
      }));
    },
    [currentQuestion.id]
  );

  // Memoize continue handler (button always visible; advance only when option selected)
  const handleContinue = useCallback(() => {
    if (!selectedOption) return;
    const option = currentQuestion.options.find((o) => o.id === selectedOption);
    logQuizAnswer({
      questionIndex: currentQuestionIndex,
      questionId: currentQuestion.id,
      optionId: selectedOption,
      bucket: option?.bucket,
    });
    if (currentQuestionIndex < QUESTIONNAIRE_QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
    } else {
      completedRef.current = true;
      navigation.navigate("Analysis", {
        photoUri,
        answers: {
          ...answers,
          [currentQuestion.id]: selectedOption,
        },
      });
    }
  }, [
    currentQuestionIndex,
    currentQuestion,
    selectedOption,
    answers,
    photoUri,
    navigation,
  ]);

  const handleBackPress = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQuestion = QUESTIONNAIRE_QUESTIONS[prevIndex];
      setCurrentQuestionIndex(prevIndex);
      setSelectedOption(answers[prevQuestion.id] ?? null);
      return;
    }
    navigation.goBack();
  }, [answers, currentQuestionIndex, navigation]);

  useBackHandler({
    onBackPress: () => {
      if (currentQuestionIndex > 0) {
        handleBackPress();
        return true;
      }
      return false;
    },
  });

  return (
    <View style={styles.container}>
      {isDark ? <AskAIScreenBackground /> : <FindYourMushroomBackground />}
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header with Back Button */}
        <View
          style={[
            styles.header,
            { paddingHorizontal: Space[6], paddingTop: Space[4] },
          ]}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <NavBackIcon color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText
            variant="body14"
            color={colors.textSecondary}
            style={{ flex: 1, textAlign: "center" }}
          >
            Question {currentQuestionIndex + 1}/{QUESTIONNAIRE_QUESTIONS.length}
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        {/* Progress bar - full width below header */}
        <View
          style={[
            styles.progressBarWrap,
            { paddingHorizontal: Space[6], marginTop: 4 },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: isDark
                  ? colors.surfaceVariant
                  : FIGMA_TOKENS.surface.secondary,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isDark
                    ? colors.primary
                    : FIGMA_TOKENS.brand2.primary,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: Space[6], paddingBottom: 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question */}
          <AppText
            variant="title20"
            color={colors.textPrimary}
            style={[
              styles.question,
              { marginTop: Space[6], marginBottom: Space[8] },
            ]}
          >
            {currentQuestion.question}
          </AppText>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <OptionButton
                key={option.id}
                option={option}
                isSelected={selectedOption === option.id}
                onSelect={handleOptionSelect}
                colors={colors}
                Space={Space}
                Radius={Radius}
                isDark={isDark}
              />
            ))}
          </View>
        </ScrollView>

        {/* Continue Button - always visible at bottom, disabled when none selected */}
        <View
          style={[
            styles.buttonContainer,
            {
              paddingHorizontal: Space[6],
              paddingTop: Space[4],
              paddingBottom: Math.max(Space[6], insets.bottom),
            },
          ]}
        >
          <AppButton
            title="Continue"
            size="large"
            variant="primary"
            onPress={handleContinue}
            style={[
              styles.continueButton,
              {
                backgroundColor: selectedOption
                  ? colors.primary
                  : colors.primary,
                paddingVertical: Space[5],
              },
            ] as unknown as ViewStyle}
            textStyle={{
              color: selectedOption ? colors.onPrimary : colors.textSecondary,
              fontSize: 18,
              fontFamily: FONTS.bold,
              textAlign: "center",
              lineHeight: 24,
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarWrap: {
    width: "100%",
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  question: {
    fontFamily: FONTS.bold,
    lineHeight: 32,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    padding: spacing[4],
    minHeight: 56,
    justifyContent: "center",
  },
  buttonContainer: {
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 24,
    minHeight: 60,
    alignSelf: "stretch",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    opacity: 1,
  },
});

/**
 * Memoized Option Button Component
 * Prevents unnecessary re-renders when other options are selected
 * MASTER SPEC: Exact colors for answer boxes
 */
interface OptionButtonProps {
  option: { id: string; text: string };
  isSelected: boolean;
  onSelect: (optionId: string) => void;
  colors: any;
  Space: any;
  Radius: any;
  isDark: boolean;
}

const OptionButton = React.memo<OptionButtonProps>(
  ({ option, isSelected, onSelect, colors, Space, Radius, isDark }) => {
    // MASTER SPEC: Exact answer box colors
    const boxBg = isSelected
      ? isDark
        ? AI_CHAT_COLORS.ANSWER_SELECTED_BG_DARK
        : AI_CHAT_COLORS.ANSWER_SELECTED_BG_LIGHT
      : isDark
      ? AI_CHAT_COLORS.ANSWER_UNSELECTED_BG_DARK // #111111
      : AI_CHAT_COLORS.ANSWER_UNSELECTED_BG_LIGHT; // #FFFFFF

    const boxBorder = isSelected
      ? isDark
        ? AI_CHAT_COLORS.ANSWER_SELECTED_BORDER_DARK
        : AI_CHAT_COLORS.ANSWER_SELECTED_BORDER_LIGHT
      : isDark
      ? AI_CHAT_COLORS.ANSWER_UNSELECTED_BORDER_DARK // #333333
      : AI_CHAT_COLORS.ANSWER_UNSELECTED_BORDER_LIGHT; // #E7E7E7

    return (
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: boxBg,
            borderColor: boxBorder,
            borderWidth: 1,
            borderRadius: 12,
            marginBottom: Space[3],
          },
        ]}
        onPress={() => onSelect(option.id)}
        activeOpacity={0.7}
      >
        <AppText
          variant="body16"
          color={
            isSelected
              ? isDark
                ? AI_CHAT_COLORS.ANSWER_SELECTED_TEXT_DARK
                : FIGMA_TOKENS.brand2.primary
              : colors.textPrimary
          }
          style={{
            fontWeight: isSelected ? "600" : "400",
            lineHeight: 24,
          }}
        >
          {option.text}
        </AppText>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if selection state changes for this option
    return (
      prevProps.option.id === nextProps.option.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.option.text === nextProps.option.text
    );
  }
);

OptionButton.displayName = "OptionButton";
