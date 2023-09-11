import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { RNCamera } from 'react-native-camera';

function CameraComponent() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(RNCamera.Constants.Type.back);
  const cameraRef = React.useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await RNCamera.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.log('Camera permission error:', error);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setPreviewVisible(true);
      setCapturedPhoto(data.uri);
    }
  };

  const retakePicture = () => {
    setCapturedPhoto(null);
    setPreviewVisible(false);
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {previewVisible && capturedPhoto ? (
        <Image source={{ uri: capturedPhoto }} style={{ flex: 1 }} />
      ) : (
        <RNCamera style={{ flex: 1 }} type={type} ref={cameraRef}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              flexDirection: 'row',
            }}>
            <TouchableOpacity
              style={{
                flex: 0.1,
                alignSelf: 'flex-end',
                alignItems: 'center',
              }}
              onPress={() => {
                setType(
                  type === RNCamera.Constants.Type.back
                    ? RNCamera.Constants.Type.front
                    : RNCamera.Constants.Type.back
                );
              }}>
              <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Flip </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
            <TouchableOpacity onPress={takePicture} style={{ alignSelf: 'flex-end', alignItems: 'center', backgroundColor: 'transparent' }}>
              <View style={{ 
                borderWidth: 2,
                borderRadius: 50,
                borderColor: 'white',
                height: 50,
                width: 50,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#fff' 
              }}>
                <View style={{
                  borderWidth: 2,
                  borderRadius: 50,
                  borderColor: 'white',
                  height: 40,
                  width: 40,
                  backgroundColor: 'transparent' 
                }} >
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </RNCamera>
      )}
      {previewVisible && capturedPhoto ? (
        <TouchableOpacity onPress={retakePicture} style={{ position: 'absolute', left: '5%', top: '5%', backgroundColor: 'transparent' }}>
          <Text style={{ fontSize: 20, color: 'white' }}>Retake</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default CameraComponent;
