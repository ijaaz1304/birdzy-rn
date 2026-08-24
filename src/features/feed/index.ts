/**
 * Feed Feature Exports
 * Central export point for all feed components and configs
 */

// Screens
export { FeedScreen } from "./screens/FeedScreen";
export type { FeedScreenProps } from "./screens/FeedScreen";

export { CreatePostScreen } from "./screens/CreatePostScreen";
export type { CreatePostScreenProps } from "./screens/CreatePostScreen";

// Components
export { CommunityRulesModal } from "./components/CommunityRulesModal";
export type { CommunityRulesModalProps } from "./components/CommunityRulesModal";

// Configurations
export { birdsFeedConfig, mushroomsFeedConfig } from "./config";
export type { FeedConfig } from "./config";

// Data types
export type { Post } from "../../data/feed/postTypes";
