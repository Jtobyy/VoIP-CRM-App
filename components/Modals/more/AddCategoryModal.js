import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const AddCategoryModal = ({ visible, onClose, onSubmit }) => {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    onSubmit(categoryName);
    setCategoryName('');
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.overlay}>
          {/* Empty touchable area to close modal */}
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add New Category</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome6 name="xmark" size={20} color="#000" iconStyle='solid' />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Category Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter product category"
                  placeholderTextColor="#999"
                  value={categoryName}
                  onChangeText={setCategoryName}
                  autoFocus
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddCategoryModal;