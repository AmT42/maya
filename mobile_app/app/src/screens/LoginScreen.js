import React, {useState} from 'react';
import {Button, TextInput, View} from 'react-native';
import { loginUser } from '../api';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
    const [credentials, setCredentials] = useState({ username: "", password: ""});
    const { setUser } = useAuth();

    const handleLogin = async () => {
        try {
            const response = await loginUser(credentials);
            setUser(response.data.user); //Update global user state
            // Navigate to dashboard..
        }
        catch (error){
            console.error("Login failed", error);
        }
    };

    return (
        <View>
          <TextInput
            placeholder="Username"
            value={credentials.username}
            onChangeText={(username) => setCredentials({ ...credentials, username })}
          />
          <TextInput
            placeholder="Password"
            value={credentials.password}
            onChangeText={(password) => setCredentials({ ...credentials, password })}
            secureTextEntry
          />
          <Button title="Login" onPress={handleLogin} />
        </View>
      );
    };