import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({ userId: null, token: null });

  // Attempt to load saved auth state from AsyncStorage
  useEffect(() => {
    const loadAuthState = async () => {
      const savedToken = await AsyncStorage.getItem('userToken');
      const savedUserId = await AsyncStorage.getItem('userId');
      if (savedToken && savedUserId) {
        setAuthState({ token: savedToken, userId: savedUserId });
      }
    };

    loadAuthState();
  }, []);

  const login = async (id, token) => {
    setAuthState({ userId: id, token });
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', id);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    setAuthState({ userId: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
