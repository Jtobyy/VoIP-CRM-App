import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // or use react-native-vector-icons

const AppModal = ({
  isVisible,
  onClose,
  title,
  children,
  showFooter = true,
  footer,
  showHeader = true,
  modalWidth = '90%',
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { width: modalWidth }]}>
          
          {/* Header */}
          {showHeader && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <FontAwesome name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          {/* Body */}
          <View style={styles.body}>
            {children}
          </View>

          {/* Footer */}
          {showFooter && (
            <View style={styles.footer}>
              {footer}
            </View>
          )}
        </View>

        {/* Click-outside backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  body: {
    padding: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default AppModal;
