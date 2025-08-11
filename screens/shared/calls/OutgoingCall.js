import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Avatar from '../../../components/Avatar';
import { colors } from '../../../styles/global';
import useCall from '../../../hooks/useCall';

const controlIcons = {
  mic: require('../../../assets/mic.png'),
  dial2: require('../../../assets/dial2.png'),
  speaker: require('../../../assets/speaker.png'),
  hold: require('../../../assets/hold.png'),
};

const OutgoingCallScreen = ({ navigation, route }) => {
  const {
    callStatus,
    currentCall,
    hangup,
    toggleHold,
    toggleMute,
    toggleSpeaker,

    durationSec,
    formattedDuration,
    sendDTMFActive,
    isMuted,
    isHeld,
  } = useCall();

  const {
    name = 'Adedoyin Folakemi',
    phone = '+234 803 567 0547',
    location = 'Lagos, Nigeria',
    initials = 'AF',
  } = route.params || {};

  // const [keypad, setKeypad] = useState(false);

  const controlsDisabled = callStatus == 'Ended'; // lock buttons after termination

  const handleEndCall = async () => {
    if (callStatus !== 'Ended') {
      await hangup();
      return;
    }
    navigation.goBack();
  };
  

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/nativetalk1.png')} style={styles.logo} resizeMode="contain" />

      <Text style={[styles.status, callStatus == 'Ended' && { color: 'red' }]}>
        {callStatus == 'Ended' ? 'Call ended' : callStatus}
      </Text>
      {callStatus == "In progress" && <Text style={styles.duration}>{formattedDuration}</Text>}
      {callStatus == "Ended" && <Text style={styles.duration}>{formattedDuration}</Text>}      

      <View style={styles.avatarWrap}>
        <Avatar name={initials} size={80} fontSize={32} textStyle={{ color: colors.primary }} />
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.phone}>{phone}</Text>
      <Text style={styles.location}>{location}</Text>

      <View style={styles.controlsGrid}>
        <CallControl
          icon="mic"
          label={currentCall?.isMuted() ? 'Unmute' : 'Mute'}
          active={currentCall?.isMuted()}
          disabled={controlsDisabled}
          onPress={toggleMute}
        />
        {/* <CallControl
          icon="dial2"
          label={keypad ? 'Hide Keypad' : 'Keypad'}
          active={keypad}
          disabled={controlsDisabled}
          onPress={() => setKeypad(k => !k)}
        /> */}
        <CallControl
          icon="speaker"
          label={currentCall?.isSpeaker() ? 'Earipiece' : 'Speaker'}
          active={currentCall?.isSpeaker()}
          disabled={controlsDisabled}
          onPress={toggleSpeaker}
        />
        <CallControl
          icon="hold"
          label={currentCall?.isHeld() ? 'Resume' : 'Hold'}
          active={currentCall?.isHeld()}
          disabled={controlsDisabled}
          onPress={toggleHold}
        />
      </View>

      {/* {keypad && !ended && (
        <View style={styles.keypadRow}>
          {['1','2','3','4','5','6','7','8','9','*','0','#'].map((d) => (
            <TouchableOpacity key={d} style={styles.key} onPress={() => sendDTMFActive(d)} activeOpacity={0.7}>
              <Text style={{ fontSize: 20 }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )} */}

      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall} >
        <Image source={require('../../../assets/endcall.png')} style={{ width: 65, height: 65 }} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
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
      <Image
        source={controlIcons[icon]}
        resizeMode="contain"
        style={[styles.controlCircle, { backgroundColor, tintColor: iconColor }]}
      />
      <Text style={[styles.controlLabel, disabled && styles.disabledLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 60 },
  logo: { width: 120, height: 36, marginTop: 38, marginBottom: 6 },
  status: { fontSize: 15, color: '#111', marginBottom: 6, marginTop: 10 },
  duration: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 10 },
  avatarWrap: { marginBottom: 10, marginTop: 15 },
  name: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  phone: { fontSize: 18, color: '#111', marginTop: 6, marginBottom: 6 },
  location: { fontSize: 15, color: '#444', marginBottom: 16 },
  controlsGrid: {
    width: '88%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    alignSelf: 'center', marginTop: 30, marginBottom: 18,
  },
  control: { width: '30%', alignItems: 'center', marginVertical: 16 },
  controlCircle: {
    width: 65, height: 65, borderRadius: 50, borderWidth: 0,
    alignItems: 'center', justifyContent: 'center', marginBottom: 7,
  },
  controlLabel: { fontSize: 15, color: '#222', textAlign: 'center' },
  disabledControl: { opacity: 0.48 },
  disabledLabel: { color: '#aaa' },

  keypadRow: {
    width: '80%', flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 12, marginTop: 8, marginBottom: 20,
  },
  key: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', elevation: 1,
  },

  endCallButton: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});

export default OutgoingCallScreen;
