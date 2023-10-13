import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';

export const fetchUserInfo = async (setUser, navigation) => {
    try {
        const token = await AsyncStorage.getItem("access_token");
        const response = await axios.get("http://10.0.2.2:8000/users/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log("SALUT", response.data)
        setUser(response.data); // Set user data in global context
        // console.log("BALUT",user)

        navigation.navigate("UserProfile");

    } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle error accordingly
    }
};