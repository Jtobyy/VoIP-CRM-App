import { AppRegistry } from 'react-native';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
 import App from './App';
 import { name as appName } from './app.json';
 import { showLocalBanner, normalizeFCM } from './firebase/notification';
 import { incrementUnread, getUnreadCount } from './screens/shared/notifications/unread';
 import notifee from '@notifee/react-native';
import { IS_FIREBASE_CONFIGURED } from './firebase/fcm';

// Only set a handler when Firebase is configured for the current platform
if (IS_FIREBASE_CONFIGURED && Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
     console.log('firebae background message handler')
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
     try {
       await incrementUnread(1);
       const n = await getUnreadCount();
       await notifee.setBadgeCount(n);
     } catch {}
  });
}

 AppRegistry.registerComponent(appName, () => App);
