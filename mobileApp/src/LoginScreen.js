import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { styles } from './styles'; 
import { TouchableOpacity } from 'react-native-gesture-handler';

const LoginScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsLoading(true); // when user presses the button, start the loading indicator
    setError(''); // reset any previous errors
    try {
      const formData = `username=${userName}&password=${password}`;
      console.log('FormData:', formData);

      const response = await axios.post('http://10.0.2.2:8000/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      setIsLoading(false); //stop the loading indicator
      console.log(response.data);
      // Handle successful login here (e.g., navigate to the next screen)
    } catch (error) {
      setIsLoading(false);
      console.error('Error Response:', error.response.data);
      setError("An error occured during login. ") // show an error message
      // Handle error (e.g., show an error message)
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
    </View>
  );
};

export default LoginScreen;