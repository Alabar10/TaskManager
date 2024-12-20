import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Button, StyleSheet } from 'react-native';


export default function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch tasks from the Flask backend
    axios.get('http://127.0.0.1:5000/tasks')
      .then(response => {
        setTasks(response.data.tasks); // Update tasks with the response data
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Task Manager</Text>
      {tasks.map(task => (
        <View key={task.id} style={styles.task}>
          <Text>{task.title}</Text>
        </View>
      ))}
      <Button title="Add Task" onPress={() => {/* Add task logic */}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  task: {
    marginBottom: 10,
  },
});
