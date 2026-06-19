import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BADGES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';

const skinTypeLabels = {
  normal: 'Normal',
  dry: 'Kuru',
  oily: 'Yağlı',
  combination: 'Karma',
  sensitive: 'Hassas',
};

const MenuItem = ({ icon, label, onPress, color, showArrow = true }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, color && { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color || Colors.textSecondary} />
    </View>
    <Text style={[styles.menuLabel, color && { color }]}>{label}</Text>
    {showArrow && <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />}
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
  const { user, skinType, logout } = useAuth();
  const { earnedBadges, stats } = useBadges();

  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;

  // Son kazanılan 4 rozeti göster
  const recentEarned = BADGES.filter((b) => earnedIds.has(b.id)).slice(0, 4);
  // Kilitli rozetlerden ilk birkaçını göster
  const locked = BADGES.filter((b) => !earnedIds.has(b.id)).slice(0, 4 - recentEarned.length);
  const previewBadges = [...recentEarned, ...locked].slice(0, 4);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
      </View>

      <View style={styles.skinTypeCard}>
        <View>
          <Text style={styles.skinTypeLabel}>Cilt Tipi</Text>
          <Text style={styles.skinTypeValue}>
            {skinType ? skinTypeLabels[skinType] : 'Seçilmedi'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditSkinType')}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Değiştir</Text>
        </TouchableOpacity>
      </View>

      {/* Rozet Bölümü */}
      <TouchableOpacity
        style={styles.badgeSection}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Badges')}
      >
        <View style={styles.badgeSectionHeader}>
          <View>
            <Text style={styles.badgeSectionTitle}>Rozetlerim</Text>
            <Text style={styles.badgeSectionCount}>
              {earnedCount}/{totalCount} rozet kazanıldı
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </View>

        {/* İlerleme çubuğu */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : '0%' },
            ]}
          />
        </View>

        {/* Rozet önizleme */}
        <View style={styles.badgePreview}>
          {previewBadges.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            return (
              <View key={badge.id} style={styles.badgeItem}>
                <View
                  style={[
                    styles.badgeCircle,
                    {
                      backgroundColor: isEarned ? badge.color + '20' : Colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={badge.icon}
                    size={24}
                    color={isEarned ? badge.color : Colors.textLight}
                  />
                </View>
                <Text
                  style={[
                    styles.badgeLabel,
                    !isEarned && { color: Colors.textLight },
                  ]}
                  numberOfLines={1}
                >
                  {badge.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* İstatistikler */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalScans || 0}</Text>
            <Text style={styles.statLabel}>Analiz</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.dailyStreak || 0}</Text>
            <Text style={styles.statLabel}>Seri</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.detailViews || 0}</Text>
            <Text style={styles.statLabel}>İnceleme</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.menu}>
        <MenuItem icon="notifications-outline" label="Bildirimler" color={Colors.primary} />
        <MenuItem icon="shield-outline" label="Gizlilik" color={Colors.secondary} onPress={() => navigation.navigate('Privacy')} />
        <MenuItem icon="help-circle-outline" label="Yardım ve Destek" color={Colors.primary} />
        <MenuItem icon="information-circle-outline" label="Hakkında" color={Colors.textSecondary} />
      </View>

      <View style={styles.logoutSection}>
        <MenuItem
          icon="log-out-outline"
          label="Çıkış Yap"
          color={Colors.unsafe}
          onPress={logout}
          showArrow={false}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DFF5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  email: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  skinTypeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  skinTypeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  skinTypeValue: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  editButton: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Rozet bölümü
  badgeSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  badgeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeSectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  badgeSectionCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  badgePreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
  },
  badgeItem: {
    alignItems: 'center',
    width: 64,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11,
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
  menu: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  logoutSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
