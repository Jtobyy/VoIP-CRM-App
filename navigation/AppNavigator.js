import React, {useRef, useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import AdminStackNavigator from './AdminStackNavigator';
import { useAuth } from '../hooks/useAuth';
import AgentStackNavigator from './AgentStackNavigator';
import { trackScreen } from '../firebase/analytics';
import { navigationRef } from './RootNavigation';
import { setNavReady, setAuthState } from './RootNavigation';
import { flushPendingNotification, attachForegroundHandler, attachNotificationPressHandler, attachFcmOpenHandlers, handleInitialNotification } from '../firebase/notification';
import { initFcm } from '../firebase/fcm';


const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const routeNameRef = useRef();

  useEffect(() => {
    setAuthState({
      ready: !loading,
      authed: isAuthenticated,
      role: isAuthenticated ? (user?.roles?.some(r => r.toLowerCase() === 'admin') ? 'admin' : 'agent') : null,
    });
  }, [loading, isAuthenticated, user]);

  useEffect(() => {
    // Start FCM (don’t prompt here unless this effect follows a user gesture)
    const teardownList = [];

    (async () => {
      const unsubTok = await initFcm({ prompt: true }); // prompt later from a user action if you want
      if (unsubTok) teardownList.push(unsubTok);

      // Foreground messages -> show local banner
      const unsubFg = attachForegroundHandler();
      teardownList.push(unsubFg);

      // Tap on system notification (FCM) from background
      const unsubOpen = attachFcmOpenHandlers();
      teardownList.push(unsubOpen);

      // Tap on local (Notifee) notification when app is foreground/background
      const unsubPress = attachNotificationPressHandler();
      teardownList.push(unsubPress);

      // If app was launched by a notification (killed state), handle it
      await handleInitialNotification();
    })();

    return () => teardownList.forEach(fn => { try { fn(); } catch {} });
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setNavReady(true);

        console.log('flushing pending notification');
        flushPendingNotification();

        const name = navigationRef.current?.getCurrentRoute?.()?.name;
        routeNameRef.current = name;
        if (name) trackScreen(name);
      }}
      onStateChange={async () => {
        const prev = routeNameRef.current;
        const curr = navigationRef.current?.getCurrentRoute?.()?.name;
        if (curr && prev !== curr) {
          routeNameRef.current = curr;
          await trackScreen(curr);
        }
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        ) : user.roles?.some(r => r.toLowerCase() === 'admin') ? (
          <RootStack.Screen name="AdminStack" component={AdminStackNavigator} />
        ) : (
          <RootStack.Screen name="AgentStack" component={AgentStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;