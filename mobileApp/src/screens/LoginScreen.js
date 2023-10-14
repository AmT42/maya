import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { styles } from '../styles'; 
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useUser } from "../contexts/UserContext"; 
import { fetchUserInfo } from '../utils/FetchUserInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useUser();

  const handleLogin = async () => {
    setIsLoading(true); // when user presses the button, start the loading indicator
    setError(''); // reset any previous errors
    try {
      const formData = `username=${userName}&password=${password}`;

      const response = await axios.post('http://10.0.2.2:8000/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      await AsyncStorage.setItem("access_token", response.data.access_token);
      await AsyncStorage.setItem("refresh_token", response.data.refresh_token);

      await fetchUserInfo(setUser, navigation);
      // setUser(response.data.user);
      navigation.navigate("UserProfile");// Handle successful login here (e.g., navigate to the next screen)
    } catch (error) {
      setIsLoading(false);
      console.error('Error during login:', error.response?.data || error.message);
      setError("An error occured during login. ") // show an error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.textInput}
        placeholder="Username"
        value={userName}
        onChangeText={setUserName}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Go to Register</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('UserProfile')}>
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;