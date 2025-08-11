import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { Endpoint, Call as PJSIPCall } from '@aldiand/react-native-pjsip';
import Sound from 'react-native-sound';


// ====== ALL CONFIG LIVES HERE ======
const SIP_CFG = {
  NAME: '100',
  USERNAME: '100',
  PASSWORD: 'dQ7uR5PE',
  DOMAIN: 'nativetalkdemo383.dashboard.nativetalk.com.ng:5061', // you confirmed this works for your stack
  TRANSPORT: 'udp',
  REG_TIMEOUT: 7200,
  PROXY: null,
  REG_SERVER: null,
};

const DIAL_CFG = {
  DOMAIN: SIP_CFG.DOMAIN,
};

// ====== internal helpers ======
// const CALL_LABEL = {
//   PJSIP_INV_STATE_NULL: 'Idle',
//   PJSIP_INV_STATE_CALLING: 'Calling…',
//   PJSIP_INV_STATE_INCOMING: 'Incoming',
//   PJSIP_INV_STATE_EARLY: 'Ringing…',
//   PJSIP_INV_STATE_CONNECTING: 'Connecting…',
//   PJSIP_INV_STATE_CONFIRMED: 'Connected',
//   PJSIP_INV_STATE_DISCONNECTED: 'Ended',
// };

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
};

// Singleton Endpoint so we never boot multiple stacks
let _endpoint = null;
let _startPromise = null;
const getEndpoint = () => (_endpoint ??= new Endpoint());

const CallCtx = createContext(null);

export function CallProvider({ children }) {
  const endpoint = useMemo(getEndpoint, []);

  // SIP/account
  const [account, setAccount] = useState(null);
  const [registration, setRegistration] = useState(null);

  // Call state
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle');

  // Duration
  const [durationSec, setDurationSec] = useState(0);
  const tickRef = useRef(null);
  const startTsRef = useRef(null);

  const endToneRef = useRef(null);

  useEffect(() => {
    Sound.setCategory('Playback', true);
    const s = new Sound('end-ringtone.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) { console.warn('end tone load error', err); return; }
      endToneRef.current = s;
    });
    return () => s.release();
  }, []);
  
  const playEndTone = useCallback(() => {
    const s = endToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0);
      s.play(() => {}); // fire-and-forget
      setTimeout(() => { s.stop(() => {}); s.setCurrentTime?.(0); }, 1300);
    } catch (e) {
      console.warn('playEndTone error', e);
    }
  }, []);

  // ---- boot endpoint once ----
  const startEndpoint = useCallback(async () => {
    if (_startPromise) return _startPromise;
    _startPromise = endpoint.start();
    await _startPromise;
    return _startPromise;
  }, [endpoint]);

  // ---- permissions (Android mic) ----
  const askMicPerm = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      { title: 'Microphone Permission', message: 'We need microphone access for calls.' }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  // ---- duration helpers ----
  const clearTimer = useCallback(() => { if (tickRef.current) clearInterval(tickRef.current); tickRef.current = null; }, []);
  const resetDuration = useCallback(() => { clearTimer(); startTsRef.current = null; setDurationSec(0); }, [clearTimer]);
  const startDuration = useCallback(() => {
    if (tickRef.current) return;
    startTsRef.current = Date.now();
    tickRef.current = setInterval(() => setDurationSec((Date.now() - startTsRef.current) / 1000), 500);
  }, []);

  // ---- register/unregister (uses hardcoded config) ----
  const register = useCallback(async () => {
    await startEndpoint();
    const ok = await askMicPerm(); if (!ok) throw new Error('Microphone permission denied');

    const cfg = {
      name:      SIP_CFG.NAME,
      username:  SIP_CFG.USERNAME,
      domain:    SIP_CFG.DOMAIN, // keeping your working value
      password:  SIP_CFG.PASSWORD,
      proxy:     SIP_CFG.PROXY,
      regServer: SIP_CFG.REG_SERVER,
      transport: SIP_CFG.TRANSPORT,
      regTimeout:SIP_CFG.REG_TIMEOUT,
    };

    try {
      const acc = await endpoint.createAccount(cfg);
      setAccount(acc);
      setRegistration(acc?.registration || null);
      console.log('SIP registered', acc);
      return acc;
    } catch (err) {
      console.error('SIP register error', err);
      Alert.alert('SIP Login Error', err?.message || 'Failed to register SIP account.');
      throw err;
    }
  }, [endpoint, startEndpoint, askMicPerm]);

  const unregister = useCallback(async () => {
    try { if (account?.id) await endpoint.deleteAccount(account); } catch {}
    setAccount(null); setRegistration(null);
  }, [endpoint, account]);

  // --- Resolve the call id safely across forks/fields ---
  const getCallId = useCallback(
    (c) => c?.id ?? c?.callId ?? c?.call_id ?? c?._id ?? c?.pjsipId ?? null,
    []
  );
  const getActiveId = useCallback(() => getCallId(currentCall), [currentCall, getCallId]);

  // ---- call controls (with fallbacks) ----
  const dial = useCallback(async (dest) => {
    if (!account) { Alert.alert('SIP not registered', 'Please wait for registration'); return null; }
    if (!dest || dest.length < 3) { Alert.alert('Invalid Number', 'Enter a valid phone number'); return null; }

    const sipUri = dest.includes('@')
      ? (dest.startsWith('sip:') ? dest : `sip:${dest}`)
      : `sip:${dest}@${DIAL_CFG.DOMAIN}`;

    console.log('Dialing... ', sipUri);
    setCallStatus('Dialing...')
    const call = await endpoint.makeCall(account, sipUri, {});

    setCurrentCall(call);
    console.log('Call initially made', call);
    return call;
  }, [endpoint, account]);

  const answer  = useCallback(async (id) => {
    try {
      if (PJSIPCall?.answer) return await PJSIPCall.answer(id, 200);
      if (currentCall?.answer) return await currentCall.answer(200);
      console.warn('No answer method available');
    } catch (e) { console.warn('answer error', e); }
  }, [currentCall]);

  const decline = useCallback(async (id, code=486) => {
    try {
      if (PJSIPCall?.decline) return await PJSIPCall.decline(id, code);
      if (currentCall?.decline) return await currentCall.decline(code);
      console.warn('No decline method available');
    } catch (e) { console.warn('decline error', e); }
  }, [currentCall]);

  const hangup  = useCallback(async () => {
    try {
        console.log('Hangin up ...'); 
        await endpoint.hangupCall(currentCall); 
        playEndTone();

        return;
    } catch (e) { console.warn('hangup error', e); }
  }, [endpoint, currentCall]);

  const toggleHold = useCallback(async (id) => {
    try {
      if (currentCall?._held) {
          await endpoint.unholdCall(currentCall)
      }
      else {
          await endpoint.holdCall(currentCall);
      }
      return;
  } catch (e) { console.warn('hold/unhold error', e); }
  }, [endpoint, currentCall]);

  const toggleSpeaker = useCallback(async () => {    
    try {
        if (currentCall?._speaker) {
            await endpoint.useEarpiece(currentCall)
        }
        else {
            await endpoint.useSpeaker(currentCall);
        }
        return;
    } catch (e) { 
        console.error('toggleSpeaker error', e); 
    }
  }, [endpoint, currentCall]);

  const toggleMute = useCallback(async () => {
    try {
      if (currentCall?._muted) {
          console.log('unmuting call is ', currentCall)
          await endpoint.unMuteCall(currentCall)
      }
      else {
          console.log('muting call is ', currentCall)
          await endpoint.muteCall(currentCall);
      }
      return;
    } catch (e) { 
        console.warn('mute/unmute error', e);
    }
  }, [endpoint, currentCall]);

  const sendDTMF = useCallback(async (id, digits) => {
    try {
      if (!digits) return;
      if (PJSIPCall?.dtmf) return await PJSIPCall.dtmf(id, String(digits));
      if (currentCall?.sendDtmf) return await currentCall.sendDtmf(String(digits));
      if (endpoint?.sendDTMF) return await endpoint.sendDTMF(id, String(digits));
      console.warn('No DTMF method available');
    } catch (e) { console.warn('dtmf error', e); }
  }, [endpoint, currentCall]);

  // ---- id-less helpers for active call (recommended for UI) ----
  const activeCallId = useMemo(() => getActiveId(), [getActiveId]);
  const answerActive        = useCallback(async () => { const id = getActiveId(); if (id) await answer(id); }, [getActiveId, answer]);
  const declineActive       = useCallback(async (code) => { const id = getActiveId(); if (id) await decline(id, code); }, [getActiveId, decline]);

  const sendDTMFActive      = useCallback(async (d) => { const id = getActiveId(); if (id) await sendDTMF(id, d); }, [getActiveId, sendDTMF]);

  // ---- boot + listeners ONCE; auto-register with hardcoded config ----
  useEffect(() => {
    let subs = [];
    (async () => {
      await startEndpoint();
      if (!account) { try { await register(); } catch {} }

      subs = [
        endpoint.on('registration_changed', (acc) => {
          console.log("registration changed", acc)
          setRegistration(acc?.registration || null);
          if (acc?.registration?.status === 'Failed') {
            Alert.alert('Registration Failed', acc.registration.reason || 'Unknown');
          }
        }),
        endpoint.on('incoming_call', (call) => {
          console.log('call is incoming')
          setCurrentCall(call);
          setCallStatus('Incoming');
          resetDuration();
        }),
        endpoint.on('call_changed', (call) => {
          console.log('call changed to ', call)
          if (call._state == "PJSIP_INV_STATE_CONFIRMED") {
            setCallStatus('In progress');
            startDuration()

            console.log("call is now outgoing")
            return
          }

          setCurrentCall(call);
          setCallStatus('Dialing...');
          if (call.state === 'PJSIP_INV_STATE_DISCONNECTED') clearTimer();
        }),
        endpoint.on('call_terminated', (call) => {
          setCallStatus('Ended');
          setCurrentCall(null);
          clearTimer();
        }),
      ];
    })();

    return () => subs.forEach(s => { try { s?.remove?.(); } catch {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const value = {
    // Expose read-only config
    sipConfig: SIP_CFG,
    dialConfig: DIAL_CFG,

    // SIP/account
    account, registration,
    register, unregister,

    // Call state
    currentCall, callStatus, durationSec, formattedDuration: fmt(durationSec),
    activeCallId, // in case a screen still wants the raw id

    // Controls (id-based)
    dial, answer, decline, hangup, sendDTMF,
    toggleMute, toggleHold, toggleSpeaker,

    // Controls (id-less; preferred in UI)
    answerActive, declineActive, sendDTMFActive,
  };

  return <CallCtx.Provider value={value}>{children}</CallCtx.Provider>;
}

export default function useCall() {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error('useCall must be used inside <CallProvider/>');
  return ctx;
}
