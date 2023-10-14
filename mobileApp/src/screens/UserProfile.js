import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { styles as globalStyles } from '../styles';
import { useUser } from '../contexts/UserContext';

const UserProfile = ({ navigation }) => {
  // Replace the below object with actual user data fetched from the backend.
  // const { user, setUser } = useUser();
  const { user }  = useUser();
  // console.log("BALUT", user)emre

  return (
    <View style={styles.container}>
      
      {/* App Logo */}
      <Image source={require('../assets/mayaLogo.png')} style={styles.logo} />

      {/* User Profile Info */}
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.userInfo}>Name: {user.username}</Text>
      <Text style={styles.userInfo}>Email: {user.email}</Text>

      {/* View Documents Button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Documents')}>
        <Text style={styles.buttonText}>View Documents</Text>
      </TouchableOpacity>

      {/* Floating Action Button for Document Actions */}
      {/* You can replace this with an actual icon or another component that displays a '+' sign or something similar. */}
      <TouchableOpacity style={styles.fab} onPress="">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20
  },
  title: {
    ...globalStyles.title,
    fontSize: 24,
    marginVertical: 10
  },
  userInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10
  },
  button: {
    ...globalStyles.buttonContainer,
    marginVertical: 20
  },
  buttonText: {
    ...globalStyles.buttonText
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fabText: {
    color: '#FFF',
    fontSize: 24
  }
});

export default UserProfile;
