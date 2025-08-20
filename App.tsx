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


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  useEffect(() => {
  let unsub: undefined | (() => void);
  (async () => {
    unsub = await initFcm(); // safe: no-ops until Firebase is configured
  })();
  return () => unsub && unsub();
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