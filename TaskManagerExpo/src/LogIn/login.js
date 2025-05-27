import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import config from '../config';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });
  console.log("EXPO_CLIENT_ID", config.EXPO_CLIENT_ID);
  console.log("IOS_CLIENT_ID", config.IOS_CLIENT_ID);
  console.log("ANDROID_CLIENT_ID", config.ANDROID_CLIENT_ID);
  console.log("GOOGLE_CLIENT_ID", config.GOOGLE_CLIENT_ID);
  
  // Login.js
const redirectUri = makeRedirectUri({
  useProxy: true,
});


  
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: config.IOS_CLIENT_ID,
    androidClientId: config.ANDROID_CLIENT_ID,
    webClientId:config.GOOGLE_CLIENT_ID,  
    expoClientId: config.EXPO_CLIENT_ID,
    redirectUri,

    scopes: ['profile', 'email'],
    responseType: 'id_token',
  });
  
  
  
  
  
  

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
  
    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      setIsLoading(false);
  
      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userId', String(data.userId));
  
          Alert.alert('Success', `Welcome, ${data.username}`);
          navigation.replace('DrawerNavigator');
        } else {
          Alert.alert('Error', 'No token returned from the server.');
        }
      } else if (response.status === 401) {
        setErrorMessage('Invalid email or password.');
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

  useEffect(() => {
  console.log("🔁 Google Auth response object:", response);

  if (response?.type === 'success') {
    console.log("✅ Google Auth success");
    const { id_token } = response.authentication || {};
    console.log("🧾 ID Token:", id_token);

    if (!id_token) {
      console.warn("⚠️ ID Token is missing");
      Alert.alert("Error", "Google login failed: no token returned.");
      return;
    }

    const credential = GoogleAuthProvider.credential(id_token);

    console.log("🔐 Signing in with Firebase credential...");
    signInWithCredential(auth, credential)
      .then(async (userCredential) => {
        console.log("✅ Firebase Sign-In success");

        const user = userCredential.user;
        const email = user.email;
        const uid = user.uid;

        console.log("📧 Email:", email);
        console.log("🆔 UID:", uid);

        try {
          const res = await fetch(`${config.API_URL}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, uid }),
          });

          const data = await res.json();
          console.log("📦 Backend response:", data);

          if (res.ok && data.token) {
            console.log("✅ Token saved to AsyncStorage");
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userId', String(data.userId));
            await AsyncStorage.setItem('userEmail', email);
            navigation.replace('DrawerNavigator');
          } else {
            console.warn("❌ Server returned error:", data.message);
            Alert.alert('Login Error', data.message || 'Google login failed.');
          }
        } catch (error) {
          console.error('🔥 Backend login error:', error);
          Alert.alert('Error', 'Could not reach backend.');
        }
      })
      .catch((err) => {
        console.error('❌ Firebase sign-in error:', err);
        Alert.alert('Error', 'Firebase login failed.');
      });
  } else if (response?.type === 'error') {
    console.log("❌ Google Auth error:", response.error);
    Alert.alert("Error", "Google login failed to start.");
  }
}, [response]);

  
  
  
  
  const handleEmailChange = (text) => {
    setEmail(text);
    setErrorMessage('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/splash-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Header Text */}
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subheading}>Log in to continue</Text>

          {/* Google Login Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              console.log("🔘 Google Sign-In button pressed");
              if (request) {
                promptAsync({ useProxy: true });
                console.log("📤 promptAsync called with useProxy: true");
              } else {
                console.warn("⚠️ Google auth request not ready");
                Alert.alert("Error", "Google login is not ready yet.");
              }
            }}

            disabled={!request}
            activeOpacity={0.8}
          >
            <View style={styles.googleIconContainer}>
              <MaterialCommunityIcons
                name="google"
                size={20}
                color="#DB4437"
              />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          <View style={[
            styles.inputContainer,
            isFocused.email && styles.inputContainerFocused
          ]}>
            <View style={styles.inputIconContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={isFocused.email ? '#6A5ACD' : '#999'}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setIsFocused({ ...isFocused, email: true })}
              onBlur={() => setIsFocused({ ...isFocused, email: false })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
  
          {/* Password Input */}
          <View style={[
            styles.inputContainer,
            isFocused.password && styles.inputContainerFocused
          ]}>
            <View style={styles.inputIconContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={isFocused.password ? '#6A5ACD' : '#999'}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={handlePasswordChange}
              onFocus={() => setIsFocused({ ...isFocused, password: true })}
              onBlur={() => setIsFocused({ ...isFocused, password: false })}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
  
          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#FF3B30"
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
  
          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate('RequestReset')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
  
          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
  
          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 7,
    backgroundColor: '#f8f9fa',
    borderRadius: 40,
    alignSelf: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  logoImage: {
    width: 150,
    height: 140,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  subheading: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  googleIconContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleButtonText: {
    fontSize: 16,
    color: '#5f6368',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: '#6A5ACD',
    backgroundColor: '#FFF',
    boxShadow: '0px 0px 8px rgba(106, 90, 205, 0.1)',
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  showPasswordButton: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    color: '#6A5ACD',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    boxShadow: '0px 4px 8px rgba(106, 90, 205, 0.2)',
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#6A5ACD',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
});

export default Login;