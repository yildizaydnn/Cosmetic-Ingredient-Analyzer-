import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { RiskBadge } from '../components/RiskBadge';

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
            <View style={{ flex: 1 }}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              {ingredient.matchedAs && (
                <Text style={styles.matchedAs}>Matched as: {ingredient.matchedAs}</Text>
              )}
              <View style={styles.badges}>
                <RiskBadge riskLevel={ingredient.riskLevel} style={styles.riskBadgeOverride} />
                {ingredient.category && ingredient.category !== 'Unknown' && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{ingredient.category}</Text>
                  </View>
                )}
                {ingredient.source === 'ai' && (
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(124,58,237,0.3)' }]}>
                    <Text style={styles.categoryBadgeText}>AI</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name={risk.icon} size={32} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>

        {/* Position Info */}
        {ingredient.position && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Position in Formula</Text>
            </View>
            <Text style={styles.cardBody}>
              #{ingredient.position} in the ingredient list
              {ingredient.positionWeight >= 1.0
                ? ' — High concentration'
                : ingredient.positionWeight >= 0.5
                ? ' — Medium concentration'
                : ' — Low concentration'}
            </Text>
          </View>
        )}

        {/* What is it? */}
        {ingredient.description ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>What is it?</Text>
            </View>
            <Text style={styles.cardBody}>{ingredient.description}</Text>
          </View>
        ) : null}

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
          </View>
        )}

        {/* Unknown Note */}
        {ingredient.note && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.textLight} />
              <Text style={styles.cardTitle}>Note</Text>
            </View>
            <Text style={styles.cardBody}>{ingredient.note}</Text>
          </View>
        )}

        {/* Recommendation */}
        {ingredient.recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationText}>
              <Text style={styles.recommendationLabel}>Recommendation: </Text>
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
    marginBottom: 4,
  },
  matchedAs: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
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
