import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../contexts/UserContext';
import {fetchUserInfo} from '../utils/FetchUserInfo';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';

const RootNavigator = () => {
  const {user, setUser} = useUser();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const loadedUser = await fetchUserInfo(setUser);
          if (!loadedUser) {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
          }
        }
      } catch (e) {
        // Ignore and fall back to auth flow
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

  return user ? <MainTabs /> : <AuthStack />;
};

export default RootNavigator;
