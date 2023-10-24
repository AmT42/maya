import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import UserProfile from './screens/UserProfile';
import DocumentScreen from './screens/DocumentScreen';
import DocumentImageList from './screens/DocumentImageList';
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Documents" component={DocumentScreen} />
      <Stack.Screen name="DocumentImageList" component={DocumentImageList} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
