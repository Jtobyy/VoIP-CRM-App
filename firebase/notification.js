import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';

/** Create default Android channel (once) */
export async function ensureAndroidChannel() {
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'General',
      importance: AndroidImportance.HIGH,
    });
  } catch (e) {
    console.log('[Notif] createChannel error (ok on iOS):', e?.message);
  }
}

async function androidNotificationsAllowed() {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
           settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

/** Local banner (both platforms) */
export async function showLocalBanner({ title, body, data = {} }) {
  if (Platform.OS === 'android' && !(await androidNotificationsAllowed())) {
    return;
  }
  
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      // smallIcon: 'ic_notification',
    },
    ios: {
      foregroundPresentationOptions: {
        banner: true, list: true, sound: true, badge: true,
      },
    },
  });
}

/** Normalize FCM remoteMessage to a consistent shape */
export function normalizeFCM(remoteMessage) {
  const d = remoteMessage?.data || {};

  // If backend sent metadata as JSON string, parse it safely:
  let metaFromJson;
  try {
    if (typeof d.metadata === 'string') metaFromJson = JSON.parse(d.metadata);
  } catch {}

  // Build "metadata" from either flattened keys or parsed JSON
  const metadata = metaFromJson ?? {
    message_id: numOrUndef(d.message_id),
    channel: d.channel,
    content_type: d.content_type,
    lead_id: numOrUndef(d.lead_id),
    customer_id: numOrUndef(d.customer_id),
    is_new_lead: boolOrUndef(d.is_new_lead),
    company_is_receiver: boolOrUndef(d.company_is_receiver),
    status: d.status,
  };

  const title =
    remoteMessage?.notification?.title ||
    d.title || 'Notification';

  const description =
    remoteMessage?.notification?.body ||
    d.description || '';

  return {
    id: numOrUndef(d.id),
    title,
    description,
    notification_type: d.notification_type,
    created_at: d.created_at,
    metadata,
    raw: remoteMessage,
  };
}

/** Helpers: convert string->number/bool safely */
function numOrUndef(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}
function boolOrUndef(v) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

/** Foreground listener: show banner while app is open */
export function attachForegroundHandler(onReceive) {
  return messaging().onMessage(async (remoteMessage) => {
    const n = normalizeFCM(remoteMessage);
    try { await showLocalBanner({ title: n.title, body: n.description, data: remoteMessage?.data || {} }); } catch {}
    onReceive?.(n);
  });
}
