import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import config from '../config'; // Adjust the path based on your file structure

const Register = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const checkPasswordStrength = (password) => {
    let strength = '';
    const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})');
    const mediumRegex = new RegExp('^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})');

    if (strongRegex.test(password)) {
      strength = 'Strong';
    } else if (mediumRegex.test(password)) {
      strength = 'Medium';
    } else if (password.length >= 6) {
      strength = 'Weak';
    }

    setPasswordStrength(strength);
    return strength;
  };

  const handlePasswordChange = (password) => {
    setPassword(password);
    if (password.length > 0) {
      checkPasswordStrength(password);
    } else {
      setPasswordStrength('');
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword || !fname || !lname) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!checkPasswordStrength(password) || passwordStrength !== 'Strong') {
      Alert.alert('Error', 'Please ensure your password is strong');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    console.log('API URL:', config.API_URL); // Debugging the API URL

    try {
      const response = await fetch('${config.API_URL}/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          fname,
          lname
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Registration successful');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'Failed to register');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sign up</Text>
      <Text style={styles.subheading}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={fname}
        onChangeText={setFname}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lname}
        onChangeText={setLname}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry={true}
        placeholderTextColor="#888"
      />

      <Text style={[styles.passwordStrength, {
        color: passwordStrength === 'Strong' ? 'green' : passwordStrength === 'Medium' ? 'orange' : 'red'
      }]}>
        Password Strength: {passwordStrength}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
        placeholderTextColor="#888"
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#333',  // Ensure text color is visible
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6A5ACD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#0066cc',
    fontSize: 16,
  },
  passwordStrength: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export default Register;
