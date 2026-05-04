import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants';

const riskConfig = {
  safe: {
    label: 'Safe',
    color: Colors.safe,
    bgColor: Colors.safeBg,
  },
  medium: {
    label: 'Medium Risk',
    color: Colors.mediumRisk,
    bgColor: Colors.mediumRiskBg,
  },
  unsafe: {
    label: 'Unsafe',
    color: Colors.unsafe,
    bgColor: Colors.unsafeBg,
  },
};

export const RiskBadge = ({ riskLevel, style }) => {
  const config = riskConfig[riskLevel] || riskConfig.medium;

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, style]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
