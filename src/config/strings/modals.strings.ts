/**
 * Modal, Popup, and Bottom Sheet Text Constants
 * All text strings for modals, popups, and bottom sheets
 * Common buttons (close, cancel, skip, next, back, done) come from COMMON_STRINGS.buttons
 */

import { COMMON_STRINGS } from "./common.strings";

export const MODAL_STRINGS = {
  // Bottom Sheets
  bottomSheets: {
    enableLocation: {
      title: "Improve Identification With Location",
      subtitle:
        "Use your location to improve Near You results and step-by-step suggestions for your area.",
      enableButton: "Continue",
      customLocationButton: "Custom Location",
    },
    cameraPermission: {
      title: "Improve Identification With Camera",
      subtitle: "To identify birds around you, we need access to your camera.",
      enableButton: "Continue",
      allowAccessButton: "Allow Access",
      openSettings: "Go to settings",
      deniedTitle: "Camera permission needed",
      deniedSubtitle:
        "Enable camera access in settings to scan and identify birds around you",
    },
    microphonePermission: {
      title: "Enable Microphone Access",
      subtitle:
        "Turn on microphone access to record bird sound and help AI identify nearby species.",
      enableButton: "Allow",
      notNowButton: "Not Now",
      openSettings: "Open Settings",
      deniedTitle: "Manage Microphone Access",
      deniedSubtitle:
        "Microphone access was previously turned off. Open Settings to enable the microphone for bird sound identification.",
    },
    chooseMethod: {
      title: "Choose a Method",
      subtitle: "Select how you'd like to identify the bird.",
      sound: "Identify by Sound",
      photo: "Identify by Photo",
      stepByStep: "Step-by-step Identify",
    },
    locationManageAccess: {
      title: "Manage Location Access",
      subtitle:
        "Location access was previously turned off. Open Settings to enable location and improve nearby bird results and identification accuracy.",
      goToSettings: "Open Settings",
      addLocation: "Add Location",
      customLocation: "Custom Location",
    },
    changeLocation: {
      title: "Change Location",
      addTitle: "Add Location",
      customTitle: "Change Location",
      subtitle:
        "Help us provide more accurate bird insights based on your area.",
      customLocationLabel: "Location",
      placeholder: "Enter location",
    },
    pushNotifications: {
      title: "Enable Notifications",
      subtitle:
        "Get notified about migration alerts, Bird of the Day, and community updates",
      enableButton: "Continue",
      openSettings: "Open Settings",
    },
    rateUs: {
      title: "Rate Us",
      subtitle: "Enjoying the app? Please rate us on the App Store",
      rateButton: "Rate Now",
      laterButton: "Maybe Later",
      skipButton: "Skip",
    },
    feedback: {
      title: "Feedback",
      subtitle: "Help us improve by sharing your feedback",
      submitButton: "Submit",
      cancelButton: "Cancel",
    },
    removeCollection: {
      title: "Remove from Collection",
      subtitle: "Select collections to remove this bird from",
      removeButton: "Remove",
      cancelButton: "Cancel",
    },
  },

  // Modals
  modals: {
    congratulations: {
      title: "Congratulations!",
      subtitle: "You have identified your {ordinal} bird",
      backToHomeButton: "Back to Home",
    },
    identificationSafety: {
      title: "Identification Disclaimer",
      subtitle:
        "AI identification is for reference only. Always confirm sightings with a field guide or local expert, especially for similar or rare species.",
      gotIt: "Got It",
    },
    unlimitedChats: {
      title: "Get Unlimited Chats",
      subtitle: "Upgrade to premium for unlimited AI chat assistance",
      upgradeButton: "Upgrade Now",
      laterButton: "Maybe Later",
    },
    unlimitedIdentifications: {
      title: "Get Unlimited Identifications",
      subtitle:
        "Upgrade to premium to identify unlimited birds by photo and sound",
      upgradeButton: "Upgrade Now",
      laterButton: "Maybe Later",
    },
    /** @deprecated Use unlimitedIdentifications */
    unlimitedMushrooms: {
      title: "Get Unlimited Identifications",
      subtitle:
        "Upgrade to premium to identify unlimited birds by photo and sound",
      upgradeButton: "Upgrade Now",
      laterButton: "Maybe Later",
    },
    freeCollection: {
      title: "Create unlimited collections - Go pro+ now",
      subtitle:
        "Free users can create up to 2 collections. Upgrade to Pro to organize unlimited bird sightings.",
      upgradeButton: "Upgrade for More",
      continueButton: "Continue",
    },
    advanceBirdDetails: {
      title: "Full bird details",
      subtitle: "Unlock sounds, range maps, habitat, and similar species",
      unlockButton: "Unlock",
      cancelButton: "Cancel",
    },
    /** @deprecated Use advanceBirdDetails */
    advanceMushroomDetails: {
      title: "Full bird details",
      subtitle: "Unlock sounds, range maps, habitat, and similar species",
      unlockButton: "Unlock",
      cancelButton: "Cancel",
    },
    couldNotIdentify: {
      title: "Could Not Identify Bird",
      subtitle:
        "We couldn't identify this bird. Please try again with a clearer photo or recording.",
      retakeButton: "Re-take Photo",
      tryAgainButton: "Try Again",
    },
    reportPost: {
      title: "Report this post",
      description:
        "Tell us what's wrong with this post. Your report will be reviewed by our team.",
      placeholder: "What is wrong with this post?",
      submitButton: "Send report",
      successMessage: "Report submitted successfully",
    },
    reportBird: {
      title: "Report this species",
      description:
        "Let us know if the bird info doesn't look right so we can fix it for everyone.",
      placeholder: "Message",
      submitButton: "Send report",
    },
    /** @deprecated Use reportBird */
    reportMushroom: {
      title: "Report this species",
      description:
        "Let us know if the bird info doesn't look right so we can fix it for everyone.",
      placeholder: "Message",
      submitButton: "Send report",
    },
  },

  // Popups (Modals)
  popups: {
    enableGallery: {
      title: "Choose Photos From Your Gallery",
      subtitle:
        "Select photos from your library to identify birds or share with the community.",
      enableButton: "Continue",
      openSettings: "Open Settings",
      deniedTitle: "Manage Photos Access",
      deniedSubtitle:
        "Photo library access was previously turned off. Open Settings to choose photos for bird identification.",
    },
    enableCamera: {
      title: "Enable Camera",
      subtitle: "Use your camera to take photos for bird identification.",
      enableButton: "Continue",
      openSettings: "Open Settings",
    },
    subscription: {
      title: "Upgrade to Premium",
      subtitle: "Unlock all features with a premium subscription",
      subscribeButton: "Subscribe",
      restoreButton: "Restore Purchase",
      cancelButton: "Cancel",
    },
  },

  // Discount Modals
  discount: {
    title50: "Get 50% Off – Limited Time",
    title70: "Get 70% Off – One Time Only",
    subtitle50:
      "Upgrade now to enjoy a smarter, faster app — for 50% of the normal price!",
    subtitle70:
      "Upgrade now to enjoy a smarter, faster app — for 30% of the normal price!",
    ctaText: "Get perks & go Pro+",
    closeButton: "×",
  },

  // App Logs Tooltip (Bottom Navigation) – per-tab copy
  appLogsTooltip: {
    skipButton: "Skip",
    /** Home-only FTUE dismiss */
    gotItButton: "Got it",
    nextButton: "Next",
    backButton: "Back",
    tabs: {
      Catalogue: {
        title: "Catalogue",
        subtitle: "Search and explore thousands of bird species",
      },
      Camera: {
        title: "Identify",
        subtitle:
          "Snap a photo, record a call, or use the step-by-step wizard to name birds in seconds.",
      },
      Collection: {
        title: "My Birds",
        subtitle:
          "Save sightings, wishlist species, and build custom trip lists.",
      },
      Feed: {
        title: "Community",
        subtitle: "See updates and posts from birders around the world.",
      },
      AskAI: {
        title: "AI Chat",
        subtitle:
          "Ask our bird expert about field marks, behavior, and look-alikes.",
      },
    },
  },

  // Version Update (Stay Updated)
  versionUpdate: {
    title: "Update Available",
    versionLabel: "Version",
    requiredUpdate: "Required Update",
    whatsNew: "What's New:",
    later: "Later",
    updateNow: "Update Now",
  },

  // Bird of the Day modal
  birdOfTheDay: {
    ribbonText: "Today's featured bird is",
    refresh: "Refresh",
    goPro: "Go Pro",
    viewDetail: "View detail",
  },
  /** @deprecated Use birdOfTheDay */
  mushroomOfTheDay: {
    ribbonText: "Today's featured bird is",
    refresh: "Refresh",
    goPro: "Go Pro",
    viewDetail: "View detail",
  },

  // Rate Us modal (popup)
  rateUsModal: {
    title: "Rate us",
    subtitle: "We'd love to hear your thoughts. Please rate us from 1–5 stars.",
    notNow: "Not Now",
    rateNow: "Rate Now",
    continue: "Continue",
  },

  // Write Feedback modal (popup)
  feedbackModal: {
    title: "Write feedback",
    subtitle: "Leaving a quick review for us to improve the app",
    namePlaceholder: "Enter your name",
    emailPlaceholder: "Enter your email",
    emailPlaceholderOptional: "Enter your email",
    feedbackPlaceholder: "Feedback",
    feedbackPlaceholderLong: "Feedback",
    feedbackMinError: "Feedback must be at least 10 characters",
    emailInvalidError: "Please enter a valid email address",
    submit: "Continue",
  },

  // Identification Feedback
  identificationFeedback: {
    confirmationTitle: "Your feedback has been sent!",
    confirmationSubtitle: "Your feedback made us better.",
    title: "Rate this match!",
    subtitle: "Your feedback makes us better.",
    messageLabel: "Message",
    messagePlaceholder: "Leave a message",
    submit: "Submit",
    sending: "Sending…",
  },

  /** Re-use common buttons from shared strings (single source of truth) */
  common: COMMON_STRINGS.buttons,
} as const;

export const FEEDBACK_MESSAGE_MAX_LENGTH = 500;
