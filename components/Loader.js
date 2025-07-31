// components/Loader.js
import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLoading } from '../hooks/useLoading';

const Loader = () => {
  const { loading } = useLoading();

  return (
    <Modal visible={loading} transparent animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#3EBF0F" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
