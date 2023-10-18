import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Breadcrumb = ({ path, onNavigate }) => {
  const segments = path.split('/');
  
  return (
    <View style={styles.container}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onNavigate(segments.slice(0, index + 1).join('/'))}
        >
          <Text style={styles.text}>{segment}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  text: {
    marginRight: 5,
    color: '#007BFF',  // Choose a color that matches your design
  },
});

export default Breadcrumb;
