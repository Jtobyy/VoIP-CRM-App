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

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setNavReady(true);
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