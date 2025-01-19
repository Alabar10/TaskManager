import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import config from "../config"; // Adjust the path based on your file structure
import axios from "axios"; // Axios for API requests

const GroupTasksScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId, groupName } = route.params;

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false); // Tracks if the current user is the group creator

  // Fetch group details and tasks
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);

        // Get current user ID
        const userId = await AsyncStorage.getItem("userId");

        // Fetch group details
        const groupResponse = await fetch(`${config.API_URL}/groups?group_id=${groupId}`);
        const groupData = await groupResponse.json();

        // Check if the current user is the creator of the group
        setIsCreator(parseInt(userId, 10) === groupData.created_by);

        // Fetch group tasks
        const tasksResponse = await fetch(`${config.API_URL}/groups/${groupId}/tasks`);
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

 

  // Delete group handler
  const handleDeleteGroup = async () => {
    try {
      // Confirm the deletion
      Alert.alert(
        "Delete Group",
        "Are you sure you want to delete this group? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setIsLoading(true);
  
                // Get the current user ID
                const userId = await AsyncStorage.getItem("userId");
                if (!userId) {
                  // If userId is not found in AsyncStorage, show an error
                  Alert.alert("Error", "User not found. Please log in again.");
                  return;
                }
  
                console.log("Deleting group:", groupId);  // Debugging log
                console.log("User ID:", userId);  // Debugging log
  
                // Send DELETE request to the API
                const response = await axios.delete(`${config.API_URL}/groups/${groupId}`, {
                  headers: {
                    "Content-Type": "application/json",
                    "User-ID": userId,
                  },
                });
  
                if (response.status === 200) {
                  Alert.alert("Success", "Group deleted successfully!");
                  navigation.goBack(); // Navigate back to the previous screen
                } else {
                  // If the response is not successful, show the error message
                  Alert.alert("Error", response.data.message || "Failed to delete group.");
                }
              } catch (error) {
                // Handle any error that occurs during the DELETE request
                console.error("Error deleting group:", error);
                Alert.alert("Error", "Something went wrong while deleting the group.");
              } finally {
                setIsLoading(false);  // Set loading state to false after the operation
              }
            },
          },
        ]
      );
    } catch (error) {
      // Handle errors that occur before the Alert
      console.error("Error in delete confirmation:", error);
      Alert.alert("Error", "Something went wrong while confirming deletion.");
    }
  };
  

  // Render each task
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
      <Text style={styles.taskDetails}>Due: {item.due_date || "No Due Date"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.groupTitle}>{groupName}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks available for this group.</Text>
          }
        />
      )}

      {/* Show Add Task button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddGroupTask", { groupId })}
      >
        <Text style={styles.fabText}>+ Add Task</Text>
      </TouchableOpacity>

      {/* Show Add User button only if the current user is the group creator */}
      {isCreator && (
        <TouchableOpacity
          style={styles.addUserButton}
          onPress={() => navigation.navigate("AddUserToGroup", { groupId })}
        >
          <Text style={styles.addUserText}>+ Add User</Text>
        </TouchableOpacity>
      )}

      {/* Show Delete Group button only if the current user is the group creator */}
      {isCreator && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteGroup}
        >
          <Text style={styles.deleteButtonText}>Delete Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#6A5ACD",
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 60,
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  taskDetails: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80,
    backgroundColor: "#6A5ACD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  fabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addUserButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  addUserText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "#DC143C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default GroupTasksScreen;
