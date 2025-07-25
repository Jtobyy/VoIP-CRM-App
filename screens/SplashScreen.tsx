/**
 * Splash Screen Component
 * src/screens/Splash.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
  Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  return (
    <ImageBackground 
      source={require('../assets/splash.png')} // Update path to your image
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="transparent" translucent />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(62, 191, 15, 0.7)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#6CBE45',
    letterSpacing: 1,
  },
  businessText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SplashScreen;