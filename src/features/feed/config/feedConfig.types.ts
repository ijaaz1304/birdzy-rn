/**
 * Feed Configuration Types
 * Generic types that work for any app (plants, etc.)
 */

export interface FeedConfig {
  // Screen titles
  screenTitle: string;
  createPostTitle: string;

  // Tab labels
  tabs: {
    all: string;
    mine: string;
  };

  // Empty states
  emptyStates: {
    noPosts: {
      title: string;
      subtitle: string;
    };
    noMyPosts: {
      title: string;
      subtitle: string;
    };
  };

  // Create post screen
  createPost: {
    titlePlaceholder: string;
    contentPlaceholder: string;
    helperText: (userName: string) => string;
    imagePlaceholder: string;
    imageSelectedText: string;
    cropButtonText: string;
    postButtonText: string;
  };

  // Post card
  postCard: {
    itemNameLabel?: string; // e.g., "Plant Name", "Insect Species", etc.
    actions: {
      like: string;
      comment: string;
      share: string;
    };
  };

  // Community rules
  communityRules: {
    title: string;
    lastUpdated: string;
    intro: string;
    agreeButtonText: string;
    footerNote?: string;
    rules: Array<{
      title: string;
      text: string;
    }>;
  };

  // Images/icons (optional - can be overridden)
  images?: {
    placeholderImage?: any; // require() or ImageSourcePropType
    defaultAvatar?: any;
  };
}
