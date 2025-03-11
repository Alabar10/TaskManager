import React, { useState, useEffect } from "react";
import {View,Text,FlatList,TouchableOpacity,StyleSheet,ActivityIndicator,Alert,} from "react-native";
import { useRoute, useNavigation,useFocusEffect  } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import config from "../config"; // Adjust the path based on your file structure
import axios from "axios"; // Axios for API requests
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from "@expo/vector-icons";

const GroupTasksScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId, groupName } = route.params;

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false); // Tracks if the current user is the group creator
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroupData = async () => {
    try {
      setRefreshing(true); // ✅ Start refreshing
      setIsLoading(true);

      const userId = await AsyncStorage.getItem("userId");

      const groupResponse = await fetch(`${config.API_URL}/groups?group_id=${groupId}`);
      const groupData = await groupResponse.json();
      setIsCreator(parseInt(userId, 10) === groupData.created_by);

      const tasksResponse = await fetch(`${config.API_URL}/groups/${groupId}/tasks`);
      let tasksData = await tasksResponse.json();

        tasksData = tasksData.map(task => ({
          ...task,
          status: task.status || "To Do", 
      }));

      console.log("Fetched Group Tasks Data:", tasksData); // Debugging
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setRefreshing(false); // ✅ Stop refreshing
      setIsLoading(false);
    }
  };

  // ✅ Pull-to-Refresh function
  const onRefresh = () => {
    fetchGroupData();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGroupData(); // Fetch data when screen is focused
    }, [groupId])
  );
  

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
                setIsLoading(false); // Set loading state to false after the operation
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


  const statusIcons = {
    "To Do": <FontAwesome5 name="clipboard-list" size={18} color="#FF6347" />, // Red
    "In Progress": <FontAwesome5 name="tasks" size={18} color="#FFA500" />, // Orange
    "Done": <FontAwesome5 name="check-circle" size={18} color="#32CD32" />, // Green
  };

  // Render each task
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
       <View style={styles.taskRow}>
                <Text style={styles.taskTitle}>{item.title}</Text>

                {/* ✅ Status icon aligned to the right */}
                {item.status && statusIcons[item.status] && (
                    <View style={styles.statusIconContainer}>
                        {statusIcons[item.status]}
                    </View>
                )}
            </View>

      <Text style={styles.taskDetails}>created at: {item.due_date || "No Due Date"}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#6A5ACD", "#4B0082"]} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.groupTitle}>{groupName}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" />
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

      {/* Show View Members button */}
      <TouchableOpacity
        style={styles.viewMembersButton}
        onPress={() => navigation.navigate("GroupMembers", { groupId })}
      >
        <Text style={styles.viewMembersText}>👥 View Members</Text>
      </TouchableOpacity>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 60,
    color: "#fff",
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  taskDetails: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#fff",
    marginTop: 20,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80,
    backgroundColor: "#6A5ACD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  addUserButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#FF6347",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addUserText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "#DC143C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  viewMembersButton: {
    position: "absolute",
    right: 20,
    bottom: 140,
    backgroundColor: "#6A5ACD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  viewMembersText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: "center",
},
statusIconContainer: {
    alignSelf: "flex-end", 
    marginLeft: "auto", 
    paddingRight: 10, 
},
});

export default GroupTasksScreen;