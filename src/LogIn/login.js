// src/LogIn/login.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TextWrapper from '../../TextWrapper';

const Login = () => {
  return (
    <View style={styles.container}>
      <TextWrapper style={styles.heading}>Login Page</TextWrapper>
      <TextWrapper style={styles.instructions}>Please enter your credentials</TextWrapper>
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
  instructions: {
    fontSize: 18,
    color: 'gray',
  },
});

export default Login;
