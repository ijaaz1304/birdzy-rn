/**
 * "Which mushroom are you?" quiz analytics — used by Rock Personality (home banner).
 */

import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";

const SCREEN_VIEW_EVENTS = [
  EVENTS.which_bird_screen_1,
  EVENTS.which_bird_screen_2,
  EVENTS.which_bird_screen_3,
  EVENTS.which_bird_screen_4,
] as const;

const SCREEN_ANSWER_EVENTS = [
  EVENTS.which_bird_screen_1_answer,
  EVENTS.which_bird_screen_2_answer,
  EVENTS.which_bird_screen_3_answer,
  EVENTS.which_bird_screen_4_answer,
] as const;

let quizCompletedThisSession = false;

export function logQuizStarted(questionCount: number): void {
  if (quizCompletedThisSession) {
    analyticsService.logEvent(EVENTS.quiz_restarted);
  }
  analyticsService.logEvent(EVENTS.quiz_started, {
    question_count: String(questionCount),
  });
}

export function logQuizScreenView(questionIndex: number): void {
  const event = SCREEN_VIEW_EVENTS[questionIndex];
  if (event) analyticsService.logEvent(event);
}

export function logQuizAnswer(params: {
  questionIndex: number;
  questionId: string;
  optionId: string;
  bucket?: string;
}): void {
  const answerEvent = SCREEN_ANSWER_EVENTS[params.questionIndex];
  if (answerEvent) {
    analyticsService.logEvent(answerEvent, {
      answer_option: params.optionId,
    });
  }
  analyticsService.logEvent(EVENTS.quiz_question_answered, {
    question_id: params.questionId,
    question_number: String(params.questionIndex + 1),
    ...(params.bucket ? { bucket: params.bucket } : {}),
  });
}

export function logQuizCompleted(params: {
  mushroomId: string;
  mushroomName: string;
  durationMs?: number;
}): void {
  analyticsService.logEvent(EVENTS.quiz_completed, {
    mushroom_id: params.mushroomId,
    mushroom_name: params.mushroomName,
    ...(params.durationMs != null
      ? { duration_ms: String(params.durationMs) }
      : {}),
  });
  analyticsService.logEvent(EVENTS.quiz_result_view, {
    mushroom_id: params.mushroomId,
    mushroom_name: params.mushroomName,
  });
  analyticsService.logEvent(EVENTS.which_bird_screen_answer, {
    mushroom_name: params.mushroomName,
  });
  quizCompletedThisSession = true;
}

export function logQuizAbandoned(questionReached: number, totalQuestions: number): void {
  analyticsService.logEvent(EVENTS.quiz_abandoned, {
    question_reached: String(questionReached),
    total_questions: String(totalQuestions),
  });
}

export function logQuizShare(mushroomId: string, mushroomName: string): void {
  analyticsService.logEvent(EVENTS.quiz_result_shared, {
    mushroom_id: mushroomId,
    mushroom_name: mushroomName,
  });
  analyticsService.logEvent(EVENTS.which_bird_share);
}

export function logQuizRestarted(): void {
  analyticsService.logEvent(EVENTS.quiz_restarted);
}

export function logQuizViewMushroomDetails(mushroomId: string): void {
  analyticsService.logEvent(EVENTS.quiz_view_bird_details, {
    mushroom_id: mushroomId,
  });
}
