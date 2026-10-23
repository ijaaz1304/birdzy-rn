export type FeedbackFields = {
  name: string;
  email: string;
  message: string;
  rating?: number;
};

/** Settings feedback needs three filled fields; selecting a rating is optional. */
export function canSubmitFeedback(
  fields: FeedbackFields,
  submitting = false
): boolean {
  return (
    !submitting &&
    fields.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) &&
    fields.message.trim().length > 0
  );
}
