# Feed Feature - Dynamic & Reusable

This feed feature is designed to be **completely dynamic and reusable**. All text content, images, and configurations come from external configuration files.

## Architecture

### Configuration System

All app-specific content is defined in configuration files:

```
src/features/feed/config/
├── feedConfig.types.ts    # TypeScript interfaces
├── plantsConfig.ts        # Plants app configuration
└── index.ts              # Exports
```

### Common Styles

All shared styles are extracted to:

```
src/features/feed/styles/
└── commonStyles.ts       # Reusable StyleSheet
```

### Components

All components accept `config` prop for dynamic content:

- `FeedScreen` - Main feed screen
- `CreatePostScreen` - Create post screen
- `CommunityRulesModal` - Community rules modal

## Usage Examples

### Plants App

```tsx
import { FeedScreen } from "./screens/FeedScreen";
import { plantsFeedConfig } from "./config";
// Mock posts - replace with API data when available
const MOCK_POSTS: any[] = [];

<FeedScreen
  config={plantsFeedConfig}
  posts={MOCK_POSTS}
  onPostPress={(postId) => navigation.navigate("PostDetails", { postId })}
/>;
```

### Create Post Screen

```tsx
import { CreatePostScreen } from "./screens/CreatePostScreen";
import { plantsFeedConfig } from "./config";

<CreatePostScreen
  config={plantsFeedConfig}
  userName="Alex Pham"
  onPost={(postData) => {
    // Handle post creation
    console.log(postData);
  }}
/>;
```

### Community Rules Modal

```tsx
import { CommunityRulesModal } from "./components/CommunityRulesModal";
import { plantsFeedConfig } from "./config";

<CommunityRulesModal
  visible={showRules}
  config={plantsFeedConfig}
  onAgree={() => setShowRules(false)}
  onClose={() => setShowRules(false)}
/>;
```

## Creating a New App Configuration

1. Create a new config file (e.g., `petsConfig.ts`):

```tsx
import { FeedConfig } from "./feedConfig.types";

export const petsFeedConfig: FeedConfig = {
  screenTitle: "Pet Feed",
  createPostTitle: "Create post",
  tabs: {
    all: "All",
    mine: "My posts",
  },
  emptyStates: {
    noPosts: {
      title: "No posts available",
      subtitle: "Be the first to share your pet!",
    },
    noMyPosts: {
      title: "You haven't posted anything yet",
      subtitle: "Start sharing your pet journey!",
    },
  },
  createPost: {
    titlePlaceholder: "Add Title (Optional)",
    contentPlaceholder: "Write about your pet...",
    helperText: (userName) => `What would you like to share, ${userName}?`,
    imagePlaceholder: "Tap to add photo",
    imageSelectedText: "Image selected",
    cropButtonText: "Crop",
    postButtonText: "Post",
  },
  postCard: {
    itemNameLabel: "Pet Name",
    actions: {
      like: "Like",
      comment: "Comment",
      share: "Share",
    },
  },
  communityRules: {
    title: "Community Rules",
    lastUpdated: "21/8/2025",
    agreeButtonText: "I agree",
    rules: [
      {
        title: "Be Respectful",
        text: "Be kind to all pets and pet owners.",
      },
      // ... more rules
    ],
  },
};
```

2. Export it from `config/index.ts`:

```tsx
export { petsFeedConfig } from "./petsConfig";
```

3. Use it in your app:

```tsx
<FeedScreen config={petsFeedConfig} posts={petPosts} />
```

## Data Structure

The `Post` interface is generic and works for any app type:

```tsx
interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  itemName?: string; // Generic: plantName, etc.
  title?: string;
  content?: string;
  image?: string;
  caption?: string;
  likes: number;
  comments: number;
  shares?: number;
  timestamp: string;
  isMyPost: boolean;
}
```

## Benefits

✅ **Reusable** - Works for any app type (plants, etc.)
✅ **Maintainable** - All content in one place (config files)
✅ **Type-safe** - Full TypeScript support
✅ **Consistent** - Shared styles ensure UI consistency
✅ **Flexible** - Easy to customize for different apps
✅ **Testable** - Easy to test with different configurations
