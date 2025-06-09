import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const JiraTaskDetails = ({ route }) => {
  const { task } = route.params;
  const navigation = useNavigation();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'done': return '#36B37E';
      case 'in progress': return '#FFAB00';
      case 'to do': return '#0052CC';
      case 'blocked': return '#FF5630';
      default: return '#5E6C84';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button and Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0052CC" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.taskKey}>{task.key || 'TASK-XXX'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{task.status || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{task.title || 'Untitled Task'}</Text>

        {task.description && (
          <>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={18} color="#5E6C84" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                {typeof task.description === 'string' 
                  ? task.description 
                  : 'No description provided'}
              </Text>
            </View>
          </>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={18} color="#5E6C84" />
            <Text style={styles.sectionTitle}>Details</Text>
          </View>

          <DetailRow icon="person" label="Assignee" value={task.assignee?.displayName || 'Unassigned'} />
          <DetailRow icon="person-outline" label="Reporter" value={task.reporter?.displayName || 'Unknown'} />
          <DetailRow icon="folder" label="Project" value={task.project || 'Not specified'} />
          <DetailRow icon="event" label="Created" value={formatDate(task.created)} />
          <DetailRow icon="update" label="Updated" value={formatDate(task.updated)} />
          <DetailRow 
            icon="warning" 
            label="Deadline" 
            value={formatDate(task.deadline)} 
            isUrgent={task.deadline && new Date(task.deadline) < new Date()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value, isUrgent }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconContainer}>
      <MaterialIcons 
        name={icon} 
        size={16} 
        color={isUrgent ? '#FF5630' : '#5E6C84'} 
      />
    </View>
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, isUrgent && styles.urgentText]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7'
  },
  container: {
    padding: 20,
    paddingTop: 10, // Reduced top padding since we have SafeAreaView
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10, // Added margin top for better spacing
  },
  backButton: {
    marginRight: 10,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'transparent', // Removed test red background
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5E6C84',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#172B4D',
    marginBottom: 20,
    lineHeight: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#172B4D',
    marginLeft: 8,
  },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DFE1E6',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#172B4D',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBECF0',
  },
  detailIconContainer: {
    width: 32,
    justifyContent: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#5E6C84',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#172B4D',
  },
  urgentText: {
    color: '#FF5630',
    fontWeight: '600',
  },
});

export default JiraTaskDetails;