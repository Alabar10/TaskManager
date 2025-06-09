import React, { useEffect, useState, useRef  } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import config from '../config';
import { useAuth } from '../AuthContext';
const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`);

const UserScheduleScreen = () => {
  const { userId, token } = useAuth();
  const [schedule, setSchedule] = useState(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );
  const [error, setError] = useState('');
  const scrollViewRefs = useRef(daysOfWeek.map(() => React.createRef()));

  // Fetch the saved schedule
 useEffect(() => {
  if (!userId || !token) return; // Prevent fetching until both are available

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`${config.API_URL}/schedule/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No schedule found, initializing empty schedule.");
          return;
        }
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      console.log("Fetched data:", data);

      if (data && Object.keys(data).length > 0) {
        const updatedSchedule = {};
        daysOfWeek.forEach(day => {
          if (data[day]) {
            if (Array.isArray(data[day])) {
              updatedSchedule[day] = data[day].map(slot => slot.replace(/\s+/g, ""));
            } else if (typeof data[day] === 'string') {
              updatedSchedule[day] = data[day]
                .split(",")
                .map(slot => slot.replace(/\s+/g, ""));
            } else {
              updatedSchedule[day] = [];
            }
          } else {
            updatedSchedule[day] = [];
          }
        });
        console.log("🎯 Updated Schedule State:", updatedSchedule);
        setSchedule(updatedSchedule);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setError('Error fetching schedule: ' + error.message);
    }
  };

  fetchSchedule();
}, [userId, token]);



  // Toggle selected time slot
  const toggleSlot = (day, slot) => {
    const formattedSlot = slot.replace(/\s+/g, ""); // Remove spaces for consistency

    setSchedule(prev => ({
        ...prev,
        [day]: prev[day]?.includes(formattedSlot)
            ? prev[day].filter(s => s !== formattedSlot) // Remove if exists
            : [...prev[day], formattedSlot], // Add if not exists
    }));
  };

  useEffect(() => {
    setTimeout(() => {
        scrollViewRefs.current.forEach((ref) => {
            if (ref.current) {
                ref.current.scrollTo({ x: 8 * 70, animated: true }); // Scroll to 8:00 AM
            }
        });
    }, 500); // Delay to ensure UI is rendered
  }, []);

  


  // Save schedule to database
  const handleSave = async () => {
    try {
        // Ensure we send an array for each day, as required by the backend
        const formattedSchedule = {};
        Object.keys(schedule).forEach(day => {
            formattedSchedule[day] = Array.isArray(schedule[day]) ? schedule[day] : []; // Ensure it's an array
        });

        console.log("Formatted Schedule for API:", JSON.stringify(formattedSchedule, null, 2));

        const response = await fetch(`${config.API_URL}/schedule/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formattedSchedule),
        });

        if (response.ok) {
            Alert.alert('Success', 'Schedule saved successfully!');
            console.log("Schedule saved successfully!");
        } else {
            const errorData = await response.json();
            console.error("Save error:", errorData);
            Alert.alert('Error', `Failed to save schedule: ${errorData.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        Alert.alert('Error', 'Failed to save schedule.');
    }
  };



 


  return (
      <View style={styles.container}>
          <Text style={styles.header}>Select Your Free Time</Text>
          <ScrollView style={styles.scheduleContainer}>
              {daysOfWeek.map((day,index) => (
                  <View key={day} style={styles.dayContainer}>
                      <Text style={styles.dayHeader}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                      <ScrollView horizontal ref={scrollViewRefs.current[index]} showsHorizontalScrollIndicator={false}>
                          {timeSlots.map((slot) => (
                              <TouchableOpacity
                              key={slot}
                              style={[
                                  styles.timeSlot,
                                  schedule[day]?.includes(slot.replace(/\s+/g, "")) ? styles.selectedTimeSlot : styles.unselectedTimeSlot,
                              ]}
                              onPress={() => toggleSlot(day, slot)}
                          >
                              <Text style={styles.slotText}>{slot}</Text>
                          </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>
              ))}
          </ScrollView>

          {/* Save & Delete Buttons */}
          <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save Schedule</Text>
              </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
  );
};


export default UserScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  scheduleContainer: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 15,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timeSlot: {
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedTimeSlot: {
    backgroundColor: '#007BFF',
  },
  unselectedTimeSlot: {
    backgroundColor: '#E0E0E0',
  },
  slotText: {
    fontSize: 14,
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
