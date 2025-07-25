import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from '../screens/auth/Welcome';
import Login from '../screens/auth/Login';
import PersonalInfo from '../screens/auth/PersonalInfo';
import OTPVerification from '../screens/auth/OTPVerification';
import CreatePassword from '../screens/auth/CreatePassword';
import AccountCreated from '../screens/auth/AccountCreated';
import PasswordChanged from '../screens/auth/PasswordChanged';
import CreateNewPassword from '../screens/auth/CreateNewPassword';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen 
        name="PersonalInfo" 
        component={PersonalInfo}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="OTPVerification" component={OTPVerification} />
      <Stack.Screen name="CreatePassword" component={CreatePassword} />
      <Stack.Screen name="ForgotPassword" component={CreateNewPassword} />
      <Stack.Screen 
        name="AccountCreated" 
        component={AccountCreated}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="PasswordChanged" component={PasswordChanged} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;