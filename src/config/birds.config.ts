/**
 * Birdzy app configuration
 */

import { AppConfig } from "./types";
import { birdsFeedConfig } from "../features/feed/config/feedConfig";
import { Images } from "../assets";
import { DEFAULT_APP_DISPLAY_NAME } from "../constants/branding";

export const birdsAppConfig: AppConfig = {
  appType: "birds",
  appName: DEFAULT_APP_DISPLAY_NAME,
  packageName: "com.trackzio.birds",

  home: {
    header: {
      greeting: (userName: string) => `Hello, ${userName}!`,
      searchPlaceholder: "Search birds...",
    },
    categories: {
      tabs: ["Popular", "Raptors", "Songbirds", "Water birds"],
      defaultTab: "Popular",
    },
    featuredBanner: {
      title: "BIRD OF THE DAY",
      subtitle: "Say hello to today's featured species!",
      buttonText: "Open",
      image: Images.homeBirdOfDay,
    },
    sections: {
      exploreByCategory: {
        title: "Explore by Category",
        viewAllText: "View all",
      },
      diagnose: {
        title: "Identify a bird",
      },
      specialTools: {
        title: "Special Tools",
        tools: [
          {
            id: "identify",
            title: "Identify\nmode",
            iconSource: Images.cameraIcon,
            route: "Identify",
          },
        ],
      },
      otherApps: {
        title: "Our Other Apps",
        viewAllText: "View all",
        apps: [
          {
            id: "birds",
            title: "Birdzy Identification",
            subtitle: "Discover & identify birds",
            image: Images.homeFindSpecies,
          },
          {
            id: "coins",
            title: "Coinzy-Coin AI Identification",
            subtitle: "Discover, Identify, Track & Trade Coins",
            image: Images.homeFindSpecies,
          },
        ],
      },
    },
    discount: {
      bannerText: (percent: number) => `Get ${percent}% off on Premium`,
      countdownTitle: "Limited Time Offer",
    },
  },

  catalogue: {
    screenTitle: "Catalogue",
    searchPlaceholder: "Find birds by name or traits...",
    categories: [
      { label: "All (0)", value: "All" },
      { label: "Near you (0)", value: "Near you" },
      { label: "Raptors (0)", value: "Raptors" },
      { label: "Songbirds (0)", value: "Songbirds" },
      { label: "Water birds (0)", value: "Water birds" },
      { label: "Threatened (0)", value: "Threatened" },
      { label: "Soaring (0)", value: "Soaring" },
    ],
    filters: {
      defaultFilters: ["Common", "Rare", "Migratory"],
      availableFilters: [
        "Common",
        "Rare",
        "Migratory",
        "Resident",
        "Threatened",
      ],
    },
    emptyState: {
      title: "Oops! No birds found.",
      subtitle: "Try adjusting your search or filters",
    },
    itemLabel: "Bird Name",
    scientificNameLabel: "Scientific Name",
  },

  auth: {
    login: {
      title: "Log in to Birdzy",
      emailPlaceholder: "Enter email",
      passwordPlaceholder: "Enter your password",
      forgotPasswordText: "Forgot password",
      signInButtonText: "Sign in",
      signUpLinkText: "Sign up",
      signUpPromptText: "New to Birdzy? ",
      socialLogin: {
        apple: "Continue with Apple",
        google: "Continue with Google",
      },
      orText: "or",
    },
    signUp: {
      title: "Sign up for Birdzy",
      emailPlaceholder: "Enter email",
      passwordPlaceholder: "Enter password",
      confirmPasswordPlaceholder: "Confirm password",
      signUpButtonText: "Sign up",
      signInLinkText: "Sign in",
      signInPromptText: "Already have an account?",
      socialLogin: {
        apple: "Continue with Apple",
        google: "Continue with Google",
      },
      orText: "or",
    },
    forgotPassword: {
      title: "Forgot password",
      subtitle:
        "Please enter the e-mail address you use to log in, and we will send you a code to reset your password.",
      emailPlaceholder: "Enter email",
      submitButtonText: "Send reset link",
      backToLoginText: "Back to login",
    },
    verifyEmail: {
      title: "Verify your email",
      subtitle: "We sent a verification link to your email",
      resendButtonText: "Resend email",
    },
    createNewPassword: {
      title: "Create a new password",
      subtitle: "Enter your new password",
      newPasswordPlaceholder: "New password",
      reEnterPasswordPlaceholder: "Re-enter your password",
      saveButtonText: "Save",
    },
    completeProfile: {
      title: "Almost finished!",
      subtitle:
        "Tell us a bit about yourself so we can tailor the experience just for you.",
      namePlaceholder: "Enter name",
      agePlaceholder: "Enter age",
      genderPlaceholder: "Select gender",
      countryPlaceholder: "Select country",
      submitButtonText: "Continue",
      skipText: "Skip",
    },
  },

  camera: {
    identify: {
      title: "Identify Bird",
      subtitle: "Take a photo or record a call",
      takePhotoText: "Take Photo",
      selectFromGalleryText: "Select from Gallery",
    },
    diagnosis: {
      loadingTitle: "Analyzing...",
      loadingSubtitle: "Please wait while we identify your bird",
      resultTitle: "Identification Result",
      confidenceLabel: "Confidence",
      careTipsTitle: "Field marks",
    },
  },

  collection: {
    myItems: {
      title: "My Birds",
      emptyTitle: "No sightings yet",
      emptySubtitle: "Start adding birds to your life list",
    },
    wishlist: {
      title: "Wishlist",
      emptyTitle: "Your wishlist is empty",
      emptySubtitle: "Add birds you hope to see",
    },
    collections: {
      title: "Collections",
      createButtonText: "Create Collection",
      emptyTitle: "No collections yet",
      emptySubtitle: "Create collections to organize your sightings",
    },
    createCollection: {
      title: "Create Collection",
      namePlaceholder: "Collection name",
      descriptionPlaceholder: "Description (optional)",
      createButtonText: "Create",
    },
    itemLabel: "Bird",
    itemsLabel: "Birds",
    itemLabelPlural: "Birds",
  },

  feed: birdsFeedConfig,

  settings: {
    screenTitle: "Settings",
    sections: {
      profile: {
        title: "Profile",
        editProfile: "Edit Profile",
      },
      account: {
        title: "Account",
        notifications: "Notifications",
        privacy: "Privacy",
        terms: "Terms & Conditions",
      },
      app: {
        title: "App",
        theme: "Theme",
        language: "Language",
        rateUs: "Rate Us",
        appLogs: "App Logs",
      },
      about: {
        title: "About",
        version: "Version",
      },
    },
  },

  onboarding: {
    pages: [
      {
        title: "Discover thousands of birds like never before",
        subtitle:
          "Scan with AI, explore a vast birdabase, and connect with a nature-loving community,",
        imageKey: "auth_scans",
      },
      {
        title: "Browse a vast collection of birds.",
        subtitle:
          "Explore a global collection of birds with detailed images, filters, and identification guides.",
        imageKey: "auth_cards",
      },
      {
        title: "Curate your own bird collections.",
        subtitle:
          "Create personalized collections and organize your birds just the way you prefer.",
        imageKey: "auth_identity",
        stats: {
          label: "Number of species",
          value: "10,000+",
          subtitle: "species",
        },
        tabs: ["Popular", "Raptors", "Songbirds", "Waterfowl"],
      },
      {
        title: "Identify birds by sound",
        subtitle:
          "Record or upload bird sounds to identify species by their songs and calls, even when they're hidden from view.",
        imageKey: "auth_scans",
      },
      {
        title: "Keep track of your bird journey",
        subtitle:
          "Sign up and log in to ensure your bird discoveries are never lost.",
        imageKey: "auth_mins",
      },
    ],
    skipText: "Skip",
    continueText: "Next",
    getStartedText: "Get started",
    continueAsGuestText: "Continue as Guest",
  },

  assets: {
    images: {
      placeholder: Images.homeFindSpecies,
      defaultAvatar: Images.appIcon,
      giftBox: Images.giftBox,
      appIcon: Images.appIcon,
      birdSample: Images.homeFindSpecies,
    },
  },

  apiEndpoints: {
    identify: "/core/ai/identify",
    search: "/core/archetypes/fetchAll",
    details: "/core/archetypes/getDetails/:id",
  },

  constants: {
    identificationThresholds: {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    },
  },
};
