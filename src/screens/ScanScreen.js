import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';

export const ScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.textLight} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan product ingredient labels
        </Text>
        <GradientButton
          title="Grant Permission"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  const handleCapture = async () => {
    // Mock: Kamera ile çekim yapıldığında örnek içerik listesi döndür
    // Backend entegrasyonunda OCR ile gerçek metin çıkarılacak
    const mockIngredients = [
      'Water',
      'Niacinamide',
      'Glycerin',
      'Hyaluronic Acid',
      'Fragrance',
      'Methylparaben',
      'Vitamin E',
    ];

    Alert.alert(
      'Ingredients Detected',
      `Found ${mockIngredients.length} ingredients from the label.`,
      [
        {
          text: 'Analyze',
          onPress: () =>
            navigation.navigate('AnalysisResult', { ingredients: mockIngredients }),
        },
        { text: 'Retake', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Scan Ingredients</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.scanHint}>
              Position the ingredient list within the frame
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ManualEntry')}
              style={styles.controlButton}
            >
              <Ionicons name="create-outline" size={24} color={Colors.textWhite} />
              <Text style={styles.controlLabel}>Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="flash-outline" size={24} color={Colors.textWhite} />
              <Text style={styles.controlLabel}>Flash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...Typography.subtitle,
    color: Colors.textWhite,
  },
  scanArea: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    ...Typography.body,
    color: Colors.textWhite,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlLabel: {
    ...Typography.caption,
    color: Colors.textWhite,
    marginTop: 4,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.textWhite,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    width: '100%',
  },
});
