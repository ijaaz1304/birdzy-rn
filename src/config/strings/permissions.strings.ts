/**
 * Permissions Strings
 */

export const PERMISSIONS_STRINGS = {
  camera: {
    title: "Camera Permission Required",
    message:
      "We need access to your camera to identify birds and capture sighting photos.",
    buttonLabel: "Grant Camera Access",
    benefits: [
      "Identify birds by photo instantly",
      "Save photos to your life list",
      "Share sightings with the community",
    ],
  },
  location: {
    title: "Location Permission Required",
    message:
      "We use your location to improve identification accuracy and show birds likely near you.",
    buttonLabel: "Grant Location Access",
    benefits: [
      "Better regional species matches",
      "Nearby bird discovery",
      "Location tags on your sightings",
    ],
  },
  notifications: {
    title: "Notification Permission Required",
    message:
      "We need permission to send bird-of-the-day alerts, migration tips, and community updates.",
    buttonLabel: "Enable Notifications",
    benefits: [
      "Bird of the Day reminders",
      "Community likes and comments",
      "Migration season alerts",
    ],
  },
  storage: {
    title: "Storage Permission Required",
    message:
      "We need access to your photo library to pick bird photos and save sighting images.",
    buttonLabel: "Grant Storage Access",
    benefits: [
      "Choose photos from your gallery",
      "Share with the community",
      "Back up your sightings",
    ],
  },
} as const;
