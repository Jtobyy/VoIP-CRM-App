import { Platform } from 'react-native';
import { getCurrentFcmToken } from './fcm';

// Try to get a token, but don't block login for long
export async function getFcmTokenForLogin({ timeoutMs = 1500 } = {}) {
  const timeout = new Promise(resolve =>
    setTimeout(() => resolve(null), timeoutMs)
  );
  try {
    const token = await Promise.race([getCurrentFcmToken(), timeout]);
    return { token: token ?? null, platform: Platform.OS };
  } catch {
    return { token: null, platform: Platform.OS };
  }
}
