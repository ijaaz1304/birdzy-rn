/**
 * Navigation type definitions
 */

import type { WizardQuestion } from "../features/discovery/stepByStep.types";
import type { ImageSourcePropType } from "react-native";

export type AuthStackParamList = {
  Login:
    | {
        /** When coming from Settings as guest: pass so Login/SignUp can promote guest. */
        guestId?: string;
        /** True when user tapped Login from Settings while signed in as guest. */
        fromGuest?: boolean;
      }
    | undefined;
  SignUp:
    | {
        /** Pass when navigating from Login as guest so signup promotes guest. */
        guestId?: string;
        fromGuest?: boolean;
      }
    | undefined;
  Register: undefined;
  ForgotPassword: { prefillEmail?: string } | undefined;
  VerifyEmail: {
    email?: string;
    isPasswordReset?: boolean;
    /** Prefill OTP when user opens `rockzy://reset-password?...&code=` from email */
    initialOtp?: string;
  };
  /** Forgot password: enter new password after OTP on VerifyEmail */
  CreateNewPassword: { email: string; code: string };
  CompleteProfile: undefined;
  LegalWebView: { url: string; title: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Catalogue: NavigatorScreenParams<CatalogueStackParamList>;
  Camera: NavigatorScreenParams<CameraStackParamList>;
  Collection: NavigatorScreenParams<CollectionStackParamList>;
  Feed: NavigatorScreenParams<FeedStackParamList> | undefined;
  Subscription: undefined;
  Profile: undefined;
};

export type BirdSoundsScreenParams = {
  soundUrls: string[];
  userCapturedSounds?: string[];
  customLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  durationsSec?: Record<string, number>;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  BirdOfTheDay: { mushroomId?: string };
  BirdDetails: {
    mushroomId: string;
    source?:
      | "birdOfTheDay"
      | "home"
      | "catalogue"
      | "collection"
      | "identification";
    collectionName?: string;
    idType?: "specimen";
    specimenId?: string;
    otherMatches?: Array<{
      id: string;
      name: string;
      image?: string;
      accuracy?: number;
      similarityScore?: number;
    }>;
  };
  // Weather removed - not needed for rocks/minerals app
  OtherApps: undefined;
  StepByStep:
    | {
        editQuestion?: WizardQuestion;
        startFresh?: boolean;
      }
    | undefined;
  AudioGallery: undefined;
  BirdSounds: BirdSoundsScreenParams;
};

/** When Other Possible Matches was opened from Catalogue details, back restores this screen. */
export type OtherPossibleMatchesReturnTo = {
  tab: "Catalogue";
  screen: "BirdDetails";
  params: {
    mushroomId: string;
    source: "catalogue";
  };
};

export type OtherPossibleMatchesScreenParams = {
  matches: any[];
  title?: string;
  returnTo?: OtherPossibleMatchesReturnTo;
  /** User photo from identify flow — shown on Mushroom Details hero. */
  identificationImage?: { uri: string };
  /** Step-by-step wizard results — shows Your Answers + extra CTAs. */
  fromStepByStep?: boolean;
  /** Sound identify results — spectrogram card, save recording, add note. */
  fromSound?: boolean;
  audioUri?: string;
  audioDurationSec?: number;
  recordedAt?: number;
};

export type CameraStackParamList = {
  IdentificationLocationGate: undefined;
  CameraMain: {
    returnImageToAskAI?: boolean;
    pendingCrop?: {
      uri: string;
      displayUri?: string;
      width?: number;
      height?: number;
    };
    resetCapture?: boolean;
  } | undefined;
  GalleryPicker: { returnImageToAskAI?: boolean } | undefined;
  IdentifyImageCrop: {
    imageUri: string;
    returnTarget: "camera" | "analysis" | "askAi";
    returnImageToAskAI?: boolean;
    /** Set when CameraScreen already unmounted VisionCamera before navigate. */
    cameraAlreadyReleased?: boolean;
  };
  DiagnoseEntry: undefined;
  CameraPermissionGate: { mode?: "diagnose" | "identify" };
  CameraCaptureScreen: { mode?: "diagnose" | "identify" };
  DiagnosisLoading: {
    /** Image sent to the identification API. */
    image?: { uri: string; width?: number; height?: number };
    /** User-facing preview (captured/cropped) shown during analysis. */
    displayImage?: { uri: string; width?: number; height?: number };
    /** Optional multi-image identify input (max 2) */
    images?: Array<{ uri: string; width?: number; height?: number }>;
    /** Sound identify — local recording uri (file://). */
    audioUri?: string;
    audioDurationSec?: number;
    recordedAt?: number;
    cropStartSec?: number;
    cropDurationSec?: number;
    identifyMode?: "image" | "sound" | "stepByStep";
  };
  SoundIdentify: undefined;
  SoundCrop: {
    audioUri: string;
    durationSec: number;
    recordedAt: number;
  };
  IdentifyHub: undefined;
  OtherPossibleMatches: OtherPossibleMatchesScreenParams;
};

export type CatalogueStackParamList = {
  CatalogueMain: { category?: string } | undefined;
  BirdDetails: {
    mushroomId: string;
    source?: "catalogue" | "birdOfTheDay";
    /** Thumbnail from catalogue list — shown immediately while detail API loads */
    previewImageUri?: string;
    /** When source is mushroomOfTheDay: list of mushroom IDs to cycle through with "Show more" */
    birdOfTheDayIds?: string[];
    /** When source is mushroomOfTheDay: number of "Show more" clicks so far (0–3) */
    birdOfTheDayClickCount?: number;
    otherMatches?: Array<{
      id: string;
      name: string;
      image?: string;
      accuracy?: number;
      similarityScore?: number;
    }>;
    fromOtherPossibleMatches?: boolean;
    otherPossibleMatchesTitle?: string;
    otherPossibleMatchesReturnTo?: OtherPossibleMatchesReturnTo;
    initialMushroomData?: any;
  };
  SearchFilter: { initialQuery?: string } | undefined;
  BirdSounds: BirdSoundsScreenParams;
};

export type CollectionStackParamList = {
  CollectionMain: { initialTab?: "collections" };
  MyBirds: undefined;
  Wishlist: undefined;
  CreateCollection: undefined;
  CollectionDetails: {
    collectionId: string;
    collectionName?: string;
    collectionData?: any;
  };
  BirdDetails: {
    mushroomId: string;
    source?: "collection" | "catalogue" | "identification" | "birdOfTheDay" | "quiz";
    /** When source is 'collection', which collection (e.g. 'Owned' | 'Identified' | 'Wishlist') — used to show Edit only for Owned/Identified */
    collectionName?: string;
    /** When fromCollectionDetails, used to navigate back to CollectionDetails after remove */
    collectionId?: string;
    /** When set, mushroomId is a specimen ID; details screen will resolve to archetype via specimen API */
    idType?: "specimen";
    /** MushroomSpecimen ID for Edit flow (PATCH /core/specimen/update/:id). Pass when opening from collection so Save works. */
    specimenId?: string;
    /** When source is mushroomOfTheDay: list of mushroom IDs to cycle through with "Show more" */
    birdOfTheDayIds?: string[];
    /** When source is mushroomOfTheDay: number of "Show more" clicks so far (0–3) */
    birdOfTheDayClickCount?: number;
    otherMatches?: Array<{
      id: string;
      name: string;
      image?: string;
      accuracy?: number;
      similarityScore?: number;
    }>;
    /** When true, back from Mushroom Details should return to Other Possible Matches screen */
    fromOtherPossibleMatches?: boolean;
    /** Title for Other Possible Matches when returning from catalogue similar-species flow */
    otherPossibleMatchesTitle?: string;
    /** Parent catalogue details to restore when leaving Other Possible Matches */
    otherPossibleMatchesReturnTo?: OtherPossibleMatchesReturnTo;
    /** When source is 'identification': match confidence 0–100 (or 0–1). Shown as accuracy badge. */
    identificationAccuracy?: number;
    /** When source is 'identification': the photo the user took. Shown as first hero image. */
    identificationImage?: { uri: string };
    /** Thumbnail from list — shown immediately while detail API loads */
    previewImageUri?: string;
    /** When true, Back returns to previous screen (e.g. CollectionDetails) instead of tab root. */
    fromCollectionDetails?: boolean;
    /** When source is 'identification': pre-filled mushroom data from identify API; no archetype fetch. */
    initialMushroomData?: any;
  };
  EditBirdDetails: {
    mushroomId: string;
    specimenId?: string;
    /** Pre-filled form data from MushroomDetails; no API fetch in Edit. */
    initialData?: any;
    /** When 'identification': first save uses specimen/add; when 'collection': always specimen/update. */
    source?: "identification" | "collection";
  };
  BirdSounds: BirdSoundsScreenParams;
};

export type FeedStackParamList = {
  FeedMain: undefined;
  CreatePost:
    | {
        /** When set, open in edit mode for this post */
        postId?: string;
        /** Pre-fill form when editing (title, content, itemName, image) */
        initialPost?: {
          title?: string;
          content?: string;
          itemName?: string;
          image?: string;
        };
        /** Returned from CropImage screen to replace a selected image */
        editedImageUri?: string;
        /** The URI that was edited (so we can replace it in state) */
        originalImageUri?: string;
        /** Restore form when returning from CropImage */
        title?: string;
        content?: string;
        itemName?: string;
      }
    | undefined;
  CropImage: {
    imageUri: string;
    /** iOS: file path from image picker (`originalPath`) so cropper gets a real file, not ph:// */
    pickerOriginalPath?: string;
    title?: string;
    content?: string;
    itemName?: string;
  };
  PostDetails: { postId: string };
  NotificationCenter: undefined;
};

export type AskAIStackParamList = {
  AskAIMain:
    | {
        initialMessage?: string;
        selectedImageUri?: string;
        assistant?: "chat" | "gotBitten";
      }
    | undefined;
  AskAIImageSource: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  ProfileSettings: undefined;
  AccountActions: undefined;
  Notifications: undefined;
  BirdRegion: undefined;
  RateUs: undefined;
  Privacy: undefined;
  Terms: undefined;
  FAQ: undefined;
  Appearance: undefined;
  AppLogs: undefined;
};

export type GuidesStackParamList = {
  GuidesMain: undefined;
  BirdGuide: { guideType: string; mushroomName?: string };
  WateringGuide: undefined;
  LightGuide: undefined;
  SoilGuide: undefined;
  FertilizerGuide: undefined;
  RepottingGuide: undefined;
};

export type SubscriptionStackParamList = {
  SubscriptionMain:
    | {
        openPlanModal?: boolean;
        discount50?: boolean;
        /** Marketing /subs deep links open paywall with this source. */
        comingFrom?: "deepLink";
      }
    | undefined;
  SubscriptionIntro: undefined;
  SubscriptionStatus:
    | { preview?: boolean; previewPlanKind?: "month" | "year" | "lifetime" }
    | undefined;
  DiscountModal: { discountCode?: string };
  LegalWebView: { url: string; title: string };
};

// Plant-specific calculators removed - not needed for rocks/minerals app
// export type PotSizeCalculatorStackParamList = {
//   PotSizeCalculatorMain: { plantId?: string } | undefined;
//   PotShapeSelection: { plantId?: string } | undefined;
//   ARMeasureHeight: { shape: string; plantId?: string };
//   ARMeasureWidth: { shape: string; height: number; plantId?: string };
//   ARMeasureLength: { shape: string; height: number; width: number; plantId?: string };
//   ARMeasureTopRadius: { shape: string; height: number; plantId?: string };
//   ARMeasureBottomRadius: { shape: string; height: number; topRadius: number; plantId?: string };
//   ARResult: {
//     shape: string;
//     height: number;
//     width: number;
//     length?: number;
//     topRadius?: number;
//     bottomRadius?: number;
//     volume?: number;
//     plantId?: string
//   };
// };

// Plant-specific calculators and light meter removed - not needed for rocks/minerals app

export type ModalStackParamList = {
  WebView: { url: string; title?: string };
  BottomSheet: { content: string };
};

export type QuizStackParamList = {
  QuizMain: undefined;
};

export type BirdPersonalityStackParamList = {
  BirdPersonalityIntro: undefined;
  PhotoSelection: undefined;
  Questionnaire: { photoUri?: string };
  Analysis: { photoUri?: string; answers: Record<string, string> };
  Result: {
    mushroomId: string;
    mushroomName: string;
    traits: string[];
    oneLiner?: string;
    shareText?: string;
    mushroomImageUri?: string | ImageSourcePropType;
    photoUri?: string;
  };
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: { initialPage?: number } | undefined;
  PostAuthOnboarding: undefined;
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  // Modal/Overlay Stacks
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
  SubscriptionStack: NavigatorScreenParams<SubscriptionStackParamList>;
  // Plant-specific calculators and light meter removed - not needed for rocks/minerals app
  AskAIStack: NavigatorScreenParams<AskAIStackParamList>;
  GuidesStack: NavigatorScreenParams<GuidesStackParamList>;
  QuizStack: NavigatorScreenParams<QuizStackParamList>;
  BirdPersonalityStack: NavigatorScreenParams<BirdPersonalityStackParamList>;
  // Note: Feature stacks (Home, Camera, Catalogue, Collection, Feed) are nested inside MainTabs
  // Access them via: navigation.navigate('MainTabs', { screen: 'Home', params: {...} })
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
