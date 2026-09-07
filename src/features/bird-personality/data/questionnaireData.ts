/**
 * Bird Personality Questionnaire Data
 * Uses QUIZ_QUESTIONS (4 questions, 4 options each) and quiz result logic — single source of truth.
 */

import { ImageSourcePropType } from "react-native";
import {
  QUIZ_QUESTIONS,
  calculateQuizResult,
  type QuizQuestion,
  type QuizOption,
} from "../../quiz/data/quizQuestions";

/** Re-export the 4 PRD questions for the questionnaire screen. */
export type QuestionnaireQuestion = QuizQuestion;
export type QuestionnaireOption = QuizOption;

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = QUIZ_QUESTIONS;

export interface RockPersonalityResult {
  mushroomId: string;
  mushroomName: string;
  traits: string[];
  oneLiner: string;
  shareText: string;
  image?: string | ImageSourcePropType;
}

/**
 * Calculate bird personality result from answers using quiz logic (4 buckets, 8 bird personas).
 * Local-only scoring — no API.
 */
export function calculateRockPersonality(
  answers: Record<string, string>,
  imageByMushroomId?: Record<string, string | ImageSourcePropType>
): RockPersonalityResult {
  const quizResult = calculateQuizResult(answers, imageByMushroomId);
  return {
    mushroomId: quizResult.mushroomId,
    mushroomName: quizResult.mushroomName,
    traits:
      quizResult.traits?.length === 4
        ? quizResult.traits
        : [quizResult.oneLiner],
    oneLiner: quizResult.oneLiner,
    shareText: quizResult.shareText,
    image: quizResult.image,
  };
}
