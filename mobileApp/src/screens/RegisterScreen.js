import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles'; 
import { TouchableOpacity } from 'react-native-gesture-handler';
import axios from 'axios';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // First, validate the fields. For instance, check if the password and confirmPassword are the same.
    // If validation fails, display an appropriate error message.
    // Otherwise, proceed with sending the data to your backend.
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      console.error("Passwords don't match.");
      setError("Passwords don't match. ")
      return;
    }

    try {
      // Construct form data
      const formData = `username=${username}&email=${email}&password=${password}`;

      const response = await axios.post('http://10.0.2.2:8000/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      setIsLoading(false);
      console.log("Response: ", response.data);
      // If registration is successful, you might want to navigate the user to the login screen or directly log them in.
    } catch (error) {
      setIsLoading(false);
      console.error('Registration Error: ', error.response.data);
      setError("An error occured during registration. ")
      // Handle error by showing appropriate message to the user.
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
