import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

function analyzeProduct(item) {
  const total = item.safeCount + item.mediumCount + item.unsafeCount;
  const safePercent = total > 0 ? Math.round((item.safeCount / total) * 100) : 0;
  const riskyIngredients = (item.ingredients || []).filter(
    (i) => i.riskLevel === 'medium' || i.riskLevel === 'unsafe'
  );
  return { total, safePercent, riskyIngredients };
}

export const CompareScreen = ({ route, navigation }) => {
  const { product1, product2 } = route.params;
  const p1 = useMemo(() => analyzeProduct(product1), [product1]);
  const p2 = useMemo(() => analyzeProduct(product2), [product2]);

  // Ortak riskli icerikler
  const commonRisky = useMemo(() => {
    const p1Names = new Set(p1.riskyIngredients.map((i) => i.name.toLowerCase()));
    return p2.riskyIngredients.filter((i) => p1Names.has(i.name.toLowerCase()));
  }, [p1, p2]);

  // Sadece urune ozel riskli icerikler
  const onlyP1Risky = useMemo(() => {
    const p2Names = new Set(p2.riskyIngredients.map((i) => i.name.toLowerCase()));
    return p1.riskyIngredients.filter((i) => !p2Names.has(i.name.toLowerCase()));
  }, [p1, p2]);

  const onlyP2Risky = useMemo(() => {
    const p1Names = new Set(p1.riskyIngredients.map((i) => i.name.toLowerCase()));
    return p2.riskyIngredients.filter((i) => !p1Names.has(i.name.toLowerCase()));
  }, [p1, p2]);

  // Genel degerlendirme
  const winner =
    p1.safePercent > p2.safePercent ? 1 :
    p2.safePercent > p1.safePercent ? 2 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karşılaştırma</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Urun isimleri */}
        <View style={styles.namesRow}>
          <View style={[styles.nameCard, winner === 1 && styles.nameCardWinner]}>
            {winner === 1 && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={12} color="#EAB308" />
              </View>
            )}
            <Text style={styles.nameText} numberOfLines={2}>{product1.productName}</Text>
          </View>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.nameCard, winner === 2 && styles.nameCardWinner]}>
            {winner === 2 && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={12} color="#EAB308" />
              </View>
            )}
            <Text style={styles.nameText} numberOfLines={2}>{product2.productName}</Text>
          </View>
        </View>

        {/* Guvenli yuzdesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Güvenli İçerik Oranı</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={[styles.percentText, { color: getPercentColor(p1.safePercent) }]}>
                %{p1.safePercent}
              </Text>
              <View style={styles.percentBar}>
                <View style={[styles.percentFill, { width: `${p1.safePercent}%`, backgroundColor: getPercentColor(p1.safePercent) }]} />
              </View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareItem}>
              <Text style={[styles.percentText, { color: getPercentColor(p2.safePercent) }]}>
                %{p2.safePercent}
              </Text>
              <View style={styles.percentBar}>
                <View style={[styles.percentFill, { width: `${p2.safePercent}%`, backgroundColor: getPercentColor(p2.safePercent) }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Icerik sayilari */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İçerik Dağılımı</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <CountRow color={Colors.safe} count={product1.safeCount} label="Güvenli" />
              <CountRow color={Colors.mediumRisk} count={product1.mediumCount} label="Dikkat" />
              {product1.unsafeCount > 0 && (
                <CountRow color={Colors.unsafe} count={product1.unsafeCount} label="Riskli" />
              )}
              <Text style={styles.totalText}>{p1.total} içerik</Text>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareItem}>
              <CountRow color={Colors.safe} count={product2.safeCount} label="Güvenli" />
              <CountRow color={Colors.mediumRisk} count={product2.mediumCount} label="Dikkat" />
              {product2.unsafeCount > 0 && (
                <CountRow color={Colors.unsafe} count={product2.unsafeCount} label="Riskli" />
              )}
              <Text style={styles.totalText}>{p2.total} içerik</Text>
            </View>
          </View>
        </View>

        {/* Ortak riskli icerikler */}
        {commonRisky.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ortak Riskli İçerikler</Text>
            <View style={styles.riskyCard}>
              {commonRisky.map((item, i) => (
                <View key={i} style={styles.riskyItem}>
                  <Ionicons name="warning" size={16} color={Colors.mediumRisk} />
                  <Text style={styles.riskyName}>{item.name}</Text>
                </View>
              ))}
              <Text style={styles.riskyHint}>
                Her iki üründe de bulunan riskli içerikler
              </Text>
            </View>
          </View>
        )}

        {/* Sadece urun 1'de olan riskli */}
        {onlyP1Risky.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sadece "{shorten(product1.productName)}" içinde
            </Text>
            <View style={styles.riskyCard}>
              {onlyP1Risky.map((item, i) => (
                <View key={i} style={styles.riskyItem}>
                  <Ionicons name="alert-circle" size={16} color={Colors.unsafe} />
                  <Text style={styles.riskyName}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sadece urun 2'de olan riskli */}
        {onlyP2Risky.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sadece "{shorten(product2.productName)}" içinde
            </Text>
            <View style={styles.riskyCard}>
              {onlyP2Risky.map((item, i) => (
                <View key={i} style={styles.riskyItem}>
                  <Ionicons name="alert-circle" size={16} color={Colors.unsafe} />
                  <Text style={styles.riskyName}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sonuc */}
        <View style={styles.resultCard}>
          <Ionicons
            name={winner === 0 ? 'swap-horizontal' : 'trophy'}
            size={28}
            color={winner === 0 ? Colors.primary : '#EAB308'}
          />
          <Text style={styles.resultTitle}>
            {winner === 0
              ? 'Her iki ürün de benzer güvenlikte'
              : `"${shorten(winner === 1 ? product1.productName : product2.productName)}" daha uygun`}
          </Text>
          <Text style={styles.resultDesc}>
            {winner === 0
              ? 'İki ürünün de güvenli içerik oranı aynı.'
              : `%${Math.max(p1.safePercent, p2.safePercent)} güvenli içerik oranı ile cildinize daha uygun görünüyor.`}
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

function shorten(name) {
  return name && name.length > 20 ? name.slice(0, 20) + '...' : name || '';
}

function getPercentColor(pct) {
  if (pct >= 80) return Colors.safe;
  if (pct >= 50) return Colors.mediumRisk;
  return Colors.unsafe;
}

const CountRow = ({ color, count, label }) => (
  <View style={styles.countRow}>
    <View style={[styles.countDot, { backgroundColor: color }]} />
    <Text style={styles.countNum}>{count}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </View>
);

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

  // Urun isimleri
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  nameCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  nameCardWinner: {
    borderWidth: 2,
    borderColor: '#EAB308',
  },
  winnerBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 13,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  vsText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 10,
    fontSize: 14,
  },
  compareRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
  },
  compareItem: {
    flex: 1,
    alignItems: 'center',
  },
  compareDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },

  // Yuzde
  percentText: {
    ...Typography.h2,
    fontSize: 28,
    fontWeight: '700',
  },
  percentBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  percentFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Sayac
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  countNum: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    width: 24,
    fontSize: 15,
  },
  countLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  totalText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: 4,
  },

  // Riskli icerikler
  riskyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
  },
  riskyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  riskyName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  riskyHint: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Sonuc
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  resultTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  resultDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
