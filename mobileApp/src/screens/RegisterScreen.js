import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles'; 
import { TouchableOpacity } from 'react-native-gesture-handler';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserInfo } from '../utils/FetchUserInfo';
import { useUser } from '../contexts/UserContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useUser();

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      console.error("Passwords don't match.");
      setError("Passwords don't match. ")
      return;
    }

    try {
      const formData = `username=${username}&email=${email}&password=${password}`;

      const response = await axios.post('http://10.0.2.2:8000/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log("response", response)
      await AsyncStorage.setItem("access_token", response.data.access_token);
      await AsyncStorage.setItem("refresh_token", response.data.refresh_token);

      await fetchUserInfo(setUser, navigation)

      navigation.navigate("UserProfile");
    } catch (error) {
      setIsLoading(false);
      console.error('Registration Error: ', error.response.data);
      setError("An error occured during registration. ")
      // Handle error by showing appropriate message to the user.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>
      {error ? <Text style = {styles.errorText}>{error}</Text> : null}
      <TextInput style={styles.textInput} placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput style={styles.textInput} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.textInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.textInput} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Registration</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;
