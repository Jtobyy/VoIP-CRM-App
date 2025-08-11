// screens/DialerScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar,
  Dimensions, Image, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../styles/global';
import useCall from '../../../hooks/useCall'; // <-- your provider/hook with hardcoded config

const dialPad = [
  [{ number: '1', letters: '' }, { number: '2', letters: 'ABC' }, { number: '3', letters: 'DEF' }],
  [{ number: '4', letters: 'GHI' }, { number: '5', letters: 'JKL' }, { number: '6', letters: 'MNO' }],
  [{ number: '7', letters: 'PQRS' }, { number: '8', letters: 'TUV' }, { number: '9', letters: 'WXYZ' }],
  [{ number: '*', letters: '' }, { number: '0', letters: '+' }, { number: '#', letters: '' }],
];

const { width } = Dimensions.get('window');

const DialerScreen = ({ navigation }) => {
  const [input, setInput] = useState('');
  const { dial } = useCall();

  const handlePress = (value) => setInput((prev) => prev + value);
  const handleBackspace = () => setInput((prev) => prev.slice(0, -1));

  const handleCall = async () => {
    try {
      console.log('Call abojt to start', input);
      const call = await dial(input);
      console.log('Call started', call);
      if (call) {
        const initials = (input || 'NA').substring(0, 2).toUpperCase();
        navigation.navigate('OutgoingCall', {
          callId: call.id,
          name: input,
          phone: input,
          location: 'Nigeria',
          initials,
        });
      }
    } catch (err) {
      console.log('error is ', err)
      Alert.alert('Call Failed', err?.message || 'Failed to start call.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dial Number</Text>
      </ImageBackground>

      {/* Input display */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputText} numberOfLines={1} ellipsizeMode="head">
          {input || <Text style={{ color: '#ccc' }}>Enter Number</Text>}
        </Text>
        {input.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleBackspace}>
            <Icon name="backspace" size={24} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dial Pad */}
      <View style={styles.dialPadContainer}>
        {dialPad.map((row, i) => (
          <View style={styles.dialPadRow} key={i}>
            {row.map((item, j) => (
              <TouchableOpacity
                style={styles.dialPadButton}
                key={item.number + j}
                onPress={() => handlePress(item.number)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialPadNumber}>{item.number}</Text>
                {!!item.letters && <Text style={styles.dialPadLetters}>{item.letters}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={{ marginTop: 15 }} onPress={handleCall}>
          <Image
            source={require('../../../assets/call.png')}
            style={{ width: 70, height: 70 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 80, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', textAlign: 'center', flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 100, marginTop: 10, marginBottom: 10, paddingHorizontal: 30, position: 'relative',
  },
  inputText: { flex: 1, fontSize: 26, color: '#222', textAlign: 'center', fontWeight: '600', letterSpacing: 2 },
  clearButton: { position: 'absolute', right: 35, padding: 6, zIndex: 10 },
  dialPadContainer: {
    flex: 1, backgroundColor: '#fafafa', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingTop: 30, alignItems: 'center', justifyContent: 'flex-start',
  },
  dialPadRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  dialPadButton: {
    width: width / 4.3, height: width / 4.3, borderRadius: width / 8.6, backgroundColor: '#fff',
    marginHorizontal: 8, justifyContent: 'center', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 1.5,
  },
  dialPadNumber: { fontSize: 30, color: '#111', fontWeight: '600', textAlign: 'center' },
  dialPadLetters: { fontSize: 11, color: '#444', letterSpacing: 2, textAlign: 'center', marginTop: 2 },
});

export default DialerScreen;
