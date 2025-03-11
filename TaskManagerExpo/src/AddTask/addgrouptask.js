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

const AddGroupTask = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('To Do');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [dateField, setDateField] = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const statusOptions = ['To Do', 'In Progress', 'Done'];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

  const handleCreateGroupTask = async () => {
    if (!title || !description || !deadline || !priority) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const priorityNumber = priorityMap[priority];
    if (!priorityNumber) {
      Alert.alert('Error', 'Invalid priority selected.');
      return;
    }

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const groupId = await AsyncStorage.getItem('groupId'); 
       // Log the request payload
      console.log("Sending request payload:", {
      title,
      description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority: priorityNumber,
      status,
      group_id: groupId
    });
      const response = await axios.post(`${config.API_URL}/group-tasks`, {
        title,
        description,
        deadline,
        priority: priorityNumber,
        status,
        group_id: groupId
      });

      Alert.alert('Success', 'Group task created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data.message || 'Failed to create group task. Please ensure all fields are filled out correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEstimatedTime = async (selectedPriority) => {
    setEstimatedTime(null);
    try {
      const response = await axios.post(`${config.API_URL}/predict-task-time`, {
        priority: priorityMap[selectedPriority],
      });

      if (response.data.predicted_time) {
        setEstimatedTime(response.data.predicted_time);
      }
    } catch (error) {
      console.error("Error fetching estimated time:", error);
      Alert.alert('Error', 'Failed to fetch estimated time.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Add a New Group Task</Text>

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

        {/* Estimated Time */}
        {estimatedTime !== null && (
          <View style={styles.estimatedContainer}>
            <MaterialCommunityIcons name="clock" size={24} color="#6A5ACD" style={styles.icon} />
            <Text style={styles.estimatedText}>Estimated Completion Time: {estimatedTime} minutes</Text>
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
                  themeVariant="dark"
                  textColor="black"
                  onChange={handleDateChange}
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
                  themeVariant="dark"
                  textColor="black"
                  onChange={handleTimeChange}
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
                  key={index}
                  style={styles.option}
                  onPress={() => {
                    setPriority(option);
                    fetchEstimatedTime(option);
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
                  key={index}
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

        {/* Create Task Button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateGroupTask} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Create Group Task'}</Text>
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

export default AddGroupTask;