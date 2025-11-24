import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const ProductSuccessModal = ({ visible, message, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          {/* Success Checkmark */}
          <View style={styles.circle}>
            <FontAwesome6 name="check" size={40} color="#fff" iconStyle='solid' />
          </View>

          {/* Text */}
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.message}>{message || 'Operation completed successfully'}</Text>

          {/* Button */}
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Okay, Thank You!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProductSuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
  },
  closeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000',
    lineHeight: 24,
  },
  circle: {
    backgroundColor: colors.primary,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});