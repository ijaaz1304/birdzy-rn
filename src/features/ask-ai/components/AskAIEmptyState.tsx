import { AppImage } from "@/components/AppImage";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { Images } from "../../../assets";
import { type AskAiSuggestedPromptId } from "../../../config/strings/ask-ai.strings";
import { AskAISuggestedQuestionCard } from "./AskAISuggestedQuestionCard";

export type AskAiPromptItem = {
  id: AskAiSuggestedPromptId;
  question: string;
};

const PROMPT_ICONS: Record<AskAiSuggestedPromptId, typeof Images.askAiPromptIconParrot> = {
  parrot: Images.askAiPromptIconParrot,
  weather: Images.askAiPromptIconWeather,
  brain: Images.askAiPromptIconBrain,
  flamingo: Images.askAiPromptIconFlamingo,
};

type Props = {
  heroTitle: string;
  heroSubtitle: string;
  prompts: readonly AskAiPromptItem[];
  onSelectQuestion: (question: string) => void;
};

const HERO_WIDTH = 123;
const HERO_HEIGHT = 108;

export function AskAIEmptyState({
  heroTitle,
  heroSubtitle,
  prompts,
  onSelectQuestion,
}: Props) {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroBlock}>
        <AppImage
          source={Images.askAiHeroMascot}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <View style={styles.heroTextBlock}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={{ color: colors.textPrimary, textAlign: "center" }}
          >
            {heroTitle}
          </Text>
          <Text
            variant="body"
            size="small"
            weight="medium"
            style={[
              styles.heroSubtitle,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            {heroSubtitle}
          </Text>
        </View>
      </View>

      <View style={styles.promptList}>
        {prompts.map((prompt) => (
          <AskAISuggestedQuestionCard
            key={prompt.id}
            question={prompt.question}
            icon={PROMPT_ICONS[prompt.id]}
            onPress={() => onSelectQuestion(prompt.question)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 8,
  },
  heroBlock: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 259,
    alignSelf: "center",
  },
  heroImage: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
  heroTextBlock: {
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  heroSubtitle: {
    lineHeight: 16,
  },
  promptList: {
    width: "100%",
    gap: 12,
  },
});
