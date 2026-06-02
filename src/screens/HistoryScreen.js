import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { getHistory, clearHistory, deleteHistoryItem } from '../services/historyStorage';

export const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const handleClearAll = () => {
    Alert.alert('Geçmişi Temizle', 'Tüm analiz geçmişi silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Analizi Sil', 'Bu analiz geçmişten silinecek.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteHistoryItem(id);
          setHistory((prev) => prev.filter((item) => item.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const total = item.safeCount + item.mediumCount + item.unsafeCount;
    const hasUnsafe = item.unsafeCount > 0;
    const hasMedium = item.mediumCount > 0;
    const dotColor = hasUnsafe ? Colors.unsafe : hasMedium ? Colors.mediumRisk : Colors.safe;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('AnalysisResult', { historyItem: item })
        }
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={Colors.textLight} />
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={[styles.statDot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.statText}>{item.safeCount} güvenli</Text>
            </View>
            {item.mediumCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: Colors.mediumRisk }]} />
                <Text style={styles.statText}>{item.mediumCount} dikkat</Text>
              </View>
            )}
            {item.unsafeCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: Colors.unsafe }]} />
                <Text style={styles.statText}>{item.unsafeCount} riskli</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Henüz analiz geçmişi yok</Text>
            <Text style={styles.emptySubtext}>
              Ürün içeriklerini tarayarak veya girerek başlayın
            </Text>
          </View>
        }
      />
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
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  clearText: {
    ...Typography.body,
    color: Colors.unsafe,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  productName: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    ...Typography.caption,
    color: Colors.textLight,
    marginLeft: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
});
