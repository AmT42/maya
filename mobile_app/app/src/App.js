import React, { useState, useEffect } from 'react';
import { Image, View, Text } from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default () => {
  const [scannedImage, setScannedImage] = useState();

  const scanDocument = async () => {
    // start the document scanner
    const { scannedImages } = await DocumentScanner.scanDocument()
  
    // get back an array with scanned image file paths
    if (scannedImages.length > 0) {
      // set the img src, so we can view the first scanned image
      setScannedImage(scannedImages[0])
    }
  }

  useEffect(() => {
    // call scanDocument on load
    scanDocument()
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {scannedImage ? (
        <Image
          resizeMode="contain"
          style={{ width: '100%', height: 300 }}
          source={{ uri: scannedImage }}
        />
      ) : (
        <Text>No image scanned</Text>
      )}
    </View>
  );
};
