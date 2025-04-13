import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import config from '../config';

const RequestReset = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return;
    }
    try {
      const response = await fetch(`${config.API_URL}/request_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Reset link sent! Check your email.');
        // Navigate to login or optionally show reset instructions
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'Unable to send reset link');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>🔐 Forgot Your Password?</Text>
        <Text style={styles.subtitle}>
          Enter your registered email and we'll send you a reset link.
        </Text>

        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.buttonContainer}>
          <Button title="Request Reset Link" onPress={handleRequestReset} color="#007AFF" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
    justifyContent: 'center',
    padding: 20,
  },
  innerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
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

export default RequestReset;
