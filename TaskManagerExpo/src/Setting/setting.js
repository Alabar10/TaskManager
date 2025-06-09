import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import config from '../config';

const Settings = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({ fname: '', lname: '', email: '', password: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraDomain, setJiraDomain] = useState('');
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' or 'jira'

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Settings",
      headerStyle: { 
        backgroundColor: "#6A5ACD",
        elevation: 0,
        shadowOpacity: 0 
      },
      headerTintColor: "#fff",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{ marginLeft: 15 }}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
 const fetchUserData = async () => {
  if (!userId) {
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch(`${config.API_URL}/user/${userId}`);
    const data = await response.json();
    if (response.ok) {
      setUser(data);

      // 🟦 If your backend returns Jira fields, populate them:
      if (data.jira_email) setJiraEmail(data.jira_email);
      if (data.jira_token) setJiraToken(data.jira_token);
      if (data.jira_domain) setJiraDomain(data.jira_domain);
    } else {
      Alert.alert('Error', data.message || 'Failed to fetch user data.');
    }
  } catch (error) {
    Alert.alert('Error', 'Unable to fetch user data.');
    console.error('Fetch Error:', error);
  } finally {
    setIsLoading(false);
  }
};


  const handleSaveJiraConfig = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !jiraEmail || !jiraToken || !jiraDomain) {
        Alert.alert("Error", "All Jira fields are required.");
        return;
      }

      const res = await fetch(`${config.API_URL}/jira/manual-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: jiraEmail,
          token: jiraToken,
          domain: jiraDomain,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Jira connection saved successfully!");
      } else {
        Alert.alert("Error", data.message || "Could not save Jira connection.");
      }
    } catch (err) {
      console.error("Error saving Jira config:", err);
      Alert.alert("Error", "Something went wrong while saving Jira configuration.");
    }
  };

  useEffect(() => {
    const getUserIdFromStorage = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserIdFromStorage();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleUpdateInfo = async () => {
    if (!user) {
      Alert.alert("Error", "No user data to update.");
      return;
    }

    try {
      const updatedData = { ...user, userId, password: user.password || undefined };
      const response = await fetch(`${config.API_URL}/update_user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to update profile.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update profile information.");
      console.error('Update Error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'profile' && styles.activeTab]}
          onPress={() => setActiveSection('profile')}
        >
          <MaterialIcons 
            name="person" 
            size={20} 
            color={activeSection === 'profile' ? '#6A5ACD' : '#666'} 
          />
          <Text style={[styles.tabText, activeSection === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'jira' && styles.activeTab]}
          onPress={() => setActiveSection('jira')}
        >
          <MaterialCommunityIcons 
            name="jira" 
            size={20} 
            color={activeSection === 'jira' ? '#6A5ACD' : '#666'} 
          />
          <Text style={[styles.tabText, activeSection === 'jira' && styles.activeTabText]}>
            Jira Integration
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'profile' ? (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={user.fname || ''}
              onChangeText={(text) => setUser((prev) => ({ ...prev, fname: text }))}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe"
              value={user.lname || ''}
              onChangeText={(text) => setUser((prev) => ({ ...prev, lname: text }))}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="john.doe@example.com"
              value={user.email || ''}
              onChangeText={(text) => setUser((prev) => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                value={user.password || ''}
                onChangeText={(text) => setUser((prev) => ({ ...prev, password: text }))}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <MaterialCommunityIcons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>Leave blank to keep current password</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleUpdateInfo}
          >
            <Text style={styles.buttonText}>Save Profile Changes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Jira Integration</Text>
          <Text style={styles.sectionDescription}>
            Connect your Jira account to sync your projects and issues.
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jira Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@company.com"
              value={jiraEmail}
              onChangeText={setJiraEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jira API Token</Text>
            <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••••••••••"
              value={jiraToken}
              onChangeText={setJiraToken}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <MaterialCommunityIcons
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://id.atlassian.com/manage-profile/security/api-tokens')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                <MaterialCommunityIcons name="help-circle" size={14} color="#6A5ACD" /> Where do I get my API token?
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jira Domain</Text>
            <TextInput
              style={styles.input}
              placeholder="your-domain.atlassian.net"
              value={jiraDomain}
              onChangeText={setJiraDomain}
              autoCapitalize="none"
            />
            <Text style={styles.hintText}>
              Example: If your Jira URL is "https://mycompany.atlassian.net", enter "mycompany.atlassian.net"
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={18} color="#6A5ACD" />
            <Text style={styles.infoText}>
              Your credentials are encrypted and stored securely. We only use them to sync your Jira data.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.jiraButton]} 
            onPress={handleSaveJiraConfig}
          >
            <MaterialCommunityIcons name="jira" size={20} color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Save Jira Connection</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6A5ACD',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6A5ACD',
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  linkContainer: {
    marginTop: 5,
  },
  linkText: {
    color: '#6A5ACD',
    fontSize: 13,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f0ff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#6A5ACD',
  },
  jiraButton: {
    backgroundColor: '#0052CC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Settings;