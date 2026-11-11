import notifee from '@notifee/react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { createNotificationChannels, NOTIFICATION_CHANNEL_IDS } from './pushNotification.service';

export function registerAndroidBackgroundPush(): void {
  if (Platform.OS !== 'android') return;

  setBackgroundMessageHandler(getMessaging(), async message => {
    // Android already displays FCM notification payloads in the background.
    if (message.notification) return;
    const title = typeof message.data?.title === 'string' ? message.data.title : undefined;
    const body = typeof message.data?.body === 'string' ? message.data.body : undefined;
    if (!title?.trim() && !body?.trim()) return;

    await createNotificationChannels();
    await notifee.displayNotification({
      id: message.messageId,
      title,
      body,
      data: message.data,
      android: {
        channelId: NOTIFICATION_CHANNEL_IDS.DEFAULT,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  });
}
