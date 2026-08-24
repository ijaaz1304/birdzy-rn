/**
 * Home Screen Strings
 */

export const HOME_STRINGS = {
  screen: {
    title: "Home",
  },
  header: {
    premiumBadge: "You are premium",
    proBadge: "You're Pro",
    goPro: "Go Pro",
  },
  greetings: {
    morning: "Good Morning",
    afternoon: "Good Afternoon",
    evening: "Good Evening",
  },
  sections: {
    myBirds: "My Birds",
    recentActivity: "Recent Activity",
    tools: "Tools",
  },
  banners: {
    identify: {
      title: "Identify Birds in Seconds",
      description:
        "Take a photo or record a call to get accurate matches and field-guide insights.",
      buttonText: "Identify Now",
    },
    yourBirdCorner: {
      title: "Your Bird Corner",
      birdPersonality: {
        title: "Bird Personality",
        description: "Discover your birding style",
      },
      askAi: {
        title: "Ask AI",
        description: "Get instant answer with AI chatbot",
      },
      birdSoundLibrary: {
        title: "Bird Sound Library",
        description: "Save, replay, and manage bird sound recordings.",
      },
      birdOfTheDay: "Bird of the day",
      birdOfTheDayDescription: "Say hello to today's featured bird!",
      description: "See which bird matches your vibe today.",
      buttonText: "Let's start",
    },
  },
  birdOfTheDay: {
    title: "Bird of the Day",
    badge: "Featured",
    label: "BIRD OF THE DAY",
    subtitle: "Say hello to today's featured bird!",
    buttonText: "Open",
    featuredBird: "Featured Bird",
    birdSpecimen: "Bird sighting",
    discoverDescription: "Discover amazing birds near you!",
    limitReached:
      "Daily refresh limit reached. Upgrade to Premium for unlimited refreshes.",
    refreshModal: {
      title: "Refresh Limit Reached",
      message:
        "Free users can refresh Bird of the Day once per day. Upgrade to Premium for unlimited refreshes!",
      upgrade: "Upgrade to Premium",
    },
  },
  otherApps: {
    getApp: "Get app",
  },
  discovery: {
    sectionTitle: "Bird discovery",
    soundIdentify: {
      title: "Identify by sound",
      description: "Record a bird call and get possible matches.",
    },
    identifyByPhoto: {
      title: "Identify by photo",
    },
    wizardBanner: {
      title: "Have no photos or sounds clear enough to identify?",
    },
    exploreNearYou: {
      title: "Explore Near You",
      description:
        "Discover bird sightings, hotspots, and species around your area.",
      exploreMap: "Explore Map",
      growingNow: "Growing Now",
      yearRound: "Year-round",
    },
    stepByStep: {
      title: "Bird ID wizard",
      subtitle: "Answer a few questions to narrow nearby species.",
      homeDescription: "Merlin-style step-by-step bird finder.",
      locationRequired: "Turn on location to find birds near you.",
      loadError: "Could not load nearby birds.",
      retry: "Try again",
      empty: "No birds match your filters. Try broadening size or colors.",
      steps: {
        location: "Where did you see it?",
        date: "When did you see it?",
        size: "How large was the bird?",
        colors: "What colors stood out?",
        behavior: "What was it doing?",
        results: "Likely matches near you",
      },
      locationHint: "We use your location to suggest birds reported nearby. You can change it in Settings.",
      locationDetected: "Using your current location",
      dateOptions: {
        today: "Today",
        yesterday: "Yesterday",
      },
      colorsHint: "Select all that apply (optional)",
      behaviorHint: "Select behaviors you noticed (optional)",
      next: "Next",
      seeResults: "See matches",
      back: "Back",
      skipFilters: "Skip",
      refining: "Refining…",
    },
    audioGallery: {
      title: "Sound recordings",
      homeDescription: "Replay your identified and unknown clips.",
      identified: "Identified",
      unknown: "Unknown",
      unknownClip: "Unknown recording",
      loadError: "Could not load your audio gallery.",
      retry: "Try again",
      empty: "No recordings yet. Identify a bird by sound to build your gallery.",
    },
  },
} as const;
