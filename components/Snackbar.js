import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';


const Snackbar = ({ type = 'info', message, visible, onClose, duration = 3000 }) => {
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto close
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
    success: { color: '#22C55E', icon: 'circle-check' },
    error: { color: '#EF4444', icon: 'circle-exclamation' },
    warning: { color: '#F59E0B', icon: 'triangle-exclamation' },
    info: { color: '#3B82F6', icon: 'circle-info' },
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: `${config.color}22`, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <FontAwesome6 
            name={config.icon} 
            iconStyle='solid' 
            size={20} 
            color={config.color} 
            style={styles.icon}
        />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
});

export default Snackbar;
