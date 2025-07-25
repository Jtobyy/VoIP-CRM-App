import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { colors } from '../../styles/global';
import AuthFooter from '../../components/AuthFooter';
import AuthHeader from '../../components/AuthHeader';

const { width } = Dimensions.get('window');

const InviteUsers = ({ navigation }) => {
  const [userCount, setUserCount] = React.useState(1);

  const handleIncrease = () => {
    setUserCount(prev => prev + 1);
  };

  const handleDecrease = () => {
    if (userCount > 1) {
      setUserCount(prev => prev - 1);
    }
  };

  const handleProceed = () => {
    // Handle the proceed action with the selected user count
    navigation.navigate('NextScreen', { userCount });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.rootContainer}>
        <AuthHeader 
          progress={0} // Adjust as needed
          totalSteps={3} // Adjust as needed
          onBack={() => navigation.goBack()}
        />
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Invite Users</Text>
              <Text style={styles.subtitle}>Select Number of Users</Text>
            </View>

            {/* User Count Selector */}
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={handleDecrease}
                disabled={userCount <= 1}
              >
                <Text style={[styles.counterButtonText, userCount <= 1 && styles.disabledButton]}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.countDisplay}>
                <Text style={styles.countText}>{userCount}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={handleIncrease}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Proceed Button */}
            <TouchableOpacity 
              style={styles.proceedButton} 
              onPress={handleProceed}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>

            {/* Footer */}
            <AuthFooter />
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  countDisplay: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 36,
    color: '#333333',
    fontWeight: 'bold',
  },
  proceedButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
    maxWidth: 300,
  },
  proceedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InviteUsers;