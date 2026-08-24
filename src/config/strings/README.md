# Centralized Strings Management System

A flexible, reusable, and type-safe string management system for the entire application.

## Structure

The strings system is organized into modular files by feature:

```
src/config/strings/
├── index.ts                    # Main export combining all modules
├── utils.ts                    # Helper functions (formatString, pluralize, etc.)
├── common.strings.ts           # Shared strings (buttons, labels, placeholders)
├── waterCalculator.strings.ts  # Water calculator strings
├── potSizeCalculator.strings.ts # Pot size calculator strings
├── collection.strings.ts       # Collection feature strings
├── subscription.strings.ts     # Subscription strings
├── settings.strings.ts         # Settings strings
├── catalogue.strings.ts        # Catalogue strings
├── auth.strings.ts             # Authentication strings
├── feed.strings.ts             # Feed/Community strings
├── camera.strings.ts           # Camera/Identification strings
├── guides.strings.ts           # Guides strings
├── home.strings.ts             # Home screen strings
└── reminders.strings.ts        # Reminders strings
```

## Usage

### Basic Usage with Hook

```typescript
import { useStrings } from "../../../hooks/useStrings";

const MyComponent = () => {
  const strings = useStrings();

  return <Text>{strings.waterCalculator.screen.title}</Text>;
};
```

### Feature-Specific Strings

```typescript
import { useFeatureStrings } from "../../../hooks/useStrings";

const WaterCalculator = () => {
  const waterStrings = useFeatureStrings("waterCalculator");

  return <Text>{waterStrings.screen.title}</Text>;
};
```

### Common Strings

```typescript
import { useCommonStrings } from "../../../hooks/useStrings";

const MyComponent = () => {
  const common = useCommonStrings();

  return <Button title={common.buttons.save} />;
};
```

### Formatting Strings with Placeholders

```typescript
const strings = useStrings();

// Template: "Your {plantName} needs"
const message = strings.format(strings.waterCalculator.result.needs, {
  plantName: "Pancake plant",
});
// Result: "Your Pancake plant needs"
```

### Utility Functions

```typescript
const strings = useStrings();

// Pluralize
const itemText = strings.pluralize("item", "items", count);
// count === 1 ? 'item' : 'items'

// Capitalize
const capitalized = strings.capitalize("hello");
// 'Hello'
```

## Benefits

1. **Type Safety**:\*\* Full TypeScript support with autocomplete
2. **Modular**:\*\* Organized by feature for easy maintenance
3. **Reusable**:\*\* Shared strings in `common.strings.ts`
4. **Flexible**:\*\* Easy to extend with new features
5. **i18n Ready**:\*\* Structure supports future internationalization
6. **Consistent**:\*\* Single source of truth for all text

## Adding New Strings

1. **For a new feature**: Create `featureName.strings.ts` in `src/config/strings/`
2. **Export from the file**: `export const FEATURE_STRINGS = { ... } as const;`
3. **Import in index.ts**: Add import and add to `APP_STRINGS` object
4. **Use in components**: Import and use `useStrings()` hook

## Example: Adding a New Feature

```typescript
// src/config/strings/newFeature.strings.ts
export const NEW_FEATURE_STRINGS = {
  screen: {
    title: "New Feature",
  },
  buttons: {
    action: "Do Action",
  },
} as const;

// src/config/strings/index.ts
import { NEW_FEATURE_STRINGS } from "./newFeature.strings";

export const APP_STRINGS = {
  // ... existing
  newFeature: NEW_FEATURE_STRINGS,
} as const;
```

## Best Practices

1. **Use the hook**: Always use `useStrings()` instead of direct imports
2. **Feature-specific**: Use `useFeatureStrings()` when only one feature is needed
3. **Common strings**: Use `useCommonStrings()` for shared buttons/labels
4. **Formatting**: Use `strings.format()` for dynamic content
5. **Consistency**: Follow the existing structure when adding new strings
6. **Avoid duplication**: For shared messages (e.g. "Something went wrong", "Connection is taking too long", "Cancel", "Skip"), put them in `common.strings.ts` (COMMON_STRINGS.messages or COMMON_STRINGS.buttons) and reference from feature strings or use directly in code. Do not duplicate the same text in auth, onboarding, modals, etc.
