import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { analyzeImage } from '../services/api';

export const ScanScreen = ({ navigation }) => {
  const [processing, setProcessing] = useState(false);
  const { skinType } = useAuth();

  const handleAnalyze = async (imageUri) => {
    try {
      setProcessing(true);
      const result = await analyzeImage(imageUri, skinType);
      navigation.navigate('AnalysisResult', { analysisResult: result });

    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error.message || 'Could not analyze the image. Please try again or enter ingredients manually.',
        [
          { text: 'OK' },
          { text: 'Manual Entry', onPress: () => navigation.navigate('ManualEntry') },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCamera = async () => {
    if (processing) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan ingredients.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      mediaTypes: ['images'],
    });

    if (!result.canceled && result.assets?.[0]) {
      await handleAnalyze(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    if (processing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      await handleAnalyze(result.assets[0].uri);
    }
  };

  if (processing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing ingredients...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Take a photo of the ingredient list or pick from gallery
        </Text>

        <TouchableOpacity style={styles.optionCard} onPress={handleCamera} activeOpacity={0.7}>
          <LinearGradient
            colors={[Colors.primary, '#3BA8A0']}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="camera" size={40} color={Colors.textWhite} />
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionHint}>Use your camera to capture the ingredient label</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handleGallery} activeOpacity={0.7}>
          <LinearGradient
            colors={[Colors.secondary, '#6352CC']}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="images" size={40} color={Colors.textWhite} />
            <Text style={styles.optionTitle}>Pick from Gallery</Text>
            <Text style={styles.optionHint}>Select an existing photo of the ingredient list</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate('ManualEntry')}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.manualText}>Enter ingredients manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 28,
    alignItems: 'center',
  },
  optionTitle: {
    ...Typography.h3,
    color: Colors.textWhite,
    marginTop: 12,
  },
  optionHint: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 6,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 14,
  },
  manualText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 20,
  },
  loadingSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
