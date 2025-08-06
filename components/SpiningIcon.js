import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';


const SpinningIcon = ({ size = 16, color = '#007bff' }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <FontAwesome6 name="circle-notch" size={size} color={color} iconStyle="solid" />
    </Animated.View>
  );
};

export default SpinningIcon;
