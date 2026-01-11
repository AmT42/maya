import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/theme';

const BottomSheet = ({visible, title, onClose, children}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: theme.colors.text}]}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={({pressed}) => [{opacity: pressed ? 0.6 : 1}]}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Icon
                name="close"
                size={22}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.40)',
    padding: 12,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});

export default BottomSheet;
