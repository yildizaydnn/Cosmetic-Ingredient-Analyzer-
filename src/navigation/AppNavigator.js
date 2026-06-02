import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useAuth } from '../context/AuthContext';

import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SkinTypeScreen } from '../screens/SkinTypeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { ManualEntryScreen } from '../screens/ManualEntryScreen';
import { AnalysisResultScreen } from '../screens/AnalysisResultScreen';
import { IngredientDetailScreen } from '../screens/IngredientDetailScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabIconMap = {
  'Ana Sayfa': { focused: 'home', unfocused: 'home-outline' },
  Tara: { focused: 'scan-circle', unfocused: 'scan-circle-outline' },
  'Geçmiş': { focused: 'time', unfocused: 'time-outline' },
  Profil: { focused: 'person', unfocused: 'person-outline' },
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        const icons = tabIconMap[route.name];
        return (
          <Ionicons
            name={focused ? icons.focused : icons.unfocused}
            size={24}
            color={color}
          />
        );
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textLight,
      tabBarStyle: {
        backgroundColor: Colors.white,
        borderTopWidth: 0,
        height: 85,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 10,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
      },
    })}
  >
    <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
    <Tab.Screen name="Tara" component={ScanScreen} />
    <Tab.Screen name="Geçmiş" component={HistoryScreen} />
    <Tab.Screen name="Profil" component={ProfileScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { user, loading, skinType } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : !skinType ? (
        <Stack.Screen name="SkinType" component={SkinTypeScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
          <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
          <Stack.Screen name="IngredientDetail" component={IngredientDetailScreen} />
          <Stack.Screen name="EditSkinType" component={SkinTypeScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
