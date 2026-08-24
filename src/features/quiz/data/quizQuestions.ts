/**
 * Quiz Questions and Logic for "Which Bird Are You?" Personality Quiz
 * 4 personality questions, 4 buckets, 8 bird personas (2 per bucket).
 * All data local; no API. Internal ids kept stable for bundled quiz images.
 */

import { ImageSourcePropType } from "react-native";
export type PersonalityBucket =
  | "EARTHY_STABLE"
  | "SOCIAL_ADAPTABLE"
  | "BOLD_DYNAMIC"
  | "QUIET_REFLECTIVE";

export interface QuizQuestion {
  id: string;
  question: string;
  type: "personality";
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  bucket: PersonalityBucket;
}

export interface QuizResult {
  /** Stable quiz persona id (maps to bundled image key) */
  mushroomId: string;
  /** Display bird name for the persona */
  mushroomName: string;
  /** @deprecated Alias — use mushroomName */
  birdName: string;
  /** @deprecated Alias — use mushroomId */
  birdId: string;
  oneLiner: string;
  traits: string[];
  shareText: string;
  image?: string | ImageSourcePropType;
  bucket: PersonalityBucket;
}

export const QUIZ_BIRD_IDS = [
  "porcini",
  "reishi",
  "oyster_mushroom",
  "wild_enoki",
  "fly_agaric",
  "lions_mane",
  "morel",
  "winter_chanterelle",
] as const;

/** @deprecated Use QUIZ_BIRD_IDS */
export const QUIZ_MUSHROOM_IDS = QUIZ_BIRD_IDS;
/** @deprecated Use QUIZ_BIRD_IDS */
export const QUIZ_ROCK_IDS = QUIZ_BIRD_IDS;

export type QuizBirdId = (typeof QUIZ_BIRD_IDS)[number];
/** @deprecated Use QuizBirdId */
export type QuizMushroomId = QuizBirdId;
/** @deprecated Use QuizBirdId */
export type QuizRockId = QuizBirdId;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "1",
    question: "You arrive at a busy birding hotspot. You...",
    type: "personality",
    options: [
      {
        id: "a",
        text: "Join the group and compare notes on what everyone is seeing.",
        bucket: "SOCIAL_ADAPTABLE",
      },
      {
        id: "b",
        text: "Find a quiet bench and watch the same patch of habitat for an hour.",
        bucket: "EARTHY_STABLE",
      },
      {
        id: "c",
        text: "Slip onto a side trail alone with binoculars and a field guide.",
        bucket: "QUIET_REFLECTIVE",
      },
      {
        id: "d",
        text: "Head straight to the noisiest flock and start photographing everything.",
        bucket: "BOLD_DYNAMIC",
      },
    ],
  },
  {
    id: "2",
    question: "You hear an unfamiliar call in the woods. What's your move?",
    type: "personality",
    options: [
      {
        id: "a",
        text: "Record it, check the spectrogram, and compare with known calls.",
        bucket: "QUIET_REFLECTIVE",
      },
      {
        id: "b",
        text: "Play it back once and wait patiently for a response.",
        bucket: "EARTHY_STABLE",
      },
      {
        id: "c",
        text: "Follow the sound immediately — you'll figure out the ID on the way.",
        bucket: "BOLD_DYNAMIC",
      },
      {
        id: "d",
        text: "Ask nearby birders if they've heard it before.",
        bucket: "SOCIAL_ADAPTABLE",
      },
    ],
  },
  {
    id: "3",
    question: "You have a free morning to bird. You choose...",
    type: "personality",
    options: [
      {
        id: "a",
        text: "A new hotspot you've never visited — something rare might be there.",
        bucket: "BOLD_DYNAMIC",
      },
      {
        id: "b",
        text: "Your favorite local patch where you know every tree line.",
        bucket: "EARTHY_STABLE",
      },
      {
        id: "c",
        text: "A group walk with the local Audubon chapter.",
        bucket: "SOCIAL_ADAPTABLE",
      },
      {
        id: "d",
        text: "Dawn alone on a marsh boardwalk with hot coffee.",
        bucket: "QUIET_REFLECTIVE",
      },
    ],
  },
  {
    id: "4",
    question: "Someone asks what you're looking at through your binoculars. You...",
    type: "personality",
    options: [
      {
        id: "a",
        text: "Hand them your bins and point out the field marks.",
        bucket: "SOCIAL_ADAPTABLE",
      },
      {
        id: "b",
        text: "Give a quick ID and go back to your list.",
        bucket: "EARTHY_STABLE",
      },
      {
        id: "c",
        text: "Smile and keep watching — you're in the zone.",
        bucket: "QUIET_REFLECTIVE",
      },
      {
        id: "d",
        text: "Launch into an excited mini-lesson on why it's special.",
        bucket: "BOLD_DYNAMIC",
      },
    ],
  },
];

const BIRDS_BY_BUCKET: Record<
  PersonalityBucket,
  {
    birdId: QuizBirdId;
    birdName: string;
    oneLiner: string;
    shareDescriptor: string;
    traits: [string, string, string, string];
  }[]
> = {
  EARTHY_STABLE: [
    {
      birdId: "porcini",
      birdName: "Great Horned Owl",
      oneLiner: "Patient watcher. Deep roots. Unshakable focus.",
      shareDescriptor: "patient watcher, deep roots, unshakable focus",
      traits: [
        "You stay calm and observant in any situation",
        "You build knowledge slowly and reliably",
        "People trust your steady perspective",
        "You don't rush — you wait for the right moment",
      ],
    },
    {
      birdId: "reishi",
      birdName: "Barred Owl",
      oneLiner: "Quiet confidence. Familiar woods. Timeless presence.",
      shareDescriptor: "quiet confidence, familiar woods, timeless presence",
      traits: [
        "You are comfortable in routines that work",
        "You notice details others overlook",
        "Your calm energy puts people at ease",
        "You prefer depth over drama",
      ],
    },
  ],
  SOCIAL_ADAPTABLE: [
    {
      birdId: "oyster_mushroom",
      birdName: "American Robin",
      oneLiner: "Everywhere friendly. Easy to spot. Always connecting.",
      shareDescriptor: "everywhere friendly, easy to spot, always connecting",
      traits: [
        "You adapt quickly to new people and places",
        "You make others feel welcome",
        "You bring familiar warmth wherever you go",
        "You thrive in community",
      ],
    },
    {
      birdId: "wild_enoki",
      birdName: "Barn Swallow",
      oneLiner: "Light on the wing. Social skies. Agile spirit.",
      shareDescriptor: "light on the wing, social skies, agile spirit",
      traits: [
        "You move easily between groups and ideas",
        "You communicate with energy and charm",
        "You follow opportunity without losing balance",
        "You lift the mood around you",
      ],
    },
  ],
  BOLD_DYNAMIC: [
    {
      birdId: "fly_agaric",
      birdName: "Bald Eagle",
      oneLiner: "Commanding presence. Big vision. Hard to miss.",
      shareDescriptor: "commanding presence, big vision, hard to miss",
      traits: [
        "You naturally take the lead",
        "You act decisively when it matters",
        "You inspire confidence in others",
        "You aim high and follow through",
      ],
    },
    {
      birdId: "lions_mane",
      birdName: "Peregrine Falcon",
      oneLiner: "Fast mind. Sharp focus. Built for action.",
      shareDescriptor: "fast mind, sharp focus, built for action",
      traits: [
        "You think and move quickly",
        "You pursue goals with intensity",
        "You cut through noise to what matters",
        "You perform best under pressure",
      ],
    },
  ],
  QUIET_REFLECTIVE: [
    {
      birdId: "morel",
      birdName: "Hermit Thrush",
      oneLiner: "Soft song. Hidden depth. Forest soul.",
      shareDescriptor: "soft song, hidden depth, forest soul",
      traits: [
        "You open up slowly to those you trust",
        "You notice subtle patterns and sounds",
        "You prefer meaningful conversation over small talk",
        "Your insight reveals itself over time",
      ],
    },
    {
      birdId: "winter_chanterelle",
      birdName: "Snowy Owl",
      oneLiner: "Still watcher. Rare sight. Quiet power.",
      shareDescriptor: "still watcher, rare sight, quiet power",
      traits: [
        "You don't seek attention but leave an impression",
        "You observe more than you speak",
        "You value solitude and focus",
        "People remember you long after you leave",
      ],
    },
  ],
};

const SHARE_MID = " in the 'Which Bird Are You?' quiz — ";
const SHARE_END = ". What bird matches your vibe? Take the quiz on Birdzy!";

function getWinningBucket(answers: Record<string, string>): PersonalityBucket {
  const counts: Record<PersonalityBucket, number> = {
    EARTHY_STABLE: 0,
    SOCIAL_ADAPTABLE: 0,
    BOLD_DYNAMIC: 0,
    QUIET_REFLECTIVE: 0,
  };

  Object.entries(answers).forEach(([questionId, optionId]) => {
    const question = QUIZ_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;
    const option = question.options.find((o) => o.id === optionId);
    if (option) counts[option.bucket]++;
  });

  const maxCount = Math.max(...Object.values(counts));
  const tied: PersonalityBucket[] = (
    Object.entries(counts) as [PersonalityBucket, number][]
  )
    .filter(([, c]) => c === maxCount)
    .map(([b]) => b);

  return tied[Math.floor(Math.random() * tied.length)];
}

export function calculateQuizResult(
  answers: Record<string, string>,
  imageByBirdId?: Record<string, string | ImageSourcePropType>
): QuizResult {
  const bucket = getWinningBucket(answers);
  const birds = BIRDS_BY_BUCKET[bucket];
  const chosen = birds[Math.floor(Math.random() * birds.length)];
  const shareText = `I got ${chosen.birdName}${SHARE_MID}${chosen.shareDescriptor}${SHARE_END}`;

  return {
    mushroomId: chosen.birdId,
    mushroomName: chosen.birdName,
    birdId: chosen.birdId,
    birdName: chosen.birdName,
    oneLiner: chosen.oneLiner,
    traits: [...chosen.traits],
    shareText,
    image: imageByBirdId?.[chosen.birdId],
    bucket,
  };
}
