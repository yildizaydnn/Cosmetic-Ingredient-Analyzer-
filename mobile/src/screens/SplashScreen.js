import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';

export const SplashScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={Gradients.splash} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={Gradients.primary}
            style={styles.iconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={36} color={Colors.textWhite} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Kozmetik İçerik{'\n'}Analizörü</Text>
        <Text style={styles.subtitle}>Cilt bakım ürünlerinin içeriklerini kolayca analiz edin</Text>
      </View>

      <GradientButton
        title="Başlayın"
        onPress={() => navigation.replace('Welcome')}
        style={styles.button}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginHorizontal: 8,
  },
});
