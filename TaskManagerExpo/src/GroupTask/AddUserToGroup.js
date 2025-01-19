import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from 'react-native-vector-icons';  // Import the back icon
import config from '../config'; // Assuming you have the config file with API_URL

const AddUserToGroup = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params;  // Get groupId from route params

  const [searchTerm, setSearchTerm] = useState("");  // Search term for email/username
  const [userList, setUserList] = useState([]);  // List of users returned from search
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);  // User selected for adding to group

  const isValidSearchTerm = (term) => /\S+/.test(term);  // Validate search input

  const handleSearch = async () => {
    if (!searchTerm.trim() || !isValidSearchTerm(searchTerm)) {
      Alert.alert("Error", "Please enter a valid email or username to search.");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${config.API_URL}/users/search?searchTerm=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to search for user.");
      }

      if (data.length === 0) {
        Alert.alert("Error", "No users found.");
        setUserList([]);  // Clear user list if no user is found
      } else {
        setUserList(data);  // Set the user list if users are found
      }
    } catch (error) {
      setUserList([]);  // Clear previous results if an error occurs
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser || !selectedUser.userId) {
      Alert.alert("Error", "No user selected or invalid user data. Please search again.");
      return;
    }

    setIsAdding(true);
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        setIsAdding(false);
        return;
      }

      const body = {
        user_id: selectedUser.userId, // Ensure this is the correct userId from the selected user
      };

      // Log the payload before sending it
      console.log("Request body:", body);  // <-- Add this line to verify the payload

      const response = await fetch(
        `${config.API_URL}/groups/${groupId}/add_user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(body),  // Sending the user ID in the body
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add user to the group.");
      }

      Alert.alert("Success", "User added to the group successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setIsAdding(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => setSelectedUser(item)}  // Select the user from the list
    >
      <Text style={styles.userName}>{item.fname} {item.lname}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.heading}>Add User to Group</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter email or username to search"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <TouchableOpacity
        style={[styles.button, isSearching && styles.disabledButton]}
        onPress={handleSearch}
        disabled={isSearching}
      >
        <Text style={styles.buttonText}>
          {isSearching ? "Searching..." : "Search User"}
        </Text>
      </TouchableOpacity>

      {/* Display search results if available */}
      {userList.length > 0 && (
        <FlatList
          data={userList}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          style={styles.userList}
        />
      )}

      {/* Show selected user details */}
      {selectedUser && (
        <View style={styles.selectedUser}>
          <Text style={styles.selectedUserName}>Selected User: {selectedUser.fname} {selectedUser.lname}</Text>
          <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isAdding && styles.disabledButton]}
        onPress={handleAddUser}
        disabled={isAdding}
      >
        <Text style={styles.buttonText}>
          {isAdding ? "Adding..." : "Add User"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6A5ACD",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userList: {
    marginTop: 10,
  },
  userItem: {
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  selectedUser: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedUserEmail: {
    fontSize: 14,
    color: "#666",
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    padding: 10,
  },
});

export default AddUserToGroup;
