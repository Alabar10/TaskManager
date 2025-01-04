import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // Import the Picker component
import { MaterialIcons, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";

const TaskDetailsScreen = ({ route, navigation }) => {
  const { task } = route.params;

  // States for fields
  const [priority, setPriority] = useState(task.priority || "Select Priority");
  const [status, setStatus] = useState(task.status || "Pending");
  const [dueDate, setDueDate] = useState(task.due_date || "Not set");
  const [deadline, setDeadline] = useState(task.deadline || "Not set");
  const [remind, setRemind] = useState("No reminder"); // Placeholder
  const [showPriorityModal, setShowPriorityModal] = useState(false); // Modal visibility

  const renderRow = (icon, label, value, onPress) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </TouchableOpacity>
  );

  const saveChanges = () => {
    // Handle saving the updated details (e.g., update on the backend)
    Alert.alert("Changes Saved", "Task details have been updated.");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      {renderRow(
        <FontAwesome5 name="edit" size={20} color="#6A5ACD" />,
        "Title",
        task.title || "No title"
      )}
      {renderRow(
        <MaterialIcons name="description" size={20} color="#6A5ACD" />,
        "Description",
        task.description || "No description"
      )}
      {renderRow(
        <MaterialIcons name="calendar-today" size={20} color="#6A5ACD" />,
        "Due Date",
        dueDate
      )}
      {renderRow(
        <MaterialIcons name="alarm" size={20} color="#6A5ACD" />,
        "Deadline",
        deadline
      )}
      {renderRow(
        <FontAwesome name="bell" size={20} color="#6A5ACD" />,
        "Reminder",
        remind
      )}
      {renderRow(
        <FontAwesome name="exclamation-circle" size={20} color="#6A5ACD" />,
        "Priority",
        priority,
        () => setShowPriorityModal(true)
      )}
      {renderRow(
        <MaterialIcons name="assignment" size={20} color="#6A5ACD" />,
        "Status",
        status
      )}

      {/* Modal for Priority Picker */}
      <Modal
        visible={showPriorityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Priority</Text>
            <Picker
              selectedValue={priority}
              onValueChange={(itemValue) => setPriority(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Important and Urgent" value="Important and Urgent" />
              <Picker.Item label="Important but Not Urgent" value="Important but Not Urgent" />
              <Picker.Item label="Not Important but Urgent" value="Not Important but Urgent" />
              <Picker.Item label="Not Important and Not Urgent" value="Not Important and Not Urgent" />
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPriorityModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowPriorityModal(false)}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Current Item</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iconContainer: {
    width: 30,
    alignItems: "center",
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#888",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  picker: {
    height: 150,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#FF6347",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: "#6A5ACD",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: "#6A5ACD",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FF6347",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TaskDetailsScreen;
