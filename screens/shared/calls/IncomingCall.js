// screens/shared/calls/IncomingCall.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Avatar from '../../../components/Avatar';
import { colors } from '../../../styles/global';
import useCall from '../../../hooks/useCall';

const IncomingCallScreen = ({ navigation, route }) => {
  const { 
    incoming, 
    incomingInfo, 
    answer, 
    hangup,
    callStatus
  } = useCall();

  // Prefer live data from the hook; fall back to params so deep links still work
  const name     = incomingInfo?.name     ?? route.params?.name     ?? 'Unknown';
  const phone    = incomingInfo?.phone    ?? route.params?.phone    ?? '';
  const initials = incomingInfo?.initials ?? route.params?.initials ?? (name.slice(0,2).toUpperCase());

  // If user lands here without an incoming call, auto-close
  useEffect(() => { if (!incoming) navigation.goBack(); }, [incoming, navigation]);

  const onAnswer = async () => {
    await answer();
    navigation.replace('OutgoingCall', { name, phone, initials });
  };

  const onDecline = async () => {
    if (callStatus !== 'Ended') {
      await hangup();
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/nativetalk1.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.status}>Incoming call</Text>

      <View style={styles.avatarWrap}>
        <Avatar name={initials} size={80} textStyle={{ color: colors.primary }} />
      </View>

      <Text style={styles.name}>{name}</Text>
      {!!phone && <Text style={styles.phone}>{phone}</Text>}
      <Text style={styles.location}>Lagos, Nigeria</Text>

      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={onDecline} activeOpacity={0.85} style={[styles.circleBtn, styles.decline]}>
          <Image source={require('../../../assets/endcall.png')} style={{ width: 65, height: 65 }} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onAnswer} activeOpacity={0.85} style={[styles.circleBtn, styles.answer]}>
          <Image source={require('../../../assets/call.png')} style={{ width: 65, height: 65 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 60 },
  logo:{ width:120, height:36, marginTop:38, marginBottom:6 },
  status:{ fontSize:18, color:'#111', marginBottom:16, marginTop:8 },
  avatarWrap:{ marginBottom:22, marginTop:6 },
  name:{ fontSize:28, fontWeight:'800', color:'#111', textAlign:'center' },
  phone:{ fontSize:18, color:'#111', marginTop:8 },
  location:{ fontSize:16, color:'#555', marginTop:8 },
  bottomRow:{
    position:'absolute', bottom:60, left:0, right:0,
    flexDirection:'row', justifyContent:'space-between', paddingHorizontal:40
  },

  circleBtn:{
    borderRadius:48, alignItems:'center', justifyContent:'center',
    shadowColor:'#000', shadowOpacity:0.15, shadowOffset:{width:0,height:4}, shadowRadius:8, elevation:4
  },
  decline:{ backgroundColor:'#ff2d2d' },
  answer:{ backgroundColor:'#33c124' },
});

export default IncomingCallScreen;
