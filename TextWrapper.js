// TextWrapper.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Custom TextWrapper component
const TextWrapper = ({ children, style }) => (
  <View style={styles.container}>
    <Text style={[styles.text, style]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
  },
  text: {
    fontSize: 16,
    color: 'black',
  },
});

export default TextWrapper;
