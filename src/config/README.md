# App Configuration System

This directory contains the dynamic configuration system that makes the entire app reusable across different app types (plants, insects, coins, etc.).

## Overview

The configuration system allows you to:

- **Externalize all text content** - No hardcoded strings in components
- **Make images/assets configurable** - Swap assets per app type
- **Reuse the same codebase** - One codebase for multiple app types
- **Maintain consistency** - Common styles and patterns

## Structure

```
src/config/
├── types.ts              # TypeScript types for all configurations
├── context.tsx          # React context and hooks for accessing config
├── index.ts             # Main exports and helper functions
├── constants.ts         # Constants helper hook
├── plants.config.ts     # Plants app configuration
└── README.md            # This file
```

## Usage

### 1. Setting up the App

Wrap your app with `AppConfigProvider` in `App.tsx`:

```tsx
import { AppConfigProvider, getDefaultAppConfig } from "./src/config";

const appConfig = getDefaultAppConfig(); // Uses plants config by default

function App() {
  return (
    <AppConfigProvider config={appConfig}>
      {/* Your app components */}
    </AppConfigProvider>
  );
}
```

### 2. Using Config in Components

#### Using the hook:

```tsx
import { useFeatureConfig, useAppConfig } from "../../config/context";

function MyComponent() {
  const homeConfig = useFeatureConfig("home");
  const authConfig = useFeatureConfig("auth");
  const fullConfig = useAppConfig();

  return <Text>{homeConfig.header.greeting("User")}</Text>;
}
```

#### Using assets:

```tsx
import { useFeatureConfig } from "../../config/context";

function MyComponent() {
  const assets = useFeatureConfig("assets");

  return <Image source={assets.images.placeholder} />;
}
```

### 3. Creating a New App Type

1. Create a new config file (e.g., `insects.config.ts`):

```tsx
import { AppConfig } from "./types";
import { plantsAppConfig } from "./plants.config";

export const insectsAppConfig: AppConfig = {
  ...plantsAppConfig, // Start with base config
  appType: "insects",
  appName: "TrackzioInsects",
  home: {
    ...plantsAppConfig.home,
    header: {
      greeting: (name) => `Hello, ${name}!`,
      searchPlaceholder: "Search insects...",
    },
    // Override other sections as needed
  },
  // ... customize other features
};
```

2. Add it to `index.ts`:

```tsx
export { insectsAppConfig } from "./insects.config";

const configMap: Record<string, AppConfig> = {
  plants: plantsAppConfig,
  insects: insectsAppConfig, // Add here
};
```

3. Use it in `App.tsx`:

```tsx
const appConfig = getAppConfig("insects");
```

## Configuration Structure

Each app config contains:

- **appType**: Unique identifier for the app type
- **appName**: Display name
- **packageName**: Package identifier
- **home**: Home screen configuration
- **catalogue**: Catalogue/listing screen configuration
- **auth**: Authentication screens configuration
- **camera**: Camera/identification configuration
- **collection**: Collection screens configuration
- **feed**: Feed/community configuration
- **settings**: Settings screen configuration
- **onboarding**: Onboarding flow configuration
- **assets**: Images and icons
- **apiEndpoints**: API endpoint overrides
- **constants**: App-specific constants

## Best Practices

1. **Always use config hooks** - Don't hardcode text or images
2. **Provide fallbacks** - Use default values when config is optional
3. **Type safety** - Use TypeScript types from `types.ts`
4. **Reuse base configs** - Start with an existing config and override
5. **Keep configs organized** - Group related configurations together

## Common Styles

Common styles are available in `src/styles/common/`:

- `screenStyles` - Screen layout styles
- `layoutStyles` - Layout helpers (row, column, flex, etc.)
- `cardStyles` - Card component styles
- `formStyles` - Form component styles

Use these instead of creating duplicate styles:

```tsx
import { screenStyles, layoutStyles } from "../../styles/common";

<View style={screenStyles.header}>
  <View style={layoutStyles.rowBetween}>{/* Content */}</View>
</View>;
```

## Migration Guide

To migrate existing components:

1. **Identify hardcoded strings** - Find all text that should be configurable
2. **Add to config** - Add the strings to the appropriate config section
3. **Update component** - Replace hardcoded strings with config values
4. **Test** - Verify the component works with different configs

Example:

```tsx
// Before
<Text>Hello, User!</Text>;

// After
const homeConfig = useFeatureConfig("home");
<Text>{homeConfig.header.greeting("User")}</Text>;
```

## Environment-Based Configuration

You can switch configs based on environment:

```tsx
// App.tsx
const getConfigForEnvironment = () => {
  if (__DEV__) {
    return getAppConfig("plants");
  }

  // Production: could come from remote config, build config, etc.
  const appType = process.env.APP_TYPE || "plants";
  return getAppConfig(appType);
};

const appConfig = getConfigForEnvironment();
```

## Extending Configuration

To add new configuration sections:

1. **Add types** in `types.ts`:

```tsx
export interface NewFeatureConfig {
  title: string;
  // ... other fields
}

export interface AppConfig {
  // ... existing
  newFeature: NewFeatureConfig;
}
```

2. **Add to configs** in each app config file
3. **Use in components** with `useFeatureConfig('newFeature')`
