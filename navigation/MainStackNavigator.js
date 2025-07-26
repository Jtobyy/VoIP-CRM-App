// navigation/MainStackNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import RecentActivities from '../screens/home/RecentActivities';
import ConversationScreen from '../screens/messages/ConversationScreen';
import ConnectChannels from '../screens/messages/ConnectChannels';
import AddCustomer from '../screens/customers/AddCustomer';
import CustomerDetails from '../screens/customers/CustomerDetails';

const Stack = createNativeStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="RecentActivities" component={RecentActivities} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="ConnectChannels" component={ConnectChannels} />
      <Stack.Screen name="AddCustomer" component={AddCustomer} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />

      {/* Add other main app screens here */}
    </Stack.Navigator>
  );
};

export default MainStackNavigator;