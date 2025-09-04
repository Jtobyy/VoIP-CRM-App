// navigation/AdminStackNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminTabNavigator from './AdminTabNavigator';
import RecentActivities from '../screens/admin/home/RecentActivities';
import ConversationScreen from '../screens/shared/messages/ConversationScreen';
import ConnectChannels from '../screens/shared/messages/ConnectChannels';
import AddCustomer from '../screens/shared/customers/AddCustomer';
import CustomerDetails from '../screens/shared/customers/CustomerDetails';
import AddUser from '../screens/shared/more/AddUser';
import UsersList from '../screens/shared/more/UserList';
import DialerScreen from '../screens/shared/home/Dialer';
import OutgoingCallScreen from '../screens/shared/calls/OutgoingCall';
import EditCustomer from '../screens/shared/customers/EditCustomer';
import EditProfile from '../screens/shared/more/EditProfile';
import UserDetails from '../screens/shared/more/UserDetails';
import EditUser from '../screens/shared/more/EditUser';
import Notifications from '../screens/shared/notifications/Notification';
import AddFunds from '../screens/shared/more/AddFunds';
import PaystackCheckout from '../screens/shared/more/PaystackCheckout';

const Stack = createNativeStackNavigator();

const AdminStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AdminTabNavigator} />
      <Stack.Screen name="RecentActivities" component={RecentActivities} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="ConnectChannels" component={ConnectChannels} />

      <Stack.Screen name="AddCustomer" component={AddCustomer} />
      <Stack.Screen name="EditCustomer" component={EditCustomer} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />

      <Stack.Screen name="Users" component={UsersList} />
      <Stack.Screen name="UserDetails" component={UserDetails} />
      <Stack.Screen name="AddUser" component={AddUser} />
      <Stack.Screen name="Dialer" component={DialerScreen} />
      <Stack.Screen name="OutgoingCall" component={OutgoingCallScreen} />

      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="EditUser" component={EditUser} />

       <Stack.Screen name="Notifications" component={Notifications} />

       <Stack.Screen name="AddFunds" component={AddFunds} />
       <Stack.Screen name="PaystackCheckout" component={PaystackCheckout} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;