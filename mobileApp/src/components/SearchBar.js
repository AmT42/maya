import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import axios from 'axios';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    return (
        <View style={{ flexDirection: 'row', margin: 10, alignItems: 'center' }}>
            <TextInput
                style={{ flex: 1, borderColor: 'gray', borderWidth: 1, padding: 5 }}
                placeholder="Cherche"
                onChangeText={text => setQuery(text)}
                value={query}
            />
            <Button title="Search" onPress={() => onSearch(query)} />
        </View>
    );
};

export default SearchBar;