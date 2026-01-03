import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import {UserProvider} from './src/contexts/UserContext';
import {ThemeProvider} from './src/theme/theme';

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
