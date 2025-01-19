import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import config from '../config'; // Adjust the path based on your file structure

const priorityMap = {
  'Important and Urgent': 1,
  'Important but Not Urgent': 2,
  'Not Important but Urgent': 3,
  'Not Important and Not Urgent': 4,
};
const priorityOptions = Object.keys(priorityMap);

const AddTask = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [dateField, setDateField] = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);


  const handleDateChange = (event, selectedDate) => {
    if (event.type === "set" && selectedDate) {
      if (dateField === "dueDate") {
        setDueDate(selectedDate); // Temporarily store the date
        setShowTimePicker(true); // Show the time picker after date selection
      } else if (dateField === "deadline") {
        setDeadline(selectedDate); // Temporarily store the date
        setShowTimePicker(true); // Show the time picker after date selection
      }
    }
    setShowDatePicker(false); // Close the date picker
  };
  
  const handleTimeChange = (event, selectedTime) => {
    if (event.type === "set" && selectedTime) {
      if (dateField === "dueDate") {
        const updatedDate = new Date(dueDate);
        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        setDueDate(updatedDate); // Update due date with time
      } else if (dateField === "deadline") {
        const updatedDate = new Date(deadline);
        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        setDeadline(updatedDate); // Update deadline with time
      }
    }
    setShowTimePicker(false); // Close the time picker
    setDateField(null); // Reset the current field
  };
  
  const showDatepicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleCreateTask = async () => {
    if (!title || !description || !dueDate || !deadline || !priority || !status) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
  
    const priorityNumber = priorityMap[priority];
    if (!priorityNumber) {
      Alert.alert('Error', 'Invalid priority selected.');
      return;
    }
    console.log('API URL:', config.API_URL); // Debugging the API URL

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post('${config.API_URL}/tasks', {
        title,
        description,
        due_date: dueDate,
        deadline,
        priority: priorityNumber,
        status,
        user_id: userId,
      });
  
      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data.message || 'Failed to create task.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Create a New Task</Text>
        <TextInput
          style={styles.input}
          placeholder="Task Title"
          placeholderTextColor="gray" // Makes the placeholder visible

          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Task Description"
          placeholderTextColor="gray" // Makes the placeholder visible

          value={description}
          onChangeText={setDescription}
        />
       {/* Due Date Input */}
<View>
  <TouchableOpacity
    style={[styles.input, styles.dateInput]}
    onPress={() => showDatepicker('dueDate')}
  >
    <Text style={{ color: dueDate ? 'black' : 'gray' }}>
      {dueDate
        ? `${new Date(dueDate).toLocaleDateString()} ${new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Select Due Date'}
    </Text>
  </TouchableOpacity>
  {dateField === 'dueDate' && showDatePicker && (
    <DateTimePicker
      value={dueDate ? new Date(dueDate) : new Date()}
      mode="date"
      display="default"
      onChange={handleDateChange}
    />
  )}
  {dateField === 'dueDate' && showTimePicker && (
    <DateTimePicker
      value={dueDate ? new Date(dueDate) : new Date()}
      mode="time"
      display="default"
      onChange={handleTimeChange}
    />
  )}
</View>

{/* Deadline Input */}
<View>
  <TouchableOpacity
    style={[styles.input, styles.dateInput]}
    onPress={() => showDatepicker('deadline')}
  >
    <Text style={{ color: deadline ? 'black' : 'gray' }}>
      {deadline
        ? `${new Date(deadline).toLocaleDateString()} ${new Date(deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Select Deadline'}
    </Text>
  </TouchableOpacity>
  {dateField === 'deadline' && showDatePicker && (
    <DateTimePicker
      value={deadline ? new Date(deadline) : new Date()}
      mode="date"
      display="default"
      onChange={handleDateChange}
    />
  )}
  {dateField === 'deadline' && showTimePicker && (
    <DateTimePicker
      value={deadline ? new Date(deadline) : new Date()}
      mode="time"
      display="default"
      onChange={handleTimeChange}
    />
  )}
</View>

       {/* Priority Dropdown */}
       <TouchableOpacity
  style={[styles.input, styles.dateInput]}
  onPress={() => setShowPriorityDropdown(true)}
>
  <Text style={{ color: priority ? 'black' : 'gray' }}>
    {priority || 'Select Priority'}
  </Text>
</TouchableOpacity>
<Modal
  visible={showPriorityDropdown}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowPriorityDropdown(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Priority</Text>
      {priorityOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.option}
          onPress={() => {
            setPriority(option);
            setShowPriorityDropdown(false);
          }}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>


        <TextInput
          style={styles.input}
          placeholder="Status (e.g., Pending, Completed)"
          value={status}
          onChangeText={setStatus}
          placeholderTextColor="gray" // Makes the placeholder visible

        />
       
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
    top: 30,
    left: 10,
    padding: 10,
    backgroundColor: '#6A5ACD',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  dateInput: {
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});


export default AddTask;
