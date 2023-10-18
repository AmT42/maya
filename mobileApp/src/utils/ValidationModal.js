import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

const ValidationModal = ({ isVisible, onValidate, onClose, extractedInfo }) => {
  const [info, setInfo] = useState(extractedInfo);
  const [isRecapitulatifFocused, setRecapitulatifFocused] = useState(false);

  const handleValidate = () => {
    onValidate(info);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {Object.keys(info).map((key) => (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>{key}:</Text>
              <TextInput 
                style={key === 'recapitulatif' ? (isRecapitulatifFocused ? styles.recapitulatifInputFocused : styles.recapitulatifInput) : styles.input}
                value={info[key]} 
                onChangeText={(text) => setInfo((prev) => ({ ...prev, [key]: text }))} 
                multiline
                numberOfLines={key === 'recapitulatif' ? 3 : 1}
                scrollEnabled={key === 'recapitulatif'}
                onFocus={() => key === 'recapitulatif' && setRecapitulatifFocused(true)}
                onBlur={() => key === 'recapitulatif' && setRecapitulatifFocused(false)}
              />
            </View>
          ))}

          <View style={styles.buttonContainer}>
            <Button title="Valider" onPress={handleValidate} />
            <Button title="Mettre en attente" onPress={onClose} color="red" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
  },
  modalView: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 5,
  },
  recapitulatifInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 5,
    height: 60,
  },
  recapitulatifInputFocused: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 5,
    height: 200,  // Adjust as needed
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default ValidationModal;