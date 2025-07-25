import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../styles/global';


const AuthHeader = ({ 
  showBack = true, 
  progress = 1, 
  totalSteps = 3,
  onBack,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Image
              source={require('../assets/back.png')} 
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        
        {totalSteps > 1 && (
          <View style={styles.progressContainer}>
            {[...Array(totalSteps)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.progressBar, 
                  i < progress && styles.progressBarActive
                ]} 
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: "#fff"
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonIcon: {
    width: 20,
    height: 20
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 2,
  },
  progressBarActive: {
    backgroundColor: colors.primary,
  },
});

export default AuthHeader;