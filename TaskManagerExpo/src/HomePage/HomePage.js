import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import config from '../config'; // Adjust the path based on your file structure

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
    console.log('API URL:', config.API_URL); // Debugging the API URL

    try {
      let response;
      if (selectedTab === "Group") {
        response = await fetch(`${config.API_URL}/groups/user/${userId}`);
        const groupsData = await response.json();
        setItems(groupsData);
      } else if (selectedTab === "All") {
        const tasksResponse = await fetch(`${config.API_URL}/tasks/user/${userId}`);
        const groupsResponse = await fetch(`${config.API_URL}/groups/user/${userId}`);
        const tasksData = await tasksResponse.json();
        const groupsData = await groupsResponse.json();
        setItems([...tasksData, ...groupsData]);
      } else { // "Personal"
        response = await fetch(`${config.API_URL}/tasks/user/${userId}`);
        const tasksData = await response.json();
        const personalTasks = tasksData.filter(task => !task.groupId); // Filter out tasks that do not have a groupId
        setItems(personalTasks);
        console.log("Personal Tasks:", personalTasks); // Debugging line to inspect personal tasks
      }
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

  const renderItem = ({ item }) => {
    const isGroupTask = selectedTab === "Group";
    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => {
          if (isGroupTask) {
            navigation.navigate("GroupTasks", { groupId: item.id, groupName: item.name });
          } else {
            navigation.navigate("TaskDetails", { task: item });
          }
        }}
      >
        <Text style={styles.taskTitle}>{item.name || item.title}</Text>
        {isGroupTask && <Text style={styles.groupDetails}>Members: {item.members?.length || 0}</Text>}
        {!isGroupTask && <Text style={styles.taskDetails}>Due: {item.due_date || "No Due Date"}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "All" && styles.activeTab]}
          onPress={() => setSelectedTab("All")}
        >
          <Text style={[styles.tabText, selectedTab === "All" && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Personal" && styles.activeTab]}
          onPress={() => setSelectedTab("Personal")}
        >
          <Text style={[styles.tabText, selectedTab === "Personal" && styles.activeTabText]}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Group" && styles.activeTab]}
          onPress={() => setSelectedTab("Group")}
        >
          <Text style={[styles.tabText, selectedTab === "Group" && styles.activeTabText]}>Group</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.id}-${item.type || item.name}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedTab === "Group" ? "No groups available." : "No tasks available for this category."}
            </Text>
          }
        />
      )}
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
});

export default HomePage;
