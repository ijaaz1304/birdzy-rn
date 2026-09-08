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
      title: "Step-by-step Identify",
      subtitle: "Answer a few questions to narrow nearby species.",
      homeDescription: "Merlin-style step-by-step bird finder.",
      locationRequired: "Turn on location to find birds near you.",
      loadError: "Could not load nearby birds.",
      retry: "Try again",
      empty: "No birds match your answers. Try a different location, date, or size.",
      introTitle: "Let’s Find Your Bird",
      introBody:
        "Answer a few simple questions about the bird you saw, and we’ll help narrow down the most accurate matches.",
      findOutNow: "Find out now",
      closeA11y: "Close",
      skip: "Skip",
      next: "Next",
      resetToday: "Reset to Today",
      customLocation: "Custom Location",
      enterLocation: "Enter location",
      currentLocation: "Current location",
      recentlyUsed: "Recently Used",
      questions: {
        location: "Where did you see this bird",
        date: "When did you see the bird?",
        size: "How big was the bird?",
        colors: "What were the main colors?",
        habitat: "Where was the bird?",
      },
      yourAnswers: "Your Answers",
      yourAnswersSubtitle:
        "Review and edit your responses. Changes will update your results.",
      edit: "Edit",
      cantFindTitle: "Still can’t find your bird?",
      cantFindBody:
        "Let Birdzy know. The bird you're seeing may not be in our database yet. Your response will help improve Birdzy's accuracy.",
      addManually: "Add bird manually",
      reportNoMatches: "Report no matches",
      reportTitle: "Report no matches",
      reportDescription:
        "Tell us what you saw so we can improve step-by-step results.",
      reportSent: "Thanks — we received your report.",
    },
    audioGallery: {
      title: "Bird Sound Library",
      homeDescription: "Save, replay, and manage bird sound recordings.",
      identified: "Identified",
      unknown: "Unknown",
      unknownClip: "Sample",
      myRecording: "My Recording",
      searchPlaceholder: "Search recordings...",
      identifyCta: "Identify by Sound",
      emptyTitle: "No recordings yet",
      emptySubtitle:
        "Record bird sounds using Sound ID and save them here for future reference.",
      emptyIdentified: "No identified recordings yet.",
      emptyUnknown: "No unknown recordings yet.",
      emptySearch: "No matching recordings.",
      sortTitle: "Sort recordings",
      sortNewest: "Newest",
      sortOldest: "Oldest",
      sortName: "Name A–Z",
      cancel: "Cancel",
      matches: "matches",
      match: "match",
      deleteTitle: "Delete recording?",
      deleteMessage: "This recording will be removed from your library.",
      deleteConfirm: "Delete",
      loadError: "Could not load your audio gallery.",
      retry: "Try again",
      empty: "No recordings yet. Identify a bird by sound to build your gallery.",
      limitBannerA11y:
        "Recording limit reached. You've reached the limit of 20 saved recordings on the free plan. Go Pro.",
    },
  },
} as const;
