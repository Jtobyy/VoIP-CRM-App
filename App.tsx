/**
 * Main App Component
 * Handles splash screen and navigation setup
 */

import React,{useEffect} from 'react';
import { StatusBar, useColorScheme } from 'react-native';
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
import { UnreadProvider } from './screens/shared/notifications/UnreadProvider';
import { incrementUnread, getUnreadCount } from './screens/shared/notifications/unread';
import { useUnread } from './screens/shared/notifications/UnreadProvider';

// Add this import or type definition for NormalizedNotification
type NormalizedNotification = {
  [key: string]: any;
};


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { setUnreadCountState } = useUnread();

  useEffect(() => {
    let unsubFcm: undefined | (() => void);
    let unsubOnMessage: undefined | (() => void);

    (async () => {
      await ensureAndroidChannel(); // Android channel once
      unsubFcm = await initFcm();   // your existing init
      unsubOnMessage = attachForegroundHandler(async(normalized: NormalizedNotification) => {
        // Optional: update badge counts / in-app list
        // console.log('[Notif] Foreground received:', normalized);
        await incrementUnread(1);
        // 2) Update in-memory state so the bell dot reacts immediately
        const n = await getUnreadCount();
        setUnreadCountState(n);
      });
    })();

    // Taps from background -> foreground
    const unsubOpened = messaging().onNotificationOpenedApp((rm) => {
      routeByType(rm?.data || {});
    });

    // Taps from quit state
    (async () => {
      const initial = await messaging().getInitialNotification();
      if (initial) routeByType(initial?.data || {});
    })();

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
            <ErrorProvider>
               <UnreadProvider>
                <WebSocketProvider>
                   <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                   <AppNavigator />
                   <Loader />
                </WebSocketProvider>
                </UnreadProvider>
            </ErrorProvider>
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