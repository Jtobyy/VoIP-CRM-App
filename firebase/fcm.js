// firebase/fcm.js
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

export const IS_FIREBASE_CONFIGURED =
  Platform.OS === 'android' ? true : false; // keep your flag

const PROMPTED_KEY = 'notif_prompted_v1';

async function hasAndroid13NotifPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;
  try {
    return await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS');
  } catch {
    return false;
  }
}

/**
 * Initialize FCM.
 * @param {{ prompt?: boolean }} opts
 *  - prompt=false: NEVER show a system dialog; just set up if already granted.
 *  - prompt=true: If not granted, show the system dialog ONCE this session.
 */
export async function initFcm({ prompt = false } = {}) {
  if (!IS_FIREBASE_CONFIGURED) {
    console.log('[FCM] Not configured – skipping init.');
    return () => {};
  }

  // ANDROID
  if (Platform.OS === 'android') {
    // Android 13+ runtime notification permission
    const hasPerm = await hasAndroid13NotifPermission();

    if (!hasPerm) {
      if (!prompt) {
        // Silent no-op when we’re not allowed to prompt right now
        console.log('[FCM] No notif permission (Android 13+); skipping init.');
        return () => {};
      }

      // Only prompt once per session (and once lifetime if you want; here we use a per-session guard)
      const alreadyPrompted = await AsyncStorage.getItem(PROMPTED_KEY);
      if (!alreadyPrompted) {
        const res = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS'
        );
        await AsyncStorage.setItem(PROMPTED_KEY, '1');
        if (res !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[FCM] User denied notif permission; skipping init.');
          return () => {};
        }
      } else {
        // We already tried asking; don’t bug the user again
        return () => {};
      }
    }

    // At this point, we’re allowed to register
    await messaging().registerDeviceForRemoteMessages();

    // Keep token updated
    const unsub = messaging().onTokenRefresh((newToken) => {
      console.log('[FCM] token refreshed:', newToken);
      // Optionally, send to backend if logged-in
    });
    return unsub;
  }

  // iOS
  if (Platform.OS === 'ios') {
    // Only ask on iOS when prompt=true (after a user gesture)
    if (prompt) {
      const status = await messaging().requestPermission();
      const enabled =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) {
        console.log('[FCM] iOS notif permission denied/provisional; skipping init.');
        return () => {};
      }
    }
    await messaging().registerDeviceForRemoteMessages();
    const unsub = messaging().onTokenRefresh((newToken) => {
      console.log('[FCM] token refreshed (iOS):', newToken);
    });
    return unsub;
  }

  return () => {};
}

export async function getCurrentFcmToken() {
  if (!IS_FIREBASE_CONFIGURED) {
    console.log('[FCM] Not configured – no token.');
    return null;
  }
  // Don’t fetch token if Android 13+ permission is missing
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const ok = await hasAndroid13NotifPermission();
    if (!ok) return null;
  }
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }
  return messaging().getToken();
}
