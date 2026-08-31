import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { getHistory, clearHistory, deleteHistoryItem } from '../services/historyStorage';

export const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
      // Ekrana her donuste secimi sifirla
      setCompareMode(false);
      setSelected([]);
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

  const toggleSelect = (item) => {
    if (selected.some((s) => s.id === item.id)) {
      setSelected(selected.filter((s) => s.id !== item.id));
    } else if (selected.length < 2) {
      setSelected([...selected, item]);
    }
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      navigation.navigate('Compare', { product1: selected[0], product2: selected[1] });
    }
  };

  const renderItem = ({ item }) => {
    const total = item.safeCount + item.mediumCount + item.unsafeCount;
    const hasUnsafe = item.unsafeCount > 0;
    const hasMedium = item.mediumCount > 0;
    const dotColor = hasUnsafe ? Colors.unsafe : hasMedium ? Colors.mediumRisk : Colors.safe;
    const isSelected = selected.some((s) => s.id === item.id);

    const onPress = compareMode
      ? () => toggleSelect(item)
      : () => navigation.navigate('AnalysisResult', { historyItem: item });

    const onLongPress = compareMode ? undefined : () => handleDelete(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, compareMode && isSelected && styles.cardSelected]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {compareMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
          </View>
        )}
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
        {!compareMode && <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        <View style={styles.headerActions}>
          {history.length >= 2 && (
            <TouchableOpacity
              onPress={() => {
                setCompareMode(!compareMode);
                setSelected([]);
              }}
              style={styles.headerButton}
            >
              <Ionicons
                name={compareMode ? 'close' : 'git-compare-outline'}
                size={18}
                color={compareMode ? Colors.unsafe : Colors.primary}
              />
              <Text style={[styles.headerButtonText, compareMode && { color: Colors.unsafe }]}>
                {compareMode ? 'Vazgeç' : 'Karşılaştır'}
              </Text>
            </TouchableOpacity>
          )}
          {!compareMode && history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {compareMode && (
        <View style={styles.compareHint}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.compareHintText}>
            Karşılaştırmak için 2 ürün seçin ({selected.length}/2)
          </Text>
        </View>
      )}

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

      {compareMode && selected.length === 2 && (
        <View style={styles.compareFooter}>
          <TouchableOpacity style={styles.compareButton} onPress={handleCompare} activeOpacity={0.8}>
            <Ionicons name="git-compare" size={20} color={Colors.white} />
            <Text style={styles.compareButtonText}>Karşılaştır</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  clearText: {
    ...Typography.body,
    color: Colors.unsafe,
    fontWeight: '600',
  },
  compareHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  compareHintText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
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
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  compareFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  compareButtonText: {
    ...Typography.subtitle,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
