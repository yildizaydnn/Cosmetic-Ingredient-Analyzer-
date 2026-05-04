import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { RiskBadge } from '../components/RiskBadge';

const skinTypeLabels = {
  normal: 'Normal Skin',
  dry: 'Dry Skin',
  oily: 'Oily Skin',
  combination: 'Combination Skin',
  sensitive: 'Sensitive Skin',
};

const riskColors = {
  safe: { gradient: [Colors.safe, '#16A34A'], icon: 'shield-checkmark' },
  medium: { gradient: [Colors.mediumRisk, '#EA580C'], icon: 'warning' },
  unsafe: { gradient: [Colors.unsafe, '#DC2626'], icon: 'alert-circle' },
};

export const IngredientDetailScreen = ({ route, navigation }) => {
  const { ingredient } = route.params;
  const risk = riskColors[ingredient.riskLevel] || riskColors.medium;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredient Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ingredient Header Card */}
        <LinearGradient
          colors={risk.gradient}
          style={styles.ingredientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.ingredientHeaderContent}>
            <View>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <View style={styles.badges}>
                <RiskBadge riskLevel={ingredient.riskLevel} style={styles.riskBadgeOverride} />
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{ingredient.category}</Text>
                </View>
              </View>
            </View>
            <Ionicons name={risk.icon} size={32} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>

        {/* What is it? */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
            <Text style={styles.cardTitle}>What is it?</Text>
          </View>
          <Text style={styles.cardBody}>{ingredient.description}</Text>
        </View>

        {/* Why Risk? */}
        {ingredient.whyRisk && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning-outline" size={22} color={Colors.mediumRisk} />
              <Text style={styles.cardTitle}>
                Why {ingredient.riskLevel === 'unsafe' ? 'Unsafe' : 'Medium Risk'}?
              </Text>
            </View>
            <Text style={styles.cardBody}>{ingredient.whyRisk}</Text>
            {ingredient.whyRiskDetails && (
              <View style={styles.riskDetails}>
                {ingredient.whyRiskDetails.map((detail, index) => (
                  <View key={index} style={styles.riskDetailItem}>
                    <View style={[styles.bulletDot, { backgroundColor: Colors.mediumRisk }]} />
                    <Text style={styles.riskDetailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Skin Type Suitability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skin Type Suitability</Text>
          <View style={styles.suitabilityList}>
            {Object.entries(ingredient.skinSuitability).map(([type, suitable]) => (
              <View key={type} style={styles.suitabilityItem}>
                <Text style={styles.suitabilityLabel}>{skinTypeLabels[type]}</Text>
                <Ionicons
                  name={suitable ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={suitable ? Colors.safe : Colors.unsafe}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Recommendation */}
        {ingredient.recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationText}>
              <Text style={styles.recommendationLabel}>💡 Recommendation: </Text>
              {ingredient.recommendation}
            </Text>
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
  ingredientHeader: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
  },
  ingredientHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ingredientName: {
    ...Typography.h2,
    color: Colors.textWhite,
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  riskBadgeOverride: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  cardBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  riskDetails: {
    marginTop: 12,
  },
  riskDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  riskDetailText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  suitabilityList: {
    marginTop: 8,
  },
  suitabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suitabilityLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  recommendationCard: {
    backgroundColor: '#EEF2FF',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
  },
  recommendationLabel: {
    ...Typography.subtitle,
    color: Colors.secondary,
  },
  recommendationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
