import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  SafeAreaView, Image, ActivityIndicator, Alert
} from "react-native";
import axios from "axios";
import config from "../config";
import { useAuth } from "../AuthContext";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { Linking } from "react-native";

const GroupChatScreen = () => {
  const { userId } = useAuth();
  const route = useRoute();
  const { groupId, groupName } = route.params;
  const navigation = useNavigation();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);

  const isImageFile = (fileUrl) => {
    if (!fileUrl) return false;
    const ext = fileUrl.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/groups/${groupId}/chat`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch chat:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${config.API_URL}/groups/${groupId}/chat`, {
        user_id: userId,
        content: newMessage,
      });
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      Alert.alert("Error", "Failed to send message");
      console.error("Failed to send message:", err);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission required", "We need access to your photos to upload images");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        await uploadImage(asset);
      }
    } catch (error) {
      setUploading(false);
      Alert.alert("Error", "Failed to pick image");
      console.error("Image picker error:", error);
    }
  };

  const uploadImage = async (asset) => {
    setUploading(true);
    try {
      const uri = asset.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
  
      const formData = new FormData();
  
      formData.append("user_id", userId.toString());
      formData.append("content", "");
  
      formData.append("file", {
        uri,
        name: `upload.${fileType}`,
        type: `image/${fileType}`,
      });
  
      console.log("📦 Sending FormData with:", {
        user_id: userId,
        file: `upload.${fileType}`,
        type: `image/${fileType}`,
      });
  
      await axios.post(`${config.API_URL}/groups/${groupId}/chat/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        transformRequest: (data) => data, // ✅ IMPORTANT for React Native FormData
      });
  
      fetchMessages();
    } catch (error) {
      Alert.alert("Upload Failed", "Could not upload image");
      console.error("❌ Upload error:", error.response?.data || error.message);
    } finally {
      setUploading(false);
    }
  };
  
  
  

  const renderItem = ({ item }) => {
    const isImage = item.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_url);
  
    return (
      <View style={[
        styles.messageContainer,
        item.user_id === userId ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageContent,
          item.user_id === userId ? styles.myMessageContent : styles.otherMessageContent
        ]}>
  
          {/* ✅ Image rendering */}
          {isImage && (
            <View style={styles.fileContainer}>
              <Image
                source={{ uri: `${config.API_URL}${item.file_url}` }}
                style={styles.imageMessage}
                resizeMode="cover"
                onError={(e) => console.log("❌ Failed to load image", e.nativeEvent)}
              />
            </View>
          )}
  
          {/* ✅ File link fallback (non-image) */}
          {!isImage && item.file_url && (
            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => Linking.openURL(`${config.API_URL}${item.file_url}`)}
            >
              <Ionicons name="document-attach" size={24} color="#6A5ACD" />
              <Text style={styles.fileText}>Download File</Text>
            </TouchableOpacity>
          )}
  
          {/* ✅ Text content */}
          {item.content?.trim() && (
            <View style={[
              styles.messageBubble,
              item.user_id === userId ? styles.myMessageBubble : styles.otherMessageBubble
            ]}>
              {item.user_id !== userId && (
                <Text style={styles.senderName}>{item.username || "Unknown"}</Text>
              )}
              <Text style={[
                styles.messageText,
                item.user_id === userId ? styles.myMessageText : styles.otherMessageText
              ]}>
                {item.content}
              </Text>
            </View>
          )}
  
          {/* ✅ Timestamp */}
          <Text style={[
            styles.timestamp,
            item.user_id === userId ? styles.myTimestamp : styles.otherTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };
  
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>{groupName}</Text>
            <Text style={styles.subtitle}>{messages.length} messages</Text>
          </View>
          <TouchableOpacity style={styles.groupInfoButton}>
            <Ionicons name="information-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.chatList}
          ref={flatListRef}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#6A5ACD" />
            ) : (
              <Ionicons name="image" size={24} color="#6A5ACD" />
            )}
          </TouchableOpacity>
          
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            onSubmitEditing={sendMessage}
          />
          
          {newMessage ? (
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="mic" size={24} color="#6A5ACD" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#6A5ACD",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#6A5ACD",
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: 'center',
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  backButton: {
    padding: 5,
  },
  groupInfoButton: {
    padding: 5,
  },
  chatList: {
    paddingHorizontal: 12,
    paddingTop: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: "#6A5ACD",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#000",
  },
  senderName: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    fontSize: 14,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#999',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    color: '#000',
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: "#6A5ACD",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButton: {
    padding: 8,
  },
  fileContainer: {
    marginBottom: 8,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },
  
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  fileText: {
    marginLeft: 8,
    color: '#6A5ACD',
  },
});

export default GroupChatScreen;