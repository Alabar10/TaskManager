import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import config from '../config'; // Adjust the path based on your file structure


const TaskDetailsScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [priority, setPriority] = useState(task.priority || 'Select Priority');
  const [status, setStatus] = useState(task.status || 'Pending');
  const [dueDate, setDueDate] = useState(task.due_date || 'Not set');
  const [deadline, setDeadline] = useState(task.deadline || 'Not set');
  const [title, setTitle] = useState(task.title || 'No title');
  const [description, setDescription] = useState(task.description || 'No description');
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false); // Missing declaration added
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState("");

  const priorityMap = {
    'Important and Urgent': 1,
    'Important but Not Urgent': 2,
    'Not Important but Urgent': 3,
    'Not Important and Not Urgent': 4,
  };

  const formatDate = (date) => new Date(date).toISOString().split('T')[0];
  
  
  
  const handleSave = async () => {
    console.log('API URL:', config.API_URL); // Before saving
    const payload = {
      title,
      description,
      priority: priorityMap[priority],
      status,
      due_date: formatDate(dueDate),
      deadline: formatDate(deadline),
    };

    try {
      const response = await axios.put(`${config.API_URL}/tasks/${task.id}`, payload);
      if (response.status === 200) {
        Alert.alert('Success', 'Task updated successfully!');
        navigation.goBack();
      } else {
        throw new Error('Server error while saving');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update task.');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    console.log('API URL:', config.API_URL); // Before saving

    try {
        const response = await axios.delete(`${config.API_URL}/tasks/delete/${task.id}`);
        if (response.status === 200) {
            Alert.alert('Success', 'Task deleted successfully!');
            navigation.goBack();
        } else {
            throw new Error('Failed to delete task.');
        }
    } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to delete task.');
        console.error(error);
    }
};


const handleEdit = (field) => {
  setEditingField(field);
  // Show the edit modal after setting which field is being edited
  setShowEditModal(true);
};



  const handleDateChange = (event, selectedDate) => {
    if (event.type === "set" && selectedDate) {
      if (currentDateField === "dueDate") {
        setDueDate(selectedDate); // Temporarily store the date
        setShowTimePicker(true); // Show the time picker
      } else if (currentDateField === "deadline") {
        setDeadline(selectedDate); // Temporarily store the date
        setShowTimePicker(true); // Show the time picker
      }
    }
    setShowDatePicker(false); // Close the date picker
  };
  

  
  
  const handleTimeChange = (event, selectedTime) => {
    if (event.type === "set" && selectedTime) {
      if (currentDateField === "dueDate") {
        const updatedDate = new Date(dueDate);
        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        setDueDate(updatedDate); // Update due date with time
      } else if (currentDateField === "deadline") {
        const updatedDate = new Date(deadline);
        updatedDate.setHours(selectedTime.getHours());
        updatedDate.setMinutes(selectedTime.getMinutes());
        setDeadline(updatedDate); // Update deadline with time
      }
    }
    setShowTimePicker(false); // Close the time picker
    setCurrentDateField(null); // Reset the current field
  };
  
  
  const openDatePicker = (field) => {
    setCurrentDateField(field);
    setShowDatePicker(true);
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
  
  console.log(`Rendering with title: ${title}`);

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
  'Due Date',
  dueDate !== 'Not set'
    ? `${formatDate(dueDate)} ${dueDate instanceof Date ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
    : 'Click to set',
  () => openDatePicker("dueDate") // Open calendar for Due Date
)}

{currentDateField === 'dueDate' && showDatePicker && (
  <DateTimePicker
    value={dueDate !== 'Not set' ? new Date(dueDate) : new Date()}
    mode="date"
    display="default"
    onChange={handleDateChange}
  />
)}

{currentDateField === 'dueDate' && showTimePicker && (
  <DateTimePicker
    value={dueDate !== 'Not set' ? new Date(dueDate) : new Date()}
    mode="time"
    display="default"
    onChange={handleTimeChange}
  />
)}

{renderRow(
  <MaterialIcons name="alarm" size={20} color="#6A5ACD" />,
  'Deadline',
  deadline !== 'Not set'
    ? `${formatDate(deadline)} ${deadline instanceof Date ? deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
    : 'Click to set',
  () => openDatePicker("deadline") // Open calendar for Deadline
)}

{currentDateField === 'deadline' && showDatePicker && (
  <DateTimePicker
    value={deadline !== 'Not set' ? new Date(deadline) : new Date()}
    mode="date"
    display="default"
    onChange={handleDateChange}
  />
)}

{currentDateField === 'deadline' && showTimePicker && (
  <DateTimePicker
    value={deadline !== 'Not set' ? new Date(deadline) : new Date()}
    mode="time"
    display="default"
    onChange={handleTimeChange}
  />
)}





{renderRow(
        <FontAwesome5 name="exclamation-circle" size={20} color="#6A5ACD" />,
        'Priority',
        priority,
        () => setShowPriorityModal(true)
      )}





      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>Edit {editingField}</Text>
            <TextInput
              style={styles.input}
              value={editingField === 'title' ? title : description}
              onChangeText={(text) => {
                console.log(`Updating ${editingField} to ${text}`);  // Debug log
                if (editingField === 'title') setTitle(text);
                else if (editingField === 'description') setDescription(text);
              }}
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Priority Modal */}
      <Modal
  animationType="slide"
  transparent={true}
  visible={showPriorityModal}
  onRequestClose={() => setShowPriorityModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.bottomSheet, { height: '40%' }]}>
      <Text style={[styles.modalTitle, { fontSize: 20 }]}>Select Priority</Text>
      <Picker
        selectedValue={priority}
        onValueChange={(itemValue) => setPriority(itemValue)}
        style={[styles.picker, { height: 200,width:250, marginVertical: 20 }]}
        itemStyle={{ color: 'black', fontSize: 18 }} // Text color set to black

      >
        <Picker.Item label="Important and Urgent" value="Important and Urgent" />
        <Picker.Item label="Important but Not Urgent" value="Important but Not Urgent" />
        <Picker.Item label="Not Important but Urgent" value="Not Important but Urgent" />
        <Picker.Item label="Not Important and Not Urgent" value="Not Important and Not Urgent" />
      </Picker>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => setShowPriorityModal(false)}
      >
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
  backButton: { position: 'absolute', top: 1-50, left: 10, padding: 10, backgroundColor: '#6A5ACD', borderRadius: 50, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
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
  
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  editModal: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, margin: 20, width: '90%' },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 10, borderRadius: 5, marginBottom: 20 },
  doneButton: { backgroundColor: '#6A5ACD', padding: 10, borderRadius: 5, alignItems: 'center' },
  actionButton: { padding: 15, marginVertical: 10, backgroundColor: '#6A5ACD', alignItems: 'center', borderRadius: 5, marginHorizontal: 50 },
  deleteButton: { backgroundColor: '#FF6347' },
  buttonText: { color: '#FFF', fontSize: 16 },
  bottomSheet: { backgroundColor: '#FFF', padding: 20, borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  picker: { width: '100%', height: 150 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});

export default TaskDetailsScreen;
