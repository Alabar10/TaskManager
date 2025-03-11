import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config"; // Ensure correct path

const GroupMembersScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params;
  
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupCreatorId, setGroupCreatorId] = useState(null); // ✅ Fix: Added missing state

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);

        // ✅ Fix: Move token declaration here before API calls
        const token = await AsyncStorage.getItem("authToken");

        // Fetch group details to get the creator ID
        const groupResponse = await fetch(`${config.API_URL}/groups/${groupId}`, {
          method: "GET", // Ensure correct method
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (!groupResponse.ok) {
          throw new Error(`Failed to fetch group details: ${await groupResponse.text()}`);
        }

        const groupData = await groupResponse.json();
        setGroupCreatorId(groupData.created_by); // ✅ Fix: Store group creator ID

        console.log(`Fetching members from: ${config.API_URL}/groups/${groupId}/members`);

        // Fetch group members
        const response = await fetch(`${config.API_URL}/groups/${groupId}/members`, {
          method: "GET", // Ensure correct method
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        const text = await response.text(); // Read response as text for debugging
        console.log("Raw API Response (Group Members):", text);

        if (!response.ok) {
          throw new Error(`Failed to fetch group members: ${text}`);
        }

        const membersData = JSON.parse(text);

        // Fetch user details for each member
        const memberDetails = await Promise.all(
          membersData.map(async (member) => {
            try {
              const userResponse = await fetch(`${config.API_URL}/user/${member.userId}`, {
                method: "GET",
                headers: {
                  "Authorization": token ? `Bearer ${token}` : "",
                  "Content-Type": "application/json",
                },
              });

              const userText = await userResponse.text();
              console.log(`User API Response (${member.userId}):`, userText);

              if (!userResponse.ok) {
                console.warn(`Failed to fetch user ${member.userId}`);
                return { ...member, username: "Unknown", email: "N/A", fname: "", lname: "" }; // Fallback data
              }

              const userData = JSON.parse(userText);
              return { ...member, ...userData }; // Merge user details into member object
            } catch (error) {
              console.error(`Error fetching user details (${member.userId}):`, error);
              return { ...member, username: "Unknown", email: "N/A", fname: "", lname: "" }; // Fallback data
            }
          })
        );

        setMembers(memberDetails);
      } catch (error) {
        console.error("Error fetching group members:", error);
        Alert.alert("Error", error.message || "Failed to load members.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.header}>Group Members</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6A5ACD" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Text style={styles.memberName}>
                {item.username} {item.userId === groupCreatorId && <Text style={styles.adminBadge}> (Admin)</Text>}
              </Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
              <Text style={styles.memberFullName}>{item.fname} {item.lname}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No members found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#6A5ACD",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 60,
  },
  memberItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  adminBadge: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5733",
  },
  memberEmail: {
    fontSize: 14,
    color: "#666",
  },
  memberFullName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
});

export default GroupMembersScreen;
