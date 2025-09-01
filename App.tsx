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

// Add this import or type definition for NormalizedNotification
type NormalizedNotification = {
  [key: string]: any;
};


function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    let unsubFcm: undefined | (() => void);
    let unsubOnMessage: undefined | (() => void);

    (async () => {
      await ensureAndroidChannel(); // Android channel once
      unsubFcm = await initFcm();   // your existing init
      unsubOnMessage = attachForegroundHandler((normalized: NormalizedNotification) => {
        // Optional: update badge counts / in-app list
        // console.log('[Notif] Foreground received:', normalized);
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
                <WebSocketProvider>
                   <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                   <AppNavigator />
                   <Loader />
                </WebSocketProvider>
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