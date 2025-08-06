import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar,
  Dimensions, Image, Platform, PermissionsAndroid, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../styles/global';
import { Endpoint } from '@aldiand/react-native-pjsip';

const dialPad = [
  [{ number: '1', letters: '' }, { number: '2', letters: 'ABC' }, { number: '3', letters: 'DEF' }],
  [{ number: '4', letters: 'GHI' }, { number: '5', letters: 'JKL' }, { number: '6', letters: 'MNO' }],
  [{ number: '7', letters: 'PQRS' }, { number: '8', letters: 'TUV' }, { number: '9', letters: 'WXYZ' }],
  [{ number: '*', letters: '' }, { number: '0', letters: '+' }, { number: '#', letters: '' }],
];

const { width } = Dimensions.get('window');
let endpoint = new Endpoint();


const DialerScreen = ({ navigation }) => {
  const [input, setInput] = useState('');
  const [account, setAccount] = useState(null);

  useEffect(() => {
    let listeners = [];
    let accountRef = null;

    async function startSIP() {
      await endpoint.start();

      const configuration = {
        name: "Test User",
        username: "102",
        domain: "cc2.nativetalk.com.ng",
        password: "Test@123",
        proxy: null,
        transport: "udp",
        regServer: "sip:cc2.nativetalk.com.ng:5060",
        regTimeout: 3600,
      };
      
      endpoint.createAccount(configuration).then((account) => {
        console.log("Account created", account);
      })
      .catch((err) => {
        console.error("Failed to create account", err);
        Alert.alert('SIP Login Error', err.message || 'Failed to register SIP account.')
      });

      listeners = [
        endpoint.on("registration_changed", (acc) => {
          console.log('Registration changed:', acc);
          if (acc.registration && acc.registration.status === 'Failed') {
            Alert.alert('Registration Failed', acc.registration.reason || 'Unknown');
          }
        }),
        endpoint.on("call_changed", (call) => {
          console.log('Call changed:', call);
        }),
        endpoint.on("call_terminated", (call) => {
          console.log('Call terminated:', call);
        }),
      ];
    }

    startSIP();
  }, [])

  const handlePress = (value) => setInput(prev => prev + value);
  const handleBackspace = () => setInput(prev => prev.slice(0, -1));

  const handleCall = async () => {
    if (!account) {
      Alert.alert('SIP not registered yet', 'Please wait for SIP registration.');
      return;
    }
    if (!input || input.length < 3) {
      Alert.alert('Invalid Number', 'Enter a valid phone number.');
      return;
    }
    const dialedUri = input.includes('@') ? input : `sip:${input}@cc2.nativetalk.com.ng:8089`;
    try {
      const newCall = await endpoint.makeCall(account, dialedUri, {});
      setCall(newCall);
      navigation.navigate('OutgoingCall', {
        name: input,
        phone: input,
        location: 'Nigeria',
        initials: input.substring(0,2).toUpperCase(),
        // Optionally pass callId: newCall.getId(),
      });
    } catch (err) {
      Alert.alert('Call Failed', err.message || 'Failed to start call.');
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
                {item.letters !== '' && (
                  <Text style={styles.dialPadLetters}>{item.letters}</Text>
                )}
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
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 30,
    position: 'relative',
  },
  inputText: {
    flex: 1,
    fontSize: 26,
    color: '#222',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 35,
    padding: 6,
    zIndex: 10,
  },
  dialPadContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dialPadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dialPadButton: {
    width: width / 4.3,
    height: width / 4.3,
    borderRadius: width / 8.6,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 1.5,
  },
  dialPadNumber: {
    fontSize: 30,
    color: '#111',
    fontWeight: '600',
    textAlign: 'center',
  },
  dialPadLetters: {
    fontSize: 11,
    color: '#444',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default DialerScreen;
