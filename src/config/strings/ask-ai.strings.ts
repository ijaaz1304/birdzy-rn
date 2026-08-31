/**
 * Ask AI (Bird Expert) strings
 */

export const ASK_AI_STRINGS = {
  title: "Bird Ask AI",
  welcomeMessage:
    "Hello! I'm your bird expert. Ask about identification, behavior, habitat, or share a photo.",
  gotBittenWelcome:
    "Describe the bite or share a photo of the injury, and I'll help you figure out what happened.",
  gotBittenPrompt: "I think a bird bit me — can you help?",
  gotBittenImagePrompt: "Can you tell if a bird bit me from this photo?",
  suggestedQuestions: [
    "Help me identify this bird",
    "What bird makes this sound?",
    "Best time of day to spot warblers?",
    "How do I tell similar sparrows apart?",
    "Where can I find owls near me?",
  ],
  captureHint: "Snap a bird photo for identification help",
  uploadHint: "Upload a photo from your gallery",
} as const;
