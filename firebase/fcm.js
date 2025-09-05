import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Flip these to true on each platform once configs are added
export const IS_FIREBASE_CONFIGURED =
  Platform.OS === 'android' ? true : false;

async function requestAndroid13Permission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const res = await PermissionsAndroid.request(
      'android.permission.POST_NOTIFICATIONS'
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

async function requestNotificationPermission() {
  const status = await messaging().requestPermission();
  const enabled =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function initFcm() {
  await requestAndroid13Permission();
  await requestNotificationPermission();

  if (!IS_FIREBASE_CONFIGURED) {
    console.log('[FCM] Not configured yet – skipping listeners.');
    return () => {};
  }

  await messaging().registerDeviceForRemoteMessages();

  // Keep token updated in background
  const unsub = messaging().onTokenRefresh((newToken) => {
    console.log('[FCM] token refreshed:', newToken);
    // You can call your backend update here if user is logged in
  });

  return unsub;
}

export async function getCurrentFcmToken() {
  if (!IS_FIREBASE_CONFIGURED) {
    console.log('[FCM] Not configured – no token yet.');
    return null;
  }
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }
  return messaging().getToken();
}
