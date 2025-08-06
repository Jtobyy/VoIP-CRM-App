// screens/IncomingCallScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Avatar from '../../../components/Avatar';
import { colors, typography } from '../../../styles/global';

const IncomingCallScreen = ({ navigation, route }) => {
  // You can also get details from route.params
  const {
    name = 'Adedoyin Folakemi',
    phone = '+234 803 567 0547',
    location = 'Lagos, Nigeria',
    initials = 'AF'
  } = route.params || {};

  // Handlers for call controls (mute, keypad, etc.)
  const handleEndCall = () => navigation.goBack();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../../assets/nativetalkbusiness.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Call Status */}
      <Text style={styles.status}>Incoming call</Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Avatar name={initials} size={80} style={{ backgroundColor: '#E7F7E1' }} textStyle={{ color: colors.primary }} />
      </View>

      {/* User Details */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.phone}>{phone}</Text>
      <Text style={styles.location}>{location}</Text>

      {/* Call Controls */}
      <View style={styles.controlsGrid}>
        <CallControl icon="mic-off" label="Mute" />
        <CallControl icon="dialpad" label="Keypad" />
        <CallControl icon="volume-up" label="Speaker" />
        <CallControl icon="add-call" label="Add call" disabled />
        <CallControl icon="pause-circle" label="Hold" disabled />
        <CallControl icon="contacts" label="Contacts" />
      </View>

      {/* End Call Button */}
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Image source={require('../../../assets/endcall.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

const CallControl = ({ icon, label, disabled }) => (
  <View style={[styles.control, disabled && styles.disabledControl]}>
    <View style={[styles.controlCircle, disabled && styles.disabledCircle]}>
      <Image
        source={require(`../../../assets/${icon}.png`)} // Place matching icons in assets: mic-off.png, dialpad.png, etc
        style={{ width: 28, height: 28, tintColor: disabled ? '#ccc' : '#000' }}
        resizeMode="contain"
      />
    </View>
    <Text style={[styles.controlLabel, disabled && styles.disabledLabel]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'flex-start' },
  logo: { width: 120, height: 36, marginTop: 38, marginBottom: 6 },
  status: { fontSize: 15, color: '#111', marginBottom: 16, marginTop: 3 },
  avatarWrap: { marginBottom: 20, marginTop: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  phone: { fontSize: 18, color: '#111', marginTop: 6 },
  location: { fontSize: 15, color: '#444', marginBottom: 16 },
  controlsGrid: {
    width: '88%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 18,
  },
  control: { width: '30%', alignItems: 'center', marginVertical: 16 },
  controlCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.3,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    backgroundColor: '#fff'
  },
  controlLabel: { fontSize: 15, color: '#222', textAlign: 'center' },
  disabledControl: { opacity: 0.48 },
  disabledCircle: { borderColor: '#eee' },
  disabledLabel: { color: '#aaa' },
  endCallButton: {
    position: 'absolute',
    bottom: 44,
    left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default IncomingCallScreen;
