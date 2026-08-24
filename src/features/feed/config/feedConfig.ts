/**
 * Birdzy feed configuration
 */

import { FeedConfig } from "./feedConfig.types";
import COMMUNITY_RULES_DATA from "../../../data/communityRules.json";

/** Figma: D/M/YYYY (e.g. 21/8/2025) — parse ISO date without timezone shift. */
function formatCommunityRulesUpdatedDate(isoDate: string): string {
  const parts = isoDate.trim().split("-");
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }
  return isoDate;
}

export const birdsFeedConfig: FeedConfig = {
  screenTitle: "Feed",
  createPostTitle: "Create post",

  tabs: {
    all: "All",
    mine: "My posts",
  },

  emptyStates: {
    noPosts: {
      title: "No posts available",
      subtitle: "Be the first to share a post!",
    },
    noMyPosts: {
      title: "You don't have any post.",
      subtitle: "Start sharing your bird sightings with the community!",
    },
  },

  createPost: {
    titlePlaceholder: "Add Title (Optional)",
    contentPlaceholder: "Write your post content here...",
    helperText: (userName: string) =>
      `What would you like to highlight, ${userName}?`,
    imagePlaceholder: "Tap to add photo",
    imageSelectedText: "Image selected",
    cropButtonText: "Crop",
    postButtonText: "Post",
  },

  postCard: {
    itemNameLabel: "Mushroom Name",
    actions: {
      like: "Like",
      comment: "Comment",
      share: "Share",
    },
  },

  communityRules: {
    title: COMMUNITY_RULES_DATA.title,
    lastUpdated: formatCommunityRulesUpdatedDate(COMMUNITY_RULES_DATA.updatedOn),
    intro: COMMUNITY_RULES_DATA.intro,
    agreeButtonText: COMMUNITY_RULES_DATA.cta.label,
    footerNote: COMMUNITY_RULES_DATA.footerNote,
    rules: COMMUNITY_RULES_DATA.rules.map((rule: any) => ({
      title: rule.title,
      text: rule.description,
    })),
  },
};
