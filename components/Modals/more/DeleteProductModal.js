import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const DeleteProductModal = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          {/* Trash Icon */}
          <View style={styles.iconCircle}>
            <FontAwesome6 name="trash-can" size={40} color="#EF4444" iconStyle='solid' />
          </View>

          {/* Message */}
          <Text style={styles.title}>Are you sure you want to delete ?</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.continueBtn} onPress={onConfirm}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteProductModal;

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
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  closeText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#000',
    lineHeight: 28,
  },
  iconCircle: {
    backgroundColor: '#FEE2E2',
    borderRadius: 60,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  buttonRow: {
    width: '100%',
    marginBottom: 12,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
});