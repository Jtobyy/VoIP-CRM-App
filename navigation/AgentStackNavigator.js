// navigation/AgentStackNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AgentTabNavigator from './AgentTabNavigator';
import RecentActivities from '../screens/agent/home/RecentActivities';
import ConversationScreen from '../screens/shared/messages/ConversationScreen';
import ConnectChannels from '../screens/shared/messages/ConnectChannels';
import AddCustomer from '../screens/shared/customers/AddCustomer';
import CustomerDetails from '../screens/shared/customers/CustomerDetails';
import AddUser from '../screens/shared/more/AddUser';
import UsersList from '../screens/shared/more/UserList';
import DialerScreen from '../screens/shared/home/Dialer';

const Stack = createNativeStackNavigator();

const AgentStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AgentTabNavigator} />
      <Stack.Screen name="RecentActivities" component={RecentActivities} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="ConnectChannels" component={ConnectChannels} />

      <Stack.Screen name="AddCustomer" component={AddCustomer} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />

      <Stack.Screen name="Users" component={UsersList} />
      <Stack.Screen name="AddUser" component={AddUser} />
      <Stack.Screen name="Dialer" component={DialerScreen} />

    </Stack.Navigator>
  );
};

export default AgentStackNavigator;