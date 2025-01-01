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
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

const Settings = ({ route, navigation }) => {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState(""); // Password state
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Toggle password visibility
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user data on component mount
  const fetchUserData = async () => {
    const { userId } = route.params; // Pass userId from navigation
    try {
      const response = await fetch(`http://192.168.1.42:5000/user/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setPassword(data.password || ''); // Initialize with the current password
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch user data.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch user data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user information
  const handleUpdateInfo = async () => {
    setIsUpdating(true);
    try {
      const updatedData = {
        ...user,
        userId: user.userId,
        password: password || undefined, // Include password only if changed
      };

      const response = await fetch("http://192.168.1.42:5000/update_user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "User information updated successfully.");
      } else {
        Alert.alert("Error", data.message || "Failed to update user information.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update user information.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>User Settings</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={user?.fname}
        onChangeText={(text) => setUser({ ...user, fname: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={user?.lname}
        onChangeText={(text) => setUser({ ...user, lname: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={user?.email}
        onChangeText={(text) => setUser({ ...user, email: text })}
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
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

      {isUpdating ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleUpdateInfo}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
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
    fontSize: 14,
    backgroundColor: '#fff',
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
    padding: 12,
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
