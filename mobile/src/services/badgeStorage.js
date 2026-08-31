import AsyncStorage from '@react-native-async-storage/async-storage';

const BADGES_KEY = 'earned_badges';
const STATS_KEY = 'user_stats';

const DEFAULT_STATS = {
  totalScans: 0,
  safeStreak: 0,         // arka arkaya güvenli ürün sayısı
  maxSafeStreak: 0,
  riskyFound: 0,         // riskli içerik bulunan ürün sayısı
  dailyStreak: 0,        // arka arkaya gün sayısı
  maxDailyStreak: 0,
  lastAnalysisDate: null, // son analiz tarihi (YYYY-MM-DD)
  detailViews: 0,        // içerik detayı görüntüleme
  manualEntries: 0,      // manuel giriş sayısı
};

// --- Stats ---

export async function getStats() {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
}

export async function updateStats(updates) {
  const stats = await getStats();
  const newStats = { ...stats, ...updates };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  return newStats;
}

/**
 * Analiz tamamlandıktan sonra çağrılır.
 * summary: { beneficial_count, caution_count, neutral_count, unknown_count }
 * source: 'scan' | 'manual'
 */
export async function recordAnalysis(summary, source = 'scan') {
  const stats = await getStats();

  // Toplam tarama
  stats.totalScans += 1;

  // Manuel giriş
  if (source === 'manual') {
    stats.manualEntries += 1;
  }

  // Güvenli ürün streak'i: caution ve unknown 0 ise güvenli say
  const isSafe = (summary.caution_count || 0) === 0 && (summary.unknown_count || 0) === 0;
  if (isSafe) {
    stats.safeStreak += 1;
    if (stats.safeStreak > stats.maxSafeStreak) {
      stats.maxSafeStreak = stats.safeStreak;
    }
  } else {
    stats.safeStreak = 0;
  }

  // Riskli içerik bulunan ürün
  if ((summary.caution_count || 0) > 0) {
    stats.riskyFound += 1;
  }

  // Günlük streak
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastAnalysisDate) {
    const lastDate = new Date(stats.lastAnalysisDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.dailyStreak += 1;
    } else if (diffDays > 1) {
      stats.dailyStreak = 1;
    }
    // diffDays === 0 ise aynı gün, streak değişmez
  } else {
    stats.dailyStreak = 1;
  }

  if (stats.dailyStreak > stats.maxDailyStreak) {
    stats.maxDailyStreak = stats.dailyStreak;
  }

  stats.lastAnalysisDate = today;

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export async function recordDetailView() {
  const stats = await getStats();
  stats.detailViews += 1;
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

// --- Badges ---

export async function getEarnedBadges() {
  const raw = await AsyncStorage.getItem(BADGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBadge(badgeId) {
  const earned = await getEarnedBadges();
  if (earned.some((b) => b.id === badgeId)) return earned;

  earned.push({
    id: badgeId,
    earnedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(earned));
  return earned;
}

export async function clearBadges() {
  await AsyncStorage.removeItem(BADGES_KEY);
  await AsyncStorage.removeItem(STATS_KEY);
}
