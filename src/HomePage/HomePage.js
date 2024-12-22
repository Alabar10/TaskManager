// src/HomePage/HomePage.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import TextWrapper from '../../TextWrapper';

const HomePage = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TextWrapper style={styles.heading}>Welcome to Task Manager</TextWrapper>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <TextWrapper style={styles.buttonText}>Go to Login</TextWrapper>
      </TouchableOpacity>
    </View>
  );
};

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
  buttonText: {
    fontSize: 18,
    color: 'blue',
  },
});

export default HomePage;
