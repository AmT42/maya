import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Pressable, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FilesScreen from '../screens/FilesScreen';
import ScanScreen from '../screens/ScanScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {useTheme} from '../theme/theme';

const Tab = createBottomTabNavigator();

const ScanTabButton = ({onPress, accessibilityState}) => {
  const theme = useTheme();
  const selected = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      onPress={onPress}
      style={styles.scanButtonWrap}
      accessibilityRole="button">
      <View
        style={[
          styles.scanButton,
          {
            backgroundColor: theme.colors.accent,
            shadowColor: theme.colors.shadow,
            transform: [{scale: selected ? 1.02 : 1}],
          },
        ]}>
        <Icon name="scan-outline" size={22} color="#001018" />
      </View>
    </Pressable>
  );
};

const MainTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Scan"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            bottom: Math.max(12, insets.bottom + 8),
          },
        ],
      }}>
      <Tab.Screen
        name="Files"
        component={FilesScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <Icon
              name={focused ? 'folder-open' : 'folder-outline'}
              size={20}
              color={focused ? theme.colors.accent : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <Icon
              name={focused ? 'search' : 'search-outline'}
              size={20}
              color={focused ? theme.colors.accent : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarButton: props => <ScanTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              size={20}
              color={focused ? theme.colors.accent : theme.colors.textSecondary}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    height: 64,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  scanButtonWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
});

export default MainTabs;
