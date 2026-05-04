import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { mockHistory } from '../services/mockData';

export const HistoryScreen = ({ navigation }) => {
  const renderItem = ({ item }) => {
    const total = item.safeCount + item.mediumCount + item.unsafeCount;
    const hasUnsafe = item.unsafeCount > 0;
    const hasMedium = item.mediumCount > 0;
    const dotColor = hasUnsafe ? Colors.unsafe : hasMedium ? Colors.mediumRisk : Colors.safe;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('AnalysisResult', { ingredients: item.ingredients })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text style={styles.productName}>{item.productName}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={Colors.textLight} />
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={[styles.statDot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.statText}>{item.safeCount} safe</Text>
            </View>
            {item.mediumCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: Colors.mediumRisk }]} />
                <Text style={styles.statText}>{item.mediumCount} medium</Text>
              </View>
            )}
            {item.unsafeCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: Colors.unsafe }]} />
                <Text style={styles.statText}>{item.unsafeCount} unsafe</Text>
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
        <Text style={styles.title}>History</Text>
      </View>
      <FlatList
        data={mockHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No analysis history yet</Text>
            <Text style={styles.emptySubtext}>
              Start by scanning or entering product ingredients
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
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
