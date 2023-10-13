import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { styles } from '../styles';
import { useUser } from '../contexts/UserContext';

const UserProfile = ({ navigation }) => {
  // Replace the below object with actual user data fetched from the backend.
  const { user, setUser } = useUser();
  console.log("BALUT", user)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={localStyles.userInfo}>Name: {user.name}</Text>
      <Text style={localStyles.userInfo}>Email: {user.email}</Text>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('Documents')}>
        <Text style={styles.buttonText}>View Documents</Text>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  userInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
});

export default UserProfile;
