import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { navigationRef } from '../navigation/RootNavigation'
import { incrementUnread, getUnreadCount } from '../screens/shared/notifications/unread';

let pendingNotification = null;


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
    },
    ios: {
      foregroundPresentationOptions: {
        banner: true,
        list: true,
        sound: true,
        badge: true,
      },
    },
  });
}

export function normalizeFCM(remoteMessage) {
  const d = remoteMessage?.data || {};
  let metaFromJson = null;

  // Try to parse d.message if it exists (backend sends nested structure as string)
  if (d.message && typeof d.message === 'string') {
    try {
      console.log('[Notif] Raw message string:', d.message);
      
      // Convert Python dict string to JSON (single quotes -> double quotes)
      const jsonString = d.message
        .replace(/'/g, '"')           // Replace single quotes with double quotes
        .replace(/None/g, 'null')     // Replace Python None with null
        .replace(/True/g, 'true')     // Replace Python True with true
        .replace(/False/g, 'false');  // Replace Python False with false
      
      const parsed = JSON.parse(jsonString);
      console.log('[Notif] Parsed message:', parsed);
      
      // Extract data from nested structure
      metaFromJson = parsed?.data || parsed;
    } catch (e) {
      console.error('[Notif] Error parsing d.message:', e?.message);
    }
  }

  // Use parsed data or fallback to flattened d structure
  const rawMetadata = metaFromJson || d;

  // Create metadata object (numbers/bools for app use)
  const metadata = {
    message_id: rawMetadata?.message_id ? rawMetadata?.message_id : "",
    channel: rawMetadata?.channel ? rawMetadata?.channel : "",
    content_type: rawMetadata?.content_type ? rawMetadata?.content_type : "",
    status: rawMetadata?.status ? rawMetadata?.status : "",
    conversation_id: rawMetadata?.conversation_id ? rawMetadata?.conversation_id : "",
    lead_id: rawMetadata?.lead_id ? rawMetadata?.lead_id : "",
    customer_id: rawMetadata?.customer_id ? rawMetadata?.customer_id : "",
  };

  // Create notification data (all strings for notifee)
  const notificationData = {
    message_id: String(metadata?.message_id),
    channel: String(metadata?.channel),
    content_type: String(metadata?.content_type),
    status: String(metadata?.status),
    conversation_id: String(metadata?.conversation_id),
    lead_id: String(metadata?.lead_id),
    customer_id: String(metadata?.customer_id),
  };

  const title =
    remoteMessage?.notification?.title ||
    d.title ||
    'Notification';
  
  const description =
    remoteMessage?.notification?.body ||
    d.description ||
    '';

  return {
    id: rawMetadata?.message_id,
    title,
    description,
    notification_type: rawMetadata?.notification_type,
    created_at: rawMetadata?.created_at,
    notificationData,            // We use this for notifee.displayNotification (all strings)
    raw: remoteMessage,
  };
}

/** Helpers: convert string->number/bool safely */
function numOrUndef(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Handle notification and route to conversation */
function handleNotificationNavigation(data) {
  if (!navigationRef.isReady()) {
    console.warn('[Notif] Navigation not ready, queueing notification');
    pendingNotification = data;
    return;
  }

  const conversationId = numOrUndef(data.conversation_id);
  const leadId = numOrUndef(data.lead_id);
  const customerId = numOrUndef(data.customer_id);
  const channel = data.channel;

  console.log('[Notif] Navigation data:', { leadId, customerId, conversationId, channel });

  if (conversationId) {
    console.log('[Notif] Navigating to ConversationScreen:', { conversationId, leadId });
    navigationRef.navigate('ConversationScreen', {
      contactId: leadId || customerId,
      contact: {
        id: leadId || customerId,
        channel: channel,
      },
      conversationId: conversationId,
    });
  }
}

/** We call this from AppNavigator after navigation is ready */
export function flushPendingNotification() {
  if (pendingNotification && navigationRef.isReady()) {
    console.log('[Notif] Flushing pending notification');
    handleNotificationNavigation(pendingNotification);
    pendingNotification = null;
  }
}

/** Foreground listener: show banner while app is open */
export function attachForegroundHandler(onReceive) {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM][FOREGROUND] raw remoteMessage:', remoteMessage);
    const n = normalizeFCM(remoteMessage);
    try { 
      await showLocalBanner({ 
        title: n.title, 
        body: n.description, 
        data: n.notificationData || {} 
      }); 
    } catch (e) {
      console.log('[Notif] showLocalBanner error:', e);
    }
    onReceive?.(n);
  });
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('firebae background message handler')
    console.log('[FCM][BACKGROUND] raw remoteMessage:', JSON.stringify(remoteMessage));
    
    const n = normalizeFCM(remoteMessage);
    try { 
      await showLocalBanner({ 
        title: n.title, 
        body: n.description, 
        data: n.notificationData || {} 
      }); 
    } catch (e) {
      console.log('[Notif] showLocalBanner error:', e);
    }

    try {
      await incrementUnread(1);
      const n = await getUnreadCount();
      await notifee.setBadgeCount(n);
    } catch {
      console.log('error with increment')
    }
});

/** Attach notifee press handler for foreground & background presses */
export function attachNotificationPressHandler() {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('[Notif] Notification pressed:', detail.notification.data);
      handleNotificationNavigation(detail.notification.data || {});
    }
  });
}

/** Handle notification from quit state (killed app) */
export async function handleInitialNotification() {
  try {
    // Check notifee first (background notification that opened the app)
    const notifeeNotif = await notifee.getInitialNotification();
    if (notifeeNotif) {
      console.log('[Notif] Initial notification from notifee:', notifeeNotif.notification.data);
      handleNotificationNavigation(notifeeNotif.notification.data || {});
      return;
    }

    // Check FCM (if app was killed, FCM might have the initial notification)
    const fcmNotif = await messaging().getInitialNotification();
    if (fcmNotif) {
      console.log('[Notif] Initial notification from FCM:', fcmNotif.data);
      handleNotificationNavigation(fcmNotif.data || {});
      return;
    }
  } catch (e) {
    console.log('[Notif] Error getting initial notification:', e?.message);
  }
}

export function attachFcmOpenHandlers() {
  // App opened from background by tapping the remote notif
  const unsub = messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM][OPENED] from background, data=', remoteMessage?.data);
    handleNotificationNavigation(remoteMessage?.data || {});
  });

  // App opened from quit state by tapping the remote notif (you already check Notifee + FCM in handleInitialNotification)
  // leaving getInitialNotification() inside handleInitialNotification()

  return () => unsub();
}