import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/global';
import { useAuth } from '../../hooks/useAuth';

const AccountCreated = ({ navigation,route }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { login, isAuthenticated } = useAuth();
  const {
    phoneNumber = '',
    password='',
  } = route.params || {};

  const handleContinue = async () => {
    setIsLoading(true);
    const success = await login(phoneNumber,password);
    setIsLoading(false);
    
    console.log('success value:', success); // Add this to debug
    
    if (!success) {
      alert(`Invalid credentials. Please try again. ${success}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Icon - You can replace with an image */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✓</Text>
      </View>

      <Text style={styles.title}>You are all set</Text>
      <Text style={styles.subtitle}>Thank you for registering with NativeTalk.</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Okay, Thank You!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  icon: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountCreated;