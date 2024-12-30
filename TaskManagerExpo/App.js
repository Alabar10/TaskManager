import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Register from "./src/Register/register";
import ResetEmail from "./src/ResetEmail/ResetEmail";
import ResetPassword from "./src/ResetEmail/ResetPassword";
import Settings from "./src/Setting/setting";
import HomePage from "./src/HomePage/HomePage";
import LoginScreen from "./src/LogIn/login";

// Initialize Drawer Navigator
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          props.navigation.reset({
            index: 0,
            routes: [{ name: "Login" }], // Resets to the Login page
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
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tab Navigator
const TabNavigator = ({ route }) => {
  const { userId } = route.params || {}; // Pass userId if available

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Wallet") iconName = "wallet";
          else if (route.name === "Analytics") iconName = "chart-line";
          else if (route.name === "Settings") iconName = "cog";

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6A5ACD",
        tabBarInactiveTintColor: "#B0B0B0",
        headerStyle: {
          backgroundColor: "#6A5ACD",
        },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()} // Toggles the drawer
            style={{ marginLeft: 15 }}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen
        name="Settings"
        children={() => <Settings route={{ params: { userId } }} />}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = ({ route }) => {
  const { userId } = route.params || {};

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Task Manager">
        {() => <TabNavigator route={{ params: { userId } }} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

// Main Stack Navigator
const App = () => (
  <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
          <Stack.Screen name="ResetEmail" component={ResetEmail} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="Settings" component={Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  </SafeAreaProvider>
);

// Additional screens
const WalletScreen = () => (
  <View style={styles.screenContainer}>
    <Text>Wallet Screen</Text>
  </View>
);

const AnalyticsScreen = () => (
  <View style={styles.screenContainer}>
    <Text>Analytics Screen</Text>
  </View>
);

// Styles
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
});

export default App;
