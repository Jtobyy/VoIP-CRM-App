import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Image
} from 'react-native';
import { colors } from '../../styles/global';

const { width, height } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccountPress = () => {
    navigation.navigate('PersonalInfo');
  };

  return (
    <ImageBackground 
      source={require('../../assets/welcome.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="transparent" translucent />
      
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Logo Header - Centered */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/nativetalk1.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Content - Left-aligned */}
          <View style={styles.content}>
            <Image 
              source={require('../../assets/callchat.png')} 
              style={styles.callChat}
              resizeMode="contain"
            />
            <Text style={styles.title}>Your Business Calls{'\n'}Just Got Easier</Text>
            <Text style={styles.description}>
              Make customer service simple and grow your business with a NativeTalk business phone system. 
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Text style={styles.loginButtonText}>Log in</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccountPress}>
              <Text style={styles.createAccountButtonText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
    width: '100%',
  },
  logo: {
    width: 185,
    height: 45,
  },
  callChat: {
    width: 150,
    height: 150,
    marginBottom: 10,
    alignSelf: 'flex-start', // Align left
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start', // Left alignment
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left', // Left aligned
    lineHeight: 36,
    marginBottom: 10,
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left', // Left aligned
    lineHeight: 24,
    marginBottom: 30,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createAccountButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  createAccountButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Welcome;