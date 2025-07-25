// navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import AdminDashboard from '../screens/home/Dashboard';
import ManageCustomers from '../screens/customers/ManageCustomers';
import MessagesScreen from '../screens/messages/MessageList';
import AccountManagement from '../screens/account/AccountManagement';
// import CallLogsScreen from '../screens/calls/CallLogs'; // Add this screen
import { colors } from '../styles/global';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // Your primary color
        tabBarInactiveTintColor: '#B3BFD1', // Fixed the duplicate color
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={AdminDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen 
        name="Call logs" 
        component={CallLogsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="phone" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen 
        name="Customers" 
        component={ManageCustomers}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="mail-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountManagement}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;