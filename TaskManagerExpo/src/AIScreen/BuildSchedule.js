import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, 
  ActivityIndicator, Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import config from "../config";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useAuth } from "../AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const BuildSchedule = () => {
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [taskHours, setTaskHours] = useState({});
  const [warningMessage, setWarningMessage] = useState("");
  const [totalAvailableHours, setTotalAvailableHours] = useState(0);
  const [userAvailability, setUserAvailability] = useState(null);
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [structuredTasks, setStructuredTasks] = useState({ personal: [], groups: {} });
  const allTasks = [...structuredTasks.personal, ...Object.values(structuredTasks.groups).flat()];

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
  
      setLoadingTasks(true);
      setLoadingSchedule(true);
  
      try {
        // 👉 1. Fetch personal tasks
        const tasksResponse = await axios.get(`${config.API_URL}/tasks/user/${userId}`);
        const personalTasks = tasksResponse.data.filter(task => task.status === "In Progress");
  
        // 👉 2. Fetch group tasks assigned to the user
        const groupTasksResponse = await axios.get(`${config.API_URL}/group-tasks/user/${userId}`);
        const groupTasks = groupTasksResponse.data.filter(task => task.status === "In Progress");
  
        // 👉 3. Collect all group_ids from group tasks
        const groupIds = [...new Set(groupTasks.map(t => t.group_id))];
        const groupNamesMap = {};
  
        // 👉 4. Fetch group name for each group_id
        for (const groupId of groupIds) {
          try {
            const res = await axios.get(`${config.API_URL}/groups?group_id=${groupId}`);
            groupNamesMap[groupId] = res.data.name;
          } catch (err) {
            console.warn("⚠️ Failed to fetch group name for ID:", groupId);
            groupNamesMap[groupId] = "Unknown Group";
          }
        }
  
        // 👉 5. Group groupTasks by group name
        const groupedByGroup = {};
        groupTasks.forEach(task => {
          const groupName = groupNamesMap[task.group_id] || "Unknown Group";
          if (!groupedByGroup[groupName]) groupedByGroup[groupName] = [];
          groupedByGroup[groupName].push(task);
        });
  
        // ✅ 6. Set structured task object
        setStructuredTasks({
          personal: personalTasks,
          groups: groupedByGroup,
        });
  
        // ✅ 7. Initialize task hours
        const initialHours = {};
        [...personalTasks, ...groupTasks].forEach(task => {
          initialHours[task.id] = "1";
        });
        setTaskHours(initialHours);
  
        // 🕒 8. Fetch user availability
        const scheduleResponse = await axios.get(`${config.API_URL}/schedule/${userId}`);
        if (scheduleResponse.data.message?.includes("No schedule found")) {
          setWarningMessage("Please set your availability first");
          setUserAvailability(null);
        } else {
          setUserAvailability(scheduleResponse.data);
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const availableHours = days.reduce((total, day) => total + (scheduleResponse.data[day]?.length || 0), 0);
          setTotalAvailableHours(availableHours);
  
          if (scheduleResponse.data.message?.includes("not enough available time")) {
            setWarningMessage(scheduleResponse.data.message);
          }
        }
  
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setWarningMessage("Failed to load data. Please try again.");
      } finally {
        setLoadingTasks(false);
        setLoadingSchedule(false);
      }
    };
  
    fetchData();
  }, [userId]);
  
  

  const handleHourChange = (taskId, hours) => {
    const sanitizedHours = hours.replace(/^0+/, "") || "0";
    
    if (/^\d+$/.test(sanitizedHours)) {
      const hoursInt = parseInt(sanitizedHours);
      if (hoursInt > 0 && hoursInt <= 8) { // Max 8 hours per task
        setTaskHours(prev => ({ ...prev, [taskId]: sanitizedHours }));
        setWarningMessage("");
      } else if (hoursInt > 8) {
        setWarningMessage("Maximum 8 hours per task. Split larger tasks.");
      }
    }
  };

  const generateSchedule = async () => {
    if (!userAvailability) {
      setWarningMessage("Please set your availability first");
      return;
    }
  
    setGeneratingSchedule(true);
    setWarningMessage("");
    


    try {
      const totalRequestedHours = Object.values(taskHours).reduce(
        (sum, hours) => sum + parseInt(hours || "0"), 0
      );
  
      if (totalRequestedHours === 0) {
        setWarningMessage("Please set hours for at least one task");
        return;
      }
  
      if (totalRequestedHours > totalAvailableHours) {
        setWarningMessage(`You only have ${totalAvailableHours} available hours this week`);
        return;
      }
  
      const response = await axios.post(`${config.API_URL}/ai/generate-schedule`, {
        user_id: userId,
        task_hours: taskHours,
        availability: userAvailability
      });
  
      const data = response.data;
  
      if (data.error) {
        setWarningMessage(data.error);
      } else if (data.schedule && Array.isArray(data.schedule)) {
        // ✅ Update local state
        setSchedule(data.schedule);
  
        // ✅ Save to AsyncStorage
        await AsyncStorage.setItem("savedSchedule", JSON.stringify(data.schedule));
  
        // ✅ Save to database
        try {
          await axios.post(`${config.API_URL}/save-schedule`, {
            user_id: userId,
            schedule: data.schedule,
          });
          console.log("✅ Schedule also saved to DB.");
        } catch (saveError) {
          console.log("❌ Failed to hit /save-schedule");
          console.log("Error details:", saveError.message);
          console.log("Full error:", saveError);
        }

        if (data.unassigned_tasks?.length) {
          setWarningMessage(`Couldn't schedule: ${data.unassigned_tasks.join(", ")}`);
        } else {
          setWarningMessage("");
        }
      } else {
        setWarningMessage("Schedule generation failed. Please try again.");
      }
    } catch (error) {
      console.error("Schedule generation error:", error);
      setWarningMessage(error.response?.data?.message || "Failed to generate schedule");
    } finally {
      setGeneratingSchedule(false);
    }
  };
  
  

  const chartData = useMemo(() => {
    if (!schedule.length) return { labels: [], datasets: [{ data: [] }] };

    const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const sorted = [...schedule].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    const labels = [];
    const hours = [];

    sorted.forEach(day => {
      labels.push(day.day);
      const total = (day.tasks || []).reduce((sum, task) => sum + (parseInt(task.time) || 0), 0);
      hours.push(total);
    });

    return {
      labels,
      datasets: [{ data: hours }],
    };
  }, [schedule]);

  const calculateTaskTimes = (dayTasks) => {
    let startTime = 9;
    return dayTasks.map(task => {
      const endTime = startTime + parseInt(task.time);
      const taskTime = `${startTime}:00 - ${endTime}:00`;
      startTime = endTime;
      return { ...task, taskTime };
    });
  };

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You must be logged in to view your schedule.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* Floating Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>
  
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Build Schedule for the Week</Text>
  
        {loadingTasks || loadingSchedule ? (
          <ActivityIndicator size="large" color="#6A5ACD" style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.availabilityInfo}>
              <Text style={styles.infoText}>
                Available Hours: {totalAvailableHours} | Scheduled Hours: {
                  Object.values(taskHours).reduce((sum, h) => sum + parseInt(h || "0"), 0)
                }
              </Text>
            </View>
  
            {warningMessage ? (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>{warningMessage}</Text>
              </View>
            ) : null}
  
            {!userAvailability && (
              <TouchableOpacity
                style={styles.setAvailabilityButton}
                onPress={() => navigation.navigate("Availability")}
              >
                <Text style={styles.buttonText}>Set Your Availability</Text>
              </TouchableOpacity>
            )}
  
            {/* Personal Tasks */}
            {structuredTasks.personal.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Personal Tasks</Text>
                {structuredTasks.personal.map(task => (
                  <View key={task.id} style={styles.taskRow}>
                    <Text style={styles.taskTitle}>
                      {task.title} (Priority {task.priority})
                    </Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={taskHours[task.id]?.toString()}
                      onChangeText={(text) => handleHourChange(task.id, text)}
                      placeholder="Hours"
                      maxLength={2}
                    />
                  </View>
                ))}
              </>
            )}
  
            {/* Group Tasks by Group Name */}
            {Object.entries(structuredTasks.groups).map(([groupName, tasks]) => (
              <View key={groupName}>
                <Text style={styles.sectionTitle}>{groupName}</Text>
                {tasks.map(task => (
                  <View key={task.id} style={styles.taskRow}>
                    <Text style={styles.taskTitle}>
                      {task.title} (Priority {task.priority})
                    </Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={taskHours[task.id]?.toString()}
                      onChangeText={(text) => handleHourChange(task.id, text)}
                      placeholder="Hours"
                      maxLength={2}
                    />
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
  
        {/* Generate Button */}
        {/* ✅ Generate Button */}
        <TouchableOpacity
          style={[styles.button, (generatingSchedule || !allTasks.length) && styles.disabledButton]}
          onPress={generateSchedule}
          disabled={!allTasks.length || generatingSchedule}
        >
          <Text style={styles.buttonText}>
            {generatingSchedule ? "Generating..." : "Generate Schedule"}
          </Text>
        </TouchableOpacity>

  
        {/* Schedule & Chart */}
        {schedule.length > 0 && (
          <>
            <View style={styles.scheduleContainer}>
              <Text style={styles.scheduleTitle}>Your Weekly Schedule</Text>
              {schedule.map((daySchedule, index) => {
                const dayTasks = calculateTaskTimes(daySchedule.tasks || []);
                return (
                  <View key={index} style={styles.dayContainer}>
                    <Text style={styles.dayTitle}>{daySchedule.day}</Text>
                    {dayTasks.map((task, i) => (
                      <View key={i} style={styles.taskTimeContainer}>
                        <Text style={styles.taskTime}>{task.taskTime}</Text>
                        <Text style={styles.scheduleItem}>
                          {task.task || task.name || task.title}
                          {task.group_name ? ` (Group: ${task.group_name})` : ""}
                        </Text>

                        </View>
                    ))}
                  </View>
                );
              })}
            </View>
  
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weekly Task Hours</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(106, 90, 205, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                fromZero
                style={{ marginVertical: 8 }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50, 
    paddingBottom: 40,

    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,

  },
  input: {
    width: 50,
    height: 35,
    backgroundColor: "#FFF",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#6A5ACD",
    textAlign: "center",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6A5ACD",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
  },
  scheduleContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff", // <-- make it white so you can see the contrast
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayContainer: {
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#6A5ACD",
  },
  taskTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginRight: 10,
  },
  scheduleItem: {
    fontSize: 14,
    color: "#333",
  },
  chartContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  warningContainer: {
    backgroundColor: "#FFD700", 
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  warningText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50, // adds spacing for status bar/notch
    left: 15,
    zIndex: 999,
    backgroundColor: '#6A5ACD', // make sure this contrasts with your background
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  screenWrapper: {
    flex: 1,
    position: "relative", 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B0082",
    marginTop: 20,
    marginBottom: 10,
  }
  
});

export default BuildSchedule;