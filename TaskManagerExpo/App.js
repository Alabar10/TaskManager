import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {createDrawerNavigator,DrawerContentScrollView,DrawerItemList,} from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/AuthContext";
import Register from "./src/Register/register";
import ResetFromLink from "./src/ResetEmail/ResetFromLink";
import ResetPassword from "./src/ResetEmail/ResetPassword";
import Settings from "./src/Setting/setting";
import HomePage from "./src/HomePage/HomePage";
import LoginScreen from "./src/LogIn/login";
import AddTask from "./src/AddTask/addtask";
import TaskDetailsScreen from "./src/HomePage/TaskDetailsScreen";
import GroupTasksScreen from './src/GroupTask/GroupTasksScreen';  
import AddGroupTask from "./src/AddTask/addgrouptask";
import Addgroup from "./src/AddTask/addgroup";
import AddUserToGroup from './src/GroupTask/AddUserToGroup';  
import Schedule from './src/Schedule/schedule'
import GroupMembersScreen from "./src/GroupTask/GroupMembersScreen";
import BuildSchedule from "./src/AIScreen/BuildSchedule";
import CurrentSchedule from "./src/AIScreen/CurrentSchedule";
import ChatWithAI from "./src/AIScreen/ChatWithAI";
import RequestReset from "./src/ResetEmail/RequestReset";
import * as Linking from 'expo-linking'; 
import GroupChatScreen from "./src/GroupChatScreen/GroupChatScreen";
import CalendarScreen from "./src/Calendar/CalendarScreen";
import DataScreen from "./src/Data/data"; // Ensure correct path to your data file
// Initialize Navigators
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const DataPlaceholder = () => <View style={styles.dataPlaceholder}><Text>Data Screen</Text></View>;

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      ResetFromLink: 'reset',
    },
  },
};


// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logout();
          props.navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tab Navigator - Matches your screenshot with Home, Calendar, Schedule, data
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route, navigation }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === "Home") iconName = "home";
        else if (route.name === "Calendar") iconName = "calendar";
        else if (route.name === "Schedule") iconName = "calendar-clock";
        else if (route.name === "data") iconName = "database";

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#6A5ACD",
      tabBarInactiveTintColor: "#B0B0B0",
      headerStyle: { backgroundColor: "#6A5ACD" },
      headerTintColor: "#fff",
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{ marginLeft: 15 }}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomePage} 
      options={{ title: "Task Manager" }} 
    />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Schedule" component={Schedule} />
    <Tab.Screen name="data" component={DataScreen} />
  </Tab.Navigator>
);

// Drawer Navigator
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: "back",              
      swipeEnabled: false,            
      overlayColor: "transparent",     
      drawerStyle: { width: '70%' },     
    }}
  >
    <Drawer.Screen name="Main" component={TabNavigator} />
    <Drawer.Screen name="Settings" component={Settings} />
    
  </Drawer.Navigator>
);

// Main App Component
const App = () => (
  <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="GroupTasks" component={GroupTasksScreen} />
            <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
            <Stack.Screen name="ResetFromLink" component={ResetFromLink} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="AddTask" component={AddTask} />
            <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
            <Stack.Screen name="AddGroupTask" component={AddGroupTask} />
            <Stack.Screen name="Addgroup" component={Addgroup} />
            <Stack.Screen name="AddUserToGroup" component={AddUserToGroup} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
            <Stack.Screen name="BuildSchedule" component={BuildSchedule} />
            <Stack.Screen name="CurrentSchedule" component={CurrentSchedule} />
            <Stack.Screen name="RequestReset" component={RequestReset} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} />
            <Stack.Screen name="ChatWithAI" component={ChatWithAI} />
            <Stack.Screen name="data" component={DataScreen} />

          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    padding: 10,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dataPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default App;