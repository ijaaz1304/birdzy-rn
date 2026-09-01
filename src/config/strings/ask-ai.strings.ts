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
    "Help me identify this bird from my photo",
    "What bird makes this call or song?",
    "How do I tell similar-looking species apart?",
    "What birds might I see near me this season?",
    "What are the key field marks for this bird?",
    "When is the best time to spot migratory birds?",
  ],
  captureHint: "Snap a bird photo for identification help",
  uploadHint: "Upload a photo from your gallery",
} as const;
