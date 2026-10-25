export type FeedbackFields = {
  name: string;
  email: string;
  message: string;
  rating?: number;
};

export const isValidFeedbackEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Settings feedback needs three filled fields; selecting a rating is optional. */
export function canSubmitFeedback(
  fields: FeedbackFields,
  submitting = false
): boolean {
  return (
    !submitting &&
    fields.name.trim().length > 0 &&
    isValidFeedbackEmail(fields.email) &&
    fields.message.trim().length > 0
  );
}
