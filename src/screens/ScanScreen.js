import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { analyzeImage } from '../services/api';

const LOADING_STEPS = [
  { icon: 'camera-outline', text: 'Gorsel okunuyor...' },
  { icon: 'text-outline', text: 'Icerikler ayiklaniyor...' },
  { icon: 'flask-outline', text: 'Icerikler analiz ediliyor...' },
  { icon: 'shield-checkmark-outline', text: 'Sonuclar hazirlaniyor...' },
];

const LoadingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(LOADING_STEPS.map(() => new Animated.Value(0))).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Donen animasyon
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Adim gecisleri
    const stepTimers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => {
        setCurrentStep(i);
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
        Animated.timing(progressAnim, {
          toValue: (i + 1) / LOADING_STEPS.length,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }, i * 8000)
    );

    // Ilk adimi hemen goster
    Animated.timing(fadeAnims[0], {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(progressAnim, {
      toValue: 1 / LOADING_STEPS.length,
      duration: 500,
      useNativeDriver: false,
    }).start();

    return () => stepTimers.forEach(clearTimeout);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const step = LOADING_STEPS[currentStep];

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        {/* Ana icon */}
        <Animated.View style={[styles.loadingIconWrap, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.loadingIconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.loadingIconInner}>
              <Ionicons name="sparkles" size={32} color={Colors.primary} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Aktif adim */}
        <View style={styles.loadingStepActive}>
          <Ionicons name={step.icon} size={22} color={Colors.primary} />
          <Text style={styles.loadingStepText}>{step.text}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.loadingProgressBar}>
          <Animated.View
            style={[
              styles.loadingProgressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Adim gostergesi */}
        <View style={styles.loadingDots}>
          {LOADING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.loadingDot,
                i <= currentStep && { backgroundColor: Colors.primary },
              ]}
            />
          ))}
        </View>

        <Text style={styles.loadingHint}>
          Bu islem yaklasik 1 dakika surebilir
        </Text>
      </View>
    </View>
  );
};

export const ScanScreen = ({ navigation }) => {
  const [processing, setProcessing] = useState(false);
  const { skinType } = useAuth();

  const handleAnalyze = async (imageUri) => {
    try {
      setProcessing(true);
      const result = await analyzeImage(imageUri, skinType);
      if (!result.isCosmetic) {
        Alert.alert(
          'Kozmetik Ürün Değil',
          result.rejectionReason || 'Bu içerik listesi bir cilt bakım ürününe ait görünmüyor.',
        );
        return;
      }
      navigation.navigate('AnalysisResult', { analysisResult: result });
    } catch (error) {
      Alert.alert(
        'Analiz Başarısız',
        error.message || 'Görsel analiz edilemedi. Tekrar deneyin veya içerikleri manuel girin.',
        [
          { text: 'Tamam' },
          { text: 'Manuel Giriş', onPress: () => navigation.navigate('ManualEntry') },
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
      Alert.alert('İzin Gerekli', 'İçerikleri taramak için kamera erişimi gereklidir.');
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
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Tara</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          İçerik listesinin fotoğrafını çekin veya galeriden seçin
        </Text>

        <TouchableOpacity style={styles.optionCard} onPress={handleCamera} activeOpacity={0.7}>
          <LinearGradient
            colors={[Colors.primary, '#3BA8A0']}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="camera" size={40} color={Colors.textWhite} />
            <Text style={styles.optionTitle}>Fotoğraf Çek</Text>
            <Text style={styles.optionHint}>Kameranızla içerik etiketini çekin</Text>
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
            <Text style={styles.optionTitle}>Galeriden Seç</Text>
            <Text style={styles.optionHint}>Mevcut bir içerik listesi fotoğrafı seçin</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate('ManualEntry')}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.manualText}>İçerikleri manuel girin</Text>
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
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIconWrap: {
    marginBottom: 32,
  },
  loadingIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingStepActive: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingStepText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  loadingProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  loadingHint: {
    ...Typography.bodySmall,
    color: Colors.textLight,
  },
});
