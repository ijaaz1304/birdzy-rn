/**
 * Global App Configuration Types
 * Base types for making the entire app dynamic and reusable
 */

import { ImageSourcePropType } from "react-native";
import { FeedConfig } from "../features/feed/config/feedConfig.types";

/**
 * App Type - determines which configuration to use
 */
export type AppType = "mushrooms" | string;

/**
 * Home Screen Configuration
 */
export interface HomeConfig {
  // Header
  header: {
    greeting: (userName: string) => string;
    searchPlaceholder: string;
  };

  // Categories
  categories: {
    tabs: string[];
    defaultTab: string;
  };

  // Featured Item Banner
  featuredBanner: {
    title: string;
    subtitle: string;
    buttonText: string;
    image?: ImageSourcePropType;
  };

  // Sections
  sections: {
    exploreByCategory: {
      title: string;
      viewAllText: string;
    };
    diagnose: {
      title: string;
      subtitle?: string;
    };
    specialTools: {
      title: string;
      tools: Array<{
        id: string;
        title: string;
        iconSource: ImageSourcePropType;
        route?: string;
      }>;
    };
    reminders?: {
      title?: string;
      emptyTitle?: string;
      emptySubtitle?: string;
    };
    otherApps: {
      title: string;
      viewAllText: string;
      apps: Array<{
        id: string;
        title: string;
        subtitle: string;
        image?: ImageSourcePropType;
      }>;
    };
  };

  // Discount banners
  discount: {
    bannerText: (percent: number) => string;
    countdownTitle?: string;
  };
}

/**
 * Catalogue Configuration
 */
export interface CatalogueConfig {
  screenTitle: string;
  searchPlaceholder: string;
  categories: Array<{
    label: string;
    value: string;
  }>;
  filters: {
    defaultFilters: string[];
    availableFilters: string[];
  };
  emptyState: {
    title: string;
    subtitle: string;
    image?: ImageSourcePropType;
  };
  itemLabel: string; // e.g., "Mineral Name", "Rock Species"
  scientificNameLabel: string;
}

/**
 * Auth Configuration
 */
export interface AuthConfig {
  login: {
    title: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    forgotPasswordText: string;
    signInButtonText: string;
    signUpLinkText: string;
    signUpPromptText: string;
    socialLogin: {
      apple: string;
      google: string;
      facebook?: string;
    };
    orText: string;
  };
  signUp: {
    title: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    signUpButtonText: string;
    signInLinkText: string;
    signInPromptText: string;
    socialLogin: {
      apple: string;
      google: string;
      facebook?: string;
    };
    orText: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    submitButtonText: string;
    backToLoginText: string;
  };
  verifyEmail: {
    title: string;
    subtitle: string;
    resendButtonText: string;
  };
  createNewPassword: {
    title: string;
    subtitle: string;
    newPasswordPlaceholder: string;
    reEnterPasswordPlaceholder: string;
    saveButtonText: string;
  };
  completeProfile: {
    title: string;
    subtitle: string;
    namePlaceholder: string;
    agePlaceholder: string;
    genderPlaceholder: string;
    countryPlaceholder: string;
    submitButtonText: string;
    skipText: string;
  };
}

/**
 * Camera/Identification Configuration
 */
export interface CameraConfig {
  identify: {
    title: string;
    subtitle: string;
    takePhotoText: string;
    selectFromGalleryText: string;
  };
  diagnosis: {
    loadingTitle: string;
    loadingSubtitle: string;
    resultTitle: string;
    confidenceLabel: string;
    careTipsTitle: string;
  };
}

/**
 * Collection Configuration
 */
export interface CollectionConfig {
  myItems: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  wishlist: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  collections: {
    title: string;
    createButtonText: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  createCollection: {
    title: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    createButtonText: string;
  };
  itemLabel: string; // e.g., "Plant"
  itemsLabel: string; // e.g., "Plants"
  itemLabelPlural: string; // e.g., "Plants" (for display)
}

/**
 * Settings Configuration
 */
export interface SettingsConfig {
  screenTitle: string;
  sections: {
    profile: {
      title: string;
      editProfile: string;
    };
    account: {
      title: string;
      notifications: string;
      privacy: string;
      terms: string;
    };
    app: {
      title: string;
      theme: string;
      language: string;
      rateUs: string;
      appLogs: string;
    };
    about: {
      title: string;
      version: string;
    };
  };
}

/**
 * Onboarding Configuration
 */
export interface OnboardingConfig {
  pages: Array<{
    title: string;
    subtitle: string;
    /**
     * Either provide a concrete image, or an imageKey resolved by the Onboarding screen.
     * (Onboarding uses a switch to map keys to images/SVGs.)
     */
    image?: ImageSourcePropType;
    imageKey?: string;
    stats?: {
      label: string;
      value: string;
      subtitle?: string;
    };
    tabs?: string[];
  }>;
  skipText: string;
  continueText: string;
  getStartedText: string;
  continueAsGuestText: string;
}

/**
 * Global App Assets Configuration
 */
export interface AppAssets {
  // Images
  images: {
    placeholder?: ImageSourcePropType;
    defaultAvatar?: ImageSourcePropType;
    giftBox?: ImageSourcePropType;
    appIcon?: ImageSourcePropType;
    [key: string]: ImageSourcePropType | undefined;
  };

  // Icons (if needed)
  icons?: {
    [key: string]: ImageSourcePropType;
  };
}

/**
 * Complete App Configuration
 * This is the main configuration object that defines everything for an app type
 */
export interface AppConfig {
  // App metadata
  appType: AppType;
  appName: string;
  packageName: string;

  // Feature configurations
  home: HomeConfig;
  catalogue: CatalogueConfig;
  auth: AuthConfig;
  camera: CameraConfig;
  collection: CollectionConfig;
  feed: FeedConfig;
  settings: SettingsConfig;
  onboarding: OnboardingConfig;

  // Assets
  assets: AppAssets;

  // API endpoints (can be customized per app)
  apiEndpoints?: {
    identify?: string;
    search?: string;
    details?: string;
    [key: string]: string | undefined;
  };

  // Constants
  constants?: {
    identificationThresholds?: {
      high: number;
      medium: number;
      low: number;
    };
    [key: string]: any;
  };
}
