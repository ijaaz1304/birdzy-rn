import { canSubmitFeedback } from "../src/utils/feedbackValidation";
const valid = { name: "User", email: "user@example.com", message: "Nice" };
it("enables Continue with all required fields and no rating, including a short message", () => {
  expect(canSubmitFeedback(valid)).toBe(true);
});
it("also permits feedback when an optional rating is supplied", () => {
  expect(canSubmitFeedback({ ...valid, rating: 4 })).toBe(true);
});
it.each([
  { name: "" },
  { name: "  " },
  { email: "" },
  { email: "invalid" },
  { email: "user@" },
  { message: "" },
  { message: "  " },
])("keeps Continue disabled for invalid required data: %p", (partial) => {
  expect(canSubmitFeedback({ ...valid, ...partial })).toBe(false);
});
it("trims the required fields before validation", () => {
  expect(
    canSubmitFeedback({
      name: " User ",
      email: " user@example.com ",
      message: " OK ",
    })
  ).toBe(true);
});
it("prevents duplicate submissions while sending and enables retry afterwards", () => {
  expect(canSubmitFeedback(valid, true)).toBe(false);
  expect(canSubmitFeedback(valid, false)).toBe(true);
});
