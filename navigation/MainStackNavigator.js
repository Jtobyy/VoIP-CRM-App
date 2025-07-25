// navigation/MainStackNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import RecentActivities from '../screens/home/RecentActivities';

const Stack = createNativeStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="RecentActivities" component={RecentActivities} />
      {/* Add other main app screens here */}
    </Stack.Navigator>
  );
};

export default MainStackNavigator;