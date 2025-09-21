import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import * as Lin from '../../../native/linphone';

const mapStrToCode: Record<string, number> = {
  none: 0, progress: 1, ok: 2, cleared: 3, failed: 4
};

function normalizeRegState(s: any) {
  if (typeof s === 'number') return s;
  if (typeof s === 'string') return mapStrToCode[s.toLowerCase()] ?? -1;
  return -1;
}

export default function CallTest() {
  const [to, setTo] = useState('101');
  const [registered, setRegistered] = useState(false);
  const [regState, setRegState] = useState<number | null>(null);
  const [regMsg, setRegMsg] = useState<string>('');
  const [state, setState] = useState('Idle');

  const DOMAIN = 'tesojueh481.dashboard.nativetalk.com.ng:5061';

  useEffect(() => {
    Lin.init();
    Lin.register({ username: '100', password: 'Tesojueh2', domain: DOMAIN, transport: 'tcp' });

    const sub1 = Lin.on.RegistrationChanged((e: any) => {
      const code = normalizeRegState(e?.state);
      setRegState(code);
      setRegMsg(e?.message || '');
      setRegistered(code === 2);
    });
    const sub2 = Lin.on.CallState((e: any) => setState(String(e?.state)));
    const sub3 = Lin.on.CallIncoming(({ from }: any) => setState(`Incoming from ${from || ''}`));
    const sub4 = Lin.on.CallEnded(() => setState('Ended'));

    return () => { sub1.remove(); sub2.remove(); sub3.remove(); sub4.remove(); };
  }, []);

  const dial = () => {
    const uri = to.includes('@') ? (to.startsWith('sip:') ? to : `sip:${to}`) : `sip:${to}@${DOMAIN}`;
    Lin.call(uri);
  };

  const prettyReg =
    regState === null ? '—' :
    regState === 0 ? 'None' :
    regState === 1 ? 'Progress…' :
    regState === 2 ? 'Ok ✅' :
    regState === 3 ? 'Cleared' :
    regState === 4 ? 'Failed ❌' : String(regState);

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text>Registration: {prettyReg}</Text>
      {!!regMsg && <Text style={{ opacity: 0.7 }}>Last message: {regMsg}</Text>}
      <Text>Registered: {registered ? 'Yes' : 'No'}</Text>
      <Text>Call State: {state}</Text>

      <TextInput value={to} onChangeText={setTo} placeholder="Ext or sip:uri"
                 style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Call" onPress={dial} />
      <Button title="Answer" onPress={Lin.answer} />
      <Button title="Hangup" onPress={Lin.hangup} />
      <Button title="Mute" onPress={() => Lin.mute(true)} />
      <Button title="Unmute" onPress={() => Lin.mute(false)} />
      <Button title="Speaker On" onPress={() => Lin.speaker(true)} />
      <Button title="Speaker Off" onPress={() => Lin.speaker(false)} />
    </View>
  );
}
