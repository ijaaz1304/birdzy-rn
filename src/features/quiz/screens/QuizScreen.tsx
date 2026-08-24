/**
 * Quiz Screen - "Which Bird Are You?" Personality Quiz
 * 4 questions, 4 buckets, 8 bird personas. All local, no API.
 */

import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { QuizStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { FIGMA_TOKENS } from "../../../design-system/colors/figmaTokens";
import { Text } from "../../../atoms/Text/Text";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { Card } from "../../../molecules/Card/Card";
import { ScreenContainer } from "../../../molecules";
import { Header } from "../../../organisms";
import {
  QUIZ_QUESTIONS,
  calculateQuizResult,
  QuizResult,
} from "../data/quizQuestions";
import {
  analyticsService,
  EVENTS,
} from "../../../services/analytics/analytics.service";
import { useScreenTracking } from "../../../services/analytics/useScreenTracking";
import { performanceService } from "../../../services/performance/performance.service";
import { getQuizArchetypeImageSources } from "../data/quizImageMap";
import { ImageSourcePropType } from "react-native";
function resolveQuizImageSource(
  image?: string | ImageSourcePropType
): ImageSourcePropType | undefined {
  if (!image) return undefined;
  if (typeof image === "string") {
    return { uri: image };
  }
  return image;
}

function getQuizRemoteUri(
  source: ImageSourcePropType | undefined
): string | null {
  if (!source || typeof source === "number" || Array.isArray(source)) {
    return null;
  }
  const uri = (source as { uri?: string }).uri?.trim() ?? "";
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  return null;
}

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

type QuizScreenNavigationProp = NativeStackNavigationProp<
  QuizStackParamList,
  "QuizMain"
>;

const QUIZ_SCREEN_NAME = "Quiz";
const QUIZ_FLOW_TRACE = "which_bird_quiz_flow";

export const QuizScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const quizFlowStartRef = useRef<number>(0);
  const completedRef = useRef(false);
  const lastQuestionReachedRef = useRef(0);

  const imageByMushroomId = useMemo(() => getQuizArchetypeImageSources(), []);

  useScreenTracking(QUIZ_SCREEN_NAME, { source: "which_bird_quiz" });

  useEffect(() => {
    performanceService.startScreenTrace(QUIZ_SCREEN_NAME);
    quizFlowStartRef.current = Date.now();
    performanceService.startTrace(QUIZ_FLOW_TRACE);
    analyticsService.logEvent(EVENTS.quiz_started, {
      question_count: String(QUIZ_QUESTIONS.length),
    });
    analyticsService.logEvent(EVENTS.which_bird_screen_1);

    return () => {
      performanceService.stopScreenTrace(QUIZ_SCREEN_NAME);
      if (!completedRef.current) {
        performanceService.stopTrace(QUIZ_FLOW_TRACE);
        analyticsService.logEvent(EVENTS.quiz_abandoned, {
          question_reached: String(lastQuestionReachedRef.current + 1),
          total_questions: String(QUIZ_QUESTIONS.length),
        });
      }
    };
  }, []);

  const whichMushroomScreenEvents = [
    EVENTS.which_bird_screen_1_answer,
    EVENTS.which_bird_screen_2_answer,
    EVENTS.which_bird_screen_3_answer,
    EVENTS.which_bird_screen_4_answer,
  ];
  const whichMushroomScreenViewEvents = [
    EVENTS.which_bird_screen_1,
    EVENTS.which_bird_screen_2,
    EVENTS.which_bird_screen_3,
    EVENTS.which_bird_screen_4,
  ];

  const handleAnswer = (
    questionId: string,
    optionId: string,
    bucket: string
  ) => {
    lastQuestionReachedRef.current = currentQuestion;
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    analyticsService.logEvent(whichMushroomScreenEvents[currentQuestion], {
      answer_option: optionId,
    });

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      analyticsService.logEvent(
        whichMushroomScreenViewEvents[currentQuestion + 1]
      );
      analyticsService.logEvent(EVENTS.quiz_question_answered, {
        question_id: questionId,
        question_number: String(currentQuestion + 1),
        bucket,
      });
    } else {
      const quizResult = calculateQuizResult(newAnswers, imageByMushroomId);
      completedRef.current = true;
      setResult(quizResult);
      setShowResult(true);

      const durationMs = Date.now() - quizFlowStartRef.current;
      performanceService
        .addMetric(QUIZ_FLOW_TRACE, "duration_ms", durationMs)
        .then(() => {});
      performanceService
        .addAttribute(QUIZ_FLOW_TRACE, "mushroom_id", quizResult.mushroomId)
        .then(() => {});
      performanceService
        .addAttribute(QUIZ_FLOW_TRACE, "bucket", quizResult.bucket)
        .then(() => {});
      performanceService.stopTrace(QUIZ_FLOW_TRACE);

      analyticsService.logEvent(EVENTS.quiz_completed, {
        mushroom_id: quizResult.mushroomId,
        mushroom_name: quizResult.mushroomName,
        bucket: quizResult.bucket,
        duration_ms: String(durationMs),
      });
      analyticsService.logEvent(EVENTS.quiz_result_view, {
        mushroom_id: quizResult.mushroomId,
        mushroom_name: quizResult.mushroomName,
        bucket: quizResult.bucket,
      });
      analyticsService.logEvent(EVENTS.which_bird_screen_answer, {
        mushroom_name: quizResult.mushroomName,
      });
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const shareResult = await Share.share({
        message: result.shareText,
        title: `I'm ${result.birdName || result.mushroomName}!`,
      });
      if (shareResult.action === Share.sharedAction) {
        analyticsService.logEvent(EVENTS.content_share_success, {
          content_type: "quiz_result",
          platform: Platform.OS,
        });
      } else if (shareResult.action === Share.dismissedAction) {
        analyticsService.logEvent(EVENTS.content_share_cancelled, {
          content_type: "quiz_result",
          platform: Platform.OS,
        });
      }
      analyticsService.logEvent(EVENTS.quiz_result_shared, {
        mushroom_id: result.mushroomId,
        mushroom_name: result.mushroomName,
      });
      analyticsService.logEvent(EVENTS.which_bird_share);
    } catch (error) {
      console.error("Error sharing quiz result:", error);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setShowResult(false);

    analyticsService.logEvent(EVENTS.quiz_restarted);
  };

  const handleAskAboutBird = () => {
    if (!result) return;
    const birdName = result.birdName || result.mushroomName;

    navigation.getParent()?.navigate("AskAIStack", {
      screen: "AskAIMain",
      params: {
        initialMessage: `Tell me about the ${birdName} — habitat, behavior, and how to identify it in the field.`,
      },
    });

    analyticsService.logEvent(EVENTS.quiz_view_bird_details, {
      mushroom_id: result.mushroomId,
    });
  };

  if (showResult && result) {
    const quizSource = resolveQuizImageSource(result.image);
    const quizRemoteUri = getQuizRemoteUri(quizSource);
    return (
      <ScreenContainer>
        <Header
          title="Your Result"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={styles.resultContent}
        >
          <Card padding="large" variant="elevated" style={styles.resultCard}>
            <Text
              variant="headline"
              size="large"
              weight="bold"
              style={styles.resultTitle}
            >
              You are {result.birdName || result.mushroomName}!
            </Text>

            {quizRemoteUri ? (
              <CachedRemoteImage
                uri={quizRemoteUri}
                style={styles.resultImage}
                borderRadius={Radius.md}
                resizeMode="cover"
              />
            ) : quizSource ? (
              <AppImage
                source={quizSource}
                style={styles.resultImage}
                resizeMode="cover"
              />
            ) : null}

            <Text variant="body" size="medium" style={styles.description}>
              {result.oneLiner}
            </Text>
          </Card>

          <View style={styles.actionsContainer}>
            <PrimaryButton
              title="Share Result"
              onPress={handleShare}
              style={styles.shareButton}
            />
            <PrimaryButton
              title="Ask AI about this bird"
              onPress={handleAskAboutBird}
              style={{
                ...styles.viewButton,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
              textColor={theme.colors.primary}
            />
            <TouchableOpacity
              onPress={handleRestart}
              style={styles.restartButton}
            >
              <Text variant="body" size="medium" color="primary">
                Take Quiz Again
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <ScreenContainer>
      <Header
        title="Which Bird Are You?"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.progressContainer}>
          <Text variant="body" size="small" color="textSecondary">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </Text>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? theme.colors.surfaceVariant
                    : FIGMA_TOKENS.surface.secondary,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100
                  }%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>

        <Card padding="large" variant="elevated" style={styles.questionCard}>
          <Text
            variant="headline"
            size="medium"
            weight="semibold"
            style={styles.questionText}
          >
            {question.question}
          </Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() =>
                    handleAnswer(question.id, option.id, option.bucket)
                  }
                >
                  <Text
                    variant="body"
                    size="medium"
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? "#FFFFFF" : theme.colors.text,
                      },
                    ]}
                  >
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionText: {
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  optionText: {
    textAlign: "center",
  },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    padding: 20,
  },
  resultCard: {
    marginBottom: 24,
    alignItems: "center",
  },
  resultTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: Radius.md,
    marginBottom: 24,
    alignSelf: "center",
  },
  description: {
    marginBottom: 8,
    textAlign: "center",
  },
  actionsContainer: {
    gap: 12,
  },
  shareButton: {
    marginBottom: 12,
  },
  viewButton: {
    marginBottom: 12,
  },
  restartButton: {
    padding: spacing[4],
    alignItems: "center",
  },
});
