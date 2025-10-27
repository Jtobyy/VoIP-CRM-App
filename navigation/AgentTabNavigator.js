// navigation/AgentTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { SafeAreaView } from 'react-native'; 
import AgentDashboard from '../screens/agent/home/Dashboard';
import CustomersList from '../screens/shared/customers/CustomersList';
import MessagesList from '../screens/shared/messages/MessagesList';
import { colors } from '../styles/global';
import CallLogs from '../screens/shared/calls/CallLogs';
import More from '../screens/agent/more/More';


const Tab = createBottomTabNavigator();

const AgentTabNavigator = () => {
  const TAB_ICON_SIZE = 20;

  return (
    <SafeAreaView style = {{flex:1}}>
       <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // Your primary color
        tabBarInactiveTintColor: '#B3BFD1', // Fixed the duplicate color
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          paddingTop: 10,
          paddingBottom: 15,
          paddingHorizontal: 10,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={AgentDashboard}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" iconStyle='solid' size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Call logs" 
        component={CallLogs}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="phone" iconStyle='solid' size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersList}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="users" iconStyle='solid' size={TAB_ICON_SIZE}  color={color} />

          ),
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesList}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="comment-dots" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="More" 
        component={More}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="rectangle-list" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    </SafeAreaView>
  );
};

export default AgentTabNavigator;