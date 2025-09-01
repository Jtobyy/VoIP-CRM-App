/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { showLocalBanner, normalizeFCM } from './firebase/notification';

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
});

AppRegistry.registerComponent(appName, () => App);
