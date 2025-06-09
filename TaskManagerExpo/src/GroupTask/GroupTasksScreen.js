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
  const [menuVisible, setMenuVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false); // Tracks if the current user is the group creator
  const [refreshing, setRefreshing] = useState(false);
  const [memberMap, setMemberMap] = useState({});
  const [hasNewMessages, setHasNewMessages] = useState(false);

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

      const membersResponse = await fetch(`${config.API_URL}/groups/${groupId}/members`);
      const members = await membersResponse.json();

      // Build a map: { 1: 'Alice', 2: 'Bob' }
      const map = {};
      members.forEach(member => {
        map[member.userId || member.id] = member.username || member.name;
      });
    setMemberMap(map);
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
    fetchGroupData();
    checkNewMessages();
  }, [groupId])
);

useFocusEffect(
  React.useCallback(() => {
    // Notify backend that messages are seen
    const markMessagesAsRead = async () => {
      const userId = await AsyncStorage.getItem("userId");
      await fetch(`${config.API_URL}/groups/${groupId}/chat/mark_read/${userId}`, {
        method: "POST"
      });
    };
    markMessagesAsRead();
  }, [])
);



  
const checkNewMessages = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const res = await fetch(`${config.API_URL}/groups/${groupId}/chat/unread/${userId}`);
    const data = await res.json();
    setHasNewMessages(data.hasNewMessages); // Backend should return a boolean
  } catch (err) {
    console.warn("Could not check new messages:", err);
    setHasNewMessages(false);
  }
};
useEffect(() => {
  const interval = setInterval(() => {
    checkNewMessages();
  }, 10000); // 🔁 Every 10 seconds

  return () => clearInterval(interval); // 🔁 Cleanup on unmount
}, [groupId]);



  const handleDistributeTasks = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem("userId");
  
      if (!userId) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }
  
      // ✅ Fetch group members
      const membersResponse = await fetch(`${config.API_URL}/groups/${groupId}/members`);
      if (!membersResponse.ok) {
        throw new Error("Failed to fetch group members");
      }
      const membersRaw = await membersResponse.json();
  
      // ✅ Normalize member IDs to { id: ... }
      const members = membersRaw.map((m) => ({
        id: m.id || m.userId,  // Support both formats
        name: m.name,
      }));
  
      if (!tasks || tasks.length === 0) {
        Alert.alert("No Tasks", "There are no tasks to distribute.");
        return;
      }
  
      if (members.length === 0) {
        Alert.alert("No Members", "There are no group members to assign tasks to.");
        return;
      }
  
      // ✅ Send to backend for AI distribution
      const aiResponse = await axios.post(`${config.API_URL}/groups/${groupId}/ai-distribute`, {
        tasks,
        members,
      });
  
      if (aiResponse.status === 200) {
        const updatedTasks = aiResponse.data;
  
        // 🔁 Update each task on the server
        for (const task of updatedTasks) {
          await axios.put(`${config.API_URL}/groups/${groupId}/tasks/${task.id}`, task);
        }
  
        Alert.alert("Success", "Tasks have been distributed by AI!");
        fetchGroupData(); // 🔄 Refresh updated tasks
      } else {
        Alert.alert("Error", "Failed to distribute tasks via AI.");
      }
    } catch (error) {
      console.error("AI distribution error:", error);
      Alert.alert("Error", "Something went wrong while distributing tasks.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
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
            {item.status && statusIcons[item.status] && (
              <View style={styles.statusIconContainer}>
                {statusIcons[item.status]}
              </View>
            )}
          </View>

          <Text style={styles.taskDetails}>
            created at: {item.due_date || "No Due Date"}
          </Text>

          {/* ✅ Assigned users */}
          {item.assigned_users && item.assigned_users.length > 0 && (
          <View style={styles.assignedUsersContainer}>
            <Text style={styles.taskDetails}>Assigned to:</Text>
            <View style={styles.userChipsWrapper}>
              {item.assigned_users.map((userId) => (
                <View key={userId} style={styles.userChip}>
                  <Text style={styles.userChipText}>
                    {memberMap[userId] || `User ${userId}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}



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

        <TouchableOpacity
          style={[styles.fab, { bottom: 20 }]}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.fabText}>⚙️ Options</Text>
        </TouchableOpacity>
        {menuVisible && (
            <>
              <TouchableOpacity
                style={[styles.fabMenuItem, { bottom: 80 }]}
                onPress={() => navigation.navigate("GroupMembers", { groupId })}
              >
                <Text style={styles.fabText}>👥 View Members</Text>
              </TouchableOpacity>

              {isCreator && (
                <>
                  <TouchableOpacity
                    style={[styles.fabMenuItem, { bottom: 140 }]}
                    onPress={() => navigation.navigate("AddUserToGroup", { groupId })}
                  >
                    <Text style={styles.fabText}>➕ Add User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                  style={[styles.fabMenuItem, { bottom: 200 }]}
                  onPress={() => navigation.navigate("AddGroupTask", { groupId })}
                >
                  <Text style={styles.fabText}>+ Add Task</Text>
                </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fabMenuItem, { bottom: 260 }]}
                    onPress={handleDistributeTasks}
                  >
                    <Text style={styles.fabText}>🤖 AI Distribute</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fabMenuItem, { bottom: 310, backgroundColor: "#DC143C" }]}
                    onPress={handleDeleteGroup}
                  >
                    <Text style={styles.fabText}>🗑 Delete Group</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}


     

    
    <TouchableOpacity
      style={styles.chatButton}
      onPress={() => navigation.navigate("GroupChat", { groupId, groupName })}
    >
      <Text style={styles.chatButtonText}>💬</Text>
      {hasNewMessages && <View style={styles.notificationDot} />}
    </TouchableOpacity>


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
  fabMenuItem: {
    position: "absolute",
    right: 20,
    backgroundColor: "#6A5ACD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
assignedUsersContainer: {
  marginTop: 8,
},

userChipsWrapper: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 4,
},

userChip: {
  backgroundColor: "#e0e0e0",
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 4,
  marginRight: 6,
  marginBottom: 4,
},

userChipText: {
  fontSize: 13,
  color: "#333",
  fontWeight: "500",
},
chatButton: {
  position: "absolute",
  top: 40,
  right: 20,
  backgroundColor: "#6A5ACD",
  borderRadius: 30,
  paddingVertical: 8,
  paddingHorizontal: 12,
  zIndex: 999,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 5,
},
chatButtonText: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold",
},
notificationDot: {
  position: "absolute",
  top: -2,
  right: -2,
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: "red",
  borderWidth: 1,
  borderColor: "#fff",
},


});

export default GroupTasksScreen;