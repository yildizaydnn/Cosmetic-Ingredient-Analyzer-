import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { analyzeText } from '../services/api';

const parseIngredients = (text) => {
  return text
    .split(/[,\n]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
};

export const ManualEntryScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { skinType } = useAuth();

  const handleAnalyze = async () => {
    const ingredients = parseIngredients(text);
    if (ingredients.length === 0) return;

    try {
      setLoading(true);
      const result = await analyzeText(text, skinType);
      navigation.navigate('AnalysisResult', { analysisResult: result });
    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error.message || 'Could not analyze ingredients. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasteExample = () => {
    setText(
      'Water, Niacinamide, Glycerin, Hyaluronic Acid, Fragrance, Methylparaben, Vitamin E'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Enter Ingredients</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Ingredient List</Text>
        <Text style={styles.hint}>
          Type or paste the ingredient list from the product. Separate each ingredient with a comma.
        </Text>

        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. Water, Glycerin, Niacinamide, Hyaluronic Acid..."
            placeholderTextColor={Colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <TouchableOpacity onPress={handlePasteExample} style={styles.exampleButton} disabled={loading}>
          <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
          <Text style={styles.exampleText}>Paste example ingredients</Text>
        </TouchableOpacity>

        {text.length > 0 && (
          <View style={styles.countContainer}>
            <Ionicons name="flask-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.countText}>
              {parseIngredients(text).length} ingredients detected
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        ) : (
          <GradientButton
            title="Analyze Ingredients"
            onPress={handleAnalyze}
            style={[!text.trim() && styles.buttonDisabled]}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  textAreaContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 180,
  },
  textArea: {
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 160,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  exampleText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  countText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.primary,
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
