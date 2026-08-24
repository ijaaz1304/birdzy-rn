/**
 * Rating Feedback Store
 * Submits rating/feedback to the URL from env: RATING_FEEDBACK_API (see constants/env.ts).
 * Set RATING_FEEDBACK_API in .env to control where feedback is sent.
 */

import { create } from "zustand";
import axios from "axios";
import { RATING_FEEDBACK_API } from "../../constants/env";
import {
  analyticsService,
  EVENTS,
} from "../../services/analytics/analytics.service";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";

/** Extract a user-facing message from various API error response shapes. */
function getErrorMessageFromResponse(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") return data;
  const obj = data as Record<string, unknown>;
  if (typeof obj.reason === "string") return obj.reason;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;
  const errors = obj.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown> | undefined;
    if (typeof first?.message === "string") return first.message;
  }
  return null;
}

export interface RatingFeedbackFormInput {
  domain: string;
  name?: string;
  email?: string;
  message: string;
  rating?: number;
  /** Optional source so backend can log to the same sheet (e.g. 'rate_us' for Rate Us and Rate this match). */
  source?: string;
}

export interface RatingFeedbackState {
  loading: boolean;
  error: string | null;
  success: boolean;
  sendRatingFeedbackForm: (args: RatingFeedbackFormInput) => Promise<boolean>;
}

export const useRatingFeedback = create<RatingFeedbackState>((set) => ({
  loading: false,
  error: null,
  success: false,

  sendRatingFeedbackForm: async ({
    domain,
    name,
    email,
    message,
    rating,
    source,
  }) => {
    try {
      set({ loading: true, error: null, success: false });

      const feedbackUrl =
        RATING_FEEDBACK_API ||
        "https://msmnafgy53ptj4qqt3oqkk4gpe0pdtic.lambda-url.us-west-2.on.aws/";

      const formattedMessage =
        rating != null
          ? message.trim()
            ? `${message.trim()} , Rating - ${rating}`
            : `Rating - ${rating}`
          : message;

      const body = {
        domain,
        name: name ?? "",
        email: email ?? "",
        message: formattedMessage,
        ...(rating != null && { rating }),
        ...(source != null && source !== "" && { source }),
      };

      useAppLogsStore.getState().info("[RatingFeedback] Sending to API", {
        domain: body.domain,
        rating: body.rating,
        message: body.message,
        source: body.source,
      });

      const url = feedbackUrl.replace(/\/+$/, "");
      const response = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 201) {
        set({ success: true });
        analyticsService.logEvent(EVENTS.rate_us_feedback, {
          domain,
          has_name: !!name,
          has_email: !!email,
          rating: rating ?? 0,
        });
        return true;
      }

      const data = response?.data;
      const serverMessage =
        getErrorMessageFromResponse(data) ||
        `Request failed (${response.status})`;
      set({ error: serverMessage });
      useAppLogsStore.getState().warn("[RatingFeedback] API error", {
        status: response.status,
        responseBody: data,
        extractedMessage: serverMessage,
      });
      return false;
    } catch (err: any) {
      const response = err?.response;
      const data = response?.data;
      const serverMessage = getErrorMessageFromResponse(data);
      const errorMessage =
        serverMessage ||
        (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT"
          ? "Request timed out. Please try again."
          : err?.message || "Failed to send. Please try again.");
      set({ error: errorMessage });
      useAppLogsStore.getState().warn("[RatingFeedback] Request failed", {
        message: err?.message,
        status: response?.status,
        responseBody: data,
        extractedMessage: serverMessage,
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
