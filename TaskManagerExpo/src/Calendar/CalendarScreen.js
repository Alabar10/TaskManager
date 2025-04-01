import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import config from '../config';
import { useAuth } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const CalendarScreen = () => {
  const { userId, token } = useAuth();
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [userGroups, setUserGroups] = useState([]);

  // Fetch user groups when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!userId || !token) return;
      const fetchUserGroups = async () => {
        try {
          const response = await fetch(`${config.API_URL}/groups?created_by=${userId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch user groups');
          const groups = await response.json();
          setUserGroups(groups);
        } catch (error) {
          setError(`Error fetching groups: ${error.message}`);
        }
      };

      fetchUserGroups();
    }, [userId, token])
  );

  // Fetch personal and group tasks when userGroups change
  useEffect(() => {
    if (!userId || !token || userGroups.length === 0) return;

    const fetchTasks = async () => {
      try {
        // Fetch Personal Tasks
        const personalResponse = await fetch(`${config.API_URL}/tasks/dates?user_id=${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!personalResponse.ok) throw new Error('Failed to fetch personal tasks');
    
        const personalTasks = await personalResponse.json();
        console.log('Fetched Personal Tasks:', personalTasks);
    
        let groupEvents = {};
    
        // Fetch Group Tasks
        await Promise.all(userGroups.map(async (group) => {
          try {
            const groupTasksResponse = await fetch(`${config.API_URL}/groups/${group.id}/tasks`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!groupTasksResponse.ok) return; // Skip failed group requests
    
            const groupTasks = await groupTasksResponse.json();
            console.log(`Fetched Tasks for Group ${group.id}:`, groupTasks);
    
            groupTasks.forEach((task) => {
              // Adjust Due Date to Local Time
              const dueDate = new Date(task.due_date);
              dueDate.setMinutes(dueDate.getMinutes() - dueDate.getTimezoneOffset()); // Corrects any offset issues
              const formattedDueDate = dueDate.toISOString().split('T')[0];
    
              if (!groupEvents[formattedDueDate]) {
                groupEvents[formattedDueDate] = { marked: true, dots: [], taskDetails: [] };
              }
              groupEvents[formattedDueDate].dots.push({ color: 'orange' });
              groupEvents[formattedDueDate].taskDetails.push({ ...task, isGroup: true, dateType: 'dueDate' });
    
              // Adjust Deadline to Local Time
              if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                deadlineDate.setHours(23, 59, 59, 999); // Ensure the deadline is at the end of the day
                deadlineDate.setMinutes(deadlineDate.getMinutes() - deadlineDate.getTimezoneOffset()); // Fix time zone shift
                const formattedDeadlineDate = deadlineDate.toISOString().split('T')[0];
    
                if (!groupEvents[formattedDeadlineDate]) {
                  groupEvents[formattedDeadlineDate] = { marked: true, dots: [], taskDetails: [] };
                }
                groupEvents[formattedDeadlineDate].dots.push({ color: 'red' });
                groupEvents[formattedDeadlineDate].taskDetails.push({ ...task, isGroup: true, dateType: 'deadline' });
              }
            });
    
          } catch (error) {
            console.error(`Failed to fetch tasks for group ${group.id}: ${error.message}`);
          }
        }));
    
        // Merge Personal and Group Tasks
        const combinedEvents = personalTasks.reduce((acc, task) => {
          const dueDate = new Date(task.due_date);
          dueDate.setMinutes(dueDate.getMinutes() - dueDate.getTimezoneOffset());
          const formattedDueDate = dueDate.toISOString().split('T')[0];
    
          if (!acc[formattedDueDate]) {
            acc[formattedDueDate] = { marked: true, dots: [], taskDetails: [] };
          }
    
          acc[formattedDueDate].dots.push({ color: 'blue' });
          acc[formattedDueDate].taskDetails.push({ ...task, isGroup: false, dateType: 'dueDate' });
    
          // Handle Deadlines
          if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            deadlineDate.setHours(23, 59, 59, 999); // Fixes shifting issue
            deadlineDate.setMinutes(deadlineDate.getMinutes() - deadlineDate.getTimezoneOffset());
            const formattedDeadline = deadlineDate.toISOString().split('T')[0];
    
            if (!acc[formattedDeadline]) {
              acc[formattedDeadline] = { marked: true, dots: [], taskDetails: [] };
            }
    
            acc[formattedDeadline].dots.push({ color: 'red' });
            acc[formattedDeadline].taskDetails.push({ ...task, isGroup: false, dateType: 'deadline' });
          }
    
          return acc;
        }, {});
    
        // Merge with Group Tasks
        Object.keys(groupEvents).forEach((date) => {
          if (!combinedEvents[date]) {
            combinedEvents[date] = { marked: true, dots: [], taskDetails: [] };
          }
          combinedEvents[date].dots = [...combinedEvents[date].dots, ...groupEvents[date].dots];
          combinedEvents[date].taskDetails = [...combinedEvents[date].taskDetails, ...groupEvents[date].taskDetails];
        });
    
        console.log('Combined Events:', combinedEvents);
        setEvents(combinedEvents);
      } catch (error) {
        setError(`Error fetching tasks: ${error.message}`);
      }
    };

    fetchTasks();
  }, [userId, token, userGroups]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendar Screen</Text>
      <Calendar
        markedDates={Object.keys(events).reduce((acc, date) => {
          acc[date] = { marked: true, dots: events[date]?.dots || [] };
          return acc;
        }, {})}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markingType="multi-dot"
      />
          <ScrollView style={styles.taskList}>
      {selectedDate && events[selectedDate]?.taskDetails?.length > 0 ? (
        <>
          {/* Personal Tasks */}
          {events[selectedDate].taskDetails.some(task => !task.isGroup) && (
            <>
              <Text style={styles.sectionTitle}>Personal Tasks</Text>
              {events[selectedDate].taskDetails
                .filter(task => !task.isGroup)
                .map((task, index) => (
                  <View key={`personal-${index}`} style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{task.title || 'No Title'}</Text>
                    <Text style={styles.taskTime}>
                      {task.dateType === 'deadline' ? 'Deadline: ' : 'open Task: '}
                      {new Date(task.dateType === 'deadline' ? task.deadline : task.due_date).toLocaleString([], {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true
                      })}
                    </Text>
                  </View>
                ))}
            </>
          )}

          {/* Group Tasks */}
          {events[selectedDate].taskDetails.some(task => task.isGroup) && (
            <>
              <Text style={styles.sectionTitle}>Group Tasks</Text>
              {events[selectedDate].taskDetails
                .filter(task => task.isGroup)
                .map((task, index) => (
                  <View key={`group-${index}`} style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{task.title || 'No Title'}</Text>
                    <Text style={styles.taskTime}>
                      {task.dateType === 'deadline' ? 'Deadline: ' : 'open date: '}
                      {new Date(task.dateType === 'deadline' ? task.deadline : task.due_date).toLocaleString([], {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true
                      })}
                    </Text>
                  </View>
                ))}
            </>
          )}
        </>
      ) : (
        <Text style={styles.noTasks}>No tasks available for this day.</Text>
      )}
    </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  taskList: { flex: 1, marginTop: 10 },
  taskCard: { padding: 10, marginBottom: 10, backgroundColor: 'white', borderRadius: 10 },
  taskTitle: { fontSize: 16, fontWeight: 'bold' },
  taskTime: { fontSize: 14, color: '#555' },
  noTasks: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 20 },
  error: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 20 },
});

export default CalendarScreen;
