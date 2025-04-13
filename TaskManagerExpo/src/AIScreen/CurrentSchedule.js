import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { CalendarProvider, WeekCalendar } from "react-native-calendars";
import axios from "axios";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CurrentSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({});
  const { userId } = useAuth();
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching schedule...");
    
        // 1️⃣ Check local storage for a saved schedule
        const savedSchedule = await AsyncStorage.getItem("savedSchedule");
    
        if (savedSchedule) {
          console.log("🛠 Fetching schedule from server for user:", userId, "...");
          const response = await axios.get(`${config.API_URL}/current-schedule/${userId}`);
          console.log("🔍 API Response:", response.data);
          
          if (Array.isArray(response.data)) {
            const formattedSchedule = formatSchedule(response.data);
            setSchedule(formattedSchedule);
          } else if (response.data.message) {
            console.warn("⚠️ Server response:", response.data.message);
            setSchedule({});
          } else {
            console.warn("❌ No valid schedule array returned from server.");
            setSchedule({});
          }
          
    
          setLoading(false);
          return;
        }
    
        // 2️⃣ If no valid schedule in local storage, fetch from the backend
        console.log("🛠 Fetching schedule from server for user:", userId, "...");
        const response = await axios.get(`${config.API_URL}/ai/current-schedule/${userId}`);
    
        console.log("🔍 API Response:", response.data);
    
        if (response.data && Array.isArray(response.data)) {
          console.log("✅ Valid schedule received from the server.");
          const formattedSchedule = formatSchedule(response.data);
          console.log("📅 Formatted schedule from server:", formattedSchedule);
    
          setSchedule(formattedSchedule);
          await AsyncStorage.setItem("savedSchedule", JSON.stringify(response.data));
        } else if (response.data && response.data.message) {
          console.warn("⚠️ Server response:", response.data.message);
          setSchedule([]); 
          await AsyncStorage.removeItem("savedSchedule"); // Clear invalid saved schedule
        } else {
          console.warn("❌ No valid schedule array returned from server.");
          setSchedule([]);
        }
      } catch (error) {
        console.error("❌ Error fetching schedule:", error);
        setSchedule([]);
      } finally {
        setLoading(false);
        console.log("✅ Finished fetching schedule.");
      }
    };
    
    if (userId) {
      fetchSchedule();
    }
  }, [userId]);

  /**
   * 🔹 formatSchedule: Ensures `tasks` is an array before processing.
   */
  const formatSchedule = (tasks) => {
    if (!Array.isArray(tasks)) {
      console.error("❌ formatSchedule received invalid tasks:", tasks);
      return {};
    }
  
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
  
    // Determine the start of the current week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // set to previous Sunday
  
    let formatted = {};
  
    tasks.forEach((entry) => {
      if (!entry || typeof entry !== "object" || !entry.day || !Array.isArray(entry.tasks)) {
        console.warn("⚠️ Skipping invalid entry:", entry);
        return;
      }
  
      const targetDayIndex = weekDays.indexOf(entry.day);
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + targetDayIndex);
      const dateStr = date.toISOString().split("T")[0];
  
      if (!formatted[dateStr]) {
        formatted[dateStr] = [];
      }
  
      formatted[dateStr].push(
        ...entry.tasks.map((task) => ({
          name: task.task || "Unnamed Task",
          groupName: task.group_name || null,
          height: (task.time || 1) * 50,
          startTime: task.start_time || "00:00",
          priority: task.priority || 4,
          duration: task.time || 1,
        }))
      );
    });
  
    return formatted;
  };
  
  

  /**
   * 🔹 formatTimeRange: Converts start time & duration into readable format.
   */
  const formatTimeRange = (startTime, duration) => {
    if (!startTime || !duration) return "Time not available";

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + duration * 60);

    const format = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
    };

    return `${format(startDate)} - ${format(endDate)}`;
  };

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          You must be logged in to view your schedule.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>
  
      <CalendarProvider date={selectedDate}>
        <WeekCalendar
          firstDay={0}
          style={styles.calendar}
          onDayPress={(day) => setSelectedDate(day.dateString)}
        />
  
        {loading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <ScrollView style={styles.taskList}>
            {schedule[selectedDate] && schedule[selectedDate].length > 0 ? (
              <View style={styles.dayContainer}>
                <Text style={styles.dayTitle}>
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                  })}
                </Text>
                {schedule[selectedDate].map((task, index) => {
                  const priorityStyle =
                    task.priority === 1
                      ? styles.highPriority
                      : task.priority === 2
                      ? styles.mediumPriority
                      : styles.lowPriority;
  
                  return (
                    <View key={index} style={[styles.taskItem, priorityStyle]}>
                      <View style={styles.taskTimeContainer}>
                        <Text style={styles.taskTime}>
                          {task.startTime.split(":").slice(0, 2).join(":")}
                        </Text>
                      </View>
                      <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>{task.name}</Text>
                        {task.groupName && (
                          <Text style={styles.groupNameLabel}>Group: {task.groupName}</Text>
                        )}
                        <Text style={styles.taskPriority}>
                          {formatTimeRange(task.startTime, task.duration)}
                          {task.priority === 1 ? " • High Priority" : 
                          task.priority === 2 ? " • Medium Priority" : " • Low Priority"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="calendar-blank" 
                  size={60} 
                  color="#E0E0E0" 
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>
                  No tasks for this day
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </CalendarProvider>
    </View>
  );
};

/** -----------------------  STYLES  ----------------------------- **/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 90,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6A5ACD",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  calendar: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 10,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  taskItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskTimeContainer: {
    backgroundColor: "#6A5ACD20", 
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6A5ACD",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  taskPriority: {
    fontSize: 12,
    color: "#666",
  },
  highPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  mediumPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  lowPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  errorText: {
    fontSize: 16,
    color: "#FF6347",
    textAlign: "center",
    marginTop: 20,
  },
});

export default CurrentSchedule;
