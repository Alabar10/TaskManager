import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import config from '../config';
import { useAuth } from '../AuthContext';

const CalendarScreen = () => {
  const { userId, token } = useAuth();
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const response = await fetch(`${config.API_URL}/groups?created_by=${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user groups');
        }

        const groups = await response.json();
        setUserGroups(groups); // Store user groups
      } catch (error) {
        setError('Error fetching groups: ' + error.message);
      }
    };

    fetchUserGroups();
  }, [userId, token]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId || !token) {
        setError('You must be logged in to view your tasks.');
        return;
      }

      try {
        const personalResponse = await fetch(
          `${config.API_URL}/tasks/dates?start_date=2025-01-01&end_date=2025-01-31&user_id=${userId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!personalResponse.ok) {
          throw new Error('Failed to fetch personal tasks');
        }

        const personalTasks = await personalResponse.json();

        let groupEvents = {};
        for (const group of userGroups) {
          const groupTasksResponse = await fetch(`${config.API_URL}/groups/${group.id}/tasks`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (groupTasksResponse.ok) {
            const groupTasks = await groupTasksResponse.json();
            const createdDate = new Date(group.created_at).toISOString().split('T')[0];

            groupEvents[createdDate] = groupEvents[createdDate] || { marked: true, dots: [] };
            groupEvents[createdDate].dots.push({ color: 'red' });
          }
        }

        const combinedEvents = personalTasks.reduce((acc, task) => {
          const dateString = new Date(task.due_date).toISOString().split('T')[0];
          acc[dateString] = acc[dateString] || { marked: true, dots: [], taskDetails: [] };
          acc[dateString].dots.push({ color: 'blue' });
          acc[dateString].taskDetails.push({ ...task, isGroup: false });
          return acc;
        }, {});

        Object.keys(groupEvents).forEach((date) => {
          combinedEvents[date] = combinedEvents[date] || { marked: true, dots: [] };
          combinedEvents[date].dots = combinedEvents[date].dots.concat(groupEvents[date].dots);
        });

        setEvents(combinedEvents);
      } catch (error) {
        setError('Error fetching tasks: ' + error.message);
      }
    };

    fetchTasks();
  }, [userId, token, userGroups]);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendar Screen</Text>

      {/* Calendar View */}
      <Calendar
        markedDates={Object.keys(events).reduce((acc, date) => {
          acc[date] = {
            marked: true,
            dots: events[date]?.dots || [],
          };
          return acc;
        }, {})}
        onDayPress={onDayPress}
        markingType={'multi-dot'}
      />

      {/* Task List */}
      <ScrollView style={styles.taskList}>
        {selectedDate && (
          <View style={styles.taskCard}>
            {/* Display Groups */}
            {userGroups.filter((group) => new Date(group.created_at).toISOString().split('T')[0] === selectedDate)
              .map((group, index) => (
                <View key={index}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.taskType}>Group Task</Text>
                </View>
              ))}
            {/* No Groups */}
            {userGroups.filter((group) => new Date(group.created_at).toISOString().split('T')[0] === selectedDate)
              .length === 0 && (
                <Text style={styles.noTasks}>No groups created on this date.</Text>
              )}
            {/* Personal Tasks */}
            {events[selectedDate]?.taskDetails?.map((task, index) => (
              <View key={index} style={styles.taskCard}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskTime}>
                  {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.taskLocation}>{task.location}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <Text style={styles.taskType}>Personal Task</Text>
              </View>
            ))}
            {/* No Personal Tasks */}
            {selectedDate && (!events[selectedDate]?.taskDetails || events[selectedDate]?.taskDetails.length === 0) && (
              <Text style={styles.noTasks}>No personal tasks available for this day.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Error Handling */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  taskList: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  taskCard: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red', // Red color for group name
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  taskTime: {
    fontSize: 14,
    color: '#555',
  },
  taskLocation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  noTasks: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default CalendarScreen;
