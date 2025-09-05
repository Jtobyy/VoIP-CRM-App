/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { showLocalBanner, normalizeFCM } from './firebase/notification';
import { incrementUnread, getUnreadCount } from './screens/shared/notifications/unread';
import notifee from '@notifee/react-native';

// Called when a message arrives while app is backgrounded/killed.
// If backend sends notification+data, OS shows tray notif automatically.
// For data-only payloads, show a local banner:
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM][BACKGROUND] raw remoteMessage:', JSON.stringify(remoteMessage));
  const hasSystemNotification = !!remoteMessage?.notification;
  if (!hasSystemNotification) {
    const n = normalizeFCM(remoteMessage);
    await showLocalBanner({
      title: n.title,
      body: n.description,
      data: remoteMessage?.data || {},
    });
  }

    // Update unread & badge (regardless of system vs data-only)
  try {
    await incrementUnread(1);
    const n = await getUnreadCount();
    await notifee.setBadgeCount(n); // iOS & supported Android launchers
  } catch {}
});

AppRegistry.registerComponent(appName, () => App);
