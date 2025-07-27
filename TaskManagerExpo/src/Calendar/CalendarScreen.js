import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import config from '../config';
import { useAuth } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

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
          const response = await fetch(`${config.API_URL}/groups/user/${userId}`, {

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

  // Fetch tasks (same as your existing code)
useFocusEffect(
  useCallback(() => {
    if (!userId || !token) return;
        const fetchTasks = async () => {
      try {
        // Fetch Personal Tasks
          const personalResponse = await fetch(`${config.API_URL}/tasks/user/${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!personalResponse.ok) throw new Error('Failed to fetch personal tasks');
    
        const rawPersonalTasks = await personalResponse.json();
        const personalTasks = rawPersonalTasks;
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
              const dueDate = new Date(task.due_date.replace(' ', 'T'));
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
          const dueDate = new Date(task.due_date.replace(' ', 'T'));
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
  }, [userId, token, userGroups]));

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Calendar</Text>
      </View>
      
      <View style={styles.calendarContainer}>
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#5E5E5E',
            selectedDayBackgroundColor: '#4A90E2',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4A90E2',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#4A90E2',
            selectedDotColor: '#ffffff',
            arrowColor: '#4A90E2',
            monthTextColor: '#4A90E2',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
          markedDates={Object.keys(events).reduce((acc, date) => {
            acc[date] = { 
              marked: true, 
              dots: events[date]?.dots || [],
              selected: selectedDate === date
            };
            return acc;
          }, {})}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markingType="multi-dot"
        />
      </View>

      <View style={styles.tasksContainer}>
        {selectedDate ? (
          <Text style={styles.dateHeader}>{formatDateHeader(selectedDate)}</Text>
        ) : (
          <Text style={styles.dateHeader}>Select a date to view tasks</Text>
        )}
        
        <ScrollView style={styles.taskList}>
          {selectedDate && events[selectedDate]?.taskDetails?.length > 0 ? (
            <>
              {/* Personal Tasks */}
              {events[selectedDate].taskDetails.some(task => !task.isGroup) && (
                <>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="person" size={20} color="#4A90E2" />
                    <Text style={styles.sectionTitle}>Personal Tasks</Text>
                  </View>
                  {events[selectedDate].taskDetails
                    .filter(task => !task.isGroup)
                    .map((task, index) => (
                      <TouchableOpacity 
                        key={`personal-${index}`} 
                        style={[
                          styles.taskCard,
                          task.dateType === 'deadline' && styles.deadlineCard
                        ]}
                      >
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskTitle}>{task.title || 'No Title'}</Text>
                          <View style={[
                            styles.taskTypeIndicator,
                            task.dateType === 'deadline' ? 
                              styles.deadlineIndicator : styles.dueDateIndicator
                          ]}>
                            <Text style={styles.taskTypeText}>
                              {task.dateType === 'deadline' ? 'DEADLINE' : 'OPEN TASK'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.taskTimeContainer}>
                          <MaterialIcons 
                            name="access-time" 
                            size={16} 
                            color="#666" 
                            style={styles.timeIcon}
                          />
                          <Text style={styles.taskTime}>
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
                      </TouchableOpacity>
                    ))}
                </>
              )}

              {/* Group Tasks */}
              {events[selectedDate].taskDetails.some(task => task.isGroup) && (
                <>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="group" size={20} color="#FF9500" />
                    <Text style={styles.sectionTitle}>Group Tasks</Text>
                  </View>
                  {events[selectedDate].taskDetails
                    .filter(task => task.isGroup)
                    .map((task, index) => (
                      <TouchableOpacity 
                        key={`group-${index}`} 
                        style={[
                          styles.taskCard,
                          task.dateType === 'deadline' && styles.deadlineCard
                        ]}
                      >
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskTitle}>{task.title || 'No Title'}</Text>
                          <View style={[
                            styles.taskTypeIndicator,
                            task.dateType === 'deadline' ? 
                              styles.deadlineIndicator : styles.dueDateIndicator
                          ]}>
                            <Text style={styles.taskTypeText}>
                              {task.dateType === 'deadline' ? 'DEADLINE' : 'OPEN TASK'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.taskTimeContainer}>
                          <MaterialIcons 
                            name="access-time" 
                            size={16} 
                            color="#666" 
                            style={styles.timeIcon}
                          />
                          <Text style={styles.taskTime}>
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
                        <View style={styles.groupInfo}>
                          <MaterialIcons name="group" size={14} color="#FF9500" />
                          <Text style={styles.groupName}>{task.group_name || 'Group Task'}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </>
              )}
            </>
          ) : (
            <View style={styles.noTasksContainer}>
              <MaterialIcons name="event-busy" size={40} color="#D3D3D3" />
              <Text style={styles.noTasks}>No tasks scheduled</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#FF3B30" />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EB',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  taskList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  deadlineCard: {
    borderLeftColor: '#FF3B30',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    flex: 1,
  },
  taskTypeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  dueDateIndicator: {
    backgroundColor: '#E3F2FD',
  },
  deadlineIndicator: {
    backgroundColor: '#FFEBEE',
  },
  taskTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A90E2',
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeIcon: {
    marginRight: 5,
  },
  taskTime: {
    fontSize: 14,
    color: '#666',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  groupName: {
    fontSize: 13,
    color: '#FF9500',
    marginLeft: 5,
  },
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTasks: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    margin: 15,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});

export default CalendarScreen;