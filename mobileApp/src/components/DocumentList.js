// DocumentList.js
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import FolderComponent from './FolderComponent';

const DocumentList = ({ items, isFolder, onItemPress }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {items.map(item => (
        <TouchableOpacity key={item.id} onPress={() => onItemPress(item, isFolder)}>
          <View style={styles.item}>
            {isFolder ? (
              <FolderComponent name={item} onPress={() => onItemPress(item, isFolder)} />
            ) : (
              <Image
                source={{ uri: `http://192.168.1.16:8000/storage/${item.file_path}` }}
                style={styles.documentIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  item: {
    width: '45%',
    margin: '2.5%',
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  documentIcon: {
    width: 100,
    height: 100,
  },
});

export default DocumentList;
