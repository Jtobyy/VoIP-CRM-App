import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
const { LinphoneModule } = NativeModules;


type CallLog = {
  from: string;
  to: string;
  direction: 'incoming' | 'outgoing' | string;
  duration: number;        // seconds
  status: string;          // raw string from SDK
  startDate: string; 
  callId: string;
};

const emitter = new NativeEventEmitter(LinphoneModule);

export async function ensureMicPermission() {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export const init = (cfg?: any) => LinphoneModule.init(cfg);
export const register = (acc: { username: string; password: string; domain: string; transport?: 'udp'|'tcp'|'tls' }) => LinphoneModule.register(acc);
export const call = (uri: string) => LinphoneModule.call(uri);
export const answer = () => LinphoneModule.answer();
export const end = () => LinphoneModule.end();
export const hangup = () => LinphoneModule.end();
export const decline = (reason?: string) => LinphoneModule.decline?.(reason ?? 'declined');
export const mute = (on: boolean) => LinphoneModule.mute(on);
export const speaker = (on: boolean) => LinphoneModule.speaker(on);
export const sendDtmf = (d: string) => LinphoneModule.sendDtmf(d);
export const hold   = () => LinphoneModule.hold();
export const resume = () => LinphoneModule.resume();
export const setRegisterEnabled = (on:boolean) => LinphoneModule.setRegisterEnabled(on);
export const playKeyTone = (d: string) => LinphoneModule.playKeyTone(d);

export const getCallLogs = (): Promise<CallLog[]> => LinphoneModule.getCallLogs();


export const on = {
  RegistrationChanged: (cb: (e: any) => void) => emitter.addListener('RegistrationChanged', cb),
  CallIncoming:       (cb: (e: any) => void) => emitter.addListener('CallIncoming', cb),
  CallState:          (cb: (e: any) => void) => emitter.addListener('CallState', cb),
  CallEnded:          (cb: (e: any) => void) => emitter.addListener('CallEnded', cb),
};
