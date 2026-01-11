import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/AppNavigator';
import {UserProvider} from './src/contexts/UserContext';
import {ThemeProvider} from './src/theme/theme';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from './src/config/googleConfig';

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
