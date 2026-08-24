/**
 * Camera/Identification Strings
 */

export const CAMERA_STRINGS = {
  screen: {
    title: "Camera",
    identify: "Identify",
    diagnosis: "Diagnosis",
    cameraAccessTitle: "Improve Identification With Camera",
    cameraAccessMessage:
      "To identify birds around you, we need access to your camera.",
  },
  buttons: {
    takePhoto: "Take Photo",
    chooseFromGallery: "Choose from Gallery",
    startSearching: "Start searching",
    cancel: "Cancel",
    identify: "Identify",
    diagnose: "Diagnose",
    chatWithAI: "Chat with AI",
    retakePhoto: "Re-take photo",
    goBack: "Go back",
    uploadFromGallery: "Upload from gallery",
    continue: "Continue",
    openSettings: "Open Settings",
    uploadFromGalleryInstead: "Upload from gallery instead",
  },
  galleryAccess: {
    title: "Choose Photos From Your Gallery",
    subtitle:
      "Select photos from your library to identify birds or share with the community.",
    continue: "Continue",
    openSettings: "Open Settings",
  },
  status: {
    identifying: "Identifying...",
    diagnosing: "Analyzing...",
    processing: "Processing...",
  },
  results: {
    identified: "Identified",
    possibleMatches: "Other Possible Matches",
    possibleMatchesHeading: "Possible Matches",
    diagnosis: "Best Match",
  },
  limits: {
    dailyLimitReached: "Daily limit reached",
    dailyLimitSubtitle:
      "You've used your {count} free identifications today. Upgrade to Premium for unlimited scans.",
  },
  editResult: {
    title: "Edit Information",
    commonName: "Common Name",
    scientificName: "Scientific Name",
    description: "Description",
    commonNamePlaceholder: "Enter common name",
    scientificNamePlaceholder: "Enter scientific name",
    descriptionPlaceholder: "Enter description",
  },
  feedback: {
    title: "How accurate was this identification?",
    subtitle: "Help us improve by rating the identification for {birdName}",
    correct: "Correct",
    partiallyCorrect: "Partially Correct",
    incorrect: "Incorrect",
  },
  error: {
    title: "We couldn't identify the bird from your input",
    message:
      "Don't worry — you can still get help. Try describing the bird in our chat, and our AI will guide you with possible matches.",
    hint: "Make sure the photo is well-lit and shows the bird clearly.",
    retry: "Try Again",
    generic: "Error",
    failedToCaptureImage: "Failed to capture image. Please try again.",
  },
  location: {
    turnOnPrompt: "Not accurate? Turn on location.",
    foundAtPrefix: "The location where you spotted the bird is ",
    detectingLocation: "Detecting your location…",
    setLocationFallback: "Tap to set your location",
  },
  galleryLocationAccess: {
    title: "Enable Location Access",
    subtitle:
      "Our identification accuracy improves with location access for regional species.",
    continue: "Continue",
    openSettings: "Open Settings",
  },
  tips: {
    title: "The following will lead to poor results",
    understood: "I understood",
    dontShowAgain: "Don't show again",
    statuses: {
      tooDark: "Too Dark",
      tooFar: "Too Far",
      tooBright: "Too Bright",
      blurry: "Blurry",
    },
    list: [
      "Take photos in good lighting",
      "Focus on the bird's head and body",
      "Include field marks when possible",
      "Make sure the bird fills most of the frame",
      "Avoid blurry or heavily backlit shots",
    ],
  },
  sound: {
    title: "Identify by sound",
    subtitle: "Record a clear bird call for up to 30 seconds.",
    tapToRecord: "Tap below to start recording",
    recording: "Recording…",
    startRecording: "Start recording",
    stopRecording: "Stop recording",
    identifySound: "Identify sound",
    liveSuggestions: "Listening…",
    liveSuggestionsHint: "Possible matches may appear while you record",
    errors: {
      noBird: {
        title: "No bird detected",
        message:
          "We couldn't pick up a clear bird call. Try moving closer or recording again in a quieter spot.",
        retry: "Record again",
        dismiss: "Close",
      },
      noise: {
        title: "Background noise too high",
        message:
          "There's a lot of ambient noise. Find a quieter area and hold the phone steady while the bird is calling.",
        retry: "Try again",
        dismiss: "Close",
      },
    },
  },
} as const;
