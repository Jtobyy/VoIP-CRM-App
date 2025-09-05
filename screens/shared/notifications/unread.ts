// src/notifications/unread.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notifications.unreadCount';

export async function getUnreadCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function setUnreadCount(n: number) {
  try {
    await AsyncStorage.setItem(KEY, String(Math.max(0, n)));
  } catch {}
}

export async function incrementUnread(by = 1) {
  const current = await getUnreadCount();
  await setUnreadCount(current + by);
}

export async function clearUnread() {
  await setUnreadCount(0);
}
