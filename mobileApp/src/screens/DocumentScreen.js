import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FetchDocuments } from '../utils/FetchDocuments';
import AddNewDoc from '../components/AddNewDoc';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AsyncStorage from  '@react-native-async-storage/async-storage';

const DocumentScreen = ({ navigation }) => {
    const [currentPath, setCurrentPath] = useState([]);
    const [data, setData] = useState([]);
    const [cachedData, setCachedData] = useState({});
    const [imageData, setImageData] = useState([]); // To store the image data
    const [isModalVisible, setModalVisible] = useState(false); // Control the visibility of the image modal
    const [selectedImage, setSelectedImage] = useState(null); // Store the currently selected image's path
    const [searchResults, setSearchResults] = useState(null);
    const [inSearchMode, setInSearchMode] = useState(false);

    const fetchSearchResults = async (query) => {
        try {
            token = await AsyncStorage.getItem("access_token");
            console.log(token)
            const response = await axios.get(`${API_BASE_URL}/user/search?query=${encodeURIComponent(query)}&top_k=2`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("RÉPONSE",response,)
            return response.data;
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    };

    const handleSearch = async (query) => {
        console.log(query)
        const results = await fetchSearchResults(query);
        setSearchResults(results);
        setInSearchMode(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            const pathString = currentPath.join('/');
            const pathDepth = currentPath.length;

            if (cachedData[pathString]) {
                if (pathDepth < 2) {
                    setData(cachedData[pathString]);
                } else {
                    setImageData(cachedData[pathString]);
                }
            } else {
                const documents = await FetchDocuments({ path: currentPath });
                if (pathDepth < 2) {
                    setData(documents);
                } else {
                    setImageData(documents);
                }
                // Cache the fetched data
                setCachedData(prevData => ({ ...prevData, [pathString]: documents }));
            }
        };
    
        fetchData();
    }, [currentPath]);

    const handlePress = (item) => {
        if (currentPath.length < 2) {
            setCurrentPath([...currentPath, item]);  // Set currentPath to the selected document type
        } else {
            handleImageClick(item.file_path)
        }
        setInSearchMode(false); // Exit search mode when opening a folder
    };

    const handleBreadcrumb = (index) => {
        if (index === 0 && currentPath.length === 1) {
            // If we're clicking on the only breadcrumb (e.g., "facture")
            setCurrentPath([]);  // Reset to the root
        } else {
            let newPath = currentPath.slice(0, index + 1);
            setCurrentPath(newPath);
        }
        setInSearchMode(false);
    };
    
    const renderItem = ({ item, index }) => {
        const isLastOddItem = (index === data.length -1) && (data.length % 2 != 0);
        if (inSearchMode) {
            return (
                <TouchableOpacity onPress={() => handlePress(item)}  style={styles.touchableContainer}>
                    <View style={styles.documentItemContainer}>
                        <Image
                            source={{ uri: `http://172.20.10.2:8000/${encodeURIComponent(item.file_path.replace('/storage/', ''))}` }}
                            style={styles.imageStyle}
                            onError={(error) => {
                                console.error("Image loading error:", error);
                            }}
                        />
                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                </TouchableOpacity>
            );
        } else if (currentPath.length < 2) {
            return (
                <TouchableOpacity 
                    style={[
                        styles.folderContainer,
                        isLastOddItem ? { marginRight: '50%' } : {}
                    ]} 
                    onPress={() => handlePress(item)}
                >
                    <Icon name="folder" style={styles.folderIcon} />
                    <Text style={styles.folderLabel}>{item}</Text>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity onPress={() => handlePress(item)}  style={styles.touchableContainer}>
                    <View style={styles.documentItemContainer}>
                        <Image
                            source={{ uri: `http://172.20.10.2:8000/${encodeURIComponent(item.file_path.replace('/storage/', ''))}` }}
                            style={styles.imageStyle}
                            onError={(error) => {
                                console.error("Image loading error:", error);
                            }}
                        />
                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                </TouchableOpacity>
            );
        }
    };

    const handleImageClick = (imagePath) => {
        const fullImagePath = `http://172.20.10.2:8000/${encodeURIComponent(imagePath.replace('/storage/', ''))}`;
        setSelectedImage(fullImagePath);
        setModalVisible(true);
    };
    return (
        
        <View style={[styles.container, {paddingHorizotal: 20}]}>
            <SearchBar onSearch={handleSearch} />

            <View style={styles.breadcrumbContainer}>
                {currentPath && currentPath.length > 0 && currentPath.map((segment, index) => (
                    <TouchableOpacity key={index} onPress={() => handleBreadcrumb(index)} style={styles.breadcrumbTouchable}>
                        <Text style={styles.breadcrumbText}>
                            {segment}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={inSearchMode ? searchResults : (currentPath.length < 2 ? data : imageData)}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                style={styles.listStyle}
                contentContainerStyle={styles.listContentStyle}
            />

            <Modal
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
                transparent={true}
                animationType="slide"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        source={{ uri: selectedImage }}
                        style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
                    />
                    <Button title="Close" onPress={() => setModalVisible(false)} />
                </View>
            </Modal>

            <AddNewDoc/>
        </View>
    );
};

export default DocumentScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    breadcrumbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white'
    },
    breadcrumbText: {
        fontSize: 16,
        color: '#007AFF',
        marginRight: 5
    },
    breadcrumbSeparator: {
        fontSize: 16,
        color: '#007AFF',
    },
    breadcrumbTouchable: {
        padding: 5, // you can adjust the value as needed
    },
    listStyle: {
        flex: 1
    },
    listContentStyle: {
        flexGrow: 1,
        paddingHorizontal: 10, 
    },
    folderIcon: {
        fontSize: 50,  // Adjust this size as needed
        marginBottom: 10,  // Gives some space between the icon and the label
        color: "#4E9FDF"
    },
    folderContainer: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginLeft: '2.5%',  // Adjust the values as necessary
        width: '47.5%',  // The width is reduced slightly to account for the margin
    },
    imageStyle: {
        width: '48%', 
        height: 150, 
        margin: '1%',
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    touchableContainer: {
        width: '48%', // or adjust based on your desired size
        margin: '1%',
    },

    documentItemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white', // or any desired background color
        borderRadius: 5,  // if you want rounded corners
        // add other styling properties if needed
    },
    dateText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666', // a subtle gray color
    },
});
