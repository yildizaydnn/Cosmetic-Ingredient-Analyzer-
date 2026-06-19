import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';
import { getHistory } from '../services/historyStorage';

const ActionCard = ({ title, subtitle, icon, colors, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionCardWrapper}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.actionCard}
    >
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={28} color="rgba(255,255,255,0.9)" />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const HistoryItem = ({ item, onPress }) => {
  const totalIngredients = item.safeCount + item.mediumCount + item.unsafeCount;
  const hasUnsafe = item.unsafeCount > 0;
  const hasMedium = item.mediumCount > 0;
  const dotColor = hasUnsafe ? Colors.unsafe : hasMedium ? Colors.mediumRisk : Colors.safe;

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyContent}>
        <Text style={styles.historyName}>{item.productName}</Text>
        <View style={styles.historyMeta}>
          <Ionicons name="time-outline" size={14} color={Colors.textLight} />
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.historyScore}>
        <View style={[styles.historyDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.historyScoreText, { color: dotColor }]}>{item.safeCount}/{totalIngredients}</Text>
      </View>
    </TouchableOpacity>
  );
};

const StatCard = ({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

function computeStats(history) {
  if (!history || history.length === 0) {
    return null;
  }

  let totalIngredients = 0;
  let totalSafe = 0;
  let totalRisky = 0;
  const ingredientMap = {};

  for (const item of history) {
    totalSafe += item.safeCount || 0;
    totalRisky += (item.mediumCount || 0) + (item.unsafeCount || 0);
    totalIngredients += (item.safeCount || 0) + (item.mediumCount || 0) + (item.unsafeCount || 0);

    // En sik karsilasilan riskli icerikler
    if (item.ingredients) {
      for (const ing of item.ingredients) {
        if (ing.riskLevel === 'medium' || ing.riskLevel === 'unsafe') {
          const name = ing.name;
          ingredientMap[name] = (ingredientMap[name] || 0) + 1;
        }
      }
    }
  }

  // En cok karsilasilan riskli icerik
  let topRisky = null;
  let topRiskyCount = 0;
  for (const [name, count] of Object.entries(ingredientMap)) {
    if (count > topRiskyCount) {
      topRisky = name;
      topRiskyCount = count;
    }
  }

  return {
    totalProducts: history.length,
    totalIngredients,
    totalSafe,
    totalRisky,
    safePercent: totalIngredients > 0 ? Math.round((totalSafe / totalIngredients) * 100) : 0,
    topRisky,
    topRiskyCount,
  };
}

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { stats: badgeStats } = useBadges();
  const [recentHistory, setRecentHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((h) => {
        setRecentHistory(h.slice(0, 3));
        setAllHistory(h);
      });
    }, [])
  );

  const stats = useMemo(() => computeStats(allHistory), [allHistory]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Merhaba, {user?.name || 'Kullanıcı'}</Text>
        <Text style={styles.greetingSubtext}>Cilt bakım ürünlerini kontrol edelim</Text>
      </View>

      {/* Istatistik Kartlari */}
      {stats && (
        <>
          <View style={styles.statsRow}>
            <StatCard
              icon="flask"
              value={stats.totalProducts}
              label="Ürün Tarandı"
              color={Colors.primary}
            />
            <StatCard
              icon="checkmark-circle"
              value={`%${stats.safePercent}`}
              label="Güvenli"
              color={Colors.safe}
            />
            <StatCard
              icon="flame"
              value={badgeStats.dailyStreak || 0}
              label="Günlük Seri"
              color="#F97316"
            />
          </View>

          {/* En cok karsilasilan riskli icerik */}
          {stats.topRisky && (
            <View style={styles.insightCard}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="alert-circle" size={20} color={Colors.mediumRisk} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>En Sık Riskli İçerik</Text>
                <Text style={styles.insightValue}>
                  {stats.topRisky}
                  <Text style={styles.insightCount}> ({stats.topRiskyCount} üründe)</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Icerik dagilimi */}
          {stats.totalIngredients > 0 && (
            <View style={styles.distributionCard}>
              <Text style={styles.distributionTitle}>İçerik Dağılımı</Text>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionSegment,
                    {
                      flex: stats.totalSafe,
                      backgroundColor: Colors.safe,
                      borderTopLeftRadius: 4,
                      borderBottomLeftRadius: 4,
                    },
                  ]}
                />
                {stats.totalRisky > 0 && (
                  <View
                    style={[
                      styles.distributionSegment,
                      {
                        flex: stats.totalRisky,
                        backgroundColor: Colors.mediumRisk,
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.distributionLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.safe }]} />
                  <Text style={styles.legendText}>Güvenli ({stats.totalSafe})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.mediumRisk }]} />
                  <Text style={styles.legendText}>Riskli ({stats.totalRisky})</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.actions}>
        <ActionCard
          title="İçerikleri Tara"
          subtitle="Ürün etiketinin fotoğrafını çek"
          icon="camera-outline"
          colors={['#818CF8', '#6366F1']}
          onPress={() => navigation.navigate('Tara')}
        />
        <ActionCard
          title="Manuel Giriş"
          subtitle="İçerik listesini yaz veya yapıştır"
          icon="create-outline"
          colors={['#4ECDC4', '#34D399']}
          onPress={() => navigation.navigate('ManualEntry')}
        />
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Son Analizler</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Geçmiş')}>
          <Text style={styles.viewAll}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>

      {recentHistory.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>Henüz analiz yapılmadı</Text>
        </View>
      ) : (
        recentHistory.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onPress={() =>
              navigation.navigate('AnalysisResult', { historyItem: item })
            }
          />
        ))
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  greeting: {
    marginBottom: 20,
  },
  greetingText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  greetingSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Istatistikler
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 20,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontSize: 11,
  },

  // Insight kart
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mediumRiskBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  insightValue: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  insightCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  // Dagilim
  distributionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  distributionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontSize: 14,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Actions
  actions: {
    marginBottom: 24,
  },
  actionCardWrapper: {
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    padding: 20,
  },
  actionTitle: {
    ...Typography.subtitle,
    color: Colors.textWhite,
    fontSize: 17,
    marginBottom: 4,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  viewAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    ...Typography.caption,
    color: Colors.textLight,
    marginLeft: 4,
  },
  historyScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  historyScoreText: {
    ...Typography.subtitle,
    fontSize: 18,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoryText: {
    ...Typography.body,
    color: Colors.textLight,
  },
});
