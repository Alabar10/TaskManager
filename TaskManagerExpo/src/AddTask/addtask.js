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
  const [deadline, setDeadline] = useState(null);  
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
  const categoryOptions = ['General', 'coding', 'writing', 'reading', 'exercising'];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [startTime, setStartTime] = useState(new Date());

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
        estimated_time: estimatedTime !== null ? estimatedTime : 0,  // fix here
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

  const fetchEstimatedTime = async (selectedPriority, selectedCategory, estimatedTime, startTime, deadline) => {
  setEstimatedTime(null);
  setEstimatedCompletion(null);

  if (!selectedPriority || !selectedCategory || !startTime || !deadline) {
    Alert.alert("Error", "Please select priority, category, start time, and deadline before fetching the estimated time.");
    return;
  }

  const priorityNumber = priorityMap[selectedPriority];
  const startTimeISO = new Date(startTime).toISOString();
  const deadlineISO = new Date(deadline).toISOString();

  // 🔧 Get userId from storage
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    Alert.alert("Error", "User not logged in.");
    return;
  }

  const requestData = {
    category: selectedCategory,
    priority: priorityNumber,
    estimated_time: estimatedTime && estimatedTime > 0 ? estimatedTime : 60,
    start_time: startTimeISO,
    deadline: deadlineISO,
    user_id: parseInt(userId), // ✅ ADD THIS LINE
  };

  console.log("📤 Fetching Estimated Time with Data:", requestData);

  axios
    .post(`${config.API_URL}/predict`, requestData)
    .then((response) => {
      console.log("🔍 API Response:", response.data);
      if (response.data.predicted_time_minutes) {
        setEstimatedTime(response.data.predicted_time_minutes);

        const predictedCompletion = new Date(
          new Date(startTime).getTime() + response.data.predicted_time_minutes * 60000
        );
        setEstimatedCompletion(predictedCompletion.toLocaleString());
        console.log(`📅 Estimated Completion: ${predictedCompletion}`);
      }
    })
    .catch((error) => {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Prediction failed.");
    });
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
                  textColor="#000"
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
                  textColor="#000"
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
                // Priority Selection Modal onPress
                onPress={() => {
                  const newPriority = option;  // Use the new value directly
                  setPriority(newPriority);
                  fetchEstimatedTime(newPriority, category, estimatedTime, startTime, deadline);
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
                  // Category Selection Modal onPress
                  onPress={() => {
                    const newCategory = option;
                    setCategory(newCategory);
                    fetchEstimatedTime(priority, newCategory, estimatedTime, startTime, deadline);
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
    color: "#000", // 🟢 Make text black
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
