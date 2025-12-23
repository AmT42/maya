import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator } from 'react-native';
import apiClient from '../services/apiClient';
import { styles } from '../styles'; 
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useUser } from "../contexts/UserContext"; 
import { fetchUserInfo } from '../utils/FetchUserInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useUser();

  const handleLogin = async () => {
    setIsLoading(true); // when user presses the button, start the loading indicator
    setError(''); // reset any previous errors
    console.log("HERE")
    try {
      const formData = `username=${userName}&password=${password}`;
      // Base URL is configured in src/config/apiConfig.js
      const response = await apiClient.post('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log("HERE TOO")
      await AsyncStorage.setItem("access_token", response.data.access_token);
      await AsyncStorage.setItem("refresh_token", response.data.refresh_token);

      await fetchUserInfo(setUser);
      navigation.navigate("UserProfile");
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
      <Text style={styles.title}>Connection</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput style={styles.textInput} placeholder="Nom de compte" value={userName} onChangeText={setUserName} />
      <TextInput style={styles.textInput} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry/> 

      {isLoading ? 
        <ActivityIndicator size = "large" color="#4E9FDF" style = {{marginVertical: 20}} />:
        <>
        <TouchableOpacity style={styles.primaryButtonContainer} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButtonContainer} onPress={() => navigation.navigate("Register") }>
          <Text style={styles.secondaryButtonText}>Tu n'as encore pas de compte? Inscris toi</Text>
        </TouchableOpacity>
        </>}
    </View>
  );
};

export default LoginScreen;
