import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config'; // Ensure this points to your actual API configuration

const AddUserToGroup = ({ route }) => {
  const { groupId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = async () => {
    if (!query.trim()) {
      Alert.alert("Validation Error", "Please enter a search query.");
      return;
    }
    setIsLoading(true);
    try {
      const url = `${config.API_URL}/search_users?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      } else {
        throw new Error(data.message || 'Error fetching users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert("Error", error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const addUserToGroup = async (userId) => {
    setIsLoading(true);
    try {
      const body = JSON.stringify({ group_id: groupId, user_id: userId });
      const url = `${config.API_URL}/add_user_to_group`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "User added successfully!");
      } else {
        Alert.alert("Failed to Add User", data.message || 'Failed to add user to group');
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
      Alert.alert("Error", error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search by username or email"
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={searchUsers} disabled={isLoading} />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.userId.toString()}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text>{item.username} ({item.email})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addUserToGroup(item.userId)}
              disabled={isLoading}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
    paddingTop: 50,  // Adds a top padding for better spacing from the status bar
  },
  input: {
    borderWidth: 2,
    borderColor: '#6A5ACD',  // A color that matches the button for consistency
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,  // Increase font size for better readability
    color: '#333',  // Darker font color for better contrast
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginVertical: 5,
    backgroundColor: '#FFFFFF',  // Adds a background color to each item for better focus
    borderRadius: 10,  // Rounded corners for the list items
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',  // Make text bold to stand out more
  },
  activityIndicator: {
    marginTop: 20,
  }
});

export default AddUserToGroup;
