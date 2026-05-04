import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';

const skinTypes = [
  { key: 'normal', label: 'Normal', icon: 'happy-outline', description: 'Balanced, not too oily or dry' },
  { key: 'dry', label: 'Dry', icon: 'water-outline', description: 'Feels tight, may flake or crack' },
  { key: 'oily', label: 'Oily', icon: 'sunny-outline', description: 'Shiny, enlarged pores, prone to acne' },
  { key: 'combination', label: 'Combination', icon: 'contrast-outline', description: 'Oily T-zone, dry cheeks' },
  { key: 'sensitive', label: 'Sensitive', icon: 'heart-outline', description: 'Easily irritated, redness, stinging' },
];

export const SkinTypeScreen = () => {
  const [selected, setSelected] = useState(null);
  const { updateSkinType } = useAuth();

  const handleContinue = async () => {
    if (selected) {
      try {
        await updateSkinType(selected);
      } catch (e) {
        console.error('SkinType update failed:', e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What's your skin type?</Text>
        <Text style={styles.subtitle}>
          This helps us analyze ingredients based on your skin's needs
        </Text>
      </View>

      <View style={styles.options}>
        {skinTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.option,
              selected === type.key && styles.optionSelected,
            ]}
            onPress={() => setSelected(type.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, selected === type.key && styles.iconCircleSelected]}>
              <Ionicons
                name={type.icon}
                size={24}
                color={selected === type.key ? Colors.primary : Colors.textSecondary}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, selected === type.key && styles.optionLabelSelected]}>
                {type.label}
              </Text>
              <Text style={styles.optionDescription}>{type.description}</Text>
            </View>
            {selected === type.key && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <GradientButton
        title="Continue"
        onPress={handleContinue}
        style={[styles.button, !selected && styles.buttonDisabled]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  options: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDFA',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: '#DFF5F2',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
