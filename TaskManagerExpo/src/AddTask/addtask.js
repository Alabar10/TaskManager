import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('To Do');
  const [category, setCategory] = useState('General');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [dateField, setDateField] = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const statusOptions = ['To Do', 'In Progress', 'Done'];
  const categoryOptions = ['reading', 'coding', 'writing', 'exercising', 'General'];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      if (dateField === "deadline") {
        setDeadline(selectedDate);
      }
    } else {
      setTempDate(new Date());
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (event.type === "set" && selectedTime) {
      if (dateField === "deadline") {
        const updatedDate = new Date(deadline);
        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        setDeadline(updatedDate);
      }
    }
    setShowTimePicker(false);
    setDateField(null);
  };

  const openDatePicker = (field) => {
    setDateField(field);
    setTempDate(new Date());
    setTempTime(new Date());
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    if (dateField === "deadline") {
      setDeadline(tempDate);
    }
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const confirmTimeSelection = () => {
    if (dateField === "deadline") {
      setDeadline(prevDate => {
        let updatedDate = new Date(prevDate);
        updatedDate.setHours(tempTime.getHours());
        updatedDate.setMinutes(tempTime.getMinutes());
        return updatedDate;
      });
    }
    setShowTimePicker(false);
    setDateField(null);
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const handleCreateTask = async () => {
    if (!title || !description || !deadline || !priority || !status || !category) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const priorityNumber = priorityMap[priority];
    if (!priorityNumber) {
      Alert.alert('Error', 'Invalid priority selected.');
      return;
    }
    console.log("📝 Task Data Before Sending:", { title, description, deadline, priority, status, category });

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post(`${config.API_URL}/tasks`, { // Ensure the endpoint is correct
        title,
        description,
        deadline,
        priority: priorityNumber,
        status,
        category,
        user_id: userId,
      });

      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data.message || 'Failed to create task. Please try again later.'); // Improved error message
    } finally {
      setIsLoading(false);
    }
  };

  const [estimatedCompletion, setEstimatedCompletion] = useState(null); // Added missing state

const fetchEstimatedTime = async (selectedPriority, selectedCategory, estimatedTime, deadline) => {
  setEstimatedTime(null);
  setEstimatedCompletion(null); // Reset previous values

  if (!selectedPriority || !selectedCategory || !deadline) {
    console.warn("⚠️ Missing required values for prediction.");
    Alert.alert("Error", "Please select priority, category, and deadline before fetching estimated time.");
    return;
  }

  // Convert priority to numerical value
  const priorityValue = priorityMap[selectedPriority];

  if (!priorityValue) {
    console.warn("⚠️ Invalid priority selected:", selectedPriority);
    return;
  }

  // Extract start time (ISO format & Hour)
  const startTimeISO = new Date(deadline).toISOString(); // Full ISO format
  const startTimeHour = new Date(deadline).getHours(); // Extract just the hour

  console.log("📤 Fetching Estimated Time with Data:", {
    category: selectedCategory,
    priority: priorityValue,
    estimated_time: estimatedTime || 60, // Default estimated time
    start_time: startTimeISO,
  });

  try {
    const response = await axios.post(`${config.API_URL}/predict`, {
      category: selectedCategory,
      priority: priorityValue,
      estimated_time: estimatedTime || 60, // Default estimated time
      start_time: startTimeISO, // Full ISO format for consistency
    });

    console.log("🔍 API Response:", response.data);

    if (response.data && typeof response.data.predicted_time_minutes === "number") {
      const predictedMinutes = parseFloat(response.data.predicted_time_minutes);
      setEstimatedTime(predictedMinutes.toFixed(2)); // Display in minutes

      // ✅ Calculate estimated completion date/time
      const startDate = new Date(deadline);
      const completionDate = new Date(startDate.getTime() + predictedMinutes * 60000); // Convert minutes to ms

      setEstimatedCompletion(completionDate.toLocaleString()); // Show readable date & time

      console.log(`📅 Estimated Completion: ${completionDate.toLocaleString()}`);
    } else {
      console.warn("⚠️ Unexpected API response format:", response.data);
      Alert.alert("Error", "Unexpected response from server.");
    }
  } catch (error) {
    console.error("❌ Error fetching estimated time:", error);
    Alert.alert("Error", "Failed to fetch estimated time.");
  }
};

  

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Add a New Task</Text>
  
        {/* Task Title */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="format-title" size={24} color="#6A5ACD" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Title"
            placeholderTextColor="gray"
            value={title}
            onChangeText={setTitle}
          />
        </View>
  
        {/* Task Description */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="text" size={24} color="#6A5ACD" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Description"
            placeholderTextColor="gray"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
  
        {/* Deadline Selection */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => openDatePicker("deadline")}>
          <MaterialCommunityIcons name="calendar" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Deadline</Text>
            <Text style={styles.value}>
              {deadline
                ? `${formatDate(deadline)} ${new Date(deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Click to set'}
            </Text>
          </View>
        </TouchableOpacity>
  
        {/* Priority Dropdown */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowPriorityDropdown(true)}>
          <MaterialCommunityIcons name="priority-high" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Priority</Text>
            <Text style={styles.value}>{priority || 'Select Priority'}</Text>
          </View>
        </TouchableOpacity>
  
        {/* Status Dropdown */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowStatusDropdown(true)}>
          <MaterialCommunityIcons name="progress-check" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{status || 'Select Status'}</Text>
          </View>
        </TouchableOpacity>
  
        {/* Category Dropdown */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCategoryDropdown(true)}>
          <MaterialCommunityIcons name="shape" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{category || 'Select Category'}</Text>
          </View>
        </TouchableOpacity>
  
              {estimatedTime !== null && (
        <View style={styles.estimatedContainer}>
          <MaterialCommunityIcons name="clock" size={24} color="#6A5ACD" style={styles.icon} />
          <Text style={styles.estimatedText}>Estimated Time: {estimatedTime} minutes</Text>
        </View>
      )}

      {estimatedCompletion !== null && (
        <View style={styles.estimatedContainer}>
          <MaterialCommunityIcons name="calendar-check" size={24} color="#6A5ACD" style={styles.icon} />
          <Text style={styles.estimatedText}>Estimated Completion: {estimatedCompletion}</Text>
        </View>
      )}

  
        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal transparent animationType="slide" visible={showDatePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                />
                <TouchableOpacity style={styles.doneButton} onPress={confirmDateSelection}>
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
  
        {/* Time Picker Modal */}
        {showTimePicker && (
          <Modal transparent animationType="slide" visible={showTimePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setTempTime(selectedTime);
                    }
                  }}
                />
                <TouchableOpacity style={styles.doneButton} onPress={confirmTimeSelection}>
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
  
        {/* Priority Selection Modal */}
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
                  key={`priority-${index}`}
                  style={styles.option}
                  onPress={() => {
                    setPriority(option);
                    fetchEstimatedTime(option, category, estimatedTime, deadline);
                    setShowPriorityDropdown(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
          {/* Status Selection Modal */}
        <Modal
          visible={showStatusDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStatusDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Task Status</Text>
              {statusOptions.map((option, index) => (
                <TouchableOpacity
                  key={`status-${index}`}
                  style={styles.option}
                  onPress={() => {
                    setStatus(option);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Task Category</Text>
              {categoryOptions.map((option, index) => (
                <TouchableOpacity
                  key={`category-${index}`}
                  style={styles.option}
                  onPress={() => {
                    setCategory(option);
                    fetchEstimatedTime(priority, option, estimatedTime, deadline);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
  
        {/* Create Task Button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateTask} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Create Task'}</Text>
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
    color: '#6A5ACD',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dateTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
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
    color: '#6A5ACD',
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
  estimatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  estimatedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A5ACD',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  doneButton: {
    backgroundColor: '#6A5ACD',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default AddTask;
