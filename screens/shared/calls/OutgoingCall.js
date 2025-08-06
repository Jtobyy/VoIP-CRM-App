// screens/OutgoingCallScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Avatar from '../../../components/Avatar';
import { colors, typography } from '../../../styles/global';

const OutgoingCallScreen = ({ navigation, route }) => {
  const [callEnded, setCallEnded] = useState(false);

  const handleEndCall = () => {
    if (!callEnded) {
      setCallEnded(true);
    } else {
      navigation.goBack();
    }
  };
  
  const {
    name = 'Adedoyin Folakemi',
    phone = '+234 803 567 0547',
    location = 'Lagos, Nigeria',
    initials = 'AF'
  } = route.params || {};

  const [controls, setControls] = useState({
    mute: false,
    keypad: false,
    speaker: false,
    hold: false,
  });

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../../assets/nativetalk1.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Call Status */}
      <Text
        style={[
            styles.status,
            callEnded && { color: 'red' }
        ]}
        >
        {callEnded ? 'Call ended' : 'Outgoing call'}
        </Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Avatar name={initials} 
        size={80} 
        fontSize={32}
        textStyle={{ color: colors.primary }} />
      </View>

      {/* User Details */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.phone}>{phone}</Text>
      <Text style={styles.location}>{location}</Text>

      {/* Call Controls */}
      <View style={styles.controlsGrid}>
        <CallControl
            icon="mic"
            label="Mute"
            active={controls.mute}
            onPress={() => setControls(c => ({ ...c, mute: !c.mute }))}
        />
        <CallControl
            icon="dial2"
            label="Keypad"
            active={controls.keypad}
            onPress={() => setControls(c => ({ ...c, keypad: !c.keypad }))}
        />
        <CallControl
            icon="speaker"
            label="Speaker"
            active={controls.speaker}
            onPress={() => setControls(c => ({ ...c, speaker: !c.speaker }))}
        />
        <CallControl
            icon="hold"
            label="Hold"
            active={controls.hold}
            onPress={() => setControls(c => ({ ...c, hold: !c.hold }))}
            disabled
        />
      </View>

      {/* End Call Button */}
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Image source={require('../../../assets/endcall.png')} style={{ width: 65, height: 65 }} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

const controlIcons = {
    mic: require('../../../assets/mic.png'),
    dial2: require('../../../assets/dial2.png'),
    speaker: require('../../../assets/speaker.png'),
    hold: require('../../../assets/hold.png'),
    // Add others as needed!
  };

const CallControl = ({ icon, label, active, disabled, onPress }) => {
    const backgroundColor = active ? '#111' : '#fff';
    const iconColor = active ? '#fff' : disabled ? '#ccc' : '#111';
  
    return (
      <TouchableOpacity
        style={[styles.control, disabled && styles.disabledControl]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View >
          <Image
            source={controlIcons[icon]}
            resizeMode="contain"
            style={[
                styles.controlCircle,
                { backgroundColor },
                disabled && styles.disabledCircle,
                { width: 65, height: 65, tintColor: iconColor }
              ]}
          />
        </View>
        <Text style={[styles.controlLabel, disabled && styles.disabledLabel]}>{label}</Text>
      </TouchableOpacity>
    );
  };  

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', 
    justifyContent: 'flex-start', paddingVertical: 60 },
  logo: { width: 120, height: 36, marginTop: 38, marginBottom: 6 },
  status: { fontSize: 15, color: '#111', marginBottom: 16, marginTop: 10 },
  avatarWrap: { marginBottom: 10, marginTop: 15 },
  name: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  phone: { fontSize: 18, color: '#111', marginTop: 6, marginBottom: 6 },
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
    borderRadius: 50,
    borderWidth: 0,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },  
  controlLabel: { fontSize: 15, color: '#222', textAlign: 'center' },
  disabledControl: { opacity: 0.48 },
  disabledCircle: { borderColor: '#eee' },
  disabledLabel: { color: '#aaa' },
  endCallButton: {
    position: 'absolute',
    bottom: 60,
    left: 0, 
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default OutgoingCallScreen;
