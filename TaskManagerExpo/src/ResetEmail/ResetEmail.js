import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';

const RequestReset = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Please enter your email address');
      return;
    }
    try {
      const response = await fetch('http://192.168.1.42:5000/request_reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Reset link sent! Check your email.');
        navigation.navigate('ResetPassword', { email }); // Navigate to ResetPassword component
      } else {
        Alert.alert('Error', data.message || 'Unable to send reset link');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error, try again later');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Request Reset" onPress={handleRequestReset} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default RequestReset;
