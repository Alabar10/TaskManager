import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import config from '../config'; // Ensure this points to your actual API configuration
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

const AddUserToGroup = ({ route }) => {
  const navigation = useNavigation();
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={()=> navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Add Users to Group</Text>
      </View>
    
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by username or email..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchUsers}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchUsers}
          disabled={isLoading}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addUserToGroup(item.userId)}
                disabled={isLoading}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found. Try searching!</Text>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop:20,
    marginBottom: -20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',  // Keeps it inside the header without affecting layout
    left: 10,             // Push it a little from the left
    top: '80',          
    transform: [{ translateY: -13 }], // Adjusts vertical alignment (13px is half of icon size)
    zIndex: 10,           // Ensures it's above other elements
  },  
});

export default AddUserToGroup;