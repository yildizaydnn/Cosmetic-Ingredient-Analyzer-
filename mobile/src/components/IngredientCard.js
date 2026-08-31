import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { RiskBadge } from './RiskBadge';

const riskIconConfig = {
  safe: { name: 'shield-checkmark-outline', color: Colors.safe, bgColor: Colors.safeBg },
  medium: { name: 'warning-outline', color: Colors.mediumRisk, bgColor: Colors.mediumRiskBg },
  unsafe: { name: 'alert-circle-outline', color: Colors.unsafe, bgColor: Colors.unsafeBg },
};

export const IngredientCard = ({ ingredient, onPress }) => {
  const iconConfig = riskIconConfig[ingredient.riskLevel] || riskIconConfig.medium;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{ingredient.name}</Text>
          <RiskBadge riskLevel={ingredient.riskLevel} />
        </View>
        <Text style={styles.category}>{ingredient.category}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {ingredient.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  category: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: 2,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
