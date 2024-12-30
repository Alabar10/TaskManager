import React, { useState } from 'react';
import {View,Text,TextInput,StyleSheet,TouchableOpacity,Alert,ActivityIndicator,} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    setIsLoading(true);
    console.log('Debug: Sending login request with:', { email, password });

    try {
      const response = await fetch('http://172.19.40.86:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Debug: Server response:', response);
      const data = await response.json();
      console.log('Debug: Response JSON:', data);

      setIsLoading(false);

      if (response.ok) {
        Alert.alert('Success', `Welcome, ${data.username}`);
        navigation.replace('DrawerNavigator', { userId: data.userId });
      } else if (response.status === 401) {
        setErrorMessage('Invalid email or password.'); // Show error for invalid credentials
      } else {
        Alert.alert('Error', data.message || 'Unexpected error occurred.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'Unable to connect to the server. Please check your network and try again.'
      );
    }
  };

  
  

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>

      {/* Username input */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="account" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Type your username"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password input */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Type your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword} // Toggle password visibility
        />
        <TouchableOpacity
          style={styles.showPasswordButton}
          onPress={() => setShowPassword((prevState) => !prevState)} // Toggle password visibility
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye' : 'eye-off'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity onPress={() => navigation.navigate('ResetEmail')}>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      </TouchableOpacity>



      {/* Login Button */}
      {isLoading ? (
      <ActivityIndicator size="large" color="#0000ff" />
      ) : (
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>LOGIN</Text>
      </TouchableOpacity>
      )}



      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Register Here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  showPasswordButton: {
    padding: 5,
  },
  forgotPassword: {
    color: '#6A5ACD',
    textAlign: 'right',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerLink: {
    color: '#6A5ACD',
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
});

export default Login;
