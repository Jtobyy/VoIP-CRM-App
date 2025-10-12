import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../styles/global';

const AuthFooter = () => {
  return (
    <View style={styles.footerContainer}>
      {/* <TouchableOpacity style={styles.whatsappButton}>
        <Image 
          source={require('../assets/wa.png')} 
          style={styles.whatsappIcon}
        />
        <Text style={styles.whatsappText}>Chat on Whatsapp</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 50, // Adjust this value as needed
    left: 0,
    right: 0,
    alignItems: 'center', // This centers the button horizontally
  },
  whatsappButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappIcon: {
    width: 50,
    height: 50,
    zIndex: 2
  },
  whatsappText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    backgroundColor: 'rgb(242, 246, 252)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingRight: 5,
    paddingLeft: 20,
    position: 'relative',
    left: -15,
    zIndex: 1
  },
});

export default AuthFooter;