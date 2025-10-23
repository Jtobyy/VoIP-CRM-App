import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const WalletTopUpSuccessModal = ({ 
  visible, 
  amount, 
  walletBalance, 
  onClose 
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome6 
                name="check" 
                size={40} 
                color="#FFFFFF" 
                iconStyle="solid" 
              />
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Top-Up Successful!</Text>
          <Text style={styles.subtitle}>
            Your wallet has been funded successfully
          </Text>

          {/* Amount Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Added</Text>
              <Text style={styles.detailValue}>₦{amount?.toLocaleString()}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>New Wallet Balance</Text>
              <Text style={styles.detailValueHighlight}>
                ₦{walletBalance?.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#29B110',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailValueHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#29B110',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#29B110',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WalletTopUpSuccessModal;