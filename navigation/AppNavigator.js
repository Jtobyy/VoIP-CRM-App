import React,{useRef} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import AdminStackNavigator from './AdminStackNavigator';
import { useAuth } from '../hooks/useAuth';
import AgentStackNavigator from './AgentStackNavigator';
import { trackScreen } from '../firebase/analytics';

const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  // refs to keep track of navigation state
    const navRef = useRef(null);
    const routeNameRef = useRef();

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => {
        const name = navRef.current?.getCurrentRoute?.()?.name;
        routeNameRef.current = name;
        if (name) trackScreen(name); // log first screen
      }}
      onStateChange={async () => {
        const prev = routeNameRef.current;
        const curr = navRef.current?.getCurrentRoute?.()?.name;
        if (curr && prev !== curr) {
          routeNameRef.current = curr;
          await trackScreen(curr); // log subsequent screens
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