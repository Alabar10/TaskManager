import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import config from "../config";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AiChatScreen = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();
  const { userId } = useAuth();
  const navigation = useNavigation();


  const sendMessage = async (customMessage) => {
    const userMessage = customMessage || message;
    if (!userMessage.trim()) return;

    setLoading(true);
    setMessage('');

    // Add user's message to chat
    setChatHistory(prev => [...prev, { type: 'user', text: userMessage }]);

    try {
      const response = await axios.post(`${config.API_URL}/chat`, {
        user_id: userId,
        message: userMessage
      });

      const aiReply = response.data.reply;
      setChatHistory(prev => [...prev, { type: 'ai', text: aiReply }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { type: 'ai', text: '❌ Failed to get response. Please try again.' }]);
    }

    setLoading(false);
  };

  useEffect(() => {
    sendMessage('Give me my daily productivity advice and warnings.');
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
        
      <View style={styles.header}>
        {/* 🔙 Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Productivity Assistant</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatHistory.length === 0 && !loading && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome! Ask me for productivity advice or tips.</Text>
          </View>
        )}

        {chatHistory.map((item, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              item.type === 'user' ? styles.userBubble : styles.aiBubble
            ]}
          >
            {item.type === 'ai' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#6e48aa" />
              </View>
            )}
            <Text style={[
              styles.messageText,
              item.type === 'user' ? styles.userText : styles.aiText
            ]}>
              {item.text}
            </Text>
            {item.type === 'user' && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={16} color="#6e48aa" />
            </View>
            <ActivityIndicator size="small" color="#6e48aa" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          style={styles.textInput}
          multiline
          blurOnSubmit={false}
          onSubmitEditing={() => !loading && sendMessage()}
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={() => sendMessage()} 
          disabled={loading || !message.trim()}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={!message.trim() || loading ? "#ccc" : "#6e48aa"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#6e48aa',
    padding: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  welcomeContainer: {
    backgroundColor: '#e8e8e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'center',
  },
  welcomeText: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    backgroundColor: '#6e48aa',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
});

export default AiChatScreen;