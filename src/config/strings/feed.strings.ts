/**
 * Feed Strings
 */

export const FEED_STRINGS = {
  screen: {
    title: "Feed",
    createPost: "Create Post",
  },
  tabs: {
    all: "All",
    mine: "My Posts",
  },
  emptyStates: {
    noPosts: {
      title: "No posts available",
      subtitle: "Be the first to share a post!",
    },
    noMyPosts: {
      title: "You don't have any post.",
      subtitle: "Start sharing your plant journey with the community!",
    },
  },
  createPost: {
    titlePlaceholder: "Add Title (Optional)",
    contentPlaceholder: "Write your post content here...",
    imagePlaceholder: "Tap to add photo",
    imageSelected: "Image selected",
    crop: "Crop",
    post: "Post",
  },
  actions: {
    like: "Like",
    comment: "Comment",
    share: "Share",
  },
} as const;
