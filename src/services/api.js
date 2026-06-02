import { Platform } from 'react-native';

// Fiziksel cihazdan erişim için bilgisayarın local IP'si
const BASE_URL = 'http://192.168.1.7:8000';

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

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return mapAnalysisResponse(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Analiz zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Metin ile analiz
export async function analyzeText(ingredientsText, skinType, language = 'tr') {
  const response = await fetch(`${API_URL}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skin_type: mapSkinType(skinType),
      ingredients_text: ingredientsText,
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
