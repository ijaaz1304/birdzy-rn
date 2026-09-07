/**
 * Ask AI (Bird Expert) strings
 */

export const ASK_AI_STRINGS = {
  title: "Bird Ask AI",
  heroTitle: "Hello, how can I help you?",
  heroSubtitle: "Choose a question or ask anything about bird.",
  inputPlaceholder: "Hello, how I can help you?",
  welcomeMessage:
    "Hello! I'm your bird expert. Ask about identification, behavior, habitat, or share a photo.",
  gotBittenHeroTitle: "How can I help with your bite?",
  gotBittenHeroSubtitle:
    "Describe what happened or share a photo and I'll guide you through next steps.",
  gotBittenWelcome:
    "Describe the bite or share a photo of the injury, and I'll help you figure out what happened.",
  gotBittenPrompt: "I think a bird bit me — can you help?",
  gotBittenImagePrompt: "Can you tell if a bird bit me from this photo?",
  suggestedPrompts: [
    {
      id: "parrot",
      question: "Which bird can mimic human speech the best?",
    },
    {
      id: "weather",
      question: "Can birds predict changes in weather?",
    },
    {
      id: "brain",
      question: "Which bird is considered the smartest?",
    },
    {
      id: "flamingo",
      question: "Why do flamingos turn pink?",
    },
  ],
  /** @deprecated Use suggestedPrompts — kept for legacy references */
  suggestedQuestions: [
    "Which bird can mimic human speech the best?",
    "Can birds predict changes in weather?",
    "Which bird is considered the smartest?",
    "Why do flamingos turn pink?",
  ],
  captureHint: "Snap a bird photo for identification help",
  uploadHint: "Upload a photo from your gallery",
} as const;

export type AskAiSuggestedPromptId =
  (typeof ASK_AI_STRINGS.suggestedPrompts)[number]["id"];
