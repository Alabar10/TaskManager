import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios"; // Use Axios for better API handling
import config from "../config"; 
import { FontAwesome5 } from "@expo/vector-icons";
import { SectionList } from "react-native";

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const navigation = useNavigation();
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [isTabPressed, setIsTabPressed] = useState(null);
  const [isFabPressed, setIsFabPressed] = useState(false);
  const [isAiFabHovered, setIsAiFabHovered] = useState(false);
  const [isBuildPressed, setIsBuildPressed] = useState(false);
  const [isCurrentPressed, setIsCurrentPressed] = useState(false);
  const [isChatPressed, setIsChatPressed] = useState(false);
  const toggleAiModal = () => {
    setAiModalVisible(!aiModalVisible);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      console.error("User ID not found");
      setIsLoading(false);
      return;
    }

    console.log("API URL:", config.API_URL); // Debugging the API URL

    try {
      let tasksData = [];
      let groupsData = [];

      if (selectedTab === "Group") {
        // Fetch only group tasks
        const response = await axios.get(`${config.API_URL}/groups/user/${userId}`);
        groupsData = response.data.map(group => ({ ...group, type: "group" }));
        setItems(groupsData || []);
      } else if (selectedTab === "All") {
        // Fetch both tasks and groups simultaneously
        const [tasksResponse, groupsResponse] = await Promise.all([
          axios.get(`${config.API_URL}/tasks/user/${userId}`),
          axios.get(`${config.API_URL}/groups/user/${userId}`),
        ]);

        tasksData = tasksResponse.data.map(task => ({
          ...task,
          type: "task",
          status: task.status || "To Do", // Default status
        }))
        .sort((a, b) => (a.status === "Done" ? 1 : b.status === "Done" ? -1 : 0));

        groupsData = groupsResponse.data.map(group => ({
          ...group,
          type: "group",
        }));

        setItems([
          { title: "Personal Tasks", data: tasksData || [] },
          { title: "Group Tasks", data: groupsData || [] }
        ]);
      } else if (selectedTab === "Personal") {
        // Fetch only personal tasks
        const response = await axios.get(`${config.API_URL}/tasks/user/${userId}`);
        tasksData = response.data.map(task => ({
          ...task,
          type: "task",
          status: task.status || "To Do",
        }))
        .sort((a, b) => (a.status === "Done" ? 1 : b.status === "Done" ? -1 : 0));

        // Set items as a flat array for the "Personal" tab
        setItems(tasksData || []);
      }
       else if (selectedTab === "Jira") {
          try {
            const token = await AsyncStorage.getItem("userToken");
            const res = await axios.get(`${config.API_URL}/jira/issues`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const jiraTasks = res.data.map((issue) => ({
              ...issue,
              type: "jira",
            }));
            setItems(jiraTasks);
          } catch (err) {
            if (err.response?.status === 401) {
              console.log("ℹ️ User not connected to Jira. Skipping fetch.");
            } else {
              console.error("❌ Failed to fetch Jira issues:", err);
            }
            setItems([]);
          }
        }

      console.log("Fetched Items:", [...tasksData, ...groupsData]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedTab])
  );

  const handleRefresh = () => {
    fetchData();
  };

  const statusIcons = {
    "To Do": <FontAwesome5 name="clipboard-list" size={18} color="#FF6347" />, // Red
    "In Progress": <FontAwesome5 name="tasks" size={18} color="#FFA500" />, // Orange
    "Done": <FontAwesome5 name="check-circle" size={18} color="#32CD32" />, // Green
  };

  const renderItem = ({ item }) => {

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => {
        if (item.type === "group") {
          navigation.navigate("GroupTasks", {
            groupId: item.id,
            groupName: item.name,
          });
        } else if (item.type === "jira") {
          navigation.navigate("JiraTaskDetails", { task: item });
        } else {
          navigation.navigate("TaskDetails", { task: item });
        }
      }}
      >
        <View style={styles.taskRow}>
          <Text style={styles.taskTitle}>
            {item.name || item.title} {item.type === "jira" }
          </Text>

          {/* ✅ Ensure status exists before rendering the icon */}
          {item.type === "task" && item.status && statusIcons[item.status] && (
            <View style={styles.statusIconContainer}>
              {statusIcons[item.status]}
            </View>
          )}
        </View>

        {item.type === "group" ? (
        <Text style={styles.groupDetails}>
          Members: {item.members?.length || 0}
        </Text>
      ) : item.type === "jira" ? (
        <Text style={styles.taskDetails}>
          Status: {item.status || "Unknown"}
        </Text>
      ) : (
        <Text style={styles.taskDetails}>
          Created at: {item.due_date || "No Due Date"}
        </Text>
      )}

        
      </TouchableOpacity>
    );
  };

    return (
    <View style={styles.container}>
      {/* Tabs for selecting Task type */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab, 
            selectedTab === "All" && styles.activeTab,
            isTabPressed === "All" && styles.tabPressed
          ]}
          onPress={() => setSelectedTab("All")}
          onPressIn={() => setIsTabPressed("All")}
          onPressOut={() => setIsTabPressed(null)}
        >
          <Text style={[styles.tabText, selectedTab === "All" && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            selectedTab === "Personal" && styles.activeTab,
            isTabPressed === "Personal" && styles.tabPressed
          ]}
          onPress={() => setSelectedTab("Personal")}
          onPressIn={() => setIsTabPressed("Personal")}
          onPressOut={() => setIsTabPressed(null)}
        >
          <Text style={[styles.tabText, selectedTab === "Personal" && styles.activeTabText]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            selectedTab === "Group" && styles.activeTab,
            isTabPressed === "Group" && styles.tabPressed
          ]}
          onPress={() => setSelectedTab("Group")}
          onPressIn={() => setIsTabPressed("Group")}
          onPressOut={() => setIsTabPressed(null)}
        >
          <Text style={[styles.tabText, selectedTab === "Group" && styles.activeTabText]}>
            Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === "Jira" && styles.activeTab,
          isTabPressed === "Jira" && styles.tabPressed,
        ]}
        onPress={() => setSelectedTab("Jira")}
        onPressIn={() => setIsTabPressed("Jira")}
        onPressOut={() => setIsTabPressed(null)}
      >
        <Text style={[styles.tabText, selectedTab === "Jira" && styles.activeTabText]}>
          Jira
        </Text>
      </TouchableOpacity>

      </View>

      {/* Loading Indicator */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : selectedTab === "All" ? (
        <SectionList
          sections={items.filter(section => section && section.data && section.data.length > 0)}
          keyExtractor={(item) => item.id ? `${item.id}-${item.type}` : `${Math.random()}`}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks or groups available.</Text>
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id ? `${item.id}-${item.type}` : `${Math.random()}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedTab === "Group" ? "No groups available." : "No tasks available for this category."}
            </Text>
          }
        />
      )}

      {/* AI Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.aiFab,
          isAiFabHovered && styles.aiFabHovered,
          aiModalVisible && styles.aiFabActive
        ]}
        onPress={toggleAiModal}
        onPressIn={() => setIsAiFabHovered(true)}
        onPressOut={() => setIsAiFabHovered(false)}
      >
        <FontAwesome5 
          name="robot" 
          size={24} 
          color={aiModalVisible ? "#4B3A8E" : "white"} 
        />
      </TouchableOpacity>

      {/* AI Modal Buttons - Only Build and Current remain */}
      {aiModalVisible && (
        <>
          <TouchableOpacity
            style={[
              styles.radialButton, 
              styles.buildButton,
              isBuildPressed && styles.radialButtonPressed
            ]}
            onPress={() => {
              setAiModalVisible(false);
              navigation.navigate("BuildSchedule");
            }}
            onPressIn={() => setIsBuildPressed(true)}
            onPressOut={() => setIsBuildPressed(false)}
          >
            <FontAwesome5 name="tools" size={20} color="white" />
            <Text style={styles.radialText}>Build your schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radialButton, 
              styles.currentButton,
              isCurrentPressed && styles.radialButtonPressed
            ]}
            onPress={() => {
              setAiModalVisible(false);
              navigation.navigate("CurrentSchedule");
            }}
            onPressIn={() => setIsCurrentPressed(true)}
            onPressOut={() => setIsCurrentPressed(false)}
          >
            <FontAwesome5 name="calendar-alt" size={20} color="white" />
            <Text style={styles.radialText}>Current schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[
                styles.radialButton, 
                styles.chatButton,
                isChatPressed && styles.radialButtonPressed
              ]}
              onPress={() => {
                setAiModalVisible(false);
                navigation.navigate("ChatWithAI");
              }}
              onPressIn={() => setIsChatPressed(true)}
              onPressOut={() => setIsChatPressed(false)}
            >
              <FontAwesome5 name="comment" size={20} color="white" />
              <Text style={styles.radialText}>AI Chat</Text>
            </TouchableOpacity>
        </>
      )}

      {/* Main Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          isFabPressed && styles.fabPressed
        ]}
        onPress={() => navigation.navigate(selectedTab === "Group" ? "Addgroup" : "AddTask")}
        onPressIn={() => setIsFabPressed(true)}
        onPressOut={() => setIsFabPressed(false)}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A5ACD',
  },
  activeTab: {
    backgroundColor: "#6A5ACD",
    shadowColor: "#6A5ACD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tabPressed: {
    backgroundColor: "#4B3A8E",
    transform: [{ scale: 0.95 }],
  },
  tabText: {
    fontSize: 16,
    color: "#6A5ACD",
    fontWeight: '500',
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  taskItem: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  groupDetails: {
    fontSize: 14,
    color: "#666",
  },
  taskDetails: {
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    backgroundColor: "#6A5ACD",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: "#4B3A8E",
    transform: [{ scale: 0.95 }],
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f4f4f4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  aiFab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    backgroundColor: "#6A5ACD",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  aiFabHovered: {
    backgroundColor: "#5D4BB1",
    transform: [{ scale: 1.05 }],
  },
  aiFabPressed: {
    backgroundColor: "#4B3A8E",
    transform: [{ scale: 0.95 }],
  },
  aiFabActive: {
    backgroundColor: "#E0D8FF",
    borderWidth: 2,
    borderColor: "#6A5ACD",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  
  modalOption: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  
  modalOptionText: {
    fontSize: 16,
    color: "#6A5ACD",
  },
  
  modalCancel: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  
  modalCancelText: {
    fontSize: 16,
    color: "red",
  },
  radialButton: {
    position: "absolute",
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#6A5ACD",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    padding: 8,
    borderWidth: 1, 
    borderColor: "white", 
  },
  radialButtonPressed: {
    backgroundColor: "#4B3A8E",
    transform: [{ scale: 0.95 }],
  },
  radialText: {
    color: "white",
    fontSize: 10,
    textAlign: "center",
    fontWeight: '500',
    marginTop: 3,
  },
  
  buildButton: {
    bottom: 160,  
    right: 20,    
  },
  currentButton: {
    bottom: 120,  
    right: 90,    
  },
  chatButton: {
    bottom: 40,  
    right: 90,   
    backgroundColor: "#8E7CFF", 
  },
});

export default HomePage;