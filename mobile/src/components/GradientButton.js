import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Typography } from '../constants';

export const GradientButton = ({ title, onPress, style, textStyle, colors }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <LinearGradient
        colors={colors || Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.button,
    color: Colors.textWhite,
  },
});
