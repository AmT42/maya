import React from 'react';
import { View, Text, FlatList, TouchableOpacity} from 'react-native';
import { styles } from './styles';

const ProfileScreen = ({ user, documents }) => {
    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <View style={styles.profileCircle}>
                    <Text style={styles.profileLetter}>{user.username[0].toUpperCase()}</Text>
                </View>
            </View>
        </View>
    )
}