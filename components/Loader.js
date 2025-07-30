import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';

const GlobalLoader = ({ visible }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#3EBF0F" />
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalLoader;
