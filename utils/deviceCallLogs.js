// utils/deviceCallLogs.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@ntb:device_call_logs';
const MAX = 300;

// --- simple in-memory subscribers ---
const _subs = new Set();
export function subscribeDeviceCallLogs(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}
function _notifyDeviceLogAdded(entry) {
  _subs.forEach(cb => {
    try { cb(entry); } catch (e) {}
  });
}

export async function addDeviceCallLog(partial) {
  if (!partial || !partial.direction) return;

  const entry = {
    direction: partial.direction,
    number: partial.number || '',
    timestamp: Number(partial.timestamp || Date.now()),
    presentation: partial.presentation ?? 0,
    callerName: partial.callerName || '',
    source: 'device',
  };

  const raw = await AsyncStorage.getItem(KEY);
  const list = raw ? JSON.parse(raw) : [];

  const exists = list.find(
    l =>
      Math.abs(l.timestamp - entry.timestamp) <= 2000 &&
      l.number === entry.number &&
      l.direction === entry.direction
  );

  if (!exists) {
    list.unshift(entry);
    if (list.length > MAX) list.length = MAX;
    await AsyncStorage.setItem(KEY, JSON.stringify(list));

    // 🔔 tell live listeners
    _notifyDeviceLogAdded(entry);
  }
}

export async function getDeviceCallLogs() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearDeviceCallLogs() {
  await AsyncStorage.removeItem(KEY);
}
