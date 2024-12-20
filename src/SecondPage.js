// src/SecondPage.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const SecondPage = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the second page!</Text>
      <Button title="Go to Home Page" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SecondPage;
