/**
 * Main App Component
 * Handles splash screen and navigation setup
 */

import React,{useEffect} from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';
import { SnackbarProvider } from './hooks/useSnackbar';
import { LoadingProvider } from './hooks/useLoading';
import Loader from './components/Loader';
import { ErrorProvider } from './hooks/useError';
import { WebSocketProvider } from './hooks/useWebSocket';
import {initFcm} from './firebase/fcm'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ensureAndroidChannel, attachForegroundHandler } from './firebase/notification';
import messaging from '@react-native-firebase/messaging';
import { IS_FIREBASE_CONFIGURED } from './firebase/fcm';
import { UnreadProvider } from './screens/shared/notifications/UnreadProvider';
import { incrementUnread, getUnreadCount } from './screens/shared/notifications/unread';
// import { useUnread } from './screens/shared/notifications/UnreadProvider';
import { CallProvider } from './hooks/useCall';

// Add this import or type definition for NormalizedNotification
type NormalizedNotification = {
  [key: string]: any;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  // const { setUnreadCountState } = useUnread();

  useEffect(() => {
    let unsubFcm: undefined | (() => void);
    let unsubOnMessage: undefined | (() => void);
  
    (async () => {
      await ensureAndroidChannel(); // safe even if permission is off
      // 👇 Silent init: no system dialogs at startup
      unsubFcm = await initFcm({ prompt: false });
  
      // Foreground banners & counters are already gated in notification.js
      unsubOnMessage = attachForegroundHandler(async (normalized: NormalizedNotification) => {
        // Optional: only increment if you *know* banners are allowed; your showLocalBanner already guards. :contentReference[oaicite:4]{index=4}
        // await incrementUnread(1);
      });
    })();
  
    const unsubOpened =
      IS_FIREBASE_CONFIGURED
        ? messaging().onNotificationOpenedApp((rm) => {
            routeByType(rm?.data || {});
          })
        : () => {};
  
    if (IS_FIREBASE_CONFIGURED) {
      (async () => {
        const initial = await messaging().getInitialNotification();
        if (initial) routeByType(initial?.data || {});
      })();
    }
  
    return () => {
      unsubFcm?.();
      unsubOnMessage?.();
      unsubOpened();
    };
  }, []);

  return (
    <>
     <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingProvider>
        <SnackbarProvider>
          <AuthProvider>
            <CallProvider>
              <ErrorProvider>
               <UnreadProvider>
                  <WebSocketProvider>
                    <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                    <AppNavigator />
                    <Loader />
                  </WebSocketProvider>
                </UnreadProvider>
              </ErrorProvider>
            </CallProvider>
          </AuthProvider>
        </SnackbarProvider>
      </LoadingProvider>
     </GestureHandlerRootView>
    </>
  );
}

export default App;

function routeByType(d: Record<string, string | object>) {
  switch (d.notification_type) {
    case 'new_message':
      // navigationRef.current?.navigate('ChatThread', { leadId: Number(d.lead_id) });
      break;
    case 'task_assigned':
      // navigationRef.current?.navigate('TaskDetails', { id: Number(d.task_id) });
      break;
    default:
      // navigationRef.current?.navigate('Notifications');
      break;
  }
}