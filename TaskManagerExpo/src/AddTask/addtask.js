import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AddTask = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [dateField, setDateField] = useState('');

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    if (dateField === 'dueDate') {
      setDueDate(currentDate.toISOString().split('T')[0]);
    } else if (dateField === 'deadline') {
      setDeadline(currentDate.toISOString().split('T')[0]);
    }
  };

  const showDatepicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const validateFields = () => {
    if (!title || !description || !dueDate || !deadline || !priority || !status) {
      Alert.alert('Error', 'All fields are required.');
      return false;
    }
    return true;
  };

  const handleCreateTask = async () => {
    if (!validateFields()) return;

    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('http://192.168.1.159:5000/tasks', {
        title,
        description,
        due_date: dueDate,
        deadline,
        priority: parseInt(priority, 10),
        status,
        user_id: parseInt(userId, 10),
      });

      Alert.alert('Success', 'Task created successfully!');
      navigation.navigate('HomePage'); // Navigate to homepage
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Failed to create task.');
      } else {
        Alert.alert('Error', 'Failed to connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon}  />
        </TouchableOpacity>

        <Text style={styles.heading}>Create a New Task</Text>

        <TextInput
          style={styles.input}
          placeholder="Task Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Task Description"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Due Date (YYYY-MM-DD)"
          value={dueDate}
          onFocus={() => showDatepicker('dueDate')}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Deadline (YYYY-MM-DD)"
          value={deadline}
          onFocus={() => showDatepicker('deadline')}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Priority (1, 2, 3, ...)"
          value={priority}
          onChangeText={setPriority}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Status (e.g., Pending, Completed)"
          value={status}
          onChangeText={setStatus}
        />

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateTask}>
            <Text style={styles.buttonText}>Create Task</Text>
          </TouchableOpacity>
        )}

        
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 1,
    padding: 15, // Padding for circular size
    backgroundColor: '#6A5ACD', // Updated color to SlateBlue
    borderRadius: 25, // Circular button
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Optional shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5, // Shadow for Android
  },
  backIcon: {
    fontSize: 26, // Icon size
    color: '#fff', // White icon color
  },
  
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  homeButton: {
    marginTop: 10,
    backgroundColor: '#3CB371',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddTask;
