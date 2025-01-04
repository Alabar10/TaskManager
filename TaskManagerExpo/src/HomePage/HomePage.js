import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const HomePage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      const response = await fetch(`http://192.168.1.42:5000/tasks/user/${userId}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  taskItem: {
    padding: 16,
    marginVertical: 8,
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
});

export default HomePage;
