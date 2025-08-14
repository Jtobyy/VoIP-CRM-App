import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import AdminStackNavigator from './AdminStackNavigator';
import { useAuth } from '../hooks/useAuth';
import AgentStackNavigator from './AgentStackNavigator';

const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
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