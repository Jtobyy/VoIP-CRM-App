import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { Endpoint, Call as PJSIPCall } from '@aldiand/react-native-pjsip';
import Sound from 'react-native-sound';
import { navigate, replace } from '../navigation/RootNavigation';



// ====== ALL CONFIG LIVES HERE ======
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
  const [incoming, setIncoming] = useState(false);          // <- drives the sheet
  const [incomingInfo, setIncomingInfo] = useState(null)

  // Duration
  const [durationSec, setDurationSec] = useState(0);
  const tickRef = useRef(null);
  const startTsRef = useRef(null);

  const isIncomingRef = useRef(false);
  const incomingShownRef = useRef(false);
  const endTonePlayedRef = useRef(false);
  const ringOutRef = useRef(null);
  const ringOutTimerRef = useRef(null);
  
  const endToneRef = useRef(null);
  const ringRef = useRef(null);
  const ringTimerRef = useRef(null);

  useEffect(() => {
    Sound.setCategory('Playback', true);
  
    // Load *end* tone once and keep a handle to it.
    const s = new Sound('end_ringtone.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) { console.warn('end tone load error', err); return; }
      endToneRef.current = s;
    });
  
    return () => {
      // Make sure no timers keep firing if this component unmounts.
      clearInterval(ringTimerRef.current);
      clearInterval(ringOutTimerRef.current);
      s.release();
    };
  }, []);

  useEffect(() => {
    Sound.setCategory('Playback', true);
  
    // Load *incoming* ringtone once, keep a handle for looping later.
    const s = new Sound('incoming_ringtone.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) { console.warn('Incoming ring load error', err); return; }
      ringRef.current = s;
    });
  
    return () => {
      clearInterval(ringTimerRef.current);
      s.release();
    };
  }, []);

  useEffect(() => {
    const s = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) { /* If no outbound file, stay silent */ return; }
      ringOutRef.current = s;
    });
    return () => {
      clearInterval(ringOutTimerRef.current);
      s.release?.();
    };
  }, []);

  const startIncomingRingtone = useCallback(() => {
    const s = ringRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0); s.play();
      const durSec = (typeof s.getDuration === 'function' ? s.getDuration() : 0) || 1.5;
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = setInterval(() => {
        try { s.stop(() => { s.setCurrentTime?.(0); s.play(); }); } catch {}
      }, Math.round(durSec * 1000) + 1500);
    } catch (e) { console.warn('startIncomingRingtone error', e); }
  }, []);
  
  const stopIncomingRingtone = useCallback(() => {
    const s = ringRef.current;
    clearInterval(ringTimerRef.current);
    if (!s) return;
    try {
      s.stop(() => {});
      s.setCurrentTime?.(0);
    } catch {}
  }, []);
  
  const startOutgoingRingback = useCallback(() => {
    const s = ringOutRef.current;
    if (!s) return;                 // if file isn't in bundle, do nothing
    try {
      s.setCurrentTime?.(0); s.play();
      const durSec = (typeof s.getDuration === 'function' ? s.getDuration() : 0) || 1.5;
      clearInterval(ringOutTimerRef.current);
      ringOutTimerRef.current = setInterval(() => {
        try { s.stop(() => { s.setCurrentTime?.(0); s.play(); }); } catch {}
      }, Math.round(durSec * 1000) + 1500);
    } catch {}
  }, []);

  const stopOutgoingRingback = useCallback(() => {
    const s = ringOutRef.current;
    clearInterval(ringOutTimerRef.current);
    if (!s) return;
    try { s.stop(() => {}); s.setCurrentTime?.(0); } catch {}
  }, []);

  const stopAllRingtones = useCallback(() => {
    stopIncomingRingtone();
    stopOutgoingRingback();
  }, [stopIncomingRingtone, stopOutgoingRingback]);

  // Plays the end tone exactly once per call lifecycle no matter how many "end" events arrive.
  const playEndToneOnce = useCallback(() => {
    if (endTonePlayedRef.current) return;
    endTonePlayedRef.current = true;
    const s = endToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0); s.play(() => {});
      setTimeout(() => { s.stop(() => {}); s.setCurrentTime?.(0); }, 1300);
    } catch {}
  }, []);

  const deriveIncomingInfo = useCallback((call) => {
  const name  = call?._remoteName || call?.remoteName || 'Unknown';
  const numberFromField = call?._remoteNumber || call?.remoteNumber || '';
  const uri  = call?._remoteUri || call?.remoteUri || ''; // e.g. "sip:anonymous@domain"
  const m = /sip:([^@;>]+)/i.exec(uri);
  const phone = numberFromField || (m?.[1] ?? '');
  const initials = (name || phone || '??').slice(0,2).toUpperCase();
    return { name, phone, initials };
  }, []);

  // --- helper: ensure the incoming sheet is shown only once per call ---
  const ensureIncomingSheet = useCallback((call) => {
    if (incomingShownRef.current) return;         // already shown for this call
    const info = deriveIncomingInfo(call);        // name/phone/initials
    setIncomingInfo(info);
    setIncoming(true);
    incomingShownRef.current = true;              // lock it
    navigate('IncomingCall', info);               // open the UI
  }, [deriveIncomingInfo]);

  // ---- boot endpoint once ----
  const startEndpoint = useCallback(async () => {
    if (_startPromise) return _startPromise;
    _startPromise = endpoint.start({
      codecs: {
        "PCMA/8000/1": 255, 
        "PCMU/8000/1": 254, 
        "opus/48000/2": 0,
        "G722/16000/1": 0, 
        "GSM/8000/1": 0, 
        "iLBC/8000/1": 0, 
        "speex/8000/1": 0, 
        "speex/16000/1": 0, 
        "speex/32000/1": 0, 
      },
    });
    const res = await _startPromise;
    console.log('Endpoint started', res);
    return res;
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
    console.log('Registering SIP account', SIP_CFG);
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
    resetDuration();

    isIncomingRef.current = false;  
    endTonePlayedRef.current = false; 
    incomingShownRef.current = false; 
    
    stopAllRingtones();
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
  }, [endpoint, account, resetDuration]);

  const answer  = useCallback(async (id) => {
    try {
      console.log('Answering call');

      endpoint.answerCall(currentCall, 200);
      console.warn('No answer method available');
    } catch (e) { console.warn('answer error', e); }
  }, [currentCall]);

  const hangup = useCallback(async () => {
    try {
        console.log('Hangin up ...'); 
        await endpoint.hangupCall(currentCall); 
        playEndToneOnce();

        resetDuration();
        return;
    } catch (e) { console.warn('hangup error', e); }
  }, [endpoint, currentCall, playEndToneOnce, resetDuration]);

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
          // console.log('unmuting call is ', currentCall)
          await endpoint.unMuteCall(currentCall)
      }
      else {
          // console.log('muting call is ', currentCall)
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
  const answerActive = useCallback(async () => {
    // Gets the active call id safely and answers it.
    // We also stop local ring immediately and (on iOS) activate the audio session so early media/voice can flow.
    const id = getActiveId();
    if (!id) return;
    try {
      stopAllRingtones();                         // stop local incoming/outgoing ring audio right away
      endpoint.activateAudioSession?.().catch(() => {}); // iOS: prepare audio route before answer
  
      // Prefer the static helper if present; else call the instance method
      if (PJSIPCall?.answer) {
        await PJSIPCall.answer(id, 200);          // send 200/OK to remote → remote stops ringing
      } else if (currentCall?.answer) {
        await currentCall.answer(200);
      } else if (endpoint?.answerCall) {
        // some builds expose answer on the endpoint
        await endpoint.answerCall(currentCall, 200);
      } else {
        console.warn('No answer method available');
      }
    } catch (e) {
      console.warn('answerActive error', e);
    }
  }, [getActiveId, currentCall, stopAllRingtones, endpoint]);

  const sendDTMFActive = useCallback(async (d) => {
    const id = getActiveId();
    if (id) await sendDTMF(id, d);
  }, [getActiveId, sendDTMF]);
  

  useEffect(() => {
    let subs = [];
    (async () => {
      await startEndpoint();
      if (!account) { try { await register(); } catch {} }
  
      // --- handlers (single funcs used by both iOS/Android event names) ---
      const onRegChanged = (acc) => {
        // acc may be Account or raw; be defensive:
        const reg = acc?.getRegistration?.().toJson?.() ?? acc?.registration ?? acc;
        console.log('registration account ', acc)
        console.log('registration ', reg)
        setRegistration(reg || null);
        if ((reg?.status === 'Failed') || (reg?.statusText === 'Failed')) {
          Alert.alert('Registration Failed', reg?.reason || reg?.statusText || 'Unknown');
        }
      };
  
      // --- called when native layer notifies a brand-new incoming session ---
      const onCallReceived = (call) => {
        isIncomingRef.current = true;          // direction is inbound
        endTonePlayedRef.current = false;      // allow end tone for this call
        incomingShownRef.current = false;      // UI sheet not shown yet for this call

        setCurrentCall(call);
        setCallStatus('Incoming');
        resetDuration();

        ensureIncomingSheet(call);             // <-- derive {name, phone} and navigate once
        startIncomingRingtone();               // start the in-app ringtone

        // iOS: prepare audio route so we can hear early media
        endpoint.activateAudioSession?.().catch(() => {});
      };

  
      const onCallChanged = (call) => {
        setCurrentCall(call);

        if (call?._state === 'PJSIP_INV_STATE_CONFIRMED') {
          stopAllRingtones();
          setCallStatus('In progress');
          startDuration();
          setIncoming(false);
        } else if (call?._state === 'PJSIP_INV_STATE_CONNECTING') {
          stopAllRingtones();
          setCallStatus('Connecting…');
        } else if (call?._state === 'PJSIP_INV_STATE_EARLY') {
          console.log('new call ringing, starting ringtone', call)
          const isIncoming = isIncomingRef.current || call?._remoteOfferer === 1;

          if (isIncoming) {
            ensureIncomingSheet(call);
            startIncomingRingtone();
            setCallStatus('Ringing…');
          } else {
            stopIncomingRingtone(); 
            startOutgoingRingback();
            setCallStatus('Ringing…');
          }
        } else {
          setCallStatus('Dialing...');
        }

        if (call?._state === 'PJSIP_INV_STATE_DISCONNECTED') {
          stopAllRingtones();
          playEndToneOnce();
          clearTimer();

          resetDuration();
          setIncoming(false);
          setIncomingInfo(null);

          incomingShownRef.current = false;
          isIncomingRef.current = false;
          endTonePlayedRef.current = false;
        }
      };
  
      const onCallTerminated = (call) => {
        stopAllRingtones();
        playEndToneOnce();
        setCallStatus('Ended');
        setCurrentCall(null);
        clearTimer();

        resetDuration();
        setIncoming(false);
        setIncomingInfo(null);
        incomingShownRef.current = false;
        isIncomingRef.current = false;
        endTonePlayedRef.current = false;
      };
  
      // --- subscribe to BOTH naming schemes ---
      subs = [
        // Registration
        endpoint.on('pjSipRegistrationChanged', onRegChanged),
        endpoint.on('registration_changed',     onRegChanged),
  
        // Incoming
        endpoint.on('pjSipCallReceived', onCallReceived),
        endpoint.on('incoming_call',     onCallReceived),
  
        // State changes
        endpoint.on('pjSipCallChanged',  onCallChanged),
        endpoint.on('call_changed',      onCallChanged),
  
        // Terminated
        endpoint.on('pjSipCallTerminated', onCallTerminated),
        endpoint.on('call_terminated',     onCallTerminated),
      ];
    })();
  
    return () => subs.forEach(s => { try { s?.remove?.(); } catch {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const value = {
    // Expose read-only config
    sipConfig: SIP_CFG,
    dialConfig: DIAL_CFG,

    // SIP/account
    account, registration,
    register, unregister,

    // Call state
    currentCall, callStatus, durationSec, formattedDuration: fmt(durationSec),
    incoming, incomingInfo,
    activeCallId, // in case a screen still wants the raw id

    // Controls (id-based)
    dial, answer, hangup, sendDTMF,
    toggleMute, toggleHold, toggleSpeaker,

    // Controls (id-less; preferred in UI)
    answerActive, sendDTMFActive,
  };

  return <CallCtx.Provider value={value}>{children}</CallCtx.Provider>;
}

export default function useCall() {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error('useCall must be used inside <CallProvider/>');
  return ctx;
}
