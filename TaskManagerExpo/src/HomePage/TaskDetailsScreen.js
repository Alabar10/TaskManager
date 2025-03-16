import React, { useState, useEffect,useRef, } from 'react';
import { View,Text,TextInput,TouchableOpacity,StyleSheet,ScrollView,Modal,Alert,KeyboardAvoidingView,Platform,ActivityIndicator,} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import config from '../config'; // Adjust the path based on your file structure

const priorityMap = {
  "Important and Urgent": 1,
  "Important but Not Urgent": 2,
  "Not Important but Urgent": 3,
  "Not Important and Not Urgent": 4,
};


const reversePriorityMap = {
  1: "Important and Urgent",
  2: "Important but Not Urgent",
  3: "Not Important but Urgent",
  4: "Not Important and Not Urgent",
};


const getPriorityText = (priorityValue) => {
  if (!priorityValue || typeof priorityValue !== "number") return "Select Priority";
  return reversePriorityMap[priorityValue] || "Select Priority";
};

const TaskDetailsScreen = ({ route, navigation }) => {
  const initialTask = route.params?.task ?? {};
  const [task, setTask] = useState(initialTask);
  const [priority, setPriority] = useState(getPriorityText(initialTask.priority));
  const [status, setStatus] = useState(initialTask.status || 'Pending');
  const [dueDate, setDueDate] = useState(initialTask.due_date ? new Date(initialTask.due_date) : new Date());
  const [deadline, setDeadline] = useState(initialTask.deadline ? new Date(initialTask.deadline) : new Date());
  const [title, setTitle] = useState(initialTask.title || 'No title');
  const [description, setDescription] = useState(initialTask.description || 'No description');
  const [refreshing, setRefreshing] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  const descriptionTimeout = useRef(null);
  const [taskId, setTaskId] = useState(initialTask?.id || null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const statusOptions = ["To Do", "In Progress", "Done"];
  const [showStatusModal, setShowStatusModal] = useState(false);
  const categoryOptions = ['reading', 'coding', 'writing', 'exercising', 'General'];
  const [category, setCategory] = useState(initialTask.category || "General");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  

  

  const fetchTaskDetails = async () => {
    if (!taskId) {
        console.error("Task ID is missing. Cannot fetch task details.");
        return;
    }

    try {
        setRefreshing(true);
        console.log(`Fetching task details for ID: ${taskId}`);

        let taskData;

        if (initialTask.group_id) {
            // ✅ Fetch group task using the correct API endpoint
            const response = await axios.get(
                `${config.API_URL}/groups/${initialTask.group_id}/tasks/${taskId}`
            );

            if (response.status === 200) {
                taskData = response.data;
            }
        } else {
            // ✅ Fetch personal task normally
            const response = await axios.get(`${config.API_URL}/tasks/${taskId}`);
            if (response.status === 200) {
                taskData = response.data;
            }
        }

        if (taskData) {
            console.log("Task details fetched successfully:", taskData);
            setTask(taskData);
            setDeadline(taskData.deadline ? new Date(taskData.deadline) : new Date());
        }
    } catch (error) {
        console.error("Error fetching task details:", error);

        if (error.response?.status === 404) {
            Alert.alert("Error", "Task not found. It may have been deleted.");
            navigation.goBack();
        } else {
            Alert.alert("Error", "Failed to fetch task details.");
        }
    } finally {
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]); // ✅ Ensure refresh when taskId changes


  const formatDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return "";

    return new Date(date).toISOString().replace('T', ' ').split('.')[0]; 
};


const handleSave = async () => {
  if (!taskId) {
    console.error("Task ID is missing. Cannot update task.");
    return;
  }

  const updatedTask = {
    title,
    description,
    priority: priorityMap[priority],
    status: status,  
    due_date: formatDate(dueDate),
    deadline: formatDate(deadline),
    category,
    start_time: status === "In Progress" && !task.start_time ? new Date().toISOString() : task.start_time, // ✅ Set start_time when task starts
    actual_time: status === "Done" ? new Date().toISOString() : task.actual_time, 

  };

  console.log("🔍 Saving Task Data:", JSON.stringify(updatedTask, null, 2));

  setRefreshing(true);
  try {
    // ✅ Check if the task belongs to a group, use the correct endpoint
    const endpoint = task.group_id
      ? `${config.API_URL}/groups/${task.group_id}/tasks/${taskId}` // Group task
      : `${config.API_URL}/tasks/${taskId}`; // Personal task

    console.log("API Endpoint:", endpoint); // Debugging

    const response = await axios.put(endpoint, updatedTask);

    console.log("✅ API Response:", response.data);

    if (response.status === 200) {
      Alert.alert('Success', 'Task updated successfully!');
      setTask((prevTask) => ({ ...prevTask, ...updatedTask }));

      // ✅ Re-fetch task details after update
      fetchTaskDetails();
    }
  } catch (error) {
    console.error("🚨 Update Error:", error.response?.data || error);
    Alert.alert("Error", error.response?.data?.message || "Failed to update task.");
  } finally {
    setRefreshing(false);
  }
};


  
  const handleDescriptionChange = (text) => {
      if (descriptionTimeout.current) {
          clearTimeout(descriptionTimeout.current);
      }

      descriptionTimeout.current = setTimeout(() => {
          setDescription(text);
      }, 500);
  };

  const handleDelete = async () => {
    if (!task?.id) {
        Alert.alert("Error", "Task ID is missing. Please try again.");
        return;
    }

    const endpoint = `${config.API_URL}/tasks/${task.id}`; // ✅ Delete all tasks through /tasks/{taskId}

    console.log("Attempting DELETE request to:", endpoint);

    try {
        const response = await axios.delete(endpoint, {
            headers: { "Content-Type": "application/json" }
        });

        if (response.status === 200) {
            Alert.alert("Success", "Task deleted successfully!");
            navigation.goBack();
        } else {
            Alert.alert("Error", "Failed to delete task.");
        }
    } catch (error) {
        console.error("Error deleting task:", error);
        Alert.alert("Error", error.response?.data?.message || "Failed to delete task.");
    }
  };







  const renderRow = (icon, label, value, onPress = () => {}) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.rowContent}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    </TouchableOpacity>
  );

  const handleEdit = (field) => {
    setEditingField(field);
    setShowEditModal(true);
  };
  const openDatePicker = (field) => {
    setCurrentDateField(field);
    setTempDate(field === "dueDate" ? new Date(dueDate) : new Date(deadline));
    setShowDatePicker(true);
  };
  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate); // Temporarily store the selected date
    }
  };
  const confirmDateSelection = () => {
    if (currentDateField === "dueDate") {
      setDueDate(tempDate);
    } else if (currentDateField === "deadline") {
      setDeadline(tempDate);
    }
    setShowDatePicker(false);
    setShowTimePicker(true); // Open time picker after selecting the date
  };
  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setTempTime(selectedTime); // Temporarily store the selected time
    }
  };

  const confirmTimeSelection = () => {
    if (currentDateField === "dueDate") {
        setDueDate(prevDate => {
            let updatedDate = new Date(prevDate);
            updatedDate.setHours(tempTime.getHours());
            updatedDate.setMinutes(tempTime.getMinutes());
            updatedDate.setSeconds(0);
            return updatedDate;
        });
    } else if (currentDateField === "deadline") {
        setDeadline(prevDate => {
            let updatedDate = new Date(prevDate);
            updatedDate.setHours(tempTime.getHours());
            updatedDate.setMinutes(tempTime.getMinutes());
            updatedDate.setSeconds(0);
            return updatedDate;
        });
    }
    setShowTimePicker(false);
    setCurrentDateField(null);
};


  const refreshPage = () => {
    console.log("Refreshing calendar..."); // Debugging
    setRefreshFlag(prev => !prev); // Toggle state to re-run `useEffect`
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
  
      {renderRow(
        <FontAwesome5 name="edit" size={20} color="#6A5ACD" />,
        'Title',
        title,
        () => handleEdit('title')
      )}
  
      {renderRow(
        <MaterialIcons name="description" size={20} color="#6A5ACD" />,
        'Description',
        description,
        () => handleEdit('description')
      )}
  
      {renderRow(
        <MaterialIcons name="calendar-today" size={20} color="#6A5ACD" />,
        'open date',
        dueDate !== 'Not set'
          ? `${formatDate(dueDate)} ${dueDate instanceof Date ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
          : 'no due date',
      )}
  
     
  
      {renderRow(
        <MaterialIcons name="alarm" size={20} color="#6A5ACD" />,
        'Deadline',
        deadline !== 'Not set'
          ? `${formatDate(deadline)} ${deadline instanceof Date ? deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
          : 'Click to set',
        () => openDatePicker("deadline") // Open calendar for Deadline
      )}
  
      {showDatePicker && (
      <Modal transparent animationType="slide" visible={showDatePicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              textColor="black"
              onChange={handleDateChange} // Temporarily store the selection
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
              textColor="black"
              onChange={handleTimeChange} // Temporarily store the selection
            />
            <TouchableOpacity style={styles.doneButton} onPress={confirmTimeSelection}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )}

  
      {renderRow(
        <FontAwesome5 name="exclamation-circle" size={20} color="#6A5ACD" />,
        'Priority',
        priority,
        () => setShowPriorityModal(true)
      )}
      {renderRow(
  <FontAwesome5 name="layer-group" size={20} color="#6A5ACD" />,
  "Category",
  category,
  () => setShowCategoryModal(true) // Open category selection modal
)}

  
{/* Priority Modal */}
<Modal animationType="slide" transparent visible={showPriorityModal} onRequestClose={() => setShowPriorityModal(false)}>
  <View style={styles.modalOverlay}>
    <View style={[styles.bottomSheet, { height: '40%' }]}>
      <Text style={[styles.modalTitle, { fontSize: 20 }]}>Select Priority</Text>
      <Picker
        selectedValue={priority}
        onValueChange={(itemValue) => setPriority(itemValue)} // ✅ Store priority as text
        style={[styles.picker, { height: 200, width: 250, marginVertical: 20 }]}
        itemStyle={{ color: 'black', fontSize: 18 }}
      >
        {Object.keys(priorityMap).map((priorityText, index) => (
          <Picker.Item key={index} label={priorityText} value={priorityText} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.doneButton} onPress={() => setShowPriorityModal(false)}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      {renderRow(
      <FontAwesome5 name="tasks" size={20} color="#6A5ACD" />,
      'Status',
      status,
      () => setShowStatusModal(true) // Open status selection modal
    )}
    {/* Status Modal */}
<Modal animationType="slide" transparent visible={showStatusModal} onRequestClose={() => setShowStatusModal(false)}>
  <View style={styles.modalOverlay}>
    <View style={[styles.bottomSheet, { height: '40%' }]}>
      <Text style={[styles.modalTitle, { fontSize: 20 }]}>Select Status</Text>
      <Picker
        selectedValue={status}
        onValueChange={(itemValue) => setStatus(itemValue)}
        style={[styles.picker, { height: 200, width: 250, marginVertical: 20 }]}
        itemStyle={{ color: 'black', fontSize: 18 }} // Text color set to black
      >
        {statusOptions.map((option, index) => (
          <Picker.Item key={index} label={option} value={option} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.doneButton} onPress={() => setShowStatusModal(false)}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal animationType="slide" transparent visible={showCategoryModal} onRequestClose={() => setShowCategoryModal(false)}>
  <View style={styles.modalOverlay}>
    <View style={[styles.bottomSheet, { height: '40%' }]}>
      <Text style={[styles.modalTitle, { fontSize: 20 }]}>Select Category</Text>
      <Picker
        selectedValue={category}
        onValueChange={(itemValue) => setCategory(itemValue)}
        style={[styles.picker, { height: 200, width: 250, marginVertical: 20 }]}
        itemStyle={{ color: 'black', fontSize: 18 }}
      >
        {categoryOptions.map((option, index) => (
          <Picker.Item key={index} label={option} value={option} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.doneButton} onPress={() => setShowCategoryModal(false)}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



  
      <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
  
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
        <Text style={styles.buttonText}>Delete Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  backButton: { 
    position: 'absolute', top: -50, left: 10, 
    padding: 10, backgroundColor: '#6A5ACD', 
    borderRadius: 50, width: 40, height: 40, 
    alignItems: 'center', justifyContent: 'center', zIndex: 10 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: { width: 30, alignItems: 'center' },
  label: { flex: 1, fontSize: 16, color: '#333' },
  value: { fontSize: 16, color: '#888' },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: { 
    flex: 1, justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  editModal: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, margin: 20, width: '90%' },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 10, borderRadius: 5, marginBottom: 20 },
  doneButton: { backgroundColor: '#6A5ACD', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  actionButton: { padding: 15, marginVertical: 10, backgroundColor: '#6A5ACD', alignItems: 'center', borderRadius: 5, marginHorizontal: 50 },
  deleteButton: { backgroundColor: '#FF6347' },
  buttonText: { color: '#FFF', fontSize: 16 },
  bottomSheet: { backgroundColor: '#FFF', padding: 20, borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  picker: { width: '100%', height: 150 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});

export default TaskDetailsScreen;
