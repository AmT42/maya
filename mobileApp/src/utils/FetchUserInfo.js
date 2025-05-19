import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config';

export const fetchUserInfo = async (setUser, navigation) => {
    try {
        const token = await AsyncStorage.getItem("access_token");
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setUser(response.data); // Set user data in global context

        console.log("Salut", response.data)
        navigation.navigate("UserProfile");

    } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle error accordingly
    }
};