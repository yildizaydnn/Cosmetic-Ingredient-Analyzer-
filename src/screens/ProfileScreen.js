import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { useAuth } from '../context/AuthContext';

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

  return (
    <View style={styles.container}>
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
          onPress={() => navigation.navigate('SkinType')}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Değiştir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="notifications-outline" label="Bildirimler" color={Colors.primary} />
        <MenuItem icon="shield-outline" label="Gizlilik" color={Colors.secondary} />
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
    </View>
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
