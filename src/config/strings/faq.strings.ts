/**
 * FAQ content for Settings > Support > FAQ
 * Use `{appName}` placeholders — resolve via getFaqStrings(appName).
 */

import { formatString } from "./utils";

export const FAQ_STRINGS_TEMPLATE = {
  intro: "",
  contactLabel: "For any further questions, please email:",
  contactEmail: "developer@trackzio.com",
  items: [
    {
      id: "1",
      question: "What is {appName}?",
      answer:
        '{appName} is an all-in-one birding app. Identify birds by photo, sound, or our step-by-step wizard, build your life list and custom collections, explore a global species catalogue, ask our AI bird expert questions, share sightings on the community feed, and enjoy daily featured species with Bird of the Day and the "Which Bird Are You?" personality quiz.',
    },
    {
      id: "2",
      question: "Why can't I identify more birds?",
      answer:
        "Free users get 2 photo identifications and 2 sound identifications per day. Limits reset every 24 hours. Upgrade to Premium for unlimited photo and sound ID.",
    },
    {
      id: "3",
      question: "How does bird identification work?",
      answer:
        "Use Identify to take a photo, upload from gallery, record a call, or run the step-by-step wizard. Our AI returns possible matches with confidence scores. Tap any match for photos, calls, range, habitat, and similar species. Free users have daily ID limits; Premium users enjoy unlimited identifications.",
    },
    {
      id: "4",
      question: "Do I need to create an account?",
      answer:
        "You can browse as a guest, but guest data stays on your device only and may be lost if the app is deleted or cache is cleared. Sign in to sync your life list, collections, and settings across devices.",
    },
    {
      id: "5",
      question: "What happens to my data if I delete the app?",
      answer:
        "Signed-in data is stored on our servers and restored when you log in again. Guest data on the device is lost. You can request account deletion anytime in Settings.",
    },
    {
      id: "6",
      question: "What's the difference between free and premium?",
      answer:
        "Free includes daily photo/sound ID limits, up to 100 sightings, 2 custom collections, 20 saved recordings, 5 AI chat messages per day, and 1 community post per day. Premium removes these limits and unlocks full detail sections on species pages.",
    },
    {
      id: "7",
      question: "Can I cancel my subscription?",
      answer:
        "Yes — cancel anytime in the App Store or Google Play. Premium stays active until the end of the billing period, then your account returns to the free tier. You can resubscribe later.",
    },
    {
      id: "8",
      question: "How do I organise my bird collection?",
      answer:
        "Use your life list, wishlist, and up to 2 custom collections on the free plan (100 sightings total). Premium adds unlimited custom collections and sightings. Create collections from My Birds to group trip lists or target species.",
    },
    {
      id: "9",
      question: "How do I add birds to my collection?",
      answer:
        "Save identification results, add catalogue species to your wishlist, or log sightings into custom collections from My Birds.",
    },
    {
      id: "10",
      question: 'What is "Which bird are you"?',
      answer:
        '"Which Bird Are You?" is a short personality quiz that matches you with a bird species. Share your result with friends when you are done.',
    },
    {
      id: "11",
      question: "What is the community Feed?",
      answer:
        "The Feed is where birders share photos, sightings, and tips. Free users can post once per day; Premium users can post without that daily cap.",
    },
    {
      id: "12",
      question: "How does AI chat work?",
      answer:
        "Ask AI is your birding assistant for field marks, behavior, and look-alikes. Free users get 5 messages per day; Premium unlocks unlimited chat.",
    },
    {
      id: "13",
      question: "What is the Global Catalogue?",
      answer:
        "Explore thousands of species with photos, calls, filters, and a Near You tab based on your location or birding region in Settings.",
    },
    {
      id: "14",
      question: "What is Bird of the Day?",
      answer:
        "Each day we feature a species with photos and facts. Free users get one feature per day; Premium can refresh for more.",
    },
    {
      id: "15",
      question: "How accurate is bird identification?",
      answer:
        "AI scores help you evaluate matches, but always confirm tricky IDs with a field guide, local expert, or additional field marks — especially for similar species.",
    },
    {
      id: "16",
      question: "Is my personal information secure?",
      answer:
        "Yes. We use industry-standard safeguards. See our Privacy Policy and Terms of Service for details.",
    },
    {
      id: "17",
      question: "How do I report inappropriate content?",
      answer:
        "Use Report on any post. Our team reviews reports to keep the community safe.",
    },
    {
      id: "18",
      question: "Can I export my collection data?",
      answer:
        "Export is not available yet. Signed-in sightings sync automatically across devices on your account.",
    },
  ],
} as const;

export type FaqStrings = {
  intro: string;
  contactLabel: string;
  contactEmail: string;
  items: ReadonlyArray<{
    id: string;
    question: string;
    answer: string;
  }>;
};

/** Resolve FAQ copy with the runtime app display name. */
export function getFaqStrings(appName: string): FaqStrings {
  const fill = (text: string) => formatString(text, { appName });
  return {
    intro: FAQ_STRINGS_TEMPLATE.intro,
    contactLabel: FAQ_STRINGS_TEMPLATE.contactLabel,
    contactEmail: FAQ_STRINGS_TEMPLATE.contactEmail,
    items: FAQ_STRINGS_TEMPLATE.items.map((item) => ({
      id: item.id,
      question: fill(item.question),
      answer: fill(item.answer),
    })),
  };
}
