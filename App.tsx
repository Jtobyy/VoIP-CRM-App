import React, { useEffect, useRef } from 'react';
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
  attachFcmOpenHandlers,
} from './firebase/notification';
import { IS_FIREBASE_CONFIGURED } from './firebase/fcm';
import { UnreadProvider } from './screens/shared/notifications/UnreadProvider';
import { CallProvider } from './hooks/useCall';

type NormalizedNotification = {
  [key: string]: any;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) {
      console.log('[App] Firebase already initialized, skipping');
      return;
    }

    if (!IS_FIREBASE_CONFIGURED) {
      console.log('[App] Firebase not configured, skipping');
      return;
    }

    isInitialized.current = true;
    let unsubFcm: undefined | (() => void);
    let unsubOnMessage: undefined | (() => void);
    let unsubNotifeePress: undefined | (() => void);
    let unsubFcmOpen: undefined | (() => void);

    (async () => {
      console.log('[App] Initializing Firebase notifications...');
      
      // 1. Create Android notification channel
      await ensureAndroidChannel();
      
      // 2. Initialize FCM and request permissions
      unsubFcm = await initFcm({ prompt: true });

      // 3. Foreground message handler (when app is open)
      // unsubOnMessage = attachForegroundHandler(
      //   async (normalized: NormalizedNotification) => {
      //     console.log('[App] Foreground notification received:', normalized);
      //     // You can add additional logic here if needed
      //   }
      // );

      // 4. Notification press handler (foreground & background)
      unsubNotifeePress = attachNotificationPressHandler();

      // 5. Handle app opened from background by tapping notification
      unsubFcmOpen = attachFcmOpenHandlers();

      // 6. Handle notification if app was opened from quit state
      await handleInitialNotification();

      console.log('[App] Firebase notifications initialized successfully');
    })();

    // Cleanup function
    return () => {
      console.log('[App] Cleaning up Firebase listeners');
      unsubFcm?.();
      // unsubOnMessage?.();
      unsubNotifeePress?.();
      unsubFcmOpen?.();
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - only run once

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