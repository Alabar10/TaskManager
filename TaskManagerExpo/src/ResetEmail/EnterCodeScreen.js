import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import config from '../config'; 

const EnterCodeScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');

  const handleVerifyCode = async () => {
  if (!code.trim()) {
    Alert.alert('Missing Code', 'Please enter the 6-digit code.');
    return;
  }

  try {
    const response = await fetch(`${config.API_URL}/verify_reset_code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.ok) {
      navigation.navigate('ResetPassword', { email });  // Pass email to next screen
    } else {
      // Show more specific error
      if (data.message.includes('expired')) {
        Alert.alert('Code Expired', 'The code has expired. Please request a new one.');
      } else if (data.message.includes('Incorrect')) {
        Alert.alert('Invalid Code', 'The code you entered is incorrect.');
      } else if (data.message.includes('not found')) {
        Alert.alert('Error', 'User not found.');
      } else {
        Alert.alert('Error', data.message || 'Failed to verify code.');
      }
    }

  } catch (error) {
    console.error('Verify error:', error);
    Alert.alert('Network Error', 'Failed to connect. Try again later.');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>📧 Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {email}. Enter it below.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="6-digit code"
        keyboardType="numeric"
        onChangeText={setCode}
        value={code}
        maxLength={6}
      />
      <View style={styles.buttonContainer}>
        <Button title="Verify" onPress={handleVerifyCode} color="#007AFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f1f3f6' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default EnterCodeScreen;
