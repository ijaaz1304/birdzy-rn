/**
 * Rating Feedback Service
 * Handles submission of rating feedback to backend API.
 * Delegates to the rating feedback Zustand store (useRatingFeedback).
 */

import { useRatingFeedback } from "./ratingFeedback.store";

export interface RatingFeedbackData {
  domain: string;
  name?: string;
  email?: string;
  message: string;
  rating?: number;
  /** Optional source for backend logging (e.g. 'rate_us' so Rate this match is logged like Rate Us). */
  source?: string;
}

/**
 * Send rating feedback to API.
 * Uses the rating feedback store under the hood.
 * @throws on network/API failure so callers can catch and show error toasts.
 */
export const sendRatingFeedback = async (
  data: RatingFeedbackData
): Promise<boolean> => {
  const ok = await useRatingFeedback.getState().sendRatingFeedbackForm({
    domain: data.domain,
    name: data.name,
    email: data.email,
    message: data.message,
    rating: data.rating,
    source: data.source,
  });
  if (!ok) {
    const err = useRatingFeedback.getState().error || "Something went wrong";
    throw new Error(err);
  }
  return true;
};

/**
 * Format feedback message with rating
 */
export const formatFeedbackMessage = (
  feedback: string,
  rating: number
): string => {
  return `${feedback} - Rating ${rating}`;
};
