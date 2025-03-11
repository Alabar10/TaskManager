import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import config from '../config'; // Adjust the path based on your file structure

const Settings = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({ fname: '', lname: '', email: '', password: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Settings",
      headerStyle: { backgroundColor: "#6A5ACD" },
      headerTintColor: "#fff",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()} // Opens the drawer
          style={{ marginLeft: 15 }}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  const fetchUserData = async () => {
    console.log('Attempting to fetch data for user ID:', userId);
    if (!userId) {
      console.log('User ID not available, skipping fetch.');
      setIsLoading(false);
      return;
    }
    console.log('API URL:', config.API_URL); // Debugging the API URL

    try {
      const response = await fetch(`${config.API_URL}/user/${userId}`);
      const data = await response.json();
      console.log("Fetch response:", response);
      console.log("Data received:", data);
      if (response.ok) {
        setUser(data);
        console.log("User set with data:", data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch user data.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch user data.');
      console.error('Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getUserIdFromStorage = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      console.log('Retrieved User ID from AsyncStorage:', storedUserId);
      setUserId(storedUserId);
    };

    getUserIdFromStorage();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleUpdateInfo = async () => {
    if (!user) {
      Alert.alert("Error", "No user data to update.");
      return;
    }

    try {
      const updatedData = { ...user, password: user.password || undefined };
      const response = await fetch("http://127.0.0.1:5000/update_user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "User information updated successfully.");
      } else {
        Alert.alert("Error", result.message || "Failed to update user information.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update user information.");
      console.error('Update Error:', error);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>User Settings</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={user.fname || ''}
        onChangeText={(text) => setUser((prev) => ({ ...prev, fname: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={user.lname || ''}
        onChangeText={(text) => setUser((prev) => ({ ...prev, lname: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={user.email || ''}
        onChangeText={(text) => setUser((prev) => ({ ...prev, email: text }))}
        keyboardType="email-address"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          value={user.password || ''}
          placeholderTextColor="gray" // Makes the placeholder visible

          onChangeText={(text) => setUser((prev) => ({ ...prev, password: text }))}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          style={styles.showPasswordButton}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <MaterialCommunityIcons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleUpdateInfo}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 9,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  showPasswordButton: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Settings;
