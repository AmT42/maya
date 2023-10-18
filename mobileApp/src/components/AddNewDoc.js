import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DocumentScanner from 'react-native-document-scanner-plugin';
import ValidationModal from '../utils/ValidationModal'; // Modify this based on your path
import AsyncStorage from  '@react-native-async-storage/async-storage';

const AddNewDoc = () => {

    const [scannedImage, setScannedImage] = useState(null);
    const [extractedInfo, setExtractedInfo] = useState(null);
    const [showValidationModal, setShowValidationModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [docId, setDocId] = useState(null);

    const scanDocument = async () => {
      const { scannedImages } = await DocumentScanner.scanDocument();

      if (scannedImages && scannedImages.length > 0){
        setScannedImage(scannedImages[0]);
        handleImageValidation(scannedImages[0]);
      }
    } 

    const handleImageValidation = async (image) =>{
      setIsLoading(true);
      try {
          const formData = new FormData();
          formData.append('file', {
            uri: image,
            type: 'image/jpeg', // or image/png, depending on what you are capturing
            name: 'scannedImage.jpg', // You can rename this if you want
        });
        const token = await AsyncStorage.getItem("access_token");
        console.log("TOKEN",token)
        const response = await axios.post('http://192.168.1.16:8000/upload', formData,{
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data && response.data.extracted_info){
          setDocId(response.data.doc_id)
          setExtractedInfo(response.data.extracted_info);
          setShowValidationModal(true);
        }
        console.log('Upload successful');
      } catch (error){
        console.error('Failed to upload the image:', error);
        Alert.alert("Error", 'Failed to upload the image.')
      }
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }

    const handleValidation = async (validatedInfo) => {
      // Handle the validation, possibly call another endpoint if needed
      // For now, we'll just log the validated info
      console.log("validatedInfo",validatedInfo)
      const payload = {
        doc_id: docId,
        extracted_info: validatedInfo

      }
      try {
        const token = await AsyncStorage.getItem("access_token");
        const response = await axios.post("http://192.168.1.16:8000/validate", payload, {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        })

        if (response.data && response.data.doc_id) {
          console.log('Validation successful', response.data);
        }
        setShowValidationModal(false); // Close the modal
      } catch (error) {
        console.error('Failed to validate the document:', error);
        Alert.alert("Error", 'Failed to validate the document.');
      }
  };
    return(
        <View style={styles.actionButtonsContainer}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" /> // <-- This is the loading spinner
            ) : (
                <>
                    <TouchableOpacity style={[styles.actionButton, { borderRightWidth: 1, borderRightColor: "white" }]} onPress={scanDocument}>
                        <Icon name="camera" size={30} color="white" />  
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress="">
                        <Icon name="images-outline" size={30} color="white" /> 
                    </TouchableOpacity>
                    {extractedInfo && (
                      <ValidationModal isVisible={showValidationModal} extractedInfo={extractedInfo} onValidate={handleValidation} onClose={() => setShowValidationModal(false)}/>
                    )}
                </>
            )}
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