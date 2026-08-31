import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { SocialButton } from '../components/SocialButton';
import { useAuth } from '../context/AuthContext';

export const WelcomeScreen = ({ navigation }) => {
  const { socialLogin } = useAuth();

  const handleSocialLogin = async (provider) => {
    if (provider === 'email') {
      navigation.navigate('Login');
      return;
    }
    await socialLogin(provider);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={40} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>Kozmetik İçerik{'\n'}Analizörüne Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>
          Ürün içeriklerini tarayın veya girin, cilt tipinize uygunluğunu öğrenin.
        </Text>
      </View>

      <View style={styles.buttons}>
        <SocialButton provider="google" onPress={() => handleSocialLogin('google')} />
        <SocialButton provider="apple" onPress={() => handleSocialLogin('apple')} />
        <SocialButton provider="email" onPress={() => handleSocialLogin('email')} />
        <SocialButton provider="phone" onPress={() => handleSocialLogin('phone')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DFF5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttons: {
    gap: 0,
  },
});
