import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';

const skinTypes = [
  { key: 'normal', label: 'Normal', icon: 'happy-outline', description: 'Dengeli, ne çok yağlı ne çok kuru' },
  { key: 'dry', label: 'Kuru', icon: 'water-outline', description: 'Gergin hissettirir, pullanma ve çatlama olabilir' },
  { key: 'oily', label: 'Yağlı', icon: 'sunny-outline', description: 'Parlak, geniş gözenekler, akneye meyilli' },
  { key: 'combination', label: 'Karma', icon: 'contrast-outline', description: 'T-bölge yağlı, yanaklar kuru' },
  { key: 'sensitive', label: 'Hassas', icon: 'heart-outline', description: 'Kolay tahriş olur, kızarıklık, yanma hissi' },
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
        <Text style={styles.title}>Cilt tipiniz nedir?</Text>
        <Text style={styles.subtitle}>
          Bu, içerikleri cilt ihtiyaçlarınıza göre analiz etmemize yardımcı olur
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
        title="Devam Et"
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
