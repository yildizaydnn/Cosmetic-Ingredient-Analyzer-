import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skinType, setSkinType] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const savedSkinType = await AsyncStorage.getItem('skinType');
      if (userData) setUser(JSON.parse(userData));
      if (savedSkinType) setSkinType(savedSkinType);
    } catch (e) {
      console.log('Error loading user:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Mock login - backend entegrasyonunda değişecek
    const mockUser = {
      id: '1',
      name: 'Yıldız',
      email,
    };
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signUp = async (name, email, password) => {
    const mockUser = {
      id: '1',
      name,
      email,
    };
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const socialLogin = async (provider) => {
    // Mock social login
    const mockUser = {
      id: '1',
      name: 'Yıldız',
      email: `user@${provider}.com`,
      provider,
    };
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const updateSkinType = async (type) => {
    setSkinType(type);
    await AsyncStorage.setItem('skinType', type);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['user', 'skinType']);
    setUser(null);
    setSkinType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        skinType,
        login,
        signUp,
        socialLogin,
        updateSkinType,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
