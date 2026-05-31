import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { IngredientCard } from '../components/IngredientCard';
import { analyzeIngredients } from '../services/mockData';

export const AnalysisResultScreen = ({ route, navigation }) => {
  const params = route.params;

  // Backend'den gelen format veya eski mock format
  let ingredients, summary, disclaimer;

  if (params.analysisResult) {
    // Backend response
    ({ ingredients, summary, disclaimer } = params.analysisResult);
  } else {
    // Eski format (HistoryScreen, HomeScreen) — mock data ile analiz
    const analyzed = analyzeIngredients(params.ingredients);
    ingredients = analyzed.map((item, index) => ({
      ...item,
      position: index + 1,
      positionWeight: 1.0,
    }));
    const safeItems = ingredients.filter((i) => i.riskLevel === 'safe').length;
    const mediumItems = ingredients.filter((i) => i.riskLevel === 'medium').length;
    summary = {
      beneficial_count: safeItems,
      neutral_count: 0,
      caution_count: mediumItems,
      unknown_count: 0,
    };
    disclaimer = null;
  }

  const safeCount = summary.beneficial_count + summary.neutral_count;
  const mediumCount = summary.caution_count + summary.unknown_count;

  const overallStatus =
    mediumCount > ingredients.length / 2 ? 'unsafe' :
    mediumCount > 0 ? 'medium' : 'safe';

  const statusConfig = {
    safe: { label: 'Safe Product', color: Colors.safe, icon: 'shield-checkmark' },
    medium: { label: 'Use with Caution', color: Colors.mediumRisk, icon: 'warning' },
    unsafe: { label: 'Not Recommended', color: Colors.unsafe, icon: 'alert-circle' },
  };

  const status = statusConfig[overallStatus];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Result</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={
            overallStatus === 'safe'
              ? [Colors.safe, '#16A34A']
              : overallStatus === 'medium'
              ? [Colors.mediumRisk, '#EA580C']
              : [Colors.unsafe, '#DC2626']
          }
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.summaryContent}>
            <Ionicons name={status.icon} size={36} color={Colors.textWhite} />
            <Text style={styles.summaryLabel}>{status.label}</Text>
            <Text style={styles.summaryDetail}>
              {safeCount} out of {ingredients.length} ingredients are safe
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Ingredient Breakdown</Text>
          <View style={styles.breakdownBadges}>
            <View style={styles.breakdownBadge}>
              <View style={[styles.dot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.breakdownCount}>{safeCount}</Text>
            </View>
            {mediumCount > 0 && (
              <View style={styles.breakdownBadge}>
                <View style={[styles.dot, { backgroundColor: Colors.mediumRisk }]} />
                <Text style={styles.breakdownCount}>{mediumCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.ingredientList}>
          {ingredients.map((ingredient, index) => (
            <IngredientCard
              key={index}
              ingredient={ingredient}
              onPress={() =>
                navigation.navigate('IngredientDetail', { ingredient })
              }
            />
          ))}
        </View>

        {disclaimer && (
          <View style={styles.disclaimerContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textLight} />
            <Text style={styles.disclaimerText}>{disclaimer}</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.h2,
    color: Colors.textWhite,
    marginTop: 10,
  },
  summaryDetail: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  breakdownTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  breakdownBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  breakdownCount: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
  },
  ingredientList: {
    paddingHorizontal: 20,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
