import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import * as Lin from '../native/linphone';
import { navigate, replace } from '../navigation/RootNavigation';
import { queueIncoming, queueOutgoing } from '../navigation/RootNavigation';
import CallLogs from '../screens/shared/calls/CallLogs';


const CALL_STATE = {
  0: 'Idle',
  1: 'IncomingReceived',
  2: 'PushIncomingReceived',
  3: 'OutgoingInit',
  4: 'OutgoingProgress',
  5: 'OutgoingRinging',
  6: 'OutgoingEarlyMedia',
  7: 'Connected',
  8: 'StreamsRunning',
  9: 'Pausing',
  10: 'Paused',
  11: 'Resuming',
  12: 'Referred',
  13: 'Error',
  14: 'End',
  15: 'PausedByRemote',
  16: 'UpdatedByRemote',
  17: 'IncomingEarlyMedia',
  18: 'Updating',
  19: 'Released',
  20: 'EarlyUpdatedByRemote',
  21: 'EarlyUpdating',
};
const REG_STATE = { 0:'None', 1:'Progress', 2:'Ok', 3:'Cleared', 4:'Failed' };

const callStateName = (val) =>
  (typeof val === 'number' ? (CALL_STATE[val] || String(val)) : String(val || ''));

const regStateName = (val) =>
  (typeof val === 'number' ? (REG_STATE[val] || String(val)) : String(val || ''));


const SIP_CFG = {
  NAME: '100',
  USERNAME: '100',
  PASSWORD: 'Tesojueh2',
  DOMAIN: 'tesojueh481.dashboard.nativetalk.com.ng:5061',
  TRANSPORT: 'tcp',
  REG_TIMEOUT: 7200,
  PROXY: null,
  REG_SERVER: null,
};
const DIAL_CFG = { DOMAIN: SIP_CFG.DOMAIN };
const fmt = (s) => { s = Math.max(0, Math.floor(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
};

const CallCtx = createContext(null);

export function CallProvider({ children }) {
  // registration/call state
  const [registration, setRegistration] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle');
  const [incoming, setIncoming] = useState(false);
  const [incomingInfo, setIncomingInfo] = useState(null);

  // local audio toggles
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [held, setHeld] = useState(false);

  // duration timer
  const [durationSec, setDurationSec] = useState(0);
  const tickRef = useRef(null); 
  const startTsRef = useRef(null);
  const latestDurationRef = useRef(0);
  const [ending, setEnding] = useState(false);

  
  useEffect(() => { 
    latestDurationRef.current = durationSec; 
  }, [durationSec]);

  const clearTimer = useCallback(() => { 
    if (tickRef.current) clearInterval(tickRef.current); 
    tickRef.current = null; 
  }, []);

  const resetDuration = useCallback(() => { 
    clearTimer(); 
    startTsRef.current = null; 
    setDurationSec(0); 
  }, [clearTimer]);

  const startDuration = useCallback(() => {
    if (tickRef.current) return;
    startTsRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const sec = (Date.now() - startTsRef.current) / 1000;
      setDurationSec(sec);
    }, 500);
  }, []);

  // permissions (Android mic)
  const askMicPerm = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      { title: 'Microphone Permission', message: 'We need microphone access for calls.' }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  // init + register once
  useEffect(() => {
    (async () => {
      Lin.init();
      const ok = await askMicPerm(); if (!ok) { Alert.alert('Microphone permission denied'); return; }
      Lin.register({
        username: SIP_CFG.USERNAME,
        password: SIP_CFG.PASSWORD,
        domain:   SIP_CFG.DOMAIN,
        transport:SIP_CFG.TRANSPORT,
      });
    })();

    // events
    const subReg = Lin.on.RegistrationChanged((e) => {
      const pretty = regStateName(e?.state);
      setRegistration({ ...e, pretty });
      if (pretty.toLowerCase() === 'failed') {
        Alert.alert('Registration Failed', e?.message || 'Unknown');
      }
    });

    const parseSipUser = (s = '') => {
      const m = /sip:([^@;>]+)/i.exec(s);
      return m?.[1] || '';
    };

    const subIncoming = Lin.on.CallIncoming((e = {}) => {
      // Priority: displayName (not 'anonymous') -> username -> user parsed from uri -> 'Unknown'
      console.log('Incoming call dataa', e);

      const display = (e.displayName || '').trim();
      const user = (e.username || '').trim();
      const parsed = parseSipUser(e.uri || '');
      const phone =
        (display && display.toLowerCase() !== 'anonymous') ? display :
        (user || parsed || 'Unknown');
    
      const initials = (phone || '??').slice(0, 2).toUpperCase();
    
      setIncoming(true);
      setIncomingInfo({ name: phone, phone, initials });
      setCallStatus('Incoming');
      // navigate('IncomingCall', { name: phone, phone, initials });
      queueIncoming({ name: phone, phone, initials, callId: e?.callId });
    });

    const subState = Lin.on.CallState((e) => {
      const pretty = callStateName(e?.state);
      setCallStatus(pretty);
    
      // Hold/resume driven by native state
      if (pretty === 'Pausing' || pretty === 'Paused' || pretty === 'PausedByRemote') setHeld(true);
      if (pretty === 'Resuming' || pretty === 'Connected' || pretty === 'StreamsRunning') setHeld(false);
    
      // Start timer when media is flowing/connected
      if (pretty === 'Connected' || pretty === 'StreamsRunning') {
        setIncoming(false);
        startDuration();
      }
    
      // Freeze duration on end/error/released (no reset to 0)
      if (pretty === 'End' || pretty === 'Released' || pretty === 'Error') {
        clearTimer();                 // stop ticking, keep last value
        setIncoming(false);
        setIncomingInfo(null);
        setMuted(false); setSpeaker(false);
      }
    });

    const subEnd = Lin.on.CallEnded(() => {
      console.log("Call ended")
      clearTimer();
      setIncoming(false);
      setIncomingInfo(null);
      setMuted(false); setSpeaker(false);
    });

    return () => { subReg.remove(); subIncoming.remove(); subState.remove(); subEnd.remove(); clearTimer(); };
  }, [askMicPerm, clearTimer, resetDuration, startDuration]);

  // call controls
  const dial = useCallback(async (dest) => {
    resetDuration();
    if (!dest || dest.length < 1) { Alert.alert('Invalid Number'); return null; }
    const uri = dest.includes('@') ? (dest.startsWith('sip:') ? dest : `sip:${dest}`) : `sip:${dest}@${DIAL_CFG.DOMAIN}`;
    setCallStatus('Dialing…');
    Lin.call(uri);
    const initials = (dest || 'NA').substring(0,2).toUpperCase();
    navigate('OutgoingCall', { callId: Date.now().toString(), name: dest, phone: dest, location: 'Nigeria', initials });
    return null;
  }, [resetDuration]);

  const answer   = useCallback(async () => { 
    setIncoming(false); 
    setCallStatus('Answering…'); 
    resetDuration();
    Lin.answer(); 
  }, [resetDuration]);

  const hangup = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    try { Lin.end(); } finally {
      setTimeout(() => setEnding(false), 600);
    }
  }, [ending]);

  const decline   = useCallback(async () => { 
    setCallStatus('Declined…'); 
    Lin.decline('busy'); 
  });

  const toggleMute = useCallback(async () => {
    const next = !muted; setMuted(next);
    Lin.mute(next);
  }, [muted]);

  const toggleSpeaker = useCallback(async () => {
    const next = !speaker; setSpeaker(next);
    Lin.speaker(next);
  }, [speaker]);

  const toggleHold = useCallback(async () => {
    if (held) Lin.resume(); else Lin.hold();
  }, [held]);

  const sendDTMFActive = useCallback((d) => {
    if (!d) return;
    Lin.sendDtmf(String(d));
  }, []);

  // TODOs that need native APIs later (kept for API compatibility)
  const registerFn = useCallback(async () => {
    // Re-run registration with current cfg; useful if creds changed
    Lin.register({
      username: SIP_CFG.USERNAME,
      password: SIP_CFG.PASSWORD,
      domain:   SIP_CFG.DOMAIN,
      transport:SIP_CFG.TRANSPORT,
    });
  }, []);

  const unregister = useCallback(async () => {
    // disables registration on the default proxy
    Lin.setRegisterEnabled(false);
    Alert.alert('SIP', 'Unregistered (registerEnabled=false).');
  }, []);

  const value = {
    // config
    sipConfig: SIP_CFG, 
    dialConfig: DIAL_CFG,

    // state
    registration, callStatus, durationSec, formattedDuration: fmt(durationSec),

    incoming, incomingInfo,

    isMuted: muted,
    isSpeaker: speaker,
    isHeld: held,
    callLogs: Lin.getCallLogs(), 

    // controls
    register: registerFn, unregister,
    dial, answer, hangup, decline,
    toggleMute, toggleHold, toggleSpeaker,
    sendDTMFActive,
    Lin,
  };

  return <CallCtx.Provider value={value}>{children}</CallCtx.Provider>;
}

export default function useCall() {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error('useCall must be used inside <CallProvider/>');
  return ctx;
}
