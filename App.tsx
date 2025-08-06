/**
 * Main App Component
 * Handles splash screen and navigation setup
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';
import { SnackbarProvider } from './hooks/useSnackbar';
import { LoadingProvider } from './hooks/useLoading';
import Loader from './components/Loader';
import { ErrorProvider } from './hooks/useError';
import { WebSocketProvider } from './hooks/useWebSocket';


function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
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
    </>
  );
}

export default App;