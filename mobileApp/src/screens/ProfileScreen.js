import React from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {useUser} from '../contexts/UserContext';
import {useTheme} from '../theme/theme';
import {logout} from '../services/authService';

const ProfileScreen = ({navigation}) => {
  const theme = useTheme();
  const {user, setUser} = useUser();

  const signOut = async () => {
    Alert.alert('Sign out', 'Disconnect from Maya?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout({setUser});
        },
      },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Profile
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {color: theme.colors.textSecondary},
            ]}>
            Sign in to sync & search
          </Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={[styles.guestTitle, {color: theme.colors.text}]}>
              You’re in guest mode
            </Text>
            <Text
              style={[styles.guestSubtitle, {color: theme.colors.textSecondary}]}>
              Scan instantly. Sign in when you want your library, search, and
              multi-device sync.
            </Text>
            <Button
              title="Sign in"
              icon="log-in-outline"
              onPress={() => navigation.navigate('Auth')}
              style={{marginTop: 14}}
            />
          </Card>

          <Pressable style={{marginTop: 14}} onPress={() => {}}>
            <Text style={[styles.smallPrint, {color: theme.colors.muted}]}>
              Maya • vNext UI
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Profile
        </Text>
        <Text
          style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
          Your account and settings
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Icon name="person" size={20} color={theme.colors.accent} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[styles.name, {color: theme.colors.text}]}
                numberOfLines={1}>
                {user?.username || '—'}
              </Text>
              <Text
                style={[styles.email, {color: theme.colors.textSecondary}]}
                numberOfLines={1}>
                {user?.email || '—'}
              </Text>
            </View>
            <Image
              source={require('../assets/mayaLogo.png')}
              style={styles.badge}
            />
          </View>
        </Card>

        <Button
          title="Sign out"
          variant="secondary"
          icon="log-out-outline"
          onPress={signOut}
        />
        <Pressable style={{marginTop: 14}} onPress={() => {}}>
          <Text style={[styles.smallPrint, {color: theme.colors.muted}]}>
            Maya • vNext UI
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 14,
  },
  card: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  guestSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    opacity: 0.9,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  smallPrint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ProfileScreen;
