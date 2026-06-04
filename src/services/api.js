import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getBaseUrl() {
  // Expo debuggerHost'tan bilgisayarın IP'sini otomatik al
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000`;
  }

  // Fallback
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

const BASE_URL = getBaseUrl();
console.log('[API] Base URL:', BASE_URL);

const API_URL = `${BASE_URL}/api/v1`;

// Skin type mapping (mobil → backend)
const SKIN_TYPE_MAP = {
  Normal: 'normal',
  Dry: 'dry',
  Oily: 'oily',
  Combination: 'combination',
  Sensitive: 'sensitive',
};

function mapSkinType(skinType) {
  return SKIN_TYPE_MAP[skinType] || skinType?.toLowerCase() || 'normal';
}

// Backend response → mobil format dönüşümü
function mapIngredient(item, riskLevel) {
  return {
    name: item.name,
    category: item.category || 'Unknown',
    riskLevel,
    description: item.description || item.reason || '',
    whyRisk: riskLevel !== 'safe' ? item.reason : null,
    whyRiskDetails: null,
    position: item.position,
    positionWeight: item.position_weight,
    matchedAs: item.matched_as || null,
    note: item.note || null,
    source: item.source || null,
    skinSuitability: null,
    recommendation: item.reason && riskLevel === 'caution'
      ? item.reason
      : null,
  };
}

function mapAnalysisResponse(data) {
  const ingredients = [];

  (data.beneficial || []).forEach((item) => {
    ingredients.push(mapIngredient(item, 'safe'));
  });

  (data.neutral || []).forEach((item) => {
    ingredients.push(mapIngredient(item, 'safe'));
  });

  (data.caution || []).forEach((item) => {
    ingredients.push(mapIngredient(item, 'medium'));
  });

  (data.unknown || []).forEach((item) => {
    ingredients.push(mapIngredient(item, 'medium'));
  });

  // Pozisyona göre sırala
  ingredients.sort((a, b) => (a.position || 0) - (b.position || 0));

  return {
    skinType: data.skin_type,
    totalIngredients: data.total_ingredients,
    summary: data.summary,
    ingredients,
    disclaimer: data.disclaimer,
    productSummary: data.product_summary || null,
  };
}

// Görsel yükleyerek analiz (backend Tesseract + DeepSeek)
export async function analyzeImage(imageUri, skinType, language = 'tr') {
  const formData = new FormData();

  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });
  formData.append('skin_type', mapSkinType(skinType));
  formData.append('language', language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  const start = Date.now();

  console.log(`[API] analyzeImage → POST ${API_URL}/analyze`);

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[API] analyzeImage ← ${response.status} (${elapsed}s)`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(`[API] analyzeImage ERROR:`, error.detail || response.status);
      throw new Error(error.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] analyzeImage OK: ${data.total_ingredients} ingredients`);
    return mapAnalysisResponse(data);
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (error.name === 'AbortError') {
      console.log(`[API] analyzeImage TIMEOUT after ${elapsed}s`);
      throw new Error('Analiz zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    console.log(`[API] analyzeImage FAIL after ${elapsed}s:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Metin ile analiz
export async function analyzeText(ingredientsText, skinType, language = 'tr') {
  const start = Date.now();
  console.log(`[API] analyzeText → POST ${API_URL}/analyze-text`);

  const response = await fetch(`${API_URL}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skin_type: mapSkinType(skinType),
      ingredients_text: ingredientsText,
      language,
    }),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[API] analyzeText ← ${response.status} (${elapsed}s)`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.log(`[API] analyzeText ERROR:`, error.detail || response.status);
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[API] analyzeText OK: ${data.total_ingredients} ingredients`);
  return mapAnalysisResponse(data);
}

// Ham OCR metnini DeepSeek ile düzeltip analiz (kamera için)
export async function analyzeOcr(rawOcrText, skinType, language = 'tr') {
  const response = await fetch(`${API_URL}/analyze-ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skin_type: mapSkinType(skinType),
      raw_ocr_text: rawOcrText,
      language,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return mapAnalysisResponse(data);
}

// Ingredient arama
export async function searchIngredients(query, limit = 10) {
  const response = await fetch(
    `${API_URL}/ingredients?search=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

// Health check
export async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`, { timeout: 5000 });
    return response.ok;
  } catch {
    return false;
  }
}
