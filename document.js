import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FetchDocuments } from '../utils/FetchDocuments';

const DocumentScreen = ({ navigation }) => {
    const [currentPath, setCurrentPath] = useState([]);
    const [data, setData] = useState([]);
    const [cachedData, setCachedData] = useState({});
    const [imageData, setImageData] = useState([]); // To store the image data
    const [isModalVisible, setModalVisible] = useState(false); // Control the visibility of the image modal
    const [selectedImage, setSelectedImage] = useState(null); // Store the currently selected image's path


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
        if (currentPath.length === 0) {
            setCurrentPath([item]);  // Set currentPath to the selected document type
        } else {
            console.log(`Selected item under ${currentPath}: ${item}`);
            // Here, you may navigate to another screen or do something else
            // based on the selected item under a specific document type.
        }
    };

    const handleBreadcrumb = (index) => {
        if (index === 0 && currentPath.length === 1) {
            // If we're clicking on the only breadcrumb (e.g., "facture")
            setCurrentPath([]);  // Reset to the root
        } else {
            let newPath = currentPath.slice(0, index + 1);
            setCurrentPath(newPath);
        }
    };
    
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.folderContainer} onPress={() => handlePress(item)}>
            <Icon name="folder" style={{ ...styles.folderIcon}} />
            <Text style={styles.folderLabel}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        
        <View style={[styles.container, {paddingHorizotal: 20}]}>

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
                data={data}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                style={styles.listStyle}
                contentContainerStyle={styles.listContentStyle}
            />
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
        flexGrow: 1
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
    }
});
