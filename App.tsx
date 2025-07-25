/**
 * Main App Component
 * Handles splash screen and navigation setup
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import SplashScreen from './screens/SplashScreen';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AuthProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {isLoading ? <SplashScreen /> : <AppNavigator />}
      </AuthProvider>
    </>
  );
}

export default App;