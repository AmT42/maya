import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

const LoginScreen = () => {
  const [UserName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const formData = `username=${UserName}&password=${password}`;
      console.log('FormData:', formData);

      const response = await axios.post('http://10.0.2.2:8000/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log(response.data);
      // Handle successful login here (e.g., navigate to the next screen)
    } catch (error) {
      console.error('Error Response:', error.response.data);
      // Handle error (e.g., show an error message)
    }
  };

  return (
    <View>
      <TextInput
        placeholder="UserName"
        value={UserName}
        onChangeText={setUserName}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;