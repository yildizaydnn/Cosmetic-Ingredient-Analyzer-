import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { IngredientCard } from '../components/IngredientCard';
import { analyzeIngredients } from '../services/mockData';
import { saveAnalysis, updateHistoryItem } from '../services/historyStorage';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';

export const AnalysisResultScreen = ({ route, navigation }) => {
  const params = route.params;
  const { skinType } = useAuth();
  const { onAnalysisComplete, newBadge, dismissBadgeNotification } = useBadges();
  const saved = useRef(false);
  const savedId = useRef(null);
  const [editing, setEditing] = useState(false);

  // Backend'den gelen format veya eski mock format
  let ingredients, summary, disclaimer, productSummary;
  let initialProductName = params.productName || '';

  if (params.analysisResult) {
    // Backend response
    ({ ingredients, summary, disclaimer, productSummary } = params.analysisResult);
  } else if (params.historyItem) {
    // Geçmişten gelen — tekrar kaydetme
    ({ ingredients, summary, productSummary } = params.historyItem);
    initialProductName = params.historyItem.productName || '';
    disclaimer = null;
    saved.current = true;
  } else {
    // Eski format (mock data ile analiz)
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

  const [productName, setProductName] = useState(initialProductName);

  useEffect(() => {
    if (!saved.current && ingredients && summary) {
      saved.current = true;
      const source = params.source || 'scan';
      saveAnalysis({
        productName: productName || null,
        ingredients,
        summary,
        skinType,
        productSummary,
      }).then((entry) => {
        savedId.current = entry.id;
      }).catch(() => {});
      onAnalysisComplete(summary, source);
    }
  }, []);

  const handleNameSubmit = () => {
    setEditing(false);
    if (savedId.current && productName.trim()) {
      updateHistoryItem(savedId.current, { productName: productName.trim() }).catch(() => {});
    }
  };

  const safeCount = summary.beneficial_count + summary.neutral_count;
  const mediumCount = summary.caution_count + summary.unknown_count;

  const total = ingredients.length || 1;
  const riskRatio = mediumCount / total;

  // Ust siralardaki (ilk 5) riskli icerik sayisi
  const topRiskyCount = ingredients.filter(
    (i) => (i.riskLevel === 'medium' || i.riskLevel === 'unsafe') && i.position <= 5
  ).length;

  const overallStatus =
    riskRatio > 0.4 ? 'unsafe' :
    (riskRatio > 0.1 || mediumCount >= 3 || topRiskyCount >= 1) ? 'medium' : 'safe';

  const statusConfig = {
    safe: { label: 'Güvenli Ürün', color: Colors.safe, icon: 'shield-checkmark' },
    medium: { label: 'Dikkatli Kullanın', color: Colors.mediumRisk, icon: 'warning' },
    unsafe: { label: 'Önerilmiyor', color: Colors.unsafe, icon: 'alert-circle' },
  };

  const status = statusConfig[overallStatus];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analiz Sonucu</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.productNameRow}
          onPress={() => setEditing(true)}
          activeOpacity={0.7}
        >
          {editing ? (
            <TextInput
              style={styles.productNameInput}
              value={productName}
              onChangeText={setProductName}
              onBlur={handleNameSubmit}
              onSubmitEditing={handleNameSubmit}
              placeholder="Ürün adı girin..."
              placeholderTextColor={Colors.textLight}
              autoFocus
            />
          ) : (
            <Text style={styles.productNameText} numberOfLines={1}>
              {productName || 'Ürün adı ekle'}
            </Text>
          )}
          {!editing && (
            <Ionicons name="pencil-outline" size={16} color={Colors.textLight} />
          )}
        </TouchableOpacity>

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
              {ingredients.length} içerikten {safeCount} tanesi güvenli
            </Text>
          </View>
        </LinearGradient>

        {productSummary && (
          <View style={styles.productSummaryCard}>
            <View style={styles.productSummaryHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
              <Text style={styles.productSummaryTitle}>Genel Değerlendirme</Text>
            </View>
            <Text style={styles.productSummaryText}>{productSummary}</Text>
          </View>
        )}

        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>İçerik Dağılımı</Text>
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

      {/* Rozet Kazanma Bildirimi */}
      <Modal visible={!!newBadge} transparent animationType="fade">
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModalContent}>
            <View style={[styles.badgeModalIcon, { backgroundColor: newBadge?.color + '20' }]}>
              <Ionicons name={newBadge?.icon} size={48} color={newBadge?.color} />
            </View>
            <Text style={styles.badgeModalTitle}>Rozet Kazandın!</Text>
            <Text style={styles.badgeModalName}>{newBadge?.title}</Text>
            <Text style={styles.badgeModalDesc}>{newBadge?.description}</Text>
            <TouchableOpacity style={styles.badgeModalButton} onPress={dismissBadgeNotification}>
              <Text style={styles.badgeModalButtonText}>Harika!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  productNameText: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    flex: 1,
  },
  productNameInput: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  productSummaryCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
  },
  productSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productSummaryTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  productSummaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 12,
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
  badgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    width: 300,
  },
  badgeModalIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeModalTitle: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeModalName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeModalDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  badgeModalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 24,
  },
  badgeModalButtonText: {
    ...Typography.subtitle,
    color: Colors.textWhite,
    fontWeight: '600',
  },
});
