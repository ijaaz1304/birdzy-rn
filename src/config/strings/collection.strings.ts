/**
 * Collection Strings
 */

export const COLLECTION_STRINGS = {
  screens: {
    myBirds: "My Birds",
    wishlist: "Wishlist",
    collections: "Collections",
    createCollection: "Create Collection",
    editBird: "Edit Bird Details",
  },
  emptyStates: {
    noBirds: {
      title: "No birds yet",
      subtitle: "Start adding birds to your life list",
    },
    noCollections: {
      title: "No collections yet",
      subtitle: "Create your first collection to organize your sightings",
    },
    noWishlist: {
      title: "Your wishlist is empty",
      subtitle: "Save birds you'd like to spot in the wild",
    },
    emptyCollection: {
      title: "No birds yet",
      message: "You don't have birds in this collection.",
      addBird: "Add a bird",
      noSearchResults: "No birds match your search or filters",
    },
  },
  legacyDetailSections: {
    tabs: {
      overview: "Overview",
      physical: "Physical",
      chemical: "Chemical",
      metaphysical: "Metaphysical",
    },
    sections: {
      description: "Description",
      scientificClassification: "Scientific Classification",
      location: "Location",
      physicalProperties: "Physical Properties",
      chemicalProperties: "Chemical Properties",
      metaphysicalProperties: "Metaphysical Properties",
      mohsHardness: "Mohs Hardness",
      crystalSystem: "Crystal System",
      color: "Color",
      luster: "Luster",
      transparency: "Transparency",
      streak: "Streak",
      density: "Density",
      formula: "Chemical Formula",
      elements: "Elements",
      chakra: "Chakra",
      metaphysicalQualities: "Metaphysical Qualities",
    },
    topMatches: {
      title: "Top Matches",
      subtitle: "Swipe to see other possible matches",
    },
    health: {
      title: "Observation quality",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      critical: "Critical",
      unknown: "Unknown",
    },
    attributes: {
      title: "Bird characteristics",
      hardness: "Hardness",
      rarity: "Rarity",
      gemQuality: "Gem Quality",
      collectible: "Collectible",
      metaphysical: "Metaphysical",
    },
    location: {
      title: "Custom Location",
      noLocation: "No location set",
      addLocation: "Add Location",
      placeholder: "Enter location address",
    },
    actions: {
      calculate: "Calculate",
      seeMoreDetails: "See more details",
      share: "Share",
      you: "You",
    },
  },
  buttons: {
    addMineral: "Add Bird",
    createCollection: "Create",
    editCollection: "Edit Collection",
    renameCollection: "Rename collection",
    deleteCollection: "Delete Collection",
  },
  renameCollection: {
    title: "Rename collection",
    subtitle: "Update the name of your collection.",
    saveFailed: "Failed to rename collection. Please try again.",
    duplicateName: "This collection name has been used.",
  },
  addToAnotherCollection: {
    title: "Add to another collection",
    subtitle: "Select a collection you want to add to",
    createNew: "Add New",
    added: "Added to collection",
    addFailed: "Failed to add to collection",
  },
  moveToCollection: {
    title: "Move to collection",
    subtitle: "Select a collection you want to move to",
    createNew: "Add New",
    moved: "Moved to collection",
    moveFailed: "Failed to move to collection",
    noSpecimen: "Could not find this bird in your collection.",
  },
  forms: {
    collectionName: {
      label: "Collection name",
      placeholder: "Enter collection name",
      required: "Collection name is required",
      duplicate: "This collection name has been used.",
    },
    addNewMineral: {
      title: "Add new bird",
      subtitle:
        "Add a new sighting to your collection and start tracking your discoveries.",
      identifyByPhoto: "Identify by photo",
      searchByName: "Search by name",
    },
    createCollection: {
      title: "Create New Collection",
      subtitle:
        "Give your bird collection a name and start curating your favorite species!",
    },
  },
  errors: {
    notAuthenticated: "User not authenticated",
    createFailed: "Failed to create collection. Please try again.",
  },
  addToCollection: {
    title: "Select a collection",
    subtitle: "Select a collection you want to add to",
    minerals: "birds",
    createNew: "Add New",
    limitReached:
      "You have reached the maximum of 100 birds in your collection. Remove an item or upgrade to add more.",
    collectionFull:
      "This collection is full. Choose another collection or remove an item.",
    full: "Full",
  },
  favorite: {
    added: "Added to wishlist",
    removed: "Removed from wishlist",
    addFailed: "Failed to add to wishlist",
    removeFailed: "Failed to remove from wishlist",
  },
  delete: {
    title: "Delete sighting",
    message:
      "Are you sure you want to delete this bird from your collection?",
    confirm: "Delete",
  },
  deleteCollection: {
    title: "Are you sure want to delete your collection?",
    message: "Are you sure want to delete your collection?",
    yesDelete: "Yes, Delete",
    noThanks: "No, Thanks",
  },
  edit: {
    title: "Edit bird details",
    confirm: "Changes saved successfully",
  },
  birdDetails: {
    sections: {
      sounds: "Sounds",
      range: "Range & Seasonality",
      identification: "Identification",
      habitat: "Habitat & Diet",
      similarBirds: "Similar birds",
    },
    sounds: {
      callPrefix: "Call",
      tapToPlay: "Tap to play",
      playing: "Playing…",
      recordCta: "Record this bird's call",
      recordHint: "Open sound ID to capture and compare calls",
    },
    geoRange: {
      placeholder: "Regional range overview — seasonality bars below show monthly presence",
      breeding: "Breeding",
      nonBreeding: "Non-breeding",
      yearRound: "Year-round",
      migration: "Migration",
    },
    range: {
      yearRound: "Year-round",
      breeding: "Breeding",
      migration: "Migration",
      nonBreeding: "Non-breeding",
    },
    traits: {
      length: "Length",
      wingspan: "Wingspan",
      weight: "Weight",
      colors: "Colors",
      flightPattern: "Flight pattern",
      flightAltitude: "Flight altitude",
      keyMarks: "Key ID marks",
      birdType: "Bird type",
      conservation: "Conservation status",
      bestTime: "Best time to watch",
      preferredLocations: "Preferred locations",
      behavioralCues: "Behavioral cues",
    },
    habitat: {
      habitat: "Habitat",
      diet: "Diet",
      distribution: "Distribution",
    },
  },
  // Reminders removed - not needed for rocks/minerals app
} as const;
