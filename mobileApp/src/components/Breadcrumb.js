import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';


const Breadcrumb = ({ currentPath, handleBreadcrumb }) => {
    return (
        <View style={styles.breadcrumbContainer}>
            {currentPath && currentPath.length > 0 && currentPath.map((segment, index) => (
                <TouchableOpacity key={index} onPress={() => handleBreadcrumb(index)} style={styles.breadcrumbTouchable}>
                    <Text style={styles.breadcrumbText}>
                        {segment}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default Breadcrumb;

const styles = StyleSheet.create({
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
    breadcrumbTouchable: {
        padding: 5, // you can adjust the value as needed
    },
})
