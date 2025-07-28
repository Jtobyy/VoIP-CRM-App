import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../styles/global';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

const AddUserSuccessModal = ({ visible, onAddAnother, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close icon */}
          <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          {/* Success Icon */}
          <View style={styles.iconCircle}>
            <FontAwesome6 name="check" iconStyle='solid' size={32} color="#22C55E" />
          </View>

          {/* Texts */}
          <Text style={styles.successText}>Success!</Text>
          <Text style={styles.subText}>A mail will be sent to you within the next 24hrs</Text>

          {/* Buttons */}
          <TouchableOpacity style={styles.addButton} onPress={onAddAnother}>
            <Text style={styles.addButtonText}>Add another user</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddUserSuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  closeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  iconCircle: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 18,
    marginBottom: 18,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
});
