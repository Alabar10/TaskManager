import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({ userId: null, token: null });
  const [loading, setLoading] = useState(true);

  // Load auth state on mount and when app comes to foreground
  useEffect(() => {
    const loadAuthState = async () => {
      const savedToken = await AsyncStorage.getItem('userToken');
      const savedUserId = await AsyncStorage.getItem('userId');
      console.log("🔄 Reloading auth:", savedUserId);
      if (savedToken && savedUserId) {
        setAuthState({ token: savedToken, userId: Number(savedUserId) }); // Convert to number
      } else {
        setAuthState({ token: null, userId: null });
      }
      setLoading(false);
    };

    loadAuthState(); // Initial load

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadAuthState(); // Reload when app comes to foreground
      }
    });

    return () => subscription.remove();
  }, []);

  const login = async (id, token) => {
    console.log("✅ Logging in:", id);
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', String(id)); // Save as string
    setAuthState({ userId: Number(id), token }); // Use as number
  };

  const logout = async () => {
    console.log("🚪 Logging out");
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    setAuthState({ userId: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
