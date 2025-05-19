import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../config';

export const FetchDocuments = async ({ path } = { path: null }) => {
    try {
        const token = await AsyncStorage.getItem("access_token");
        const endpoint = `${API_BASE_URL}/user/documents`;
        const url = path ? `${endpoint}?path=${encodeURIComponent(path.join('/'))}` : endpoint;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching documents:", error);
        throw error;
    }
};