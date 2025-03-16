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
import config from "../config"; // Adjust the path based on your file structure
import { FontAwesome5 } from "@expo/vector-icons";
import { SectionList } from "react-native";

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const navigation = useNavigation();

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
        }));

        groupsData = groupsResponse.data.map(group => ({
          ...group,
          type: "group",
        }));

        // ✅ Structure data into sections
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
        }));
        // Set items as a flat array for the "Personal" tab
        setItems(tasksData || []);
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
          } else {
            navigation.navigate("TaskDetails", { task: item });
          }
        }}
      >
        <View style={styles.taskRow}>
          <Text style={styles.taskTitle}>{item.name || item.title}</Text>

          {/* ✅ Ensure status exists before rendering the icon */}
          {item.type === "task" && item.status && statusIcons[item.status] && (
            <View style={styles.statusIconContainer}>
              {statusIcons[item.status]}
            </View>
          )}
        </View>

        {item.type === "group" ? (
          <Text style={styles.groupDetails}>Members: {item.members?.length || 0}</Text>
        ) : (
          <Text style={styles.taskDetails}>Created at: {item.due_date || "No Due Date"}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs for selecting Task type */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "All" && styles.activeTab]}
          onPress={() => setSelectedTab("All")}
        >
          <Text style={[styles.tabText, selectedTab === "All" && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Personal" && styles.activeTab]}
          onPress={() => setSelectedTab("Personal")}
        >
          <Text style={[styles.tabText, selectedTab === "Personal" && styles.activeTabText]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Group" && styles.activeTab]}
          onPress={() => setSelectedTab("Group")}
        >
          <Text style={[styles.tabText, selectedTab === "Group" && styles.activeTabText]}>
            Group
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : selectedTab === "All" ? (
        <SectionList
          sections={items.filter(section => section && section.data && section.data.length > 0)} // Ensure sections have data
          keyExtractor={(item) => item.id ? `${item.id}-${item.type}` : `${Math.random()}`} // Ensure unique keys
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
          keyExtractor={(item) => item.id ? `${item.id}-${item.type}` : `${Math.random()}`} // Ensure unique keys
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedTab === "Group" ? "No groups available." : "No tasks available for this category."}
            </Text>
          }
        />
      )}

      {/* Floating Action Button to Add Tasks/Groups */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(selectedTab === "Group" ? "Addgroup" : "AddTask")}
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
  },
  activeTab: {
    backgroundColor: "#6A5ACD",
  },
  tabText: {
    fontSize: 16,
    color: "#6A5ACD",
  },
  activeTabText: {
    color: "#FFFFFF",
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
    width: 56,
    height: 56,
    backgroundColor: "#6A5ACD",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 6,
    shadowOpacity: 0.3,
    elevation: 8,
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
});

export default HomePage;