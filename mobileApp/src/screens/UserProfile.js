import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { styles as globalStyles } from '../styles';
import { useUser } from '../contexts/UserContext';
import  AddNewDoc  from '../components/AddNewDoc'

const UserProfile = ({ navigation }) => {
  // Replace the below object with actual user data fetched from the backend.
  // const { user, setUser } = useUser();
  const { user }  = useUser();
  // console.log("BALUT", user)emre

  return (
    <View style={styles.container}>
      <Image source={require('../assets/mayaLogo.png')} style={styles.logo} />

      <Text style={styles.title}>Profile</Text>
      <Text style={styles.userInfo}>{user.username}</Text>
      <Text style={styles.userInfo}>{user.email}</Text>


      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Documents')}>
        <Text style={styles.buttonText}>View Documents</Text>
      </TouchableOpacity>

      <AddNewDoc/>
      
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
