import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './src/HomePage/HomePage';  // Your HomePage component
import Login from './src/LogIn/login';  // Your Login component

// Create the drawer and stack navigators
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Create the stack navigator for screens
const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomePage" 
        component={HomePage}
        options={{
          title: 'Home',
          headerStyle: { 
            backgroundColor: '#644de9' // Navbar background color
          },
          headerTintColor: '#fff', // Navbar text color
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{
          title: 'Login',
          headerStyle: { 
            backgroundColor: '#e02b2b' // Navbar color for Login screen
          },
          headerTintColor: '#fff', // Navbar text color for Login screen
        }} 
      />
    </Stack.Navigator>
  );
};

// Create the drawer navigator for other menu items
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <View style={styles.drawerContent}>
          <View style={styles.drawerItems}>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => props.navigation.navigate('HomePage')}
            >
              <Text>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => props.navigation.navigate('Settings')}
            >
              <Text>Settings</Text>
            </TouchableOpacity>
            {/* More menu items can be added here */}
          </View>

          {/* Log In button aligned to the right in the drawer */}
          <View style={styles.loginButtonContainer}>
            <TouchableOpacity
              onPress={() => props.navigation.navigate('Login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      <Drawer.Screen name="Home" component={StackNavigator} />
      {/* Add more screens in the drawer as needed */}
    </Drawer.Navigator>
  );
};

// Main App component that holds the navigation container and the drawer
const App = () => {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
};

// Styles for customizing the drawer content and positioning the Log In button to the right
const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItems: {
    flex: 1,
    paddingHorizontal: 10,
  },
  drawerItem: {
    padding: 15,
    backgroundColor: '#f4f4f4',
    marginBottom: 5,
  },
  loginButtonContainer: {
    padding: 15,
    justifyContent: 'flex-end', // Push to the bottom if desired
    alignItems: 'flex-end', // Align the button to the right
  },
  loginButton: {
    padding: 10,
    backgroundColor: '#644de9',
    borderRadius: 5,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default App;
