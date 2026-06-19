import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BADGES } from '../constants';
import { useBadges } from '../context/BadgeContext';

export const BadgesScreen = ({ navigation }) => {
  const { earnedBadges, stats } = useBadges();
  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const earnedMap = Object.fromEntries(earnedBadges.map((b) => [b.id, b]));

  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;

  const getProgress = (badge) => {
    if (!badge.target || !badge.statKey) return null;
    const current = stats[badge.statKey] || 0;
    return Math.min(current / badge.target, 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rozetlerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Genel ilerleme */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {earnedCount}/{totalCount} Rozet
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : '0%' },
              ]}
            />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalScans || 0}</Text>
              <Text style={styles.statLabel}>Toplam Analiz</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.maxDailyStreak || 0}</Text>
              <Text style={styles.statLabel}>En Uzun Seri</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.detailViews || 0}</Text>
              <Text style={styles.statLabel}>İnceleme</Text>
            </View>
          </View>
        </View>

        {/* Rozet listesi */}
        <View style={styles.badgeList}>
          {BADGES.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            const earned = earnedMap[badge.id];
            const progress = getProgress(badge);

            return (
              <View
                key={badge.id}
                style={[styles.badgeCard, !isEarned && styles.badgeCardLocked]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    {
                      backgroundColor: isEarned ? badge.color + '20' : Colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={badge.icon}
                    size={28}
                    color={isEarned ? badge.color : Colors.textLight}
                  />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                  {isEarned && earned?.earnedAt && (
                    <Text style={styles.badgeDate}>
                      {new Date(earned.earnedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                  {!isEarned && progress !== null && (
                    <View style={styles.badgeProgress}>
                      <View style={styles.badgeProgressBar}>
                        <View
                          style={[
                            styles.badgeProgressFill,
                            { width: `${progress * 100}%`, backgroundColor: badge.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.badgeProgressText}>
                        {stats[badge.statKey] || 0}/{badge.target}
                      </Text>
                    </View>
                  )}
                </View>
                {isEarned && (
                  <Ionicons name="checkmark-circle" size={24} color={badge.color} />
                )}
              </View>
            );
          })}
        </View>

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
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  badgeList: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  badgeNameLocked: {
    color: Colors.textSecondary,
  },
  badgeDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeDate: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: 4,
    fontSize: 11,
  },
  badgeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badgeProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    ...Typography.caption,
    color: Colors.textLight,
    fontSize: 11,
    width: 36,
    textAlign: 'right',
  },
});
