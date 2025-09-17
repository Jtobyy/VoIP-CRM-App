// Global navigation helpers usable from anywhere (e.g., hooks)
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

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
