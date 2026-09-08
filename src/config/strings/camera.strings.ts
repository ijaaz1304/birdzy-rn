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
    tryAgain: "Try again",
    retakePhoto: "Re-take photo",
    goBack: "Go back",
    uploadFromGallery: "Upload from gallery",
    continue: "Continue",
    openSettings: "Open Settings",
    uploadFromGalleryInstead: "Upload from gallery instead",
    addAnotherPhoto: "Add Another Photo",
    identifyBird: "Identify Bird",
  },
  multiPhoto: {
    imageCounter: "Image {current}/{max}",
    submitPhotoToast: "Submit {count} photo",
    submitPhotosToast: "Submit {count} photos",
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
    freeScansLeftPrefix: "Free daily scans left: ",
    resetInPrefix: "Reset in ",
    maxPhotosSelected: "You can add up to 2 photos. Remove one to capture another.",
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
      "Our identification accuracy exceeds 90% with location access.",
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
    title: "Identify by Sound",
    subtitle:
      "Record a bird sound. Enable location for more accurate identification.",
    tapToRecord: "Tap below to start recording",
    recording: "Recording...",
    recordedSound: "Recorded sound",
    minLength: "Please record at least 9 seconds", // UI uses formatMinRecordingLengthMessage()
    finalizingRecording: "Processing recording…",
    finalizingAudio: "Finalizing audio…",
    startRecording: "Start recording",
    stopRecording: "Stop recording",
    pauseRecording: "Pause recording",
    resumeRecording: "Resume recording",
    identifySound: "Identify bird",
    enableLocation: "Improve results by enabling location.",
    noLocation: "No location",
    cropBody:
      "Your recording is ready. If needed, crop the recording to focus on the bird sound and improve identification accuracy.",
    crop9s: "9s",
    crop18s: "18s",
    crop27s: "27s",
    identifyBird: "Identify bird",
    analysing: "Analyzing...",
    preparingMatches: "Preparing your top matches...",
    useFullRecording: "Use full recording",
    useCroppedRecording: "Use cropped-recording",
    locationSpottedPrefix: "The location where you spotted this bird is ",
    statusListening: "Listening for birds...",
    statusSearching: "Searching for matching species...",
    statusNoise: "Too much background noise detected.",
    statusNoMatch: "No matching bird species found.",
    sampleTitle: "Samples 1",
    birdsCount: "{count} birds",
    possibleMatches: "Possible Matches ({count})",
    cantFindTitle: "Still can’t find your bird?",
    cantFindBody:
      "Let Birdzy know. The bird you’re seeing may not be in our database yet. You can save this recording to the sound library for future reference.",
    saveRecording: "Save recording",
    reportNoMatches: "Report no matches",
    reportTitle: "Report no matches",
    reportDescription:
      "Tell us about this recording so we can improve sound identification.",
    reportSent: "Thanks — we received your report.",
    addNoteTitle: "Add note",
    addNoteSubtitle:
      "Add a note to help you remember details about this recording.",
    addNotePlaceholder: "Add your note here",
    addNoteContinue: "Continue",
    noteLabel: "Note",
    savedToUnknown: "Recording saved to Unknown.",
    undo: "Undo",
    liveSuggestions: "Listening for birds...",
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
