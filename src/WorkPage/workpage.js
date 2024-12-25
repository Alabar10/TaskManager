import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

const WorkPage = ({ navigation }) => {
  const handleTaskClick = () => {
    Alert.alert('Task', 'This is a sample task.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Work Page</Text>
      <Text style={styles.description}>
        Manage your work tasks efficiently here!
      </Text>
      
      <Button title="View Task" onPress={handleTaskClick} />
      <Button 
        title="Go Back" 
        onPress={() => navigation.goBack()} 
        style={styles.button} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});

export default WorkPage;
