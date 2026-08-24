# Local Push Notifications Service

This service handles scheduling and managing local push notifications for plant care reminders.

## Setup

### Installation

The `@notifee/react-native` package is already installed. After installation, run:

```bash
# iOS
cd ios && pod install && cd ..

# Android - No additional setup needed
```

### iOS Setup

The pod is already configured in `ios/Podfile`. After running `pod install`, ensure notification permissions are set in `Info.plist` (already configured).

### Android Setup

No additional setup required. The service uses the notification channel created automatically.

## Usage

### Schedule a Reminder Notification

```typescript
import { scheduleReminderNotification } from "@/services/notifications";

const notificationId = await scheduleReminderNotification({
  id: "reminder_123",
  plantId: "plant_1",
  plantName: "Monstera",
  reminderType: "watering",
  scheduledTime: new Date("2025-01-08T09:00:00"),
  repeat: "everyday", // optional
  waterAmount: "1.5", // optional (for watering)
  waterUnit: "l", // optional (for watering)
});
```

### Cancel a Notification

```typescript
import { cancelReminderNotification } from "@/services/notifications";

await cancelReminderNotification("reminder_123");
```

### Notification Tap Handling

When a user taps a notification, the app automatically navigates to the Collection screen with the reminders tab open. This is handled in `RootNavigator.tsx`.

## Reminder Types

- `'watering'` - Watering reminder
- `'misting'` - Misting reminder
- `'fertilizing'` - Fertilizing reminder
- `'rotating'` - Rotating reminder

## Repeat Options

- `'everyday'` - Every day
- `'every2days'` - Every 2 days
- `'every2weeks'` - Every 2 weeks
- `'everymonth'` - Every month

## Integration

The notification service is automatically initialized when the app starts (in `App.tsx`). Reminders are scheduled when users save a reminder in `SetReminderScreen`.
