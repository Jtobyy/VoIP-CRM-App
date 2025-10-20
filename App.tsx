import React, { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';
import { SnackbarProvider } from './hooks/useSnackbar';
import { LoadingProvider } from './hooks/useLoading';
import Loader from './components/Loader';
import { ErrorProvider } from './hooks/useError';
import { WebSocketProvider } from './hooks/useWebSocket';
import { initFcm } from './firebase/fcm';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ensureAndroidChannel,
  attachForegroundHandler,
  attachNotificationPressHandler,
  handleInitialNotification,
} from './firebase/notification';
import messaging from '@react-native-firebase/messaging';
import { IS_FIREBASE_CONFIGURED } from './firebase/fcm';
import { UnreadProvider } from './screens/shared/notifications/UnreadProvider';
import { CallProvider } from './hooks/useCall';

type NormalizedNotification = {
  [key: string]: any;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    let unsubFcm: undefined | (() => void);
    let unsubOnMessage: undefined | (() => void);
    let unsubNotifeePress: undefined | (() => void);

    (async () => {
      if (!IS_FIREBASE_CONFIGURED) return;

      await ensureAndroidChannel();
      unsubFcm = await initFcm({ prompt: true });

      // Foreground: when app is open
      unsubOnMessage = attachForegroundHandler(
        async (normalized: NormalizedNotification) => {
          console.log('[App] Foreground notification received:', normalized);
        }
      );

      // Notification press handler (both foreground and background)
      unsubNotifeePress = attachNotificationPressHandler();

      // Handle notification if app was opened from quit state
      handleInitialNotification();
    })();

    // Legacy FCM handler (kept for compatibility with your existing code)
    const unsubOpened =
      IS_FIREBASE_CONFIGURED
        ? messaging().onNotificationOpenedApp((rm) => {
            console.log('[App] onNotificationOpenedApp:', rm?.data);
          })
        : () => {};

    return () => {
      unsubFcm?.();
      unsubOnMessage?.();
      unsubNotifeePress?.();
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
                      <StatusBar
                        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                      />
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