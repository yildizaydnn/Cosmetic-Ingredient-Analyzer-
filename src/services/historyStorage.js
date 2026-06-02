import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'analysis_history';
const MAX_HISTORY = 50;

export async function saveAnalysis({ productName, ingredients, summary, skinType, productSummary }) {
  const safeCount = (summary?.beneficial_count || 0) + (summary?.neutral_count || 0);
  const cautionCount = summary?.caution_count || 0;
  const unknownCount = summary?.unknown_count || 0;

  const entry = {
    id: Date.now().toString(),
    productName: productName || 'Adsız Ürün',
    date: new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    safeCount,
    mediumCount: cautionCount,
    unsafeCount: unknownCount,
    skinType,
    ingredients,
    summary,
    productSummary: productSummary || null,
  };

  const history = await getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return entry;
}

export async function getHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function deleteHistoryItem(id) {
  const history = await getHistory();
  const filtered = history.filter((item) => item.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function updateHistoryItem(id, updates) {
  const history = await getHistory();
  const index = history.findIndex((item) => item.id === id);
  if (index !== -1) {
    history[index] = { ...history[index], ...updates };
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}
