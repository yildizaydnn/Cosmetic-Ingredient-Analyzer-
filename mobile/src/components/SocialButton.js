import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

const providerConfig = {
  google: {
    icon: 'logo-google',
    label: 'Google',
    bgColor: Colors.white,
    textColor: Colors.textPrimary,
    borderColor: Colors.border,
  },
  apple: {
    icon: 'logo-apple',
    label: 'Apple',
    bgColor: Colors.apple,
    textColor: Colors.textWhite,
    borderColor: Colors.apple,
  },
  email: {
    icon: 'mail-outline',
    label: 'Email',
    bgColor: Colors.white,
    textColor: Colors.textPrimary,
    borderColor: Colors.border,
  },
  phone: {
    icon: 'call-outline',
    label: 'Phone Number',
    bgColor: Colors.white,
    textColor: Colors.textPrimary,
    borderColor: Colors.border,
  },
};

export const SocialButton = ({ provider, onPress, prefix = 'Continue with' }) => {
  const config = providerConfig[provider];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={config.icon}
        size={20}
        color={provider === 'google' ? '#4285F4' : config.textColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.textColor }]}>
        {prefix} {config.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    ...Typography.subtitle,
  },
});
