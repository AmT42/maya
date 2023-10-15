import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native-gesture-handler';


const AddNewDoc = () => {
    return(
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, { borderRightWidth: 1, borderRightColor:"white" }]} onPress="">
                <Icon name="camera" size={30} color="white" />  
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress="">
                <Icon name="images-outline" size={30} color="white" /> 
            </TouchableOpacity>
        </View>
     );
};

export default AddNewDoc

const styles = StyleSheet.create({
    actionButtonsContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#4E9FDF',
        backgroundColor: '#4E9FDF',
        borderRadius: 50, 
        position: 'absolute',
        bottom: 30,
        right: 30,
      },
      actionButton: {
        width: 45,
        height: 45,
        // backgroundColor: '#4E9FDF',
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 3,
      },
      actionButtonText: {
        color: '#FFF',
        fontSize: 24
      }
})