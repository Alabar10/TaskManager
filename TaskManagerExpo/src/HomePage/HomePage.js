// src/HomePage/HomePage.js
import React from 'react';
import { View, Text, StyleSheet,TouchableOpacity  } from 'react-native';
import TopTabs from "../TopTabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";


const HomePage = () => (
  <View style={styles.container}>
    {/* Include the TopTabs component at the top */}
    <TopTabs />

    {/* Main content of the HomePage */}
    <View style={styles.content}>
      <Text style={styles.heading}>Welcome to Task Manager</Text>
      <Text style={styles.subheading}>Manage your tasks efficiently</Text>
    </View>

    {/* Floating + Button */}
    <TouchableOpacity style={styles.floatingButton} onPress={() => console.log("Add Task")}>
      <MaterialCommunityIcons name="plus" size={30} color="#ffffff" />
    </TouchableOpacity>
  </View>
);



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subheading: {
    fontSize: 16,
    marginTop: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6A5ACD", // Customize the button color
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomePage;
