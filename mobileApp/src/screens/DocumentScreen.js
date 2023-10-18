import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumb';
import DocumentList from '../components/DocumentList';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DocumentScreen =  () => {
    const [data, setData] = useState([]);
    const [path, setPath] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchData = async (newPath) => {
        setLoading(true);
        const token = await AsyncStorage.getItem("access_token");
        try {
            const baseURL = 'http://192.168.1.16:8000/user/documents';
            const url = newPath ? `${baseURL}?path=${encodeURIComponent(newPath)}` : baseURL;
            console.log("token", token)
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("response",response.data)
            const result = await response.data;
            setData(result);
        } catch (error) {
            console.error("Error fetching data: ", error);
            Alert.alert("Error", 'Error fetching data.')
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(path);
    }, [path]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={{ flex: 1 }}>
          <Breadcrumb path={path} onNavigate={(newPath) => setPath(newPath)} />
          <DocumentList
            items={data}
            isFolder={path.split('/').length < 3}  // Assuming folders are at first and second levels
            onItemPress={(item, isFolder) => {
              const newPath = isFolder ? `${path}/${item}` : path;
              setPath(newPath);
            }}
          />
        </View>
    );
};

export default DocumentScreen;
