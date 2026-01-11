import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../contexts/UserContext';
import {fetchUserInfo} from '../utils/FetchUserInfo';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const {user, setUser} = useUser();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          await fetchUserInfo(setUser);
        }
      } catch (e) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  if (bootstrapping) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Auth"
        component={AuthStack}
        options={{presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
