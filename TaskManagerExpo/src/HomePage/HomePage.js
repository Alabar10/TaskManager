// src/HomePage/HomePage.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomePage = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Welcome to Task Manager</Text>
    <Text style={styles.subheading}>Manage your tasks efficiently</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subheading: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default HomePage;
