import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { useAuth } from '../context/AuthContext';
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

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [recentHistory, setRecentHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((h) => setRecentHistory(h.slice(0, 3)));
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Merhaba, {user?.name || 'Kullanıcı'} 👋</Text>
        <Text style={styles.greetingSubtext}>Cilt bakım ürünlerini kontrol edelim</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün veya içerik ara"
          placeholderTextColor={Colors.textLight}
        />
      </View>

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
        <ActionCard
          title="Ürün Analizi"
          subtitle="Detaylı güvenlik raporu al"
          icon="analytics-outline"
          colors={['#A78BFA', '#7C3AED']}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: 10,
  },
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
