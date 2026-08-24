/**
 * Feed post types and empty list.
 * Posts are loaded from the API (feedService); no mock data.
 */

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  itemName?: string;
  title?: string;
  content: string;
  caption?: string;
  /** Display image URL (from feed.service: imageUrl or imageUrls[0]) */
  image?: string;
  imageUrl?: string;
  imageUrls?: string[];
  likes: number;
  comments: number;
  shares?: number;
  timestamp?: string;
  isMyPost?: boolean;
  isLiked?: boolean;
}

/** Empty list – use feedService to load posts. */
export const EMPTY_POSTS: Post[] = [];
