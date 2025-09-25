// Global navigation helpers usable from anywhere (e.g., hooks)
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let navReady = false;
let authReady = false;
let isAuthenticated = false;
let userRole = null;

export function setNavReady(ready) {
  navReady = ready; tryFlush();
}
export function setAuthState({ ready, authed, role }) {
  authReady = ready;
  isAuthenticated = !!authed;
  userRole = role || null;
  tryFlush();
}

let pending = null; 

export function queueIncoming(params) {
  pending = { kind: 'incoming', params, callId: params?.callId || Date.now().toString() };
  tryFlush();
}

export function queueOutgoing(params) {
  pending = { kind: 'outgoing', params, callId: params?.callId || Date.now().toString() };
  tryFlush();
}

function tryFlush() {
  if (!pending) return;
  if (!navReady || !authReady || !isAuthenticated || !navigationRef.isReady()) return;

  const stack = userRole?.toLowerCase() === 'admin' ? 'AdminStack' : 'AgentStack';
  const leaf  = pending.kind === 'incoming' ? 'IncomingCall' : 'OutgoingCall';

  const action = CommonActions.navigate({
    name: stack,
    params: { screen: leaf, params: pending.params },
  });

  navigationRef.dispatch(action);
  pending = null; // clear after success
}

export function navigate(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}

export const replace = (name, params) => {
  if (!navigationRef.isReady()) return;
  const nav = navigationRef;
  try {
    nav.dispatch({
      ...nav.getCurrentRoute(), 
      type: 'REPLACE',
      payload: { name, params },
      source: nav.getCurrentRoute()?.key,
      target: nav.getState()?.key,
    });
  } catch {
    nav.navigate(name, params);
  }
};

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
}
