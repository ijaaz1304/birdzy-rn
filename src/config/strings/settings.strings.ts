/**
 * Settings Strings
 */

export const SETTINGS_STRINGS = {
  screen: {
    title: "Settings",
  },
  sections: {
    account: "Account",
    premium: "Premium",
    preferences: "Preferences",
    about: "About",
    support: "Support",
    diagnostics: "Diagnostics",
    more: "More",
    upgradeModalsDev: "Upgrade modals (dev)",
    subscriptionFrequency: "Subscription Frequency",
    rateUs: "Rate Us",
  },
  items: {
    profile: "Profile Settings",
    subscription: "Subscription",
    manageSubscription: "Manage Subscription",
    notifications: "Notifications",
    notificationSettings: "Notification settings",
    reminders: "Reminders",
    privacy: "Privacy",
    terms: "Terms of Service",
    rateUs: "Rate Us",
    appLogs: "App Logs",
    viewAppLogsSubtitle: "Browse, copy, or email captured logs",
    recordDiagnosticLogs: "Record diagnostic logs",
    recordDiagnosticLogsSubtitle:
      "Captures in-app logs (auth, IAP, subscription, and other flows). On by default in dev.",
    cameraUploadLogs: "Camera & upload logs",
    cameraUploadLogsSubtitle:
      "Logs capture, cropper, gallery export, and identify submit steps ([IdentifyFlow]).",
    faq: "FAQ",
    feedback: "Feedback",
    termsOfUse: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    usePremium: "Use premium",
    disable50Discount: "Disable 50% discount",
    disable50DiscountSubtitle: "Show full-price plans for IAP testing",
    upgradeModalsPreview: "Upgrade modals preview",
    upgradeModalsPreviewSubtitle: "Open each limit-reached / upgrade sheet",
    subscriptionDiscountSheet: "Subscription discount sheet",
  },
  premium: {
    card: {
      title: "Premium Plan",
      activeBadge: "Active",
      description:
        "You are currently subscribed to a premium plan. Manage your subscription settings.",
      manageButton: "Manage",
    },
  },
  account: {
    myProfile: "My Profile",
    emailAndPassword: "Email & Password",
    logOut: "Log out",
    deleteAccount: "Delete account",
    loginPrompt:
      "Sign in to sync your data across devices and access premium features.",
    loginButton: "Sign In",
    logOutConfirmTitle: "Log out?",
    logOutConfirmMessage: "Are you sure you want to log out?",
    logOutConfirmYes: "Yes",
    logOutConfirmNoThanks: "No, Thanks",
    loginText: "Login",
  },
  profile: {
    title: "My Profile",
    name: "Name",
    email: "Email",
    bio: "Bio",
    bioEmpty: "Not set",
  },
  preferencesLanguage: "Language",
  preferencesLanguageValue: "English (UK)",
  deleteAccount: {
    title: "Delete Account?",
    description:
      "All your data will be lost and you will not be able to recover it. Are you sure you want to proceed?",
    yes: "Yes",
    no: "No",
  },
  preferences: {
    notifications: "Notifications",
    notificationSettings: "Notification settings",
    appearance: "Appearance",
    appearanceLight: "Light theme",
    appearanceDark: "Dark theme",
    appearanceSystem: "Use System theme",
    darkMode: "Dark Mode",
    location: "Location",
    birdRegion: "Birding region",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Choose which birding alerts and community updates you receive.",
    push: "Push notifications",
    birdOfDay: "Bird of the day",
    birdOfDayHint: "Daily featured species near you",
    migrationAlerts: "Migration alerts",
    migrationHint: "Seasonal movement for species in your area",
    communityReplies: "Community replies",
    identificationTips: "ID tips & tricks",
    weeklyDigest: "Weekly digest",
  },
  birdRegion: {
    title: "Birding region",
    subtitle:
      "Used for Near You lists, migration alerts, and step-by-step suggestions.",
  },
  appearance: {
    title: "Appearance",
  },
} as const;
