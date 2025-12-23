// DocumentImageScreen.js

import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { buildStorageUrl } from '../utils/storageUrl';

const DocumentImageList = ({ data, onImagePress }) => {
    return data.map(item => (
        <TouchableOpacity onPress={() => onImagePress(item.file_path)} style={styles.touchableContainer}>
            <View style={styles.documentItemContainer}>
                <Image
                    source={{ uri: buildStorageUrl(item.file_path) }}
                    style={styles.imageStyle}
                    onError={(error) => {
                        console.error("Image loading error:", error);
                    }}
                />
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    ));
};

const styles = StyleSheet.create({
    touchableContainer: {
        width: '48%',
        margin: '1%',
    },
    documentItemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 5,
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
    dateText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
    },
});

export default DocumentImageList;

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#F5F5F5'
//     },
//     touchableContainer: {
//         width: '48%', // or adjust based on your desired size
//         margin: '1%',
//     },
//     documentItemContainer: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: 'white', // or any desired background color
//         borderRadius: 5,  // if you want rounded corners
//         // add other styling properties if needed
//     },
//     imageStyle: {
//         width: '48%', 
//         height: 150, 
//         margin: '1%',
//         borderRadius: 10,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.23,
//         shadowRadius: 2.62,
//         elevation: 4,
//     },
//     dateText: {
//         marginTop: 5,
//         fontSize: 12,
//         color: '#666', // a subtle gray color
//     },
// })
