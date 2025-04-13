import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Modal
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import config from '../config';
import { useRoute } from '@react-navigation/native';

const priorityMap = {
  'Important and Urgent': 1,
  'Important but Not Urgent': 2,
  'Not Important but Urgent': 3,
  'Not Important and Not Urgent': 4,
};
const priorityOptions = Object.keys(priorityMap);
const statusOptions = ['To Do', 'In Progress', 'Done'];

const AddGroupTask = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('To Do');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [dateField, setDateField] = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [estimatedCompletion, setEstimatedCompletion] = useState(null);
  const [startTime] = useState(new Date());
  const [category, setCategory] = useState('General');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryOptions = ['General', 'coding', 'writing', 'reading', 'exercising'];
  const route = useRoute();
  const { groupId } = route.params;
  

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

  const fetchEstimatedTime = async (selectedPriority, selectedCategory = category) => {
    setEstimatedTime(null);
    setEstimatedCompletion(null);
  
    if (!selectedPriority || !startTime || !deadline || !selectedCategory) {
      Alert.alert("Error", "Please select priority, category, and deadline first.");
      return;
    }
  
    const priorityNumber = priorityMap[selectedPriority];
    const startTimeISO = new Date(startTime).toISOString();
    const deadlineISO = new Date(deadline).toISOString();
  
    const requestData = {
      category: selectedCategory,
      priority: priorityNumber,
      estimated_time: estimatedTime && estimatedTime > 0 ? estimatedTime : 60,
      start_time: startTimeISO,
      deadline: deadlineISO,
    };
  
    try {
      const response = await axios.post(`${config.API_URL}/predict`, requestData);
      if (response.data.predicted_time_minutes) {
        setEstimatedTime(response.data.predicted_time_minutes);
        const predictedCompletion = new Date(
          new Date(startTime).getTime() + response.data.predicted_time_minutes * 60000
        );
        setEstimatedCompletion(predictedCompletion.toLocaleString());
      }
    } catch (error) {
      console.error("Error fetching estimated time:", error);
      Alert.alert('Error', 'Failed to fetch estimated time.');
    }
  };
  

  const handleCreateGroupTask = async () => {
    if (!title || !description || !deadline || !priority) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    
    const priorityNumber = priorityMap[priority];
    setIsLoading(true);
  
    try {
      const userId = await AsyncStorage.getItem('userId');
  
      if (!groupId) {
        throw new Error('No group ID found. Please select a group.');
      }
  
      const response = await axios.post(`${config.API_URL}/group-tasks`, {
        title,
        description,
        deadline,
        priority: priorityNumber,
        status,
        category,
        group_id: groupId
      });
  
      Alert.alert('Success', 'Group task created successfully!');
      navigation.goBack();
    } catch (error) {
      console.log("🧠 groupId from AsyncStorage:", groupId);
      console.log("📤 Sending task data:", {
        title,
        description,
        deadline,
        priority: priorityNumber,
        status,
        category,
        group_id: groupId
      });
      Alert.alert('Error', error.response?.data.message || error.message || 'Failed to create group task.');
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

        <Text style={styles.heading}>Add a New Group Task</Text>

        {/* Title */}
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

        {/* Description */}
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

        {/* Deadline Picker */}
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

        {/* Priority Picker */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowPriorityDropdown(true)}>
          <MaterialCommunityIcons name="priority-high" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Priority</Text>
            <Text style={styles.value}>{priority || 'Select Priority'}</Text>
          </View>
        </TouchableOpacity>

        {/* Status Picker */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowStatusDropdown(true)}>
          <MaterialCommunityIcons name="progress-check" size={24} color="#6A5ACD" style={styles.icon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{status}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCategoryDropdown(true)}>
        <MaterialCommunityIcons name="shape" size={24} color="#6A5ACD" style={styles.icon} />
        <View style={styles.dateTextContainer}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{category || 'Select Category'}</Text>
        </View>
      </TouchableOpacity>


        {/* Estimated Info */}
        {estimatedTime !== null && (
          <View style={styles.estimatedContainer}>
            <MaterialCommunityIcons name="clock" size={24} color="#6A5ACD" style={styles.icon} />
            <Text style={styles.estimatedText}>Estimated Time: {estimatedTime} minutes</Text>
          </View>
        )}
        {estimatedCompletion && (
          <View style={styles.estimatedContainer}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#6A5ACD" style={styles.icon} />
            <Text style={styles.estimatedText}>Est. Completion: {estimatedCompletion}</Text>
          </View>
        )}

        {/* Modals */}
        {showDatePicker && (
          <Modal transparent animationType="slide" visible={showDatePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => setTempDate(selectedDate || new Date())}
                />
                <TouchableOpacity style={styles.doneButton} onPress={confirmDateSelection}>
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showTimePicker && (
          <Modal transparent animationType="slide" visible={showTimePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => setTempTime(selectedTime || new Date())}
                />
                <TouchableOpacity style={styles.doneButton} onPress={confirmTimeSelection}>
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Priority Modal */}
        <Modal visible={showPriorityDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Priority</Text>
              {priorityOptions.map((option, i) => (
                <TouchableOpacity
                  key={`priority-${i}`}
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

        {/* Status Modal */}
        <Modal visible={showStatusDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Status</Text>
              {statusOptions.map((option, i) => (
                <TouchableOpacity
                  key={`status-${i}`}
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

        <Modal
          visible={showCategoryDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              {categoryOptions.map((option, index) => (
                <TouchableOpacity
                  key={`category-${index}`}
                  style={styles.option}
                  onPress={() => {
                    setCategory(option);
                    fetchEstimatedTime(priority, option);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>


        {/* Submit Button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateGroupTask}>
            <Text style={styles.buttonText}>Create Group Task</Text>
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
    elevation: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
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
  estimatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  estimatedText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A5ACD',
  },
  button: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#6A5ACD',
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

export default AddGroupTask;
